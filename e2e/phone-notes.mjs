// The phone's page, its frame and its notes (stage 2 of
// docs/plans/an-app-for-android.md, part C), through `glaukopis --phone`.
// The empty notebook says so. New note: the note is shown with the cursor
// in its text; words written; Back (the button): the row says how the note
// begins and the day. By the hook: a box, and three notes more, one with a
// name, one in the box, one with a tag; the rows say each. Found by a word,
// and the × shows all again. The filter: its button opens the sheet from
// the bottom; the box chosen shows its note alone and the button says it is
// on; a tag on; All notes again. The steps, as Android's Back takes them
// (the hook `back`, since a computer has no key for it): with the sheet
// open, Back closes the sheet and the notes stay; from a note it goes to
// the notes; a sheet closed by Done and a note opened at once ends in the
// note, and one step back is the notes; at the notes Back changes nothing.
// The settings' button goes to the settings, and Back comes back. The
// line: none while the device is in no home. A second start with Bokmål
// and dark set in the phone's settings.json: the words are Bokmål, the root
// says dark, and the notes are there. A third start at 320 by 568: the
// notes, the filter, a note and the settings are each shown, and nothing
// lies outside the window. No errors in the page.
//
// What it presses and reads beside the attributes of the plan:
// `data-phone-empty` (why there are no rows: empty, nothing-found,
// unreadable), `data-phone-find-clear` (the × of the field),
// `data-phone-filter-box` and `data-phone-filter-tag` (the rows of the
// filter's sheet), `data-phone-filter-done`, `data-phone-row-title`,
// `data-phone-row-day`, `data-phone-row-tags`, and `data-on` on the
// filter's button while a filter is on.
// Screenshots in e2e/output/phone-notes-<n>-<what>.png.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 10000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(150);
  }
}

/** A word of the Bokmål interface, as its file says it. */
function bokmal(name) {
  const file = readFileSync(join(root, 'locales', 'nb', 'notebook.ftl'), 'utf8');
  return new RegExp(`^${name} = (.*)$`, 'm').exec(file)?.[1].trim() ?? null;
}

/** The phone's settings.json, changed in part. */
function setSettings(dataDir, change) {
  const path = join(dataDir, 'settings.json');
  let kept = {};
  try {
    kept = JSON.parse(readFileSync(path, 'utf8'));
  } catch {}
  writeFileSync(path, JSON.stringify({ ...kept, ...change }));
}

const hook = (app, name, ...args) =>
  app.exec(`return window.__glaukopisPhone[arguments[0]](...arguments[1]);`, name, args);

/** The rows of the list as they read: title, day, tags. */
const rows = (app) =>
  app.exec(`return [...document.querySelectorAll('[data-phone-row]')].map((r) => ({
    id: r.dataset.phoneRow,
    title: r.querySelector('[data-phone-row-title]')?.textContent.trim() ?? '',
    day: r.querySelector('[data-phone-row-day]')?.textContent.trim() ?? '',
    tags: r.querySelector('[data-phone-row-tags]')?.textContent.trim() ?? '',
    unseen: r.hasAttribute('data-unseen'),
  }));`);
const titles = async (app) => (await rows(app)).map((r) => r.title);

/** Whether nothing of the page lies outside the window: nothing scrolls sideways, and every button of a row is within it. */
const withinWindow = (app) =>
  app.exec(`const w = window.innerWidth;
    const out = [...document.querySelectorAll('[data-phone-bar] button, [data-phone-sheet] button, [data-phone-new], [data-phone-line]')]
      .filter((b) => { const r = b.getBoundingClientRect(); return r.width && (r.left < -0.5 || r.right > w + 0.5); })
      .map((b) => b.getAttribute('aria-label') || b.textContent.trim());
    return { wide: document.documentElement.scrollWidth, w, out };`);

async function noneOutside(app, where) {
  const seen = await withinWindow(app);
  check(
    `at 320, ${where}: nothing lies outside the window`,
    seen.wide <= seen.w && seen.out.length === 0,
    `scrollWidth ${seen.wide}, width ${seen.w}${seen.out.length ? `, outside: ${seen.out.join(', ')}` : ''}`,
  );
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-phone-notes-'));
setSettings(dataDir, { theme: 'light' });
let phone;
try {
  phone = await App.launch({ args: ['--phone'], width: 412, height: 915, dataDir });
  await phone.installErrorHook();

  // ---- 1. the empty notebook ----
  await phone.waitFor('[data-phone-notes]', 15000);
  await phone.waitFor('[data-phone-empty="empty"]', 15000);
  check('the empty notebook says so', await phone.exists('[data-phone-empty="empty"]'));
  check(
    'the root says light, as the settings do',
    (await phone.exec(`return document.documentElement.dataset.theme`)) === 'light',
  );
  check('the line is not there while the device is in no home', !(await phone.exists('[data-phone-line]')));
  await phone.screenshot('phone-notes-1-empty');

  // ---- 2. a new note ----
  await phone.click('[data-phone-new]');
  await phone.waitFor('[data-phone-note]', 5000);
  const inText = await until(
    'the cursor in the note’s text',
    () => phone.exec(`return !!document.activeElement?.closest('[data-phone-note] .ProseMirror')`),
    5000,
  ).catch(() => false);
  check('a new note is shown, with the cursor in its text', inText);
  await phone.keys('Seen on the way home');
  await sleep(500);
  await phone.screenshot('phone-notes-2-new-note');
  await phone.click('[data-phone-back]');
  await phone.waitFor('[data-phone-row]', 5000);
  const [made] = await rows(phone);
  check('Back: the row says how the note begins', made?.title === 'Seen on the way home', made?.title);
  check('and the day', !!made?.day, made?.day);

  // ---- 3. notes by the hook ----
  const box = await hook(phone, 'box', 'Birds');
  await hook(phone, 'note', { name: 'Owls of Athens' });
  await hook(phone, 'note', { words: 'Kept in the box', box });
  await hook(phone, 'note', { words: 'Tagged words', tags: ['athena'] });
  await until('four rows', async () => (await rows(phone)).length === 4);
  const all = await rows(phone);
  check(
    'the rows say each, newest first: how it begins, the name',
    JSON.stringify(all.map((r) => r.title)) ===
      JSON.stringify(['Tagged words', 'Kept in the box', 'Owls of Athens', 'Seen on the way home']),
    all.map((r) => r.title).join(' | '),
  );
  check('each row says the day', all.every((r) => r.day));
  check('the row of the tagged note says its tag', all[0].tags === 'athena', all[0].tags);
  await phone.screenshot('phone-notes-3-rows');

  // ---- 4. found by a word ----
  await phone.type('[data-phone-find]', 'owls');
  await until('one row found', async () => (await rows(phone)).length === 1).catch(() => {});
  check('found by a word', JSON.stringify(await titles(phone)) === JSON.stringify(['Owls of Athens']));
  await phone.screenshot('phone-notes-4-found');
  await phone.click('[data-phone-find-clear]');
  await until('all rows again', async () => (await rows(phone)).length === 4).catch(() => {});
  check('the × shows all again', (await rows(phone)).length === 4);

  // ---- 5. the filter ----
  await phone.click('[data-phone-filter]');
  await phone.waitFor('[data-phone-sheet]', 3000);
  await sleep(400);
  const sheet = await phone.exec(
    `const r = document.querySelector('[data-phone-sheet]').getBoundingClientRect();
     return { bottom: r.bottom, left: r.left, width: r.width, h: window.innerHeight, w: window.innerWidth };`,
  );
  check(
    'the filter opens a sheet from the bottom, as wide as the window',
    Math.abs(sheet.bottom - sheet.h) < 2 && sheet.left === 0 && Math.abs(sheet.width - sheet.w) < 2,
    JSON.stringify(sheet),
  );
  await phone.screenshot('phone-notes-5-filter');
  await phone.click(`[data-phone-filter-box="${box}"]`);
  await sleep(300);
  check('the box chosen shows its note alone', JSON.stringify(await titles(phone)) === JSON.stringify(['Kept in the box']));
  check('the filter’s button says it is on', await phone.exists('[data-phone-filter][data-on]'));
  await phone.click('[data-phone-filter-box="all"]');
  await phone.click('[data-phone-filter-tag="athena"]');
  await sleep(300);
  check('a tag on shows the notes that have it', JSON.stringify(await titles(phone)) === JSON.stringify(['Tagged words']));
  await phone.click('[data-phone-filter-tag="athena"]');
  await sleep(300);
  check('All notes, and the tag off: all again', (await rows(phone)).length === 4);
  check('the filter’s button is off again', !(await phone.exists('[data-phone-filter][data-on]')));

  // ---- 6. the steps, as Android's Back takes them ----
  await hook(phone, 'back');
  await sleep(300);
  check('Back with the sheet open closes the sheet', !(await phone.exists('[data-phone-sheet]')));
  check('and the notes stay', await phone.exists('[data-phone-notes]'));

  await phone.click(`[data-phone-row="${all[2].id}"]`);
  await phone.waitFor(`[data-phone-note="${all[2].id}"]`, 3000);
  await hook(phone, 'back');
  await sleep(300);
  check('Back from a note goes to the notes', await phone.exists('[data-phone-notes]'));

  await phone.click('[data-phone-filter]');
  await phone.waitFor('[data-phone-sheet]', 3000);
  await phone.click('[data-phone-filter-done]');
  await phone.click(`[data-phone-row="${all[1].id}"]`);
  await phone.waitFor(`[data-phone-note="${all[1].id}"]`, 3000).catch(() => {});
  check('a sheet closed by Done and a note opened at once: the note', await phone.exists(`[data-phone-note="${all[1].id}"]`));
  await hook(phone, 'back');
  await sleep(300);
  check('and one step back is the notes', await phone.exists('[data-phone-notes]'));

  await hook(phone, 'back');
  await sleep(300);
  check('Back at the notes changes nothing', (await phone.exists('[data-phone-notes]')) && (await rows(phone)).length === 4);

  // ---- 7. the settings ----
  await phone.click('[data-phone-to-settings]');
  await phone.waitFor('[data-phone-settings]', 3000).catch(() => {});
  check('the settings’ button goes to the settings', await phone.exists('[data-phone-settings]'));
  await phone.screenshot('phone-notes-6-settings');
  await phone.click('[data-phone-back]');
  await phone.waitFor('[data-phone-notes]', 3000).catch(() => {});
  check('and Back comes back', await phone.exists('[data-phone-notes]'));

  const errors = await phone.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await phone.close();
  phone = null;

  // ---- 8. Bokmål and dark, at a second start ----
  setSettings(dataDir, { language: 'nb', theme: 'dark' });
  phone = await App.launch({ args: ['--phone'], width: 412, height: 915, dataDir });
  await phone.installErrorHook();
  await phone.waitFor('[data-phone-row]', 15000);
  const said = await phone.exec(
    `return { lang: document.documentElement.lang, theme: document.documentElement.dataset.theme,
       find: document.querySelector('[data-phone-find]')?.getAttribute('placeholder') };`,
  );
  check('the words of the page are Bokmål', said.lang === 'nb' && said.find === bokmal('notebook-search'), JSON.stringify(said));
  check('the root says dark', said.theme === 'dark', said.theme);
  check('the notes are there after a new start', (await rows(phone)).length === 4);
  await phone.screenshot('phone-notes-7-bokmal-dark');
  const errorsAgain = await phone.pageErrors();
  check('no errors in the page at the second start', errorsAgain.length === 0, errorsAgain.join(' | '));
  await phone.close();
  phone = null;

  // ---- 9. at 320 by 568 ----
  setSettings(dataDir, { language: 'en', theme: 'light' });
  phone = await App.launch({ args: ['--phone'], width: 320, height: 568, dataDir });
  await phone.installErrorHook();
  await phone.waitFor('[data-phone-row]', 15000);
  check('at 320, the window is 320 wide', (await phone.exec(`return window.innerWidth`)) <= 320);
  await noneOutside(phone, 'the notes');
  await phone.screenshot('phone-notes-8-narrow-notes');
  await phone.click('[data-phone-filter]');
  await phone.waitFor('[data-phone-sheet]', 3000);
  await sleep(400);
  await noneOutside(phone, 'the filter');
  await phone.screenshot('phone-notes-9-narrow-filter');
  await phone.click('[data-phone-filter-done]');
  await sleep(300);
  const [first] = await rows(phone);
  await phone.click(`[data-phone-row="${first.id}"]`);
  await phone.waitFor('[data-phone-note]', 3000);
  await sleep(400);
  await noneOutside(phone, 'a note');
  await phone.screenshot('phone-notes-10-narrow-note');
  await phone.click('[data-phone-back]');
  await phone.waitFor('[data-phone-notes]', 3000);
  await phone.click('[data-phone-to-settings]');
  await phone.waitFor('[data-phone-settings]', 3000);
  await sleep(400);
  await noneOutside(phone, 'the settings');
  await phone.screenshot('phone-notes-11-narrow-settings');
  const errorsNarrow = await phone.pageErrors();
  check('no errors in the page at 320', errorsNarrow.length === 0, errorsNarrow.join(' | '));
} catch (error) {
  check('the script ran to its end', false, error.stack ?? String(error));
  await phone?.screenshot('phone-notes-failed').catch(() => {});
} finally {
  await phone?.close().catch(() => {});
  if (!process.env.GLAUKOPIS_E2E_KEEP) {
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(`${dataDir}-config`, { recursive: true, force: true });
  }
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
