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

  // --- The names over the preview open Look ---
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page', 30000);
  await sleep(800);
  await app.click('.preview button.in-use');
  await app.waitFor('.side .look .chips', 15000);
  await sleep(500);
  let map = await app.lookMap();
  check(
    'the names over the preview open Look, whose top line names the template, the layout with its changes, and the citations',
    /^.+ → Manuscript · no changes → .+$/.test(map),
    map,
  );
  check(
    'the layout and the reference style are chosen in Look',
    (await app.lookChosen('Layout')) === '' && (await app.lookChosen('Reference style')) === '',
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
  map = await app.lookMap();
  check('and the top line counts the change', /Manuscript · 1 change →/.test(map), map);
  check('the preview is made in that font', await typstHas(/Gentium Plus/));
  await app.screenshot('look-2-from');
  await app.exec(
    `const row = ${app.lookRow('Font')};
     row.nextElementSibling.querySelector('button.again').click();`,
  );
  await sleep(800);
  map = await app.lookMap();
  check(
    'taking the layout’s again leaves no change, and the font is the layout’s',
    /Manuscript · no changes/.test(map) && (await fromOf('Font')) === null && (await typstHas(/Gentium Plus/, false)),
    map,
  );

  // --- The foot of the kind menu opens Look at the kind ---
  await app.click(await app.exec(`return document.querySelectorAll(arguments[0] + ' .prose > p')[1]`, book));
  await sleep(300);
  await app.click('.pane-bar .tools .style');
  await app.clickText('[role="menuitem"]', 'How “Quotation” looks…');
  await sleep(800);
  const quote = await app.exec(
    `const d = document.querySelector('.side .look details[data-kind="quote"]');
     return { open: !!d?.open, part: document.querySelector('.side .look .part')?.dataset.part };`,
  );
  check('the foot of the kind menu opens Look at the look of the kind', quote.open && quote.part === 'kinds', JSON.stringify(quote));
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
  map = await app.lookMap();
  check('and counted at the top', /· 1 change →/.test(map), map);
  check(
    'and the preview sets the quotation so',
    await typstHas(/#show quote\.where\(block: true\): it => \{\s*set text\([^)]*style: "italic"/),
  );
  await sleep(1500);
  await app.screenshot('look-3-kinds');

  // --- Kept as a layout of one's own ---
  await app.clickText('.side .look footer button', 'Keep these changes as a layout of my own');
  await app.waitFor('.side .look footer input.kept-name', 3000);
  await app.exec(
    `const i = document.querySelector('.side .look footer input.kept-name'); i.value = 'Mine'; i.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await app.clickText('.side .look footer button', 'Keep');
  await app.waitUntil(`return /^.+ → Mine · no changes → /.test(document.querySelector('.side .look .map')?.textContent.replace(/\\s+/g, ' ').trim() ?? '')`, 10000, 'the layout kept').catch(() => {});
  map = await app.lookMap();
  const mine = join(app.dataDir, 'formats', 'mine.json');
  const kept = existsSync(mine) ? JSON.parse(readFileSync(mine, 'utf8')) : null;
  check(
    'the changes are kept as a layout of one’s own, based on the layout',
    kept?.kinds?.quote?.italic === true && kept?.basedOn === 'manuscript' && kept?.kind === 'own',
    JSON.stringify(kept?.kinds?.quote),
  );
  check('which the document uses, with no changes of its own', /→ Mine · no changes →/.test(map), map);
  await app.waitUntil(`return (document.querySelector('.preview .in-use .names')?.textContent ?? '').includes('Mine')`, 8000, 'the names over the preview').catch(() => {});
  const names = await app.exec(`return document.querySelector('.preview .in-use .names')?.textContent.trim() ?? ''`);
  check('the names over the preview say so', names.includes('Mine'), names);
  check('a layout of one’s own offers to take changes into itself', await app.exists('.side .look footer button:nth-child(2)'));
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

  // --- The document settings send to Look ---
  await app.openDocumentSettings('Look');
  check(
    'the document settings say where the look is set, with a way there',
    await app.exists('dialog[open] .window button') &&
      /Open Look/.test(await app.text('dialog[open] .window .settings')),
  );
  await app.clickText('dialog[open] .window .settings button', 'Open Look');
  await app.waitGone('dialog[open]', 3000);

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
    (await app.exec(`return document.querySelector('.side .look .part')?.dataset.part`)) === 'type',
  );

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
