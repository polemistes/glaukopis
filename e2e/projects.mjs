// The page of projects in its two forms: the last used as cards, all of them
// as a list in folders; and a map of the projects (ADR 0031).

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** The rows of the list, as "depth:kind:name". */
const rowsOf = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.list .row')).map((r) =>
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

  // --- A new project opens on its text ---
  const begin = async (name) => {
    await app.clickText('button', 'Begin a project');
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
  await app.screenshot('projects-1-new-in-text');

  await app.go('#/');
  await app.waitForText('h1', 'Projects', 8000);
  await begin('Beta');
  await app.go('#/');
  await app.waitForText('h1', 'Projects', 8000);
  await begin('Gamma');
  await app.go('#/');
  await app.waitForText('h1', 'Projects', 8000);
  await sleep(300);
  check('the last used are shown as cards', (await app.count('.card')) === 3);

  // --- The list of all projects ---
  await app.click('[role="radio"][aria-label="All projects"]');
  await app.waitFor('.list .row.project', 5000);
  await sleep(200);
  check(
    'the list has a line for each project, by name',
    JSON.stringify(await rowsOf(app)) ===
      JSON.stringify(['0:project:Alpha', '0:project:Beta', '0:project:Gamma']),
    JSON.stringify(await rowsOf(app)),
  );

  // A folder.
  await app.clickText('.list button', 'New folder');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Greek');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.list .row.folder', 5000);
  await sleep(200);
  check(
    'a folder is made, and stands first',
    (await rowsOf(app))[0] === '0:folder:Greek' &&
      (await app.text('.row.folder .count')) === '0 projects',
    (await rowsOf(app))[0],
  );

  // A project moved into it through its menu.
  await app.rightClick(await app.findByText('.row.project', 'Alpha'));
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
  check('and the folder counts it', (await app.text('.row.folder .count')) === '1 project');
  await app.screenshot('projects-2-list-with-folder');

  // Another, dragged onto the folder.
  await app.drag(await app.findByText('.row.project', 'Beta'), await app.find('.row.folder'));
  await sleep(400);
  rows = await rowsOf(app);
  check(
    'a project dragged onto a folder goes into it',
    rows.includes('1:project:Beta') && (await app.text('.row.folder .count')) === '2 projects',
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

  // Found by name.
  await app.type('.list .tools input', 'bet');
  await sleep(300);
  rows = await rowsOf(app);
  check(
    'the field finds a project by its name, in its folder',
    JSON.stringify(rows) === JSON.stringify(['0:folder:Greek', '1:project:Beta']),
    JSON.stringify(rows),
  );
  await app.exec(
    `const i = document.querySelector('.list .tools input'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await sleep(200);

  // The form is remembered.
  await app.go('#/library');
  await sleep(300);
  await app.go('#/');
  await app.waitFor('.list .row', 8000);
  check('the form of the page is remembered', await app.exists('.list .row.folder'));

  // --- A map of the projects ---
  await app.click('header button[aria-label="More"]');
  await app.clickText('[role="menuitem"]', 'A map of the projects');
  await app.waitFor('dialog input');
  await sleep(200);
  await app.screenshot('projects-3-map-dialog');
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
  await app.screenshot('projects-4-map-of-projects');

  await app.go('#/');
  await app.waitFor('.list .row', 8000);
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
