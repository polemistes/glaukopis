// What the user writes about a work: for all projects, or for one.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 8000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
}

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.execAsync(
    `const invoke = window.__TAURI_INTERNALS__.invoke;
     await invoke('import_apply', { plan: await invoke('import_bib_text', { text: arguments[0] }) });`,
    bib,
  );
  const library = () => readFileSync(join(app.dataDir, 'library', 'library.bib'), 'utf8');
  const row = (words) => app.findByText('.list .item', words);
  const button = async (words, scope = '.list .item') =>
    app.exec(
      `const r = Array.from(document.querySelectorAll(arguments[1])).find((e) => e.textContent.includes(arguments[0]));
       return r ? r.querySelector('.note-button') : null;`,
      words,
      scope,
    );
  const press = (el) => app.cmd('POST', '/execute/sync', { script: 'arguments[0].click()', args: [el] });

  // ---- in the library: for all projects ----
  await app.keys(['Control', '2']);
  await app.waitFor('.list .item', 8000);
  await sleep(300);
  check('nothing is marked where nothing is written', (await app.count('.list .note-button.has')) === 0);
  await press(await button('Singer of Tales'));
  await app.waitFor('.notes textarea', 3000);
  await sleep(300);
  check('in the library there is one note, for all projects', (await app.count('.notes textarea')) === 1 && (await app.text('.notes .overline')).toLowerCase() === 'your notes');
  await app.keys('Formula and theme. The singer composes as he sings.');
  await app.press('Enter');
  await app.keys('Compare Parry on the epithet.');
  await app.screenshot('notes-1-library');
  await app.press('Escape');
  await app.waitGone('.notes');
  await until('the note to be kept', async () => /annotation/.test(library()));
  const kept = /annotation\s*=\s*\{([^}]*)\}/.exec(library())?.[1] ?? '';
  check('it is kept with the reference, its lines as paragraphs', /composes as he sings\.\s*\n\s*\n\s*Compare Parry/.test(kept), JSON.stringify(kept));
  check('and the reference is marked', (await app.count('.list .note-button.has')) === 1);

  // Read again, and found by what it says.
  await press(await button('Singer of Tales'));
  await app.waitFor('.notes textarea', 3000);
  await sleep(300);
  const read = await app.exec(`return document.querySelector('.notes textarea').value`);
  check('it is read as it was written', read === 'Formula and theme. The singer composes as he sings.\nCompare Parry on the epithet.', JSON.stringify(read));
  await app.press('Escape');
  await app.waitGone('.notes');
  await app.click('.middle input[type="search"], .search input');
  await app.keys('epithet');
  await sleep(400);
  check('a reference is found by what is written about it', (await app.count('.list .item')) === 1);
  await app.exec(`const i = document.querySelector('.middle input[type="search"], .search input'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true }));`);
  await sleep(300);

  // In the pane of the reference the note is there as well, and the form does not show it as a field.
  await app.click(await row('Singer of Tales'));
  await app.waitFor('.pane textarea.note', 5000);
  await sleep(400);
  const pane = await app.exec(`return document.querySelector('.pane textarea.note').value`);
  check('the pane of the reference shows it', /Compare Parry/.test(pane), pane);
  check('and not among the fields', !(await app.exists('.pane [data-field="annotation"]')));
  await app.screenshot('notes-2-pane');

  // ---- in a project: for the project ----
  await app.keys(['Control', '1']);
  await app.waitForText('button', 'Begin a project', 8000);
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.doubleClick('.diagram .node.root');
  await app.waitFor('.box .text .prose');
  await sleep(250);
  await app.keys('The poem is composed in performance ');
  await app.clickText('.box .tools button', 'Cite');
  await app.waitFor('.picker input');
  await app.keys('singer');
  await sleep(300);
  check('where a work is chosen to be cited, its note is at hand', (await app.count('.picker .row .note-button.has')) === 1);
  await press(await button('Singer of Tales', '.picker .row'));
  await app.waitFor('.notes textarea', 3000);
  await sleep(300);
  const scopes = await app.exec(`return Array.from(document.querySelectorAll('.notes textarea')).map((t) => t.dataset.scope + ':' + t.value.slice(0, 12))`);
  check('in a project there is a note for the project, and the one for all', scopes.join('|') === 'project:|all:Formula and ', scopes.join('|'));
  await app.click('.notes textarea[data-scope="project"]');
  await app.keys('For chapter 2: performance.');
  await app.screenshot('notes-3-picker');
  await app.press('Escape');
  await app.waitGone('.notes');
  check('the picker is still there', await app.exists('.picker input'));
  await app.click('.picker input');
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('13');
  await app.press('Enter');
  await app.waitGone('.editor');
  await sleep(300);

  // From the citation in the text.
  await app.click('.box .text .citation');
  await app.waitFor('.editor .note-button', 3000);
  await press(await app.exec(`return document.querySelector('.editor .note-button')`));
  await app.waitFor('.notes textarea', 3000);
  await sleep(300);
  const fromText = await app.exec(`return document.querySelector('.notes textarea[data-scope="project"]').value`);
  check('from a citation in the text the note is read', fromText === 'For chapter 2: performance.', fromText);

  // Made a note for all projects.
  await app.clickText('.notes button', 'Keep it for all projects');
  await sleep(1200);
  const moved = await app.exec(`return Array.from(document.querySelectorAll('.notes textarea')).map((t) => t.dataset.scope + ':' + t.value)`);
  check(
    'a note of the project can be made one for all projects',
    moved[0] === 'project:' && /^all:Formula[^]*Compare Parry on the epithet\.\nFor chapter 2: performance\.$/.test(moved[1]),
    JSON.stringify(moved),
  );
  await app.press('Escape');
  await app.waitGone('.notes');
  await app.press('Escape');
  await sleep(300);
  await until('it to be in the library', async () => /For chapter 2: performance/.test(library()));
  check('and is then kept with the reference', true);

  // Another note, which stays with the project.
  await app.press('Escape');
  await app.waitGone('.box');
  await app.keys(['Control', 'Shift', 'r']);
  await app.waitFor('.panel .list .item, .panel .item', 5000);
  await sleep(300);
  await press(await button('Singer of Tales', '.panel .item'));
  await app.waitFor('.notes textarea', 3000);
  await sleep(300);
  await app.click('.notes textarea[data-scope="project"]');
  await app.keys('Only for this book.');
  await app.screenshot('notes-4-project');
  await app.press('Escape');
  await app.waitGone('.notes');
  await sleep(600);
  check('what is written for the project is not in the library', !/Only for this book/.test(library()));
  const loaded = await app.projectLoad((await app.exec(`return location.hash`)).split('/')[2].split('?')[0]);
  const inProject = loaded.updates.length + (loaded.state ? 1 : 0);
  check('it is in the project', inProject > 0);

  // In another project the note for all is there, and the other is not.
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 8000);
  await sleep(400);
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Another book');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.keys(['Control', 'Shift', 'r']);
  await app.waitFor('.panel', 5000);
  await app.clickText('.panel [role="radio"]', 'Library');
  await app.waitFor('.panel .item', 5000);
  await sleep(300);
  await press(await button('Singer of Tales', '.panel .item'));
  await app.waitFor('.notes textarea', 3000);
  await sleep(400);
  const elsewhere = await app.exec(`return Array.from(document.querySelectorAll('.notes textarea')).map((t) => t.dataset.scope + ':' + t.value)`);
  check(
    'in another project the note for all projects is there, and that of the first is not',
    elsewhere[0] === 'project:' && /^all:Formula/.test(elsewhere[1]) && !/Only for this book/.test(elsewhere.join()),
    JSON.stringify(elsewhere).slice(0, 200),
  );
  await app.press('Escape');
  await app.waitGone('.notes');

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('notes-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
