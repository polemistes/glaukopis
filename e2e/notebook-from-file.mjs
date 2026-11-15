// From a file read in Glaukopis to the notebook (docs/plans/the-notebook.md, stage 3): a PDF
// with text (structure.pdf) is taken into the library and attached to a reference (Lord 1960),
// and shown in a side of a project; two lines of its first page selected by script and To the
// notebook pressed in the bar: a message says it was added, with Show, which opens the note in
// the notebook; the note holds the lines joined into running text, taken in as a passage, and
// its source is the reference with the page; back in the file, with nothing selected, the
// button lets a part of the page be marked (a crosshair layer over the pages, the button
// pressed), and a rectangle dragged on the page is a note holding a picture, with the same
// source; Escape gives a marking up; a PDF with no reference (shape.pdf) gives its own name as
// the source, and the page with it (p. 1 in the line under the source); the reader of the
// library's files has the button too; no errors in the page. Screenshots into
// e2e/output/notebook-from-file-<n>-<what>.png.

import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
async function until(what, test, ms = 8000) {
  const start = Date.now();
  for (;;) {
    const got = await test();
    if (got) return got;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-notebook-from-file-'));
const structure = join(root, 'e2e/fixtures/structure.pdf');
const shape = join(root, 'e2e/fixtures/shape.pdf');
const side = '[data-file-side]';
const ADDED = 'Added to the notebook';

/** The first page of the file in the side drawn, with its text over it. */
const pageReady = (app, page = 1) =>
  until(`page ${page} drawn with its text`, () =>
    app.exec(
      `const p = document.querySelector('${side} .page[data-page="' + arguments[0] + '"]');
       return !!(p && p.querySelector('canvas[data-drawn]') && p.querySelectorAll('[data-page-text] .line').length);`,
      page,
    ), 20000);

/**
 * Selects two lines of a page that follow one another, the first holding these words (or
 * the first two lines of the page with words), as a hand would drag over them; gives their
 * words as the text layer has them.
 */
const selectLines = (app, page, words) =>
  app.exec(
    `const lines = Array.from(document.querySelectorAll('${side} [data-page-text="' + arguments[0] + '"] .line'))
       .filter((l) => l.textContent.trim());
     let i = lines.findIndex((l) => l.textContent.includes(arguments[1]));
     if (i < 0 || i + 1 >= lines.length) i = 0;
     const a = lines[i].querySelector('span').firstChild, b = lines[i + 1].querySelector('span').firstChild;
     const range = document.createRange();
     range.setStart(a, 0);
     range.setEnd(b, b.textContent.length);
     const sel = getSelection();
     sel.removeAllRanges();
     sel.addRange(range);
     return [a.textContent, b.textContent];`,
    page,
    words,
  );

/** Two lines joined as the notebook joins them: a word broken at a hyphen mended before a small letter. */
function joined(a, b) {
  const x = a.trim();
  const y = b.trim();
  if (/\p{L}[-‐]$/u.test(x)) return /^\p{Ll}/u.test(y) ? x.slice(0, -1) + y : x + y;
  return `${x} ${y}`;
}

/** Waits until no message says that a note was added, so that the next one is told apart. */
const quiet = (app) =>
  until('the last message to go', async () =>
    !(await app.exec(
      `return Array.from(document.querySelectorAll('.toast .message')).some((m) => m.textContent.trim() === arguments[0])`,
      ADDED,
    )), 9000).catch(() => {});

/** The message that a note was added: its words and whether it has Show. */
const told = (app) =>
  until('the message that the note was added', () =>
    app.exec(
      `const t = Array.from(document.querySelectorAll('.toast')).find((t) => t.querySelector('.message')?.textContent.trim() === arguments[0]);
       return t ? { message: t.querySelector('.message').textContent.trim(), action: t.querySelector('.action')?.textContent.trim() ?? '' } : null;`,
      ADDED,
    ), 10000);

/** Presses Show in the message, and waits for the note in the notebook. */
async function showNote(app) {
  const button = await app.exec(
    `const t = Array.from(document.querySelectorAll('.toast')).find((t) => t.querySelector('.message')?.textContent.trim() === arguments[0]);
     return t?.querySelector('.action') ?? null;`,
    ADDED,
  );
  await app.click(button);
  await until('the notebook, at the note', async () => (await app.exec('return location.hash')).startsWith('#/notebook?note='), 8000);
  await app.waitFor('[data-note-text] .ProseMirror', 8000);
  await sleep(400);
}

/** What the note shown holds: its words, whether they are taken in, its pictures, and its sources as their chips say them. */
const noteShown = (app) =>
  app.exec(`
    const text = document.querySelector('[data-note-text] .ProseMirror');
    return {
      words: text?.textContent ?? '',
      paragraphs: text ? text.querySelectorAll('p').length : 0,
      taken: !!text?.querySelector('span.taken[data-passage]'),
      pictures: text ? text.querySelectorAll('.figure, figure').length : 0,
      sources: Array.from(document.querySelectorAll('[data-note-sources] [data-source]')).map((c) => ({ words: c.textContent.trim(), detail: c.title ?? '' })),
    };`);

let app = await App.launch({ dataDir, keepData: true });
let structureHash = '';
let shapeHash = '';
let fileRoute = '';
try {
  await app.installErrorHook();

  // ---- the library: a reference with the PDF attached, and a PDF of no reference ----
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await invoke(app, 'import_apply', { plan: await invoke(app, 'import_bib_text', { text: bib }) });
  const taken = await invoke(app, 'files_take_in', { paths: [structure, shape], folder: null, structure: true, ticket: null });
  structureHash = taken.files.find((f) => f.name.startsWith('structure'))?.hash ?? '';
  shapeHash = taken.files.find((f) => f.name.startsWith('shape'))?.hash ?? '';
  check('the two PDFs are taken into the library', structureHash && shapeHash);
  const listing = await invoke(app, 'library_list');
  const singer = listing.entries.find((e) => /Singer of Tales/.test(e.title));
  await invoke(app, 'attachment_add', { id: singer.id, paths: [structure] });

  // ---- a project, and the file with a reference in its side ----
  await app.beginProject();
  await app.type('dialog input', 'From the files');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.execAsync(`window.__glaukopisViewer.show(arguments[0]);`, structureHash);
  await pageReady(app, 1);
  await app.click('[data-viewer-pages]');
  await sleep(300);
  fileRoute = await app.exec('return location.hash');
  check('the bar of the file has To the notebook', await app.exists(`${side} [data-viewer-bar] [data-viewer-notebook]`));
  const order = await app.exec(
    `return Array.from(document.querySelectorAll('${side} [data-viewer-bar] button')).map((b) => b.hasAttribute('data-viewer-places') ? 'places' : b.hasAttribute('data-viewer-notebook') ? 'notebook' : b.hasAttribute('data-viewer-print') ? 'print' : '').filter(Boolean).join(',')`,
  );
  check('after the bookmark and before print', order === 'places,notebook,print', order);

  // ---- words selected, to the notebook ----
  const [lineA, lineB] = await selectLines(app, 1, 'Lorem ipsum');
  const expected = joined(lineA, lineB);
  await app.screenshot('notebook-from-file-1-selected');
  await app.click(`${side} [data-viewer-notebook]`);
  const message = await told(app);
  check('a message says it was added to the notebook, with Show', message.message === ADDED && message.action === 'Show', JSON.stringify(message));
  check(
    'the view of the file stays, the words still selected',
    (await app.exists(`${side} .page[data-page="1"]`)) && (await app.exec('return getSelection().toString().length > 0')),
  );
  check('no part of the page is being marked', !(await app.exists('[data-mark-part]')));
  await showNote(app);
  const words = await noteShown(app);
  check('the note holds the two lines as running text, in one paragraph', words.words.trim() === expected && words.paragraphs === 1, `${JSON.stringify(words.words)} / ${JSON.stringify(expected)}`);
  check('the words are taken in as a passage', words.taken);
  check(
    'whose source is the reference, with the page',
    words.sources.length === 1 && /^Lord 1960, \S+/.test(words.sources[0].words),
    JSON.stringify(words.sources),
  );
  await app.screenshot('notebook-from-file-2-words');

  // ---- nothing selected: a part of the page marked ----
  await app.go(fileRoute);
  await app.waitFor(side, 10000);
  await pageReady(app, 1);
  await app.exec('getSelection().removeAllRanges()');
  await quiet(app);
  await app.click(`${side} [data-viewer-notebook]`);
  await app.waitFor(`${side} [data-mark-part]`, 3000);
  check('with nothing selected, the button lets a part of the page be marked', true);
  check('and stands pressed while it is', (await app.attr(`${side} [data-viewer-notebook]`, 'aria-pressed')) === 'true');
  const cursor = await app.exec(`return getComputedStyle(document.querySelector('${side} [data-mark-part]')).cursor`);
  check('the pointer is a crosshair over the pages', cursor === 'crosshair', cursor);
  // Escape gives it up; the button again begins it anew.
  await app.press('Escape');
  await app.waitGone(`${side} [data-mark-part]`, 3000);
  check('Escape gives the marking up', (await app.attr(`${side} [data-viewer-notebook]`, 'aria-pressed')) === 'false');
  check('and the file stays shown', await app.exists(side));
  await app.click(`${side} [data-viewer-notebook]`);
  await app.waitFor(`${side} [data-mark-part]`, 3000);
  await app.screenshot('notebook-from-file-3-marking');
  // Dragged from over a line near the top of the first page, down and to the right.
  const from = await app.exec(
    `return Array.from(document.querySelectorAll('${side} [data-page-text="1"] .line')).find((l) => l.textContent.trim() && l.getBoundingClientRect().top > 0) ?? null`,
  );
  await app.drag(from, { dx: 160, dy: 90 });
  await told(app);
  check('a part marked is sent, and the message says so', true);
  check('the marking ends', !(await app.exists('[data-mark-part]')));
  await showNote(app);
  const picture = await noteShown(app);
  check('the note holds a picture, and no words taken in', picture.pictures === 1 && !picture.taken, JSON.stringify(picture));
  check(
    'with the same source: the reference and the page',
    picture.sources.length === 1 && picture.sources[0].words === words.sources[0]?.words,
    JSON.stringify(picture.sources),
  );
  await app.waitFor('[data-note-text] img[src^="blob:"], [data-note-text] img', 8000).catch(() => {});
  await app.screenshot('notebook-from-file-4-picture');

  // ---- a file of no reference: its own name, and the page ----
  await app.go(fileRoute);
  await app.waitFor(side, 10000);
  await quiet(app);
  await app.execAsync(`window.__glaukopisViewer.show(arguments[0]);`, shapeHash);
  await until('the file of no reference shown', () => app.exec(`return document.querySelector('${side}')?.dataset.fileSide === arguments[0]`, shapeHash), 10000);
  await pageReady(app, 1);
  await selectLines(app, 1, 'Every page has a shape');
  await app.click(`${side} [data-viewer-notebook]`);
  await told(app);
  await showNote(app);
  const plain = await noteShown(app);
  check(
    'a file of no reference gives its own name as the source',
    plain.sources.length === 1 && plain.sources[0].words === 'shape.pdf',
    JSON.stringify(plain.sources),
  );
  check('and the page with it', /\bp\. 1\b/.test(plain.sources[0]?.detail ?? ''), plain.sources[0]?.detail);
  await app.screenshot('notebook-from-file-5-no-reference');

  // ---- the reader of the library's files has the button too ----
  await app.go('#/files');
  await app.waitFor(`[data-file-list] [data-hash="${shapeHash}"]`, 10000);
  await app.click(`[data-file-list] [data-hash="${shapeHash}"]`);
  await app.waitFor(`.file-pane[data-file="${shapeHash}"] [data-action="read-file"]`, 5000);
  await app.click(`.file-pane[data-file="${shapeHash}"] [data-action="read-file"]`);
  await app.waitFor('[data-reader] [data-viewer-notebook]', 10000);
  check('the file read in the library has To the notebook in its bar', true);
  await app.exec('getSelection().removeAllRanges()');
  await app.click('[data-reader] [data-viewer-notebook]');
  await app.waitFor('[data-reader] [data-mark-part]', 3000).catch(() => {});
  check('where it marks a part of the page as well', await app.exists('[data-reader] [data-mark-part]'));
  await app.screenshot('notebook-from-file-6-reader');
  await app.press('Escape');
  await sleep(300);
  check('Escape gives the marking up there, and the file stays read', !(await app.exists('[data-mark-part]')) && (await app.exists('[data-reader]')));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.log('FAIL  the run stopped:', error?.message ?? error);
  checks.push({ name: 'the run ran to the end', ok: false });
  await app.screenshot('notebook-from-file-stopped').catch(() => {});
  console.log('page errors:', JSON.stringify(await app.pageErrors().catch(() => [])).slice(0, 2000));
} finally {
  await app.close().catch(() => {});
  if (!process.env.GLAUKOPIS_E2E_KEEP) {
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(`${dataDir}-config`, { recursive: true, force: true });
  }
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
