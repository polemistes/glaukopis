// What you are writing, and the doors to how it looks (ADR 0054): what
// stands where on the pages. Every line of the preview knows what it is
// (data-what): the text, the quotation, the heading of Book one. A line
// pressed shows a chip at the edge of the page that names it, which stays
// until the same line is pressed again, another is pressed and the chip
// moves there, the page is left or Escape is pressed; pressing the chip
// opens Look at it: at the look of the kind, for the quotation. The switch
// at the foot of the preview turns the chips off, and what each line is
// stays known; turned on again, the chip is back. What the layout puts in
// the margins and the page itself have chips too (ADR 0056).

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
async function chipAfter(shown = true, ms = 3000) {
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
  await app.keys(['Alt', 'Shift', 'Enter']);
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

  // --- The quotation pressed shows its chip, which stays ---
  check('the chips are on, unless turned off', (await app.attr('.preview .chip-switch', 'aria-pressed')) === 'true');
  check('no chip is shown before a line is pressed', (await chip()) === null);
  await app.hover(quoteLine);
  await sleep(500);
  check('resting the pointer on a line shows nothing', (await chip()) === null);
  await app.click(quoteLine);
  let shown = await chipAfter();
  check('pressing the quotation shows a chip that names it', shown?.words === 'Quotation' && shown?.what === 'kind:quote', JSON.stringify(shown));
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
  await sleep(900);
  check('the chip stays while the pointer goes elsewhere', (await chip())?.what === 'kind:quote');
  await app.click(quoteLine);
  await sleep(300);
  check('the same line pressed again takes the chip away', (await chip()) === null);
  await app.click(quoteLine);
  await chipAfter();
  await app.click('.preview .page .line[data-what="text"]');
  await sleep(300);
  check('another line pressed moves the chip there', (await chip())?.what === 'text', JSON.stringify(await chip()));
  await app.click('.preview footer');
  await sleep(300);
  check('a press outside the page takes the chip away', (await chip()) === null);
  await app.click(quoteLine);
  await chipAfter();
  await app.press('Escape');
  await sleep(300);
  check('and so does Escape', (await chip()) === null);

  // --- Pressing it opens Look at the look of the quotation ---
  await app.click(quoteLine);
  await chipAfter();
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
  await app.click(quoteLine);
  check('with the chips off, pressing a line shows none', (await chipAfter(false, 1200)) === null);
  check('and what each line is stays known', (await app.count(quoteLine)) > 0 && (await app.count('.preview .page .line:not([data-what])')) === 0);
  await app.screenshot('what-5-off');
  await app.click('.preview .chip-switch');
  await sleep(300);
  check('the switch turns them on again', (await app.attr('.preview .chip-switch', 'aria-pressed')) === 'true');
  await app.click(quoteLine);
  shown = await chipAfter();
  check('and the chip is back', shown?.words === 'Quotation', JSON.stringify(shown));

  // --- What the layout puts in the margins has its chip, which lands where it is turned off (ADR 0056) ---
  /** Whether a heading of Look, by its name, stands at the top of the panel, under its chips. */
  const atTop = (name) =>
    app.exec(
      `const f = document.querySelector('.side .look .through');
       const h = f?.querySelector('[data-at="' + arguments[0] + '"]');
       if (!f || !h) return null;
       return Math.round(h.getBoundingClientRect().top - f.querySelector('.chips').getBoundingClientRect().bottom);`,
      name,
    );
  const numberLine = '.preview .page .line[data-what="footer"]';
  await app.waitFor(numberLine, 15000);
  await app.exec(`document.querySelector(arguments[0]).scrollIntoView({ block: 'center' });`, numberLine);
  await sleep(400);
  await app.click(numberLine);
  shown = await chipAfter();
  check('the footer, which holds the number of the page, has a chip that names it', shown?.words === 'Footer' && shown?.what === 'footer', JSON.stringify(shown));
  await app.click('.preview .page .chip');
  await sleep(600);
  let near = await atTop('footer');
  check('which opens Look at the rows of the footer', near !== null && near >= -4 && near < 120, `${near}`);

  // A play: the header with the title, at the top of every page but the first.
  await app.chooseWhat('Play');
  const headLine = '.preview .page .line[data-what="header"]';
  await app.waitFor(headLine, 30000).catch(() => {});
  check('a play has a header, named as one', await app.exists(headLine));
  await app.exec(`document.querySelector(arguments[0]).scrollIntoView({ block: 'center' });`, headLine);
  await sleep(400);
  await app.click(headLine);
  shown = await chipAfter();
  check('the header has a chip that names it', shown?.words === 'Header', JSON.stringify(shown));
  await app.screenshot('what-6-header');
  await app.click('.preview .page .chip');
  await sleep(600);
  near = await atTop('header');
  check('which opens Look at the rows of the header', near !== null && near >= -4 && near < 120, `${near}`);
  const shownRow = '.side .look h4[data-at="header"] + label.row input[type="checkbox"]';
  check('the first of which says it is shown', (await app.exec(`return document.querySelector(arguments[0])?.checked ?? null`, shownRow)) === true);
  await app.click(shownRow);
  await app
    .waitUntil(`return !document.querySelector(${JSON.stringify(headLine)}) && !!document.querySelector('.preview .page .line[data-what]')`, 20000, 'the header to go')
    .catch(() => {});
  check('and turns it off: the header is gone from the pages', !(await app.exists(headLine)));

  // The title: its chip lands on the switch of the title page, first in the front page.
  const titleLine = '.preview .page .line[data-what="front"]';
  await app.waitFor(titleLine, 15000);
  await app.exec(`document.querySelector(arguments[0]).scrollIntoView({ block: 'center' });`, titleLine);
  await sleep(400);
  await app.click(titleLine);
  shown = await chipAfter();
  check('the title has its chip', shown?.what === 'front', JSON.stringify(shown));
  await app.click('.preview .page .chip');
  await sleep(600);
  const first = await app.exec(
    `const part = document.querySelector('.side .look .part[data-part="front"]');
     const row = part?.querySelector('.row');
     return { switch: !!row?.querySelector('[data-part-switch="title-page"]'), on: !!row?.querySelector('input')?.checked };`,
  );
  check('which opens the front page, whose first row is the switch of the title page, on', first.switch && first.on, JSON.stringify(first));
  await app.click('.side .look .part[data-part="front"] [data-part-switch="title-page"]');
  await app
    .waitUntil(`return !document.querySelector(${JSON.stringify(titleLine)}) && !!document.querySelector('.preview .page .line[data-what]')`, 20000, 'the title page to go')
    .catch(() => {});
  check('turned off there, the title page is gone from the pages', !(await app.exists(titleLine)));

  // The page itself: pressed where no line is, a chip for the page.
  await app.exec(`document.querySelector('.preview .page[data-page="1"]').scrollIntoView({ block: 'start' });`);
  await sleep(400);
  const lower = await app.exec(`return Math.round(document.querySelector('.preview .page[data-page="1"]').getBoundingClientRect().height * 0.3)`);
  await app.hover('.preview .page[data-page="1"]', 0, lower);
  await app.cmd('POST', '/actions', {
    actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }] }],
  });
  await app.cmd('DELETE', '/actions');
  shown = await chipAfter();
  check('pressing the page where no line is shows a chip for the page', shown?.words === 'Page' && shown?.what === 'page', JSON.stringify(shown));
  await app.screenshot('what-7-page');
  await app.click('.preview .page .chip');
  await sleep(600);
  check(
    'which opens Look at the page',
    (await app.exec(`return document.querySelector('.side .look .chips button.current')?.dataset.section`)) === 'page',
  );

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
