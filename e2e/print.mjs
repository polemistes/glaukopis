// Printing (record 0075), tried through the interface: the typesetting
// pane's Print…, Ctrl+P, and a file's Print….
//
// The system's own print dialog cannot be pressed by WebDriver, and is not
// tried here. The pages are printed instead to a PDF file through GTK's
// file printer, with no dialog (`window.__glaukopisPrint`,
// `window.__glaukopisViewer.printToFile`), by the same way the dialog prints,
// and the file is read with poppler's tools. GTK names that printer by the
// locale: the application runs with LC_ALL=C.

import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { App, outputDir, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** What a poppler tool says of a file, in English. */
function poppler(tool, ...args) {
  return execFileSync(tool, args, { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' } });
}

/** The pages and their size, by pdfinfo. */
function infoOf(file) {
  const info = poppler('pdfinfo', file);
  const pages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1] ?? 0);
  const size = /^Page size:\s+([\d.]+) x ([\d.]+) pts/m.exec(info);
  return { pages, width: Number(size?.[1] ?? 0), height: Number(size?.[2] ?? 0) };
}

/** How many pictures the file has, by pdfimages: the rows under its two lines of heading. */
function picturesIn(file) {
  return poppler('pdfimages', '-list', file)
    .split('\n')
    .slice(2)
    .filter((l) => /^\s*\d+\s+\d+\s+image\b/.test(l)).length;
}

/** The resolution of each picture the file has, by pdfimages: its x-ppi. */
function resolutionsIn(file) {
  return poppler('pdfimages', '-list', file)
    .split('\n')
    .slice(2)
    .map((l) => l.trim().split(/\s+/))
    .filter((cells) => cells[2] === 'image')
    .map((cells) => Number(cells[12]));
}

/** How many fonts the file has, by pdffonts. */
function fontsIn(file) {
  return poppler('pdffonts', file).split('\n').slice(2).filter((l) => l.trim()).length;
}

/** Waits until a file is written and its size has stood still. */
async function written(file, ms = 20000) {
  let last = -1;
  for (const until = Date.now() + ms; Date.now() < until; ) {
    if (existsSync(file)) {
      const size = statSync(file).size;
      if (size > 0 && size === last) return true;
      last = size;
    }
    await sleep(300);
  }
  return false;
}

const near = (a, b) => Math.abs(a - b) <= 1;

const PARAGRAPH =
  'The wrath of the hero is the first word of the poem, and the whole of it turns on that word. ' +
  'Whoever reads it reads of a quarrel, of the ships drawn up on the shore, of the plague and the ' +
  'prayers, and of the long days in which the hero sits by his ships and will not fight. ';

const app = await App.launch({ width: 1500, height: 920, env: { LC_ALL: 'C' } });
try {
  await app.installErrorHook();

  // ---- a document of a few pages, printed from the typesetting pane ----
  await app.beginProject();
  await app.type('dialog input', 'Printed matter');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.click('.text-view .section .body');
  await sleep(300);
  for (let i = 0; i < 14; i++) {
    await app.keys(PARAGRAPH.repeat(2));
    await app.press('Enter');
  }
  await app.typeset();
  await app.waitFor('.preview .page', 20000);
  const counted = () =>
    app.exec(`return Number(document.querySelector('.preview .pages')?.dataset.count ?? 0)`);
  for (const until = Date.now() + 20000; Date.now() < until && (await counted()) < 2; ) await sleep(300);
  await sleep(1500);
  const count = await counted();
  check('the document has more than one page', count >= 2, `${count}`);

  const button = await app.exec(
    `const b = document.querySelector('.preview [data-print]');
     return b && { words: b.textContent.trim(), disabled: b.disabled };`,
  );
  check(
    'the typesetting pane has Print… in its head, before Export',
    button?.words === 'Print…' && !button.disabled &&
      (await app.exec(
        `const b = document.querySelector('.preview [data-print]');
         return !!b.nextElementSibling && b.nextElementSibling.textContent.includes('Export');`,
      )),
    JSON.stringify(button),
  );
  await app.screenshot('print-1-pane');

  const pdf = join(outputDir, 'print-document.pdf');
  rmSync(pdf, { force: true });
  const printed = await app.execAsync(
    'return await window.__glaukopisPrint.toFile(arguments[0]);',
    pdf,
  );
  check('the document is printed', !!printed && (await written(pdf)), JSON.stringify(printed));
  if (printed && existsSync(pdf)) {
    const info = infoOf(pdf);
    check(
      'every page is printed, and no more',
      info.pages === count && printed.count === count,
      `${info.pages} printed of ${count}`,
    );
    check(
      "on paper of the document's page, A4",
      near(info.width, printed.width) && near(info.height, printed.height) && near(info.width, 595.28),
      `${info.width} x ${info.height}`,
    );
    const pictures = picturesIn(pdf);
    check('the pages are printed as drawings, not as pictures', pictures === 0, `${pictures} pictures`);
    const fonts = fontsIn(pdf);
    check('the letters are drawn, and need no fonts', fonts === 0, `${fonts} fonts`);
  }
  check('the pages leave the page when they are printed', !(await app.exists('#print-pages')));

  // ---- the keys: Ctrl+T the typesetting pane, Ctrl+P printing ----
  await app.click('.text-view .section .body');
  await sleep(200);
  await app.keys(['Control', 't']);
  const closed = await app.waitGone('.preview', 5000).then(() => true, () => false);
  check('Ctrl+T closes the typesetting pane', closed);
  await app.keys(['Control', 't']);
  const opened = await app.waitFor('.preview', 5000).then(() => true, () => false);
  check('and opens it again', opened);
  await app.keys(['Control', 't']);
  await app.waitGone('.preview', 5000).catch(() => {});

  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await sleep(200);
  await app.keys('print');
  await sleep(200);
  const found = await app.exec(
    `const li = document.querySelector('dialog[open] li.active');
     return li && li.querySelector('.label')?.textContent.trim() + ' ' + (li.querySelector('kbd')?.textContent.trim() ?? '');`,
  );
  check('the palette finds Print, with Ctrl+P', found === 'Print Ctrl+P', found);
  await app.press('Escape');
  await app.waitGone('dialog[open]');
  await app.keys(['Control', '/']);
  await app.waitForText('dialog[open] h2', 'Keys', 3000);
  await sleep(300);
  const rows = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] dt')).map((dt) => dt.textContent.trim() + ' ' + Array.from(dt.nextElementSibling.querySelectorAll('kbd')).map((k) => k.textContent.trim()).join(' '))`,
  );
  check(
    'the sheet of the keys has Print as Ctrl+P and Typesetting as Ctrl+T',
    rows.includes('Print Ctrl+P') && rows.includes('Typesetting Ctrl+T'),
    rows.filter((r) => /^(Print|Typesetting) /.test(r)).join(' | '),
  );
  await app.press('Escape');
  await app.waitGone('dialog[open]');

  // Ctrl+P with the pane closed: the pane opens, the pages are made, and the
  // system's dialog opens over the window. It is seen on the private display
  // and closed with Escape, which prints nothing.
  await app.click('.text-view .section .body');
  await sleep(200);
  await app.keys(['Control', 'p']);
  const paned = await app.waitFor('.preview .page', 20000).then(() => true, () => false);
  check('Ctrl+P opens the typesetting pane where it is closed', paned);
  const onTheDisplay = { env: { ...process.env, DISPLAY: app.display }, encoding: 'utf8', timeout: 20000 };
  let dialog = '';
  try {
    dialog = execFileSync('xdotool', ['search', '--sync', '--onlyvisible', '--name', '^Print$'], onTheDisplay)
      .trim()
      .split('\n')[0];
  } catch {
    // Not there in time.
  }
  check("and the system's print dialog opens", !!dialog);
  if (dialog) {
    await sleep(1500);
    execFileSync('import', ['-display', app.display, '-window', 'root', join(outputDir, 'print-2-dialog.png')], onTheDisplay);
    // GTK takes no key sent to a window; the dialog is given the focus, and the key pressed on the display.
    execFileSync('xdotool', ['windowfocus', '--sync', dialog, 'key', 'Escape'], onTheDisplay);
    const gone = await app.waitGone('#print-pages', 10000).then(() => true, () => false);
    check('closed without printing, the pages leave the page', gone);
  }

  // ---- a file in a view: a PDF by a range of its pages, an image as it is ----
  const invoke = (command, args) =>
    app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
  const taken = await invoke('files_take_in', {
    paths: [join(root, 'e2e/fixtures/structure.pdf'), join(root, 'resources/brand/owl.png')],
    folder: null,
    structure: true,
    ticket: null,
  });
  const pdfHash = taken.files.find((f) => f.name.endsWith('.pdf'))?.hash;
  const owlHash = taken.files.find((f) => f.name.endsWith('.png'))?.hash;
  await app.execAsync('window.__glaukopisViewer.show(arguments[0]);', pdfHash);
  await app.waitFor('[data-file-side] [data-viewer-print]', 20000);
  check(
    'the bar of a file has Print…',
    (await app.exec(`return document.querySelector('[data-file-side] [data-viewer-print]').getAttribute('aria-label')`)) ===
      'Print…',
  );
  await app.click('[data-file-side] [data-viewer-print]');
  await app.waitForText('dialog[open] h2', 'Pages to print', 3000);
  await sleep(300);
  const range = await app.exec(
    `const all = document.querySelector('dialog[open] [data-print-all]');
     return { all: all.checked, words: all.parentElement.textContent.trim(), to: document.querySelector('dialog[open] [data-print-to]').value };`,
  );
  check(
    'it asks which pages first, all of them chosen',
    range.all && range.words === 'All 2 pages' && range.to === '2',
    JSON.stringify(range),
  );
  await app.screenshot('print-3-range');
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000);

  const filePdf = join(outputDir, 'print-file.pdf');
  rmSync(filePdf, { force: true });
  const filePrinted = await app.execAsync(
    'return await window.__glaukopisFilePrint.toFile(arguments[0], 1, 2);',
    filePdf,
  );
  check('the pages of the PDF are drawn and printed', !!filePrinted && (await written(filePdf)), JSON.stringify(filePrinted));
  if (filePrinted && existsSync(filePdf)) {
    const info = infoOf(filePdf);
    check('both pages, on paper of their size, A5', info.pages === 2 && near(info.width, 419.53) && near(info.height, 595.28), JSON.stringify(info));
    const dpi = resolutionsIn(filePdf);
    check(
      'each a picture drawn at the resolution print wants',
      dpi.length === 2 && dpi.every((d) => d >= 290 && d <= 310),
      dpi.join(', '),
    );
  }
  check('the pages leave the page when they are printed', !(await app.exists('#print-pages')));

  // Ctrl+P while the file has the focus asks the pages of the file, not of the document beside it.
  await app.click('[data-viewer-pages]');
  await sleep(300);
  await app.keys(['Control', 'p']);
  const asked = await app.waitForText('dialog[open] h2', 'Pages to print', 3000).then(() => true, () => false);
  check('Ctrl+P on a file asks which of its pages to print', asked);
  if (asked) {
    await app.press('Escape');
    await app.waitGone('dialog[open]', 3000);
  }

  await app.execAsync('window.__glaukopisViewer.show(arguments[0]);', owlHash);
  await app.waitFor('[data-file-side] .bar', 10000);
  await sleep(1500);
  const imagePdf = join(outputDir, 'print-image.pdf');
  rmSync(imagePdf, { force: true });
  const imagePrinted = await app.execAsync(
    'return await window.__glaukopisFilePrint.toFile(arguments[0], 1, 1);',
    imagePdf,
  );
  check('an image is printed', !!imagePrinted && (await written(imagePdf)), JSON.stringify(imagePrinted));
  if (imagePrinted && existsSync(imagePdf)) {
    const info = infoOf(imagePdf);
    const a4 = near(info.width, 595.28) && near(info.height, 841.89);
    const letter = near(info.width, 612) && near(info.height, 792);
    check("as one page, on the system's paper", info.pages === 1 && (a4 || letter), JSON.stringify(info));
    const dpi = resolutionsIn(imagePdf);
    check('at its own size, taken as 300 dots per inch', dpi.length === 1 && dpi[0] >= 290 && dpi[0] <= 310, dpi.join(', '));
  }

  // ---- from the files of the library: the menu of a file, and the file read there ----
  await app.go('#/files');
  await app.waitFor(`[data-file-list] [data-hash="${pdfHash}"]`, 10000);
  await app.rightClick(`[data-file-list] [data-hash="${pdfHash}"]`);
  await app.waitFor('[role="menu"]', 3000);
  await sleep(250);
  const fileMenu = await app.exec(`return Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"]')).map((m) => m.textContent.trim())`);
  check('the menu of a PDF among the files has Print…', fileMenu.includes('Print…'), fileMenu.join(' | '));
  await app.clickText('[role="menuitem"]', 'Print…');
  const askedInLibrary = await app.waitForText('dialog[open] h2', 'Pages to print', 5000).then(() => true, () => false);
  check('which asks its pages, as a file in a view does', askedInLibrary);
  if (askedInLibrary) {
    await app.press('Escape');
    await app.waitGone('dialog[open]', 3000);
  }
  await app.click(`[data-file-list] [data-hash="${owlHash}"]`);
  await app.waitFor(`.file-pane[data-file="${owlHash}"] [data-action="print"]`, 5000);
  check('the pane of an image has Print…', await app.exists(`.file-pane[data-file="${owlHash}"] [data-action="print"]`));
  await app.click(`.file-pane[data-file="${owlHash}"] [data-action="read-file"]`);
  await app.waitFor('[data-reader] [data-viewer-print]', 10000);
  await sleep(1000);
  const readPdf = join(outputDir, 'print-read.pdf');
  rmSync(readPdf, { force: true });
  const readPrinted = await app.execAsync(
    'return await window.__glaukopisFilePrint.toFile(arguments[0], 1, 1);',
    readPdf,
  );
  check('a file read in the library prints from its bar', !!readPrinted && (await written(readPdf)) && infoOf(readPdf).pages === 1, JSON.stringify(readPrinted));
  await app.press('Escape');
  await sleep(300);

  // ---- the end ----
  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.slice(0, 3).join(' / '));
} catch (error) {
  console.error(error);
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'the script ran to its end', ok: false });
  await app.screenshot('print-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
