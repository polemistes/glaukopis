// Preview and the choice of format and style, exercised through the interface.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1500, height: 920 });
try {
  await app.installErrorHook();
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.execAsync(
    `const plan = await window.__TAURI_INTERNALS__.invoke('import_bib_text', { text: arguments[0] });
     await window.__TAURI_INTERNALS__.invoke('import_apply', { plan });`,
    bib,
  );
  const tools = await app.execAsync(`return await window.__TAURI_INTERNALS__.invoke('tools_info', {});`);
  check('Pandoc and Typst are found', !!tools.pandoc && !!tools.typst, `${tools.pandoc?.version} / ${tools.typst?.version}`);
  const formats = await app.execAsync(`return await window.__TAURI_INTERNALS__.invoke('formats_list');`);
  check('the formats that come with the application are there', formats.length >= 30, `${formats.length}`);

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);

  // Write in the text view.
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section');
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys('The poem begins with a word. ');
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys('The word');
  await app.press('Enter');
  await sleep(200);
  await app.keys('It names a wrath that is more than anger ');
  await app.keys('@');
  await app.waitFor('.picker input');
  await app.keys('nagy best');
  await sleep(250);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('73');
  await app.press('Enter');
  await app.waitGone('.editor');
  await app.keys('. And it is not the only one.');
  await app.keys(['Control', 'Alt', 'f']);
  await app.waitFor('.note-panel .prose');
  await app.keys('See ');
  await app.keys('@');
  await app.waitFor('.picker input');
  await app.keys('west rise');
  await sleep(250);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('155');
  await app.press('Enter');
  await app.waitGone('.editor');
  await sleep(150);
  await app.press('Escape');
  await app.waitGone('.note-panel');
  await sleep(200);
  check('a citation can be made within a note', (await app.count('.text-view .footnote')) === 1);

  // --- The preview ---
  await app.click('header button[aria-label="Preview and export"]');
  await app.waitFor('.preview .page', 20000);
  await sleep(500);
  const pages = await app.count('.preview .page');
  check('the preview shows pages', pages >= 1, `${pages}`);
  await app.screenshot('preview-1-manuscript');

  const source = () => {
    const work = join(app.dataDir, 'work');
    const project = readdirSync(work)[0];
    return readFileSync(join(work, project, 'preview', 'document.typ'), 'utf8');
  };
  let typ = source();
  check('the citation is in the style of the map', /Nagy/.test(typ) && /73/.test(typ));
  check('the note holds its citation', /#footnote\[[^\]]*West/s.test(typ) || /West[^]*155/.test(typ));

  // --- The preview follows the text ---
  await app.click('.text-view .section:last-child .heading');
  await sleep(200);
  await app.press('ArrowDown');
  await app.keys(['Control', 'End']);
  await app.keys(' A sentence written while the preview is open.');
  await sleep(3500);
  typ = source();
  check('the preview follows what is written', /written while the preview is open/.test(typ));

  // --- Another format, which brings its reference style ---
  await app.exec(
    `const s = document.querySelector('.preview select[aria-label="Document format"]');
     s.value = 'apa-7-professional';
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(4500);
  typ = source();
  const style = await app.exec(`return document.querySelector('.preview select[aria-label="Reference style"]').value`);
  check('choosing a format takes the reference style that goes with it', style === 'apa', style);
  check('the preview is in the format chosen', /us-letter/.test(typ) && /\(Nagy, 1979, p\. 73\)/.test(typ), typ.match(/\(Nagy[^)]*\)/)?.[0]);
  await app.screenshot('preview-2-apa');

  // --- The particulars of the document ---
  await app.click('.preview button[aria-label="Title, authors, abstract"]');
  await app.waitFor('dialog .details');
  await app.type('dialog input[aria-label="Name of author 1"]', 'A. Scholar');
  await app.type('dialog textarea', 'What the wrath of Achilles is.');
  await app.screenshot('preview-3-details');
  await app.clickText('dialog footer button', 'Save');
  await app.waitGone('dialog');
  await sleep(4500);
  typ = source();
  check('author and abstract are on the first page', /A\. Scholar/.test(typ) && /What the wrath of Achilles is/.test(typ));
  await app.screenshot('preview-4-with-abstract');

  // --- Export, as the dialog would ask for it ---
  await app.clickText('.preview button', 'Export');
  await app.waitFor('dialog .kinds');
  await app.screenshot('preview-5-export');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog');

  // --- The readable copy, written when the project is put in order ---
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 5000);
  await sleep(1500);
  const projects = join(app.dataDir, 'projects');
  const id = readdirSync(projects).find((n) => !n.startsWith('.'));
  const copy = join(projects, id, 'maps', 'Wrath and the hero.md');
  check('a readable copy of the map is kept', existsSync(copy));
  if (existsSync(copy)) {
    const text = readFileSync(copy, 'utf8');
    check('it holds the text and the citations', /# The word/.test(text) && /@nagy1979/.test(text), text.slice(0, 200).replace(/\n/g, ' '));
  }

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('preview-failure').catch(() => {});
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
