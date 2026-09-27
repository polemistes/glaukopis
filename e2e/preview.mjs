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

  // --- What there is to remark can be read in full ---
  // A format of the user's own, which asks for a font that no computer has.
  const own = await app.execAsync(
    `const invoke = window.__TAURI_INTERNALS__.invoke;
     const format = await invoke('formats_get', { id: 'manuscript' });
     format.id = '';
     format.name = 'With a font that is not there';
     format.font.family = 'Porson of the Clarendon Press, 1806';
     const saved = await invoke('formats_save', { format });
     const map = JSON.parse(JSON.stringify(saved));
     return map.id;`,
  );
  await app.click('header button[aria-label="Preview and export"]');
  await sleep(300);
  await app.click('header button[aria-label="Preview and export"]');
  await app.waitFor('.preview select[aria-label="Document format"]', 8000);
  await sleep(500);
  await app.exec(
    `const s = document.querySelector('.preview select[aria-label="Document format"]');
     if (!Array.from(s.options).some((o) => o.value === arguments[0])) {
       const o = document.createElement('option'); o.value = arguments[0]; o.textContent = 'x'; s.append(o);
     }
     s.value = arguments[0];
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
    own,
  );
  await app.waitFor('.preview footer .issues', 15000);
  {
    await app.click('.preview footer .issues');
    await app.waitFor('.remarks', 3000);
    await sleep(250);
    const fits = await app.exec(
      `const r = document.querySelector('.remarks');
       const box = r.getBoundingClientRect();
       return Array.from(r.querySelectorAll('p')).every((p) => {
         const b = p.getBoundingClientRect();
         return p.scrollWidth <= p.clientWidth + 1 && b.left >= box.left && b.right <= box.right + 1;
       }) && box.right <= innerWidth && box.left >= 0;`,
    );
    const said = (await app.text('.remarks')).replace(/\s+/g, ' ');
    check('the remarks are shown whole', fits && /Porson of the Clarendon Press, 1806 is not installed/.test(said) && /has it\.$/.test(said.trim()), said.slice(0, 120));
    await app.screenshot('preview-5b-remarks');
    await app.press('Escape');
    await app.waitGone('.remarks');
  }

  // --- The preview rests when nothing changes ---
  await sleep(3000);
  const watch = (ms) =>
    app.execAsync(
      `const drawn = [];
       const pages = document.querySelector('.preview .pages');
       const observer = new MutationObserver((records) => {
         for (const r of records) {
           if (r.type === 'attributes') drawn.push(Array.from(pages.querySelectorAll('img')).indexOf(r.target) + 1);
           else for (const n of r.addedNodes) if (n.tagName === 'IMG') drawn.push(Array.from(pages.querySelectorAll('img')).indexOf(n) + 1);
         }
       });
       observer.observe(pages, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
       await new Promise((r) => setTimeout(r, arguments[0]));
       observer.disconnect();
       return drawn;`,
      ms,
    );
  let drawn = await watch(5000);
  check('nothing is drawn again while nothing changes', drawn.length === 0, JSON.stringify(drawn));

  // What changes nothing in the document: folding a branch in the diagram.
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node');
  await sleep(1500);
  const folding = watch(4000);
  await sleep(300);
  await app.exec(`document.querySelector('.diagram .node .fold')?.click()`);
  drawn = await folding;
  check('nor when the map changes and the document does not', drawn.length === 0, JSON.stringify(drawn));

  // Pages enough that a change on the last leaves the first as it is.
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section');
  await sleep(500);
  await app.click('.text-view .section:last-child .heading');
  await sleep(200);
  await app.press('ArrowDown');
  await app.keys(['Control', 'End']);
  for (let i = 0; i < 9; i++) {
    await app.press('Enter');
    await app.exec(
      `const v = document.querySelector('.text-view .ProseMirror-focused');
       document.execCommand('insertText', false, arguments[0]);`,
      'The wrath is sung, and the song is of what the wrath brought about among the Achaeans, whose dead were many. '.repeat(9),
    );
  }
  await sleep(4000);
  const many = await app.count('.preview .page');
  const writing = watch(4500);
  await sleep(300);
  await app.keys(' And so it ends.');
  drawn = await writing;
  check(
    'when the text changes on one page, only that page is drawn again',
    many >= 3 && new Set(drawn).size === 1 && drawn[0] > 1,
    `${many} pages, drawn again: ${JSON.stringify(drawn)}`,
  );
  await app.screenshot('preview-6-many-pages');

  // --- No copies are written beside the project ---
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 5000);
  await sleep(1500);
  const projects = join(app.dataDir, 'projects');
  const id = readdirSync(projects).find((n) => !n.startsWith('.'));
  check('the project is kept, and no copies of it beside it', existsSync(join(projects, id, 'state.bin')) && !existsSync(join(projects, id, 'maps')));

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
