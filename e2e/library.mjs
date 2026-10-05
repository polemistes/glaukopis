// The reference library, exercised through the interface.

import { appendFileSync, readFileSync } from 'node:fs';
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
  check(
    'and is selected, with its form in the pane',
    await app.exists('.pane [data-field="title"] textarea'),
  );

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
  await app.waitUntil(
    `return document.querySelectorAll('.list .item').length >= 10`,
    5000,
    'the list to fill',
  );
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

  // --- One answer for all that are the same ---
  const forAll = await app.text('dialog .for-all .row[data-certainty="certain"]');
  check(
    'a row answers for all 16 that are the same',
    /^For all 16 that are the same:/.test(forAll.trim()),
    forAll,
  );
  const option = (text) => app.findByText('dialog .for-all [role="radio"]', text);
  check(
    'leaving them out is the choice they share',
    (await app.attr(await option('Leave mine as they are'), 'aria-checked')) === 'true',
  );
  check(
    'completing is not offered when none lacks anything',
    (await app.attr(await option('Complete the ones I have'), 'disabled')) === 'true',
  );
  await app.click(await option('Add them all the same'));
  await sleep(150);
  const allAdded = await app.text('dialog .summary');
  check('and one press sets all 16 to add', /^16 to add/.test(allAdded.trim()), allAdded);
  check(
    'the row shows what they now share',
    (await app.attr(await option('Add them all the same'), 'aria-checked')) === 'true',
  );
  // The group of the 16 opens folded; its own radios are seen when it is opened.
  await app.clickText('dialog .heading', 'already in your library');
  await app.waitFor('dialog .choices');
  check('each candidate is set too', (await app.count('dialog .choices input:checked')) === 16);
  // One changed on its own: the row then shows no choice.
  await app.click(await app.findByText('dialog .choices label', 'leave mine as it is'));
  await sleep(150);
  const oneApart = await app.text('dialog .summary');
  check(
    'a candidate can still be changed on its own',
    /^15 to add/.test(oneApart.trim()),
    oneApart,
  );
  check(
    'and the row then shows nothing chosen',
    (await app.count('dialog .for-all [role="radio"][aria-checked="true"]')) === 0,
  );
  await app.screenshot('library-5b-import-for-all');
  await app.click(await option('Leave mine as they are'));
  await sleep(150);
  check(
    'and back to leaving them all out',
    /^0 to add/.test((await app.text('dialog .summary')).trim()),
  );
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog');

  // --- Search ---
  await app.type('.search input', 'muller');
  await sleep(200);
  check('search folds diacritics', (await app.count('.list .item')) === 1);
  await app.exec(
    `const i = document.querySelector('.search input'); i.value = ''; i.dispatchEvent(new Event('input', {bubbles: true}));`,
  );
  await app.type('.search input', 'μεγαθεματα');
  await sleep(200);
  check('search finds Greek without accents', (await app.count('.list .item')) === 1);
  await app.exec(
    `const i = document.querySelector('.search input'); i.value = ''; i.dispatchEvent(new Event('input', {bubbles: true}));`,
  );
  await sleep(200);

  // --- Filters: kind, publisher, year ---
  await app.click('.middle header .filter button');
  await app.waitFor('.filters', 3000);
  await sleep(200);
  const kinds = await app.exec(
    `return Array.from(document.querySelectorAll('.filters input[data-kind]')).map((i) => i.dataset.kind)`,
  );
  check(
    'the filter offers the kinds present',
    kinds.includes('book') && kinds.includes('article'),
    kinds.join(' '),
  );
  await app.screenshot('library-5c-filters');
  await app.click('.filters input[data-kind="article"]');
  await sleep(250);
  const articles = await app.count('.list .item');
  check('ticking a kind narrows the list to it', articles === 2, String(articles));
  check(
    'and the button says one filter is on',
    (await app.text('.middle header .filter .badge')) === '1',
  );
  await app.exec(
    `const s = document.querySelector('.filters select.publishers');
     s.value = 'Cambridge University Press';
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(250);
  check(
    'a publisher and a kind together may let nothing through',
    (await app.count('.list .item')) === 0 && (await app.exists('.body h3')),
  );
  await app.click('.filters input[data-kind="article"]');
  await sleep(250);
  const cambridge = await app.exec(
    `return Array.from(document.querySelectorAll('.list .item')).map((e) => e.textContent)`,
  );
  check(
    'the publisher alone finds what Cambridge published',
    cambridge.length === 2 && cambridge.some((x) => x.includes('Kirk')),
    `${cambridge.length}`,
  );
  await app.type('.filters [data-year="from"]', '2000');
  await app.press('Enter');
  await sleep(250);
  check('a year narrows it further', (await app.count('.list .item')) === 1);
  await app.click('.filters [data-action="clear"]');
  await sleep(250);
  check('clearing the filters brings the list back', (await app.count('.list .item')) >= 10);
  await app.press('Escape');
  await app.waitGone('.filters', 3000);

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
  check(
    'aliases were resolved on import',
    stored.location === 'Cambridge, MA' && stored.date === '1960',
  );

  // --- Collections ---
  await app.click('.side .heading button');
  await app.waitFor('.side .naming input');
  await app.type('.side .naming input', 'Oral poetry');
  await app.press('Enter');
  await app.waitForText('.side .item', 'Oral poetry');
  await app.go('#/library');
  await sleep(200);
  await app.drag(
    await app.findByText('.list .item', 'The Singer of Tales'),
    await app.findByText('.side .item', 'Oral poetry'),
  );
  await sleep(500);
  const count = await app.text(await app.findByText('.side .item', 'Oral poetry'));
  check(
    'dragging a reference onto a collection adds it',
    /1$/.test(count.trim()),
    count.replace(/\s+/g, ' '),
  );
  await app.screenshot('library-7-collection');

  // --- The file on disk ---
  const file = readFileSync(join(app.dataDir, 'library', 'library.bib'), 'utf8');
  check(
    'the library is a BibLaTeX file',
    file.includes('@book{lord1960,') && file.includes('glaukopis-id'),
  );
  check(
    'Unicode is stored as such',
    file.includes('Müller, Anna and Sørensen, Jørgen') && file.includes('Μαρωνίτης'),
  );
  check(
    'the @string abbreviation was resolved',
    /journaltitle\s+= \{Journal of Hellenic Studies\}/.test(file),
  );

  // --- Written in the file by hand, while the application runs ---
  // A change of one entry, made from elsewhere, reads the file first; what it read reaches the list.
  const libraryFile = join(app.dataDir, 'library', 'library.bib');
  appendFileSync(
    libraryFile,
    '\n@book{west1997, author = {West, M. L.}, title = {The East Face of Helicon}, date = {1997}}\n' +
      '@book{broken, title = {A brace that is never closed}\n',
  );
  await app.go('#/projects');
  await sleep(300);
  await app.execAsync(
    `await window.__TAURI_INTERNALS__.invoke('library_add', { draft: { type: 'book', fields: { title: 'Added from a project' } } });`,
  );
  await app.go('#/library');
  await app.waitForText('.list .item', 'The East Face of Helicon', 4000).catch(() => {});
  const listed = await app.exec(
    `return Array.from(document.querySelectorAll('.list .item')).map((e) => e.textContent)`,
  );
  check(
    'an entry written in the file by hand is shown, though a change made elsewhere read it first',
    listed.some((x) => x.includes('The East Face of Helicon')),
    `${listed.length} shown`,
  );
  const rewritten = readFileSync(libraryFile, 'utf8');
  check(
    'what could not be read stays in the file when it is written again',
    rewritten.includes('@book{broken, title = {A brace that is never closed}') &&
      rewritten.includes('Added from a project'),
  );

  // --- A map of the library: a new project ---
  await app.click('.split-more');
  await app.clickText('[role="menuitem"]', 'A map of the library');
  await app.waitFor('dialog .map-of', 3000);
  await sleep(200);
  check(
    'the project is named after the library',
    (await app.exec(`return document.querySelector('dialog .map-of input').value`)) ===
      'The library',
  );
  const mapFacts = await app.exec(
    `const out = {};
     for (const e of document.querySelectorAll('dialog [data-fact]'))
       out[e.dataset.fact] = e.querySelector('dd').textContent.trim();
     return out;`,
  );
  check(
    'and counts its collections and references',
    mapFacts.collections === '1' && Number(mapFacts.references) >= 18,
    JSON.stringify(mapFacts),
  );
  await app.screenshot('library-7b-map-dialog');
  await app.clickText('dialog footer button', 'Make the project');
  await app.waitFor('.text-view .section', 15000);
  await sleep(600);
  const projectName = await app.exec(`return document.title.replace(/^Glaukopis – /, '')`);
  check('a project is opened, named after the library', projectName === 'The library', projectName);
  const mapParts = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => {
       const name = s.querySelector('.heading .prose.title');
       return name ? name.textContent.trim() : '';
     })`,
  );
  check(
    'with the collection and the references as elements, named as the list shows them',
    mapParts.includes('Oral poetry') && mapParts.includes('Lord 1960 The Singer of Tales'),
    mapParts.slice(0, 5).join(' | '),
  );
  check(
    'and a citation as the text of each reference',
    (await app.count('.text-view .citation')) >= 1,
    String(await app.count('.text-view .citation')),
  );
  await app.screenshot('library-7c-map-made');
  await app.go('#/library');
  await app.waitFor('.list .item');

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
