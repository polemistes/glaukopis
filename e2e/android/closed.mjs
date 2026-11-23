// A round of the synchronization with the app closed, on the emulator
// (stage 3 of docs/plans/an-app-for-android.md, part C): what was written
// is sent though the app was left before it reached the server, by the
// round Android runs when there is a network (WorkManager, Round.kt), which
// reaches Rust through the door (src-tauri/src/door.rs) with no window.
//
// The server on this machine, reached from the emulator as 10.0.2.2, and
// the application as a computer under the harness; the emulator joins the
// home. The network taken away; a note typed; Home; the process ended (am
// kill). The network given back: within two minutes, without the app being
// started by anyone (the work run by `cmd jobscheduler run -f` where
// Android waits longer), the note is in the computer's notebook, and the log
// of that run in the app's folder says the round had no window. Once more
// with the page ended by removing its task, as an app swiped out of the
// recent ones ends. Then the role taking over: a file of 40 MB shared by
// taps, the network made slow, Home, the process ended, the work run; while
// the log says that the round is under way, the app is started from the
// launcher: the notes are shown, no message says that the folder is in use,
// the log says that the role took what the door had opened, and with the
// network fast again the file reaches the computer.
// Run with the new emulator up, the debug app installed, the application
// and the server built:  node e2e/android/closed.mjs
// Screenshots in e2e/output/android-closed-<n>-<what>.png.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, freePort, root } from '../harness.mjs';
import {
  PACKAGE,
  adb,
  endPage,
  page,
  screenshot,
  shareFile,
  shell,
  sleep,
  start,
  tap,
  until,
} from './device.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push(ok);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
const log = () => shell(`run-as ${PACKAGE} sh -c "cat files/data/logs/* 2>/dev/null"`);
const NO_WINDOW = 'a round of the synchronization with no window';
const TAKEN_OVER = 'the role takes over the folder a round with no window opened';

/** Runs the app's work now, where Android has it waiting: WorkManager's jobs of the app, each made to run. */
async function runWork() {
  const said = await shell('dumpsys jobscheduler');
  const ids = [...said.matchAll(/JOB #u0a\d+\/(\d+): [0-9a-f]+ org\.glaukopis\.app\//g)].map((m) => m[1]);
  for (const id of new Set(ids)) await shell(`cmd jobscheduler run -f ${PACKAGE} ${id}`).catch(() => {});
  return ids.length;
}

let port = 9390;
async function withPage(fn) {
  const p = await page(port++);
  try {
    return await fn(p);
  } finally {
    p.close();
  }
}

/** Words typed into a new note on the emulator, the keyboard's own way. */
async function typeNote(words) {
  await withPage(async (p) => {
    await until(() => p.evaluate(`!!document.querySelector('[data-phone-notes]')`), 'the notes', 15000);
    const at = await p.middle('[data-phone-new]');
    await tap(at.x, at.y);
  });
  await sleep(1500);
  await shell(`input text "${words.replace(/ /g, '%s')}"`);
  await sleep(1500);
  await shell('input keyevent 4');
  await shell('input keyevent 4');
  await sleep(800);
}

const binary = join(root, 'target', 'debug', 'glaukopis-server');
if (!existsSync(binary)) throw new Error(`No server at ${binary}. Build it first: cargo build -p glaukopis-server`);
const serverData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-server-'));
const serverPort = await freePort();
const server = spawn(binary, ['--listen', `127.0.0.1:${serverPort}`, '--data', serverData, '--password', 'sesame'], { stdio: 'ignore' });
await until(async () => (await fetch(`http://127.0.0.1:${serverPort}/api/info`)).ok, 'the server', 10000, 100);

/** Whether the computer's notebook holds these words, after a round of its own. */
async function onTheComputer(desk, words) {
  await invoke(desk, 'sync_now');
  await sleep(1500);
  const bytes = await desk.execAsync(`const r = await window.__TAURI_INTERNALS__.invoke('notebook_load'); return new TextDecoder().decode(new Uint8Array(r));`).catch(() => '');
  return String(bytes).includes(words);
}

/** The note reaches the computer within two minutes, the work run where Android waits. */
async function arrives(desk, words) {
  const began = Date.now();
  let ran = false;
  return until(async () => {
    if (!ran && Date.now() - began > 45000) ran = (await runWork()) > 0;
    return onTheComputer(desk, words);
  }, `"${words}" on the computer`, 120000, 3000).catch(() => false);
}

let desk;
try {
  desk = await App.launch({ width: 1280, height: 860 });
  await invoke(desk, 'sync_start', { server: `127.0.0.1:${serverPort}`, name: 'Desk', password: 'sesame' });
  await invoke(desk, 'sync_now');
  await until(async () => (await invoke(desk, 'sync_status')).last, 'the computer\'s first round', 30000);
  const { code } = await invoke(desk, 'sync_code');

  await shell(`pm clear ${PACKAGE}`).catch(() => {});
  await start();
  await withPage(async (p) => {
    await until(() => p.evaluate(`!!document.querySelector('[data-phone-notes]')`), 'the notes', 15000);
    await p.evaluate(`window.__TAURI_INTERNALS__.invoke('sync_join', { server: 'http://10.0.2.2:${serverPort}', code: ${JSON.stringify(code)}, name: 'Emulator' })`);
    await until(async () => (await p.evaluate(`window.__TAURI_INTERNALS__.invoke('sync_status')`)).last, 'the phone\'s first round', 30000);
  });
  check('the emulator joined the computer\'s home', true);

  // ---- 1. the process ended with a note unsent ----
  await shell('cmd connectivity airplane-mode enable');
  await sleep(3000);
  await typeNote('Sent with the app closed');
  await shell('input keyevent KEYCODE_HOME');
  await sleep(2000);
  await shell(`am kill ${PACKAGE}`);
  await sleep(1500);
  check('the app\'s process is ended', !(await shell(`pidof ${PACKAGE} || true`)).trim());
  await shell('cmd connectivity airplane-mode disable');
  const first = await arrives(desk, 'Sent with the app closed');
  check('with the network back, the note is in the computer\'s notebook, the app started by no one', first);
  check('and the log says the round had no window', (await log()).includes(NO_WINDOW));

  // ---- 2. the page ended by removing its task ----
  await start();
  await sleep(2000);
  await shell('cmd connectivity airplane-mode enable');
  await sleep(3000);
  await typeNote('Sent after the app was swiped away');
  await endPage();
  await shell('cmd connectivity airplane-mode disable');
  check('with the page ended by removing its task, the note is on the computer all the same', await arrives(desk, 'Sent after the app was swiped away'));

  // ---- 3. the role takes over a round under way ----
  await shell('dd if=/dev/urandom of=/sdcard/Download/forty.bin bs=1048576 count=40 2>/dev/null');
  await shell('am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download/forty.bin');
  await adb('emu', 'network', 'speed', 'gsm');
  await shareFile('forty.bin');
  await until(async () => (await shell('dumpsys activity activities | grep -m1 topResumedActivity')).includes(PACKAGE), 'the app on the note shared', 30000);
  await sleep(3000);
  await shell('input keyevent KEYCODE_HOME');
  await sleep(1500);
  await shell(`am kill ${PACKAGE}`);
  await sleep(1500);
  const before = (await log()).split(NO_WINDOW).length;
  await runWork();
  const underWay = await until(async () => (await log()).split(NO_WINDOW).length > before, 'the round under way', 30000, 500).catch(() => false);
  check('the round with no window is under way', underWay);
  await shell(`am start -n ${PACKAGE}/.StartActivity`);
  const shown = await withPage((p) => until(() => p.evaluate(`!!document.querySelector('[data-phone-notes]')`), 'the notes', 20000)).catch(() => false);
  check('started from the launcher meanwhile, the notes are shown', shown);
  const inUse = await withPage((p) => p.evaluate(`document.body.textContent`)).catch(() => '');
  check('and nothing says that the folder is in use', !/in use/i.test(inUse));
  check('the log says the role took what the door had opened', (await log()).includes(TAKEN_OVER));
  await screenshot('closed-1-taken-over');
  await adb('emu', 'network', 'speed', 'full');
  const forty = await until(async () => {
    await invoke(desk, 'sync_now');
    await sleep(3000);
    const found = [];
    const walk = (at) => {
      if (!existsSync(at)) return;
      for (const e of readdirSync(at, { withFileTypes: true })) {
        if (e.isDirectory()) walk(join(at, e.name));
        else if (statSync(join(at, e.name)).size === 40 * 1048576) found.push(e.name);
      }
    };
    walk(join(desk.dataDir, 'library', 'attachments'));
    return found.length > 0;
  }, 'the file of 40 MB on the computer', 240000, 5000).catch(() => false);
  check('with the network fast again, the file of 40 MB reaches the computer', forty);
  await shell('rm -f /sdcard/Download/forty.bin');
} catch (error) {
  check('the script ran to its end', false, error.stack ?? String(error));
} finally {
  await shell('cmd connectivity airplane-mode disable').catch(() => {});
  await adb('emu', 'network', 'speed', 'full').catch(() => {});
  await desk?.close().catch(() => {});
  server.kill();
}

const failed = checks.filter((ok) => !ok).length;
console.log(`\n${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
