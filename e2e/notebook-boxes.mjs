// The boxes and the tags of the notebook, Join and Divide (stage 2 of the
// notebook): the first box, Unsorted, holds what is made; a box made with
// the + and named in place; a note dragged onto it from the list is there
// and no longer in the first; Move to from the menu of the right button; the
// box renamed by F2, another made and dragged above it, the first deleted
// from its menu after the question, its notes back in the first; a tag given
// to a note in the field under its name, offered again on another note as
// it is typed, standing in the column with its count, a press on it showing
// only its notes; renamed in place, made one with another after the
// question, and removed from all notes; two notes joined from the menu are
// one with both texts and both tags, and Undo in the message makes them two,
// and the same by Ctrl+J; a note divided at the cursor by Ctrl+Shift+D is
// two, and what was selected lifted out by the button Divide is a note of
// its own; a box shown as its surface on a new installation, Surface | List
// kept for a box across going to the library and back; the note opened
// beside the surface by the route and closed by its ×, and by Escape; all of
// it there after the application is closed and opened again; no errors in
// the page. Screenshots in e2e/output/notebook-boxes-<n>-<what>.png.

import { mkdtempSync, rmSync } from 'node:fs';
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

// The data folder is the script's, kept between the two runs of the application.
const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-notebook-boxes-'));

// ---- what the script reads of the page ----
const ROWS = '[data-notes] [role="option"]';
/** The titles of the rows of the list, as they stand. */
const titles = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${ROWS} .title')).map((t) => t.textContent.trim())`,
  );
/** The boxes in the column, in their order: name, count, and whether in view. */
const boxes = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-box-row]')).filter((r) => r.dataset.boxRow !== 'all').map((r) => ({ id: r.dataset.boxRow, name: r.querySelector('.name').textContent.trim(), count: r.querySelector('.count').textContent.trim(), on: r.getAttribute('aria-pressed') === 'true' }))`,
  );
/** The tags in the column: name, count, and whether on. */
const tagRows = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-tag-row]')).map((r) => ({ tag: r.dataset.tagRow, count: r.querySelector('.count').textContent.trim(), on: r.getAttribute('aria-pressed') === 'true' }))`,
  );
/** The tags of the note chosen, as its chips say them. */
const noteTags = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-note-editor] [data-note-tags] [data-tag]')).map((c) => c.dataset.tag)`,
  );
/** The words of the text of the note shown. */
const noteText = (app) =>
  app.exec(`return document.querySelector('[data-note-text] .ProseMirror')?.textContent ?? ''`);
/** How the box in view is shown: 'surface' or 'list'. */
const shownAs = (app) => app.exec(`return document.querySelector('[data-notebook]')?.dataset.shownAs ?? ''`);
/** The row of a box by its name. */
const boxRow = (app, name) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-box-row]')).find((r) => r.querySelector('.name')?.textContent.trim() === arguments[0]) ?? null`,
    name,
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
/** Shows a box, or All notes, by its row. */
async function showBox(app, name) {
  if (name === 'All notes') await app.click('[data-box-row="all"]');
  else await app.click(await boxRow(app, name));
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
/** Chooses an item of the menu open now, in a submenu where one is named. */
async function chooseItem(app, submenu, item) {
  await menuItems(app);
  if (submenu) {
    await app.clickText('.menu [role="menuitem"]', submenu);
    await sleep(250);
  }
  await app.clickText('.menu [role="menuitem"]', item);
  await sleep(300);
}
/** The question asked: its title, and its message. */
async function question(app) {
  await app.waitFor('dialog[open]', 3000);
  await sleep(200);
  return app.text('dialog[open]');
}
/** Answers the question asked with its button that does it (the last of its foot). */
async function answerYes(app) {
  await app.exec(
    `Array.from(document.querySelectorAll('dialog[open] footer button')).pop().click(); return null;`,
  );
  await app.waitGone('dialog[open]', 3000).catch(() => {});
  await sleep(300);
}
/** Writes a new note by the button over the list: its text, in paragraphs. */
async function newNote(app, ...paragraphs) {
  await app.click('[data-new-note]');
  await app.waitUntil(
    `return !!document.activeElement?.closest?.('[data-note-text]')`,
    3000,
    'the text of the new note to have the cursor',
  );
  for (const [i, words] of paragraphs.entries()) {
    if (i) await app.press('Enter');
    await app.keys(words);
  }
  await sleep(400);
}
/** Gives the note chosen a tag in the field under its name: by typing it, or the one offered first. */
async function tag(app, typed, { offered = false } = {}) {
  await app.click('[data-note-editor] [data-tag-field]');
  await app.keys(typed);
  if (offered) {
    await app.waitFor('[data-tags-offered] [data-offered]', 3000);
    await app.press('ArrowDown');
  }
  await app.press('Enter');
  await sleep(300);
}

// ---- Run 1 ----
let app = await App.launch({ dataDir, keepData: true, width: 1360, height: 880 });
let ids = {};
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.keys(['Control', '3']);
  await app.waitFor('[data-notebook-empty]', 8000);

  // The column: All notes, and the first box, Unsorted.
  let column = await boxes(app);
  check(
    'the column has the first box, Unsorted, empty',
    column.length === 1 && column[0].name === 'Unsorted' && column[0].count === '0',
    JSON.stringify(column),
  );
  check('All notes is in view on a new installation', await app.exec(`return document.querySelector('[data-box-row="all"]').getAttribute('aria-pressed') === 'true'`));

  // Three notes, made in the first box.
  await app.clickText('[data-notebook-empty] button', 'New note');
  await app.waitUntil(`return !!document.activeElement?.closest?.('[data-note-text]')`, 3000, 'the cursor in the new note');
  await app.keys('Athena keeps an owl.');
  await sleep(300);
  await newNote(app, 'Hermes carries messages.');
  await newNote(app, 'Apollo plays the lyre.');
  const three = await until(() => titles(app), (t) => t.length === 3);
  column = await until(() => boxes(app), (b) => b[0]?.count === '3');
  check('the first box holds what is made', three.length === 3 && column[0].count === '3', `${three.join(' | ')} / ${JSON.stringify(column)}`);
  await app.screenshot('notebook-boxes-1-three-notes');

  // A box made with the + and named in place: it comes into view, as its surface.
  await app.click('[data-new-box]');
  await app.waitFor('[data-box-column] [data-naming]', 3000);
  await app.keys('Gods');
  await app.press('Enter');
  column = await until(() => boxes(app), (b) => b.some((x) => x.name === 'Gods'));
  const gods = column.find((b) => b.name === 'Gods');
  check('a box is made and named in place', !!gods && gods.count === '0', JSON.stringify(column));
  check('the new box is in view', !!gods?.on);
  check('a box is shown as its surface on a new installation', (await shownAs(app)) === 'surface' && (await app.exists('[data-surface]')));
  await app.screenshot('notebook-boxes-2-box-made');

  // A note dragged onto it from the list of all notes.
  await showBox(app, 'All notes');
  await app.waitFor(ROWS, 3000);
  await app.drag(await app.findByText(ROWS, 'Hermes carries'), await boxRow(app, 'Gods'));
  column = await until(() => boxes(app), (b) => b.find((x) => x.name === 'Gods')?.count === '1');
  check(
    'a note dragged onto a box is there, and no longer in the first',
    column.find((x) => x.name === 'Gods')?.count === '1' && column[0].count === '2',
    JSON.stringify(column),
  );
  await showBox(app, 'Gods');
  await app.click('[data-shown-as-choice] [role="radio"][aria-label="List"]');
  await app.waitFor(ROWS, 3000);
  const inGods = await titles(app);
  check('the box shown as a list holds the note', inGods.length === 1 && inGods[0].startsWith('Hermes'), inGods.join(' | '));
  await app.screenshot('notebook-boxes-3-dragged');

  // Surface | List is kept for each box.
  await showBox(app, 'Unsorted');
  check('another box is still shown as its surface', (await shownAs(app)) === 'surface');
  await showBox(app, 'Gods');
  check('the box shown as a list is a list again when it is shown again', (await shownAs(app)) === 'list');
  await app.keys(['Control', '2']);
  await app.waitFor('.library', 8000);
  await app.keys(['Control', '3']);
  await app.waitFor('[data-notebook]', 8000);
  await sleep(500);
  check(
    'after the library and back, the box is in view and still a list',
    (await shownAs(app)) === 'list' && (await boxes(app)).find((b) => b.name === 'Gods')?.on === true,
  );

  // Move to, from the menu of the right button.
  await showBox(app, 'All notes');
  await app.rightClick(await app.findByText(ROWS, 'Apollo plays'));
  const noteMenu = await menuItems(app);
  check('the menu of a note offers Open, Move to and Delete', ['Open', 'Move to', 'Delete'].every((w) => noteMenu.some((m) => m.startsWith(w))), noteMenu.join(' | '));
  await chooseItem(app, 'Move to', 'Gods');
  column = await until(() => boxes(app), (b) => b.find((x) => x.name === 'Gods')?.count === '2');
  check('Move to moves the note to the box', column.find((x) => x.name === 'Gods')?.count === '2' && column[0].count === '1', JSON.stringify(column));

  // The box renamed by F2, in place, while its row has the focus.
  await app.click(await boxRow(app, 'Gods'));
  await app.exec(`arguments[0].focus(); return null;`, await boxRow(app, 'Gods'));
  await app.press('F2');
  await app.waitFor('[data-box-column] [data-naming]', 3000);
  await app.keys('Olympians');
  await app.press('Enter');
  column = await until(() => boxes(app), (b) => b.some((x) => x.name === 'Olympians'));
  check('a box is renamed in place', column.some((x) => x.name === 'Olympians') && !column.some((x) => x.name === 'Gods'), JSON.stringify(column));

  // Another box, dragged above it.
  await app.click('[data-new-box]');
  await app.waitFor('[data-box-column] [data-naming]', 3000);
  await app.keys('Heroes');
  await app.press('Enter');
  await until(() => boxes(app), (b) => b.some((x) => x.name === 'Heroes'));
  const offset = await app.exec(
    `const rows = Array.from(document.querySelectorAll('[data-box-row]'));
     const at = (name) => rows.find((r) => r.querySelector('.name')?.textContent.trim() === name).getBoundingClientRect();
     const from = at('Heroes'), to = at('Olympians');
     // To the upper part of the row of Olympians, from the middle of Heroes.
     return { dx: Math.round(to.left + to.width / 2 - (from.left + from.width / 2)), dy: Math.round(to.top + 6 - (from.top + from.height / 2)) };`,
  );
  await app.drag(await boxRow(app, 'Heroes'), offset);
  column = await until(() => boxes(app), (b) => b[1]?.name === 'Heroes');
  check('a box is dragged above another', column.map((b) => b.name).join(',') === 'Unsorted,Heroes,Olympians', column.map((b) => b.name).join(','));
  await app.screenshot('notebook-boxes-4-boxes');

  // The box deleted from its menu, after the question: its notes go back to the first.
  await app.rightClick(await boxRow(app, 'Olympians'));
  const boxMenu = await menuItems(app);
  check('the menu of a box offers Rename and Delete', boxMenu.length === 2 && boxMenu[0].startsWith('Rename') && boxMenu[1].startsWith('Delete'), boxMenu.join(' | '));
  await chooseItem(app, null, 'Delete');
  const asked = await question(app);
  check('deleting a box that holds notes is asked first', asked.includes('Delete Olympians?') && asked.includes('2 notes in it go to Unsorted'), asked.replace(/\s+/g, ' '));
  await app.screenshot('notebook-boxes-5-delete-asked');
  await answerYes(app);
  column = await until(() => boxes(app), (b) => !b.some((x) => x.name === 'Olympians'));
  check('the box is gone, and its notes are back in the first', !column.some((x) => x.name === 'Olympians') && column[0].count === '3', JSON.stringify(column));
  await app.rightClick(await boxRow(app, 'Unsorted'));
  const firstMenu = await menuItems(app);
  check('the first box is never deleted: its menu does not offer it', firstMenu.length === 1 && firstMenu[0].startsWith('Rename'), firstMenu.join(' | '));
  await app.press('Escape');
  await sleep(200);

  // Tags: given in the field, offered again as typed, in the column with their counts.
  await showBox(app, 'All notes');
  await chooseNote(app, 'Athena keeps');
  await tag(app, 'owls');
  check('a tag given in the field stands under the name', (await noteTags(app)).join(',') === 'owls', (await noteTags(app)).join(','));
  await chooseNote(app, 'Hermes carries');
  await app.click('[data-note-editor] [data-tag-field]');
  await app.keys('ow');
  await app.waitFor('[data-tags-offered] [data-offered]', 3000).catch(() => {});
  const offered = await app.exec(`return Array.from(document.querySelectorAll('[data-tags-offered] [data-offered]')).map((o) => o.dataset.offered)`);
  check('a tag there is is offered on another note as it is typed', offered.join(',') === 'owls', offered.join(','));
  await app.screenshot('notebook-boxes-6-tag-offered');
  await app.press('ArrowDown');
  await app.press('Enter');
  await sleep(300);
  check('the tag offered is taken by Enter', (await noteTags(app)).join(',') === 'owls', (await noteTags(app)).join(','));
  await chooseNote(app, 'Apollo plays');
  await tag(app, 'music');
  let tags = await until(() => tagRows(app), (t) => t.length === 2);
  check('the tags stand in the column with their counts', JSON.stringify(tags.map((t) => [t.tag, t.count])) === JSON.stringify([['music', '1'], ['owls', '2']]), JSON.stringify(tags));

  // A press on a tag shows only its notes; a press again, all.
  await app.click('[data-tag-row="owls"]');
  let found = await until(() => titles(app), (t) => t.length === 2);
  check('a press on a tag shows only the notes that have it', found.length === 2 && found.every((t) => /Athena|Hermes/.test(t)), found.join(' | '));
  check('and the tag is marked on', (await tagRows(app)).find((t) => t.tag === 'owls')?.on === true);
  await app.screenshot('notebook-boxes-7-tag-on');
  await app.click('[data-tag-row="owls"]');
  found = await until(() => titles(app), (t) => t.length === 3);
  check('a press again shows all', found.length === 3, found.join(' | '));

  // Renamed in place; made one with another, after the question; removed from all notes.
  await app.rightClick('[data-tag-row="owls"]');
  const tagMenu = await menuItems(app);
  check('the menu of a tag offers Rename and Remove from all notes', tagMenu.length === 2 && tagMenu[0].startsWith('Rename') && tagMenu[1].startsWith('Remove from all notes'), tagMenu.join(' | '));
  await chooseItem(app, null, 'Rename');
  await app.waitFor('[data-box-column] [data-naming]', 3000);
  await app.keys('birds');
  await app.press('Enter');
  tags = await until(() => tagRows(app), (t) => t.some((x) => x.tag === 'birds'));
  check('a tag is renamed in place, on every note that has it', tags.some((t) => t.tag === 'birds' && t.count === '2') && !tags.some((t) => t.tag === 'owls'), JSON.stringify(tags));
  await app.rightClick('[data-tag-row="music"]');
  await chooseItem(app, null, 'Rename');
  await app.waitFor('[data-box-column] [data-naming]', 3000);
  await app.keys('birds');
  await app.press('Enter');
  const merge = await question(app);
  check('renamed to a tag that is there, the two will be one tag: asked first', merge.includes('music and birds will be one tag'), merge.replace(/\s+/g, ' '));
  await answerYes(app);
  tags = await until(() => tagRows(app), (t) => t.length === 1);
  check('and they are one', tags.length === 1 && tags[0].tag === 'birds' && tags[0].count === '3', JSON.stringify(tags));
  await app.rightClick('[data-tag-row="birds"]');
  await chooseItem(app, null, 'Remove from all notes');
  const removing = await question(app);
  check('removing a tag from all notes is asked first', removing.includes('Remove birds from all notes?') && removing.includes('3 notes have it'), removing.replace(/\s+/g, ' '));
  await answerYes(app);
  await until(() => tagRows(app), (t) => t.length === 0);
  check('the tag is removed from all notes, and the tags are no longer shown', !(await app.exists('[data-tag-row]')) && !(await app.exists('.tags-heading')));
  await app.screenshot('notebook-boxes-8-tags-gone');

  // Join, from the menu: one note with both texts and both tags; Undo makes them two.
  await chooseNote(app, 'Athena keeps');
  await tag(app, 'wisdom');
  await chooseNote(app, 'Hermes carries');
  await tag(app, 'messages');
  await app.exec(`document.querySelector('[data-notes]').focus(); return null;`);
  await app.keys(['Shift', 'ArrowDown']);
  await sleep(300);
  check('two notes are selected', (await app.count(`${ROWS}[aria-selected="true"]`)) === 2);
  await app.rightClick(await app.findByText(`${ROWS}[aria-selected="true"]`, 'Hermes carries'));
  const twoMenu = await menuItems(app);
  check('the menu of two notes offers Join, and not Open', twoMenu.some((m) => m.startsWith('Join')) && !twoMenu.some((m) => m.startsWith('Open')), twoMenu.join(' | '));
  await chooseItem(app, null, 'Join');
  let joined = await until(() => titles(app), (t) => t.length === 2);
  let text = await until(() => noteText(app), (t) => t.includes('Athena'));
  check(
    'two notes joined are one, with both texts, the one higher in the list first',
    joined.length === 2 && text.includes('Hermes carries messages.') && text.includes('Athena keeps an owl.') && text.indexOf('Hermes') < text.indexOf('Athena'),
    `${joined.join(' | ')} / ${text}`,
  );
  check('and with both tags', (await noteTags(app)).join(',') === 'messages,wisdom', (await noteTags(app)).join(','));
  await app.waitForText('.toaster .toast', '2 notes joined', 3000);
  await app.screenshot('notebook-boxes-9-joined');
  await app.clickText('.toaster .toast .action', 'Undo');
  const two = await until(() => titles(app), (t) => t.length === 3);
  check('Undo in the message makes them two again', two.length === 3, two.join(' | '));

  // Join by Ctrl+J, and Undo again.
  await chooseNote(app, 'Hermes carries');
  await app.exec(`document.querySelector('[data-notes]').focus(); return null;`);
  await app.keys(['Shift', 'ArrowDown']);
  await sleep(200);
  await app.keys(['Control', 'j']);
  joined = await until(() => titles(app), (t) => t.length === 2);
  check('Ctrl+J joins the notes selected', joined.length === 2, joined.join(' | '));
  await app.waitForText('.toaster .toast .action', 'Undo', 3000);
  await app.clickText('.toaster .toast .action', 'Undo');
  await until(() => titles(app), (t) => t.length === 3);

  // Divide at the cursor, by Ctrl+Shift+D.
  await newNote(app, 'First thought', 'Second thought');
  await app.press('Home');
  await sleep(200);
  check('Divide is offered while the text has the cursor', await app.exec(`return !document.querySelector('[data-note-editor] [data-divide]').disabled`));
  await app.keys(['Control', 'Shift', 'd']);
  const divided = await until(() => titles(app), (t) => t.length === 5);
  text = await until(() => noteText(app), (t) => t === 'Second thought');
  check(
    'a note divided at the cursor is two, and the new one is chosen',
    divided.includes('First thought') && divided.includes('Second thought') && text === 'Second thought',
    `${divided.join(' | ')} / ${text}`,
  );
  await app.screenshot('notebook-boxes-10-divided');

  // What is selected lifted out, by the button Divide.
  await chooseNote(app, 'Apollo plays');
  await app.click('[data-note-text] .ProseMirror');
  await app.press('End');
  for (let i = 0; i < 'the lyre.'.length; i++) await app.keys(['Shift', 'ArrowLeft']);
  await sleep(200);
  await app.click('[data-note-editor] [data-divide]');
  const lifted = await until(() => titles(app), (t) => t.length === 6);
  text = await until(() => noteText(app), (t) => t === 'the lyre.');
  check('what was selected is lifted out into a note of its own, which is chosen', lifted.includes('the lyre.') && text === 'the lyre.', `${lifted.join(' | ')} / ${text}`);
  await chooseNote(app, 'Apollo plays');
  const left = await noteText(app);
  check('and is no longer in the note it was lifted from', left.trim() === 'Apollo plays', left);
  await app.screenshot('notebook-boxes-11-lifted');

  // The note opened beside the surface by the route, closed by its ×, and by Escape.
  ids = await app.exec(
    `const out = {}; for (const r of document.querySelectorAll('${ROWS}')) out[r.querySelector('.title').textContent.trim()] = r.dataset.note; return out;`,
  );
  await showBox(app, 'Unsorted');
  check('the first box is shown as its surface', (await shownAs(app)) === 'surface');
  check('beside the surface, no note is open', !(await app.exists('[data-note-beside]')));
  await app.go(`#/notebook?note=${ids['First thought']}`);
  await app.waitFor('[data-note-beside] [data-note-editor]', 5000).catch(() => {});
  check('a note named by the route is opened beside the surface', await app.exists('[data-note-beside] [data-note-editor]'));
  await app.screenshot('notebook-boxes-12-beside');
  await app.click('[data-note-beside] [data-close-note]');
  await app.waitGone('[data-note-beside]', 3000).catch(() => {});
  check('the × closes it, and the surface has the whole width', !(await app.exists('[data-note-beside]')));
  await app.go(`#/notebook?note=${ids['Second thought']}`);
  await app.waitFor('[data-note-beside] [data-note-name]', 5000);
  await app.click('[data-note-beside] [data-note-name]');
  await app.press('Escape');
  await app.waitGone('[data-note-beside]', 3000).catch(() => {});
  check('Escape outside its text closes it too', !(await app.exists('[data-note-beside]')));

  // Heroes shown as a list, to be seen again after the application is opened again.
  await showBox(app, 'Heroes');
  await app.click('[data-shown-as-choice] [role="radio"][aria-label="List"]');
  await sleep(300);
  await showBox(app, 'All notes');
  await sleep(1500);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await app.quit();
} catch (error) {
  console.error(error);
  await app.screenshot('notebook-boxes-failure').catch(() => {});
  checks.push({ name: 'the first run completed', ok: false });
  await app.close().catch(() => {});
}

// ---- Run 2: the same data folder ----
app = await App.launch({ dataDir, keepData: true, width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitFor('#app > *', 15000);
  await app.go('#/notebook');
  await app.waitFor('[data-box-column]', 10000);
  const column = await until(() => boxes(app), (b) => b.length === 2);
  check(
    'the boxes are there after the application is closed and opened again, in their order',
    column.map((b) => `${b.name}:${b.count}`).join(',') === 'Unsorted:6,Heroes:0',
    JSON.stringify(column),
  );
  check('All notes is in view, as it was left', await app.exec(`return document.querySelector('[data-box-row="all"]').getAttribute('aria-pressed') === 'true'`));
  const kept = await until(() => titles(app), (t) => t.length === 6, 8000);
  check(
    'the notes divided and lifted out are there',
    ['First thought', 'Second thought', 'the lyre.', 'Apollo plays'].every((w) => kept.some((t) => t.startsWith(w))),
    kept.join(' | '),
  );
  await chooseNote(app, 'Athena keeps');
  check('a note still has its tags', (await noteTags(app)).join(',') === 'wisdom', (await noteTags(app)).join(','));
  check('and the tags stand in the column', (await tagRows(app)).map((t) => t.tag).join(',') === 'messages,wisdom');
  await showBox(app, 'Heroes');
  check('a box shown as a list is still a list', (await shownAs(app)) === 'list');
  await showBox(app, 'Unsorted');
  check('and the first box still its surface', (await shownAs(app)) === 'surface');
  await app.screenshot('notebook-boxes-13-again');

  const errors = await app.pageErrors();
  check('no errors in the page after opening again', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('notebook-boxes-failure-again').catch(() => {});
  checks.push({ name: 'the second run completed', ok: false });
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
