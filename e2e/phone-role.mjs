// The phone's role on a computer (stage 1 of docs/plans/an-app-for-android.md):
// `glaukopis --phone`, beside the application as a computer of the same
// writer and the real server. The role starts with one window, labelled
// `phone`, as narrow as a phone, showing the page of a note; a command of
// the projects is not the phone's and one of the synchronization is. A note
// written and sent: the window stays, the field is emptied and says the note
// is sent, and the note lies in the phone's inbox. The computer starts a
// home holding a project, a reference, a picture of the library and a
// setting changed, and makes a code; the phone joins by the command and
// makes rounds until everything is the same. Then the phone's folder says
// that it takes the notes, holds the reference, and holds no project, not
// the setting and no file of the library. No errors in either page.
// Screenshots in e2e/output/phone-role-<n>-<what>.png.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, freePort, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 15000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(250);
  }
}

const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);

/** What a command answers, or the words of its refusal. */
const tryInvoke = (app, command, args = {}) =>
  app.execAsync(
    `try { return { ok: await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]) }; } catch (e) { return { refused: String(e?.message ?? e) }; }`,
    command,
    args,
  );

const lastSame = async (app) => {
  const status = await invoke(app, 'sync_status');
  return status.last ? Date.parse(status.last) : 0;
};

/** Rounds at once on the device until everything was the same after `since`. */
async function settle(app, since, what) {
  await invoke(app, 'sync_now');
  await until(what, async () => (await lastSame(app)) > since, 30000);
}

// A picture of one dot, as the library takes one in.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// ---- the server ----
const binary = join(root, 'target', 'debug', 'glaukopis-server');
if (!existsSync(binary)) throw new Error(`No server at ${binary}. Build it first: cargo build -p glaukopis-server`);
const serverData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-server-'));
const port = await freePort();
const address = `127.0.0.1:${port}`;
const serverLog = [];
const server = spawn(binary, ['--listen', address, '--data', serverData, '--password', 'sesame'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stderr.on('data', (d) => serverLog.push(String(d)));
server.stdout.on('data', (d) => serverLog.push(String(d)));
for (let i = 0; ; i++) {
  try {
    if ((await fetch(`http://${address}/api/info`)).ok) break;
  } catch {
    if (i > 60) throw new Error(`the server did not answer:\n${serverLog.join('')}`);
    await sleep(100);
  }
}

let desk;
let phone;
try {
  desk = await App.launch({ width: 1280, height: 860 });
  phone = await App.launch({ args: ['--phone'], width: 412, height: 915 });
  await desk.installErrorHook();
  await phone.installErrorHook();

  // ---- 1. the role starts ----
  await phone.waitFor('[data-note-window-field] .ProseMirror', 15000);
  const shown = await phone.execAsync(
    `const w = window.__TAURI_INTERNALS__.metadata.currentWindow.label; return { label: w, width: window.innerWidth };`,
  );
  check('the phone has one window, labelled phone', shown.label === 'phone', shown.label);
  check('the window is as narrow as a phone', shown.width <= 420, String(shown.width));
  check('it shows the page of a note', await phone.exists('[data-note-window-send]'));
  await phone.screenshot('phone-role-1-started');

  // ---- 2. its commands ----
  const projects = await tryInvoke(phone, 'project_list');
  check('a command of the projects is not the phone\'s', !!projects.refused, projects.refused ?? 'answered');
  const status = await tryInvoke(phone, 'sync_status');
  check('a command of the synchronization is, and says off', status.ok?.state === 'off', JSON.stringify(status));

  // ---- 3. a note written and sent ----
  await phone.click('[data-note-window-field] .ProseMirror');
  await phone.keys('Seen on the way home');
  await sleep(700);
  await phone.click('[data-note-window-send]');
  await phone.waitFor('[data-note-window-told]', 5000).catch(() => {});
  check('the window stays and says the note is sent', await phone.exists('[data-note-window-told]'));
  check('the field is empty again', (await phone.exec(`return document.querySelector('[data-note-window-field] .ProseMirror').textContent`)) === '');
  const inbox = join(phone.dataDir, 'notebook', 'inbox');
  const inInbox = existsSync(inbox) ? readdirSync(inbox).filter((n) => !n.startsWith('.')) : [];
  check('the note lies in the phone\'s inbox', inInbox.length === 1, inInbox.join(', '));
  await phone.screenshot('phone-role-2-sent');

  // ---- 4. a home, and the phone in it ----
  await invoke(desk, 'project_create', { name: 'A book', id: null, folder: null });
  await invoke(desk, 'library_add', {
    draft: { key: 'Ibsen1879', type: 'book', fields: { title: 'Et dukkehjem', year: '1879' }, names: {} },
  });
  await invoke(desk, 'files_add_image', { name: 'dot.png', content: PNG, folder: null });
  await invoke(desk, 'settings_set', { changed: { theme: 'dark' } });
  await invoke(desk, 'sync_start', { server: address, name: 'Desk', password: 'sesame' });
  await settle(desk, 0, 'the computer to have made its first round');
  const { code } = await invoke(desk, 'sync_code');
  await invoke(phone, 'sync_join', { server: address, code, name: 'Phone' });
  await settle(phone, 0, 'the phone to have made its first round');
  await settle(phone, await lastSame(phone), 'a second round of the phone');

  // ---- 5. what the phone holds ----
  const kept = JSON.parse(readFileSync(join(phone.dataDir, 'sync', 'sync.json'), 'utf8'));
  check('the phone\'s folder says it takes the notes', kept.takes === 'notes', JSON.stringify(kept.takes));
  const bib = existsSync(join(phone.dataDir, 'library', 'library.bib'))
    ? readFileSync(join(phone.dataDir, 'library', 'library.bib'), 'utf8')
    : '';
  check('the phone holds the reference', bib.includes('Ibsen1879'));
  const projectsHere = existsSync(join(phone.dataDir, 'projects'))
    ? readdirSync(join(phone.dataDir, 'projects')).filter((n) => !n.startsWith('.') && !n.endsWith('.json'))
    : [];
  check('the phone holds no project', projectsHere.length === 0, projectsHere.join(', '));
  const settings = JSON.parse(readFileSync(join(phone.dataDir, 'settings.json'), 'utf8'));
  check('the phone has not the computer\'s setting', settings.theme !== 'dark', String(settings.theme));
  const store = join(phone.dataDir, 'library', 'attachments');
  const filesHere = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(dir, entry.name));
      else if (!entry.name.startsWith('.')) filesHere.push(entry.name);
    }
  };
  walk(store);
  check('the phone holds no file of the library', filesHere.length === 0, filesHere.join(', '));
  console.log(`      the phone's notebook folder: ${readdirSync(join(phone.dataDir, 'notebook')).join(', ')}`);

  // ---- 6. no errors ----
  const deskErrors = await desk.pageErrors();
  const phoneErrors = await phone.pageErrors();
  check('no errors in the computer\'s page', deskErrors.length === 0, deskErrors.join(' | '));
  check('no errors in the phone\'s page', phoneErrors.length === 0, phoneErrors.join(' | '));
  await phone.screenshot('phone-role-3-joined');
} catch (error) {
  check('the script ran to its end', false, error.stack ?? String(error));
} finally {
  await phone?.close().catch(() => {});
  await desk?.close().catch(() => {});
  server.kill();
  rmSync(serverData, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
