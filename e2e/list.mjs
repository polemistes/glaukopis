// The list of projects at the left is the one tree (record 0063): it is
// shown from the start; its head begins, joins and opens projects and has
// the deleted ones; a folder folds and is not entered; a project is opened,
// opened beside and marked; the keys of the tree move things and undo; up
// from the top of a project comes to its row; the start screen shows the
// projects last opened.

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

const LIST = '[data-projects-pane] .list';
const row = (kind, name) =>
  `Array.from(document.querySelectorAll('${LIST} .row.${kind}')).find((r) => r.querySelector('.name')?.textContent.trim() === ${JSON.stringify(name)})`;
const rowEl = (app, kind, name) => app.exec(`return ${row(kind, name)} ?? null`);
const hasRow = (app, kind, name) => app.exec(`return !!${row(kind, name)}`);
/** The folder a project's row stands under, by the folder's name; null at the top. */
const folderOfRow = (app, name) =>
  app.exec(
    `const r = ${row('project', name)}; const parent = r?.dataset.rowParent;
     if (!parent) return null;
     return document.querySelector('${LIST} [data-row="' + parent + '"] .name')?.textContent.trim() ?? null;`,
  );
/** The labels of the menu that is open. */
const menuLabels = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.querySelector('.label')?.textContent.trim() ?? m.textContent.trim())`);
const selectedRow = (app) =>
  app.exec(`return document.querySelector('${LIST} [data-row][aria-selected="true"]')?.dataset.row ?? null`);
const projectId = async (app, name) => (await invoke(app, 'project_list')).find((p) => p.name === name)?.id;

const app = await App.launch({ width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');

  // ---- nothing yet ----
  check('the list is shown from the start', await app.exists('[data-projects-pane]'));
  check('the start screen welcomes, with the ways to begin', await app.exists('[data-start] .welcome h2'));
  check('there is no map of the projects any more', !(await app.exists('[data-owl-map]')) && !(await app.exists('[data-owl]')));
  await app.screenshot('list-1-welcome');

  // Two folders and three projects, made by the commands, then read anew.
  const greek = await invoke(app, 'folder_create', { name: 'Greek', parent: null, id: null });
  await invoke(app, 'folder_create', { name: 'Roman', parent: null, id: null });
  await invoke(app, 'project_create', { name: 'Iliad', id: null, folder: greek.id });
  await invoke(app, 'project_create', { name: 'Odyssey', id: null, folder: greek.id });
  await invoke(app, 'project_create', { name: 'Notes', id: null, folder: null });
  await app.exec('location.reload();');
  await app.waitFor(`${LIST} .row.project`, 10000);
  await sleep(400);

  check('the start screen offers a new project, and no project was opened yet', (await app.exists('[data-start-new]')) && !(await app.exists('[data-start-recent]')));
  check('the list begins with the folders and the projects in none, with no owl row', (await app.exec(`return document.querySelector('${LIST} .row')?.classList.contains('folder')`)) === true);
  check('a project stands under its folder', (await folderOfRow(app, 'Iliad')) === 'Greek' && (await folderOfRow(app, 'Notes')) === null);

  // ---- the head ----
  await app.click('[data-projects-new]');
  await app.waitFor('.menu');
  const plus = await menuLabels(app);
  check(
    'the plus of the head makes, joins and opens projects',
    ['New project…', 'New folder', 'Join a shared project…', 'A project from a document…', 'Open a project file…', 'Open an Org file…'].every((l) => plus.includes(l)),
    JSON.stringify(plus),
  );
  await app.press('Escape');
  await app.click('[data-projects-more]');
  await app.waitFor('.menu');
  const more = await menuLabels(app);
  check('the ⋯ of the head has the deleted projects and the project of all the projects', more.some((l) => /deleted projects/i.test(l)) && more.includes('A project of all the projects…'), JSON.stringify(more));
  await app.press('Escape');
  await sleep(150);

  // ---- a folder: folded, not entered ----
  await app.rightClick(await rowEl(app, 'folder', 'Greek'));
  await app.waitFor('.menu');
  const folderMenu = await menuLabels(app);
  check('a folder is folded, made in, renamed, moved and deleted, and not entered', folderMenu[0] === 'Fold' && !folderMenu.includes('Enter') && folderMenu.includes('New project here'), JSON.stringify(folderMenu));
  await app.press('Escape');
  await sleep(150);
  await app.click(await rowEl(app, 'folder', 'Greek'));
  await sleep(200);
  check('a click folds a folder', !(await hasRow(app, 'project', 'Iliad')));
  await app.doubleClick(await rowEl(app, 'folder', 'Greek'));
  await sleep(300);
  check('a double click does not enter it: it folds and unfolds, and nothing opens', ['', '#/'].includes(await app.exec('return location.hash')));
  if (!(await hasRow(app, 'project', 'Iliad'))) await app.click(await rowEl(app, 'folder', 'Greek'));
  await until(() => hasRow(app, 'project', 'Iliad'));

  // ---- a project's menu, while none is open ----
  await app.rightClick(await rowEl(app, 'project', 'Notes'));
  await app.waitFor('.menu');
  const closedMenu = await menuLabels(app);
  check('a project is opened from its menu, and nothing is closed while nothing is shown', closedMenu[0] === 'Open' && !closedMenu.includes('Close') && !closedMenu.includes('Open beside'), JSON.stringify(closedMenu));
  await app.press('Escape');
  await sleep(150);

  // ---- moving by the keys, and undoing in the list ----
  await app.click(await rowEl(app, 'project', 'Notes'));
  await app.waitFor('.project', 10000);
  await sleep(500);
  check('a click opens a project, and the list marks it', (await app.exec(`return ${row('project', 'Notes')}?.hasAttribute('data-current')`)) === true);
  await app.screenshot('list-2-open');

  // A project that is shown is not moved from the list: Odyssey, which is not, is.
  // From Iliad, which takes the focus, the arrow down comes to Odyssey.
  await app.exec(`${row('project', 'Iliad')}.focus()`);
  await sleep(100);
  await app.keys(['ArrowDown']);
  await sleep(150);
  const odyssey = await projectId(app, 'Odyssey');
  check('the arrows go from row to row', (await selectedRow(app)) === `p:${odyssey}`, String(await selectedRow(app)));
  await app.keys(['Alt', 'ArrowLeft']);
  await until(async () => (await folderOfRow(app, 'Odyssey')) === null);
  check('Alt+Left takes a project out of its folder', (await folderOfRow(app, 'Odyssey')) === null, String(await folderOfRow(app, 'Odyssey')));
  await app.exec(`${row('project', 'Odyssey')}.focus()`);
  await app.keys(['Control', 'z']);
  await until(async () => (await folderOfRow(app, 'Odyssey')) === 'Greek');
  check('Ctrl+Z in the list undoes it', (await folderOfRow(app, 'Odyssey')) === 'Greek', String(await folderOfRow(app, 'Odyssey')));
  await app.exec(`${row('project', 'Odyssey')}.focus()`);
  await app.keys(['Control', 'Shift', 'z']);
  await until(async () => (await folderOfRow(app, 'Odyssey')) === null);
  check('and Ctrl+Shift+Z does it again', (await folderOfRow(app, 'Odyssey')) === null);

  // ---- dragging into a folder ----
  await app.drag(await rowEl(app, 'project', 'Odyssey'), await rowEl(app, 'folder', 'Roman'));
  await until(async () => (await folderOfRow(app, 'Odyssey')) === 'Roman');
  check('a project dragged onto a folder goes into it', (await folderOfRow(app, 'Odyssey')) === 'Roman', String(await folderOfRow(app, 'Odyssey')));

  // ---- the menu of a project shown, and of another ----
  await app.rightClick(await rowEl(app, 'project', 'Notes'));
  await app.waitFor('.menu');
  const shownMenu = await menuLabels(app);
  check('the project that is shown is not opened again: it is open now', /^Open\s*It is open now$/.test(shownMenu[0] ?? ''), JSON.stringify(shownMenu));
  await app.press('Escape');
  await sleep(150);
  await app.rightClick(await rowEl(app, 'project', 'Iliad'));
  await app.waitFor('.menu');
  const otherMenu = await menuLabels(app);
  check('another is opened, or opened beside', otherMenu[0] === 'Open' && otherMenu[1] === 'Open beside', JSON.stringify(otherMenu));
  await app.clickText('.menu [role="menuitem"]', 'Open beside');
  await until(() => app.exec(`return document.querySelectorAll('.pane').length === 2`), 10000);
  await sleep(800);
  check(
    'opened beside, both projects are marked in the list, the one with the focus most',
    (await app.exec(`return ${row('project', 'Iliad')}?.hasAttribute('data-current')`)) === true &&
      (await app.exec(`return ${row('project', 'Notes')}?.classList.contains('shown')`)) === true,
  );
  await app.screenshot('list-3-beside');

  // ---- up from the top of a project ----
  // The first side, Notes, at its top: Alt+Shift+Up comes to its row in the list.
  await app.click('.pane:first-of-type .pane-body');
  await sleep(300);
  await app.exec(`document.activeElement?.blur?.()`);
  await app.keys(['Alt', 'Shift', 'ArrowUp']);
  const notes = await projectId(app, 'Notes');
  await until(async () => (await selectedRow(app)) === `p:${notes}`);
  check('up from the top of a project comes to its row in the list', (await selectedRow(app)) === `p:${notes}`, String(await selectedRow(app)));
  check('and the row has the focus', (await app.exec(`return document.activeElement?.dataset?.row ?? null`)) === `p:${notes}`);

  // The list hidden, up from the top shows it again.
  await app.keys(['Control', 'Shift', 'l']);
  await app.waitGone('[data-projects-pane]', 3000);
  await app.click('.pane:first-of-type .pane-body');
  await sleep(200);
  await app.exec(`document.activeElement?.blur?.()`);
  await app.keys(['Alt', 'Shift', 'ArrowUp']);
  await app.waitFor('[data-projects-pane]', 3000);
  check('up from the top shows the list where it was hidden', await app.exists('[data-projects-pane]'));

  // ---- the start screen, after projects were opened ----
  await app.home();
  await sleep(400);
  const recent = await app.exec(`return Array.from(document.querySelectorAll('[data-start-recent] [data-start-project] .name')).map((n) => n.textContent.trim())`);
  check('the start screen shows the projects last opened, newest first', JSON.stringify(recent) === JSON.stringify(['Iliad', 'Notes']), JSON.stringify(recent));
  check('with no project marked in the list', !(await app.exists(`${LIST} [data-current]`)));
  await app.screenshot('list-4-start');
  await app.click('[data-start-project]');
  await app.waitFor('.project', 10000);
  check('a click on one opens it', (await app.exec('return location.hash')).includes('/project/'));

  // ---- the house goes back to the project shown last ----
  await app.click('nav.rail a.place[href="#/library"]');
  await app.waitFor('.library, [data-library]', 8000).catch(() => {});
  await sleep(300);
  await app.click('nav.rail a.place[href="#/"]');
  await app.waitFor('.project', 8000);
  check('the house goes back to the project shown last', (await app.exec('return location.hash')).includes('/project/'));

  const errors = await app.pageErrors();
  check('no errors in the page', !errors.length, JSON.stringify(errors).slice(0, 400));
} catch (error) {
  console.error(error);
  check('ran to the end', false, String(error?.message ?? error));
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
