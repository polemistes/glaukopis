// The window opens as it was left (record 0063): the place it was at, a
// project with both its sides, the element at the top of a text, the side
// that had the focus, and the window's size; the library where it was left
// there; the start screen where the project left at is gone, without it
// among the projects last opened.
//
//     node e2e/as-left.mjs            in a data folder of its own, removed after
//     node e2e/as-left.mjs <dir>      in that folder, made anew and kept
//
// Each run closes the window as the user does (`app.quit()`), so that what
// is written as it closes is written.

import { mkdtempSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const given = process.argv[2];
const dataDir = given ?? mkdtempSync(join(tmpdir(), 'glaukopis-e2e-as-left-'));
if (given) {
  rmSync(dataDir, { recursive: true, force: true });
  mkdirSync(dataDir, { recursive: true });
}
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-as-left-desk-'));

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const invoke = (app, cmd, args) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, cmd, args);

async function until(fn, ms = 8000) {
  const start = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - start > ms) return false;
    await sleep(100);
  }
}

const settingsKept = () => JSON.parse(readFileSync(join(dataDir, 'settings.json'), 'utf8'));

/** What each pane shows: its way, and the element at the top of its text. */
const panes = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.panes > .pane')).map((p) => {
       const text = p.querySelector('.text-view');
       return { mode: text ? 'text' : p.querySelector('.diagram') ? 'diagram' : '?', top: text?.dataset.atTop ?? null };
     })`,
  );

/**
 * The pane that has the focus, by its place: marked by the pane while two are
 * shown, and by its cell in the row over the sides where there is one.
 */
const focusedPane = (app) =>
  app.exec(
    `const all = Array.from(document.querySelectorAll('.panes > .pane'));
     const marked = all.findIndex((p) => p.classList.contains('focused'));
     if (marked >= 0) return marked;
     const cell = document.querySelector('[data-side].active');
     return cell ? Number(cell.dataset.side) : -1;`,
  );

/** How far the heading of an element stands under the top of the text of a pane, in pixels; null where it is not there. */
const fromTop = (app, pane, id) =>
  app.exec(
    `const scroller = document.querySelectorAll('.panes > .pane')[arguments[0]]?.querySelector('.scroller');
     const section = scroller?.querySelector('[data-section="' + arguments[1] + '"]');
     if (!section) return null;
     return Math.round(section.getBoundingClientRect().top - scroller.getBoundingClientRect().top);`,
    pane,
    id,
  );

// A document with a dozen parts and long texts, to be made a project of.
const words =
  'Sing, goddess, the wrath of Achilles son of Peleus, the accursed wrath which brought countless sorrows upon the Achaeans, and sent down to Hades many valiant souls of warriors. ';
let long = '---\ntitle: A long book\n---\n\n';
for (let part = 1; part <= 12; part++) {
  long += `# Part ${part}\n\n`;
  for (let i = 0; i < 6; i++) long += `${words.repeat(4)}\n\n`;
}
writeFileSync(join(desk, 'long-book.md'), long);

let projectId = null;
/** The elements by their names, as the text of the project shows them. */
let ids = {};

// ---- Run 1: a project, two sides, a text scrolled far, the focus in the second ----
let app = await App.launch({ dataDir, keepData: true });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.screenshot('as-left-1-first');

  // A small project opened once, to stand among the projects last opened.
  await invoke(app, 'project_create', { name: 'Notes', id: null, folder: null });
  await app.exec('location.reload();');
  await app.waitFor('[data-projects-pane] .row.project', 10000);
  await app.openProject('Notes');
  await app.waitFor('.text-view .section, .diagram .node', 10000);
  await sleep(400);
  await app.home();

  // The document dropped on the start screen becomes a project, open at its top in its text.
  const at = await app.exec(
    `const r = document.querySelector('[data-start]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }`,
  );
  await app.execAsync(
    `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
     const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
     await emit('tauri://drag-enter', { paths: arguments[0], position });
     await emit('tauri://drag-over', { position });
     await emit('tauri://drag-drop', { paths: arguments[0], position });`,
    [join(desk, 'long-book.md')],
    at.x,
    at.y,
  );
  await until(async () => (await app.count('.text-view [data-section]')) >= 13, 20000);
  projectId = decodeURIComponent((await app.exec('return location.hash')).split('/')[2].split('?')[0]);
  ids = Object.fromEntries(
    await app.exec(
      `return Array.from(document.querySelectorAll('.text-view [data-section]')).map((s) => [s.querySelector('[data-part="title"]')?.textContent.trim(), s.dataset.section])`,
    ),
  );
  check('the document is a project of a dozen parts', !!projectId && !!ids['Part 2'] && !!ids['Part 10'], Object.keys(ids).join(' | '));

  // The first side at Part 2, in its text.
  await app.home();
  await app.go(`#/project/${encodeURIComponent(projectId)}/${encodeURIComponent(ids['Part 2'])}?mode=text`);
  await app.waitFor('.text-view [data-section]', 10000);
  await sleep(400);

  // The second side: the whole book, beside, in its text.
  await app.click('button[data-side-by-side]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await app.clickText('.menu [role="menuitem"]', 'Another element…');
  await app.waitFor('dialog [data-pick]', 3000);
  await app.clickText('dialog [data-pick]', 'A long book');
  await app.clickText('dialog footer button', 'Show beside');
  await app.waitGone('dialog [data-pick]', 3000);
  await until(async () => (await panes(app)).length === 2 && (await app.count('.panes > .pane .text-view')) === 2);
  // The focus in the first side, then the second side's text read far down, then the focus there.
  await app.exec(`document.querySelectorAll('.panes > .pane')[0].querySelector('.pane-body').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
  await app.exec(
    `const scroller = document.querySelectorAll('.panes > .pane')[1].querySelector('.scroller');
     const section = scroller.querySelector('[data-section="' + arguments[0] + '"]');
     scroller.scrollTop += section.getBoundingClientRect().top - scroller.getBoundingClientRect().top;`,
    ids['Part 10'],
  );
  await until(async () => (await panes(app))[1]?.top === ids['Part 10'], 3000);
  await app.exec(`document.querySelectorAll('.panes > .pane')[1].querySelector('.pane-body').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
  await sleep(200);
  const left = await panes(app);
  check(
    'two sides, each in its text, the second read at Part 10',
    left.length === 2 && left.every((p) => p.mode === 'text') && left[1].top === ids['Part 10'],
    JSON.stringify(left),
  );
  check('the second side has the focus', (await focusedPane(app)) === 1, String(await focusedPane(app)));
  // The view is saved a moment after it changes; the window made smaller, to be kept as it closes.
  await sleep(2000);
  await app.cmd('POST', '/window/rect', { width: 1100, height: 760 }).catch((error) => console.log(`      the window could not be made smaller: ${error.message}`));
  await sleep(500);
  const size = await app.exec('return [window.outerWidth, window.outerHeight]');
  await app.screenshot('as-left-1-left');

  const errors = await app.pageErrors();
  check('no errors in the page (run 1)', errors.length === 0, errors.join(' | '));
  await app.quit();

  const kept = settingsKept();
  check(
    'the place is kept: the project at Part 2, in its text',
    kept.lastPlace === `#/project/${encodeURIComponent(projectId)}/${encodeURIComponent(ids['Part 2'])}?mode=text`,
    kept.lastPlace,
  );
  check(
    "the window's size is kept as it closed",
    kept.window && kept.window.width === size[0] && kept.window.height === size[1] && kept.window.maximized === false,
    `${JSON.stringify(kept.window)} for ${size.join('×')}`,
  );
} catch (error) {
  console.error(error);
  await app.screenshot('as-left-failure-1').catch(() => {});
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'run 1 completed', ok: false });
  await app.close();
}

// ---- Run 2: as it was left ----
app = await App.launch({ dataDir, keepData: true });
try {
  await app.installErrorHook();
  await app.waitFor('.project', 10000);
  await until(async () => (await panes(app)).length === 2 && (await panes(app))[1].top !== null, 10000);
  await sleep(600);
  await app.screenshot('as-left-2-first');
  const hash = await app.exec('return location.hash');
  check(
    'it opens at the project, at the element of the first side and in its text',
    hash === `#/project/${encodeURIComponent(projectId)}/${encodeURIComponent(ids['Part 2'])}?mode=text`,
    hash,
  );
  const shown = await panes(app);
  check('with both sides, each in its text', shown.length === 2 && shown.every((p) => p.mode === 'text'), JSON.stringify(shown));
  check('the second side read at Part 10', shown[1]?.top === ids['Part 10'], JSON.stringify(shown));
  const dy = await fromTop(app, 1, ids['Part 10']);
  check('with Part 10 at the top of its text', dy !== null && Math.abs(dy) < 40, `${dy} px`);
  check('the first side from its top', (await fromTop(app, 0, ids['Part 2'])) !== null && Math.abs(await fromTop(app, 0, ids['Part 2'])) < 80, `${await fromTop(app, 0, ids['Part 2'])} px`);
  check('the focus in the second side', (await focusedPane(app)) === 1, String(await focusedPane(app)));
  const size = await app.exec('return [window.outerWidth, window.outerHeight]');
  check('the window at the size it was closed at', size[0] === 1100 && size[1] === 760, size.join('×'));
  check('and shown', await app.exec('return document.visibilityState === "visible"'));

  await app.go('#/library');
  await app.waitFor('.library', 8000);
  await sleep(500);
  const errors = await app.pageErrors();
  check('no errors in the page (run 2)', errors.length === 0, errors.join(' | '));
  await app.quit();
  check('the library is the place kept', settingsKept().lastPlace === '#/library', settingsKept().lastPlace);
} catch (error) {
  console.error(error);
  await app.screenshot('as-left-failure-2').catch(() => {});
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'run 2 completed', ok: false });
  await app.close();
}

// ---- Run 3: the library; then the project deleted ----
app = await App.launch({ dataDir, keepData: true });
try {
  await app.installErrorHook();
  await app.waitFor('.library', 10000);
  await sleep(400);
  await app.screenshot('as-left-3-first');
  check('it opens at the library', (await app.exec('return location.hash')) === '#/library');

  await app.home();
  await app.waitFor('[data-projects-pane] .row.project', 8000);
  await app.rightClick(await app.findByText('[data-projects-pane] .row.project', 'long book'));
  await app.clickText('[role="menuitem"]', 'Delete');
  await app.waitForText('dialog h2', 'Delete');
  await sleep(250);
  await app.clickText('dialog footer button', 'Delete project');
  await until(async () => (await app.count('[data-projects-pane] .row.project')) === 1);
  check('the project is deleted', (await app.count('[data-projects-pane] .row.project')) === 1);
  await app.home();
  await sleep(500);
  await app.quit();
  check('the start screen is the place kept', settingsKept().lastPlace === '#/', settingsKept().lastPlace);
  // The place kept made the project deleted, by hand, as if it had been deleted from elsewhere.
  const kept = settingsKept();
  kept.lastPlace = `#/project/${encodeURIComponent(projectId)}/${encodeURIComponent(ids['Part 2'])}?mode=text`;
  writeFileSync(join(dataDir, 'settings.json'), JSON.stringify(kept));
} catch (error) {
  console.error(error);
  await app.screenshot('as-left-failure-3').catch(() => {});
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'run 3 completed', ok: false });
  await app.close();
}

// ---- Run 4: the project left at is gone: the start screen ----
app = await App.launch({ dataDir, keepData: true });
try {
  await app.installErrorHook();
  await app.waitFor('[data-start]', 10000);
  await sleep(500);
  await app.screenshot('as-left-4-first');
  check('a project that is gone gives the start screen', !(await app.exists('.project')), await app.exec('return location.hash'));
  const recent = await app.exec(
    `return Array.from(document.querySelectorAll('[data-start-recent] [data-start-project] .name')).map((n) => n.textContent.trim())`,
  );
  check('with the projects last opened, less the one deleted', recent.length === 1 && recent[0] === 'Notes', recent.join(' | '));
  const errors = await app.pageErrors();
  check('no errors in the page (run 4)', errors.length === 0, errors.join(' | '));
  await app.quit();
} catch (error) {
  console.error(error);
  await app.screenshot('as-left-failure-4').catch(() => {});
  checks.push({ name: 'run 4 completed', ok: false });
  await app.close();
}

rmSync(desk, { recursive: true, force: true });
if (!given) rmSync(dataDir, { recursive: true, force: true });
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
