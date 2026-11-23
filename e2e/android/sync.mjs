// The phone on the emulator joins the home of a computer (stage 2 of
// docs/plans/an-app-for-android.md): the server on this machine, reached
// from the emulator as 10.0.2.2, and the application as a computer under
// the harness. The computer starts a home and makes a code; on the emulator,
// in the settings, the server, the name and the code are written and Join
// pressed. The name offered was the model the emulator says. A note typed
// on the emulator is in the computer's notebook; a note written on the
// computer is in the emulator's list.
// Run with the new emulator up, the debug app installed, the application
// and the server built:  node e2e/android/sync.mjs
// Screenshots in e2e/output/android-sync-<n>-<what>.png.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, freePort, root, sleep } from '../harness.mjs';
import { PACKAGE, page, screenshot, shell, start, tap, until } from './device.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push(ok);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);

// ---- the server, on this machine's loopback, which the emulator reaches as 10.0.2.2 ----
const binary = join(root, 'target', 'debug', 'glaukopis-server');
if (!existsSync(binary)) throw new Error(`No server at ${binary}. Build it first: cargo build -p glaukopis-server`);
const serverData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-server-'));
const port = await freePort();
const server = spawn(binary, ['--listen', `127.0.0.1:${port}`, '--data', serverData, '--password', 'sesame'], { stdio: 'ignore' });
await until(async () => (await fetch(`http://127.0.0.1:${port}/api/info`)).ok, 'the server', 10000, 100);

let desk;
try {
  // ---- the computer starts a home ----
  desk = await App.launch({ width: 1280, height: 860 });
  await invoke(desk, 'sync_start', { server: `127.0.0.1:${port}`, name: 'Desk', password: 'sesame' });
  await invoke(desk, 'sync_now');
  await until(async () => (await invoke(desk, 'sync_status')).last, 'the computer\'s first round', 30000);
  const { code } = await invoke(desk, 'sync_code');

  // ---- the phone joins from its settings ----
  await shell(`pm clear ${PACKAGE}`).catch(() => {});
  await start();
  let p = await page();
  await until(() => p.evaluate(`!!document.querySelector('[data-phone-notes]')`), 'the notes', 15000);
  let at = await p.middle('[data-phone-to-settings]');
  await tap(at.x, at.y);
  await until(() => p.evaluate(`!!document.querySelector('input[name="sync-name"]')?.value`), 'the name offered', 8000);
  const offered = await p.evaluate(`document.querySelector('input[name="sync-name"]').value`);
  const model = (await shell('getprop ro.product.model')).trim();
  check('the name offered is the model the emulator says', offered === model, `${offered} / ${model}`);
  await p.evaluate(`(() => {
    const set = (name, value) => { const i = document.querySelector('input[name="' + name + '"]'); i.value = value; i.dispatchEvent(new Event('input', { bubbles: true })); };
    set('sync-server', 'http://10.0.2.2:${port}');
    document.querySelector('input[name="sync-server"]').dispatchEvent(new Event('change', { bubbles: true }));
    set('sync-name', 'Emulator');
    Array.from(document.querySelectorAll('[role="radio"]')).find((b) => /join/i.test(b.textContent)).click();
    return true; })()`);
  await sleep(500);
  await p.evaluate(`(() => { const i = document.querySelector('input[name="sync-code"]'); i.value = ${JSON.stringify(code)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(300);
  at = await p.middle('[data-sync-begin]');
  await tap(at.x, at.y);
  await until(() => p.evaluate(`document.querySelector('[data-synchronization]')?.getAttribute('data-synchronization') !== 'off' && !document.querySelector('[data-sync-begin]')`), 'the phone to have joined', 30000);
  check('the phone joined the home from its settings', true);
  await screenshot('sync-1-joined');

  // ---- a note typed on the emulator reaches the computer ----
  await shell('input keyevent 4');
  await sleep(600);
  at = await p.middle('[data-phone-new]');
  await tap(at.x, at.y);
  await sleep(1500);
  await shell('input text "Heard%san%sowl%sfrom%sthe%sphone"');
  await sleep(1500);
  await shell('input keyevent 4');
  await shell('input keyevent 4');
  await sleep(500);
  await p.evaluate(`window.__TAURI_INTERNALS__.invoke('sync_now')`);
  const heard = await until(async () => {
    await invoke(desk, 'sync_now');
    await sleep(1500);
    // The words lie in the notebook's changes as they were written (Yjs keeps text as UTF-8).
    const bytes = await desk.execAsync(`const r = await window.__TAURI_INTERNALS__.invoke('notebook_load'); return new TextDecoder().decode(new Uint8Array(r));`).catch(() => '');
    return String(bytes).includes('Heard an owl from the phone');
  }, 'the phone\'s note on the computer', 60000, 2000).catch(() => false);
  check('a note typed on the emulator is in the computer\'s notebook', heard);

  // ---- a note written on the computer reaches the emulator ----
  {
    await desk.click('[data-place="library"]');
    await desk.waitFor('[data-top-row] [data-library-switch]', 8000);
    await desk.clickText('[data-library-switch] [role="radio"]', 'Notebook');
    await desk.waitFor('[data-notebook]', 8000);
    await desk.waitUntil(`return !!document.querySelector('[data-notebook-empty], [data-new-note]')`, 8000, 'the notebook to be read');
    if (await desk.exists('[data-notebook-empty]')) await desk.clickText('[data-notebook-empty] button', 'New note');
    else await desk.click('[data-new-note]');
    await desk.waitFor('[data-note-editor] [data-note-text] .ProseMirror', 5000);
    await desk.keys('Written at the desk for the phone');
    await sleep(1500);
  }
  const arrived = await until(async () => {
    await invoke(desk, 'sync_now');
    await p.evaluate(`window.__TAURI_INTERNALS__.invoke('sync_now')`);
    await sleep(2000);
    return p.evaluate(`(document.querySelector('[data-phone-notes]')?.textContent ?? '').includes('Written at the desk for the phone')`);
  }, 'the computer\'s note on the emulator', 60000, 1000).catch(() => false);
  check('a note written on the computer is in the emulator\'s list', arrived);
  await screenshot('sync-2-both');
  p.close();
} catch (error) {
  check('the script ran to its end', false, error.stack ?? String(error));
} finally {
  await desk?.close().catch(() => {});
  server.kill();
  rmSync(serverData, { recursive: true, force: true });
}
const failed = checks.filter((ok) => !ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
