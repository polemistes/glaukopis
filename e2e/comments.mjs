// Comments: a thread on a passage of the text, begun with a key; answered
// in, settled, and opened again from the panel; marked in the text's
// margin and on the element in the diagram; and shown as cards beside the
// elements when asked.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch();
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);

  // An element with some text.
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The word menis');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const body = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('menis'));
     return s.querySelector('.body');`,
  );
  await app.click(body['element-6066-11e4-a52e-4f735466cecf']);
  await app.waitFor('.text-view .section .body .prose[contenteditable="true"]');
  await sleep(200);
  await app.keys('Wrath is the first word of the Iliad. It belongs to gods before men.');
  await sleep(200);

  // --- A comment on a passage, begun with the key ---
  // The last two words are selected.
  for (let i = 0; i < 11; i++) await app.keys(['Shift', 'ArrowLeft']);
  await sleep(100);
  await app.keys(['Control', 'Alt', 'c']);
  await app.waitFor('.beginning textarea', 3000);
  const asked = await app.exec(
    `return document.querySelector('.beginning .on').textContent.trim() + ' | ' + document.querySelector('.beginning .passage').textContent.trim()`,
  );
  check('the panel opens to begin a comment on the passage', asked === 'On “The word menis” | before men.', asked);
  await app.keys('Gods before men: is this Nagy’s phrase?');
  await app.press('Enter');
  await app.waitFor('.thread', 3000);
  await sleep(300);
  const thread = await app.exec(
    `const th = document.querySelector('.thread');
     return [th.querySelector('.element').textContent.trim(), th.querySelector('.passage').textContent.trim(), th.querySelector('.note .text').textContent.trim()].join(' | ')`,
  );
  check(
    'the thread stands in the panel, with its element, its passage and its note',
    thread === 'The word menis | before men. | Gods before men: is this Nagy’s phrase?',
    thread,
  );
  check(
    'the passage is marked in the text, and the element in the margin',
    (await app.exec(`return document.querySelector('.text-view .comment-mark')?.textContent`)) === 'before men.' &&
      (await app.exists('.text-view .section .comment-marker')),
  );
  await app.screenshot('comments-1-thread');

  // --- Answering, settling, opening again ---
  await app.click('.thread .answering textarea');
  await app.keys('Yes: Best of the Achaeans, p. 73.');
  await app.press('Enter');
  await sleep(300);
  const notes = await app.exec(
    `return Array.from(document.querySelectorAll('.thread .note .text')).map((n) => n.textContent.trim())`,
  );
  check('an answer stands under the note', notes.length === 2 && /p\. 73/.test(notes[1]), notes.join(' | '));
  await app.click('.thread .where button[aria-label="Settle the thread"]');
  await sleep(300);
  check(
    'a settled thread leaves the open ones, and its marks go',
    !(await app.exists('.thread')) && !(await app.exists('.text-view .section .comment-marker')),
  );
  check('the passage is drawn as settled', await app.exists('.text-view .comment-mark.settled'));
  await app.clickText('.tools button', 'Settled');
  await app.waitFor('.thread.settled', 3000);
  await app.click('.thread .where button[aria-label="Open the thread again"]');
  await sleep(300);
  await app.clickText('.tools button', 'Open');
  await app.waitFor('.thread:not(.settled)', 3000);
  check('and is opened again', await app.exists('.text-view .section .comment-marker'));

  // --- The mark in the text opens the thread ---
  await app.click('.text-view .comment-mark');
  await sleep(300);
  check('pressing the passage shows its thread', await app.exists('.thread.current'));

  // --- In the diagram: the mark, and the cards ---
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await sleep(300);
  const mark = await app.exec(`return document.querySelector('.diagram .mark.comments')?.textContent.trim()`);
  check('the element is marked in the diagram with its open comments', mark === '1', mark);
  // The mark on the element shows its comments under it; the switch among the controls shows every one.
  await app.click('.diagram .mark.comments');
  await app.waitFor('.diagram .card', 3000);
  await app.click('.diagram .mark.comments');
  await app.waitGone('.diagram .card', 3000);
  check('the mark on the element shows its comments under it, and hides them', true);
  await app.click('.controls button[aria-label="Show every comment under its element"]');
  await app.waitFor('.diagram .card', 3000);
  const card = await app.exec(
    `const c = document.querySelector('.diagram .card'); return c.querySelector('.card-name').textContent.trim() + ' | ' + c.querySelector('.card-text').textContent.trim()`,
  );
  check('a card beside the element names the passage and says the note', card === 'before men. | Gods before men: is this Nagy’s phrase?', card);
  await app.screenshot('comments-2-cards');

  // --- A comment on the element itself, from its menu ---
  await app.rightClick(await app.findByText('.diagram .node', 'The word menis'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Comment…');
  await app.waitFor('.beginning textarea', 3000);
  check('the menu begins a comment on the element', !(await app.exists('.beginning .passage')));
  await app.keys('Needs a section on the scholia.');
  await app.press('Enter');
  await sleep(300);
  check('two threads, two cards', (await app.exec(`return document.querySelectorAll('.diagram .card').length`)) === 2);

  // --- One's own note can be taken back, and put back ---
  await app.exec(`document.querySelectorAll('.thread')[1].querySelector('.note').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))`);
  await app.exec(`document.querySelectorAll('.thread')[1].querySelector('.note .own button[aria-label="Delete"]').click()`);
  await sleep(300);
  check('deleting the only note takes the thread', (await app.exec(`return document.querySelectorAll('.thread').length`)) === 1);
  await app.clickText('.toast button', 'Undo');
  await sleep(300);
  check('and undo from the message puts it back', (await app.exec(`return document.querySelectorAll('.thread').length`)) === 2);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('comments-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
