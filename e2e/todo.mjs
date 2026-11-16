// Lists to tick, the kind of paragraph To do: in a text of a project, `[ ] `
// typed at the start of a paragraph makes a point to tick; a press on its
// box ticks it; Ctrl+Enter unticks it; Enter gives a new point, not
// ticked; the points copied and pasted are points again, ticked as they
// were, and the clipboard holds them as Org writes them (`- [X] `); the
// typeset pages set each with a box that is drawn, in the place of the
// list's dot (the screenshot shows the boxes; the script reads that no dot
// and no sign of a font stands before the words); they are there, ticked as
// they were, after the project is closed and opened again, in the text as
// it is shown before it is written in; in a note of the notebook the same,
// the note there after the application is closed and opened again on the
// same data folder. Screenshots at each stage in
// e2e/output/todo-<n>-<what>.png.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-todo-'));
const TEXT = '.text-view .section .body .ProseMirror';
/** The text of a section as it is shown, written in or not. */
const SHOWN = '.text-view .section .body';
const NOTE = '[data-note-text] .ProseMirror';
const ROWS = '[data-notes] [role="option"]';

/** The points to tick in what the selector names, each as `[X] words` or `[ ] words`. */
const points = (app, scope) =>
  app.exec(
    // The words alone, without what the editor draws into a paragraph: the name on the bracket of a run of points.
    `return Array.from(document.querySelectorAll(arguments[0] + ' p[data-kind="todo"]'))
       .map((p) => {
         const words = p.cloneNode(true);
         words.querySelectorAll('.ProseMirror-widget, [contenteditable="false"]').forEach((e) => e.remove());
         return (p.hasAttribute('data-done') ? '[X] ' : '[ ] ') + words.textContent.trim();
       })`,
    scope,
  );

/** Waits until the points are as wanted, and gives them as they are then. */
async function pointsUntil(app, scope, want, ms = 4000) {
  const until = Date.now() + ms;
  let got = await points(app, scope);
  while (JSON.stringify(got) !== JSON.stringify(want) && Date.now() < until) {
    await sleep(150);
    got = await points(app, scope);
  }
  return got;
}

/**
 * Presses the box of the point to tick whose words begin so, where the
 * style sheet draws it: in the room before its words, on its first line.
 */
async function pressBox(app, scope, words) {
  const at = await app.exec(
    `const p = Array.from(document.querySelectorAll(arguments[0] + ' p[data-kind="todo"]'))
       .find((e) => e.textContent.includes(arguments[1]));
     if (!p) return null;
     p.scrollIntoView({ block: 'center' });
     const r = p.getBoundingClientRect();
     const s = getComputedStyle(p);
     const em = parseFloat(s.fontSize);
     return { x: Math.round(r.left + parseFloat(s.paddingLeft) - 0.7 * em), y: Math.round(r.top + 0.8 * em) };`,
    scope,
    words,
  );
  if (!at) throw new Error(`no point to tick begins with ${words}`);
  await app.cmd('POST', '/actions', {
    actions: [
      {
        type: 'pointer',
        id: 'mouse',
        parameters: { pointerType: 'mouse' },
        actions: [
          { type: 'pointerMove', origin: 'viewport', x: at.x, y: at.y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ],
  });
  await app.cmd('DELETE', '/actions');
  await sleep(200);
}

/** What the clipboard holds, read as a paste reads it. */
const clip = (app) =>
  app.execAsync(
    `const c = await window.__TAURI_INTERNALS__.invoke('clipboard_read', { primary: false });
     return c.text ?? '';`,
  );

// ---- Run 1 ----
let app = await App.launch({ dataDir, keepData: true, width: 1400, height: 900 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.type('dialog input', 'Plans');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.click('.text-view .section .body');
  await sleep(300);

  // --- Typed: a box at the start of a paragraph ---
  await app.keys('[ ] Buy bread');
  let got = await pointsUntil(app, TEXT, ['[ ] Buy bread']);
  check('[ ] typed at the start of a paragraph makes a point to tick', got.join('|') === '[ ] Buy bread', got.join(' | '));
  await app.screenshot('todo-1-typed');

  // --- A press on its box ticks it ---
  await pressBox(app, TEXT, 'Buy bread');
  got = await pointsUntil(app, TEXT, ['[X] Buy bread']);
  check('a press on the box ticks the point', got.join('|') === '[X] Buy bread', got.join(' | '));
  const faint = await app.exec(
    `const p = document.querySelector(arguments[0] + ' p[data-kind="todo"][data-done]');
     const t = document.querySelector('${TEXT} p:not([data-kind])') ?? document.body;
     return p ? getComputedStyle(p).color !== getComputedStyle(t).color : false;`,
    TEXT,
  );
  check('a ticked point has its words a little fainter', faint);
  await app.screenshot('todo-2-ticked');

  // --- The key unticks it, the cursor still in it ---
  await app.keys(['Control', 'Enter']);
  got = await pointsUntil(app, TEXT, ['[ ] Buy bread']);
  check('Ctrl+Enter unticks the point the cursor is in', got.join('|') === '[ ] Buy bread', got.join(' | '));

  // --- Enter gives a new point, not ticked ---
  await app.keys(['Control', 'Enter']);
  await app.press('End');
  await app.press('Enter');
  await app.keys('Read the proofs');
  got = await pointsUntil(app, TEXT, ['[X] Buy bread', '[ ] Read the proofs']);
  check(
    'Enter at the end of a ticked point gives a new point to tick, not ticked',
    got.join('|') === '[X] Buy bread|[ ] Read the proofs',
    got.join(' | '),
  );

  // --- Copied and pasted, they are points to tick, ticked as they were ---
  await app.execAsync(`await navigator.clipboard.writeText('something else')`);
  await app.keys(['Control', 'a']);
  await app.keys(['Control', 'c']);
  let held = '';
  for (let i = 0; i < 30 && !held.includes('Read the proofs'); i++) {
    await sleep(200);
    held = await clip(app);
  }
  check(
    'the clipboard holds the points as Org writes them',
    held.trim() === '- [X] Buy bread\n- [ ] Read the proofs',
    JSON.stringify(held),
  );
  await app.keys(['Control', 'End']);
  // Out of the list: Enter on the new, empty point makes it text.
  await app.press('Enter');
  await app.press('Enter');
  await app.keys(['Control', 'v']);
  got = await pointsUntil(app, TEXT, ['[X] Buy bread', '[ ] Read the proofs', '[X] Buy bread', '[ ] Read the proofs']);
  check(
    'pasted, they are points to tick again, ticked as they were',
    got.join('|') === '[X] Buy bread|[ ] Read the proofs|[X] Buy bread|[ ] Read the proofs',
    got.join(' | '),
  );
  await app.screenshot('todo-3-pasted');

  // --- The typeset pages set each point with its box ---
  // The box is drawn, so the words of the page hold neither a sign for it
  // nor the dot of a list: the screenshot shows the boxes themselves.
  await app.typeset();
  await app.waitFor('.preview .page', 30000);
  await app.waitFor('.preview .page .texts span', 15000);
  const runs = await app.exec(
    `return Array.from(document.querySelectorAll('.preview .page .texts span')).map((s) => s.textContent).join(' ').replace(/\\s+/g, ' ')`,
  );
  check(
    'the typeset pages hold the points, with no dot of a list and no sign of a font before them',
    runs.includes('Buy bread') && runs.includes('Read the proofs') && !/[☐☒•]/.test(runs),
    runs.slice(0, 200),
  );
  await app.screenshot('todo-4-typeset');
  await app.typeset();
  await sleep(300);

  // --- Closed and opened again, the points are as they were ---
  await sleep(1500);
  await app.openProject('Plans');
  await app.waitFor(`${SHOWN} p[data-kind="todo"]`, 10000);
  got = await pointsUntil(app, SHOWN, ['[X] Buy bread', '[ ] Read the proofs', '[X] Buy bread', '[ ] Read the proofs']);
  check(
    'after the project is closed and opened, the points are there, ticked as they were',
    got.join('|') === '[X] Buy bread|[ ] Read the proofs|[X] Buy bread|[ ] Read the proofs',
    got.join(' | '),
  );
  await app.screenshot('todo-5-reopened');

  // --- In a note of the notebook, the same ---
  await app.keys(['Control', '3']);
  await app.waitFor('[data-notebook]', 8000);
  await app.waitFor('[data-notebook-empty]', 8000);
  await app.clickText('[data-notebook-empty] button', 'New note');
  await app.waitFor(NOTE, 5000);
  await app.waitUntil(`return !!document.activeElement?.closest?.('[data-note-text]')`, 3000, 'the note to have the cursor');
  await app.keys('[ ] Feed the owl');
  got = await pointsUntil(app, NOTE, ['[ ] Feed the owl']);
  check('in a note, [ ] makes a point to tick', got.join('|') === '[ ] Feed the owl', got.join(' | '));
  await pressBox(app, NOTE, 'Feed the owl');
  got = await pointsUntil(app, NOTE, ['[X] Feed the owl']);
  check('in a note, a press on the box ticks it', got.join('|') === '[X] Feed the owl', got.join(' | '));
  await app.keys(['Control', 'Enter']);
  got = await pointsUntil(app, NOTE, ['[ ] Feed the owl']);
  check('in a note, Ctrl+Enter unticks it', got.join('|') === '[ ] Feed the owl', got.join(' | '));
  await app.keys(['Control', 'Enter']);
  await app.press('End');
  await app.press('Enter');
  await app.keys('Clean the cage');
  got = await pointsUntil(app, NOTE, ['[X] Feed the owl', '[ ] Clean the cage']);
  check(
    'in a note, Enter gives a new point, not ticked',
    got.join('|') === '[X] Feed the owl|[ ] Clean the cage',
    got.join(' | '),
  );
  await app.screenshot('todo-6-note');
  await sleep(1500);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await app.quit();
} catch (error) {
  console.error(error);
  await app.screenshot('todo-failure').catch(() => {});
  checks.push({ name: 'the first run completed', ok: false });
  await app.close();
}

// ---- Run 2: the same data folder ----
app = await App.launch({ dataDir, keepData: true, width: 1400, height: 900 });
try {
  await app.installErrorHook();
  await app.waitFor('#app > *', 15000);
  await app.go('#/notebook');
  await app.waitFor(ROWS, 10000);
  // No note is chosen where the place names none: the note is chosen from the list.
  await app.clickText(ROWS, 'Feed the owl');
  await app.waitFor(NOTE, 10000);
  const got = await pointsUntil(app, NOTE, ['[X] Feed the owl', '[ ] Clean the cage'], 8000);
  check(
    'after the application is closed and opened, the note holds its points, ticked as they were',
    got.join('|') === '[X] Feed the owl|[ ] Clean the cage',
    got.join(' | '),
  );
  await app.screenshot('todo-7-note-again');
} catch (error) {
  console.error(error);
  await app.screenshot('todo-failure-2').catch(() => {});
  checks.push({ name: 'the second run completed', ok: false });
} finally {
  await app.close();
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(`${dataDir}-config`, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
