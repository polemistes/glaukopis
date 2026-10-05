// Verse and texts side by side: lines of drama kept as lines, with a
// speaker and a stage direction, numbered in the margin from the line the
// writer says; an original and its translation side by side; and the
// preview set with them, without remark.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Medea');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The prologue');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const body = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('prologue'));
     return s.querySelector('.body');`,
  );
  await app.click(body['element-6066-11e4-a52e-4f735466cecf']);
  await app.waitFor('.text-view .section .body .prose[contenteditable="true"]');
  await sleep(200);

  // --- Lines written as paragraphs, made verse ---
  await app.keys('Nurse');
  await app.press('Enter');
  await app.keys('If only the Argo had never flown');
  await app.press('Enter');
  await app.keys('through the dark Clashing Rocks');
  await app.press('Enter');
  await app.keys('to the land of Colchis,');
  await app.press('Enter');
  await app.keys('nor the pine been felled');
  await app.press('Enter');
  await app.keys('in the glens of Pelion.');
  await sleep(200);
  await app.keys(['Control', 'a']);
  await app.click('.pane-bar .tools .style');
  // Verse is not in hand until it is used: it is found under More….
  await app.clickText('[role="menuitem"]', 'More…');
  await sleep(200);
  await app.clickText('[role="menuitem"]', 'Verse');
  await sleep(300);
  const lines = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .verse .verse-line')).map((l) => l.textContent.trim())`,
  );
  check(
    'the paragraphs are lines of one verse',
    lines.length === 6 && lines[0] === 'Nurse',
    lines.join(' | '),
  );
  await app.waitForText('.pane-bar .tools .style', 'Verse', 3000);

  // --- The first line is the speaker; the third is indented ---
  await app.exec(
    `const l = document.querySelector('.text-view .verse .verse-line'); const s = getSelection(); s.selectAllChildren(l); s.collapseToStart();`,
  );
  await sleep(150);
  await app.click('.pane-bar .tools .style');
  await app.clickText('[role="menuitem"]', 'Speaker');
  await sleep(250);
  check('a line can be the speaker', await app.exists('.text-view .verse .verse-line.speaker'));
  await app.exec(
    `const l = document.querySelectorAll('.text-view .verse .verse-line')[2]; const s = getSelection(); s.selectAllChildren(l); s.collapseToEnd();`,
  );
  await sleep(150);
  await app.press('Tab');
  await sleep(200);
  const indented = await app.exec(
    `return document.querySelectorAll('.text-view .verse .verse-line')[2].getAttribute('data-indent')`,
  );
  check('Tab indents a line', indented === '1', String(indented));

  // --- The lines are numbered from 1, every 2 ---
  await app.click('.pane-bar .tools button[aria-label="Line numbers"]');
  await app.waitForText('dialog[open] h2', 'Line numbers', 3000);
  await sleep(200);
  await app.exec(
    `const i = document.querySelectorAll('dialog[open] input')[0]; i.focus(); i.select();`,
  );
  await app.keys('1');
  await app.exec(
    `const i = document.querySelectorAll('dialog[open] input')[1]; i.focus(); i.select();`,
  );
  await app.keys('2');
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  const numbers = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .verse .verse-line')).map((l) => l.getAttribute('data-n') ?? '-').join(' ')`,
  );
  check(
    'the lines are numbered in the margin, the speaker not counted',
    numbers === '- 1 2 - 4 -',
    numbers,
  );
  await app.screenshot('verse-1-lines');

  // --- Enter at the end twice leaves the verse ---
  await app.exec(
    `const l = Array.from(document.querySelectorAll('.text-view .verse .verse-line')).pop(); const s = getSelection(); s.selectAllChildren(l); s.collapseToEnd();`,
  );
  await app.press('Enter');
  await app.press('Enter');
  await sleep(200);
  await app.keys('So the nurse begins.');
  await sleep(200);
  check(
    'Enter on an empty last line leaves the verse for a paragraph',
    (await app.exec(`return document.querySelectorAll('.text-view .verse .verse-line').length`)) ===
      6 &&
      (await app.exec(
        `return Array.from(document.querySelectorAll('.text-view .body p:not(.verse-line)')).some((p) => p.textContent.includes('So the nurse'))`,
      )),
  );

  // --- Two texts side by side ---
  await app.clickText('.pane-bar .tools button', 'Insert');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Two texts side by side');
  await sleep(300);
  await app.keys('Εἴθ᾽ ὤφελ᾽ Ἀργοῦς');
  await app.press('Tab');
  await app.keys('If only the Argo');
  await sleep(200);
  const sides = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .parallel .parallel-side')).map((s) => s.textContent.trim())`,
  );
  check(
    'the two sides are written, Tab going across',
    sides.length === 2 && sides[0].startsWith('Εἴθ') && sides[1] === 'If only the Argo',
    sides.join(' | '),
  );
  await app.screenshot('verse-2-parallel');

  // --- A script: the parts follow one another with Enter and Tab ---
  await app.exec(
    `const ps = Array.from(document.querySelectorAll('.text-view .body p:not(.verse-line)')); const l = ps[ps.length - 1]; const s = getSelection(); s.selectAllChildren(l); s.collapseToEnd();`,
  );
  await app.press('Enter');
  await sleep(150);
  await app.click('.pane-bar .tools .style');
  // The parts of a script are not in hand until one is used: under More….
  await app.clickText('[role="menuitem"]', 'More…');
  await sleep(200);
  await app.clickText('[role="menuitem"]', 'Scene heading');
  await sleep(200);
  await app.keys('Int. Palace – night');
  await app.press('Enter');
  await app.keys('Medea paces.');
  await app.press('Tab');
  await sleep(100);
  await app.keys('Nurse');
  await app.press('Enter');
  await app.keys('If only the Argo had never flown.');
  await sleep(200);
  const script = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .body p.script')).map((p) => p.className.replace('script ', '') + ':' + p.textContent.trim()).join(' | ')`,
  );
  check(
    'a scene heading, then action; Tab makes a character, Enter its dialogue',
    script ===
      'scene:Int. Palace – night | action:Medea paces. | character:Nurse | dialogue:If only the Argo had never flown.',
    script,
  );
  await app.waitForText('.pane-bar .tools .style', 'Dialogue', 3000);
  await app.screenshot('verse-2b-script');

  // --- The preview sets them ---
  await app.click('header button[aria-label="Preview and export"]');
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  check('the preview is made without remark', !(await app.exists('.preview footer .issues')));
  await app.screenshot('verse-3-preview');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('verse-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
