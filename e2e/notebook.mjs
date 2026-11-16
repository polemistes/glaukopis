// The page of the notebook (record 0101): its place in the row at the top
// and Ctrl+3; the empty page with New note and Add files; a new note written,
// its name and its text, there again after going to the library and back; a
// second note; the notes found by words in the field; words pasted from
// outside Glaukopis while no text has the focus a new note whose words are
// taken in, with No source; its source given by hand as a web page in the
// window of a source, the chip saying its title; My own words taking the
// chip away; an image and a PDF dropped on the page a note each, the image
// shown in its note and the PDF by its name, each with its file as its
// source; the hook that answers for the system's dialog of Add files; a note
// deleted and brought back by Undo in the message; the notes seen in a
// second window, and a note written there seen in the first; and the notes
// there after the application is closed and opened again on the same data
// folder. Screenshots at each stage in e2e/output/notebook-<n>-<what>.png.

import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
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

/**
 * Puts words on the clipboard, as another program would have. The page may
 * write the clipboard only right after a press: where it is refused, `press`
 * presses something that changes nothing, and it is tried again.
 */
async function toClipboard(app, words, press) {
  for (let tries = 0; ; tries++) {
    try {
      await app.execAsync(`await navigator.clipboard.writeText(arguments[0])`, words);
      return;
    } catch (error) {
      if (tries >= 3) throw error;
      await press();
    }
  }
}

// ---- what is on the desk: an image and two PDFs ----
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
// The picture of one dot of `contract.rs`, as files.mjs and pane-adding.mjs have it.
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
copyFileSync(join(root, 'e2e', 'fixtures', 'porson.pdf'), join(desk, 'Porson.pdf'));

// The data folder is the script's, kept between the two runs of the application.
const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-notebook-'));

// ---- what the scripts read of the page ----
const ROWS = '[data-notes] [role="option"]';
/** The titles of the rows of the list, as they stand. */
const titles = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${ROWS} .title')).map((t) => t.textContent.trim())`,
  );
/** The words of the text of the note chosen. */
const noteText = (app) =>
  app.exec(`return document.querySelector('[data-note-text] .ProseMirror')?.textContent ?? ''`);
/** The chips of the sources of the note chosen: what each says, and which source it is. */
const chips = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-note-sources] [data-source]')).map((c) => ({ source: c.dataset.source, words: c.textContent.trim() }))`,
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
/** Files dropped from the desktop, as the window tells of them, in the middle of an element. */
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

// ---- Run 1 ----
let app = await App.launch({ dataDir, keepData: true, width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');

  // The place in the row, and Ctrl+3.
  check('the notebook has its place in the row at the top', await app.exists('[data-place="notebook"]'));
  await app.keys(['Control', '3']);
  await app.waitFor('[data-notebook]', 8000);
  check('Ctrl+3 goes to the notebook', (await app.exec('return location.hash')).startsWith('#/notebook'));
  check(
    'its place in the row is lit',
    await app.exec(`return document.querySelector('[data-place="notebook"]').classList.contains('current')`),
  );

  // The empty page.
  await app.waitFor('[data-notebook-empty]', 8000);
  const emptyWords = await app.text('[data-notebook-empty]');
  check(
    'the empty notebook says what it is for and offers New note and Add files',
    emptyWords.includes('The notebook is empty') && emptyWords.includes('New note') && emptyWords.includes('Add files'),
    emptyWords.replace(/\s+/g, ' '),
  );
  await app.screenshot('notebook-1-empty');

  // A new note, its name and its text.
  await app.clickText('[data-notebook-empty] button', 'New note');
  await app.waitFor('[data-note-editor] [data-note-text] .ProseMirror', 5000);
  await app.waitUntil(
    `return !!document.activeElement?.closest?.('[data-note-text]')`,
    3000,
    'the text of the new note to have the cursor',
  );
  check('a new note has the cursor in its text', true);
  await app.keys('Athena is grey-eyed, and the owl is hers.');
  await app.click('[data-note-name]');
  await app.keys('Owls of Athens');
  await app.press('Enter');
  await sleep(300);
  check(
    'Enter in the name goes to the text',
    await app.exec(`return !!document.activeElement?.closest?.('[data-note-text]')`),
  );
  const firstTitles = await until(() => titles(app), (t) => t[0] === 'Owls of Athens');
  check('the note is listed by its name', firstTitles[0] === 'Owls of Athens', firstTitles.join(' | '));
  await app.screenshot('notebook-2-written');

  // To the library and back: the note is still chosen, and still says what was written.
  await app.keys(['Control', '2']);
  await app.waitFor('.library', 8000);
  await app.keys(['Control', '3']);
  await app.waitFor('[data-note-editor]', 8000);
  const name = await app.exec(`return document.querySelector('[data-note-name]').value`);
  const back = await until(() => noteText(app), (t) => t.includes('grey-eyed'));
  check(
    'after the library and back, the note is chosen and holds its name and its text',
    name === 'Owls of Athens' && back.includes('Athena is grey-eyed, and the owl is hers.'),
    `${name} / ${back}`,
  );
  check('the route names the note', (await app.exec('return location.hash')).includes('note='));

  // A second note, by the button over the list.
  await app.click('[data-new-note]');
  await sleep(400);
  await app.keys('Hermes carries messages.');
  const two = await until(() => titles(app), (t) => t.length === 2 && t[0] === 'Hermes carries messages.');
  check('a second note stands first, by how it begins', two.length === 2 && two[0] === 'Hermes carries messages.', two.join(' | '));

  // Found by words.
  await app.click('[data-notebook-search]');
  await app.keys('owl athena');
  const found = await until(() => titles(app), (t) => t.length === 1);
  check('the field finds the notes by their words', found.length === 1 && found[0] === 'Owls of Athens', found.join(' | '));
  await app.screenshot('notebook-3-found');
  await app.press('Escape');
  const allAgain = await until(() => titles(app), (t) => t.length === 2);
  check('Escape in the field shows all again', allAgain.length === 2, allAgain.join(' | '));

  // Words pasted from outside, while the list has the focus: a new note, taken in, with No source.
  await chooseNote(app, 'Owls of Athens');
  await toClipboard(app, 'The owl of Minerva spreads its wings only with the falling of the dusk.', () =>
    app.clickText(ROWS, 'Owls of Athens'),
  );
  await app.exec(`document.querySelector('[data-notes]').focus(); return null;`);
  await app.keys(['Control', 'v']);
  const pasted = await until(() => titles(app), (t) => t.length === 3, 8000);
  check('words pasted where nothing is written are a new note', pasted.length === 3 && pasted[0].startsWith('The owl of Minerva'), pasted.join(' | '));
  const pastedText = await until(() => noteText(app), (t) => t.includes('Minerva'));
  check('and the new note is chosen, with the words in its text', pastedText.includes('falling of the dusk'), pastedText);
  check(
    'the words are taken in: they carry the mark of a passage',
    await app.exec(`return !!document.querySelector('[data-note-text] .ProseMirror [data-passage], [data-note-text] .ProseMirror .taken')`),
  );
  let shown = await until(() => chips(app), (c) => c.length === 1);
  check(
    'what was taken in has no source, said once',
    shown.length === 1 && shown[0].source === 'none' && shown[0].words === 'No source',
    JSON.stringify(shown),
  );
  await app.screenshot('notebook-4-pasted');

  // Its source given by hand: a web page, with its address and its title.
  await app.click('[data-note-sources] [data-source="none"]');
  await app.waitFor('[data-source-dialog]', 3000);
  check(
    'the window of a source offers Web page, Reference and Other',
    await app.exec(
      `return Array.from(document.querySelectorAll('[data-source-dialog] [role="radio"]')).map((r) => r.getAttribute('aria-label')).join('|') === 'Web page|Reference|Other'`,
    ),
  );
  await app.click('[data-source-url]');
  await app.keys('https://example.org/hegel');
  await app.click('[data-source-title]');
  await app.keys('Philosophy of Right, preface');
  await app.screenshot('notebook-5-source');
  await app.click('[data-source-apply]');
  await app.waitGone('dialog[open]', 3000);
  shown = await until(() => chips(app), (c) => c[0]?.words === 'Philosophy of Right, preface');
  check(
    'given a web page, the chip says its title',
    shown.length === 1 && shown[0].source !== 'none' && shown[0].words === 'Philosophy of Right, preface',
    JSON.stringify(shown),
  );

  // My own words: the words stay, and the chip goes.
  await app.click('[data-note-sources] [data-source]');
  await app.waitFor('[data-source-dialog] [data-passage]', 3000);
  // Read as it is written, not as the driver sees it: the driver passes over a paragraph cut to two lines.
  const passageWords = await app.exec(`return document.querySelector('[data-source-dialog] [data-passage] .now')?.textContent ?? ''`);
  check('the window shows the passage taken from it', passageWords.includes('Minerva'), passageWords);
  await app.click('[data-source-dialog] [data-own-words]');
  await app.waitGone('dialog[open]', 3000).catch(() => {});
  await app.waitGone('[data-note-sources]', 3000).catch(() => {});
  check('My own words takes the chip away', !(await app.exists('[data-note-sources]')));
  check('and the words stay', (await noteText(app)).includes('falling of the dusk'));
  await app.screenshot('notebook-6-own-words');

  // An image and a PDF dropped on the page: a note each, the first chosen.
  await drop(app, [join(desk, 'Dot.png'), join(desk, 'Shape.pdf')], '[data-notebook]');
  const dropped = await until(() => titles(app), (t) => t.length === 5, 10000);
  check('files dropped on the page are a note each', dropped.length === 5 && dropped.includes('Dot.png') && dropped.includes('Shape.pdf'), dropped.join(' | '));
  await chooseNote(app, 'Dot.png');
  await app.waitFor('[data-note-text] .figure', 5000).catch(() => {});
  check('the image is shown in its note', await app.exists('[data-note-text] .figure'));
  shown = await until(() => chips(app), (c) => c.length === 1);
  check('with its file as its source', shown.length === 1 && shown[0].words === 'Dot.png', JSON.stringify(shown));
  check(
    'and its row shows a small picture of it',
    await app.exec(
      `return !!Array.from(document.querySelectorAll('${ROWS}')).find((r) => r.textContent.includes('Dot.png'))?.querySelector('.thumb')`,
    ),
  );
  await app.screenshot('notebook-7-image');
  await chooseNote(app, 'Shape.pdf');
  await app.waitFor('[data-note-text] .held-file', 5000).catch(() => {});
  const held = await app.exec(`return document.querySelector('[data-note-text] .held-file')?.textContent.trim() ?? ''`);
  check('the PDF stands in its note by its name', held.includes('Shape.pdf'), held);
  shown = await until(() => chips(app), (c) => c.length === 1);
  check('with its file as its source', shown.length === 1 && shown[0].words === 'Shape.pdf', JSON.stringify(shown));
  await app.click('[data-note-sources] [data-source]');
  await app.waitFor('[data-source-dialog]', 3000);
  // The window rises into place, and has no words to be seen before it stands.
  const fileWords = await until(() => app.text('[data-source-dialog]'), (words) => words.includes('Shape.pdf'), 4000);
  check(
    'the window of a file says what it says of itself, with no choice of sort',
    fileWords.includes('Shape.pdf') && !(await app.exists('[data-source-dialog] [role="radio"]')),
    fileWords.replace(/\s+/g, ' '),
  );
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000);
  await app.screenshot('notebook-8-pdf');

  // The hook that answers for the system's dialog of Add files.
  const hooked = await app.execAsync(
    `return await window.__glaukopisNotebook.addFiles(arguments[0]);`,
    [join(desk, 'Porson.pdf')],
  );
  const six = await until(() => titles(app), (t) => t.length === 6);
  check('Add files takes in what its dialog answers', Array.isArray(hooked) && hooked.length === 1 && six.includes('Porson.pdf'), six.join(' | '));

  // A note deleted, and brought back by Undo.
  await chooseNote(app, 'Porson.pdf');
  await app.exec(`document.querySelector('[data-notes]').focus(); return null;`);
  await app.press('Delete');
  const five = await until(() => titles(app), (t) => t.length === 5);
  check('Delete deletes the note chosen', five.length === 5 && !five.includes('Porson.pdf'), five.join(' | '));
  await app.waitForText('.toaster .toast', 'Note deleted', 3000);
  await app.screenshot('notebook-9-deleted');
  await app.clickText('.toaster .toast .action', 'Undo');
  const sixAgain = await until(() => titles(app), (t) => t.length === 6);
  check('Undo in the message brings it back', sixAgain.includes('Porson.pdf'), sixAgain.join(' | '));

  // A second window sees the notes, and what is written there.
  const first = await app.currentWindow();
  await app.keys(['Control', 'Shift', 'N']);
  const handles = await app.waitForWindows(2);
  const second = handles.find((h) => h !== first);
  await app.switchTo(second);
  await app.waitFor('#app > *', 10000);
  await app.go('#/notebook');
  await app.waitFor('[data-notes]', 10000);
  const seen = await until(() => titles(app), (t) => t.length === 6);
  check('a second window shows the notes of the first', seen.length === 6 && seen.includes('Owls of Athens'), seen.join(' | '));
  await app.click('[data-new-note]');
  await sleep(400);
  await app.keys('Written in the second window.');
  await sleep(1200);
  await app.switchTo(first);
  const fromSecond = await until(() => titles(app), (t) => t.includes('Written in the second window.'), 8000);
  check('a note written in the second window is in the first', fromSecond.includes('Written in the second window.'), fromSecond.join(' | '));
  // The second window is closed from itself, as its own close button would.
  await app.switchTo(second);
  await app.exec(
    `window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: window.__TAURI_INTERNALS__.metadata.currentWindow.label }).catch(() => {}); return null;`,
  );
  await app.waitForWindows(1).catch(() => {});
  await app.switchTo(first);
  await app.screenshot('notebook-10-two-windows');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await app.quit();
} catch (error) {
  console.error(error);
  await app.screenshot('notebook-failure').catch(() => {});
  checks.push({ name: 'the first run completed', ok: false });
  await app.close().catch(() => {});
}

// ---- Run 2: the same data folder ----
app = await App.launch({ dataDir, keepData: true, width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitFor('#app > *', 15000);
  await app.go('#/notebook');
  await app.waitFor('[data-notes]', 10000);
  const kept = await until(() => titles(app), (t) => t.length === 7, 8000);
  check(
    'the notes are there after the application is closed and opened again',
    kept.length === 7 && kept.includes('Owls of Athens') && kept.includes('Dot.png') && kept.includes('Written in the second window.'),
    kept.join(' | '),
  );
  await chooseNote(app, 'Owls of Athens');
  const keptText = await until(() => noteText(app), (t) => t.includes('grey-eyed'));
  check('and a note still holds what was written in it', keptText.includes('the owl is hers'), keptText);
  await chooseNote(app, 'Dot.png');
  await app.waitFor('[data-note-text] .figure', 5000).catch(() => {});
  check('and the picture of a note is still shown', await app.exists('[data-note-text] .figure'));
  await app.screenshot('notebook-11-again');

  const errors = await app.pageErrors();
  check('no errors in the page after opening again', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('notebook-failure-again').catch(() => {});
  checks.push({ name: 'the second run completed', ok: false });
} finally {
  await app.close().catch(() => {});
  rmSync(desk, { recursive: true, force: true });
  if (!process.env.GLAUKOPIS_E2E_KEEP) {
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(`${dataDir}-config`, { recursive: true, force: true });
  }
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
