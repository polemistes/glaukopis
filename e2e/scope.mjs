// Where a document's changes hold (ADR 0059). In the Odyssey, with the
// text at Book one, Look offers to set the changes on Book one alone; the
// type set larger there is larger in Book one's stretch of the preview and
// not before or after it; the footer turned off for Book one begins it on a
// page of its own; the pages may be counted anew there; and the chip on a
// line of Book two opens Look with Book two chosen.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1440, height: 900 });

/** The Typst of the preview, as last made; nothing before it is. */
function typst() {
  const found = execFileSync('find', [app.dataDir, '-name', 'document.typ'], { encoding: 'utf8' }).trim().split('\n')[0];
  return found ? readFileSync(found, 'utf8') : '';
}
/** Waits until the Typst of the preview holds what is asked, or not. */
async function typstHas(pattern, yes = true, ms = 20000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (pattern.test(typst()) === yes) return true;
    await sleep(300);
  }
  return false;
}
/** The line of where the changes hold: what it offers, and what is chosen. */
const scopeLine = () =>
  app.exec(
    `const s = document.querySelector('.side .look select.scope');
     return s ? { value: s.value, options: Array.from(s.options).map((o) => o.textContent.trim()) } : null;`,
  );
const chooseScope = (value) =>
  app.exec(
    `const s = document.querySelector('.side .look select.scope');
     s.value = arguments[0];
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
    value,
  );
const idOf = (name) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === arguments[0])?.dataset.section ?? null`,
    name,
  );

try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Odyssey');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(700);
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys('Book one');
  await app.press('Enter');
  await sleep(250);
  await app.keys('Tell me, Muse, of the man of many ways.');
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys('Book two');
  await app.press('Enter');
  await sleep(250);
  await app.keys('Then the gods sat in council.');
  await sleep(300);
  const one = await idOf('Book one');
  const two = await idOf('Book two');
  check('a project of two books', !!one && !!two, `${one} ${two}`);

  // --- The text at Book one: Look offers it ---
  const bookOne = `.text-view .section[data-section="${one}"] .body`;
  await app.click(bookOne);
  await sleep(300);
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page', 30000);
  await sleep(800);
  await app.click('.preview header [data-look]');
  await app.waitFor('.side .look .chips', 15000);
  await sleep(500);
  let line = await scopeLine();
  check(
    'with the text at Book one, Look says where its changes hold: the whole document, or only Book one',
    line?.value === '' && JSON.stringify(line?.options) === JSON.stringify(['The whole document: Odyssey', 'Only Book one']),
    JSON.stringify(line),
  );
  await chooseScope(one);
  await sleep(300);
  check('Book one chosen, Look says what that means', await app.exists('.side .look [data-scope-hint]'));
  await app.screenshot('scope-1-line');

  // --- Larger type in Book one alone ---
  await app.lookSection('Type');
  await app.lookWrite('Size', '14');
  await sleep(800);
  check(
    'the type set larger for Book one is larger in its stretch of the preview, and the document’s before and after',
    await typstHas(/size: 12pt[\s\S]*size: 14pt[\s\S]*= Book one[\s\S]*size: 12pt[\s\S]*= Book two/),
  );
  check(
    'the change is Book one’s',
    (await app.exec(`return Number(document.querySelector('.side .look .layout-line')?.dataset.changes ?? -1)`)) === 1,
  );
  await chooseScope('');
  await sleep(500);
  check(
    'and the whole document has none',
    (await app.exec(`return Number(document.querySelector('.side .look .layout-line')?.dataset.changes ?? -1)`)) === 0,
  );
  await chooseScope(one);
  await sleep(300);

  // --- No footer for Book one: it begins a page of its own ---
  await app.lookSection('Page');
  check('the pages of Book one may be counted anew', await app.exists(`.side .look .part[data-part="page"] input[type="checkbox"]`) &&
    (await app.exec(`return Array.from(document.querySelectorAll('.side .look .row .what')).some((w) => w.firstChild.textContent.trim() === 'Begins counting the pages anew here')`)));
  await app.click('.side .look h4[data-at="footer"] + label.row input[type="checkbox"]');
  check(
    'the footer turned off for Book one begins it on a new page without one',
    await typstHas(/#pagebreak\(weak: true\)\n#set page\([\s\S]*?footer: none,[\s\S]*= Book one[\s\S]*#set page\([\s\S]*?footer: context[\s\S]*= Book two/),
  );
  await app.waitUntil(`return document.querySelectorAll('.preview .page').length >= 2`, 20000, 'a second page').catch(() => {});
  check('and the preview has a page for it', (await app.count('.preview .page')) >= 2);
  await app.screenshot('scope-2-footer');

  // --- The chip on a line of Book two opens Look with Book two chosen ---
  const twoLine = `.preview .page .line`;
  const lineOfTwo = await app.exec(
    `const l = Array.from(document.querySelectorAll(arguments[0])).find((l) => l.textContent.includes('gods sat'));
     if (!l) return null;
     l.scrollIntoView({ block: 'center' });
     l.setAttribute('data-test-two', '1');
     return true;`,
    twoLine,
  );
  check('Book two has its line in the pages', lineOfTwo === true);
  await sleep(400);
  await app.click('.preview .page .line[data-test-two]');
  await app.waitFor('.preview .page .chip', 3000).catch(() => {});
  await app.click('.preview .page .chip');
  await sleep(800);
  line = await scopeLine();
  check(
    'the chip on a line of Book two opens Look with Book two chosen',
    line?.value === two && line.options.includes('Only Book two'),
    JSON.stringify(line),
  );
  await app.screenshot('scope-3-chip');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (e) {
  console.error(e);
  await app.screenshot('scope-failed').catch(() => {});
  checks.push({ name: 'the script ran through', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
