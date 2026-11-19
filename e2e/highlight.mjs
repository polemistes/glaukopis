// The ground of words, a highlight with a colour (record 0116). In the
// text of a project the highlighter in the bar, beside Marks, has None, the
// colours of marker pens and Another…; a colour chosen there stands behind
// the words selected, drawn as it is with dark words on it; another colour
// takes its place, and None takes it away. Ctrl+Alt+H highlights in the
// colour chosen last and takes a highlight away, and Marks has Highlight
// with that key. The first highlight has the project say the second form of
// its texts. The highlight that was a kind of words is no longer under
// Words kind. On a sheet of rich text the highlighter in the head sets the
// same, shows what is set, and takes any colour as from the system's
// chooser. The typesetting pane sets the ground of the words wherever they
// stand, in the text and on the sheet. The readable copy says them, and
// they are there, drawn the same, when the project is opened again.
// Screenshots in e2e/output/highlight-<n>-<what>.png.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as Y from 'yjs';
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

const PROSE = '.text-view .section .body .prose';
const app = await App.launch({ width: 1360, height: 880 });

/** The grounds in the text: the words of each, its colour as it is kept and as it is drawn, and whether it stands on a sheet. */
const grounds = () =>
  app.exec(
    `return Array.from(document.querySelectorAll('${PROSE} mark[data-ground]')).map((m) => ({ words: m.textContent, colour: m.dataset.ground, drawn: getComputedStyle(m).backgroundColor, sheet: !!m.closest('.rich') }));`,
  );

/** Selects a word of the text, as a hand would by double-clicking it. */
const selectWord = (word) =>
  app.exec(
    `const prose = document.querySelector('${PROSE}');
     const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT);
     for (let n = walker.nextNode(); n; n = walker.nextNode()) {
       const at = n.data.indexOf(arguments[0]);
       if (at < 0 || n.parentElement.closest('.rich-head')) continue;
       const r = document.createRange(); r.setStart(n, at); r.setEnd(n, at + arguments[0].length);
       const s = getSelection(); s.removeAllRanges(); s.addRange(r);
       return true;
     }
     return false;`,
    word,
  );

/** Chooses in the menu of the highlighter in the bar. */
async function highlight(colour) {
  await app.barMenu('data-highlight', colour);
  await sleep(300);
}

/** A project as it is on disk, as a document. */
async function onDisk(id) {
  const loaded = await app.projectLoad(id);
  const doc = new Y.Doc();
  const bytes = (b64) => Uint8Array.from(Buffer.from(b64, 'base64'));
  if (loaded.state) Y.applyUpdate(doc, bytes(loaded.state));
  for (const update of loaded.updates) Y.applyUpdate(doc, bytes(update));
  return doc;
}

/** The Typst of the preview, as last made; nothing before it is. */
function typst() {
  const found = execFileSync('find', [app.dataDir, '-name', 'document.typ'], { encoding: 'utf8' }).trim().split('\n')[0];
  return found ? readFileSync(found, 'utf8') : '';
}

try {
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Marked');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  const id = await app.execAsync(`const list = await window.__TAURI_INTERNALS__.invoke('project_list'); return list.find((p) => p.name === 'Marked')?.id ?? null;`);
  await app.click('.text-view .section .body');
  await app.keys('alpha beta gamma delta');
  await sleep(300);
  await app.installErrorHook();
  check('before any highlight, the project is of the first form of the texts', (await onDisk(id)).getMap('form').size === 0);

  // ---- in the text of a project ----
  await selectWord('beta');
  await sleep(250);
  await app.barMenu('data-highlight');
  const offered = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.trim())`);
  check('the highlighter in the bar has None, the colours of marker pens and Another…', offered[0] === 'None' && offered[1] === 'Yellow' && offered.includes('Green') && offered.includes('Pink') && offered.at(-1) === 'Another…', offered.join(' | '));
  await app.screenshot('highlight-1-menu');
  await app.clickText('.menu [role="menuitem"]', 'Green');
  let now = await until(grounds, (g) => g.length === 1, 3000);
  check('a colour chosen there stands behind the words selected', now.length === 1 && now[0].words === 'beta' && now[0].colour === '#b7eb8f' && !now[0].sheet, JSON.stringify(now));
  check('drawn in its colour, with dark words on it', now[0]?.drawn === 'rgb(183, 235, 143)' && (await app.exec(`return getComputedStyle(document.querySelector('${PROSE} mark[data-ground]')).color`)) === 'rgb(31, 37, 40)', now[0]?.drawn);
  const button = await app.exec(`return document.querySelector('[data-highlight]')?.dataset.ground ?? null`);
  check('the highlighter shows the colour of what is selected', (await selectWord('beta')) && (await until(() => app.exec(`return document.querySelector('[data-highlight]')?.dataset.ground ?? null`), (g) => g === '#b7eb8f', 3000)) === '#b7eb8f', String(button));
  await sleep(1500);
  check('the first highlight has the project say the second form of its texts', (await onDisk(id)).getMap('form').has('2'));
  await selectWord('beta');
  await sleep(200);
  await highlight('Pink');
  now = await grounds();
  check('another colour takes the place of the first', now.length === 1 && now[0].colour === '#fcc2d7', JSON.stringify(now));
  await selectWord('delta');
  await sleep(200);
  await highlight('Yellow');
  await selectWord('beta');
  await sleep(200);
  await highlight('None');
  now = await grounds();
  check('None takes it away from what is selected, and from nothing else', now.length === 1 && now[0].words === 'delta' && now[0].colour === '#ffe066', JSON.stringify(now));
  // The key: in the colour chosen last, which was the yellow; and off again.
  await selectWord('gamma');
  await sleep(200);
  await app.keys(['Control', 'Alt', 'h']);
  now = await until(grounds, (g) => g.some((m) => m.words === 'gamma'), 3000);
  check('Ctrl+Alt+H highlights in the colour chosen last', now.find((m) => m.words === 'gamma')?.colour === '#ffe066', JSON.stringify(now));
  await app.barMenu('data-marks');
  const marks = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => ({ words: e.textContent.replace(/\s+/g, ' ').trim(), checked: !!e.querySelector('svg.lucide-check') || e.getAttribute('aria-checked') === 'true' }))`);
  check('Marks has Highlight, with its key', marks.some((m) => /^Highlight\b.*Ctrl\+Alt\+H$/.test(m.words)), marks.map((m) => m.words).join(' | '));
  await app.press('Escape');
  await sleep(200);
  await selectWord('gamma');
  await sleep(200);
  await app.keys(['Control', 'Alt', 'h']);
  now = await until(grounds, (g) => !g.some((m) => m.words === 'gamma'), 3000);
  check('and takes a highlight away', now.length === 1 && now[0].words === 'delta', JSON.stringify(now));
  await app.barMenu('data-words-kind');
  const kinds = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.trim())`);
  check('the highlight that was a kind of words is no longer under Words kind', kinds.length > 3 && !kinds.some((k) => /^Highlight/.test(k)), kinds.join(' | ').slice(0, 200));
  await app.press('Escape');
  await sleep(200);

  // ---- on a sheet of rich text ----
  await app.exec(`const p = document.querySelector('${PROSE} > p'); const s = getSelection(); s.selectAllChildren(p); s.collapseToEnd();`);
  await sleep(200);
  await app.press('Enter');
  await app.insert('Rich text');
  await app.waitFor(`${PROSE} .rich [data-rich-ground]`, 5000);
  await app.keys('one two three four');
  await sleep(200);
  const head = await app.exec(`const t = document.querySelector('${PROSE} .rich [data-rich-tools]'); return { folded: !!t.querySelector('[data-rich-folded]'), fits: t.scrollWidth <= t.clientWidth, lists: t.querySelectorAll('[data-rich-list]').length };`);
  check('with the highlighter, every tool of the head is still in the row at the usual width', !head.folded && head.fits && head.lists === 2, JSON.stringify(head));
  await selectWord('two');
  await sleep(250);
  await app.click('[data-rich-ground]');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Yellow');
  now = await until(grounds, (g) => g.some((m) => m.sheet), 3000);
  const two = now.find((m) => m.words === 'two');
  check('the highlighter in the head of a sheet sets the ground of the words selected', two?.colour === '#ffe066' && two?.sheet === true && two?.drawn === 'rgb(255, 224, 102)', JSON.stringify(now));
  const tool = await until(() => app.exec(`return document.querySelector('${PROSE} .rich [data-rich-ground]')?.dataset.richGround ?? null`), (v) => v === '#ffe066', 3000);
  check('and shows what is set of them', tool === '#ffe066', tool);
  // Any colour, as from the system's chooser, which no script can press.
  await selectWord('four');
  await sleep(250);
  await app.click('[data-rich-ground]');
  await app.waitFor('.menu');
  await app.press('Escape');
  await sleep(200);
  await selectWord('four');
  await sleep(200);
  await app.exec(`window.__glaukopisGround('#3366cc')`);
  now = await until(grounds, (g) => g.some((m) => m.words === 'four'), 3000);
  check('any colour is set as from the system’s chooser', now.find((m) => m.words === 'four')?.colour === '#3366cc', JSON.stringify(now));
  await app.screenshot('highlight-2-sheet');

  // ---- the typesetting pane ----
  await app.typeset();
  const set = await until(async () => typst(), (t) => t.includes('#highlight(fill: rgb("#ffe066"))['), 30000);
  check('the typesetting pane sets the ground of the words of the sheet', /#highlight\(fill: rgb\("#ffe066"\)\)\[two\];/.test(set) && /#highlight\(fill: rgb\("#3366cc"\)\)\[four\];/.test(set), (set.match(/[^\n]*two[^\n]*/) ?? [''])[0].slice(0, 200));
  check('and that of the words of the text', /#highlight\(fill: rgb\("#ffe066"\)\)\[delta\];/.test(set) && (set.match(/#highlight\(/g) ?? []).length === 3, `${(set.match(/#highlight\(/g) ?? []).length}`);
  const pages = await until(() => app.exec(`return document.querySelectorAll('.side.typesetting .preview img, .side.typesetting .preview canvas, .side.typesetting .preview .page').length`), (n) => n > 0, 30000);
  const failed = await app.exec(`return document.querySelector('.side.typesetting [role="alert"]')?.textContent.trim() ?? ''`);
  check('the pages are made', pages > 0 && !failed, `${pages} ${failed}`);
  await sleep(1200);
  await app.screenshot('highlight-3-typeset');
  await app.typeset();

  // ---- the readable copy, and opened again ----
  const written = await grounds();
  await app.home();
  const orgPath = join(app.dataDir, 'projects', id, 'project.org');
  const org = await until(() => (existsSync(orgPath) ? readFileSync(orgPath, 'utf8') : ''), (text) => text.includes('ground=#3366cc'), 20000);
  check('the readable copy says the ground of words, on a sheet and in a text', org.includes('[delta]{ground=#ffe066}') && org.includes('[two]{ground=#ffe066}') && org.includes('[four]{ground=#3366cc}'), org.slice(org.indexOf('alpha'), org.indexOf('alpha') + 200));
  await app.go(`#/project/${encodeURIComponent(id)}`);
  await app.waitFor(`${PROSE} .rich`, 10000);
  const shown = await until(grounds, (g) => g.length === written.length, 8000);
  await app.screenshot('highlight-4-shown');
  check(
    'opened again, the grounds are there and drawn the same where the text is only shown',
    shown.length === 3 && shown.every((m, i) => m.words === written[i].words && m.colour === written[i].colour && m.drawn === written[i].drawn && m.sheet === written[i].sheet),
    `${JSON.stringify(shown)} ${JSON.stringify(written)}`,
  );

  const errors = await app.pageErrors();
  check('the page said nothing was wrong', errors.length === 0, JSON.stringify(errors).slice(0, 400));
} catch (e) {
  check('the script ran to its end', false, e?.message ?? String(e));
  await app.screenshot('highlight-stopped').catch(() => {});
} finally {
  await app.close().catch(() => {});
}

const failedChecks = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failedChecks.length} of ${checks.length} checks passed`);
process.exit(failedChecks.length ? 1 : 0);
