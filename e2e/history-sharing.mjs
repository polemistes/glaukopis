// The history of a shared project (ADR 0021): two people, each with the
// application and a data directory of their own, through the real server.
// Each keeps the history; each one's changes are theirs, on both computers.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep, freePort } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 10000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(150);
  }
}

const ask = (app, body, ...args) =>
  app.execAsync(`const { history: h, positions } = window.__glaukopisHistory; ${body}`, ...args);
/** The text of the centre, without the cursors of the others, which carry their names. */
const bodyText = (app) =>
  app.exec(`const b = document.querySelector('.text-view .section .body')?.cloneNode(true);
            if (!b) return '';
            b.querySelectorAll('.ProseMirror-yjs-cursor').forEach((c) => c.remove());
            return b.textContent.replace(/\u2060/g, '').trim();`);
const person = (app) => JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8')).person;

/** What changed in the paragraph of the centre since a moment, as [status, text, name of who]. */
async function changes(app, since) {
  return ask(
    app,
    `const people = new Map((await h.people()).map((p) => [p.id, p.name]));
     const map = h.project.maps[0].id;
     const c = await h.compare(map, { moment: new Uint8Array(arguments[0]), accepted: [] });
     const p = c.passages.find((x) => x.kind === 'paragraph');
     return p ? p.pieces.filter((x) => x.status !== 'same').map((x) => [x.status, x.text, people.get(x.by) ?? x.by]) : [];`,
    since,
  );
}

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
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(`http://${address}/api/info`)).ok) break;
  } catch {
    await sleep(100);
  }
}

let owner;
let guest;
try {
  owner = await App.launch({ width: 1280, height: 820 });
  guest = await App.launch({ width: 1280, height: 820 });
  await owner.installErrorHook();
  await guest.installErrorHook();

  // ---- the owner writes, keeps the history, and shares ----
  await owner.clickText('button', 'Begin a project');
  await owner.waitFor('dialog input');
  await owner.type('dialog input', 'Wrath');
  await owner.clickText('dialog footer button', 'Create');
  await owner.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await owner.keys(['Control', 'd']);
  await owner.waitFor('.text-view .section .body', 8000);
  await owner.click('.text-view .section .body');
  await sleep(300);
  await owner.keys('Sing, goddess, the wrath.');
  await sleep(800);
  await ask(owner, `await h.turnOn();`);

  await owner.click('header .share button');
  await owner.waitForText('dialog h2', 'Share this project');
  await owner.type('dialog input[placeholder="glaukopis.example.org"]', address);
  await owner.click('dialog input[placeholder="As the others know you"]');
  await owner.waitFor('dialog input[type="password"]', 5000);
  await owner.keys('Robert');
  await owner.type('dialog input[type="password"]', 'sesame');
  await owner.clickText('dialog footer button', 'Share');
  await owner.waitForText('dialog .state', 'Connected', 8000);
  await owner.clickText('dialog button', 'Make an invitation code');
  await owner.waitFor('dialog .code', 5000);
  const code = (await owner.text('dialog .code')).trim();
  await owner.clickText('dialog footer button', 'Done');
  await owner.waitGone('dialog[open]');

  // ---- the guest joins ----
  await guest.waitForText('h2', 'Welcome to Glaukopis');
  await guest.clickText('button', 'or join a project');
  await guest.waitForText('dialog h2', 'Join a shared project');
  await guest.type('dialog input[name="server"]', address);
  await guest.type('dialog input[name="code"]', code);
  await guest.type('dialog input[placeholder="As the others know you"]', 'Anna Lind');
  await guest.clickText('dialog footer button', 'Join');
  await guest.waitFor('.diagram .node.root', 15000);
  await sleep(500);
  const id = await owner.exec(`return window.__glaukopisHistory.history.id`);
  await until('the guest to keep the history as well', () =>
    existsSync(join(guest.dataDir, 'projects', id, 'changes.log')),
  );
  check('the one who joins keeps the history too, as the project says', true);

  // ---- each writes ----
  const since = await ask(owner, `return Array.from((await h.now()).snapshot);`);
  await guest.keys(['Control', 'd']);
  await guest.waitFor('.text-view .section .body', 8000);
  await guest.click('.text-view .section .body');
  await sleep(200);
  await guest.press('End');
  await guest.keys(' Of Achilles.');
  await until('the owner to have what the guest wrote', async () => (await bodyText(owner)).includes('Of Achilles.'));
  await owner.click('.text-view .section .body');
  await sleep(500);
  // The owner takes away words that were there, and writes others.
  await owner.press('Home');
  for (let i = 0; i < 6; i++) await owner.press('Delete');
  await owner.keys('O muse, ');
  await until('the guest to have what the owner changed', async () => (await bodyText(guest)) === 'O muse, goddess, the wrath. Of Achilles.');
  await sleep(1500);

  // ---- who did what, on both computers ----
  const expected = JSON.stringify(
    [
      ['added', 'O muse, ', 'Robert'],
      ['removed', 'Sing, ', 'Robert'],
      ['added', ' Of Achilles.', 'Anna Lind'],
    ].sort(),
  );
  const seenByOwner = (await changes(owner, since)).sort();
  check("the owner's history knows each one's changes", JSON.stringify(seenByOwner) === expected, JSON.stringify(seenByOwner));
  const seenByGuest = (await changes(guest, since)).sort();
  check("and so does the guest's, from the same moment", JSON.stringify(seenByGuest) === expected, JSON.stringify(seenByGuest));
  check(
    'each installation is a person of its own',
    person(owner) && person(guest) && person(owner) !== person(guest),
  );

  // ---- the panel, on the guest's computer ----
  await guest.keys(['Control', 'Shift', 'h']);
  await guest.waitFor('.history-panel .moment', 10000);
  await sleep(800);
  const listed = await guest.exec(
    `return Array.from(document.querySelectorAll('.history-panel .moment .name')).map((m) => m.textContent.trim())`,
  );
  check("the sessions are each person's, by name", listed.includes('Robert') && listed.includes('Anna Lind'), JSON.stringify(listed));
  await guest.screenshot('history-sharing-1-panel');
  await guest.click('.history-panel .moment');
  await guest.waitFor('.past .text .element', 8000);
  const colours = await guest.exec(
    `return Array.from(new Set(Array.from(document.querySelectorAll('.past .piece.added, .past .piece.removed')).map((p) => p.style.getPropertyValue('--who'))))`,
  );
  check('what changed is marked in the colour of who changed it', colours.length >= 1, JSON.stringify(colours));
  await guest.screenshot('history-sharing-2-as-it-was');

  for (const [who, app] of [['owner', owner], ['guest', guest]]) {
    const errors = await app.pageErrors();
    check(`no errors in the window of the ${who}`, errors.length === 0, errors.join(' ‖ '));
  }
} catch (error) {
  console.error(error);
  for (const [who, app] of [['owner', owner], ['guest', guest]])
    if (app) console.log(`      the text of the ${who}: ${JSON.stringify(await bodyText(app).catch(() => '?'))}`);
  check('the script ran to its end', false, String(error.message ?? error));
  await owner?.screenshot('history-sharing-failure-owner').catch(() => {});
  await guest?.screenshot('history-sharing-failure-guest').catch(() => {});
} finally {
  await owner?.close();
  await guest?.close();
  server.kill('SIGTERM');
  await sleep(200);
  rmSync(serverData, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
