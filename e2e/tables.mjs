// Tables: written where the text is written, brought in from files, shown, and part of the document.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

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
writeFileSync(
  join(desk, 'Ships of the Achaeans.csv'),
  '﻿Leader;Ships;Share;From\nAgamemnon;100;8,4;Mycenae\nNestor;90;7,6;Pylos\n"Aias, son of Telamon";12;1,0;Salamis\nOdysseus;12;1,0;Ithaca\n',
);
writeFileSync(join(desk, 'a letter.txt'), 'Dear friend,\nthis is no table.\n');
writeFileSync(
  join(desk, 'too many.csv'),
  Array.from({ length: 2001 }, (_, i) => `${i},x`).join('\n'),
);

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const invoke = (command, args = {}) =>
    app.execAsync(
      `return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`,
      command,
      args,
    );
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
  /** The middle of something, which is brought into sight first. */
  const at = (selector, dy = 0) =>
    app.exec(
      `document.querySelector(arguments[0]).scrollIntoView({ block: 'center' });
       const r = document.querySelector(arguments[0]).getBoundingClientRect();
       return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) + arguments[1] };`,
      selector,
      dy,
    );
  const section = (name) => `.text-view .section[data-title="${name}"]`;
  const mark = () =>
    app.exec(
      `for (const s of document.querySelectorAll('.text-view .section')) {
         const t = s.querySelector('.heading .prose');
         s.dataset.title = t ? t.textContent.trim() : '';
       }`,
    );
  /** The tables of a part of the window: the label, what is said, and the rows, headings marked by a star. */
  const tables = (scope) =>
    app.exec(
      `// A citation is shown as @, a note as a star, a formula as $.
       const held = (c) => {
         const copy = c.cloneNode(true);
         for (const e of copy.querySelectorAll('.citation')) e.replaceWith('@');
         for (const e of copy.querySelectorAll('.footnote')) e.replaceWith('°');
         for (const e of copy.querySelectorAll('.math')) e.replaceWith('$');
         return copy.textContent.replace(/\\u00a0/g, ' ');
       };
       return Array.from(document.querySelectorAll(arguments[0] + ' figure.tabular')).map((f) => {
         const said = f.querySelector('figcaption');
         const rows = Array.from(f.querySelectorAll('tr')).map((tr) =>
           Array.from(tr.children).map((c) =>
             (c.tagName === 'TH' ? '*' : '') + held(c) +
             (c.colSpan > 1 ? '×' + c.colSpan : '') + (c.rowSpan > 1 ? '↓' + c.rowSpan : '') +
             (c.style.textAlign ? '>' + c.style.textAlign : '')).join(','));
         return ((said && said.dataset.label) || '').replace(/\\u00a0/g, ' ') + (said ? said.textContent : '') + ' [' + rows.join(' / ') + ']';
       })`,
      scope,
    );
  const items = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.menu [role="menuitem"], .menu [role="menuitemcheckbox"], .menu button')).map((b) => b.textContent.replace(/\\s+/g, ' ').trim())`,
    );
  const choose = async (words) => {
    await app.waitFor('.menu');
    await sleep(120);
    await app.clickText(
      '.menu [role="menuitem"], .menu [role="menuitemcheckbox"], .menu button',
      words,
    );
    await sleep(200);
  };
  const tool = async (name, words) => {
    await app.waitFor(`.table-bar [data-tool="${name}"]`, 3000);
    await app.click(`.table-bar [data-tool="${name}"]`);
    if (words) await choose(words);
    else await sleep(200);
  };
  const insert = async (words) => {
    await app.clickText('.text-view .tools button', 'Insert');
    await app.waitFor('.menu');
    await app.clickText('.menu [role="menuitem"], .menu button', words);
  };
  const focusIn = () =>
    app.exec(
      `const s = getSelection(); const n = s.anchorNode; const e = n && (n.nodeType === 1 ? n : n.parentElement);
       if (!e) return '';
       const cell = e.closest('td, th'); if (cell) return 'cell:' + cell.textContent;
       if (e.closest('figcaption')) return 'caption';
       const p = e.closest('p'); return p ? 'p:' + p.textContent : e.tagName;`,
    );

  // References to cite.
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.execAsync(
    `const plan = await window.__TAURI_INTERNALS__.invoke('import_bib_text', { text: arguments[0] });
     await window.__TAURI_INTERNALS__.invoke('import_apply', { plan });`,
    bib,
  );

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const project = (await invoke('project_list'))[0].id;
  await app.click('.diagram .node.root');
  const add = async (key, name) => {
    await app.press(key);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await add('Tab', 'The catalogue');
  await add('Enter', 'The ships');
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(300);
  await mark();
  const text = `${section('The catalogue')} .ProseMirror.body`;

  // ---- a table, asked for by its size ----
  await app.click(`${section('The catalogue')} .body`);
  await sleep(300);
  await app.keys('The poems, counted.');
  await insert('Table…');
  await app.waitFor('.popover .size input[type="number"]', 3000);
  await sleep(250);
  const asked = await app.exec(
    `const n = document.querySelectorAll('.popover .size input[type="number"]');
     return n[0].value + 'x' + n[1].value + ':' + document.querySelector('.popover .size input[type="checkbox"]').checked + ':' + document.querySelectorAll('.popover .grid button.on').length`,
  );
  check(
    'Insert › Table… asks for rows and columns: three by three, the first row headings',
    asked === '3x3:true:9',
    asked,
  );
  await app.screenshot('tables-1-size');
  await app.press('Enter');
  await app.waitGone('.popover');
  await until('the table', () => app.exists(`${text} figure.tabular table`));
  check(
    'the table stands after the paragraph',
    (await tables(text)).join('') === 'Table 1 [*,*,* / ,, / ,,]',
    (await tables(text)).join(''),
  );
  check(
    'the cursor is in its first cell',
    (await focusIn()) === 'cell:' &&
      (await app.exec(
        `const s = getSelection(); const c = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement).closest('th'); return !!c && c === document.querySelector(arguments[0] + ' th')`,
        text,
      )),
  );
  await until('the tools of the table', () => app.exists('.table-bar .bar'));
  check('the tools of the table are shown while the cursor is in it', true);

  // ---- writing in cells ----
  for (const word of ['Work', 'Lines', 'Books', 'Iliad', '15693', '24', 'Odyssey', '12109', '24']) {
    await app.keys(word);
    if (word !== '24' || !(await tables(text)).join('').includes('12109,24'))
      await app.press('Tab');
    await sleep(60);
  }
  check(
    'Tab goes from cell to cell',
    (await tables(text)).join('') ===
      'Table 1 [*Work,*Lines,*Books / Iliad,15693,24 / Odyssey,12109,24]',
    (await tables(text)).join(''),
  );
  await app.press('Tab');
  await sleep(150);
  await app.keys('Both');
  await app.press('Tab');
  await app.keys('27802');
  check(
    'and from the last cell to a new row',
    (await tables(text)).join('') ===
      'Table 1 [*Work,*Lines,*Books / Iliad,15693,24 / Odyssey,12109,24 / Both,27802,]',
    (await tables(text)).join(''),
  );

  // ---- a citation in a cell ----
  await app.press('Tab');
  await sleep(100);
  await app.keys('@');
  await app.waitFor('.picker input');
  await app.keys('nagy best');
  await sleep(300);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('12');
  await app.press('Enter');
  await app.waitGone('.editor');
  await sleep(200);
  const cited = await app.exec(
    `const c = document.querySelector(arguments[0] + ' tr:nth-child(4) td:nth-child(3) .citation'); return c ? c.textContent : null`,
    text,
  );
  check('a work is cited in a cell, by @', /Nagy 1979, 12/.test(cited ?? ''), String(cited));
  await app.keys(['Shift', 'Tab']);
  await sleep(100);
  check('Shift-Tab goes back', (await focusIn()) === 'cell:27802', await focusIn());

  // ---- what is said of it ----
  await app.click(`${text} figure.tabular figcaption`);
  await sleep(200);
  check(
    'nothing is said of it yet, and the place for it says so',
    await app.exec(
      `return document.querySelector(arguments[0] + ' figure.tabular').classList.contains('uncaptioned') && getComputedStyle(document.querySelector(arguments[0] + ' figure.tabular figcaption'), '::after').content.includes('What is said of the table')`,
      text,
    ),
  );
  await app.keys('The poems and their lines');
  const label = await until('the word and the number', () =>
    app.exec(
      `return document.querySelector(arguments[0] + ' figure.tabular figcaption').dataset.label || null`,
      text,
    ),
  );
  check(
    'before what is said of it stand the word and the number',
    label === 'Table 1. ',
    JSON.stringify(label),
  );
  const over = await app.exec(
    `const f = document.querySelector(arguments[0] + ' figure.tabular'); return f.querySelector('figcaption').getBoundingClientRect().bottom <= f.querySelector('table').getBoundingClientRect().top + 1`,
    text,
  );
  check('what is said of it stands over the table', over);
  await app.screenshot('tables-2-written');
  await app.press('Tab');
  await sleep(100);
  check(
    'Tab in what is said of it goes to the first cell',
    (await focusIn()) === 'cell:Work',
    await focusIn(),
  );
  await app.keys(['Shift', 'Tab']);
  await sleep(100);
  check('and Shift-Tab from there back', (await focusIn()) === 'caption', await focusIn());
  await app.press('Enter');
  await sleep(150);
  await app.keys('After the table.');
  const after = await app.exec(
    `const f = document.querySelector(arguments[0] + ' figure.tabular'); return (f.nextElementSibling ? f.nextElementSibling.textContent : null) + '|' + document.querySelectorAll(arguments[0] + ' figure.tabular').length`,
    text,
  );
  check('Enter leaves the table for the text after it', after === 'After the table.|1', after);

  // ---- the arrows ----
  await app.press('ArrowUp');
  await sleep(150);
  check(
    'the arrow up from the text under it goes into the table',
    /^cell:/.test(await focusIn()),
    await focusIn(),
  );
  await app.click(`${text} tr:last-child td`);
  await sleep(150);
  await app.press('ArrowDown');
  await sleep(150);
  check(
    'the arrow down from its last row leaves it',
    (await focusIn()) === 'p:After the table.',
    await focusIn(),
  );
  await app.click(`${text} th`);
  await sleep(150);
  await app.press('ArrowUp');
  await sleep(150);
  check(
    'the arrow up from its first row goes to what is said of it',
    (await focusIn()) === 'caption',
    await focusIn(),
  );
  await app.press('ArrowUp');
  await sleep(150);
  check(
    'and from there to the text over it',
    (await focusIn()) === 'p:The poems, counted.',
    await focusIn(),
  );

  // ---- rows and columns ----
  await app.click(`${text} tr:nth-child(2) td:nth-child(2)`);
  await sleep(200);
  await tool('rows', 'A row above');
  await tool('columns', 'A column after');
  check(
    'a row above and a column after',
    (await tables(text)).join('') ===
      'Table 1. The poems and their lines [*Work,*Lines,*,*Books / ,,, / Iliad,15693,,24 / Odyssey,12109,,24 / Both,27802,,@]',
    (await tables(text)).join(''),
  );
  await app.click(`${text} tr:nth-child(2) td:nth-child(3)`);
  await sleep(200);
  await tool('rows', 'Remove the row');
  await app.click(`${text} tr:nth-child(2) td:nth-child(3)`);
  await sleep(200);
  await tool('columns', 'Remove the column');
  check(
    'and removed again',
    (await tables(text)).join('') ===
      'Table 1. The poems and their lines [*Work,*Lines,*Books / Iliad,15693,24 / Odyssey,12109,24 / Both,27802,@]',
    (await tables(text)).join(''),
  );

  // ---- where what the cells hold stands ----
  await app.click(`${text} tr:nth-child(2) td:nth-child(2)`);
  await sleep(200);
  await tool('right');
  check(
    'what a cell holds is set to the right',
    (await tables(text)).join('').includes('Iliad,15693>right,24'),
    (await tables(text)).join(''),
  );
  check('and the tool says so', await app.exists('.table-bar [data-tool="right"].on'));

  // ---- cells joined and split ----
  await app.click(`${text} tr:nth-child(4) td:nth-child(2)`);
  await sleep(200);
  check('one cell cannot be joined', await app.exists('.table-bar [data-tool="join"]:disabled'));
  await app.keys(['Control', 'End']);
  await app.click(`${text} tr:nth-child(4) td:nth-child(2)`);
  await app.press('End');
  await app.keys(['Shift', 'ArrowRight']);
  await until(
    'two cells to be selected',
    async () => (await app.count(`${text} .selectedCell`)) === 2,
  );
  check('cells are selected with Shift and the arrows', true);
  await app.screenshot('tables-3-selected');
  await tool('join');
  check(
    'and joined',
    (await tables(text)).join('').endsWith('/ Both,27802@×2]'),
    (await tables(text)).join(''),
  );
  await app.click(`${text} tr:nth-child(4) td:nth-child(2)`);
  await sleep(200);
  await tool('split');
  check(
    'a cell that was joined is split',
    (await tables(text)).join('').endsWith('/ Both,27802@,]'),
    (await tables(text)).join(''),
  );

  // ---- headings ----
  await tool('headings');
  await app.waitFor('.menu');
  await sleep(150);
  const ticked = await app.exec(
    `return Array.from(document.querySelectorAll('.menu .item')).map((i) => (i.querySelector('.check svg') ? '✓' : '') + i.textContent.trim()).join(' | ')`,
  );
  check(
    'the first row is headings, the first column is not',
    ticked === '✓The first row is headings | The first column is headings',
    ticked,
  );
  await choose('The first column is headings');
  check(
    'the first column is made headings',
    (await tables(text)).join('') ===
      'Table 1. The poems and their lines [*Work,*Lines,*Books / *Iliad,15693>right,24 / *Odyssey,12109,24 / *Both,27802@,]',
    (await tables(text)).join(''),
  );
  await tool('headings', 'The first row is headings');
  check(
    'and the first row is not',
    (await tables(text)).join('').includes('[*Work,Lines,Books / *Iliad'),
    (await tables(text)).join(''),
  );
  await tool('headings', 'The first row is headings');
  await tool('headings', 'The first column is headings');
  check(
    'and as it was',
    (await tables(text)).join('').includes('[*Work,*Lines,*Books / Iliad,'),
    (await tables(text)).join(''),
  );

  // ---- the menu on a cell ----
  await app.rightClick(`${text} tr:nth-child(3) td:nth-child(1)`);
  await app.waitFor('.menu');
  await sleep(200);
  const offered = (await items()).join(' | ');
  check(
    'the menu on a cell has the same',
    offered ===
      'A row above | A row below | Remove the row | A column before | A column after | Remove the column | Join the cells | Split the cell | The first row is headings | The first column is headings | To the left | In the middle | To the right | Numbered | The table… How wide it is | Remove the table',
    offered,
  );
  await app.screenshot('tables-4-menu');
  await choose('A row below');
  check(
    'and does it to the cell it was asked for on',
    (await tables(text)).join('').includes('/ Odyssey,12109,24 / ,, / Both,27802@,]'),
    (await tables(text)).join(''),
  );
  await app.keys(['Control', 'z']);
  await sleep(250);
  check(
    'what was done is undone',
    (await tables(text)).join('').includes('/ Odyssey,12109,24 / Both,27802@,]'),
    (await tables(text)).join(''),
  );

  // ---- the tools for writing, in a cell ----
  await app.click(`${text} tr:nth-child(4) td:nth-child(1)`);
  await sleep(200);
  await app.press('End');
  check(
    'the tools for writing act in a cell',
    await app.exists('.text-view .tools button[aria-label="Italic"]:not(:disabled)'),
  );
  await app.clickText('.text-view .tools button', 'Note');
  await app.waitFor('.note-panel .prose');
  await sleep(150);
  await app.keys('Counted by hand.');
  await app.press('Escape');
  await app.waitGone('.note-panel');
  await sleep(150);
  check('a note stands in a cell', (await app.count(`${text} td .footnote`)) === 1);
  await app.keys(['Control', 'Alt', 'm']);
  await app.waitFor('.formula-panel textarea', 3000);
  await sleep(200);
  await app.keys('a=b');
  await app.press('Enter');
  await app.waitGone('.formula-panel');
  check(
    'a formula stands in a cell',
    await until('the formula', () => app.exists(`${text} td .math math`)),
  );

  // ---- what can be said of the whole table ----
  await tool('table');
  await app.waitFor('.table-panel', 3000);
  await sleep(250);
  const size = await app.text('.table-panel .size');
  check(
    'of the whole table: how large it is',
    size.replace(/\s+/g, ' ') === '4 rows, 3 columns',
    size,
  );
  // Where it stands: to the right, and as the format has it again.
  const stands = () =>
    app.exec(
      `const f = document.querySelector(arguments[0] + ' figure.tabular'); const t = f.querySelector('table').getBoundingClientRect(); const r = f.getBoundingClientRect();
       return f.dataset.stand + ':' + (Math.abs(t.right - r.right) < 2 ? 'right' : Math.abs(t.left - r.left) < 2 ? 'left' : 'middle')`,
      text,
    );
  await app.clickText('.table-panel [role="radiogroup"] button', 'Right');
  await sleep(250);
  check('the table is put to the right', (await stands()) === 'right:right', await stands());
  check('the panel is still there', await app.exists('.table-panel'));
  await app.screenshot('tables-5-right');
  await app.clickText('.table-panel [role="radiogroup"] button', 'Middle');
  await sleep(250);
  check('and in the middle again', (await stands()) === 'center:middle', await stands());
  await app.clickText('.table-panel .choices button', 'Three quarters');
  await sleep(250);
  const wide = await app.exec(
    `const f = document.querySelector(arguments[0] + ' figure.tabular'); return f.dataset.width + ':' + Math.round(100 * f.querySelector('table').getBoundingClientRect().width / f.getBoundingClientRect().width)`,
    text,
  );
  check('how wide it is, as a share of the width of the text', wide === '75:75', wide);
  await app.click('.table-panel .check input');
  await sleep(250);
  check(
    'whether it is numbered',
    await app.exec(
      `const f = document.querySelector(arguments[0] + ' figure.tabular'); return f.hasAttribute('data-unnumbered') && !f.querySelector('figcaption').dataset.label`,
      text,
    ),
  );
  await app.screenshot('tables-5-panel');
  await app.click('.table-panel .check input');
  await app.clickText('.table-panel .choices button', 'As it needs');
  await sleep(250);
  const within = await app.exec(
    `const r = document.querySelector('.table-panel').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth && r.left >= 0`,
  );
  check('the panel is within the window', within);
  await app.clickText('.table-panel button', 'Done');
  await app.waitGone('.table-panel');
  check(
    'and as it was',
    await app.exec(
      `const f = document.querySelector(arguments[0] + ' figure.tabular'); return !f.hasAttribute('data-width') && f.querySelector('figcaption').dataset.label.startsWith('Table')`,
      text,
    ),
  );

  // ---- a second table ----
  await app.click(`${text} > p:last-of-type`);
  await app.keys(['Control', 'End']);
  await sleep(150);
  await app.keys(['Control', 'Alt', 't']);
  await app.waitFor('.popover .size input[type="number"]', 3000);
  await sleep(250);
  await app.hover('.popover .grid button[data-size="2x4"]');
  await sleep(150);
  const pointed = await app.exec(
    `const n = document.querySelectorAll('.popover .size input[type="number"]'); return n[0].value + 'x' + n[1].value`,
  );
  check('the size can be pointed at', pointed === '2x4', pointed);
  await app.click('.popover .grid button[data-size="2x4"]');
  await app.waitGone('.popover');
  await until('the second table', async () => (await app.count(`${text} figure.tabular`)) === 2);
  // Capitals are lost to the driver once keys have been pressed together: the words are written small.
  await app.keys('ships');
  const second = await until('the number of the second', async () => {
    const all = await tables(text);
    return all[1]?.startsWith('Table 2') ? all[1] : null;
  });
  check(
    'a second table, by Ctrl+Alt+T, has the next number',
    second === 'Table 2 [*ships,*,*,* / ,,,]',
    second,
  );

  // Backspace in a table in which nothing is written.
  for (let i = 0; i < 5; i++) await app.press('Backspace');
  await sleep(200);
  check(
    'Backspace in a table in which something is written leaves the table',
    (await tables(text))[1] === 'Table 2 [*,*,*,* / ,,,]',
    (await tables(text))[1],
  );
  await app.press('Backspace');
  await sleep(250);
  check(
    'in one in which nothing is written, it takes the table away',
    (await app.count(`${text} figure.tabular`)) === 1,
    String(await app.count(`${text} figure.tabular`)),
  );
  const left = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).map((p) => p.textContent).join('|')`,
    text,
  );
  check('and nothing else', left === 'The poems, counted.|After the table.', left);

  // ---- pasted from a spreadsheet ----
  await app.click(`${text} > p:last-of-type`);
  await app.keys(['Control', 'End']);
  await sleep(150);
  await app.exec(
    `const data = new DataTransfer();
     data.setData('text/html', '<meta charset="utf-8"><table border="0"><colgroup width="85"></colgroup><tr><td align="left">Hero</td><td>Ships</td></tr><tr><td>Achilles</td><td style="text-align: right">50</td></tr></table>');
     data.setData('text/plain', 'Hero\\tShips\\nAchilles\\t50\\n');
     document.querySelector(arguments[0]).dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));`,
    text,
  );
  await until('the pasted table', async () => (await app.count(`${text} figure.tabular`)) === 2);
  const pasted = await until('its number', async () => {
    const all = await tables(text);
    return all[1]?.startsWith('Table 2') ? all[1] : null;
  });
  check(
    'a table copied from a spreadsheet is a table, with nothing said of it',
    pasted === 'Table 2 [Hero,Ships / Achilles,50>right]',
    pasted,
  );
  // Text with tabs, pasted into a cell.
  await app.click(`${text} figure.tabular:nth-of-type(2) tr:nth-child(2) td:nth-child(1)`);
  await sleep(200);
  await app.exec(
    `const data = new DataTransfer();
     data.setData('text/plain', 'Aias\\t12\\nOdysseus\\t12\\n');
     document.querySelector(arguments[0]).dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));`,
    text,
  );
  await sleep(300);
  check(
    'text with tabs that is pasted into a cell fills the cells from there',
    (await tables(text))[1] === 'Table 2 [Hero,Ships / Aias,12 / Odysseus,12]',
    (await tables(text))[1],
  );
  await app.click(`${text} figure.tabular:nth-of-type(2) figcaption`);
  await sleep(150);
  await app.keys('heroes');
  await app.press('Enter');
  await sleep(150);

  // ---- a pointer to a table ----
  await app.keys('as is seen in ');
  await app.keys(['Control', 'Alt', 'r']);
  await app.waitFor('.targets input', 3000);
  await sleep(300);
  const targets = await app.exec(
    `return Array.from(document.querySelectorAll('.targets .row')).map((r) => r.dataset.kind + ':' + r.querySelector('.called').textContent.replace(/\\u00a0/g, ' ').trim() + ':' + r.querySelector('.words').textContent.trim())`,
  );
  check(
    'the tables can be pointed to',
    targets.slice(0, 2).join(' | ') ===
      'table:Table 1:The poems and their lines | table:Table 2:heroes',
    targets.join(' | '),
  );
  await app.screenshot('tables-6-pointer');
  await app.keys('heroes');
  await sleep(250);
  await app.press('Enter');
  await app.waitGone('.targets');
  await app.keys('.');
  await sleep(250);
  const line = await app.exec(
    `return document.querySelector(arguments[0] + ' > p:last-of-type').textContent.replace(/\\u00a0/g, ' ')`,
    text,
  );
  check('the words say what the document calls it', line === 'as is seen in Table 2.', line);

  // ---- a table from a file ----
  let where = await at(`${text} > p:first-of-type`);
  await drop([join(desk, 'Ships of the Achaeans.csv')], where.x, where.y);
  await app.waitFor('dialog .from-file', 8000);
  await sleep(300);
  const read = await app.exec(
    `const d = document.querySelector('dialog');
     return [
       d.querySelector('.subtitle').textContent,
       Array.from(d.querySelectorAll('.shown tr')).map((tr) => Array.from(tr.children).map((c) => (c.tagName === 'TH' ? '*' : '') + c.textContent + (c.style.textAlign ? '>' : '')).join(',')).join(' / '),
       d.querySelector('.count').textContent.replace(/\\s+/g, ' ').trim(),
       d.querySelector('#table-said').value,
       Array.from(d.querySelectorAll('.check input')).map((i) => i.checked).join(','),
     ]`,
  );
  check(
    'a file that is dropped on the text is shown as it was read',
    read[1] ===
      '*Leader,*Ships>,*Share>,*From / Agamemnon,100>,8,4>,Mycenae / Nestor,90>,7,6>,Pylos / Aias, son of Telamon,12>,1,0>,Salamis / Odysseus,12>,1,0>,Ithaca',
    read[1],
  );
  check(
    'with how large it is',
    read[0] === 'Ships of the Achaeans.csv' && read[2] === '5 rows, 4 columns',
    `${read[0]} | ${read[2]}`,
  );
  check(
    'what the file is called is what is said of the table; the first row holds the headings',
    read[3] === 'Ships of the Achaeans' && read[4] === 'true,false',
    `${read[3]} | ${read[4]}`,
  );
  await app.screenshot('tables-7-from-file');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('tables-7-from-file-dark');
  await app.setTheme('light');
  await app.clickText('dialog footer button', 'Put it into the text');
  await app.waitGone('dialog .from-file');
  await until(
    'the table from the file',
    async () => (await app.count(`${text} figure.tabular`)) === 3,
  );
  const ships = await until('the numbers anew', async () => {
    const all = await tables(text);
    return all[0]?.startsWith('Table 1') && all[2]?.startsWith('Table 3') ? all : null;
  });
  check(
    'it stands where the file was dropped, its numbers to the right',
    ships[0] ===
      'Table 1. Ships of the Achaeans [*Leader,*Ships>right,*Share>right,*From / Agamemnon,100>right,8,4>right,Mycenae / Nestor,90>right,7,6>right,Pylos / Aias, son of Telamon,12>right,1,0>right,Salamis / Odysseus,12>right,1,0>right,Ithaca]',
    ships[0],
  );
  check(
    'the tables after it are counted anew, and the words that point follow',
    ships[1].startsWith('Table 2. The poems') &&
      (await app.exec(
        `return document.querySelector(arguments[0] + ' .crossref').textContent.replace(/\\u00a0/g, ' ')`,
        text,
      )) === 'Table 3',
    ships.join(' ‖ '),
  );
  check(
    'what is said of it is selected, to be changed',
    (await app.exec(`return String(getSelection())`)) === 'Ships of the Achaeans',
  );
  await sleep(300);
  await app.screenshot('tables-8-text');
  await app.setTheme('dark');
  await sleep(250);
  await app.screenshot('tables-8-text-dark');
  await app.setTheme('light');

  // ---- a file of several sheets ----
  where = await at(`${text} > p:last-of-type`);
  await drop([join(root, 'e2e/fixtures/heroes.ods')], where.x, where.y);
  await app.waitFor('dialog .from-file', 8000);
  await sleep(300);
  const sheetShown = () =>
    app.exec(
      `const d = document.querySelector('dialog');
       return Array.from(d.querySelectorAll('select option')).map((o) => o.textContent.trim()).join(',') + ' | ' +
         Array.from(d.querySelectorAll('.shown tr')).map((tr) => Array.from(tr.children).map((c) => (c.tagName === 'TH' ? '*' : '') + c.textContent + (c.style.textAlign ? '>' : '')).join(',')).join(' / ') + ' | ' +
         d.querySelector('.count').textContent.replace(/\\s+/g, ' ').trim()`,
    );
  check(
    'of a file of sheets, the sheets are offered, and the first is shown: dates as they are read, numbers without needless decimals',
    (await sheetShown()) ===
      'Heroes,Ships | *Name,*Born,*Height> / Aias,1250-05-17,2.1> / Teukros,1248-01-02,1.85> | 3 rows, 3 columns',
    await sheetShown(),
  );
  await app.exec(
    `const s = document.querySelector('dialog select'); s.value = '1'; s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(250);
  check(
    'another sheet is chosen',
    (await sheetShown()) ===
      'Heroes,Ships | *From,*Ships> / Salamis,12> / Pylos,90> | 3 rows, 2 columns',
    await sheetShown(),
  );
  await app.screenshot('tables-7-sheets');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog .from-file');
  await sleep(200);
  check('left, nothing is put into the text', (await app.count(`${text} figure.tabular`)) === 3);

  // What is no table, and what is too large.
  where = await at(`${text} > p:last-of-type`);
  await drop([join(desk, 'a letter.txt')], where.x, where.y);
  // It is a document then, of which a map can be made.
  await app.waitForText('dialog', 'A map from a document', 8000);
  check(
    'a text that holds no table is not taken for one',
    !(await app.exists('dialog .from-file')),
  );
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]');
  await sleep(600);
  await drop([join(desk, 'too many.csv')], where.x, where.y);
  await app.waitForText('.toaster', 'A table in a text can have 2000 at most', 5000);
  check(
    'a table that is too large is refused in plain words',
    (await app.count(`${text} figure.tabular`)) === 3,
  );

  // ---- a file dropped on an element whose text is not being written ----
  await mark();
  where = await at(`${section('The ships')} .heading`);
  await drop([join(desk, 'Ships of the Achaeans.csv')], where.x, where.y);
  await app.waitFor('dialog .from-file', 8000);
  await sleep(300);
  await app.click('dialog .check:nth-of-type(2) input');
  await app.exec(`const i = document.querySelector('#table-said'); i.focus(); i.select();`);
  await app.keys('the fleet');
  await app.press('Enter');
  await app.waitGone('dialog .from-file');

  // ---- where the text is shown and not written ----
  await app.press('Escape');
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  const shown = await until('the tables in the text as it is shown', async () => {
    const all = await tables('.text-view .static');
    return all.length === 4 && all[3].startsWith('Table 4') ? all : null;
  });
  check(
    'where the text is only shown, the tables are there with their numbers',
    shown[1] ===
      'Table 2. The poems and their lines [*Work,*Lines,*Books / Iliad,15693>right,24 / Odyssey,12109,24 / Both°$,27802@,]',
    shown[1],
  );
  check(
    'a file dropped on an element is a table at the end of its text, the first column headings as was said',
    shown[3] ===
      'Table 4. the fleet [*Leader,*Ships>right,*Share>right,*From / *Agamemnon,100>right,8,4>right,Mycenae / *Nestor,90>right,7,6>right,Pylos / *Aias, son of Telamon,12>right,1,0>right,Salamis / *Odysseus,12>right,1,0>right,Ithaca]',
    shown[3],
  );
  const look = await app.exec(
    `const t = document.querySelector('.text-view .static figure.tabular table');
     const s = getComputedStyle(t); const h = getComputedStyle(t.querySelector('th')); const d = getComputedStyle(t.querySelector('td'));
     return [s.borderTopWidth, s.borderBottomWidth, h.borderBottomWidth, d.borderBottomWidth, h.fontWeight].join(' ')`,
  );
  check(
    'lines over and under the table and under its headings',
    /^1(\.5)?px 1(\.5)?px 1px 0px \d+$/.test(look),
    look,
  );
  await sleep(300);
  await app.screenshot('tables-9-shown');
  await app.setTheme('dark');
  await sleep(250);
  await app.screenshot('tables-9-shown-dark');
  await app.setTheme('light');

  // ---- in the document ----
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  const work = join(app.dataDir, 'work', project, 'preview', 'document.typ');
  const typ = () => readFileSync(work, 'utf8');
  await until(
    'the document to hold the tables',
    () => (typ().match(/#table\(/g) ?? []).length >= 4,
    15000,
  );
  const made = typ();
  check(
    'the document has the tables',
    (made.match(/#table\(/g) ?? []).length === 4,
    String((made.match(/#table\(/g) ?? []).length),
  );
  check(
    'with what they hold, headings and numbers to the right',
    /table\.header\((table\.cell\(align: left\))?\[Leader\], table\.cell\(align: right\)\[Ships\]/.test(
      made,
    ) &&
      /\[Agamemnon\], table\.cell\(align: right\)\[100\]/.test(made) &&
      made.includes('[15693]'),
    made.slice(made.indexOf('#table('), made.indexOf('#table(') + 300).replace(/\s+/g, ' '),
  );
  check(
    'what is said of them, with the word and the number',
    /Table[~ ]2[\s\S]{0,80}The poems and their lines/.test(made),
    made
      .slice(
        Math.max(0, made.indexOf('The poems and their lines') - 200),
        made.indexOf('The poems and their lines') + 40,
      )
      .replace(/\s+/g, ' '),
  );
  check(
    'and the words that point lead to the table',
    /#link\(<gk-to-[^>]+>\)\[Table[\s~]*3\]/.test(made) &&
      /<gk-to-/.test(made.replace(/#link\(<gk-to-[^>]+>\)/g, '')),
    (made.match(/#link\(<gk-to-[^\]]+\]/) ?? ['no link'])[0],
  );
  const remarks = await app.exec(
    `const r = document.querySelector('.preview .remarks, .preview .warnings'); return r ? r.textContent.trim() : ''`,
  );
  check('and nothing is said to be lacking of them', !/table/i.test(remarks), remarks);
  await app.screenshot('tables-10-preview');

  // ---- beside each other, and with the text around it ----
  await mark();
  await app.click(`${section('The catalogue')} .body figure.tabular td`);
  await app.waitFor(`${text} figure.tabular`, 5000);
  await sleep(300);
  // The second of the tables, which stands after the first with nothing between them.
  await app.exec(
    `const t = document.querySelectorAll(arguments[0] + ' figure.tabular')[1]; t.scrollIntoView({ block: 'center' });`,
    text,
  );
  await sleep(200);
  const cellOfSecond = await app.exec(
    `const r = document.querySelectorAll(arguments[0] + ' figure.tabular')[1].querySelector('td').getBoundingClientRect(); return { x: Math.round(r.left + 8), y: Math.round(r.top + 8) }`,
    text,
  );
  await app.cmd('POST', '/actions', {
    actions: [
      {
        type: 'pointer',
        id: 'mouse',
        parameters: { pointerType: 'mouse' },
        actions: [
          { type: 'pointerMove', origin: 'viewport', x: cellOfSecond.x, y: cellOfSecond.y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ],
  });
  await app.cmd('DELETE', '/actions');
  await sleep(300);
  await tool('table');
  await app.waitFor('.table-panel', 3000);
  await sleep(250);
  await app.clickText('.table-panel button', 'Put it beside the one before it');
  await sleep(400);
  const inRow = await app.exec(
    `const r = document.querySelector(arguments[0] + ' .row-of'); if (!r) return null;
     return Array.from(r.children).map((c) => { const b = c.getBoundingClientRect(); return { tag: c.className.split(' ')[0], left: Math.round(b.left), right: Math.round(b.right), top: Math.round(b.top), label: c.querySelector('figcaption').dataset.label } })`,
    text,
  );
  check(
    'two tables stand beside each other, each with its number',
    !!inRow &&
      inRow.length === 2 &&
      inRow[0].right <= inRow[1].left + 1 &&
      /^Table\s1/.test(inRow[0].label) &&
      /^Table\s2/.test(inRow[1].label),
    JSON.stringify(inRow),
  );
  check(
    'the panel says so, and is still there',
    /beside others, in a row/.test(await app.text('.table-panel')),
  );
  await app.screenshot('tables-11-beside');
  await until('the document to have them in a row', () => /#gk-row\(2, /.test(typ()), 15000);
  check('and so in the document', /#gk-row\(2, /.test(typ()));
  await sleep(1500);
  await app.screenshot('tables-11-beside-preview');
  await app.clickText('.table-panel button', 'By itself again');
  await sleep(400);
  check(
    'by itself again, the row is gone',
    (await app.count(`${text} .row-of`)) === 0 && (await app.count(`${text} figure.tabular`)) === 3,
  );
  await app.clickText('.table-panel [role="radiogroup"] button', 'Left');
  await sleep(200);
  await app.clickText('.table-panel button', 'Flows around it');
  await sleep(400);
  const flowing = await app.exec(
    `const f = document.querySelectorAll(arguments[0] + ' figure.tabular')[1]; const p = f.nextElementSibling; const a = f.getBoundingClientRect(); const b = p.getBoundingClientRect(); const t = f.querySelector('table').getBoundingClientRect();
     return { float: getComputedStyle(f).float, beside: b.top < a.bottom, fills: Math.abs(t.width - a.width) < 2, next: p.tagName }`,
    text,
  );
  check(
    'the text flows around a table at the left',
    flowing.float === 'left' && flowing.beside && flowing.fills,
    JSON.stringify(flowing),
  );
  await app.screenshot('tables-12-around');
  await until('the document to have the text around it', () => /#gk-around\(/.test(typ()), 15000);
  check('and so in the document', /#gk-around\(/.test(typ()));
  await sleep(1500);
  await app.screenshot('tables-12-around-preview');
  await app.clickText('.table-panel [role="radiogroup"] button', 'As the format');
  await app.clickText('.table-panel button', 'Stands apart');
  await sleep(200);
  await app.clickText('.table-panel button', 'Done');
  await app.waitGone('.table-panel');

  // ---- the table is removed ----
  await mark();
  await app.click(`${section('The catalogue')} .body figure.tabular td`);
  await app.waitFor(`${text} figure.tabular`, 5000);
  await sleep(300);

  // A format that has what is said of a table under it, and lines around every cell.
  const saidAt = () =>
    app.exec(
      `const n = getSelection().anchorNode; const e = n && (n.nodeType === 1 ? n : n.parentElement);
       const c = e && e.closest('figcaption'); return c ? 'caption:' + c.textContent : (e && e.closest('td, th') ? 'cell' : e && e.closest('p') ? 'p:' + e.closest('p').textContent : '')`,
    );
  await app.exec(
    `const f = document.querySelector(arguments[0] + ' figure.tabular'); f.setAttribute('data-caption', 'below'); f.setAttribute('data-rules', 'grid');`,
    text,
  );
  await sleep(200);
  const under = await app.exec(
    `const f = document.querySelector(arguments[0] + ' figure.tabular');
     return (f.querySelector('figcaption').getBoundingClientRect().top >= f.querySelector('table').getBoundingClientRect().bottom - 1) + ':' + getComputedStyle(f.querySelector('td')).borderLeftWidth + ':' + f.getAttribute('data-caption') + f.getAttribute('data-rules')`,
    text,
  );
  check(
    'as a format has it, what is said of the table stands under it, and lines are around every cell',
    under === 'true:1px:belowgrid',
    under,
  );
  await app.click(`${text} figure.tabular tr:last-child td`);
  await sleep(150);
  await app.press('ArrowDown');
  await sleep(150);
  check(
    'then the arrow down from the last row goes to what is said of it',
    (await saidAt()) === 'caption:Ships of the Achaeans',
    await saidAt(),
  );
  await app.press('ArrowDown');
  await sleep(150);
  check(
    'and from there out of the table, to what comes after',
    (await saidAt()) === 'caption:The poems and their lines',
    await saidAt(),
  );
  await app.press('ArrowUp');
  await sleep(150);
  check(
    'the arrow up from what comes after goes to what is said of it',
    (await saidAt()) === 'caption:Ships of the Achaeans',
    await saidAt(),
  );
  await app.press('ArrowUp');
  await sleep(150);
  check(
    'and from there into the last row',
    (await saidAt()) === 'cell' && (await focusIn()) === 'cell:Odysseus',
    `${await saidAt()} ${await focusIn()}`,
  );
  await app.click(`${text} figure.tabular th`);
  await sleep(150);
  await app.press('ArrowUp');
  await sleep(150);
  check(
    'the arrow up from the first row leaves the table',
    (await saidAt()) === 'p:The poems, counted.',
    await saidAt(),
  );
  await app.screenshot('tables-11-under');
  await app.exec(
    `const f = document.querySelector(arguments[0] + ' figure.tabular'); f.removeAttribute('data-caption'); f.removeAttribute('data-rules');`,
    text,
  );
  await app.click(`${text} figure.tabular td`);
  await sleep(250);
  await tool('table');
  await app.waitFor('.table-panel', 3000);
  await sleep(200);
  await app.clickText('.table-panel button', 'Remove the table');
  await until(
    'the table to be gone',
    async () => (await app.count(`${text} figure.tabular`)) === 2,
  );
  check(
    'a table is removed, and its tools with it',
    !(await app.exists('.table-panel')) && !(await app.exists('.table-bar')),
  );
  check('the cursor is in the text', /^p:|^caption|^cell:/.test(await focusIn()), await focusIn());

  const errors = (await app.pageErrors()).filter((e) => !/could not be read as a table/.test(e));
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('tables-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
