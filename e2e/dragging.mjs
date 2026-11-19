// What is dragged within a text is moved (`src/lib/editor/dragged.ts`).
// Words that are selected, pressed and dragged to another place stand there
// and no longer where they stood, in ordinary text and on a sheet of rich
// text, and undo takes the move back in one step; with Ctrl held when they
// are dropped, a copy is put there. A sheet of rich text is
// dragged by the name in its head, the grip: put before the paragraph it is
// dropped on the first half of and after the one it is dropped on the end
// of, whole, with the cursor in it; a press in the sheet itself is for its
// text, and drags nothing.
//
// The drag of the system is not begun by a pointer that the driver only
// tells the page of, so the pointer is a real one, moved by xdotool on the
// display the harness has made for itself (never the owner's): the script
// needs xdotool.
// Screenshots in e2e/output/dragging-<n>-<what>.png.

import { execFileSync } from 'node:child_process';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const PROSE = '.text-view .section .body .prose';

/** The text as its blocks: a paragraph by its words, a sheet in brackets. */
const shape = (app) =>
  app.exec(
    `const words = (el) => { const c = el.cloneNode(true); c.querySelectorAll('.ProseMirror-widget, [contenteditable="false"]').forEach((w) => w.remove()); return c.textContent.replace(/\\u200b/g, ''); };
     const held = (el) => Array.from((el.querySelector(':scope > .rich-body') ?? el).children).filter((c) => !c.matches('.rich-head'));
     const one = (el) => el.matches('.rich') ? '[' + held(el).map(one).join(' | ') + ']' : words(el);
     const prose = document.querySelector('${PROSE}');
     return prose ? Array.from(prose.querySelectorAll(':scope > p, :scope > .rich')).map(one).join(' | ') : null;`,
  );

const app = await App.launch({ width: 1360, height: 880 });
/** The real pointer of the scripts' own display. */
const pointer = (...args) => execFileSync('xdotool', args.map(String), { env: { ...process.env, DISPLAY: app.display } });

/** Presses at one place of the page, drags to another and lets go, as a hand does: `hold` waits with the button down before it moves. */
async function drag(from, to, { copy = false } = {}) {
  const off = await app.exec(`return { x: window.screenX, y: window.screenY + (window.outerHeight - window.innerHeight) }`);
  const at = (p) => [Math.round(off.x + p.x), Math.round(off.y + p.y)];
  pointer('mousemove', ...at(from));
  await sleep(200);
  pointer('mousedown', 1);
  await sleep(300);
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    pointer('mousemove', ...at({ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }));
    await sleep(70);
    // Ctrl is pressed while it is dragged, as a hand that changes its mind does.
    if (copy && i === 4) pointer('keydown', 'ctrl');
  }
  await sleep(350);
  pointer('mouseup', 1);
  await sleep(300);
  if (copy) pointer('keyup', 'ctrl');
  await sleep(400);
}

/** Selects a word of the text as a hand would by double-clicking it, and says where its middle is. */
const selectWord = (word) =>
  app.exec(
    `const prose = document.querySelector('${PROSE}');
     const walker = document.createTreeWalker(prose, NodeFilter.SHOW_TEXT);
     for (let n = walker.nextNode(); n; n = walker.nextNode()) {
       const at = n.data.indexOf(arguments[0]);
       if (at < 0 || n.parentElement.closest('.rich-head')) continue;
       const r = document.createRange(); r.setStart(n, at); r.setEnd(n, at + arguments[0].length);
       const s = getSelection(); s.removeAllRanges(); s.addRange(r);
       const b = r.getBoundingClientRect();
       return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
     }
     return null;`,
    word,
  );

/** A place in the paragraph that holds the words: just after its last word, or in its first letters. */
const placeIn = (words, where) =>
  app.exec(
    `const p = Array.from(document.querySelectorAll('${PROSE} p')).find((p) => p.textContent.includes(arguments[0]));
     if (!p) return null;
     const r = document.createRange(); r.selectNodeContents(p);
     const rects = r.getClientRects(); const last = rects[rects.length - 1]; const first = rects[0];
     return arguments[1] === 'end' ? { x: last.right + 24, y: last.top + last.height / 2 } : { x: first.left + 6, y: first.top + first.height / 2 };`,
    words,
    where,
  );

try {
  let has = true;
  try {
    pointer('version');
  } catch {
    has = false;
  }
  check('xdotool moves a real pointer on the scripts’ own display', has);
  if (!has) throw new Error('without xdotool nothing can be dragged');

  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Dragging');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.click('.text-view .section .body');
  await app.keys('alpha beta gamma');
  await app.press('Enter');
  await app.keys('delta');
  await sleep(300);
  await app.installErrorHook();

  // ---- words dragged in ordinary text ----
  let from = await selectWord('beta');
  await sleep(300);
  await drag(from, await placeIn('delta', 'end'));
  check('selected words that are dragged stand where they were dropped, and no longer where they stood', (await shape(app)) === 'alpha  gamma | deltabeta', await shape(app));
  check('and are selected there', (await app.exec(`return String(getSelection())`)) === 'beta');
  await app.screenshot('dragging-1-words');
  await app.keys(['Control', 'z']);
  await sleep(400);
  check('undo takes the move back in one step', (await shape(app)) === 'alpha beta gamma | delta', await shape(app));

  from = await selectWord('beta');
  await sleep(300);
  await drag(from, await placeIn('delta', 'end'), { copy: true });
  check('with Ctrl held when they are dropped, a copy is put there and the words stay', (await shape(app)) === 'alpha beta gamma | deltabeta', await shape(app));
  await app.keys(['Control', 'z']);
  await sleep(400);
  check('which undo takes back', (await shape(app)) === 'alpha beta gamma | delta', await shape(app));

  // ---- words dragged on a sheet of rich text ----
  await app.exec(`const p = document.querySelectorAll('${PROSE} > p')[1]; const s = getSelection(); s.selectAllChildren(p); s.collapseToEnd();`);
  await sleep(200);
  await app.press('Enter');
  await app.insert('Rich text');
  await app.waitFor(`${PROSE} .rich`, 5000);
  await app.keys('one two three');
  await app.press('Enter');
  await app.keys('four');
  await sleep(300);
  check('a sheet of rich text is written at the end', (await shape(app)) === 'alpha beta gamma | delta | [one two three | four]', await shape(app));
  from = await selectWord('two');
  await sleep(300);
  await drag(from, await placeIn('four', 'end'));
  check('words are dragged on the sheet as in any text', (await shape(app)) === 'alpha beta gamma | delta | [one  three | fourtwo]', await shape(app));

  // ---- a press on the sheet itself drags nothing ----
  const body = await app.exec(`const b = document.querySelector('${PROSE} .rich .rich-body').getBoundingClientRect(); return { x: b.left + 6, y: b.top + 5 };`);
  await drag(body, await placeIn('alpha', 'start'));
  check('a press on the sheet itself is for its text, and moves nothing', (await shape(app)) === 'alpha beta gamma | delta | [one  three | fourtwo]', await shape(app));

  // ---- the sheet dragged by its grip ----
  const grip = () => app.exec(`const g = document.querySelector('${PROSE} .rich [data-rich-grip]'); if (!g) return null; const b = g.getBoundingClientRect(); return { x: b.left + 8, y: b.top + b.height / 2, grab: getComputedStyle(g).cursor, draggable: g.draggable };`);
  let g = await grip();
  check('the name in the head is a grip', g?.draggable === true && g?.grab === 'grab', JSON.stringify(g));
  await drag(g, await placeIn('alpha', 'start'));
  check('dragged by its grip to the first letters of a paragraph, the sheet stands before it, whole', (await shape(app)) === '[one  three | fourtwo] | alpha beta gamma | delta', await shape(app));
  check('and the cursor is in it', await app.exists(`${PROSE} .rich [data-rich-tools]`));
  await app.screenshot('dragging-2-sheet-first');
  g = await grip();
  await drag(g, await placeIn('delta', 'end'));
  check('dragged to the end of a paragraph, it stands after it', (await shape(app)) === 'alpha beta gamma | delta | [one  three | fourtwo]', await shape(app));
  await app.keys(['Control', 'z']);
  await sleep(400);
  check('undo takes that move back in one step', (await shape(app)) === '[one  three | fourtwo] | alpha beta gamma | delta', await shape(app));
  g = await grip();
  await drag(g, { x: g.x + 200, y: g.y + 30 });
  check('dropped on itself, it stays where it is', (await shape(app)) === '[one  three | fourtwo] | alpha beta gamma | delta', await shape(app));
  await app.keys('!');
  await sleep(200);
  check('and the text is written in as before', ((await shape(app)) ?? '').includes('!'), await shape(app));
  await app.screenshot('dragging-3-sheet');

  const errors = await app.pageErrors();
  check('the page said nothing was wrong', errors.length === 0, JSON.stringify(errors).slice(0, 400));
} catch (e) {
  check('the script ran to its end', false, e?.message ?? String(e));
  await app.screenshot('dragging-stopped').catch(() => {});
} finally {
  await app.close().catch(() => {});
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
