// The notebook in the search through everything, and the notebook written
// as Org: a note written on the notebook's page with a word no project
// holds, and a second note after it; the field of the list of projects,
// searching the texts of all projects, finds the word under Notebook, with
// the note's name and the words around it, and says it was found in the
// notebook; pressing the hit opens that note on the notebook's page; a
// project given the same word is found beside it, the line saying one
// project and the notebook; and, the notebook left and its whole state
// saved when it has been still for a while, notebook.org in the notebook's
// folder of the data folder holds the note's heading, its drawer and its
// words. Screenshots in e2e/output/notebook-search-<n>-<what>.png.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
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

/** A word no project and no other note holds. */
const WORD = 'glaukopiskos';
const NOTE_NAME = 'Owls in Aristophanes';
const NOTE_TEXT = `The little owl, the ${WORD}, is the bird of Athena.`;

const ROWS = '[data-notes] [role="option"]';
const FIELD = '[data-projects-pane] input[data-list-field]';
/** The titles of the rows of the notebook's list, as they stand. */
const titles = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${ROWS} .title')).map((t) => t.textContent.trim())`,
  );
/** What the search through everything found: the projects, each by its name with its hits. */
const projectsFound = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-found-list] .project')).map((p) => ({ name: p.querySelector('.name').textContent.trim(), hits: Array.from(p.querySelectorAll('.hit')).map((h) => h.textContent.replace(/\\s+/g, ' ').trim()) }))`,
  );
/** What it found in the notebook: the heading, its count, and the hits; null where there is no such section. */
const notebookFound = (app) =>
  app.exec(
    `const s = document.querySelector('[data-found-list] [data-found-notebook]');
     return s ? { name: s.querySelector('h3 .name').textContent.trim(), count: s.querySelector('h3 .count').textContent.trim(), hits: Array.from(s.querySelectorAll('.hit')).map((h) => h.textContent.replace(/\\s+/g, ' ').trim()) } : null;`,
  );
const everythingSaid = (app) =>
  app.exec(`return document.querySelector('[data-found-list] .said')?.textContent.replace(/\\s+/g, ' ').trim() ?? ''`);

/** Puts the cursor in the field of the list of projects, and writes the words there in place of what it holds. */
async function searchFor(app, words) {
  await app.keys(['Control', 'Shift', 'f']);
  await app.waitFor(FIELD, 5000);
  const focused = await until(
    () => app.exec(`return document.activeElement === document.querySelector(arguments[0])`, FIELD),
    (f) => f,
    2000,
  );
  if (!focused) await app.click(FIELD);
  await app.exec(`const i = document.querySelector(arguments[0]); i.focus(); i.select();`, FIELD);
  await app.keys(words);
}

const app = await App.launch({ width: 1360, height: 880 });
const dataDir = app.dataDir;
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');

  // ---- a note with a word no project holds, and a second note after it ----
  await app.keys(['Control', '3']);
  await app.waitFor('[data-notebook]', 8000);
  await app.waitFor('[data-notebook-empty]', 8000);
  await app.clickText('[data-notebook-empty] button', 'New note');
  await app.waitFor('[data-note-editor] [data-note-text] .ProseMirror', 5000);
  await app.waitUntil(`return !!document.activeElement?.closest?.('[data-note-text]')`, 3000, 'the cursor in the text of the new note');
  await app.keys(NOTE_TEXT);
  await app.click('[data-note-name]');
  await app.keys(NOTE_NAME);
  await app.press('Enter');
  await sleep(300);
  await app.click('[data-new-note]');
  await sleep(400);
  await app.keys('Hermes carries messages.');
  const listed = await until(() => titles(app), (t) => t.length === 2 && t[0] === 'Hermes carries messages.');
  check('two notes are written, the second chosen', listed.length === 2 && listed[1] === NOTE_NAME, listed.join(' | '));
  await sleep(800);
  await app.screenshot('notebook-search-1-notes');

  // ---- the field of the list of projects finds it under Notebook ----
  await searchFor(app, WORD);
  const found = await until(() => notebookFound(app), (f) => !!f, 15000);
  check(
    'the search through everything finds the word under Notebook',
    found?.name === 'Notebook' && found.count === '1' && found.hits.length === 1,
    JSON.stringify(found),
  );
  check(
    'the hit says the note by its name, and shows the words around the word',
    !!found?.hits[0]?.startsWith(NOTE_NAME) && found.hits[0].includes(`the ${WORD}, is the bird of Athena.`),
    found?.hits[0] ?? '',
  );
  check('no project is found, for none holds the word', (await projectsFound(app)).length === 0);
  const saidFirst = await until(() => everythingSaid(app), (s) => s === 'One found in the notebook');
  check('the line says it was found in the notebook', saidFirst === 'One found in the notebook', saidFirst);
  await app.screenshot('notebook-search-2-found');

  // ---- pressing the hit opens the note ----
  await app.click('[data-found-notebook] .hit');
  await app.waitUntil(`return location.hash.startsWith('#/notebook?note=')`, 5000, 'the route of the note');
  const opened = await until(
    () => app.exec(`return document.querySelector('[data-note-name]')?.value ?? ''`),
    (v) => v === NOTE_NAME,
    5000,
  );
  const openedText = await app.exec(`return document.querySelector('[data-note-text] .ProseMirror')?.textContent ?? ''`);
  check('pressing the hit opens the note on the notebook’s page', opened === NOTE_NAME && openedText.includes(WORD), `${opened} / ${openedText}`);
  check(
    'it is chosen in the list',
    await app.exec(
      `return Array.from(document.querySelectorAll('${ROWS}[aria-selected="true"] .title')).some((t) => t.textContent.includes(arguments[0]))`,
      NOTE_NAME,
    ),
  );
  // The list of what was found stands in the list of projects, which the notebook's page does not show: nothing of it is looked for here.
  await app.screenshot('notebook-search-3-opened');

  // ---- a project with the same word is found beside it ----
  await app.exec(`document.querySelector(arguments[0])?.focus()`, FIELD);
  await app.press('Escape');
  await sleep(300);
  await app.beginProject();
  await app.type('dialog input', 'Birds');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys(`Of the ${WORD} and other birds.`);
  // Written to the project's log, which the search reads.
  await sleep(1500);
  await searchFor(app, WORD);
  const both = await until(
    async () => ({ projects: await projectsFound(app), notebook: await notebookFound(app) }),
    (b) => b.projects.length === 1 && !!b.notebook,
    20000,
  );
  check(
    'a project holding the word is found beside the notebook',
    both.projects[0]?.name === 'Birds' && both.projects[0].hits.some((h) => h.includes(`Of the ${WORD} and other birds.`)) && both.notebook?.count === '1',
    JSON.stringify(both),
  );
  check(
    'the notebook stands after the projects',
    await app.exec(
      `const list = document.querySelector('[data-found-list]');
       const p = list.querySelector('.project'), n = list.querySelector('[data-found-notebook]');
       return !!(p && n && (p.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING));`,
    ),
  );
  const saidBoth = await until(() => everythingSaid(app), (s) => s === '2 found in one project and the notebook');
  check('the line counts both, and says where', saidBoth === '2 found in one project and the notebook', saidBoth);
  await app.screenshot('notebook-search-4-beside');

  // With the last project chosen, the notebook is not searched.
  await app.click('[data-projects-pane] [data-list-field-menu]');
  await app.waitFor('[role="menu"]', 3000);
  await app.clickText('[role="menu"] [role^="menuitem"]', 'The last project');
  await sleep(300);
  const last = await until(
    async () => ({ projects: await projectsFound(app), notebook: await notebookFound(app) }),
    (b) => b.projects.length === 1 && !b.notebook,
    15000,
  );
  check('with the last project chosen, the notebook is not searched', last.projects.length === 1 && !last.notebook, JSON.stringify(last));
  await app.click('[data-projects-pane] [data-list-field-menu]');
  await app.waitFor('[role="menu"]', 3000);
  await app.clickText('[role="menu"] [role^="menuitem"]', 'All projects');
  await sleep(300);
  await app.exec(`document.querySelector(arguments[0])?.focus()`, FIELD);
  await app.press('Escape');

  // ---- notebook.org, written a moment after the notebook's whole state is saved ----
  // The notebook is left (the project is in view); its whole state is saved
  // when it has been still for a minute and a half, and the copy a moment
  // after that.
  const orgFile = join(dataDir, 'notebook', 'notebook.org');
  const org = await until(
    () => (existsSync(orgFile) ? readFileSync(orgFile, 'utf8') : ''),
    (text) => text.includes(WORD),
    150000,
  );
  const lines = org.split('\n');
  check('notebook.org is written into the notebook’s folder', org.startsWith('#+TITLE: Notebook\n'), org.slice(0, 80));
  check('with the first box as a heading', lines.includes('* Unsorted'), lines.filter((l) => l.startsWith('*')).join(' | '));
  check('the note as a heading under it, by its name', lines.includes(`** ${NOTE_NAME}`), lines.filter((l) => l.startsWith('**')).join(' | '));
  const at = lines.indexOf(`** ${NOTE_NAME}`);
  check(
    'with its drawer of properties: its id and when it was made',
    lines[at + 1] === ':PROPERTIES:' && /^:ID:\s+\S+/.test(lines[at + 2] ?? '') && /^:MADE:\s+\d{4}-\d\d-\d\dT/.test(lines[at + 3] ?? ''),
    lines.slice(at, at + 5).join(' | '),
  );
  check('and its words', lines.slice(at).some((l) => l.includes(NOTE_TEXT)), org.slice(0, 600));
  check('the second note is there too, the newest first', lines.indexOf('** Hermes carries messages.') > -1 && lines.indexOf('** Hermes carries messages.') < at);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.log('FAIL  the script stopped:', error?.message ?? error);
  checks.push({ name: 'the script ran to the end', ok: false });
  await app.screenshot('notebook-search-stopped').catch(() => {});
} finally {
  await app.close().catch(() => {});
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
