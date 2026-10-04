// The languages: the interface in that of the system, which is Norwegian
// here; every view in Norwegian, with no English left in it; the language
// changed in the settings, at once; new texts written in the language of
// the system; and the languages of a map and of the project, from the menu
// of the map.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

// Words that English has and Norwegian has not. A few that Norwegian has
// as well ("element", "format", "note", "tekst") are not among them.
const ENGLISH =
  /\b(the|and|of|with|this|that|your|from|what|which|where|when|there|will|not|add|remove|delete|save|cancel|close|show|hide|new|name|text|maps?|projects?|library|references?|citations?|notes|figures?|tables?|pictures?|settings|search|words|pages?|documents?|preview|export|styles?|untitled|here|before|after|none|write|open|The|And|Of|With|This|That|Your|From|What|Which|Where|When|There|Add|Remove|Delete|Save|Cancel|Close|Show|Hide|New|Name|Text|Maps?|Projects?|Library|References?|Citations?|Notes|Figures?|Tables?|Pictures?|Settings|Search|Words|Pages?|Documents?|Preview|Export|Styles?|Untitled|Here|Before|After|None|Write|Open)\b/;

// What is shown of the writer's own: texts, names, references, and the names
// of styles, formats and fonts, which are names.
const DATA = [
  '.ProseMirror',
  '.prose',
  'select',
  'option',
  '.page',
  'code',
  'kbd',
  '.row .title',
  '.row .container',
  '.work .title',
  '.fonts',
].join(', ');

// Names that are English, and words that are quoted as they are written
// («and», which BibLaTeX puts between names).
const NAMES = /Library of Congress|«[^»]*»/g;

/** The words of the interface that are seen now, with those that look English. */
async function english(where) {
  const found = await app.exec(
    `const skip = arguments[0], names = new RegExp(arguments[2], 'g');
     const english = { test: (text) => new RegExp(arguments[1]).test(text.replace(names, '')) };
     const out = new Set();
     const seen = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
     const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
     for (let n = walker.nextNode(); n; n = walker.nextNode()) {
       const el = n.parentElement;
       if (!el || el.closest(skip) || !seen(el)) continue;
       const text = n.textContent.trim();
       if (text && english.test(text)) out.add(text);
     }
     for (const el of document.querySelectorAll('[aria-label], [title], [placeholder]')) {
       if (el.closest(skip) || !seen(el)) continue;
       for (const a of ['aria-label', 'title', 'placeholder']) {
         const text = el.getAttribute(a)?.trim();
         if (text && english.test(text)) out.add(a + ': ' + text);
       }
     }
     return [...out];`,
    DATA,
    ENGLISH.source,
    NAMES.source,
  );
  if (found.length) leftovers.push(`${where}: ${found.join(' | ')}`);
}
const leftovers = [];

const app = await App.launch({ width: 1360, height: 900, env: { GLAUKOPIS_LANGUAGE: 'nb-NO' } });
try {
  await app.installErrorHook();
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.execAsync(
    `const plan = await window.__TAURI_INTERNALS__.invoke('import_bib_text', { text: arguments[0] });
     await window.__TAURI_INTERNALS__.invoke('import_apply', { plan });`,
    bib,
  );
  await app.waitFor('.rail a.place', 8000);
  await sleep(300);
  const rail = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.rail a.place')).map((a) => a.getAttribute('aria-label'))`,
    );
  check(
    'the interface is in the language of the system',
    (await rail()).join(' ') === 'Prosjekter Bibliotek Bilder Søk Innstillinger',
    (await rail()).join(' '),
  );
  check('and the page says so', (await app.exec(`return document.documentElement.lang`)) === 'nb');
  await english('the projects');
  await app.screenshot('languages-1-projects');

  // ---- a project, its diagram and its text ----
  await app.clickText('button', 'Begynn på et prosjekt');
  await app.waitFor('dialog input');
  await english('a new project');
  await app.type('dialog input', 'Vreden');
  await app.clickText('dialog footer button', 'Opprett');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await english('the diagram');
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('Første sang');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await sleep(200);
  check(
    'an element is named in Norwegian, with its ø',
    (
      await app.exec(
        `return Array.from(document.querySelectorAll('.diagram .node')).map((n) => n.textContent.trim())`,
      )
    ).includes('Første sang'),
  );
  await app.rightClick('.diagram .node.root');
  await app.waitFor('.menu');
  await sleep(150);
  await english('the menu of an element');
  await app.screenshot('languages-2-diagram-menu');
  await app.press('Escape');
  await sleep(200);

  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(300);
  await english('the text');
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys('Vreden, gudinne, syng ');
  await app.keys('@');
  await app.waitFor('.picker input');
  await sleep(200);
  await english('the picker of references');
  await app.keys('nagy best');
  await sleep(300);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await sleep(200);
  await english('a citation');
  await app.screenshot('languages-3-citation');
  await app.press('Escape');
  await app.waitGone('.editor');
  await app.keys(['Control', 'Alt', 'f']);
  await app.waitFor('.note-panel');
  await sleep(200);
  await english('a note');
  await app.press('Escape');
  await sleep(200);
  await app.rightClick('.text-view .section .heading');
  await app.waitFor('.menu');
  await sleep(150);
  await english('the menu of an element in the text');
  await app.press('Escape');
  await sleep(200);

  // ---- the preview, and the details of the document ----
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview', 8000);
  await sleep(1500);
  await english('the preview');
  await app.click('.preview button[aria-label="Tittel, forfattere, sammendrag"]');
  await app.waitFor('dialog select');
  await sleep(200);
  await english('the details of the document');
  const written = await app.exec(`return document.querySelector('dialog select').value`);
  check('a new map is written in the language of the system', written === 'nb', written);
  await app.screenshot('languages-4-details');
  await app.press('Escape');
  await sleep(200);
  await app.keys(['Control', 'p']);
  await sleep(300);

  // ---- the languages of the map and of the project, from the menu of the map ----
  const chosen = () =>
    app.exec(`return Array.from(document.querySelectorAll('dialog select')).map((s) => s.value)`);
  const choose = (which, value) =>
    app.exec(
      `const s = document.querySelectorAll('dialog select')[arguments[0]];
       s.value = arguments[1]; s.dispatchEvent(new Event('change', { bubbles: true }));`,
      which,
      value,
    );
  const openLanguages = async () => {
    await app.openThisMap();
    await app.clickText('.menu [role="menuitem"]', 'Språk …');
    await app.waitFor('dialog select');
    await sleep(200);
  };
  await app.openThisMap();
  await english('the menu of the map');
  await app.press('Escape');
  await sleep(200);
  await openLanguages();
  await english('the languages of the map and of the project');
  check(
    'the dialog has the language of the map, and none chosen for the project',
    JSON.stringify(await chosen()) === '["nb",""]',
    JSON.stringify(await chosen()),
  );
  await app.screenshot('languages-4d-languages');
  await choose(0, 'en-GB');
  await choose(1, 'nn');
  await sleep(200);
  check(
    'the languages are written as they are chosen',
    JSON.stringify(await chosen()) === '["en-GB","nn"]',
    JSON.stringify(await chosen()),
  );
  await app.press('Escape');
  await app.waitGone('dialog');
  await sleep(200);
  // A new map is written in the language of the project.
  await app.openThisMap();
  await app.clickText('.menu [role="menuitem"]', 'Nytt kart');
  await app.waitFor('.maps .naming');
  await sleep(150);
  await app.keys('Annen sang');
  await app.press('Enter');
  await app.waitGone('.maps .naming');
  await sleep(300);
  await openLanguages();
  check(
    'a new map is written in the language of the project',
    JSON.stringify(await chosen()) === '["nn","nn"]',
    JSON.stringify(await chosen()),
  );
  await app.press('Escape');
  await app.waitGone('dialog');
  await sleep(200);
  // The first map keeps the language it was given, and is put back as it was.
  await app.openMap((await app.mapNames())[0]);
  await openLanguages();
  check(
    'the first map keeps the language it was given',
    JSON.stringify(await chosen()) === '["en-GB","nn"]',
    JSON.stringify(await chosen()),
  );
  await choose(0, 'nb');
  await choose(1, '');
  await sleep(200);
  await app.press('Escape');
  await app.waitGone('dialog');
  await sleep(200);

  // ---- the history of the project ----
  await app.keys(['Control', 'Shift', 'h']);
  await app.waitFor('.history-panel', 8000);
  await sleep(300);
  await english('the history, before it is kept');
  await app.clickText('.history-panel button', 'Ta vare på historikken');
  await app.waitFor('.history-panel .moments li', 15000);
  await sleep(400);
  await english('the moments of the history');
  const wheel = '.history-panel .tools button[aria-label="Innstillinger for historikken"]';
  await app.click(wheel);
  await app.waitFor('.history-panel input[type="number"]', 8000);
  await sleep(300);
  await english('the settings of the history');
  await app.screenshot('languages-4b-history');
  await app.click(wheel);
  await app.waitFor('.history-panel .moments li', 8000);
  await app.click('.history-panel .moments li button');
  await app.waitFor('.past', 15000);
  await sleep(600);
  await english('the map as it was');
  await app.clickText('.past .bar button', 'Tilbake til nå');
  await app.waitGone('.past', 8000);
  await app.keys(['Control', 'Shift', 'h']);
  await sleep(300);

  // ---- the changes to review (ADR 0022) ----
  await app.keys(['Control', 'Shift', 'e']);
  await app.waitFor('.review-panel', 8000);
  await sleep(600);
  await english('the panel of changes, with nothing to review');
  // One person alone writes here, so it is their own changes that are shown.
  await app.exec(`window.__glaukopisHistory.review.setOwn(true);`);
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.press('End');
  await app.keys(' Og vreden ble til sorg.');
  await app.waitFor('.review-panel .list li', 20000);
  await sleep(800);
  await english('a change to review');
  await app.click('.review-panel .since');
  await app.waitFor('.menu', 5000);
  await sleep(300);
  await english('the moments to review from');
  await app.press('Escape');
  await sleep(300);
  if (await app.exists('.review-panel .versions-toggle')) {
    await app.click('.review-panel .versions-toggle');
    await app.waitFor('.review-panel .versions li, .review-panel .versions .quiet', 10000);
    await sleep(400);
    await english('the history of a change');
  }
  await app.screenshot('languages-4c-review');
  await app.keys(['Control', 'Shift', 'e']);
  await app.waitGone('.review-panel', 5000);
  await sleep(300);

  // ---- the library, the pictures, the settings ----
  await app.keys(['Control', '2']);
  await app.waitFor('.reference-row, .row', 8000);
  await sleep(300);
  await app.click('.reference-row, .row');
  await sleep(500);
  await english('the library');
  await app.screenshot('languages-5-library');
  await app.keys(['Control', '3']);
  await sleep(500);
  await english('the pictures');
  await app.keys(['Control', 'Shift', 'F']);
  await sleep(500);
  await english('the search through everything');
  await app.screenshot('languages-5b-search');
  await app.keys(['Control', ',']);
  await app.waitForText('h2', 'Språk');
  await sleep(300);
  await english('the settings');
  check('no English is left in what was seen', leftovers.length === 0, leftovers.join(' ‖ '));

  // ---- the settings change the language at once ----
  const selects = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.field')).filter((f) => f.querySelector('select')).map((f) => ({ label: f.querySelector('label')?.textContent.trim(), value: f.querySelector('select').value, shown: f.querySelector('select').selectedOptions[0]?.textContent.trim() }))`,
    );
  const before = await selects();
  const language = before.find((s) => s.label === 'Grensesnittet');
  const texts = before.find((s) => s.label === 'Språk for nye tekster');
  check(
    'the interface is as the system, and says what that is',
    language?.value === 'system' && language?.shown === 'Som systemet (Norsk bokmål)',
    JSON.stringify(language),
  );
  check(
    'and so are new texts',
    texts?.value === 'system' && /bokmål/i.test(texts?.shown ?? ''),
    JSON.stringify(texts),
  );
  await app.screenshot('languages-6-settings');

  await app.exec(
    `const f = Array.from(document.querySelectorAll('.field')).find((f) => f.querySelector('label')?.textContent.trim() === 'Grensesnittet');
     const s = f.querySelector('select'); s.value = 'en'; s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(300);
  check(
    'English is chosen, and the interface changes at once',
    (await rail()).join(' ') === 'Projects Library Pictures Search Settings',
    (await rail()).join(' '),
  );
  check('the page says so', (await app.exec(`return document.documentElement.lang`)) === 'en');
  check(
    'and the settings themselves',
    (await app.exists('h2')) && (await app.text('h1')) === 'Settings',
    await app.text('h1'),
  );
  await sleep(500);
  const kept = JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8'));
  check('what was chosen is kept', kept.language === 'en', JSON.stringify(kept.language));

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('languages-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
