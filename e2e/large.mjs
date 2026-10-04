// A large document: how long the application takes to answer when it is
// written in. It measures, and fails only where the writing would be felt
// to lag.
//
//     node e2e/large.mjs                 makes the document and measures
//     node e2e/large.mjs make <dir>      makes it in a data directory that is kept
//     node e2e/large.mjs measure <dir>   measures in a data directory that is there
//     node e2e/large.mjs make <dir> zotero
//                                        makes it of a Word file with 1500 citations
//                                        made by Zotero, which are found and not made
//
// With GLAUKOPIS_E2E_BINARY another build of the application is measured,
// so that two can be compared on the same project. With GLAUKOPIS_E2E_HISTORY
// the full history of the project is kept while it is measured (ADR 0021),
// and how long the history takes to be read is measured as well, with the
// panel of changes open beside the text (ADR 0022).
// With GLAUKOPIS_E2E_OUTLINE the outline stands beside the text.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const [what = 'both', given, kind = 'plain'] = process.argv.slice(2);
const data = given ?? mkdtempSync(join(tmpdir(), 'glaukopis-e2e-large-'));
const keep = !!given;

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
    await sleep(120);
  }
}

/** Who worked, by the names of the processes, since it was last asked. */
const byName = new Map();

/** The time the processes of the application have had of the processor, in milliseconds. */
function worked() {
  let ticks = 0;
  for (const pid of readdirSync('/proc').filter((p) => /^\d+$/.test(p))) {
    try {
      if (!readFileSync(`/proc/${pid}/environ`, 'utf8').includes(`GLAUKOPIS_DATA_DIR=${data}\0`))
        continue;
      const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
      const name = stat.slice(stat.indexOf('(') + 1, stat.lastIndexOf(')'));
      const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
      const own = Number(fields[11]) + Number(fields[12]);
      ticks += own;
      byName.set(`${name} ${pid}`, own * 10);
    } catch {
      // Gone, or not ours to read.
    }
  }
  return ticks * 10;
}

/** Who worked between two times it was asked, those that worked most first. */
function who(before) {
  worked();
  return [...byName]
    .map(([name, now]) => [name.replace(/ \d+$/, ''), now - (before.get(name) ?? 0)])
    .filter(([, ms]) => ms > 20)
    .sort((a, b) => b[1] - a[1])
    .map(([name, ms]) => `${name} ${ms} ms`)
    .join(', ');
}

const sorted = (list) => [...list].sort((a, b) => a - b);
const middle = (list) => Math.round(sorted(list)[Math.floor(list.length / 2)] ?? 0);
const most = (list) => Math.round(sorted(list)[list.length - 1] ?? 0);
const nearlyAll = (list) => Math.round(sorted(list)[Math.floor(list.length * 0.9)] ?? 0);

async function make() {
  const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
  const words =
    'Sing, goddess, the wrath of Achilles son of Peleus, the accursed wrath which brought countless sorrows upon the Achaeans, and sent down to Hades many valiant souls of warriors. ';
  let long = '---\ntitle: A long book\n---\n\n';
  let n = 0;
  for (let h = 0; h < 60; h++) {
    long += `${h % 6 === 0 ? '#' : h % 3 === 0 ? '###' : '##'} Part ${h + 1}\n\n`;
    for (let i = 0; i < 34; i++) {
      long += `${words.repeat(3)}*Emphasised.*${n % 10 === 0 ? ` (Nagy 1979, ${i + 1})^[${words.trim()}]` : ''}\n\n`;
      n++;
    }
  }
  writeFileSync(join(desk, 'long.md'), long);
  let file = 'long.md';
  if (kind === 'zotero') {
    // The same text, with a citation by Zotero in three of four paragraphs, a fifth of them in notes.
    let cited = '---\ntitle: A long book\n---\n\n';
    let c = 0;
    for (let h = 0; h < 60; h++) {
      cited += `${h % 6 === 0 ? '#' : h % 3 === 0 ? '###' : '##'} Part ${h + 1}\n\n`;
      for (let i = 0; i < 34; i++) {
        const n = h * 34 + i;
        const one =
          n % 4 === 3
            ? ''
            : n % 5 === 0
              ? `^[See ZOTCITE${c++}, and what is said there.]`
              : ` ZOTCITE${c++}`;
        cited += `${words.repeat(3)}*Emphasised*${one}.\n\n`;
      }
    }
    writeFileSync(join(desk, 'cited.md'), cited);
    execFileSync('pandoc', ['cited.md', '-o', 'made.docx'], { cwd: desk });
    const put = execFileSync(
      'python3',
      [join(import.meta.dirname, 'fixtures', 'zotero-fields.py'), 'made.docx', 'long.docx'],
      { cwd: desk },
    );
    console.log(`      ${String(put).trim()} citations as Zotero writes them`);
    file = 'long.docx';
  }

  const app = await App.launch({ width: 1360, height: 900, dataDir: data });
  try {
    await app.clickText('button', 'Begin a project');
    await app.waitFor('dialog input');
    await app.type('dialog input', 'Large');
    await app.clickText('dialog footer button', 'Create');
    await app.waitFor('.diagram .node.root', 8000);
    await sleep(300);
    const at = await app.exec(
      `const r = document.querySelector('.project .work .panes').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }`,
    );
    await app.execAsync(
      `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
       const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
       await emit('tauri://drag-enter', { paths: arguments[0], position });
       await emit('tauri://drag-over', { position });
       await emit('tauri://drag-drop', { paths: arguments[0], position });`,
      [join(desk, file)],
      at.x,
      at.y,
    );
    await app.waitFor('dialog [data-fact="words"]', 30000);
    const said = await app.exec(
      `return document.querySelector('dialog [data-fact="words"]').textContent.replace(/\\s+/g, ' ').trim()`,
    );
    await app.clickText('dialog footer button', 'Make the map');
    await until('the map', () => app.exec(`return !document.querySelector('dialog[open]')`), 60000);
    if (await app.exists('.found-panel')) {
      await app.click('.found-panel header button[aria-label="Close"]');
      await app.waitGone('.found-panel', 15000);
    }
    await app.waitFor('.text-view .section', 15000);
    // Until it is kept.
    await sleep(4000);
    console.log(`      the document is made: ${said}`);
    await app.click('button[aria-label="All projects"]');
    await sleep(2500);
  } finally {
    await app.close();
    rmSync(desk, { recursive: true, force: true });
  }
}

async function measure() {
  const app = await App.launch({ width: 1360, height: 900, dataDir: data });
  try {
    await app.installErrorHook();
    await app.waitFor('.home', 15000);
    let began = Date.now();
    await app.clickText('.home .card', 'Large');
    await until(
      'the text of the map',
      () => app.exec(`return document.querySelectorAll('.text-view .section').length > 1`),
      60000,
    );
    const shown = Date.now() - began;
    await sleep(1500);
    const drawn = await app.exec(
      `return { parts: document.querySelectorAll('.text-view .section').length, paragraphs: document.querySelectorAll('.text-view .prose.body p').length, words: document.querySelector('.text-view footer span').textContent.trim() }`,
    );
    console.log(
      `      shown after ${shown} ms: ${drawn.parts} elements, ${drawn.paragraphs} paragraphs, ${drawn.words}`,
    );

    // What is measured: from a key going down until the window has drawn what came of it.
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
      const still = Math.round(
        await app.exec(`const s = window.__still; window.__still = 0; return s;`),
      );
      return { list, still };
    };
    const report = (name, { list, still }, cpu, seconds) =>
      console.log(
        `      ${name}: a key takes ${middle(list)} ms (nine in ten under ${nearlyAll(list)} ms, the longest ${most(list)} ms); the window stood still for ${still} ms at the most; the processor worked ${Math.round(cpu / seconds)} ms in each second`,
      );

    const history = !!process.env.GLAUKOPIS_E2E_HISTORY;
    if (history) {
      const turned = Date.now();
      await app.execAsync(`await window.__glaukopisHistory.history.turnOn();`);
      console.log(`      the history is kept from now: turned on in ${Date.now() - turned} ms`);
      await sleep(1500);
    }

    // The preview is closed, if it was left open.
    if (await app.exists('.preview')) {
      console.log('      the preview was open, and is closed');
      await app.keys(['Control', 'p']);
      await sleep(3000);
    }

    // With GLAUKOPIS_E2E_OUTLINE, the outline stands beside the text while it is measured.
    if (process.env.GLAUKOPIS_E2E_OUTLINE) {
      await app.keys(['Control', 'Shift', 'o']);
      await app.waitFor('.outline', 5000);
      const items = await app.count('.outline [data-outline]');
      console.log(`      the outline is open beside the text: ${items} elements`);
      await sleep(1500);
    }

    // ---- at rest ----
    await took();
    let before = worked();
    const those = new Map(byName);
    await sleep(5000);
    const rest = worked() - before;
    const atRest = await took();
    console.log(
      `      at rest: the processor worked ${Math.round(rest / 5)} ms in each second (${who(those)}); the window stood still for ${atRest.still} ms at the most`,
    );
    // The watching itself works ten times in a hundredth of a second each; what is looked for is an application that never rests.
    check(
      'at rest the application does nothing',
      rest / 5 < 250,
      `${Math.round(rest / 5)} ms in each second`,
    );

    // ---- writing in the middle of the text ----
    const write = async (name, limit) => {
      await app.exec(
        `const s = document.querySelectorAll('.text-view .section')[30]; s.scrollIntoView({ block: 'center' });`,
      );
      await sleep(400);
      await app.exec(`document.querySelectorAll('.text-view .section')[30].dataset.here = '1'`);
      await app.click('.text-view .section[data-here] .body p');
      await sleep(1200);
      await took();
      before = worked();
      let began = Date.now();
      for (const letter of 'the wrath of gods and of men is sung') {
        await app.keys(letter);
        await sleep(60);
      }
      let seconds = (Date.now() - began) / 1000;
      const written = await took();
      report(`${name}, writing`, written, worked() - before, seconds);
      console.log(
        `        the keys one after the other: ${written.list.map((t) => Math.round(t)).join(' ')}`,
      );
      check(
        `${name}: writing is answered at once`,
        nearlyAll(written.list) < limit && written.still < limit * 3,
        `${nearlyAll(written.list)} ms, stood still ${written.still} ms`,
      );

      before = worked();
      began = Date.now();
      for (let i = 0; i < 30; i++) {
        await app.press(i % 10 < 5 ? 'ArrowLeft' : 'ArrowUp');
        await sleep(40);
      }
      seconds = (Date.now() - began) / 1000;
      const moved = await took();
      report(`${name}, the arrows`, moved, worked() - before, seconds);
      check(
        `${name}: the arrows are answered at once`,
        nearlyAll(moved.list) < limit,
        `${nearlyAll(moved.list)} ms`,
      );
    };
    await write('the text alone', 50);

    // ---- with the preview open ----
    await app.keys(['Control', 'p']);
    await app.waitFor('.preview .page', 120000);
    await sleep(3000);
    await write('with the preview', 80);
    await sleep(6000);
    const after = await took();
    console.log(
      `      while the preview is made anew the window stood still for ${after.still} ms at the most`,
    );
    // Pages fetched as the preview is moved through: drawn from what was set.
    const fetched = await app.execAsync(
      `const key = location.hash.split('/')[2].split('?')[0];
       const invoke = window.__TAURI_INTERNALS__.invoke;
       const times = [];
       let count = 0;
       for (const at of [40, 120, 200, 280, 360]) {
         const began = performance.now();
         const answer = await invoke('document_preview_pages', { key, pages: [at, at + 1, at + 2] });
         times.push(Math.round(performance.now() - began));
         count = answer.count;
       }
       return { times, count };`,
    );
    console.log(
      `      three pages fetched further on, in ${fetched.times.join(', ')} ms, of ${fetched.count} pages`,
    );
    check(
      'pages are fetched as the preview is moved through at once',
      Math.max(...fetched.times) < 1000,
      `${Math.max(...fetched.times)} ms`,
    );
    await app.keys(['Control', 'p']);
    await sleep(500);

    // ---- the history, read and compared ----
    if (history) {
      await sleep(1500);
      const read = await app.execAsync(
        `const h = window.__glaukopisHistory.history;
         await h.project.snapshot(true);
         h.stop();
         let at = performance.now();
         const sessions = await h.sessions();
         const reading = Math.round(performance.now() - at);
         const begins = await h.begins();
         at = performance.now();
         let passages = 0;
         // Every map of the project, since the text that was written in is in one of them.
         for (const map of h.project.maps) {
           const c = await h.compare(map.id, { moment: begins.snapshot, accepted: [] });
           passages += c.passages.length;
         }
         const comparing = Math.round(performance.now() - at);
         return { reading, comparing, sessions: sessions.length, passages, room: await h.room() };`,
      );
      console.log(
        `      the history (${Math.round(read.room / 1024)} kB, ${read.sessions} sessions) is read in ${read.reading} ms; the whole project compared with where it began in ${read.comparing} ms, ${read.passages} passages changed`,
      );
      check(
        'the history of a large project is read in seconds',
        read.reading < 10000 && read.comparing < 10000,
        `${read.reading} ms, ${read.comparing} ms`,
      );
      // Without this a history that kept nothing would be read quickly and look well.
      check(
        'what was written is kept in the history',
        read.sessions > 1 && read.passages > 0,
        `${read.sessions} sessions, ${read.passages} passages`,
      );

      // ---- with the panel of changes open (ADR 0022) ----
      await app.keys(['Control', 'Shift', 'e']);
      await app.waitFor('.review-panel', 15000);
      const opened = Date.now();
      const changes = await app.execAsync(
        `const r = window.__glaukopisHistory.review;
         // One person alone made the text, so their own changes are counted too.
         r.setOwn(true);
         await r.upToDate();
         return { count: r.changes.length, marked: r.marked.text.size };`,
      );
      await sleep(1500);
      const spans = await app.exec(
        `return document.querySelectorAll('.text-view .review-added, .text-view .review-removed').length`,
      );
      console.log(
        `      the panel of changes: ${changes.count} changes in ${changes.marked} elements, worked out and marked in ${Date.now() - opened} ms, ${spans} marks drawn`,
      );
      check(
        'the changes of a large map are worked out in seconds',
        Date.now() - opened < 20000,
        `${Date.now() - opened} ms`,
      );
      check('and they are there to review', changes.count > 0, `${changes.count} changes`);
      await write('with the review', 80);
      await app.keys(['Control', 'Shift', 'e']);
      await app.waitGone('.review-panel', 5000);
      await sleep(500);
    }

    // ---- from the text to the diagram and back ----
    began = Date.now();
    await app.keys(['Control', 'd']);
    await app.waitFor('.diagram .node.root', 30000);
    const toDiagram = Date.now() - began;
    began = Date.now();
    await app.keys(['Control', 'd']);
    await until(
      'the text again',
      () => app.exec(`return document.querySelectorAll('.text-view .section').length > 1`),
      60000,
    );
    const toText = Date.now() - began;
    console.log(`      to the diagram in ${toDiagram} ms, back to the text in ${toText} ms`);

    const errors = await app.pageErrors();
    check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
  } catch (error) {
    console.error(error);
    check('the script ran to its end', false, String(error.message ?? error));
    await app.screenshot('large-failure').catch(() => {});
  } finally {
    await app.close();
  }
}

try {
  if (what === 'make' || what === 'both') await make();
  if (what === 'measure' || what === 'both') await measure();
} finally {
  if (!keep) rmSync(data, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
