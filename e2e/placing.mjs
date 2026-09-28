// Where figures and equations stand: at a side, with the text flowing around
// them, beside each other; and that the width of a figure can be set.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="#f4efe6"/><circle cx="300" cy="150" r="110" fill="${colour}"/></svg>`;
writeFileSync(join(desk, 'The shield.svg'), drawing('#7a2e2e'));
writeFileSync(join(desk, 'A vase.svg'), drawing('#2e4a7a'));
const long =
  'The wrath of Achilles is the first word of the poem and its subject. It is a wrath that belongs to gods more than to men, and what it brings is told at once: pains without number, and the souls of heroes sent to Hades. ';

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
  const rect = (selector) =>
    app.exec(
      `const e = document.querySelector(arguments[0]); if (!e) return null; const r = e.getBoundingClientRect();
       return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
      selector,
    );
  const figures = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view figure.figure')).map((f) => (f.dataset.stand || '-') + (f.hasAttribute('data-around') ? '+around' : '') + (f.parentElement.classList.contains('row-of') ? '+row' : ''))`,
    );
  const choose = async (panel, words) => {
    await app.clickText(`${panel} button`, words);
    await sleep(250);
  };

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const project = (await invoke('project_list'))[0].id;
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys(long);
  let at = await rect('.text-view .ProseMirror.body p');
  await drop([join(desk, 'The shield.svg')], at.x, at.bottom - 4);
  await until('the figure', () => app.exists('.text-view figure img[src^="blob:"]'), 10000);
  await sleep(200);
  await app.keys('The shield');
  await app.press('Enter');
  await app.keys(long + long);
  check('a figure stands in the middle where the format has figures there', (await figures()).join('|') === 'center', (await figures()).join('|'));

  // ---- the width can be set with the bar ----
  await app.click('.text-view figure .picture');
  await app.waitFor('.figure-panel', 3000);
  await sleep(300);
  const before = await rect('.figure-panel');
  const picture = await rect('.text-view figure .picture');
  check('the panel stands beside the figure, and not over the picture', before.left >= picture.right || before.right <= picture.left || before.top >= picture.bottom, JSON.stringify({ before, picture }));
  // The bar is taken and moved, as by a hand: the panel must stay under it.
  const bar = await rect('.figure-panel input[type="range"]');
  const places = [];
  const track = async (dx) => {
    await app.cmd('POST', '/actions', {
      actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerMove', origin: 'pointer', x: dx, y: 0, duration: 40 }] }],
    });
    const r = await rect('.figure-panel');
    places.push(`${r.left},${r.top}`);
  };
  await app.cmd('POST', '/actions', {
    actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [
      { type: 'pointerMove', origin: 'viewport', x: bar.left + Math.round(bar.width * 0.45), y: bar.y },
      { type: 'pointerDown', button: 0 },
    ] }],
  });
  for (const dx of [-20, -20, -20, 30, 30]) await track(dx);
  const during = await app.exec(`return document.querySelector('.text-view figure .picture').style.width`);
  await app.cmd('POST', '/actions', {
    actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerUp', button: 0 }] }],
  });
  await app.cmd('DELETE', '/actions');
  await sleep(300);
  check('while the width is set, the panel stays where it is', new Set(places).size === 1 && places[0] === `${before.left},${before.top}`, places.join(' '));
  const after = await app.exec(`return document.querySelector('.text-view figure .picture').style.width`);
  const said = await app.exec(`return document.querySelector('.figure-panel .amount').textContent.trim()`);
  check('and the picture is as wide as the bar says', after === during && after === said && /^\d+%$/.test(after) && after !== '100%', `${during} ${after} ${said}`);
  await app.screenshot('placing-1-width');

  // ---- to the right, with the text flowing around it ----
  await choose('.figure-panel', 'Right');
  check('a figure is put to the right', (await figures()).join('|') === 'right', (await figures()).join('|'));
  await choose('.figure-panel', 'Flows around it');
  check('and the text flows around it', (await figures()).join('|') === 'right+around', (await figures()).join('|'));
  const figure = await rect('.text-view figure.figure');
  const text = await app.exec(
    `const ps = Array.from(document.querySelectorAll('.text-view .ProseMirror.body > p')); const r = ps[ps.length - 1].getBoundingClientRect(); return { top: Math.round(r.top), left: Math.round(r.left) }`,
  );
  check('beside it, where the text is written', text.top < figure.bottom && text.left < figure.left, JSON.stringify({ text, figure }));
  await app.screenshot('placing-2-around');
  await app.press('Escape');
  await app.waitGone('.figure-panel');

  // ---- an equation to the left ----
  await app.keys(['Control', 'End']);
  await app.press('Enter');
  await app.keys(['Control', 'Alt', 'e']);
  await app.waitFor('.formula-panel textarea', 3000);
  await sleep(200);
  await app.keys('a^2 + b^2 = c^2');
  await choose('.formula-panel', 'Left');
  await app.waitFor('.formula-panel textarea', 3000);
  const kept = await app.exec(`return document.querySelector('.formula-panel textarea').value`);
  check('an equation is put to the left, and what was written of it is kept', kept === 'a^2 + b^2 = c^2' && (await app.exec(`return document.querySelector('.text-view .equation').dataset.stand`)) === 'left', kept);
  await app.exec(`document.querySelector('.formula-panel textarea').focus()`);
  await app.press('Enter');
  await app.waitGone('.formula-panel');

  // ---- beside each other ----
  at = await rect('.text-view .ProseMirror.body > p:last-of-type');
  await drop([join(desk, 'A vase.svg')], at.x, at.y);
  await until('the second figure', async () => (await app.count('.text-view figure img[src^="blob:"]')) === 2, 10000);
  await sleep(200);
  await app.keys('A vase');
  await app.press('Enter');
  at = await rect('.text-view .ProseMirror.body > p:last-of-type');
  await drop([join(desk, 'The shield.svg')], at.x, at.y);
  await until('the third figure', async () => (await app.count('.text-view figure img[src^="blob:"]')) === 3, 10000);
  await sleep(200);
  await app.keys('The shield again');
  await app.exec(`Array.from(document.querySelectorAll('.text-view figure .picture')).pop().dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }))`);
  await app.waitFor('.figure-panel', 3000);
  await sleep(300);
  await app.clickText('.figure-panel button', 'Put it beside the one before it');
  await until('the row', () => app.exists('.text-view .row-of'));
  await sleep(400);
  const beside = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .row-of > figure')).map((f) => { const r = f.getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top) } })`,
  );
  check('two figures stand beside each other', beside.length === 2 && beside[0].right <= beside[1].left && Math.abs(beside[0].top - beside[1].top) < 40, JSON.stringify(beside));
  check('each with its number', (await app.exec(`return Array.from(document.querySelectorAll('.text-view .row-of figcaption')).map((f) => (f.dataset.label || '').replace(/\\u00a0/g, ' ').trim()).join('|')`)) === 'Figure 2.|Figure 3.');
  await app.waitFor('.figure-panel', 3000);
  check('the panel says so', /beside others, in a row/.test(await app.text('.figure-panel')));
  await app.screenshot('placing-3-beside');
  await app.press('Escape');
  await app.waitGone('.figure-panel');

  // ---- where the text is shown, and in the document ----
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await until('the figures as they stand', async () => (await figures()).join('|') === 'right+around|-+row|-+row', 8000).catch(() => {});
  check('where the text is shown, they stand as they were put', (await figures()).join('|') === 'right+around|-+row|-+row', (await figures()).join('|'));
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview .page', 30000);
  const typ = () => readFileSync(join(app.dataDir, 'work', project, 'preview', 'document.typ'), 'utf8');
  await until('the document', () => /#gk-row\(2/.test(typ()), 20000);
  const made = typ();
  check('the document has the text flowing around the figure', /#gk-around\(right, \d+\.0%, \[/.test(made), made.slice(made.indexOf('#gk-around'), made.indexOf('#gk-around') + 120));
  check('the equation to the left', made.includes('#show math.equation: set align(left)'));
  check('and the two beside each other', /#gk-row\(2, \(bottom, top,\), \[/.test(made), made.slice(made.indexOf('#gk-row(2'), made.indexOf('#gk-row(2') + 80));
  await sleep(1500);
  const remarks = await app.exec(`const r = document.querySelector('.preview footer'); return r ? r.textContent : ''`);
  check('which Typst sets without complaint', !/remark/.test(remarks), remarks);
  await app.screenshot('placing-4-preview');

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('placing-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
