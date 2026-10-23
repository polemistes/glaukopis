// A small WebDriver client for driving the real application off-screen.
//
// The application runs under Xvfb (a virtual X display), so nothing appears on
// the desktop and no input reaches other windows. WebKitWebDriver, which ships
// with WebKitGTK, drives the webview from inside.
//
// Usage: see e2e/run.mjs.

import { spawn } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
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

/** A port that nothing listens on: two drivers that took the same would share one session. */
export function freePort() {
  return new Promise((done, fail) => {
    const server = createServer();
    server.on('error', fail);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => done(port));
    });
  });
}

/** A display that no X server has. */
function freeDisplay() {
  for (;;) {
    const n = 90 + Math.floor(Math.random() * 400);
    if (!existsSync(`/tmp/.X${n}-lock`) && !existsSync(`/tmp/.X11-unix/X${n}`)) return `:${n}`;
  }
}

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

/** Whether a process is there and not only waiting to be reaped. */
function alive(pid) {
  try {
    return !/\) Z /.test(readFileSync(`/proc/${pid}/stat`, 'utf8'));
  } catch {
    return false;
  }
}

export class App {
  /**
   * @param {{ binary?: string, dataDir?: string, width?: number, height?: number, env?: Record<string,string>, keepData?: boolean }} options
   */
  static async launch(options = {}) {
    const app = new App();
    // Another program than the one that was built here, as the one of a package: GLAUKOPIS_E2E_BINARY.
    app.binary =
      options.binary ??
      process.env.GLAUKOPIS_E2E_BINARY ??
      join(root, 'target', 'debug', 'glaukopis');
    if (!existsSync(app.binary))
      throw new Error(`No application at ${app.binary}. Build it first.`);
    app.ownsData = !options.dataDir && !options.keepData;
    app.dataDir = options.dataDir ?? mkdtempSync(join(tmpdir(), 'glaukopis-e2e-'));
    // The scripts were written when a new project opened on its text: so it
    // does for them, where the settings say nothing yet. `newProjectView:
    // null` leaves the settings as the application makes them.
    const settingsFile = join(app.dataDir, 'settings.json');
    const view = options.newProjectView === undefined ? 'text' : options.newProjectView;
    if (view && !existsSync(settingsFile))
      writeFileSync(settingsFile, JSON.stringify({ newProjectView: view }));
    const width = options.width ?? 1360;
    const height = options.height ?? 880;
    app.log = [];

    // A private X display.
    const display = freeDisplay();
    app.display = display;
    app.xvfb = spawn(
      'Xvfb',
      [display, '-screen', '0', `${width}x${height}x24`, '-nolisten', 'tcp'],
      {
        stdio: 'ignore',
      },
    );
    await sleep(500);

    const port = await freePort();
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
      // The hooks the scripts reach the page by, which a working window has not.
      GLAUKOPIS_E2E: '1',
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

    try {
      const created = await app.raw('POST', '/session', {
        capabilities: {
          alwaysMatch: {
            'webkitgtk:browserOptions': { binary: app.binary, args: [] },
          },
        },
      });
      app.session = created.sessionId;
      await app
        .raw('POST', `/session/${app.session}/window/rect`, { x: 0, y: 0, width, height })
        .catch(() => {});
      await app.waitFor('#app > *', 15000);
    } catch (error) {
      // What was started for it is not left behind.
      await app.close();
      throw error;
    }
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
      const error = new Error(
        `${method} ${path}: ${v.error ?? response.status} ${v.message ?? ''}`,
      );
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
        if (Date.now() - start > ms)
          throw new Error(`timed out waiting for ${selector} containing "${text}"`);
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
    // An element as a script in the page returns it.
    if (target && typeof target === 'object' && ELEMENT in target) return target[ELEMENT];
    return typeof target === 'string' && !/^[0-9a-f-]{20,}|^node-/.test(target)
      ? this.find(target)
      : target;
  }

  async click(target) {
    const id = await this.el(target);
    // An empty text in the text view takes no room until it is pressed: it
    // is pressed where a hand would press it, in the gap under the name,
    // halfway to what follows (the letters of a name reach a little under it).
    const gap = await this.exec(
      `const el = arguments[0];
       if (!el.matches?.('.body.closed')) return null;
       const section = el.closest('[data-section]');
       const h = section?.querySelector(':scope > .content > .heading')?.getBoundingClientRect();
       if (!h) return null;
       const next = section.nextElementSibling?.matches('[data-section]')
         ? section.nextElementSibling.getBoundingClientRect().top
         : h.bottom + 24;
       return { x: Math.round(h.left + 40), y: Math.round((h.bottom + next) / 2) };`,
      { [ELEMENT]: id },
    );
    if (gap) {
      await this.cmd('POST', '/actions', {
        actions: [
          {
            type: 'pointer',
            id: 'mouse',
            parameters: { pointerType: 'mouse' },
            actions: [
              { type: 'pointerMove', origin: 'viewport', x: gap.x, y: gap.y },
              { type: 'pointerDown', button: 0 },
              { type: 'pointerUp', button: 0 },
            ],
          },
        ],
      });
      await this.cmd('DELETE', '/actions');
      return;
    }
    // Where something stands over the middle of the element, as a bar that
    // stays at the top of what it scrolls, the element is brought to the
    // middle of what scrolls it first, as a hand would scroll before pressing.
    await this.exec(
      `const el = arguments[0];
       if (!el?.getBoundingClientRect) return;
       const r = el.getBoundingClientRect();
       const over = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
       if (!over || !(over === el || el.contains(over))) el.scrollIntoView({ block: 'center', inline: 'nearest' });`,
      { [ELEMENT]: id },
    );
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
      {
        type: 'pointerMove',
        origin: { [ELEMENT]: a },
        x: options.fromX ?? 0,
        y: options.fromY ?? 0,
      },
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
    const sources = [
      { type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: steps },
    ];
    // Keys held through the drag (`options.keys: ['Shift']`): pressed in the
    // first tick, let go a tick after the pointer is up.
    if (options.keys?.length) {
      steps.push({ type: 'pause', duration: 30 });
      const held = options.keys.map((k) => Key[k] ?? k);
      const keyActions = [
        ...held.map((k) => ({ type: 'keyDown', value: k })),
        ...Array.from({ length: Math.max(steps.length - held.length - held.length, 0) }, () => ({
          type: 'pause',
          duration: 0,
        })),
        ...held.map((k) => ({ type: 'keyUp', value: k })),
      ];
      sources.push({ type: 'key', id: 'keyboard', actions: keyActions });
    }
    await this.cmd('POST', '/actions', { actions: sources });
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

  /** To the start screen, where no project is open (record 0063): the project open is let go. */
  async home() {
    // A dialog over the view, such as the settings, is closed first, as Ctrl+1 used to close it.
    if (await this.exists('dialog[open]')) {
      await this.press('Escape');
      await this.waitGone('dialog[open]', 3000).catch(() => {});
    }
    await this.go('#/');
    await this.waitFor('[data-start]', 10000);
  }

  /** Begins a project from the start screen: Begin a project on the welcome, or New project. The dialog that asks its name is then open. */
  async beginProject() {
    if (!(await this.exists('[data-start]'))) await this.home();
    await this.waitFor('[data-start-new], [data-start] .welcome h2', 10000);
    if (await this.exists('[data-start-new]')) await this.click('[data-start-new]');
    else await this.clickText('[data-start] .welcome button', 'Begin a project');
    await this.waitFor('dialog input');
  }

  /** Opens the project of that name, as a click on it in the list does: at its top, where it was left. */
  async openProject(name, ms = 10000) {
    const id = await this.execAsync(
      `const name = arguments[0];
       const list = await window.__TAURI_INTERNALS__.invoke('project_list');
       return (list.find((p) => p.name === name) ?? list.find((p) => p.name.includes(name)))?.id ?? null;`,
      name,
    );
    if (!id) throw new Error(`no project named ${name}`);
    // From within a project, to the start screen first, so that the project is let go and opened anew.
    if ((await this.exec('return location.hash')).startsWith('#/project/')) {
      await this.home();
      await sleep(300);
    }
    await this.go(`#/project/${encodeURIComponent(id)}`);
    await this.waitFor('.project', ms);
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
  // ---- the path over a side (record 0063): the crumbs ----

  /** The path of the side that has the focus, else of the first, as a script finds it in the page: an expression. */
  get path() {
    return `(document.querySelector('.top .cell.active [data-path]') ?? document.querySelector('.top [data-path]'))`;
  }

  /** The name of the element in view, as the last crumb of the path says it. */
  async inView() {
    return this.exec(`return ${this.path}?.querySelector('[data-crumb-last] .name')?.textContent.trim() ?? null`);
  }

  /** Goes up from the element in view by the crumb of its parent; says whether there was one. */
  async up() {
    const crumb = await this.exec(`return ${this.path}?.querySelector('[data-up]') ?? null`);
    if (!crumb) return false;
    const was = await this.inView();
    await this.click(crumb);
    await this.waitUntil(`return ${this.path}?.querySelector('[data-crumb-last] .name')?.textContent.trim() !== ${JSON.stringify(was)}`, 5000, 'up');
    await sleep(150);
    return true;
  }

  /** The names of the elements beside the one in view, or under the project where it is in view. */
  async mapNames() {
    return this.exec(`return JSON.parse(${this.path}?.dataset.siblings ?? '[]')`);
  }

  /**
   * Enters the element of this name: by its row in the list, under the
   * project of the side, which shows the elements beside the way down to
   * the one in view; else by a crumb of the path.
   */
  async openMap(name) {
    const find = `const p = ${this.path}; const id = p?.dataset.project;
       const rows = Array.from(document.querySelectorAll('[data-projects-pane] .row.element')).filter((r) => r.dataset.row.startsWith('e:' + id + '/'));
       return rows.find((r) => r.querySelector('.name')?.textContent.trim() === arguments[0])
         ?? Array.from(p?.querySelectorAll('[data-crumb="element"]') ?? []).find((c) => c.querySelector('.name')?.textContent.trim() === arguments[0])
         ?? null;`;
    let target = await this.exec(find, name);
    if (!target && !(await this.exists('[data-projects-pane]'))) {
      await this.click('[data-projects-button]');
      await this.waitFor('[data-projects-pane] .row', 5000);
      await sleep(200);
      target = await this.exec(find, name);
    }
    if (!target) throw new Error(`no element named ${name} in the list or the path`);
    await this.click(target);
    await this.waitUntil(`return ${this.path}?.querySelector('[data-crumb-last] .name')?.textContent.trim() === ${JSON.stringify(name)}`, 5000, `${name} in view`).catch(() => {});
    await sleep(300);
  }

  // ---- a side's bar (record 0064): the views, the menus of kinds and marks, Insert ----

  /** The side that has the focus, else the only one, as a script finds it in the page: an expression. */
  get side() {
    return `(document.querySelector('.pane.focused') ?? document.querySelector('.pane'))`;
  }

  /** The bar of the side that has the focus: an expression. */
  get bar() {
    return `${this.side}?.querySelector('[data-bar]')`;
  }

  /** Shows the element in view of the side that has the focus as "diagram", "text" or "timeline", by the button in its bar. */
  async view(name) {
    const button = `${this.bar}?.querySelector('[data-view="${name}"]')`;
    await this.waitUntil(`return !!${button}`, 8000, `the button of the ${name} in the bar`);
    if (await this.exec(`return ${button}.getAttribute('aria-checked') === 'true'`)) return;
    await this.click(await this.exec(`return ${button}`));
    await this.waitUntil(`return ${button}?.getAttribute('aria-checked') === 'true'`, 5000, `the ${name} shown`);
  }

  /** Which view the side that has the focus shows, as its bar says: "diagram", "text" or "timeline". */
  async viewShown() {
    return this.exec(`return ${this.bar}?.querySelector('[role="radio"][aria-checked="true"]')?.dataset.view ?? null`);
  }

  /** Opens a menu of the bar of the side that has the focus, by its button (`data-insert`, `data-marks` …), and chooses in it. */
  async barMenu(button, item) {
    await this.click(await this.exec(`return ${this.bar}?.querySelector('[${button}]') ?? null`));
    await this.waitFor('.menu');
    await sleep(150);
    if (item) await this.clickText('.menu [role="menuitem"]', item);
  }

  /** Chooses in Insert: "Citation", "Note", "Comment", "Image", "Table…", "Inline number…" … */
  async insert(item) {
    await this.barMenu('data-insert', item);
  }

  /** Chooses in Marks: "Italic", "Bold", "Small capitals" … */
  async marks(item) {
    await this.barMenu('data-marks', item);
  }

  /** Chooses in Paragraph kind. */
  async paragraphKind(item) {
    await this.barMenu('data-paragraph-kind', item);
  }

  /** Chooses in Words kind. */
  async wordsKind(item) {
    await this.barMenu('data-words-kind', item);
  }

  /**
   * Opens the menu of the element in view, by a right click on its name in
   * the text, or on its node in the diagram, and chooses in it where told.
   */
  async thisElement(item) {
    const target = await this.exec(
      `const side = ${this.side};
       return side?.querySelector('.text-view .section.level-0 .heading') ?? side?.querySelector('.diagram .node.root') ?? null;`,
    );
    if (!target) throw new Error('no element in view to open the menu of');
    await this.rightClick(target);
    await this.waitFor('.menu');
    await sleep(150);
    if (item) await this.clickText('.menu [role="menuitem"]', item);
  }

  /** Opens the menu of the text where the cursor is, by a right click there, and chooses Number these lines…: the window of the numbers opens. */
  async numberTheseLines() {
    const at = await this.exec(
      `const s = getSelection();
       if (!s.rangeCount) return null;
       const range = s.getRangeAt(0);
       const r = range.getClientRects()[0] ?? range.getBoundingClientRect();
       const node = s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement;
       const p = node.closest('p')?.getBoundingClientRect();
       return r && r.height ? { x: Math.round(r.left), y: Math.round((r.top + r.bottom) / 2) } : p ? { x: Math.round(p.left + 4), y: Math.round(p.top + 6) } : null;`,
    );
    if (!at) throw new Error('no cursor in a text');
    await this.exec(
      `const x = arguments[0], y = arguments[1];
       const common = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, screenX: x, screenY: y, view: window };
       const send = (event) => document.elementFromPoint(x, y)?.dispatchEvent(event);
       send(new PointerEvent('pointerdown', { ...common, button: 2, buttons: 2, pointerType: 'mouse', isPrimary: true }));
       send(new MouseEvent('mousedown', { ...common, button: 2, buttons: 2 }));
       send(new MouseEvent('contextmenu', { ...common, button: 2, buttons: 2 }));
       send(new PointerEvent('pointerup', { ...common, button: 2, buttons: 0, pointerType: 'mouse', isPrimary: true }));
       send(new MouseEvent('mouseup', { ...common, button: 2, buttons: 0 }));`,
      at.x,
      at.y,
    );
    await this.waitFor('.menu', 3000);
    await sleep(150);
    await this.clickText('.menu [role="menuitem"]', 'Number these lines…');
  }

  /** Opens the window of the sharing of the project of the side that has the focus, by Share… in its menu in the list. */
  async shareWindow() {
    if (!(await this.exists('[data-projects-pane]'))) {
      await this.click('[data-projects-button]');
      await this.waitFor('[data-projects-pane] .row.project', 5000);
      await sleep(200);
    }
    const id = await this.exec(`return ${this.path}?.dataset.project ?? null`);
    const row = await this.exec(
      `return document.querySelector('[data-projects-pane] .row.project[data-row="p:' + arguments[0] + '"]') ?? document.querySelector('[data-projects-pane] .row.project[data-current]')`,
      id,
    );
    await this.rightClick(row);
    await this.waitFor('.menu');
    await sleep(150);
    await this.clickText('.menu [role="menuitem"]', 'Share…');
  }

  /** Closes the menu that is open by Escape, given to the menu where the text took the cursor from it. */
  async closeMenu() {
    if (!(await this.exists('.menu'))) return;
    await this.exec(`document.querySelector('.menu')?.focus()`);
    await this.press('Escape');
    await this.waitGone('.menu', 3000);
    await sleep(150);
  }

  /** Makes a new element under the one in view, from its menu, and leaves its name being written: the keys write it. */
  async newElementUnder() {
    await this.thisElement('Add an element under it');
    await sleep(300);
  }

  // ---- the panes beside the sides: the typesetting pane and the document pane (record 0064) ----

  /**
   * Presses the Typesetting button of the active side: in its bar where it
   * has one, else by its key. It opens the pane for that side, turns the pane
   * to it, or closes it. Says whether the pane is open after.
   */
  async typeset() {
    const button = await this.exec(
      `const side = document.querySelector('[data-side-key].focused') ?? document.querySelector('[data-side-key]');
       return side?.querySelector('[data-typeset]') ?? null;`,
    );
    if (button) await this.click(button);
    else await this.keys(['Control', 'p']);
    await sleep(400);
    return this.exists('.side.typesetting .preview');
  }

  /** The key of each tab of the document pane, which opens the pane at it. */
  static TAB_KEYS = { references: 'r', images: 'p', comments: 'm', found: 't', history: 'h', changes: 'e' };

  /** Opens the document pane at a tab ("references", "images", "comments", "found", "history", "changes"), where it is not shown. */
  async documentPane(tab = 'references') {
    const tabButton = `[data-document-pane] .side-tabs [data-kind="${tab}"]`;
    if (await this.exists(`${tabButton}[aria-selected="true"]`)) return;
    if (await this.exists(tabButton)) await this.click(tabButton);
    else await this.keys(['Control', 'Shift', App.TAB_KEYS[tab]]);
    await this.waitFor(`${tabButton}[aria-selected="true"]`, 5000);
    await sleep(200);
  }

  // ---- what you are writing: the Document type tab of Document properties ----

  /**
   * What the document of the element in view is, by the name of its
   * template: as the Document type tab marks it where that is open, else as
   * the Look column names it where that is open, else as the tab marks it,
   * opened for the asking and closed again.
   */
  async whatIs() {
    const chosen = `return document.querySelector('dialog[open] .chooser .template.chosen .name')?.textContent.trim() ?? null`;
    const open = await this.exec(chosen);
    if (open !== null) return open;
    const look = await this.exec(`return document.querySelector('.side .look .whole .type-line .name')?.textContent.trim() ?? null`);
    if (look !== null) return look;
    if (await this.exists('dialog[open]')) return '';
    await this.openChooser();
    await this.waitFor('dialog[open] .chooser .template.chosen', 5000).catch(() => {});
    const named = (await this.exec(chosen)) ?? '';
    await this.closeChooser();
    return named;
  }

  /** Opens Document properties for the element in view at its Document type tab, where that is not open. */
  async openChooser() {
    if (!(await this.exists('dialog[open] .chooser'))) {
      if (!(await this.exists('dialog[open] .window nav'))) await this.openAbout();
      await this.documentSection('Document type');
      await this.waitFor('dialog[open] .chooser .templates', 5000);
      await sleep(200);
    }
  }

  /** The entry of the chooser named so, as a script finds it in the page: an expression. */
  chooserEntry(name) {
    return `Array.from(document.querySelectorAll('dialog[open] .chooser .template')).find((e) => e.querySelector('.name')?.textContent.trim() === ${JSON.stringify(name)})`;
  }

  /**
   * Chooses what the document is, by the name the chooser gives it, in the
   * Document type tab of Document properties (the second step is opened
   * where it is in there), waits until it is the one chosen, and closes the
   * window unless told not to. Says whether the chooser offered it.
   */
  async chooseWhat(name, { close = true } = {}) {
    await this.openChooser();
    const found = await this.exec(
      `const e = ${this.chooserEntry(name)};
       if (!e) return false;
       const step = e.closest('details');
       if (step && !step.open) step.open = true;
       e.scrollIntoView({ block: 'center' });
       return true;`,
    );
    if (!found) return false;
    await sleep(150);
    await this.click(await this.exec(`return ${this.chooserEntry(name)}.querySelector('.choose')`));
    await this.waitUntil(
      `return document.querySelector('dialog[open] .chooser .template.chosen .name')?.textContent.trim() === ${JSON.stringify(name)}`,
      8000,
      'the Document type tab to mark what the document is',
    );
    if (close) await this.closeChooser();
    return true;
  }

  /** Closes Document properties from its Document type tab, which writes as it is chosen: its details are left as they were. */
  async closeChooser() {
    await this.clickText('dialog[open] footer button', 'Cancel');
    await this.waitGone('dialog[open] .chooser', 5000);
    await sleep(150);
  }

  // ---- Document properties: the details, the type, the language and the checklist of an element's document ----

  /** Opens Document properties for the element in view by Ctrl+Shift+D, at a part of the window named as it names it. */
  async openAbout(section) {
    await this.keys(['Control', 'Shift', 'd']);
    await this.waitForText('dialog[open] h2', 'Document properties', 5000);
    await sleep(200);
    if (section) await this.documentSection(section);
  }

  /** Turns to a part of Document properties: "Details", "Document type", "Language", "Checklist". */
  async documentSection(section) {
    await this.clickText('dialog[open] .window nav button', section);
    await this.waitForText('dialog[open] .window .settings h3', section, 3000);
    await sleep(150);
  }

  /**
   * Chooses in a chooser of Document properties, found by the words of its
   * label ("Layout", "Reference style", "Language of the text"), the value
   * given: written as it is chosen. Says whether the chooser offered it.
   */
  async documentChoose(label, value) {
    return this.exec(
      `const row = Array.from(document.querySelectorAll('dialog[open] .window label.row'))
         .find((r) => r.querySelector('.what')?.firstChild?.textContent.trim() === arguments[0]);
       const s = row?.querySelector('select');
       if (!s) throw new Error('no chooser labelled ' + arguments[0]);
       const offered = Array.from(s.options).some((o) => o.value === arguments[1]);
       if (!offered) {
         const o = document.createElement('option');
         o.value = arguments[1];
         o.textContent = arguments[1];
         s.append(o);
       }
       s.value = arguments[1];
       s.dispatchEvent(new Event('change', { bubbles: true }));
       return offered;`,
      label,
      value,
    );
  }

  /** What a chooser of Document properties holds, found as `documentChoose` finds it. */
  async documentChosen(label) {
    return this.exec(
      `const row = Array.from(document.querySelectorAll('dialog[open] .window label.row'))
         .find((r) => r.querySelector('.what')?.firstChild?.textContent.trim() === arguments[0]);
       return row?.querySelector('select')?.value ?? null;`,
      label,
    );
  }

  /** Closes Document properties: saved, which writes the details, or left. */
  async closeAbout(save = false) {
    await this.clickText('dialog[open] footer button', save ? 'Save' : 'Cancel');
    await this.waitGone('dialog[open] .window nav', 5000);
    await sleep(150);
  }

  // ---- the look of a document, the Look column of the typesetting pane (ADR 0042, 0064) ----

  /**
   * Opens the Look column of the typesetting pane by Ctrl+Shift+A, which
   * opens the pane for the active side where it is closed, and goes to a
   * part named as its chips name it.
   */
  async openLook(section) {
    if (!(await this.exists('.side .look'))) await this.keys(['Control', 'Shift', 'a']);
    await this.waitFor('.side .look', 5000);
    await this.waitFor('.side .look .chips, .side .look .finds', 15000);
    await sleep(200);
    if (section) await this.lookSection(section);
  }

  /**
   * Goes to a part of the look by its chip: "Page", "Type", "Paragraphs",
   * "Notes and citations", "The layout"… Every part is on the panel at once;
   * the rows are looked for in this part first after it (see `lookRow`).
   */
  async lookSection(section) {
    await this.exec(`const q = document.querySelector('.side .look .search input'); if (q.value) { q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); }`);
    await this.waitFor('.side .look .chips', 3000);
    await this.clickText('.side .look .chips button', section);
    this.lookPart = await this.exec(
      `return Array.from(document.querySelectorAll('.side .look .chips button')).find((b) => b.textContent.trim() === arguments[0])?.dataset.section ?? null`,
      section,
    );
    // Until the part stands at the top of the panel, under the chips; pressed
    // once more where the panel had not begun to move, as a hand would.
    const there = `const f = document.querySelector('.side .look .through');
       const p = f?.querySelector('.part[data-part="${this.lookPart}"]');
       if (!f || !p) return false;
       const d = p.getBoundingClientRect().top - f.getBoundingClientRect().top - f.querySelector('.chips').offsetHeight;
       return Math.abs(d) < 40 || f.scrollTop + f.clientHeight >= f.scrollHeight - 2;`;
    const arrived = await this.waitUntil(there, 4000, 'the part to be brought into view').then(() => true, () => false);
    if (!arrived) {
      await this.clickText('.side .look .chips button', section);
      await this.waitUntil(there, 6000, 'the part to be brought into view').catch(() => {});
    }
    await sleep(150);
  }

  /**
   * A row of the look, found by the words of its label, as a script finds it
   * in the page: an expression. In the part last gone to first, then
   * anywhere in the panel: the first rows, the parts and what is found.
   */
  lookRow(label) {
    const named = `(r) => r.querySelector('.what')?.firstChild?.textContent.trim() === ${JSON.stringify(label)}`;
    const scoped = this.lookPart
      ? `Array.from(document.querySelectorAll('.side .look .part[data-part="${this.lookPart}"] .row')).find(${named}) ?? `
      : '';
    return `(${scoped}Array.from(document.querySelectorAll('.side .look .row')).find(${named}))`;
  }

  /** Chooses in a chooser of the look, found by the words of its label, the value given. Says whether it was offered. */
  async lookChoose(label, value) {
    return this.exec(
      `const row = ${this.lookRow(label)};
       const s = row?.querySelector('select');
       if (!s) throw new Error('no chooser labelled ' + arguments[0]);
       const offered = Array.from(s.options).some((o) => o.value === arguments[1]);
       if (!offered) {
         const o = document.createElement('option');
         o.value = arguments[1];
         o.textContent = arguments[1];
         s.append(o);
       }
       s.value = arguments[1];
       s.dispatchEvent(new Event('change', { bubbles: true }));
       return offered;`,
      label,
      value,
    );
  }

  /** What a chooser of the look holds. */
  async lookChosen(label) {
    return this.exec(`return ${this.lookRow(label)}?.querySelector('select')?.value ?? null`);
  }

  /** Writes into the field of a row of the look, in place of what it holds, as typing does. */
  async lookWrite(label, value) {
    await this.exec(
      `const i = ${this.lookRow(label)}?.querySelector('input, textarea');
       if (!i) throw new Error('no field labelled ' + arguments[0]);
       if (i.type === 'checkbox') { if (i.checked !== arguments[1]) i.click(); return; }
       i.value = arguments[1];
       i.dispatchEvent(new Event('input', { bubbles: true }));
       i.dispatchEvent(new Event('change', { bubbles: true }));`,
      label,
      value,
    );
  }

  /** The top of the look: what the document is, and the layout in a line, "Layout: Manuscript · 2 changes". */
  async lookTop() {
    return this.exec(
      `const w = document.querySelector('.side .look .whole');
       return { what: w?.querySelector('.type-line .name')?.textContent.trim() ?? '',
                layout: w?.querySelector('.layout-line')?.textContent.replace(/\\s+/g, ' ').trim() ?? '',
                changes: Number(w?.querySelector('.layout-line')?.dataset.changes ?? 0) };`,
    );
  }

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

  /** The processes of the application the driver started: the driver's children. */
  appPids() {
    const pids = [];
    const pid = this.driver?.pid;
    if (!pid) return pids;
    try {
      for (const task of readdirSync(`/proc/${pid}/task`)) {
        const children = readFileSync(`/proc/${pid}/task/${task}/children`, 'utf8');
        pids.push(...children.split(' ').filter(Boolean).map(Number));
      }
    } catch {
      // The driver is gone.
    }
    return pids;
  }

  /**
   * Closes the window as the user does, through its close request, so that
   * what is done before it closes is done (the projects saved, the settings
   * written with the place and the window's size), waits until the
   * application has ended, and then ends the rest as `close` does. `close`
   * alone ends the driver, which takes the application with it without
   * asking the window.
   */
  async quit(ms = 30000) {
    const pids = this.appPids();
    await this.exec(
      `window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: 'main' }).catch(() => {}); return null;`,
    ).catch(() => {});
    const until = Date.now() + ms;
    let ended = false;
    while (Date.now() < until) {
      // Where its processes are not known, the page that no longer answers says it.
      const gone = pids.length
        ? !pids.some(alive)
        : await Promise.race([this.exec('return 1').then(() => false, () => true), sleep(1000).then(() => false)]);
      if (gone) {
        ended = true;
        break;
      }
      await sleep(150);
    }
    this.session = null;
    await this.close();
    if (!ended) throw new Error(`the application did not end within ${ms} ms of its window being closed`);
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
