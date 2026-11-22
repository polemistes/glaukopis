// What you are writing (ADR 0038, as the chooser of 2026-10-19 offers it,
// the Document type tab of Document properties since record 0064): the tab
// marks what the document is, the plain document until something else is
// chosen; the
// plain document stands first and alone, the types follow in their
// groups, and the journals, publishers and style guides are a second step,
// narrowed to what is made for the type in use and found by the
// search whatever is chosen. Under each name stands what the type brings,
// its parts, its pages and what it requires, and no words of help. Then the
// parts the type suggests, in Parts in Look, each added as an element of a
// kind of the catalogue, last under the document (record 0118); the kind
// menu that offers them; the checklist; a document made of it; a document
// type of the writer's own made from the one in use by New document type…,
// which opens Look on it; and the usual type in the settings.

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
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to, and a chapter made in it.
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.keys(['Alt', 'Shift', 'Enter']);
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The word');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.click('.diagram .node.root');
  await sleep(200);

  await app.keys(['Control', 't']);
  await app.waitFor('.preview header [data-look]', 15000);
  await app.waitFor('.preview .page', 20000);
  const header = async () => (await app.text('.preview header')).replace(/\s+/g, ' ');
  check(
    'the head of the typesetting pane says nothing of how the document is made',
    !/Plain document|Chicago|Manuscript/.test(await header()),
    await header(),
  );

  // --- The chooser, the Document type tab of Document properties ---
  await app.keys(['Control', 'Shift', 'd']);
  await app.waitForText('dialog[open] h2', 'Document properties', 5000);
  const tabs = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .window nav button')).map((b) => b.textContent.trim())`,
  );
  check('Document properties has a tab of what the document is, after its details', tabs[1] === 'Document type', tabs.join(' | '));
  await app.openChooser();
  const top = (await app.text('dialog[open] header')).replace(/\s+/g, ' ');
  check(
    'it is the chooser of what you are writing, for the element in view',
    top.includes('Document properties') &&
      top.includes('Wrath and the hero') &&
      (await app.attr('dialog[open] .chooser .templates', 'aria-label')) === 'What are you writing?',
    top,
  );
  const first = await app.exec(
    `const t = document.querySelector('dialog[open] .chooser .templates .template');
     return t ? { name: t.querySelector('.name').textContent.trim(), chosen: t.classList.contains('chosen'), alone: !!t.closest('.alone') } : null;`,
  );
  check('the plain document stands first, alone, and chosen', first?.name === 'Plain document' && first.chosen && first.alone, JSON.stringify(first));
  const groups = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .chooser .templates > h4')).map((h) => h.textContent.trim())`,
  );
  check(
    'the types follow in their groups, with no group of plain documents',
    JSON.stringify(groups) ===
      JSON.stringify(['Articles and papers', 'Books and theses', 'Fiction', 'Poetry', 'Stage and screen', 'Other']),
    groups.join(' | '),
  );
  const step = await app.exec(
    `const d = document.querySelector('dialog[open] .chooser details[data-step]');
     return d ? { open: d.open, groups: Array.from(d.querySelectorAll('h4')).map((h) => h.textContent.trim()) } : null;`,
  );
  check(
    'journals, publishers and style guides are a second step, closed',
    !!step && !step.open && ['Journals', 'Publishers', 'Style guides'].every((g) => step.groups.includes(g)),
    JSON.stringify(step),
  );
  await app.screenshot('templates-1-chooser');
  /** What stands under the name of a type: what is said of it in words, and what it brings, a line each. */
  const saidOf = (name) =>
    app.exec(
      `const e = ${app.chooserEntry(name)};
       return e ? Array.from(e.querySelectorAll('.choose .description')).map((d) => d.textContent.trim()) : null;`,
    );
  const ofPlain = await saidOf('Plain document');
  check(
    'the plain document is generic text, and lists its parts and how its pages are set',
    ofPlain?.length === 3 &&
      ofPlain[0] === 'Generic text.' &&
      ofPlain[1] === 'Title page · The text · Notes · Bibliography' &&
      /^A4 · Times New Roman 12 pt · Line spacing 2\b/.test(ofPlain[2]),
    JSON.stringify(ofPlain),
  );
  const ofNovel = await saidOf('Novel');
  check(
    'a novel is not explained: its parts and its pages are listed',
    ofNovel?.length === 2 && /^Cover · Half title · Title page · /.test(ofNovel[0]) && /^A5 · Libertinus Serif 10\.5 pt · Line spacing 1\.3$/.test(ofNovel[1]),
    JSON.stringify(ofNovel),
  );
  check(
    'the search says nothing of what to write in it, and no words of help stand in the tab',
    !(await app.exec(`return document.querySelector('dialog[open] .chooser .search input').placeholder`)) &&
      !(await app.exists('dialog[open] .chooser .hint, dialog[open] .chooser small, dialog[open] .chooser .from, dialog[open] .chooser .about')),
    await app.exec(
      `return Array.from(document.querySelectorAll('dialog[open] .chooser .hint, dialog[open] .chooser small, dialog[open] .chooser .from, dialog[open] .chooser .about')).map((e) => e.textContent.trim()).join(' | ')`,
    ),
  );

  const names = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('dialog[open] .chooser [role="radio"] .name')).map((n) => n.textContent.trim())`,
    );
  const search = 'dialog[open] .chooser input[aria-label="Search what can be written"]';
  const stepOpen = () => app.exec(`return !!document.querySelector('dialog[open] .chooser details[data-step]')?.open`);
  const clear = () =>
    app.exec(
      `const i = document.querySelector(arguments[0]); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true }));`,
      search,
    );
  await app.type(search, 'Classical Quarterly');
  await sleep(250);
  const found = await names();
  check(
    'a search finds a journal by its name, and opens the second step',
    found.includes('The Classical Quarterly') && found.length <= 3 && (await stepOpen()),
    found.join(' | '),
  );
  await app.screenshot('templates-2-search');
  await clear();
  await sleep(200);
  check('emptied, the search shows them all again', (await names()).length > 40, `${(await names()).length}`);

  await app.chooseWhat('Journal article', { close: false });
  check('chosen, the journal article is marked', (await app.whatIs()) === 'Journal article', await app.whatIs());
  const ofArticle = await saidOf('Journal article');
  check(
    'under it, what it brings: the parts of an article, and the pages',
    ofArticle?.[0] === 'Title page · Abstract · Keywords · The text · Appendix · Acknowledgements · Notes · Bibliography' &&
      /^A4 · /.test(ofArticle[1]),
    JSON.stringify(ofArticle),
  );
  check(
    'chosen, it offers no way back but the choosing of another',
    !(await app.exec(`return Array.from(document.querySelectorAll('dialog[open] .chooser .top button:not([data-new-type])')).length`)),
  );
  // The second step, narrowed to what is made for an article.
  await app.exec(`document.querySelector('dialog[open] .chooser details[data-step]').open = true;`);
  await sleep(200);
  const narrowed = await app.exec(
    `const d = document.querySelector('dialog[open] .chooser details[data-step]');
     return { hint: d.querySelector('.hint')?.textContent.trim() ?? '', names: Array.from(d.querySelectorAll('.name')).map((n) => n.textContent.trim()) };`,
  );
  check(
    'the second step offers what is made for an article: the journals, not the publishers of books',
    narrowed.names.includes('The Classical Quarterly') &&
      !narrowed.names.includes('Yale University Press (books)') &&
      narrowed.hint === '',
    `${narrowed.hint} | ${narrowed.names.length} offered`,
  );
  const ofQuarterly = await saidOf('The Classical Quarterly');
  check(
    'a journal lists what it requires too',
    ofQuarterly?.length === 3 &&
      /^A4 · Times New Roman 12 pt · Line spacing 2$/.test(ofQuarterly[1]) &&
      ofQuarterly[2] === 'Words of text 12,000 · Words of abstract 250 · Keywords 8 · Anonymous',
    JSON.stringify(ofQuarterly),
  );
  await app.type(search, 'Yale');
  await sleep(250);
  check('the search finds the publishers of books all the same', (await names()).includes('Yale University Press (books)'), (await names()).join(' | '));
  await clear();
  await sleep(200);
  await app.screenshot('templates-3-chosen');
  await app.closeChooser();

  // --- What the document contains, in Look: the parts the type suggests, each with Add ---
  await app.click('.preview header [data-look]');
  await app.openLook('Parts');
  const places = await app.exec(
    `return Array.from(document.querySelectorAll('.side .look .place')).map((p) => ({
       name: p.querySelector('.place-head strong').textContent.trim(),
       add: !!p.querySelector('[data-make]'),
       elements: p.querySelectorAll('.element').length,
     }))`,
  );
  check(
    'Parts lists what an article suggests, in its order, each with Add and none there yet',
    JSON.stringify(places.map((p) => p.name)) ===
      JSON.stringify(['Title page', 'Abstract', 'Keywords', 'Appendix', 'Acknowledgements', 'Bibliography']) &&
      places.every((p) => p.add && !p.elements),
    JSON.stringify(places),
  );
  check('nothing is turned on or off there', !(await app.exists('.side .look [data-part-switch]')));
  await app.screenshot('templates-4-parts');
  await app.addPart('Abstract');
  const filled = await app.exec(
    `return Array.from(document.querySelectorAll('.side .look .place[data-kind="abstract"] .element')).map((e) => e.textContent.trim())`,
  );
  check('added, the abstract is listed under its part', filled.length === 1 && filled[0] === 'Abstract', JSON.stringify(filled));

  // --- In the text, the abstract is the last child, with the grey label of a part ---
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
    'the abstract is made the last child, of the kind abstract',
    seen.length === 3 && seen[2].kind === 'Abstract' && /Abstract/.test(seen[2].heading) && /The word/.test(seen[1].heading),
    JSON.stringify(seen),
  );
  check('its label is the plain grey of a part', seen[2].colour === '#6b7280', seen[2].colour);
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

  // --- The checklist says the order the type has, and moves nothing ---
  await app.openAbout('Checklist');
  const said = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .remarks li')).map((l) => l.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check(
    'the checklist of a small document says only that the type has the abstract before the text',
    said.length === 1 && said[0].startsWith('The document type has these parts in this order: Abstract · The text'),
    said.join(' | '),
  );
  await app.closeAbout();

  // --- The kind menu offers the template's kinds; a second abstract is given there ---
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await sleep(400);
  // The list at the left leaves the diagram narrow beside the preview and the panel: all of it is shown first.
  await app.click('.diagram');
  await app.keys(['Control', '0']);
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
    'the second abstract is marked on its label as not printed: the one added, now after the chapter made an abstract',
    seen[1]?.kind === 'Abstract' && seen[2]?.kind === 'Abstract' && seen[2].doubled && !seen[1].doubled,
    JSON.stringify(seen),
  );

  await app.openAbout('Checklist');
  const remarks = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .remarks li')).map((l) => l.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check(
    'the checklist lists the doubled abstract, and names it',
    remarks.length === 1 && /One more element of the kind “Abstract”/.test(remarks[0]) && /Abstract$/.test(remarks[0]),
    remarks.join(' | '),
  );
  await app.screenshot('templates-8-checklist');
  await app.closeAbout();
  await app.openLook('Parts');
  check(
    'and Parts says that only the first is used',
    (await app.text('.side .look .place[data-kind="abstract"]')).includes('Only the first is used'),
  );

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
  /** Makes a Word document of an article, as the export dialog asks for one: with the template's title page, or with it turned off. */
  const makeWord = (path, titled) =>
    app
      .execAsync(
        `const invoke = window.__TAURI_INTERNALS__.invoke;
         const template = await invoke('templates_get', { id: 'article' });
         if (!arguments[1]) template.contents = template.contents.filter((item) => item.part !== 'title-page');
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
        path,
        titled,
      )
      .catch((e) => ({ error: String(e.message ?? e) }));
  const inWord = (path, part) => execFileSync('unzip', ['-p', path, part], { encoding: 'utf8' });
  const docx = join(out, 'wrath.docx');
  const made = await makeWord(docx, true);
  check('a Word document is made with the template', !made.error && existsSync(docx), JSON.stringify(made).slice(0, 300));
  if (existsSync(docx)) {
    const xml = inWord(docx, 'word/document.xml');
    check('with the abstract, printed once, before the text', xml.split('wrath of Achilles as a word').length === 2 && xml.indexOf('wrath of Achilles as a word') < xml.indexOf('more than anger'));
    check(
      'with the title page where the template puts it, before the abstract, as the preview has it',
      xml.split('w:val="Title"').length === 2 && xml.indexOf('w:val="Title"') < xml.indexOf('wrath of Achilles as a word'),
    );
    const core = inWord(docx, 'docProps/core.xml');
    check('and the title in the properties of the file', core.includes('<dc:title>Wrath and the hero</dc:title>'), core.slice(0, 300));
  }
  // The title page turned off: none in Word either, and the title in the properties all the same.
  const untitled = join(out, 'untitled.docx');
  const madeUntitled = await makeWord(untitled, false);
  if (!madeUntitled.error && existsSync(untitled)) {
    const xml = inWord(untitled, 'word/document.xml');
    const core = inWord(untitled, 'docProps/core.xml');
    check(
      'a title page turned off is off in Word too, and the title stays in the properties',
      !xml.includes('w:val="Title"') && xml.includes('wrath of Achilles as a word') && core.includes('<dc:title>Wrath and the hero</dc:title>'),
    );
  } else {
    check('a title page turned off is off in Word too, and the title stays in the properties', false, JSON.stringify(madeUntitled).slice(0, 300));
  }

  // --- A document type of one's own, made from the one in use ---
  await app.openChooser();
  await app.click('dialog[open] .chooser [data-new-type]');
  await app.waitFor('dialog[open] [data-new-name]', 5000);
  check(
    'New document type… asks a name and what to start from, the type in use first, with no words of help',
    (await app.exec(`return document.querySelector('dialog[open] [data-start-from]').value`)) === 'article' &&
      (await app.exec(`return document.querySelector('dialog[open] [data-start-from] option').textContent.trim()`)) === 'Nothing' &&
      !(await app.exists('dialog[open] .new-type .hint, dialog[open] .new-type small, dialog[open] .new-type [placeholder]')),
  );
  await app.screenshot('templates-10-new');
  await app.type('dialog[open] [data-new-name]', 'My article');
  await app.click('dialog[open] [data-create]');
  await app.waitGone('dialog[open]', 8000);
  await app.waitFor('.side .look [data-editing]', 8000).catch(() => {});
  const ownFiles = existsSync(join(app.dataDir, 'templates')) ? readdirSync(join(app.dataDir, 'templates')) : [];
  check('the type is saved among one’s own', ownFiles.length === 1 && ownFiles[0] === 'my-article.json', ownFiles.join(' '));
  const editing = await app.lookTop();
  check(
    'Document properties closes, and Look edits the type, which the document has',
    editing.what === 'My article' && editing.editing === 'Editing the document type “My article”',
    JSON.stringify(editing),
  );
  await app.screenshot('templates-11-own');
  await app.clickText('.side .look [data-editing] button', 'Done');
  await sleep(300);
  await app.openChooser();
  const listed = await app.exec(
    `const out = [];
     let group = '';
     for (const e of document.querySelectorAll('dialog[open] .chooser .templates h4, dialog[open] .chooser .templates .template')) {
       if (e.tagName === 'H4') group = e.textContent.trim();
       else out.push({ group, name: e.querySelector('.name').textContent.trim(), chosen: e.classList.contains('chosen'), edit: !!e.querySelector('[data-edit-type]') });
     }
     return out;`,
  );
  const mine = listed.find((t) => t.name === 'My article');
  check(
    'it is in the chooser under "Your own", chosen, with Edit',
    !!mine && mine.group === 'Your own' && mine.chosen && mine.edit,
    JSON.stringify(mine ?? listed.slice(0, 3)),
  );
  await app.closeChooser();
  check('and it is what the document is', (await app.whatIs()) === 'My article', await app.whatIs());

  // --- The settings offer the usual template ---
  await app.keys(['Control', ',']);
  await app.waitForText('dialog[open] header h2', 'Settings', 5000);
  await sleep(300);
  const usual = await app.exec(
    `const label = Array.from(document.querySelectorAll('dialog[open] label')).find((l) => l.textContent.trim() === 'Default document type');
     const s = label && document.getElementById(label.htmlFor);
     if (!s) return null;
     s.scrollIntoView({ block: 'center' });
     return { value: s.value, options: Array.from(s.options).map((o) => o.value),
       groups: Array.from(s.querySelectorAll('optgroup')).map((g) => g.label) };`,
  );
  check(
    'the settings offer the usual template, plain at first, with none and every template',
    !!usual && usual.value === 'plain' && usual.options[0] === '' && usual.options.includes('article') && usual.options.includes('classical-quarterly') && usual.groups.includes('Your own'),
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
