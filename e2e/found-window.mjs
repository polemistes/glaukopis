// The panel at the side in which citations that were found are gone
// through, with found text that is written into a project here: what can be
// seen of it whatever the library answers, and how what is looked at is
// shown in the text beside it. What is brought in from files, and what the
// library proposes, is tried in found.mjs.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as Y from 'yjs';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 8000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
}

// ---- found text, as the reader of documents writes it ----

const zotero = (id, key, data, more = {}) => ({
  id,
  by: 'zotero',
  items: [{ uris: [`http://zotero.org/users/1/items/${key}`], data, ...more }],
  mode: 'normal',
  left: false,
});
const NAGY = zotero(
  'a1b2c3d4e5f6',
  'NAGY1979',
  {
    type: 'book',
    title: 'The Best of the Achaeans',
    author: [{ family: 'Nagy', given: 'Gregory' }],
    issued: { 'date-parts': [[1979]] },
  },
  { locator: '73' },
);
const LORD = zotero('b1b2c3d4e5f6', 'LORD1960', {
  type: 'book',
  title: 'The Singer of Tales',
  author: [{ family: 'Lord', given: 'Albert B.' }],
  issued: { 'date-parts': [[1960]] },
});
const FINLEY = zotero('c1b2c3d4e5f6', 'FINL1954', {
  type: 'book',
  title: 'The World of Odysseus',
  author: [{ family: 'Finley', given: 'M. I.' }],
  issued: { 'date-parts': [[1954]] },
  publisher: 'Viking Press',
});
const TAG = {
  id: 'd1b2c3d4e5f6',
  by: 'key',
  items: [{ key: 'parry1971', locator: '12' }],
  mode: 'normal',
  left: false,
};
const IN_NOTE = { ...NAGY, id: 'e1b2c3d4e5f6' };
const WHOLE_NOTE = { ...LORD, id: 'f1b2c3d4e5f6', items: [{ ...LORD.items[0], locator: '12' }] };
const BESIDE_FORMULA = { ...LORD, id: 'g1b2c3d4e5f6' };

/** A paragraph of pieces: text, text with marks, or something that stands in the line. */
function paragraph(...pieces) {
  const el = new Y.XmlElement('paragraph');
  fill(el, pieces);
  return el;
}

function fill(el, pieces) {
  // As the editors write it: the pieces of text that follow one another are one text,
  // each with its marks.
  const children = [];
  let run = null;
  const close = () => {
    if (!run) return;
    const text = new Y.XmlText();
    text.applyDelta(run);
    children.push(text);
    run = null;
  };
  for (const piece of pieces) {
    if (piece instanceof Y.XmlElement) {
      close();
      children.push(piece);
      continue;
    }
    const [words, marks = {}] = Array.isArray(piece) ? piece : [piece];
    (run ??= []).push({ insert: words, attributes: marks });
  }
  close();
  el.insert(0, children);
}

function note(...pieces) {
  const el = new Y.XmlElement('footnote');
  el.setAttribute('place', '');
  fill(el, pieces);
  return el;
}

function formula(tex) {
  const el = new Y.XmlElement('math');
  el.setAttribute('tex', tex);
  return el;
}

/** The text that is written into the centre of the map. */
const written = () => [
  paragraph(
    'The wrath is that of a hero ',
    ['(Nagy 1979, ', { found: NAGY }],
    ['73', { found: NAGY, em: {} }],
    [')', { found: NAGY }],
    ', and the song that of a singer ',
    ['(Lord 1960)', { found: LORD }],
    ' who composes as he sings.',
  ),
  paragraph(
    'The world of the poems ',
    ['(Finley 1954)', { found: FINLEY }],
    ' is not that of the palaces, and the verse is made of formulas ',
    ['[@parry1971, 12]', { found: TAG }],
    '.',
  ),
  paragraph(
    'A note that says something and cites on the way',
    note('See ', ['Nagy 1979, 73', { found: IN_NOTE }], '; but he argues otherwise.'),
    ', a note that is a citation and nothing else',
    note(['Lord 1960, 12', { found: WHOLE_NOTE }], '.'),
    ', and one that holds a formula',
    note('Where ', formula('n > 1'), ' holds, see ', ['Lord 1960', { found: BESIDE_FORMULA }], '.'),
    '.',
  ),
];

const toBase64 = (bytes) => Buffer.from(bytes).toString('base64');
const fromBase64 = (text) => new Uint8Array(Buffer.from(text, 'base64'));

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const invoke = (command, args = {}) =>
    app.execAsync(
      `return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`,
      command,
      args,
    );

  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await invoke('import_apply', { plan: await invoke('import_bib_text', { text: bib }) });

  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Homer');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const id = (await app.exec(`return location.hash`)).split('/')[2].split('?')[0];

  // The project is closed, the text is written into it, and it is opened again.
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 8000);
  await sleep(800);
  {
    const loaded = await app.projectLoad(id);
    const doc = new Y.Doc();
    if (loaded.state) Y.applyUpdate(doc, fromBase64(loaded.state));
    for (const update of loaded.updates) Y.applyUpdate(doc, fromBase64(update));
    const before = Y.encodeStateVector(doc);
    const [map] = [...doc.getMap('maps').values()];
    const centre = doc.getMap('nodes').get(map.get('root'));
    doc.transact(() => centre.get('body').insert(0, written()));
    await app.projectAppend(id, toBase64(Y.encodeStateAsUpdate(doc, before)));
  }
  await app.clickText('.card h3', 'Homer');
  await app.waitFor('.diagram .node.root', 8000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);

  const foundInText = () => app.count('.text-view .prose .found:not(.left)');
  const citationsInText = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .prose.body .citation')).map((e) => e.textContent)`,
    );
  const notesInText = () => app.count('.text-view .prose.body .footnote');
  const P = '.found-panel';
  const rows = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('${P} .list .row .text')).map((e) => e.textContent.trim())`,
    );
  const current = () =>
    app.exec(
      `const r = document.querySelector('${P} .row.current .text'); return r ? r.textContent.trim() : null`,
    );
  const marked = () =>
    app.exec(
      `const m = document.querySelector('${P} .detail mark'); return m ? m.textContent : null`,
    );
  const button = (words) =>
    app.exec(
      `return Array.from(document.querySelectorAll('${P} footer button')).find((b) => b.textContent.trim() === arguments[0]) || null`,
      words,
    );
  const disabled = (words) =>
    app.exec(
      `const b = Array.from(document.querySelectorAll('${P} footer button')).find((b) => b.textContent.trim() === arguments[0]); return b ? b.disabled : null`,
      words,
    );
  const press = (el) =>
    app.cmd('POST', '/execute/sync', { script: 'arguments[0].click()', args: [el] });
  /** Looks at the entry whose row reads so, the list opened first. */
  const pick = async (text) => {
    await openList();
    const row = await app.exec(
      `return Array.from(document.querySelectorAll('${P} .list .row')).find((r) => r.textContent.includes(arguments[0]))`,
      text,
    );
    if (!row) throw new Error(`no row reads ${text}`);
    await press(row);
  };
  /** The list of all there is, folded open; it stays open once opened. */
  const openList = async () => {
    const toggle = await app.exec(
      `return document.querySelector('${P} .list-toggle[aria-expanded="false"]')`,
    );
    if (toggle) {
      await press(toggle);
      await sleep(200);
    }
  };
  /** Waits for the panel, with the one that is looked at and the list. */
  const opened = async () => {
    await app.waitFor(`${P} .detail`, 8000);
    await openList();
    await app.waitFor(`${P} .list .row`, 3000);
    await sleep(500);
  };
  const closePanel = async () => {
    await app.click(`${P} header button[aria-label="Close"]`);
    await app.waitGone(P);
    await sleep(300);
  };
  /** The citation that is selected in the text of the map, where an element has been given its editor. */
  const selectedInText = () =>
    app.exec(
      `const el = document.querySelector('.text-view .ProseMirror.body .footnote.selected');
       if (el) return 'note: ' + (el.getAttribute('title') || '');
       const panel = document.querySelector('.text-view .note-panel');
       return panel ? 'note panel' : null`,
    );
  const menu = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.menu [role="menuitem"], .menu .item')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim())`,
    );
  /** Finds the work that is looked at in the library, by the words that are written in the search already. */
  const find = async (expected) => {
    await app.clickText(`${P} .mean`, 'Find it…');
    await app.waitFor('.picker input');
    await sleep(350);
    const query = await app.exec(`return document.querySelector('.picker input').value`);
    const first = await app.exec(
      `const r = document.querySelector('.picker .row'); return r ? r.textContent.replace(/\\s+/g, ' ').trim() : ''`,
    );
    check(
      `the picker has the words of the work in its search: ${expected.query}`,
      query === expected.query,
      query,
    );
    check(`and finds it: ${expected.title}`, first.includes(expected.title), first);
    await app.press('Enter');
    await app.waitGone('.picker');
    await sleep(250);
  };

  // ---- in the text ----
  check(
    'what was found stands in the text as the text it was, marked',
    (await foundInText()) === 6,
    String(await foundInText()),
  );
  check('no citation is in the text yet', (await citationsInText()).length === 0);
  await app.screenshot('found-1-text');

  // ---- where the panel is reached from ----
  await app.openThisMap();
  const ofTab = await menu();
  check(
    'the menu of the tab of the map has it, with how many there are',
    ofTab.some((m) => /^Citations that were found…\s*7 to go through/.test(m)),
    ofTab.join(' ‖ '),
  );
  await app.press('Escape');
  await app.waitGone('.menu');

  await app.thisMap('Citations that were found…');
  await opened();

  // ---- the panel ----
  check(
    'the panel at the side opens, under its tab, which says how many there are',
    (await app.text('.side-tabs [data-kind="found"]')).replace(/\s+/g, ' ').trim() ===
      'Citations found 7',
    await app.text('.side-tabs [data-kind="found"]'),
  );
  const all = await rows();
  check(
    'the panel lists what was found, in the order of the text',
    JSON.stringify(all) ===
      JSON.stringify([
        '(Nagy 1979, 73)',
        '(Lord 1960)',
        '(Finley 1954)',
        '[@parry1971, 12]',
        'Nagy 1979, 73',
        'Lord 1960, 12',
        'Lord 1960',
      ]),
    JSON.stringify(all),
  );
  check(
    'the first is looked at',
    (await current()) === '(Nagy 1979, 73)' && (await marked()) === '(Nagy 1979, 73)',
  );
  const passage = await app.text(`${P} .passage`);
  check(
    'in the sentence it stands in',
    /^The wrath is that of a hero \(Nagy 1979, 73\), and the song/.test(passage),
    passage,
  );
  check('with what it was found by', (await app.text(`${P} .by`)) === 'Made by Zotero');
  const position = await app.text(`${P} .position`);
  check('and where in the list it stands', position === '1 of 7', position);
  // The text of the map is open beside the panel: the one that is looked at is shown there.
  check(
    'the element it stands in is given its editor in the text, where it is selected',
    (await app.count('.text-view .ProseMirror.body')) === 1,
    String(await app.count('.text-view .ProseMirror.body')),
  );
  await app.screenshot('found-2-panel');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('found-2-panel-dark');
  await app.setTheme('light');

  // Where the library has the work, what is proposed is tried in found.mjs; here the writer finds it.
  const proposed = await app.exec(`return !!document.querySelector('${P} .item .authors')`);
  if (!proposed) {
    check(
      'without a reference for the work, no citation can be made',
      (await disabled('Make it a citation')) === true,
    );
    await find({ query: 'Nagy 1979', title: 'The Best of the Achaeans' });
  }
  const work = await app.text(`${P} .item .what`);
  check(
    'the work has its reference, as references are shown where they are chosen',
    /Nagy\s+1979\s+The Best of the Achaeans/.test(work),
    work,
  );
  const locator = await app.exec(
    `return document.querySelector('${P} .item .locator input').value`,
  );
  check('with the page the file gave', locator === '73', locator);
  check('a citation can now be made', (await disabled('Make it a citation')) === false);

  // Words before it, as in the editor of citations.
  await app.click(`${P} .item .prefix input`);
  await app.keys('see');
  await app.screenshot('found-3-chosen');
  await app.press('Enter');
  await sleep(500);
  check(
    'Enter makes the citation, in the text',
    JSON.stringify(await citationsInText()) === '["(see Nagy 1979, 73)"]',
    JSON.stringify(await citationsInText()),
  );
  check('its text is no longer marked', (await foundInText()) === 3, String(await foundInText()));
  check(
    'and the next is shown',
    (await current()) === '(Lord 1960)' && (await rows()).length === 6,
    await current(),
  );

  // ---- later, and the arrows ----
  await press(await button('Later'));
  await sleep(200);
  check(
    'Later goes on to the next, and nothing is changed',
    (await current()) === '(Finley 1954)' && (await rows()).length === 6,
  );
  await app.press('ArrowUp');
  await sleep(150);
  check('the arrows go through the list', (await current()) === '(Lord 1960)', await current());

  // ---- left as text ----
  await press(await button('Leave it as text'));
  await sleep(500);
  check(
    'left as text, it is no longer among them',
    JSON.stringify(await rows()).includes('(Lord 1960)') === false && (await rows()).length === 5,
  );
  check(
    'nor marked in the text, where it stands as it stood',
    (await foundInText()) === 2 &&
      /a singer \(Lord 1960\) who composes/.test(await app.text('.text-view .prose.body')),
  );
  check('the next is shown', (await current()) === '(Finley 1954)', await current());

  // ---- undone ----
  await app.keys(['Control', 'z']);
  await sleep(700);
  check(
    'Ctrl+Z in the panel takes it back, and shows what came back',
    (await rows()).length === 6 && (await current()) === '(Lord 1960)',
    await current(),
  );
  check('in the text as well', (await foundInText()) === 3);
  await app.keys(['Control', 'z']);
  await sleep(700);
  check(
    'and once more the citation that was made, as one step',
    (await citationsInText()).length === 0 &&
      (await rows()).length === 7 &&
      (await current()) === '(Nagy 1979, 73)',
    await current(),
  );
  await app.keys(['Control', 'Shift', 'z']);
  await sleep(700);
  check(
    'which is made again by Ctrl+Shift+Z',
    JSON.stringify(await citationsInText()) === '["(see Nagy 1979, 73)"]' &&
      (await rows()).length === 6,
  );

  // ---- a tag ----
  await pick('[@parry1971, 12]');
  await sleep(250);
  check('a tag is said to be one', (await app.text(`${P} .by`)) === 'A tag that names a reference');

  // ---- a work the library does not have ----
  await pick('(Finley 1954)');
  await sleep(250);
  const unknown = await app.text(`${P} .item .what`);
  check(
    'of a work the library does not have, what the file says of it is shown',
    /Finley 1954, The World of Odysseus/.test(unknown),
    unknown,
  );
  check('and it can be added to the library', await app.exists(`${P} .mean + .mean`));

  // ---- in a note ----
  await pick('Nagy 1979, 73');
  await sleep(400);
  check(
    'what stands in a note is shown in the note',
    /^See Nagy 1979, 73; but he argues otherwise\.$/.test(await app.text(`${P} .passage`)),
    await app.text(`${P} .passage`),
  );
  check(
    'and the note is opened in the text beside it',
    /^note/.test((await selectedInText()) ?? ''),
    String(await selectedInText()),
  );
  const choices = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('${P} .in-note input[type=radio]')).map((i) => (i.checked ? 'x' : '-') + (i.disabled ? 'd' : ''))`,
    );
  check(
    'where the note says more, the citation is given to stand in the note',
    JSON.stringify(await choices()) === '["-","x"]',
    JSON.stringify(await choices()),
  );
  if (!(await app.exists(`${P} .item .authors`)))
    await find({ query: 'Nagy 1979', title: 'The Best of the Achaeans' });
  await app.screenshot('found-4-note');
  const notesBefore = await notesInText();
  await press(await app.exec(`return document.querySelector('${P} .in-note input[type=radio]')`));
  await sleep(200);
  const said = await app.text(`${P} .in-note .choice .hint`);
  check(
    'the writer can have the note become a citation, and is told what becomes of its words',
    /“See” before, “; but he argues otherwise” after/.test(said),
    said,
  );
  await press(await button('Make it a citation'));
  await sleep(600);
  check(
    'the note becomes a citation',
    (await notesInText()) === notesBefore - 1,
    `${await notesInText()} of ${notesBefore}`,
  );
  const made = await citationsInText();
  check(
    'with what it said before and after its work',
    made.some((c) =>
      /See Nagy 1979, 73 ; but he argues otherwise|See Nagy 1979, 73; but he argues otherwise/.test(
        c,
      ),
    ),
    JSON.stringify(made),
  );

  check(
    'a note that is a citation and nothing else is given to become one',
    (await current()) === 'Lord 1960, 12' && JSON.stringify(await choices()) === '["x","-"]',
    `${await current()} ${JSON.stringify(await choices())}`,
  );
  if (!(await app.exists(`${P} .item .authors`)))
    await find({ query: 'Lord 1960', title: 'The Singer of Tales' });
  await press(
    await app.exec(`return document.querySelectorAll('${P} .in-note input[type=radio]')[1]`),
  );
  await sleep(200);
  await press(await button('Make it a citation'));
  await sleep(600);
  const notes = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .prose.body .footnote')).map((e) => e.getAttribute('title'))`,
  );
  check(
    'the citation stands in the note, which stays a note',
    notes.length === notesBefore - 1 && notes.includes('(Lord 1960, 12).'),
    JSON.stringify(notes),
  );

  check(
    'the next is the note that holds a formula',
    (await current()) === 'Lord 1960',
    await current(),
  );
  check(
    'which cannot become a citation',
    JSON.stringify(await choices()) === '["-d","x"]',
    JSON.stringify(await choices()),
  );
  const why = await app.text(`${P} .in-note .choice.off .hint`);
  check('and the panel says why', /The note holds a formula/.test(why), why);
  await app.screenshot('found-5-formula');

  // ---- what is taken for citations ----
  const boxes = await app.exec(
    `return Array.from(document.querySelectorAll('${P} .taken label.check')).map((l) => l.textContent.trim() + ':' + l.querySelector('input').checked)`,
  );
  check(
    'what is taken for citations is said at the top, and is what the writer has said',
    JSON.stringify(boxes) ===
      '["Parentheses with a year in them:false","Notes that name a work of the library:false","Every note:false"]',
    JSON.stringify(boxes),
  );
  await press(await app.exec(`return document.querySelector('${P} .taken label.check input')`));
  await sleep(900);
  const kept = JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8'));
  check(
    'it is kept with the settings',
    kept.found?.years === true && kept.found?.notes === false,
    JSON.stringify(kept.found),
  );

  // ---- closed, and opened by pressing what was found ----
  let left = await rows();
  await closePanel();
  await app.click(
    '.text-view .prose .found[data-found-id="d1b2c3d4e5f6"], .text-view .prose .found[data-found*="d1b2c3d4e5f6"]',
  );
  await opened();
  check(
    'pressing what was found in the text opens the panel at that one',
    (await current()) === '[@parry1971, 12]',
    await current(),
  );
  check(
    'with what was left',
    JSON.stringify(await rows()) === JSON.stringify(left),
    JSON.stringify(await rows()),
  );
  await closePanel();

  // ---- while the text is being written in ----
  await app.click('.text-view .section .prose.body p:first-child');
  await app.waitFor('.text-view .ProseMirror.body', 5000);
  await sleep(400);
  check(
    'where the text is written, what was found is marked as well',
    (await app.count('.text-view .ProseMirror.body .found:not(.left)')) === 3,
  );
  await app.click('.text-view .ProseMirror.body .found[data-by="key"]');
  await opened();
  check(
    'pressed there, it opens the panel at that one',
    (await current()) === '[@parry1971, 12]',
    await current(),
  );
  if (!(await app.exists(`${P} .item .authors`)))
    await find({ query: 'parry1971', title: 'The Making of Homeric Verse' });
  await press(await button('Make it a citation'));
  await sleep(600);
  const inEditor = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .ProseMirror.body .citation')).map((e) => e.textContent)`,
  );
  check(
    'the citation is made in the text that is being written in',
    inEditor.includes('(Parry 1971, 12)'),
    JSON.stringify(inEditor),
  );
  check(
    'whose marks are those that are left',
    (await app.count('.text-view .ProseMirror.body .found:not(.left)')) === 2,
  );
  await app.keys(['Control', 'z']);
  await sleep(700);
  check(
    'and taken back by Ctrl+Z',
    (await app.count('.text-view .ProseMirror.body .found:not(.left)')) === 3 &&
      (await current()) === '[@parry1971, 12]',
    await current(),
  );
  await app.keys(['Control', 'Shift', 'z']);
  await sleep(700);
  left = await rows();
  check(
    'and made again',
    left.length === 3 && (await app.count('.text-view .ProseMirror.body .found:not(.left)')) === 2,
    JSON.stringify(left),
  );
  await closePanel();

  // ---- opened again later ----
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 8000);
  await sleep(800);
  await app.clickText('.card h3', 'Homer');
  await app.waitFor('.text-view .section, .diagram .node.root', 8000);
  await sleep(500);
  await app.thisMap('Citations that were found…');
  await opened();
  check(
    'opened again later, the panel has what was left',
    JSON.stringify(await rows()) === JSON.stringify(left),
    JSON.stringify(await rows()),
  );

  // ---- nothing to go through ----
  for (let i = 0; i < left.length; i++) {
    await press(await button('Leave it as text'));
    await sleep(350);
  }
  await app.waitForText(P, 'Nothing to go through', 5000);
  const nothing = await app.text(`${P} .nothing`);
  check(
    'when nothing is left, the panel says so, and what could be turned on',
    /Nothing to go through/.test(nothing) && /More can be taken for citations/.test(nothing),
    nothing,
  );
  check(
    'and the tab counts none',
    (await app.text('.side-tabs [data-kind="found"]')).replace(/\s+/g, ' ').trim() ===
      'Citations found',
    await app.text('.side-tabs [data-kind="found"]'),
  );
  await app.screenshot('found-6-nothing');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('found-6-nothing-dark');
  await app.setTheme('light');
  await closePanel();

  const errors = await app.pageErrors();
  check('no errors in the panel', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  check(`the script ran to its end: ${error.message}`, false);
  await app.screenshot('found-panel-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
