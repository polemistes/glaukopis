// An element marked as the document (record 0081): Make this the document in
// an element's menu, on the project's own element and on a part of a book;
// with a mark, the element entered beneath it carries the number the
// document gives it in the text view and the diagram, the typesetting pane
// sets the marked document and names it in its head, the sign of the
// typesetting stands on the marked element's box in the diagram, on its crumb
// in the path and on its row in the list; an element outside the marked document carries no number;
// chosen again on the marked element, the item is checked and takes the mark
// off, and the chapter entered prints alone again; the mark comes back when
// the application is opened again.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-the-document-'));

/** The number before the title of the text view, or null. */
const titleNumber = (app) =>
  app.exec(`return document.querySelector('.pane .text-view .section.level-0 .heading .number')?.textContent.trim() ?? null`);
/** The number of the centre of the diagram, or null. */
const centreNumber = (app) =>
  app.exec(`return document.querySelector('.pane .diagram .node.root .caption .number')?.textContent.trim() ?? null`);
/** The text of the pages, once they are made for what is asked. */
const pagesText = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('.side.typesetting .preview .page .texts span')).map((s) => s.textContent).join(' ')`);
const pagesWith = (app, word, has) =>
  app.waitUntil(
    `const t = Array.from(document.querySelectorAll('.side.typesetting .preview .page .texts span')).map((s) => s.textContent).join(' ');
     return t.includes(arguments[0]) === arguments[1] && t.length > 0`.replace('arguments[0]', JSON.stringify(word)).replace('arguments[1]', String(has)),
    20000,
    `the pages ${has ? 'with' : 'without'} ${word}`,
  );
/** The name the head of the typesetting pane gives the document, or null. */
const namedInPane = (app) =>
  app.exec(`return document.querySelector('.side.typesetting [data-document-name]')?.textContent.trim() ?? null`);
/** The names of the crumbs of the path that carry the sign. */
const signedCrumbs = (app) =>
  app.exec(
    `return Array.from(${app.path}?.querySelectorAll('[data-crumb]') ?? []).filter((c) => c.querySelector('[data-document-sign]')).map((c) => c.querySelector('.name')?.textContent.trim())`,
  );
/** The names of the rows of the list that carry the sign. */
const signedRows = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-projects-pane] .row')).filter((r) => r.querySelector('[data-document-sign]')).map((r) => r.querySelector('.name')?.textContent.trim())`,
  );
/** The names of the boxes of the diagram that carry the sign. */
const signedNodes = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.pane .diagram .node')).filter((n) => n.querySelector('[data-document-sign]')).map((n) => n.querySelector('.caption .name')?.textContent.trim())`,
  );
/** Goes up to the project, by its crumb, which the path always shows. */
const toTop = async (app) => {
  const crumb = await app.exec(`return ${app.path}?.querySelector('[data-crumb="project"]') ?? null`);
  if (!crumb || (await app.exec(`return !!${app.path}?.querySelector('[data-crumb="project"][data-crumb-last]')`))) return;
  await app.click(crumb);
  await app.waitUntil(`return !!${app.path}?.querySelector('[data-crumb="project"][data-crumb-last]')`, 5000, 'the project in view');
  await sleep(300);
};
/** Enters the elements named, one under another, from the element in view. */
const enter = async (app, ...names) => {
  for (const name of names) await app.openMap(name);
};
/** Shows the text view and waits for its title. */
const inText = async (app) => {
  await app.view('text');
  await app.waitFor('.pane .text-view .section.level-0', 8000);
  await sleep(300);
};

let app = await App.launch({ width: 1440, height: 900, dataDir, keepData: true });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'A book in parts');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);

  // --- Two parts of two chapters, and notes beside them ---
  await app.click('.diagram .node.root');
  const add = async (where, name) => {
    await app.keys(where === 'under' ? ['Alt', 'Shift', 'Enter'] : ['Alt', 'Enter']);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await add('under', 'Part one');
  await add('under', 'Alpha');
  await add('after', 'Beta');
  await app.clickText('.diagram .node .caption .name', 'Part one');
  await sleep(150);
  await add('after', 'Part two');
  await add('under', 'Gamma');
  await add('after', 'Delta');
  await app.clickText('.diagram .node .caption .name', 'Part two');
  await sleep(150);
  await add('after', 'Notes');

  // --- The look numbers the headings: 1, 1.1 ---
  await app.typeset();
  await app.waitFor('.side.typesetting .preview', 15000);
  await app.openLook('Headings');
  await app.lookWrite('Numbered', true);
  await app.waitUntil(`return !!document.querySelector('.diagram .node .caption .number')`, 8000, 'numbers in the map');
  // Look closed, so that the side has room for the whole path.
  await app.click('.side.typesetting [data-look]');
  await app.waitGone('.side .look', 5000);
  await sleep(200);

  // --- No mark: the chapter entered is the document, printed alone ---
  await enter(app, 'Part one', 'Alpha');
  await inText(app);
  check('without a mark, the title of the chapter entered carries no number', (await titleNumber(app)) === null);
  await pagesWith(app, 'Gamma', false).catch(() => {});
  const alone = await pagesText(app);
  check('and the pages are of the chapter alone', alone.includes('Alpha') && !alone.includes('Gamma'), alone.slice(0, 80));
  check('nothing carries the sign', !(await app.exists('[data-document-sign], [data-document-name]')));

  // --- The project's own element marked: the book is the document wherever one is ---
  await toTop(app);
  await inText(app);
  await app.thisElement('Make this the document');
  await app.waitFor('[data-path] [data-document-sign]', 5000);
  check('marked, the project’s crumb carries the sign', JSON.stringify(await signedCrumbs(app)) === '["A book in parts"]', JSON.stringify(await signedCrumbs(app)));
  check('while the pane names nothing, the project being in view', (await namedInPane(app)) === null);
  await app.view('diagram');
  await app.waitFor('.pane .diagram .node.root [data-document-sign]', 5000);
  check('and in the diagram the sign stands on the project’s box alone', JSON.stringify(await signedNodes(app)) === '["A book in parts"]', JSON.stringify(await signedNodes(app)));
  await app.screenshot('the-document-0-sign-in-diagram');
  await enter(app, 'Part one', 'Alpha');
  await inText(app);
  check('the chapter entered under the marked book has its number in the title', (await titleNumber(app)) === '1.1', String(await titleNumber(app)));
  check('the project’s crumb still carries the sign', (await signedCrumbs(app)).includes('A book in parts'));
  check('so does the project’s row in the list', (await signedRows(app)).includes('A book in parts'), JSON.stringify(await signedRows(app)));
  check('the head of the typesetting pane names the book', (await namedInPane(app)) === 'A book in parts', String(await namedInPane(app)));
  await pagesWith(app, 'Gamma', true);
  check('and the pages are the book’s', (await pagesText(app)).includes('Gamma'));
  await app.screenshot('the-document-1-chapter-in-book');
  await app.view('diagram');
  await app.waitFor('.pane .diagram .node.root', 5000);
  await sleep(300);
  check('the centre of the diagram carries the chapter’s number too', (await centreNumber(app)) === '1.1', String(await centreNumber(app)));
  await app.openMap('Notes');
  await inText(app);
  check('the notes, within the book, are numbered as the book prints them', (await titleNumber(app)) === '3', String(await titleNumber(app)));
  check('and the pane still names the book', (await namedInPane(app)) === 'A book in parts');

  // --- The item checked on the marked element; chosen again, the mark is off ---
  await toTop(app);
  await inText(app);
  await app.thisElement();
  check(
    'the item is checked in the menu of the marked element',
    await app.exec(
      `const item = Array.from(document.querySelectorAll('.menu [role="menuitem"]')).find((i) => i.textContent.trim() === 'Make this the document');
       return !!item?.querySelector('.check svg');`,
    ),
  );
  await app.clickText('.menu [role="menuitem"]', 'Make this the document');
  await app.waitGone('[data-path] [data-document-sign]', 5000);
  check('chosen again, the mark is off', !(await app.exists('[data-document-sign], [data-document-name]')));
  await enter(app, 'Part one', 'Alpha');
  await inText(app);
  check('and the chapter entered is printed alone again', (await titleNumber(app)) === null && (await namedInPane(app)) === null);
  await pagesWith(app, 'Gamma', false);

  // --- A part marked from its heading in the text view ---
  await toTop(app);
  await inText(app);
  await app.elementMenu('Part one', 'Make this the document');
  await sleep(300);
  check('a part marked from its heading carries the sign on its row', (await signedRows(app)).includes('Part one'), JSON.stringify(await signedRows(app)));
  await app.view('diagram');
  await app.waitFor('.pane .diagram .node [data-document-sign]', 5000);
  check('and on its box in the diagram, the project’s box carrying none', JSON.stringify(await signedNodes(app)) === '["Part one"]', JSON.stringify(await signedNodes(app)));
  await app.screenshot('the-document-3-sign-on-a-part');
  await enter(app, 'Part one', 'Alpha');
  await inText(app);
  check('the chapter entered under the marked part is numbered as the part prints it', (await titleNumber(app)) === '1', String(await titleNumber(app)));
  check('the part’s crumb carries the sign', JSON.stringify(await signedCrumbs(app)) === '["Part one"]', JSON.stringify(await signedCrumbs(app)));
  await pagesWith(app, 'Beta', true);
  const ofPart = await pagesText(app);
  check('the pages are the part’s', ofPart.includes('Beta') && !ofPart.includes('Gamma'), ofPart.slice(0, 80));
  check('and the pane names it', (await namedInPane(app)) === 'Part one');
  await app.openMap('Notes');
  await inText(app);
  check('the notes, outside the marked part, carry no number', (await titleNumber(app)) === null);
  check('while the pane still names the part', (await namedInPane(app)) === 'Part one');
  await app.screenshot('the-document-2-pane-head');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await app.quit();
} catch (e) {
  console.error(e);
  await app.screenshot('the-document-failed').catch(() => {});
  checks.push({ name: 'the first run ran through', ok: false });
  await app.close();
}

// --- Opened again: the mark is back ---
app = await App.launch({ width: 1440, height: 900, dataDir, keepData: true });
try {
  await app.installErrorHook();
  await app.waitFor('.project', 10000).catch(async () => {
    await app.openProject('A book in parts');
  });
  await app.waitFor('[data-path]', 10000);
  await sleep(600);
  if (await app.exists('.side .look')) await app.click('.side.typesetting [data-look]');
  await toTop(app);
  await enter(app, 'Part one', 'Alpha');
  await inText(app);
  check('opened again, the part’s crumb carries the sign', JSON.stringify(await signedCrumbs(app)) === '["Part one"]', JSON.stringify(await signedCrumbs(app)));
  check('and the chapter has the number the part gives it', (await titleNumber(app)) === '1', String(await titleNumber(app)));
  const errors = await app.pageErrors();
  check('no errors in the page opened again', errors.length === 0, errors.join(' | '));
  await app.quit();
} catch (e) {
  console.error(e);
  await app.screenshot('the-document-failed-again').catch(() => {});
  checks.push({ name: 'the second run ran through', ok: false });
  await app.close();
}
rmSync(dataDir, { recursive: true, force: true });

const failed = checks.filter((c) => !c.ok);
console.log(failed.length ? `\n${failed.length} of ${checks.length} checks failed` : `\nAll ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
