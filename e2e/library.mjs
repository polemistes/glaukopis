// The reference library, exercised through the interface.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch();
try {
  await app.installErrorHook();
  await app.go('#/library');
  await app.waitForText('h3', 'Your library is empty');
  await app.screenshot('library-1-empty');

  // --- A new reference through the form ---
  await app.clickText('button', 'New reference');
  await app.waitFor('dialog .form');
  await app.screenshot('library-2-new-dialog');
  const field = (name) => `dialog [data-field="${name}"] :is(input, textarea)`;
  await app.type(`dialog [data-field="author"] input[aria-label="Author: family name"]`, 'Nagy');
  await app.type(`dialog [data-field="author"] input[aria-label="Author: given names"]`, 'Gregory');
  await app.type(field('title'), 'Homeric Questions');
  await app.type(field('location'), 'Austin');
  await app.type(field('publisher'), 'University of Texas Press');
  await app.type(field('date'), '1996');

  // A menu opened in a dialog lies over the dialog, and can be chosen from.
  await app.clickText('dialog button', 'Add field');
  await app.waitFor('[role="menu"]', 3000);
  await sleep(200);
  const over = await app.exec(
    `const item = Array.from(document.querySelectorAll('[role="menuitem"]')).find((e) => e.textContent.includes('Series'));
     const r = item.getBoundingClientRect();
     const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
     return !!at && (at === item || item.contains(at));`,
  );
  check('the menu of fields lies over the dialog', over);
  await app.screenshot('library-2b-field-menu');
  await app.clickText('[role="menuitem"]', 'Series');
  await app.waitFor('dialog [data-field="series"]', 3000);
  check('and a field can be chosen from it', true);
  await sleep(600);
  const suggested = await app.attr('dialog [data-field="key"] input', 'placeholder');
  check('a citation key is suggested', suggested === 'nagy1996', suggested);
  await app.screenshot('library-3-new-filled');
  await app.clickText('dialog footer button', 'Add reference');
  await app.waitGone('dialog');
  await app.waitFor('.list .item');
  check('the new reference is listed', (await app.count('.list .item')) === 1);
  check('and is selected, with its form in the pane', await app.exists('.pane [data-field="title"] textarea'));

  // --- Import by pasting ---
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.click('.split-more');
  await app.clickText('[role="menuitem"]', 'Paste references');
  await app.waitFor('dialog textarea');
  // Typing thousands of characters through WebDriver is slow; set the value as a paste would.
  await app.exec(
    `const t = document.querySelector('dialog textarea');
     t.value = arguments[0];
     t.dispatchEvent(new Event('input', { bubbles: true }));`,
    bib,
  );
  await app.clickText('dialog footer button', 'Continue');
  await app.waitForText('dialog h2', 'Import references');
  await sleep(200);
  await app.screenshot('library-4-import-plan');
  const summary = await app.text('dialog .summary');
  check('the plan counts 16 to add', /16 to add/.test(summary), summary);
  await app.clickText('dialog footer button', 'Import');
  await app.waitGone('dialog', 10000);
  await app.waitUntil(`return document.querySelectorAll('.list .item').length >= 10`, 5000, 'the list to fill');
  const footer = await app.text('.middle footer');
  check('17 references in the library', /17 references/.test(footer), footer);

  // --- Importing the same again adds nothing ---
  await app.click('.split-more');
  await app.clickText('[role="menuitem"]', 'Paste references');
  await app.waitFor('dialog textarea');
  await app.exec(
    `const t = document.querySelector('dialog textarea');
     t.value = arguments[0];
     t.dispatchEvent(new Event('input', { bubbles: true }));`,
    bib,
  );
  await app.clickText('dialog footer button', 'Continue');
  await app.waitForText('dialog h2', 'Import references');
  await sleep(200);
  const second = await app.text('dialog .summary');
  check('a second import of the same file adds nothing', /^0 to add/.test(second.trim()), second);
  await app.screenshot('library-5-import-again');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog');

  // --- Search ---
  await app.type('.search input', 'muller');
  await sleep(200);
  check('search folds diacritics', (await app.count('.list .item')) === 1);
  await app.exec(`const i = document.querySelector('.search input'); i.value = ''; i.dispatchEvent(new Event('input', {bubbles: true}));`);
  await app.type('.search input', 'μεγαθεματα');
  await sleep(200);
  check('search finds Greek without accents', (await app.count('.list .item')) === 1);
  await app.exec(`const i = document.querySelector('.search input'); i.value = ''; i.dispatchEvent(new Event('input', {bubbles: true}));`);
  await sleep(200);

  // --- Select, edit in the pane, autosave ---
  await app.click(await app.findByText('.list .item', 'The Singer of Tales'));
  await app.waitFor('.pane [data-field="title"] textarea');
  await sleep(300);
  await app.screenshot('library-6-selected');
  await app.type('.pane [data-field="edition"] textarea', '2');
  await app.waitForText('.pane .status', 'Saved', 4000);
  const stored = await app.execAsync(
    `const list = await window.__TAURI_INTERNALS__.invoke('library_list');
     const e = list.entries.find((e) => e.key === 'lord1960');
     return (await window.__TAURI_INTERNALS__.invoke('library_get', { id: e.id })).fields;`,
  );
  check('the edit was saved', stored.edition === '2', JSON.stringify(stored.edition));
  check('aliases were resolved on import', stored.location === 'Cambridge, MA' && stored.date === '1960');

  // --- Collections ---
  await app.click('.side .heading button');
  await app.waitFor('.side .naming input');
  await app.type('.side .naming input', 'Oral poetry');
  await app.press('Enter');
  await app.waitForText('.side .item', 'Oral poetry');
  await app.go('#/library');
  await sleep(200);
  await app.drag(await app.findByText('.list .item', 'The Singer of Tales'), await app.findByText('.side .item', 'Oral poetry'));
  await sleep(500);
  const count = await app.text(await app.findByText('.side .item', 'Oral poetry'));
  check('dragging a reference onto a collection adds it', /1$/.test(count.trim()), count.replace(/\s+/g, ' '));
  await app.screenshot('library-7-collection');

  // --- The file on disk ---
  const file = readFileSync(join(app.dataDir, 'library', 'library.bib'), 'utf8');
  check('the library is a BibLaTeX file', file.includes('@book{lord1960,') && file.includes('glaukopis-id'));
  check('Unicode is stored as such', file.includes('Müller, Anna and Sørensen, Jørgen') && file.includes('Μαρωνίτης'));
  check('the @string abbreviation was resolved', /journaltitle\s+= \{Journal of Hellenic Studies\}/.test(file));

  // --- Dark theme ---
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('library-8-dark');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('library-failure').catch(() => {});
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
