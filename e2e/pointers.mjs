// Words that point: to figures, equations and the parts of the document.

import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

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

const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
const drawing = (colour) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="140" viewBox="0 0 300 140"><rect width="300" height="140" fill="#f4efe6"/><circle cx="150" cy="70" r="46" fill="${colour}"/></svg>`;
writeFileSync(join(desk, 'The shield.svg'), drawing('#7a2e2e'));
writeFileSync(join(desk, 'A vase.svg'), drawing('#2e4a7a'));

const app = await App.launch({ width: 1360, height: 900 });
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
  const at = (selector, dy = 0) =>
    app.exec(
      `const r = document.querySelector(arguments[0]).getBoundingClientRect();
       return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) + arguments[1] };`,
      selector,
      dy,
    );
  const section = (name) => `.text-view .section[data-title="${name}"]`;
  /** Marks the sections by their names, so that they can be found. */
  const mark = () =>
    app.exec(
      `for (const s of document.querySelectorAll('.text-view .section')) {
         const t = s.querySelector('.heading .prose');
         s.dataset.title = t ? t.textContent.trim() : '';
       }`,
    );
  const pointers = (scope = '.text-view') =>
    app.exec(
      `return Array.from(document.querySelectorAll(arguments[0] + ' .crossref')).map((c) => c.textContent.replace(/\\u00a0/g, ' ') + (c.classList.contains('missing') ? '!' : ''))`,
      scope,
    );

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const project = (await invoke('project_list'))[0].id;
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
  await add('Tab', 'The word');
  await add('Enter', 'The shield');
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(300);
  await mark();

  // ---- something to point to ----
  await app.click(`${section('The word')} .body`);
  await sleep(300);
  await app.keys('The first word of the poem.');
  let where = await at(`${section('The word')} .ProseMirror.body p`);
  await drop([join(desk, 'The shield.svg')], where.x, where.y);
  await until('the figure', () => app.exists(`${section('The word')} figure img[src^="blob:"]`), 10000);
  await sleep(200);
  await app.keys('The shield of Achilles');
  await app.press('Enter');
  await app.keys(['Control', 'Alt', 'e']);
  await app.waitFor('.formula-panel textarea', 3000);
  await sleep(200);
  await app.keys('a^2 + b^2 = c^2');
  await app.click('.formula-panel .counted input');
  await app.exec(`document.querySelector('.formula-panel textarea').focus()`);
  await app.press('Enter');
  await app.waitGone('.formula-panel');
  await until('the number of the equation', () =>
    app.exec(`const e = document.querySelector('.text-view .equation'); return e && e.dataset.number === '(1)'`),
  );

  // ---- pointing ----
  await mark();
  await app.click(`${section('The shield')} .body`);
  await sleep(300);
  await app.keys('It is described at length, see ');
  await app.keys(['Control', 'Alt', 'r']);
  await app.waitFor('.targets input', 3000);
  await sleep(300);
  const offered = await app.exec(
    `return Array.from(document.querySelectorAll('.targets .row')).map((r) => r.dataset.kind + ':' + r.querySelector('.called').textContent.replace(/\\u00a0/g, ' ').trim() + ':' + r.querySelector('.words').textContent.trim())`,
  );
  check(
    'what can be pointed to is offered: the figures, the equations, the parts',
    offered.join(' | ') === 'figure:Figure 1:The shield of Achilles | equation:(1):a^2 + b^2 = c^2 | part::The word | part::The shield',
    offered.join(' | '),
  );
  check('a figure with its picture', await app.exists('.targets .row[data-kind="figure"] .mark img[src^="blob:"]'));
  await app.screenshot('pointers-1-picker');
  await app.keys('achilles');
  await sleep(250);
  check('it is found by what is said of it', (await app.count('.targets .row')) === 1);
  await app.press('Enter');
  await app.waitGone('.targets');
  await until('the words that point', async () => (await pointers()).length === 1);
  check('the words say what the document calls the figure', (await pointers()).join('|') === 'Figure 1', (await pointers()).join('|'));
  await app.keys(', and by ');
  await app.clickText('.pane-bar .tools button', 'Insert');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"], .menu button', 'Cross-reference');
  await app.waitFor('.targets input', 3000);
  await sleep(250);
  await app.keys('a^2');
  await sleep(250);
  await app.press('Enter');
  await app.waitGone('.targets');
  await app.keys(' in ');
  await app.keys(['Control', 'Alt', 'r']);
  await app.waitFor('.targets input', 3000);
  await sleep(250);
  await app.keys('the word');
  await sleep(250);
  await app.press('Enter');
  await app.waitGone('.targets');
  await app.keys('.');
  await sleep(300);
  check('an equation by its number, a part by its name', (await pointers()).join('|') === 'Figure 1|(1)|The word', (await pointers()).join('|'));
  const line = await app.exec(`return document.querySelector(arguments[0]).textContent.replace(/\\u00a0/g, ' ')`, `${section('The shield')} .ProseMirror.body p`);
  check('they stand in the line as words', line === 'It is described at length, see Figure 1, and by (1) in The word.', line);
  await app.screenshot('pointers-2-text');

  // ---- the words follow what they point to ----
  await app.click('.text-view .section .body');
  await sleep(300);
  where = await at('.text-view .section .ProseMirror.body');
  await drop([join(desk, 'A vase.svg')], where.x, where.y);
  await until('the second figure', async () => (await app.count('.text-view figure img[src^="blob:"]')) === 2, 10000);
  await until('the words to follow', async () => (await pointers())[0] === 'Figure 2');
  check('a figure put before it, and the words say its new number', true);
  const labels = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view figure figcaption')).map((f) => (f.dataset.label || '').replace(/\\u00a0/g, ' ').trim()).join('|')`,
  );
  check('which is the number under the figure', labels === 'Figure 1|Figure 2.', labels);

  // How they point can be changed.
  await app.exec(`document.querySelector('.text-view .crossref').click()`);
  await app.waitFor('.menu');
  await sleep(150);
  const forms = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"], .menu [role="menuitemcheckbox"], .menu button')).map((b) => b.textContent.replace(/\\s+/g, ' ').replace(/\\u00a0/g, ' ').trim())`);
  check('how the words point can be chosen', forms.some((f) => /The number alone/.test(f) && /2/.test(f)), forms.join(' | '));
  await app.screenshot('pointers-3-forms');
  await app.clickText('.menu [role="menuitem"], .menu [role="menuitemcheckbox"], .menu button', 'The number alone');
  await until('the number alone', async () => (await pointers())[0] === '2');
  check('by the number alone', true);

  // ---- where the text is shown and not written ----
  await app.press('Escape');
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await until('the words in the text as it is shown', async () => (await pointers('.text-view .static')).join('|') === '2|(1)|The word');
  check('where the text is only shown, the words are there as well', true);

  // ---- in the document ----
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  const work = join(app.dataDir, 'work', project, 'preview', 'document.typ');
  const typ = () => readFileSync(work, 'utf8');
  await until('the document to hold the pointers', () => /#link\(<gk-to-/.test(typ()), 15000);
  const made = typ();
  check('the document has the words, which lead to what they point to', /see #link\(<gk-to-[0-9A-Za-z]+>\)\[2\], and by #link\(<gk-to-[0-9A-Za-z]+>\)\[\\\(1\)\] in #link\(<gk-to-[0-9a-zA-Z-]+>\)\[The word\]\./.test(made), made.slice(made.indexOf('It is described'), made.indexOf('It is described') + 300));
  check('and what is pointed to has a place there', (made.match(/<gk-to-[0-9A-Za-z-]+>/g) ?? []).length >= 6);
  await app.screenshot('pointers-4-preview');

  // ---- what is pointed to is taken away ----
  await mark();
  await app.click(`${section('The word')} .body`);
  await app.waitFor(`${section('The word')} figure .picture`, 5000);
  await sleep(300);
  await app.click(`${section('The word')} figure .picture`);
  await app.waitFor('.figure-panel', 3000);
  await sleep(250);
  await app.clickText('.figure-panel button', 'Remove the figure');
  await until('the words to have lost what they pointed to', async () => (await pointers())[0] === '?!');
  check('words that point to what is gone say so', true);
  await until('the document to say so', () => typ().includes('#strong[\\[?\\]]'), 20000);
  check('nothing else is opened by taking the figure away', !(await app.exists('.formula-panel, .figure-panel')));
  await until('the preview to remark on it', () => app.exists('.preview .remarks, .preview [class*="remark"]'), 5000).catch(() => {});
  check('and so does the document', typ().includes('see #strong[\\[?\\]], and by'), typ().slice(-400));
  await app.screenshot('pointers-5-gone');

  // Pointed elsewhere.
  await mark();
  await app.click(`${section('The shield')} .body`);
  await app.waitFor(`${section('The shield')} .ProseMirror .crossref`, 5000);
  await sleep(300);
  await app.exec(`document.querySelector(arguments[0]).click()`, `${section('The shield')} .ProseMirror .crossref`);
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"], .menu button', 'Refer to something else');
  await app.waitFor('.targets input', 3000);
  await sleep(250);
  await app.press('Enter');
  await app.waitGone('.targets');
  await until('the words to point again', async () => (await pointers())[0] === 'Figure 1');
  check('they can be pointed to something else', (await pointers()).join('|') === 'Figure 1|(1)|The word', (await pointers()).join('|'));

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('pointers-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
