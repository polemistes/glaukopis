// The numbers of headings as the document prints them, before the names in
// the map, the text view and the outline (record 0079): nothing while the
// look does not number the headings; then by the rule of the look, level by
// level, the chapters counted on through the parts where the look says so
// (record 0078).
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/** The name of every box of the map, with the number before it: "I Part one", "Alpha". */
const mapNumbers = () =>
  app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node')).map((n) => ((n.querySelector('.caption .number')?.textContent.trim() ?? '') + ' ' + (n.querySelector('.caption .name')?.textContent.trim() ?? '')).trim()).sort()`,
  );
/** A chooser of a level of the look, by the level and the words of its row. */
const chooseOfLevel = (level, label, value) =>
  app.exec(
    `const row = Array.from(document.querySelectorAll('.side .look details.level[data-level="' + arguments[0] + '"] .row')).find((r) => r.querySelector('.what')?.firstChild?.textContent.trim() === arguments[1]);
     const s = row?.querySelector('select');
     if (!s) throw new Error('no chooser ' + arguments[1] + ' of level ' + arguments[0]);
     s.value = arguments[2];
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
    level,
    label,
    value,
  );

const app = await App.launch({ width: 1440, height: 900 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'A book in parts');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);

  // --- Two parts of two chapters, from the keyboard ---
  await app.click('.diagram .node.root');
  const add = async (where, name) => {
    await app.keys(where === 'under' ? ['Alt', 'Shift', 'Enter'] : ['Alt', 'Enter']);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await add('under', 'Part one');
  await add('under', 'Alpha');
  await add('after', 'Beta');
  await app.clickText('.diagram .node .caption .name', 'Part one');
  await sleep(150);
  await add('after', 'Part two');
  await add('under', 'Gamma');
  await add('after', 'Delta');
  const plain = await mapNumbers();
  check(
    'the boxes of the map carry no number while the look does not number the headings',
    same(plain, ['A book in parts', 'Alpha', 'Beta', 'Delta', 'Gamma', 'Part one', 'Part two']),
    plain.join(' | '),
  );

  // --- The look numbers the headings: 1, 1.1, as the layout has it ---
  await app.typeset();
  await app.waitFor('.side.typesetting .preview', 15000);
  await app.openLook('Headings');
  await app.lookWrite('Numbered', true);
  await app.waitUntil(`return !!document.querySelector('.diagram .node .caption .number')`, 8000, 'numbers in the map');
  await sleep(200);
  const numbered = await mapNumbers();
  check(
    'each box of the map has its number before its name, as the document prints it',
    same(numbered, ['1 Part one', '1.1 Alpha', '1.2 Beta', '2 Part two', '2.1 Gamma', '2.2 Delta', 'A book in parts']),
    numbered.join(' | '),
  );
  await app.screenshot('numbers-1-map');

  // --- Parts in roman, the chapters counted on through the parts ---
  await app.lookChoose('Numbering', 'roman');
  await app.exec(`document.querySelector('.side .look details.level[data-level="2"]').open = true;`);
  await app.lookChoose('Count', 'through');
  await app.waitUntil(
    `return Array.from(document.querySelectorAll('.diagram .node .caption .number')).some((n) => n.textContent.trim() === 'IV')`,
    8000,
    'the chapters counted on, in roman as the level above',
  );
  const asAbove = await mapNumbers();
  check(
    'parts in roman; the chapters, as the level above, in roman too, and counted on through the parts',
    same(asAbove, ['A book in parts', 'I Alpha', 'I Part one', 'II Beta', 'II Part two', 'III Gamma', 'IV Delta']),
    asAbove.join(' | '),
  );
  await chooseOfLevel(2, 'Numbering', 'arabic');
  await app.waitUntil(
    `return Array.from(document.querySelectorAll('.diagram .node .caption .number')).some((n) => n.textContent.trim() === '4')`,
    8000,
    'the chapters 1 to 4',
  );
  const through = await mapNumbers();
  check(
    'the chapters 1 to 4 through the parts, each by its own number',
    same(through, ['1 Alpha', '2 Beta', '3 Gamma', '4 Delta', 'A book in parts', 'I Part one', 'II Part two']),
    through.join(' | '),
  );
  await app.screenshot('numbers-2-map-through');

  // --- The same numbers before the headings of the text view ---
  await app.view('text');
  await app.waitFor('.text-view .section', 5000);
  await sleep(300);
  const inText = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => ((s.querySelector('.heading .number')?.textContent.trim() ?? '') + ' ' + (s.querySelector('.heading .prose')?.textContent.trim() ?? '')).trim())`,
  );
  check(
    'the headings of the text view carry the same numbers, the title of the document none',
    same(inText, ['A book in parts', 'I Part one', '1 Alpha', '2 Beta', 'II Part two', '3 Gamma', '4 Delta']),
    inText.join(' | '),
  );
  check(
    'the number stands beside the name, on its line',
    await app.exec(
      `const h = Array.from(document.querySelectorAll('.text-view .section')).find((s) => s.querySelector('.heading .number'))?.querySelector('.heading');
       const n = h.querySelector('.number').getBoundingClientRect(), p = h.querySelector('.prose').getBoundingClientRect();
       return n.right <= p.left + 1 && Math.abs(n.bottom - p.bottom) < n.height`,
    ),
  );

  // --- And in the outline ---
  await app.keys(['Control', 'Shift', 'o']);
  await app.waitFor('.outline', 3000);
  await sleep(200);
  const outlined = await app.exec(
    `return Array.from(document.querySelectorAll('.outline [data-outline]')).map((b) => ((b.querySelector('.number')?.textContent.trim() ?? '') + ' ' + (b.querySelector('.name')?.textContent.trim() ?? '')).trim())`,
  );
  check(
    'the outline lists each element with its number',
    same(outlined, ['A book in parts', 'I Part one', '1 Alpha', '2 Beta', 'II Part two', '3 Gamma', '4 Delta']),
    outlined.join(' | '),
  );
  await app.screenshot('numbers-3-text-outline');

  // --- Hidden by the settings in the text view and the diagram; the outline keeps them ---
  const hideOrShow = async (word) => {
    // From the diagram, where Ctrl+, is not the key of lowered text.
    await app.view('diagram');
    await app.waitFor('.diagram .node.root', 8000);
    await sleep(200);
    await app.keys(['Control', ',']);
    await app.waitForText('dialog[open] header h2', 'Settings', 5000);
    await app.waitFor('[data-heading-numbers]', 8000);
    await app.exec(`document.querySelector('[data-heading-numbers]').scrollIntoView({ block: 'center' })`);
    await sleep(200);
    if (word === 'Hidden') await app.screenshot('numbers-4-setting');
    await app.clickText('[data-heading-numbers] [role="radio"]', word);
    await sleep(200);
    await app.press('Escape');
    await app.waitGone('dialog[open]', 5000);
  };
  await hideOrShow('Hidden');
  await app.waitUntil(`return !document.querySelector('.diagram .node .caption .number')`, 8000, 'the numbers hidden in the diagram');
  const hidden = await mapNumbers();
  check(
    'hidden by the settings, the boxes of the map carry the name alone',
    same(hidden, ['A book in parts', 'Alpha', 'Beta', 'Delta', 'Gamma', 'Part one', 'Part two']),
    hidden.join(' | '),
  );
  await app.view('text');
  await app.waitFor('.text-view .section', 5000);
  await sleep(300);
  check('and the headings of the text view too', !(await app.exists('.text-view .heading .number')));
  if (!(await app.exists('.outline'))) {
    await app.keys(['Control', 'Shift', 'o']);
    await app.waitFor('.outline', 3000);
    await sleep(200);
  }
  check('while the outline keeps its numbers', await app.exists('.outline .number'));
  await app.screenshot('numbers-5-hidden');
  await hideOrShow('Shown');
  await app.waitUntil(`return !!document.querySelector('.diagram .node .caption .number')`, 8000, 'the numbers shown again');
  const shown = await mapNumbers();
  check('shown again, the numbers are back as they were', same(shown, through), shown.join(' | '));
  await app.view('text');
  await app.waitFor('.text-view .section', 5000);
  await app.waitUntil(`return !!document.querySelector('.text-view .heading .number')`, 8000, 'the numbers back in the text view');

  // --- Numbered no more: the numbers go ---
  await app.lookWrite('Numbered', false);
  await app.waitUntil(`return !document.querySelector('.text-view .heading .number')`, 8000, 'the numbers gone');
  check('the numbers go when the headings are numbered no more', !(await app.exists('.outline .number')));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (e) {
  console.error(e);
  await app.screenshot('numbers-failed').catch(() => {});
  checks.push({ name: 'the script ran through', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(failed.length ? `\n${failed.length} of ${checks.length} checks failed` : `\nAll ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
