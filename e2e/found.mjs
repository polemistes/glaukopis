// Citations that were found in documents that are brought in, gone through
// in the window: documents with citations made by Zotero and Mendeley, and
// with tags, against a library that has some of the works.

import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

const documents = join(root, 'crates/core/tests/documents');

// The library: Nagy came from Zotero and has the key of his item; West is
// there without it, and without his DOI; Lord is not there at all.
const LIBRARY = `
@book{nagy1979,
  author    = {Nagy, Gregory},
  title     = {The Best of the {Achaeans}},
  subtitle  = {Concepts of the Hero in Archaic {Greek} Poetry},
  publisher = {Johns Hopkins University Press},
  address   = {Baltimore},
  year      = {1979},
  glaukopis-zotero = {ABCD2345},
}
@article{west1988,
  author  = {West, M. L.},
  title   = {The Rise of the {Greek} Epic},
  journal = {Journal of Hellenic Studies},
  volume  = {108},
  year    = {1988},
  pages   = {151--172},
}
@book{parry1971,
  author    = {Parry, Milman},
  title     = {The Making of {Homeric} Verse},
  publisher = {Clarendon Press},
  address   = {Oxford},
  year      = {1971},
}
@article{janko1998,
  author  = {Janko, Richard},
  title   = {The {Homeric} Poems as Oral Dictated Texts},
  journal = {The Classical Quarterly},
  volume  = {48},
  year    = {1998},
  pages   = {1--13},
}
`;

// Text in which nothing is marked, for what only looks like a citation.
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-found-'));
writeFileSync(
  join(desk, 'looks.md'),
  `---
title: What looks like citations
---

The wrath is that of a hero (Nagy 1979, 73), and the verse is made of formulas (Parry 1971). As Janko (1998, 3) says, it was written down.

Not all agree.[^1] And so it stands.[^2] Or so it is said.[^3]

[^1]: See Nagy, Best of the Achaeans, 73; but cf. Lord, Singer of Tales, 12, who argues otherwise.
[^2]: West, The Rise of the Greek Epic, 151.
[^3]: A note that says something, and cites nothing at all.
`,
);

const app = await App.launch({ width: 1400, height: 920 });
try {
  await app.installErrorHook();
  const invoke = (command, args = {}) =>
    app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
  const drop = (paths, x, y) =>
    app.execAsync(
      `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
       const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
       await emit('tauri://drag-enter', { paths: arguments[0], position });
       await emit('tauri://drag-over', { position });
       await emit('tauri://drag-drop', { paths: arguments[0], position });`,
      paths,
      x,
      y,
    );
  const dropOnProject = async (path) => {
    const at = await app.exec(
      `const r = document.querySelector('.project .work .panes').getBoundingClientRect();
       return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
    );
    await drop([path], at.x, at.y);
    await app.waitFor('dialog [data-fact="words"]', 20000);
    await sleep(250);
  };
  const library = () => readFileSync(join(app.dataDir, 'library', 'library.bib'), 'utf8');
  const press = (el) => app.cmd('POST', '/execute/sync', { script: 'arguments[0].click()', args: [el] });

  // ---- what the window shows ----
  const W = 'dialog .found-window';
  const rows = () =>
    app.exec(`return Array.from(document.querySelectorAll('${W} .row')).map((e) => e.querySelector('.text').textContent.trim() + ' | ' + e.dataset.sure)`);
  const current = () =>
    app.exec(`const r = document.querySelector('${W} .row.current .text'); return r ? r.textContent.trim() : null`);
  /** The works of the one that is looked at: what each is taken for, and how sure that is. */
  const works = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('${W} .item')).map((e) => {
         const t = (s) => { const x = e.querySelector(s); return x ? x.textContent.replace(/\\s+/g, ' ').trim() : ''; };
         return {
           what: t('.what'),
           sure: t('.sure'),
           prefix: e.querySelector('.prefix input').value,
           locator: e.querySelector('.locator input').value,
           label: e.querySelector('.locator select').value,
           suffix: e.querySelector('.suffix input').value,
           year: !!(e.querySelector('.check input') || {}).checked,
           means: Array.from(e.querySelectorAll('.mean')).map((b) => b.textContent.trim()),
           others: Array.from(e.querySelectorAll('.other')).map((b) => b.textContent.replace(/\\s+/g, ' ').trim()),
         };
       })`,
    );
  /** What can be done about a work of the one that is looked at: the button that says so. */
  const mean = (work, words) =>
    app.exec(
      `const item = document.querySelectorAll('${W} .item')[arguments[0]];
       return Array.from(item ? item.querySelectorAll('.mean') : []).find((b) => b.textContent.trim() === arguments[1]) || null`,
      work,
      words,
    );
  const button = (words) =>
    app.exec(
      `return Array.from(document.querySelectorAll('${W}').length ? document.querySelector('${W}').closest('dialog').querySelectorAll('footer button') : []).find((b) => b.textContent.trim() === arguments[0]) || null`,
      words,
    );
  const disabled = async (words) => {
    const b = await button(words);
    return b ? app.cmd('POST', '/execute/sync', { script: 'return arguments[0].disabled', args: [b] }) : null;
  };
  const show = async (words) => {
    await app.clickText(`${W} .row`, words);
    await sleep(250);
  };
  const atOnce = () =>
    app.exec(`const b = Array.from(document.querySelectorAll('${W} .taken button')).find((b) => /certain/.test(b.textContent)); return b ? b.textContent.replace(/\\s+/g, ' ').trim() : null`);
  const closeWindow = async () => {
    await app.exec(`document.querySelector('${W} .list, ${W}').focus()`);
    await app.press('Escape');
    await app.waitGone(W);
    await sleep(300);
  };
  const openWindow = async () => {
    await app.thisMap('Citations that were found…');
    await app.waitFor(W, 8000);
    await sleep(700);
  };

  // ---- what the text has ----
  const inText = () =>
    app.exec(
      `const body = Array.from(document.querySelectorAll('.text-view .prose.body'));
       const all = (s) => body.flatMap((b) => Array.from(b.querySelectorAll(s)));
       return {
         citations: all('.citation').map((e) => e.textContent),
         found: [...new Set(all('.found:not(.left)').map((e) => e.dataset.foundId || e.dataset.found))].length,
         // A blank that does not break, as Pandoc sets after "cf.", is a blank.
         notes: all('.footnote').map((e) => (e.getAttribute('title') || '').replace(/\\s+/g, ' ')),
         text: body.map((b) => b.textContent).join(' ').replace(/\\s+/g, ' '),
       };`,
    );
  const tabs = () => app.mapNames();
  const fact = (name) =>
    app.exec(`const e = document.querySelector('dialog [data-fact="' + arguments[0] + '"]'); return e ? e.textContent.replace(/\\s+/g, ' ').trim() : null`, name);
  const choice = (name) =>
    app.exec(`const e = document.querySelector('dialog input[data-choice="' + arguments[0] + '"]'); return e ? e.checked : null`, name);

  // ---- the preview ----
  const source = () => {
    const work = join(app.dataDir, 'work');
    const project = readdirSync(work)[0];
    return readFileSync(join(work, project, 'preview', 'document.typ'), 'utf8');
  };
  const style = async (id) => {
    const before = source();
    await app.exec(
      `const s = document.querySelector('.preview select[aria-label="Reference style"]');
       s.value = arguments[0];
       s.dispatchEvent(new Event('change', { bubbles: true }));`,
      id,
    );
    await until(`the preview in the style ${id}`, async () => source() !== before, 20000).catch(() => {});
    await sleep(1200);
    return source();
  };

  await invoke('import_apply', { plan: await invoke('import_bib_text', { text: LIBRARY }) });
  check('an entry of the library has the key of its item in Zotero', /glaukopis-zotero\s*=\s*\{ABCD2345\}/.test(library()));

  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Homer');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);

  // =====================================================================
  // A file of text with tags
  // =====================================================================
  await dropOnProject(join(documents, 'tags.md'));
  check('of a document with tags, the dialog says how many citations were found', (await fact('found')) === '3 citations were found.', await fact('found'));
  check('none of them made by a program: nothing is offered to be made at once', (await choice('at-once')) === null && (await choice('go-through')) === true);
  check('the tags the library has are citations already', /cited 6 times/.test(await fact('cited')), await fact('cited'));
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitFor(W, 15000);
  await sleep(700);
  check('when the map is made, the window opens for it', JSON.stringify(await tabs()) === '["Homer","The wrath, cited by tags"]', JSON.stringify(await tabs()));
  const tagged = await rows();
  check(
    'with the tags that name a work the library does not have',
    JSON.stringify(tagged) ===
      JSON.stringify([
        // Long ones are shortened in the list.
        '[see @nagy1979, chap. 2; @lord1960; -@west1988, 12 and… | none',
        '[@lord1960, 12] | none',
        '@lord1960 | none',
      ]),
    JSON.stringify(tagged),
  );
  let w = await works();
  check(
    'of the works of one, those the library has are certain by their tag',
    w.length === 3 && /^Nagy 1979 The Best of the Achaeans/.test(w[0].what) && /^Certain · the same citation key/.test(w[0].sure) && /^West 1988/.test(w[2].what) && /^Certain/.test(w[2].sure),
    JSON.stringify(w.map((x) => [x.what, x.sure])),
  );
  check('and the one it does not have is said to be a tag that no reference has', /^lord1960 is a tag that no reference of your library has\.$/.test(w[1].what), w[1].what);
  check(
    'with the places, and the words before and after, as the tags had them',
    w[0].prefix === 'see' && w[0].locator === '2' && w[0].label === 'chapter' && w[2].locator === '12' && w[2].suffix === 'and elsewhere' && w[2].year === true,
    JSON.stringify(w),
  );
  check('no citation can be made while a work has no reference', (await disabled('Make it a citation')) === true);
  await app.screenshot('found-doc-1-tags');
  await closeWindow();
  check('closed, all are left in the text', (await inText()).found === 3, JSON.stringify(await inText()));

  // =====================================================================
  // A Word file with citations made by Zotero and Mendeley
  // =====================================================================
  await dropOnProject(join(documents, 'cited.docx'));
  check(
    'of a document written with Zotero, the dialog says how many were found, and that a program made them',
    (await fact('found')) === '5 citations were found, all made by a program that keeps references.',
    await fact('found'),
  );
  check('those that are certain are to be made citations at once, and the rest gone through', (await choice('at-once')) === true && (await choice('go-through')) === true);
  await app.screenshot('found-doc-2-dialog');
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitFor(W, 15000);
  await sleep(700);
  let text = await inText();
  check(
    'made at once: those of which the library has every work by the key of its item',
    JSON.stringify(text.citations) === '["(Nagy 1979, 73)"]' && text.notes.some((n) => n === 'See (Nagy 1979, 73); but he says otherwise elsewhere.'),
    JSON.stringify([text.citations, text.notes]),
  );
  let list = await rows();
  check(
    'the window opens with the rest',
    JSON.stringify(list) ===
      JSON.stringify([
        '(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere) | none',
        '(Lord, The Singer of Tales, 12) | none',
        '(West 1988) | likely',
      ]),
    JSON.stringify(list),
  );
  check('which are marked in the text', text.found === 3, String(text.found));
  w = await works();
  check(
    'a work the library has by the key of its item is certain, and why is said',
    /^Nagy 1979 The Best of the Achaeans/.test(w[0].what) && /^Certain · the same item in Zotero/.test(w[0].sure),
    JSON.stringify([w[0].what, w[0].sure]),
  );
  check(
    'a work it has without the key is found by what the file says of it, and is likely',
    /^West 1988 The Rise of the Greek Epic/.test(w[1].what) && /^Likely · the same title, author and year/.test(w[1].sure),
    JSON.stringify([w[1].what, w[1].sure]),
  );
  check(
    'a work it does not have is shown as the file tells of it, and can be added',
    /^Lord 1960, The Singer of Tales was not found in your library\.$/.test(w[2].what) && w[2].means.includes('Add it to the library'),
    JSON.stringify([w[2].what, w[2].means]),
  );
  check(
    'what Zotero said of the places is there',
    w[0].prefix === 'see' && w[0].locator === '2' && w[0].label === 'chapter' && w[2].locator === '12' && w[2].suffix === 'and elsewhere' && w[2].year === true,
    JSON.stringify(w),
  );
  await app.screenshot('found-doc-3-window');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('found-doc-3-window-dark');
  await app.setTheme('light');

  // ---- a work is added to the library from what the file says ----
  await press(await mean(2, 'Add it to the library'));
  await app.waitForText('dialog h2', 'New reference', 8000);
  await sleep(600);
  const form = await app.exec(
    `const d = Array.from(document.querySelectorAll('dialog[open]')).find((d) => /New reference/.test(d.querySelector('h2').textContent));
     return {
       fields: Array.from(d.querySelectorAll('[data-field]')).map((f) => f.dataset.field),
       title: (d.querySelector('[data-field="title"] :is(input, textarea)') || {}).value,
       text: d.textContent.replace(/\\s+/g, ' '),
     };`,
  );
  check('the form has what the file says of the work, to be looked at before it is added', form.title === 'The Singer of Tales' && form.fields.includes('publisher'), JSON.stringify(form.fields));
  check('the key of the item is nothing to fill in', !form.fields.some((f) => /glaukopis/.test(f)) && !/glaukopis|QRST2345/.test(form.text), JSON.stringify(form.fields));
  await app.screenshot('found-doc-4-form');
  await app.clickText('dialog footer button', 'Add reference');
  await app.waitGone('dialog [data-field="title"]', 8000);
  await sleep(900);
  const entry = /@book\{([^,]+),[^@]*Singer of Tales[^@]*/.exec(library());
  check('the work is in the library', !!entry, entry?.[1]);
  check('with the key of its item in Zotero', /glaukopis-zotero\s*=\s*\{QRST2345\}/.test(entry?.[0] ?? ''));
  w = await works();
  check('and is what the work is taken for', /^Lord 1960 The Singer of Tales/.test(w[2].what) && (await disabled('Make it a citation')) === false, JSON.stringify([w[2].what, w[2].sure]));
  // The reference is changed from the window, as from a citation: the key stays with it.
  await press(await app.exec(`return document.querySelectorAll('${W} .item')[2].querySelector('button[aria-label="Edit the reference"]')`));
  await app.waitForText('dialog h2', 'Edit reference', 8000);
  await sleep(600);
  const edited = await app.exec(
    `const d = Array.from(document.querySelectorAll('dialog[open]')).find((d) => /Edit reference/.test(d.querySelector('h2').textContent));
     return Array.from(d.querySelectorAll('[data-field]')).map((f) => f.dataset.field);`,
  );
  check('where the reference is changed, the key of the item is nothing to fill in either', edited.includes('title') && !edited.some((f) => /glaukopis/.test(f)), JSON.stringify(edited));
  await app.exec(
    `const d = Array.from(document.querySelectorAll('dialog[open]')).find((d) => /Edit reference/.test(d.querySelector('h2').textContent));
     const i = d.querySelector('[data-field="location"] :is(input, textarea)'); i.focus(); i.select();`,
  );
  await app.keys('Cambridge, Mass.');
  await app.clickText('dialog footer button', 'Save');
  await app.waitGone('dialog [data-field="title"]', 8000);
  await sleep(900);
  const after = /@book\{lord1960,[^@]*/.exec(library())?.[0] ?? '';
  check('and is kept when the reference is changed', /Cambridge, Mass\./.test(after) && /glaukopis-zotero\s*=\s*\{QRST2345\}/.test(after), after.replace(/\s+/g, ' '));
  list = await until('the library to be asked again', async () => {
    const now = await rows();
    return now[1] === '(Lord, The Singer of Tales, 12) | certain' ? now : null;
  }).catch(() => rows());
  check('the library is asked again: the other citation of the work is certain now', list[1] === '(Lord, The Singer of Tales, 12) | certain', JSON.stringify(list));

  // ---- one is accepted ----
  await app.exec(`document.querySelector('${W} .list').focus()`);
  await app.press('Enter');
  await sleep(600);
  text = await inText();
  check(
    'accepted by Enter, it is a citation of its three works',
    text.citations.includes('(see Nagy 1979, ch. 2; West 1988; 1960, 12 and elsewhere)'),
    JSON.stringify(text.citations),
  );
  check('and the next is shown', (await current()) === '(Lord, The Singer of Tales, 12)', await current());
  w = await works();
  check('certain by the key of its item', /^Certain · the same item in Zotero/.test(w[0].sure), w[0].sure);

  // ---- one is left as text ----
  await press(await button('Leave it as text'));
  await sleep(600);
  text = await inText();
  check('left as text, it stands as it stood, in italics where it was', /The singer \(Lord, The Singer of Tales, 12\) is another matter/.test(text.text) && text.found === 1, JSON.stringify([text.found, text.text.slice(0, 300)]));

  // ---- one is changed by the picker ----
  check('what Mendeley made is said to be so', /^Made by Mendeley/.test(await app.text(`${W} .by`)) && (await current()) === '(West 1988)');
  await press(await mean(0, 'Another…'));
  await app.waitFor('.picker input');
  await sleep(350);
  const query = await app.exec(`return document.querySelector('.picker input').value`);
  check('the picker has the words of the work in its search', query === 'West 1988', query);
  await app.exec(`const i = document.querySelector('.picker input'); i.select();`);
  await app.keys('janko');
  await sleep(400);
  await app.press('Enter');
  await app.waitGone('.picker');
  await sleep(300);
  w = await works();
  check('another reference is chosen by it', /^Janko 1998/.test(w[0].what) && /^Chosen by you/.test(w[0].sure), JSON.stringify([w[0].what, w[0].sure]));
  check('and the one the library proposed can be taken again', w[0].others.some((o) => /West 1988/.test(o)), JSON.stringify(w[0].others));
  await app.exec(`document.querySelector('${W} .list').focus()`);
  await app.press('Enter');
  await sleep(600);
  text = await inText();
  check('and cited', text.citations.includes('(Janko 1998)') && text.found === 0, JSON.stringify(text.citations));
  await app.waitForText(W, 'Nothing to go through', 5000);
  await app.screenshot('found-doc-5-nothing');
  await closeWindow();

  // =====================================================================
  // An OpenDocument file, with nothing made at once
  // =====================================================================
  await dropOnProject(join(documents, 'cited.odt'));
  check('of an OpenDocument file written with Zotero, the dialog says the same', (await fact('found')) === '4 citations were found, all made by a program that keeps references.', await fact('found'));
  await press(await app.exec(`return document.querySelector('dialog input[data-choice="at-once"]')`));
  await sleep(700);
  check('the writer can say that none are to be made at once, which is kept with the settings', JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8')).found?.atOnce === false);
  await app.exec(`const i = document.querySelector('dialog input'); i.focus(); i.select();`);
  await app.keys('The wrath, from LibreOffice');
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitFor(W, 15000);
  await sleep(900);
  text = await inText();
  list = await rows();
  check(
    'then all that were found are gone through',
    text.citations.length === 0 &&
      JSON.stringify(list) ===
        JSON.stringify([
          '(Nagy 1979, 73) | certain',
          '(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere) | likely',
          '(Lord, The Singer of Tales, 12) | certain',
          'Nagy, The Best of the Achaeans, 73 | certain',
        ]),
    JSON.stringify([text.citations, list]),
  );

  // ---- all that are certain, at once ----
  check('a button says how many are certain', (await atOnce()) === 'Make citations of the 3 that are certain', await atOnce());
  await app.clickText(`${W} .taken button`, 'that are certain');
  await sleep(900);
  text = await inText();
  list = await rows();
  check(
    'it makes citations of them all, and of no other',
    JSON.stringify(text.citations) === '["(Nagy 1979, 73)","(Lord 1960, 12)"]' &&
      text.notes.includes('See (Nagy 1979, 73); but he says otherwise elsewhere.') &&
      JSON.stringify(list) === '["(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere) | likely"]',
    JSON.stringify([text, list]),
  );
  await app.exec(`document.querySelector('${W} .list').focus()`);
  await app.keys(['Control', 'z']);
  await sleep(900);
  text = await inText();
  check('Ctrl+Z takes them back as one step', text.citations.length === 0 && text.found === 3 && (await rows()).length === 4, JSON.stringify([text.citations, text.found, await rows()]));

  // ---- a citation in a note, both ways ----
  await show('Nagy, The Best of the Achaeans, 73');
  const ways = () =>
    app.exec(`return Array.from(document.querySelectorAll('${W} .in-note input[type=radio]')).map((i) => (i.checked ? 'x' : '-') + (i.disabled ? 'd' : ''))`);
  check('in a note that says more, the citation is given to stand in the note', JSON.stringify(await ways()) === '["-","x"]', JSON.stringify(await ways()));
  check('the note is shown, with its words in the text before it', /^See Nagy, The Best of the Achaeans, 73; but he says otherwise elsewhere\.$/.test(await app.text(`${W} .passage`)) && /Not all agree\.\s*note$/.test(await app.text(`${W} .outer`)), await app.text(`${W} .outer`));
  await press(await button('Make it a citation'));
  await sleep(700);
  text = await inText();
  check('the citation stands in the note, which stays a note', JSON.stringify(text.notes) === '["See (Nagy 1979, 73); but he says otherwise elsewhere."]' && text.citations.length === 0, JSON.stringify(text));
  await app.exec(`document.querySelector('${W} .list').focus()`);
  await app.keys(['Control', 'z']);
  await sleep(900);
  check('taken back, it is looked at again', (await current()) === 'Nagy, The Best of the Achaeans, 73', await current());
  await press(await app.exec(`return document.querySelector('${W} .in-note input[type=radio]')`));
  await sleep(250);
  const said = await app.text(`${W} .in-note .choice .hint`);
  check('the note can become a citation, and what becomes of its words is said', /“See” before, “; but he says otherwise elsewhere” after/.test(said), said);
  await app.screenshot('found-doc-6-note');
  await press(await button('Make it a citation'));
  await sleep(700);
  text = await inText();
  check(
    'the note becomes a citation, with what it said before and after its work',
    text.notes.length === 0 && text.citations.some((c) => /^\(See Nagy 1979, 73 ?; but he says otherwise elsewhere\)$/.test(c)),
    JSON.stringify(text),
  );

  // ---- the preview ----
  await closeWindow();
  await app.click('header button[aria-label="Preview and export"]');
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  const styles = await app.exec(`return Array.from(document.querySelectorAll('.preview select[aria-label="Reference style"] option')).map((o) => o.value)`);
  const was = await app.exec(`return document.querySelector('.preview select[aria-label="Reference style"]').value`);
  let typ = source();
  const around = (t, words) => {
    const at = t.indexOf(words);
    return at < 0 ? '' : t.slice(Math.max(0, at - 200), at + 260).replace(/\s+/g, ' ');
  };
  console.log(`      in ${was}: ${around(typ, 'Not all agree')}`);
  check(
    'in a style of notes, the citation that was made of the note is set as a note, with its words before and after',
    // Between the page and words that begin with a sign of punctuation there is room, which is
    // for the one who writes what Pandoc is given to mend: both are taken here.
    was === 'chicago-notes-bibliography' && /Not all agree\.#footnote\[See Gregory Nagy,.*?73 ?\\?; but he says otherwise elsewhere\.?\]/.test(typ.replace(/\s+/g, ' ')),
    around(typ, 'Not all agree'),
  );
  const authorDate = styles.includes('chicago-author-date') ? 'chicago-author-date' : 'apa';
  typ = await style(authorDate);
  console.log(`      in ${authorDate}: ${around(typ, 'Not all agree')}`);
  check(
    'in a style of author and year, it is set in the line, apart from the word before it',
    /Not all agree\. \\?\(See Nagy,? 1979, (p\. )?73 ?\\?; but he says otherwise elsewhere\)/.test(typ.replace(/\s+/g, ' ')),
    around(typ, 'Not all agree'),
  );
  await app.screenshot('found-doc-7-preview');
  typ = await style(was);
  await app.click('header button[aria-label="Preview and export"]');
  await sleep(300);

  // ---- the rest, and what is left for later ----
  await openWindow();
  check('opened again, the window has what is left', (await rows()).length === 3, JSON.stringify(await rows()));
  await app.clickText(`${W} .taken button`, 'that are certain');
  await sleep(900);
  list = await rows();
  check('the rest that is certain is made at once', JSON.stringify(list) === '["(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere) | likely"]', JSON.stringify(list));
  check('what is only likely waits for the writer', (await atOnce()) === null && (await disabled('Make it a citation')) === false);
  await closeWindow();

  // ---- the tags, now that the library has the work ----
  await app.openMap('The wrath, cited by tags');
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);
  await app.click('.text-view .prose .found[data-by="key"]');
  await app.waitFor(W, 8000);
  await sleep(900);
  list = await rows();
  const key = entry?.[1] ?? '';
  console.log(`      the entry that was added has the tag ${key}`);
  if (key === 'lord1960') {
    check('the tags of a work that was added since are certain', list.every((r) => / \| certain$/.test(r)) && list.length === 3, JSON.stringify(list));
    check('pressing one in the text opens the window at it', (await current()) === list[0].split(' | ')[0], await current());
    await app.clickText(`${W} .taken button`, 'that are certain');
    await sleep(900);
    text = await inText();
    check(
      'and are made citations at once, as the tags said them',
      text.found === 0 && text.citations.includes('(see Nagy 1979, ch. 2; Lord 1960; 1988, 12 and elsewhere)') && text.citations.includes('(Lord 1960, 12)') && text.citations.includes('Lord (1960)'),
      JSON.stringify(text.citations),
    );
  } else {
    check('the tags of a work that has another tag in the library wait for the writer', list.length === 3, JSON.stringify(list));
  }
  await closeWindow().catch(() => {});

  // ---- opened again later ----
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 8000);
  await sleep(900);
  await app.clickText('.card h3', 'Homer');
  await app.waitFor('.maps .map', 8000);
  await sleep(600);
  await app.openMap('The wrath, from LibreOffice');
  await sleep(600);
  await openWindow();
  list = await rows();
  check('when the project is opened again later, the window has what was left', JSON.stringify(list) === '["(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere) | likely"]', JSON.stringify(list));
  await closeWindow();

  // =====================================================================
  // A project that is made of a document
  // =====================================================================
  await app.click('header button[aria-label="All projects"]');
  await app.waitForText('h1', 'Projects');
  await sleep(900);
  {
    const among = await app.exec(
      `const r = document.querySelector('.home').getBoundingClientRect();
       return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
    );
    await drop([join(documents, 'cited.docx')], among.x, among.y);
    await app.waitFor('dialog [data-fact="words"]', 20000);
    await sleep(250);
  }
  check('among the projects, what was said of making citations at once is as it was left', (await choice('at-once')) === false && (await choice('go-through')) === true);
  await press(await app.exec(`return document.querySelector('dialog input[data-choice="at-once"]')`));
  await sleep(300);
  await app.clickText('dialog footer button', 'Make the project');
  await app.waitFor(W, 20000);
  await sleep(900);
  const named = await app.exec(`return document.title.replace(/^Glaukopis – /, '')`);
  list = await rows();
  text = await inText();
  check(
    'when a project is made of a document, the window opens in it for what is left',
    named === 'The wrath, cited' && JSON.stringify(list) === '["(see Nagy 1979, chap. 2; West 1988; 1960, 12 and elsewhere) | likely","(West 1988) | likely"]',
    JSON.stringify([named, list]),
  );
  check(
    'and what was certain is cited: more now, since the library has another of the works',
    JSON.stringify(text.citations) === '["(Nagy 1979, 73)","(Lord 1960, 12)"]' && text.notes.includes('See (Nagy 1979, 73); but he says otherwise elsewhere.'),
    JSON.stringify(text),
  );
  await closeWindow();
  await app.click('header button[aria-label="All projects"]');
  await app.waitForText('h1', 'Projects');
  await sleep(900);
  await app.clickText('.card h3', 'Homer');
  await app.waitFor('.maps .map', 8000);
  await sleep(600);

  // =====================================================================
  // What only looks like a citation
  // =====================================================================
  await dropOnProject(join(desk, 'looks.md'));
  check('of a text in which nothing was found, nothing is said of it, and nothing asked', (await fact('found')) === null && (await choice('go-through')) === null);
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitGone('dialog[open]', 15000);
  await app.waitFor('.text-view .section', 8000);
  await sleep(600);
  check('and no window opens when the map is made', !(await app.exists(W)));
  await openWindow();
  const nothing = await app.text(`${W} .nothing`);
  check('opened for it, the window has nothing to go through, and says what could be turned on', /Nothing to go through/.test(nothing) && /parentheses with a year in them, or notes/.test(nothing), nothing);
  const boxes = `${W} .taken label.check input`;
  const turn = async (n) => press(await app.exec(`return document.querySelectorAll('${boxes}')[${n}]`));
  const settled = async (what, n) => {
    await until(what, async () => (await rows()).length === n).catch(() => {});
    await sleep(400);
    return rows();
  };

  // ---- parentheses with a year in them ----
  await turn(0);
  list = await settled('parentheses with years to be proposed', 3);
  check(
    'with parentheses with a year turned on, they are proposed, and no notes',
    JSON.stringify(list) === JSON.stringify(['(Nagy 1979, 73) | likely', '(Parry 1971) | likely', 'Janko (1998, 3) | likely']),
    JSON.stringify(list),
  );
  await turn(1);
  list = await settled('notes that name a work to be proposed', 5);
  check(
    'with notes that name a work of the library turned on, those are proposed as well',
    JSON.stringify(list) ===
      JSON.stringify([
        '(Nagy 1979, 73) | likely',
        '(Parry 1971) | likely',
        'Janko (1998, 3) | likely',
        'See Nagy, Best of the Achaeans, 73; but cf. Lord, Singer of… | likely',
        'West, The Rise of the Greek Epic, 151. | likely',
      ]),
    JSON.stringify(list),
  );
  check('they are taken for citations by how they look, which is said', (await app.text(`${W} .by`)) === 'Taken for a citation by how it looks');
  check('nothing is marked in the text for it', (await inText()).found === 0);
  w = await works();
  check(
    'the reference is the one the library has for the words, which is likely and never certain, with the page',
    w.length === 1 && /^Nagy 1979 The Best of the Achaeans/.test(w[0].what) && /^Likely · Nagy, 1979 for “Nagy 1979”/.test(w[0].sure) && w[0].locator === '73',
    JSON.stringify(w),
  );
  check('so none can be made at once', (await atOnce()) === null);
  await app.screenshot('found-doc-8-looks');
  await app.exec(`document.querySelector('${W} .list').focus()`);
  await app.press('Enter');
  await sleep(700);
  text = await inText();
  check('one is accepted', JSON.stringify(text.citations) === '["(Nagy 1979, 73)"]' && /a hero \(Nagy 1979, 73\), and the verse/.test(text.text), JSON.stringify(text));
  check('and the next is shown, where it now stands', (await current()) === '(Parry 1971)' && /formulas \(Parry 1971\)\. As Janko/.test(await app.text(`${W} .passage`)), await app.text(`${W} .passage`));

  // ---- one is left as text ----
  await press(await button('Leave it as text'));
  await sleep(700);
  text = await inText();
  check('one is left as text: it stands as it stood, and is not marked', /formulas \(Parry 1971\)\. As/.test(text.text) && text.found === 0 && text.citations.length === 1, JSON.stringify(text));

  // ---- the author in the sentence ----
  check('the next has the author in the sentence', (await current()) === 'Janko (1998, 3)', await current());
  const inSentence = () => app.exec(`return document.querySelector('${W} .proposed .foot input[type=checkbox]').checked`);
  w = await works();
  check(
    'which the citation is to have as well: the name is part of it, and the page is there',
    (await inSentence()) === true && /^Janko 1998/.test(w[0].what) && w[0].locator === '3' && w[0].year === false,
    JSON.stringify([await inSentence(), w]),
  );
  await app.exec(`document.querySelector('${W} .list').focus()`);
  await app.press('Enter');
  await sleep(700);
  text = await inText();
  check('made a citation, it reads as the sentence did', text.citations.includes('Janko (1998, 3)') && /\. As Janko \(1998, 3\) says, it was written down\./.test(text.text), JSON.stringify(text));

  // ---- a note of a style of notes, both ways ----
  check('the next is a note that names two works', /^See Nagy, Best of the Achaeans, 73; but cf\. Lord/.test(await current()), await current());
  w = await works();
  check(
    'parted at its semicolon into its works, each with its page and the words before and after it',
    w.length === 2 &&
      /^Nagy 1979 The Best/.test(w[0].what) && w[0].prefix === 'See' && w[0].locator === '73' && w[0].suffix === '' &&
      /^Lord 1960 The Singer/.test(w[1].what) && w[1].prefix === 'but cf.' && w[1].locator === '12' && w[1].suffix === ', who argues otherwise',
    JSON.stringify(w.map((x) => [x.what, x.sure, x.prefix, x.locator, x.suffix])),
  );
  check('as a note that was proposed as a whole, it is given to become a citation', JSON.stringify(await ways()) === '["x","-"]', JSON.stringify(await ways()));
  await app.screenshot('found-doc-9-note');
  const notesBefore = (await inText()).notes.length;
  await press(await app.exec(`return document.querySelectorAll('${W} .in-note input[type=radio]')[1]`));
  await sleep(250);
  await press(await button('Make it a citation'));
  await sleep(700);
  text = await inText();
  check(
    'one way, the citation stands in the note, which holds nothing else',
    text.notes.length === notesBefore && /^\(See Nagy 1979, 73; but cf\. Lord 1960, 12 ?, who argues otherwise\)$/.test(text.notes[0]),
    JSON.stringify(text.notes),
  );
  await app.exec(`document.querySelector('${W} .list').focus()`);
  await app.keys(['Control', 'z']);
  await until('the note to be proposed again', async () => /^See Nagy, Best of the Achaeans/.test((await current()) ?? ''), 6000).catch(() => {});
  await sleep(400);
  text = await inText();
  check('taken back, the note is as it was, and is looked at again', text.notes[0] === 'See Nagy, Best of the Achaeans, 73; but cf. Lord, Singer of Tales, 12, who argues otherwise.' && /^See Nagy, Best of the Achaeans/.test(await current()), JSON.stringify([text.notes, await current()]));
  check('as it was given', JSON.stringify(await ways()) === '["x","-"]', JSON.stringify(await ways()));
  await press(await button('Make it a citation'));
  await sleep(700);
  text = await inText();
  check(
    'the other way, the note becomes a citation of its two works',
    text.notes.length === notesBefore - 1 && text.citations.some((c) => /^\(See Nagy 1979, 73; but cf\. Lord 1960, 12 ?, who argues otherwise\)$/.test(c)) && /Not all agree\. \(See Nagy/.test(text.text),
    JSON.stringify(text),
  );

  // ---- every note ----
  list = await settled('what is left', 1);
  check('of the notes, those in which no work is named were not proposed', JSON.stringify(list) === '["West, The Rise of the Greek Epic, 151. | likely"]', JSON.stringify(list));
  await turn(2);
  list = await settled('every note to be proposed', 2);
  check(
    'with every note turned on, a note in which no work of the library is found is proposed as well, for the writer to find its work',
    JSON.stringify(list) === '["West, The Rise of the Greek Epic, 151. | likely","A note that says something, and cites nothing at all. | none"]',
    JSON.stringify(list),
  );
  await show('A note that says something');
  w = await works();
  check('with all its words as what names the work', w.length === 1 && /^A note that says something, and cites nothing at all\. was not found/.test(w[0].what) && (await disabled('Make it a citation')) === true, JSON.stringify(w));
  await press(await button('Leave it as text'));
  await sleep(700);
  check('left as text, the note stays a note', (await inText()).notes.includes('A note that says something, and cites nothing at all.') && (await rows()).length === 1, JSON.stringify(await inText()));
  const kept = JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8')).found;
  check('what is taken for citations is kept with the settings', kept.years === true && kept.named === true && kept.notes === true, JSON.stringify(kept));

  // ---- the preview ----
  await closeWindow();
  await app.click('header button[aria-label="Preview and export"]');
  await app.waitFor('.preview .page', 30000);
  await until('the preview of this map', async () => /What looks like citations/.test(source()), 20000).catch(() => {});
  await sleep(1200);
  typ = source().replace(/\s+/g, ' ');
  const shown = typ.slice(typ.indexOf('The wrath is that'), typ.indexOf('The wrath is that') + 900);
  console.log(`      the preview: ${shown}`);
  check(
    'the preview has the citations, as notes where the style has notes, and what was left as text as text',
    /a hero,?#footnote\[Gregory Nagy,.*?73\.?\]/.test(typ) && /Janko#footnote\[/.test(typ) && /Not all agree\.#footnote\[See (Gregory )?Nagy,.*?but cf\. (Albert B\. )?Lord,.*?12 ?, who argues otherwise\.?\]/.test(typ) && /formulas \(Parry 1971\)/.test(typ),
    shown,
  );
  await app.screenshot('found-doc-10-preview');
  await app.click('header button[aria-label="Preview and export"]');
  await sleep(300);

  // ---- opened anew ----
  await openWindow();
  list = await settled('what is left', 1);
  check(
    'opened anew, the window has what was put off, and what was left as text is not proposed again',
    JSON.stringify(list) === '["West, The Rise of the Greek Epic, 151. | likely"]',
    JSON.stringify(list),
  );
  await turn(0);
  // Every note first: while it is on, the notes that name a work are taken with it.
  await turn(2);
  await sleep(300);
  await turn(1);
  await sleep(900);
  check('turned off again, nothing is looked for', (await rows()).length === 0 && /Nothing to go through/.test(await app.text(`${W} .nothing`)));
  await closeWindow();

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('found-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
