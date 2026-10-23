// The top row over the sides (record 0063): a cell over each side with its
// path, and Split view at the right end. The path: the folders the project
// lies in, the project, the elements down to the one in view, the last in the
// strongest type; a crumb entered goes there; the chevron opens the menu of
// all projects, the folders as submenus and the project shown marked; in a
// narrow window the crumbs in the middle hide behind one, whose menu has
// them. Two sides: the active cell in the accent, the other sunken, in the
// light, the dark and the mellow theme; the colour follows the focus;
// Switch sides draws them the other way round; another project beside, both
// marked in the list, the panel at the side naming its project; the bar of
// the project under the row; a side closed by its ×, by Ctrl+W, by Close in
// the list; the first side closed, the other project becomes the project of
// the view; the one side closed, the start screen.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const invoke = (app, cmd, args) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, cmd, args);

async function until(fn, ms = 5000) {
  const start = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - start > ms) return false;
    await sleep(80);
  }
}

const PROJECT = 'Homer, the long way round';
const NAMES = [
  'The wrath of Achilles',
  'The quarrel of kings',
  'The ransom refused',
  'The prayer of Chryses',
  'The plague in the camp',
];

/** The crumbs of the path of a side, as `kind:name`, `more` for the crumb … */
const crumbs = (app, side = 0) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.top .cell[data-side="${side}"] [data-path] .room [data-crumb]')).map((c) => c.dataset.crumb === 'more' ? 'more' : c.dataset.crumb + ':' + (c.querySelector('.name')?.textContent.trim() ?? ''))`,
  );
/** The labels of the menus that are open, the innermost last. */
const menus = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.menu')).map((m) => Array.from(m.querySelectorAll(':scope > [role="menuitem"]')).map((i) => i.querySelector('.label')?.textContent.trim() + (i.querySelector('.check svg') ? ' *' : '')))`,
  );
const menuItem = (app, label) =>
  app.exec(
    `const all = Array.from(document.querySelectorAll('.menu [role="menuitem"]'));
     return all.reverse().find((i) => i.querySelector('.label')?.textContent.trim() === arguments[0]) ?? null`,
    label,
  );
const cellClasses = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('.top .cell')).map((c) => c.dataset.side + ':' + (c.classList.contains('active') ? 'active' : c.classList.contains('other') ? 'other' : 'plain'))`);
const splitMenu = async (app, item) => {
  await app.click('.top button[data-side-by-side]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', item);
  await sleep(500);
};
/** Puts the focus in a side, as a press in it does. */
const focusSide = (app, i) =>
  app.exec(`document.querySelectorAll('.pane')[arguments[0]].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`, i);

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-path-'));
let deepest = null;
let ids = {};

// ---- run 1: a wide window, the whole path ----
let app = await App.launch({ dataDir, width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  const greek = await invoke(app, 'folder_create', { name: 'Greek', parent: null, id: null });
  const epic = await invoke(app, 'folder_create', { name: 'Epic', parent: greek.id, id: null });
  await invoke(app, 'folder_create', { name: 'Nothing yet', parent: null, id: null });
  const homer = await invoke(app, 'project_create', { name: PROJECT, id: null, folder: epic.id });
  const notes = await invoke(app, 'project_create', { name: 'Notes', id: null, folder: null });
  ids = { homer: homer.id, notes: notes.id };
  await app.exec('location.reload();');
  await app.waitFor('[data-projects-pane] .row.project', 10000);
  await sleep(400);
  await app.openProject(PROJECT);
  await app.waitFor('.top [data-path]', 10000);
  await sleep(400);

  check('the top row stands over the bar of the project', await app.exec(`return document.querySelector('.project > .top')?.nextElementSibling?.tagName === 'HEADER'`));
  check('at the project itself, the path is the folders and the project', JSON.stringify(await crumbs(app)) === JSON.stringify(['folder:Greek', 'folder:Epic', `project:${PROJECT}`]), JSON.stringify(await crumbs(app)));

  // A tree five deep, each made under the one in view from ⋯ This element and entered from the list.
  for (const name of NAMES) {
    await app.newMap();
    await app.keys(name);
    await app.press('Enter');
    await sleep(300);
    await app.openMap(name);
  }
  deepest = await app.exec('return location.hash');
  const whole = await crumbs(app);
  check(
    'at the deepest, the path shows every crumb',
    JSON.stringify(whole) === JSON.stringify(['folder:Greek', 'folder:Epic', `project:${PROJECT}`, ...NAMES.map((n) => `element:${n}`)]),
    JSON.stringify(whole),
  );
  const type = await app.exec(
    `const cs = Array.from(document.querySelectorAll('.top [data-path] .room [data-crumb]'));
     const f = (c) => { const s = getComputedStyle(c); return { size: parseFloat(s.fontSize), weight: Number(s.fontWeight), family: s.fontFamily }; };
     return { last: f(cs[cs.length - 1]), before: f(cs[cs.length - 2]), folder: f(cs[0]), lastMarked: cs[cs.length - 1].hasAttribute('data-crumb-last') };`,
  );
  check(
    'the last crumb in the strongest type, the folders smallest',
    type.lastMarked && type.last.size > type.before.size && type.last.weight >= 600 && type.folder.size < type.before.size,
    JSON.stringify(type),
  );
  await app.screenshot('path-1-whole');

  // A crumb entered goes there; the crumb of the parent goes up.
  await app.click(await app.exec(`return Array.from(document.querySelectorAll('.top [data-crumb="element"]')).find((c) => c.textContent.includes(arguments[0]))`, NAMES[1]));
  await sleep(400);
  check('a crumb entered is the element in view', (await app.inView()) === NAMES[1], await app.inView());
  await app.up();
  check('the crumb of the parent goes up', (await app.inView()) === NAMES[0], await app.inView());
  await app.click('.top [data-crumb="project"]');
  await sleep(300);
  check('the project crumb shows the project at its top', (await app.inView()) === PROJECT, await app.inView());
  await app.go(deepest);
  await until(async () => (await app.inView()) === NAMES[4]);

  // The chevron: the menu of all projects.
  await app.click('.top [data-path-all]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  const top = (await menus(app))[0];
  check('the chevron opens the menu of all projects: folders, then the projects in none', JSON.stringify(top) === JSON.stringify(['Greek', 'Nothing yet', 'Notes']), JSON.stringify(top));
  await app.click(await menuItem(app, 'Greek'));
  await sleep(300);
  await app.click(await menuItem(app, 'Epic'));
  await sleep(300);
  const deep = await menus(app);
  check('a folder is a submenu, and the project shown is marked in it', JSON.stringify(deep[deep.length - 1]) === JSON.stringify([`${PROJECT} *`]), JSON.stringify(deep));
  await app.screenshot('path-2-all-projects');
  await app.press('Escape');
  await app.press('Escape');
  await app.press('Escape');
  await sleep(200);
  // A folder crumb opens the menu at that folder.
  await app.click('.top [data-crumb="folder"]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  check('a folder crumb opens the menu of that folder', JSON.stringify((await menus(app))[0]) === JSON.stringify(['Epic']), JSON.stringify(await menus(app)));
  await app.press('Escape');
  await sleep(200);
  // Another project chosen from it is shown in this side.
  await app.click('.top [data-path-all]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  await app.click(await menuItem(app, 'Notes'));
  await until(async () => JSON.stringify(await crumbs(app)) === JSON.stringify(['project:Notes']), 8000);
  check('another project chosen from it is shown in this side, at its top', JSON.stringify(await crumbs(app)) === JSON.stringify(['project:Notes']), JSON.stringify(await crumbs(app)));
  await app.go(deepest);
  await app.waitFor('.top [data-path]', 10000);
  await until(async () => (await app.inView()) === NAMES[4], 8000);
  await app.home();
  await sleep(600);
  const errors = await app.pageErrors();
  check('no errors in the page (wide)', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('path-failure-1').catch(() => {});
  checks.push({ name: 'the wide run completed', ok: false });
} finally {
  await app.close();
}

// ---- run 2: a narrow window, the path elided ----
app = await App.launch({ dataDir, width: 900, height: 760 });
try {
  await app.installErrorHook();
  await app.waitFor('[data-projects-pane] .row.project', 10000);
  await app.go(deepest);
  await app.waitFor('.top [data-path]', 10000);
  await until(async () => (await crumbs(app)).includes('more'), 5000);
  const shown = await crumbs(app);
  check(
    'in a narrow window the path is elided: the first and the last crumbs, … between',
    shown[0] === 'folder:Greek' && shown[1] === 'more' && shown[shown.length - 1] === `element:${NAMES[4]}` && shown.length < NAMES.length + 3,
    JSON.stringify(shown),
  );
  const fits = await app.exec(
    `const cell = document.querySelector('.top .cell'); const room = cell.querySelector('.room');
     return { cell: Math.round(cell.getBoundingClientRect().right), more: Math.round(cell.querySelector('[data-this-element]').getBoundingClientRect().right), scroll: room.scrollWidth <= room.clientWidth + 1 };`,
  );
  check('and fits its cell, ⋯ within it', fits.more <= fits.cell && fits.scroll, JSON.stringify(fits));
  await app.screenshot('path-3-elided');
  await app.click('.top [data-crumb="more"]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  const hidden = (await menus(app))[0];
  check('… opens a menu of the hidden crumbs', hidden.length >= 2 && hidden.includes('Epic') && hidden.includes(NAMES[0]), JSON.stringify(hidden));
  await app.screenshot('path-4-hidden-crumbs');
  await app.click(await menuItem(app, NAMES[0]));
  await sleep(400);
  check('and enters one', (await app.inView()) === NAMES[0], await app.inView());
  await app.home();
  await sleep(600);
  const errors = await app.pageErrors();
  check('no errors in the page (narrow)', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('path-failure-2').catch(() => {});
  checks.push({ name: 'the narrow run completed', ok: false });
} finally {
  await app.close();
}

// ---- run 3: two sides ----
app = await App.launch({ dataDir, width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitFor('[data-projects-pane] .row.project', 10000);
  await app.go(deepest);
  await app.waitFor('.top [data-path]', 10000);
  await until(async () => (await app.inView()) === NAMES[4], 8000);
  check('with one side, no cell is coloured', JSON.stringify(await cellClasses(app)) === JSON.stringify(['0:plain']), JSON.stringify(await cellClasses(app)));

  await splitMenu(app, 'This element, as diagram and text');
  check('Split view: two cells, the first active', JSON.stringify(await cellClasses(app)) === JSON.stringify(['0:active', '1:other']), JSON.stringify(await cellClasses(app)));
  const over = await app.exec(
    `const c = Array.from(document.querySelectorAll('.top .cell')).map((e) => e.getBoundingClientRect());
     const p = Array.from(document.querySelectorAll('.pane')).map((e) => e.getBoundingClientRect());
     return c.map((r, i) => Math.abs(r.left - p[i].left) + Math.abs(r.right - p[i].right));`,
  );
  check('each cell stands over its side', over.every((d) => d < 4), JSON.stringify(over));
  for (const theme of ['light', 'dark', 'mellow']) {
    await app.setTheme(theme);
    await sleep(300);
    const colours = await app.exec(
      `const [a, o] = Array.from(document.querySelectorAll('.top .cell'));
       const last = a.querySelector('[data-crumb-last]');
       return { active: getComputedStyle(a).backgroundColor, other: getComputedStyle(o).backgroundColor, ink: getComputedStyle(last).color, accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() };`,
    );
    check(`the active cell is in the accent, the other not (${theme})`, colours.active !== colours.other && colours.ink !== colours.active, JSON.stringify(colours));
    await app.screenshot(`path-5-two-sides-${theme}`);
  }
  await app.setTheme('light');
  await focusSide(app, 1);
  await sleep(200);
  check('a press in the other side moves the colour', JSON.stringify(await cellClasses(app)) === JSON.stringify(['0:other', '1:active']), JSON.stringify(await cellClasses(app)));

  // Switch sides draws them the other way round.
  const order = () =>
    app.exec(
      `const at = (sel) => Array.from(document.querySelectorAll(sel)).map((e) => Math.round(e.getBoundingClientRect().left));
       const c = at('.top .cell'); const p = at('.pane');
       return { cells: c[0] < c[1] ? '01' : '10', panes: p[0] < p[1] ? '01' : '10', text: !!document.querySelectorAll('.pane')[0].querySelector('.diagram') };`,
    );
  const before = await order();
  await splitMenu(app, 'Switch sides');
  const after = await order();
  check('Switch sides reverses the cells and the sides', before.cells === '01' && before.panes === '01' && after.cells === '10' && after.panes === '10', `${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  await app.screenshot('path-6-switched');
  await splitMenu(app, 'Switch sides');
  check('and back again', (await order()).cells === '01');

  // Another project beside.
  await splitMenu(app, 'Another project…');
  await app.waitFor('dialog [data-beside-chooser] .row.project', 5000);
  await app.clickText('dialog [data-beside-chooser] .row.project', 'Notes');
  await app.waitGone('dialog [data-beside-chooser]', 3000);
  await until(async () => (await crumbs(app, 1))[0] === 'project:Notes', 8000);
  const first = await crumbs(app, 0);
  const second = await crumbs(app, 1);
  check('two projects: each path has its own project', first.includes(`project:${PROJECT}`) && second[0] === 'project:Notes', `${JSON.stringify(first)} | ${JSON.stringify(second)}`);
  const marked = await app.exec(`return Array.from(document.querySelectorAll('[data-projects-pane] .row.project[data-shown]')).map((r) => r.querySelector('.name').textContent.trim()).sort()`);
  check('the list marks both projects', JSON.stringify(marked) === JSON.stringify([PROJECT, 'Notes'].sort()), JSON.stringify(marked));
  await focusSide(app, 1);
  await sleep(200);
  await app.click('header button[aria-label="References, pictures, history and changes"]');
  await app.waitFor('.side-map', 5000);
  await sleep(300);
  const about = await app.exec(`return document.querySelector('.side-map [data-side-project]')?.textContent.trim() ?? null`);
  check('the panel at the side names the project it is about while the other has the focus', about === PROJECT, String(about));
  await app.screenshot('path-7-two-projects');
  const header = await app.exec(
    `const h = document.querySelector('.project > header');
     const has = (label) => !!h.querySelector('button[aria-label="' + label + '"]');
     return { preview: has('Preview and export'), share: has('Share'), undo: has('Undo'), redo: has('Redo'), split: !!h.querySelector('[data-side-by-side]') };`,
  );
  check('the bar of the project under the row has Preview, Share, undo and redo, and no Split view', header.preview && header.share && header.undo && header.redo && !header.split, JSON.stringify(header));
  await app.click('header button[aria-label="References, pictures, history and changes"]');
  await sleep(200);

  // The × in the bar of the other project's side closes it.
  await app.click(await app.exec(`return document.querySelectorAll('.pane')[1].querySelector('[data-close-side]')`));
  await sleep(500);
  check('the × of the side beside closes it', (await app.count('.pane')) === 1 && (await crumbs(app, 0)).includes(`project:${PROJECT}`));

  // Ctrl+W closes the side that has the focus.
  await splitMenu(app, 'This element, as diagram and text');
  await focusSide(app, 1);
  await sleep(200);
  await app.keys(['Control', 'w']);
  await sleep(500);
  check('Ctrl+W closes the side that has the focus', (await app.count('.pane')) === 1 && (await app.exists('.project')));

  // The first side closed while the other shows another project: that becomes the project of the view.
  await splitMenu(app, 'Another project…');
  await app.waitFor('dialog [data-beside-chooser] .row.project', 5000);
  await app.clickText('dialog [data-beside-chooser] .row.project', 'Notes');
  await app.waitGone('dialog [data-beside-chooser]', 3000);
  await until(async () => (await crumbs(app, 1))[0] === 'project:Notes', 8000);
  await app.click(await app.exec(`return document.querySelectorAll('.pane')[0].querySelector('[data-close-side]')`));
  await until(async () => (await app.exec('return location.hash')).includes(ids.notes) && (await app.count('.pane')) === 1, 8000);
  await until(async () => JSON.stringify(await crumbs(app, 0)) === JSON.stringify(['project:Notes']), 8000);
  check('the first side closed, the other project is the project of the view', (await app.exec('return location.hash')).includes(ids.notes) && JSON.stringify(await crumbs(app, 0)) === JSON.stringify(['project:Notes']), await app.exec('return location.hash'));
  await until(async () => (await app.exec(`return document.querySelector('[data-projects-pane] .row.project[data-current] .name')?.textContent.trim() ?? null`)) === 'Notes', 5000);
  check('the list marks it', (await app.exec(`return document.querySelector('[data-projects-pane] .row.project[data-current] .name')?.textContent.trim() ?? null`)) === 'Notes');
  await app.keys(['Control', '2']);
  await sleep(400);
  await app.keys(['Control', '1']);
  await sleep(600);
  check('and the house goes back to it', (await app.exec('return location.hash')).includes(ids.notes), await app.exec('return location.hash'));

  // Close in the list's menu of a project closes its sides.
  await app.openProject(PROJECT);
  await app.waitFor('.top [data-path]', 10000);
  await sleep(400);
  await app.rightClick(await app.findByText('[data-projects-pane] .row.project', PROJECT));
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Close');
  await app.waitFor('[data-start]', 8000);
  check('Close in the list closes the project: the start screen', await app.exists('[data-start]'));

  // With one side, its × gives the start screen, and the list marks no row.
  await app.openProject(PROJECT);
  await app.waitFor('.top [data-path]', 10000);
  await sleep(400);
  await app.click('.pane [data-close-side]');
  await app.waitFor('[data-start]', 8000);
  await sleep(300);
  const left = await app.exec(`return document.querySelectorAll('[data-projects-pane] .row[data-shown], [data-projects-pane] .row[data-current]').length`);
  check('the × of the one side closes the project: the start screen, and no row marked', (await app.exists('[data-start]')) && left === 0, `${left} marked`);
  await app.screenshot('path-8-closed');
  await app.keys(['Control', '1']);
  await sleep(500);
  check('and the house stays at the start screen', await app.exists('[data-start]'));

  const errors = await app.pageErrors();
  check('no errors in the page (two sides)', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('path-failure-3').catch(() => {});
  checks.push({ name: 'the run of two sides completed', ok: false });
} finally {
  await app.close();
  rmSync(dataDir, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
