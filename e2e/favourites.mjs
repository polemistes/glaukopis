// Favourite projects (record 0086): Add to favourites in a project's menu
// puts it under the heading Favourites at the top of the list, in the order
// added; the heading folds as a folder does, by a click and by the keys; a
// favourite's row opens the project, has its menu with no fold, is not moved
// by the keys, and has no tree under it, which stands under the project's
// own row; the filter shows the favourites that match; the start screen shows
// the favourites first, not repeated among the last opened, with the
// project's menu on the right button; Remove from favourites takes one off,
// and the heading goes with the last; a project deleted is no longer a
// favourite, nor when it is brought back.

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
/** A project's own row in the tree, by its name. */
const treeRow = (name) =>
  `Array.from(document.querySelectorAll('${LIST} .row.project[data-project]')).find((r) => r.querySelector('.name')?.textContent.trim() === ${JSON.stringify(name)})`;
/** A favourite's row, under the heading, by its name. */
const favRow = (name) =>
  `Array.from(document.querySelectorAll('${LIST} .row[data-favourite]')).find((r) => r.querySelector('.name')?.textContent.trim() === ${JSON.stringify(name)})`;
const HEADING = `${LIST} [data-favourites]`;
/** The names of the favourites' rows, top to bottom. */
const favourites = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('${LIST} .row[data-favourite] .name')).map((n) => n.textContent.trim())`);
/** The keys of the rows of the list, top to bottom. */
const rowKeys = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('${LIST} [data-row]')).map((r) => r.dataset.row)`);
const menuLabels = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.querySelector('.label')?.textContent.trim() ?? m.textContent.trim())`);
/** The names of the cards of a strip of the start screen. */
const cards = (app, strip) =>
  app.exec(`return Array.from(document.querySelectorAll('[data-start] [${strip}] [data-start-project] .name')).map((n) => n.textContent.trim())`);
const projectId = async (app, name) => (await invoke(app, 'project_list')).find((p) => p.name === name)?.id;

/** Words in the field that finds a project, in place of what was there. */
const filterBy = (app, words) =>
  app.exec(
    `const i = document.querySelector('${LIST} .tools input'); i.value = arguments[0]; i.dispatchEvent(new Event('input', { bubbles: true }));`,
    words,
  );

async function fromMenu(app, target, label) {
  await app.rightClick(target);
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', label);
  await sleep(300);
}

const app = await App.launch({ width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');

  // A folder with two projects, and one at the top.
  const greek = await invoke(app, 'folder_create', { name: 'Greek', parent: null, id: null });
  await invoke(app, 'project_create', { name: 'Iliad', id: null, folder: greek.id });
  await invoke(app, 'project_create', { name: 'Odyssey', id: null, folder: greek.id });
  await invoke(app, 'project_create', { name: 'Notes', id: null, folder: null });
  await app.exec('location.reload();');
  await app.waitFor(`${LIST} .row.project`, 10000);
  await sleep(400);
  const iliad = await projectId(app, 'Iliad');
  const notes = await projectId(app, 'Notes');
  const odyssey = await projectId(app, 'Odyssey');

  check('with no favourites, no heading', !(await app.exists(HEADING)) && !(await app.exists('[data-start-favourites]')));

  // ---- made favourites from the menu, in the order added ----
  await app.rightClick(await app.exec(`return ${treeRow('Notes')}`));
  await app.waitFor('.menu');
  const menu = await menuLabels(app);
  check(
    'a project’s menu has Add to favourites, after the fold and before the rest',
    menu.indexOf('Add to favourites') === menu.indexOf('Unfold') + 1 && menu.indexOf('Add to favourites') < menu.indexOf('Rename…'),
    JSON.stringify(menu),
  );
  await app.clickText('.menu [role="menuitem"]', 'Add to favourites');
  await until(() => app.exists(HEADING));
  await fromMenu(app, await app.exec(`return ${treeRow('Iliad')}`), 'Add to favourites');
  await until(async () => (await favourites(app)).length === 2);
  check('the heading Favourites stands at the top', (await app.exec(`return document.querySelector('${HEADING} .name')?.textContent.trim()`)) === 'Favourites' && (await rowKeys(app))[0] === 'h:favourites', JSON.stringify((await rowKeys(app)).slice(0, 4)));
  check('the favourites stand under it in the order added, not by name', JSON.stringify(await favourites(app)) === JSON.stringify(['Notes', 'Iliad']), JSON.stringify(await favourites(app)));
  check(
    'then the tree as it was, the favourites in it too',
    JSON.stringify((await rowKeys(app)).slice(1)) === JSON.stringify([`v:${notes}`, `v:${iliad}`, `f:${greek.id}`, `p:${iliad}`, `p:${odyssey}`, `p:${notes}`]),
    JSON.stringify(await rowKeys(app)),
  );
  check('kept by the core in that order', JSON.stringify(await invoke(app, 'favourites_list')) === JSON.stringify([notes, iliad]));
  await app.screenshot('favourites-1-list');

  // ---- the heading folds as a folder does ----
  await app.click(HEADING);
  await until(async () => !(await favourites(app)).length);
  check('a click on the heading folds the favourites away', !(await favourites(app)).length && (await app.attr(HEADING, 'aria-expanded')) === 'false');
  check('and the tree is as it was', !!(await app.exec(`return ${treeRow('Iliad')}`)));
  await app.click(HEADING);
  await until(async () => (await favourites(app)).length === 2);
  check('a second click unfolds them', (await favourites(app)).length === 2);
  await app.exec(`document.querySelector('${HEADING}').focus()`);
  await sleep(100);
  await app.keys(['Tab']);
  await until(async () => !(await favourites(app)).length);
  check('Tab on the heading folds it', !(await favourites(app)).length);
  await app.keys(['Enter']);
  await until(async () => (await favourites(app)).length === 2);
  check('Enter unfolds it', (await favourites(app)).length === 2);
  await app.keys(['ArrowDown']);
  await sleep(150);
  check('the arrow down comes to the first favourite', (await app.exec(`return document.activeElement?.dataset?.row ?? null`)) === `v:${notes}`);
  await app.keys(['ArrowLeft']);
  await sleep(150);
  check('the arrow left back to the heading', (await app.exec(`return document.activeElement?.dataset?.row ?? null`)) === 'h:favourites');

  // ---- a favourite is not moved by the keys ----
  await app.exec(`${favRow('Notes')}.focus()`);
  await sleep(100);
  await app.keys(['Alt', 'ArrowRight']);
  await sleep(600);
  const notesInfo = (await invoke(app, 'project_list')).find((p) => p.id === notes);
  check('Alt+Right on a favourite moves nothing into a folder', !notesInfo.folder, JSON.stringify(notesInfo.folder));
  await app.keys(['Shift', 'F10']);
  await app.waitFor('.menu');
  const favMenu = await menuLabels(app);
  check(
    'Shift+F10 on a favourite gives the project’s menu, with Remove from favourites and no fold',
    favMenu[0] === 'Open' && favMenu.includes('Remove from favourites') && !favMenu.includes('Unfold') && !favMenu.includes('Fold'),
    JSON.stringify(favMenu),
  );
  await app.press('Escape');
  await sleep(150);

  // ---- the filter ----
  await filterBy(app, 'ili');
  await sleep(300);
  check('with a filter, the favourites that match', JSON.stringify(await favourites(app)) === JSON.stringify(['Iliad']), JSON.stringify(await favourites(app)));
  await filterBy(app, 'odys');
  await sleep(300);
  check('and no heading where none matches', !(await app.exists(HEADING)));
  await filterBy(app, '');
  await until(async () => (await favourites(app)).length === 2);

  // ---- opened from the favourite's row ----
  await app.click(await app.exec(`return ${favRow('Iliad')}`));
  await app.waitFor('.project', 10000);
  await sleep(800);
  // An element in it, so that it has a tree to show.
  await app.newElementUnder();
  await until(() => app.exists(`${LIST} [data-project-tree="${iliad}"]`), 5000);
  await sleep(500);
  check('a click on a favourite opens the project', (await app.exec('return location.hash')).includes(iliad));
  check(
    'its tree stands under its own row in the tree, not under the favourite',
    (await app.exec(`return ${treeRow('Iliad')}?.nextElementSibling?.dataset.projectTree ?? null`)) === iliad &&
      !(await app.exec(`return ${favRow('Iliad')}?.nextElementSibling?.classList.contains('tree')`)),
  );
  check('the project’s row is marked as open, the favourite’s is not', (await app.exec(`return ${treeRow('Iliad')}?.hasAttribute('data-current')`)) === true && (await app.exec(`return ${favRow('Iliad')}?.classList.contains('current')`)) === false);
  await app.screenshot('favourites-2-open');

  // ---- the start screen ----
  await app.openProject('Odyssey');
  await sleep(300);
  await app.home();
  await sleep(500);
  check('the start screen shows the favourites first, in the order added', JSON.stringify(await cards(app, 'data-start-favourites')) === JSON.stringify(['Notes', 'Iliad']), JSON.stringify(await cards(app, 'data-start-favourites')));
  check(
    'a favourite is not repeated among the last opened',
    JSON.stringify(await cards(app, 'data-start-recent')) === JSON.stringify(['Odyssey']),
    JSON.stringify(await cards(app, 'data-start-recent')),
  );
  check(
    'the strip of the favourites stands before the last opened',
    await app.exec(`const f = document.querySelector('[data-start-favourites]'), r = document.querySelector('[data-start-recent]'); return !!(f && r && (f.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING));`),
  );
  await app.screenshot('favourites-3-start');
  await fromMenu(app, `[data-start-favourites] [data-start-project="${notes}"]`, 'Remove from favourites');
  await until(async () => (await cards(app, 'data-start-favourites')).length === 1);
  check('Remove from favourites in a card’s menu takes it off', JSON.stringify(await cards(app, 'data-start-favourites')) === JSON.stringify(['Iliad']));
  check('and from the list', JSON.stringify(await favourites(app)) === JSON.stringify(['Iliad']));

  // ---- the last taken off, from the list ----
  await fromMenu(app, await app.exec(`return ${favRow('Iliad')}`), 'Remove from favourites');
  await until(async () => !(await app.exists(HEADING)));
  check('with the last taken off, the heading is gone', !(await app.exists(HEADING)));
  check('and the strip of the start screen', !(await app.exists('[data-start-favourites]')));
  check('the project is among the last opened again', (await cards(app, 'data-start-recent')).includes('Iliad'), JSON.stringify(await cards(app, 'data-start-recent')));
  await app.screenshot('favourites-4-none');

  // ---- deleted, and brought back ----
  await invoke(app, 'favourite_set', { id: odyssey, on: true });
  await invoke(app, 'project_delete', { id: odyssey });
  check('a project deleted is no longer a favourite', !(await invoke(app, 'favourites_list')).includes(odyssey));
  const trash = await invoke(app, 'project_trash');
  await invoke(app, 'project_restore', { entry: trash.find((e) => e.info.id === odyssey).entry });
  check('nor when it is brought back', !(await invoke(app, 'favourites_list')).includes(odyssey));

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
