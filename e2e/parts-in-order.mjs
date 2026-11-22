// The order of the tree (record 0118): a document is printed as its tree
// stands, and what Glaukopis makes itself, a title page, a table of
// contents, is printed only where an element of that kind stands. A new
// document has no title page; Parts in Look lists what the type suggests,
// with Add, which puts the element last under the document; moved first in
// the tree, the title page is printed first; a table of contents from
// Another part is headed by the name of its element; and the checklist says
// in what order the type has the parts, and moves nothing.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1500, height: 920 });
try {
  await app.installErrorHook();
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
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
  /** The Typst the preview was made of. */
  const typ = () => {
    const work = join(app.dataDir, 'work');
    return readFileSync(join(work, readdirSync(work)[0], 'preview', 'document.typ'), 'utf8');
  };
  /** Waits until the Typst of the preview is as asked, and gives it. */
  const typWhen = async (test) => {
    const from = Date.now();
    while (!test(typ()) && Date.now() - from < 15000) await sleep(300);
    return typ();
  };
  /** Where the title of the document stands in the Typst, as the title page sets it, a block with its label; -1 where there is none. */
  const titleAt = (source) => source.search(/(?<!#show )<gk-title>/);
  const chapterAt = (source) => source.lastIndexOf('The word');

  let source = await typWhen((s) => s.includes('The word'));
  check('a new document has its text and no title page', chapterAt(source) >= 0 && titleAt(source) < 0, `${titleAt(source)}`);
  check('and no table of contents', !/#outline\(/.test(source));
  await app.screenshot('parts-1-nothing-placed');

  // --- Parts, in Look: what the type suggests, each with Add ---
  await app.click('.preview header [data-look]');
  await app.openLook('Parts');
  const listed = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.side .look .place')).map((p) => ({
         name: p.querySelector('.place-head strong').textContent.trim(),
         add: p.querySelector('[data-make]')?.textContent.trim() ?? null,
         elements: Array.from(p.querySelectorAll('.element')).map((e) => e.textContent.trim()),
       }))`,
    );
  let parts = await listed();
  check(
    'Parts lists what a plain document suggests, the title page and the bibliography, each with Add and nothing turned on',
    JSON.stringify(parts.map((p) => p.name)) === JSON.stringify(['Title page', 'Bibliography']) &&
      parts.every((p) => p.add === 'Add' && !p.elements.length) &&
      !(await app.exists('.side .look [data-part-switch]')),
    JSON.stringify(parts),
  );
  await app.click(await app.exec(`return document.querySelector('.side .look .place[data-kind="title-page"] [data-make]')`));
  await app.waitFor('.side .look .place[data-kind="title-page"] .element', 3000);
  parts = await listed();
  check(
    'added, the title page is an element, listed there, and no second is offered',
    parts[0].elements.length === 1 && parts[0].elements[0] === 'Title page' && parts[0].add === null,
    JSON.stringify(parts[0]),
  );
  source = await typWhen((s) => titleAt(s) >= 0);
  check(
    'it stands last under the document, and is printed there: after the chapter',
    titleAt(source) > chapterAt(source) && chapterAt(source) >= 0,
    `title at ${titleAt(source)}, chapter at ${chapterAt(source)}`,
  );
  await app.screenshot('parts-2-title-page-last');

  // --- Moved first in the tree, it is printed first ---
  // The diagram is narrow beside the preview and the panel: all of it is shown first.
  const node = async (name) => {
    await app.click('.diagram');
    await app.keys(['Control', '0']);
    await sleep(400);
    return app.findByText('.diagram .node', name);
  };
  await app.click(await node('Title page'));
  await sleep(200);
  await app.keys(['Alt', 'ArrowUp']);
  await sleep(400);
  source = await typWhen((s) => titleAt(s) >= 0 && titleAt(s) < chapterAt(s));
  check(
    'moved over the chapter in the tree, the title page is printed before it',
    titleAt(source) >= 0 && titleAt(source) < chapterAt(source),
    `title at ${titleAt(source)}, chapter at ${chapterAt(source)}`,
  );
  await app.screenshot('parts-3-title-page-first');

  // --- Another part: a table of contents, headed by the name of its element ---
  await app.click('.diagram .node.root');
  await sleep(200);
  await app.click(await app.exec(`return document.querySelector('.side .look [data-make-another]')`));
  await app.waitFor('[role="menu"] [role="menuitem"]', 3000);
  await app.clickText('[role="menu"] [role="menuitem"]', 'Table of contents');
  await app.waitFor('.side .look .place[data-kind="contents"] .element', 3000);
  parts = await listed();
  const contents = parts.find((p) => p.name === 'Table of contents');
  check(
    'a table of contents from Another part is listed after what the type suggests, named as documents name it',
    !!contents && contents.elements[0] === 'Contents' && parts.at(-1).name === 'Table of contents',
    JSON.stringify(parts.map((p) => `${p.name}: ${p.elements.join(',')}`)),
  );
  source = await typWhen((s) => /#outline\(/.test(s));
  const outline = /#outline\(title: \[([^\]]*)\]/.exec(source);
  check(
    'it is printed where it stands, last, under the name of its element',
    !!outline && outline[1] === 'Contents' && source.indexOf('#outline(') > chapterAt(source),
    outline ? outline[0] : 'no outline',
  );
  await app.screenshot('parts-4-contents');

  // --- The checklist says the order of the type, and moves nothing ---
  await app.openAbout('Checklist');
  const remarks = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .remarks li')).map((l) => l.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check('with the title page first and the text after it, the checklist has nothing to say of the order', !remarks.some((r) => /in this order/.test(r)), remarks.join(' | '));
  await app.closeAbout();
  await app.click(await node('Title page'));
  await sleep(200);
  await app.keys(['Alt', 'ArrowDown']);
  await sleep(400);
  await app.click('.diagram .node.root');
  await sleep(200);
  await app.openAbout('Checklist');
  const after = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] .remarks li')).map((l) => l.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check(
    'with the title page after the chapter, it says the order the type has, and the tree stays as it is',
    after.some((r) => r === 'The document type has these parts in this order: Title page · The text.'),
    after.join(' | '),
  );
  await app.screenshot('parts-5-checklist');
  await app.closeAbout();

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.log(String(error.stack ?? error));
  check('the script ran to its end', false);
} finally {
  await app.close();
}

console.log(`\n${checks.filter((c) => c.ok).length} of ${checks.length} checks passed`);
process.exit(checks.every((c) => c.ok) ? 0 : 1);
