// One form for a document and for its type (record 0119, the plan of one
// form): a document is set up in Look, and Look says where that goes. A
// font changed for the document is counted at the top of Look, with Save as
// document type…, which makes a type of the writer's own of it: the type is
// in the chooser under Your own with its parts and its pages listed, and
// the document has no changes left. New document type… in the chooser,
// starting from Novel, opens Look on the new type; a change made while it is
// edited goes into the type, and Done ends that. Delete this document type…
// asks, and the document is of what the type was made from.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1500, height: 940 });

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
/** A file the application keeps of the writer's own, read; null where there is none. */
function kept(folder, id) {
  const file = join(app.dataDir, folder, `${id}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}
const own = (folder) => (existsSync(join(app.dataDir, folder)) ? readdirSync(join(app.dataDir, folder)).sort() : []);
/** What the chooser lists, each type with its group, whether it is chosen, what it brings, and Edit. */
const listed = () =>
  app.exec(
    `const out = [];
     let group = '';
     for (const e of document.querySelectorAll('dialog[open] .chooser .templates h4, dialog[open] .chooser .templates .template')) {
       if (e.tagName === 'H4') group = e.textContent.trim();
       else out.push({ group, name: e.querySelector('.name').textContent.trim(), chosen: e.classList.contains('chosen'),
         brings: Array.from(e.querySelectorAll('[data-brings]')).map((b) => b.textContent.trim()),
         edit: !!e.querySelector('[data-edit-type]') });
     }
     return out;`,
  );
/** The line under a row of Look that says where its value comes from; nothing where none. */
const fromOf = (label) =>
  app.exec(
    `const row = ${app.lookRow(label)};
     const next = row?.nextElementSibling;
     return next?.classList.contains('from') ? next.textContent.replace(/\\s+/g, ' ').trim() : null;`,
  );

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
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys('The wrath of Achilles as a word, and a word as a wrath.');
  await sleep(300);
  await app.keys(['Control', 't']);
  await app.waitFor('.preview .page', 20000);

  // --- A font changed for the document, counted at the top of Look ---
  await app.click('.preview header [data-look]');
  await app.openLook();
  await app.addPart('Title page');
  await app.type('.side .look .search input', 'font');
  await sleep(300);
  await app.lookChoose('Font', 'Gentium Plus');
  await sleep(800);
  let top = await app.lookTop();
  check(
    'a font changed for the document is counted at the top of Look, with Save as document type… and Reset, and no Save to, the type being the plain document',
    top.what === 'Plain document' &&
      top.line === '1 change in this document' &&
      (await app.exists('.side .look .whole [data-save-as]')) &&
      (await app.exists('.side .look .whole [data-reset]')) &&
      !(await app.exists('.side .look .whole [data-save-to]')),
    JSON.stringify(top),
  );
  check('and it is said on the row of the font, with Reset', (await fromOf('Font')) === 'Changed in this document · Reset', String(await fromOf('Font')));
  check('the preview is made in that font', await typstHas(/Gentium Plus/));
  await app.screenshot('one-form-1-changed');

  // --- Saved as a document type of one's own ---
  await app.click('.side .look .whole [data-save-as]');
  await app.waitFor('.side .look .whole input.type-name', 3000);
  await app.exec(
    `const i = document.querySelector('.side .look .whole input.type-name'); i.value = 'Gentium book'; i.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await app.screenshot('one-form-2-naming');
  await app.clickText('.side .look .whole .naming button', 'Save');
  await app
    .waitUntil(`return document.querySelector('.side .look .whole .type-line .name')?.textContent.trim() === 'Gentium book'`, 10000, 'the type saved')
    .catch(() => {});
  await sleep(1500);
  top = await app.lookTop();
  const book = kept('templates', 'gentium-book');
  const pages = book?.layout ? kept('formats', book.layout) : null;
  check(
    'the type is made of the plain document, with the font in pages of its own and the parts the document has, the title page and the text',
    book?.group === 'own' &&
      book?.basedOn === 'plain' &&
      pages?.font?.family === 'Gentium Plus' &&
      pages?.kind === 'own' &&
      book.contents.some((c) => c.part === 'title-page') &&
      book.contents.some((c) => c.part === 'body'),
    JSON.stringify({ basedOn: book?.basedOn, layout: book?.layout, contents: book?.contents }),
  );
  check(
    'the document has the type, and no changes left',
    top.what === 'Gentium book' && top.changes === 0 && top.line === '' && (await fromOf('Font')) === null,
    JSON.stringify(top),
  );
  check('and the preview is still in the font, now the type’s', await typstHas(/Gentium Plus/));
  check(
    'the type is the writer’s own: Save to it is offered, with nothing to save, and Save as… stays',
    (await app.text('.side .look .whole [data-save-to]')).trim() === 'Save to “Gentium book”' &&
      (await app.exec(`return document.querySelector('.side .look .whole [data-save-to]').disabled`)) === true &&
      (await app.exists('.side .look .whole [data-save-as]')),
  );
  await app.screenshot('one-form-3-saved');
  await app.lookSection('Document type');
  await sleep(300);
  const taken = await app.exec(`return document.querySelector('.side .look select[data-taken-from] option')?.textContent.trim()`);
  check('the first choice of Look taken from names the look by the type alone', taken === 'Gentium book', taken);
  await app.screenshot('one-form-3b-type-section');

  // --- The type is in the chooser, with its parts and its pages ---
  await app.openChooser();
  let types = await listed();
  const mine = types.find((x) => x.name === 'Gentium book');
  check(
    'in the chooser it stands under Your own, chosen, with Edit, and lists its parts and its pages',
    !!mine &&
      mine.group === 'Your own' &&
      mine.chosen &&
      mine.edit &&
      /Title page/.test(mine.brings[0] ?? '') &&
      /The text/.test(mine.brings[0] ?? '') &&
      /Gentium Plus/.test(mine.brings[1] ?? ''),
    JSON.stringify(mine ?? types.slice(0, 3)),
  );
  await app.screenshot('one-form-4-chooser');

  // --- A new type, from Novel ---
  await app.click('dialog[open] .chooser [data-new-type]');
  await app.waitFor('dialog[open] [data-new-name]', 5000);
  await app.type('dialog[open] [data-new-name]', 'My novel');
  const starts = await app.exec(
    `const s = document.querySelector('dialog[open] [data-start-from]');
     return { value: s.value, first: s.options[0].textContent.trim(), novel: Array.from(s.options).some((o) => o.value === 'novel') };`,
  );
  check(
    'New document type… offers Nothing and every type to start from, the one in use chosen',
    starts.value === book?.id && starts.first === 'Nothing' && starts.novel,
    JSON.stringify(starts),
  );
  await app.exec(
    `const s = document.querySelector('dialog[open] [data-start-from]'); s.value = 'novel'; s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await app.screenshot('one-form-5-new');
  await app.click('dialog[open] [data-create]');
  await app.waitGone('dialog[open]', 8000);
  await app.waitFor('.side .look [data-editing]', 8000).catch(() => {});
  await sleep(500);
  top = await app.lookTop();
  const fresh = kept('templates', 'my-novel');
  check(
    'it is made of Novel and is the document’s; Document properties closes and Look edits it',
    fresh?.group === 'own' &&
      fresh?.basedOn === 'novel' &&
      fresh?.layout === 'novel-book' &&
      top.what === 'My novel' &&
      top.editing === 'Editing the document type “My novel”',
    JSON.stringify({ basedOn: fresh?.basedOn, layout: fresh?.layout, top }),
  );
  await app.screenshot('one-form-6-editing');

  // --- A change made while it is edited goes into the type ---
  await app.type('.side .look .search input', 'line spacing');
  await sleep(300);
  await app.lookChoose('Line spacing', '1.5');
  // The change is saved into the type a moment after it is written.
  const until = Date.now() + 15000;
  while (Date.now() < until && (kept('templates', 'my-novel')?.layout ?? 'novel-book') === 'novel-book') await sleep(300);
  await sleep(1500);
  top = await app.lookTop();
  const edited = kept('templates', 'my-novel');
  const editedPages = edited?.layout ? kept('formats', edited.layout) : null;
  check(
    'the change is in the type, in pages of its own made from those of Novel',
    edited?.layout && edited.layout !== 'novel-book' && editedPages?.text?.lineSpacing === 1.5 && editedPages?.basedOn === 'novel-book' && editedPages?.kind === 'own',
    JSON.stringify({ layout: edited?.layout, spacing: editedPages?.text?.lineSpacing, basedOn: editedPages?.basedOn }),
  );
  check(
    'the document carries no change of its own, and is still editing the type',
    top.changes === 0 && top.editing === 'Editing the document type “My novel”' && (await fromOf('Line spacing')) === null,
    JSON.stringify(top),
  );
  check(
    'a look written into it while it is edited leaves the parts it suggests as Novel has them, not those of the document, which has a title page and the text',
    JSON.stringify(edited?.contents) === JSON.stringify(fresh?.contents) &&
      JSON.stringify(edited?.kinds) === JSON.stringify(fresh?.kinds) &&
      edited.contents.some((c) => c.part === 'half-title'),
    JSON.stringify(edited?.contents?.map((c) => c.part ?? c.kind)),
  );
  check('the other type is as it was', JSON.stringify(kept('templates', 'gentium-book')) === JSON.stringify(book), '');
  await app.screenshot('one-form-7-edited');

  // Done ends it: a change after it is the document's.
  await app.clickText('.side .look [data-editing] button', 'Done');
  await sleep(500);
  top = await app.lookTop();
  check('Done ends the editing', top.editing === '' && !(await app.exists('.side .look [data-editing]')), JSON.stringify(top));
  await app.lookChoose('Line spacing', '2');
  await sleep(1200);
  top = await app.lookTop();
  check(
    'and a change after it is the document’s, not the type’s',
    top.changes === 1 && kept('formats', edited.layout)?.text?.lineSpacing === 1.5,
    JSON.stringify(top),
  );
  await app.click('.side .look .whole [data-reset]');
  await sleep(800);
  top = await app.lookTop();
  check('Reset takes it away', top.changes === 0 && (await app.lookChosen('Line spacing')) === '1.5', JSON.stringify(top));

  // --- Deleted: the document is of what the type was made from ---
  await app.lookSection('Document type');
  await sleep(300);
  await app.screenshot('one-form-8-own-parts');
  const parts = await app.exec(
    `const p = document.querySelector('.side .look .part[data-part="document-type"]');
     return { name: p.querySelector('[data-type-name]')?.value, offered: p.querySelectorAll('[data-offered]').length,
              exported: p.querySelectorAll('[data-target]').length, remove: p.querySelector('[data-delete-type]')?.textContent.trim() };`,
  );
  check(
    'under Document type, a type of one’s own has its name, the kinds it offers first, the kinds of file it is exported as, and Delete this document type…',
    parts.name === 'My novel' && parts.offered > 3 && parts.exported > 3 && parts.remove === 'Delete this document type…',
    JSON.stringify(parts),
  );
  await app.click('.side .look .part[data-part="document-type"] [data-delete-type]');
  await app.waitForText('dialog[open] h2', 'Delete the document type “My novel”?', 5000);
  await app.screenshot('one-form-9-delete');
  await app.clickText('dialog[open] footer button', 'Delete document type');
  await app.waitGone('dialog[open]', 5000);
  await app
    .waitUntil(`return document.querySelector('.side .look .whole .type-line .name')?.textContent.trim() === 'Novel'`, 10000, 'the document to be of Novel')
    .catch(() => {});
  await sleep(800);
  top = await app.lookTop();
  check(
    'deleted, the type is gone, and the document is of Novel, which it was made from',
    top.what === 'Novel' && !own('templates').includes('my-novel.json') && own('templates').includes('gentium-book.json'),
    JSON.stringify({ top, files: own('templates') }),
  );
  await app.openChooser();
  types = await listed();
  check(
    'the chooser lists the other type of one’s own still, and not the deleted',
    types.some((x) => x.name === 'Gentium book' && x.group === 'Your own') && !types.some((x) => x.name === 'My novel'),
    types.filter((x) => x.group === 'Your own').map((x) => x.name).join(' | '),
  );
  await app.screenshot('one-form-10-after');
  await app.closeChooser();

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('one-form-failure').catch(() => {});
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
