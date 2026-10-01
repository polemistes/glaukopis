// Reviewing changes afterwards (ADR 0022): the panel of changes beside the
// text, with two people through the real server as `e2e/sharing.mjs` has
// them. One writes; the other reviews, accepts, rejects, leaves for later,
// writes in the text and accepts it as it then stands, opens the history of
// a change and uses an earlier version; and a second review begins where
// the first ended.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep, freePort } from './harness.mjs';

/** The keys F8 and Shift+F8, as WebDriver names them. */
const F8 = '\uE038';

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
    await sleep(150);
  }
}

/** The text of the centre, without the cursors of the others, which carry their names. */
const bodyText = (app) =>
  app.exec(`const b = document.querySelector('.text-view .section .body')?.cloneNode(true);
            if (!b) return '';
            b.querySelectorAll('.ProseMirror-yjs-cursor').forEach((c) => c.remove());
            return Array.from(b.querySelectorAll('p')).map((p) => p.textContent.replace(/⁠/g, '')).join(' | ').trim();`);

/** What the review holds, as the panel shows it. */
const state = (app) =>
  app.exec(`const r = window.__glaukopisHistory.review;
            if (!r) return null;
            return {
              ready: r.ready, working: r.working, failure: r.failure,
              count: r.changes.length, index: r.index, looked: r.looked,
              kinds: r.changes.map((c) => c.kind),
              me: r.me,
              by: r.changes.map((c) => c.by),
              words: r.changes.map((c) => c.stretches.map((s) => s.pieces.map((p) => p.status[0] + ':' + p.text).join('')).join(' / ')),
            };`);

/** Works the changes out now, and waits until they are there. */
const refresh = (app) => app.execAsync(`await window.__glaukopisHistory.review.upToDate();`);

const settled = async (app, count, what) => {
  await refresh(app);
  const s = await until(what, async () => {
    const now = await state(app);
    return now && now.ready && !now.working && now.count === count ? now : null;
  }).catch(async () => state(app));
  return s;
};

/** Puts the caret at the end of the nth paragraph of the body (from 1). */
async function caretIn(app, n) {
  await app.click(`.text-view .section .body p:nth-of-type(${n})`);
  await app.waitFor('.text-view .section .ProseMirror.body', 8000);
  await sleep(250);
  await app.click(`.text-view .section .ProseMirror.body p:nth-of-type(${n})`);
  await sleep(200);
  await app.press('End');
}

// ---- the server ----
const binary = join(root, 'target', 'debug', 'glaukopis-server');
if (!existsSync(binary))
  throw new Error(`No server at ${binary}. Build it first: cargo build -p glaukopis-server`);
const serverData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-server-'));
const port = await freePort();
const address = `127.0.0.1:${port}`;
const server = spawn(binary, ['--listen', address, '--data', serverData, '--password', 'sesame'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stderr.on('data', () => {});
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(`http://${address}/api/info`)).ok) break;
  } catch {
    await sleep(100);
  }
}

let robert;
let anna;
try {
  robert = await App.launch({ width: 1400, height: 900 });
  anna = await App.launch({ width: 1200, height: 820 });
  await robert.installErrorHook();
  await anna.installErrorHook();

  // ---- Robert writes the text ----
  await robert.clickText('button', 'Begin a project');
  await robert.waitFor('dialog input');
  await robert.type('dialog input', 'Wrath');
  await robert.clickText('dialog footer button', 'Create');
  await robert.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await robert.keys(['Control', 'd']);
  await robert.waitFor('.text-view .section .body', 8000);
  await robert.click('.text-view .section .body');
  await sleep(300);
  await robert.keys('Sing, goddess, the wrath of Achilles. It brought countless ills.');
  await robert.press('Enter');
  await robert.keys('Many brave souls it sent to Hades. And many more beside.');
  await sleep(1000);

  // ---- the panel, before the history is kept ----
  await robert.keys(['Control', 'Shift', 'e']);
  await robert.waitFor('.review-panel', 5000);
  check('Ctrl+Shift+E opens the panel of changes beside the text', await robert.exists('.text-view'));
  const said = await robert.text('.review-panel');
  check(
    'it says why there is nothing to review where the history is not kept',
    said.includes('The history of this project is not kept'),
    said.replace(/\s+/g, ' ').slice(0, 80),
  );
  await robert.screenshot('review-1-no-history');

  await robert.clickText('.review-panel button', 'Keep the history');
  await until('the history to be kept', async () =>
    (await robert.text('.review-panel')).includes('Nothing left to review'),
  );
  check('the panel offers to keep the history, and then has nothing to review', true);

  // ---- Robert shares, Anna joins ----
  await robert.click('header .share button');
  await robert.waitForText('dialog h2', 'Share this project');
  await robert.type('dialog input[placeholder="glaukopis.example.org"]', address);
  await robert.click('dialog input[placeholder="As the others know you"]');
  await robert.waitFor('dialog input[type="password"]', 5000);
  await robert.keys('Robert');
  await robert.type('dialog input[type="password"]', 'sesame');
  await robert.clickText('dialog footer button', 'Share');
  await robert.waitForText('dialog .state', 'Connected', 8000);
  await robert.clickText('dialog button', 'Make an invitation code');
  await robert.waitFor('dialog .code', 5000);
  const code = (await robert.text('dialog .code')).trim();
  await robert.clickText('dialog footer button', 'Done');
  await robert.waitGone('dialog[open]');

  await anna.waitForText('h2', 'Welcome to Glaukopis');
  await anna.clickText('button', 'Join a shared project');
  await anna.waitForText('dialog h2', 'Join a shared project');
  await anna.type('dialog input[name="server"]', address);
  await anna.type('dialog input[name="code"]', code);
  await anna.type('dialog input[placeholder="As the others know you"]', 'Anna Lind');
  await anna.clickText('dialog footer button', 'Join');
  await anna.waitFor('.diagram .node.root', 15000);
  await sleep(500);
  await anna.keys(['Control', 'd']);
  await anna.waitFor('.text-view .section .body', 8000);
  await until('Anna to have the text', async () => (await bodyText(anna)).includes('Achilles'));

  // ---- Anna writes: a sentence changed, a sentence deleted, a paragraph written ----
  await caretIn(anna, 1);
  await anna.press('Home');
  await anna.keys('Then ');
  await caretIn(anna, 2);
  for (let i = 0; i < 22; i++) await anna.press('Backspace');
  await caretIn(anna, 2);
  await anna.press('Enter');
  await anna.keys('A new paragraph by Anna.');
  await until(
    'Robert to have what Anna wrote',
    async () => (await bodyText(robert)).includes('A new paragraph by Anna.'),
  );
  await sleep(1500);

  // ---- Robert reviews ----
  const three = await settled(robert, 3, 'three changes of Anna');
  check(
    'the changes of the other are listed, one for each place',
    three.count === 3,
    JSON.stringify(three.kinds) + ' ' + JSON.stringify(three.words),
  );
  check(
    'a sentence changed, a sentence deleted and a paragraph written',
    ['changed', 'removed', 'added'].every((k) => three.kinds.includes(k)),
    JSON.stringify(three.kinds),
  );
  check(
    "none of the reviewer's own changes are among them",
    three.by.every((by) => by.length && !by.includes(three.me)),
    JSON.stringify(three.by) + ' of ' + three.me,
  );
  check('it says how many are left', (await robert.text('.review-panel .count')).includes('3'));

  const marks = await robert.exec(
    `return {
       added: document.querySelectorAll('.text-view .review-added').length,
       removed: document.querySelectorAll('.text-view .review-removed').length,
       colours: Array.from(new Set(Array.from(document.querySelectorAll('.text-view .review-added, .text-view .review-removed')).map((e) => getComputedStyle(e).getPropertyValue('--by').trim()))),
     }`,
  );
  check('what was written is marked in the text', marks.added > 0, JSON.stringify(marks));
  check('and what was deleted is shown where it stood', marks.removed > 0, JSON.stringify(marks));
  check(
    'each in the colour of who changed it',
    marks.colours.length >= 1 && marks.colours.every((c) => c && c !== 'none'),
    JSON.stringify(marks.colours),
  );
  await robert.screenshot('review-2-changes');

  // ---- Later: on to the next, leaving this one ----
  const first = (await state(robert)).looked;
  await robert.keys([F8]);
  await sleep(300);
  const after = await state(robert);
  check(
    'F8 goes on to the next change and leaves this one in the list',
    after.looked !== first && after.count === 3,
    `${first} → ${after.looked}, ${after.count} left`,
  );
  await robert.keys(['Shift', F8]);
  await sleep(300);
  check('Shift+F8 goes back to the one before', (await state(robert)).looked === first);

  // ---- Accept ----
  await robert.exec(
    `const r = window.__glaukopisHistory.review; r.look(r.changes.find((c) => c.kind === 'added').key);`,
  );
  await sleep(200);
  await robert.keys(['Control', 'Alt', 'y']);
  const two = await settled(robert, 2, 'the accepted change to go');
  check(
    'Ctrl+Alt+Y accepts the change, and it is not shown again',
    two.count === 2 && !two.kinds.includes('added'),
    JSON.stringify(two.kinds),
  );
  const kept = await robert.exec(
    `const d = window.__glaukopisHistory.history.project.doc;
     const mine = d.getMap('reviews').get(window.__glaukopisHistory.review.me);
     return mine ? mine.get('accepted').length : 0;`,
  );
  check('what was accepted is kept in the project', kept > 0, `${kept} accepted`);

  // ---- Reject ----
  await robert.exec(
    `const r = window.__glaukopisHistory.review; r.look(r.changes.find((c) => c.kind === 'removed').key);`,
  );
  await sleep(200);
  await robert.keys(['Control', 'Alt', 'n']);
  await until('the sentence deleted to come back', async () =>
    (await bodyText(robert)).includes('And many more beside.'),
  );
  check('Ctrl+Alt+N puts the text back as it was', true);
  await until('Anna to have it back as well', async () =>
    (await bodyText(anna)).includes('And many more beside.'),
  );
  check('and the other sees it, as with any change', true);
  const one = await settled(robert, 1, 'one change left');
  check('the change that was rejected is gone from the list', one.count === 1, JSON.stringify(one.kinds));

  // ---- Writing while reviewing, and accepting it as it then stands ----
  await caretIn(robert, 1);
  await robert.press('Home');
  await robert.keys('Well, ');
  await sleep(1200);
  await robert.keys(['Control', 'Alt', 'y']);
  const none = await settled(robert, 0, 'nothing left to review');
  check(
    'the text can be written in while it is reviewed, and Accept takes it as it then stands',
    none.count === 0 && (await bodyText(robert)).startsWith('Well, Then Sing'),
    `${none.count} left, ${JSON.stringify((await bodyText(robert)).slice(0, 40))}`,
  );
  await until('the panel to say that nothing is left', async () =>
    (await robert.text('.review-panel')).includes('Nothing left to review'),
  );
  check('the panel says that nothing is left', true);
  await robert.screenshot('review-3-nothing-left');

  // ---- A second review, which begins where the first ended ----
  await caretIn(anna, 1);
  await anna.keys(' Anna wrote this.');
  await sleep(1600);
  await anna.keys(' And then this.');
  await until('Robert to have the new words', async () =>
    (await bodyText(robert)).includes('And then this.'),
  );
  await sleep(1500);
  const second = await settled(robert, 1, 'one new change');
  check(
    'a second review shows only what is new since the first ended',
    second.count === 1 && !second.words.join(' ').includes('A new paragraph by Anna'),
    JSON.stringify(second.words),
  );

  // ---- The history of a change, and an earlier version ----
  await robert.waitFor('.review-panel .versions-toggle', 8000);
  await robert.click('.review-panel .versions-toggle');
  await robert.waitFor('.review-panel .versions li', 8000);
  const versions = await robert.count('.review-panel .versions li.version');
  check('the history of a change shows its versions, with who and when', versions >= 1, `${versions}`);
  await robert.screenshot('review-4-versions');

  const wasText = await bodyText(robert);
  await robert.clickText('.review-panel .versions li.version .actions button', 'Use this version');
  await until('the text to go back to the version chosen', async () => (await bodyText(robert)) !== wasText);
  const back = await bodyText(robert);
  check(
    'Use this version makes the text what it was then, and accepts it',
    !back.includes('And then this.'),
    JSON.stringify(back.slice(0, 80)),
  );
  const done = await settled(robert, 0, 'nothing left after the version was used');
  check('and nothing is left to review', done.count === 0, JSON.stringify(done.kinds));

  // ---- Accept up to a version ----
  await caretIn(anna, 1);
  await anna.keys(' One.');
  await sleep(1600);
  await anna.keys(' Two.');
  await until('Robert to have both', async () => (await bodyText(robert)).includes('Two.'));
  await sleep(1500);
  await settled(robert, 1, 'the change of the two writings');
  await robert.waitFor('.review-panel .versions-toggle', 8000);
  if (!(await robert.exists('.review-panel .versions li'))) {
    await robert.click('.review-panel .versions-toggle');
    await robert.waitFor('.review-panel .versions li', 8000);
  }
  const many = await robert.count('.review-panel .versions li.version');
  check('the versions are those between the two ends, not the end itself', many >= 1, `${many}`);
  await robert.clickText('.review-panel .versions li.version:first-child .actions button', 'Accept up to here');
  await sleep(2000);
  const rest = await settled(robert, 1, 'what is after the version accepted');
  check(
    'Accept up to here accepts the versions up to one, and leaves those after it',
    rest.count === 1 && rest.words.join(' ').includes('Two.') && !rest.words.join(' ').includes('One.'),
    JSON.stringify(rest.words),
  );

  for (const [who, app] of [
    ['reviewer', robert],
    ['other', anna],
  ]) {
    const errors = await app.pageErrors();
    check(`no errors in the window of the ${who}`, errors.length === 0, errors.join(' ‖ '));
  }
} catch (error) {
  console.error(error);
  for (const [who, app] of [
    ['reviewer', robert],
    ['other', anna],
  ])
    if (app)
      console.log(`      the text of the ${who}: ${JSON.stringify(await bodyText(app).catch(() => '?'))}`);
  if (robert) console.log(`      the review: ${JSON.stringify(await state(robert).catch(() => '?'))}`);
  check('the script ran to its end', false, String(error.message ?? error));
  await robert?.screenshot('review-failure-reviewer').catch(() => {});
  await anna?.screenshot('review-failure-other').catch(() => {});
} finally {
  await robert?.close();
  await anna?.close();
  server.kill('SIGTERM');
  await sleep(200);
  rmSync(serverData, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
