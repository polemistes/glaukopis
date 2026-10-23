// Marks on lines, and reference marks (ADR 0041, ADR 0039). Ten lines of
// verse in two stanzas are numbered from 1, every 5 as the layout says;
// the third is given 1234 by hand, the fifth is not counted, the tenth is
// counted and its number held back, shown in parentheses where one
// writes; the sixth has words in the margin; and the seventh is given 77
// in its place in the margin. Then a paragraph with reference marks: one
// by its key, one from the Insert menu, whose label is proposed from the
// one before, and one changed by pressing it. Search finds words across a
// mark, and spelling passes over it. The preview is made without remark
// from Typst that has the numbers, the margin words and the marks; and a
// document made as Typst by the command of export, with the layout setting
// the marks in the margin, has them there.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900, keepData: true });

/** The text of the element written in: found by its section once it is made. */
let prose = '.text-view .section .body .prose';

/** Puts the cursor at the end of the line of verse given, counted through every paragraph, and gives the editor time to take it up. */
async function toLine(i) {
  await app.exec(
    `const lines = [];
     for (const p of document.querySelectorAll(arguments[0] + ' > p')) {
       let line = [];
       lines.push(line);
       const walker = document.createTreeWalker(p, NodeFilter.SHOW_ALL);
       let node;
       while ((node = walker.nextNode())) {
         if (node.nodeType === 1 && node.classList.contains('hard-break')) lines.push((line = []));
         if (node.nodeType === 3 && !node.parentElement.closest('.run-line, .line-number, .line-margin')) line.push(node);
       }
     }
     const line = lines[arguments[1]];
     const last = line[line.length - 1];
     getSelection().collapse(last, last.data.length);`,
    prose,
    i,
  );
  await sleep(200);
}

/** Writes into a field of the dialog that is open, in place of what it holds. */
async function fill(selector, words) {
  await app.exec(`const i = document.querySelector(arguments[0]); i.focus(); i.select();`, selector);
  await sleep(80);
  if (words) await app.keys(words);
  else await app.press('Backspace');
}

/** Opens the window of the numbers of the lines, for the line the cursor is in. */
async function numbersWindow() {
  // The # button is a menu: the lines where the cursor is are its first item.
  await app.click('.pane-bar .tools button.lines');
  await app.waitFor('.menu', 3000);
  await app.clickText('.menu [role="menuitem"]', 'Number these lines…');
  await app.waitForText('dialog[open] h2', 'Numbers', 3000);
  await sleep(200);
}

/** The numbers the lines show in the margin, line by line: "-" where none, "!" where given by hand, "(n)" where held back. */
const shownNumbers = () =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p span.line-number')).map((w) =>
       w.classList.contains('blank') ? '-' : 'held' in w.dataset ? '(' + w.dataset.label + ')' : w.dataset.label + ('given' in w.dataset ? '!' : '')).join(' ')`,
    prose,
  );

try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Medea');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.keys(['Alt', 'Shift', 'Enter']);
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The nurse');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const body = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('nurse'));
     return s.querySelector('.body');`,
  );
  prose = `.text-view .section[data-section="${await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes(arguments[0])).dataset.section`,
    'nurse',
  )}"] .body .prose`;
  await app.click(body['element-6066-11e4-a52e-4f735466cecf']);
  await app.waitFor('.text-view .section .body .prose[contenteditable="true"]');
  await sleep(200);

  // --- Ten lines in two stanzas, typed with Shift+Enter and Enter, made verse ---
  const lines = [
    'If only the Argo had never flown',
    'through the dark Clashing Rocks',
    'to the land of Colchis,',
    'nor the pine been felled',
    'in the glens',
    'of Pelion, nor the heroes',
    'had taken oars in hand',
    'who went for the golden fleece',
    'for Pelias. Then my lady',
    'would not have sailed',
  ];
  for (const [i, line] of lines.entries()) {
    if (i === 5) await app.press('Enter');
    else if (i) await app.keys(['Shift', 'Enter']);
    await app.keys(line);
  }
  await sleep(200);
  await app.keys(['Control', 'a']);
  await app.click('.pane-bar .tools .style');
  await app.clickText('[role="menuitem"]', 'More…');
  await sleep(200);
  await app.clickText('[role="menuitem"]', 'Verse');
  await sleep(300);
  check(
    'two paragraphs of verse, of five lines each',
    (await app.exec(`return Array.from(document.querySelectorAll(arguments[0] + ' > p[data-kind="line"]')).map((p) => p.querySelectorAll('.hard-break').length + 1).join(',')`, prose)) === '5,5',
  );

  // --- Numbered, every 5 as the layout says: the first line is given 1 ---
  await toLine(0);
  await numbersWindow();
  await app.exec(
    `const s = document.querySelector('dialog[open] select'); s.value = 'counted';
     s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(150);
  await fill('dialog[open] [data-this-line] input:not([type="checkbox"])', '1');
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  check('the lines are numbered from 1 every 5, across the stanzas', (await shownNumbers()) === '1! - - - 5 - - - - 10', await shownNumbers());

  // --- The third line is given 1234 ---
  await toLine(2);
  await numbersWindow();
  check(
    'the window has a part for the line the cursor is in',
    (await app.exec(`return document.querySelector('dialog[open] [data-this-line] .words')?.textContent ?? ''`)) ===
      'to the land of Colchis,',
  );
  await fill('dialog[open] [data-this-line] input:not([type="checkbox"])', '1234');
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  check(
    'a number given by hand is shown as such, and the count goes on from it',
    (await shownNumbers()) === '1! - 1234! 1235 - - - - 1240 -',
    await shownNumbers(),
  );

  // --- The fifth line is not counted ---
  await toLine(4);
  await numbersWindow();
  await app.click('dialog[open] [data-this-line] input[data-uncounted]');
  await sleep(100);
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  check(
    'a line not counted is passed over by the count',
    (await shownNumbers()) === '1! - 1234! 1235 - - - - - 1240',
    await shownNumbers(),
  );

  // --- The tenth line is counted, its number not shown: in parentheses where one writes ---
  await toLine(9);
  await numbersWindow();
  await app.click('dialog[open] [data-this-line] input[data-hidden]');
  await sleep(100);
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  const held = await app.exec(
    `const w = Array.from(document.querySelectorAll(arguments[0] + ' > p span.line-number')).pop(); return { held: w.classList.contains('held') && 'held' in w.dataset, seen: w.textContent, before: getComputedStyle(w, '::before').content, after: getComputedStyle(w, '::after').content };`,
    prose,
  );
  check(
    'a line whose number is held back shows it in parentheses',
    (await shownNumbers()) === '1! - 1234! 1235 - - - - - (1240)' && held.held && /\(/.test(held.before + held.seen) && /\)/.test(held.after + held.seen),
    `${await shownNumbers()} ${JSON.stringify(held)}`,
  );

  // --- The sixth line has words in the margin ---
  await toLine(5);
  await numbersWindow();
  const fields = 'dialog[open] [data-this-line] input:not([type="checkbox"])';
  await app.exec(`document.querySelectorAll(arguments[0])[1].dataset.marginField = '';`, fields);
  await fill('[data-margin-field]', 'ia. trim.');
  await app.screenshot('line-numbers-0-window');
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  const margin = await app.exec(
    `const p = document.querySelectorAll(arguments[0] + ' > p')[1]; const w = p.querySelector('span.line-margin'); const box = w?.getBoundingClientRect();
     return { margins: p.hasAttribute('data-margins'), words: w?.textContent ?? null, seen: !!box && box.width > 0 };`,
    prose,
  );
  check(
    'the words in the margin are shown beside their line',
    margin.margins && margin.words === 'ia. trim.' && margin.seen,
    JSON.stringify(margin),
  );

  // --- A number given in place: the seventh line's place in the margin is pressed ---
  const seventh = await app.exec(`return document.querySelectorAll(arguments[0] + ' > p span.line-number')[6];`, prose);
  await app.hover(`${prose} > p:nth-of-type(2)`);
  await sleep(150);
  await app.click(seventh).catch(() => app.exec(`arguments[0].click();`, seventh));
  const field = await app.waitFor(`${prose} .line-number.editing > input.line-number-field`, 3000).then(
    () => true,
    () => false,
  );
  check('pressed, the place of a number opens a field for it', field);
  await app.keys('77');
  await app.press('Enter');
  await sleep(300);
  check(
    'Enter gives the line the number, and the count goes on from it',
    (await shownNumbers()) === '1! - 1234! 1235 - - 77! - - (80)' && !(await app.exists('.line-number.editing')),
    await shownNumbers(),
  );
  const given = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' span.linemark')).map((m) =>
       (m.getAttribute('data-number') ?? '') + (m.hasAttribute('data-uncounted') ? '~' : '') + (m.hasAttribute('data-hidden') ? '()' : '') + (m.getAttribute('data-margin') ? '|' + m.getAttribute('data-margin') : '')).join(',')`,
    prose,
  );
  check('what was given stays on its lines, as their marks', given === '1,1234,~,|ia. trim.,77,()', given);
  await app.screenshot('line-numbers-1-verse');

  // --- Out of the verse, a paragraph with reference marks ---
  await toLine(9);
  await app.press('Enter');
  await app.press('Enter');
  await sleep(200);
  await app.keys(['Control', 'Alt', 'k']);
  await app.waitForText('dialog[open] h2', 'Reference mark', 3000);
  await sleep(150);
  check(
    'the first mark has no label proposed',
    (await app.exec(`return document.querySelector('dialog[open] input').value`)) === '',
  );
  await app.keys('1:1');
  await app.press('Enter');
  await app.waitGone('dialog[open]', 3000);
  await sleep(200);
  await app.keys('In the beginning God created the heaven. ');
  await app.clickText('.pane-bar .tools button', 'Insert');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Reference mark');
  await app.waitForText('dialog[open] h2', 'Reference mark', 3000);
  await sleep(150);
  const proposed = await app.exec(`return document.querySelector('dialog[open] input').value`);
  check('the next label is proposed from the one before', proposed === '1:2', proposed);
  await app.press('Enter');
  await app.waitGone('dialog[open]', 3000);
  await sleep(200);
  await app.keys('And the earth was without form.');
  await sleep(300);
  const marks = () => app.exec(`return Array.from(document.querySelectorAll('.text-view .body .refmark')).map((m) => m.textContent)`);
  check('the marks stand in the text', (await marks()).join(' ') === '1:1 1:2', (await marks()).join(' '));

  // Pressed, a mark's label is changed.
  await app.click('.text-view .body .refmark');
  await app.waitForText('dialog[open] h2', 'Reference mark', 3000);
  await sleep(150);
  await fill('dialog[open] input', '1:1a');
  await app.press('Enter');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  check('a mark pressed has its label changed', (await marks()).join(' ') === '1:1a 1:2', (await marks()).join(' '));
  check(
    'spelling passes over the marks',
    (await app.exec(`return Array.from(document.querySelectorAll('.text-view .refmark .misspelt, .text-view .misspelt')).map((m) => m.textContent)`)).every(
      (w) => !/1:/.test(w),
    ),
  );

  // --- Search finds words across a mark ---
  await app.keys(['Control', 'f']);
  await app.waitFor('.search-bar input', 3000);
  await sleep(150);
  await app.keys('heaven. And');
  await sleep(800);
  const said = await app.exec(`return document.querySelector('.search-bar .said')?.textContent.trim() ?? null`);
  check('search finds words on either side of a mark', /\b1\b/.test(said ?? '') && !/^0|no /i.test(said ?? ''), said);
  await app.screenshot('line-numbers-2-marks');
  await app.press('Escape');
  await sleep(200);

  // --- The preview, set by Typst from the project ---
  await app.keys(['Control', 'p']);
  const opened = await app.waitFor('.preview', 3000).then(
    () => true,
    () => false,
  );
  if (!opened) await app.typeset();
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  check('the preview is made without remark', !(await app.exists('.preview footer .issues')));
  await app.screenshot('line-numbers-3-preview');
  const typ = execFileSync('find', [app.dataDir, '-name', 'document.typ'], { encoding: 'utf8' }).trim().split('\n')[0];
  const typst = typ ? readFileSync(typ, 'utf8') : '';
  const at = typst.indexOf('#gk-verse[');
  const line = (n, margin = 'none') => `#gk-line("line", 0, n: ${n}, margin: ${margin}, side: "left")[`;
  check(
    'the Typst of the preview has the lines in one block, with the numbers and the words in the margin',
    (typst.match(/#gk-verse\[/g) ?? []).length === 1 &&
      typst.includes('#v(1em)') &&
      typst.includes(line('"1"')) &&
      typst.includes(line('"1234"')) &&
      typst.includes(line('"1235"')) &&
      typst.includes(line('none', '"ia. trim."')) &&
      typst.includes(line('"77"')) &&
      !typst.includes('n: "80"') &&
      (typst.match(/#gk-line\(/g) ?? []).length === 10 &&
      (typst.match(/, n: "/g) ?? []).length === 4,
    typst.slice(at, at + 1400),
  );
  check(
    'the Typst of the preview has the marks, raised',
    typst.includes('#gk-refmark("1:1a");') &&
      typst.includes('#gk-refmark("1:2");') &&
      typst.includes('#let gk-refmark(label) = super('),
    typst.slice(typst.indexOf('gk-refmark'), typst.indexOf('gk-refmark') + 200),
  );

  // --- A document made as Typst by the command of export, the marks in the margin ---
  const out = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-out-'));
  const made = await app
    .execAsync(
      `const invoke = window.__TAURI_INTERNALS__.invoke;
       const format = await invoke('formats_get', { id: 'manuscript' });
       format.text.refmarks = 'margin';
       const t = (text) => ({ kind: 'text', text, marks: {} });
       const document = {
         title: [t('Genesis')], authors: [], keywords: [], references: [], language: 'en-US',
         sections: [{ level: 1, heading: [t('Genesis')], element: null, blocks: [
           { kind: 'paragraph', name: 'text', indent: 0, content: [{ kind: 'refmark', label: '1:1' }, t('In the beginning. '),
             { kind: 'refmark', label: '1:2' }, t('And the earth.')] },
           { kind: 'paragraph', name: 'line', indent: 0, numbering: 'counted', content: [
             { kind: 'linemark', number: '567' }, t('one'), { kind: 'break' },
             { kind: 'linemark', number: '567a' }, t('two'), { kind: 'break' },
             { kind: 'linemark', counted: false }, t('three'), { kind: 'break' },
             { kind: 'linemark', margin: 'lyr.' }, t('four'), { kind: 'break' },
             t('five'), { kind: 'break' },
             { kind: 'linemark', hidden: true }, t('six'), { kind: 'break' },
             { kind: 'linemark', indent: 1 }, t('seven'),
           ] },
         ] }],
       };
       const request = { document, style: 'chicago-author-date', format, key: 'marks' };
       return await invoke('document_export', { request, target: 'typst', path: arguments[0], options: {} });`,
      join(out, 'genesis.typ'),
    )
    .catch((e) => ({ error: String(e.message ?? e) }));
  check('a document is made as Typst', !made?.error, JSON.stringify(made).slice(0, 300));
  if (!made?.error) {
    const text = readFileSync(join(out, 'genesis.typ'), 'utf8');
    check(
      'the exported Typst sets the marks in the margin, counts on from a label, and holds back a hidden number',
      text.includes('here().position()') &&
        text.includes('#gk-refmark("1:2"); And the earth') &&
        text.includes('#gk-line("line", 0, n: "567", margin: none, side: "left")[') &&
        text.includes('#gk-line("line", 0, n: "567a", margin: none, side: "left")[') &&
        text.includes('#gk-line("line", 0, n: none, margin: none, side: "left")[') &&
        text.includes('#gk-line("line", 0, n: none, margin: "lyr.", side: "left")[') &&
        text.includes('#gk-line("line", 1, n: none, margin: none, side: "left")[') &&
        !text.includes('n: "570"') &&
        (text.match(/#gk-line\(/g) ?? []).length === 7,
      text.slice(text.indexOf('#gk-refmark("1:1")'), text.indexOf('#gk-refmark("1:1")') + 600),
    );
  }
  rmSync(out, { recursive: true, force: true });

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('line-numbers-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  const data = app.dataDir;
  await app.close();
  rmSync(data, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
