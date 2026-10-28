// The files of the library (ADR 0043), through their view in the library's
// place, in parts, each going on from what the one before left:
//
// 1. a tree of folders and files dropped on it, taken in with its
//    structure; the folders, the list, the filters; a file given to a
//    reference through the pane and the chooser; and a reference deleted
//    while its file stays, unassigned;
// 2. the going-through: files given to their references, where the name
//    alone says whose a file is, and a scan with nothing to say is left
//    for later; offered by the bar at the head, the only thing to do with
//    several files but move, export and remove them; its rows in groups,
//    and what it did undone at once;
// 3. the export of all the files into a folder, under the names of their
//    references, with a references.bib beside them;
// 4. the folder a file stands in as a clue to the work it is part of; and
//    the pane of a reference: files of the library added to it, all taken
//    from it at once, and several from the disk asked about first.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

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

// ---- a tree of files on the desk ----
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-files-'));
const greek = join(desk, 'Greek');
const homer = join(greek, 'Homer');
mkdirSync(homer, { recursive: true });
const NAGY = 'Nagy 1979 - The Best of the Achaeans.pdf';
{
  // A PDF made by Typst, as sources.mjs makes them; without Typst, a stub,
  // which is taken in as a file all the same.
  const source = join(desk, 'nagy.typ');
  writeFileSync(
    source,
    `#set page(paper: "a5")\n= The Best of the Achaeans\nGregory Nagy\n\n#lorem(40)\n`,
  );
  try {
    execFileSync('typst', ['compile', source, join(homer, NAGY)], { stdio: 'pipe' });
  } catch {
    passOver('a PDF made by Typst', 'Typst is not installed, so a stub stands for it');
    writeFileSync(join(homer, NAGY), '%PDF-1.4\n%%EOF\n');
  }
}
// The picture of one dot of `contract.rs`.
writeFileSync(
  join(greek, 'plate.png'),
  Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0xf0,
    0x1f, 0x00, 0x05, 0x00, 0x01, 0xff, 0x89, 0x99, 0x3d, 0x1d, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]),
);
const notes = join(desk, 'notes.txt');
writeFileSync(notes, 'What was said at the seminar on the hero.\n');
// For the going-through: PDFs with nothing in them, so that only their names can say what they are.
const scans = join(desk, 'scans');
mkdirSync(scans);
const stubOf = (name, mark) => {
  writeFileSync(join(scans, name), `%PDF-1.4\n% ${mark}\n%%EOF\n`);
  return join(scans, name);
};
const nagyByName = stubOf(NAGY, 'by name');
const scan0001 = stubOf('scan0001.pdf', 'a scan');
// A part of a book in a folder named for the book, for part 4.
const bookFolder = join(desk, 'later', 'Nagy 1979 - The Best of the Achaeans');
mkdirSync(bookFolder, { recursive: true });
writeFileSync(join(bookFolder, 'chapter 3.pdf'), '%PDF-1.4\n% a chapter\n%%EOF\n');
// Where everything is exported to.
const out = join(desk, 'exported');

const app = await App.launch({ width: 1360, height: 880 });
try {
  await app.installErrorHook();
  // Files are dropped as the window tells of files dropped from the desktop.
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
  const rows = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('[data-file-list] [data-hash]')).map((e) => ({
         hash: e.dataset.hash,
         kind: e.dataset.kind,
         name: e.querySelector('.name').textContent.trim(),
         reference: e.querySelector('.reference').textContent.trim(),
       }))`,
    );
  const folders = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('[data-file-folders] [data-folder]'))
         .filter((e) => e.dataset.folder)
         .map((e) => ({ name: e.querySelector('.name').textContent.trim(), indent: parseInt(e.style.paddingLeft) }))`,
    );
  const toasts = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.toaster .toast')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim())`,
    );
  /** Chooses in the menu of how the files are shown. */
  const view = async (label) => {
    await app.click('[data-files-view]');
    await app.waitFor('[role="menu"]', 3000);
    await sleep(250);
    await app.clickText('[role="menuitem"]', label);
    await app.waitGone('[role="menu"]', 3000).catch(() => {});
    await sleep(250);
  };
  /** Chooses in the menu of the order. */
  const sortBy = async (label) => {
    await app.click('button[aria-label="Sort"]');
    await app.waitFor('[role="menu"]', 3000);
    await sleep(250);
    await app.clickText('[role="menuitem"]', label);
    await app.waitGone('[role="menu"]', 3000).catch(() => {});
    await sleep(250);
  };
  /** Chooses in the menu of the filters. */
  const filter = async (label) => {
    await app.click('[data-files-filter]');
    await app.waitFor('[role="menu"]', 3000);
    await sleep(250); // the menu slides in: a click before it stands is caught by what is under it
    await app.clickText('[role="menuitem"]', label);
    await app.waitGone('[role="menu"]', 3000).catch(() => {});
    await sleep(200);
  };

  // ---- part 1: the view, taking in, the folders, the list, assigning ----

  // The library of the fixture, pasted in as library.mjs pastes it.
  await app.go('#/library');
  await app.waitForText('h3', 'Your library is empty');
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.click('.split-more');
  await app.clickText('[role="menuitem"]', 'Paste references');
  await app.waitFor('dialog textarea');
  await app.exec(
    `const t = document.querySelector('dialog textarea');
     t.value = arguments[0];
     t.dispatchEvent(new Event('input', { bubbles: true }));`,
    bib,
  );
  await app.clickText('dialog footer button', 'Continue');
  await app.waitForText('dialog h2', 'Import references');
  await app.clickText('dialog footer button', 'Import');
  await app.waitGone('dialog', 10000);
  await app.waitUntil(`return document.querySelectorAll('.list .item').length >= 10`, 5000, 'the list');

  // The message of the import came while its dialog was open, and is seen when it has gone.
  const imported = await until(
    'the message of the import',
    async () => (await toasts()).find((t) => /references added/.test(t)),
    5000,
  ).catch(() => '');
  check('the message of the import outlives its dialog', !!imported, imported);
  // The switch at the head of the library leads to the files.
  check('the library has a switch to its files', await app.exists('[data-library-switch]'));
  await app.clickText('[data-library-switch] [role="radio"]', 'Files');
  await app.waitForText('h3', 'No files yet', 5000);
  check('the switch leads to the files', (await app.exec('return location.hash')) === '#/files');
  check(
    'and the library keeps its place in the rail',
    await app.exists('.rail a.place.current[href="#/library"]'),
  );
  await app.screenshot('files-0-empty');

  // A folder and a file dropped on the view are taken in, the folder with its structure.
  const onView = await middleOf('.files-view .middle .body');
  await drop([greek, notes], onView.x, onView.y);
  await app.waitFor('[data-file-list] [data-hash]', 10000);
  await until('three files', async () => (await rows()).length === 3);
  const told = await until('the toast', async () => (await toasts()).join(' | '), 5000).catch(
    () => '',
  );
  check('the toast says what was taken in', /3 files taken in/.test(told) && /2 folders made/.test(told), told);
  const tree = await folders();
  check(
    'the tree shows Greek › Homer',
    tree.length === 2 &&
      tree[0].name === 'Greek' &&
      tree[1].name === 'Homer' &&
      tree[1].indent > tree[0].indent,
    JSON.stringify(tree),
  );
  const listed = await rows();
  check('the list shows three files', listed.length === 3, listed.map((r) => r.name).join(', '));
  check(
    'each of its kind',
    ['pdf', 'picture', 'document'].every((k) => listed.some((r) => r.kind === k)),
    listed.map((r) => r.kind).join(', '),
  );
  check(
    'none with a reference',
    listed.every((r) => r.reference === 'No reference'),
  );

  // The folders: Homer has the PDF; Greek the plate, and the PDF too with the folders under it included.
  await app.clickText('[data-file-folders] [data-folder] .name', 'Homer');
  await sleep(250);
  const inHomer = await rows();
  check('Homer holds the PDF', inHomer.length === 1 && inHomer[0].name === NAGY, inHomer.map((r) => r.name).join(', '));
  await app.clickText('[data-file-folders] [data-folder] .name', 'Greek');
  await sleep(250);
  check('Greek holds one, the folders under it not included', (await rows()).length === 1);
  await view('Include subfolders');
  check('and two with them', (await rows()).length === 2);
  const homerShown = await app.exec(`return Array.from(document.querySelectorAll('[data-file-list] [data-hash] .folder')).map((e) => e.textContent.trim()).join('|')`);
  check('each with its folder said', homerShown.split('|').sort().join('|') === 'Greek|Homer', homerShown);
  await view('Include subfolders');
  await app.clickText('[data-file-folders] .item.all', 'All files');
  await sleep(250);

  // The filters.
  await filter('PDFs');
  const pdfs = await rows();
  check('the filter PDFs shows one', pdfs.length === 1 && pdfs[0].kind === 'pdf', String(pdfs.length));
  check('and the filter says it is on', await app.exists('.filter .badge'));
  await filter('All kinds');
  await filter('Unassigned only');
  check('Unassigned only shows three', (await rows()).length === 3);
  await app.screenshot('files-1-view');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('files-1-view-dark');
  await app.setTheme('light');

  // The columns at the sides are dragged wider, and stay so for the references.
  const widths = () =>
    app.exec(
      `const v = document.querySelector('.files-view, .library');
       return [v.querySelector('.side').getBoundingClientRect().width,
               v.querySelector('.detail').getBoundingClientRect().width].map(Math.round)`,
    );
  const [side0, detail0] = await widths();
  const dividers = await app.findAll('.files-view > [role="separator"]');
  check('the folders and the pane can be dragged wider', dividers.length === 2, String(dividers.length));
  await app.drag(dividers[0], { dx: 120, dy: 0 });
  await app.drag(dividers[1], { dx: -90, dy: 0 });
  await sleep(200);
  const [side1, detail1] = await widths();
  check(
    'the folders are wider, and so is the pane',
    side1 >= side0 + 100 && detail1 >= detail0 + 70,
    `${side0}→${side1}, ${detail0}→${detail1}`,
  );
  await app.screenshot('files-1-wider');
  await app.clickText('[data-library-switch] button', 'References');
  await app.waitFor('.library .side', 5000);
  const [side2, detail2] = await widths();
  check('the references have the same columns', side2 === side1 && detail2 === detail1, `${side2}, ${detail2}`);
  await app.drag('.library > [role="separator"]', { dx: -120, dy: 0 });
  await sleep(200);
  const [side3] = await widths();
  check('and narrower again there', side3 <= side1 - 100, `${side1}→${side3}`);
  await app.clickText('[data-library-switch] button', 'Files');
  await app.waitFor('.files-view .side', 5000);
  check('the filter is as it was left, the view being kept', (await rows()).length === 3); // Not reset with the view.

  // The PDF is given to its reference, through the pane and the chooser.
  const pdf = listed.find((r) => r.kind === 'pdf');
  await app.click(`[data-file-list] [data-hash="${pdf.hash}"]`);
  await app.waitFor(`.file-pane[data-file="${pdf.hash}"]`, 5000);
  check(
    'the route names the file',
    (await app.exec('return location.hash')).includes(`file=${pdf.hash}`),
  );
  // The library is kept as it was left: gone elsewhere and back by the book in
  // the rail, the files are in view, at the file selected, with the filter still on.
  await app.go('#/search');
  await app.waitGone('.files-view', 5000);
  await app.click('.rail a[href="#/library"]');
  await app.waitFor(`.file-pane[data-file="${pdf.hash}"]`, 5000);
  check(
    'back by the rail, the library shows its files, at the file selected',
    (await app.exec('return location.hash')) === `#/files?file=${pdf.hash}`,
    await app.exec('return location.hash'),
  );
  check('with the filter still on', (await rows()).length === 3);
  check(
    'the pane says it is unassigned',
    /belongs to no reference/.test(await app.text('.file-pane [data-references]')),
  );
  const actions = await app.exec(
    `return Array.from(document.querySelectorAll('.file-pane [data-action]')).map((e) => e.dataset.action)`,
  );
  check(
    'the pane has the actions of a PDF',
    ['open', 'reveal', 'searchable', 'map'].every((a) => actions.includes(a)),
    actions.join(', '),
  );
  await app.click('.file-pane [data-assign]');
  await app.waitFor('dialog [data-chooser]', 3000);
  await app.type('dialog .search input', 'Achaeans');
  await until('the chooser to find the work', async () =>
    (await app.count('dialog [data-chooser] [role="option"]')) === 1,
  );
  await app.screenshot('files-2-chooser');
  await app.click('dialog [data-chooser] [role="option"]');
  await app.waitGone('dialog', 3000);
  await until('the pane to show the reference', () =>
    app.exists('.file-pane [data-reference]'),
  );
  const said = await app.exec(
    `return document.querySelector('.file-pane [data-reference]').textContent.replace(/\\s+/g, ' ')`,
  );
  check('the pane shows the reference', /Nagy/.test(said) && /Achaeans/.test(said), said);
  const row = (await rows()).find((r) => r.hash === pdf.hash);
  check(
    'the list says whose it is',
    !row || /Nagy 1979/.test(row.reference),
    row?.reference ?? 'filtered out',
  );
  await sleep(300);
  check(
    'and Unassigned only leaves it out',
    (await rows()).length === 2,
    String((await rows()).length),
  );
  await app.screenshot('files-2-pane');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('files-2-pane-dark');
  await app.setTheme('light');
  await filter('Unassigned only');

  // The reference is deleted, and its file kept.
  const id = await app.attr('.file-pane [data-reference]', 'data-reference');
  await app.click('.file-pane [data-reference] a');
  await app.waitFor('.pane [data-field="title"] textarea', 5000);
  check('the link leads to the reference', (await app.exec('return location.hash')).includes(id));
  await app.rightClick(`.list [data-id="${id}"]`);
  await app.waitFor('[role="menu"]', 3000);
  await sleep(250); // the menu slides in: a click before it stands is caught by what is under it
  await app.clickText('[role="menuitem"]', 'Delete');
  await app.waitForText('dialog footer button', 'Delete, keep the files', 3000);
  const asked = await app.exec(`return document.querySelector('dialog[open]')?.textContent.replace(/\\s+/g, ' ') ?? ''`);
  check(
    'deleting asks about the file',
    /One file belongs to what is deleted/.test(asked) &&
      (await app.exists('dialog footer button')) &&
      /Delete with the files/.test(asked),
    asked.replace(/\s+/g, ' '),
  );
  await app.screenshot('files-2b-delete-reference');
  await app.clickText('dialog footer button', 'Delete, keep the files');
  await app.waitGone('dialog', 3000);
  await app.waitGone(`.list [data-id="${id}"]`, 3000);
  check('the reference is gone', true);
  await app.clickText('[data-library-switch] [role="radio"]', 'Files');
  await app.waitFor('[data-file-list] [data-hash]', 5000);
  await until('the files', async () => (await rows()).length === 3);
  const kept = (await rows()).find((r) => r.hash === pdf.hash);
  check('the file is still there', !!kept);
  check('unassigned', kept?.reference === 'No reference', kept?.reference);

  // ---- the pane of an image, and of a PDF: the file itself, small ----
  const plate = (await rows()).find((r) => r.kind === 'picture');
  await app.click(`[data-file-list] [data-hash="${plate.hash}"]`);
  await app.waitFor(`.file-pane[data-file="${plate.hash}"] [data-preview] img[src^="blob:"]`, 8000);
  check('the pane of an image shows it, small', true);
  const pixels = await app.text('.file-pane [data-pixels]');
  check('and how large it is', pixels.trim() === '1 × 1', pixels);
  check('and that it is a figure nowhere yet', /Not used yet/.test(await app.text('.file-pane [data-used]')));
  await app.click('.file-pane [data-field="alt"] input');
  await app.keys('One dot, of the shield');
  await app.press('Enter');
  const record = () => JSON.parse(readFileSync(join(app.dataDir, 'library', 'files.json'), 'utf8'));
  await until('what it shows to be kept', async () => record().files.find((f) => f.hash === plate.hash)?.alt === 'One dot, of the shield');
  check('what it shows is written there and kept with the file', true);
  await app.screenshot('files-2c-pane-image');
  // Given to a reference from its pane, as any file is.
  await app.click('.file-pane [data-assign]');
  await app.waitFor('dialog [data-chooser]', 3000);
  await app.type('dialog .search input', 'Singer of Tales');
  await until('the chooser to find the work', async () => (await app.count('dialog [data-chooser] [role="option"]')) === 1);
  await app.press('Enter');
  await app.waitGone('dialog', 3000);
  const given = await until('the image to be the reference’s', async () => {
    const r = (await rows()).find((x) => x.hash === plate.hash);
    return /Lord 1960/.test(r?.reference ?? '') ? r : null;
  }, 5000).catch(() => null);
  check('an image is given to a reference as any file is', !!given, given?.reference);
  await app.click(`[data-file-list] [data-hash="${kept.hash}"]`);
  await app.waitFor(`.file-pane[data-file="${kept.hash}"] [data-preview]`, 5000);
  const pdfShown = await until('the first page of the PDF', () => app.exists('.file-pane [data-preview] img[src^="blob:"]'), 20000).catch(() => false);
  check('the pane of a PDF shows its first page', pdfShown);
  await app.screenshot('files-2d-pane-pdf');
  const notesRow = (await rows()).find((r) => r.kind === 'document' || r.kind === 'other');
  if (notesRow) {
    await app.click(`[data-file-list] [data-hash="${notesRow.hash}"]`);
    await app.waitFor(`.file-pane[data-file="${notesRow.hash}"] [data-preview="none"]`, 5000);
    check('a file of another kind says it has no preview', /No preview/.test(await app.text('.file-pane [data-preview]')));
  }

  // ---- thumbnails, in three sizes, and back ----
  await view('Medium');
  await app.waitFor('[data-file-list][data-mode="grid"]', 3000);
  const thumbs = await until('the thumbnails', async () => {
    const n = await app.exec(`return Array.from(document.querySelectorAll('[data-file-list] [data-hash] .frame img[src^="blob:"]')).map((i) => i.closest('[data-hash]').dataset.kind).sort().join('|')`);
    return n === 'pdf|picture' ? n : null;
  }, 20000).catch(() => '');
  check('as thumbnails, an image is shown small, and a PDF by its first page', thumbs === 'pdf|picture', thumbs);
  const side = () => app.exec(`return Math.round(document.querySelector('[data-file-list] [data-hash] .frame').getBoundingClientRect().width)`);
  check('in the middle size', (await side()) === 160, String(await side()));
  await app.screenshot('files-2e-grid-medium');
  await view('Large');
  check('large', (await side()) === 240, String(await side()));
  await app.screenshot('files-2f-grid-large');
  await view('Small');
  check('and small', (await side()) === 96, String(await side()));
  await app.press('ArrowRight');
  const settingsKept = () => JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8'));
  await until('the view to be kept', async () => settingsKept().filesView?.mode === 'grid' && settingsKept().filesView?.size === 'small', 5000).catch(() => {});
  check('how the files are shown is kept', settingsKept().filesView?.mode === 'grid' && settingsKept().filesView?.size === 'small', JSON.stringify(settingsKept().filesView));
  await view('List');
  await app.waitFor('[data-file-list][data-mode="list"]', 3000);
  check('and back as a list', true);

  // ---- sorted by kind ----
  await sortBy('By kind');
  const kinds = (await rows()).map((r) => r.kind);
  check('sorted by kind: PDFs, then images, then the rest', kinds.join('|') === ['pdf', 'picture', ...kinds.slice(2)].join('|') && kinds.indexOf('picture') > kinds.lastIndexOf('pdf'), kinds.join('|'));
  await sortBy('By name');

  // A folder deleted: what was in it moves up.
  await app.rightClick(await app.findByText('[data-file-folders] [data-folder]', 'Homer'));
  await app.waitFor('[role="menu"]', 3000);
  await sleep(250); // the menu slides in: a click before it stands is caught by what is under it
  await app.clickText('[role="menuitem"]', 'Delete folder');
  await app.waitForText('dialog', 'The folder contains one file', 3000);
  await app.clickText('dialog footer button', 'Place in parent folder');
  await app.waitGone('dialog', 3000);
  await until('the folder to go', async () => (await folders()).length === 1);
  await sleep(300);
  await app.clickText('[data-file-folders] [data-folder] .name', 'Greek');
  await until('Greek in view', async () =>
    (await app.exec('return location.hash')).includes('folder='),
  );
  await sleep(250);
  const inGreek = await rows();
  check(
    'and its file stands where the folder was',
    inGreek.length === 2 && inGreek.some((r) => r.hash === pdf.hash),
    inGreek.map((r) => r.name).join(', '),
  );

  // ---- part 2: the going-through ----

  // The work of the name is in the library again.
  await app.go('#/library');
  await app.waitFor('.list .item', 5000);
  const nagyEntry = /@book\{nagy1979,[\s\S]*?\n\}/.exec(bib)[0];
  await app.click('.split-more');
  await app.clickText('[role="menuitem"]', 'Paste references');
  await app.waitFor('dialog textarea');
  await app.exec(
    `const t = document.querySelector('dialog textarea');
     t.value = arguments[0];
     t.dispatchEvent(new Event('input', { bubbles: true }));`,
    nagyEntry,
  );
  await app.clickText('dialog footer button', 'Continue');
  await app.waitForText('dialog h2', 'Import references');
  await app.clickText('dialog footer button', 'Import');
  await app.waitGone('dialog', 10000);
  await app.waitFor(`.list .item`, 5000);

  // Two files dropped at the top: they are selected, and the bar says how many have no reference.
  await app.clickText('[data-library-switch] [role="radio"]', 'Files');
  await app.waitFor('[data-file-list] [data-hash]', 5000);
  await app.clickText('[data-file-folders] .item.all', 'All files');
  await sleep(250);
  const before = new Set((await rows()).map((r) => r.hash));
  const atTop = await middleOf('.files-view .middle .body');
  await drop([nagyByName, scan0001], atTop.x, atTop.y);
  await until('the two new files', async () => (await rows()).length === before.size + 2, 10000);
  const fresh = (await rows()).filter((r) => !before.has(r.hash));
  const nagyFresh = fresh.find((r) => r.name === NAGY);
  const takenWords = await until(
    'the message of taking in',
    async () => (await toasts()).find((t) => /taken in/.test(t)),
    8000,
  ).catch(() => '');
  check('the message after taking in offers nothing more', !/Go through/.test(takenWords), takenWords);
  const unassignedCount = async () => (await rows()).filter((r) => r.reference === 'No reference').length;
  const barCount = () =>
    app.exec(`return Number(document.querySelector('[data-unassigned-bar]')?.dataset.count ?? 0)`);
  const unassigned = await unassignedCount();
  await until('the bar', () => app.exists('[data-unassigned-bar]'), 5000).catch(() => false);
  const barWords = await app.exec(
    `return document.querySelector('[data-unassigned-bar]')?.textContent.replace(/\\s+/g, ' ').trim() ?? ''`,
  );
  check(
    'the bar says how many here belong to no reference',
    (await barCount()) === unassigned &&
      new RegExp(`${unassigned} files here belong to no reference`).test(barWords),
    `${await barCount()} of ${unassigned}: ${barWords}`,
  );
  await app.screenshot('files-2-bar');
  await until('the two to be selected', () => app.exists('[data-go-through-chosen]'), 5000);
  const several = await app.exec(
    `return document.querySelector('.files-view .detail')?.textContent.replace(/\\s+/g, ' ') ?? ''`,
  );
  check(
    'over several files, the pane offers no assignment to one reference',
    !/Assign to a reference/.test(several) && /Go through these 2/.test(several),
    several,
  );
  await app.rightClick(`[data-file-list] [data-hash="${nagyFresh.hash}"]`);
  await app.waitFor('[role="menu"]', 3000);
  await sleep(250);
  const menuOfTwo = await app.exec(
    `return Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"]')).map((e) => e.textContent.trim())`,
  );
  check(
    'and their menu has the going-through first, and no assignment',
    /Go through these 2/.test(menuOfTwo[0] ?? '') && !menuOfTwo.some((m) => /Assign/.test(m)),
    menuOfTwo.join(' | '),
  );
  await app.press('Escape');
  await app.waitGone('[role="menu"]', 3000).catch(() => {});
  await app.click('[data-go-through-chosen]');
  await app.waitFor('dialog [data-going="deciding"]', 20000);
  const goingRow = (name) => `dialog [data-going-file="${name}"]`;
  const checkedIn = (name) =>
    app.exec(
      `return document.querySelector(arguments[0] + ' [role="radio"][aria-checked="true"]')?.textContent.trim() ?? null`,
      goingRow(name),
    );
  check('the going-through has the two new files', (await app.count('dialog [data-going-file]')) === 2);
  const why = await app
    .exec(`return document.querySelector(arguments[0] + ' [data-reasons]')?.textContent.replace(/\\s+/g, ' ').trim() ?? ''`, goingRow(NAGY))
    .catch(() => '');
  check('the name alone finds the work, as probable', /probable/.test(why) && /named like it/.test(why), why);
  const proposed = await app.exec(
    `return document.querySelector(arguments[0] + ' .proposal').textContent.replace(/\\s+/g, ' ').trim()`,
    goingRow(NAGY),
  );
  check('and proposes that work', /Nagy/.test(proposed) && /Achaeans/.test(proposed), proposed);
  check('This one is chosen for it', (await checkedIn(NAGY)) === 'This one');
  const nothing = await app.text(`${goingRow('scan0001.pdf')} .proposal`);
  check('the scan has nothing found', /Nothing found/.test(nothing), nothing);
  check('and is left for later', (await checkedIn('scan0001.pdf')) === 'Later');
  const groupHead = (g) =>
    app.exec(
      `return document.querySelector('dialog [data-group="' + arguments[0] + '"] .row')?.textContent.replace(/\\s+/g, ' ').trim() ?? ''`,
      g,
    );
  check(
    'the rows stand in their groups, each with its head',
    /The one found as probable/.test(await groupHead('probable')) &&
      /The one with nothing found/.test(await groupHead('nothing')) &&
      (await app.exists(`dialog [data-group="probable"] [data-going-file="${NAGY}"]`)) &&
      (await app.exists(`dialog [data-group="nothing"] [data-going-file="scan0001.pdf"]`)),
    `${await groupHead('probable')} / ${await groupHead('nothing')}`,
  );
  check(
    'the button says how many it gives',
    (await app.text('dialog [data-going-done]')).trim() === 'Give one file to its reference',
    await app.text('dialog [data-going-done]'),
  );
  check(
    'the foot counts them',
    /1 to assign, 1 later/.test(await app.exec(`return document.querySelector('dialog[open] footer')?.textContent ?? ''`)),
    await app.exec(`return document.querySelector('dialog[open] footer')?.textContent ?? ''`),
  );
  await app.screenshot('files-3-go-through');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('files-3-go-through-dark');
  await app.setTheme('light');
  await app.click('dialog [data-going-done]');
  await app.waitGone('dialog', 10000);
  const goneThrough = await until(
    'the message of the going-through',
    async () => (await toasts()).find((t) => /assigned/.test(t)),
    5000,
  ).catch(() => '');
  check('the message says what was done', /One file assigned/.test(goneThrough) && /1 left for later/.test(goneThrough), goneThrough);
  check('and offers to undo it', /Undo/.test(goneThrough), goneThrough);
  await sleep(300);
  const byName = (await rows()).filter((r) => r.name === NAGY && /Nagy 1979/.test(r.reference));
  check('the file of that name is the work’s now', byName.length === 1, JSON.stringify(await rows()));
  const scanRow = (await rows()).find((r) => r.name === 'scan0001.pdf');
  check('the scan stays unassigned', scanRow?.reference === 'No reference', scanRow?.reference);
  await until('the bar to count one fewer', async () => (await barCount()) === unassigned - 1, 5000).catch(() => {});
  check('the bar counts one fewer', (await barCount()) === unassigned - 1, String(await barCount()));
  await app.click('[data-files-more]');
  await app.waitFor('[role="menu"]', 3000);
  await sleep(250);
  const headMenu = await app.exec(
    `return Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"]')).map((e) => e.textContent.trim())`,
  );
  check(
    'the menu of the head can undo it too',
    headMenu.some((m) => /Undo: one file given to its reference/.test(m)),
    headMenu.join(' | '),
  );
  await app.press('Escape');
  await app.waitGone('[role="menu"]', 3000).catch(() => {});

  // Undone at once, from the message.
  await app.clickText('.toaster .toast .action', 'Undo');
  const undone = await until(
    'the message of the undoing',
    async () => (await toasts()).find((t) => /taken back/.test(t)),
    5000,
  ).catch(() => '');
  check('Undo takes the file back', /One file taken back/.test(undone), undone);
  await until('the file to be unassigned', async () =>
    (await rows()).find((r) => r.hash === nagyFresh.hash)?.reference === 'No reference',
  5000).catch(() => {});
  check(
    'and it belongs to no reference again',
    (await rows()).find((r) => r.hash === nagyFresh.hash)?.reference === 'No reference',
    (await rows()).find((r) => r.hash === nagyFresh.hash)?.reference,
  );
  check('the bar counts it again', (await barCount()) === unassigned, String(await barCount()));

  // Given again, through the pane of the one file, for the export to find it so.
  await app.click(`[data-file-list] [data-hash="${nagyFresh.hash}"]`);
  await app.waitFor(`.file-pane[data-file="${nagyFresh.hash}"]`, 5000);
  await app.click('.file-pane [data-assign]');
  await app.waitFor('dialog [data-chooser]', 3000);
  await app.type('dialog .search input', 'Achaeans');
  await until('the chooser to find the work', async () =>
    (await app.count('dialog [data-chooser] [role="option"]')) === 1,
  );
  await app.click('dialog [data-chooser] [role="option"]');
  await app.waitGone('dialog', 3000);
  await until('the file to be the work’s again', async () =>
    /Nagy 1979/.test((await rows()).find((r) => r.hash === nagyFresh.hash)?.reference ?? ''),
  5000);

  // ---- part 3: the export ----

  // What is written, and whether a references.bib goes with it, is asked
  // first; the system's chooser of the folder comes after, and cannot be
  // answered from here (the page cannot stand in for it), so the dialog is
  // driven up to it, and the export itself is asked of the application.
  await app.click('[data-files-more]');
  await app.waitFor('[role="menu"]', 3000);
  await sleep(250); // the menu slides in: a click before it stands is caught by what is under it
  await app.clickText('[role="menuitem"]', 'Export all files');
  await app.waitFor('dialog [data-export]', 5000);
  const asks = await app.exec(`return document.querySelector('dialog[open]')?.textContent.replace(/\\s+/g, ' ') ?? ''`);
  check('the export says how many and how', /Export 5 files/.test(asks) && /Author Year - Title/.test(asks), asks.replace(/\s+/g, ' '));
  check(
    'and offers a references.bib',
    await app.exec(`return document.querySelector('dialog [data-with-bib]').checked`),
  );
  check('before the folder is chosen', /Choose the folder/.test(await app.exec(`return document.querySelector('dialog[open] footer')?.textContent ?? ''`)));
  await sleep(300);
  await app.screenshot('files-4-export');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('files-4-export-dark');
  await app.setTheme('light');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog', 3000);
  const invoke = (command, args = {}) =>
    app.execAsync(
      `return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`,
      command,
      args,
    );
  const exported = await invoke('files_export', { selection: { kind: 'all' }, into: out, withBib: true });
  check(
    'every file is written, with the folders and a references.bib',
    exported.files === 5 && exported.total === 5 && exported.folders === 1 && !!exported.bib && !exported.problems.length,
    JSON.stringify(exported),
  );
  check('the folders become folders on disk', existsSync(join(out, 'Greek')));
  check('a file is named by its reference', existsSync(join(out, NAGY)));
  check('one without keeps its name', existsSync(join(out, 'scan0001.pdf')) && existsSync(join(out, 'notes.txt')));
  check('in the folder it stands in', existsSync(join(out, 'Greek', NAGY)));
  check(
    'the picture is named by its reference too',
    existsSync(join(out, 'Greek', 'Lord 1960 - The Singer of Tales.png')),
  );
  const written = existsSync(join(out, 'references.bib'))
    ? readFileSync(join(out, 'references.bib'), 'utf8')
    : '';
  check(
    'the references.bib names the files where they are',
    written.includes(NAGY) && written.includes('Greek/Lord 1960 - The Singer of Tales.png'),
    written.split('\n').filter((l) => /file/.test(l)).join(' | '),
  );

  // ---- part 4: the folder as a clue, and the pane of a reference ----

  // A chapter in a folder named for its book: the folder says whose it is.
  await app.go('#/files');
  await app.waitFor('[data-file-list] [data-hash]', 5000);
  await app.clickText('[data-file-folders] .item.all', 'All files');
  await sleep(250);
  const onTop = await middleOf('.files-view .middle .body');
  await drop([bookFolder], onTop.x, onTop.y);
  const chapter = await until(
    'the chapter',
    async () => (await rows()).find((r) => r.name === 'chapter 3.pdf'),
    10000,
  );
  await app.rightClick(`[data-file-list] [data-hash="${chapter.hash}"]`);
  await app.waitFor('[role="menu"]', 3000);
  await sleep(250);
  await app.clickText('[role="menuitem"]', 'Go through it');
  await app.waitFor('dialog [data-going="deciding"]', 20000);
  const byFolder = await app
    .exec(
      `return document.querySelector(arguments[0] + ' [data-reasons]')?.textContent.replace(/\\s+/g, ' ').trim() ?? ''`,
      goingRow('chapter 3.pdf'),
    )
    .catch(() => '');
  const folderProposal = await app.text(`${goingRow('chapter 3.pdf')} .proposal`).catch(() => '');
  check(
    'the folder named for the book proposes the book, as probable',
    /probable/.test(byFolder) && /in a folder named like it/.test(byFolder) && /Achaeans/.test(folderProposal),
    `${byFolder} / ${folderProposal.replace(/\s+/g, ' ')}`,
  );
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog', 3000);

  // The pane of the book: the chapter added from the files of the library.
  await app.click(`[data-file-list] [data-hash="${nagyFresh.hash}"]`);
  await app.waitFor(`.file-pane[data-file="${nagyFresh.hash}"] [data-reference] a`, 5000);
  await app.click('.file-pane [data-reference] a');
  await app.waitFor('.pane [data-add-files]', 5000);
  const paneFiles = () => app.count('.pane .file');
  const had = await paneFiles();
  await app.click('.pane [data-add-files]');
  await app.waitFor('dialog [data-file-chooser]', 3000);
  await app.type('dialog .search input', 'chapter');
  await until('the chooser to find the chapter', () => app.exists('dialog [data-choose-file="chapter 3.pdf"]'));
  await app.click('dialog [data-choose-file="chapter 3.pdf"]');
  check(
    'the chooser says how many it adds',
    (await app.text('dialog [data-choose-add]')).trim() === 'Add one file',
    await app.text('dialog [data-choose-add]'),
  );
  await app.screenshot('files-5-add-files');
  await app.click('dialog [data-choose-add]');
  await app.waitGone('dialog', 3000);
  await until('the pane to have it', async () => (await paneFiles()) === had + 1, 5000).catch(() => {});
  check('the reference has the chapter now', (await paneFiles()) === had + 1, `${had} → ${await paneFiles()}`);

  // All taken from it at once, with one question that names the count.
  const all = had + 1;
  await app.click('.pane [data-unassign-all]');
  await app.waitFor('dialog[open]', 3000);
  const allAsked = await app.exec(`return document.querySelector('dialog[open]')?.textContent.replace(/\\s+/g, ' ') ?? ''`);
  check(
    'taking all asks once, with the count',
    new RegExp(`Remove all ${all} files from “The Best of the Achaeans[^”]*”\\?`).test(allAsked) &&
      new RegExp(`Remove ${all} files`).test(allAsked),
    allAsked,
  );
  await app.clickText('dialog footer button', `Remove ${all} files`);
  await app.waitGone('dialog', 3000);
  await until('the pane to be without files', async () => (await paneFiles()) === 0, 5000).catch(() => {});
  check('the reference has no files', (await paneFiles()) === 0, String(await paneFiles()));

  // Several from the disk are asked about first.
  const pane = await middleOf('.pane');
  await drop([scan0001, nagyByName], pane.x, pane.y);
  await app.waitFor('dialog[open]', 3000).catch(() => {});
  const attachAsked = await app.exec(`return document.querySelector('dialog[open]')?.textContent.replace(/\\s+/g, ' ') ?? ''`);
  check(
    'attaching several from the disk asks first, with the count',
    /Attach 2 files to “The Best of the Achaeans[^”]*”\?/.test(attachAsked) && /Attach 2 files/.test(attachAsked),
    attachAsked,
  );
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog', 3000);
  await sleep(300);
  check('and cancelled, attaches nothing', (await paneFiles()) === 0, String(await paneFiles()));

  // The files stay among the files of the library, unassigned.
  await app.go('#/files');
  await app.waitFor('[data-file-list] [data-hash]', 5000);
  await app.clickText('[data-file-folders] .item.all', 'All files');
  await sleep(300);
  const left = (await rows()).filter((r) => r.hash === chapter.hash || r.hash === nagyFresh.hash);
  check(
    'and the files stay, unassigned',
    left.length === 2 && left.every((r) => r.reference === 'No reference'),
    JSON.stringify(left),
  );

  // ---- the end ----
  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.slice(0, 3).join(' / '));
} catch (error) {
  console.error(error);
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'the script ran to its end', ok: false });
  await app.screenshot('files-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
