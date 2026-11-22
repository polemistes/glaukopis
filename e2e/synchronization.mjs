// The same on every computer (record 0119): the real server, and the
// application running twice, each with a data directory of its own, as two
// computers of one writer. Synchronization is turned on in the settings of
// the first (Start here, with the server's password) and a code made; the
// second joins with the code. A project made on the first comes into the
// list of the second, and words written on the first come into it there,
// also while it is open. The server is taken away, both write, and it is
// brought back: both hold both, the one that meets the server second says
// that the project was written in apart, and Show the changes opens the
// review from the moment kept. A project deleted on one goes from the list
// of the other, into its trash. Last, Stop synchronizing on this computer,
// on both: with the last, nothing is left on the server.
//
// Written without being run. What could not be made sure of without
// running it is marked "Not run:" where it stands.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep, freePort } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 8000) {
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

/** The names of the projects in the list at the left. */
const listed = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('[data-projects-pane] [data-row-kind="project"] .name')).map((e) => e.textContent.trim())`);

/** What the text of the project open shows. */
const textOf = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('.text-view .section .body .prose')).map((e) => e.textContent).join('\\n')`);

/** Writes at the end of the text of the project open. */
async function writeAtEnd(app, words) {
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys(['Control', 'End']);
  await app.keys(words);
  await sleep(600);
}

/** Opens the settings at the section Synchronization, once it says how it stands. */
async function openSync(app) {
  if (!(await app.exists('dialog[open] [data-synchronization]'))) {
    await app.keys(['Control', ',']);
    await app.waitForText('dialog[open] header h2', 'Settings');
  }
  await app.waitFor('[data-synchronization]:not([data-synchronization=""])', 8000);
  await app.exec(`document.querySelector('[data-synchronization]').scrollIntoView({ block: 'start' }); return null;`);
  await sleep(200);
}

async function closeSettings(app) {
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000).catch(() => {});
}

/** Puts words in place of what a field holds. */
async function fill(app, selector, words) {
  await app.exec(`const i = document.querySelector(arguments[0]); i.focus(); i.select(); return null;`, selector);
  await app.keys(words);
}

/** Asks the engine for a round at once, as Synchronize now does. */
const hurry = (app) => invoke(app, 'sync_now');

/** When everything was last the same on a computer, in milliseconds; 0 before the first time. */
async function lastSame(app) {
  const status = await invoke(app, 'sync_status');
  return status.last ? Date.parse(status.last) : 0;
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
      const r = await fetch(`http://${address}/api/info`);
      if (r.ok) return;
    } catch {
      await sleep(100);
    }
  }
  throw new Error(`the server did not answer:\n${serverLog.join('')}`);
}

const homes = () => (existsSync(join(serverData, 'homes')) ? readdirSync(join(serverData, 'homes')) : []);

let server = startServer();
await serverAnswers();

let desk;
let laptop;
try {
  desk = await App.launch({ width: 1280, height: 860 });
  laptop = await App.launch({ width: 1280, height: 860 });
  await desk.installErrorHook();
  await laptop.installErrorHook();

  // ---- the first computer starts ----
  await openSync(desk);
  check('the section says that this computer is not synchronized', (await desk.attr('[data-synchronization]', 'data-synchronization')) === 'off');
  const offered = await desk.exec(`return document.querySelector('input[name="sync-name"]').value`);
  check('the name the system gives the computer is offered', offered.length > 0, offered);
  await fill(desk, 'input[name="sync-server"]', address);
  // Leaving the field asks the server, which asks for its password.
  await desk.click('input[name="sync-name"]');
  await desk.waitFor('input[name="sync-password"]', 5000);
  check('the server is asked, and its password is asked for', true);
  await fill(desk, 'input[name="sync-name"]', 'Desk');
  await desk.type('input[name="sync-password"]', 'wrong');
  await desk.screenshot('synchronization-1-start');
  await desk.click('[data-sync-begin]');
  await desk.waitForText('[data-synchronization]', 'not the one the server asks for', 8000);
  check('a wrong password is refused, in words, under the field', true);
  await fill(desk, 'input[name="sync-password"]', 'sesame');
  await desk.click('[data-sync-begin]');
  await until('the first computer to be synchronized', async () => {
    const state = await desk.attr('[data-synchronization]', 'data-synchronization');
    return state === 'idle' || state === 'working';
  });
  await desk.waitFor('[data-sync-computer="Desk"][data-sync-you]', 8000);
  check('it is synchronized, and the computers are listed', (await desk.text('[data-sync-server]')).includes(address));
  check('the server keeps one home', homes().length === 1, homes().join(', '));

  // ---- a code ----
  await desk.click('[data-sync-add]');
  await desk.waitFor('[data-sync-code]', 5000);
  const code = (await desk.text('[data-sync-code]')).trim();
  check('a code is made', /^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/.test(code), code);
  check('and it says where it is entered, and until when', (await desk.text('[data-synchronization]')).includes('It can be used once, until'));
  await desk.screenshot('synchronization-2-code');
  await closeSettings(desk);

  // A project made on the first before the second joins, with its history kept, so that the review can show
  // what came from elsewhere. Not run: that the history, turned on here before the second has the project,
  // is begun on the second as it opens it there, the setting being in the project.
  await desk.beginProject();
  await desk.type('dialog input', 'Wrath and the hero');
  await desk.clickText('dialog footer button', 'Create');
  await desk.waitFor('.text-view .section .body', 8000);
  await writeAtEnd(desk, 'Sing, goddess, the wrath.');
  await desk.keys(['Control', 'Shift', 'h']);
  await desk.waitFor('.history-panel', 5000);
  await desk.clickText('.history-panel button', 'Keep the history');
  await sleep(600);
  await desk.keys(['Control', 'Shift', 'h']);
  await sleep(300);

  // ---- the second joins ----
  await openSync(laptop);
  await fill(laptop, 'input[name="sync-server"]', address);
  await fill(laptop, 'input[name="sync-name"]', 'Laptop');
  await laptop.clickText('[data-synchronization] [role="radio"]', 'Join with a code');
  await laptop.waitFor('input[name="sync-code"]', 3000);
  await laptop.type('input[name="sync-code"]', 'AAAA-BBBB-CCCC');
  await laptop.click('[data-sync-begin]');
  await laptop.waitForText('[data-synchronization]', 'The code is not valid', 8000);
  check('a wrong code is refused, in words', true);
  await fill(laptop, 'input[name="sync-code"]', code);
  await laptop.screenshot('synchronization-3-join');
  await laptop.click('[data-sync-begin]');
  await laptop.waitFor('[data-sync-computer="Laptop"][data-sync-you]', 10000);
  await laptop.waitFor('[data-sync-computer="Desk"]', 5000);
  check('the second is synchronized, and both computers are listed', (await laptop.count('[data-sync-computer]')) === 2);
  await laptop.screenshot('synchronization-4-joined');
  await closeSettings(laptop);

  // ---- a project made on one is on the other ----
  // The engine asks the server every half minute; the first round after joining is made at once.
  await hurry(laptop);
  await until('the project to come into the list of the second', async () => (await listed(laptop)).includes('Wrath and the hero'), 60000);
  check('a project made on the first is in the list of the second', true);
  await laptop.screenshot('synchronization-5-listed');
  await laptop.openProject('Wrath and the hero');
  await laptop.view('text');
  await laptop.waitFor('.text-view .section .body', 8000);
  await until('the words written on the first', async () => /the wrath/.test(await textOf(laptop)), 15000);
  check('with what was written in it on the first', true);

  // While it is open on both, what one writes comes to the other: sent a few seconds after it is written,
  // and asked for every half minute, or at once by Synchronize now.
  await writeAtEnd(desk, ' Of Achilles.');
  await sleep(4000);
  await hurry(laptop);
  await until('the words to come while the project is open', async () => /Of Achilles/.test(await textOf(laptop)), 60000);
  check('words written on the first come into the project open on the second', true);
  await laptop.screenshot('synchronization-6-open-on-both');

  // ---- written apart ----
  server.kill('SIGTERM');
  await sleep(500);
  await writeAtEnd(desk, ' Written at the desk.');
  await sleep(4500);
  await until('the first to find the server gone', async () => (await invoke(desk, 'sync_status')).state === 'offline', 45000);
  // The second writes last, so that the half minute after which it asks again begins last.
  await writeAtEnd(laptop, ' Written on the laptop.');
  await sleep(4500);
  await until('the second to find the server gone', async () => (await invoke(laptop, 'sync_status')).state === 'offline', 45000);
  await openSync(laptop);
  await laptop.waitFor('[data-synchronization="offline"]', 5000);
  check('the settings say that the server cannot be reached, where it was asked', (await laptop.text('[data-sync-standing]')).includes('cannot be reached'));
  await laptop.screenshot('synchronization-7-offline');
  await closeSettings(laptop);

  server = startServer();
  await serverAnswers();
  const back = Date.now();
  // The first meets the server first, the second after it: the second is the one told.
  // Not run: the second's own half minute could come before the first is hurried; it is begun last above.
  await hurry(desk);
  await until('the first to meet the server', async () => (await lastSame(desk)) > back, 30000);
  await hurry(laptop);
  await until('the second to be given what the first wrote', async () => /Written at the desk/.test(await textOf(laptop)), 30000);
  await hurry(desk);
  await until('the first to be given what the second wrote', async () => /Written on the laptop/.test(await textOf(desk)), 45000);
  const both = [await textOf(desk), await textOf(laptop)];
  check(
    'both hold what both wrote',
    both.every((t) => /Written at the desk/.test(t) && /Written on the laptop/.test(t)),
    both.join(' ‖ '),
  );
  const apartToast = await laptop.waitForText('.toaster .toast', 'was written in on two computers', 15000);
  const toast = await laptop.text(apartToast);
  check('the second says that the project was written in on two computers apart', toast.includes('“Wrath and the hero” was written in on two computers while they were apart.'), toast);
  // Not run: whether the history file is on disk on the second by then, which the toast asks; where it is not,
  // the toast offers the earlier versions instead, and this check fails.
  check('with Show the changes', toast.includes('Show the changes'), toast);
  check(
    'and the first, which met the server first, says nothing of it',
    !(await desk.exec(`return Array.from(document.querySelectorAll('.toaster .toast')).some((t) => t.textContent.includes('was written in on two computers'))`)),
  );
  await laptop.screenshot('synchronization-8-apart');
  await laptop.clickText('.toaster .toast .action', 'Show the changes');
  await laptop.waitFor('.review-panel', 10000);
  const review = await until(
    'the review from the moment kept',
    () =>
      laptop.exec(
        `const r = window.__glaukopisHistory?.review;
         return r && r.ready && r.chosen ? { chosen: r.chosen.name, own: r.own, changes: r.changes.length } : null;`,
      ),
    20000,
  );
  check(
    'Show the changes opens the review from the moment the two met, with what the other wrote',
    review.chosen === 'the computers met' && review.own && review.changes > 0,
    JSON.stringify(review),
  );
  check('the review says from when', (await laptop.text('.review-panel')).includes('Since “the computers met”'));
  await laptop.screenshot('synchronization-9-review');
  const seen = await invoke(laptop, 'project_apart', { id: await laptop.exec(`return window.__glaukopisHistory.history.id`) });
  check('and what was kept of it is seen, and forgotten', seen === null, JSON.stringify(seen));

  // ---- deleted on one, gone from the other ----
  await laptop.home();
  await laptop.beginProject();
  await laptop.type('dialog input', 'Scraps');
  await laptop.clickText('dialog footer button', 'Create');
  await laptop.waitFor('.text-view .section .body', 8000);
  await writeAtEnd(laptop, 'To be thrown away.');
  await laptop.home();
  await sleep(4000);
  await hurry(desk);
  await until('the second project to come to the first', async () => (await listed(desk)).includes('Scraps'), 60000);
  await desk.home();
  await desk.rightClick(await desk.findByText('[data-projects-pane] [data-row-kind="project"]', 'Scraps'));
  await desk.waitFor('.menu');
  await desk.clickText('.menu [role="menuitem"]', 'Delete');
  await desk.waitForText('dialog h2', 'Delete');
  await sleep(250);
  await desk.clickText('dialog footer button', 'Delete project');
  await until('the project to go from the first', async () => !(await listed(desk)).includes('Scraps'), 10000);
  await sleep(4000);
  await hurry(laptop);
  await until('the project to go from the list of the second', async () => !(await listed(laptop)).includes('Scraps'), 60000);
  const trash = await invoke(laptop, 'project_trash');
  check('a project deleted on one is gone from the list of the other, into its trash', trash.some((e) => e.info.name === 'Scraps'), JSON.stringify(trash.map((e) => e.info.name)));
  check('and the other project is still there', (await listed(laptop)).includes('Wrath and the hero'));
  await laptop.screenshot('synchronization-10-deleted');

  // ---- stopping ----
  await openSync(laptop);
  await laptop.click('[data-sync-stop]');
  await laptop.waitForText('dialog h2', 'Stop synchronizing on this computer?');
  const asked = await laptop.exec(`return Array.from(document.querySelectorAll('dialog[open]')).map((d) => d.textContent).join(' ')`);
  check('stopping is asked once more, and says that what is here stays', asked.includes('stays here as it is') && !asked.includes('nothing is left on the server'), asked.replace(/\s+/g, ' '));
  await laptop.screenshot('synchronization-11-stop');
  await laptop.clickText('dialog footer button', 'Stop synchronizing');
  await laptop.waitFor('[data-synchronization="off"]', 10000);
  check('the second is synchronized no more, and offers to begin again', await laptop.exists('[data-sync-begin]'));
  check('and keeps what it held', (await invoke(laptop, 'project_list')).some((p) => p.name === 'Wrath and the hero'));
  await closeSettings(laptop);

  await openSync(desk);
  await until('the first to list itself alone', async () => (await desk.count('[data-sync-computer]')) === 1, 10000);
  check('the first lists itself alone', true);
  await desk.click('[data-sync-stop]');
  await desk.waitForText('dialog h2', 'Stop synchronizing on this computer?');
  const last = await desk.exec(`return Array.from(document.querySelectorAll('dialog[open]')).map((d) => d.textContent).join(' ')`);
  check('the last to stop is told that nothing is left on the server', last.includes('nothing is left on the server'), last.replace(/\s+/g, ' '));
  await desk.clickText('dialog footer button', 'Stop synchronizing');
  await desk.waitFor('[data-synchronization="off"]', 10000);
  check('and nothing is left on the server', homes().length === 0, homes().join(', '));
  await desk.screenshot('synchronization-12-stopped');
  await closeSettings(desk);

  for (const [who, app] of [['first', desk], ['second', laptop]]) {
    // The engine logs what it could not reach while the server was away; the page should have nothing.
    const errors = (await app.pageErrors()).filter((e) => !/Failed to load resource/.test(e));
    check(`no errors in the window of the ${who}`, errors.length === 0, errors.join(' ‖ '));
  }
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await desk?.screenshot('synchronization-failure-first').catch(() => {});
  await laptop?.screenshot('synchronization-failure-second').catch(() => {});
  console.error(serverLog.slice(-20).join(''));
} finally {
  await desk?.close();
  await laptop?.close();
  server.kill('SIGTERM');
  await sleep(200);
  rmSync(serverData, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
