// Searching a large document: how long the application takes to answer
// while it searches the text of a map of more than a hundred thousand words,
// goes from one that was found to the next, replaces them all, and searches
// through everything. It measures, and fails only where the window would be
// felt to stand still.
//
//     node e2e/large.mjs make <dir>       makes the document, in a data directory that is kept
//     node e2e/search-large.mjs <dir>     measures the search in it
//
// Without a directory the document is made first, and thrown away after.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const given = process.argv[2];
const data = given ?? mkdtempSync(join(tmpdir(), 'glaukopis-e2e-search-large-'));
if (!given) execFileSync('node', [join(import.meta.dirname, 'large.mjs'), 'make', data], { stdio: 'inherit' });

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(whatFor, fn, ms = 8000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${whatFor}`);
    await sleep(40);
  }
}

const sorted = (list) => [...list].sort((a, b) => a - b);
const nearlyAll = (list) => Math.round(sorted(list)[Math.floor(list.length * 0.9)] ?? 0);
const middle = (list) => Math.round(sorted(list)[Math.floor(list.length / 2)] ?? 0);

const app = await App.launch({ width: 1360, height: 900, dataDir: data });
try {
  await app.installErrorHook();
  await app.waitFor('.home', 15000);
  await app.clickText('.home .card', 'Large');
  await until('the text of the map', () => app.exec(`return document.querySelectorAll('.text-view .section').length > 1`), 60000);
  await sleep(2000);
  const words = await app.exec(`return document.querySelector('.text-view footer span').textContent.trim()`);
  console.log(`      the text of the map: ${words}`);
  // The preview is closed, if it was left open: the search is measured by itself.
  if (await app.exists('.preview')) {
    await app.keys(['Control', 'p']);
    await sleep(3000);
  }

  // What is measured: from a key going down until the window has drawn what came of it,
  // and the longest time the window stood still.
  await app.exec(
    `window.__took = [];
     document.addEventListener('keydown', () => {
       const at = performance.now();
       requestAnimationFrame(() => setTimeout(() => window.__took.push(performance.now() - at), 0));
     }, true);
     window.__still = 0; window.__last = performance.now();
     window.__probe = setInterval(() => {
       const now = performance.now();
       window.__still = Math.max(window.__still, now - window.__last);
       window.__last = now;
     }, 10);`,
  );
  const took = async () => {
    const list = await app.exec(`const t = window.__took; window.__took = []; return t;`);
    const still = Math.round(await app.exec(`const s = window.__still; window.__still = 0; return s;`));
    return { list, still };
  };
  const said = () => app.exec(`return document.querySelector('.search-bar .said')?.textContent.trim() ?? ''`);
  /** Whether the bar says which is shown of how many; numbers are written in the way of the language: 12,650. */
  const counted = (text) => / of [\d,  ]+$/.test(text);
  /** How many the bar says there are. */
  const many = (text) => Number(text.replace(/^.* of /, '').replace(/\D/g, ''));

  // ---- the bar is opened, and the words are typed ----
  await app.click('.text-view .section .body');
  await sleep(500);
  await app.keys(['Control', 'f']);
  await app.waitFor('.search-bar input', 3000);
  await sleep(300);
  await took();
  let began = Date.now();
  for (const letter of 'wrath') {
    await app.keys(letter);
    await sleep(60);
  }
  const typed = Date.now();
  await until('what was found', async () => counted(await said()), 30000);
  const found = Date.now() - typed;
  let t = await took();
  console.log(`      "wrath" is found (${await said()}) ${found} ms after the last letter; a letter takes ${middle(t.list)} ms (nine in ten under ${nearlyAll(t.list)} ms); the window stood still for ${t.still} ms at the most`);
  check('the words are typed without waiting for the search', nearlyAll(t.list) < 50, `${nearlyAll(t.list)} ms`);
  check('what is found in the whole text is counted soon after', found < 1500, `${found} ms`);
  check('and the window does not stand still while it is counted', t.still < 400, `${t.still} ms`);

  // A word that is found everywhere: the text has "the" in every line.
  const wrathFound = await said();
  await app.exec(`const i = document.querySelector('.search-bar input'); i.focus(); i.select();`);
  await took();
  await app.keys('the');
  await until(
    'the',
    async () => {
      const now = await said();
      return counted(now) && many(now) !== many(wrathFound);
    },
    30000,
  );
  await sleep(600);
  t = await took();
  console.log(`      "the": ${await said()}; the window stood still for ${t.still} ms at the most`);
  check('a word found more than ten thousand times is counted without the window standing still', t.still < 400, `${t.still} ms`);

  // ---- from one to the next ----
  await app.exec(`const i = document.querySelector('.search-bar input'); i.focus(); i.select();`);
  await app.keys('wrath');
  await until('wrath again', async () => counted(await said()), 30000);
  await sleep(800);
  await took();
  began = Date.now();
  const steps = [];
  for (let i = 0; i < 40; i++) {
    const before = await said();
    const at = Date.now();
    // F3 as WebDriver names it, which the harness does not.
    await app.press(i % 13 === 12 ? '' : 'Enter');
    await until('the next', async () => (await said()) !== before, 5000);
    steps.push(Date.now() - at);
  }
  t = await took();
  console.log(`      the next is shown in ${middle(steps)} ms (nine in ten under ${nearlyAll(steps)} ms, as the driver sees it); a key takes ${middle(t.list)} ms; the window stood still for ${t.still} ms at the most`);
  check('going from one to the next is answered at once', nearlyAll(t.list) < 80, `${nearlyAll(t.list)} ms`);

  // Far down the text: the last is the one before the first.
  await app.exec(`const i = document.querySelector('.search-bar input'); i.focus();`);
  await app.press('Escape');
  await sleep(300);
  await app.keys(['Control', 'f']);
  await app.waitFor('.search-bar input', 3000);
  await until('the search again', async () => counted(await said()), 30000);
  await took();
  const beforeLast = await said();
  await app.keys(['Shift', 'Enter']);
  await until('the last', async () => (await said()) !== beforeLast, 8000);
  await sleep(400);
  t = await took();
  const last = await said();
  const shownLast = await app.exec(`let r = null; for (const x of CSS.highlights.get('search-current') ?? []) r = x; if (!r) return null; const b = r.getBoundingClientRect(); return { text: r.toString(), inView: b.top > 0 && b.bottom < innerHeight };`);
  console.log(`      the last of all (${last}) is shown, the window standing still for ${t.still} ms at the most: ${JSON.stringify(shownLast)}`);
  check('the one far down the text is shown, marked and in view', shownLast?.text === 'wrath' && shownLast.inView, JSON.stringify(shownLast));

  // ---- writing while the bar is open ----
  await app.press('Escape');
  await sleep(300);
  await app.keys(['Control', 'f']);
  await app.waitFor('.search-bar input', 3000);
  await sleep(1500);
  await app.exec(`document.querySelectorAll('.text-view .section')[30].scrollIntoView({ block: 'center' }); document.querySelectorAll('.text-view .section')[30].dataset.here = '1';`);
  await sleep(500);
  await app.click('.text-view .section[data-here] .body p');
  await sleep(1200);
  await took();
  began = Date.now();
  for (const letter of 'the wrath of gods and of men is sung') {
    await app.keys(letter);
    await sleep(60);
  }
  await sleep(1200);
  t = await took();
  console.log(`      writing with the search open: a key takes ${middle(t.list)} ms (nine in ten under ${nearlyAll(t.list)} ms); the window stood still for ${t.still} ms at the most; the bar says ${await said()}`);
  check('writing while the search is open is answered at once', nearlyAll(t.list) < 50, `${nearlyAll(t.list)} ms`);
  check('and what was written is found as well, a moment after', counted(await said()));

  // ---- all replaced, and taken back ----
  await app.exec(`document.querySelector('.search-bar input').focus()`);
  await app.keys(['Control', 'h']);
  await app.waitFor('.search-bar input[aria-label="Replace with"]', 3000);
  await app.keys('anger');
  const count = many(await said());
  await took();
  began = Date.now();
  await app.clickText('.search-bar button', 'Replace all');
  await until('all replaced', async () => /replaced$/.test(await said()), 60000);
  const replaced = Date.now() - began;
  t = await took();
  console.log(`      ${await said()} of ${count} in ${replaced} ms; the window stood still for ${t.still} ms at the most`);
  check('Replace all replaces all that is found', /replaced$/.test(await said()) && Number((await said()).replace(/\D/g, '')) === count, await said());
  await sleep(1000);
  began = Date.now();
  await app.click('button[aria-label="Undo"]');
  await until('undone', async () => counted(await said()) || /found$/.test(await said()), 60000);
  const undone = Date.now() - began;
  t = await took();
  console.log(`      one undo takes it back in ${undone} ms (${await said()}); the window stood still for ${t.still} ms at the most`);
  check('one undo takes it all back', (counted(await said()) ? many(await said()) : Number((await said()).replace(/\D/g, ''))) === count, await said());
  await app.press('Escape');
  await sleep(500);

  // ---- through everything ----
  await app.keys(['Control', 'Shift', 'f']);
  await app.waitFor('.search-view input', 5000);
  await sleep(2500);
  await took();
  began = Date.now();
  await app.keys('wrath');
  await until('what is found through everything', () => app.exec(`return document.querySelectorAll('.search-view .hit').length > 0`), 60000);
  const through = Date.now() - began;
  await sleep(500);
  t = await took();
  const told = await app.exec(`return document.querySelector('.search-view .said').textContent.replace(/\\s+/g, ' ').trim()`);
  console.log(`      through everything: ${told}, ${through} ms after the first letter, the project read from disk; the window stood still for ${t.still} ms at the most`);
  check('the search through everything reads the project without the window standing still', t.still < 400, `${t.still} ms`);
  await app.exec(`const i = document.querySelector('.search-view input'); i.focus(); i.select();`);
  await took();
  began = Date.now();
  await app.keys('achaeans');
  await until('the next words', () => app.exec(`return /Achaeans/i.test(document.querySelector('.search-view .hit mark')?.textContent ?? '')`), 30000);
  const again = Date.now() - began;
  t = await took();
  console.log(`      and again, the project kept as it was read: ${again} ms; the window stood still for ${t.still} ms at the most`);

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('search-large-failure').catch(() => {});
} finally {
  await app.close();
  if (!given) rmSync(data, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
