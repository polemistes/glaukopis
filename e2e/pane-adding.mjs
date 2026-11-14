// The lists of the document pane are added to as the Library page is (record
// 0095): the references of the pane have two choices, Cited and All; the +
// opens the menu with New reference and the four of the page, and New
// reference opens the form, and a reference made there is shown among all,
// selected; a .bib file dropped on the list makes references, and the list
// shows All, with the search emptied and what came selected; an image dropped
// on the references is taken in, and the pane shows the images on All with it
// selected; a PDF dropped on the images makes a reference, and the pane shows
// the references. The native file pickers behind the menu's items cannot be
// driven, and are not pressed.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

// ---- what is on the desk: a .bib file of two works, an image, a PDF ----
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
writeFileSync(
  join(desk, 'Gifts.bib'),
  `@book{mauss1925,
  author = {Mauss, Marcel},
  title = {The Gift},
  publisher = {Cohen and West},
  year = {1925},
}

@book{malinowski1922,
  author = {Malinowski, Bronislaw},
  title = {Argonauts of the Western Pacific},
  publisher = {Routledge},
  year = {1922},
}
`,
);
// The picture of one dot of `contract.rs`, as files.mjs has it.
writeFileSync(
  join(desk, 'Dot.png'),
  Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0xf0,
    0x1f, 0x00, 0x05, 0x00, 0x01, 0xff, 0x89, 0x99, 0x3d, 0x1d, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
    0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]),
);
// A PDF that says nothing of a DOI or an ISBN, as sources.mjs makes one, so that nothing is looked up.
let pdf = true;
writeFileSync(
  join(desk, 'notes.typ'),
  `#set page(paper: "a5")
= Notes from the seminar
#lorem(60)
`,
);
try {
  execFileSync('typst', ['compile', join(desk, 'notes.typ'), join(desk, 'notes.pdf')], { stdio: 'pipe' });
} catch {
  pdf = false;
}

const app = await App.launch({ width: 1360, height: 900 });
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
  /** The tab the document pane shows. */
  const tab = () =>
    app.exec(
      `return document.querySelector('[data-document-pane] .side-tabs [aria-selected="true"]')?.dataset.kind ?? ''`,
    );
  const choices = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.panel [role="radio"]')).map((r) => r.textContent.trim()).join('|')`,
    );
  const chosen = () =>
    app.exec(
      `return document.querySelector('.panel [role="radio"][aria-checked="true"]')?.textContent.trim() ?? ''`,
    );
  /** The words of the rows selected, in the list of references or in that of images. */
  const selected = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.panel .item[aria-selected="true"], .panel .list .row[aria-selected="true"]')).map((r) => r.textContent.replace(/\\s+/g, ' ').trim())`,
    );
  const searched = () => app.exec(`return document.querySelector('.panel .search input')?.value ?? null`);
  /** Confirms what the import dialog shows. */
  const confirmImport = async () => {
    await app.exec(
      `Array.from(document.querySelectorAll('dialog[open] footer button')).filter((b) => !/Cancel/.test(b.textContent)).pop().click()`,
    );
    await app.waitGone('dialog[open]', 15000);
  };

  await app.keys(['Control', '1']);
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(300);

  // ---- the references: two choices, and one plus ----
  await app.documentPane('references');
  await app.waitFor('.panel[aria-label="References"]', 5000);
  check('the references have two choices, Cited and All', (await choices()) === 'Cited|All', await choices());
  check('and begin with those the project cites', (await chosen()) === 'Cited', await chosen());
  check(
    'there is one button beside them, and none that asks for a file',
    (await app.count('.panel .tools .row > button')) === 1 &&
      (await app.attr('.panel .tools .row > button', 'aria-label')) === 'Add references',
  );

  // ---- the menu of the plus ----
  await app.click('.panel button[aria-label="Add references"]');
  await app.waitFor('.menu');
  const shape = await app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"], .menu [role="separator"]')).map((e) => e.getAttribute('role') === 'separator' ? '—' : e.querySelector('.label').textContent.trim()).join('|')`,
  );
  check(
    'the plus opens the menu of the Library page: a new reference, a line, and the four ways of bringing references in',
    shape === 'New reference|—|Import Bib(La)TeX…|Import from Zotero…|Paste references…|Add PDF files…',
    shape,
  );
  await app.screenshot('pane-adding-1-menu');

  // ---- a new reference ----
  await app.clickText('.menu [role="menuitem"]', 'New reference');
  await app.waitFor('dialog .form');
  check('New reference opens the form', true);
  await app.type(`dialog [data-field="author"] input[aria-label="Author: family name"]`, 'Hubert');
  await app.type(`dialog [data-field="title"] :is(input, textarea)`, 'Sacrifice');
  await app.screenshot('pane-adding-2-new');
  await app.clickText('dialog footer button', 'Add reference');
  await app.waitGone('dialog', 8000);
  await until('what was made to be shown', async () => (await chosen()) === 'All' && (await selected()).length === 1);
  check(
    'a reference made there is shown among all, and selected',
    (await selected()).length === 1 && /Sacrifice/.test((await selected())[0]),
    (await selected()).join(' | '),
  );

  // ---- a .bib file dropped on the list ----
  await app.clickText('.panel [role="radio"]', 'Cited');
  await sleep(300);
  check('the project cites nothing yet, and Cited says so', /No references yet/.test(await app.text('.panel .body')));
  // Something is in the search, to be seen emptied when what was brought in is shown.
  await app.type('.panel .search input', 'zzz');
  await sleep(300);
  check('a search that finds nothing says so', /Nothing found/.test(await app.text('.panel .body')));
  const onReferences = await middleOf('.panel .body');
  await drop([join(desk, 'Gifts.bib')], onReferences.x, onReferences.y);
  await app.waitForText('dialog h2', 'Import references', 15000);
  await sleep(300);
  await app.screenshot('pane-adding-3-bib-plan');
  await confirmImport();
  await until('the two works to be shown', async () => (await selected()).length === 2, 10000);
  const made = (await selected()).join(' | ');
  check('a .bib file dropped on the list makes references of its works', /The Gift/.test(made) && /Argonauts/.test(made), made);
  check('the list shows All, with the search emptied, and what came is selected', (await chosen()) === 'All' && (await searched()) === '', `${await chosen()} / ${await searched()}`);
  check('the pane is still at the references', (await tab()) === 'references', await tab());
  await app.screenshot('pane-adding-4-bib');

  // ---- an image dropped on the references ----
  await app.clickText('.panel [role="radio"]', 'Cited');
  await sleep(200);
  const again = await middleOf('.panel .body');
  await drop([join(desk, 'Dot.png')], again.x, again.y);
  await until('the pane to show the images', async () => (await tab()) === 'images', 10000);
  await app.waitFor('.panel[aria-label="Images"]', 5000);
  await until('the image to be selected', async () => (await selected()).length === 1, 10000);
  check('an image dropped on the references is taken in, and the pane shows the images', (await tab()) === 'images');
  check('on All, with the image selected', (await chosen()) === 'All' && /Dot\.png/.test((await selected())[0] ?? ''), `${await chosen()} / ${(await selected()).join(' | ')}`);
  check('and the images have two choices, Used and All', (await choices()) === 'Used|All', await choices());
  await app.screenshot('pane-adding-5-image');

  // ---- a PDF dropped on the images ----
  if (!pdf) {
    passOver('a PDF dropped on the images', 'Typst is not installed, so none could be made');
  } else {
    await app.clickText('.panel [role="radio"]', 'Used');
    await sleep(200);
    const onImages = await middleOf('.panel .body');
    await drop([join(desk, 'notes.pdf')], onImages.x, onImages.y);
    await app.waitFor('dialog .what', 90000);
    await sleep(300);
    await app.screenshot('pane-adding-6-pdf-plan');
    await confirmImport();
    await until('the pane to show the references', async () => (await tab()) === 'references', 15000);
    await until('the reference to be selected', async () => (await selected()).length === 1, 10000);
    check('a PDF dropped on the images makes a reference, and the pane shows the references', (await tab()) === 'references');
    check('on All, with the reference selected', (await chosen()) === 'All' && /notes/i.test((await selected())[0] ?? ''), `${await chosen()} / ${(await selected()).join(' | ')}`);
    await app.screenshot('pane-adding-7-pdf');
  }

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('pane-adding-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
