// Figures and mathematics: written, shown, and part of the documents that are made.

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
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

/** A picture of rings, as PNG. */
function png(width, height, shade = 0) {
  const crcTable = new Int32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c;
  });
  const crc = (buffer) => {
    let c = -1;
    for (const b of buffer) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, sum]);
  };
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) {
      const d = Math.hypot(x - width / 2, y - height / 2);
      raw[row + 1 + x * 3] = (150 + 90 * Math.cos(d / 14) + shade) & 0xff;
      raw[row + 2 + x * 3] = (110 + x / 5) & 0xff;
      raw[row + 3 + x * 3] = (90 + y / 3) & 0xff;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
writeFileSync(join(desk, 'The shield.png'), png(480, 300));
writeFileSync(
  join(desk, 'forms.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160"><rect width="300" height="160" fill="#f4efe6"/><circle cx="90" cy="80" r="50" fill="none" stroke="#7a2e2e" stroke-width="4"/><path d="M170 130 L215 30 L260 130 Z" fill="#2e4a7a"/></svg>',
);
writeFileSync(join(desk, 'not a picture.png'), 'This only says that it is one.');

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const invoke = (command, args = {}) =>
    app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
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
  const middleOf = (selector) =>
    app.exec(
      `const r = document.querySelector(arguments[0]).getBoundingClientRect();
       return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
      selector,
    );
  const menu = async (words) => {
    await app.clickText('.box .tools button, .tools button', 'Insert');
    await app.waitFor('.menu');
    await app.clickText('.menu [role="menuitem"], .menu button', words);
  };

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const project = (await invoke('project_list'))[0].id;
  // The pictures are in the store of the application, and not with the project.
  const store = join(app.dataDir, 'pictures', 'files');
  const files = () => (existsSync(store) ? readdirSync(store).sort() : []);

  await app.doubleClick('.diagram .node.root');
  await app.waitFor('.box .text .prose');
  await sleep(250);

  // ---- a formula in the line ----
  await app.keys('The sum holds where ');
  await menu('Formula');
  await app.waitFor('.formula-panel textarea', 3000);
  await sleep(200);
  check('a formula is written in a panel of its own', (await app.text('.formula-panel .note-number')).toLowerCase() === 'formula');
  await app.keys('x_i \\leq \\alpha');
  await until('it to be shown as it is written', () => app.exists('.formula-panel .shown math'));
  check('what is written is shown as mathematics while it is written', true);
  await app.screenshot('figures-1-formula');
  await app.press('Enter');
  await app.waitGone('.formula-panel');
  await until('the formula in the text', () => app.exists('.box .text .math math'));
  check('and stands in the text as mathematics', true);
  await app.keys(' for every one of them.');
  const line = await app.exec(`return document.querySelector('.box .text .prose p').textContent.replace(/\\s+/g, ' ')`);
  check('the writing goes on after it', /holds where .* for every one of them\./.test(line), line);

  // ---- a formula that cannot be read ----
  await app.keys(['Control', 'Alt', 'm']);
  await app.waitFor('.formula-panel textarea', 3000);
  await sleep(200);
  await app.keys('\\frac{1}{');
  const problem = await until('the formula to be found wanting', async () =>
    (await app.exists('.formula-panel .problem')) ? app.text('.formula-panel .problem') : null,
  );
  check('a formula that is not complete is said to be so', /ends before it is complete/.test(problem), problem);
  await app.screenshot('figures-2-problem');
  await app.press('Escape');
  await app.waitGone('.formula-panel');
  await sleep(200);
  check('left as it was, which was nothing, it is not there', (await app.count('.box .text .math')) === 1);

  // ---- an equation ----
  await app.press('Enter');
  await app.keys(['Control', 'Alt', 'e']);
  await app.waitFor('.formula-panel textarea', 3000);
  await sleep(200);
  check('an equation likewise', (await app.text('.formula-panel .note-number')).toLowerCase() === 'equation');
  await app.clickText('.formula-panel .signs button', '∑');
  await app.keys('i=1');
  await app.exec(`const t = document.querySelector('.formula-panel textarea'); t.focus(); t.setSelectionRange(t.value.length, t.value.length);`);
  await app.keys(' i = \\frac{n(n+1)}{2}');
  const written = await app.exec(`return document.querySelector('.formula-panel textarea').value`);
  check('signs can be put in by pressing them', written === '\\sum_{i=1}^{} i = \\frac{n(n+1)}{2}', written);
  await app.click('.formula-panel .counted input');
  await until('the equation to be shown', () => app.exists('.formula-panel .shown math'));
  await app.screenshot('figures-3-equation');
  await app.exec(`document.querySelector('.formula-panel textarea').focus()`);
  await app.press('Enter');
  await app.waitGone('.formula-panel');
  await until('the equation in the text', () => app.exists('.box .text .equation[data-numbered] math'));
  const number = await until('the number of the equation', () =>
    app.exec(`return document.querySelector('.box .text .equation').dataset.number || null`),
  );
  check('it stands on a line of its own, with its number', number === '(1)', number);
  await app.keys('And so on.');
  const after = await app.exec(
    `const e = document.querySelector('.box .text .equation'); return e.nextElementSibling ? e.nextElementSibling.textContent : null`,
  );
  check('the writing goes on under it', after === 'And so on.', String(after));

  // Opened again, it holds what was written.
  await app.click('.box .text .equation');
  await app.waitFor('.formula-panel textarea', 3000);
  await sleep(200);
  const again = await app.exec(
    `return document.querySelector('.formula-panel textarea').value + '|' + document.querySelector('.formula-panel .counted input').checked`,
  );
  check('opened again, it holds what was written', again === '\\sum_{i=1}^{} i = \\frac{n(n+1)}{2}|true', again);
  await app.press('Escape');
  await app.waitGone('.formula-panel');

  // ---- a picture, dropped on the text ----
  const last = await middleOf('.box .text .prose p:last-of-type');
  await drop([join(desk, 'The shield.png')], last.x, last.y);
  await until('the figure', () => app.exists('.box .text figure.figure img[src^="blob:"]'), 10000);
  await until('the picture to be drawn', () =>
    app.exec(`const i = document.querySelector('.box .text figure img'); return i.complete && i.naturalWidth === 480`),
  );
  check('a picture dropped on the text is a figure there', true);
  const given = await app.exec(`return document.querySelector('.box .text figure .picture').style.width`);
  check('as wide as suits what it holds', given === '50%', given);
  check('it is kept in the store of pictures, by what it holds', files().length === 1 && /^[0-9a-f]{64}\.png$/.test(files()[0]), files().join(', '));
  check('as it was', readFileSync(join(store, files()[0])).equals(readFileSync(join(desk, 'The shield.png'))));
  check('and not with the project', !existsSync(join(app.dataDir, 'projects', project, 'files')));
  await sleep(200);
  await app.keys('The shield of Achilles, as the poem has it');
  const caption = await app.text('.box .text figure figcaption');
  check('what is typed then is what is said of it', caption === 'The shield of Achilles, as the poem has it', caption);
  const label = await until('the word and the number', () =>
    app.exec(`return document.querySelector('.box .text figure figcaption').dataset.label || null`),
  );
  check('before which stand the word and the number', label === 'Figure\u00a01. ', JSON.stringify(label));
  await app.press('Enter');
  await app.keys('After the figure.');
  const under = await app.exec(
    `const f = document.querySelector('.box .text figure'); return (f.nextElementSibling ? f.nextElementSibling.textContent : null) + '|' + document.querySelectorAll('.box .text figure').length`,
  );
  check('Enter leaves the figure, and does not make two of it', under === 'After the figure.|1', under);
  await app.screenshot('figures-4-figure');

  // ---- what else can be said of it ----
  await app.click('.box .text figure .picture');
  await app.waitFor('.figure-panel', 3000);
  await sleep(250);
  const named = await app.exec(`return document.querySelector('.figure-panel .name').textContent`);
  check('pressing the picture opens what can be set', named === 'The shield.png', named);
  await app.clickText('.figure-panel .choices button', 'Three quarters');
  await sleep(200);
  const width = await app.exec(`return document.querySelector('.box .text figure .picture').style.width`);
  check('its width is set', width === '75%', width);
  const within = await app.exec(
    `const r = document.querySelector('.figure-panel').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth`,
  );
  check('the panel is within the window', within);
  await app.click('.figure-panel input[type="text"]');
  await app.keys('A round shield with rings');
  await app.screenshot('figures-5-settings');
  await app.press('Enter');
  await app.waitGone('.figure-panel');
  await sleep(200);
  const alt = await app.exec(`return document.querySelector('.box .text figure img').alt`);
  check('and what it shows is said in words', alt === 'A round shield with rings', alt);
  check('the panel is left for the caption', await app.exec(`const s = getSelection(); return !!s.anchorNode && !!s.anchorNode.parentElement.closest('figcaption')`));

  // ---- what is no picture ----
  const before = files().length;
  const where = await middleOf('.box .text .prose p:last-of-type');
  await drop([join(desk, 'not a picture.png')], where.x, where.y);
  await app.waitForText('.toaster', 'could not be added', 5000);
  check('what is no picture is not taken for one', files().length === before && (await app.count('.box .text figure')) === 1);

  // ---- a picture that is pasted ----
  await app.click('.box .text .prose p:last-of-type');
  await app.keys(['Control', 'End']);
  const bytes = [...png(200, 120, 40)];
  await app.exec(
    `const file = new File([new Uint8Array(arguments[0])], 'pasted.png', { type: 'image/png' });
     const data = new DataTransfer();
     data.items.add(file);
     const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
     document.querySelector('.box .text .ProseMirror').dispatchEvent(event);`,
    bytes,
  );
  await until('the pasted figure', async () => (await app.count('.box .text figure img[src^="blob:"]')) === 2, 10000);
  check('a picture that is pasted is a figure as well', files().length === 2, files().join(', '));
  await sleep(200);
  await app.keys('Rings');

  // ---- a drawing, dropped on an element of the map ----
  await app.press('Escape');
  await sleep(200);
  await app.press('Escape');
  await app.waitGone('.box');
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('Forms');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  const node = await app.exec(
    `const n = Array.from(document.querySelectorAll('.diagram .node')).find((e) => e.textContent.includes('Forms'));
     const r = n.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
  );
  await drop([join(desk, 'forms.svg')], node.x, node.y);
  await until('the drawing to be kept', () => files().some((f) => f.endsWith('.svg')), 8000);
  check('a picture dropped on an element is kept', files().length === 3, files().join(', '));

  // ---- the text of the map ----
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await until('the figures in the text of the map', async () => (await app.count('.text-view figure img[src^="blob:"]')) === 3, 10000);
  check('in the text of the map the figures are shown', true);
  check('and the mathematics', (await app.count('.text-view .math math')) === 2, String(await app.count('.text-view .math math')));
  const counted = await until('the numbers of the figures', async () => {
    const labels = await app.exec(
      `return Array.from(document.querySelectorAll('.text-view figure figcaption')).map((f) => (f.dataset.label || '').replace(/\u00a0/g, ' ').trim()).join('|')`,
    );
    return labels.split('|').every(Boolean) ? labels : null;
  });
  check('the figures are counted through the map', counted === 'Figure 1.|Figure 2.|Figure 3', counted);
  await sleep(400);
  await app.screenshot('figures-6-text');

  // ---- the preview ----
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  const remarks = await app.exec(`const r = document.querySelector('.preview .remarks, .preview .warnings'); return r ? r.textContent.trim() : ''`);
  check('the preview has the document with its figures', !/picture/i.test(remarks), remarks);
  await app.screenshot('figures-7-preview');

  // ---- the documents that are made ----
  const out = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-out-'));
  const made = await app.execAsync(
    `const invoke = window.__TAURI_INTERNALS__.invoke;
     const format = await invoke('formats_get', { id: (await invoke('formats_list'))[0].id });
     const t = (text) => ({ kind: 'text', text, marks: {} });
     const document = {
       title: [t('Wrath')], authors: [], keywords: [], references: [],
       sections: [{ level: 1, heading: [t('Forms')], element: null, blocks: [
         { kind: 'paragraph', content: [t('Where '), { kind: 'math', tex: 'x_i \\\\leq \\\\alpha' }, t(' holds.')] },
         { kind: 'equation', tex: 'a^2 + b^2 = c^2', numbered: true },
         { kind: 'figure', file: arguments[1].split('.')[0], extension: 'png', name: 'shield.png',
           caption: [t('The shield')], alt: '', width: 50, numbered: true },
       ] }],
     };
     const request = { document, style: 'chicago-author-date', format, key: arguments[0] };
     const typst = await invoke('document_export', { request, target: 'typst', path: arguments[2] + '/wrath.typ', options: {} });
     const docx = await invoke('document_export', { request, target: 'docx', path: arguments[2] + '/wrath.docx', options: {} });
     return { typst, docx };`,
    project,
    files().find((f) => f.endsWith('.png')),
    out,
  );
  const typst = readFileSync(join(out, 'wrath.typ'), 'utf8');
  check('a document that is made has the figure, its picture beside it', /image\("wrath-files\/[0-9a-f]{64}\.png", width: 50/.test(typst) && existsSync(join(out, 'wrath-files')), typst.slice(-600));
  check('and the mathematics', /\$x_i (lt\.eq|<=) alpha\$/.test(typst) && /numbering: \(\.\.n\) => \[\(1\)\]/.test(typst));
  check('nothing is said to be lacking', made.typst.warnings.every((w) => !/picture/i.test(w)) && made.docx.warnings.every((w) => !/picture/i.test(w)), JSON.stringify(made));
  rmSync(out, { recursive: true, force: true });

  // What was refused on purpose is written to the console, as every failure is.
  const errors = (await app.pageErrors()).filter((e) => !/not a picture of a kind/.test(e));
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('figures-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
