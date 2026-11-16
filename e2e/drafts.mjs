// What is written in a field and not yet sent (record 0094): the real
// server, and the application with a data directory of its own, run twice.
// A message begun in the chat of a shared project, of two lines, is there
// when another tab of the document pane has been shown, when the pane has
// been closed, and when the library has been gone to and the project come
// back to; so are an answer under a comment, a comment that is being begun
// and a note that is being changed. All of it is there when the application
// has been closed and opened again. A message sent leaves the field empty,
// and empty it stays; a comment whose beginning is cancelled is gone, an
// answer sent leaves its field empty, a change given up leaves the note as
// it was.

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

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-drafts-'));
const NAME = 'Wrath and the hero';
const MESSAGE = 'Shall we begin\nwith the proem?';
const ANSWER = 'It is, but only its first line';
const COMMENT = 'Needs a word on the scholia';
const CHANGED = 'Is this the whole proem?';

const chatTab = '[data-document-pane] .side-tabs [data-kind="chat"]';
const field = '[data-chat-field]';
const answering = '.thread .answering textarea';
const beginning = '[data-comment-beginning] textarea';
const changing = '.thread textarea[data-note-edit]';

/**
 * What stands in a field; null where the field is not there. The field of
 * the chat is an editor of its own (record 0107): its lines, joined by line
 * breaks.
 */
const valueOf = (app, selector) =>
  app.exec(
    `const el = document.querySelector(arguments[0]);
     if (!el) return null;
     if (typeof el.value === 'string') return el.value;
     return Array.from(el.querySelectorAll('p')).map((p) => p.textContent).join('\\n');`,
    selector,
  );
/** How high a field stands, in pixels. */
const heightOf = (app, selector) =>
  app.exec(`return document.querySelector(arguments[0])?.getBoundingClientRect().height ?? 0`, selector);
/** The words of the messages of the chat shown. */
const messages = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('[data-chat] [data-chat-message] .text')).map((p) => p.textContent)`);
/** The words of the notes of the comments shown. */
const notes = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('.thread .note p.text')).map((p) => p.textContent.trim())`);

/** Opens the document pane, where it is closed, by the Document button of the side. */
async function openPane(app) {
  if (await app.exists('[data-document-pane]')) return;
  await app.click('[data-bar] [data-document]');
  await app.waitFor('[data-document-pane]', 5000);
  await sleep(200);
}

/** Shows the chat in the document pane, with its field: there once the project is in touch with the server. */
async function showChat(app) {
  await openPane(app);
  await app.waitFor(chatTab, 10000);
  if (!(await app.exists(`${chatTab}[aria-selected="true"]`))) await app.click(chatTab);
  await app.waitFor('[data-chat]', 5000);
  await app.waitFor(field, 10000);
  await sleep(200);
}

/** Shows the comments in the document pane. */
async function showComments(app) {
  await openPane(app);
  await app.documentPane('comments');
  await sleep(200);
}

/** What is written and not sent in the comments shown: the comment being begun, the answer, the note being changed. */
const unsent = async (app) => ({
  on: await app.exec(`return document.querySelector('[data-comment-beginning] .on')?.textContent.trim() ?? null`),
  comment: await valueOf(app, beginning),
  answer: await valueOf(app, answering),
  change: await valueOf(app, changing),
});
const allThere = (u) =>
  u.on === 'On “The word mênis”' && u.comment === COMMENT && u.answer === ANSWER && u.change === CHANGED;

let app;
let projectId;
try {
  // ---- Run 1: a shared project, and things begun in it ----
  app = await App.launch({ dataDir, keepData: true, width: 1280, height: 820 });
  await app.installErrorHook();
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', NAME);
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.click('.diagram .node.root');
  await app.keys(['Alt', 'Shift', 'Enter']);
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The word mênis');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);

  await app.shareWindow();
  await app.waitForText('dialog h2', 'Share this project');
  await app.type('dialog input[placeholder="glaukopis.example.org"]', address);
  await app.click('dialog input[placeholder="As the others know you"]');
  await app.waitFor('dialog input[type="password"]', 5000);
  await app.keys('Robert');
  await app.type('dialog input[type="password"]', 'sesame');
  await app.clickText('dialog footer button', 'Share');
  await app.waitForText('dialog h2', 'Shared project', 8000);
  await app.waitForText('dialog .state', 'Connected', 8000);
  await app.clickText('dialog footer button', 'Done');
  await app.waitGone('dialog[open]');
  projectId = decodeURIComponent((await app.exec('return location.hash')).split('/')[2].split('?')[0]);

  // ---- a message begun in the chat ----
  await showChat(app);
  const empty = await heightOf(app, field);
  await app.click(field);
  await app.keys('Shall we begin');
  await app.keys(['Shift', 'Enter']);
  await app.keys('with the proem?');
  check('a message of two lines is begun, and not sent', (await valueOf(app, field)) === MESSAGE && (await messages(app)).length === 0);
  const grown = await heightOf(app, field);
  check('the field has grown with it', grown > empty + 8, `${empty} px, then ${grown} px`);
  await app.screenshot('drafts-1-begun');

  await app.documentPane('references');
  check('another tab of the pane is shown', !(await app.exists('[data-chat]')));
  await showChat(app);
  check('the message is there when the chat is shown again', (await valueOf(app, field)) === MESSAGE, JSON.stringify(await valueOf(app, field)));
  check('in a field as high as it was', Math.abs((await heightOf(app, field)) - grown) < 2, `${await heightOf(app, field)} px`);

  await app.click('[data-bar] [data-document]');
  await app.waitGone('[data-document-pane]', 3000);
  await showChat(app);
  check('and when the pane has been closed and opened', (await valueOf(app, field)) === MESSAGE);

  await app.go('#/library');
  await app.waitGone('.project', 5000);
  await sleep(500);
  await app.go(`#/project/${encodeURIComponent(projectId)}`);
  await app.waitFor('.diagram .node.root, .text-view .section', 10000);
  await showChat(app);
  check('and when the library has been gone to, and the project come back to', (await valueOf(app, field)) === MESSAGE, JSON.stringify(await valueOf(app, field)));
  await app.screenshot('drafts-2-back-from-library');

  // ---- in the comments: a thread, an answer begun, a comment begun, a note being changed ----
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const comment = async () => {
    await app.rightClick(await app.findByText('.diagram .node', 'The word mênis'));
    await app.waitFor('.menu');
    await sleep(150);
    await app.clickText('.menu [role="menuitem"]', 'Comment…');
    await app.waitFor(beginning, 3000);
    await sleep(150);
  };
  await comment();
  await app.keys('Is this the proem?');
  await app.press('Enter');
  await app.waitFor('.thread', 3000);
  await sleep(300);
  check('a comment made leaves nothing being begun', !(await app.exists(beginning)));

  await app.click(answering);
  await app.keys(ANSWER);
  // The tools of one's own note come when the pointer rests on it.
  await app.hover('.thread .note');
  await sleep(150);
  await app.click('.thread .note .own button[aria-label="Change"]');
  await app.waitFor(changing, 3000);
  await sleep(150);
  await app.keys(['Control', 'a']);
  await app.keys(CHANGED);
  await comment();
  await app.keys(COMMENT);
  let u = await unsent(app);
  check('an answer, a comment and a change of a note are begun, none of them sent', allThere(u) && (await notes(app)).length === 0, JSON.stringify(u));
  await app.screenshot('drafts-3-comments-begun');

  await showChat(app);
  check('the chat is shown, with its message still', (await valueOf(app, field)) === MESSAGE);
  await showComments(app);
  u = await unsent(app);
  check('all three are there when the comments are shown again', allThere(u), JSON.stringify(u));

  await app.go('#/library');
  await app.waitGone('.project', 5000);
  await sleep(500);
  await app.go(`#/project/${encodeURIComponent(projectId)}`);
  await app.waitFor('.diagram .node.root, .text-view .section', 10000);
  await showComments(app);
  await app.waitFor('.thread', 5000);
  u = await unsent(app);
  check('and when the library has been gone to, and the project come back to', allThere(u), JSON.stringify(u));

  // ---- Run 2: the application closed and opened again ----
  await app.quit();
  app = await App.launch({ dataDir, keepData: true, width: 1280, height: 820 });
  await app.installErrorHook();
  await app.waitFor('.project', 10000);
  await app.waitFor('.diagram .node.root, .text-view .section', 10000);
  await showChat(app);
  check('the message is there when the application has been closed and opened', (await valueOf(app, field)) === MESSAGE, JSON.stringify(await valueOf(app, field)));
  check('in a field as high as it was', Math.abs((await heightOf(app, field)) - grown) < 2, `${await heightOf(app, field)} px`);
  await app.screenshot('drafts-4-opened-again');
  await showComments(app);
  await app.waitFor('.thread', 5000);
  u = await unsent(app);
  check('so are the answer, the comment being begun and the change of the note', allThere(u), JSON.stringify(u));
  await app.screenshot('drafts-5-comments-opened-again');

  // ---- sent, or given up, it is kept no more ----
  await showChat(app);
  await app.click(field);
  await app.press('Enter');
  await until('the message to stand in the chat', async () => (await messages(app)).length === 1);
  check('the message is sent as it was written', (await messages(app))[0] === MESSAGE, JSON.stringify(await messages(app)));
  check('and the field is empty', (await valueOf(app, field)) === '');
  check('and as low as an empty one', Math.abs((await heightOf(app, field)) - empty) < 2, `${await heightOf(app, field)} px`);

  await showComments(app);
  await app.clickText('[data-comment-beginning] button', 'Cancel');
  await app.waitGone(beginning, 3000);
  await app.click(answering);
  await app.press('Enter');
  await until('the answer to stand under the note', async () => (await notes(app)).length === 1);
  check('the answer is sent as it was written', (await notes(app))[0] === ANSWER, JSON.stringify(await notes(app)));
  const cancel = await app.exec(
    `return Array.from(document.querySelectorAll('.thread .note .buttons button')).find((b) => b.textContent.trim() === 'Cancel')`,
  );
  await app.click(cancel);
  await app.waitGone(changing, 3000);
  await sleep(200);
  check('the change given up leaves the note as it was', (await notes(app))[0] === 'Is this the proem?', JSON.stringify(await notes(app)));

  await showChat(app);
  check('the field of the chat stays empty', (await valueOf(app, field)) === '');
  await showComments(app);
  u = await unsent(app);
  check(
    'and nothing is being begun, answered or changed in the comments',
    u.on === null && u.comment === null && u.answer === '' && u.change === null,
    JSON.stringify(u),
  );
  await app.screenshot('drafts-6-sent');

  const errors = (await app.pageErrors()).filter((e) => !/WebSocket|websocket|Failed to load resource/.test(e));
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app?.screenshot('drafts-failure').catch(() => {});
  console.error(serverLog.slice(-20).join(''));
} finally {
  await app?.close();
  server.kill('SIGTERM');
  await sleep(200);
  rmSync(serverData, { recursive: true, force: true });
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(`${dataDir}-config`, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
