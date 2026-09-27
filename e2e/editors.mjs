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
  await app.clickText('dialog nav button', 'About this format');
  await sleep(200);
  await app.screenshot('editors-3-format-about');
  await app.exec(
    `const n = document.querySelector('dialog input.name'); n.value = 'My publisher'; n.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await app.clickText('dialog footer button', 'Save as my own');
  await app.waitGone('dialog', 8000);
  await sleep(3500);
  const format = await app.exec(`return document.querySelector('.preview select[aria-label="Document format"]').value`);
  check('a changed format is saved as one’s own and taken into use', format === 'my-publisher', format);
  const saved = JSON.parse(readFileSync(join(app.dataDir, 'formats', 'my-publisher.json'), 'utf8'));
  check('it holds the change and remembers what it was made from', saved.text.lineSpacing === 1.5 && saved.basedOn === 'manuscript', `${saved.text.lineSpacing} ${saved.basedOn}`);
  const work = join(app.dataDir, 'work');
  const typ = () => readFileSync(join(work, readdirSync(work).find((n) => !n.includes('-') || n.length > 30), 'preview', 'document.typ'), 'utf8');
  check('the preview is in the new format', /leading: 0\.8em/.test(typ()));

  // --- The style ---
  await menu('Change this reference style');
  await app.waitFor('dialog .editor .form');
  await app.waitFor('dialog .sample dd', 20000);
  await sleep(300);
  await app.screenshot('editors-4-style');
  const before = await app.exec(`return Array.from(document.querySelectorAll('dialog .sample .entries p')).map((p) => p.textContent.trim())`);
  check('the style is shown on works of the library', before.length >= 3 && before.some((b) => /Nagy/.test(b)), `${before.length} entries`);

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
  const after = await app.exec(`return Array.from(document.querySelectorAll('dialog .sample .entries p')).map((p) => p.textContent.trim())`);
  check('a change shows in the sample at once', after.some((a) => /Nagy, G\./.test(a)) && !after.some((a) => /Nagy, Gregory/.test(a)), after.find((a) => /Nagy/.test(a)));
  await app.screenshot('editors-5-style-initials');

  await app.clickText('dialog [role="radio"]', 'Part by part');
  await sleep(300);
  await app.click('dialog .tree .part:last-child');
  await sleep(200);
  await app.screenshot('editors-6-style-parts');
  check('the parts of the style are shown as a tree', (await app.count('dialog .tree .part')) >= 2 && (await app.exists('dialog .detail .detail-head')));

  await app.clickText('dialog [role="radio"]', 'Source');
  await sleep(300);
  const source = await app.exec(`return document.querySelector('dialog .source-view textarea').value`);
  check('the source holds the change', /<bibliography[^>]*initialize="true"/.test(source), source.match(/<bibliography[^>]*>/)?.[0]);
  await app.screenshot('editors-7-style-source');
  await app.clickText('dialog [role="radio"]', 'Common changes');

  await app.exec(
    `const n = document.querySelector('dialog input.name'); n.value = 'Chicago with initials'; n.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await app.clickText('dialog footer button', 'Save as my own');
  await app.waitGone('dialog', 8000);
  await sleep(3500);
  const style = await app.exec(`return document.querySelector('.preview select[aria-label="Reference style"]').value`);
  check('a changed style is saved as one’s own and taken into use', style === 'chicago-with-initials', style);
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
