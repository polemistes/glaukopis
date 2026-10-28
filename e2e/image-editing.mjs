// A simple image editor (ADR 0071): an image of the library edited in its side, turned,
// coloured and cropped over a lighter copy, kept as a new file made from the one in view,
// which is never changed; an edit of the copy made from the copy; an edit left; and the
// versions of a figure's image chosen by hand in its panel.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok });
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
const W = 480;
const H = 300;
writeFileSync(join(desk, 'The shield.png'), png(W, H));

const app = await App.launch({ width: 1440, height: 900 });
try {
  await app.installErrorHook();
  const invoke = (command, args = {}) =>
    app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
  const listing = async () => (await invoke('files_list')).files;
  const called = async (name) => (await listing()).find((f) => f.name === name);
  const editing = (body, ...args) => app.execAsync(`return await window.__glaukopisImageEditing.${body};`, ...args);
  const sideFile = () => app.exec(`return document.querySelector('[data-file-side]')?.dataset.fileSide ?? null`);
  const imageStyle = () =>
    app.exec(`const i = document.querySelector('[data-file-side] [data-viewer-image] .box img');
      const b = i?.parentElement.getBoundingClientRect();
      return i ? { transform: i.style.transform, filter: i.style.filter, src: i.src, w: b.width, h: b.height } : null;`);

  // ---- an image of the library, and a project in which it is a figure ----
  const taken = await invoke('files_take_in', { paths: [join(desk, 'The shield.png')], folder: null, structure: false, ticket: null });
  const shield = taken.files[0];
  check('an image is taken into the library', shield && shield.width === W && shield.height === H, JSON.stringify(shield && [shield.width, shield.height]));
  await app.exec('location.reload()');
  await sleep(1500);
  await app.installErrorHook();

  await app.keys(['Control', '1']);
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'The arms of Achilles');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.keys(['Control', 'Shift', 'p']);
  await app.waitFor('.panel[aria-label="Images"]', 5000);
  await app.clickText('.panel [role="radio"]', 'Library');
  await app.waitFor('.panel .list .row', 5000);
  await app.doubleClick('.diagram .node.root');
  await app.waitFor('.box .text .prose');
  await sleep(250);
  await app.keys('Hephaestus makes the shield.');
  await sleep(500);
  await app.drag(await app.findByText('.panel .list .row', 'The shield.png'), '.box .text .prose p');
  await until('the figure', () => app.exists('.box .text figure.figure img[src^="blob:"]'), 10000);
  // The figure's picture carries the name of the file it shows; every version has a name of its own.
  const figureFile = () => app.exec(`return document.querySelector('.box .text figure .picture')?.dataset.name ?? ''`);
  check('the image is a figure in a text', (await figureFile()) === 'The shield.png', await figureFile());

  // ---- shown beside, and edited; the text and the panel of images closed, for the room ----
  await app.press('Escape');
  await sleep(200);
  await app.press('Escape');
  await sleep(200);
  await app.keys(['Control', 'Shift', 'p']);
  await app.waitGone('.panel[aria-label="Images"]', 5000);
  await app.execAsync(`window.__glaukopisViewer.beside(arguments[0]);`, shield.hash);
  await until('the image beside', () => app.exec(`return document.querySelector('[data-file-side] [data-viewer-image] img')?.naturalWidth ?? 0`), 10000);
  check('the bar of an image has Edit', await app.exists('[data-file-side] [data-viewer-edit]'));
  const reachable = await app.exec(
    `const b = document.querySelector('[data-file-side] [data-viewer-edit]').getBoundingClientRect(), s = document.querySelector('[data-file-side]').getBoundingClientRect();
     return b.right <= s.right + 1 && b.bottom <= s.bottom;`,
  );
  check('and it is within the side, however narrow', reachable);
  await app.click('[data-file-side] [data-viewer-edit]');
  await app.waitFor('[data-edit-row]', 5000);
  await until('the lighter copy', async () => (await imageStyle())?.src.startsWith('blob:'), 8000);
  check('editing opens a row under the bar, and says so of the image', await app.exists('[data-file-side] [data-viewer-editing]'));
  check('nothing can be kept before something is changed', await app.exec(`return document.querySelector('[data-edit-keep]').disabled`));
  await app.screenshot('image-editing-1-row');

  await app.click('[data-edit-turn="right"]');
  await sleep(250);
  let style = await imageStyle();
  check('turned right, the image turns', /rotate\(90deg\)/.test(style.transform), style.transform);
  check('and the frame it is shown in is as high as the image was wide', Math.abs(style.w / style.h - H / W) < 0.02, `${style.w}×${style.h}`);
  check('now it can be kept', !(await app.exec(`return document.querySelector('[data-edit-keep]').disabled`)));

  await editing('set(arguments[0])', { brightness: 150 });
  await sleep(150);
  style = await imageStyle();
  check('brighter, as the browser shows it', /brightness\(1\.5\)/.test(style.filter), style.filter);
  const said = await app.text('[data-edit-slider="brightness"] [data-amount]');
  check('the slider says how bright', /^150\s?%$/.test(said.replace(/ /g, ' ')), said);
  await app.click('[data-edit-slider="brightness"] [data-edit-as-it-was]');
  await sleep(150);
  check('As it was puts it back', (await editing('edit()')).brightness === 100);

  await app.click('[data-edit-crop]');
  await app.waitFor('[data-crop-frame]', 3000);
  await editing('set(arguments[0])', { crop: { x: 0, y: 0, width: 0.5, height: 1 } });
  await sleep(200);
  const cut = await app.text('[data-edit-cut]');
  check('the crop says what it cuts to', cut.includes(`${H / 2} × ${W} of ${H} × ${W}`), cut);
  await app.screenshot('image-editing-2-crop');

  await app.click('[data-edit-keep]');
  await until('the copy', () => called('The shield (edited).png'), 15000);
  const copy = await called('The shield (edited).png');
  check('kept as a new file beside the one edited', copy.folder === shield.folder && copy.madeFrom === shield.hash, JSON.stringify({ folder: copy.folder, madeFrom: copy.madeFrom }));
  check('turned and cut as the side showed it', copy.width === H / 2 && copy.height === W, `${copy.width}×${copy.height}`);
  const before = await called('The shield.png');
  check('the one edited is as it was', before.hash === shield.hash && before.width === W && before.height === H && before.added === shield.added);
  await until('the copy in the side', async () => (await sideFile()) === copy.hash, 8000);
  check('the side shows the copy, and the row is gone', !(await app.exists('[data-edit-row]')));
  await until('the copy drawn', () => app.exec(`return document.querySelector('[data-file-side] [data-viewer-image] img')?.naturalWidth ?? 0`), 10000);
  await app.screenshot('image-editing-3-kept');

  // ---- the copy edited: made from the copy ----
  await app.click('[data-file-side] [data-viewer-edit]');
  await app.waitFor('[data-edit-row]', 5000);
  await app.click('[data-edit-flip="y"]');
  await sleep(150);
  await app.click('[data-edit-keep]');
  await until('the copy of the copy', () => called('The shield (edited 2).png'), 15000);
  const second = await called('The shield (edited 2).png');
  check('an edit of a copy is made from the copy', second.madeFrom === copy.hash, second.madeFrom);

  // ---- an edit left ----
  await app.click('[data-file-side] [data-viewer-edit]');
  await app.waitFor('[data-edit-row]', 5000);
  await editing('set(arguments[0])', { contrast: 120 });
  await sleep(150);
  const files = (await listing()).length;
  await app.click('[data-edit-cancel]');
  await app.waitForText('dialog', 'Leave without keeping?', 3000);
  check('leaving with something changed asks first', true);
  await sleep(300);
  await app.clickText('dialog footer button', 'Leave');
  await app.waitGone('[data-edit-row]', 3000);
  check('left, nothing is kept', (await listing()).length === files);
  await app.click('[data-file-side] [data-viewer-edit]');
  await app.waitFor('[data-edit-row]', 5000);
  await app.press('Escape');
  await app.waitGone('[data-edit-row]', 3000);
  check('with nothing changed, Escape leaves without asking', !(await app.exists('dialog')));

  // ---- the versions of the figure's image ----
  await app.doubleClick('.diagram .node.root');
  await app.waitFor('.box .text figure .picture', 5000);
  await sleep(300);
  check('every figure still shows the one it named', (await figureFile()) === 'The shield.png', await figureFile());
  await app.click('.box .text figure .picture');
  await app.waitFor('.figure-panel', 3000);
  await sleep(250);
  await app.waitFor('.figure-panel [data-figure-versions]', 5000);
  await app.click('.figure-panel [data-figure-versions]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  const versions = await app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((i) => (i.querySelector('.check svg') ? '* ' : '') + i.querySelector('.label').textContent.trim())`,
  );
  check(
    'the panel of the figure lists the versions of its image, the one shown marked',
    versions.length === 3 && versions[0].startsWith('* The shield.png') && versions[1].startsWith('The shield (edited).png'),
    versions.join(' | '),
  );
  await app.screenshot('image-editing-4-versions');
  await app.clickText('.menu [role="menuitem"]', 'The shield (edited).png');
  await until('the figure to show the copy', async () => (await figureFile()) === 'The shield (edited).png', 5000);
  check('a version chosen is what the figure shows', true);
  await app.press('Escape');
  await sleep(200);

  // ---- the pane of the image ----
  await app.go(`#/files?file=${shield.hash}`);
  await app.waitFor('[data-copies]', 8000);
  const copies = await app.exec(`return Array.from(document.querySelectorAll('[data-copies] a')).map((a) => a.textContent.trim())`);
  check('the pane of the image lists the copy made from it', copies.length === 1 && copies[0] === 'The shield (edited).png', copies.join(' | '));
  await app.go(`#/files?file=${copy.hash}`);
  await app.waitFor('[data-made-from]', 8000);
  const from = await app.text('[data-made-from]');
  check('and that of the copy says what it was made from, and what was made from it', /^Made from\s+The shield\.png/.test(from) && (await app.exists('[data-copies]')), from);
  await app.screenshot('image-editing-5-pane');

  const errors = await app.exec('return window.__glaukopisErrors ?? []');
  check('no errors in the page', errors.length === 0, JSON.stringify(errors).slice(0, 600));
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
