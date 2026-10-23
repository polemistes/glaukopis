// An element with no text takes no room in the text: its name follows the
// name before it closely. A press under the name, or Enter in it, opens the
// text with the cursor in it; leaving it with nothing written closes it
// again. The arrows pass over it, as over a text that is folded away.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

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

const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
const data = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-'));
writeFileSync(
  join(desk, 'book.md'),
  `---
title: The book
---

Before the parts.

# One

# Two

The text of two.

# Three

# Four

The text of four.
`,
);

const app = await App.launch({ width: 1360, height: 900, dataDir: data });
try {
  await app.installErrorHook();
  const drop = (paths, x, y) =>
    app.execAsync(
      `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
       const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
       await emit('tauri://drag-enter', { paths: arguments[0], position });
       await emit('tauri://drag-over', { position });
       await emit('tauri://drag-drop', { paths: arguments[0], position });`,
      paths,
      x,
      y,
    );
  const shown = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => (s.querySelector('.heading .prose.title')?.textContent ?? '').trim())`,
    );
  /** The section of an element by its name, marked so that it can be found by a selector. */
  const section = (name) =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .prose.title')?.textContent ?? '').trim() === arguments[0]);
       if (!s) return null; s.dataset.named = arguments[0]; return s.dataset.section;`,
      name,
    );
  /** How high the text of an element is, in pixels. */
  const bodyHeight = (name) =>
    app.exec(
      `const s = document.querySelector('.text-view .section[data-named="' + arguments[0] + '"]');
       return Math.round(s.querySelector(':scope > .content > .body').getBoundingClientRect().height)`,
      name,
    );
  /** Where the cursor is: the name of the element and the part. */
  const caret = () =>
    app.exec(
      `const a = document.activeElement; const s = a?.closest('.section');
       if (!s) return null;
       return (s.querySelector('.heading .prose.title')?.textContent ?? '').trim() + ':' + a.closest('[data-part]')?.dataset.part`,
    );
  /** The gap between the bottom of the name of one element and the top of the name of the next. */
  const gap = (a, b) =>
    app.exec(
      `const h = (n) => document.querySelector('.text-view .section[data-named="' + n + '"] > .content > .heading').getBoundingClientRect();
       return Math.round(h(arguments[1]).top - h(arguments[0]).bottom)`,
      a,
      b,
    );
  /** A point in the column, between the name of one element and that of the next. */
  const between = (a, b) =>
    app.exec(
      `const h = (n) => document.querySelector('.text-view .section[data-named="' + n + '"] > .content > .heading').getBoundingClientRect();
       const top = h(arguments[0]), next = h(arguments[1]);
       return { x: Math.round(top.left + 60), y: Math.round((top.bottom + next.top) / 2) }`,
      a,
      b,
    );
  /** A press of the pointer at a point of the window, held for a moment, as a hand does it. */
  const pressAt = async ({ x, y }) => {
    await app.cmd('POST', '/actions', {
      actions: [
        {
          type: 'pointer',
          id: 'mouse',
          parameters: { pointerType: 'mouse' },
          actions: [
            { type: 'pointerMove', origin: 'viewport', x, y },
            { type: 'pointerDown', button: 0 },
            { type: 'pause', duration: 120 },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ],
    });
    await app.cmd('DELETE', '/actions');
  };

  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Closing');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const at = await app.exec(
    `const r = document.querySelector('.project .work .panes').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }`,
  );
  await drop([join(desk, 'book.md')], at.x, at.y);
  await app.waitFor('dialog [data-fact="words"]', 15000);
  await app.clickText('dialog footer button', 'Bring it in');
  await app.waitGone('dialog[open]', 15000);
  await app.waitForText('.text-view .section .heading .prose.title', 'The book', 8000);
  await app.openMap('The book');
  await until('the book in view', async () => (await shown())[0] === 'The book');
  await sleep(600);
  for (const name of ['The book', 'One', 'Two', 'Three', 'Four']) await section(name);
  // The cursor is nowhere to begin with.
  await app.exec(`document.activeElement?.blur()`);
  await sleep(300);

  // ---- an empty text takes no room ----
  check('an empty text takes no room', (await bodyHeight('One')) === 0, String(await bodyHeight('One')));
  check('a text with words in it is shown', (await bodyHeight('Two')) > 10, String(await bodyHeight('Two')));
  const closedGap = await gap('One', 'Two');
  const openGap = await gap('Two', 'Three');
  check('a name follows an empty element closely', closedGap < openGap - 10, `${closedGap} / ${openGap}`);
  await app.screenshot('empty-texts-1-closed');

  // ---- a press between the names opens it, with the cursor in it ----
  await pressAt(await between('One', 'Two'));
  await sleep(500);
  check('a press between the names puts the cursor in the text of the one above', (await caret()) === 'One:body', String(await caret()));
  check('and the text is opened, a line high', (await bodyHeight('One')) > 10, String(await bodyHeight('One')));
  await app.screenshot('empty-texts-2-opened');

  // ---- left with nothing written, it closes ----
  await app.press('ArrowUp');
  await sleep(400);
  check('the arrow up goes to its name', (await caret()) === 'One:title', String(await caret()));
  check('and the empty text closes again', (await bodyHeight('One')) === 0, String(await bodyHeight('One')));

  // ---- Enter in the name opens it ----
  await app.press('End');
  await app.press('Enter');
  await sleep(400);
  check('Enter at the end of the name puts the cursor in its text', (await caret()) === 'One:body', String(await caret()));
  check('which is opened', (await bodyHeight('One')) > 10, String(await bodyHeight('One')));
  await app.keys('Written');
  await sleep(300);
  await app.press('ArrowUp');
  await sleep(400);
  check('a text that is written in stays when the cursor leaves it', (await bodyHeight('One')) > 10, String(await bodyHeight('One')));

  // ---- the arrows pass over an empty text ----
  await app.click('.text-view .section[data-named="Four"] .heading .prose.title');
  await sleep(400);
  await app.press('Home');
  check('the cursor in the name of the fourth', (await caret()) === 'Four:title', String(await caret()));
  await app.press('ArrowUp');
  await sleep(400);
  check('the arrow up from it goes to the name of the empty one above, past its text', (await caret()) === 'Three:title', String(await caret()));
  check('whose text stays closed', (await bodyHeight('Three')) === 0, String(await bodyHeight('Three')));
  await app.press('ArrowDown');
  await sleep(400);
  check('the arrow down from it goes on to the next name', (await caret()) === 'Four:title', String(await caret()));
  check('and its text stays closed', (await bodyHeight('Three')) === 0, String(await bodyHeight('Three')));

  // ---- from an opened text, a press on the name below lands where it was pressed ----
  await pressAt(await between('Three', 'Four'));
  await sleep(500);
  check('the empty text of the third opened by a press', (await caret()) === 'Three:body' && (await bodyHeight('Three')) > 10, String(await caret()));
  const four = await app.exec(
    `const r = document.querySelector('.text-view .section[data-named="Four"] .heading .prose.title').getBoundingClientRect(); return { x: Math.round(r.left + 4), y: Math.round(r.top + r.height / 2) }`,
  );
  await pressAt(four);
  await sleep(500);
  check('a press on the name below lands in that name', (await caret()) === 'Four:title', String(await caret()));
  check('and the text left behind closes when the press is over', (await bodyHeight('Three')) === 0, String(await bodyHeight('Three')));
  const selection = await app.exec(`return getSelection().isCollapsed`);
  check('nothing is selected by the name moving up', selection === true, String(selection));
  await app.screenshot('empty-texts-3-after');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed} of ${checks.length} passed`);
process.exit(failed ? 1 : 0);
