// The keys of the tree, one set for the diagram and the text: Alt+Enter a
// new element after, Alt+Shift+Enter one under, Tab to fold and Shift+Tab
// all, Enter to open the text, F2 to rename. In the text Alt+Enter makes a
// heading at the cursor: at the start, the middle and the end of a
// paragraph, and with a citation in it, which a name cannot hold. And the
// keys that once did these things do nothing now.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.execAsync(
    `const plan = await window.__TAURI_INTERNALS__.invoke('import_bib_text', { text: arguments[0] });
     await window.__TAURI_INTERNALS__.invoke('import_apply', { plan });`,
    bib,
  );

  /** The sections of the text, by name and depth. */
  const sections = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) =>
         (s.querySelector('.heading .title')?.textContent ?? '').trim() + ':' + (s.className.match(/level-(\\d)/) || [])[1])`,
    );
  /** The section of an element, by its name, scrolled into view. */
  const section = (name) =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === arguments[0]) ?? null;
       s?.scrollIntoView({ block: 'center' });
       return s;`,
      name,
    );
  /** The paragraphs of an element's text, each as its words. */
  const paragraphs = (name) =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === arguments[0]);
       const body = s?.querySelector('[data-part="body"] .ProseMirror');
       return body ? Array.from(body.children).map((p) => p.textContent.trim()).filter((t) => t) : [];`,
      name,
    );
  /** Where the cursor is: in which element, which part, and what is selected. */
  const where = () =>
    app.exec(
      `const a = document.activeElement;
       const s = a?.closest?.('[data-section]');
       return {
         section: s ? (s.querySelector('.heading .title')?.textContent ?? '').trim() : null,
         part: a?.closest?.('[data-part]')?.dataset.part ?? null,
         selected: getSelection()?.toString() ?? '',
       };`,
    );
  /** Puts the cursor in the name of an element, at its end. */
  const intoName = async (name) => {
    const s = await section(name);
    await app.click(await app.exec(`return arguments[0].querySelector('.heading .title')`, s));
    await sleep(250);
    await app.press('End');
    await sleep(100);
  };
  /** Puts the cursor in a paragraph of an element's text, at its start, and on by so many letters. */
  const intoParagraph = async (name, words, right = 0, end = false) => {
    const s = await section(name);
    const p = await app.exec(
      `return Array.from(arguments[0].querySelectorAll('[data-part="body"] .ProseMirror > *')).find((p) => p.textContent.trim().startsWith(arguments[1])) ?? null`,
      s,
      words,
    );
    if (!p) throw new Error(`no paragraph “${words}” in ${name}`);
    await app.click(p);
    await sleep(200);
    await app.press(end ? 'End' : 'Home');
    for (let i = 0; i < right; i++) await app.press('ArrowRight');
    await sleep(100);
  };
  const toText = async () => {
    await app.clickText('header [role="radio"]', 'Text');
    await app.waitFor('.text-view .section', 8000);
    await sleep(500);
  };
  const toDiagram = async () => {
    await app.clickText('header [role="radio"]', 'Diagram');
    await app.waitFor('.diagram .node.root', 8000);
    await sleep(500);
  };
  /** The elements of the diagram that are shown: name, level, and whether what is under it is shown. */
  const nodes = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.diagram .node')).map((n) => ({
         name: n.querySelector('.caption').textContent.trim(),
         level: Number(n.getAttribute('aria-level')),
         open: n.getAttribute('aria-expanded'),
       }))`,
    );
  const node = (name) =>
    app.exec(
      `return Array.from(document.querySelectorAll('.diagram .node')).find((n) => n.querySelector('.caption').textContent.trim() === arguments[0]) ?? null;`,
      name,
    );
  const shownNames = async () => (await nodes()).map((n) => n.name);
  const select = async (name) => {
    await app.click(await node(name));
    await sleep(200);
  };
  /** Presses keys that make an element, and names it. */
  const make = async (keys, name) => {
    await app.keys(keys);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(150);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(200);
  };
  const toasts = () =>
    app.exec(`return Array.from(document.querySelectorAll('.toaster .toast')).map((t) => t.textContent.trim())`);

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Tree');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(700);

  // ==== Part 1: the diagram ====
  await toDiagram();
  await select('Tree');
  await make(['Alt', 'Shift', 'Enter'], 'One');
  await make(['Alt', 'Enter'], 'Two');
  await make(['Alt', 'Shift', 'Enter'], 'Two A');
  // In the name of a new element, Alt+Enter keeps it and makes the next.
  await app.keys(['Alt', 'Enter']);
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(150);
  await app.keys('Two B');
  await app.keys(['Alt', 'Enter']);
  await sleep(300);
  await app.waitUntil(
    `const r = document.querySelector('.diagram .node.renaming .prose'); return r && r.textContent.trim() === ''`,
    3000,
    'a second name being written',
  );
  await app.keys('Two C');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await sleep(200);
  await toText();
  let list = await sections();
  check(
    'in the diagram, Alt+Shift+Enter makes one under, Alt+Enter one after, and in a name keeps it and makes the next',
    JSON.stringify(list) ===
      JSON.stringify(['Tree:0', 'One:1', 'Two:1', 'Two A:2', 'Two B:2', 'Two C:2']),
    list.join(' | '),
  );
  await toDiagram();

  // Tab folds what is under the element, and unfolds it.
  await select('Two');
  await app.press('Tab');
  await sleep(400);
  let shown = await nodes();
  check(
    'Tab folds what is under the element selected',
    shown.find((n) => n.name === 'Two')?.open === 'false' && !shown.some((n) => n.name === 'Two A'),
    JSON.stringify(shown),
  );
  await app.press('Tab');
  await sleep(400);
  shown = await nodes();
  check(
    'and Tab again unfolds it',
    shown.find((n) => n.name === 'Two')?.open === 'true' && shown.some((n) => n.name === 'Two A'),
    JSON.stringify(shown),
  );
  // With nothing under it, Tab does nothing, and the focus stays in the diagram.
  await select('One');
  const before = (await shownNames()).length;
  await app.press('Tab');
  await sleep(300);
  check(
    'Tab on an element with nothing under it makes nothing, and the focus stays in the diagram',
    (await shownNames()).length === before &&
      (await app.exec(`return !!document.activeElement?.closest('.diagram')`)),
  );

  // Shift+Tab folds everything at the first level, and unfolds all.
  await app.keys(['Shift', 'Tab']);
  await sleep(400);
  shown = await nodes();
  check(
    'Shift+Tab folds everything at the first level',
    shown.find((n) => n.name === 'Two')?.open === 'false' && !shown.some((n) => n.level > 2),
    JSON.stringify(shown),
  );
  await app.screenshot('tree-keys-1-diagram-folded');
  await app.keys(['Control', 'z']);
  await sleep(400);
  shown = await nodes();
  check('and Ctrl+Z takes it back in one step', shown.some((n) => n.name === 'Two C'), JSON.stringify(shown));
  await app.keys(['Shift', 'Tab']);
  await sleep(300);
  await app.keys(['Shift', 'Tab']);
  await sleep(400);
  shown = await nodes();
  check(
    'Shift+Tab again, with something folded, unfolds all',
    shown.some((n) => n.name === 'Two C') && shown.find((n) => n.name === 'Two')?.open === 'true',
    JSON.stringify(shown),
  );

  // Enter opens the text of the element; F2 renames it.
  await select('One');
  await app.press('Enter');
  await app.waitFor('.box .text .prose', 3000).catch(() => {});
  check('Enter opens the text of the element selected', await app.exists('.box .text .prose'));
  await app.keys('The text of one.');
  await sleep(200);
  await app.screenshot('tree-keys-1-diagram-enter');
  await app.press('Escape');
  await sleep(400);
  await select('One');
  await app.press('F2');
  await sleep(300);
  check('F2 renames the element selected', await app.exists('.diagram .node.renaming .prose'));
  await app.press('Escape');
  await app.waitGone('.diagram .node.renaming', 3000);
  await sleep(200);
  // Alt+Shift+Down enters, Alt+Shift+Up goes up.
  await select('Two');
  await app.keys(['Alt', 'Shift', 'ArrowDown']);
  await sleep(600);
  const rootName = () =>
    app.exec(`return document.querySelector('.diagram .node.root .caption')?.textContent.trim() ?? null`);
  check('Alt+Shift+Down enters the element selected', (await rootName()) === 'Two', await rootName());
  await app.keys(['Alt', 'Shift', 'ArrowUp']);
  await sleep(600);
  check('and Alt+Shift+Up goes up again', (await rootName()) === 'Tree', await rootName());
  await app.screenshot('tree-keys-1-diagram');

  // ==== Part 3: the keys that once made and folded elements do nothing in the diagram ====
  await select('Two');
  const count = (await shownNames()).length;
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys(['Control', 'Shift', 'Enter']);
  await sleep(400);
  check(
    'Ctrl+Enter and Ctrl+Shift+Enter make no element in the diagram',
    (await shownNames()).length === count && !(await app.exists('.diagram .node.renaming')),
    (await shownNames()).join(' | '),
  );
  await app.press('Space');
  await sleep(300);
  shown = await nodes();
  check(
    'Space folds nothing, nor begins a name',
    shown.find((n) => n.name === 'Two')?.open === 'true' && !(await app.exists('.diagram .node.renaming')),
    JSON.stringify(shown),
  );

  // ==== Part 2: the text ====
  await toText();
  // The text of One: five paragraphs, one with a citation.
  await intoName('One');
  await app.press('Enter');
  await sleep(300);
  await app.press('End');
  await app.press('Enter');
  await app.keys('Alpha first.');
  await app.press('Enter');
  await app.keys('Beta second part.');
  await app.press('Enter');
  await app.keys('Gamma third.');
  await app.press('Enter');
  await app.keys('Delta cites ');
  await app.keys('@');
  await app.waitFor('.picker input', 3000);
  await app.keys('nagy');
  await sleep(400);
  await app.press('Enter');
  await app.waitFor('.editor .locator input', 3000);
  await app.keys('73');
  await app.press('Enter');
  await app.waitGone('.editor', 3000);
  await sleep(200);
  await app.keys(' here.');
  await app.press('Enter');
  await app.keys('Epsilon last.');
  await sleep(400);
  const written = await paragraphs('One');
  check(
    'the text is written',
    written.length === 6 && written[1] === 'Alpha first.' && written[4].startsWith('Delta cites'),
    JSON.stringify(written),
  );

  // At the start of a paragraph: the whole paragraph is the name, the paragraphs below its text.
  await intoParagraph('One', 'Gamma');
  await app.keys(['Alt', 'Enter']);
  await sleep(600);
  list = await sections();
  let at = await where();
  check(
    'Alt+Enter at the start of a paragraph makes it the name of a new element after this one',
    JSON.stringify(list.slice(0, 4)) ===
      JSON.stringify(['Tree:0', 'One:1', 'Gamma third.:1', 'Two:1']),
    list.join(' | '),
  );
  const gamma = await paragraphs('Gamma third.');
  check(
    'and the paragraphs below it are its text',
    gamma.length === 2 && gamma[0].startsWith('Delta cites') && gamma[1] === 'Epsilon last.',
    JSON.stringify(gamma),
  );
  check(
    'the old text keeps what stood before the cursor',
    JSON.stringify((await paragraphs('One')).slice(-2)) ===
      JSON.stringify(['Alpha first.', 'Beta second part.']),
    JSON.stringify(await paragraphs('One')),
  );
  check('the cursor is in the new name', at.section === 'Gamma third.' && at.part === 'title', JSON.stringify(at));

  // In the middle of a paragraph: the rest of the paragraph is the name.
  await intoParagraph('One', 'Beta', 5);
  await app.keys(['Alt', 'Enter']);
  await sleep(600);
  list = await sections();
  check(
    'Alt+Enter in the middle of a paragraph makes the rest of it the name',
    JSON.stringify(list.slice(0, 4)) ===
      JSON.stringify(['Tree:0', 'One:1', 'second part.:1', 'Gamma third.:1']),
    list.join(' | '),
  );
  check(
    'and the head of it stays where it was',
    JSON.stringify((await paragraphs('One')).slice(-2)) === JSON.stringify(['Alpha first.', 'Beta']),
    JSON.stringify(await paragraphs('One')),
  );

  // At the end of a paragraph, Alt+Shift+Enter: an unnamed element under it, with the paragraphs below.
  await intoParagraph('One', 'Alpha', 0, true);
  await app.keys(['Alt', 'Shift', 'Enter']);
  await sleep(600);
  at = await where();
  await app.keys('Under one');
  await sleep(300);
  list = await sections();
  check(
    'Alt+Shift+Enter at the end of a paragraph makes an element under it with an empty name, the cursor in it',
    JSON.stringify(list.slice(0, 4)) ===
      JSON.stringify(['Tree:0', 'One:1', 'Under one:2', 'second part.:1']) && at.part === 'title',
    `${list.join(' | ')} ${JSON.stringify(at)}`,
  );
  check(
    'and the paragraphs below are its text',
    JSON.stringify(await paragraphs('Under one')) === JSON.stringify(['Beta']),
    JSON.stringify(await paragraphs('Under one')),
  );
  // Where the element has elements under it, the new one after it comes first among them.
  await intoParagraph('One', 'Alpha', 0, true);
  await app.keys(['Alt', 'Enter']);
  await sleep(600);
  await app.keys('First under');
  await sleep(300);
  list = await sections();
  check(
    'with elements under it, Alt+Enter makes the new one first among them, where the cursor was',
    JSON.stringify(list.slice(0, 5)) ===
      JSON.stringify(['Tree:0', 'One:1', 'First under:2', 'Under one:2', 'second part.:1']),
    list.join(' | '),
  );

  // With a citation in it, the paragraph cannot be a name: it is the first paragraph of the new element.
  await intoParagraph('Gamma third.', 'Delta');
  await app.keys(['Alt', 'Enter']);
  await sleep(600);
  list = await sections();
  const said = await toasts();
  const gammaAt = list.indexOf('Gamma third.:1');
  check(
    'with a citation, Alt+Enter makes an element with an empty name after this one',
    gammaAt > 0 && list[gammaAt + 1] === ':1',
    list.join(' | '),
  );
  const kept = await app.exec(
    `const all = Array.from(document.querySelectorAll('.text-view .section'));
     const g = all.findIndex((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === 'Gamma third.');
     const s = all[g + 1];
     const body = s?.querySelector('[data-part="body"] .ProseMirror');
     return body ? { paragraphs: Array.from(body.children).map((p) => p.textContent.trim()), citations: body.querySelectorAll('.citation').length } : null;`,
  );
  check(
    'and the paragraph with the citation is the first of its text, the citation in it',
    kept?.paragraphs.length === 2 && kept.paragraphs[0].startsWith('Delta cites') && kept.citations === 1,
    JSON.stringify(kept),
  );
  check(
    'a message says why',
    said.some((s) => s.includes('holds what a name cannot')),
    JSON.stringify(said),
  );
  await app.screenshot('tree-keys-2-text-kept');
  check(
    'the text that is left has no citation and nothing below',
    (await paragraphs('Gamma third.')).length === 0,
    JSON.stringify(await paragraphs('Gamma third.')),
  );

  // In the middle of a name: the rest of the name goes to the new element.
  await intoName('second part.');
  await app.press('Home');
  for (let i = 0; i < 7; i++) await app.press('ArrowRight');
  await app.keys(['Alt', 'Enter']);
  await sleep(600);
  list = await sections();
  check(
    'Alt+Enter in the middle of a name gives the rest of it to a new element after',
    list.includes('second:1') && list.indexOf('part.:1') === list.indexOf('second:1') + 1,
    list.join(' | '),
  );

  // Tab in a name folds, Shift+Tab folds or unfolds all.
  await intoName('One');
  await app.press('Tab');
  await sleep(400);
  list = await sections();
  at = await where();
  check(
    'Tab in a name folds what is under the element, and the cursor stays in the name',
    !list.includes('First under:2') &&
      (await app.exists('.text-view .section[data-folded]')) &&
      at.section === 'One' &&
      at.part === 'title',
    `${list.join(' | ')} ${JSON.stringify(at)}`,
  );
  await app.press('Tab');
  await sleep(400);
  check('and Tab again unfolds it', (await sections()).includes('First under:2'));
  await app.keys(['Shift', 'Tab']);
  await sleep(400);
  list = await sections();
  check(
    'Shift+Tab in a name folds everything at the first level',
    list.every((s) => !s.endsWith(':2')) && (await app.count('.text-view .section[data-folded]')) >= 2,
    list.join(' | '),
  );
  await app.screenshot('tree-keys-2-text-folded');
  await app.keys(['Shift', 'Tab']);
  await sleep(400);
  list = await sections();
  check(
    'and Shift+Tab again unfolds all',
    list.includes('First under:2') && list.includes('Two C:2') &&
      !(await app.exists('.text-view .section[data-folded]')),
    list.join(' | '),
  );

  // F2 goes to the name, the name selected.
  await intoParagraph('Under one', 'Beta', 2);
  await app.press('F2');
  await sleep(400);
  at = await where();
  check(
    'F2 in a text goes to the name of the element, the name selected',
    at.section === 'Under one' && at.part === 'title' && at.selected.trim() === 'Under one',
    JSON.stringify(at),
  );

  // Ctrl+Enter makes nothing in the text, nor breaks the line.
  const many = (await sections()).length;
  await intoParagraph('One', 'Alpha', 0, true);
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys(['Control', 'Shift', 'Enter']);
  await sleep(400);
  check(
    'Ctrl+Enter and Ctrl+Shift+Enter make no element in the text, and no break in the line',
    (await sections()).length === many &&
      (await app.exec(
        `return Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === 'One').querySelectorAll('.hard-break').length`,
      )) === 0,
    (await sections()).join(' | '),
  );
  await app.exec(`document.activeElement?.blur?.()`);
  await sleep(200);
  await app.screenshot('tree-keys-2-text');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('tree-keys-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
