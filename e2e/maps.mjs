// Projects and maps, exercised through the interface.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const titles = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node .caption')).map((e) => e.textContent.trim())`,
  );

// Split view: the items of the menu that is open, what each side shows (the element by the last crumb of its path), and whether the button is lit.
const offered = async () => {
  await app.waitFor('.menu [role="menuitem"]', 3000);
  return app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.textContent.trim())`);
};
const shownIn = () =>
  app.exec(
    `return Array.from(document.querySelectorAll('.pane')).map((p, i) => (p.querySelector('.diagram') ? 'diagram' : p.querySelector('.text-view') ? 'text' : '?') + ':' + (document.querySelector('.top .cell[data-side="' + i + '"] [data-crumb-last] .name')?.textContent.trim() ?? ''))`,
  );
const lit = () => app.exec(`return document.querySelector('.top button[data-side-by-side]').classList.contains('on')`);
/** Unfolds the tree under a project's row in a list, where it is folded: the folds of the list at the left and of the chooser are one. */
const unfoldRow = (list, name) =>
  app.exec(
    `const row = Array.from(document.querySelectorAll(arguments[0] + ' .row.project')).find((r) => r.textContent.includes(arguments[1]));
     const fold = row?.querySelector('.fold');
     if (fold && fold.getAttribute('aria-expanded') !== 'true') fold.click();`,
    list,
    name,
  );
const beside = async (item) => {
  await app.click('.top button[data-side-by-side]');
  await offered();
  await app.clickText('.menu [role="menuitem"]', item);
};

let kept = [];
let app = await App.launch({ keepData: true });
const dataDir = app.dataDir;
try {
  await app.installErrorHook();

  // References to cite.
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.execAsync(
    `const plan = await window.__TAURI_INTERNALS__.invoke('import_bib_text', { text: arguments[0] });
     await window.__TAURI_INTERNALS__.invoke('import_apply', { plan });`,
    bib,
  );

  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.screenshot('maps-1-welcome');

  // --- A new project opens on a map with one element ---
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  check(
    'a new project has one map with its centre',
    JSON.stringify(await titles(app)) === '["Wrath and the hero"]',
  );
  await app.screenshot('maps-2-new-project');

  // --- Building the map from the keyboard ---
  await app.click('.diagram .node.root');
  const add = async (where, name) => {
    // A new element under the one selected, or after it: the keys of the tree.
    await app.keys(where === 'under' ? ['Alt', 'Shift', 'Enter'] : ['Alt', 'Enter']);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await add('under', 'The word mênis');
  await add('after', 'Achilles and Apollo');
  await add('after', 'The economy of honour');
  await add('after', 'Reception');
  // Under the last one.
  await add('under', 'Virgil');
  await add('after', 'Milton');
  const names = await titles(app);
  check(
    'Tab and Enter build the tree',
    names.length === 7 && names.includes('Milton'),
    names.join(' | '),
  );

  // The sides are balanced around the centre.
  const sides = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node.depth-1')).map((e) => e.classList.contains('left') ? 'L' : 'R').join('')`,
  );
  check(
    'the branches stand on both sides of the centre',
    sides.includes('L') && sides.includes('R'),
    sides,
  );
  await app.screenshot('maps-3-built');

  // --- Undo and redo ---
  await app.keys(['Control', 'z']);
  await sleep(200);
  const afterUndo = await titles(app);
  await app.keys(['Control', 'Shift', 'z']);
  await sleep(200);
  // The last step was naming Milton; making the element is the step before.
  const afterRedo = await titles(app);
  check(
    'undo takes back, redo brings again',
    !afterUndo.includes('Milton') && afterRedo.length === 7 && afterRedo.includes('Milton'),
    `${afterUndo.join(' | ')} → ${afterRedo.join(' | ')}`,
  );
  // One Ctrl+Z is one step: after one redo there is nothing more to redo.
  const redoLeft = await app.exec(
    `return !document.querySelector('button[aria-label="Redo"]')?.disabled`,
  );
  check('one Ctrl+Z in the diagram undoes one step, not two', redoLeft === false);

  // A name begun by typing over an element keeps every key, however fast; Escape puts the old one back.
  await app.click(await app.findByText('.diagram .node', 'Virgil'));
  await sleep(150);
  await app.keys('Publius Vergilius Maro');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  check(
    'a name typed over an element keeps every key',
    (await titles(app)).includes('Publius Vergilius Maro'),
    (await titles(app)).join(' | '),
  );
  await app.keys('Nonsense');
  await app.press('Escape');
  await app.waitGone('.diagram .node.renaming', 3000);
  await sleep(150);
  check(
    'and Escape leaves the name as it was',
    (await titles(app)).includes('Publius Vergilius Maro') &&
      !(await titles(app)).includes('Nonsense'),
    (await titles(app)).join(' | '),
  );
  await app.keys('Virgil');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);

  // --- Writing in the edit box, with a citation and a note ---
  const mênis = await app.findByText('.diagram .node', 'The word mênis');
  await app.doubleClick(mênis);
  await app.waitFor('.box .text .prose');
  await sleep(250);
  check(
    'the box for writing has the tools too',
    await app.exists('.box [data-marks]:not(:disabled)'),
  );
  await app.keys('The first word of the Iliad names a wrath that is more than anger ');
  await app.keys('@');
  await app.waitFor('.picker input');
  await app.keys('nagy best');
  await sleep(250);
  await app.screenshot('maps-4-picker');
  // A new reference begins with what was being searched for.
  await app.clickText('.picker button', 'New reference');
  await app.waitFor('dialog[open] .lookup input', 3000);
  await sleep(300);
  const carried = await app.exec(
    `return document.querySelector('dialog[open] .lookup input').value`,
  );
  check(
    'a new reference from the picker begins with what was searched for',
    carried === 'nagy best',
    carried,
  );
  await app.clickText('dialog[open] footer button', 'Cancel');
  await app.waitGone('dialog[open]');
  await app.waitFor('.picker input', 3000);
  await sleep(200);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('73');
  await app.screenshot('maps-5-citation');
  await app.press('Enter');
  await app.waitGone('.editor');
  await sleep(150);
  await app.keys('. It belongs to gods before it belongs to men.');
  await app.keys(['Control', 'Alt', 'f']);
  await app.waitFor('.note-panel .prose');
  await app.keys('So already the scholia.');
  await app.screenshot('maps-6-note');
  await app.press('Escape');
  await app.waitGone('.note-panel');
  await sleep(150);
  const boxText = await app.text('.box .text .prose');
  check('the text holds the citation', /\(Nagy 1979, 73\)/.test(boxText), boxText);
  check('and the note', (await app.count('.box .text .footnote')) === 1);
  await app.screenshot('maps-7-edit-box');
  await app.press('Escape');
  await app.waitGone('.box');

  // --- The element shows that it has text; hovering shows the text ---
  check('the element is marked as having text', await app.exists('.diagram .node .marks'));
  await app.hover('.diagram .controls');
  await sleep(100);
  await app.hover(await app.findByText('.diagram .node', 'The word mênis'));
  await app.waitFor('.tip', 3000);
  const tip = await app.text('.tip');
  check('hovering shows the text', /first word of the Iliad/.test(tip));
  await app.screenshot('maps-8-tooltip');
  await app.hover('.diagram .controls');

  // --- An association, drawn from one element to another ---
  const from = await app.findByText('.diagram .node', 'Achilles and Apollo');
  await app.click(from);
  await sleep(100);
  const handle = await app.exec(
    `const n = Array.from(document.querySelectorAll('.diagram .node')).find((e) => e.textContent.includes('Achilles and Apollo'));
     return n.querySelector('.link-handle');`,
  );
  await app.drag(
    handle['element-6066-11e4-a52e-4f735466cecf'],
    await app.findByText('.diagram .node', 'Virgil'),
  );
  await sleep(300);
  check(
    'dragging from the handle associates two elements',
    (await app.count('.diagram .association')) === 1,
  );
  await app.screenshot('maps-9-association');

  // --- The same from the keys: the menu by Shift+F10, the other end by the arrows and Enter ---
  await app.click(await app.findByText('.diagram .node', 'The economy of honour'));
  await sleep(100);
  await app.keys(['Shift', 'F10']);
  await app.waitFor('[role="menuitem"]', 3000);
  check('the menu of an element opens from the keys', await app.exists('[role="menuitem"]'));
  await app.clickText('[role="menuitem"]', 'Associate with');
  await sleep(150);
  await app.press('ArrowUp');
  await app.press('Enter');
  await sleep(300);
  check(
    'an association can be ended from the keys',
    (await app.count('.diagram .association')) === 2,
  );
  await app.keys(['Control', 'z']);
  await sleep(300);
  check('and taken back', (await app.count('.diagram .association')) === 1);

  // --- An element moved by Alt and the arrows ---
  const top = (name) =>
    app.exec(
      `return Array.from(document.querySelectorAll('.diagram .node')).find((e) => e.textContent.includes(${JSON.stringify(name)})).getBoundingClientRect().top`,
    );
  await app.click(await app.findByText('.diagram .node', 'Milton'));
  await sleep(100);
  await app.keys(['Alt', 'ArrowUp']);
  await sleep(400);
  const up = (await top('Milton')) < (await top('Virgil'));
  await app.keys(['Alt', 'ArrowDown']);
  await sleep(400);
  const down = (await top('Milton')) > (await top('Virgil'));
  check(
    'Alt and the arrows move an element among those beside it',
    up && down,
    JSON.stringify({ up, down }),
  );
  const level = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram [role="treeitem"]')).find((e) => e.textContent.includes('Milton')).getAttribute('aria-level')`,
  );
  check('and the elements are told as a tree to those who hear them', level === '3', level);

  // --- Dropped on another element, with Shift or without, an element goes under it with all that is under it ---
  const levelOf = (name) =>
    app.exec(
      `const e = Array.from(document.querySelectorAll('.diagram [role="treeitem"]')).find((e) => e.textContent.includes(${JSON.stringify(name)})); return e ? e.getAttribute('aria-level') : null`,
    );
  await app.drag(
    await app.findByText('.diagram .node', 'Reception'),
    await app.findByText('.diagram .node', 'Achilles and Apollo'),
    { keys: ['Shift'] },
  );
  await sleep(500);
  const alone = [await levelOf('Reception'), await levelOf('Virgil'), await levelOf('Milton')];
  check(
    'dragged with Shift onto another element, an element goes under it with all that is under it',
    alone.join(',') === '3,4,4',
    alone.join(','),
  );
  await app.keys(['Control', 'z']);
  await sleep(400);
  const restoredLevels = [
    await levelOf('Reception'),
    await levelOf('Virgil'),
    await levelOf('Milton'),
  ];
  check('and Ctrl+Z puts it back', restoredLevels.join(',') === '2,3,3', restoredLevels.join(','));

  // --- Copy and paste: Ctrl+C holds the elements, Ctrl+V pastes them under the one selected ---
  await app.click(await app.findByText('.diagram .node', 'Virgil'));
  await sleep(100);
  await app.keys(['Control', 'c']);
  await sleep(200);
  await app.click(await app.findByText('.diagram .node', 'Milton'));
  await sleep(100);
  await app.keys(['Control', 'v']);
  await sleep(500);
  const virgils = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram [role="treeitem"]')).filter((e) => e.textContent.includes('Virgil')).map((e) => e.getAttribute('aria-level'))`,
  );
  check(
    'Ctrl+C and Ctrl+V paste a copy of the element under the one selected',
    virgils.join(',') === '3,4',
    virgils.join(','),
  );
  await app.keys(['Control', 'z']);
  await sleep(400);
  check(
    'and Ctrl+Z takes the copy away',
    (await app.count('.diagram [role="treeitem"]')) === 7,
    String(await app.count('.diagram [role="treeitem"]')),
  );

  // --- The same map as text ---
  await app.view('text');
  await app.waitFor('.text-view .section');
  await sleep(400);
  const headings = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section .heading .title')).map((e) => e.textContent.trim())`,
  );
  check(
    'the text has the elements as headings, in order',
    headings.join('|') ===
      'Wrath and the hero|The word mênis|Achilles and Apollo|The economy of honour|Reception|Virgil|Milton',
    headings.join(' | '),
  );
  check('the association is a line in the margin', (await app.count('.text-view .bracket')) === 1);
  const margin = await app.exec(
    `const line = document.querySelector('.text-view .bracket .line').getBoundingClientRect();
     const name = document.querySelector('.text-view .section .heading').getBoundingClientRect();
     return { line: Math.round(line.right), name: Math.round(name.left) };`,
  );
  check(
    'which is the left one, beside the names',
    margin.line <= margin.name && margin.name - margin.line < 80,
    JSON.stringify(margin),
  );
  await app.screenshot('maps-10-text');

  // Writing in the text, and making a new element from what follows the cursor.
  const economy = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('economy'));
     return s.querySelector('.body');`,
  );
  await app.click(economy['element-6066-11e4-a52e-4f735466cecf']);
  await app.waitFor(
    '.text-view .section .body .ProseMirror-focused, .text-view .section .body .prose[contenteditable="true"]',
  );
  await sleep(200);
  await app.keys('Honour is counted in prizes. ');
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('The prize of Briseis');
  await app.press('Enter');
  await sleep(150);
  await app.keys('Taken, she is the measure of the insult.');
  await sleep(300);
  const after = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section .heading .title')).map((e) => e.textContent.trim())`,
  );
  check(
    'Alt+Enter at the end of a text begins a new element after the one written in',
    after[4] === 'The prize of Briseis',
    after.join(' | '),
  );

  // Alt+Enter one after, Alt+Shift+Enter one under.
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('The gifts of Agamemnon');
  await sleep(150);
  await app.keys(['Alt', 'Shift', 'Enter']);
  await sleep(400);
  await app.keys('The embassy');
  await sleep(300);
  const org = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => s.querySelector('.heading .title').textContent.trim() + ':' + (s.className.match(/level-(\\d)/) || [])[1])`,
  );
  check(
    'Alt+Enter at the end of a text begins a new element after this one',
    org[5]?.startsWith('The gifts of Agamemnon:'),
    org.join(' | '),
  );
  check(
    'and Ctrl+Shift+Enter one under it',
    org[6] === 'The embassy:' + (Number(org[5]?.split(':')[1]) + 1),
    org.join(' | '),
  );
  // A new element is made by the keys and the menu of an element, not from the bar.
  check('the bar over the text has no button for a new element', !(await app.exists('.pane-bar button[aria-label="New element"]')));

  // Text pasted as text keeps every line break: into the text of the new element.
  await app.press('Enter');
  await sleep(250);
  await app.exec(
    `const el = document.activeElement.closest('.ProseMirror');
     const dt = new DataTransfer();
     dt.setData('text/plain', 'One\\ntwo\\n\\nThree\\n\\n\\nFour\\n');
     el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));`,
  );
  await sleep(400);
  const pastedLines = await app.exec(
    `const el = document.activeElement.closest('.ProseMirror');
     return Array.from(el.querySelectorAll(':scope > p')).map((p) =>
       Array.from(p.childNodes).map((n) => n.nodeName === 'BR' ? (n.classList.contains('ProseMirror-trailingBreak') ? '' : '⏎') : n.classList?.contains('hard-break') ? '⏎' : n.textContent).join(''));`,
  );
  check(
    'text pasted as text keeps every line break: a break, a new paragraph, an empty paragraph',
    JSON.stringify(pastedLines) === '["One⏎two","Three","","Four"]',
    JSON.stringify(pastedLines),
  );
  // Emptied again, and back to the name.
  await app.keys(['Control', 'a']);
  await app.press('Backspace');
  await sleep(150);
  await app.press('Backspace');
  await sleep(250);
  // The two are taken away again: an empty name, and Backspace in it, deletes
  // an element that has nothing under it; the cursor goes up to the one before.
  for (const name of ['The embassy', 'The gifts of Agamemnon']) {
    await app.keys(['Control', 'a']);
    await app.press('Backspace');
    await sleep(100);
    await app.press('Backspace');
    await sleep(300);
    if (name === 'The embassy') {
      // From the empty text of the one before, Backspace goes to its name.
      await app.press('Backspace');
      await sleep(200);
    }
  }
  const restored = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section .heading .title')).map((e) => e.textContent.trim())`,
  );
  check(
    'and Backspace in an empty name takes an element away again',
    restored.join(' | ') === after.join(' | '),
    restored.join(' | '),
  );
  // Back to the end of the text of the element written in.
  const briseis = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('Briseis'));
     return s.querySelector('.body');`,
  );
  await app.click(briseis['element-6066-11e4-a52e-4f735466cecf']);
  await sleep(200);
  await app.keys(['Control', 'End']);
  await sleep(150);
  await app.screenshot('maps-11-text-written');

  // --- The tools over the text ---
  const written = () =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('Briseis'));
       return s.querySelector('.body .prose').innerHTML;`,
    );
  await app.keys(' So *Iliad* 1 has it.');
  check(
    'signs are left as they are typed',
    /\*Iliad\* 1 has it/.test(await written()),
    await written(),
  );
  await app.click('.pane-bar [data-marks]');
  await app.clickText('.menu [role="menuitem"]', 'Italic');
  await app.keys('kleos');
  await app.click('.pane-bar [data-marks]');
  await app.clickText('.menu [role="menuitem"]', 'Italic');
  await app.keys(' is what is at stake.');
  check(
    'the tools set what is typed next',
    /<em>kleos<\/em> is what/.test(await written()),
    await written(),
  );
  await app.click('.pane-bar [data-insert]');
  await app.clickText('.menu [role="menuitem"]', 'Citation');
  await app.waitFor('.picker input', 3000);
  await app.keys('lord singer');
  await sleep(250);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('99');
  await app.press('Enter');
  await app.waitGone('.editor');
  await sleep(200);
  check(
    'the tool for citing cites',
    /Lord 1960, 99/.test((await written()).replace(/<[^>]+>/g, '')),
    (await written()).replace(/<[^>]+>/g, ''),
  );
  // The tool for notes opens a note that stays open to be written in.
  await app.click('.pane-bar [data-insert]');
  await app.clickText('.menu [role="menuitem"]', 'Note');
  await app.waitFor('.note-panel .prose', 3000);
  await sleep(700);
  check(
    'the tool for notes opens a note, which stays open',
    await app.exists('.note-panel .prose'),
  );
  await app.keys('Thus Lord.');
  await app.press('Escape');
  await app.waitGone('.note-panel');
  await sleep(200);
  // What the page counts cannot be asked for; what it counts by can.
  const counted = await app.exec(
    `const notes = Array.from(document.querySelectorAll('.text-view .column .footnote'));
     const sections = new Set(notes.map((n) => n.closest('.section')));
     const resets = notes.map((n) => getComputedStyle(n.closest('.prose')).counterReset);
     return { notes: notes.length, sections: sections.size, resets, column: getComputedStyle(document.querySelector('.text-view .column')).counterReset };`,
  );
  check(
    'the notes of a map are numbered through its elements',
    counted.notes === 2 &&
      counted.sections === 2 &&
      counted.resets.every((r) => r === 'none') &&
      /^note\b/.test(counted.column),
    JSON.stringify(counted),
  );
  await app.screenshot('maps-11a-notes');

  // A single note can be set to stand elsewhere than the format has its notes.
  await app.click('.text-view .column .ProseMirror .footnote');
  await app.waitFor('.note-panel .note-place', 3000);
  await app.exec(
    `const s = document.querySelector('.note-panel .note-place');
     s.value = 'end';
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(400);
  const set = await app.exec(
    `return {
       open: !!document.querySelector('.note-panel .prose'),
       heading: document.querySelector('.note-panel .note-number')?.textContent,
       marks: Array.from(document.querySelectorAll('.text-view .column .footnote')).map((e) => e.dataset.place || ''),
     }`,
  );
  check(
    'a note can be set to a place of its own, and is then lettered',
    set.open && set.heading === 'Note a' && set.marks.join(',') === ',end',
    JSON.stringify(set),
  );
  await app.screenshot('maps-11a2-note-placed');
  await app.press('Escape');
  await app.waitGone('.note-panel');

  await app.click('.pane-bar [data-paragraph-kind]');
  await app.clickText('[role="menuitem"]', 'Quotation');
  await sleep(200);
  // A paragraph set to a quotation is labelled so, and seen as a run of quotations (ADR 0041).
  check(
    'the kind of paragraph is chosen from a list',
    /<p[^>]*data-kind="quote"/.test(await written()) && /<p[^>]*data-run="quote"/.test(await written()),
    await written(),
  );
  await app.waitForText('.pane-bar [data-paragraph-kind]', 'Quotation', 3000);
  check('and shown', true);
  await app.screenshot('maps-11b-tools');
  await app.click('.pane-bar [data-paragraph-kind]');
  await app.clickText('[role="menuitem"]', 'Text');
  await sleep(200);
  check('and changed back', !/data-run=|data-kind="quote"/.test(await written()), await written());

  // Ctrl+, in the text lowers the writing, and does not leave for the settings.
  const inProse = await app.exec(`return !!document.activeElement?.closest('.text-view .prose')`);
  await app.keys(['Control', ',']);
  await sleep(300);
  const stayed = await app.exec(
    `return !!document.querySelector('.text-view') && !document.querySelector('.settings')`,
  );
  await app.keys(['Control', ',']);
  check(
    'Ctrl+, in the text is lowered writing, not the settings',
    inProse && stayed,
    JSON.stringify({ inProse, stayed }),
  );

  // --- The outline beside the text ---
  await app.keys(['Control', 'Shift', 'o']);
  await app.waitFor('.outline', 3000);
  const outlined = await app.exec(
    `return Array.from(document.querySelectorAll('.outline [data-outline]')).map((b) => b.textContent.trim())`,
  );
  check(
    'Ctrl+Shift+O shows the outline, every element by its name',
    outlined.includes('The prize of Briseis') && outlined.includes('Reception'),
    outlined.join(' | '),
  );
  await app.click(await app.findByText('.outline [data-outline]', 'Reception'));
  await sleep(400);
  const atTop = await app.exec(`
    const s = document.querySelector('.text-view .scroller').getBoundingClientRect();
    const reception = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading .title')?.textContent.trim() === 'Reception');
    return Math.round(reception.getBoundingClientRect().top - s.top) + ' of ' + Math.round(s.height);`);
  const [fromTop, height] = atTop.split(' of ').map(Number);
  check(
    'a name pressed in the outline brings its element into view',
    fromTop >= -2 && fromTop < height - 60,
    atTop,
  );
  const marked = await app.exec(
    `return document.querySelector('.outline .chosen')?.textContent.trim() ?? ''`,
  );
  check('and the outline marks it', marked === 'Reception', marked);
  await app.screenshot('maps-11c-outline');
  // Moved from the outline, and taken back.
  await app.keys(['Alt', 'ArrowUp']);
  await sleep(300);
  const movedUp = await app.exec(
    `return Array.from(document.querySelectorAll('.outline [data-outline]')).map((b) => b.textContent.trim())`,
  );
  check(
    'Alt and the arrows move an element from the outline',
    movedUp.indexOf('Reception') < outlined.indexOf('Reception'),
    movedUp.join(' | '),
  );
  await app.keys(['Control', 'z']);
  await sleep(300);
  const back = await app.exec(
    `return Array.from(document.querySelectorAll('.outline [data-outline]')).map((b) => b.textContent.trim())`,
  );
  check('and undo puts it back', back.join('|') === outlined.join('|'), back.join(' | '));
  await app.keys(['Control', 'Shift', 'o']);
  await app.waitGone('.outline', 3000);

  // --- Back in the diagram, the new element is there ---
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node');
  await sleep(400);
  check(
    'what was written as text is in the diagram',
    (await titles(app)).includes('The prize of Briseis'),
  );
  await app.screenshot('maps-12-diagram-again');

  // --- A second tree under the project, entered and left; then two side by side ---
  // "Add an element under it" in the menu of the element in view adds a child
  // of it, the project, and names it there; the view stays where it was.
  await app.newElementUnder();
  await app.keys('Article');
  await app.press('Enter');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const rootName = () =>
    app.exec(`return document.querySelector('.diagram .node.root .caption')?.textContent.trim()`);
  check(
    'a new element under the project is one of its trees',
    (await app.mapNames()).includes('Article'),
    (await app.mapNames()).join(' | '),
  );
  check(
    'and is in the diagram, under the project',
    (await titles(app)).includes('Article') && (await rootName()) === 'Wrath and the hero',
    (await titles(app)).join(' | '),
  );
  // Entered from the list, where the trees of the project stand under it.
  await app.openMap('Article');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  check('entered from the list, it is the element in view', (await rootName()) === 'Article', await rootName());
  // And left by the crumb of its parent, before it in the path.
  await app.up();
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  check(
    "the parent's crumb in the path goes up",
    (await rootName()) === 'Wrath and the hero',
    await rootName(),
  );
  // Split view is a menu of what the other side shows; the other side shows the element chosen in its own path.
  await app.click('.top button[data-side-by-side]');
  const one = await offered();
  check(
    'Split view is a menu: this element, another element, another project',
    JSON.stringify(one) === JSON.stringify(['This element, as diagram and text', 'Another element…', 'Another project…']),
    one.join(' | '),
  );
  check('and the button is not lit with one side', !(await lit()));
  await app.screenshot('maps-13a-beside-menu');
  await app.clickText('.menu [role="menuitem"]', 'This element, as diagram and text');
  await sleep(500);
  check('two sides, from Split view', (await app.count('.pane')) === 2);
  check('and the button is lit while two sides are shown', await lit());
  await app.screenshot('maps-13-beside');

  // --- The room each has can be changed ---
  const widths = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.pane')).map((p) => Math.round(p.getBoundingClientRect().width))`,
    );
  const even = await widths();
  await app.drag('.panes .divider', { dx: -180, dy: 0 });
  await sleep(300);
  const uneven = await widths();
  check(
    'the line between two maps can be moved',
    Math.abs(even[0] - even[1]) < 4 && even[0] - uneven[0] > 150 && uneven[1] - even[1] > 150,
    `${even.join('/')} → ${uneven.join('/')}`,
  );
  await app.doubleClick('.panes .divider');
  await sleep(300);
  const again = await widths();
  check('and put back by a double click', Math.abs(again[0] - again[1]) < 4, again.join('/'));
  await app.drag('.panes .divider', { dx: 120, dy: 0 });
  await sleep(200);
  kept = await widths();
  await app.screenshot('maps-13b-resized');

  // One at a time, at the foot of the menu while two are shown, and two again by its key: the same map as diagram and as text.
  await app.click('.top button[data-side-by-side]');
  const two = await offered();
  check('with two sides the menu ends in One at a time', two[two.length - 1] === 'One at a time', two.join(' | '));
  await app.clickText('.menu [role="menuitem"]', 'One at a time');
  await sleep(300);
  check('one at a time', (await app.count('.pane')) === 1);
  await app.keys(['Control', 'Shift', 's']);
  check('Ctrl+Shift+S opens the menu of Split view', (await offered()).includes('Another element…'));
  await app.clickText('.menu [role="menuitem"]', 'This element, as diagram and text');
  await sleep(500);
  const both = await shownIn();
  check(
    'two side by side: the map as diagram and as text',
    new Set(both.map((t) => t.split(':')[1])).size === 1 &&
      both
        .map((t) => t.split(':')[0])
        .sort()
        .join() === 'diagram,text',
    both.join(' | '),
  );
  await app.screenshot('maps-13c-diagram-and-text');

  // Another element of the project, chosen in its tree, in the other side.
  await app.click('.top button[data-side-by-side]');
  await offered();
  await app.clickText('.menu [role="menuitem"]', 'Another element…');
  await app.waitFor('dialog [data-pick]', 3000);
  await app.clickText('dialog [data-pick]', 'Article');
  await app.clickText('dialog footer button', 'Show beside');
  await app.waitGone('dialog [data-pick]', 3000);
  await sleep(500);
  const chosen = await shownIn();
  check(
    'Another element… shows the element chosen in the other side',
    chosen.length === 2 && chosen[1].endsWith(':Article') && !chosen[0].endsWith(':Article'),
    chosen.join(' | '),
  );
  await app.screenshot('maps-13d-another-element');
  // And back to this element as diagram and as text, as it is left: the element in view of the side with the focus, the first.
  await app.exec(`document.querySelector('.pane').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
  await app.click('.top button[data-side-by-side]');
  await offered();
  await app.clickText('.menu [role="menuitem"]', 'This element, as diagram and text');
  await sleep(500);
  check('this element again on both sides', new Set((await shownIn()).map((t) => t.split(':')[1])).size === 1, (await shownIn()).join(' | '));

  // Leaving the project puts it in order on disk.
  await app.home();
  await sleep(600);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('maps-failure').catch(() => {});
  console.error('page errors:', await app.pageErrors().catch(() => []));
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

// --- What was made is there when the application is opened again ---
app = await App.launch({ dataDir });
try {
  await app.installErrorHook();
  await app.waitFor('[data-projects-pane] .row.project', 8000);
  await sleep(400);
  check('the project is in the list when the application is opened again', !!(await app.findByText('[data-projects-pane] .row.project', 'Wrath').catch(() => null)));
  await app.screenshot('maps-14-projects');
  await app.openProject('Wrath');
  await app.waitFor('.pane', 8000);
  await sleep(600);
  const count = await app.exec(
    `return document.querySelectorAll('.diagram .node, .text-view .section').length`,
  );
  const reopened = await app.exec(
    `return Array.from(document.querySelectorAll('.pane')).map((p) => Math.round(p.getBoundingClientRect().width))`,
  );
  check(
    'with the room each part had',
    reopened.length === 2 && Math.abs(reopened[0] - kept[0]) < 6,
    `${kept.join('/')} → ${reopened.join('/')}`,
  );
  check(
    'the project opens as it was left',
    (await app.count('.pane')) === 2 && count >= 9,
    `${count} elements shown`,
  );

  // --- Another project beside: chosen in the menu of Split view, at its top or at an element of its tree; and by Enter beside in the list at the left ---
  await app.beginProject();
  await app.type('dialog input', 'Odyssey');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.newElementUnder();
  await app.keys('Ithaca');
  await app.press('Enter');
  await sleep(500);
  await app.openProject('Wrath');
  await app.waitFor('.pane', 8000);
  await sleep(500);
  await beside('Another project…');
  await app.waitFor('dialog [data-beside-chooser] .row.project', 5000);
  const chooser = await app.exec(
    `const d = document.querySelector('dialog [data-beside-chooser]');
     const own = Array.from(d.querySelectorAll('.row.project')).find((r) => r.textContent.includes('Wrath'));
     return {
       own: !!own && own.classList.contains('unavailable') && own.textContent.includes('It is open now'),
       field: !!d.querySelector('input'),
       owl: !!d.querySelector('[data-owl]'),
       menus: d.querySelectorAll('button.row-menu').length,
     };`,
  );
  check('Another project… shows the list of projects, the open one greyed as open now', chooser.own && chooser.field, JSON.stringify(chooser));
  check('with no owl row and no menus in it', !chooser.owl && chooser.menus === 0, JSON.stringify(chooser));
  await app.screenshot('maps-15-beside-chooser');
  // The open project is not chosen.
  await app.clickText('dialog [data-beside-chooser] .row.project', 'Wrath');
  await sleep(300);
  check('the open project cannot be chosen', await app.exists('dialog [data-beside-chooser]'));
  await app.clickText('dialog [data-beside-chooser] .row.project', 'Odyssey');
  await app.waitGone('dialog [data-beside-chooser]', 3000);
  await app.waitUntil(`return document.querySelector('.top .cell[data-side="1"] [data-crumb-last] .name')?.textContent.trim() === 'Odyssey'`, 8000, 'Odyssey beside').catch(() => {});
  let sides = await shownIn();
  check('a project chosen is shown beside, at its top', sides.length === 2 && sides[1].endsWith(':Odyssey') && sides[0].endsWith(':Wrath and the hero'), sides.join(' | '));
  await app.screenshot('maps-15b-project-beside');
  // At an element of its tree, unfolded under it in the chooser, from the first side:
  // what is chosen goes into the side without the focus.
  await app.exec(`document.querySelectorAll('.panes > .pane')[0].querySelector('.pane-body').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
  await sleep(200);
  await beside('Another project…');
  await app.waitFor('dialog [data-beside-chooser] .row.project', 5000);
  await unfoldRow('dialog [data-beside-chooser]', 'Odyssey');
  await app.waitForText('dialog [data-closed-tree] .row.element', 'Ithaca', 5000);
  await app.clickText('dialog [data-closed-tree] .row.element', 'Ithaca');
  await app.waitGone('dialog [data-beside-chooser]', 3000);
  await app.waitUntil(`return document.querySelector('.top .cell[data-side="1"] [data-crumb-last] .name')?.textContent.trim() === 'Ithaca'`, 8000, 'Ithaca beside').catch(() => {});
  sides = await shownIn();
  check('or at the element of its tree chosen', sides.length === 2 && sides[1].endsWith(':Ithaca'), sides.join(' | '));
  check('the path of the other side has its project', (await app.exec(`return document.querySelector('.top .cell[data-side="1"] [data-crumb="project"] .name')?.textContent.trim() ?? ''`)) === 'Odyssey');
  await app.screenshot('maps-15c-element-beside');
  // One at a time closes the other project; in the list at the left, Enter beside on an
  // element of its tree, and Open beside on the project, open it again. One at a time
  // closes the side without the focus: the focus goes to the first side first.
  await app.exec(`document.querySelectorAll('.panes > .pane')[0].querySelector('.pane-body').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
  await sleep(200);
  await beside('One at a time');
  await sleep(400);
  check('one at a time closes the project beside', (await app.count('.pane')) === 1);
  if (!(await app.exists('[data-projects-pane]'))) await app.click('[data-projects-button]');
  await app.waitFor('[data-projects-pane] [data-project]', 5000);
  await unfoldRow('[data-projects-pane]', 'Odyssey');
  await app.waitForText('[data-projects-pane] [data-closed-tree] .row.element', 'Ithaca', 5000);
  await app.rightClick(await app.findByText('[data-projects-pane] [data-closed-tree] .row.element', 'Ithaca'));
  await offered();
  await app.clickText('.menu [role="menuitem"]', 'Enter beside');
  await app.waitUntil(`return document.querySelector('.top .cell[data-side="1"] [data-crumb-last] .name')?.textContent.trim() === 'Ithaca'`, 8000, 'Ithaca beside').catch(() => {});
  sides = await shownIn();
  check('Enter beside, in the menu of an element of a tree in the list, shows it beside', sides.length === 2 && sides[1].endsWith(':Ithaca'), sides.join(' | '));
  await app.exec(`document.querySelectorAll('.panes > .pane')[0].querySelector('.pane-body').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`);
  await sleep(200);
  await beside('One at a time');
  await sleep(400);
  await app.rightClick(await app.findByText('[data-projects-pane] .row.project', 'Odyssey'));
  await offered();
  await app.clickText('.menu [role="menuitem"]', 'Open beside');
  await app.waitUntil(`return document.querySelector('.top .cell[data-side="1"] [data-crumb-last] .name')?.textContent.trim() === 'Ithaca'`, 8000, 'Odyssey beside, where it was left').catch(() => {});
  sides = await shownIn();
  check('and Open beside, in the menu of a project, where it was left', sides.length === 2 && sides[1].endsWith(':Ithaca'), sides.join(' | '));
  await app.screenshot('maps-15d-enter-beside');

  const errors = await app.pageErrors();
  check('no errors after reopening', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('maps-failure-2').catch(() => {});
  checks.push({ name: 'the second run completed', ok: false });
} finally {
  app.ownsData = true;
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
