// The home: the map of all projects, its welcome when there is none, the
// plus and the menu of its bar; the list at the left, in folders and as the
// projects last used; going home from a project; and the project of all the
// projects (ADR 0031, ADR 0062).

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** The rows of the list under the owl, as "depth:kind:name". */
const rowsOf = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-projects-pane] .list .row:not([data-owl]):not(.element)')).map((r) =>
       r.dataset.depth + ':' + (r.classList.contains('folder') ? 'folder' : 'project') + ':' + r.querySelector('.name').textContent.trim())`,
  );

const headingsOf = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section .heading')).map((h) => h.textContent.trim())`,
  );

const app = await App.launch({ width: 1280, height: 860 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');

  // --- The welcome, where there is no project ---
  const welcome = await app.exec(
    `return Array.from(document.querySelectorAll('.owl-view .welcome button')).map((b) => b.textContent.trim())`,
  );
  check(
    'with no project, the map welcomes, with the ways to begin',
    ['Begin a project', 'Join a shared project', 'A project from a document…', 'Open a project file…', 'Open an Org file…'].every((w) => welcome.includes(w)),
    JSON.stringify(welcome),
  );
  check('and there is no page of projects', !(await app.exists('.home')));
  await app.screenshot('projects-0-welcome');

  // --- A new project opens on its text ---
  const begin = async (name) => {
    await app.beginProject();
    await app.waitFor('dialog input');
    await app.type('dialog input', name);
    await app.clickText('dialog footer button', 'Create');
    await app.waitFor('.text-view .section', 8000);
    await sleep(300);
  };
  await begin('Alpha');
  check('a new project opens in the text view', await app.exists('.text-view .section'));
  check(
    'with the one heading named after it',
    JSON.stringify(await headingsOf(app)) === '["Alpha"]',
    JSON.stringify(await headingsOf(app)),
  );
  check('a project has no arrow back to a page of projects', !(await app.exists('.project > header button[aria-label="All projects"]')));
  await app.screenshot('projects-1-new-in-text');

  // --- The plus of the map's bar ---
  await app.keys(['Control', '1']);
  await app.waitFor('[data-owl-map]', 8000);
  check('Ctrl+1 comes to the map of all projects', (await app.exec('return location.hash')) === '#/');
  await app.click('[data-owl-new]');
  await sleep(250);
  const plus = await app.exec(
    `return Array.from(document.querySelectorAll('[role="menuitem"]')).map((b) => b.textContent.trim())`,
  );
  check(
    'the plus makes a project or a folder, and joins and opens them',
    ['New project…', 'New folder', 'Join a shared project…', 'A project from a document…', 'Open a project file…', 'Open an Org file…'].every((w) =>
      plus.some((p) => p.startsWith(w)),
    ),
    JSON.stringify(plus),
  );
  await app.screenshot('projects-2-plus');
  await app.press('Escape');
  await sleep(200);
  await begin('Beta');
  await begin('Gamma');
  await app.home();
  await sleep(300);
  check('the map shows the three', (await app.count('[data-owl-project]')) === 3);

  // --- The list at the left, in folders ---
  await app.click('[data-projects-button]');
  await app.waitFor('[data-projects-pane] .list .row.project', 5000);
  await sleep(200);
  if (await app.exists('[data-projects-pane] [role="radio"][aria-label="Folders"][aria-checked="false"]'))
    await app.click('[data-projects-pane] [role="radio"][aria-label="Folders"]');
  await sleep(200);
  check(
    'the list has a line for each project, by name',
    JSON.stringify(await rowsOf(app)) ===
      JSON.stringify(['0:project:Alpha', '0:project:Beta', '0:project:Gamma']),
    JSON.stringify(await rowsOf(app)),
  );
  check(
    'the owl stands above them all, and goes to the map of the projects',
    (await app.exec(`return document.querySelector('[data-projects-pane] .list .row')?.hasAttribute('data-owl')`)) === true,
  );

  // A folder.
  await app.click('[data-projects-pane] .list .tools button[aria-label="New folder"]');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Greek');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('[data-projects-pane] .list .row.folder', 5000);
  await sleep(200);
  check(
    'a folder is made, and stands first',
    (await rowsOf(app))[0] === '0:folder:Greek' && (await app.text('.row.folder .count')) === '0',
    (await rowsOf(app))[0],
  );
  const greek = await app.exec(`return document.querySelector('.row.folder').dataset.folder`);

  // A project moved into it through its menu.
  await app.rightClick(await app.findByText('.row.project', 'Alpha'));
  await sleep(200);
  const menu = await app.exec(
    `return Array.from(document.querySelectorAll('[role="menuitem"]')).map((b) => b.textContent.trim())`,
  );
  check('the menu of a project begins with Enter', menu[0]?.startsWith('Enter'), JSON.stringify(menu));
  await app.clickText('[role="menuitem"]', 'Move to folder');
  await sleep(350);
  await app.clickText('[role="menuitem"]', 'Greek');
  await app.waitFor('.row.project[data-depth="1"]', 5000);
  await sleep(200);
  let rows = await rowsOf(app);
  check(
    'moved into the folder, it stands under it',
    JSON.stringify(rows) ===
      JSON.stringify(['0:folder:Greek', '1:project:Alpha', '0:project:Beta', '0:project:Gamma']),
    JSON.stringify(rows),
  );
  check('and the folder counts it', (await app.text('.row.folder .count')) === '1');

  // Another, dragged onto the folder.
  await app.drag(await app.findByText('.row.project', 'Beta'), await app.find('.row.folder'));
  await sleep(400);
  rows = await rowsOf(app);
  check(
    'a project dragged onto a folder goes into it',
    rows.includes('1:project:Beta') && (await app.text('.row.folder .count')) === '2',
    JSON.stringify(rows),
  );

  // Closed and opened.
  await app.click('.row.folder');
  await sleep(250);
  rows = await rowsOf(app);
  check(
    'a click closes the folder',
    JSON.stringify(rows) === JSON.stringify(['0:folder:Greek', '0:project:Gamma']),
    JSON.stringify(rows),
  );
  await app.click('.row.folder');
  await sleep(250);
  check('and opens it again', (await rowsOf(app)).length === 4);
  await app.screenshot('projects-3-list-with-folder');

  // Found by name.
  await app.type('[data-projects-pane] .list .tools input', 'bet');
  await sleep(300);
  rows = await rowsOf(app);
  check(
    'the field finds a project by its name, in its folder',
    JSON.stringify(rows) === JSON.stringify(['0:folder:Greek', '1:project:Beta']),
    JSON.stringify(rows),
  );
  await app.exec(
    `const i = document.querySelector('[data-projects-pane] .list .tools input'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await sleep(200);

  // --- The projects last used, the other form of the list ---
  await app.click('[data-projects-pane] [role="radio"][aria-label="Last used"]');
  await sleep(300);
  rows = await rowsOf(app);
  check(
    'last used, the list has the projects alone, in no folder, and no owl',
    JSON.stringify(rows.map((r) => r.split(':').slice(1).join(':')).sort()) ===
      JSON.stringify(['project:Alpha', 'project:Beta', 'project:Gamma']) &&
      rows.every((r) => r.startsWith('0:')) &&
      !(await app.exists('[data-projects-pane] .list [data-owl]')),
    JSON.stringify(rows),
  );
  await app.screenshot('projects-4-last-used');
  await app.go('#/library');
  await sleep(300);
  await app.home();
  await app.waitFor('[data-projects-pane] .list .row', 8000);
  check('the form of the list is remembered', !(await app.exists('[data-projects-pane] .list .row.folder')));
  await app.click('[data-projects-pane] [role="radio"][aria-label="Folders"]');
  await sleep(300);

  // --- Home from a project: to its folder, with it selected ---
  await app.openProject('Alpha');
  await sleep(600);
  await app.keys(['Control', '1']);
  check(
    'Ctrl+1 from a project comes to its folder on the map',
    await (async () => {
      for (let i = 0; i < 30; i++) {
        if ((await app.exec('return location.hash')) === `#/owl/${greek}`) return true;
        await sleep(100);
      }
      return false;
    })(),
    await app.exec('return location.hash'),
  );
  await sleep(400);
  check(
    'with the project selected',
    (await app.exec(`return document.querySelector('[data-owl-map] [data-selected] .name')?.textContent.trim()`)) === 'Alpha',
  );
  await app.home();
  await sleep(300);

  // --- The menu of the map's bar: the trash, and a project of all the projects ---
  await app.click('[data-owl-more]');
  await sleep(250);
  check(
    'the trash is in the menu, and offers nothing while it is empty',
    await app.exec(
      `const i = Array.from(document.querySelectorAll('[role="menuitem"]')).find((b) => /deleted project/.test(b.textContent)); return !!i && i.getAttribute('aria-disabled') === 'true';`,
    ),
  );
  await app.screenshot('projects-5-more');
  await app.clickText('[role="menuitem"]', 'A project of all the projects');
  await app.waitFor('dialog input');
  await sleep(200);
  await app.screenshot('projects-6-map-dialog');
  check(
    'the map is named Projects unless told otherwise',
    (await app.exec(`return document.querySelector('dialog input').value`)) === 'Projects',
  );
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitFor('.text-view .section', 10000);
  await sleep(500);
  const headings = await headingsOf(app);
  check(
    'the map holds the folder, and under it its projects, then the rest',
    JSON.stringify(headings) === JSON.stringify(['Projects', 'Greek', 'Alpha', 'Beta', 'Gamma']),
    JSON.stringify(headings),
  );
  const levels = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => Array.from(s.classList).find((c) => c.startsWith('level-')))`,
  );
  check(
    'the projects in the folder stand one level deeper than it',
    levels[1] === 'level-1' && levels[2] === 'level-2' && levels[4] === 'level-1',
    JSON.stringify(levels),
  );
  await app.screenshot('projects-7-map-of-projects');

  await app.home();
  await app.waitFor('[data-projects-pane] .list .row', 8000);
  await sleep(200);
  check(
    'the map is a project among the others',
    (await rowsOf(app)).includes('0:project:Projects'),
    JSON.stringify(await rowsOf(app)),
  );

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('projects-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
