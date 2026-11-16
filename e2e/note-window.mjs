// A note written in a window of its own (record 0109): the program is
// launched with --note in a data folder of the run, with the application not
// running. The window opens with its title, the row over the field, and To
// the notebook pressed by nothing while it is empty; a list is typed with
// "- ", a word made bold by Ctrl+B, a picture and a file added through the
// hook of the system's dialog, and Ctrl+S sends it: the window is gone, the
// process ended, and a note lies in the inbox of that folder with its text
// and both files beside it. Opened again, words written and the window
// closed by its × are kept, and are there when it is opened once more;
// emptied, Escape closes it and nothing is kept. The application started in
// the same folder then has the note in its notebook, with the list, the bold
// word, the picture and the file, and no source; while the application runs,
// a note sent from another window of a note is in its notebook within a few
// seconds. With the settings in Norwegian the window's words are Norwegian.
// No errors in the pages. Screenshots in e2e/output/note-window-<n>-<what>.png.

import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

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

// The picture of one dot, as notebook.mjs has it.
const DOT = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0xf0,
  0x1f, 0x00, 0x05, 0x00, 0x01, 0xff, 0x89, 0x99, 0x3d, 0x1d, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

const FIELD = '[data-note-window-field] .ProseMirror';
const SEND = '[data-note-window-send]';
const WINDOW = { args: ['--note'], width: 480, height: 320 };

/** The window of a note, launched in `dataDir` as the system would start glaukopis --note. */
async function noteWindow(dataDir, more = {}) {
  const win = await App.launch({ dataDir, keepData: true, ...WINDOW, ...more });
  await win.installErrorHook();
  await win.waitFor('.note-window', 10000);
  await win.waitFor(FIELD, 5000);
  await sleep(500);
  return win;
}

/** Whether the program the driver started has ended, within `ms`: the window is gone with it. */
async function ended(win, ms = 10000) {
  const pids = win.appPids();
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const alive = pids.some((pid) => {
      try {
        return !/\) Z /.test(readFileSync(`/proc/${pid}/stat`, 'utf8'));
      } catch {
        return false;
      }
    });
    if (pids.length ? !alive : await win.exec('return 1').then(() => false, () => true)) return true;
    await sleep(150);
  }
  return false;
}

/** The things in the inbox of a data folder, each with what its item.json says and the files beside it. */
function inboxOf(dataDir) {
  const dir = join(dataDir, 'notebook', 'inbox');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.startsWith('.'))
    .map((id) => {
      const item = JSON.parse(readFileSync(join(dir, id, 'item.json'), 'utf8'));
      const files = existsSync(join(dir, id, 'files')) ? readdirSync(join(dir, id, 'files')) : [];
      return { id, item, files };
    });
}

/** The notes not sent that are kept in a data folder: the words of each. */
function unsentOf(dataDir) {
  const dir = join(dataDir, 'notebook', 'unsent-notes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => !name.endsWith('.in-use') && existsSync(join(dir, name, 'note.json')))
    .map((name) => JSON.parse(readFileSync(join(dir, name, 'note.json'), 'utf8')).words);
}

const fieldText = (win) => win.exec(`return document.querySelector('${FIELD}')?.innerText ?? ''`);
const sendDisabled = (win) => win.exec(`return document.querySelector('${SEND}')?.disabled ?? null`);

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-note-window-'));
const norwegian = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-note-window-nb-'));
const things = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-note-window-files-'));
const picturePath = join(things, 'dot.png');
const letterPath = join(things, 'letter.pdf');
writeFileSync(picturePath, DOT);
writeFileSync(letterPath, '%PDF-1.4\n% A letter, as far as a name goes.\n');

let win = null;
let app = null;
try {
  // ---- The window, with the application not running ----
  win = await noteWindow(dataDir);
  check('the window is the window of a note, and nothing else', (await win.exists('.note-window')) && !(await win.exists('.projects-pane, .start, [data-notes]')));
  check('its title is the word for a note', (await win.exec('return document.title')) === 'Note', await win.exec('return document.title'));
  check(
    'the row of buttons stands over the field',
    await win.exec(`const row = document.querySelector('.note-window .tools').getBoundingClientRect(); const field = document.querySelector('[data-note-window-field]').getBoundingClientRect(); return row.top < 4 && row.bottom <= field.top + 1`),
  );
  check('the field has the cursor', await win.exec(`return document.activeElement?.closest('[data-note-window-field]') != null`));
  check('the placeholder says to write a note', (await win.exec(`return document.querySelector('${FIELD} [data-placeholder]')?.getAttribute('data-placeholder') ?? ''`)) === 'Write a note');
  check('To the notebook is there, and pressed by nothing while the note is empty', (await win.text(SEND)).includes('To the notebook') && (await sendDisabled(win)) === true);
  check(
    'the row has the marks, the lists and Add a file',
    (await win.count('[data-note-window-mark]')) === 5 && (await win.count('[data-note-window-list]')) === 3 && (await win.exists('[data-note-window-add]')),
  );
  await win.screenshot('note-window-1-empty');

  // A list, typed with "- ", and a bold word made by its key.
  await win.keys('- First point');
  await win.keys(['Enter']);
  await win.keys('Second point');
  await win.keys(['Enter']);
  await win.keys(['Enter']);
  await win.keys('A ');
  await win.keys(['Control', 'b']);
  await win.keys('bold');
  await win.keys(['Control', 'b']);
  await win.keys(' word');
  await sleep(300);
  // The words of each paragraph, without what the editor shows beside them: the name of a kind where a run of it begins.
  const kinds = await win.exec(
    `return Array.from(document.querySelectorAll('${FIELD} > p')).map((p) => {
       const words = p.cloneNode(true);
       for (const shown of words.querySelectorAll('[contenteditable="false"]')) shown.remove();
       return [p.dataset.kind ?? 'text', words.textContent];
     })`,
  );
  check(
    'the list is a list, typed with "- ", and the line after it text',
    JSON.stringify(kinds.slice(0, 3)) === JSON.stringify([['item', 'First point'], ['item', 'Second point'], ['text', 'A bold word']]),
    JSON.stringify(kinds),
  );
  check('the word is bold by Ctrl+B', (await win.exec(`return document.querySelector('${FIELD} strong')?.textContent ?? ''`)) === 'bold');
  check('To the notebook can be pressed now', (await sendDisabled(win)) === false);

  // A picture and a file, by the hook of the system's dialog.
  await win.execAsync(`await window.__glaukopisNoteWindow.add(arguments[0]); return null;`, [picturePath, letterPath]);
  await win.waitFor(`${FIELD} .figure img[src]`, 5000).catch(() => {});
  check('the picture stands in the note as a picture', await win.exists(`${FIELD} .figure img[src]`));
  check('the file stands in the note by its name', (await win.exec(`return document.querySelector('${FIELD} .held-file')?.textContent ?? ''`)).includes('letter.pdf'));
  let errors = await win.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' | '));
  await win.screenshot('note-window-2-written');

  // The window ends itself at these keys, and the driver's session with it: the command may never be answered.
  await win.keys(['Control', 's']).catch(() => {});
  check('Ctrl+S sends it, and the window is gone with its program', await ended(win));
  await win.close().catch(() => {});
  win = null;
  const sent = inboxOf(dataDir);
  check('a note lies in the inbox of the data folder', sent.length === 1 && sent[0].item.kind === 'note', JSON.stringify(sent.map((s) => s.item.kind)));
  check('with its words, and its text as the body schema writes it', sent[0]?.item.text.includes('First point') && JSON.stringify(sent[0]?.item.doc ?? {}).includes('"strong"'));
  check('and both files beside it', sent[0]?.files.length === 2 && sent[0]?.item.files.length === 2, JSON.stringify(sent[0]?.item.files ?? []));
  check('nothing is kept of what was sent', unsentOf(dataDir).length === 0, JSON.stringify(unsentOf(dataDir)));

  // ---- Written, closed by its ×, and opened again ----
  win = await noteWindow(dataDir);
  await win.keys('Kept for later');
  await sleep(900);
  await win.exec(`window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: 'note' }).catch(() => {}); return null;`).catch(() => {});
  check('closed by its ×, the window goes', await ended(win));
  await win.close().catch(() => {});
  win = null;
  check('what was written is kept in the notebook’s folder', JSON.stringify(unsentOf(dataDir)) === JSON.stringify(['Kept for later']), JSON.stringify(unsentOf(dataDir)));
  win = await noteWindow(dataDir);
  check('and is there when the window is opened again', (await until(() => fieldText(win), (t) => t.includes('Kept for later'))).includes('Kept for later'), await fieldText(win));
  await win.screenshot('note-window-3-kept');
  await win.keys(['Escape']);
  await sleep(300);
  check('Escape does nothing where something is written', await win.exists('.note-window').catch(() => false));
  // Emptied: nothing to keep, and Escape closes.
  await win.keys(['Control', 'a']);
  await win.keys(['Backspace']);
  await sleep(900);
  errors = await win.pageErrors();
  check('no errors in the window opened again', errors.length === 0, errors.join(' | '));
  await win.keys(['Escape']).catch(() => {});
  check('emptied, Escape closes it', await ended(win));
  await win.close().catch(() => {});
  win = null;
  check('and nothing is kept', unsentOf(dataDir).length === 0, JSON.stringify(unsentOf(dataDir)));
  check('the inbox still holds the one note', inboxOf(dataDir).length === 1);

  // ---- The application, started in the same folder ----
  app = await App.launch({ dataDir, keepData: true, width: 1360, height: 880 });
  await app.installErrorHook();
  await app.waitFor('#app > *', 15000);
  await app.waitForText('.toaster .toast', 'Added to the notebook', 15000);
  check('the application says a note was added, with Show', /Added to the notebook.*Show/.test(await app.exec(`return Array.from(document.querySelectorAll('.toaster .toast')).map((t) => t.textContent.replace(/\\s+/g, ' ')).join(' | ')`)));
  await app.exec(
    `const toast = Array.from(document.querySelectorAll('.toaster .toast')).find((t) => t.textContent.includes('Added to the notebook'));
     toast.querySelector('.action').click();
     return null;`,
  );
  await app.waitUntil(`return location.hash.startsWith('#/notebook?note=')`, 5000, 'the note shown');
  await app.waitFor('[data-note-text] .ProseMirror', 5000);
  await sleep(400);
  const noteText = await app.exec(`return document.querySelector('[data-note-text] .ProseMirror')?.textContent ?? ''`);
  check('the note holds the words', noteText.includes('First point') && noteText.includes('A bold word'), noteText);
  check(
    'the list is a list in the notebook too',
    (await app.exec(`return Array.from(document.querySelectorAll('[data-note-text] .ProseMirror > p[data-kind="item"]')).length`)) === 2,
  );
  check('the bold word is bold', (await app.exec(`return document.querySelector('[data-note-text] .ProseMirror strong')?.textContent ?? ''`)) === 'bold');
  await app.waitFor('[data-note-text] .figure img[src]', 5000).catch(() => {});
  check('the picture is there', await app.exists('[data-note-text] .figure img[src]'));
  check('the file is there by its name', (await app.exec(`return document.querySelector('[data-note-text] .held-file')?.textContent ?? ''`)).includes('letter.pdf'));
  check('the note has no source', !(await app.exists('[data-note-sources] [data-source]:not([data-source="none"])')));
  check('the inbox is empty, the note taken', inboxOf(dataDir).length === 0);
  await app.screenshot('note-window-4-in-the-notebook');

  // ---- While the application runs ----
  win = await noteWindow(dataDir);
  await win.keys('Written while it runs');
  await win.keys(['Control', 's']).catch(() => {});
  check('sent while the application runs, the window goes', await ended(win));
  await win.close().catch(() => {});
  win = null;
  await app.waitForText('.toaster .toast', 'Added to the notebook', 10000).catch(() => {});
  await app.go('#/notebook');
  await app.waitFor('[data-notes]', 5000);
  const titles = await until(
    () => app.exec(`return Array.from(document.querySelectorAll('[data-notes] [role="option"]')).map((r) => r.textContent.replace(/\\s+/g, ' ').trim())`),
    (t) => t.some((x) => x.includes('Written while it runs')),
    10000,
  );
  check('it is in the notebook within a few seconds', titles.some((x) => x.includes('Written while it runs')), titles.join(' | '));
  errors = await app.pageErrors();
  check('no errors in the application', errors.length === 0, errors.join(' | '));
  await app.screenshot('note-window-5-while-it-runs');
  await app.quit();
  app = null;

  // ---- In Norwegian ----
  writeFileSync(join(norwegian, 'settings.json'), JSON.stringify({ language: 'nb' }));
  win = await noteWindow(norwegian);
  check('with the settings in Norwegian, its title is Notat', (await win.exec('return document.title')) === 'Notat');
  check('the placeholder is Skriv et notat', (await win.exec(`return document.querySelector('${FIELD} [data-placeholder]')?.getAttribute('data-placeholder') ?? ''`)) === 'Skriv et notat');
  check('the button is Til notatblokken', (await win.text(SEND)).includes('Til notatblokken'));
  check('Add a file is Legg til en fil …', (await win.exec(`return document.querySelector('[data-note-window-add]')?.getAttribute('aria-label') ?? ''`)) === 'Legg til en fil …');
  await win.screenshot('note-window-6-norwegian');
  errors = await win.pageErrors();
  check('no errors in the Norwegian window', errors.length === 0, errors.join(' | '));
  check('nothing of the settings was written', JSON.parse(readFileSync(join(norwegian, 'settings.json'), 'utf8')).language === 'nb' && Object.keys(JSON.parse(readFileSync(join(norwegian, 'settings.json'), 'utf8'))).length === 1);
  await win.keys(['Escape']);
  check('empty, Escape closes it', await ended(win));
} catch (error) {
  console.error(error);
  await (win ?? app)?.screenshot('note-window-failure').catch(() => {});
  checks.push({ name: 'the script completed', ok: false });
} finally {
  await win?.close().catch(() => {});
  await app?.close().catch(() => {});
  if (!process.env.GLAUKOPIS_E2E_KEEP) {
    for (const dir of [dataDir, norwegian]) {
      rmSync(dir, { recursive: true, force: true });
      rmSync(`${dir}-config`, { recursive: true, force: true });
    }
  }
  rmSync(things, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
