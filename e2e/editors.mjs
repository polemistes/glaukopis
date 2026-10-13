// The look of a document changed and kept as a layout of one's own, and the
// editor of reference styles, opened from the look.

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

  /** The template, the layout and the style in use, as the bar over the preview names them. */
  const inUse = () => app.exec(`return document.querySelector('.preview .in-use .names')?.textContent.trim() ?? ''`);
  // The look of the document opens from the bar over the preview, and the editor of the style from it.
  await app.click('.preview button.in-use');
  await app.waitFor('.side .look .chips', 15000);
  await sleep(300);
  /** Whether the editor of the style has gone. */
  const editorGone = () =>
    app.waitUntil(`return !document.querySelector('dialog[open]')`, 8000, 'the editor to go');

  // --- The layout, changed in Look and kept as one's own ---
  await app.screenshot('editors-1-format');
  await app.lookSection('Type');
  await app.lookChoose('Line spacing', '1.5');
  await app.lookSection('Headings');
  await sleep(300);
  await app.screenshot('editors-2-format-headings');
  // What a figure is called, and where the figures stand.
  await app.lookSection('Figures and tables');
  await sleep(300);
  await app.exec(
    `const set = (el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
     const fields = Array.from(document.querySelectorAll('.side .look .part input[type="text"], .side .look .part input:not([type])'));
     set(fields.find((i) => i.value === 'Figure'), 'Fig.');
     const selects = Array.from(document.querySelectorAll('.side .look .part select'));
     set(selects.find((s) => Array.from(s.options).some((o) => o.value === 'at-end')), 'at-end');`,
  );
  await sleep(600);
  const told = await app.exec(`return document.querySelector('.side .look .part').textContent`);
  check(
    'the layout says what a figure is called, and shows it',
    /Fig\. 1/.test(told),
    told.replace(/\s+/g, ' ').slice(0, 300),
  );
  check(
    'and where the figures stand',
    /Heading over the figures/.test(told) && /about here/.test(told),
  );
  await app.screenshot('editors-2b-format-figures');
  await app.lookSection('About the layout');
  await sleep(200);
  await app.screenshot('editors-3-format-about');
  await app.clickText('.side .look footer button', 'Keep these changes as a layout of my own');
  await app.waitFor('.side .look footer input.kept-name', 3000);
  await app.exec(
    `const n = document.querySelector('.side .look footer input.kept-name'); n.value = 'My publisher'; n.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await app.clickText('.side .look footer button', 'Keep');
  await app
    .waitUntil(`return /My publisher · no changes/.test(document.querySelector('.side .look .map')?.textContent ?? '')`, 8000, 'the layout kept')
    .catch(() => {});
  await sleep(3500);
  const format = await app.lookChosen('Layout');
  check(
    'a changed layout is saved as one’s own and taken into use',
    format === 'my-publisher' && (await inUse()).includes('My publisher'),
    `${format}: ${await inUse()}`,
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
  check('the preview is in the new layout', /leading: 0\.8em/.test(typ()));

  // --- The style ---
  await app.clickText('.side .look button', 'Change this reference style…');
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
    `const selects = document.querySelectorAll('dialog .editor .form select');
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
  await editorGone();
  await sleep(3500);
  const style = await app.lookChosen('Reference style');
  check(
    'a changed style is saved as one’s own and taken into use',
    style === 'chicago-with-initials' && (await inUse()).includes('Chicago with initials'),
    `${style}: ${await inUse()}`,
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
