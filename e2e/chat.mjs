// The chat of a shared project (record 0092): the real server, and the
// application running twice, each with a data directory of its own. Neither
// has the tab of the chat before the project is shared, both have it after;
// a message of the owner is told to the guest by a toast and a dot on the
// Document button, and Show opens the chat; an answer of two lines reaches
// the owner; the owner's message, deleted, goes for both; undo in the text
// takes no message back; the messages are there when the project is opened
// again.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
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
    await sleep(120);
  }
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
server.stdout.on('data', (d) => serverLog.push(String(d)));
for (let i = 0; ; i++) {
  try {
    const r = await fetch(`http://${address}/api/info`);
    if (r.ok) break;
  } catch {
    if (i > 60) throw new Error(`the server did not answer:\n${serverLog.join('')}`);
    await sleep(100);
  }
}

const NAME = 'Wrath and the hero';
const chatTab = '[data-document-pane] .side-tabs [data-kind="chat"]';
/** The words of the messages of the chat shown, as they stand. */
const messages = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('[data-chat] [data-chat-message] .text')).map((p) => p.textContent)`);
/** Whether a toast says these words. */
const toastWith = (app, words) =>
  app.exec(`return Array.from(document.querySelectorAll('.toast')).some((t) => t.textContent.includes(arguments[0]))`, words);

/** Opens the document pane, where it is closed, by the Document button of the side. */
async function openPane(app) {
  if (await app.exists('[data-document-pane]')) return;
  await app.click('[data-bar] [data-document]');
  await app.waitFor('[data-document-pane]', 5000);
  await sleep(200);
}

/** Shows the chat in the document pane. */
async function showChat(app) {
  await openPane(app);
  if (!(await app.exists(`${chatTab}[aria-selected="true"]`))) await app.click(chatTab);
  await app.waitFor('[data-chat]', 5000);
  await sleep(200);
}

/** What the palette finds first for some words, with nothing done. */
async function palette(app, words) {
  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await sleep(200);
  await app.keys(words);
  await sleep(200);
  const first = await app.exec(`return document.querySelector('dialog[open] li.active .label')?.textContent.trim() ?? null`);
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000);
  return first;
}

let owner;
let guest;
try {
  owner = await App.launch({ width: 1280, height: 820 });
  guest = await App.launch({ width: 1280, height: 820 });
  await owner.installErrorHook();
  await guest.installErrorHook();

  // ---- the owner makes a project, which has no chat while it is not shared ----
  await owner.beginProject();
  await owner.waitFor('dialog input');
  await owner.type('dialog input', NAME);
  await owner.clickText('dialog footer button', 'Create');
  await owner.waitFor('.text-view .section', 8000);
  await owner.view('diagram');
  await owner.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await owner.click('.diagram .node.root');
  await owner.keys(['Alt', 'Shift', 'Enter']);
  await owner.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await owner.keys('The word mênis');
  await owner.press('Enter');
  await owner.waitGone('.diagram .node.renaming', 3000);

  await openPane(owner);
  check('a project that is not shared has no tab of the chat', !(await owner.exists(chatTab)));
  check('nor does the palette find it', (await palette(owner, 'chat')) !== 'Chat');
  await owner.click('[data-bar] [data-document]');
  await owner.waitGone('[data-document-pane]', 3000);

  // ---- the owner shares it, and the guest joins ----
  await owner.shareWindow();
  await owner.waitForText('dialog h2', 'Share this project');
  await owner.type('dialog input[placeholder="glaukopis.example.org"]', address);
  await owner.click('dialog input[placeholder="As the others know you"]');
  await owner.waitFor('dialog input[type="password"]', 5000);
  await owner.keys('Robert');
  await owner.type('dialog input[type="password"]', 'sesame');
  await owner.clickText('dialog footer button', 'Share');
  await owner.waitForText('dialog h2', 'Shared project', 8000);
  await owner.waitForText('dialog .state', 'Connected', 8000);
  await owner.clickText('dialog button', 'Make an invitation code');
  await owner.waitFor('dialog .code', 5000);
  const code = (await owner.text('dialog .code')).trim();
  await owner.clickText('dialog footer button', 'Done');
  await owner.waitGone('dialog[open]');

  await guest.waitForText('h2', 'Welcome to Glaukopis');
  await guest.clickText('button', 'Join a shared project');
  await guest.waitForText('dialog h2', 'Join a shared project');
  await guest.type('dialog input[name="server"]', address);
  await guest.type('dialog input[name="code"]', code);
  await guest.type('dialog input[placeholder="As the others know you"]', 'Anna Lind');
  await guest.clickText('dialog footer button', 'Join');
  await guest.waitFor('.diagram .node.root', 10000);
  await until('the map to arrive', () =>
    guest.exec(`return Array.from(document.querySelectorAll('.diagram .node .caption')).some((e) => e.textContent.includes('The word mênis'))`),
  );

  await openPane(owner);
  check('once it is shared, the owner has the tab of the chat', await owner.exists(chatTab));
  check('and the palette finds it', (await palette(owner, 'chat')) === 'Chat');
  await openPane(guest);
  check('so has the one who joined', await guest.exists(chatTab));
  // The guest leaves the pane closed, at another tab, so that the chat is not shown.
  await guest.documentPane('references');
  await guest.click('[data-bar] [data-document]');
  await guest.waitGone('[data-document-pane]', 3000);

  // ---- the owner writes; the guest is told ----
  await showChat(owner);
  await owner.click('[data-chat-field]');
  await owner.keys('Shall we begin with the proem?');
  await owner.press('Enter');
  await until('the owner to see the message', async () => (await messages(owner)).length === 1);
  check(
    'the owner sees the message, under their name',
    (await owner.text('[data-chat] [data-chat-name]')) === 'Robert' &&
      (await messages(owner))[0] === 'Shall we begin with the proem?',
  );
  check('and the field is empty again', (await owner.exec(`return document.querySelector('[data-chat-field]').value`)) === '');
  await owner.screenshot('chat-1-owner');

  await until('the toast to come to the guest', () => toastWith(guest, 'Robert: Shall we begin'), 10000);
  check('the guest is told who wrote what, at the foot of the window', true);
  check('and a dot stands on the Document button', await guest.exists('[data-bar] [data-document] [data-chat-unread]'));
  await guest.screenshot('chat-2-guest-told');
  await guest.exec(
    `const toast = Array.from(document.querySelectorAll('.toast')).find((t) => t.textContent.includes('Robert: Shall we begin'));
     Array.from(toast.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Show').click();`,
  );
  await guest.waitFor('[data-chat]', 5000);
  check('Show opens the chat', await guest.exists(`${chatTab}[aria-selected="true"]`));
  check(
    'where the guest sees who wrote it and what',
    (await guest.text('[data-chat] [data-chat-name]')) === 'Robert' &&
      (await messages(guest))[0] === 'Shall we begin with the proem?',
  );
  await guest.waitGone('[data-bar] [data-document] [data-chat-unread]', 5000).then(
    () => check('and the dot goes, the message being read', true),
    () => check('and the dot goes, the message being read', false),
  );
  check('as does the count on the tab', !(await guest.exists(`${chatTab} .count`)));
  await guest.screenshot('chat-3-guest-panel');

  // ---- the guest answers in two lines ----
  await guest.click('[data-chat-field]');
  await guest.keys('Yes, with the wrath.');
  await guest.keys(['Shift', 'Enter']);
  await guest.keys('Then the quarrel.');
  check('Shift+Enter makes a new line, and sends nothing', (await messages(guest)).length === 1);
  await guest.press('Enter');
  await until('the answer to reach the owner', async () => (await messages(owner)).length === 2, 10000);
  const answer = (await messages(owner))[1];
  check('the owner sees the answer, with both its lines', answer === 'Yes, with the wrath.\nThen the quarrel.', JSON.stringify(answer));
  check('and is told nothing, the chat being shown', !(await toastWith(owner, 'Anna Lind:')));
  await owner.screenshot('chat-4-owner-answered');

  // ---- the owner deletes their message ----
  const others = await owner.exec(
    `return Array.from(document.querySelectorAll('[data-chat] [data-chat-message]')).map((m) => !!m.querySelector('[data-chat-message-menu]'))`,
  );
  check('only one’s own message has a menu', JSON.stringify(others) === '[true,false]', JSON.stringify(others));
  const mine = await owner.findByText('[data-chat] [data-chat-message]', 'Shall we begin');
  await owner.rightClick(mine);
  await owner.waitFor('.menu', 3000);
  await sleep(150);
  await owner.clickText('.menu [role="menuitem"]', 'Delete');
  await until('the message to go for the owner', async () => (await messages(owner)).length === 1);
  await until('and for the guest', async () => (await messages(guest)).length === 1, 10000);
  check('a message deleted goes for both', (await messages(guest))[0].startsWith('Yes, with the wrath.'));

  // ---- undo in the text takes no message back ----
  await guest.doubleClick(await guest.findByText('.diagram .node', 'The word mênis'));
  await guest.waitFor('.box .text .prose');
  await sleep(300);
  await guest.click('.box .text .prose');
  await guest.keys('Sing, goddess.');
  await sleep(700);
  for (let i = 0; i < 4; i++) {
    await guest.keys(['Control', 'z']);
    await sleep(150);
  }
  await sleep(300);
  const after = await messages(guest);
  check('Ctrl+Z in the text takes no message back', after.length === 1 && after[0].startsWith('Yes, with the wrath.'), JSON.stringify(after));
  check('and still undoes the text', !/Sing, goddess/.test(await guest.text('.box .text .prose')));
  await guest.press('Escape');
  await guest.waitGone('.box', 3000).catch(() => {});

  // ---- the messages are there when the project is opened again ----
  await guest.openProject(NAME);
  await guest.waitFor('.diagram .node.root, .text-view .section', 10000);
  await sleep(500);
  await showChat(guest);
  await until('the messages to be shown', async () => (await messages(guest)).length === 1, 10000);
  check('the messages are there when the project is opened again', (await messages(guest))[0] === 'Yes, with the wrath.\nThen the quarrel.');
  await guest.screenshot('chat-5-guest-again');

  for (const [who, app] of [['owner', owner], ['guest', guest]]) {
    const errors = (await app.pageErrors()).filter((e) => !/WebSocket|websocket|Failed to load resource/.test(e));
    check(`no errors in the window of the ${who}`, errors.length === 0, errors.join(' ‖ '));
  }
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await owner?.screenshot('chat-failure-owner').catch(() => {});
  await guest?.screenshot('chat-failure-guest').catch(() => {});
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
