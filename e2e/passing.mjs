// The arrows go through the text without opening what they pass: a note,
// a formula, a citation is selected, and Enter opens it. Backspace selects
// a figure it comes to, and does not open it. And a work is taken out of a
// citation by what reads as taking away.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
writeFileSync(
  join(desk, 'shield.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="#f4efe6"/><circle cx="300" cy="150" r="110" fill="#7a2e2e"/></svg>',
);

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.execAsync(
    `const plan = await window.__TAURI_INTERNALS__.invoke('import_bib_text', { text: arguments[0] });
     await window.__TAURI_INTERNALS__.invoke('import_apply', { plan });`,
    bib,
  );

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await app.click('.text-view .section .body');
  await sleep(300);

  // A line with a note, a citation and a formula in it.
  await app.keys('before');
  await app.keys(['Control', 'Alt', 'f']);
  await app.waitFor('.note-panel .prose');
  await app.keys('a note');
  await app.press('Escape');
  await app.waitGone('.note-panel');
  await sleep(150);
  await app.keys(' cited ');
  await app.keys('@');
  await app.waitFor('.picker input');
  await app.keys('nagy best');
  await sleep(250);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('73');
  await app.press('Enter');
  await app.waitGone('.editor');
  await sleep(150);
  await app.keys(' and ');
  await app.keys(['Control', 'Alt', 'm']);
  await app.waitFor('.formula-panel');
  await sleep(200);
  await app.keys('x^2');
  await app.press('Enter');
  await app.waitGone('.formula-panel');
  await sleep(150);
  await app.keys(' after');
  await sleep(300);

  const open = () =>
    app.exec(
      `return ['.note-panel', '.formula-panel', '.figure-panel', '.editor .locator'].filter((s) => document.querySelector(s)).join(' ')`,
    );
  const selected = () =>
    app.exec(
      `const e = document.querySelector('.text-view .ProseMirror .selected, .text-view .ProseMirror .ProseMirror-selectednode'); return e ? e.className.split(' ')[0] : ''`,
    );
  const line = await app.text('.text-view .ProseMirror.body p');
  check('the line is written', /^before\s*cited \(Nagy 1979, 73\) and .* after$/.test(line.replace(/ /g, ' ')), line);

  // ---- through the line, to its beginning and to its end ----
  const opened = [];
  const stopped = [];
  await app.press('Home');
  for (let i = 0; i < 40; i++) {
    await app.press('ArrowRight');
    await sleep(40);
    const o = await open();
    if (o) opened.push(`${i}: ${o}`);
    const s = await selected();
    if (s && stopped[stopped.length - 1] !== s) stopped.push(s);
  }
  check('the arrows go through the line and open nothing', opened.length === 0, opened.join(', '));
  check('what they pass is selected on the way: the note, the citation, the formula', stopped.join(' ') === 'footnote citation math', stopped.join(' '));
  for (let i = 0; i < 40; i++) {
    await app.press('ArrowLeft');
    await sleep(30);
    const o = await open();
    if (o) opened.push(`back ${i}: ${o}`);
  }
  check('nor on the way back', opened.length === 0, opened.join(', '));
  await app.screenshot('passing-1-through');

  // ---- Enter opens what the cursor has stopped at ----
  const stopAt = async (kind) => {
    await app.press('Home');
    for (let i = 0; i < 40; i++) {
      await app.press('ArrowRight');
      await sleep(40);
      if ((await selected()) === kind) return true;
    }
    return false;
  };
  check('the cursor stops at the note', (await stopAt('footnote')) && (await open()) === '');
  await app.press('Enter');
  await sleep(300);
  check('Enter opens the note', (await open()) === '.note-panel', await open());
  await app.press('Escape');
  await app.waitGone('.note-panel');
  await sleep(150);

  check('the cursor stops at the citation', (await stopAt('citation')) && (await open()) === '');
  await app.press('Enter');
  await app.waitFor('.editor .locator input', 3000);
  check('Enter opens the citation', true);
  await app.screenshot('passing-2-citation');

  // ---- what takes a work out of a citation ----
  const corner = await app.exec(
    `const work = document.querySelector('.editor .item .work'); return Array.from(work.querySelectorAll('button')).map((b) => b.getAttribute('aria-label') || b.textContent.trim())`,
  );
  check('no cross stands in the corner of a work', !corner.some((l) => /remove/i.test(l)), JSON.stringify(corner));
  const out = await app.exec(
    `const b = document.querySelector('.editor .item [data-remove]'); const i = document.querySelector('.editor .item'); const r = b.getBoundingClientRect(); const w = i.getBoundingClientRect();
     return { words: b.textContent.trim(), last: r.top > w.top + w.height / 2, sign: !!b.querySelector('svg') }`,
  );
  check('what takes the work out stands last in it, and says what it does', out.words === 'Remove this work' && out.last && out.sign, JSON.stringify(out));
  check('and the citation as a whole is removed by what says so', /Remove the citation/.test(await app.text('.editor .foot')));
  await app.press('Escape');
  await app.waitGone('.editor');
  await sleep(150);

  check('the cursor stops at the formula', (await stopAt('math')) && (await open()) === '');
  await app.press('Enter');
  await sleep(300);
  // The box of a formula is a box as that of a note is, and is told from it by its own name.
  check('Enter opens the formula', (await open()).includes('.formula-panel'), await open());
  await app.press('Escape');
  await app.waitGone('.formula-panel');
  await sleep(150);

  // ---- Backspace comes to a figure, selects it and opens nothing; again, and it is taken away ----
  // Next to a note, a citation or a formula in the line, Backspace takes it away at once, as
  // it takes a letter; what stands by itself, as a figure, it selects first.
  await app.keys(['Control', 'End']);
  await app.press('Enter');
  await sleep(150);
  const end = await app.exec(
    `const ps = document.querySelectorAll('.text-view .ProseMirror.body > p'); const r = ps[ps.length - 1].getBoundingClientRect(); return { x: Math.round(r.left + 20), y: Math.round(r.top + r.height / 2) }`,
  );
  await app.execAsync(
    `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
     const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
     await emit('tauri://drag-enter', { paths: arguments[0], position });
     await emit('tauri://drag-over', { position });
     await emit('tauri://drag-drop', { paths: arguments[0], position });`,
    [join(desk, 'shield.svg')],
    end.x,
    end.y,
  );
  await app.waitFor('.text-view figure.figure img[src^="blob:"]', 10000);
  await sleep(300);
  await app.keys('The shield');
  await app.press('Enter');
  await sleep(200);
  await app.keys('after the figure');
  await sleep(200);
  await app.press('Home');
  await sleep(100);
  await app.press('Backspace');
  await sleep(300);
  check(
    'Backspace at the beginning of what follows a figure selects the figure, and opens nothing',
    (await app.exists('.text-view figure.figure.selected, .text-view figure.figure.ProseMirror-selectednode')) && (await open()) === '',
    `${await selected()} ${await open()}`,
  );
  await app.press('Backspace');
  await sleep(300);
  check('again, and the figure is taken away', (await app.count('.text-view figure.figure')) === 0);
  await app.keys(['Control', 'z']);
  await sleep(400);
  check('and undone, it is there again', (await app.count('.text-view figure.figure')) === 1);
  await app.press('Escape');
  await sleep(200);

  // ---- pressing it opens it, as before ----
  await app.click('.text-view .ProseMirror .footnote');
  await sleep(300);
  check('pressing a note opens it, as before', (await open()) === '.note-panel', await open());
  await app.press('Escape');
  await app.waitGone('.note-panel');

  // ---- a note that is made is open to be written in, as before ----
  await app.keys(['Control', 'End']);
  await app.keys(['Control', 'Alt', 'f']);
  await sleep(300);
  check('a note that is made is open to be written in', (await open()) === '.note-panel', await open());
  await app.press('Escape');
  await app.waitGone('.note-panel');

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('passing-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
