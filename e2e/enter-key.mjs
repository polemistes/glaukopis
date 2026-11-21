// The breaks of a text chosen from the button with ¶ in the bar: its menu,
// with the marks of whitespace and what the Enter key makes; and Enter as a
// line break: once for a new line, twice for a new paragraph, Shift+Enter
// for the paragraph at once, the choice kept when the project is opened anew.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const PROSE = '.text-view .section .body .prose';
/** The paragraphs of the text, each as its lines. */
const paragraphs = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).map((p) => {
       const c = p.cloneNode(true);
       c.querySelectorAll('.hard-break').forEach((b) => b.replaceWith('\\n'));
       return c.textContent.split('\\n').map((l) => l.trim()).join(' / ');
     })`,
    PROSE,
  );
/** The menu of the button with ¶, as it stands: each item with whether it is ticked. */
const menu = async (app) => {
  await app.click('[data-bar] [data-whitespace]');
  await app.waitFor('.menu [role^="menuitem"]', 3000);
  await sleep(150);
  return app.exec(
    `return Array.from(document.querySelectorAll('.menu .item, .menu .heading')).map(
       (e) => (e.querySelector('.check svg') ? '✓ ' : '') + (e.querySelector('.label .truncate') ?? e).textContent.trim(),
     )`,
  );
};
const choose = async (app, item) => {
  await menu(app);
  await app.clickText('.menu [role^="menuitem"]', item);
  await app.waitGone('.menu', 3000);
  await sleep(150);
};

const app = await App.launch({ width: 1280, height: 820 });
try {
  await app.installErrorHook();
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Breaks');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(300);
  await app.click('.text-view .section .body');
  await app.waitFor(`${PROSE}[contenteditable="true"]`);
  await sleep(200);

  // ---- the menu ----
  const first = await menu(app);
  await app.screenshot('enter-key-1-menu');
  check(
    'the button with ¶ opens a menu: the marks of whitespace, and what the Enter key makes',
    ['Marks of whitespace', 'Enter key', 'Paragraph break', 'Line break'].every((w) => first.some((l) => l.includes(w))),
    first.join(' | '),
  );
  check(
    'the marks are shown and Enter makes a paragraph break, where nothing was chosen',
    first.some((l) => l.startsWith('✓ Marks of whitespace')) && first.includes('✓ Paragraph break') && first.includes('Line break'),
    first.join(' | '),
  );
  await app.clickText('.menu [role^="menuitem"]', 'Marks of whitespace');
  await app.waitGone('.menu', 3000);
  check('the marks of whitespace are turned off from it', !(await menu(app)).some((l) => l.startsWith('✓ Marks of whitespace')));
  await app.clickText('.menu [role^="menuitem"]', 'Marks of whitespace');
  await app.waitGone('.menu', 3000);

  // ---- Enter as it is: a paragraph ----
  await app.click(`${PROSE}`);
  await app.keys('Sing, goddess');
  await app.press('Enter');
  await app.keys('the wrath');
  check('Enter begins a new paragraph', JSON.stringify(await paragraphs(app)) === JSON.stringify(['Sing, goddess', 'the wrath']), JSON.stringify(await paragraphs(app)));

  // ---- Enter as a line break ----
  await choose(app, 'Line break');
  const chosen = await menu(app);
  check('Line break is chosen', chosen.includes('✓ Line break') && chosen.includes('Paragraph break'), chosen.join(' | '));
  await app.press('Escape');
  await app.waitGone('.menu', 3000);
  await sleep(200);
  await app.press('Enter');
  await app.keys('of Achilles');
  check(
    'Enter begins a new line in the paragraph',
    JSON.stringify(await paragraphs(app)) === JSON.stringify(['Sing, goddess', 'the wrath / of Achilles']),
    JSON.stringify(await paragraphs(app)),
  );
  await app.press('Enter');
  await app.press('Enter');
  await app.keys('son of Peleus');
  check(
    'Enter twice begins a new paragraph, and no empty line is left',
    JSON.stringify(await paragraphs(app)) === JSON.stringify(['Sing, goddess', 'the wrath / of Achilles', 'son of Peleus']),
    JSON.stringify(await paragraphs(app)),
  );
  await app.keys(['Shift', 'Enter']);
  await app.keys('the accursed wrath');
  check(
    'Shift+Enter is the paragraph break at once',
    JSON.stringify(await paragraphs(app)) ===
      JSON.stringify(['Sing, goddess', 'the wrath / of Achilles', 'son of Peleus', 'the accursed wrath']),
    JSON.stringify(await paragraphs(app)),
  );
  await app.screenshot('enter-key-2-lines');

  // ---- kept ----
  await sleep(600);
  await app.home();
  await sleep(400);
  await app.openProject('Breaks');
  await app.waitFor('.text-view .section', 8000);
  await sleep(300);
  await app.click('.text-view .section .body');
  await app.waitFor(`${PROSE}[contenteditable="true"]`);
  const again = await menu(app);
  const written = JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8')).enterBreaks;
  check('the choice is kept, with the settings', again.includes('✓ Line break') && written === 'line', `${again.join(' | ')}; ${written}`);
  await app.clickText('.menu [role^="menuitem"]', 'Paragraph break');
  await app.waitGone('.menu', 3000);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('enter-key-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
