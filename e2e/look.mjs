// The look of a document, in one place (ADR 0042). The names over the
// preview open Look in the panel at the side: the template, the layout and
// the citations stand in one line at its top. A setting is found by its
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
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Odyssey');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.press('Tab');
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

  // --- Look, from its button over the preview, in the order of the page ---
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page', 30000);
  await sleep(800);
  await app.click('.preview header [data-look]');
  await app.waitFor('.side .look .chips', 15000);
  await sleep(500);
  let top = await app.lookTop();
  check(
    'Look opens from its button over the preview, with what the document is at its top and the layout in a line',
    top.what === 'Plain document' && top.layout === 'Layout: Manuscript' && top.changes === 0,
    JSON.stringify(top),
  );
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
    (await app.lookChosen('Layout')) === '' &&
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
  await app.lookWrite('Font', 'Gentium Plus');
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
  await app.click('.pane-bar .tools .style');
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
  await sleep(1500);
  await app.screenshot('look-3-kinds');

  // --- Kept as a layout of one's own ---
  await app.lookSection('The layout');
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
  check('the button over the preview still names only what the document is', (await app.whatIs()) === 'Plain document', await app.whatIs());
  check('a layout of one’s own offers to take changes into itself', await app.exists('.side .look .keep button:nth-child(2)'));
  await app.screenshot('look-4-kept');

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
  await app.lookSection('The layout');
  await app.clickText('.side .look .actions.about button', 'About this document…');
  await app.waitForText('dialog[open] h2', 'About this document', 5000);
  const about = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .window nav button')).map((b) => b.textContent.trim())`,
  );
  check(
    'the foot of Look opens About this document, with its details, its language and its checklist',
    JSON.stringify(about) === JSON.stringify(['Details', 'Language', 'Checklist']),
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
