// A small WebDriver client for driving the real application off-screen.
//
// The application runs under Xvfb (a virtual X display), so nothing appears on
// the desktop and no input reaches other windows. WebKitWebDriver, which ships
// with WebKitGTK, drives the webview from inside.
//
// Usage: see e2e/run.mjs.

import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const here = dirname(fileURLToPath(import.meta.url));
export const root = resolve(here, '..');
export const outputDir = join(here, 'output');

const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf';

export const Key = {
  Enter: '',
  Tab: '',
  Escape: '',
  Backspace: '',
  Delete: '',
  ArrowLeft: '',
  ArrowUp: '',
  ArrowRight: '',
  ArrowDown: '',
  Home: '',
  End: '',
  Control: '',
  Shift: '',
  Alt: '',
  F2: '',
  F10: '\uE03A',
  Space: ' ',
};

function waitForLine(child, pattern, ms, what) {
  return new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => reject(new Error(`${what} did not start within ${ms} ms`)), ms);
    const onData = (chunk) => {
      if (pattern.test(String(chunk))) {
        clearTimeout(timer);
        resolvePromise();
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`${what} exited with ${code}`));
    });
  });
}

export class App {
  /**
   * @param {{ binary?: string, dataDir?: string, width?: number, height?: number, env?: Record<string,string>, keepData?: boolean }} options
   */
  static async launch(options = {}) {
    const app = new App();
    // Another program than the one that was built here, as the one of a package: GLAUKOPIS_E2E_BINARY.
    app.binary =
      options.binary ?? process.env.GLAUKOPIS_E2E_BINARY ?? join(root, 'target', 'debug', 'glaukopis');
    if (!existsSync(app.binary)) throw new Error(`No application at ${app.binary}. Build it first.`);
    app.ownsData = !options.dataDir && !options.keepData;
    app.dataDir = options.dataDir ?? mkdtempSync(join(tmpdir(), 'glaukopis-e2e-'));
    const width = options.width ?? 1360;
    const height = options.height ?? 880;
    app.log = [];

    // A private X display.
    const display = `:${90 + Math.floor(Math.random() * 400)}`;
    app.display = display;
    app.xvfb = spawn('Xvfb', [display, '-screen', '0', `${width}x${height}x24`, '-nolisten', 'tcp'], {
      stdio: 'ignore',
    });
    await sleep(500);

    const port = 4700 + Math.floor(Math.random() * 200);
    const env = {
      ...process.env,
      DISPLAY: display,
      GDK_BACKEND: 'x11',
      WAYLAND_DISPLAY: '',
      TAURI_WEBVIEW_AUTOMATION: 'true',
      TAURI_AUTOMATION: 'true',
      WEBKIT_DISABLE_DMABUF_RENDERER: '1',
      WEBKIT_DISABLE_COMPOSITING_MODE: '1',
      LIBGL_ALWAYS_SOFTWARE: '1',
      GLAUKOPIS_DATA_DIR: app.dataDir,
      GLAUKOPIS_LOG: process.env.GLAUKOPIS_LOG ?? 'info',
      // The scripts find what they press by its English words, whatever the
      // language of the computer they run on; a script may ask for another.
      GLAUKOPIS_LANGUAGE: 'en',
      NO_AT_BRIDGE: '1',
      ...options.env,
    };
    app.driver = spawn('WebKitWebDriver', [`--port=${port}`, '--host=127.0.0.1'], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    app.driver.stderr.on('data', (d) => app.log.push(String(d)));
    app.driver.stdout.on('data', (d) => app.log.push(String(d)));
    app.base = `http://127.0.0.1:${port}`;

    // Wait for the driver to answer.
    for (let i = 0; i < 50; i++) {
      try {
        const r = await fetch(`${app.base}/status`);
        if (r.ok) break;
      } catch {
        await sleep(100);
      }
    }

    const created = await app.raw('POST', '/session', {
      capabilities: {
        alwaysMatch: {
          'webkitgtk:browserOptions': { binary: app.binary, args: [] },
        },
      },
    });
    app.session = created.sessionId;
    await app.raw('POST', `/session/${app.session}/window/rect`, { x: 0, y: 0, width, height }).catch(() => {});
    await app.waitFor('#app > *', 15000);
    return app;
  }

  async raw(method, path, body) {
    const response = await fetch(this.base + path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.value?.error) {
      const v = json.value ?? {};
      const error = new Error(`${method} ${path}: ${v.error ?? response.status} ${v.message ?? ''}`);
      error.webdriver = v.error;
      throw error;
    }
    return json.value;
  }

  cmd(method, path, body) {
    return this.raw(method, `/session/${this.session}${path}`, body);
  }

  /** Runs JavaScript in the page. The script may `return` a value. */
  exec(script, ...args) {
    return this.cmd('POST', '/execute/sync', { script, args });
  }

  /** Runs an async function body in the page; `await` is allowed, `return` gives the result. */
  /**
   * A project as it is on disk, with its state and changes in base64, as a
   * script can carry them: `project_load` gives bytes (see `api/projects.ts`).
   */
  async projectLoad(id) {
    return this.execAsync(
      `const bytes = new Uint8Array(await window.__TAURI_INTERNALS__.invoke('project_load', { id: arguments[0] }));
       const view = new DataView(bytes.buffer);
       let at = 0;
       const number = () => { const n = view.getUint32(at, true); at += 4; return n; };
       const part = () => { const n = number(); at += n; return bytes.subarray(at - n, at); };
       const base64 = (b) => { let s = ''; for (const c of b) s += String.fromCharCode(c); return btoa(s); };
       const info = JSON.parse(new TextDecoder().decode(part()));
       const state = part();
       const updates = Array.from({ length: number() }, part).map(base64);
       return { info, state: state.length ? base64(state) : null, updates };`,
      id,
    );
  }

  /** Adds a change, given in base64, to the log of a project, as the application does. */
  async projectAppend(id, update64) {
    return this.execAsync(
      `const update = Uint8Array.from(atob(arguments[1]), (c) => c.charCodeAt(0));
       const head = new TextEncoder().encode(JSON.stringify({ id: arguments[0], here: true, time: null }));
       const body = new Uint8Array(4 + head.length + update.length);
       new DataView(body.buffer).setUint32(0, head.length, true);
       body.set(head, 4);
       body.set(update, 4 + head.length);
       return await window.__TAURI_INTERNALS__.invoke('project_append', body);`,
      id,
      update64,
    );
  }

  async execAsync(body, ...args) {
    const script = `
      const done = arguments[arguments.length - 1];
      const args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
      (async function() { ${body} }).apply(null, args).then(
        (value) => done({ ok: true, value }),
        (error) => done({ ok: false, error: (error && (error.message || JSON.stringify(error))) || String(error) }),
      );`;
    const result = await this.cmd('POST', '/execute/async', { script, args });
    if (!result.ok) throw new Error(`in page: ${result.error}`);
    return result.value;
  }

  async find(selector) {
    const value = await this.cmd('POST', '/element', { using: 'css selector', value: selector });
    return value[ELEMENT];
  }

  async findAll(selector) {
    const value = await this.cmd('POST', '/elements', { using: 'css selector', value: selector });
    return value.map((v) => v[ELEMENT]);
  }

  /** Finds the first element matching `selector` whose text contains `text`. */
  async findByText(selector, text) {
    const value = await this.exec(
      `const t = arguments[1];
       return Array.from(document.querySelectorAll(arguments[0]))
         .find((e) => (e.textContent || '').replace(/\\s+/g, ' ').trim().includes(t)) || null;`,
      selector,
      text,
    );
    if (!value) throw new Error(`no ${selector} containing "${text}"`);
    return value[ELEMENT];
  }

  async exists(selector) {
    return (await this.findAll(selector)).length > 0;
  }

  async count(selector) {
    return (await this.findAll(selector)).length;
  }

  async waitFor(selector, ms = 5000) {
    const start = Date.now();
    for (;;) {
      const found = await this.findAll(selector).catch(() => []);
      if (found.length) return found[0];
      if (Date.now() - start > ms) throw new Error(`timed out waiting for ${selector}`);
      await sleep(80);
    }
  }

  async waitForText(selector, text, ms = 5000) {
    const start = Date.now();
    for (;;) {
      try {
        return await this.findByText(selector, text);
      } catch (e) {
        if (Date.now() - start > ms) throw new Error(`timed out waiting for ${selector} containing "${text}"`);
        await sleep(80);
      }
    }
  }

  async waitGone(selector, ms = 5000) {
    const start = Date.now();
    while ((await this.findAll(selector)).length) {
      if (Date.now() - start > ms) throw new Error(`timed out waiting for ${selector} to go`);
      await sleep(80);
    }
  }

  async waitUntil(script, ms = 5000, what = 'condition') {
    const start = Date.now();
    for (;;) {
      if (await this.exec(script)) return;
      if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
      await sleep(80);
    }
  }

  async el(target) {
    return typeof target === 'string' && !/^[0-9a-f-]{20,}|^node-/.test(target) ? this.find(target) : target;
  }

  async click(target) {
    const id = await this.el(target);
    await this.cmd('POST', `/element/${id}/click`, {});
  }

  async clickText(selector, text) {
    await this.click(await this.waitForText(selector, text));
  }

  async doubleClick(target) {
    const id = await this.el(target);
    await this.cmd('POST', '/actions', {
      actions: [
        {
          type: 'pointer',
          id: 'mouse',
          parameters: { pointerType: 'mouse' },
          actions: [
            { type: 'pointerMove', origin: { [ELEMENT]: id }, x: 0, y: 0 },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerUp', button: 0 },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ],
    });
    await this.cmd('DELETE', '/actions');
  }

  /**
   * Right-clicks the middle of an element. The events are those the page
   * sees of a right-click, sent in the page: a right-click sent as an action
   * of WebDriver leaves the keyboard of WebKitWebDriver without Shift and
   * without the letters that are not on an American keyboard ("Aø: B" is
   * typed "a; b" ever after).
   */
  async rightClick(target) {
    const id = await this.el(target);
    await this.exec(
      `const box = arguments[0].getBoundingClientRect();
       const x = box.left + box.width / 2, y = box.top + box.height / 2;
       const common = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, screenX: x, screenY: y, view: window };
       // Each goes to what is under the pointer then, as the events of a real
       // click do: what is pressed may be replaced by another (text drawn
       // without an editor is given one). The menu comes when the button is
       // pressed, as with GTK.
       const send = (event) => (document.elementFromPoint(x, y) ?? arguments[0]).dispatchEvent(event);
       send(new PointerEvent('pointerdown', { ...common, button: 2, buttons: 2, pointerType: 'mouse', isPrimary: true }));
       send(new MouseEvent('mousedown', { ...common, button: 2, buttons: 2 }));
       send(new MouseEvent('contextmenu', { ...common, button: 2, buttons: 2 }));
       send(new PointerEvent('pointerup', { ...common, button: 2, buttons: 0, pointerType: 'mouse', isPrimary: true }));
       send(new MouseEvent('mouseup', { ...common, button: 2, buttons: 0 }));`,
      { [ELEMENT]: id },
    );
  }

  async hover(target, dx = 0, dy = 0) {
    const id = await this.el(target);
    await this.cmd('POST', '/actions', {
      actions: [
        {
          type: 'pointer',
          id: 'mouse',
          parameters: { pointerType: 'mouse' },
          actions: [{ type: 'pointerMove', origin: { [ELEMENT]: id }, x: dx, y: dy, duration: 50 }],
        },
      ],
    });
  }

  /** Drags from the middle of one element by an offset, or to another element. */
  async drag(from, to, options = {}) {
    const a = await this.el(from);
    const steps = [
      { type: 'pointerMove', origin: { [ELEMENT]: a }, x: options.fromX ?? 0, y: options.fromY ?? 0 },
      { type: 'pointerDown', button: 0 },
      { type: 'pause', duration: 60 },
    ];
    if (typeof to === 'object' && to !== null && 'dx' in to) {
      const n = 6;
      for (let i = 1; i <= n; i++) {
        steps.push({
          type: 'pointerMove',
          origin: 'pointer',
          x: Math.round(to.dx / n),
          y: Math.round(to.dy / n),
          duration: 30,
        });
      }
    } else {
      const b = await this.el(to);
      steps.push({ type: 'pointerMove', origin: { [ELEMENT]: b }, x: 3, y: 3, duration: 120 });
      steps.push({ type: 'pointerMove', origin: { [ELEMENT]: b }, x: 0, y: 0, duration: 60 });
    }
    steps.push({ type: 'pause', duration: 60 }, { type: 'pointerUp', button: 0 });
    await this.cmd('POST', '/actions', {
      actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: steps }],
    });
    await this.cmd('DELETE', '/actions');
  }

  /** Types into an element (focusing it). */
  async type(target, text) {
    const id = await this.el(target);
    await this.cmd('POST', `/element/${id}/value`, { text });
  }

  /** Sends keys to whatever has the focus. `chord` presses keys together: keys(['Control', 'z']). */
  async keys(input) {
    const actions = [];
    if (Array.isArray(input)) {
      const mapped = input.map((k) => Key[k] ?? k);
      for (const k of mapped) actions.push({ type: 'keyDown', value: k });
      for (const k of mapped.reverse()) actions.push({ type: 'keyUp', value: k });
    } else {
      for (const ch of Array.from(input)) {
        actions.push({ type: 'keyDown', value: ch }, { type: 'keyUp', value: ch });
      }
    }
    await this.cmd('POST', '/actions', { actions: [{ type: 'key', id: 'keyboard', actions }] });
    await this.cmd('DELETE', '/actions');
  }

  async press(name) {
    await this.keys([name]);
  }

  async text(target) {
    const id = await this.el(target);
    return this.cmd('GET', `/element/${id}/text`);
  }

  async attr(target, name) {
    const id = await this.el(target);
    return this.cmd('GET', `/element/${id}/attribute/${name}`);
  }

  async go(hash) {
    await this.exec(`location.hash = arguments[0];`, hash);
    await sleep(150);
  }

  async setTheme(theme) {
    await this.exec(`document.documentElement.dataset.theme = arguments[0];`, theme);
  }

  async screenshot(name) {
    mkdirSync(outputDir, { recursive: true });
    const data = await this.cmd('GET', '/screenshot');
    const path = join(outputDir, name.endsWith('.png') ? name : `${name}.png`);
    writeFileSync(path, Buffer.from(data, 'base64'));
    return path;
  }

  /** Messages the page wrote to the console as errors, collected by a hook installed at launch. */
  /** Each different message once, with how often it came. */
  async pageErrors() {
    const all = await this.exec(`return (window.__glaukopisErrors || []).slice();`);
    const counts = new Map();
    for (const m of all) counts.set(m, (counts.get(m) ?? 0) + 1);
    return [...counts].map(([m, n]) => (n > 1 ? `${m} (×${n})` : m));
  }

  async installErrorHook() {
    await this.exec(`
      if (!window.__glaukopisErrors) {
        window.__glaukopisErrors = [];
        const push = (m) => window.__glaukopisErrors.push(String(m).slice(0, 600));
        window.addEventListener('error', (e) => push('error: ' + e.message + ' @' + e.filename + ':' + e.lineno));
        window.addEventListener('unhandledrejection', (e) =>
          push('rejection: ' + ((e.reason && (e.reason.message || JSON.stringify(e.reason))) || e.reason)));
        const original = console.error;
        console.error = function (...a) {
          push('console.error: ' + a.map((x) => (x && x.message) || (typeof x === 'object' ? JSON.stringify(x) : String(x))).join(' '));
          original.apply(console, a);
        };
      }`);
  }

  async close() {
    try {
      if (this.session) await this.raw('DELETE', `/session/${this.session}`);
    } catch {}
    this.driver?.kill('SIGTERM');
    this.xvfb?.kill('SIGTERM');
    await sleep(200);
    if (this.ownsData && this.dataDir && !process.env.GLAUKOPIS_E2E_KEEP) {
      rmSync(this.dataDir, { recursive: true, force: true });
    }
  }
}

export { sleep };
