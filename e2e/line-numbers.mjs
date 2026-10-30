// Marks on lines, and reference marks (ADR 0041, ADR 0039, ADR 0067). Ten
// lines of verse in two stanzas are numbered from 1, every 5 as the layout
// says, through Line numbering from here: the count begins from 1, which
// is a setting of the stretch, not a number on a line, and is not shown,
// since it does not fall on every fifth. Through Numbering of this line, the
// third is given 1234, which is shown at once, as a number given by hand is;
// the fifth is not counted; the tenth's number is never shown; the sixth
// has an annotation; and the seventh is given the label 7a in its place in
// the margin, which is shown and counted on from. Then a paragraph with
// reference marks: one by its key, one from the Insert menu, whose label is
// proposed from the one before, and one changed by pressing it. Search
// finds words across a mark, and spelling passes over it. The paragraph
// gains two lines, and the second of its three is given 9: the preview
// shows it beside that line. The preview is made without remark from Typst
// that has the numbers, the annotations and the marks; a document made as
// Typst by the command of export, with the layout setting the marks in the
// margin, has them there; and a verse with a quotation among its lines,
// counting the lines of verse only, passes over the quotation.

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

/** Presses the right button in the middle of the words of the line of verse given, counted through every paragraph, as a right-click there does. */
async function rightClickLine(i) {
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
     const last = lines[arguments[1]].at(-1);
     const range = document.createRange();
     range.selectNodeContents(last);
     const box = range.getBoundingClientRect();
     const x = box.left + box.width / 2, y = box.top + box.height / 2;
     const common = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, screenX: x, screenY: y, view: window };
     const send = (event) => document.elementFromPoint(x, y)?.dispatchEvent(event);
     send(new PointerEvent('pointerdown', { ...common, button: 2, buttons: 2, pointerType: 'mouse', isPrimary: true }));
     send(new MouseEvent('mousedown', { ...common, button: 2, buttons: 2 }));
     send(new MouseEvent('contextmenu', { ...common, button: 2, buttons: 2 }));
     send(new PointerEvent('pointerup', { ...common, button: 2, buttons: 0, pointerType: 'mouse', isPrimary: true }));
     send(new MouseEvent('mouseup', { ...common, button: 2, buttons: 0 }));`,
    prose,
    i,
  );
}

/** Writes into a field of the dialog that is open, in place of what it holds. */
async function fill(selector, words) {
  await app.exec(`const i = document.querySelector(arguments[0]); i.focus(); i.select();`, selector);
  await sleep(80);
  if (words) await app.keys(words);
  else await app.press('Backspace');
}

/** Opens Line numbering from here, from the paragraph the cursor is in. */
async function numberingWindow() {
  await app.lineNumberingFromHere();
  await app.waitForText('dialog[open] h2', 'Line numbering from here', 3000);
  await sleep(200);
}

/** Opens Numbering of this line, for the line the cursor is in. */
async function lineWindow() {
  await app.numberingOfThisLine();
  await app.waitForText('dialog[open] h2', 'Numbering of this line', 3000);
  await sleep(200);
}

/** Chooses in a chooser of the window that is open, found by the mark around it. */
async function chooseIn(mark, value) {
  await app.exec(
    `const s = document.querySelector('dialog[open] [' + arguments[0] + '] select'); s.value = arguments[1];
     s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));`,
    mark,
    value,
  );
  await sleep(150);
}

/** Applies the window that is open, and waits for it to go. */
async function apply() {
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
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
  await app.view('diagram');
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
  await app.click('.pane-bar [data-paragraph-kind]');
  await app.clickText('[role="menuitem"]', 'More…');
  await sleep(200);
  await app.clickText('[role="menuitem"]', 'Verse');
  await sleep(300);
  check(
    'two paragraphs of verse, of five lines each',
    (await app.exec(`return Array.from(document.querySelectorAll(arguments[0] + ' > p[data-kind="line"]')).map((p) => p.querySelectorAll('.hard-break').length + 1).join(',')`, prose)) === '5,5',
  );

  // --- Numbered, every 5 as the layout says, from 1: the count begins from 1, which is not shown ---
  await toLine(0);
  await numberingWindow();
  await chooseIn('data-numbering', 'counted');
  check(
    'the window fills in the number to count from, and has no hints',
    (await app.exec(`return document.querySelector('dialog[open] input[data-number-from]')?.value ?? null`)) === '1' &&
      !(await app.exists('dialog[open] .hint, dialog[open] small, dialog[open] .field .message:not(.error)')),
  );
  await apply();
  check(
    'the lines are numbered from 1 every 5, across the stanzas; the 1 the count begins from stands on no line',
    (await shownNumbers()) === '- - - - 5 - - - - 10',
    await shownNumbers(),
  );

  // --- The third line is given 1234 in its window: shown at once, and the count goes on from it ---
  await toLine(2);
  await lineWindow();
  check(
    'the window of the line says the words of the line the cursor is in',
    (await app.exec(`return document.querySelector('dialog[open] .words')?.textContent ?? ''`)) ===
      'to the land of Colchis,',
  );
  await fill('dialog[open] input[data-line-number]', '1234');
  await apply();
  check(
    'a number given by hand is shown, though it does not fall on every fifth, and the count goes on from it',
    (await shownNumbers()) === '- - 1234! 1235 - - - - 1240 -',
    await shownNumbers(),
  );
  await lineWindow();
  check(
    'its window says the number is shown as the others are, and offers always and never',
    (await app.exec(`return document.querySelector('dialog[open] [data-shown] select')?.value ?? null`)) === 'others',
  );
  await app.clickText('dialog[open] footer button', 'Cancel');
  await app.waitGone('dialog[open]', 3000);

  // --- A right press on a later line of the paragraph speaks of that line, the cursor going there ---
  await toLine(0);
  await rightClickLine(3);
  await app.waitFor('.menu', 3000);
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Numbering of this line…');
  await app.waitForText('dialog[open] h2', 'Numbering of this line', 3000);
  await sleep(200);
  check(
    'the window opened by a right press on the fourth line of the paragraph is of that line, though the cursor stood on the first',
    (await app.exec(`return document.querySelector('dialog[open] .words')?.textContent ?? ''`)) ===
      'nor the pine been felled',
    await app.exec(`return document.querySelector('dialog[open] .words')?.textContent ?? ''`),
  );
  await app.clickText('dialog[open] footer button', 'Cancel');
  await app.waitGone('dialog[open]', 3000);

  // --- The fifth line is not counted ---
  await toLine(4);
  await lineWindow();
  await app.click('dialog[open] input[data-counted]');
  await sleep(100);
  check('a line not counted is not asked whether its number is shown', !(await app.exists('dialog[open] [data-shown]')));
  await apply();
  check(
    'a line not counted is passed over by the count',
    (await shownNumbers()) === '- - 1234! 1235 - - - - - 1240',
    await shownNumbers(),
  );

  // --- The tenth line is counted, its number never shown: in parentheses where one writes ---
  await toLine(9);
  await lineWindow();
  await chooseIn('data-shown', 'never');
  await apply();
  const held = await app.exec(
    `const w = Array.from(document.querySelectorAll(arguments[0] + ' > p span.line-number')).pop(); return { held: w.classList.contains('held') && 'held' in w.dataset, seen: w.textContent, before: getComputedStyle(w, '::before').content, after: getComputedStyle(w, '::after').content };`,
    prose,
  );
  check(
    'a line whose number is never shown shows it in parentheses',
    (await shownNumbers()) === '- - 1234! 1235 - - - - - (1240)' && held.held && /\(/.test(held.before + held.seen) && /\)/.test(held.after + held.seen),
    `${await shownNumbers()} ${JSON.stringify(held)}`,
  );

  // --- The sixth line has an annotation, across from the numbers ---
  await toLine(5);
  await lineWindow();
  check(
    'the field of the annotation is named by the margin it goes to',
    (await app.exec(`return Array.from(document.querySelectorAll('dialog[open] label')).map((l) => l.textContent.trim())`)).includes(
      'Annotation in the right margin',
    ),
  );
  await fill('dialog[open] input[data-annotation]', 'ia. trim.');
  await app.screenshot('line-numbers-0-window');
  await apply();
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

  // --- A label given in place: the seventh line's place in the margin is pressed ---
  const seventh = await app.exec(`return document.querySelectorAll(arguments[0] + ' > p span.line-number')[6];`, prose);
  await app.hover(`${prose} > p:nth-of-type(2)`);
  await sleep(150);
  await app.click(seventh).catch(() => app.exec(`arguments[0].click();`, seventh));
  const field = await app.waitFor(`${prose} .line-number.editing > input.line-number-field`, 3000).then(
    () => true,
    () => false,
  );
  check('pressed, the place of a number opens a field for it', field);
  await app.keys('7a');
  await app.press('Enter');
  await sleep(300);
  check(
    'Enter gives the line the label, which is shown, and the count goes on from its digits',
    (await shownNumbers()) === '- - 1234! 1235 - - 7a! - - (10)' && !(await app.exists('.line-number.editing')),
    await shownNumbers(),
  );
  const given = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' span.linemark')).map((m) =>
       (m.getAttribute('data-number') ?? '') + (m.hasAttribute('data-shown') ? '+' : '') + (m.hasAttribute('data-uncounted') ? '~' : '') + (m.hasAttribute('data-hidden') ? '()' : '') + (m.getAttribute('data-margin') ? '|' + m.getAttribute('data-margin') : '')).join(',')`,
    prose,
  );
  check('what was given stays on its lines, as their marks', given === '1234,~,|ia. trim.,7a,()', given);
  await app.screenshot('line-numbers-1-verse');

  // --- Out of the verse, a paragraph with reference marks ---
  await toLine(9);
  await app.press('Enter');
  await app.press('Enter');
  await sleep(200);
  await app.keys(['Control', 'Alt', 'k']);
  await app.waitForText('dialog[open] h2', 'Inline number', 3000);
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
  await app.click('.pane-bar [data-insert]');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Inline number');
  await app.waitForText('dialog[open] h2', 'Inline number', 3000);
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
  await app.waitForText('dialog[open] h2', 'Inline number', 3000);
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

  // --- A number given by hand on a later line of a text paragraph, as a play's lines are often written ---
  const lineOf = (words) =>
    app.exec(
      `const lines = [];
       for (const p of document.querySelectorAll(arguments[0] + ' > p')) {
         let line = '';
         lines.push(line);
         const walker = document.createTreeWalker(p, NodeFilter.SHOW_ALL);
         let node;
         while ((node = walker.nextNode())) {
           if (node.nodeType === 1 && node.classList.contains('hard-break')) lines.push('');
           if (node.nodeType === 3 && !node.parentElement.closest('.run-line, .line-number, .line-margin')) lines[lines.length - 1] += node.data;
         }
       }
       return lines.findIndex((l) => l.includes(arguments[1]));`,
      prose,
      words,
    );
  await toLine(await lineOf('without form'));
  await app.keys(['Shift', 'Enter']);
  await app.keys('And darkness was upon the face of the deep.');
  await app.keys(['Shift', 'Enter']);
  await app.keys('And the spirit moved upon the waters.');
  await sleep(300);
  await toLine(await lineOf('And darkness'));
  await numberingWindow();
  await chooseIn('data-numbering', 'counted');
  await apply();
  await lineWindow();
  await fill('dialog[open] input[data-line-number]', '9');
  await apply();
  const nine = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' span.linemark')).some((m) => m.getAttribute('data-number') === '9')`,
    prose,
  );
  check('the second line of the text paragraph is given 9', nine);

  // --- The preview, set by Typst from the project ---
  await app.keys(['Control', 't']);
  const opened = await app.waitFor('.preview', 3000).then(
    () => true,
    () => false,
  );
  if (!opened) await app.typeset();
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  check('the preview is made without remark', !(await app.exists('.preview footer .issues')));
  await app.screenshot('line-numbers-3-preview');
  // The number given on the later line stands on the page, beside that line, not off the page.
  await app.waitFor('.preview .page .texts span', 10000).catch(() => {});
  const besideLater = await app.exec(
    `const spans = Array.from(document.querySelectorAll('.preview .page .texts span'));
     const nine = spans.find((s) => s.textContent.trim() === '9');
     const dark = spans.find((s) => s.textContent.includes('And darkness'));
     if (!nine || !dark) return { nine: !!nine, dark: !!dark };
     const page = nine.closest('.page').getBoundingClientRect();
     const n = nine.getBoundingClientRect();
     const d = dark.getBoundingClientRect();
     const middle = (n.top + n.bottom) / 2;
     return { onPage: n.left >= page.left && n.left < d.left, atLine: middle >= d.top - 2 && middle <= d.bottom + 2, n: [n.left, n.top], d: [d.left, d.top, d.bottom], page: page.left };`,
  );
  check(
    'a number given on a later line of a text paragraph stands beside that line in the preview',
    besideLater.onPage && besideLater.atLine,
    JSON.stringify(besideLater),
  );
  const typ = execFileSync('find', [app.dataDir, '-name', 'document.typ'], { encoding: 'utf8' }).trim().split('\n')[0];
  const typst = typ ? readFileSync(typ, 'utf8') : '';
  const at = typst.indexOf('#gk-verse[');
  const line = (n, margin = 'none') => `#gk-line("line", 0, n: ${n}, margin: ${margin}, side: "left")[`;
  check(
    'the Typst of the preview has the lines in one block, with the numbers the page shows and the annotation',
    (typst.match(/#gk-verse\[/g) ?? []).length === 1 &&
      typst.includes('#v(1em)') &&
      !/n: "1",/.test(typst) &&
      typst.includes(line('"1234"')) &&
      typst.includes(line('"1235"')) &&
      typst.includes(line('none', '"ia. trim."')) &&
      typst.includes(line('"7a"')) &&
      !typst.includes('n: "10"') &&
      (typst.match(/#gk-line\(/g) ?? []).length === 10 &&
      (typst.match(/, n: "/g) ?? []).length === 3,
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
             { kind: 'linemark', number: '567', shown: true }, t('one'), { kind: 'break' },
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
      'the exported Typst sets the marks in the margin, shows a number said to be shown always, counts on from a label, and holds back a hidden number',
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

  // --- Count the lines of one kind: a verse with a quotation among its lines ---
  await toLine(await lineOf('upon the waters'));
  await app.press('Enter');
  await app.keys('Sing, goddess,');
  await app.keys(['Shift', 'Enter']);
  await app.keys('the wrath of Achilles');
  await app.press('Enter');
  await app.keys('A quoted line');
  await app.press('Enter');
  await app.keys('son of Peleus');
  await sleep(200);
  const last = async (n) => {
    await app.exec(
      `const ps = document.querySelectorAll(arguments[0] + ' > p'); const p = ps[ps.length - arguments[1]];
       const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let node, end = null;
       while ((node = walker.nextNode())) if (!node.parentElement.closest('.run-line, .line-number, .line-margin')) end = node;
       getSelection().collapse(end, end.data.length);`,
      prose,
      n,
    );
    await sleep(200);
  };
  for (const [n, kind] of [[3, 'Verse'], [1, 'Verse']]) {
    await last(n);
    await app.click('.pane-bar [data-paragraph-kind]');
    await app.clickText('[role="menuitem"]', 'More…');
    await sleep(200);
    await app.clickText('[role="menuitem"]', kind);
    await sleep(300);
  }
  await last(2);
  await app.click('.pane-bar [data-paragraph-kind]');
  await app.clickText('[role="menuitem"]', 'Quotation');
  await sleep(300);
  // The three selected, from the start of the first to the end of the last.
  await app.exec(
    `const ps = Array.from(document.querySelectorAll(arguments[0] + ' > p')).slice(-3);
     const texts = (p) => { const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); const out = []; let n;
       while ((n = w.nextNode())) if (!n.parentElement.closest('.run-line, .line-number, .line-margin')) out.push(n); return out; };
     const first = texts(ps[0])[0]; const end = texts(ps[2]).pop();
     getSelection().setBaseAndExtent(first, 0, end, end.data.length);`,
    prose,
  );
  await sleep(300);
  await numberingWindow();
  await chooseIn('data-numbering', 'counted');
  const offered = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] [data-only] option')).map((o) => o.value + ':' + o.textContent.trim())`,
  );
  check(
    'Count the lines of offers every kind, and the kinds counted among the paragraphs',
    offered.join(' | ') === ':Every kind | line:Verse | quote:Quotation',
    offered.join(' | '),
  );
  // The new paragraphs were written in the numbered stretch of the text: the count is filled in as it stands there.
  const from = await app.exec(`return document.querySelector('dialog[open] input[data-number-from]')?.value ?? null`);
  check('the number to count from is the one the first line has now', from === '11', from);
  await chooseIn('data-only', 'line');
  await fill('dialog[open] input[data-every]', '1');
  await apply();
  const lastNumbers = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).slice(-3).map((p) =>
       Array.from(p.querySelectorAll('span.line-number')).map((w) => w.classList.contains('blank') ? '-' : w.dataset.label).join(' ')).join(' | ')`,
    prose,
  );
  check('counting the lines of verse only, the quotation is passed over', lastNumbers === '11 12 | - | 13', lastNumbers);
  await app.screenshot('line-numbers-4-only');

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
