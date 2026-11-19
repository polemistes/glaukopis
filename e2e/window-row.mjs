// The row over the window (records 0096, 0097, 0098): no rail; the
// places of the window in the row at its top, the house, the library (in
// whose place the notebook stands, between its references and its files)
// and the list's button at its start, Help (where it is offered), the keys and the
// settings at its end, in that
// order, in every view: the start screen with the list shown (the start in
// the list's head) and hidden (the start in the row over it), a project with
// the list shown and hidden, the library and its files. Each place is lit
// where it should be and goes where it goes; the list's button is disabled
// where there is no list; the switch References | Notebook | Files stands in the row
// over the library and its files. The search through everything is no place
// of the row: Ctrl+Shift+F from the library goes to the field of the list of
// projects. Screenshots of each view, and of a project with two sides in the
// light, the dark and the mellow theme.

import { App, helpOffered, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const invoke = (app, cmd, args) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, cmd, args);

/** The places of the row, in the order they stand from left to right: name, whether lit, whether disabled, and the part of the window they stand in. */
const places = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-row-start] .place, [data-row-end] .place'))
       .map((p) => ({ el: p, left: p.getBoundingClientRect().left }))
       .sort((a, b) => a.left - b.left)
       .map(({ el }) => ({
         place: el.dataset.place,
         lit: el.classList.contains('current'),
         disabled: !!el.disabled,
         in: el.closest('[data-projects-pane]') ? 'list' : el.closest('.project > .top') ? 'project' : el.closest('[data-top-row]') ? 'row' : '?',
       }));`,
  );
/** The end of the row: with Help where Help is offered (it is not, for now: the harness reads the switch). */
const END = helpOffered ? ['help', 'keys', 'settings'] : ['keys', 'settings'];
const ORDER = ['projects', 'library', 'list', ...END].join(' ');
const order = (shown) => shown.map((p) => p.place).join(' ');
const lit = (shown) => shown.filter((p) => p.lit).map((p) => p.place).join(' ');
const at = (shown, place) => shown.find((p) => p.place === place);
/** Whether the places stand in one line, as high as the row, at the top of the window. */
const inOneLine = (app) =>
  app.exec(
    `const ps = Array.from(document.querySelectorAll('[data-row-start] .place, [data-row-end] .place')).map((p) => p.getBoundingClientRect());
     const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h'));
     return ps.length === ${3 + END.length} && ps.every((r) => r.top >= 0 && r.bottom <= bar + 2 && Math.abs(r.top - ps[0].top) < 2);`,
  );
const noRail = (app) => app.exec(`return !document.querySelector('.rail, nav.rail')`);

const app = await App.launch({ width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  const homer = await invoke(app, 'project_create', { name: 'Homer', id: null, folder: null });
  await app.exec('location.reload();');
  await app.waitFor('[data-start]', 10000);
  await app.waitFor('[data-projects-pane] .row.project', 10000);
  await sleep(400);

  // ---- the start screen, the list shown: the start of the row in its head ----
  let shown = await places(app);
  check('no rail', await noRail(app));
  check('the places, in their order', order(shown) === ORDER, order(shown));
  check('in one line at the top of the window', await inOneLine(app));
  check(
    'on the start screen with the list shown, the start of the row is in the list\'s head, the end in the row over the start screen',
    ['projects', 'library', 'list'].every((p) => at(shown, p)?.in === 'list') && END.every((p) => at(shown, p)?.in === 'row'),
    JSON.stringify(shown.map((p) => `${p.place}:${p.in}`)),
  );
  check('the house and the list\'s button are lit', lit(shown) === 'projects list', lit(shown));
  check(
    'the list\'s head has no word Projects and no ×, but its + and ⋯',
    await app.exec(`const h = document.querySelector('[data-projects-pane] header');
      return !h.querySelector('h2') && !!h.querySelector('[data-projects-new]') && !!h.querySelector('[data-projects-more]') && !Array.from(h.querySelectorAll('button')).some((b) => b.getAttribute('aria-label') === 'Close the list of projects');`),
  );
  check('the row over the start screen has a line under it', await app.exec(`const r = document.querySelector('[data-top-row]'); return !!r && parseFloat(getComputedStyle(r).borderBottomWidth) > 0`));
  await app.screenshot('window-row-1-start');

  // ---- the start screen, the list hidden: the start of the row in the row over it ----
  await app.click('[data-projects-button]');
  await app.waitGone('[data-projects-pane]', 3000);
  await sleep(300);
  shown = await places(app);
  check(
    'the list hidden, the whole row stands over the start screen, the list\'s button no longer lit',
    order(shown) === ORDER && shown.every((p) => p.in === 'row') && lit(shown) === 'projects' && !at(shown, 'list').disabled,
    JSON.stringify(shown),
  );
  await app.screenshot('window-row-2-start-no-list');
  await app.click('[data-projects-button]');
  await app.waitFor('[data-projects-pane]', 3000);
  await sleep(300);
  check('and its button shows it again', await app.exists('[data-projects-pane] header [data-row-start]'));

  // ---- a project, the list shown ----
  await app.openProject('Homer');
  await app.waitFor('.top [data-path]', 10000);
  await sleep(400);
  shown = await places(app);
  check(
    'in a project with the list shown, the start of the row is in the list\'s head, the end at the right of the project\'s top row',
    order(shown) === ORDER && ['projects', 'library', 'list'].every((p) => at(shown, p).in === 'list') && END.every((p) => at(shown, p).in === 'project'),
    JSON.stringify(shown.map((p) => `${p.place}:${p.in}`)),
  );
  check('the house and the list\'s button are lit', lit(shown) === 'projects list', lit(shown));
  check('in one line at the top of the window', await inOneLine(app));
  check(
    'the list\'s head and the project\'s top row are as high, their lines meeting',
    await app.exec(`const h = document.querySelector('[data-projects-pane] header').getBoundingClientRect(), t = document.querySelector('.project > .top').getBoundingClientRect();
      return Math.abs(h.bottom - t.bottom) < 1 && Math.abs(h.top - t.top) < 1;`),
  );
  check(
    'the end of the row stands at the right end of the window',
    await app.exec(`const e = document.querySelector('.project > .top [data-row-end]').getBoundingClientRect(); return Math.abs(window.innerWidth - e.right) < 2;`),
  );
  check('Split view stands in the cell, before the ×', await app.exists('.top .cell .close [data-side-by-side] + [data-close-side]'));
  check(
    'the × is called Close view',
    (await app.exec(`return document.querySelector('.top .cell [data-close-side]')?.getAttribute('aria-label')`)) === 'Close view',
    await app.exec(`return document.querySelector('.top .cell [data-close-side]')?.getAttribute('aria-label')`),
  );
  await app.screenshot('window-row-3-project');

  // ---- a project, the list hidden ----
  await app.keys(['Control', 'Shift', 'l']);
  await app.waitGone('[data-projects-pane]', 3000);
  await sleep(400);
  shown = await places(app);
  check(
    'in a project with the list hidden, the whole row is the project\'s top row, the list\'s button no longer lit',
    order(shown) === ORDER && shown.every((p) => p.in === 'project') && lit(shown) === 'projects',
    JSON.stringify(shown),
  );
  const leftEdge = await app.exec(`const s = document.querySelector('.project > .top [data-row-start]').getBoundingClientRect(), p = document.querySelector('.pane').getBoundingClientRect(), c = document.querySelector('.top .cell').getBoundingClientRect(), e = document.querySelector('.project > .top [data-row-end]').getBoundingClientRect();
    // With no pane at the right, the end of the row stands over the side's end, and the cell gives way to it.
    return { start: Math.round(s.left), pane: Math.round(p.left), cellLeft: Math.round(c.left - s.right), cellRight: Math.round(Math.abs(c.right - Math.min(p.right, e.left))) };`);
  check(
    'the start of the row at the left edge of the window, the cell after it and ending where the end of the row begins',
    leftEdge.start < 2 && leftEdge.pane < 2 && Math.abs(leftEdge.cellLeft) < 3 && leftEdge.cellRight < 4,
    JSON.stringify(leftEdge),
  );
  await app.screenshot('window-row-4-project-no-list');

  // Two sides, in the three themes, the list hidden.
  await app.click('.top [data-side-by-side]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'This element, as diagram and text');
  await app.waitUntil(`return document.querySelectorAll('.pane').length === 2`, 5000, 'two sides');
  await sleep(500);
  check('two sides: Split view on the join of the cells', (await app.exists('.top .join [data-side-by-side]')) && !(await app.exists('.top .cell [data-side-by-side]')));
  for (const theme of ['light', 'dark', 'mellow']) {
    await app.setTheme(theme);
    await sleep(300);
    await app.screenshot(`window-row-5-two-sides-no-list-${theme}`);
  }
  await app.setTheme('light');
  await app.keys(['Control', 'Shift', 'l']);
  await app.waitFor('[data-projects-pane]', 3000);
  await sleep(400);
  for (const theme of ['light', 'dark', 'mellow']) {
    await app.setTheme(theme);
    await sleep(300);
    await app.screenshot(`window-row-6-two-sides-${theme}`);
  }
  await app.setTheme('light');

  // ---- the keys and the settings, lit while they are open ----
  await app.click('[data-place="keys"]');
  await app.waitForText('dialog[open] h2', 'Keys', 3000);
  check('the keyboard opens the keys, and is lit while they are shown', await app.exists('[data-place="keys"].current'));
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000);
  await app.click('[data-place="settings"]');
  await app.waitForText('dialog[open] header h2', 'Settings', 3000);
  check('the gear opens the settings, and is lit while they are open', await app.exists('[data-place="settings"].current'));
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000);
  await sleep(200);

  // ---- the library ----
  await app.click('[data-place="library"]');
  await app.waitFor('.library', 8000);
  await sleep(400);
  shown = await places(app);
  check('the book goes to the library', (await app.exec('return location.hash')).startsWith('#/library'), await app.exec('return location.hash'));
  check(
    'over the library a row with the same places, the list\'s button disabled, the book lit',
    order(shown) === ORDER && shown.every((p) => p.in === 'row') && at(shown, 'list').disabled && lit(shown) === 'library',
    JSON.stringify(shown),
  );
  check('in one line at the top of the window', await inOneLine(app));
  check(
    'the switch References | Notebook | Files stands in the row, after the start of the row, and not in the library\'s own head',
    await app.exec(`const row = document.querySelector('[data-top-row]'); const sw = row?.querySelector('[data-library-switch]');
      return !!sw && sw.getBoundingClientRect().left >= row.querySelector('[data-row-start]').getBoundingClientRect().right - 1 && !document.querySelector('.library [data-library-switch]');`),
  );
  await app.screenshot('window-row-7-library');

  // ---- its files ----
  await app.clickText('[data-library-switch] [role="radio"]', 'Files');
  await app.waitFor('.files-view', 8000);
  await sleep(400);
  shown = await places(app);
  check(
    'over the files the same row, the book still lit, the switch in it',
    order(shown) === ORDER && at(shown, 'list').disabled && lit(shown) === 'library' && (await app.exists('[data-top-row] [data-library-switch]')) && !(await app.exists('.files-view [data-library-switch]')),
    JSON.stringify(shown),
  );
  await app.screenshot('window-row-8-files');

  // ---- the house goes back to the project shown last ----
  await app.click('[data-place="projects"]');
  await app.waitFor('.project', 8000);
  await sleep(300);
  check('the house goes back to the project shown last', (await app.exec('return location.hash')).includes(homer.id), await app.exec('return location.hash'));
  check('no rail anywhere', await noRail(app));

  // ---- the search is the field of the list of projects (record 0098) ----
  await app.go('#/library');
  await app.waitFor('.library', 8000);
  await sleep(300);
  check('no search among the places', !(await app.exists('[data-place="search"]')));
  await app.keys(['Control', 'Shift', 'f']);
  await app.waitFor('[data-projects-pane] input[data-list-field="texts"]', 8000);
  await sleep(400);
  check(
    'Ctrl+Shift+F from the library goes to the project shown last, the cursor in the field of the list',
    (await app.exec('return location.hash')).includes(homer.id) &&
      (await app.exec(`return document.activeElement === document.querySelector('[data-projects-pane] input[data-list-field]')`)),
    await app.exec('return location.hash'),
  );
  await app.screenshot('window-row-9-search');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('window-row-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
