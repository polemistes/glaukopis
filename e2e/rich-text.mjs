// A box of rich text (record 0112): a stretch of a text in which the look
// is set by hand, shown as a white sheet with its name at its head. In the
// text of a project: Insert › Rich text on an empty line puts a box in its
// place, with the cursor in it; what is written goes into it, a list among
// it; Enter in an empty paragraph at its end leaves it. The sheet is white
// and its words dark in the light scheme and in the dark one. Its head
// stays in view while a long box is scrolled through. With paragraphs
// selected, Insert puts the box around them. From the menu at its head it
// is made ordinary text again, which undo takes back, and deleted;
// Backspace takes an empty one away. The typesetting pane sets the text
// with the box as it sets it without. The project says the second form of
// its texts from the first box on, its readable copy has the box as a
// block of Org, and the box is there when the project is opened again. In
// a note of the notebook, Insert puts a box in as well. And, since rich
// text is not offered yet (`src/lib/byhand/offered.ts`) but to the scripts:
// in a window as someone works in it, started without what the harness
// asks for, Insert has no Rich text.
// Screenshots in e2e/output/rich-text-<n>-<what>.png.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as Y from 'yjs';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** Waits, at most `ms`, until `probe` gives what `ok` takes; gives the last it gave. */
async function until(probe, ok, ms = 6000) {
  const end = Date.now() + ms;
  let got = await probe();
  while (!ok(got) && Date.now() < end) {
    await sleep(150);
    got = await probe();
  }
  return got;
}

const PROSE = '.text-view .section .body .prose';

/** The text as its blocks: a paragraph by its words, a list item with a dash, a box in brackets. */
const shape = (app, prose = PROSE) =>
  app.exec(
    `// The words of a paragraph, without what the editor draws beside them: the bracket of a run and its name.
     const words = (el) => { const c = el.cloneNode(true); c.querySelectorAll('.ProseMirror-widget, [contenteditable="false"]').forEach((w) => w.remove()); return c.textContent.replace(/\\u200b/g, ''); };
     // What a box holds: under its head where it is written in, in the sheet itself where the text is only shown, a list there drawn as one.
     const held = (el) => Array.from((el.querySelector(':scope > .rich-body') ?? el).children).flatMap((c) => c.matches('ul, ol') ? Array.from(c.querySelectorAll('li > p')) : c.matches('.rich-head') ? [] : [c]);
     const one = (el) => el.matches('.rich')
       ? '[' + held(el).map(one).join(' | ') + ']'
       : (el.dataset.kind === 'item' ? '- ' : '') + words(el);
     const prose = document.querySelector(arguments[0]);
     return prose ? Array.from(prose.querySelectorAll(':scope > p, :scope > .rich')).map(one).join(' | ') : null;`,
    prose,
  );

/** How the first box is drawn: its ground, the colour of its words, and its head. */
const sheet = (app) =>
  app.exec(
    `const box = document.querySelector('${PROSE} .rich');
     if (!box) return null;
     const p = box.querySelector('.rich-body p');
     return {
       ground: getComputedStyle(box).backgroundColor,
       ink: getComputedStyle(p).color,
       head: box.querySelector('.rich-head')?.textContent.trim() ?? null,
     };`,
  );

async function begin(app, name) {
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', name);
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
}

const idOf = (app, name) =>
  app.execAsync(
    `const list = await window.__TAURI_INTERNALS__.invoke('project_list');
     return list.find((p) => p.name === arguments[0])?.id ?? null;`,
    name,
  );

/** A project as it is on disk, as a document. */
async function onDisk(app, id) {
  const loaded = await app.projectLoad(id);
  const doc = new Y.Doc();
  const bytes = (b64) => Uint8Array.from(Buffer.from(b64, 'base64'));
  if (loaded.state) Y.applyUpdate(doc, bytes(loaded.state));
  for (const update of loaded.updates) Y.applyUpdate(doc, bytes(update));
  return doc;
}

const app = await App.launch({ width: 1360, height: 880 });
try {
  await app.installErrorHook?.();

  // ---- a box in the place of an empty line ----
  await begin(app, 'A letter');
  await app.click('.text-view .section .body');
  await app.keys('Before.');
  await app.press('Enter');
  const id = await idOf(app, 'A letter');
  check('before any box, the project is of the first form of the texts', (await onDisk(app, id)).getMap('form').size === 0);

  await app.insert('Rich text');
  await app.waitFor(`${PROSE} .rich`, 5000);
  check('Insert › Rich text puts a box in the place of the empty line', (await shape(app)) === 'Before. | []', await shape(app));
  await app.keys('Dear all,');
  await app.press('Enter');
  await app.keys('welcome.');
  check('what is written goes into the box', (await shape(app)) === 'Before. | [Dear all, | welcome.]', await shape(app));
  const light = await sheet(app);
  check('the head of the box names it', light?.head === 'Rich text', JSON.stringify(light));
  check('the sheet is white, its words dark', light?.ground === 'rgb(255, 255, 255)' && light?.ink === 'rgb(31, 37, 40)', JSON.stringify(light));
  await app.screenshot('rich-text-1-box');

  // ---- a list in it, and leaving it ----
  await app.press('Enter');
  await app.paragraphKind('List');
  await app.keys('a point');
  await app.press('Enter');
  // The empty point becomes text; Enter in the empty paragraph at the end leaves the box.
  await app.press('Enter');
  check('a list stands in the box, and an empty point becomes text there', (await shape(app)) === 'Before. | [Dear all, | welcome. | - a point | ]', await shape(app));
  await app.press('Enter');
  await app.keys('After.');
  check('Enter in an empty paragraph at its end leaves the box', (await shape(app)) === 'Before. | [Dear all, | welcome. | - a point] | After.', await shape(app));
  // The count under the text is a moment behind the writing.
  const counted = await until(
    () => app.exec(`return Array.from(document.querySelectorAll('span')).map((s) => s.textContent.replace(/[\\u2068\\u2069]/g, '').trim()).find((s) => /^\\d+ words?$/.test(s)) ?? ''`),
    (words) => words === '7 words',
    4000,
  );
  check('the words in the box are counted with the others', counted === '7 words', counted);

  // ---- Find finds what stands in the box ----
  await app.keys(['Control', 'f']);
  await app.waitFor('.search-bar input', 3000);
  await app.keys('welcome');
  const found = await until(
    () =>
      app.exec(
        `let marked = null; for (const r of CSS.highlights.get('search-current') ?? []) marked = r;
         return { said: document.querySelector('.search-bar .said')?.textContent.replace(/[\\u2068\\u2069]/g, '').trim() ?? '', text: marked ? marked.toString() : null, boxed: !!marked?.startContainer.parentElement?.closest('.rich') };`,
      ),
    (f) => f.said === '1 of 1',
    5000,
  );
  check('Find finds a word that stands in the box, and shows it there', found.said === '1 of 1' && found.text === 'welcome' && found.boxed, JSON.stringify(found));
  await app.press('Escape');
  await sleep(200);

  // ---- the dark scheme ----
  await app.setTheme('dark');
  await sleep(300);
  const dark = await sheet(app);
  check('in the dark scheme the sheet is white still, its words dark', dark?.ground === 'rgb(255, 255, 255)' && dark?.ink === 'rgb(31, 37, 40)', JSON.stringify(dark));
  await app.screenshot('rich-text-2-dark');
  await app.setTheme('light');
  await sleep(200);

  // ---- the head stays in view ----
  await app.click(`${PROSE} .rich .rich-body p`);
  await app.keys(['Control', 'Home']);
  await app.click(`${PROSE} .rich .rich-body p:nth-child(2)`);
  for (let i = 0; i < 45; i++) {
    await app.press('End');
    await app.press('Enter');
    await app.keys(`line ${i + 1}`);
  }
  const stuck = await app.exec(
    `const box = document.querySelector('${PROSE} .rich');
     const head = box.querySelector('.rich-head');
     let scroller = box.parentElement;
     while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) scroller = scroller.parentElement;
     if (!scroller) return null;
     // Scrolled so that the box begins above what is seen and ends below its top.
     scroller.scrollTop += box.getBoundingClientRect().top - scroller.getBoundingClientRect().top + 300;
     const top = scroller.getBoundingClientRect().top;
     return { box: Math.round(box.getBoundingClientRect().top - top), head: Math.round(head.getBoundingClientRect().top - top) };`,
  );
  check('scrolled through, a long box keeps its head at the top of what is seen', !!stuck && stuck.box < -200 && stuck.head >= 0 && stuck.head < 4, JSON.stringify(stuck));
  await sleep(200);
  await app.screenshot('rich-text-3-head-in-view');

  // ---- from the head: ordinary text, undone, and deleted ----
  // A moment after the writing, so that undo takes the one step back and not the lines with it.
  await sleep(1500);
  await app.click(`${PROSE} .rich [data-rich-menu]`);
  await app.waitFor('.menu');
  const entries = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.trim())`);
  check('the menu of the box has Select, Make it ordinary text and Delete', JSON.stringify(entries) === JSON.stringify(['Select', 'Make it ordinary text', 'Delete']), entries.join(' | '));
  await app.clickText('.menu [role="menuitem"]', 'Make it ordinary text');
  await app.waitGone(`${PROSE} .rich`, 5000);
  const plain = await shape(app);
  check('made ordinary text, the box is gone and what it held stands where it stood', plain.startsWith('Before. | Dear all, | welcome. | line 1 | ') && plain.endsWith(' | - a point | After.'), plain.slice(0, 80));
  await app.click(`${PROSE} p`);
  await app.keys(['Control', 'z']);
  await app.waitFor(`${PROSE} .rich`, 5000);
  check('undo brings the box back', (await shape(app)).startsWith('Before. | [Dear all, | welcome. | line 1 | '), (await shape(app)).slice(0, 80));

  // ---- the typesetting pane sets it ----
  const open = await app.typeset();
  const pages = await until(
    () => app.exec(`return document.querySelectorAll('.side.typesetting .preview img, .side.typesetting .preview canvas, .side.typesetting .preview .page').length`),
    (n) => n > 0,
    30000,
  );
  const failed = await app.exec(`return document.querySelector('.side.typesetting [role="alert"]')?.textContent.trim() ?? ''`);
  check('the typesetting pane sets the text with the box in it', open && pages > 0 && !failed, `pages ${pages} ${failed}`);
  await app.screenshot('rich-text-4-typeset');
  await app.typeset();

  // ---- on disk: the form, and the readable copy ----
  await app.home();
  await sleep(1500);
  const doc = await onDisk(app, id);
  check('the project says the second form of the texts', doc.getMap('form').has('2'), JSON.stringify([...doc.getMap('form').keys()]));
  const orgPath = join(app.dataDir, 'projects', id, 'project.org');
  const org = await until(
    () => (existsSync(orgPath) ? readFileSync(orgPath, 'utf8') : ''),
    (text) => text.includes('#+BEGIN_rich'),
    20000,
  );
  check(
    'its readable copy has the box as a block of Org, with what it holds written as without it',
    /\nBefore\.\n\n#\+BEGIN_rich\nDear all,\n\nwelcome\.\n/.test(org) && /\n- a point\n#\+END_rich\n\nAfter\.\n/.test(org),
    org.slice(org.indexOf('Before.'), org.indexOf('Before.') + 120),
  );

  // ---- opened again ----
  await app.go(`#/project/${encodeURIComponent(id)}`);
  await app.waitFor(`${PROSE} .rich`, 10000);
  const again = await until(() => shape(app), (s) => !!s && s.includes('line 45'), 8000);
  check('opened again, the box is there, drawn as a sheet before the text is pressed', again.startsWith('Before. | [Dear all, | welcome. | line 1 | ') && again.endsWith(' | - a point] | After.'), `${again.slice(0, 60)} … ${again.slice(-40)}`);
  // Shown only, the sheet has the head the editor gives it: pressed, nothing moves.
  const place = () => app.exec(`const b = document.querySelector('${PROSE} .rich'); const p = b.querySelector('p'); const r = b.getBoundingClientRect(); return { shown: !b.querySelector('.rich-head'), top: Math.round(p.getBoundingClientRect().top - r.top), left: Math.round(p.getBoundingClientRect().left - r.left), height: Math.round(r.height) };`);
  const shown = await place();
  await app.screenshot('rich-text-5-shown');
  await app.click(`${PROSE} .rich p`);
  await app.waitFor(`${PROSE} .rich .rich-head`, 5000);
  await sleep(300);
  const written = await place();
  check(
    'pressed, the editor takes its place and nothing moves',
    shown.shown && !written.shown && shown.top === written.top && shown.left === written.left && shown.height === written.height,
    `${JSON.stringify(shown)} ${JSON.stringify(written)}`,
  );

  // ---- around what is selected; an empty one; deleting ----
  await app.home();
  await begin(app, 'Around a selection');
  await app.click('.text-view .section .body');
  await app.keys('One');
  await app.press('Enter');
  await app.keys('Two');
  await app.press('Enter');
  await app.keys('Three');
  // From within Three up into Two.
  await app.keys(['Shift', 'ArrowUp']);
  await app.insert('Rich text');
  await app.waitFor(`${PROSE} .rich`, 5000);
  check('with paragraphs selected, the box is put around them', (await shape(app)) === 'One | [Two | Three]', await shape(app));
  const disabled = await (async () => {
    await app.barMenu('data-insert');
    const off = await app.exec(`const e = Array.from(document.querySelectorAll('.menu [role="menuitem"]')).find((e) => e.textContent.trim() === 'Rich text'); return e ? e.getAttribute('aria-disabled') === 'true' || e.hasAttribute('disabled') : null;`);
    await app.press('Escape');
    return off;
  })();
  check('within a box, Insert offers no box', disabled === true, String(disabled));
  await app.click(`${PROSE} .rich [data-rich-menu]`);
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Delete');
  await app.waitGone(`${PROSE} .rich`, 5000);
  check('Delete takes the box away with what it holds', (await shape(app)) === 'One', await shape(app));
  await app.click(`${PROSE} p`);
  await app.press('End');
  await app.press('Enter');
  await app.insert('Rich text');
  await app.waitFor(`${PROSE} .rich`, 5000);
  await app.press('Backspace');
  await app.waitGone(`${PROSE} .rich`, 5000);
  check('Backspace takes an empty box away', (await shape(app)) === 'One | ', await shape(app));

  // ---- in a note of the notebook ----
  await app.home();
  await app.go('#/notebook');
  await app.waitFor('[data-notebook-empty]', 10000);
  await app.clickText('[data-notebook-empty] button', 'New note');
  await app.waitFor('[data-note-editor] [data-note-text] .ProseMirror', 8000);
  await app.click('[data-note-text] .ProseMirror');
  await app.keys('A note.');
  await app.press('Enter');
  await app.click('[data-note-editor] [data-insert]');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Rich text');
  await app.waitFor('[data-note-text] .rich', 5000);
  await app.keys('In a box, in a note.');
  check('in a note of the notebook, Insert puts a box in as well', (await shape(app, '[data-note-text] .prose')) === 'A note. | [In a box, in a note.]', await shape(app, '[data-note-text] .prose'));
  await app.screenshot('rich-text-6-note');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.log('FAIL  the script stopped:', error?.message ?? error);
  checks.push({ name: 'the script ran to the end', ok: false });
  await app.screenshot('rich-text-stopped').catch(() => {});
} finally {
  await app.close().catch(() => {});
}

// ---- not offered where someone works ----
// A window as it is outside the scripts: nothing tells the application that a script drives it.
const working = await App.launch({ width: 1360, height: 880, env: { GLAUKOPIS_E2E: '' } });
try {
  await begin(working, 'As it is offered');
  await working.click('.text-view .section .body');
  await working.barMenu('data-insert');
  const offered = await working.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.trim())`);
  check('Insert has what it had', offered.includes('Two texts side by side') && offered.includes('Page break'), offered.join(' | '));
  check('and no Rich text, which is not offered yet', !offered.includes('Rich text'), offered.join(' | '));
  await working.press('Escape');
} catch (error) {
  console.log('FAIL  the script stopped in the working window:', error?.message ?? error);
  checks.push({ name: 'the working window was tried', ok: false });
  await working.screenshot('rich-text-stopped-working').catch(() => {});
} finally {
  await working.close().catch(() => {});
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
