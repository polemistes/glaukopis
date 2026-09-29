// Spelling: misspelt words are underlined as they are written, in English and
// in Norwegian, and not those that are right; the menu of a word puts in what
// it may be, adds it to one's words, or ignores it in the project; F7 finds
// the next; a note is checked; and the underline is there in text that is
// drawn without an editor.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** How WebDriver names an element that is returned from the page. */
const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf';
/** The key F7, as WebDriver names it. */
const F7 = '\uE037';

const app = await App.launch({ width: 1360, height: 900 });

/** The misspelt words underlined in the editors within a selector, in order. */
const underlined = (within = '.text-view') =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' .misspelt')).map((e) => e.textContent)`,
    within,
  );

/** The words underlined in text that is drawn without an editor. */
const highlighted = () =>
  app.exec(
    `const h = CSS.highlights && CSS.highlights.get('misspelt');
     return h ? Array.from(h).map((r) => r.toString()) : null;`,
  );

async function until(what, fn, ms = 10000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
}

/** Right-clicks the first underlined word that reads so. */
async function rightClickWord(word, within = '.text-view') {
  const el = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[1] + ' .misspelt')).find((e) => e.textContent === arguments[0]) || null`,
    word,
    within,
  );
  if (!el) throw new Error(`no underlined “${word}”`);
  await app.rightClick(el[ELEMENT]);
}

const menuItems = () =>
  app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.trim())`);

async function newProject(name) {
  await app.keys(['Control', '1']);
  await app.waitForText('button', 'Begin a project', 8000);
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', name);
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
}

try {
  await app.installErrorHook();

  // ---- the settings list the dictionaries ----
  await app.keys(['Control', ',']);
  await app.waitFor('[data-dictionaries] li', 8000);
  const tags = await app.exec(
    `return Array.from(document.querySelectorAll('[data-dictionaries] li')).map((l) => l.dataset.tag)`,
  );
  check('the settings list the dictionaries that come with the application', tags.join(' ') === 'en-GB en-US nb-NO nn-NO', tags.join(' '));
  await app.screenshot('spelling-1-settings');

  // ---- English ----
  await newProject('The wrath');
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section');
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys('The wrath of Achilles is recieved by teh gods of Glaukopis, and its colour is dark. ');
  await until('the misspelt words to be underlined', async () => (await underlined()).length >= 4);
  let words = await underlined();
  // A new map is in American English, where "colour" is British.
  check(
    'the misspelt words are underlined, and those that are right are not',
    words.join(' ') === 'recieved teh Glaukopis colour',
    words.join(' '),
  );
  const style = await app.exec(
    `const s = getComputedStyle(document.querySelector('.text-view .misspelt'));
     return s.textDecorationStyle + ' ' + s.textDecorationLine;`,
  );
  check('with a wavy line', /wavy/.test(style) && /underline/.test(style), style);
  await app.screenshot('spelling-2-english');

  // The word at the cursor is left alone while it is written.
  await app.keys('Achilees');
  await sleep(600);
  check('the word being written is not underlined', !(await underlined()).includes('Achilees'));
  await app.keys(' ');
  await until('the word to be underlined when it is left', async () => (await underlined()).includes('Achilees'));
  check('and is, when it is left', true);

  // What it may be.
  await rightClickWord('recieved');
  await app.waitFor('.menu [role="menuitem"]', 4000);
  await until('what it may be', async () => (await menuItems()).includes('received'));
  const items = await menuItems();
  check('the menu of a word says what it may be', items[0] === 'received', items.join(' | '));
  check('and offers to add it, and to ignore it', items.includes('Add to my words') && items.includes('Ignore in this project'));
  await app.screenshot('spelling-3-menu');
  await app.clickText('.menu [role="menuitem"]', 'received');
  await until('the word to be put in', async () =>
    (await app.text('.text-view .section .body')).includes('is received by'),
  );
  check('what is chosen is put in its place', !(await underlined()).includes('recieved'));

  // Added to one's own words: kept, and right everywhere.
  await rightClickWord('Glaukopis');
  await app.waitFor('.menu [role="menuitem"]', 4000);
  await app.clickText('.menu [role="menuitem"]', 'Add to my words');
  await until('the word to be right', async () => !(await underlined()).includes('Glaukopis'));
  const own = join(app.dataDir, 'words', 'en.txt');
  await until('the word to be kept', async () => existsSync(own) && readFileSync(own, 'utf8').includes('Glaukopis'));
  check('a word added to one’s words is right, and is kept', true);

  // Ignored in the project.
  await rightClickWord('colour');
  await app.waitFor('.menu [role="menuitem"]', 4000);
  await app.clickText('.menu [role="menuitem"]', 'Ignore in this project');
  await until('the word to be ignored', async () => !(await underlined()).includes('colour'));
  check('a word ignored in the project is not underlined', true);

  // F7 goes to the next misspelt word, and opens its menu.
  await app.click('.text-view .section .body');
  await app.keys(['Control', 'Home']);
  await app.keys([F7]);
  await app.waitFor('.menu [role="menuitem"]', 4000);
  const selected = await app.exec(`return window.getSelection().toString()`);
  check('F7 selects the next misspelt word and opens its menu', selected === 'teh', selected);
  await app.press('Escape');
  await sleep(200);

  // ---- drawn without an editor ----
  // Opened anew, the text is drawn, and not written, until it is clicked.
  await app.keys(['Control', '1']);
  await sleep(300);
  await app.clickText('.card', 'The wrath');
  await app.waitFor('.diagram .node.root, .text-view .section', 8000);
  if (!(await app.exists('.text-view .section'))) await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section .body .static', 8000);
  const drawn = await until('the words to be marked', async () => {
    const h = await highlighted();
    return h === null ? ['(no highlights)'] : h.length ? h : null;
  });
  check('in text drawn without an editor, misspelt words are underlined', drawn.includes('teh') && drawn.includes('Achilees') && !drawn.includes('Glaukopis') && !drawn.includes('colour'), drawn.join(' '));
  await app.screenshot('spelling-4-drawn');
  // Its menu, where it stands.
  const at = await app.exec(
    `const h = CSS.highlights.get('misspelt');
     const r = Array.from(h).find((r) => r.toString() === 'teh').getBoundingClientRect();
     return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
  );
  await app.cmd('POST', '/actions', {
    actions: [
      {
        type: 'pointer',
        id: 'mouse',
        parameters: { pointerType: 'mouse' },
        actions: [
          { type: 'pointerMove', origin: 'viewport', x: at.x, y: at.y },
          { type: 'pointerDown', button: 2 },
          { type: 'pointerUp', button: 2 },
        ],
      },
    ],
  });
  await app.cmd('DELETE', '/actions');
  await until('the menu of the drawn word', async () => (await menuItems()).includes('the'));
  await app.clickText('.menu [role="menuitem"]', 'the');
  await until('the word to be put in there', async () => (await app.text('.text-view .section .body')).includes('by the gods'));
  check('its menu puts in what is chosen', true);

  // ---- Norwegian ----
  await newProject('Vreden');
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview', 8000);
  await app.click('.preview button[aria-label="Title, authors, abstract"]');
  await app.waitFor('dialog select');
  await app.exec(`const s = document.querySelector('dialog select'); s.value = 'nb'; s.dispatchEvent(new Event('change', { bubbles: true }));`);
  await app.clickText('dialog footer button', 'Save');
  await app.waitGone('dialog');
  await app.keys(['Control', 'p']);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section');
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys('Kaffemaskinreparatøren så verdens største bokhylle, men forsjell var det ikke. Det gjor ingenting. ');
  await until('the misspelt Norwegian words', async () => (await underlined()).length >= 2, 15000);
  words = await underlined();
  check('in Norwegian, compounds and genitives are right, and misspelt words are not', words.join(' ') === 'forsjell gjor', words.join(' '));
  await rightClickWord('forsjell');
  await app.waitFor('.menu [role="menuitem"]', 4000);
  await until('what it may be', async () => (await menuItems()).includes('forskjell'), 8000);
  check('what a Norwegian word may be', (await menuItems())[0] === 'forskjell', (await menuItems()).join(' | '));
  await app.screenshot('spelling-5-norwegian');
  await app.press('Escape');

  // A note is checked in the language of its map.
  await app.click('.text-view .section .body');
  await app.keys(['Control', 'End']);
  await app.keys(['Control', 'Alt', 'f']);
  await app.waitFor('.note-panel .prose', 4000);
  await app.keys('Et notat med feill.');
  await app.keys(['Control', 'Home']);
  await until('the note to be checked', async () => (await underlined('.note-panel')).includes('feill'));
  check('the text of a note is checked', (await underlined('.note-panel')).join(' ') === 'feill', (await underlined('.note-panel')).join(' '));
  await app.screenshot('spelling-6-note');

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('spelling-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
