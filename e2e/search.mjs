// Searching: in the text of a map, with the options and replacing; in the
// edit box of an element in the diagram; and through everything, in two
// projects.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    await sleep(100);
  }
}

const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
const data = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-'));
writeFileSync(
  join(desk, 'wrath.md'),
  `---
title: The wrath
---

Sing, goddess, the wrath of Achilles [@nagy1979, 73].

# One

The wrath that brought *countless* sorrows.^[A note about wrath and its kin.]

## One A

Deep under the first, where wrath sleeps.

# Two

Nothing here of the anger, and nothing of Pelée.

# Three

The Wrath returns, and the wrath of Pēleus' son.
`,
);

let app = await App.launch({ width: 1360, height: 900, dataDir: data });
try {
  await app.installErrorHook();
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.execAsync(
    `const plan = await window.__TAURI_INTERNALS__.invoke('import_bib_text', { text: arguments[0] });
     await window.__TAURI_INTERNALS__.invoke('import_apply', { plan });`,
    bib,
  );
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
  /** What the bar says of what was found. */
  const said = () => app.exec(`return document.querySelector('.search-bar .said')?.textContent.trim() ?? null`);
  /** How many are marked, and whether one is marked as the one shown. */
  const marked = () =>
    app.exec(
      `return { all: CSS.highlights.get('search')?.size ?? 0, current: CSS.highlights.get('search-current')?.size ?? 0, notes: document.querySelectorAll('.footnote.search-found, .footnote.search-current').length }`,
    );
  /** The name of the element the text of which has the selection, and what is selected. */
  const selected = () =>
    app.exec(`
      const s = document.querySelector('.text-view .section.selected');
      const pm = s && s.querySelector('[data-part="body"] .ProseMirror');
      const view = pm && pm.pmViewDesc;
      return { element: s ? s.querySelector('.heading').textContent.trim() : null };`);
  const section = (name) =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .prose.title')?.textContent ?? '').trim() === arguments[0]);
       if (!s) return null; s.dataset.named = arguments[0]; s.scrollIntoView({ block: 'center' }); return s.dataset.section;`,
      name,
    );
  /** Presses the mouse at a point of the window. */
  const clickAt = async (x, y) => {
    await app.cmd('POST', '/actions', {
      actions: [
        {
          type: 'pointer',
          id: 'mouse',
          parameters: { pointerType: 'mouse' },
          actions: [
            { type: 'pointerMove', origin: 'viewport', x, y },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ],
    });
    await app.cmd('DELETE', '/actions');
  };
  const names = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => (s.querySelector('.heading .prose.title')?.textContent ?? '').trim())`,
    );

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const at = await app.exec(
    `const r = document.querySelector('.project .work .panes').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }`,
  );
  await drop([join(desk, 'wrath.md')], at.x, at.y);
  await app.waitFor('dialog [data-fact="words"]', 15000);
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitGone('dialog[open]', 15000);
  await app.waitFor('.text-view .section', 8000);
  await sleep(600);
  check('the map is made of the document', (await names()).join('|') === 'The wrath|One|One A|Two|Three', (await names()).join('|'));

  // ---- One is folded, so that what is under it is hidden ----
  await section('One');
  await app.click('.text-view .section[data-named="One"] > .gutter .fold');
  await sleep(300);
  check('what is under One is folded away', !(await names()).includes('One A'));

  // ---- Ctrl+F, with the cursor at the beginning of the text ----
  await app.click('.text-view .section .body');
  await sleep(300);
  const left = await app.exec(
    `const r = document.querySelector('.text-view .section .body p').getBoundingClientRect(); return { x: Math.round(r.left + 1), y: Math.round(r.top + r.height / 2) }`,
  );
  await clickAt(left.x, left.y);
  await sleep(200);
  await app.keys(['Control', 'f']);
  await app.waitFor('.search-bar input', 3000);
  check('Ctrl+F opens the bar over the text', await app.exec(`return document.activeElement === document.querySelector('.search-bar input')`));
  await app.keys('wrath');
  await until('the search', async () => (await said())?.includes('of'), 4000);
  // The name of the centre stands before the cursor, which is at the beginning of its text.
  check('what is found is counted, and the first after the cursor is shown', (await said()) === '2 of 7', await said());
  let m = await marked();
  check('what is found is marked, the one shown more strongly', m.all >= 4 && m.current === 1, JSON.stringify(m));
  await app.screenshot('search-1-found');

  // ---- Enter goes on, through what is folded and into a note ----
  await app.press('Enter');
  await sleep(500);
  check('Enter shows the next', (await said()) === '3 of 7', await said());
  await app.press('Enter');
  await sleep(700);
  const note = await app.exec(`const p = document.querySelector('.note-panel .ProseMirror'); return p ? { text: p.textContent, marked: p.querySelector('.search-mark.current')?.textContent ?? null } : null`);
  check('in a note, the note is opened, and what was found is marked there', (await said()) === '4 of 7' && note?.marked === 'wrath', `${await said()} ${JSON.stringify(note)}`);
  check('and the bar keeps the cursor', await app.exec(`return document.activeElement === document.querySelector('.search-bar input')`));
  await app.screenshot('search-2-note');
  await app.press('Enter');
  await sleep(700);
  check('what is folded away is opened to show what was found in it', (await names()).includes('One A') && (await said()) === '5 of 7', `${(await names()).join('|')} ${await said()}`);
  check('and the note is closed again', !(await app.exists('.note-panel')));
  check('and it is given an editor, in which what was found is selected', await app.exec(`const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => s.querySelector('.heading').textContent.trim() === 'One A'); return !!s?.querySelector('[data-part="body"] .ProseMirror')`));
  await app.screenshot('search-3-unfolded');
  await app.keys(['Shift', 'Enter']);
  await sleep(500);
  check('Shift+Enter shows the one before', (await said()) === '4 of 7', await said());
  await app.press('Enter');
  await sleep(500);

  // ---- Escape leaves the cursor at what was found ----
  await app.press('Escape');
  await sleep(500);
  check('Escape closes the bar', !(await app.exists('.search-bar')));
  const sel = await app.exec(`const s = window.getSelection(); return { text: s.toString(), inEditor: !!(document.activeElement && document.activeElement.closest('.ProseMirror')) }`);
  check('and leaves the cursor at what was found, selected', sel.text === 'wrath' && sel.inEditor, JSON.stringify(sel));
  m = await marked();
  check('and takes the marks away', m.all === 0 && m.current === 0, JSON.stringify(m));

  // ---- the options ----
  const option = (label) => app.click(`.search-bar button[aria-label="${label}"]`);
  const searchFor = async (words) => {
    await app.exec(`const i = document.querySelector('.search-bar input'); i.focus(); i.select();`);
    await app.keys(words);
    await sleep(700);
    return said();
  };
  await app.keys(['Control', 'f']);
  await app.waitFor('.search-bar input', 3000);
  check('Ctrl+F opens the bar again, with the words that were selected', (await app.exec(`return document.querySelector('.search-bar input').value`)) === 'wrath');
  check('without whole words, a part of a word is found', /^\d of 7$/.test(await searchFor('wrat')), await said());
  await option('Whole words only');
  await sleep(700);
  check('and with them it is not', (await said()) === 'Nothing found', await said());
  await option('Whole words only');
  await searchFor('Wrath');
  await option('Capitals as they are written');
  await sleep(700);
  check('capitals as they are written', (await said()) === '1 of 1', await said());
  await option('Capitals as they are written');
  check('letters with accents are not found by letters without', (await searchFor('pelee')) === 'Nothing found', await said());
  await option('Letters with and without accents alike');
  await sleep(700);
  check('unless they are to be alike', (await said()) === '1 of 1', await said());
  await option('Letters with and without accents alike');
  await option('A regular expression');
  check('a regular expression that is not one is said to be so', (await searchFor('(wr')) === 'Not a regular expression', await said());
  check('a regular expression finds', /^\d of 7$/.test(await searchFor('wr[a-z]+h')), await said());
  await option('A regular expression');
  check('a citation is not searched as it is shown', (await searchFor('Nagy')) === 'Nothing found', await said());
  await option('Citations, formulas and cross-references as well');
  await sleep(800);
  const cited = await app.exec(`const c = document.querySelector('.text-view .citation.ProseMirror-selectednode, .text-view .citation.selected'); let marked = null; for (const r of CSS.highlights.get('search-current') ?? []) marked = r.toString(); return { said: document.querySelector('.search-bar .said').textContent.trim(), selected: !!c, marked }`);
  check('unless that is asked for: then it is found, marked, and selected in its editor', cited.said === '1 of 1' && cited.selected && cited.marked === 'Nagy', JSON.stringify(cited));
  await app.screenshot('search-4-labels');
  await option('Citations, formulas and cross-references as well');
  await app.press('Escape');
  await sleep(300);

  // ---- only in the selected text ----
  await section('Three');
  await app.click('.text-view .section[data-named="Three"] .body');
  await sleep(300);
  await app.keys(['Control', 'a']);
  await sleep(100);
  await app.keys(['Control', 'h']);
  await app.waitFor('.search-bar input', 3000);
  await searchFor('wrath');
  check('a search can be kept to the selected text', await app.exec(`return !document.querySelector('.search-bar button[aria-label="Only in the selected text"]').disabled`));
  await option('Only in the selected text');
  await sleep(700);
  check('and then finds only there', (await said()) === '1 of 2', await said());
  check('which is marked', (await app.exec(`return CSS.highlights.get('search-scope')?.size ?? 0`)) === 1);
  await app.exec(`const i = document.querySelectorAll('.search-bar input')[1]; i.focus(); i.select();`);
  await app.keys('rage');
  await app.clickText('.search-bar button', 'Replace all');
  await sleep(700);
  check('all in the selection are replaced', (await said()) === '2 replaced', await said());
  await option('Only in the selected text');
  await sleep(700);
  check('and nothing outside it', / of 5$/.test(await said()), await said());
  const three = await app.exec(`return Array.from(document.querySelectorAll('.text-view .section')).find((s) => s.querySelector('.heading').textContent.trim() === 'Three').querySelector('.body').textContent.trim()`);
  check('what replaces has the marks of what it replaces', three === 'The rage returns, and the rage of Pēleus’ son.', three);
  await app.screenshot('search-5-selection');

  // ---- replacing, and undoing all of it at once ----
  await app.exec(`const i = document.querySelectorAll('.search-bar input')[1]; i.focus(); i.select();`);
  await app.keys('anger');
  await app.press('Enter');
  await sleep(800);
  check('Enter in the field of what replaces replaces the one shown, and shows the next', / of 4$/.test(await said()), await said());
  await app.clickText('.search-bar button', 'Replace all');
  await sleep(800);
  check('Replace all replaces all', (await said()) === '4 replaced', await said());
  check('and nothing is found then', (await searchFor('wrath')) === 'Nothing found', await said());
  const italic = await app.exec(`return Array.from(document.querySelectorAll('.text-view .section em')).map((e) => e.textContent)`);
  check('the marks of the text are where they were', italic.includes('countless'), JSON.stringify(italic));
  await app.click('button[aria-label="Undo"]');
  await sleep(1000);
  check('one undo takes back all that Replace all did', /^(4 found|\d of 4)$/.test(await said()), await said());
  await app.click('button[aria-label="Undo"]');
  await sleep(1000);
  check('and the next undo the one replaced before it', /^(5 found|\d of 5)$/.test(await said()), await said());
  await app.screenshot('search-6-undone');
  await app.exec(`document.querySelector('.search-bar input').focus()`);
  await app.press('Escape');
  await sleep(300);

  // ---- in the edit box of an element ----
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node', 8000);
  await sleep(500);
  await app.doubleClick(await app.findByText('.diagram .node', 'One A'));
  await app.waitFor('.box .ProseMirror', 5000);
  await sleep(400);
  await app.keys(['Control', 'f']);
  await app.waitFor('.box .search-bar input', 3000);
  const inBox = await searchFor('e');
  const boxed = await app.exec(`return { marks: document.querySelectorAll('.box .search-mark').length, current: document.querySelector('.box .search-mark.current')?.textContent ?? null, page: CSS.highlights.get('search')?.size ?? 0 }`);
  check('the edit box has the search as well, over its name and its text', /^1 of \d+$/.test(inBox) && boxed.marks > 3 && boxed.current === 'e', `${inBox} ${JSON.stringify(boxed)}`);
  check('marked by its editors, and not by the page', boxed.page === 0, JSON.stringify(boxed));
  await app.press('Enter');
  await sleep(400);
  check('Enter shows the next there', /^2 of \d+$/.test(await said()), await said());
  await app.screenshot('search-7-box');
  await app.press('Escape');
  await sleep(300);
  check('Escape closes the search, and the box stays', !(await app.exists('.box .search-bar')) && (await app.exists('.box')));
  await app.press('Escape');
  await sleep(300);
  check('and closes the box after it', !(await app.exists('.box')));

  // ---- through everything: a second project, and both searched ----
  await app.keys(['Control', '1']);
  await app.waitFor('.home', 8000);
  await sleep(600);
  await app.clickText('button', 'New project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Second');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section');
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys('The anger of Achilles, and his wrath.');
  await sleep(800);
  await app.keys(['Control', 'Shift', 'f']);
  await app.waitFor('.search-view input', 5000);
  check('Ctrl+Shift+F opens the search through everything', await app.exec(`return document.activeElement === document.querySelector('.search-view input')`));
  const results = () =>
    app.exec(`return Array.from(document.querySelectorAll('.search-view .project')).map((p) => ({ name: p.querySelector('.name').textContent.trim(), hits: Array.from(p.querySelectorAll('.hit')).map((h) => h.textContent.replace(/\\s+/g, ' ').trim()) }))`);
  const everythingSaid = () => app.exec(`return document.querySelector('.search-view .said').textContent.replace(/\\s+/g, ' ').trim()`);
  await app.keys('wrath');
  await until('what was found', async () => (await results()).length > 0, 15000);
  let r = await results();
  check('the project opened last is searched', r.length === 1 && r[0].name === 'Second' && r[0].hits.length === 1, JSON.stringify(r));
  check('what was found is shown with the words around it', r[0].hits[0].includes('The anger of Achilles, and his wrath.'), JSON.stringify(r[0].hits));
  await app.clickText('.search-view [role="radio"]', 'All projects');
  await until('both projects', async () => (await results()).length === 2, 20000);
  await sleep(500);
  r = await results();
  const wrathProject = r.find((p) => p.name === 'Wrath');
  // The first map of the project is named after it, and so is its centre: "Wrath".
  check('all projects are searched, those not open read from disk', wrathProject?.hits.length === 6, JSON.stringify(r));
  check('and it is said how much was found where', (await everythingSaid()) === '7 found in 2 projects', await everythingSaid());
  check('with citations in the words around what was found, as the text shows them', wrathProject?.hits.some((h) => h.includes('the wrath of Achilles (Nagy 1979, 73).')), JSON.stringify(wrathProject?.hits));
  await app.screenshot('search-8-everything');
  check('what stands outside the texts is not searched', (await (async () => { await app.exec(`const i = document.querySelector('.search-view input'); i.focus(); i.select();`); await app.keys('Nagy'); await sleep(1500); return everythingSaid(); })()) === 'Nothing found', await everythingSaid());
  await app.click('.search-view button[aria-label="What stands outside the texts as well"]');
  await until('the citation', async () => (await results()).length > 0, 10000);
  r = await results();
  check('unless that is asked for', r.length === 1 && r[0].hits.some((h) => h.includes('Nagy 1979')), JSON.stringify(r));
  await app.click('.search-view button[aria-label="What stands outside the texts as well"]');
  await app.exec(`const i = document.querySelector('.search-view input'); i.focus(); i.select();`);
  await app.keys('wrath');
  await until('the projects again', async () => (await results()).length === 2, 15000);
  await sleep(400);
  // Choosing what was found in the element that was folded opens the map at it.
  await app.exec(`Array.from(document.querySelectorAll('.search-view .hit')).find((h) => h.textContent.includes('Deep under')).dataset.pick = '1'`);
  const chosen = await app.exec(`return document.querySelector('.search-view .hit[data-pick]').textContent.replace(/\\s+/g, ' ').trim()`);
  await app.click('.search-view .hit[data-pick]');
  await app.waitFor('.text-view .section', 10000);
  await until('the match', async () => /of 5$/.test((await said()) ?? ''), 10000);
  const there = await app.exec(`
    let marked = null; for (const r of CSS.highlights.get('search-current') ?? []) marked = r;
    const section = marked && marked.startContainer.parentElement.closest('[data-section]');
    return { said: document.querySelector('.search-bar .said').textContent.trim(), text: marked && marked.toString(), element: section && section.querySelector('.heading').textContent.trim() };`);
  check('choosing what was found opens the map at it, with the search in the bar', there.text === 'wrath' && there.element === 'One A' && there.said === '5 of 5', `${chosen} → ${JSON.stringify(there)}`);
  await app.screenshot('search-9-gone-to');

  // ---- in a table and an equation, drawn without an editor ----
  writeFileSync(
    join(desk, 'table.md'),
    `---
title: The table
---

# First

No sorrow here, but in the table.

# Second

| Hero | Sorrow |
|------|--------|
| Achilles | great sorrow |

: The sorrows of the heroes

$$E = mc^2$$
`,
  );
  await app.exec(`document.querySelector('.search-bar input')?.focus()`);
  await app.press('Escape');
  await sleep(300);
  const middleOfPanes = await app.exec(
    `const r = document.querySelector('.project .work .panes').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }`,
  );
  await drop([join(desk, 'table.md')], middleOfPanes.x, middleOfPanes.y);
  await app.waitFor('dialog [data-fact="words"]', 15000);
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitGone('dialog[open]', 15000);
  await until('the map of the table', async () => (await names()).includes('Second'), 10000);
  await sleep(800);
  // No editor has the cursor: the search begins at the top of the text.
  await app.exec(`document.activeElement?.blur()`);
  await app.keys(['Control', 'f']);
  await app.waitFor('.search-bar input', 3000);
  await searchFor('sorrow');
  await until('sorrow', async () => / of 4$/.test((await said()) ?? ''), 5000);
  const inTable = await app.exec(`
    const out = [];
    for (const r of CSS.highlights.get('search') ?? []) {
      const el = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
      out.push({ text: r.toString(), drawn: !!el?.closest('.static'), where: el?.closest('td, th, figcaption')?.tagName ?? 'P' });
    }
    return out;`);
  check(
    'in a table drawn without an editor, what is found is marked in its cells and in what is said of it',
    inTable.length === 4 &&
      inTable.every((x) => x.text.toLowerCase() === 'sorrow') &&
      ['TH', 'TD', 'FIGCAPTION'].every((w) => inTable.some((x) => x.drawn && x.where === w)),
    JSON.stringify(inTable),
  );
  await app.screenshot('search-10-table');
  check('an equation is not found by its formula', (await searchFor('mc^2')) === 'Nothing found', await said());
  await option('Citations, formulas and cross-references as well');
  await sleep(800);
  const equation = await app.exec(`
    let m = null; for (const r of CSS.highlights.get('search-current') ?? []) m = r;
    if (!m) return null;
    const el = m.startContainer.nodeType === 1 ? m.startContainer : m.startContainer.parentElement;
    return { said: document.querySelector('.search-bar .said').textContent.trim(), equation: !!el?.closest('.equation'), selected: !!document.querySelector('.text-view .equation.ProseMirror-selectednode, .text-view .equation.selected') };`);
  check('unless that is asked for: then it is found, marked and selected', equation?.said === '1 of 1' && equation.equation && equation.selected, JSON.stringify(equation));
  await option('Citations, formulas and cross-references as well');

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('search-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
  rmSync(data, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
