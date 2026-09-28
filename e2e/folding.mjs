// An element is folded away in the text, its own text and what is under
// it; it is as it was left when the project is opened again; and all that
// is folded under an element is opened at once.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

The first part, of seven words.

## One A

Under the first, four words.

### One A i

Deepest of all, five words.

## One B

Beside it.

# Two

The second part.

## Two A

Under the second.

# Three

The third part, alone.
`,
);

const ALL = ['The book', 'One', 'One A', 'One A i', 'One B', 'Two', 'Two A', 'Three'];

let app = await App.launch({ width: 1360, height: 900, dataDir: data });
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
  /** The names of the elements that are shown, in the order of the text. */
  const shown = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => (s.querySelector('.heading .prose.title')?.textContent ?? '').trim())`,
    );
  /** The elements that are folded, with what they say is folded away. */
  const folded = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section[data-folded]')).map((s) => (s.querySelector('.heading .prose.title')?.textContent ?? '').trim() + ': ' + s.querySelector('.away .open').textContent.replace(/\\s+/g, ' ').trim())`,
    );
  const section = (name) =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .prose.title')?.textContent ?? '').trim() === arguments[0]);
       if (!s) return null; s.dataset.named = arguments[0]; s.scrollIntoView({ block: 'center' }); return s.dataset.section;`,
      name,
    );
  const fold = async (name, shift = false) => {
    await section(name);
    await sleep(120);
    if (!shift) {
      // With the pointer, as a hand does it.
      await app.click(`.text-view .section[data-named="${name}"] > .gutter .fold`);
      await sleep(250);
      return;
    }
    await app.exec(
      `document.querySelector('.text-view .section[data-named="' + arguments[0] + '"] > .gutter .fold').dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: arguments[1] }))`,
      name,
      shift,
    );
    await sleep(250);
  };
  const words = () => app.exec(`return document.querySelector('.text-view footer span').textContent.trim()`);

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Folding');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const at = await app.exec(
    `const r = document.querySelector('.project .work .panes').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }`,
  );
  await drop([join(desk, 'book.md')], at.x, at.y);
  await app.waitFor('dialog [data-fact="words"]', 15000);
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitGone('dialog[open]', 15000);
  await app.waitFor('.text-view .section', 8000);
  await sleep(600);
  check('the text has all its elements', JSON.stringify(await shown()) === JSON.stringify(ALL), JSON.stringify(await shown()));
  const counted = await words();

  // ---- what can be folded ----
  const foldable = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).filter((s) => s.querySelector(':scope > .gutter .fold')).map((s) => s.querySelector('.heading .prose.title').textContent.trim())`,
  );
  check('every element that has text or something under it can be folded', JSON.stringify(foldable) === JSON.stringify(ALL), JSON.stringify(foldable));
  const seen = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section > .gutter .fold')).map((f) => Number(getComputedStyle(f).opacity)).filter((o) => o < 0.3).length`,
  );
  check('and the arrows are seen without the pointer over them', seen === 0, String(seen));

  // ---- an element is folded ----
  await fold('One A');
  check('what is under an element is folded away', JSON.stringify(await shown()) === JSON.stringify(ALL.filter((n) => n !== 'One A i')), JSON.stringify(await shown()));
  check('and it says what is folded away', JSON.stringify(await folded()) === JSON.stringify(['One A: Its text and 1 element folded away, 10 words']), JSON.stringify(await folded()));
  check('its own text is folded away as well, and its name is shown', await app.exec(`const s = document.querySelector('.text-view .section[data-named="One A"]'); return !s.querySelector('.body') && !s.textContent.includes('Under the first') && s.querySelector('.heading').textContent.trim() === 'One A'`));
  check('the words of the document are counted as before', (await words()) === counted, `${await words()} / ${counted}`);
  await app.screenshot('folding-1-folded');

  // ---- one over it is folded, and opened: the one under it is as it was ----
  await fold('One');
  check('folded over it, all under it is away', JSON.stringify(await shown()) === JSON.stringify(['The book', 'One', 'Two', 'Two A', 'Three']), JSON.stringify(await shown()));
  check('counted with all that is under it', JSON.stringify(await folded()) === JSON.stringify(['One: Its text and 3 elements folded away, 18 words']), JSON.stringify(await folded()));
  await fold('One');
  check('opened again, what was folded under it is folded still', JSON.stringify(await shown()) === JSON.stringify(ALL.filter((n) => n !== 'One A i')) && (await folded()).length === 1, JSON.stringify(await shown()));

  // ---- by the keys, from where the text is written ----
  await section('Two');
  await app.click('.text-view .section[data-named="Two"] .body');
  await sleep(300);
  await app.keys(['Control', 'Alt', 'u']);
  await sleep(300);
  check('Ctrl+Alt+U folds away the element the cursor is in', !(await shown()).includes('Two A') && (await folded()).length === 2, JSON.stringify(await shown()));
  await fold('One');
  check('three are folded, of which one is hidden', JSON.stringify(await folded()) === JSON.stringify(['One: Its text and 3 elements folded away, 18 words', 'Two: Its text and 1 element folded away, 6 words']), JSON.stringify(await folded()));
  await app.screenshot('folding-2-several');

  // ---- it is as it was left when the project is opened again ----
  const before = JSON.stringify(await shown());
  await app.click('button[aria-label="All projects"]');
  await app.waitFor('.home', 8000);
  await sleep(2000);
  await app.clickText('.home .card', 'Folding');
  await app.waitFor('.text-view .section', 10000);
  await sleep(600);
  check('the project opened again has the text as it was left', JSON.stringify(await shown()) === before, `${JSON.stringify(await shown())} / ${before}`);

  // And when the application is started again.
  await app.close();
  app = await App.launch({ width: 1360, height: 900, dataDir: data });
  await app.installErrorHook();
  await app.waitFor('.home', 10000);
  await app.clickText('.home .card', 'Folding');
  await app.waitFor('.text-view .section', 10000);
  await sleep(600);
  check('and so when the application is started again', JSON.stringify(await shown()) === before, `${JSON.stringify(await shown())} / ${before}`);

  // ---- all that is folded under an element is opened at once ----
  await fold('One', true);
  check('with Shift, all that is folded under it is opened', JSON.stringify(await shown()) === JSON.stringify(ALL.filter((n) => n !== 'Two A')), JSON.stringify(await shown()));
  check('and what is folded beside it stays folded', JSON.stringify(await folded()) === JSON.stringify(['Two: Its text and 1 element folded away, 6 words']), JSON.stringify(await folded()));

  // The same from the line that says what is folded away.
  await fold('One A');
  await fold('One');
  await app.clickText('.text-view .section[data-named="One"] .away .all', 'Open all');
  await sleep(300);
  check('“Open all” opens all under it', JSON.stringify(await shown()) === JSON.stringify(ALL.filter((n) => n !== 'Two A')), JSON.stringify(await shown()));

  // And from the menu of the element, for the whole of the text.
  await fold('One A');
  await section('The book');
  await sleep(150);
  await app.rightClick('.text-view .section[data-named="The book"] .heading');
  await app.waitFor('.menu');
  await sleep(150);
  const offered = await app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim()).filter((t) => /old|Open/.test(t))`,
  );
  check('the menu of an element offers it', offered.some((t) => t.startsWith('Open all that is folded under it')) && offered.some((t) => t.startsWith('Fold it away')), JSON.stringify(offered));
  await app.clickText('.menu [role="menuitem"]', 'Open all that is folded under it');
  await sleep(300);
  check('from the title, all of the text is opened', JSON.stringify(await shown()) === JSON.stringify(ALL) && (await folded()).length === 0, JSON.stringify(await shown()));

  // ---- all under an element is folded ----
  await section('The book');
  await sleep(150);
  await app.rightClick('.text-view .section[data-named="The book"] .heading');
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Fold away all under it');
  await sleep(300);
  check('all under the title folded, the parts are shown by their names and nothing deeper', JSON.stringify(await shown()) === JSON.stringify(['The book', 'One', 'Two', 'Three']) && (await folded()).length === 3, JSON.stringify(await folded()));
  check('the text of the title itself is shown', await app.exec(`return document.querySelector('.text-view .section .body').textContent.includes('Before the parts')`));
  const last = await folded();
  check('an element with text and nothing under it says so', last[2] === 'Three: Its text folded away, 4 words', last[2]);
  await app.screenshot('folding-3-outline');

  // ---- the diagram is as it was ----
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  check('in the diagram nothing is folded by it', (await app.count('.diagram .node')) === ALL.length, String(await app.count('.diagram .node')));
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 8000);
  await sleep(300);

  // ---- from the name of a folded element, Enter opens its text ----
  await section('Two');
  await app.click('.text-view .section[data-named="Two"] .heading');
  await sleep(300);
  await app.press('End');
  await app.press('Enter');
  await sleep(400);
  check('Enter in the name of a folded element opens it, and what is under it is as it was', JSON.stringify(await folded()) === JSON.stringify(['One: Its text and 3 elements folded away, 18 words', 'Two A: Its text folded away, 3 words', 'Three: Its text folded away, 4 words']), JSON.stringify(await folded()));

  // ---- what is written under a folded element is shown ----
  await app.keys(['Control', 'End']);
  await app.keys(['Control', 'Enter']);
  await sleep(500);
  await app.keys('Two first');
  await sleep(300);
  check('a new element is made under it, and shown', // The driver loses capitals after keys that were pressed together.
    (await shown()).join('|').toLowerCase().includes('two|two first|two a'), JSON.stringify(await shown()));

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('folding-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
  rmSync(data, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
