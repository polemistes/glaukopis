// A note on the phone (stage 2 of docs/plans/an-app-for-android.md, part D),
// through `glaukopis --phone` at 412 by 915. A note made by the hook is
// opened from the list. Its name written, and the row of the list has it.
// Words written; Bold pressed, words, Bold again: the middle words are bold
// and the cursor stayed in the text; List, two points; To do, and the point
// ticked by a press on its box; Undo in the row takes the tick away. A tag
// added by Enter, by a comma typed, and by a comma that comes in the
// field's words as a phone's keyboard sends it, and one taken away by its
// x. The box: its sheet, New box, and the note is in it. A picture, by the
// hook: it stands in the note, and the row of the list shows it small.
// Words pasted from outside Glaukopis, into a second note (the picture
// pasted into the first has no source either, and would keep the chip):
// the chip No source; the sheet of the source; a page given, the chip says
// its title; My own words takes the chip away. More, Delete: the notes,
// without it, and the line with Undo, which brings it back; More, Redo
// after an undo. A note deleted while it is shown (by the hook): the view
// goes back. Then started once more at 320 by 568 on the same folder: a
// note shown, nothing lies outside the window and every button of its rows
// is within it. No errors in the page.
//
// What it presses and reads: of part C, data-phone-notes, data-phone-row,
// data-phone-back and the hooks box, note and remove of
// window.__glaukopisPhone; of part D, data-phone-note, data-phone-name,
// data-phone-text, data-phone-tool, data-phone-more, data-phone-box and the
// hook picture, and beside them data-phone-tools (the row of tools),
// data-phone-redo and data-phone-delete (in the sheet of More),
// data-phone-boxes, data-phone-box-name and data-phone-box-new (the sheet
// of the boxes), data-phone-source (a chip under the text, by the source's
// id, `none` for no source), data-phone-source-sheet, data-phone-source-url,
// data-phone-source-title, data-phone-source-apply and data-phone-own-words
// (the sheet of a source); and the field of tags of the notebook,
// data-tag-field and data-tag.
// Screenshots in e2e/output/phone-note-<n>-<what>.png.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 8000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(150);
  }
}

// A picture of one dot.
const PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const TEXT = '[data-phone-text] .ProseMirror';

/** Makes a note through the hook of the page, and gives its id. */
const makeNote = (app, made) =>
  app.execAsync(`return window.__glaukopisPhone.note(arguments[0]);`, made);

/** Opens a note from the list. */
async function openNote(app, id) {
  await app.waitFor(`[data-phone-row="${id}"]`, 5000);
  await app.click(`[data-phone-row="${id}"]`);
  await app.waitFor(`[data-phone-note="${id}"]`, 5000);
  await sleep(300);
}

/** Back to the notes by the button of the row at the top. */
async function back(app) {
  await app.click('[data-phone-back]');
  await app.waitFor('[data-phone-notes]', 5000);
  await sleep(200);
}

/** The paragraphs of the text of the note shown: their kind, whether ticked, and their words. */
const paragraphs = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).map((p) => ({
       kind: p.dataset.kind ?? 'text', done: p.hasAttribute('data-done'), text: p.textContent }));`,
    TEXT,
  );

/** Whether what has the focus is in the text of the note. */
const inText = (app) =>
  app.exec(`return !!document.activeElement?.closest?.(arguments[0]);`, TEXT);

/** Presses the box of the point to tick whose words hold these, where the style sheet draws it. */
async function pressBox(app, words) {
  const at = await app.exec(
    `const p = Array.from(document.querySelectorAll(arguments[0] + ' p[data-kind="todo"]'))
       .find((e) => e.textContent.includes(arguments[1]));
     if (!p) return null;
     p.scrollIntoView({ block: 'center' });
     const r = p.getBoundingClientRect();
     const s = getComputedStyle(p);
     const em = parseFloat(s.fontSize);
     return { x: Math.round(r.left + parseFloat(s.paddingLeft) - 0.7 * em), y: Math.round(r.top + 0.8 * em) };`,
    TEXT,
    words,
  );
  if (!at) throw new Error(`no point to tick holds ${words}`);
  await app.cmd('POST', '/actions', {
    actions: [
      {
        type: 'pointer',
        id: 'mouse',
        parameters: { pointerType: 'mouse' },
        actions: [
          { type: 'pointerMove', origin: 'viewport', x: at.x, y: at.y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ],
  });
  await app.cmd('DELETE', '/actions');
}

/** The tags of the note shown. */
const tags = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('[data-tag]')).map((c) => c.dataset.tag);`);

/** The words of the chips of sources under the text, by their marks. */
const chips = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-phone-source]')).map((c) => c.dataset.phoneSource + ':' + c.textContent.trim());`,
  );

/** Whether nothing lies outside the window: the page is not wider, and every button of the rows is within it. */
const fits = (app) =>
  app.exec(
    `const w = window.innerWidth;
     const out = Array.from(document.querySelectorAll('[data-phone-bar] button, [data-phone-tools] button'))
       .filter((b) => { const r = b.getBoundingClientRect(); return r.left < 0 || r.right > w + 0.5; })
       .map((b) => b.getAttribute('aria-label') ?? b.textContent.trim());
     return { width: w, scroll: document.documentElement.scrollWidth, out };`,
  );

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-phone-note-'));
let phone;
try {
  phone = await App.launch({ args: ['--phone'], width: 412, height: 915, dataDir, keepData: true });
  await phone.installErrorHook();
  await phone.waitFor('[data-phone-notes]', 15000);

  // ---- 1. a note opened from the list, and its name ----
  const first = await makeNote(phone, { words: 'Seen at the Acropolis' });
  await openNote(phone, first);
  check('a note opens from the list', await phone.exists(`[data-phone-note="${first}"]`));
  await phone.click('[data-phone-name]');
  await phone.keys('Owls of Athens');
  await sleep(400);
  await back(phone);
  const row = await phone.text(`[data-phone-row="${first}"]`);
  check('the row of the list has the name written', row.includes('Owls of Athens'), row);
  await openNote(phone, first);
  await phone.screenshot('phone-note-1-opened');

  // ---- 2. the row of tools ----
  await phone.click(TEXT);
  await phone.keys(['Control', 'End']);
  await phone.press('Enter');
  await phone.keys('Plain ');
  await phone.click('[data-phone-tool="bold"]');
  await phone.keys('strong');
  await phone.click('[data-phone-tool="bold"]');
  await phone.keys(' plain');
  await sleep(300);
  const bold = await phone.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' strong')).map((s) => s.textContent).join('|');`,
    TEXT,
  );
  check('Bold, words, Bold: the middle words are bold', bold === 'strong', bold);
  check('the cursor stayed in the text', await inText(phone));
  const boldOn = await phone.attr('[data-phone-tool="bold"]', 'aria-pressed');
  check('Bold is shown as off again', boldOn === 'false', String(boldOn));

  await phone.press('Enter');
  await phone.click('[data-phone-tool="list"]');
  await phone.keys('Bread');
  await phone.press('Enter');
  await phone.keys('Olives');
  await sleep(300);
  let got = await paragraphs(phone);
  const items = got.filter((p) => p.kind === 'item').map((p) => p.text);
  check('List: two points', items.join('|') === 'Bread|Olives', JSON.stringify(got));
  check('List is shown as on', (await phone.attr('[data-phone-tool="list"]', 'aria-pressed')) === 'true');

  await phone.press('Enter');
  await phone.click('[data-phone-tool="todo"]');
  await phone.keys('Feed the owl');
  await sleep(900);
  await pressBox(phone, 'Feed the owl');
  await sleep(300);
  got = await paragraphs(phone);
  const point = got.find((p) => p.text === 'Feed the owl');
  check('To do: a point to tick, ticked by a press on its box', point?.kind === 'todo' && point.done, JSON.stringify(point));
  await phone.screenshot('phone-note-2-tools');

  await phone.click('[data-phone-tool="undo"]');
  await sleep(300);
  got = await paragraphs(phone);
  const untick = got.find((p) => p.text === 'Feed the owl');
  check('Undo takes the last away: the tick', untick?.kind === 'todo' && !untick.done, JSON.stringify(untick));

  // ---- 3. tags ----
  await phone.click('[data-tag-field]');
  await phone.keys('owls');
  await phone.press('Enter');
  await phone.keys('athena,');
  await sleep(200);
  // As a phone's keyboard sends a comma: in the words, with no key for it.
  await phone.exec(
    `const f = document.querySelector('[data-tag-field]');
     f.value = 'pallas,';
     f.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ',' }));
     return true;`,
  );
  await sleep(200);
  let shownTags = await tags(phone);
  check('tags added by Enter, by a comma typed, and by a comma in the words', ['athena', 'owls', 'pallas'].every((t) => shownTags.includes(t)), shownTags.join(', '));
  await phone.click('[data-tag="owls"] button');
  await sleep(200);
  shownTags = await tags(phone);
  check('a tag taken away by its x', !shownTags.includes('owls') && shownTags.length === 2, shownTags.join(', '));

  // ---- 4. the box ----
  await phone.click('[data-phone-box]');
  await phone.waitFor('[data-phone-boxes]', 3000);
  await phone.screenshot('phone-note-3-boxes');
  await phone.click('[data-phone-box-name]');
  await phone.keys('Later');
  await phone.click('[data-phone-box-new]');
  await phone.waitGone('[data-phone-boxes]', 3000).catch(() => {});
  const box = await phone.text('[data-phone-box]');
  check('New box: the note is in it, and the sheet closed', box.includes('Later') && !(await phone.exists('[data-phone-boxes]')), box);

  // ---- 5. a picture ----
  await phone.execAsync(`await window.__glaukopisPhone.picture('dot.png', arguments[0]);`, PNG);
  await phone.waitFor(`${TEXT} figure.figure img`, 5000).catch(() => {});
  check('a picture put in by the hook stands in the note', await phone.exists(`${TEXT} figure.figure img`));
  await sleep(1200);
  await back(phone);
  check('the row of the list shows it small', await phone.exists(`[data-phone-row="${first}"] img`));
  await phone.screenshot('phone-note-4-picture');

  // ---- 6. words pasted from outside, and their source ----
  const second = await makeNote(phone, {});
  await openNote(phone, second);
  await phone.click(TEXT);
  await sleep(200);
  await phone.exec(
    `const data = new DataTransfer();
     data.setData('text/plain', arguments[1]);
     document.querySelector(arguments[0]).dispatchEvent(
       new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true, composed: true }));
     return true;`,
    TEXT,
    'The owl of Athena was a sign of wisdom.',
  );
  await phone.waitFor('[data-phone-source="none"]', 4000).catch(() => {});
  let said = await chips(phone);
  check('words pasted from outside: the chip No source', said.length === 1 && said[0] === 'none:No source', said.join(' | '));
  await phone.click('[data-phone-source="none"]');
  await phone.waitFor('[data-phone-source-sheet]', 3000);
  await phone.click('[data-phone-source-url]');
  await phone.keys('https://owls.example/athena');
  await phone.click('[data-phone-source-title]');
  await phone.keys('The owl of Athena');
  await phone.screenshot('phone-note-5-source');
  await phone.click('[data-phone-source-apply]');
  await phone.waitGone('[data-phone-source-sheet]', 3000).catch(() => {});
  said = await until('the chip of the page', async () => {
    const now = await chips(phone);
    return now.some((c) => c.endsWith(':The owl of Athena')) ? now : null;
  }, 4000).catch(async () => chips(phone));
  check('a page given: the chip says its title', said.length === 1 && said[0].endsWith(':The owl of Athena'), said.join(' | '));
  await phone.click('[data-phone-source]');
  await phone.waitFor('[data-phone-own-words]', 3000);
  await phone.click('[data-phone-own-words]');
  await sleep(400);
  said = await chips(phone);
  check('My own words takes the chip away', said.length === 0, said.join(' | '));
  check('and the sheet closes, with nothing left to say', !(await phone.exists('[data-phone-source-sheet]')));
  await back(phone);

  // ---- 7. More: Delete, and Undo; Redo ----
  await openNote(phone, first);
  await phone.click('[data-phone-more]');
  await phone.waitFor('[data-phone-delete]', 3000);
  await phone.screenshot('phone-note-6-more');
  await phone.click('[data-phone-delete]');
  await phone.waitFor('[data-phone-notes]', 4000);
  await sleep(300);
  check('Delete: the notes, without it', !(await phone.exists(`[data-phone-row="${first}"]`)));
  const undoLine = await phone.findByText('.toaster button.action', 'Undo').catch(() => null);
  check('the line that says it has Undo', !!undoLine);
  if (undoLine) {
    await phone.click(undoLine);
    await phone.waitFor(`[data-phone-row="${first}"]`, 4000).catch(() => {});
  }
  check('Undo brings it back', await phone.exists(`[data-phone-row="${first}"]`));

  await openNote(phone, first);
  await phone.click('[data-tag-field]');
  await phone.keys('again');
  await phone.press('Enter');
  await sleep(800);
  await phone.click('[data-phone-tool="undo"]');
  await sleep(300);
  check('Undo in the row takes the tag away', !(await tags(phone)).includes('again'));
  await phone.click('[data-phone-more]');
  await phone.waitFor('[data-phone-redo]', 3000);
  const redoOff = await phone.exec(`return document.querySelector('[data-phone-redo]').disabled;`);
  check('Redo is there to be pressed after an undo', redoOff === false);
  await phone.click('[data-phone-redo]');
  await sleep(300);
  check('Redo brings the tag back', (await tags(phone)).includes('again'));

  // ---- 8. a note deleted while it is shown ----
  await phone.execAsync(`window.__glaukopisPhone.remove(arguments[0]);`, first);
  await phone.waitFor('[data-phone-notes]', 4000).catch(() => {});
  check('a note deleted while it is shown: the view goes back', (await phone.exists('[data-phone-notes]')) && !(await phone.exists('[data-phone-note]')));

  const errors = await phone.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await phone.close();
  phone = null;

  // ---- 9. at 320 by 568 ----
  phone = await App.launch({ args: ['--phone'], width: 320, height: 568, dataDir, keepData: true });
  await phone.installErrorHook();
  await phone.waitFor('[data-phone-notes]', 15000);
  await openNote(phone, second);
  await phone.click(TEXT);
  await sleep(300);
  const narrow = await fits(phone);
  check('at 320, nothing lies outside the window', narrow.scroll <= narrow.width && narrow.out.length === 0, JSON.stringify(narrow));
  await phone.screenshot('phone-note-7-narrow');
  await phone.click('[data-phone-box]');
  await phone.waitFor('[data-phone-boxes]', 3000);
  const sheet = await fits(phone);
  check('at 320, the sheet of the boxes lies within it', sheet.scroll <= sheet.width, JSON.stringify(sheet));
  await phone.screenshot('phone-note-8-narrow-boxes');
  const narrowErrors = await phone.pageErrors();
  check('no errors in the page at 320', narrowErrors.length === 0, narrowErrors.join(' | '));
} catch (error) {
  check('the script ran to its end', false, error.stack ?? String(error));
  await phone?.screenshot('phone-note-9-failed').catch(() => {});
} finally {
  await phone?.close().catch(() => {});
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(`${dataDir}-config`, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
