// What you are writing, and the doors to how it looks (ADR 0054): what
// stands where on the pages. Every line of the preview knows what it is
// (data-what): the text, the quotation, the heading of Book one. The
// pointer resting on a line shows a chip at the edge of the page that names
// it, and pressing the chip opens Look at it: at the look of the kind, for
// the quotation. The switch at the foot of the preview turns the chips off,
// and what each line is stays known; turned on again, the chip is back.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1440, height: 900 });

/** What the lines of the preview are that hold these words, in their order on the pages. */
const whatOf = (words) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.preview .page .line'))
       .filter((l) => l.textContent.includes(arguments[0]))
       .map((l) => l.dataset.what ?? null)`,
    words,
  );
/** The chip that is shown, its words and what it says to those who cannot see it; nothing where none is. */
const chip = () =>
  app.exec(
    `const c = document.querySelector('.preview .page .chip');
     return c ? { words: c.textContent.trim(), label: c.getAttribute('aria-label'), what: c.dataset.what } : null;`,
  );
/** Waits until a chip is shown, or until it is certain that none is. */
async function chipAfterHover(shown = true, ms = 3000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    const now = await chip();
    if (shown && now) return now;
    await sleep(150);
  }
  return chip();
}
const quoteLine = '.preview .page .line[data-what="kind:quote"]';

try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Odyssey');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('Book one');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const book = `.text-view .section[data-section="${await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('Book one')).dataset.section`,
  )}"] .body`;
  await app.click(book);
  await app.waitFor(`${book} .prose[contenteditable="true"]`);
  await sleep(200);
  await app.keys('Tell me, Muse, of the man of many ways.');
  await app.press('Enter');
  await app.keys('Many cities of men he saw, and learned their minds.');
  await app.keys(['Control', "'"]);
  await sleep(300);
  check(
    'the second paragraph is a quotation',
    (await app.exec(`return Array.from(document.querySelectorAll(arguments[0] + ' .prose > p')).map((p) => p.getAttribute('data-kind') ?? 'text').join(' ')`, book)) === 'text quote',
  );

  // --- Every line of the pages knows what it is ---
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page .line[data-what]', 30000);
  await sleep(800);
  await app.waitUntil(`return !!document.querySelector(${JSON.stringify(quoteLine)})`, 15000, 'the quotation named').catch(() => {});
  check('the quotation is named as one', (await whatOf('Many cities of men')).includes('kind:quote'), JSON.stringify(await whatOf('Many cities of men')));
  check('the text is named as text', (await whatOf('Tell me, Muse')).includes('text'), JSON.stringify(await whatOf('Tell me, Muse')));
  check('the heading of Book one is named as a heading of the first level', (await whatOf('Book one')).includes('heading:1'), JSON.stringify(await whatOf('Book one')));
  check('the title of the document stands on the front page', (await whatOf('Odyssey')).includes('front'), JSON.stringify(await whatOf('Odyssey')));
  check('no line is unnamed', (await app.count('.preview .page .line:not([data-what])')) === 0);

  // --- The pointer resting on the quotation shows its chip ---
  check('the chips are on, unless turned off', (await app.attr('.preview .chip-switch', 'aria-pressed')) === 'true');
  check('no chip is shown before the pointer rests on a line', (await chip()) === null);
  await app.hover(quoteLine);
  let shown = await chipAfterHover();
  check('resting on the quotation shows a chip that names it', shown?.words === 'Quotation' && shown?.what === 'kind:quote', JSON.stringify(shown));
  check('the chip says what it does', shown?.label === 'How “Quotation” looks…', shown?.label);
  const placed = await app.exec(
    `const c = document.querySelector('.preview .page .chip').getBoundingClientRect();
     const page = document.querySelector('.preview .page .chip').closest('.page').getBoundingClientRect();
     const line = document.querySelector(${JSON.stringify(quoteLine)}).getBoundingClientRect();
     const text = Math.max(...Array.from(document.querySelector('.preview .page .chip').closest('.page').querySelectorAll('.line')).map((l) => l.getBoundingClientRect().right));
     return { inPage: c.left >= page.left && c.right <= page.right + 0.5, besideText: c.left >= text - 0.5, atLine: Math.abs(c.top - line.top) < 12 };`,
  );
  check('the chip stands in the margin beside the line, over no text', placed.inPage && placed.besideText && placed.atLine, JSON.stringify(placed));
  await app.screenshot('what-3-chip');
  await app.hover('.preview footer');
  await sleep(1200);
  check('the chip goes a moment after the pointer leaves', (await chip()) === null);

  // --- Pressing it opens Look at the look of the quotation ---
  await app.hover(quoteLine);
  await chipAfterHover();
  await app.click('.preview .page .chip');
  await app.waitFor('.side .look', 8000);
  await app.waitUntil(`return !!document.querySelector('.side .look details[data-kind="quote"][open]')`, 8000, 'the look of the quotation').catch(() => {});
  check('pressing the chip opens Look at the look of the quotation', await app.exists('.side .look details[data-kind="quote"][open]'));
  check('and the chip goes', (await chip()) === null);
  await sleep(600);
  await app.screenshot('what-4-look');

  // --- The switch at the foot turns the chips off, and on ---
  await app.click('.preview .chip-switch');
  await sleep(300);
  check('the switch turns the chips off', (await app.attr('.preview .chip-switch', 'aria-pressed')) === 'false');
  await app.hover(quoteLine);
  check('with the chips off, resting on a line shows none', (await chipAfterHover(false, 1200)) === null);
  check('and what each line is stays known', (await app.count(quoteLine)) > 0 && (await app.count('.preview .page .line:not([data-what])')) === 0);
  await app.screenshot('what-5-off');
  await app.click('.preview .chip-switch');
  await sleep(300);
  check('the switch turns them on again', (await app.attr('.preview .chip-switch', 'aria-pressed')) === 'true');
  await app.hover('.preview footer');
  await sleep(200);
  await app.hover(quoteLine);
  shown = await chipAfterHover();
  check('and the chip is back', shown?.words === 'Quotation', JSON.stringify(shown));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (e) {
  console.error(e);
  await app.screenshot('what-failed').catch(() => {});
  checks.push({ name: 'the script ran through', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(failed.length ? `\n${failed.length} of ${checks.length} checks failed` : `\nAll ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
