// Import notes… on the notebook's page (docs/plans/the-notebook.md, stage 5): a folder written
// by the script, Owls, with three Markdown files (Athena.md with lines before its text giving
// its title, its tags and the page it was clipped from; Glaux.md with [[Night]] and #little-owl
// in its text; Night.md with a picture beside it, night.png, a small PNG made by the script) is
// handed to the window through the page's hook, as the system's dialog would hand it; the window
// shows what was found before anything is made (Markdown or Obsidian, Owls, three notes, one
// picture or file) and the notebook is still empty; Import makes a box named Owls with the three
// notes and a message says so, with Show, which brings the box into view with the notes in the
// strip of its surface, not placed; in the list, the note clipped from a page is taken in as a
// passage and has that page as its source; the picture is shown in its note; the two notes that
// link are linked (Holds: a link, in the window of the filters, lets those two through and not
// the third); a list to tick written in Markdown comes as points to tick, ticked as they were;
// the tags stand in the column; Undo takes the box and its notes away; a file of OneNote's own
// is told to be one, with what can be done and nothing to import; no errors in the page.
// Screenshots into e2e/output/notebook-import-<n>-<what>.png.

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok });
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

/** A picture of rings, as PNG, as notebook-out.mjs draws one. */
function png(width, height) {
  const crcTable = new Int32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c;
  });
  const crc = (buffer) => {
    let c = -1;
    for (const b of buffer) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, sum]);
  };
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) {
      const d = Math.hypot(x - width / 2, y - height / 2);
      raw[row + 1 + x * 3] = (150 + 90 * Math.cos(d / 14)) & 0xff;
      raw[row + 2 + x * 3] = (110 + x / 5) & 0xff;
      raw[row + 3 + x * 3] = (90 + y / 3) & 0xff;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- the folder of notes, as another program leaves one ----
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-notebook-import-desk-'));
const folder = join(desk, 'Owls');
mkdirSync(folder);
const PAGE = 'https://owls.example/athena';
const CLIPPED = 'The owl was the bird of Athena.';
writeFileSync(
  join(folder, 'Athena.md'),
  ['---', "title: Athena's owl", 'tags:', '  - owls', '  - greek', `source: ${PAGE}`, '---', '', CLIPPED, ''].join('\n'),
);
writeFileSync(join(folder, 'Glaux.md'), 'Glaux is the little owl. See [[Night]].\n\n#little-owl\n');
writeFileSync(join(folder, 'Night.md'), 'An owl at night.\n\n![](night.png)\n\n- [ ] Feed the owl\n- [x] Clean the cage\n');
writeFileSync(join(folder, 'night.png'), png(160, 100));

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-notebook-import-'));

// ---- what the script reads of the page ----
const ROWS = '[data-notes] [role="option"]';
/** The titles of the rows of the list, as they stand. */
const titles = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('${ROWS} .title')).map((t) => t.textContent.trim())`);
/** The boxes in the column, in their order: name, count, and whether in view. */
const boxes = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-box-row]')).filter((r) => r.dataset.boxRow !== 'all').map((r) => ({ id: r.dataset.boxRow, name: r.querySelector('.name').textContent.trim(), count: r.querySelector('.count')?.textContent.trim() ?? '', on: r.getAttribute('aria-pressed') === 'true' }))`,
  );
/** The tags in the column. */
const tagRows = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('[data-tag-row]')).map((r) => r.dataset.tagRow)`);
/** The names of the notes in the strip of the surface, not placed. */
const stripNames = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-surface] [data-strip] [data-unplaced]')).map((i) => i.getAttribute('aria-label'))`,
  );
/** What the note shown holds: its words, whether they are taken in, its pictures drawn, and its sources. */
const noteShown = (app) =>
  app.exec(`
    const text = document.querySelector('[data-note-text] .ProseMirror');
    const images = text ? Array.from(text.querySelectorAll('img')) : [];
    return {
      words: text?.textContent ?? '',
      taken: !!text?.querySelector('span.taken[data-passage]'),
      pictures: images.length,
      drawn: images.filter((i) => i.complete && i.naturalWidth > 0).length,
      ticks: text ? Array.from(text.querySelectorAll('p[data-kind="todo"]')).map((p) => p.hasAttribute('data-done')) : [],
      sources: Array.from(document.querySelectorAll('[data-note-sources] [data-source]')).map((c) => ({ words: c.textContent.trim(), detail: c.title ?? '' })),
    };`);
/** Chooses the note whose row says these words. */
async function chooseNote(app, words) {
  await app.clickText(ROWS, words);
  await app.waitUntil(
    `return Array.from(document.querySelectorAll('${ROWS}[aria-selected="true"] .title')).some((t) => t.textContent.includes(${JSON.stringify(words)}))`,
    3000,
    `the note ${words} chosen`,
  );
  await app.waitFor('[data-note-text] .ProseMirror', 5000);
  await sleep(400);
}
/** The message that the notes were imported: its words and the label of its button. */
const told = (app) =>
  until(
    () =>
      app.exec(
        `const t = Array.from(document.querySelectorAll('.toast')).find((t) => /imported into/.test(t.querySelector('.message')?.textContent ?? ''));
         return t ? { message: t.querySelector('.message').textContent.trim(), detail: t.querySelector('.detail')?.textContent.trim() ?? '', action: t.querySelector('.action')?.textContent.trim() ?? '' } : null;`,
      ),
    (m) => !!m,
    15000,
  );

const app = await App.launch({ dataDir, keepData: true, width: 1360, height: 900 });
try {
  await app.installErrorHook();
  await app.go('#/notebook');
  await app.waitFor('[data-notebook]', 10000);
  await app.waitFor('[data-notebook-empty]', 10000);
  check('the empty notebook offers Import notes…', !!(await app.findByText('[data-notebook-empty] button', 'Import notes…').catch(() => null)));

  // ---- the folder handed to the window, as the system's dialog would ----
  await app.exec(`window.__glaukopisNotebook.importNotes(arguments[0]); return null;`, folder);
  await app.waitFor('dialog[open] [data-import-notes]', 5000);
  check('the window asks for a folder or a file', (await app.exists('[data-import-folder]')) && (await app.exists('[data-import-file]')));
  await app.waitFor('[data-import-found]', 15000);
  const found = await app.exec(
    `const f = document.querySelector('[data-import-found]');
     return { kind: f.dataset.kind, notes: f.dataset.notes, words: f.textContent.replace(/\\s+/g, ' ').trim() };`,
  );
  check('what was found is Markdown, or Obsidian', ['markdown', 'obsidian'].includes(found.kind), found.kind);
  check('named after the folder, with three notes', found.notes === '3' && /Owls/.test(found.words) && /3 notes/.test(found.words), found.words);
  check('and the picture beside them', /one picture or file|1 picture/.test(found.words), found.words);
  check('nothing is made before Import', (await app.exists('[data-notebook-empty]')) && (await boxes(app)).length === 1);
  // The window rises into place: the picture is taken when it stands.
  await sleep(600);
  await app.screenshot('notebook-import-1-found');

  // ---- Import ----
  await app.click('[data-import-do]');
  await app.waitGone('[data-import-notes]', 20000);
  const message = await told(app);
  check(
    'a message says three notes were imported into Owls, with Show',
    !!message && /3 notes imported into/.test(message.message) && /Owls/.test(message.message) && message.action === 'Show',
    JSON.stringify(message),
  );
  check('nothing is said to have been left unread', !!message && !message.detail, message?.detail);
  const owls = (await until(() => boxes(app), (b) => b.some((x) => x.name === 'Owls'))).find((b) => b.name === 'Owls');
  check('a box named Owls holds the three notes', owls && owls.count === '3', JSON.stringify(await boxes(app)));
  await app.screenshot('notebook-import-2-imported');

  // ---- Show: the box in view, the notes not placed on its surface ----
  const show = await app.exec(
    `const t = Array.from(document.querySelectorAll('.toast')).find((t) => /imported into/.test(t.querySelector('.message')?.textContent ?? ''));
     return t?.querySelector('.action') ?? null;`,
  );
  await app.click(show);
  await sleep(500);
  const inView = (await boxes(app)).find((b) => b.on);
  check('Show brings the box into view', inView?.name === 'Owls', JSON.stringify(inView));
  if ((await app.exec(`return document.querySelector('[data-notebook]')?.dataset.shownAs`)) === 'surface') {
    const strip = await until(() => stripNames(app), (s) => s.length === 3);
    check('the notes stand in the strip of its surface, not placed', strip.length === 3 && !(await app.exists('[data-surface] [data-card]')), strip.join(' | '));
    await app.screenshot('notebook-import-3-surface');
    await app.click('[data-shown-as-choice] [role="radio"][aria-label="List"]');
    await sleep(400);
  } else check('the box is shown as its list', true);
  const rows = await until(() => titles(app), (r) => r.length === 3);
  check('the list of the box has the three notes', rows.length === 3 && rows.some((r) => r.includes("Athena's owl")) && rows.includes('Glaux') && rows.includes('Night'), rows.join(' | '));
  const dotted = await app.exec(`return document.querySelectorAll('${ROWS}[data-unseen]').length`);
  check('none of them has been looked at', dotted === 3, String(dotted));

  // ---- the note clipped from a page ----
  await chooseNote(app, "Athena's owl");
  const athena = await noteShown(app);
  check('the note clipped from a page holds its words', athena.words.includes(CLIPPED), athena.words);
  check('taken in as a passage', athena.taken);
  check(
    'whose source is the page',
    athena.sources.length === 1 && athena.sources[0].detail.includes(PAGE),
    JSON.stringify(athena.sources),
  );
  const tagsOf = await app.exec(
    `return Array.from(document.querySelectorAll('[data-note-editor] [data-note-tags] [data-tag]')).map((c) => c.dataset.tag)`,
  );
  check('with its tags', tagsOf.includes('owls') && tagsOf.includes('greek'), tagsOf.join(' | '));
  await app.screenshot('notebook-import-4-clipped');

  // ---- the note with the picture ----
  await chooseNote(app, 'Night');
  await until(() => noteShown(app), (n) => n.drawn > 0, 8000);
  const night = await noteShown(app);
  check('the picture is shown in its note', night.pictures === 1 && night.drawn === 1, JSON.stringify(night));
  check('and the note is the writer’s own: nothing taken in', !night.taken);
  check('its list to tick comes as points to tick, ticked as they were', JSON.stringify(night.ticks) === '[false,true]', JSON.stringify(night.ticks));
  await app.screenshot('notebook-import-5-picture');

  // ---- the note that links ----
  await chooseNote(app, 'Glaux');
  const glaux = await noteShown(app);
  check('the note that links holds its words', glaux.words.includes('Glaux is the little owl'), glaux.words);
  check('its own words, with no source', !glaux.taken && glaux.sources.every((s) => !/owls\.example/.test(s.detail)), JSON.stringify(glaux.sources));

  // Holds: a link lets through the two notes linked, and not the third.
  await app.click('[data-notebook-filter]');
  await app.waitFor('[data-notebook-filters]', 3000);
  await app.click('[data-notebook-filters] [data-holds="links"]');
  await sleep(400);
  const linked = await until(() => titles(app), (r) => r.length === 2);
  check('the two notes are linked', linked.length === 2 && linked.includes('Glaux') && linked.includes('Night'), linked.join(' | '));
  await app.screenshot('notebook-import-6-linked');
  await app.clickText('[data-notebook-filters] footer button', 'Done').catch(() => {});
  await app.waitGone('[data-notebook-filters]', 3000).catch(() => {});
  if (await app.exists('[data-filter-count]')) {
    await app.click('[data-notebook-filter]');
    await app.waitFor('[data-notebook-filters]', 3000);
    await app.click('[data-notebook-filters] [data-action="clear"]');
    await app.clickText('[data-notebook-filters] footer button', 'Done').catch(() => {});
    await app.waitGone('[data-notebook-filters]', 3000).catch(() => {});
  }

  // ---- the tags in the column ----
  const tags = await tagRows(app);
  check('the tags stand in the column', ['owls', 'greek', 'little-owl'].every((t) => tags.includes(t)), tags.join(' | '));

  // ---- Undo ----
  await app.click('[data-box-row="all"]');
  await sleep(300);
  await app.keys(['Control', 'z']);
  await sleep(600);
  const after = await boxes(app);
  check('Undo takes the box away', !after.some((b) => b.name === 'Owls'), JSON.stringify(after));
  check('and its notes: the notebook is empty again', await app.exists('[data-notebook-empty]'));
  await app.screenshot('notebook-import-7-undone');

  // ---- a file of OneNote's own is not read: the window says what can be done ----
  const section = join(desk, 'Section.one');
  writeFileSync(section, Buffer.from([0xe4, 0x52, 0x5c, 0x7b, 0x8c, 0xd8, 0xa7, 0x4d]));
  await app.exec(`window.__glaukopisNotebook.importNotes(arguments[0]); return null;`, section);
  await app.waitFor('dialog[open] [data-import-found]', 15000);
  const oneNote = await app.exec(
    `const f = document.querySelector('[data-import-found]');
     return {
       kind: f.dataset.kind,
       counted: !!f.querySelector('.facts') || !!document.querySelector('[data-import-none]'),
       toKnow: document.querySelector('[data-import-remarks]')?.textContent.replace(/\\s+/g, ' ').trim() ?? '',
       disabled: document.querySelector('[data-import-do]')?.disabled ?? null,
     };`,
  );
  check(
    'a file of OneNote is told to be one, with what can be done and nothing to import',
    oneNote.kind === 'onenote' && !oneNote.counted && /Word/.test(oneNote.toKnow) && oneNote.disabled === true,
    JSON.stringify(oneNote),
  );
  await sleep(600);
  await app.screenshot('notebook-import-8-onenote');
  await app.clickText('dialog[open] footer button', 'Cancel');
  await app.waitGone('[data-import-notes]', 5000);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.log('FAIL  the run stopped:', error?.message ?? error);
  checks.push({ name: 'the run ran to the end', ok: false });
  await app.screenshot('notebook-import-stopped').catch(() => {});
  console.log('page errors:', JSON.stringify(await app.pageErrors().catch(() => [])).slice(0, 2000));
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
