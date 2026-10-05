// The editors of document formats and reference styles.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1500, height: 940 });
try {
  await app.installErrorHook();
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.execAsync(
    `const plan = await window.__TAURI_INTERNALS__.invoke('import_bib_text', { text: arguments[0] });
     await window.__TAURI_INTERNALS__.invoke('import_apply', { plan });`,
    bib,
  );

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section');
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys('The poem begins with a word ');
  await app.keys('@');
  await app.waitFor('.picker input');
  await app.keys('nagy best');
  await sleep(250);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('73');
  await app.press('Enter');
  await app.waitGone('.editor');
  await app.keys('.');
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page', 20000);

  const menu = async (item) => {
    await app.click('.preview button[aria-label="Change the format or the style"]');
    await app.clickText('[role="menuitem"]', item);
  };

  // --- The format ---
  await menu('Change this format');
  await app.waitFor('dialog .editor nav');
  await app.waitFor('dialog .sample img', 20000);
  await app.screenshot('editors-1-format');
  await app.clickText('dialog nav button', 'Type and spacing');
  await app.exec(
    `const selects = document.querySelectorAll('dialog .form select');
     const spacing = Array.from(selects).find((s) => Array.from(s.options).some((o) => o.textContent === 'Double'));
     spacing.value = '1.5';
     spacing.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await app.clickText('dialog nav button', 'Headings');
  await sleep(300);
  await app.screenshot('editors-2-format-headings');
  // What a figure is called, and where the figures stand.
  await app.clickText('dialog nav button', 'Figures, tables, equations');
  await sleep(300);
  await app.exec(
    `const set = (el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
     const fields = Array.from(document.querySelectorAll('dialog .form input[type="text"], dialog .form input:not([type])'));
     set(fields.find((i) => i.value === 'Figure'), 'Fig.');
     const selects = Array.from(document.querySelectorAll('dialog .form select'));
     set(selects.find((s) => Array.from(s.options).some((o) => o.value === 'at-end')), 'at-end');`,
  );
  await sleep(400);
  const told = await app.text('dialog .form');
  check(
    'the format says what a figure is called, and shows it',
    /Fig\. 1/.test(told),
    told.replace(/\s+/g, ' ').slice(0, 300),
  );
  check(
    'and where the figures stand',
    /Heading over the figures/.test(told) && /about here/.test(told),
  );
  await app.screenshot('editors-2b-format-figures');
  await app.clickText('dialog nav button', 'About this format');
  await sleep(200);
  await app.screenshot('editors-3-format-about');
  await app.exec(
    `const n = document.querySelector('dialog input.name'); n.value = 'My publisher'; n.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await app.clickText('dialog footer button', 'Save as my own');
  await app.waitGone('dialog', 8000);
  await sleep(3500);
  const format = await app.exec(
    `return document.querySelector('.preview select[aria-label="Document format"]').value`,
  );
  check(
    'a changed format is saved as one’s own and taken into use',
    format === 'my-publisher',
    format,
  );
  const saved = JSON.parse(readFileSync(join(app.dataDir, 'formats', 'my-publisher.json'), 'utf8'));
  check(
    'it holds the change and remembers what it was made from',
    saved.text.lineSpacing === 1.5 && saved.basedOn === 'manuscript',
    `${saved.text.lineSpacing} ${saved.basedOn}`,
  );
  check(
    'with what was said of figures',
    saved.figures.label === 'Fig.' &&
      saved.figures.placement === 'at-end' &&
      saved.equations.beforeNumber === '(',
    JSON.stringify(saved.figures),
  );
  const work = join(app.dataDir, 'work');
  const typ = () =>
    readFileSync(
      join(
        work,
        readdirSync(work).find((n) => !n.includes('-') || n.length > 30),
        'preview',
        'document.typ',
      ),
      'utf8',
    );
  check('the preview is in the new format', /leading: 0\.8em/.test(typ()));

  // --- The style ---
  await menu('Change this reference style');
  await app.waitFor('dialog .editor .form');
  await app.waitFor('dialog .sample dd', 20000);
  await sleep(300);
  await app.screenshot('editors-4-style');
  const before = await app.exec(
    `return Array.from(document.querySelectorAll('dialog .sample .entries p')).map((p) => p.textContent.trim())`,
  );
  check(
    'the style is shown on works of the library',
    before.length >= 3 && before.some((b) => /Nagy/.test(b)),
    `${before.length} entries`,
  );

  // Bibliography: initials for given names.
  await app.clickText('dialog [role="radio"]', 'Bibliography');
  await sleep(200);
  await app.exec(
    `const selects = document.querySelectorAll('dialog .form select');
     const given = Array.from(selects).find((s) => Array.from(s.options).some((o) => o.value === 'spaced'));
     given.value = 'spaced';
     given.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(2500);
  const after = await app.exec(
    `return Array.from(document.querySelectorAll('dialog .sample .entries p')).map((p) => p.textContent.trim())`,
  );
  check(
    'a change shows in the sample at once',
    after.some((a) => /Nagy, G\./.test(a)) && !after.some((a) => /Nagy, Gregory/.test(a)),
    after.find((a) => /Nagy/.test(a)),
  );
  await app.screenshot('editors-5-style-initials');

  await app.clickText('dialog [role="radio"]', 'Part by part');
  await sleep(300);
  await app.click('dialog .tree .part:last-child');
  await sleep(200);
  await app.screenshot('editors-6-style-parts');
  check(
    'the parts of the style are shown as a tree',
    (await app.count('dialog .tree .part')) >= 2 &&
      (await app.exists('dialog .detail .detail-head')),
  );
  // The whole of what is cited: what stands before, after and between its parts is set there.
  await app.click('dialog .tree .part:first-child');
  await sleep(200);
  const said = await app.exec(
    `return Array.from(document.querySelectorAll('dialog .detail .row .what')).map((w) => w.firstChild.textContent.trim())`,
  );
  check(
    'a part shows what can be set of it',
    ['Before', 'After', 'Between'].every((w) => said.some((s) => s.startsWith(w))),
    said.join(' | '),
  );
  await app.screenshot('editors-6b-style-part');

  await app.clickText('dialog [role="radio"]', 'Source');
  await sleep(300);
  const source = await app.exec(
    `return document.querySelector('dialog .source-view textarea').value`,
  );
  check(
    'the source holds the change',
    /<bibliography[^>]*initialize="true"/.test(source),
    source.match(/<bibliography[^>]*>/)?.[0],
  );
  await app.screenshot('editors-7-style-source');
  await app.clickText('dialog [role="radio"]', 'Common changes');

  await app.exec(
    `const n = document.querySelector('dialog input.name'); n.value = 'Chicago with initials'; n.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await app.clickText('dialog footer button', 'Save as my own');
  await app.waitGone('dialog', 8000);
  await sleep(3500);
  const style = await app.exec(
    `return document.querySelector('.preview select[aria-label="Reference style"]').value`,
  );
  check(
    'a changed style is saved as one’s own and taken into use',
    style === 'chicago-with-initials',
    style,
  );
  check('the preview uses it', /Nagy, G\./.test(typ()), typ().match(/Nagy[^\n]{0,40}/)?.[0]);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('editors-failure').catch(() => {});
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
