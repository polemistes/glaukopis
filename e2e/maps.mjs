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
  app.exec(`return Array.from(document.querySelectorAll('.diagram .node .caption')).map((e) => e.textContent.trim())`);

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
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  check('a new project has one map with its centre', JSON.stringify(await titles(app)) === '["Wrath and the hero"]');
  await app.screenshot('maps-2-new-project');

  // --- Building the map from the keyboard ---
  await app.click('.diagram .node.root');
  const add = async (key, name) => {
    await app.press(key);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await add('Tab', 'The word mênis');
  await add('Enter', 'Achilles and Apollo');
  await add('Enter', 'The economy of honour');
  await add('Enter', 'Reception');
  // Under the last one.
  await add('Tab', 'Virgil');
  await add('Enter', 'Milton');
  const names = await titles(app);
  check('Tab and Enter build the tree', names.length === 7 && names.includes('Milton'), names.join(' | '));

  // The sides are balanced around the centre.
  const sides = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node.depth-1')).map((e) => e.classList.contains('left') ? 'L' : 'R').join('')`,
  );
  check('the branches stand on both sides of the centre', sides.includes('L') && sides.includes('R'), sides);
  await app.screenshot('maps-3-built');

  // --- Undo and redo ---
  await app.keys(['Control', 'z']);
  await sleep(200);
  const afterUndo = await titles(app);
  await app.keys(['Control', 'Shift', 'z']);
  await sleep(200);
  check('undo takes back, redo brings again', afterUndo.length < 7 && (await titles(app)).length === 7, `${afterUndo.length}`);

  // --- Writing in the edit box, with a citation and a note ---
  const mênis = await app.findByText('.diagram .node', 'The word mênis');
  await app.doubleClick(mênis);
  await app.waitFor('.box .text .prose');
  await sleep(250);
  check('the box for writing has the tools too', await app.exists('.box .tools button[aria-label="Italic"]:not(:disabled)'));
  await app.keys('The first word of the Iliad names a wrath that is more than anger ');
  await app.keys('@');
  await app.waitFor('.picker input');
  await app.keys('nagy best');
  await sleep(250);
  await app.screenshot('maps-4-picker');
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
  await app.drag(handle['element-6066-11e4-a52e-4f735466cecf'], await app.findByText('.diagram .node', 'Virgil'));
  await sleep(300);
  check('dragging from the handle associates two elements', (await app.count('.diagram .association')) === 1);
  await app.screenshot('maps-9-association');

  // --- The same map as text ---
  await app.clickText('header [role="radio"]', 'Text');
  await app.waitFor('.text-view .section');
  await sleep(400);
  const headings = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section .heading .title')).map((e) => e.textContent.trim())`,
  );
  check(
    'the text has the elements as headings, in order',
    headings.join('|') === 'Wrath and the hero|The word mênis|Achilles and Apollo|The economy of honour|Reception|Virgil|Milton',
    headings.join(' | '),
  );
  check('the association is a line in the margin', (await app.count('.text-view .bracket')) === 1);
  const margin = await app.exec(
    `const line = document.querySelector('.text-view .bracket .line').getBoundingClientRect();
     const name = document.querySelector('.text-view .section .heading').getBoundingClientRect();
     return { line: Math.round(line.right), name: Math.round(name.left) };`,
  );
  check('which is the left one, beside the names', margin.line <= margin.name && margin.name - margin.line < 80, JSON.stringify(margin));
  await app.screenshot('maps-10-text');

  // Writing in the text, and making a new element from what follows the cursor.
  const economy = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('economy'));
     return s.querySelector('.body');`,
  );
  await app.click(economy['element-6066-11e4-a52e-4f735466cecf']);
  await app.waitFor('.text-view .section .body .ProseMirror-focused, .text-view .section .body .prose[contenteditable="true"]');
  await sleep(200);
  await app.keys('Honour is counted in prizes. ');
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys('The prize of Briseis');
  await app.press('Enter');
  await sleep(150);
  await app.keys('Taken, she is the measure of the insult.');
  await sleep(300);
  const after = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section .heading .title')).map((e) => e.textContent.trim())`,
  );
  check('Ctrl+Enter begins a new element after the one written in', after[4] === 'The prize of Briseis', after.join(' | '));
  await app.screenshot('maps-11-text-written');

  // --- The tools over the text ---
  const written = () =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('Briseis'));
       return s.querySelector('.body .prose').innerHTML;`,
    );
  await app.keys(' So *Iliad* 1 has it.');
  check('signs are left as they are typed', /\*Iliad\* 1 has it/.test(await written()), await written());
  await app.click('.text-view .tools button[aria-label="Italic"]');
  await app.keys('kleos');
  await app.click('.text-view .tools button[aria-label="Italic"]');
  await app.keys(' is what is at stake.');
  check('the tools set what is typed next', /<em>kleos<\/em> is what/.test(await written()), await written());
  await app.clickText('.text-view .tools button', 'Cite');
  await app.waitFor('.picker input', 3000);
  await app.keys('lord singer');
  await sleep(250);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('99');
  await app.press('Enter');
  await app.waitGone('.editor');
  await sleep(200);
  check('the tool for citing cites', /Lord 1960, 99/.test((await written()).replace(/<[^>]+>/g, '')), (await written()).replace(/<[^>]+>/g, ''));
  await app.click('.text-view .tools .style');
  await app.clickText('[role="menuitem"]', 'Quotation');
  await sleep(200);
  check('the kind of paragraph is chosen from a list', /<blockquote>/.test(await written()));
  await app.waitForText('.text-view .tools .style', 'Quotation', 3000);
  check('and shown', true);
  await app.screenshot('maps-11b-tools');
  await app.click('.text-view .tools .style');
  await app.clickText('[role="menuitem"]', 'Text');
  await sleep(200);
  check('and changed back', !/<blockquote>/.test(await written()));

  // --- Back in the diagram, the new element is there ---
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node');
  await sleep(400);
  check('what was written as text is in the diagram', (await titles(app)).includes('The prize of Briseis'));
  await app.screenshot('maps-12-diagram-again');

  // --- A second map, and the two side by side ---
  await app.click('.tabs .add');
  await app.waitFor('.tabs .naming input');
  await app.keys('Article');
  await app.press('Enter');
  await sleep(300);
  check('a second map', (await app.count('.tabs .tab')) === 2);
  await app.rightClick(await app.findByText('.tabs .tab', 'Wrath and the hero'));
  await app.clickText('[role="menuitem"]', 'Open beside');
  await sleep(500);
  check('two maps side by side', (await app.count('.pane')) === 2);
  await app.screenshot('maps-13-beside');

  // Leaving the project puts it in order on disk.
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 5000);
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
  await app.waitFor('.card', 8000);
  const facts = await app.exec(`return document.querySelector('.card .facts').textContent`);
  check('the list of projects tells what is in the project', /2 maps/.test(facts) && /words/.test(facts), facts);
  await app.screenshot('maps-14-projects');
  await app.click('.card');
  await app.waitFor('.pane', 8000);
  await sleep(600);
  const count = await app.exec(`return document.querySelectorAll('.diagram .node, .text-view .section').length`);
  check('the project opens as it was left', (await app.count('.pane')) === 2 && count >= 9, `${count} elements shown`);
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
