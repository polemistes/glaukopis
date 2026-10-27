// The images at the side of a project (ADR 0070): images of the library,
// shown for the map, the project or the whole library, and how they come
// into the texts of a project as figures. A figure's caption is the
// document's; one of an image of a kind not every document holds shows a
// copy made of it beside it in the library.

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

/** A picture of bands, as BMP: a kind not every document holds. */
function bmp(width, height) {
  const row = Math.ceil((width * 3) / 4) * 4;
  const size = 54 + row * height;
  const b = Buffer.alloc(size);
  b.write('BM', 0);
  b.writeUInt32LE(size, 2);
  b.writeUInt32LE(54, 10);
  b.writeUInt32LE(40, 14);
  b.writeInt32LE(width, 18);
  b.writeInt32LE(height, 22);
  b.writeUInt16LE(1, 26);
  b.writeUInt16LE(24, 28);
  b.writeUInt32LE(row * height, 34);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) b.set([40 + y * 2, 90, 160 - x], 54 + y * row + x * 3);
  return b;
}

const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
writeFileSync(join(desk, 'The shield.png'), png(480, 300));
writeFileSync(join(desk, 'Rings.png'), png(200, 120, 40));
writeFileSync(join(desk, 'A wide frieze.png'), png(640, 120, 90));
writeFileSync(join(desk, 'Plate.bmp'), bmp(60, 40));
writeFileSync(
  join(desk, 'forms.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="160" viewBox="0 0 300 160"><circle cx="90" cy="80" r="50" fill="none" stroke="#7a2e2e" stroke-width="4"/><path d="M170 130 L215 30 L260 130 Z" fill="#2e4a7a"/></svg>',
);

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
  const record = () => JSON.parse(readFileSync(join(app.dataDir, 'library', 'files.json'), 'utf8'));
  const called = (name) => record().files.find((f) => f.name === name);
  const rows = () => app.exec(`return Array.from(document.querySelectorAll('.panel .list .row .name')).map((n) => n.textContent.trim())`);
  const row = (name) => app.findByText('.panel .list .row', name);
  const picturesKey = () => app.keys(['Control', 'Shift', 'p']);

  // ---- images among the files of the library ----
  const taken = await invoke('files_take_in', {
    paths: ['The shield.png', 'Rings.png', 'forms.svg', 'Plate.bmp'].map((n) => join(desk, n)),
    folder: null,
    structure: false,
    ticket: null,
  });
  check('images are taken into the library as files', taken.files.length === 4, String(taken.files.length));
  const shield = taken.files.find((f) => f.name === 'The shield.png');
  await invoke('file_set_alt', { hash: shield.hash, alt: 'A round shield with rings' });
  check('an image says how large it is, and what it shows', called('The shield.png').width === 480 && called('The shield.png').alt === 'A round shield with rings');
  await app.exec('location.reload()');
  await sleep(1500);
  await app.installErrorHook();

  // ---- a project ----
  await app.keys(['Control', '1']);
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);

  // ---- the panel ----
  await app.keys(['Control', 'Shift', 'r']);
  await app.waitFor('.panel[aria-label="References"]', 5000);
  await picturesKey();
  await app.waitFor('.panel[aria-label="Images"]', 5000);
  check('the panel of images takes the place of that of the references', !(await app.exists('.panel[aria-label="References"]')));
  check('the project has no images yet', /No images yet/.test(await app.text('.panel .body')));
  const scopes = await app.exec(`return Array.from(document.querySelectorAll('.panel [role="radio"]')).map((r) => r.textContent.trim()).join('|')`);
  check('the panel shows the map, the project or the library', scopes === 'This map|Project|Library', scopes);
  await app.clickText('.panel [role="radio"]', 'Library');
  await app.waitFor('.panel .list .row', 5000);
  check('the library has all its images', (await rows()).length === 4, (await rows()).join('|'));
  const line = await app.exec(
    `const r = Array.from(document.querySelectorAll('.panel .list .row')).find((e) => e.textContent.includes('The shield.png'));
     return { said: r.querySelector('.said')?.textContent ?? '', drawn: !!r.querySelector('img') };`,
  );
  check('a row says what the image shows, beside it small', line.said === 'A round shield with rings' && line.drawn, JSON.stringify(line));
  await app.screenshot('picture-panel-1');

  // ---- dragged into a text ----
  await app.doubleClick('.diagram .node.root');
  await app.waitFor('.box .text .prose');
  await sleep(250);
  await app.keys('Hephaestus makes the arms.');
  await sleep(500);
  await app.drag(await row('The shield.png'), '.box .text .prose p');
  await until('the figure', () => app.exists('.box .text figure.figure img[src^="blob:"]'), 10000);
  const said = await app.exec(`return document.querySelector('.box .text figure figcaption').textContent`);
  check('an image dragged into a text is a figure there, with nothing said of it yet', said === '', said);
  const shows = await app.exec(`return document.querySelector('.box .text figure img').alt`);
  check('and with what the image shows', shows === 'A round shield with rings', shows);
  await app.exec(
    `const c = document.querySelector('.box .text figure figcaption'); c.focus(); const s = getSelection(); s.selectAllChildren(c); s.collapseToEnd();`,
  );
  await app.click('.box .text figure figcaption');
  await sleep(150);
  await app.keys('The shield, in book 18');
  await sleep(900);
  const here = await app.text('.box .text figure figcaption');
  check('what is said of the figure is written there', /in book 18$/.test(here), here);
  check('and is the document’s: nothing of it is with the image', !JSON.stringify(record()).includes('book 18'));
  await app.screenshot('picture-panel-2-figure');

  // ---- dragged onto an element ----
  await app.press('Escape');
  await sleep(200);
  await app.press('Escape');
  await app.waitGone('.box');
  await app.click('.diagram .node.root');
  await app.keys(['Alt', 'Shift', 'Enter']);
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('Forms');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await sleep(200);
  await app.drag(await row('forms.svg'), await app.findByText('.diagram .node', 'Forms'));
  await sleep(800);
  await app.clickText('.panel [role="radio"]', 'Project');
  await until('the project to have two images', async () => (await rows()).length === 2);
  check('an image dragged onto an element is a figure in its text', (await rows()).join('|') === 'forms.svg|The shield.png', (await rows()).join('|'));
  await app.clickText('.panel [role="radio"]', 'This map');
  await sleep(300);
  check('the images of the map are those of its figures', (await rows()).length === 2, (await rows()).join('|'));

  // ---- onto a section of the text ----
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await until('the figures in the text of the map', async () => (await app.count('.text-view figure img[src^="blob:"]')) === 2, 10000);
  await app.clickText('.panel [role="radio"]', 'Library');
  await app.waitFor('.panel .list .row', 5000);
  const heading = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).find((s) => s.querySelector('.heading').textContent.includes('Forms')).querySelector('.heading')`,
    );
  await app.drag(await row('Rings.png'), Object.values(await heading())[0]);
  await until('the third figure', async () => (await app.count('.text-view figure')) === 3, 8000);
  const under = () =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => s.querySelector('.heading').textContent.includes('Forms'));
       return Array.from(s.querySelectorAll('figure img')).map((i) => i.dataset.picture.split('.')[1]).join('|');`,
    );
  check('an image dragged onto a section is a figure at the end of its text', (await under()) === 'svg|png', await under());

  // ---- an image of a kind not every document holds ----
  await app.drag(await row('Plate.bmp'), Object.values(await heading())[0]);
  await until('the fourth figure', async () => (await app.count('.text-view figure')) === 4, 8000);
  const plate = called('Plate.bmp');
  const copy = record().files.find((f) => f.madeFrom === plate.hash);
  check('a BMP becomes a figure of a PNG made of it beside it', !!copy && copy.name === 'Plate.png' && copy.folder === plate.folder, JSON.stringify(copy ?? {}));
  check('which the figure shows', (await under()).endsWith('|png') && (await app.exec(`return Array.from(document.querySelectorAll('.text-view figure img')).some((i) => i.dataset.picture.startsWith(arguments[0]))`, copy?.hash ?? '-')));
  check('and the BMP stays as it was', !!plate && plate.name === 'Plate.bmp');

  // ---- from the tools for writing ----
  await app.click('.panel button[aria-label="Close"]');
  await app.waitGone('.panel');
  await app.click('.text-view .section .body .prose');
  await app.waitFor('.text-view .section .body .ProseMirror', 5000);
  await sleep(300);
  await app.click('.pane-bar [data-insert]');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Image');
  await app.waitFor('.panel[aria-label="Images"] .list .row', 5000);
  const chosen = await app.exec(`return document.querySelector('.panel [role="radio"][aria-checked="true"]').textContent.trim()`);
  check('Insert › Image opens the panel on the library', chosen === 'Library', chosen);
  check('and leaves the cursor in the text', await app.exec(`return !!document.activeElement && !!document.activeElement.closest('.text-view .ProseMirror')`));

  // Files dropped on the panel are taken into the library.
  const panel = await middleOf('.panel .body');
  await drop([join(desk, 'A wide frieze.png')], panel.x, panel.y);
  await until('the image to be taken in', async () => (await rows()).includes('A wide frieze.png'), 10000);
  const frieze = called('A wide frieze.png');
  const images = record().folders.find((f) => f.name === 'Images');
  check('images dropped on the panel are taken into the folder Images', !!frieze && frieze.folder === images?.id, JSON.stringify(frieze ?? {}));

  // ---- put into the text from the menu ----
  await app.click('.text-view .section .body .ProseMirror p');
  await sleep(300);
  await app.rightClick(await row('Rings.png'));
  await app.waitFor('.menu');
  const offered = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"] .label')).map((m) => m.textContent.trim()).join('|')`);
  check('the menu of a row opens it, and puts it where the cursor is', offered === 'Open…|Put it into the text', offered);
  await app.clickText('.menu [role="menuitem"]', 'Put it into the text');
  await until('the fifth figure', async () => (await app.count('.text-view figure')) === 5, 8000);
  check('which makes a figure there', true);
  await app.screenshot('picture-panel-3-text');

  // ---- opened among the files ----
  await app.rightClick(await row('The shield.png'));
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Open…');
  await app.waitFor(`.file-pane[data-file="${shield.hash}"]`, 8000);
  check('an image is opened among the files of the library', (await app.exec('return location.hash')).startsWith('#/files'));

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('picture-panel-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
