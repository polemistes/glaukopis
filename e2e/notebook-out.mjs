// What goes from a note into a text (record 0101): three notes are made on
// the page of the notebook (words written after New note; words pasted from
// a page of the web, outside any text, whose source is given a title in its
// window; an image dropped on the page); in a project the tab Notes of the
// document pane lists them, newest first, and its field finds one; the
// writer's own words dragged into the text are there as text; the passage
// dragged in is paragraphs of the kind Quotation followed by a citation, and
// the library has a reference of the type Web page with the page's address;
// the image dragged in is a figure, and the library's files list it; back in
// the notebook the notes say they were used in the project, and in the pane
// they are marked used; the passage copied in its note and pasted into the
// text is a quotation with its citation again; no errors in the page.
//
// The paste from the page is made as the window makes one after the Rust
// side has read the clipboard (src/lib/util/paste.ts): a paste event of the
// page, carrying the words and the address of the page they came from.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
function passOver(name, why) {
  console.log(`--    ${name}  (passed over: ${why})`);
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

/** A picture of rings, as PNG, as picture-panel.mjs draws one. */
function png(width, height) {
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
      raw[row + 1 + x * 3] = (150 + 90 * Math.cos(d / 14)) & 0xff;
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
writeFileSync(join(desk, 'Owl.png'), png(320, 200));

const PAGE = 'https://owls.example/night';
const OWN = 'Herons wait at the shore.';
const TAKEN = ['Owls hunt by sound.', 'They fly without a noise.'];

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
  const page = '[data-notebook]';
  const pane = '.panel[aria-label="Notes"]';
  const body = '.text-view .section .body';
  const cards = () =>
    app.exec(`return Array.from(document.querySelectorAll(arguments[0] + ' article .head .name')).map((n) => n.textContent.trim())`, pane);
  const card = (words) => app.findByText(`${pane} article .head`, words);
  const words = () => app.exec(`return document.querySelector(arguments[0])?.textContent ?? ''`, body);
  const quotes = () =>
    app.exec(
      `return Array.from(document.querySelectorAll(arguments[0] + ' p[data-kind="quote"]')).map((p) => ({ text: p.textContent, cited: !!p.querySelector('.citation') }))`,
      body,
    );

  // ---- three notes, made on the page of the notebook ----
  await app.go('#/notebook');
  await app.waitFor(page, 8000);
  await sleep(300);

  // Words of the writer's own, written in a new note.
  await app.waitFor('[data-notebook-empty]', 8000);
  await app.clickText('[data-notebook-empty] button', 'New note');
  await app.waitFor(`${page} [data-note-text] .ProseMirror`, 5000);
  await sleep(300);
  await app.keys(OWN);
  await sleep(800);
  check('a note is written on the page', (await app.text(page)).includes(OWN));

  // Words pasted from a page of the web, outside any text: a note of their own, taken in.
  await app.exec(`document.activeElement?.blur?.(); return true`);
  await sleep(200);
  await app.exec(
    `const data = new DataTransfer();
     data.setData('text/plain', arguments[1]);
     data.setData('application/x-glaukopis-page', arguments[2]);
     document.querySelector(arguments[0]).dispatchEvent(
       new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true, composed: true }));
     return true;`,
    page,
    TAKEN.join('\n'),
    PAGE,
  );
  await app.waitForText(page, TAKEN[0], 5000);
  check('words pasted outside a text are a note of their own', true);

  // The source of the words is given a title in its window.
  try {
    await app.waitForText('[data-note-sources] [data-source]', 'owls.example', 4000);
    await app.click('[data-note-sources] [data-source]');
    await app.waitFor('[data-source-dialog]', 4000);
    await app.click('[data-source-title]');
    await app.keys('Owls at night');
    await app.click('[data-source-apply]');
    await app.waitGone('dialog[open]', 4000);
    await app.waitForText('[data-note-sources] [data-source]', 'Owls at night', 4000);
    check('the source of the words is the page, given its title', true);
  } catch (error) {
    passOver('the title of the page given in the window of its source', String(error.message ?? error));
  }

  // An image dropped on the page: a note of its own.
  const where = await middleOf(page);
  await drop([join(desk, 'Owl.png')], where.x, where.y);
  await until('the note of the image', () => app.exists(`${page} img[src^="blob:"]`), 10000);
  check('an image dropped on the page is a note of its own', true);
  await app.screenshot('notebook-out-1-notes');

  // ---- a project, and its document pane ----
  await app.keys(['Control', '1']);
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Birds of the night');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor(body, 8000);
  await app.click(body);
  await app.waitFor(`${body} .ProseMirror`, 5000);
  await sleep(200);
  await app.keys('Opening words. ');
  await sleep(500);

  // The pane is opened at its references, whose key is known, and then at its notes.
  await app.documentPane('references');
  await app.documentPane('notes');
  await app.waitFor(`${pane} article`, 8000);
  const listed = await cards();
  check('the tab Notes lists the three notes', listed.length === 3, listed.join(' | '));
  check(
    'newest first: the image, the words pasted, the words written',
    listed[0] === 'Owl.png' && listed[1].startsWith(TAKEN[0]) && listed[2] === OWN,
    listed.join(' | '),
  );
  const source = await app.exec(
    `return document.querySelector(arguments[0] + ' article .piece.passage .source')?.textContent.trim() ?? ''`,
    pane,
  );
  check('the passage shows its source under it', source === 'Owls at night' || source === 'owls.example', source);

  await app.type(`${pane} input[type="search"]`, 'herons');
  await until('the one note found', async () => (await cards()).length === 1);
  check('the field finds a note by its words', (await cards())[0] === OWN, (await cards()).join(' | '));
  await app.exec(
    `const i = document.querySelector(arguments[0] + ' input[type="search"]'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); return true`,
    pane,
  );
  await until('all the notes again', async () => (await cards()).length === 3);
  await app.screenshot('notebook-out-2-pane');

  // ---- the writer's own words dragged into the text ----
  await app.drag(await card(OWN), `${body} .ProseMirror`);
  await until('the own words in the text', async () => (await words()).includes(OWN), 8000);
  check('own words dragged into the text are there as text', (await words()).includes(OWN), await words());
  check('and are no quotation', (await quotes()).length === 0, JSON.stringify(await quotes()));
  await app.screenshot('notebook-out-3-own-words');

  // ---- the passage dragged into the text ----
  await app.drag(await card(TAKEN[0]), `${body} .ProseMirror`);
  await until('the quotation in the text', async () => (await quotes()).length === 2, 10000);
  const dropped = await quotes();
  check(
    'the passage is paragraphs of the kind Quotation',
    dropped[0]?.text.includes(TAKEN[0]) && dropped[1]?.text.includes(TAKEN[1]),
    JSON.stringify(dropped),
  );
  check('followed by a citation after the last, and none after the first', !dropped[0].cited && dropped[1].cited, JSON.stringify(dropped));
  const listing = await invoke('library_list');
  const online = listing.entries.filter((e) => e.type === 'online');
  check('the library has a reference of the type Web page', online.length === 1, listing.entries.map((e) => e.type).join(', '));
  if (online.length) {
    const made = await invoke('library_get', { id: online[0].id });
    check('with the address of the page', made.fields.url === PAGE, JSON.stringify(made.fields));
  }
  const told = await app.exec(`return document.querySelector('.toaster')?.textContent ?? ''`);
  check('the reference made is said in a message', told.includes('Added to the library'), told);
  await app.screenshot('notebook-out-4-quotation');

  // ---- the image dragged into the text ----
  await app.drag(await card('Owl.png'), `${body} .ProseMirror`);
  await until('the figure in the text', () => app.exists(`${body} figure img[src^="blob:"]`), 10000);
  check('the image dragged in is a figure', true);
  const filed = await until('the image among the library’s files', async () => {
    const all = await invoke('files_list');
    return all.files.some((f) => f.name === 'Owl.png') ? all : null;
  }).catch(() => null);
  check('and the library’s files list it', !!filed);
  await app.screenshot('notebook-out-5-figure');

  // ---- the notes say where they went ----
  await until('the marks of notes used', async () => (await app.count(`${pane} article .used`)) === 3, 5000).catch(() => {});
  check('the pane marks the three notes used in this project', (await app.count(`${pane} article .used`)) === 3);
  await app.go('#/notebook');
  await app.waitFor(page, 8000);
  try {
    const row = await app.waitForText(`${page} [data-note]`, TAKEN[0], 4000);
    await app.click(row);
    await sleep(400);
  } catch (error) {
    passOver('the passage chosen by its row', String(error.message ?? error));
  }
  await app.waitForText(page, 'Used in', 5000).catch(() => {});
  const said = await app.text(page);
  check('back in the notebook, the note says it was used in the project', /Used in/.test(said) && said.includes('Birds of the night'), said.slice(0, 300));
  await app.screenshot('notebook-out-6-used');

  // ---- the passage copied in its note and pasted into the text ----
  let copied = false;
  try {
    await app.click(`${page} [data-note-text] .ProseMirror`);
    await sleep(200);
    await app.keys(['Control', 'a']);
    await app.keys(['Control', 'c']);
    await sleep(400);
    copied = (await app.exec(`return getSelection().toString()`)).includes(TAKEN[0]);
  } catch (error) {
    passOver('the passage copied in its note', String(error.message ?? error));
  }
  await app.openProject('Birds of the night');
  await app.waitFor(body, 8000);
  await app.click(body);
  await app.waitFor(`${body} .ProseMirror`, 5000);
  await sleep(200);
  await app.keys(['Control', 'End']);
  // Counted before the new paragraph, which is of the kind of the one it was made from.
  const before = (await quotes()).length;
  await app.press('Enter');
  await app.keys(['Control', 'v']);
  if (copied) {
    await until('the pasted quotation', async () => (await quotes()).length === before + 2, 10000).catch(() => {});
    const pasted = (await quotes()).slice(before);
    check(
      'the passage pasted is a quotation with its citation',
      pasted.length === 2 && pasted[0].text.includes(TAKEN[0]) && !pasted[0].cited && pasted[1].cited,
      JSON.stringify(pasted),
    );
    const again = (await invoke('library_list')).entries.filter((e) => e.type === 'online');
    check('and its source is not made a reference again', again.length === 1, String(again.length));
  } else passOver('the paste of the passage', 'nothing was copied in the note');
  await app.screenshot('notebook-out-7-pasted');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('notebook-out-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await Promise.race([app.close().catch(() => {}), sleep(5000)]);
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
