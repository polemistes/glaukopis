// Runs and what is said of them (ADR 0041): paragraphs of one kind standing
// together are seen as one run, with a bracket and a label that names the
// kind while the cursor is in it; the label's menu, which begins a new run
// at a paragraph, joins it again and makes a run text, its line breaks
// kept; the numbers in the margin, set from the Numbers menu and edited in
// place, the label then saying "numbered"; the Numbers menu's switch for
// the lines of the page; page and column breaks from Insert, seen in the
// text and in the preview; and the layout editor, which has a part for the
// numbers, every kind with its look, and the columns of the page.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900 });

/** The text of the element written in: found by its section once it is made. */
let prose = '.text-view .section .body .prose';

/** Puts the cursor at the end of a line, counted through every paragraph of the text, and gives the editor time to take it up. */
async function toLine(i) {
  await app.exec(
    `const lines = [];
     for (const p of document.querySelectorAll(arguments[0] + ' > p')) {
       let line = [];
       lines.push(line);
       const walker = document.createTreeWalker(p, NodeFilter.SHOW_ALL);
       let node;
       while ((node = walker.nextNode())) {
         if (node.nodeType === 1 && node.classList.contains('hard-break')) lines.push((line = []));
         if (node.nodeType === 3 && !node.parentElement.closest('.run-line, .line-number, .line-margin')) line.push(node);
       }
     }
     const line = lines[arguments[1]];
     const last = line[line.length - 1];
     getSelection().collapse(last, last.data.length);`,
    prose,
    i,
  );
  await sleep(200);
}

/** The paragraphs of the text, as their kind, their run and how many lines they have: "line@line*:2" for the first of a run of verse. */
const shape = () =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).map((p) =>
       (p.getAttribute('data-kind') ?? 'text') + (p.hasAttribute('data-run') ? '@' + p.getAttribute('data-run') + (p.hasAttribute('data-run-first') ? '*' : '') : '') +
       ':' + (p.querySelectorAll('.hard-break').length + 1)).join(' ')`,
    prose,
  );

/** The numbers the lines show in the margin, line by line: "-" where none, "!" where given by hand. */
const shownNumbers = () =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p span.line-number')).map((w) =>
       w.classList.contains('blank') ? '-' : w.dataset.label + ('given' in w.dataset ? '!' : '')).join(' ')`,
    prose,
  );

/** The labels of the runs, in their order. */
const labels = () =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p[data-run-first] .run-label')).map((l) => l.textContent.trim())`,
    prose,
  );

/** The words of the items of the menu that is open, with whether each can be chosen. */
const menuItems = () =>
  app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((i) => (i.querySelector('.label > .truncate') ?? i).textContent.replace(/\\s+/g, ' ').trim() + (i.disabled || i.getAttribute('aria-disabled') === 'true' ? ' (off)' : ''))`,
  );

/** Opens the menu of a run from its label: the first run, or the one given. */
async function runMenu(n = 0) {
  const all = await app.findAll(`${prose} > p[data-run-first] .run-label`);
  await app.exec(`arguments[0].click();`, { 'element-6066-11e4-a52e-4f735466cecf': all[n] });
  await app.waitFor('.menu', 3000);
  await sleep(150);
}

/** Chooses in the menu that is open, and waits for it to go. */
async function choose(words) {
  await app.clickText('.menu [role="menuitem"]', words);
  await app.waitGone('.menu', 3000);
  await sleep(300);
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
  prose = `.text-view .section[data-section="${await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('first ode')).dataset.section`,
  )}"] .body .prose`;
  await app.click(body);
  await app.waitFor('.text-view .section .body .prose[contenteditable="true"]');
  await sleep(200);

  // --- Three stanzas of two lines, made verse ---
  const words = [
    'Maecenas atavis edite regibus,',
    'o et praesidium et dulce decus meum,',
    'sunt quos curriculo pulverem Olympicum',
    'collegisse iuvat metaque fervidis',
    'evitata rotis palmaque nobilis',
    'terrarum dominos evehit ad deos;',
  ];
  for (const [i, line] of words.entries()) {
    if (i % 2) await app.keys(['Shift', 'Enter']);
    else if (i) await app.press('Enter');
    await app.keys(line);
  }
  await sleep(200);
  await app.keys(['Control', 'a']);
  await app.click('.pane-bar .tools .style');
  await app.clickText('[role="menuitem"]', 'More…');
  await sleep(200);
  await app.clickText('[role="menuitem"]', 'Verse');
  await sleep(300);
  check('the three stanzas are one run of verse', (await shape()) === 'line@line*:2 line@line:2 line@line:2', await shape());

  // --- The bracket: the run the cursor is in, and its label ---
  await toLine(2);
  const bracket = await app.exec(
    `const ps = Array.from(document.querySelectorAll(arguments[0] + ' > p'));
     const l = ps[0].querySelector('span.run-line > span.run-label[data-kind="line"][role="button"]');
     const box = l?.getBoundingClientRect();
     return { current: ps.every((p) => p.hasAttribute('data-current')), lines: ps.every((p) => !!p.querySelector('span.run-line')),
              label: l?.textContent.trim() ?? null,
              seen: !!box && box.width > 0 && getComputedStyle(l).visibility !== 'hidden' && getComputedStyle(l).opacity !== '0' };`,
    prose,
  );
  check(
    'with the cursor in the verse, its paragraphs are the current run, each with its line, and the label names it',
    bracket.current && bracket.lines && bracket.label === 'Verse' && bracket.seen,
    JSON.stringify(bracket),
  );
  await app.screenshot('runs-1-bracket');

  // --- Numbers in place: counted from 1, then a number given in the margin ---
  await toLine(0);
  await app.click('.pane-bar .tools button.lines');
  await app.waitFor('.menu', 3000);
  await app.clickText('.menu [role="menuitem"]', 'Number these lines…');
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
  check('the verse is counted from 1, every 5', (await shownNumbers()) === '1! - - - 5 -', await shownNumbers());
  check('the label says the run is numbered', (await labels()).join(' | ') === 'Verse · numbered', (await labels()).join(' | '));

  // The third line is given 44 in its place in the margin: the count goes on from it.
  const third = await app.exec(`return document.querySelectorAll(arguments[0] + ' > p span.line-number')[2];`, prose);
  await app.hover(`${prose} > p:nth-of-type(2)`);
  await sleep(150);
  await app.click(third).catch(() => app.exec(`arguments[0].click();`, third));
  const field = await app.waitFor(`${prose} .line-number.editing > input.line-number-field`, 3000).then(
    () => true,
    () => false,
  );
  check('pressed, the place of a number opens a field for it', field);
  await app.screenshot('runs-2-number-field');
  await app.keys('44');
  await app.press('Enter');
  await sleep(300);
  const given = await app.exec(
    `return document.querySelectorAll(arguments[0] + ' > p')[1].querySelector('span.linemark')?.getAttribute('data-number') ?? null`,
    prose,
  );
  check(
    'Enter gives the line the number, and the count goes on from it',
    given === '44' && (await shownNumbers()) === '1! - 44! 45 - -' && !(await app.exists('.line-number.editing')),
    `${given}; ${await shownNumbers()}`,
  );
  await app.screenshot('runs-3-numbered');

  // --- The menu of the run ---
  await toLine(2);
  await runMenu();
  const items = await menuItems();
  check(
    'the label opens the menu of the run',
    ['Numbers…', 'Language', 'Select these paragraphs', 'Make it text', 'Begin a new run here', 'Join with the run before (off)'].every((w) => items.includes(w)),
    items.join(' | '),
  );
  await app.screenshot('runs-4-menu');
  await choose('Begin a new run here');
  check(
    'a new run begins at the second stanza, the numbers as they were',
    (await shape()) === 'line@line*:2 line@line*:2 line@line:2' &&
      (await app.exists(`${prose} > p:nth-of-type(2)[data-new]`)) &&
      (await labels()).join(' | ') === 'Verse · numbered | Verse · numbered' &&
      (await shownNumbers()) === '1! - 44! 45 - -',
    `${await shape()}; ${(await labels()).join(' | ')}; ${await shownNumbers()}`,
  );
  await app.screenshot('runs-5-begun');

  // Joined again from the second run's menu, then begun anew.
  await runMenu(1);
  await choose('Join with the run before');
  check('joined with the run before, the verse is one run again', (await shape()) === 'line@line*:2 line@line:2 line@line:2', await shape());
  await toLine(2);
  await runMenu();
  await choose('Begin a new run here');

  // The second run is made text: the kind is all that changes.
  await toLine(3);
  await runMenu(1);
  await choose('Make it text');
  check(
    'made text, the second run keeps its line breaks and its numbers',
    (await shape()) === 'line@line*:2 text@text*:2 text@text:2' &&
      (await labels()).join(' | ') === 'Verse · numbered | Text · numbered' &&
      (await shownNumbers()) === '1! - 44! 45 - -',
    `${await shape()}; ${(await labels()).join(' | ')}; ${await shownNumbers()}`,
  );

  // --- The Numbers menu: the lines of the page, a switch said of the document ---
  await toLine(0);
  await app.click('.pane-bar .tools button.lines');
  await app.waitFor('.menu', 3000);
  const numbersItems = await menuItems();
  check(
    'the Numbers menu offers these lines, a reference mark and the page',
    numbersItems.some((w) => w.startsWith('Number these lines')) &&
      numbersItems.some((w) => w.startsWith('Reference mark')) &&
      numbersItems.some((w) => w.startsWith('Number the lines of the page')),
    numbersItems.join(' | '),
  );
  await app.clickText('.menu [role="menuitem"]', 'Number the lines of the page');
  await sleep(300);
  await toLine(0);
  await app.click('.pane-bar .tools button.lines');
  await app.waitFor('.menu');
  await sleep(150);
  const page = await app.exec(
    `const m = Array.from(document.querySelectorAll('.menu [role="menuitem"], .menu [role="menuitemcheckbox"]')).find((m) => m.textContent.includes('Number the lines of the page'));
     return m ? (m.getAttribute('aria-checked') ?? (m.querySelector('.check svg') ? 'true' : 'false')) : null;`,
  );
  check('the lines of the page are numbered from the Numbers menu, which shows it', page === 'true', String(page));
  await app.screenshot('runs-6-page-numbers');
  // Turned off again, so that the preview below has the numbers of the verse alone.
  await app.clickText('.menu [role="menuitem"]', 'Number the lines of the page');
  await sleep(300);

  // --- A page break and a column break, from Insert ---
  await toLine(5);
  await app.clickText('.pane-bar .tools button', 'Insert');
  await app.waitFor('.menu');
  await choose('Page break');
  await app.keys('After the page break.');
  await app.clickText('.pane-bar .tools button', 'Insert');
  await app.waitFor('.menu');
  await choose('Column break');
  await app.keys('After the column break.');
  await sleep(300);
  const breaks = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > div.pagebreak')).map((b) => {
       const box = b.getBoundingClientRect();
       return b.getAttribute('data-what') + ':' + (b.querySelector('span.pagebreak-label')?.textContent.trim() ?? '') + ':' + (box.height > 0) + ':' + (b.nextElementSibling?.textContent.trim() ?? '');
     })`,
    prose,
  );
  check(
    'the breaks stand in the text as dashed lines with their names, the text going on after each',
    breaks.length === 2 &&
      /^page:Page break:true:After the page break\.$/.test(breaks[0]) &&
      /^column:Column break:true:After the column break\.$/.test(breaks[1]),
    breaks.join(' | '),
  );
  await app.screenshot('runs-7-breaks');

  // --- The look of the document: a part for the numbers, every kind with its look, and the columns ---
  await toLine(0);
  await app.click('.pane-bar .tools .style');
  await app.clickText('[role="menuitem"]', 'looks…');
  await app.waitFor('.side .look .chips', 8000);
  await sleep(300);
  const nav = await app.exec(`return Array.from(document.querySelectorAll('.side .look .chips button')).map((b) => b.textContent.trim())`);
  check('the look has a part for the numbers', nav.includes('Numbers'), nav.join(' | '));
  await app.lookSection('Paragraphs');
  await app
    .waitUntil(`return !!document.querySelector('.side .look details[data-kind="scene"] p.resolved[data-resolved]')`, 8000, 'the looks as resolved')
    .catch(() => {});
  const scene = await app.exec(
    `const d = document.querySelector('.side .look details[data-kind="scene"]');
     if (!d) return null;
     d.open = true;
     return { said: d.hasAttribute('data-said'), quiet: !!d.querySelector('summary .said.quiet'),
              summary: d.querySelector('summary .said')?.textContent.trim() ?? null,
              resolved: d.querySelector('p.resolved[data-resolved]')?.textContent.trim() ?? null,
              kinds: document.querySelectorAll('.side .look details[data-kind]').length };`,
  );
  check(
    'the kinds part lists every kind, and one the layout says nothing of is shown as resolved',
    !!scene && !scene.said && scene.quiet && !!scene.resolved && scene.kinds >= 20,
    JSON.stringify(scene),
  );
  await sleep(200);
  await app.exec(`document.querySelector('.side .look details[data-kind="scene"]').scrollIntoView({ block: 'center' });`);
  await sleep(200);
  await app.screenshot('runs-8-layout-kinds');

  // The page in two columns: the gap between them is asked for only then.
  await app.lookSection('Page');
  await sleep(300);
  const row = (label) => app.lookRow(label);
  const gapBefore = await app.exec(`return !!${row('Gap between columns')}`);
  await app.exec(
    `const i = ${row('Columns')}.querySelector('input'); i.value = '2'; i.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await sleep(600);
  const gapAfter = await app.exec(`return ${row('Gap between columns')}?.querySelector('input')?.value ?? null`);
  check(
    'the look has a field for the columns, and the gap between them is asked for where there are more than one',
    !gapBefore && gapAfter === '1cm',
    `${gapBefore} ${gapAfter}`,
  );
  const lookTop = await app.lookTop();
  check('the columns are the document’s change, not a new layout', lookTop.layout === 'Layout: Manuscript · 1 change', lookTop.layout);
  await app.exec(`${row('Columns')}.scrollIntoView({ block: 'center' });`);
  await sleep(150);
  await app.screenshot('runs-9-layout-columns');
  await sleep(300);

  // --- The preview: the breaks and the columns set by Typst ---
  await app.keys(['Control', 'p']);
  const opened = await app.waitFor('.preview', 3000).then(
    () => true,
    () => false,
  );
  if (!opened) await app.click('header button[aria-label="Preview and export"]');
  await app.waitFor('.preview .page', 30000);
  await sleep(2000);
  check('the preview is made without remark', !(await app.exists('.preview footer .issues')));
  const pages = await app.count('.preview .page');
  const typ = execFileSync('find', [app.dataDir, '-name', 'document.typ'], { encoding: 'utf8' }).trim().split('\n')[0];
  const typst = typ ? readFileSync(typ, 'utf8') : '';
  check(
    'the Typst of the preview has the page break, the column break and two columns',
    typst.includes('#pagebreak()') && typst.includes('#colbreak()') && /columns: 2,/.test(typst) && /#set columns\(gutter: 1cm\)/.test(typst),
    typst.slice(typst.indexOf('#set page'), typst.indexOf('#set page') + 300),
  );
  check('the page break begins a new page', pages >= 2, `${pages} pages`);
  await app.screenshot('runs-10-preview');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('runs-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
