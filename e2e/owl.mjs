// The map of the projects behaves as a tree (ADR 0050): what is done in a
// project's diagram is done over folders and projects, in the map's own
// look. Selecting and going about with the keys, menus; making and naming in
// place, renaming, undoing; moving by the keys and by dragging, deleting;
// entering a folder and coming up, from it and from a project.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const selected = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('[data-owl-map] [data-selected]')).map((e) => e.dataset.owlKey)`);
/** The text of what is selected, the last of them. */
const selectedName = (app) =>
  app.exec(`const s = Array.from(document.querySelectorAll('[data-owl-map] [data-selected]')).pop();
            return s ? (s.querySelector('.label, .name')?.textContent ?? '').trim() : null;`);
const card = (name) =>
  `Array.from(document.querySelectorAll('[data-owl-project]')).find((c) => c.querySelector('.name')?.textContent.trim() === ${JSON.stringify(name)})`;
const label = (name) =>
  `Array.from(document.querySelectorAll('[data-owl-folder]')).find((c) => c.querySelector('.label')?.textContent.trim() === ${JSON.stringify(name)})`;
const parentOfCard = (app, name) => app.exec(`return ${card(name)}?.dataset.owlParent ?? null`);
const cardEl = async (app, name) => app.exec(`return ${card(name)} ?? null`);
const labelEl = async (app, name) => app.exec(`return ${label(name)} ?? null`);
const hasCard = (app, name) => app.exec(`return !!${card(name)}`);
const hasLabel = (app, name) => app.exec(`return !!${label(name)}`);
const invoke = (app, cmd, args) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, cmd, args);

async function waitUntil(fn, ms = 4000) {
  const start = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - start > ms) return false;
    await sleep(80);
  }
}

/** Writes a name into the field that is open, and keeps it. */
async function name(app, text) {
  await app.waitFor('[data-name-field]', 3000);
  await sleep(80);
  await app.keys(text);
  await app.press('Enter');
  await app.waitGone('[data-name-field]', 3000);
  await sleep(200);
}

const app = await App.launch({ width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');

  // Two folders and three projects, made by the commands, then read anew.
  const greek = await invoke(app, 'folder_create', { name: 'Greek', parent: null, id: null });
  const roman = await invoke(app, 'folder_create', { name: 'Roman', parent: null, id: null });
  await invoke(app, 'project_create', { name: 'Iliad', id: null, folder: greek.id });
  await invoke(app, 'project_create', { name: 'Odyssey', id: null, folder: greek.id });
  await invoke(app, 'project_create', { name: 'Notes', id: null, folder: null });
  await app.exec('location.hash = "#/owl"; location.reload();');
  await sleep(1500);
  await app.installErrorHook();
  await app.waitFor('[data-owl-map]', 10000);
  await sleep(700);

  // --- 1. Selecting, going about, menus ---
  await app.click('[data-owl-key="owl"]');
  await sleep(150);
  check('a click selects', JSON.stringify(await selected(app)) === '["owl"]', JSON.stringify(await selected(app)));
  check(
    'and the map has the keys',
    await app.exec(`return document.activeElement?.hasAttribute('data-owl-map')`),
  );
  await app.press('ArrowRight');
  await sleep(120);
  const first = await selected(app);
  check('an arrow goes to the next', first.length === 1 && first[0] !== 'owl', JSON.stringify(first));
  await app.keys(['Shift', 'ArrowDown']);
  await sleep(120);
  check('Shift and an arrow select more', (await selected(app)).length === 2, JSON.stringify(await selected(app)));
  await app.press('Escape');
  await sleep(120);
  check('Escape lets go', (await selected(app)).length === 0);
  await app.keys(['Control', 'a']);
  await sleep(120);
  const all = await selected(app);
  check('Ctrl+A selects all but the owl', all.length === 5 && !all.includes('owl'), JSON.stringify(all));
  await app.click(await labelEl(app, 'Greek'));
  await sleep(120);
  check('a click on a folder selects it, and does not fold it', (await selectedName(app)) === 'Greek' && (await hasCard(app, 'Iliad')));
  await app.keys(['Shift', 'F10']);
  await app.waitFor('.menu', 3000);
  const folderMenu = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.textContent.trim())`);
  check('Shift+F10 opens the menu of a folder', folderMenu.some((m) => m.startsWith('Rename')) && folderMenu.some((m) => m.startsWith('New project here')), JSON.stringify(folderMenu));
  await app.press('Escape');
  await app.waitGone('.menu', 3000);
  await app.exec(`const m = document.querySelector('[data-owl-map]').getBoundingClientRect();
    const x = m.left + 30, y = m.top + 30;
    document.elementFromPoint(x, y).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 }));`);
  await app.waitFor('.menu', 3000);
  check('the ground of the map has a menu', await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).some((m) => m.textContent.includes('New folder here'))`));
  await app.press('Escape');
  await app.waitGone('.menu', 3000);
  check('a card in a folder is a level deeper', (await app.exec(`return ${card('Iliad')}?.getAttribute('aria-level')`)) === '3');
  await app.press('Space');
  await sleep(250);
  check('Space folds the folder selected', !(await hasCard(app, 'Iliad')));
  await app.press('Space');
  await sleep(250);
  check('and unfolds it', await hasCard(app, 'Iliad'));
  await app.screenshot('owl-1-selected');
  await app.doubleClick(await cardEl(app, 'Notes'));
  check('a double click opens a project', await waitUntil(async () => (await app.exec('return location.hash')).startsWith('#/project/')));
  await sleep(600);
  await app.go('#/owl');
  await app.waitFor('[data-owl-map]', 5000);
  await sleep(600);

  // --- 2. Making and naming in place, renaming, undoing ---
  await app.click('[data-owl-key="owl"]');
  await app.press('Tab');
  await name(app, 'Latin');
  check('Tab makes a folder, named in place', await hasLabel(app, 'Latin'));
  check('and the new folder is selected', (await selectedName(app)) === 'Latin');
  const latin = await app.exec(`return ${label('Latin')}?.dataset.owlFolder`);
  await app.press('Enter');
  await name(app, 'Aeneid');
  check('Enter makes a project in the folder selected', (await parentOfCard(app, 'Aeneid')) === `folder:${latin}`, await parentOfCard(app, 'Aeneid'));
  await app.press('F2');
  await name(app, 'Aeneis');
  check('F2 renames in place', (await hasCard(app, 'Aeneis')) && !(await hasCard(app, 'Aeneid')));
  await app.keys('X');
  await app.waitFor('[data-name-field]', 3000);
  const begun = await app.exec(`return document.querySelector('[data-name-field]').value`);
  check('a letter begins a new name', begun === 'X', begun);
  await app.press('Escape');
  await app.waitGone('[data-name-field]', 3000);
  await sleep(150);
  check('Escape keeps the old name', await hasCard(app, 'Aeneis'));
  const cards = await app.count('[data-owl-project]');
  await app.press('Enter');
  await app.waitFor('[data-name-field]', 3000);
  await app.press('Escape');
  await app.waitGone('[data-name-field]', 3000);
  await sleep(150);
  check('a new one left unnamed is not made', (await app.count('[data-owl-project]')) === cards);
  await app.click(await cardEl(app, 'Aeneis'));
  await app.press('F2');
  await name(app, 'Aeneis bis');
  await app.clickText('.toaster .toast .action', 'Undo');
  check('the message of a renaming undoes it', await waitUntil(() => hasCard(app, 'Aeneis')));
  await app.click('[data-owl-key="owl"]');
  await app.press('Enter');
  await name(app, 'Scratch');
  check('a project made at the top stands under the owl', (await parentOfCard(app, 'Scratch')) === 'owl');
  await app.keys(['Control', 'z']);
  check('Ctrl+Z undoes the making', await waitUntil(async () => !(await hasCard(app, 'Scratch'))));
  await app.keys(['Control', 'Shift', 'z']);
  check('Ctrl+Shift+Z makes it again', await waitUntil(() => hasCard(app, 'Scratch')));
  await app.screenshot('owl-2-made');
  await app.go('#/');
  await app.waitForText('h1', 'Projects', 5000);
  await app.click('[role="radio"][aria-label="All projects"]').catch(() => {});
  await app.waitFor('.list .row.folder', 5000);
  check('the list has the folder made on the map', await app.exec(`return Array.from(document.querySelectorAll('.list .row.folder .name')).some((n) => n.textContent.trim() === 'Latin')`));
  await app.go('#/owl');
  await app.waitFor('[data-owl-map]', 5000);
  await sleep(600);

  // --- 3. Moving and deleting ---
  await app.click(await cardEl(app, 'Notes'));
  const side = await app.exec(`return ${card('Notes')}?.dataset.side`);
  const outwards = side === 'left' ? 'ArrowLeft' : 'ArrowRight';
  const inwards = side === 'left' ? 'ArrowRight' : 'ArrowLeft';
  await app.keys(['Alt', outwards]);
  check('Alt and the arrow outwards put it into the folder before it', await waitUntil(async () => (await parentOfCard(app, 'Notes')) === `folder:${roman.id}`), await parentOfCard(app, 'Notes'));
  await app.keys(['Alt', inwards]);
  check('and inwards take it out again', await waitUntil(async () => (await parentOfCard(app, 'Notes')) === 'owl'), await parentOfCard(app, 'Notes'));
  await app.drag(await cardEl(app, 'Notes'), await labelEl(app, 'Greek'));
  check('a card dragged onto a folder goes into it', await waitUntil(async () => (await parentOfCard(app, 'Notes')) === `folder:${greek.id}`), await parentOfCard(app, 'Notes'));
  await app.keys(['Control', 'z']);
  check('and Ctrl+Z brings it back', await waitUntil(async () => (await parentOfCard(app, 'Notes')) === 'owl'), await parentOfCard(app, 'Notes'));
  await app.drag(await cardEl(app, 'Notes'), await cardEl(app, 'Iliad'));
  check('a card dragged onto a card goes into its folder', await waitUntil(async () => (await parentOfCard(app, 'Notes')) === `folder:${greek.id}`), await parentOfCard(app, 'Notes'));
  await app.drag(await cardEl(app, 'Notes'), '[data-owl-key="owl"]');
  check('and onto the owl, out of all folders', await waitUntil(async () => (await parentOfCard(app, 'Notes')) === 'owl'), await parentOfCard(app, 'Notes'));
  await app.click(await cardEl(app, 'Scratch'));
  await app.press('Delete');
  await app.waitFor('dialog', 3000);
  await sleep(300);
  await app.clickText('dialog footer button', 'Delete project');
  check('Delete moves a project to the trash, when that is confirmed', await waitUntil(async () => !(await hasCard(app, 'Scratch'))));
  await app.clickText('.toaster .toast .action', 'Undo');
  check('and its message brings it back', await waitUntil(() => hasCard(app, 'Scratch')));
  await app.drag(await cardEl(app, 'Scratch'), await labelEl(app, 'Roman'));
  await waitUntil(async () => (await parentOfCard(app, 'Scratch')) === `folder:${roman.id}`);
  await app.click(await labelEl(app, 'Roman'));
  await app.press('Delete');
  await app.waitFor('dialog', 3000);
  await sleep(300);
  await app.clickText('dialog footer button', 'Delete folder');
  check('Delete on a folder deletes it, and what was in it moves up', await waitUntil(async () => !(await hasLabel(app, 'Roman')) && (await parentOfCard(app, 'Scratch')) === 'owl'));
  await app.keys(['Control', 'z']);
  check('Ctrl+Z makes the folder again, under its own id, with what was in it', await waitUntil(async () => (await app.exec(`return ${label('Roman')}?.dataset.owlFolder`)) === roman.id && (await parentOfCard(app, 'Scratch')) === `folder:${roman.id}`));
  await app.screenshot('owl-3-moved');

  // --- 4. Entering a folder, and coming up ---
  await app.doubleClick(await labelEl(app, 'Greek'));
  check('a double click on a folder enters it', await waitUntil(async () => (await app.exec('return location.hash')) === `#/owl/${greek.id}`), await app.exec('return location.hash'));
  await sleep(600);
  check('the folder stands at the centre', await app.exec(`return document.querySelector('.folder.centre .label')?.textContent.trim() === 'Greek'`));
  check('with what is in it, and nothing else', (await hasCard(app, 'Iliad')) && !(await hasCard(app, 'Notes')));
  check('the bar says where one is', (await app.exec(`return document.querySelector('[data-owl-here]')?.textContent.trim()`)) === 'Greek');
  await app.click('[data-owl-map]');
  await app.keys(['Alt', 'Shift', 'ArrowUp']);
  check('Alt+Shift+Up goes up', await waitUntil(async () => (await app.exec('return location.hash')) === '#/owl'));
  check('with the folder selected', await waitUntil(async () => (await selectedName(app)) === 'Greek'));
  await app.press('ArrowRight');
  await app.click(await labelEl(app, 'Greek'));
  await app.keys(['Alt', 'Shift', 'ArrowDown']);
  check('Alt+Shift+Down enters it too', await waitUntil(async () => (await app.exec('return location.hash')) === `#/owl/${greek.id}`));
  await sleep(600);
  await app.doubleClick(await cardEl(app, 'Iliad'));
  check('a project opens from a folder entered', await waitUntil(async () => (await app.exec('return location.hash')).startsWith('#/project/')));
  await sleep(1200);
  await app.click('.up.home');
  check('up from the top of a project comes to its folder', await waitUntil(async () => (await app.exec('return location.hash')) === `#/owl/${greek.id}`), await app.exec('return location.hash'));
  check('with the project selected', await waitUntil(async () => (await selectedName(app)) === 'Iliad'));
  if (!(await app.exists('[data-projects-pane]'))) await app.click('[data-projects-button]');
  await app.waitFor('[data-projects-pane]', 3000);
  check('the pane marks the folder in view', await app.exists(`[data-projects-pane] [data-folder="${greek.id}"][data-current]`));
  await app.screenshot('owl-4-entered');

  // --- 5. One map: titles whole, the maps of projects, placing by hand, moving elements ---
  const long = 'The Wrath of Achilles and the Quarrel with Agamemnon over Briseis';
  await invoke(app, 'project_create', { name: long, id: null, folder: null });
  // Elements in Iliad, made in its own diagram.
  await app.go('#/owl');
  await app.waitFor('[data-owl-map]', 5000);
  await sleep(600);
  await app.exec('location.reload();');
  await sleep(1500);
  await app.installErrorHook();
  await app.waitFor('[data-owl-map]', 10000);
  await sleep(600);
  const iliad = await app.exec(`return ${card('Iliad')}?.dataset.owlProject`);
  await app.go(`#/project/${iliad}?mode=diagram`);
  await app.waitFor('.diagram .node.root', 10000);
  await sleep(500);
  const add = async (key, text) => {
    await app.press(key);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(text);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(100);
  };
  await app.click('.diagram .node.root');
  await add('Tab', 'Wrath');
  await add('Enter', 'Ships');
  await add('Enter', 'Embassy');
  await app.exec('history.back()');
  await sleep(300);
  await app.go('#/owl');
  await app.waitFor('[data-owl-map]', 5000);
  await sleep(800);

  const nameBox = await app.exec(`const n = ${card(long)}?.querySelector('.name'); return n ? { h: n.offsetHeight, sw: n.scrollWidth, cw: n.clientWidth, text: n.textContent.trim() } : null;`);
  check('a long title is shown whole, on more lines', !!nameBox && nameBox.text === long && nameBox.h > 30 && nameBox.sw <= nameBox.cw + 1, JSON.stringify(nameBox));

  const element = (name) => `Array.from(document.querySelectorAll('[data-owl-element]')).find((e) => e.querySelector('.label')?.textContent.trim() === ${JSON.stringify(name)})`;
  const hasElement = (name) => app.exec(`return !!${element(name)}`);
  const elementEl = (name) => app.exec(`return ${element(name)} ?? null`);
  const elementNames = () => app.exec(`return Array.from(document.querySelectorAll('[data-owl-element]')).map((e) => e.querySelector('.label').textContent.trim() + '<' + (e.dataset.owlParent ?? ''))`);
  const iliadTree = async () => {
    const loaded = await app.projectLoad(iliad);
    return loaded;
  };
  await app.click(await cardEl(app, 'Iliad'));
  await app.press('Space');
  check('Space shows the map of a project under its card', await waitUntil(() => hasElement('Wrath'), 6000), JSON.stringify(await elementNames()));
  check('in the order of the project', JSON.stringify((await elementNames()).map((n) => n.split('<')[0])) === JSON.stringify(['Wrath', 'Ships', 'Embassy']), JSON.stringify(await elementNames()));
  await app.screenshot('owl-5-map-shown');

  // Alt and the arrows move an element within its project.
  await app.click(await elementEl('Embassy'));
  await app.keys(['Alt', 'ArrowUp']);
  check('Alt+Up moves an element up among those beside it, in its project', await waitUntil(async () => JSON.stringify((await elementNames()).map((n) => n.split('<')[0])) === JSON.stringify(['Wrath', 'Embassy', 'Ships']), 6000), JSON.stringify(await elementNames()));
  const elementSide = await app.exec(`return ${element('Embassy')}?.dataset.side`);
  await app.keys(['Alt', elementSide === 'left' ? 'ArrowLeft' : 'ArrowRight']);
  const wrathKey = await app.exec(`return ${element('Wrath')}?.dataset.owlKey`);
  check('Alt and the arrow outwards put it under the one before it', await waitUntil(async () => (await app.exec(`return ${element('Embassy')}?.dataset.owlParent`)) === wrathKey, 6000), await app.exec(`return ${element('Embassy')}?.dataset.owlParent`));
  await app.keys(['Control', 'z']);
  check('Ctrl+Z puts it back', await waitUntil(async () => (await app.exec(`return ${element('Embassy')}?.dataset.owlParent`)) === `project:${iliad}`, 6000));

  const fitted = async () => {
    await app.click('[data-owl-map] .controls button[aria-label="Show all of it"]');
    await sleep(300);
  };
  // Dragged onto another element of the same project: under it.
  await fitted();
  await app.drag(await elementEl('Ships'), await elementEl('Wrath'));
  check('an element dragged onto another goes under it', await waitUntil(async () => (await app.exec(`return ${element('Ships')}?.dataset.owlParent`)) === wrathKey, 6000), await app.exec(`return ${element('Ships')}?.dataset.owlParent`));

  // Dragged onto the ground: it stays where it was let go, written into the project.
  await fitted();
  // Measured from the card of its project, from which its place is kept, as an element's is from its parent.
  const fromCard = `const r = ${element('Embassy')}.getBoundingClientRect(), c = ${card('Iliad')}.getBoundingClientRect(); return { x: r.left - c.left, y: r.top - c.top };`;
  const before = await app.exec(fromCard);
  await app.drag(await elementEl('Embassy'), { dx: 60, dy: -120 });
  await sleep(1500);
  const after = await app.exec(fromCard);
  check('an element dropped on the ground stays where it was let go', Math.abs(after.y - before.y + 120) < 30 && Math.abs(after.x - before.x - 60) < 30, JSON.stringify({ before, after }));
  const posInProject = await app.execAsync(`const bytes = new Uint8Array(await window.__TAURI_INTERNALS__.invoke('project_load', { id: arguments[0] })); return bytes.length;`, iliad);
  check('and the project was written', posInProject > 0);

  // Folders and projects put by hand.
  await fitted();
  const notesBefore = await app.exec(`const r = ${card('Notes')}.getBoundingClientRect(); return { x: r.left, y: r.top };`);
  await app.drag(await cardEl(app, 'Notes'), { dx: -40, dy: -160 });
  await sleep(800);
  const notesAfter = await app.exec(`const r = ${card('Notes')}.getBoundingClientRect(); return { x: r.left, y: r.top };`);
  check('a card dropped on the ground stays where it was let go', Math.abs(notesAfter.y - notesBefore.y + 160) < 30, JSON.stringify({ notesBefore, notesAfter }));
  check('and the place is kept on this computer', Object.keys(await invoke(app, 'owl_places', {})).includes(`project:${await app.exec(`return ${card('Notes')}?.dataset.owlProject`)}`));
  await app.keys(['Control', 'z']);
  await sleep(800);
  const notesBack = await app.exec(`const r = ${card('Notes')}.getBoundingClientRect(); return { x: r.left, y: r.top };`);
  check('Ctrl+Z puts it back in its place', Math.abs(notesBack.y - notesBefore.y) < 6, JSON.stringify({ notesBefore, notesBack }));

  // Carried to another project.
  await app.click(await cardEl(app, 'Odyssey'));
  await app.press('Space');
  await sleep(1200);
  await fitted();
  await app.drag(await elementEl('Embassy'), await cardEl(app, 'Odyssey'));
  const odyssey = await app.exec(`return ${card('Odyssey')}?.dataset.owlProject`);
  check('an element dragged onto another project is carried there', await waitUntil(async () => (await app.exec(`return ${element('Embassy')}?.dataset.owlOf`)) === odyssey, 8000), await app.exec(`return ${element('Embassy')}?.dataset.owlOf`));
  await app.keys(['Control', 'z']);
  check('and Ctrl+Z carries it back', await waitUntil(async () => (await app.exec(`return ${element('Embassy')}?.dataset.owlOf`)) === iliad, 8000), await app.exec(`return ${element('Embassy')}?.dataset.owlOf`));
  await app.screenshot('owl-6-one-map');

  // Jumping in anywhere.
  await fitted();
  await app.doubleClick(await elementEl('Wrath'));
  check('a double click on an element opens its project there', await waitUntil(async () => (await app.exec('return location.hash')).startsWith(`#/project/${iliad}/`), 5000), await app.exec('return location.hash'));
  await sleep(800);
  check('with that element in view', await waitUntil(async () => (await app.exec(`return document.querySelector('.diagram .node.root .caption, .text-view .section .heading')?.textContent.trim()`)) === 'Wrath', 5000), await app.exec(`return document.querySelector('.diagram .node.root .caption, .text-view .section .heading')?.textContent.trim()`));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, JSON.stringify(errors));
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
