// Passages and what is said of them (ADR 0040, stage 2): the bracket of a
// verse with its label, which names the family while the cursor is in it;
// the menu of the label, which splits the passage and makes it text; the
// numbers in the margin, edited in place; the Numbers menu, which numbers
// the lines of the page in the document settings; and the layout editor,
// which has a part for the numbers and shows every kind with its look as
// it will stand.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900 });

const verse = '.text-view .prose .passage[data-family="verse"]';

/** Puts the cursor at the end of a line of the verse, counted through every verse passage, and gives the editor time to take it up. */
async function toLine(i) {
  await app.exec(
    `const l = document.querySelectorAll(arguments[0] + ' > p')[arguments[1]]; const s = getSelection(); s.selectAllChildren(l); s.collapseToEnd();`,
    verse,
    i,
  );
  await sleep(200);
}

/** The numbers the lines of the verse show, "-" where none, "!" where given by hand. */
const shownNumbers = () =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).map((l) => (l.getAttribute('data-n') ?? '-') + (l.hasAttribute('data-n-set') ? '!' : '')).join(' ')`,
    verse,
  );

/** The words of the items of the menu that is open. */
const menuItems = () =>
  app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((i) => (i.querySelector('.label > .truncate') ?? i).textContent.replace(/\\s+/g, ' ').trim())`,
  );

/** Opens the menu of a passage from its label: the first verse, or the one given. */
async function passageMenu(n = 0) {
  const labels = await app.findAll(`${verse} > span.passage-label`);
  await app.exec(`arguments[0].click();`, { 'element-6066-11e4-a52e-4f735466cecf': labels[n] });
  await app.waitFor('.menu', 3000);
  await sleep(150);
}

try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Odes');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The first ode');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const body = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('first ode'));
     return s.querySelector('.body');`,
  );
  await app.click(body);
  await app.waitFor('.text-view .section .body .prose[contenteditable="true"]');
  await sleep(200);

  // --- Six lines made verse ---
  const words = [
    'Maecenas atavis edite regibus,',
    'o et praesidium et dulce decus meum,',
    'sunt quos curriculo pulverem Olympicum',
    'collegisse iuvat metaque fervidis',
    'evitata rotis palmaque nobilis',
    'terrarum dominos evehit ad deos;',
  ];
  for (const [i, line] of words.entries()) {
    if (i) await app.press('Enter');
    await app.keys(line);
  }
  await sleep(200);
  await app.keys(['Control', 'a']);
  await app.click('.pane-bar .tools .style');
  await app.clickText('[role="menuitem"]', 'More…');
  await sleep(200);
  await app.clickText('[role="menuitem"]', 'Verse');
  await sleep(300);
  check(
    'the six paragraphs are the lines of one verse',
    (await app.count(`${verse} > p`)) === 6 && (await app.count(verse)) === 1,
  );

  // --- The bracket: the passage the cursor is in, and its label ---
  await toLine(1);
  const bracket = await app.exec(
    `const p = document.querySelector(arguments[0]);
     const l = p?.querySelector(':scope > span.passage-label[data-family="verse"][role="button"]');
     const box = l?.getBoundingClientRect();
     return { current: !!document.querySelector('.text-view .prose .passage[data-current]'), label: l?.textContent.trim() ?? null,
              seen: !!box && box.width > 0 && getComputedStyle(l).visibility !== 'hidden' && getComputedStyle(l).opacity !== '0' };`,
    verse,
  );
  check(
    'with the cursor in the verse, the passage is the current one and its label names it',
    bracket.current && bracket.label === 'Verse' && bracket.seen,
    JSON.stringify(bracket),
  );
  await app.screenshot('passages-1-bracket');

  // --- Numbers in place: the passage counted from 1, then a number given in the margin ---
  await toLine(0);
  await app.click('.pane-bar .tools button.lines');
  await app.waitFor('.menu', 3000);
  await app.clickText('.menu [role="menuitem"]', 'Number the lines of this passage');
  await app.waitForText('dialog[open] h2', 'Numbers', 3000);
  await sleep(200);
  await app.exec(
    `const s = document.querySelector('dialog[open] select'); s.value = 'counted';
     s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(150);
  await app.exec(`const i = document.querySelector('dialog[open] [data-this-line] input:not([type="checkbox"])'); i.focus(); i.select();`);
  await app.keys('1');
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  check('the passage is counted from 1, every 5', (await shownNumbers()) === '1! - - - 5 -', await shownNumbers());
  const widgets = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).map((p) => {
       const w = p.querySelector(':scope > span.line-number');
       return !w ? '?' : w.classList.contains('blank') ? '-' : w.dataset.label + ('given' in w.dataset ? '!' : '');
     }).join(' ')`,
    verse,
  );
  check('the numbers in the margin are drawn by places that can be pressed', widgets === '1! - - - 5 -', widgets);

  // The third line is given 44 in its place in the margin: the count goes on from it.
  const third = await app.exec(
    `return document.querySelectorAll(arguments[0] + ' > p')[2].querySelector(':scope > span.line-number.blank');`,
    verse,
  );
  await app.hover(`${verse} > p:nth-of-type(3)`);
  await sleep(150);
  await app.click(third).catch(() => app.exec(`arguments[0].click();`, third));
  const field = await app.waitFor(`${verse} > p .line-number.editing > input.line-number-field`, 3000).then(
    () => true,
    () => false,
  );
  check('pressed, the place of a number opens a field for it', field);
  await app.screenshot('passages-2-number-field');
  await app.keys('44');
  await app.press('Enter');
  await sleep(300);
  const given = await app.exec(
    `return document.querySelectorAll(arguments[0] + ' > p')[2].getAttribute('data-number')`,
    verse,
  );
  check(
    'Enter gives the line the number, and the count goes on from it',
    given === '44' && (await shownNumbers()) === '1! - 44! 45 - -' && !(await app.exists('.line-number.editing')),
    `${given}; ${await shownNumbers()}`,
  );
  await app.screenshot('passages-3-numbered');

  // --- The menu of the passage ---
  await toLine(2);
  await passageMenu();
  const items = await menuItems();
  check(
    'the label opens the menu of the passage',
    ['Numbers…', 'Language', 'Select the passage', 'Make it text', 'Split the passage here'].every((w) => items.includes(w)),
    items.join(' | '),
  );
  await app.screenshot('passages-4-menu');
  await app.clickText('.menu [role="menuitem"]', 'Split the passage here');
  await app.waitGone('.menu', 3000);
  await sleep(300);
  const split = await app.exec(
    `const passages = Array.from(document.querySelectorAll(arguments[0]));
     const between = passages[0]?.nextElementSibling;
     return { passages: passages.map((p) => p.querySelectorAll(':scope > p').length),
              between: between ? between.tagName + ':' + (between.getAttribute('data-kind') ?? '') + ':' + between.textContent.trim() : null };`,
    verse,
  );
  check(
    'split at the third line, the verse is two, with an empty paragraph of text between',
    split.passages.join(',') === '2,4' && split.between === 'P::',
    JSON.stringify(split),
  );
  await app.screenshot('passages-5-split');

  // The second is made text: its paragraphs are plain, and it is gone.
  await toLine(3);
  await passageMenu(1);
  await app.clickText('.menu [role="menuitem"]', 'Make it text');
  await app.waitGone('.menu', 3000);
  await sleep(300);
  const plain = await app.exec(
    `const ps = Array.from(document.querySelectorAll('.text-view .section .body .prose > p')).filter((p) => p.textContent.trim());
     return { verses: document.querySelectorAll(arguments[0]).length, plain: ps.map((p) => p.hasAttribute('data-kind') ? 'kind' : p.textContent.trim().split(' ')[0]) };`,
    verse,
  );
  check(
    'made text, the passage is gone and its paragraphs are plain',
    plain.verses === 1 && plain.plain.join(' ') === 'sunt collegisse evitata terrarum',
    JSON.stringify(plain),
  );

  // --- The Numbers menu: the lines of the page are the layout's, in the document settings ---
  await toLine(0);
  await app.click('.pane-bar .tools button.lines');
  await app.waitFor('.menu', 3000);
  const numbersItems = await menuItems();
  check(
    'the Numbers menu offers the passage, a reference mark and the page',
    numbersItems.some((w) => w.startsWith('Number the lines of this passage')) &&
      numbersItems.some((w) => w.startsWith('Reference mark')) &&
      numbersItems.some((w) => w.startsWith('Number the lines of the page')),
    numbersItems.join(' | '),
  );
  await app.clickText('.menu [role="menuitem"]', 'Number the lines of the page');
  const settings = await app.waitForText('dialog[open] h2', 'Document settings', 5000).then(
    () => true,
    () => false,
  );
  check(
    'and the lines of the page are numbered in the document settings',
    settings && (await app.exists('dialog[open] .window nav')),
  );
  await sleep(300);
  await app.screenshot('passages-6-page-numbers');
  await app.closeDocumentSettings(false);

  // --- The layout editor: a part for the numbers, and every kind with its look ---
  await toLine(0);
  await app.click('.pane-bar .tools .style');
  await app.clickText('[role="menuitem"]', 'Change the layout');
  await app.waitFor('dialog[open] .editor nav', 8000);
  await sleep(300);
  const nav = await app.exec(`return Array.from(document.querySelectorAll('dialog[open] .editor nav button')).map((b) => b.textContent.trim())`);
  check('the layout editor has a part for the numbers', nav.includes('Numbers'), nav.join(' | '));
  await app.clickText('dialog[open] .editor nav button', 'Kinds of paragraph');
  await app
    .waitUntil(`return !!document.querySelector('dialog[open] details[data-kind="scene"] p.resolved[data-resolved]')`, 8000, 'the looks as resolved')
    .catch(() => {});
  const scene = await app.exec(
    `const d = document.querySelector('dialog[open] details[data-kind="scene"]');
     if (!d) return null;
     d.open = true;
     return { said: d.hasAttribute('data-said'), quiet: !!d.querySelector('summary .said.quiet'),
              summary: d.querySelector('summary .said')?.textContent.trim() ?? null,
              resolved: d.querySelector('p.resolved[data-resolved]')?.textContent.trim() ?? null,
              kinds: document.querySelectorAll('dialog[open] details[data-kind]').length };`,
  );
  check(
    'the kinds part lists every kind, and one the layout says nothing of is shown as resolved',
    !!scene && !scene.said && scene.quiet && !!scene.resolved && scene.kinds >= 20,
    JSON.stringify(scene),
  );
  await sleep(200);
  await app.exec(`document.querySelector('dialog[open] details[data-kind="scene"]').scrollIntoView({ block: 'center' });`);
  await sleep(200);
  await app.screenshot('passages-7-layout-kinds');
  await app.clickText('dialog[open] footer button', 'Cancel');
  await app.waitUntil(`return !document.querySelector('dialog[open] .editor nav')`, 5000, 'the layout editor to go');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('passages-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
