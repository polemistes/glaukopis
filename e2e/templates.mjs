// What you are writing (ADR 0038, as the chooser of 2026-10-19 offers it):
// the button over the preview names what the document is, the plain
// document until something else is chosen, and opens the chooser; the
// plain document stands first and alone, the kinds of text follow in their
// groups, and the journals, publishers and style guides are a second step,
// narrowed to what is made for the kind of text in use and found by the
// search whatever is chosen. Then the parts the template gives a place to,
// made as elements of a kind of the catalogue; the kind menu that offers
// them; the checklist; a document made of it; a template of the writer's
// own made from the one in use; and the usual template in the settings.

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
  await app.waitFor('.preview header .what', 15000);
  await app.waitFor('.preview .page', 20000);
  const header = async () => (await app.text('.preview header')).replace(/\s+/g, ' ');
  check(
    'the button over the preview names the plain document, and nothing else of how it is made',
    (await app.whatIs()) === 'Plain document' && !/Chicago|Manuscript/.test(await header()),
    await header(),
  );

  // --- The chooser, from the button over the preview ---
  await app.openChooser();
  const top = (await app.text('dialog[open] header')).replace(/\s+/g, ' ');
  check(
    'the button opens the chooser of what you are writing, for the element in view',
    top.includes('What are you writing?') && top.includes('Wrath and the hero'),
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
    'the kinds of text follow in their groups, with no group of plain documents',
    JSON.stringify(groups) ===
      JSON.stringify(['Articles and papers', 'Books and theses', 'Fiction', 'Poetry', 'Stage and screen', 'Other kinds of text']),
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
  check('chosen, the journal article is named over the preview', (await app.whatIs()) === 'Journal article', await app.whatIs());
  await app.waitFor('dialog[open] .chooser .template.chosen [data-brings]', 5000).catch(() => {});
  const brings = await app.exec(
    `return document.querySelector('dialog[open] .chooser .template.chosen [data-brings]')?.textContent.trim() ?? ''`,
  );
  check('under it, what it brings, in the words of pages', /^Pages as /.test(brings) && !/template|layout/i.test(brings), brings);
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
      /Journal article/.test(narrowed.hint),
    `${narrowed.hint} | ${narrowed.names.length} offered`,
  );
  await app.type(search, 'Yale');
  await sleep(250);
  check('the search finds the publishers of books all the same', (await names()).includes('Yale University Press (books)'), (await names()).join(' | '));
  await clear();
  await sleep(200);
  await app.screenshot('templates-3-chosen');
  await app.closeChooser();

  // --- What the document contains, in Look: the parts, the places of their own, what is required ---
  await app.click('.preview header [data-look]');
  await app.openLook('What the document contains');
  const places = await app.exec(
    `return Array.from(document.querySelectorAll('.side .look .place')).map((p) => ({
       name: p.querySelector('.place-head strong').textContent.trim(),
       make: !!p.querySelector('[data-make]'),
       none: !!p.querySelector('.none'),
     }))`,
  );
  check(
    'the places of their own are the abstract, the appendix and the acknowledgements, none filled, each with "Make one"',
    ['Abstract', 'Appendix', 'Acknowledgements'].every((n) => places.some((p) => p.name === n && p.make && p.none)),
    JSON.stringify(places),
  );
  const switches = () =>
    app.exec(
      `return Object.fromEntries(Array.from(document.querySelectorAll('.side .look [data-part-switch]')).map((i) => [i.dataset.partSwitch, { on: i.checked, fixed: i.disabled }]))`,
    );
  let parts = await switches();
  check(
    'the parts the program makes have switches: for an article the keywords on, the table of contents off, the text always there',
    parts.keywords?.on && !parts.contents?.on && parts.body?.on && parts.body?.fixed,
    JSON.stringify(parts),
  );
  await app.screenshot('templates-4-parts');
  // The table of contents turned on is the document's own change, and printed; turned off again, nothing is left.
  const contentsSwitch = `document.querySelector('.side .look [data-part-switch="contents"]')`;
  await app.click(await app.exec(`return ${contentsSwitch}`));
  await sleep(600);
  const changedHere = await app.exec(`return ${contentsSwitch}.closest('.row').nextElementSibling?.matches('.from') ? ${contentsSwitch}.closest('.row').nextElementSibling.textContent.replace(/\\s+/g, ' ').trim() : null`);
  check('a part turned on says it is changed here', (await switches()).contents?.on && /^Changed here/.test(changedHere ?? ''), changedHere);
  const preview = () => {
    const work = join(app.dataDir, 'work');
    return readFileSync(join(work, readdirSync(work)[0], 'preview', 'document.typ'), 'utf8');
  };
  let waited = Date.now();
  while (!/#outline\(/.test(preview()) && Date.now() - waited < 15000) await sleep(300);
  check('and the preview prints the table of contents', /#outline\(/.test(preview()));
  await app.click(await app.exec(`return ${contentsSwitch}`));
  await sleep(600);
  check(
    'turned off again, it is as the template has it, with nothing said',
    !(await switches()).contents?.on && !(await app.exec(`return ${contentsSwitch}.closest('.row').nextElementSibling?.matches('.from') ?? false`)),
  );
  await app.click(await app.exec(`return document.querySelector('.side .look .place[data-kind="abstract"] [data-make]')`));
  await app.waitFor('.side .look .place[data-kind="abstract"] .element', 3000);
  const filled = await app.exec(
    `return Array.from(document.querySelectorAll('.side .look .place[data-kind="abstract"] .element')).map((e) => e.textContent.trim())`,
  );
  check('made, the abstract is listed under its place', filled.length === 1 && filled[0] === 'Abstract', JSON.stringify(filled));

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
  await app.openAbout('Checklist');
  check(
    'the checklist has nothing to remark on in a small document',
    (await app.count('dialog[open] .remarks li')) === 1 && (await app.exists('dialog[open] .remarks li.clear')),
    (await app.text('dialog[open] .remarks')).replace(/\s+/g, ' '),
  );
  await app.closeAbout();

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

  await app.openAbout('Checklist');
  const remarks = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .remarks li')).map((l) => l.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check(
    'the checklist lists the doubled abstract, and names it',
    remarks.length === 1 && /One more element of the kind “Abstract”/.test(remarks[0]) && /The word/.test(remarks[0]),
    remarks.join(' | '),
  );
  await app.screenshot('templates-8-checklist');
  await app.closeAbout();
  await app.openLook('What the document contains');
  check(
    'and what the document contains says that only the first is used',
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

  // --- A template of one's own, made from the one in use ---
  await app.openChooser();
  await app.clickText('dialog[open] footer button', 'Make a template of my own from this…');
  await app.waitFor('dialog[open] .editor nav', 8000);
  await app.waitUntil(`return document.querySelector('dialog[open] input.name')?.value === 'Journal article, my own'`, 5000, 'the editor to be read');
  await app.screenshot('templates-10-editor');
  await app.clickText('dialog[open] footer button', 'Save as my own');
  await app.waitUntil(`return document.querySelectorAll('dialog[open]').length === 1`, 8000, 'the editor to go');
  await sleep(500);
  const ownFiles = existsSync(join(app.dataDir, 'templates')) ? readdirSync(join(app.dataDir, 'templates')) : [];
  check('the template is saved among one’s own', ownFiles.length === 1, ownFiles.join(' '));
  const listed = await app.exec(
    `const out = [];
     let group = '';
     for (const e of document.querySelectorAll('dialog[open] .chooser .templates h4, dialog[open] .chooser .templates .template')) {
       if (e.tagName === 'H4') group = e.textContent.trim();
       else out.push({ group, name: e.querySelector('.name').textContent.trim(), chosen: e.classList.contains('chosen') });
     }
     return out;`,
  );
  const mine = listed.find((t) => t.name === 'Journal article, my own');
  check(
    'it is in the chooser under "Your own", and chosen',
    !!mine && mine.group === 'Your own' && mine.chosen,
    JSON.stringify(mine ?? listed.slice(0, 3)),
  );
  await app.screenshot('templates-11-own');
  await app.closeChooser();
  await app
    .waitUntil(
      `return document.querySelector('.preview header .what .name')?.textContent.trim() === 'Journal article, my own'`,
      8000,
      'the button to name the template',
    )
    .catch(() => {});
  check('and named over the preview', (await app.whatIs()) === 'Journal article, my own', await app.whatIs());

  // --- The settings offer the usual template ---
  await app.keys(['Control', ',']);
  await app.waitForText('dialog[open] header h2', 'Settings', 5000);
  await sleep(300);
  const usual = await app.exec(
    `const label = Array.from(document.querySelectorAll('dialog[open] label')).find((l) => l.textContent.trim() === 'What new documents are');
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
