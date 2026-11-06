// More than one window (record 0085): New window from the ⋯ at the head of
// the list of projects; the same project open in two windows, a line typed
// in one read in the other; a project renamed in one, its new name in the
// other's list; a favourite made in one, in the other's list; a reference
// added in one, in the other's library; the list of projects hidden in one,
// hidden in the other; the second window closed and the first going on;
// Ctrl+Shift+N; and Open in a new window from a project's row, the project
// open there. The windows are reached by their handles.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const LIST = '[data-projects-pane] .list';
const listNames = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${LIST} .row.project[data-project] .name')).map((n) => n.textContent.trim())`,
  );
const favouriteNames = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${LIST} .row[data-favourite] .name')).map((n) => n.textContent.trim())`,
  );
const textOf = (app) =>
  app.exec(`return document.querySelector('.text-view')?.textContent.replace(/\\s+/g, ' ') ?? ''`);
const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
/** Waits, at most `ms`, until `probe` gives what `ok` takes; gives the last it gave. */
async function until(probe, ok, ms = 5000) {
  const end = Date.now() + ms;
  let got = await probe();
  while (!ok(got) && Date.now() < end) {
    await sleep(150);
    got = await probe();
  }
  return got;
}
/** The text of the project open in this window, turned to if the diagram is shown. */
async function toText(app) {
  await app.waitFor('.diagram, .text-view', 10000);
  if (!(await app.exists('.text-view'))) await app.keys(['Control', 'd']);
  await app.waitFor('.text-view', 8000);
}

const app = await App.launch({ width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');

  // A project in the first window, with a line in it.
  await app.beginProject();
  await app.type('dialog input', 'Shared notes');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(800);
  await app.keys('Written in the first window.');
  await sleep(1500);
  const id = (await invoke(app, 'project_list')).find((p) => p.name === 'Shared notes')?.id;
  const first = await app.currentWindow();

  // New window, from the ⋯ at the head of the list.
  await app.click('[data-projects-more]');
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'New window');
  const two = await app.waitForWindows(2);
  check('New window in the ⋯ of the list opens a second window', two.length === 2);
  const second = two.find((h) => h !== first);
  await app.switchTo(second);
  await app.waitFor('[data-start]', 10000);
  check('the second window shows the start screen', true);
  await app.screenshot('windows-1-second');

  // The same project in the second window.
  await app.go(`#/project/${encodeURIComponent(id)}`);
  await toText(app);
  const read = await until(() => textOf(app), (t) => t.includes('Written in the first window.'));
  check('the project opened in the second window has what was written in the first', read.includes('Written in the first window.'));
  await app.clickText('.text-view p', 'Written in the first window.');
  await sleep(400);
  await app.keys(['End']);
  await app.keys(' And in the second.');
  await app.switchTo(first);
  const back = await until(() => textOf(app), (t) => t.includes('And in the second.'));
  check('a line typed in the second is read in the first, at once', back.includes('And in the second.'), back.slice(0, 80));

  // A project made and renamed, a favourite made, a reference added in the first; seen in the
  // second. One that is open is renamed in its own element, and goes with the document.
  const other = await invoke(app, 'project_create', { name: 'Another', id: null, folder: null });
  await invoke(app, 'project_rename', { id: other.id, name: 'Notes, renamed' });
  await invoke(app, 'favourite_set', { id, on: true });
  await invoke(app, 'library_add', {
    draft: { key: '', type: 'book', fields: { title: 'Added in the first window' }, names: {} },
  });
  await app.switchTo(second);
  const names = await until(() => listNames(app), (n) => n.includes('Notes, renamed'));
  check('a project renamed in one window has its new name in the other’s list', names.includes('Notes, renamed'), names.join(', '));
  const favs = await until(() => favouriteNames(app), (n) => n.includes('Shared notes'));
  check('a favourite made in one window is in the other’s list', favs.includes('Shared notes'), favs.join(', '));
  await app.keys(['Control', '2']);
  await app.waitFor('.library', 8000);
  const library = await until(
    () => app.exec(`return document.querySelector('.library')?.textContent ?? ''`),
    (t) => t.includes('Added in the first window'),
  );
  check('a reference added in one window is in the other’s library', library.includes('Added in the first window'));
  await app.screenshot('windows-2-library');

  // The list of projects hidden in the first, hidden in the second.
  await app.switchTo(first);
  const shown = () => app.exec(`return !!document.querySelector('[data-projects-pane]')`);
  check('the list of projects is shown in the first', await shown());
  await app.click('[data-projects-button]');
  await until(shown, (s) => !s);
  await app.switchTo(second);
  await app.keys(['Control', '1']);
  await sleep(500);
  const hidden = await until(shown, (s) => !s);
  check('the list of projects hidden in one window is hidden in the other', !hidden);
  await app.switchTo(first);
  await app.click('[data-projects-button]');
  await until(shown, (s) => s);

  // The second closed: the first goes on.
  await app.exec(
    `window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: 'window-2' }).catch(() => {}); return null;`,
  );
  const one = await app.waitForWindows(1);
  await app.switchTo(one[0]);
  check('the second window closed, the first goes on', one[0] === first && (await textOf(app)).includes('And in the second.'));

  // Ctrl+Shift+N.
  await app.keys(['Control', 'Shift', 'N']);
  const again = await app.waitForWindows(2);
  check('Ctrl+Shift+N opens a new window', again.length === 2);
  const third = again.find((h) => h !== first);
  await app.switchTo(third);
  await app.waitFor('[data-start]', 10000);
  await app.exec(
    `window.__TAURI_INTERNALS__.invoke('plugin:window|close', { label: 'window-3' }).catch(() => {}); return null;`,
  );
  await app.waitForWindows(1);
  await app.switchTo(first);

  // Open in a new window, from the project's row.
  await app.home();
  await app.waitFor(`${LIST} .row.project[data-project]`, 8000);
  await app.rightClick(
    await app.exec(
      `return Array.from(document.querySelectorAll('${LIST} .row.project[data-project]')).find((r) => r.querySelector('.name')?.textContent.trim() === 'Shared notes')`,
    ),
  );
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Open in a new window');
  const last = await app.waitForWindows(2);
  await app.switchTo(last.find((h) => h !== first));
  await toText(app);
  const opened = await until(() => textOf(app), (t) => t.includes('And in the second.'));
  check('Open in a new window opens the project there', opened.includes('Written in the first window. And in the second.'));
  await app.screenshot('windows-3-opened');

  await app.switchTo(first);
  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('windows-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
