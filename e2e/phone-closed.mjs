// A round of the synchronization with the phone's app closed (stage 3 of
// docs/plans/an-app-for-android.md, part C): the door of the shell
// (src-tauri/src/door.rs), as Android's WorkManager runs it, tried on a
// computer as `glaukopis --phone --round`, which makes one round of the
// phone's folder with no window and ends with 0 for done and 1 for to be
// tried again. With the real server, the application as a computer and the
// phone's role, each in a folder of the run, as e2e/phone-sync.mjs makes
// them.
//
// In a folder that is in no home, the round ends with 0 and the folder holds
// nothing new. The phone joins the computer's home, and both settle. The
// server is ended; a note is written on the phone (the hook `note`); the
// phone's role is ended. The round ends with 1: the server was not reached.
// The server is started again on the same folder and port: the round ends
// with 0, and the note is in the computer's notebook, with the phone's role
// never started; the log of the phone's folder says the round had no window.
// With the phone's role running, the round ends with 1 (the folder is the
// role's, in another process) and harms nothing: the role's page writes a
// note after it, which is on the computer. No errors in either page.
// Screenshots in e2e/output/phone-closed-<n>-<what>.png.

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
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
const hook = (app, call, ...args) =>
  app.execAsync(`return await window.__glaukopisPhone.${call}(...arguments);`, ...args);

async function lastSame(app) {
  const status = await invoke(app, 'sync_status');
  return status.last ? Date.parse(status.last) : 0;
}

async function settle(app, since, what) {
  await invoke(app, 'sync_now');
  await until(what, async () => (await lastSame(app)) > since, 30000);
}

const binaryOfApp = process.env.GLAUKOPIS_E2E_BINARY ?? join(root, 'target', 'debug', 'glaukopis');

/** `glaukopis --phone --round` in the folder: what it ended with. */
function round(dataDir) {
  const ran = spawnSync(binaryOfApp, ['--phone', '--round'], {
    env: { ...process.env, GLAUKOPIS_DATA_DIR: dataDir, GLAUKOPIS_LANGUAGE: 'en', GLAUKOPIS_LOG: 'info' },
    encoding: 'utf8',
    timeout: 120000,
  });
  return { code: ran.status, said: `${ran.stdout ?? ''}${ran.stderr ?? ''}` };
}

/** The names under a folder, with their folders, sorted. */
function namesUnder(dir) {
  const found = [];
  const walk = (at, prefix) => {
    if (!existsSync(at)) return;
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      found.push(prefix + entry.name);
      if (entry.isDirectory()) walk(join(at, entry.name), `${prefix}${entry.name}/`);
    }
  };
  walk(dir, '');
  return found.sort();
}

// ---- the server ----
const binary = join(root, 'target', 'debug', 'glaukopis-server');
if (!existsSync(binary)) throw new Error(`No server at ${binary}. Build it first: cargo build -p glaukopis-server`);
const serverData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-server-'));
const port = await freePort();
const address = `127.0.0.1:${port}`;
const serverLog = [];

function startServer() {
  const child = spawn(binary, ['--listen', address, '--data', serverData, '--password', 'sesame'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (d) => serverLog.push(String(d)));
  child.stdout.on('data', (d) => serverLog.push(String(d)));
  return child;
}

async function serverAnswers() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://${address}/api/info`)).ok) return;
    } catch {
      await sleep(100);
    }
  }
  throw new Error(`the server did not answer:\n${serverLog.join('')}`);
}

async function endServer() {
  const ended = new Promise((done) => server.once('exit', done));
  server.kill();
  await ended;
}

let server = startServer();
await serverAnswers();

const ROWS = '[data-notes] [role="option"]';
const titles = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('${ROWS} .title')).map((t) => t.textContent.trim())`);

/** The computer's notebook shown, so that its list says what came. */
async function deskNotebook(app) {
  if (await app.exists('[data-notebook]')) return;
  await app.click('[data-place="library"]');
  await app.waitFor('[data-top-row] [data-library-switch]', 8000);
  await app.clickText('[data-library-switch] [role="radio"]', 'Notebook');
  await app.waitFor('[data-notebook]', 8000);
}

const phoneData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-phone-'));
const nowhere = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-phone-nowhere-'));

let desk;
let phone;
try {
  // ---- 1. a folder in no home ----
  const before = namesUnder(nowhere);
  const alone = round(nowhere);
  check('in a folder that is in no home, the round ends with 0', alone.code === 0, `${alone.code}: ${alone.said.slice(-300)}`);
  check('and the folder holds nothing new', JSON.stringify(namesUnder(nowhere)) === JSON.stringify(before), namesUnder(nowhere).join(', '));

  // ---- 2. the phone joins the computer's home ----
  desk = await App.launch({ width: 1280, height: 860 });
  phone = await App.launch({ args: ['--phone'], dataDir: phoneData, keepData: true, width: 412, height: 915 });
  await desk.installErrorHook();
  await phone.installErrorHook();
  await phone.waitUntil(`return !!window.__glaukopisPhone`, 15000, 'the hooks of the page');
  await invoke(desk, 'sync_start', { server: address, name: 'Desk', password: 'sesame' });
  const { code } = await invoke(desk, 'sync_code');
  await invoke(phone, 'sync_join', { server: address, code, name: 'Phone' });
  await settle(desk, 0, 'the computer to settle');
  await settle(phone, 0, 'the phone to settle');
  check('the phone has joined the computer\'s home', (await invoke(phone, 'sync_status')).on);
  const phoneErrors = await phone.pageErrors();

  // ---- 3. the server ended, a note written, the role ended ----
  await endServer();
  await hook(phone, 'note', { name: 'Written with the server away', words: 'Sent when the app was closed.' });
  await sleep(1500);
  await phone.screenshot('phone-closed-1-written');
  await phone.close();
  phone = null;
  const away = round(phoneData);
  check('with the server away, the round ends with 1: to be tried again', away.code === 1, `${away.code}: ${away.said.slice(-300)}`);

  // ---- 4. the server back: the round sends the note, with no window ----
  server = startServer();
  await serverAnswers();
  const back = round(phoneData);
  check('with the server back, the round ends with 0', back.code === 0, `${back.code}: ${back.said.slice(-300)}`);
  check('the round said in its log that it had no window', /a round of the synchronization with no window/.test(back.said), back.said.slice(-400));
  await deskNotebook(desk);
  await until('the note of the phone on the computer', async () => {
    await invoke(desk, 'sync_now');
    return (await titles(desk)).includes('Written with the server away');
  }, 45000).catch(() => null);
  check('the note written before the role ended is on the computer, the role never started again', (await titles(desk)).includes('Written with the server away'), (await titles(desk)).join(' | '));
  await desk.screenshot('phone-closed-2-on-the-computer');

  // ---- 5. a round while the role runs ----
  phone = await App.launch({ args: ['--phone'], dataDir: phoneData, keepData: true, width: 412, height: 915 });
  await phone.installErrorHook();
  await phone.waitUntil(`return !!window.__glaukopisPhone`, 15000, 'the hooks of the page');
  const beside = round(phoneData);
  check('with the role running, the round ends with 1: the folder is the role\'s', beside.code === 1, `${beside.code}: ${beside.said.slice(-300)}`);
  await hook(phone, 'note', { name: 'Written after a round beside', words: 'The role went on.' });
  await sleep(1000);
  await invoke(phone, 'sync_now');
  await until('the second note on the computer', async () => {
    await invoke(desk, 'sync_now');
    return (await titles(desk)).includes('Written after a round beside');
  }, 45000).catch(() => null);
  check('and it harmed nothing: a note the role writes after it is on the computer', (await titles(desk)).includes('Written after a round beside'), (await titles(desk)).join(' | '));
  await desk.screenshot('phone-closed-3-after-a-round-beside');

  const deskErrors = await desk.pageErrors();
  const laterErrors = await phone.pageErrors();
  check('no errors in the pages of the phone', phoneErrors.length === 0 && laterErrors.length === 0, [...phoneErrors, ...laterErrors].join(' | '));
  check('no errors in the computer\'s page', deskErrors.length === 0, deskErrors.join(' | '));
} catch (error) {
  check('the script ran to its end', false, error.stack ?? String(error));
} finally {
  await phone?.close().catch(() => {});
  await desk?.close().catch(() => {});
  server.kill();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
