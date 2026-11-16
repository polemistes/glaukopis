// The chat answered, set, marked and changed (record 0107): the real
// server, and the application running twice, each with a data directory of
// its own. An answer stands under its message for both, and an answer to
// the answer after it; bold set by its key in the field is bold for the
// other; an emoji chosen from the picker stands in the message; a reaction
// given by one is shown to both with its count, and taken back; the writer
// sees the other's circle on a message once the other has shown the chat,
// and not before; a message changed says changed for both; with the list
// at its foot and an answer arriving far up, the button of what is new is
// there and leads to it; what is written with a mark and an answering is
// there again after another tab; in Norwegian the new words are Norwegian;
// no errors in the page.

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
const FIRST = 'Shall we begin with the proem?';
const chatTab = '[data-document-pane] .side-tabs [data-kind="chat"]';

/** The words of the messages of the chat shown, as they stand. */
const messages = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('[data-chat] [data-chat-message] .text')).map((p) => p.textContent)`);

/** The element of the message whose words are these; null where there is none. */
const rowOf = (app, words) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-chat] [data-chat-message]')).find((m) => m.querySelector('.text')?.textContent === arguments[0]) ?? null`,
    words,
  );

/** The id of the message whose words are these. */
const idOf = (app, words) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-chat] [data-chat-message]')).find((m) => m.querySelector('.text')?.textContent === arguments[0])?.dataset.chatMessage ?? null`,
    words,
  );

/** The words of the answers that stand under a message, by its id. */
const answersTo = (app, id) =>
  app.exec(
    `const under = Array.from(document.querySelectorAll('[data-chat] [data-chat-answers]')).find((e) => e.dataset.chatAnswers === arguments[0]);
     return under ? Array.from(under.querySelectorAll('[data-chat-message] .text')).map((p) => p.textContent) : [];`,
    id,
  );

/** What a part of the message whose words are these says, by a script given the message as `m`. */
const ofMessage = (app, words, body) =>
  app.exec(
    `const m = Array.from(document.querySelectorAll('[data-chat] [data-chat-message]')).find((m) => m.querySelector('.text')?.textContent === arguments[0]);
     if (!m) return null;
     ${body}`,
    words,
  );

/** The reactions to a message: each emoji, how many gave it, and whether one's own is among them. */
const chipsOn = (app, words) =>
  ofMessage(
    app,
    words,
    `return Array.from(m.querySelectorAll('[data-chat-reaction]')).map((c) => ({ emoji: c.dataset.chatReaction, count: c.querySelector('.count')?.textContent ?? '', mine: c.classList.contains('mine') }));`,
  );

/** The initials in the circles of who has read a message. */
const readersOn = (app, words) =>
  ofMessage(app, words, `return Array.from(m.querySelectorAll('[data-chat-reader]')).map((c) => c.textContent.trim());`);

/** What stands in the field of the chat: its lines joined by line breaks. */
const fieldText = (app) =>
  app.exec(
    `const f = document.querySelector('[data-chat-field]');
     return f ? Array.from(f.querySelectorAll('p')).map((p) => p.textContent).join('\\n') : null;`,
  );

/** Opens the document pane, where it is closed, by the Document button of the side. */
async function openPane(app) {
  if (await app.exists('[data-document-pane]')) return;
  await app.click('[data-bar] [data-document]');
  await app.waitFor('[data-document-pane]', 5000);
  await sleep(200);
}

/** Shows the chat in the document pane, with its field. */
async function showChat(app) {
  await openPane(app);
  await app.waitFor(chatTab, 10000);
  if (!(await app.exists(`${chatTab}[aria-selected="true"]`))) await app.click(chatTab);
  await app.waitFor('[data-chat]', 5000);
  await app.waitFor('[data-chat-field]', 10000);
  await sleep(200);
}

/** Chooses an item of the right-click menu of the message whose words are these. */
async function menuOn(app, words, item) {
  const row = await until(`the message “${words}”`, () => rowOf(app, words));
  await app.exec(`arguments[0].scrollIntoView({ block: 'center' })`, row);
  await sleep(150);
  await app.rightClick(row);
  await app.waitFor('.menu', 3000);
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', item);
  await sleep(200);
}

/** Writes in the field and sends it with Enter. */
async function say(app, words) {
  await app.click('[data-chat-field]');
  await app.keys(words);
  await app.press('Enter');
}

/** Chooses the first emoji the picker shows, and returns it. */
async function pickEmoji(app) {
  await app.waitFor('[data-emoji-picker] [data-emoji]', 5000);
  await sleep(200);
  const emoji = await app.exec(`return document.querySelector('[data-emoji-picker] [data-emoji]').dataset.emoji`);
  await app.click('[data-emoji-picker] [data-emoji]');
  await sleep(200);
  return emoji;
}

let owner;
let guest;
try {
  owner = await App.launch({ width: 1280, height: 820 });
  guest = await App.launch({ width: 1280, height: 820 });
  await owner.installErrorHook();
  await guest.installErrorHook();

  // ---- the owner makes a project and shares it; the guest joins ----
  await owner.beginProject();
  await owner.waitFor('dialog input');
  await owner.type('dialog input', NAME);
  await owner.clickText('dialog footer button', 'Create');
  await owner.waitFor('.text-view .section', 8000);
  await owner.view('diagram');
  await owner.waitFor('.diagram .node.root', 8000);
  await sleep(300);

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
  await sleep(500);

  await showChat(owner);
  await showChat(guest);

  // ---- an answer stands under its message, and an answer to the answer after it ----
  await say(owner, FIRST);
  await until('the first message to reach the guest', async () => (await messages(guest)).includes(FIRST), 10000);
  const first = await idOf(owner, FIRST);
  check('the first message has the same id for both', !!first && first === (await idOf(guest, FIRST)));

  await menuOn(guest, FIRST, 'Answer');
  await guest.waitFor('[data-chat-answering]', 3000);
  const line = await guest.text('[data-chat-answering]');
  check('Answer puts a line over the field that names whom and what is answered', line.includes('Answer to Robert') && line.includes(FIRST), line);
  await guest.keys('Yes, with the wrath.');
  await guest.press('Enter');
  await guest.waitGone('[data-chat-answering]', 3000);
  await until('the answer to reach the owner', async () => (await answersTo(owner, first)).length === 1, 10000);
  check('the answer stands under its message for the one who wrote it', JSON.stringify(await answersTo(guest, first)) === '["Yes, with the wrath."]');
  check('and for the other', JSON.stringify(await answersTo(owner, first)) === '["Yes, with the wrath."]');

  await menuOn(owner, 'Yes, with the wrath.', 'Answer');
  await owner.waitFor('[data-chat-answering]', 3000);
  const again = await owner.text('[data-chat-answering]');
  check('Answer on an answer names that answer and its writer', again.includes('Answer to Anna Lind') && again.includes('Yes, with the wrath.'), again);
  await owner.keys('Then the quarrel.');
  await owner.press('Enter');
  await until('the answer to the answer to reach the guest', async () => (await answersTo(guest, first)).length === 2, 10000);
  check(
    'an answer to the answer stands after it, under the first message, for both',
    JSON.stringify(await answersTo(guest, first)) === '["Yes, with the wrath.","Then the quarrel."]' &&
      JSON.stringify(await answersTo(owner, first)) === '["Yes, with the wrath.","Then the quarrel."]',
    JSON.stringify(await answersTo(guest, first)),
  );
  await owner.screenshot('chat-answers-1-answered');

  // ---- bold by its key ----
  await owner.click('[data-chat-field]');
  await owner.keys(['Control', 'b']);
  await owner.keys('Bold words');
  await owner.keys(['Control', 'b']);
  await owner.keys(' and plain');
  await owner.press('Enter');
  await until('the bold message to reach the guest', async () => (await messages(guest)).includes('Bold words and plain'), 10000);
  const bold = await ofMessage(guest, 'Bold words and plain', `return Array.from(m.querySelectorAll('.text strong')).map((s) => s.textContent).join('|');`);
  check('bold set by its key in the field is bold for the other', bold === 'Bold words', bold);

  // ---- an emoji from the picker ----
  await owner.click('[data-chat-field]');
  await owner.click('[data-chat-emoji]');
  const emoji = await pickEmoji(owner);
  await owner.press('Escape');
  await owner.waitGone('[data-emoji-picker]', 3000);
  await owner.keys(' fine');
  await owner.press('Enter');
  await until('the emoji to reach the guest', async () => (await messages(guest)).includes(`${emoji} fine`), 10000);
  check('an emoji chosen from the picker stands in the message', true, emoji);
  await guest.screenshot('chat-answers-2-set');

  // ---- a reaction, given and taken back ----
  await menuOn(guest, FIRST, 'React');
  const reaction = await pickEmoji(guest);
  await guest.waitGone('[data-emoji-picker]', 3000).catch(() => {});
  await until('the reaction to reach the owner', async () => ((await chipsOn(owner, FIRST)) ?? []).length === 1, 10000);
  const theirs = await chipsOn(owner, FIRST);
  const mine = await chipsOn(guest, FIRST);
  check(
    'a reaction given by one is shown to both with its count',
    theirs[0].emoji === reaction && theirs[0].count === '1' && mine[0]?.count === '1',
    JSON.stringify({ theirs, mine }),
  );
  check('as one’s own to the one who gave it, and not to the other', mine[0]?.mine === true && theirs[0].mine === false);
  await guest.screenshot('chat-answers-3-reaction');
  const chip = await ofMessage(guest, FIRST, `return m.querySelector('[data-chat-reaction]');`);
  await guest.click(chip);
  await until('the reaction to go for the owner', async () => ((await chipsOn(owner, FIRST)) ?? []).length === 0, 10000);
  check('and pressed again it is taken back, for both', ((await chipsOn(guest, FIRST)) ?? []).length === 0);

  // ---- who has read ----
  await guest.documentPane('references');
  await say(owner, 'Are you there?');
  await sleep(1500);
  check('the writer sees no circle on a message the other has not shown', ((await readersOn(owner, 'Are you there?')) ?? []).length === 0, JSON.stringify(await readersOn(owner, 'Are you there?')));
  await showChat(guest);
  await until('the circle of the other to come', async () => ((await readersOn(owner, 'Are you there?')) ?? []).includes('AL'), 10000);
  check('and sees the other’s circle once the other has shown the chat', true);
  const label = await ofMessage(owner, 'Are you there?', `return m.querySelector('[data-chat-read]').getAttribute('aria-label');`);
  check('which says who has read it', label === 'Read by Anna Lind', label);
  check('the reader sees no circle of their own', !((await readersOn(guest, 'Are you there?')) ?? []).includes('AL'));
  await owner.screenshot('chat-answers-4-read');

  // ---- a message changed ----
  await menuOn(owner, 'Are you there?', 'Change');
  await owner.waitFor('[data-chat-editing]', 3000);
  check('Change takes the message into the field', (await fieldText(owner)) === 'Are you there?', await fieldText(owner));
  await owner.keys(['Control', 'a']);
  await owner.keys('Are you still there?');
  await owner.press('Enter');
  await owner.waitGone('[data-chat-editing]', 3000);
  await until('the change to reach the guest', async () => (await messages(guest)).includes('Are you still there?'), 10000);
  const changed = async (app) => ofMessage(app, 'Are you still there?', `return m.querySelector('[data-chat-edited]')?.textContent.trim() ?? null;`);
  check('a message changed says changed for both', (await changed(owner)) === 'changed' && (await changed(guest)) === 'changed');
  check('and stands where it stood', !(await messages(owner)).includes('Are you there?'));
  check('the field is empty again after the change', (await fieldText(owner)) === '');

  // ---- an answer far up, and the button of what is new ----
  await owner.click('[data-chat-field]');
  for (let i = 1; i <= 40; i++) {
    await owner.keys(`Line ${i} of the catalogue`);
    await owner.press('Enter');
  }
  await until('the catalogue to reach the guest', async () => (await messages(guest)).includes('Line 40 of the catalogue'), 20000);
  await sleep(500);
  const atFoot = await guest.exec(
    `const b = document.querySelector('[data-chat] .body'); return b.scrollHeight - b.scrollTop - b.clientHeight < 24 && b.scrollHeight > b.clientHeight;`,
  );
  check('the list of the one who reads is long, and stayed at its foot as the lines arrived', atFoot);
  if (!atFoot) {
    // So that what follows is still tried.
    await guest.exec(`const b = document.querySelector('[data-chat] .body'); b.scrollTop = b.scrollHeight;`);
    await sleep(300);
  }
  await menuOn(owner, FIRST, 'Answer');
  await owner.keys('Far up');
  await owner.press('Enter');
  await until('the answer far up to reach the guest', async () => (await answersTo(guest, first)).includes('Far up'), 10000);
  await guest.waitFor('[data-chat-new-button]', 5000).then(
    () => check('the button of what is new is there', true),
    () => check('the button of what is new is there', false),
  );
  const button = await guest.exec(
    `const b = document.querySelector('[data-chat-new-button]');
     return b ? { text: b.textContent.trim(), up: !!b.querySelector('svg[class*="arrow-up"]') } : null;`,
  );
  check('it says what is new, with an arrow up', !!button && /new message/.test(button.text) && button.up, JSON.stringify(button));
  await guest.screenshot('chat-answers-5-new');
  for (let i = 0; i < 5 && (await guest.exists('[data-chat-new-button]')); i++) {
    await guest.click('[data-chat-new-button]');
    await sleep(400);
  }
  const inView = await ofMessage(
    guest,
    'Far up',
    `const list = document.querySelector('[data-chat] .body').getBoundingClientRect();
     const at = m.getBoundingClientRect();
     return at.bottom > list.top && at.top < list.bottom;`,
  );
  check('and leads to the answer far up', inView);
  check('which is no longer counted, and the button goes', !(await guest.exists('[data-chat-new-button]')));
  check('the new answer has its bar', !!(await ofMessage(guest, 'Far up', `return m.hasAttribute('data-chat-new');`)));

  // ---- what is written with a mark and an answering, after another tab ----
  await menuOn(guest, FIRST, 'Answer');
  await guest.waitFor('[data-chat-answering]', 3000);
  await guest.keys(['Control', 'i']);
  await guest.keys('Half an answer');
  await sleep(300);
  await guest.documentPane('references');
  check('another tab is shown', !(await guest.exists('[data-chat]')));
  await showChat(guest);
  const kept = await guest.exec(
    `return { answering: document.querySelector('[data-chat-answering]')?.textContent ?? null, em: document.querySelector('[data-chat-field] em')?.textContent ?? null }`,
  );
  check(
    'what is written with a mark and an answering is there again after another tab',
    !!kept.answering && kept.answering.includes('Robert') && kept.em === 'Half an answer',
    JSON.stringify(kept),
  );
  await guest.click('[data-chat-field]');
  await guest.press('Escape');
  await guest.waitGone('[data-chat-answering]', 3000);
  check('Escape gives the answering up and keeps what is written', (await fieldText(guest)) === 'Half an answer');
  await guest.keys(['Control', 'a']);
  await guest.press('Backspace');

  // ---- in Norwegian ----
  await guest.keys(['Control', ',']);
  await guest.waitForText('h2', 'Language', 5000);
  await sleep(300);
  await guest.exec(
    `const f = Array.from(document.querySelectorAll('.field')).find((f) => f.querySelector('label')?.textContent.trim() === 'The interface');
     const s = f.querySelector('select'); s.value = 'nb'; s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(400);
  await guest.press('Escape');
  await guest.waitGone('dialog[open]', 3000).catch(() => {});
  await sleep(300);
  await showChat(guest);
  const norwegian = await guest.exec(
    `const own = Array.from(document.querySelectorAll('[data-chat] [data-chat-message]')).find((m) => m.querySelector('.text')?.textContent === 'Yes, with the wrath.');
     return {
       answer: document.querySelector('[data-chat] [data-chat-answer]')?.getAttribute('aria-label'),
       react: document.querySelector('[data-chat] [data-chat-react]')?.getAttribute('aria-label'),
       emoji: document.querySelector('[data-chat-emoji]')?.getAttribute('aria-label'),
       edited: Array.from(document.querySelectorAll('[data-chat] [data-chat-edited]')).map((e) => e.textContent.trim()),
       read: own?.querySelector('[data-chat-read]')?.getAttribute('aria-label') ?? null,
       placeholder: document.querySelector('[data-chat-field]')?.getAttribute('data-placeholder'),
     };`,
  );
  check(
    'in Norwegian the new words are Norwegian',
    norwegian.answer === 'Svar' &&
      norwegian.react === 'Reager' &&
      norwegian.emoji === 'Emojier' &&
      norwegian.edited.every((e) => e === 'endret') &&
      norwegian.edited.length > 0 &&
      norwegian.read === 'Lest av Robert' &&
      norwegian.placeholder === 'Skriv en melding',
    JSON.stringify(norwegian),
  );
  await menuOn(guest, 'Yes, with the wrath.', 'Svar');
  await guest.waitFor('[data-chat-answering]', 3000);
  const svar = await guest.text('[data-chat-answering]');
  check('and so is the line over the field', svar.includes('Svar til Anna Lind'), svar);
  await guest.click('[data-chat-field]');
  await guest.press('Escape');
  await guest.screenshot('chat-answers-6-norwegian');

  for (const [who, app] of [['owner', owner], ['guest', guest]]) {
    const errors = (await app.pageErrors()).filter((e) => !/WebSocket|websocket|Failed to load resource/.test(e));
    check(`no errors in the window of the ${who}`, errors.length === 0, errors.join(' ‖ '));
  }
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await owner?.screenshot('chat-answers-failure-owner').catch(() => {});
  await guest?.screenshot('chat-answers-failure-guest').catch(() => {});
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
