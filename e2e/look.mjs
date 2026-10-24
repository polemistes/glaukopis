// The look of a document, in one place (ADR 0042). The Look button in the
// head of the typesetting pane opens Look as a column beside the pages
// (record 0064): what the document is, with a plain button that opens it in
// Document properties, and the layout in a line stand at its top. A setting is found by its
// words; the font changed there is the document's change, said under its
// row and in the line at the top, and is in the Typst of the preview; the
// layout's is taken again from the row. The foot of the kind menu opens
// Look at the kind the cursor is in; a change there is kept as a layout of
// the writer's own, which the document then uses with no changes. A change
// made on the project is said in an element under it as made there. The
// document settings send to Look, and the palette changes the font.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
/** The line under a row of the look that says where its value comes from; nothing where none. */
const fromOf = (label) =>
  app.exec(
    `const row = ${app.lookRow(label)};
     const next = row?.nextElementSibling;
     return next?.classList.contains('from') ? next.textContent.replace(/\\s+/g, ' ').trim() : null;`,
  );

try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Odyssey');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
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

  // --- Look, from its button in the head of the typesetting pane, in the order of the page ---
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page', 30000);
  await sleep(800);
  await app.click('.preview header [data-look]');
  await app.waitFor('.side .look .chips', 15000);
  await sleep(500);
  let top = await app.lookTop();
  check(
    'Look opens from its button in the head of the typesetting pane, with what the document is at its top and the layout in a line',
    top.what === 'Plain document' && top.layout === 'Layout: Manuscript' && top.changes === 0,
    JSON.stringify(top),
  );
  check(
    'it is a column of the typesetting pane, beside the pages, and its button is lit',
    (await app.exists('.side.typesetting .look-column .look')) &&
      (await app.exists('.side.typesetting .pages-part .preview')) &&
      (await app.attr('.preview header [data-look]', 'aria-pressed')) === 'true',
  );
  await app.documentPane('references');
  const tabs = await app.exec(`return Array.from(document.querySelectorAll('[data-document-pane] .side-tabs [data-kind]')).map((b) => b.dataset.kind)`);
  check(
    'the document pane beside it has no tab of Look: its tabs are the references, the images, the comments, the loose citations, the history and the changes',
    JSON.stringify(tabs) === JSON.stringify(['references', 'images', 'comments', 'found', 'history', 'changes']),
    tabs.join(' '),
  );
  await app.keys(['Control', 'Shift', 'r']);
  await app.waitGone('[data-document-pane]', 3000).catch(() => {});
  check(
    'what the document is has a plain button, Document type…, that does not look like a choice to drop down',
    (await app.text('.side .look .whole [data-document-type]')).trim() === 'Document type…' &&
      !(await app.exists('.side .look .whole [data-document-type] svg')) &&
      !(await app.exists('.side .look .whole .what')),
  );
  await app.click('.side .look .whole [data-document-type]');
  await app.waitForText('dialog[open] h2', 'Document properties', 5000);
  await app.waitFor('dialog[open] .chooser .template.chosen', 5000).catch(() => {});
  check(
    'which opens Document properties at the Document type tab, the type in use marked',
    (await app.text('dialog[open] .window nav button.current')).trim() === 'Document type' &&
      (await app.text('dialog[open] .chooser .template.chosen .name')).trim() === 'Plain document',
  );
  await app.closeChooser();
  await app.keys(['Control', 'Shift', 'a']);
  await app.waitGone('.side .look', 3000).catch(() => {});
  check(
    'Ctrl+Shift+A closes the Look column and leaves the pages',
    !(await app.exists('.side .look')) && (await app.exists('.side.typesetting .preview')),
  );
  await app.openLook();
  const order = await app.exec(
    `const through = document.querySelector('.side .look .through');
     return Array.from(through.children).map((e) => e.dataset.part ?? (e.matches('.whole') ? 'whole' : e.matches('.search') ? 'search' : e.matches('.first') ? 'first' : e.matches('.chips') ? 'chips' : e.tagName.toLowerCase()));`,
  );
  check(
    'then the search, the first rows, the chips, and the parts from the page inwards, with what the document contains and the layout last',
    JSON.stringify(order.filter((o) => o !== 'p')) ===
      JSON.stringify(['whole', 'search', 'first', 'chips', 'page', 'type', 'paragraphs', 'headings', 'numbers', 'notes', 'figures', 'front', 'contents', 'layout']),
    order.join(' '),
  );
  const first = await app.exec(
    `return Array.from(document.querySelectorAll('.side .look .first .row .what')).map((w) => w.firstChild.textContent.trim())`,
  );
  check(
    'the first rows are the font, its size, the line spacing, the page, its numbers and the numbers of headings, and no reference style in a document that cites nothing',
    JSON.stringify(first) ===
      JSON.stringify(['Font', 'Type size', 'Line spacing', 'Page size', 'Pages are numbered', 'Headings are numbered']),
    first.join(' | '),
  );
  check(
    'the layout and the reference style are chosen in Look, the style under the notes',
    (await app.lookChosen('Choose a layout')) === '' &&
      (await app.lookChosen('Reference style')) === '' &&
      (await app.exists('.side .look .part[data-part="notes"] [data-style-row]')) &&
      (await app.exists('.side .look .part[data-part="layout"] select')),
  );
  await app.screenshot('look-1-panel');

  // --- A setting found by its words, changed, and said so ---
  await app.type('.side .look .search input', 'font');
  await sleep(300);
  const found = await app.exec(
    `return Array.from(document.querySelectorAll('.side .look .finds .row .what')).map((w) => w.firstChild.textContent.trim())`,
  );
  check('the search finds the font by its words', found.includes('Font') && found.length <= 3, found.join(' | '));
  await app.lookChoose('Font', 'Gentium Plus');
  await sleep(800);
  check('the font changed says it is changed here', /^Changed here · take Manuscript’s again$/.test((await fromOf('Font')) ?? ''), await fromOf('Font'));
  top = await app.lookTop();
  check('and the line of the layout counts the change', top.layout === 'Layout: Manuscript · 1 change' && top.changes === 1, top.layout);
  check('the preview is made in that font', await typstHas(/Gentium Plus/));
  await app.screenshot('look-2-from');
  await app.exec(
    `const row = ${app.lookRow('Font')};
     row.nextElementSibling.querySelector('button.again').click();`,
  );
  await sleep(800);
  top = await app.lookTop();
  check(
    'taking the layout’s again leaves no change, and the font is the layout’s',
    top.changes === 0 && (await fromOf('Font')) === null && (await typstHas(/Gentium Plus/, false)),
    top.layout,
  );

  // --- The foot of the kind menu opens Look at the kind ---
  await app.click(await app.exec(`return document.querySelectorAll(arguments[0] + ' .prose > p')[1]`, book));
  await sleep(300);
  await app.click('.pane-bar [data-paragraph-kind]');
  await app.clickText('[role="menuitem"]', 'How “Quotation” looks…');
  await sleep(800);
  const quote = await app.exec(
    `const d = document.querySelector('.side .look details[data-kind="quote"]');
     const f = document.querySelector('.side .look .through');
     return { open: !!d?.open, part: d?.closest('.part')?.dataset.part,
              chip: document.querySelector('.side .look .chips button.current')?.dataset.section,
              near: d ? Math.round(d.getBoundingClientRect().top - f.getBoundingClientRect().top) : null };`,
  );
  check(
    'the foot of the kind menu opens Look at the look of the kind, under the paragraphs, brought into view',
    quote.open && quote.part === 'paragraphs' && quote.chip === 'paragraphs' && quote.near !== null && quote.near < 120,
    JSON.stringify(quote),
  );
  check(
    'the kinds this document uses come first',
    (await app.exec(`return Array.from(document.querySelectorAll('.side .look .part details[data-kind]')).slice(0, 2).map((d) => d.dataset.kind).sort().join(' ')`)) === 'quote text',
  );
  await app.exec(
    `const d = document.querySelector('.side .look details[data-kind="quote"]');
     const row = Array.from(d.querySelectorAll('.row')).find((r) => r.querySelector('.what').firstChild.textContent.trim() === 'Italic');
     const s = row.querySelector('select');
     s.value = 'yes';
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(800);
  check(
    'a change of a kind is said in its look',
    await app.exec(`return document.querySelector('.side .look details[data-kind="quote"]').hasAttribute('data-changed') && /Changed here/.test(document.querySelector('.side .look details[data-kind="quote"] .from')?.textContent ?? '')`),
  );
  top = await app.lookTop();
  check('and counted in the line of the layout', top.changes === 1, top.layout);
  check(
    'and the preview sets the quotation so',
    await typstHas(/#show quote\.where\(block: true\): it => \{\s*set text\([^)]*style: "italic"/),
  );
  // A kind's box stays open as it is changed, until it is closed: the
  // quotation, opened from the menu; text, which the document uses, and an
  // epigraph, which it does not, opened by their lines.
  const stillOpen = async (kind, row, value) => {
    const box = `.side .look .part details[data-kind="${kind}"]`;
    if (!(await app.exec(`return !!document.querySelector(arguments[0])?.open`, box))) {
      await app.exec(`document.querySelector(arguments[0] + ' > summary').scrollIntoView({ block: 'center' })`, box);
      await sleep(200);
      await app.click(`${box} > summary`);
      await sleep(300);
    }
    await app.exec(
      `const d = document.querySelector(arguments[0]);
       const r = Array.from(d.querySelectorAll('.row')).find((r) => r.querySelector('.what').firstChild.textContent.trim() === arguments[1]);
       const s = r.querySelector('select');
       s.value = arguments[2];
       s.dispatchEvent(new Event('change', { bubbles: true }));`,
      box,
      row,
      value,
    );
    // The kinds in use are gathered a second after a change, and the looks resolved anew.
    await sleep(1600);
    return app.exec(`return !!document.querySelector(arguments[0])?.open`, box);
  };
  check('the box of the quotation stays open as it is changed', await stillOpen('quote', 'Bold', 'yes'));
  check('the box of text, which the document uses, stays open as it is changed', await stillOpen('text', 'Bold', 'yes'));
  check('and again at a second change', await stillOpen('text', 'Bold', 'no'));
  check('the box of an epigraph, which the document does not use, stays open as it is changed', await stillOpen('epigraph', 'Bold', 'yes'));
  await app.click('.side .look .part details[data-kind="epigraph"] > summary');
  await sleep(300);
  await app.lookSection('Paragraphs');
  await sleep(300);
  check(
    'a box closed stays closed, the others open',
    await app.exec(
      `const open = (k) => document.querySelector('.side .look .part details[data-kind="' + k + '"]').open;
       return !open('epigraph') && open('text') && open('quote');`,
    ),
  );
  await sleep(1500);
  await app.screenshot('look-3-kinds');

  // --- Kept as a layout of one's own ---
  await app.lookSection('Layout');
  await app.clickText('.side .look .keep button', 'Keep these changes as a layout of my own');
  await app.waitFor('.side .look .keep input.kept-name', 3000);
  await app.exec(
    `const i = document.querySelector('.side .look .keep input.kept-name'); i.value = 'Mine'; i.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await app.clickText('.side .look .keep button', 'Keep');
  await app.waitUntil(`return document.querySelector('.side .look .layout-line')?.textContent.replace(/\\s+/g, ' ').trim() === 'Layout: Mine'`, 10000, 'the layout kept').catch(() => {});
  top = await app.lookTop();
  const mine = join(app.dataDir, 'formats', 'mine.json');
  const kept = existsSync(mine) ? JSON.parse(readFileSync(mine, 'utf8')) : null;
  check(
    'the changes are kept as a layout of one’s own, based on the layout',
    kept?.kinds?.quote?.italic === true && kept?.basedOn === 'manuscript' && kept?.kind === 'own',
    JSON.stringify(kept?.kinds?.quote),
  );
  check('which the document uses, with no changes of its own', top.layout === 'Layout: Mine' && top.changes === 0, top.layout);
  check('Look still names only what the document is', (await app.whatIs()) === 'Plain document', await app.whatIs());
  check('a layout of one’s own offers to take changes into itself', await app.exists('.side .look .keep button:nth-child(2)'));
  await app.screenshot('look-4-kept');

  // --- The header and the footer are places, and a chapter may begin on a right-hand page ---
  await app.lookSection('Page');
  await app.exec(
    `const s = document.querySelector('.side .look [data-place="footer.left"] select.add');
     s.value = 'title';
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(300);
  check(
    'the title added at the left of the footer stands there as an item, beside the page number in the middle',
    (await app.exists('.side .look [data-place="footer.left"] [data-item="title"]')) &&
      (await app.exists('.side .look [data-place="footer.center"] [data-item="page-number"]')),
  );
  check('and is in the footer of the preview', await typstHas(/footer: context \{[\s\S]*?align\(left, text\("/));
  await app.exec(`document.querySelector('.side .look [data-place="footer.left"]').scrollIntoView({ block: 'center' });`);
  await sleep(300);
  await app.screenshot('look-6-footer');
  await app.lookWrite('On the pages where a chapter or a part begins too', false);
  check('the footer kept off the openers and the blank pages', await typstHas(/if gk-blank\(at\) or gk-on\(<gk-opener>, at\) \{ none \}/));
  await app.lookSection('Headings');
  check('a level begins in the text, on a new page or on a right-hand page', (await app.lookChoose('Placement', 'right-page')) === true);
  check('and the level says so', (await app.exec(`return document.querySelector('.side .look details.level[data-level="1"] .said')?.textContent ?? ''`)).includes('on a right-hand page'));
  check(
    'the preview breaks to a right-hand page before a heading of that level, and marks the opener',
    await typstHas(/#pagebreak\(weak: true, to: "odd"\)\n#metadata\("opener"\) <gk-opener>/),
  );
  await app.lookChoose('Placement', 'text');
  // Numbered level by level: the chapters in roman.
  await app.lookWrite('Numbered', true);
  await sleep(300);
  check('each level, once the headings are numbered, says how first', (await app.lookChosen('Numbering')) === 'as-above');
  await app.lookChoose('Numbering', 'roman');
  check('a level numbered in roman is said so', (await app.exec(`return document.querySelector('.side .look details.level[data-level="1"] .said')?.textContent ?? ''`)).includes('numbered I, II, III'));
  check('and the preview numbers the chapters so', await typstHas(/#set heading\(numbering: \(\.\.nums\) => \{\n  let styles = \("I", "I", "I",\)/));
  await app.lookChoose('Numbering', 'as-above');
  await app.lookWrite('Numbered', false);

  // --- A change made on the project is said in an element under it ---
  await app.lookSection('Type');
  await app.lookWrite('Size', '13');
  await sleep(800);
  check('a change on the project is said as made here', /^Changed here/.test((await fromOf('Size')) ?? ''), await fromOf('Size'));
  await app.click(book);
  await sleep(300);
  await app.keys(['Alt', 'Shift', 'ArrowDown']);
  await sleep(1200);
  await app.openLook('Type');
  check(
    'and in an element under it, as made in the project',
    (await fromOf('Size')) === 'Changed in “Odyssey” · take Mine’s again',
    await fromOf('Size'),
  );
  await app.screenshot('look-5-inherited');

  // --- The foot of Look opens what the document says of itself ---
  await app.lookSection('Layout');
  await app.clickText('.side .look .actions.about button', 'Document properties…');
  await app.waitForText('dialog[open] h2', 'Document properties', 5000);
  const about = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .window nav button')).map((b) => b.textContent.trim())`,
  );
  check(
    'the foot of Look opens Document properties, with its details, its type, its language and its checklist',
    JSON.stringify(about) === JSON.stringify(['Details', 'Document type', 'Language', 'Checklist']),
    about.join(' | '),
  );
  await app.closeAbout();

  // --- The palette changes the font ---
  await app.lookSection('Page');
  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await sleep(200);
  await app.keys('change the font');
  await sleep(200);
  await app.press('Enter');
  await app.waitGone('dialog[open]', 3000);
  await sleep(400);
  check(
    'the palette’s “Change the font…” opens Look at the type',
    (await app.exec(`return document.querySelector('.side .look .chips button.current')?.dataset.section`)) === 'type',
  );

  // --- The chips go to their parts; the line of the layout goes to the layout ---
  await app.lookSection('Notes and citations');
  const notes = await app.exec(
    `const f = document.querySelector('.side .look .through');
     const p = f.querySelector('.part[data-part="notes"]');
     return { chip: f.querySelector('.chips button.current')?.dataset.section,
              near: Math.round(p.getBoundingClientRect().top - f.getBoundingClientRect().top - f.querySelector('.chips').offsetHeight) };`,
  );
  check('a chip brings its part to the top, under the chips, and is marked', notes.chip === 'notes' && Math.abs(notes.near) < 40, JSON.stringify(notes));
  await app.exec(`document.querySelector('.side .look .through').scrollTop = 0;`);
  await sleep(300);
  await app.click('.side .look .layout-line');
  await sleep(500);
  check(
    'the line of the layout goes to the layout at the foot',
    (await app.exec(`return document.querySelector('.side .look .chips button.current')?.dataset.section`)) === 'layout',
  );

  // --- What the document is decides whether the reference style is among the first rows ---
  await app.chooseWhat('Nature');
  await app.waitFor('.side .look .first [data-style-row]', 8000).catch(() => {});
  top = await app.lookTop();
  check(
    'for a journal that names its style, the reference style is among the first rows, and Look names what the document is',
    top.what === 'Nature' && (await app.exists('.side .look .first [data-style-row]')),
    JSON.stringify(top),
  );
  await app.screenshot('look-6-cites');

  // --- The key of a kind, in its box: Code given Ctrl+Alt+2, which Verse had ---
  await app.lookSection('Paragraphs');
  const keyRow = (kind) => `.side .look .part details[data-kind="${kind}"] [data-kind-key] select`;
  check(
    'a kind’s box says its key as the document type gives it: Verse Ctrl+Alt+2, text Ctrl+Alt+0',
    (await app.exec(`return [document.querySelector(arguments[0]).value, document.querySelector(arguments[1]).value].join(' ')`, keyRow('line'), keyRow('text'))) === '2 0',
  );
  await app.exec(
    `const s = document.querySelector(arguments[0]);
     s.value = '2';
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
    keyRow('code'),
  );
  await app.waitUntil(`return document.querySelector('.side .look .whole .type-line .name')?.textContent.trim() === 'Nature, changed'`, 10000, 'the type kept as one’s own').catch(() => {});
  top = await app.lookTop();
  check('the type that came with Glaukopis is kept as one’s own with the key, and the document takes it', top.what === 'Nature, changed', top.what);
  await sleep(500);
  check(
    'Code has Ctrl+Alt+2 now, and Verse none',
    (await app.exec(`return [document.querySelector(arguments[0]).value, document.querySelector(arguments[1]).value].join('|')`, keyRow('code'), keyRow('line'))) === '2|',
  );
  const ownType = execFileSync('find', [join(app.dataDir, 'templates'), '-name', '*.json'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  const keptKeys = ownType.length ? JSON.parse(readFileSync(ownType[0], 'utf8')).kindKeys : null;
  check('the type of one’s own holds the keys', keptKeys?.['2'] === 'code' && !Object.values(keptKeys ?? {}).includes('line'), JSON.stringify(keptKeys));

  // The Paragraph kind menu shows the keys; the key gives the kind, and Ctrl+Alt+0 text.
  const muse = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .prose > p')).find((p) => p.textContent.includes('Tell me, Muse'))`,
    );
  await app.click(await muse());
  await sleep(300);
  await app.click('.pane-bar [data-paragraph-kind]');
  await app.waitFor('.menu', 3000);
  await sleep(150);
  const shortcutOf = (label) =>
    app.exec(
      `const item = Array.from(document.querySelectorAll('.menu [role="menuitem"]')).find((i) => (i.querySelector('.label > .truncate') ?? i.querySelector('.label') ?? i).textContent.trim() === arguments[0]);
       return item?.querySelector('.shortcut')?.textContent.trim() ?? null;`,
      label,
    );
  const quoteKey = await shortcutOf('Quotation');
  check('the Paragraph kind menu shows the key beside a kind', quoteKey === 'Ctrl+Alt+1', String(quoteKey));
  await app.clickText('.menu [role="menuitem"]', 'More…');
  await sleep(300);
  const codeKey = await shortcutOf('Code');
  check('and Code with its new key', codeKey === 'Ctrl+Alt+2', String(codeKey));
  await app.screenshot('look-7-kind-keys');
  await app.press('Escape');
  await sleep(150);
  await app.press('Escape');
  await sleep(300);
  await app.click(await muse());
  await sleep(200);
  const kindOfMuse = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .prose > p')).find((p) => p.textContent.includes('Tell me, Muse'))?.getAttribute('data-kind') ?? 'text'`,
    );
  await app.keys(['Control', 'Alt', '2']);
  await sleep(400);
  check('Ctrl+Alt+2 makes the paragraph code', (await kindOfMuse()) === 'code', await kindOfMuse());
  await app.keys(['Control', 'Alt', '0']);
  await sleep(400);
  check('and Ctrl+Alt+0 text again', (await kindOfMuse()) === 'text', await kindOfMuse());

  // --- The side of the annotations: across from the numbers, then on their side, outside them ---
  await app.click(await muse());
  await sleep(200);
  await app.lineNumberingFromHere();
  await app.waitForText('dialog[open] h2', 'Line numbering from here', 3000);
  await app.exec(
    `const s = document.querySelector('dialog[open] [data-numbering] select'); s.value = 'counted';
     s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(150);
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  await app.numberingOfThisLine();
  await app.waitForText('dialog[open] h2', 'Numbering of this line', 3000);
  await app.exec(`const i = document.querySelector('dialog[open] input[data-annotation]'); i.focus(); i.select();`);
  await app.keys('metre');
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  /** Where the number, the annotation and the line of the paragraph of the Muse stand where one writes. */
  const placed = () =>
    app.exec(
      `const p = Array.from(document.querySelectorAll('.text-view .prose > p')).find((p) => p.textContent.includes('Tell me, Muse'));
       const box = (e) => { const r = e?.getBoundingClientRect(); return r ? [Math.round(r.left), Math.round(r.right)] : null; };
       return { side: p.getAttribute('data-annotations'), line: box(p), number: box(p.querySelector('.line-number:not(.blank)')), note: box(p.querySelector('.line-margin')) };`,
    );
  let at = await placed();
  check(
    'an annotation stands across from the numbers, as the layouts that ship have it',
    at.side === 'right' && at.number && at.note && at.number[1] <= at.line[0] && at.note[0] >= at.line[1],
    JSON.stringify(at),
  );
  await app.openLook('Line numbers');
  check(
    'Look has a row for the side of the annotations, the other side from the numbers chosen',
    (await app.lookChosen('Annotations on the')) === '',
  );
  await app.lookChoose('Annotations on the', 'left');
  await app.waitUntil(
    `return Array.from(document.querySelectorAll('.text-view .prose > p')).find((p) => p.textContent.includes('Tell me, Muse'))?.getAttribute('data-annotations') === 'left'`,
    10000,
    'the annotations at the left',
  ).catch(() => {});
  at = await placed();
  check(
    'set at the left with the numbers there, the annotation stands outside the number where one writes',
    at.side === 'left' && at.note && at.number && at.note[1] < at.number[0] && at.number[1] <= at.line[0],
    JSON.stringify(at),
  );
  check(
    'and in the Typst of the preview, placed past the number',
    await typstHas(/#gk-beside\("left", gk-margin\("metre"\), out: 3em\);/),
  );
  await sleep(2500);
  const onPage = await app.exec(
    `const spans = Array.from(document.querySelectorAll('.preview .page .texts span'));
     const muse = spans.find((s) => s.textContent.includes('Tell me'));
     const note = spans.find((s) => s.textContent.trim() === 'metre');
     if (!muse || !note) return { muse: !!muse, note: !!note };
     const m = muse.getBoundingClientRect();
     const middle = (r) => (r.top + r.bottom) / 2;
     const one = spans.map((s) => s.getBoundingClientRect()).find((r, i) => spans[i].textContent.trim() === '1' && Math.abs(middle(r) - middle(m)) < m.height);
     const n = note.getBoundingClientRect();
     return { line: Math.round(m.left), number: one ? [Math.round(one.left), Math.round(one.right)] : null, note: [Math.round(n.left), Math.round(n.right)] };`,
  );
  check(
    'on the page, the annotation stands left of the number, and the number left of the line',
    !!onPage.number && onPage.note[1] <= onPage.number[0] && onPage.number[1] <= onPage.line,
    JSON.stringify(onPage),
  );
  await app.screenshot('look-8-annotations');

  // The numbers at the right: the annotation across from them, at the left, and then at the right outside them.
  /** Where the number, the annotation and the line of the Muse stand on the page. */
  const onThePage = () =>
    app.exec(
      `const spans = Array.from(document.querySelectorAll('.preview .page .texts span'));
       const muse = spans.find((s) => s.textContent.includes('Tell me'));
       const note = spans.find((s) => s.textContent.trim() === 'metre');
       if (!muse || !note) return { muse: !!muse, note: !!note };
       const m = muse.getBoundingClientRect();
       const middle = (r) => (r.top + r.bottom) / 2;
       const one = spans.map((s) => s.getBoundingClientRect()).find((r, i) => spans[i].textContent.trim() === '1' && Math.abs(middle(r) - middle(m)) < m.height);
       const n = note.getBoundingClientRect();
       return { line: [Math.round(m.left), Math.round(m.right)], number: one ? [Math.round(one.left), Math.round(one.right)] : null, note: [Math.round(n.left), Math.round(n.right)] };`,
    );
  await app.lookChoose('Numbers on the', 'right');
  await app.lookChoose('Annotations on the', '');
  await app.waitUntil(
    `const p = Array.from(document.querySelectorAll('.text-view .prose > p')).find((p) => p.textContent.includes('Tell me, Muse'));
     return p?.getAttribute('data-numbers') === 'right' && p?.getAttribute('data-annotations') === 'left'`,
    10000,
    'the numbers at the right and the annotation at the left',
  ).catch(() => {});
  at = await placed();
  check(
    'with the numbers at the right, the annotation stands at the left where one writes',
    at.side === 'left' && at.number && at.note && at.number[0] >= at.line[1] && at.note[1] <= at.line[0],
    JSON.stringify(at),
  );
  await typstHas(/#gk-beside\("right", gk-number\("1"\)\);/);
  await sleep(2500);
  let page = await onThePage();
  check(
    'and on the page',
    !!page.number && page.number[0] >= page.line[1] && page.note[1] <= page.line[0],
    JSON.stringify(page),
  );
  await app.lookChoose('Annotations on the', 'right');
  await app.waitUntil(
    `return Array.from(document.querySelectorAll('.text-view .prose > p')).find((p) => p.textContent.includes('Tell me, Muse'))?.getAttribute('data-annotations') === 'right'`,
    10000,
    'the annotation at the right',
  ).catch(() => {});
  at = await placed();
  check(
    'set at the right with the numbers, the annotation stands outside the number where one writes',
    at.side === 'right' && at.number && at.note && at.note[0] > at.number[1] && at.number[0] >= at.line[1],
    JSON.stringify(at),
  );
  await typstHas(/#gk-beside\("right", gk-margin\("metre"\), out: 3em\);/);
  await sleep(2500);
  page = await onThePage();
  check(
    'and on the page',
    !!page.number && page.note[0] >= page.number[1] && page.number[0] >= page.line[1],
    JSON.stringify(page),
  );
  await app.screenshot('look-9-annotations-right');

  // --- The step of an indent: a paragraph set in with Tab moves by it, where one writes and on the page ---
  const cities = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .prose > p')).find((p) => p.textContent.includes('Many cities'))`,
    );
  await app.click(await cities());
  await sleep(200);
  await app.press('Tab');
  await sleep(300);
  /** How far the quotation is set in where one writes, and where its words begin on the page. */
  const setIn = () =>
    app.exec(
      `const p = Array.from(document.querySelectorAll('.text-view .prose > p')).find((p) => p.textContent.includes('Many cities'));
       const span = Array.from(document.querySelectorAll('.preview .page .texts span')).find((s) => s.textContent.includes('Many cities'));
       return { indent: p.getAttribute('data-indent'), padding: parseFloat(getComputedStyle(p).paddingLeft),
                page: span ? span.getBoundingClientRect().left : null };`,
    );
  check('Tab sets the quotation in a step', await typstHas(/#block\(inset: \(left: 0\.6cm\)\)\[/));
  await sleep(2500);
  const before = await setIn();
  await app.lookSection('Paragraphs');
  await app.lookWrite('Indentation step', '1');
  check('Look has the step of an indent under Paragraphs, and the Typst takes it', await typstHas(/#block\(inset: \(left: 1cm\)\)\[/));
  await sleep(2500);
  const after = await setIn();
  check(
    'with a step of 1 cm, the quotation moves by 0.4 cm more where one writes',
    before.indent === '1' && Math.abs(after.padding - before.padding - (0.4 * 96) / 2.54) <= 2,
    JSON.stringify({ before, after }),
  );
  check('and on the page', before.page !== null && after.page !== null && after.page > before.page + 3, JSON.stringify({ before, after }));
  await app.screenshot('look-10-step');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (e) {
  console.error(e);
  await app.screenshot('look-failed').catch(() => {});
  checks.push({ name: 'the script ran through', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(failed.length ? `\n${failed.length} of ${checks.length} checks failed` : `\nAll ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
