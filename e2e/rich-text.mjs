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
// a note of the notebook, Insert puts a box in as well. The look is set by
// hand from the tools in the head (record 0113), which show while the
// cursor is in the box and leave the head as high as it was: a size, a
// colour, a font and bold on the words selected, the paragraph centred and
// given room after it; the tools show what is set; any colour is set as
// from the system's chooser; the typesetting pane sets it; the readable
// copy says it in Org; Clear formatting takes it away and leaves bold; and
// Make it ordinary text asks first where something is set by hand, and
// takes it away with the sheet. Where the head is narrow, beside the
// typesetting pane, the tools that do not fit are folded into one menu,
// from which they do what they do in the row. And, since rich
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
       head: box.querySelector('.rich-head .name')?.textContent.trim() ?? null,
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
  check(
    'the menu of the box has Select, Make it ordinary text and Delete, and the way to the look of the whole document',
    JSON.stringify(entries) === JSON.stringify(['Select', 'Make it ordinary text', 'Delete', 'The look of the whole document…']),
    entries.join(' | '),
  );
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

  // ---- the look set by hand ----
  await app.home();
  await begin(app, 'Set by hand');
  const handId = await idOf(app, 'Set by hand');
  await app.click('.text-view .section .body');
  await app.keys('Before.');
  await app.press('Enter');
  await app.insert('Rich text');
  await app.waitFor(`${PROSE} .rich`, 5000);
  await app.keys('Dear all,');
  await app.press('Enter');
  await app.keys('welcome');
  await sleep(300);
  const headHeight = () => app.exec(`return Math.round(document.querySelector('${PROSE} .rich .rich-head').getBoundingClientRect().height)`);
  const withTools = await headHeight();
  check('the tools show in the head while the cursor is in the box', await app.exists(`${PROSE} .rich [data-rich-tools]`));
  // What is set of the word "welcome", as the editor draws it.
  const welcome = () =>
    app.exec(
      `const p = Array.from(document.querySelectorAll('${PROSE} .rich .rich-body p')).find((p) => p.textContent.includes('welcome'));
       const in_ = (sel) => p?.querySelector(sel);
       return p ? {
         size: in_('[data-size]')?.dataset.size ?? null,
         colour: in_('[data-colour]')?.dataset.colour ?? null,
         font: in_('[data-font]')?.dataset.font ?? null,
         bold: !!in_('strong'),
         hand: p.dataset.hand ? JSON.parse(p.dataset.hand) : null,
         align: getComputedStyle(p).textAlign,
         larger: parseFloat(getComputedStyle(in_('[data-size]') ?? p).fontSize) > parseFloat(getComputedStyle(document.querySelector('${PROSE} > p')).fontSize) * 1.5,
       } : null;`,
    );
  await app.keys(['Shift', 'Home']);
  await app.click('[data-rich-size]');
  await app.keys('20');
  await app.press('Enter');
  await sleep(250);
  await app.click('[data-rich-colour]');
  await app.waitFor('.menu');
  const colours = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.trim())`);
  check('the menu of colours has As the document, the plain colours and Another…', colours[0] === 'As the document' && colours.includes('Red') && colours.includes('Blue') && colours.at(-1) === 'Another…', colours.join(' | '));
  await app.screenshot('rich-text-7-colours');
  await app.clickText('.menu [role="menuitem"]', 'Red');
  await sleep(250);
  // The list of fonts is the system's own: chosen as it gives it.
  await app.exec(`const s = document.querySelector('[data-rich-font]'); s.value = 'Libertinus Serif'; s.dispatchEvent(new Event('change', { bubbles: true }));`);
  await sleep(250);
  await app.click('[data-rich-mark="strong"]');
  await app.click('[data-rich-align="center"]');
  await sleep(250);
  let set = await welcome();
  check(
    'a size, a colour, a font and bold are set of the words selected',
    set?.size === '20' && set?.colour === '#b0322a' && set?.font === 'Libertinus Serif' && set?.bold === true,
    JSON.stringify(set),
  );
  check('the words are drawn larger, in proportion', set?.larger === true, JSON.stringify(set));
  check('the paragraph is centred by hand, and drawn so', set?.hand?.align === 'center' && set?.align === 'center', JSON.stringify(set));
  await app.click('[data-rich-paragraph]');
  await app.waitFor('[data-rich-paragraph-panel]', 3000);
  await app.click('[data-rich-length="spaceAfter"]');
  await app.keys('12');
  await app.press('Enter');
  await sleep(250);
  check('the panel of the paragraph is open still after Enter in a field', await app.exists('[data-rich-paragraph-panel]'));
  await app.screenshot('rich-text-8-paragraph');
  await app.press('Escape');
  await sleep(300);
  set = await welcome();
  check('room after the paragraph is set from its panel, a number alone taken as points', set?.hand?.spaceAfter === '12pt', JSON.stringify(set));
  // The words are selected still: the tools show what is set of them.
  const toolsSay = await until(
    () =>
      app.exec(
        `const t = document.querySelector('${PROSE} .rich [data-rich-tools]');
         return t ? { font: t.querySelector('[data-rich-font]').value, size: t.querySelector('[data-rich-size]').value, colour: t.querySelector('[data-rich-colour]').dataset.richColour, centre: t.querySelector('[data-rich-align="center"]').getAttribute('aria-pressed'), bold: t.querySelector('[data-rich-mark="strong"]').getAttribute('aria-pressed') } : null;`,
      ),
    (t) => !!t,
    4000,
  );
  check(
    'the tools show what is set of what is selected',
    toolsSay?.font === 'Libertinus Serif' && toolsSay?.size === '20' && toolsSay?.colour === '#b0322a' && toolsSay?.centre === 'true' && toolsSay?.bold === 'true',
    JSON.stringify(toolsSay),
  );
  await app.screenshot('rich-text-9-set-by-hand');
  // Any colour, as from the system's chooser, which a script cannot press.
  await app.exec(`window.__glaukopisRichColour('#123456')`);
  await sleep(250);
  check('any colour is set as from the system’s chooser', (await welcome())?.colour === '#123456', JSON.stringify(await welcome()));
  // Outside the box: no tools, and the head as high as with them.
  await app.click(`${PROSE} > p`);
  await until(() => app.exists(`${PROSE} .rich [data-rich-tools]`), (shown) => !shown, 3000);
  check('outside the box the tools are gone, and the head is as high as it was', !(await app.exists(`${PROSE} .rich [data-rich-tools]`)) && (await headHeight()) === withTools, `${withTools} ${await headHeight()}`);

  // The typesetting pane sets what is set by hand.
  const handOpen = await app.typeset();
  const handPages = await until(
    () => app.exec(`return document.querySelectorAll('.side.typesetting .preview img, .side.typesetting .preview canvas, .side.typesetting .preview .page').length`),
    (n) => n > 0,
    30000,
  );
  const handFailed = await app.exec(`return document.querySelector('.side.typesetting [role="alert"]')?.textContent.trim() ?? ''`);
  check('the typesetting pane sets the text with what is set by hand', handOpen && handPages > 0 && !handFailed, `pages ${handPages} ${handFailed}`);
  await sleep(1500);
  await app.screenshot('rich-text-10-typeset-by-hand');

  // Beside the typesetting pane the head is narrow: the tools that do not fit are folded into one menu.
  await app.click(`${PROSE} .rich .rich-body p:nth-child(2)`);
  const narrow = await until(
    () =>
      app.exec(
        `const head = document.querySelector('${PROSE} .rich .rich-head');
         const tools = head.querySelector('[data-rich-tools]');
         if (!tools) return null;
         const right = tools.getBoundingClientRect().right;
         const cut = Array.from(tools.querySelectorAll('select, input[type="text"], button')).filter((el) => el.getBoundingClientRect().right > right + 0.5).length;
         return {
           head: Math.round(head.getBoundingClientRect().width),
           height: Math.round(head.getBoundingClientRect().height),
           cut,
           fits: tools.scrollWidth <= tools.clientWidth,
           folded: !!tools.querySelector('[data-rich-folded]'),
           font: !!tools.querySelector('[data-rich-font]'), size: !!tools.querySelector('[data-rich-size]'), colour: !!tools.querySelector('[data-rich-colour]'),
           lists: tools.querySelectorAll('[data-rich-list]').length,
         };`,
      ),
    (n) => !!n && n.folded,
    4000,
  );
  check(
    'in a narrow head no tool is cut: the font, the size and the colour stay, and the rest is folded away',
    !!narrow && narrow.folded && narrow.cut === 0 && narrow.fits && narrow.font && narrow.size && narrow.colour && narrow.lists === 0 && narrow.height === withTools,
    JSON.stringify(narrow),
  );
  await app.click('[data-rich-folded]');
  await app.waitFor('.menu');
  const foldedAway = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.trim())`);
  check(
    'the menu of what is folded away has the tools that have no room, as they are in the row',
    foldedAway.includes('Bold') && foldedAway.includes('Numbered list') && foldedAway.includes('Paragraph') && foldedAway.includes('Clear formatting') && !foldedAway.includes('Red'),
    foldedAway.join(' | '),
  );
  await app.screenshot('rich-text-10a-narrow-head');
  await app.clickText('.menu [role="menuitem"]', 'Numbered list');
  await sleep(300);
  const numbered = await app.exec(`return Array.from(document.querySelectorAll('${PROSE} .rich .rich-body p')).find((p) => p.textContent.includes('welcome'))?.dataset.kind ?? 'text'`);
  check('a tool chosen there does what it does in the row', numbered === 'numbered', numbered);
  await app.click('[data-rich-folded]');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Numbered list');
  await sleep(300);
  // The panel of the paragraph opens from there too.
  await app.click('[data-rich-folded]');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Paragraph');
  await app.waitFor('[data-rich-paragraph-panel]', 3000);
  check('the panel of the paragraph opens from the menu, showing what is set', (await app.exec(`return document.querySelector('[data-rich-length="spaceAfter"]')?.value`)) === '12pt');
  await app.press('Escape');
  await sleep(300);
  await app.typeset();
  await sleep(400);
  // With the pane closed there is room again, and nothing is folded.
  await app.click(`${PROSE} .rich .rich-body p:nth-child(2)`);
  const wide = await until(() => app.exec(`const t = document.querySelector('${PROSE} .rich [data-rich-tools]'); return t ? { folded: !!t.querySelector('[data-rich-folded]'), lists: t.querySelectorAll('[data-rich-list]').length } : null`), (w) => !!w && !w.folded, 4000);
  check('where there is room, every tool is in the row and nothing is folded', !!wide && !wide.folded && wide.lists === 2, JSON.stringify(wide));

  // Clear formatting takes it from what is selected, and leaves bold.
  await app.click(`${PROSE} .rich .rich-body p:nth-child(2)`);
  await app.press('End');
  await app.keys(['Shift', 'Home']);
  await until(() => app.exists(`${PROSE} .rich [data-rich-clear]`), (shown) => shown, 3000);
  await app.click('[data-rich-clear]');
  await sleep(300);
  set = await welcome();
  check('Clear formatting takes away what is set by hand, and leaves bold', set?.size === null && set?.colour === null && set?.font === null && set?.hand === null && set?.bold === true, JSON.stringify(set));
  await app.keys(['Control', 'z']);
  await until(welcome, (w) => w?.size === '20', 4000);

  // On disk, in Org.
  await app.home();
  const handOrgPath = join(app.dataDir, 'projects', handId, 'project.org');
  const handOrg = await until(
    () => (existsSync(handOrgPath) ? readFileSync(handOrgPath, 'utf8') : ''),
    (text) => text.includes('size=20'),
    20000,
  );
  check(
    'the readable copy says what is set by hand: of the words in a bracket, of the paragraph on the line before it',
    handOrg.includes('#+ATTR_GLAUKOPIS: :align center :space-after 12pt\n[*welcome*]{font="Libertinus Serif" size=20 colour=#123456}\n#+END_rich'),
    handOrg.slice(handOrg.indexOf('#+BEGIN_rich'), handOrg.indexOf('#+BEGIN_rich') + 220),
  );

  // Made ordinary text, it is asked first, and what was set by hand goes with the sheet.
  await app.go(`#/project/${encodeURIComponent(handId)}`);
  await app.waitFor(`${PROSE} .rich`, 10000);
  await app.click(`${PROSE} .rich p`);
  await app.waitFor(`${PROSE} .rich [data-rich-menu]`, 5000);
  await app.click(`${PROSE} .rich [data-rich-menu]`);
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Make it ordinary text');
  await app.waitForText('dialog h2', 'Make it ordinary text?', 5000);
  // The dialog that asks, whatever else is open or closing.
  const warned = (
    await app.exec(`return Array.from(document.querySelectorAll('dialog[open]')).find((d) => d.textContent.includes('Make it ordinary text?'))?.textContent ?? ''`)
  ).replace(/\s+/g, ' ');
  check('made ordinary text, it is asked first where something is set by hand', warned.includes('What is set by hand in it is taken away') && (await app.exists(`${PROSE} .rich`)), warned.slice(0, 160));
  await app.screenshot('rich-text-11-asked');
  await app.clickText('dialog footer button', 'Make it ordinary text');
  await app.waitGone(`${PROSE} .rich`, 5000);
  const left = await app.exec(`return { words: Array.from(document.querySelectorAll('${PROSE} > p')).map((p) => p.textContent.replace(/\u200b/g, '')).join(' | '), byHand: document.querySelectorAll('${PROSE} [data-size], ${PROSE} [data-colour], ${PROSE} [data-font], ${PROSE} [data-hand]').length, bold: !!document.querySelector('${PROSE} strong') }`);
  check('the words stay, bold stays, and nothing is set by hand outside a sheet', left.words === 'Before. | Dear all, | welcome' && left.byHand === 0 && left.bold, JSON.stringify(left));

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
  await app.screenshot('rich-text-12-note');

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
