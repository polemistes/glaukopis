// Finding in the notebook, and starting texts (stage 4 of the notebook): a
// file dropped on the page is a note not looked at, with its dot, while a
// note written is looked at; Filter beside the field, with Not looked at,
// shows it alone and the button counts one filter on; chosen, it is looked
// at, its dot gone, and it stays in the list until the filters change; the
// filters of what a note holds (an image, a file, both: nothing passes, and
// the list offers to clear them) and of where it came from (a file; a file or
// no source), with the count on the button, a day to come letting nothing
// through, and Clear; the arrow beside New note offering only Starting texts…
// while there are none; a starting text made in their window, named, its
// lines written and made points of a list; the menu then offering it, and a
// note begun from it holding its lines as points, the cursor at the end of
// the first, and looked at; Read the text in the menu of a note with an
// image: where Tesseract is not installed, the message says so, from the
// menu and from the window of the image's source; where it is, with English
// and Typst to draw a sign, the words of the sign read, found by the field,
// and shown in the window of its source under Text read, with Read again; no
// errors in the page. Screenshots in e2e/output/notebook-finding-<n>-<what>.png.

import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** Waits, at most `ms`, until `probe` gives what `ok` takes; gives the last it gave. */
async function until(probe, ok, ms = 6000) {
  const end = Date.now() + ms;
  let got = await probe();
  while (!ok(got) && Date.now() < end) {
    await sleep(150);
    got = await probe();
  }
  return got;
}

/** What a program says when asked, or null where it is not installed; as ocr.mjs asks. */
function installed(program, args) {
  try {
    return execFileSync(program, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
}

const langs = installed('tesseract', ['--list-langs']);
const tesseract = !!langs;
const canRead = tesseract && /^eng$/m.test(langs) && !!installed('typst', ['--version']);
console.log(
  tesseract
    ? canRead
      ? 'Tesseract with English and Typst are installed: a sign is drawn and read.'
      : 'Tesseract is installed, but not English or Typst: Read the text is only offered.'
    : 'Tesseract is not installed: the message that says so is looked for.',
);

// ---- what is on the desk: an image, a PDF, and a sign where it can be drawn ----
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-finding-'));
// The picture of one dot of `contract.rs`, as notebook.mjs has it.
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
copyFileSync(join(root, 'e2e', 'fixtures', 'shape.pdf'), join(desk, 'Shape.pdf'));
if (canRead) {
  writeFileSync(
    join(desk, 'sign.typ'),
    '#set page(width: 140mm, height: 50mm, margin: 10mm)\n#set text(size: 30pt)\nKerameikos cemetery\n',
  );
  execFileSync('typst', ['compile', 'sign.typ', 'Sign.png', '--ppi', '200'], { cwd: desk });
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-notebook-finding-'));

// ---- what the script reads of the page ----
const ROWS = '[data-notes] [role="option"]';
/** The titles of the rows of the list, as they stand. */
const titles = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${ROWS} .title')).map((t) => t.textContent.trim())`,
  );
/** The titles of the rows that have the dot of a note not looked at. */
const unseen = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${ROWS}[data-unseen]')).map((r) => r.querySelector('.title').textContent.trim())`,
  );
/** How many filters the button says are on: 0 where it shows no count. */
const filterCount = (app) =>
  app.exec(`return Number(document.querySelector('[data-filter-count]')?.textContent.trim() ?? 0)`);
/** The paragraphs of the text of the note shown: their kind and their words. */
const noteParagraphs = (app) =>
  app.exec(
    // The words alone, without what the editor draws into a paragraph: the name on the bracket of a run of points.
    `return Array.from(document.querySelectorAll('[data-note-text] .ProseMirror > p')).map((p) => {
       const words = p.cloneNode(true);
       words.querySelectorAll('.ProseMirror-widget, [contenteditable="false"]').forEach((e) => e.remove());
       return [p.getAttribute('data-kind') ?? 'text', words.textContent];
     })`,
  );
/** Chooses the note whose row says these words. */
async function chooseNote(app, words) {
  await app.clickText(ROWS, words);
  await app.waitUntil(
    `return Array.from(document.querySelectorAll('${ROWS}[aria-selected="true"] .title')).some((t) => t.textContent.includes(${JSON.stringify(words)}))`,
    3000,
    `the note ${words} chosen`,
  );
  await sleep(300);
}
/** The items of the menu open now. */
async function menuItems(app) {
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  return app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.textContent.trim())`,
  );
}
/** Opens the window of the filters, where it is not open. */
async function openFilters(app) {
  if (!(await app.exists('[data-notebook-filters]'))) await app.click('[data-notebook-filter]');
  await app.waitFor('[data-notebook-filters]', 3000);
  await sleep(200);
}
/** Ticks or unticks a box in the window of the filters. */
async function tick(app, selector) {
  await openFilters(app);
  await app.click(`[data-notebook-filters] ${selector}`);
  await sleep(300);
}
/** Closes the window of the filters by Done. */
async function filtersDone(app) {
  await app.clickText('[data-notebook-filters] footer button', 'Done');
  await app.waitGone('[data-notebook-filters]', 3000).catch(() => {});
  await sleep(200);
}
/** Files dropped on an element of the page, as Tauri tells the page of a drop. */
async function drop(app, paths, selector) {
  const { x, y } = await app.exec(
    `const r = document.querySelector(arguments[0]).getBoundingClientRect();
     return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
    selector,
  );
  await app.execAsync(
    `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
     const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
     await emit('tauri://drag-enter', { paths: arguments[0], position });
     await emit('tauri://drag-over', { position });
     await emit('tauri://drag-drop', { paths: arguments[0], position });`,
    paths,
    x,
    y,
  );
}

let app = await App.launch({ dataDir, keepData: true, width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.keys(['Control', '3']);
  await app.waitFor('[data-notebook-empty]', 8000);

  // A note written is looked at from the start.
  await app.clickText('[data-notebook-empty] button', 'New note');
  await app.waitUntil(`return !!document.activeElement?.closest?.('[data-note-text]')`, 3000, 'the cursor in the new note');
  await app.keys('Athena keeps an owl.');
  await sleep(400);
  await until(() => titles(app), (t) => t.length === 1);
  check('a note written is looked at: it has no dot', (await unseen(app)).length === 0, JSON.stringify(await unseen(app)));

  // A file dropped is a note not looked at, with its dot.
  await drop(app, [join(desk, 'Dot.png')], '[data-notebook]');
  let rows = await until(() => titles(app), (t) => t.length === 2, 8000);
  check('a file dropped is a note', rows.includes('Dot.png'), rows.join(' | '));
  let dotted = await unseen(app);
  check('and is not looked at: it has its dot, the note written has none', dotted.length === 1 && dotted[0] === 'Dot.png', dotted.join(' | '));
  check(
    'chosen by the page for having been taken in, it is shown and still not looked at',
    (await app.exists('[data-note-editor]')) && (await unseen(app)).includes('Dot.png'),
  );
  await app.screenshot('notebook-finding-1-unseen');

  // Not looked at, in the window of the filters: it alone, and the button counts one.
  await tick(app, '[data-unseen]');
  rows = await until(() => titles(app), (t) => t.length === 1);
  check('Not looked at shows the note not looked at alone', rows.length === 1 && rows[0] === 'Dot.png', rows.join(' | '));
  check('the button counts one filter on', (await filterCount(app)) === 1, String(await filterCount(app)));
  await app.screenshot('notebook-finding-2-not-looked-at');
  await filtersDone(app);

  // Chosen, it is looked at; it stays in the list until the filters change.
  await chooseNote(app, 'Dot.png');
  dotted = await until(() => unseen(app), (d) => d.length === 0);
  check('chosen, the note is looked at: its dot is gone', dotted.length === 0, dotted.join(' | '));
  check('and it stays in the list while the filters are as they were', (await titles(app)).includes('Dot.png'), (await titles(app)).join(' | '));
  await tick(app, '[data-unseen]');
  rows = await until(() => titles(app), (t) => t.length === 2);
  check('the filter let go, all notes are shown, the button counts none', rows.length === 2 && (await filterCount(app)) === 0, `${rows.join(' | ')} / ${await filterCount(app)}`);
  await tick(app, '[data-unseen]');
  rows = await until(() => titles(app), (t) => t.length === 0);
  check('Not looked at again: nothing is left that was not looked at', rows.length === 0, rows.join(' | '));
  check('the list says nothing passes, and offers to clear the filters', await app.exists('[data-filters-clear]'));
  await filtersDone(app);
  await app.click('[data-filters-clear]');
  rows = await until(() => titles(app), (t) => t.length === 2);
  check('Clear the filters in the empty list shows all again', rows.length === 2 && (await filterCount(app)) === 0, rows.join(' | '));

  // A PDF dropped too; what a note holds, and where it came from.
  await drop(app, [join(desk, 'Shape.pdf')], '[data-notebook]');
  rows = await until(() => titles(app), (t) => t.length === 3, 8000);
  check('a PDF dropped is a note too', rows.includes('Shape.pdf'), rows.join(' | '));
  await tick(app, '[data-holds="pictures"]');
  rows = await until(() => titles(app), (t) => t.length === 1);
  check('Holds an image: the note of the image alone', rows.length === 1 && rows[0] === 'Dot.png', rows.join(' | '));
  await tick(app, '[data-holds="files"]');
  rows = await until(() => titles(app), (t) => t.length === 0);
  check('an image and a file: no note holds both, nothing passes', rows.length === 0, rows.join(' | '));
  check('what a note holds counts as one filter', (await filterCount(app)) === 1, String(await filterCount(app)));
  await app.screenshot('notebook-finding-3-nothing-passes');
  await tick(app, '[data-holds="pictures"]');
  rows = await until(() => titles(app), (t) => t.length === 1);
  check('Holds a file: the note of the PDF alone', rows.length === 1 && rows[0] === 'Shape.pdf', rows.join(' | '));
  await tick(app, '[data-holds="files"]');

  await tick(app, '[data-came="file"]');
  rows = await until(() => titles(app), (t) => t.length === 2);
  check('From a file: the two notes of the files dropped', rows.length === 2 && rows.includes('Dot.png') && rows.includes('Shape.pdf'), rows.join(' | '));
  await tick(app, '[data-came="none"]');
  rows = await until(() => titles(app), (t) => t.length === 3);
  check('a file, or no source: the note written as well', rows.length === 3, rows.join(' | '));
  await app.click('[data-notebook-filters] [data-day="from"]');
  await app.keys('2999');
  await app.press('Tab');
  rows = await until(() => titles(app), (t) => t.length === 0);
  check('collected from a day to come: nothing passes', rows.length === 0, rows.join(' | '));
  check('where it came from and the days are two filters', (await filterCount(app)) === 2, String(await filterCount(app)));
  await app.screenshot('notebook-finding-4-filters');
  await app.click('[data-notebook-filters] [data-action="clear"]');
  rows = await until(() => titles(app), (t) => t.length === 3);
  check('Clear in the window takes all the filters away', rows.length === 3 && (await filterCount(app)) === 0, `${rows.join(' | ')} / ${await filterCount(app)}`);
  check(
    'and its boxes are no longer ticked, its days empty',
    await app.exec(
      `const w = document.querySelector('[data-notebook-filters]'); return !Array.from(w.querySelectorAll('input[type="checkbox"]')).some((c) => c.checked) && w.querySelector('[data-day="from"]').value === ''`,
    ),
  );
  await filtersDone(app);

  // Starting texts: while there are none, the menu of the arrow holds only Starting texts….
  await app.click('[data-new-note-from]');
  let items = await menuItems(app);
  check('with no starting text, the arrow beside New note offers only Starting texts…', items.length === 1 && items[0].startsWith('Starting texts'), items.join(' | '));
  await app.clickText('.menu [role="menuitem"]', 'Starting texts');
  await app.waitFor('[data-starts-dialog]', 3000);
  await app.click('[data-starts-dialog] [data-start-new]');
  await app.waitUntil(`return document.activeElement?.matches?.('[data-start-name]')`, 3000, 'the name of the new starting text to have the cursor');
  await app.keys('Plan');
  await app.press('Enter');
  await sleep(200);
  check('Enter in the name keeps the window open', await app.exists('[data-starts-dialog]'));
  await app.click('[data-starts-dialog] [data-start-lines]');
  await app.keys('Ask');
  await app.press('Enter');
  await app.keys('Read');
  await app.press('Enter');
  await app.keys('Write');
  await app.exec(
    `const s = document.querySelector('[data-starts-dialog] [data-start-kind]'); s.value = 'item'; s.dispatchEvent(new Event('change', { bubbles: true })); return null;`,
  );
  await sleep(300);
  const listed = await app.exec(
    `return Array.from(document.querySelectorAll('[data-starts-dialog] [data-start]')).map((r) => r.textContent.trim())`,
  );
  check('the starting text made stands in the list by its name', listed.length === 1 && listed[0] === 'Plan', listed.join(' | '));
  await app.screenshot('notebook-finding-5-starting-text');
  await app.clickText('dialog[open] footer button', 'Close');
  await app.waitGone('[data-starts-dialog]', 3000).catch(() => {});
  await sleep(200);

  // A note begun from it: its lines as points of a list, the cursor at the end of the first.
  await app.click('[data-new-note-from]');
  items = await menuItems(app);
  check('the menu offers the starting text, then Starting texts…', items.length === 2 && items[0] === 'Plan' && items[1].startsWith('Starting texts'), items.join(' | '));
  await app.clickText('.menu [role="menuitem"]', 'Plan');
  await app.waitUntil(`return !!document.activeElement?.closest?.('[data-note-text]')`, 3000, 'the cursor in the note begun');
  const paragraphs = await until(() => noteParagraphs(app), (p) => p.length === 3);
  check(
    'a note begun from it holds its lines, each a point of a list',
    JSON.stringify(paragraphs) === JSON.stringify([['item', 'Ask'], ['item', 'Read'], ['item', 'Write']]),
    JSON.stringify(paragraphs),
  );
  await sleep(300);
  await app.keys(' questions');
  const first = await until(() => noteParagraphs(app), (p) => p[0]?.[1] === 'Ask questions');
  check('the cursor is at the end of its first line', first[0]?.[1] === 'Ask questions', JSON.stringify(first));
  rows = await until(() => titles(app), (t) => t.length === 4);
  check('the note begun is looked at: it has no dot', !(await unseen(app)).some((t) => t.startsWith('Ask')), (await unseen(app)).join(' | '));
  await app.screenshot('notebook-finding-6-begun');

  // Read the text, from the menu of a note with an image.
  if (canRead) {
    await drop(app, [join(desk, 'Sign.png')], '[data-notebook]');
    await until(() => titles(app), (t) => t.includes('Sign.png'), 8000);
    await app.rightClick(await app.findByText(ROWS, 'Sign.png'));
    items = await menuItems(app);
    check('the menu of a note with an image offers Read the text', items.some((m) => m.startsWith('Read the text')), items.join(' | '));
    await app.clickText('.menu [role="menuitem"]', 'Read the text');
    const said = await app.waitForText('.toaster .toast', 'is read', 90000).then(() => true).catch(() => false);
    check('the text of the image is read, and said', said);
    await app.click('[data-notebook-search]');
    await app.keys('kerameikos');
    rows = await until(() => titles(app), (t) => t.length === 1);
    check('the field finds the note by the words read in its image', rows.length === 1 && rows[0] === 'Sign.png', rows.join(' | '));
    await chooseNote(app, 'Sign.png');
    await app.click('[data-note-sources] [data-source]');
    await app.waitFor('[data-source-dialog] [data-text-read]', 3000);
    const read = await app.exec(`return document.querySelector('[data-source-dialog] [data-read-words]')?.textContent ?? ''`);
    check('the window of its source shows the text read', /Kerameikos/i.test(read), read);
    check('with Read again', (await app.text('[data-source-dialog] [data-read-text]')).includes('Read again'));
    const inText = await app.exec(`return document.querySelector('[data-note-text] .ProseMirror')?.textContent ?? ''`);
    check('and what was read is not put into the note', !/Kerameikos/i.test(inText), inText);
    await app.screenshot('notebook-finding-7-text-read');
    await app.clickText('dialog[open] footer button', 'Close');
    await app.waitGone('[data-source-dialog]', 3000).catch(() => {});
  } else {
    await app.rightClick(await app.findByText(ROWS, 'Dot.png'));
    items = await menuItems(app);
    check('the menu of a note with an image offers Read the text', items.some((m) => m.startsWith('Read the text')), items.join(' | '));
    if (!tesseract) {
      await app.clickText('.menu [role="menuitem"]', 'Read the text');
      const said = await app.waitForText('.toaster .toast', 'is not installed', 8000).then(() => true).catch(() => false);
      check('where Tesseract is not installed, Read the text says so', said);
      await app.screenshot('notebook-finding-7-no-tesseract');
      await chooseNote(app, 'Dot.png');
      await app.click('[data-note-sources] [data-source]');
      await app.waitFor('[data-source-dialog] [data-text-read]', 3000);
      check('the window of an image\'s source offers Read the text', (await app.text('[data-source-dialog] [data-read-text]')).includes('Read the text'));
      await app.click('[data-source-dialog] [data-read-text]');
      await sleep(800);
      check('and says there too that Tesseract is not installed', (await app.count('.toaster .toast')) >= 1 && !(await app.exists('[data-source-dialog] [data-read-words]')));
      await app.screenshot('notebook-finding-8-no-tesseract-source');
      await app.clickText('dialog[open] footer button', 'Close');
      await app.waitGone('[data-source-dialog]', 3000).catch(() => {});
    } else {
      await app.press('Escape');
    }
  }

  await sleep(500);
  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await app.quit();
} catch (error) {
  console.error(error);
  await app.screenshot('notebook-finding-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
  await app.close().catch(() => {});
} finally {
  rmSync(desk, { recursive: true, force: true });
  if (!process.env.GLAUKOPIS_E2E_KEEP) {
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(`${dataDir}-config`, { recursive: true, force: true });
  }
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
