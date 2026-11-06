// What the application holds in memory (record 0087): a book of 40,000
// words in 12 chapters is brought in from an Org file, read in the text
// view, typeset, and closed, and what each process holds is printed at
// each state, as a table of PSS, RSS and anonymous memory in megabytes.
// It measures, and fails only where memory is kept that should not be:
// where the Rust process, twenty seconds after the typeset project was
// closed, holds more than 80 MB over what it held at the start screen (the
// allocator keeps some of what was freed; a document kept is hundreds), or
// a child of the typesetting is still alive then. The page's memory is
// printed and not judged: the web process gives memory back when it will.
//
//     node e2e/memory.mjs        makes its book and measures
//
// With GLAUKOPIS_E2E_BINARY another build of the application is measured,
// so that two can be compared. The book is made the same way every run,
// from a seeded generator, so that the numbers compare. Where the ⋯ menu
// of the list of projects has New window, a second window is measured at
// the start screen as well; where it has not, that state is passed over.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** The most the Rust process may hold, twenty seconds after the typeset project was closed, over what it held at the start screen, in megabytes. */
const KEPT_MOST = 80;

/** The task of the child that sets the typesetting pane's document. */
const TYPESETTING = 'typeset-serve';

// --- The book ---

/** A generator of numbers from a seed (mulberry32): the same book every run. */
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WORDS = (
  'the of and to a in that is was he for it with as his on be at by had not are but from or have ' +
  'an they which one you were her all she there would their we him been has when who will more no ' +
  'if out so said what up its about into than them can only other new some could time these two ' +
  'may then do first any my now such like our over man me even most made after also did many before ' +
  'must through back years where much your way well down should because each just those people how ' +
  'too little state good very make world still own see men work long get here between both life being ' +
  'under never day same another know while last might us great old year off come since against go ' +
  'came right used take three sea ship shore wind river house field stone road light morning evening ' +
  'letter book voice hand word silence answer question memory winter summer harbour island mountain'
).split(' ');

/** An Org file of `chapters` chapters and about `words` words, its paragraphs of sentences of the words above. */
function book(words, chapters) {
  const random = seeded(87);
  const pick = () => WORDS[Math.floor(random() * WORDS.length)];
  const sentence = () => {
    const length = 6 + Math.floor(random() * 12);
    const said = Array.from({ length }, pick).join(' ');
    return said[0].toUpperCase() + said.slice(1) + '.';
  };
  const lines = ['#+TITLE: The memory book', ''];
  const perChapter = Math.round(words / chapters);
  let total = 0;
  for (let c = 1; c <= chapters; c++) {
    lines.push(`* Chapter ${c}`, '');
    let inChapter = 0;
    while (inChapter < perChapter) {
      const paragraph = [];
      const sentences = 4 + Math.floor(random() * 6);
      for (let s = 0; s < sentences; s++) paragraph.push(sentence());
      const text = paragraph.join(' ');
      inChapter += text.split(' ').length;
      lines.push(text, '');
    }
    total += inChapter;
  }
  return { text: lines.join('\n'), words: total };
}

// --- The memory ---

const mb = (kb) => Math.round(kb / 1024);

/** What a process is, for the table: the Rust process is the driver's child. */
function role(process, rustPid) {
  if (process.pid === rustPid) return 'Rust';
  if (/^WebKitWebProc/.test(process.name)) return 'Web';
  if (/^WebKitNetwork/.test(process.name)) return 'Network';
  if (process.name === TYPESETTING) return 'Typesetting';
  return 'Other';
}

const states = [];

/** Measures every process of the application, prints the table of the state, and keeps it. */
function measure(app, state) {
  const rustPid = app.appPids()[0];
  const processes = app.memory();
  const rows = processes.map((p) => ({ ...p, role: role(p, rustPid) }));
  const sum = (field) => rows.reduce((total, p) => total + p[field], 0);
  console.log(`\n      ${state}`);
  console.log('      process                          PSS     RSS    anon  (MB)');
  for (const p of rows) {
    const label = `${p.role} (${p.name} ${p.pid})`.padEnd(30);
    console.log(
      `      ${label} ${String(mb(p.pss)).padStart(7)} ${String(mb(p.rss)).padStart(7)} ${String(mb(p.anonymous)).padStart(7)}`,
    );
  }
  console.log(
    `      ${'together'.padEnd(30)} ${String(mb(sum('pss'))).padStart(7)} ${String(mb(sum('rss'))).padStart(7)} ${String(mb(sum('anonymous'))).padStart(7)}`,
  );
  const byRole = {};
  for (const p of rows) byRole[p.role] = (byRole[p.role] ?? 0) + p.pss;
  const kept = { state, byRole, together: sum('pss'), rows };
  states.push(kept);
  return kept;
}

/** Waits for the page to settle, then measures. */
async function settled(app, state, seconds) {
  await sleep(seconds * 1000);
  return measure(app, state);
}

/** The summary of every state, by what each process is, PSS in megabytes, as record 0087's table. */
function summary() {
  const roles = ['Rust', 'Web', 'Network', 'Typesetting', 'Other'];
  const shown = roles.filter((r) => states.some((s) => s.byRole[r]));
  console.log('\n      | State | ' + shown.join(' | ') + ' | Together (MB) |');
  console.log('      | --- | ' + shown.map(() => '---').join(' | ') + ' | --- |');
  for (const s of states) {
    console.log(
      `      | ${s.state} | ${shown.map((r) => mb(s.byRole[r] ?? 0)).join(' | ')} | ${mb(s.together)} |`,
    );
  }
}

// --- The run ---

const place = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-memory-'));
const made = book(40000, 12);
const orgFile = join(place, 'memory-book.org');
writeFileSync(orgFile, made.text);
console.log(`      the book: ${made.words} words in 12 chapters, ${Math.round(made.text.length / 1024)} kB of Org`);

const app = await App.launch({ width: 1500, height: 920 });
try {
  await app.installErrorHook();
  await app.waitFor('[data-start]', 15000);
  const start = await settled(app, 'Start screen, nothing open', 5);

  // --- The book, brought in from its Org file and read in the text view ---
  const opening = Date.now();
  await app.exec(`void window.__glaukopisOrg.open(arguments[0])`, orgFile);
  await app.waitFor('.text-view .section, .diagram .node.root', 60000);
  if (!(await app.exists('.text-view .section'))) {
    await app.view('text');
    await app.waitFor('.text-view .section', 20000);
  }
  console.log(`      the book was brought in and opened in ${Date.now() - opening} ms`);
  const name = await app.execAsync(
    `const list = await window.__TAURI_INTERNALS__.invoke('project_list');
     return list.find((p) => p.name.includes('memory'))?.name ?? list[0]?.name ?? null;`,
  );
  check('the book is a project', !!name, name ?? '');
  await settled(app, 'The book open in the text view', 10);

  // --- Typeset: the time to the first page, from the press of the button ---
  await app.exec(
    `window.__memoryAsked = performance.now(); window.__memoryCame = null;
     const watching = setInterval(() => {
       if (document.querySelector('.preview .page img')) {
         window.__memoryCame = performance.now();
         clearInterval(watching);
       }
     }, 20);`,
  );
  await app.typeset();
  await app.waitUntil('return window.__memoryCame !== null', 120000, 'the first page of the book');
  const firstPage = await app.exec('return Math.round(window.__memoryCame - window.__memoryAsked)');
  const pages = await app.exec(`return Number(document.querySelector('.preview .pages')?.dataset.count ?? 0)`);
  console.log(`      the first page came ${firstPage} ms after the pane was asked for; the book has ${pages} pages`);
  check('the book is typeset', pages > 1, `${pages} pages`);
  await app.screenshot('memory-1-typeset');
  const typesetting = await settled(app, 'The typesetting pane open, its first pages come', 5);
  const children = typesetting.rows.filter((p) => p.role === 'Typesetting');
  console.log(`      children of the typesetting while the pane is open: ${children.length}`);

  // --- The pane closed, and the project closed ---
  const stillOpen = await app.typeset();
  check('the typesetting pane closes', !stillOpen);
  await app.home();
  const closed = await settled(app, 'Pane and project closed, twenty seconds later', 20);
  const rustStart = start.byRole.Rust ?? 0;
  const rustClosed = closed.byRole.Rust ?? 0;
  check(
    `the Rust process holds no more than ${KEPT_MOST} MB over the start screen once the typeset project is closed`,
    mb(rustClosed - rustStart) <= KEPT_MOST,
    `${mb(rustStart)} MB at the start, ${mb(rustClosed)} MB now, ${mb(rustClosed - rustStart)} MB over`,
  );
  const left = closed.rows.filter((p) => p.role === 'Typesetting');
  check(
    'no child of the typesetting is alive once the project is closed',
    left.length === 0,
    left.map((p) => `${p.pid}, ${mb(p.pss)} MB`).join('; '),
  );

  // --- The book opened again, and closed again ---
  await app.openProject(name);
  await app.waitFor('.text-view .section, .diagram .node.root', 30000);
  await sleep(5000);
  await app.home();
  await settled(app, 'The book opened again and closed again', 10);

  // --- A second window, where the ⋯ menu has New window ---
  await app.click('[data-projects-more]');
  await sleep(300);
  const item = await app.findByText('[role="menuitem"]', 'New window').catch(() => null);
  if (item) {
    await app.click(item);
    await sleep(3000);
    await settled(app, 'A second window open at the start screen', 10);
  } else {
    await app.press('Escape');
    console.log('      the ⋯ menu has no New window: the second window is passed over');
  }

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
  summary();
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error?.message ?? error));
  await app.screenshot('memory-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(place, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
