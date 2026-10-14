// The files of the library (ADR 0043), through their view in the library's
// place: a tree of folders and files dropped on it, taken in with its
// structure; the folders, the list, the filters; a file given to a
// reference through the pane and the chooser; and a reference deleted
// while its file stays, unassigned.
//
// Written in parts, each going on from what the one before left: more are
// added after the first.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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
  /** Chooses in the menu of the filters. */
  const filter = async (label) => {
    await app.click('[data-files-filter]');
    await app.waitFor('[role="menu"]', 3000);
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

  // The message of the import was shown in its dialog, and went with it: the
  // messages are seen again only once that one is over, which is a fault of
  // the messages and not of the files.
  await sleep(5000);
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

  // The folders: Homer has the PDF; Greek has it and the plate, with the folders under it.
  await app.clickText('[data-file-folders] [data-folder] .name', 'Homer');
  await sleep(250);
  const inHomer = await rows();
  check('Homer holds the PDF', inHomer.length === 1 && inHomer[0].name === NAGY, inHomer.map((r) => r.name).join(', '));
  await app.clickText('[data-file-folders] [data-folder] .name', 'Greek');
  await sleep(250);
  check('Greek holds two with Homer under it', (await rows()).length === 2);
  await filter('With the folders under it');
  check('and one without', (await rows()).length === 1);
  await filter('With the folders under it');
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

  // The PDF is given to its reference, through the pane and the chooser.
  const pdf = listed.find((r) => r.kind === 'pdf');
  await app.click(`[data-file-list] [data-hash="${pdf.hash}"]`);
  await app.waitFor(`.file-pane[data-file="${pdf.hash}"]`, 5000);
  check(
    'the route names the file',
    (await app.exec('return location.hash')).includes(`file=${pdf.hash}`),
  );
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
  await app.clickText('[role="menuitem"]', 'Delete');
  await app.waitForText('dialog footer button', 'Delete, keep the files', 3000);
  const asked = await app.text('dialog');
  check(
    'deleting asks about the file',
    /One file belongs to what is deleted/.test(asked) &&
      (await app.exists('dialog footer button')) &&
      /Delete with the files/.test(asked),
    asked.replace(/\s+/g, ' '),
  );
  await app.screenshot('files-3-delete-reference');
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

  // The picture is taken into the pictures, and stays among the files.
  const plate = (await rows()).find((r) => r.kind === 'picture');
  await app.click(`[data-file-list] [data-hash="${plate.hash}"]`);
  await app.waitFor(`.file-pane[data-file="${plate.hash}"] [data-action="to-pictures"]`, 5000);
  await app.click('.file-pane [data-action="to-pictures"]');
  const among = await until(
    'the message of the picture',
    async () => (await toasts()).find((t) => /is among the pictures now/.test(t)),
    5000,
  ).catch(() => '');
  check('a picture of the files is taken into the pictures', !!among, among);
  check('with a way to it', /Show/.test(among));

  // A picture of the store attached to a reference is a file of that reference: the same file.
  await app.go('#/pictures');
  await app.waitFor('.tile', 5000);
  await app.click('.tile');
  await app.waitFor('[data-attach-picture]', 5000);
  await app.click('[data-attach-picture]');
  await app.waitFor('dialog [data-chooser]', 3000);
  await app.type('dialog .search input', 'Singer of Tales');
  await until('the chooser to find the work', async () =>
    (await app.count('dialog [data-chooser] [role="option"]')) === 1,
  );
  await app.press('Enter');
  await app.waitGone('dialog', 3000);
  const attached = await until(
    'the message of the attachment',
    async () => (await toasts()).find((t) => /among the files of/.test(t)),
    5000,
  ).catch(() => '');
  check('a picture is attached to a reference', /Lord 1960/.test(attached), attached);
  await app.go('#/files');
  await until('the files', async () => (await rows()).length === 3);
  const given = (await rows()).find((r) => r.hash === plate.hash);
  check('and is the same file of the library, now the reference’s', /Lord 1960/.test(given?.reference ?? ''), given?.reference);

  // A folder deleted: what was in it moves up.
  await app.rightClick(await app.findByText('[data-file-folders] [data-folder]', 'Homer'));
  await app.waitFor('[role="menu"]', 3000);
  await app.clickText('[role="menuitem"]', 'Delete folder');
  await app.waitForText('dialog', 'move up to where it was', 3000);
  await app.clickText('dialog footer button', 'Delete folder');
  await app.waitGone('dialog', 3000);
  await until('the folder to go', async () => (await folders()).length === 1);
  await sleep(300);
  await app.clickText('[data-file-folders] [data-folder] .name', 'Greek');
  await until('Greek in view', async () =>
    (await app.exec('return location.hash')).includes('folder='),
  );
  await sleep(250);
  await filter('With the folders under it');
  const inGreek = await rows();
  check(
    'and its file stands where the folder was',
    inGreek.length === 2 && inGreek.some((r) => r.hash === pdf.hash),
    inGreek.map((r) => r.name).join(', '),
  );
  await filter('With the folders under it');

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
