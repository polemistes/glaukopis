// The files of the library (ADR 0043), through their view in the library's
// place, in parts, each going on from what the one before left:
//
// 1. a tree of folders and files dropped on it, taken in with its
//    structure; the folders, the list, the filters; a file given to a
//    reference through the pane and the chooser; and a reference deleted
//    while its file stays, unassigned;
// 2. the going-through: files given to their references, where the name
//    alone says whose a file is, and a scan with nothing to say is left
//    for later;
// 3. the export of all the files into a folder, under the names of their
//    references, with a references.bib beside them.

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
  await sleep(250); // the menu slides in: a click before it stands is caught by what is under it
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

  // Two files dropped at the top: the message after offers to go through them.
  await app.clickText('[data-library-switch] [role="radio"]', 'Files');
  await app.waitFor('[data-file-list] [data-hash]', 5000);
  await app.clickText('[data-file-folders] .item.all', 'All files');
  await sleep(250);
  const atTop = await middleOf('.files-view .middle .body');
  await drop([nagyByName, scan0001], atTop.x, atTop.y);
  const offer = await until(
    'the offer to go through them',
    async () => (await toasts()).find((t) => /Go through the 2 new files/.test(t)),
    8000,
  ).catch(() => '');
  check('the message after taking in offers the going-through', !!offer, offer);
  await app.clickText('.toaster .toast .action', 'Go through the 2 new files');
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
  await sleep(300);
  const byName = (await rows()).filter((r) => r.name === NAGY && /Nagy 1979/.test(r.reference));
  check('the file of that name is the work’s now', byName.length === 1, JSON.stringify(await rows()));
  const scanRow = (await rows()).find((r) => r.name === 'scan0001.pdf');
  check('the scan stays unassigned', scanRow?.reference === 'No reference', scanRow?.reference);

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
