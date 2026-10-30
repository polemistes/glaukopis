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
import { App, outputDir, sleep } from './harness.mjs';

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
