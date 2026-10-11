// Templates (ADR 0038): the document settings of an element, opened by its
// key; a template chosen from its groups, found by a search, and named over
// the preview; the parts it gives a place to, made from the window as
// elements of a kind of the catalogue; the kind menu that offers them; the
// checklist; a document made of it; the template editor, which saves a
// template of the writer's own; and the usual template in the settings.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const out = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-out-'));
const app = await App.launch({ width: 1500, height: 920 });
try {
  await app.installErrorHook();
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to, and a chapter made in it.
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The word');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.click('.diagram .node.root');
  await sleep(200);

  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .in-use', 15000);
  await app.waitFor('.preview .page', 20000);
  /** The template, the layout and the style in use, as the bar over the preview names them. */
  const inUse = () => app.exec(`return document.querySelector('.preview .in-use .names')?.textContent.trim() ?? ''`);
  check('the bar over the preview names the usual template first', /^Plain document · /.test(await inUse()), await inUse());

  // --- The window, by its key, at the element in view ---
  await app.openDocumentSettings();
  check(
    'Ctrl+Shift+D opens the document settings of the element in view, at its template',
    (await app.text('dialog[open] header')).includes('Wrath and the hero') &&
      (await app.exists('dialog[open] .window .templates')),
    (await app.text('dialog[open] header')).replace(/\s+/g, ' '),
  );
  const groups = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .templates h4')).map((h) => h.textContent.trim())`,
  );
  check(
    'the templates are offered in groups',
    ['Plain', 'Articles and papers', 'Books and theses', 'Fiction', 'Journals', 'Publishers', 'Style guides'].every((g) =>
      groups.includes(g),
    ),
    groups.join(' | '),
  );
  await app.screenshot('templates-1-chooser');

  const names = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('dialog[open] .templates [role="radio"] .name')).map((n) => n.textContent.trim())`,
    );
  await app.type('dialog[open] input[aria-label="Search the templates"]', 'Classical Quarterly');
  await sleep(250);
  const found = await names();
  check(
    'a search finds a journal by its name',
    found.includes('The Classical Quarterly') && found.length <= 3,
    found.join(' | '),
  );
  await app.screenshot('templates-2-search');
  await app.exec(
    `const i = document.querySelector('dialog[open] input[aria-label="Search the templates"]');
     i.value = '';
     i.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await sleep(200);
  check('emptied, the search shows them all again', (await names()).length > 40, `${(await names()).length}`);

  await app.exec(
    `const b = Array.from(document.querySelectorAll('dialog[open] .templates [role="radio"]'))
       .find((r) => r.querySelector('.name').textContent.trim() === 'Journal article');
     b.scrollIntoView({ block: 'center' });`,
  );
  await app.click(
    await app.exec(
      `return Array.from(document.querySelectorAll('dialog[open] .templates [role="radio"]'))
         .find((r) => r.querySelector('.name').textContent.trim() === 'Journal article')`,
    ),
  );
  await app.waitUntil(
    `return document.querySelector('dialog[open] .templates [role="radio"][aria-checked="true"] .name')?.textContent.trim() === 'Journal article'`,
    4000,
    'the template to be chosen',
  );
  await app.waitUntil(
    `return /^Journal article · /.test(document.querySelector('.preview .in-use .names')?.textContent.trim() ?? '')`,
    8000,
    'the bar to name the template',
  );
  check('chosen, the template is named over the preview', /^Journal article · /.test(await inUse()), await inUse());
  await app.screenshot('templates-3-chosen');

  // --- The parts it gives a place to ---
  await app.documentSection('Parts');
  const parts = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .part')).map((p) => ({
       name: p.querySelector('.part-head strong').textContent.trim(),
       make: Array.from(p.querySelectorAll('.part-head button')).some((b) => b.textContent.trim() === 'Make one'),
       none: !!p.querySelector('.none'),
     }))`,
  );
  check(
    'the parts are the abstract, the appendix and the acknowledgements, none made, each with "Make one"',
    ['Abstract', 'Appendix', 'Acknowledgements'].every((n) => parts.some((p) => p.name === n && p.make && p.none)),
    JSON.stringify(parts),
  );
  await app.screenshot('templates-4-parts');
  await app.click(
    await app.exec(
      `const p = Array.from(document.querySelectorAll('dialog[open] .part')).find((p) => p.querySelector('.part-head strong').textContent.trim() === 'Abstract');
       return Array.from(p.querySelectorAll('.part-head button')).find((b) => b.textContent.trim() === 'Make one');`,
    ),
  );
  await app.waitFor('dialog[open] .part .element', 3000);
  const filled = await app.exec(
    `const p = Array.from(document.querySelectorAll('dialog[open] .part')).find((p) => p.querySelector('.part-head strong').textContent.trim() === 'Abstract');
     return Array.from(p.querySelectorAll('.element')).map((e) => e.textContent.trim());`,
  );
  check('made, the abstract is listed under its part', filled.length === 1 && filled[0] === 'Abstract', JSON.stringify(filled));
  await app.closeDocumentSettings();

  // --- In the text, the abstract is the first child, with the grey label of a part ---
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(500);
  const sections = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => ({
         heading: s.querySelector('.heading')?.textContent.replace(/\\s+/g, ' ').trim() ?? '',
         kind: s.querySelector('.heading > .tag.kind')?.textContent.trim() ?? null,
         colour: s.querySelector('.heading > .tag.kind') ? getComputedStyle(s.querySelector('.heading > .tag.kind')).getPropertyValue('--kind').trim() : null,
         doubled: !!s.querySelector('.heading > .tag.kind .doubled'),
       }))`,
    );
  let seen = await sections();
  check(
    'the abstract is made the first child, of the kind abstract',
    seen.length === 3 && seen[1].kind === 'Abstract' && /Abstract/.test(seen[1].heading) && /The word/.test(seen[2].heading),
    JSON.stringify(seen),
  );
  check('its label is the plain grey of a part', seen[1].colour === '#6b7280', seen[1].colour);
  await app.click(
    await app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).find((s) => s.querySelector('.heading > .tag.kind')?.textContent.trim() === 'Abstract').querySelector('.body')`,
    ),
  );
  await sleep(300);
  await app.keys('This study reads the wrath of Achilles as a word of the gods.');
  await app.screenshot('templates-5-abstract-in-text');

  // --- The preview has the abstract on its first page ---
  const firstPage = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.preview .page[data-page="1"] .texts span')).map((s) => s.textContent).join(' ').replace(/\\s+/g, ' ')`,
    );
  const start = Date.now();
  while (!/wrath of Achilles as a word/.test(await firstPage()) && Date.now() - start < 15000) await sleep(300);
  const page = await firstPage();
  check(
    'the preview shows the abstract on the first page',
    /wrath of Achilles as a word of the gods/.test(page),
    page.slice(0, 200),
  );
  const work = join(app.dataDir, 'work');
  const typ = readFileSync(join(work, readdirSync(work)[0], 'preview', 'document.typ'), 'utf8');
  check(
    'set as the abstract, not as a chapter',
    /wrath of Achilles as a word of the gods/.test(typ) && !/^=+ Abstract/m.test(typ),
    typ.match(/.{0,120}wrath of Achilles as a word.{0,40}/s)?.[0]?.replace(/\s+/g, ' '),
  );
  await app.screenshot('templates-6-preview-abstract');

  // --- The checklist of a small document is empty ---
  await app.openDocumentSettings('Checklist');
  check(
    'the checklist has nothing to remark on in a small document',
    (await app.count('dialog[open] .remarks li')) === 1 && (await app.exists('dialog[open] .remarks li.clear')),
    (await app.text('dialog[open] .remarks')).replace(/\s+/g, ' '),
  );
  await app.closeDocumentSettings();

  // --- The kind menu offers the template's kinds; a second abstract is given there ---
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await sleep(400);
  await app.rightClick(await app.findByText('.diagram .node', 'The word'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Kind');
  await sleep(250);
  const offered = await app.exec(
    `const menus = document.querySelectorAll('.menu');
     return Array.from(menus[menus.length - 1].querySelectorAll('[role="menuitem"]')).map((i) => i.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check(
    "the kind menu offers the template's kinds, and the catalogue under More…",
    ['Abstract', 'Appendix', 'Acknowledgements', 'More…'].every((k) => offered.some((o) => o.startsWith(k))) &&
      offered.findIndex((o) => o.startsWith('Abstract')) < offered.findIndex((o) => o.startsWith('More…')),
    offered.join(' | '),
  );
  await app.screenshot('templates-7-kind-menu');
  await app.click(
    await app.exec(
      `const menus = document.querySelectorAll('.menu');
       return Array.from(menus[menus.length - 1].querySelectorAll('[role="menuitem"]')).find((i) => i.textContent.trim().startsWith('Abstract'))`,
    ),
  );
  await sleep(400);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(500);
  seen = await sections();
  check(
    'the second abstract is marked on its label as not printed',
    seen[2]?.kind === 'Abstract' && seen[2].doubled && !seen[1].doubled,
    JSON.stringify(seen),
  );

  await app.openDocumentSettings('Checklist');
  const remarks = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .remarks li')).map((l) => l.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check(
    'the checklist lists the doubled abstract, and names it',
    remarks.length === 1 && /One more element of the kind “Abstract”/.test(remarks[0]) && /The word/.test(remarks[0]),
    remarks.join(' | '),
  );
  await app.screenshot('templates-8-checklist');
  await app.documentSection('Parts');
  check(
    'and the parts say that only the first is used',
    (await app.text('dialog[open] .part')).includes('Only the first is used'),
  );
  await app.closeDocumentSettings();

  // --- A document is made of it: Word ---
  // The dialog of the system, which asks where, cannot be driven, nor
  // answered in the page: the making is asked for as the export dialog asks
  // for it, with the template whole and the abstract as a part.
  await app.clickText('.preview header button', 'Export');
  await app.waitFor('dialog[open] .kinds', 5000);
  const kinds = await app.exec(`return Array.from(document.querySelectorAll('dialog[open] .kinds input')).map((i) => i.value)`);
  check(
    'the export offers the kinds of file the template makes, Word chosen first',
    ['pdf', 'docx', 'odt', 'epub'].every((k) => kinds.includes(k)) &&
      (await app.exec(`return document.querySelector('dialog[open] .kinds input:checked')?.value`)) === 'docx',
    kinds.join(' '),
  );
  await app.clickText('dialog[open] footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);
  const docx = join(out, 'wrath.docx');
  const made = await app.execAsync(
    `const invoke = window.__TAURI_INTERNALS__.invoke;
     const template = await invoke('templates_get', { id: 'article' });
     const format = await invoke('formats_get', { id: 'manuscript' });
     const t = (text) => ({ kind: 'text', text, marks: {} });
     const paragraph = (text) => ({ kind: 'paragraph', content: [t(text)] });
     const document = {
       title: [t('Wrath and the hero')], authors: [], keywords: [], references: [],
       parts: [{ kind: 'abstract', element: null, title: [t('Abstract')],
         sections: [{ level: 0, heading: null, element: null, blocks: [paragraph('This study reads the wrath of Achilles as a word of the gods.')] }] }],
       sections: [{ level: 1, heading: [t('The word')], element: null, blocks: [paragraph('It names a wrath that is more than anger.')] }],
     };
     const request = { document, style: 'chicago-author-date', format, template, output: 'document', key: 'templates' };
     return await invoke('document_export', { request, target: 'docx', path: arguments[0], options: {} });`,
    docx,
  ).catch((e) => ({ error: String(e.message ?? e) }));
  check('a Word document is made with the template', !made.error && existsSync(docx), JSON.stringify(made).slice(0, 300));
  if (existsSync(docx)) {
    const xml = execFileSync('unzip', ['-p', docx, 'word/document.xml'], { encoding: 'utf8' });
    check('with the abstract, printed once, before the text', xml.split('wrath of Achilles as a word').length === 2 && xml.indexOf('wrath of Achilles as a word') < xml.indexOf('more than anger'));
  }

  // --- The template editor makes a template of one's own ---
  await app.openDocumentSettings();
  await app.waitFor('dialog[open] .template.chosen .about', 5000);
  await app.clickText('dialog[open] .template.chosen .about button', 'Change this template…');
  await app.waitFor('dialog[open] .editor nav', 8000);
  await app.waitUntil(`return document.querySelector('dialog[open] input.name')?.value === 'Journal article, changed'`, 5000, 'the editor to be read');
  await app.screenshot('templates-10-editor');
  await app.clickText('dialog[open] footer button', 'Save as my own');
  await app.waitUntil(`return document.querySelectorAll('dialog[open]').length === 1`, 8000, 'the editor to go');
  await sleep(500);
  const ownFiles = existsSync(join(app.dataDir, 'templates')) ? readdirSync(join(app.dataDir, 'templates')) : [];
  check('the template is saved among one’s own', ownFiles.length === 1, ownFiles.join(' '));
  const listed = await app.exec(
    `const out = [];
     let group = '';
     for (const e of document.querySelectorAll('dialog[open] .templates h4, dialog[open] .templates .template')) {
       if (e.tagName === 'H4') group = e.textContent.trim();
       else out.push({ group, name: e.querySelector('.name').textContent.trim(), chosen: e.classList.contains('chosen') });
     }
     return out;`,
  );
  const mine = listed.find((t) => t.name === 'Journal article, changed');
  check(
    'it is in the chooser under "Your own", and chosen',
    !!mine && mine.group === 'Your own' && mine.chosen,
    JSON.stringify(mine ?? listed.slice(0, 3)),
  );
  await app.screenshot('templates-11-own');
  await app.closeDocumentSettings();
  await app.waitUntil(
    `return /^Journal article, changed · /.test(document.querySelector('.preview .in-use .names')?.textContent.trim() ?? '')`,
    8000,
    'the bar to name the template',
  ).catch(() => {});
  check('and named over the preview', /^Journal article, changed · /.test(await inUse()), await inUse());

  // --- The settings offer the usual template ---
  await app.keys(['Control', ',']);
  await app.waitForText('dialog[open] header h2', 'Settings', 5000);
  await sleep(300);
  const usual = await app.exec(
    `const label = Array.from(document.querySelectorAll('dialog[open] label')).find((l) => l.textContent.trim() === 'Template');
     const s = label && document.getElementById(label.htmlFor);
     if (!s) return null;
     s.scrollIntoView({ block: 'center' });
     return { value: s.value, options: Array.from(s.options).map((o) => o.value),
       groups: Array.from(s.querySelectorAll('optgroup')).map((g) => g.label) };`,
  );
  check(
    'the settings offer the usual template, plain at first, with every template',
    !!usual && usual.value === 'plain' && usual.options.includes('article') && usual.options.includes('classical-quarterly') && usual.groups.includes('Your own'),
    JSON.stringify(usual && { value: usual.value, options: usual.options.length, groups: usual.groups }),
  );
  await app.screenshot('templates-12-settings');
  await app.press('Escape');
  await app.waitGone('dialog[open]', 3000);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('templates-failure').catch(() => {});
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
  rmSync(out, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
