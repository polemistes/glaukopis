// Working together: the real server, and the application running twice,
// each with a data directory of its own.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const titles = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('.diagram .node .caption')).map((e) => e.textContent.trim())`);

async function until(what, fn, ms = 8000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
}

// ---- the server ----
const binary = join(root, 'target', 'debug', 'glaukopis-server');
if (!existsSync(binary)) throw new Error(`No server at ${binary}. Build it first: cargo build -p glaukopis-server`);
const serverData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-server-'));
const port = 8400 + Math.floor(Math.random() * 400);
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

let server = startServer();
await serverAnswers();

let owner;
let guest;
try {
  owner = await App.launch({ width: 1280, height: 820 });
  guest = await App.launch({ width: 1280, height: 820 });
  await owner.installErrorHook();
  await guest.installErrorHook();

  // A work in the library of the owner, with what the owner has written about it.
  await owner.execAsync(
    `const invoke = window.__TAURI_INTERNALS__.invoke;
     const plan = await invoke('import_bib_text', { text: arguments[0] });
     await invoke('import_apply', { plan });`,
    '@book{lord1960, author={Lord, Albert B.}, title={The Singer of Tales}, date={1960}, annotation={Formula and theme.}}',
  );

  // ---- the owner makes a project and shares it ----
  await owner.clickText('button', 'Begin a project');
  await owner.waitFor('dialog input');
  await owner.type('dialog input', 'Wrath and the hero');
  await owner.clickText('dialog footer button', 'Create');
  await owner.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await owner.click('.diagram .node.root');
  const add = async (app, key, name) => {
    await app.press(key);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await add(owner, 'Tab', 'The word mênis');
  await add(owner, 'Enter', 'Reception');

  await owner.click('header .share button');
  await owner.waitForText('dialog h2', 'Share this project');
  await owner.screenshot('sharing-1-share');
  await owner.type('dialog input[placeholder="glaukopis.example.org"]', address);
  await owner.click('dialog input[placeholder="As the others know you"]');
  await owner.waitFor('dialog input[type="password"]', 5000);
  check('the server is found, and asks for its password', await owner.exists('dialog .found'));
  await owner.keys('Robert');
  await owner.type('dialog input[type="password"]', 'wrong');
  await owner.clickText('dialog footer button', 'Share');
  await owner.waitForText('dialog', 'not the one the server asks for', 5000);
  check('a wrong password is refused, in words', true);
  await owner.exec(`const i = document.querySelector('dialog input[type="password"]'); i.focus(); i.select();`);
  await owner.keys('sesame');
  await owner.screenshot('sharing-2-password');
  await owner.clickText('dialog footer button', 'Share');
  await owner.waitForText('dialog h2', 'Shared project', 8000);
  await owner.waitForText('dialog .state', 'Connected', 8000);
  check('the project is shared, and connected', true);

  // ---- an invitation ----
  await owner.clickText('dialog button', 'Make an invitation code');
  await owner.waitFor('dialog .code', 5000);
  const code = (await owner.text('dialog .code')).trim();
  check('a code is made', /^[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/.test(code), code);
  await owner.screenshot('sharing-3-invitation');
  await owner.clickText('dialog footer button', 'Done');
  await owner.waitGone('dialog[open]');

  // The token is nowhere the window can see it.
  const told = await owner.execAsync(
    `return JSON.stringify(await window.__TAURI_INTERNALS__.invoke('project_list'));`,
  );
  const token = readFileSync(
    join(owner.dataDir, 'projects', JSON.parse(told)[0].id, 'sharing.key'),
    'utf8',
  ).trim();
  check('the token is kept on disk, and not told to the window', token.length === 64 && !told.includes(token));

  // ---- the guest joins ----
  await guest.waitForText('h2', 'Welcome to Glaukopis');
  await guest.clickText('button', 'or join a project');
  await guest.waitForText('dialog h2', 'Join a shared project');
  await guest.type('dialog input[name="server"]', address);
  await guest.type('dialog input[name="code"]', 'AAAA-BBBB-CCCC');
  await guest.type('dialog input[placeholder="As the others know you"]', 'Anna Lind');
  await guest.clickText('dialog footer button', 'Join');
  await guest.waitForText('dialog', 'The code is not valid', 5000);
  check('a wrong code is refused, in words', true);
  await guest.exec(`const i = document.querySelector('dialog input[name="code"]'); i.focus(); i.select();`);
  await guest.keys(code.toLowerCase().replaceAll('-', ' '));
  await guest.screenshot('sharing-4-join');
  await guest.clickText('dialog footer button', 'Join');
  await guest.waitFor('.diagram .node.root', 10000);
  const fetched = await until('the map to arrive', async () => {
    const t = await titles(guest);
    return t.length === 3 ? t : null;
  });
  check('the one who joins is given the project', fetched.includes('The word mênis') && fetched.includes('Reception'), fetched.join(' | '));
  const shownName = await guest.exec(`return document.querySelector('header .name').textContent.trim()`);
  check('under its name', shownName === 'Wrath and the hero', shownName);
  await guest.screenshot('sharing-5-joined');

  // ---- each sees the other ----
  await until('the owner to see the guest', () => owner.exists('header .presence .avatar'));
  await until('the guest to see the owner', () => guest.exists('header .presence .avatar'));
  check('the owner sees who is here', (await owner.text('header .presence .avatar')).trim() === 'AL');
  check('and so does the guest', (await guest.text('header .presence .avatar')).trim() === 'R');

  // ---- what one writes, the other sees ----
  await guest.click(await guest.findByText('.diagram .node', 'Reception'));
  await add(guest, 'Tab', 'Virgil');
  await until('the owner to see what the guest added', async () => (await titles(owner)).includes('Virgil'));
  check('an element added by one appears with the other', true);
  const where = await until('the owner to see where the guest is', () =>
    owner.exec(`const o = document.querySelector('.diagram .node .others .other');
                return o ? o.closest('.node').querySelector('.caption').textContent.trim() + ':' + o.textContent.trim() : null`),
  );
  check('and the element the other is at is marked', where === 'Virgil:AL', where);
  await owner.screenshot('sharing-5b-where');

  await owner.doubleClick(await owner.findByText('.diagram .node', 'The word mênis'));
  await owner.waitFor('.box .text .prose');
  await sleep(250);
  await owner.keys('The first word of the Iliad names a wrath.');
  await guest.doubleClick(await guest.findByText('.diagram .node', 'The word mênis'));
  await guest.waitFor('.box .text .prose');
  await until('the text to reach the guest', async () =>
    /names a wrath/.test(await guest.text('.box .text .prose')),
  );
  check('text written by one is read by the other', true);
  await sleep(300);
  await guest.click('.box .text .prose');
  await guest.keys([ 'Control', 'End' ]);
  await guest.keys(' It belongs to gods.');
  await until('the text to reach the owner', async () =>
    /belongs to gods/.test(await owner.text('.box .text .prose')),
  );
  const both = await owner.text('.box .text .prose');
  check('two write in the same text', /names a wrath/.test(both) && /belongs to gods/.test(both), both);
  await until('the cursor of the other', () => owner.exists('.box .ProseMirror-yjs-cursor'), 5000).then(
    () => check('the cursor of the other is shown, with the name', true),
    () => check('the cursor of the other is shown, with the name', false),
  );
  await owner.screenshot('sharing-6-together');
  await guest.screenshot('sharing-7-together-guest');

  // Undo takes back one's own, and not the other's.
  await owner.click('.box .text .prose');
  await owner.keys(['Control', 'z']);
  await sleep(400);
  const undone = await guest.text('.box .text .prose');
  check('undo takes back what one wrote oneself, and leaves the rest', /belongs to gods/.test(undone) && !/names a wrath/.test(undone), undone);
  await owner.keys(['Control', 'Shift', 'z']);
  await sleep(300);
  await owner.press('Escape');
  await guest.press('Escape');
  await owner.waitGone('.box');
  await guest.waitGone('.box');

  // ---- what the owner has written about a work goes with the project ----
  await owner.doubleClick(await owner.findByText('.diagram .node', 'Reception'));
  await owner.waitFor('.box .text .prose');
  await sleep(300);
  await owner.clickText('.box .tools button', 'Cite');
  await owner.waitFor('.picker input');
  await owner.keys('singer');
  await sleep(400);
  await owner.press('Enter');
  await owner.waitFor('.editor .locator input');
  await owner.press('Enter');
  await owner.waitGone('.editor');
  await sleep(300);
  await owner.press('Escape');
  await owner.waitGone('.box');
  await guest.doubleClick(await guest.findByText('.diagram .node', 'Reception'));
  await guest.waitFor('.box .text .citation', 8000);
  await sleep(500);
  await guest.click('.box .text .citation');
  await guest.waitFor('.editor .note-button.has', 5000);
  await guest.exec(`document.querySelector('.editor .note-button').click()`);
  await guest.waitFor('.notes textarea', 3000);
  await sleep(300);
  const came = await guest.exec(
    `return Array.from(document.querySelectorAll('.notes textarea')).map((t) => t.dataset.scope + ':' + t.value)`,
  );
  check('a note of the owner comes with the project, as a note of the project', came.join('|') === 'project:Formula and theme.', came.join('|'));
  await guest.click('.notes textarea');
  await guest.keys([ 'Control', 'End' ]);
  await guest.keys(' And the singer?');
  await guest.screenshot('sharing-7b-note');
  await guest.press('Escape');
  await guest.waitGone('.notes');
  await guest.press('Escape');
  await sleep(200);
  await guest.press('Escape');
  await guest.waitGone('.box');
  // The owner sees what the guest wrote, as a note of the project; the owner's own is as it was.
  await owner.keys(['Control', 'Shift', 'r']);
  await owner.waitFor('.panel .item', 5000);
  await sleep(300);
  await owner.exec(`document.querySelector('.panel .item .note-button').click()`);
  await owner.waitFor('.notes textarea', 3000);
  await sleep(400);
  const back = await owner.exec(
    `return Array.from(document.querySelectorAll('.notes textarea')).map((t) => t.dataset.scope + ':' + t.value)`,
  );
  check(
    'what a collaborator adds is a note of the project for both',
    back.join('|') === 'project:Formula and theme. And the singer?|all:Formula and theme.',
    back.join('|'),
  );
  await owner.press('Escape');
  await owner.waitGone('.notes');
  await owner.keys(['Control', 'Shift', 'r']);
  await sleep(300);

  // ---- a picture of one reaches the other ----
  const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
  const drawing =
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120"><rect width="240" height="120" fill="#f4efe6"/><circle cx="120" cy="60" r="40" fill="#7a2e2e"/></svg>';
  writeFileSync(join(desk, 'The shield.svg'), drawing);
  const dropOn = async (app, path, words) => {
    const at = await app.exec(
      `const n = Array.from(document.querySelectorAll('.diagram .node')).find((e) => e.textContent.includes(arguments[0]));
       const r = n.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
      words,
    );
    await app.execAsync(
      `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
       const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
       await emit('tauri://drag-enter', { paths: [arguments[0]], position });
       await emit('tauri://drag-over', { position });
       await emit('tauri://drag-drop', { paths: [arguments[0]], position });`,
      path,
      at.x,
      at.y,
    );
  };
  const room = JSON.parse(told)[0].id;
  const kept = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => !f.startsWith('.')) : []);
  await dropOn(owner, join(desk, 'The shield.svg'), 'Virgil');
  await until('the server to be given the picture', () => kept(join(serverData, 'rooms', room, 'files')).length === 1, 15000);
  check('a picture put into a shared project is sent to the server', true);
  await guest.doubleClick(await guest.findByText('.diagram .node', 'Virgil'));
  await guest.waitFor('.box .text figure.figure', 10000);
  await until('the picture to be shown to the guest', () =>
    guest.exec(`const i = document.querySelector('.box .text figure img'); return !!i && /^blob:/.test(i.src) && i.complete && i.naturalWidth > 0`),
    30000,
  );
  check('and is shown to the one who did not have it', true);
  const theirs = kept(join(guest.dataDir, 'projects', room, 'files'));
  check(
    'who has it as it was, under the name of what it holds',
    theirs.length === 1 && /^[0-9a-f]{64}\.svg$/.test(theirs[0]) && readFileSync(join(guest.dataDir, 'projects', room, 'files', theirs[0]), 'utf8') === drawing,
    theirs.join(', '),
  );
  await guest.click('.box .text figure figcaption');
  await guest.keys('The shield');
  await guest.screenshot('sharing-7c-figure');
  await guest.press('Escape');
  await sleep(200);
  await guest.press('Escape');
  await guest.waitGone('.box');
  rmSync(desk, { recursive: true, force: true });

  // ---- without the server ----
  server.kill('SIGTERM');
  await until('the owner to notice', async () => (await owner.attr('header .share', 'data-status')) === 'offline', 15000);
  await until('the guest to notice', async () => (await guest.attr('header .share', 'data-status')) === 'offline', 15000);
  check('both notice that the server is gone', true);
  await owner.click(await owner.findByText('.diagram .node', 'Reception'));
  await add(owner, 'Tab', 'Milton');
  await guest.click(await guest.findByText('.diagram .node', 'The word mênis'));
  await add(guest, 'Tab', 'The scholia');
  check('work goes on without it', (await titles(owner)).includes('Milton') && (await titles(guest)).includes('The scholia'));
  await owner.screenshot('sharing-8-offline');

  server = startServer();
  await serverAnswers();
  await until('the owner to be given what the guest wrote', async () => (await titles(owner)).includes('The scholia'), 45000);
  await until('the guest to be given what the owner wrote', async () => (await titles(guest)).includes('Milton'), 45000);
  check('when the server is back, each is given what the other wrote meanwhile', true);

  // ---- the owner sees who has the project, and removes the guest ----
  await owner.click('header .share button');
  await owner.waitForText('dialog .people', 'Anna Lind', 8000);
  await owner.screenshot('sharing-9-people');
  await owner.click('dialog .people button[aria-label="Remove Anna Lind"]');
  await owner.waitForText('dialog h2', 'Remove Anna Lind?');
  await sleep(300);
  await owner.clickText('dialog footer button', 'Remove');
  await guest.waitForText('dialog h2', 'You are no longer among the collaborators', 10000);
  await guest.screenshot('sharing-10-removed');
  await guest.clickText('dialog footer button', 'Understood');
  await guest.waitGone('dialog[open]');
  check('the one removed is told, and keeps the project', (await titles(guest)).includes('Milton'));
  check('which is no longer shared there', (await guest.attr('header .share', 'class')).includes('shared') === false);

  // ---- the owner stops sharing ----
  await owner.waitGone('dialog .people button[aria-label="Remove Anna Lind"]', 8000);
  await owner.clickText('dialog footer button', 'Stop sharing');
  await owner.waitForText('dialog h2', 'Stop sharing this project?');
  await sleep(300);
  // The question lies over the panel, which has a button of the same name.
  await owner.exec(`
    const asked = Array.from(document.querySelectorAll('dialog[open]')).find((d) => d.textContent.includes('Stop sharing this project?'));
    Array.from(asked.querySelectorAll('footer button')).find((b) => b.textContent.includes('Stop sharing')).click();`);
  await until('the sharing to end', async () => !(await owner.attr('header .share', 'class')).includes('shared'));
  const info = await fetch(`http://${address}/api/info`).then((r) => r.json());
  check('the server is still there', info.name === 'glaukopis-server');
  check('and holds the project no more', !existsSync(join(serverData, 'rooms', JSON.parse(told)[0].id)));
  await owner.screenshot('sharing-11-ended');

  for (const [who, app] of [['owner', owner], ['guest', guest]]) {
    const errors = (await app.pageErrors()).filter((e) => !/WebSocket|websocket|Failed to load resource/.test(e));
    check(`no errors in the window of the ${who}`, errors.length === 0, errors.join(' ‖ '));
  }
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await owner?.screenshot('sharing-failure-owner').catch(() => {});
  await guest?.screenshot('sharing-failure-guest').catch(() => {});
  console.error(serverLog.slice(-20).join(''));
} finally {
  await owner?.close();
  await guest?.close();
  server.kill('SIGTERM');
  await sleep(200);
  rmSync(serverData, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
