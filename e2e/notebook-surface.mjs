// The surface of a box of the notebook (`docs/plans/the-notebook.md`, stage
// 2): three notes made on the page stand in the strip of the surface (Not
// yet placed), newest on top; one dragged from the strip onto the ground
// lies there, and still there after going to the library and back; a card
// dragged elsewhere lies there; a card made wider by its right edge; two
// cards selected with Ctrl and moved together; a link drawn from the handle
// of one card to another, given words by two presses on its curve; the
// wheel with Ctrl zooms and the ground dragged pans (read from the transform
// of the world); New note here in the menu of the ground puts a card there
// and opens the note; two presses on a card open the note beside; a card
// dragged onto the strip is not put any more; the map of a project still
// pans, zooms and draws its associations (the first steps of
// associations.mjs: that script is run whole on its own); and no errors in
// the page. Written against the page around the surface as it was being
// built beside it: the box in view chosen in a column at the left (the
// first box, chosen at the start), and a choice Surface | List over the
// notes (a radio of a Segmented). Screenshots in
// e2e/output/notebook-surface-<n>-<what>.png.

import { rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** Waits, at most `ms`, until `probe` gives what `ok` takes; gives the last it gave. */
async function until(probe, ok, ms = 6000) {
  const end = Date.now() + ms;
  let got = await probe();
  while (!ok(got) && Date.now() < end) {
    await sleep(150);
    got = await probe();
  }
  return got;
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-notebook-surface-'));

// ---- what the script reads of the surface ----
const SURFACE = '[data-surface]';
/** The names of the notes in the strip, top to bottom. */
const stripNames = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${SURFACE} [data-strip] [data-unplaced]')).map((i) => i.getAttribute('aria-label'))`,
  );
/** The cards on the ground: by name, where each lies (its top left corner) and how wide. */
const cards = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${SURFACE} [data-card]')).map((c) => {
       const m = /translate\\(([-\\d.]+)px, ([-\\d.]+)px\\)/.exec(c.style.transform);
       return { id: c.dataset.card, name: c.getAttribute('aria-label'), x: m ? Number(m[1]) : NaN, y: m ? Number(m[2]) : NaN,
         width: parseFloat(c.style.width), selected: c.classList.contains('selected') };
     })`,
  );
const cardNamed = async (app, name) => (await cards(app)).find((c) => c.name === name);
/** The transform of the world of the surface: where its origin is, and the scale. */
const world = (app, of = SURFACE) =>
  app.exec(
    `const t = document.querySelector(arguments[0] + ' .world')?.style.transform ?? '';
     const m = /translate\\(([-\\d.]+)px, ([-\\d.]+)px\\) scale\\(([\\d.]+)\\)/.exec(t);
     return m ? { x: Number(m[1]), y: Number(m[2]), k: Number(m[3]) } : null;`,
    of,
  );
/**
 * A point of the ground with nothing on it, as an offset from the middle of
 * the surface (what the harness drags from) and in the window.
 */
const emptyGround = (app, of = SURFACE) =>
  app.exec(
    `const el = document.querySelector(arguments[0]);
     const r = el.getBoundingClientRect();
     for (let fy = 0.75; fy > 0.2; fy -= 0.05)
       for (let fx = 0.45; fx < 0.9; fx += 0.05) {
         const x = Math.round(r.left + r.width * fx), y = Math.round(r.top + r.height * fy);
         const under = document.elementFromPoint(x, y);
         if (under === el || under?.classList.contains('world')) {
           return { dx: Math.round(x - (r.left + r.width / 2)), dy: Math.round(y - (r.top + r.height / 2)), x, y };
         }
       }
     return null;`,
    of,
  );
/** A turn of the wheel with Ctrl held, in the middle of the surface. */
const turn = (app, deltaY, of = SURFACE) =>
  app.exec(
    `const el = document.querySelector(arguments[1]);
     const r = el.getBoundingClientRect();
     el.dispatchEvent(new WheelEvent('wheel', { deltaY: arguments[0], ctrlKey: true, bubbles: true, cancelable: true,
       clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }));`,
    deltaY,
    of,
  );
/**
 * Sends the events of a press of a button at a point of a path, where its
 * stroke is, to what is under that point: as associations.mjs does it.
 */
const atPath = (app, selector, kind, at = 0.5) =>
  app.exec(
    `const path = document.querySelector(arguments[0]);
     if (!path) return false;
     const p = path.getPointAtLength(path.getTotalLength() * arguments[2]);
     const m = path.getScreenCTM();
     const x = m.a * p.x + m.c * p.y + m.e, y = m.b * p.x + m.d * p.y + m.f;
     const common = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, view: window };
     const under = document.elementFromPoint(x, y) ?? path;
     if (arguments[1] === 'double') {
       under.dispatchEvent(new PointerEvent('pointerdown', { ...common, button: 0, buttons: 1, pointerType: 'mouse', isPrimary: true }));
       under.dispatchEvent(new PointerEvent('pointerup', { ...common, button: 0, buttons: 0, pointerType: 'mouse', isPrimary: true }));
       under.dispatchEvent(new MouseEvent('dblclick', { ...common, button: 0, detail: 2 }));
     } else {
       under.dispatchEvent(new PointerEvent('pointerdown', { ...common, button: 0, buttons: 1, pointerType: 'mouse', isPrimary: true }));
       under.dispatchEvent(new PointerEvent('pointerup', { ...common, button: 0, buttons: 0, pointerType: 'mouse', isPrimary: true }));
     }
     return true;`,
    selector,
    kind,
    at,
  );
/** The right button at a point of the window, as the harness's rightClick sends it. */
const rightClickAt = (app, x, y) =>
  app.exec(
    `const x = arguments[0], y = arguments[1];
     const common = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, screenX: x, screenY: y, view: window };
     const under = document.elementFromPoint(x, y);
     under.dispatchEvent(new PointerEvent('pointerdown', { ...common, button: 2, buttons: 2, pointerType: 'mouse', isPrimary: true }));
     under.dispatchEvent(new MouseEvent('mousedown', { ...common, button: 2, buttons: 2 }));
     under.dispatchEvent(new MouseEvent('contextmenu', { ...common, button: 2, buttons: 2 }));
     under.dispatchEvent(new PointerEvent('pointerup', { ...common, button: 2, buttons: 0, pointerType: 'mouse', isPrimary: true }));
     under.dispatchEvent(new MouseEvent('mouseup', { ...common, button: 2, buttons: 0 }));`,
    x,
    y,
  );

/** Makes a note on the page with a name and words, from the button given. */
async function makeNote(app, button, name, words) {
  await app.click(button);
  await app.waitFor('[data-note-editor] [data-note-text] .ProseMirror', 5000);
  await app.waitUntil(
    `return !!document.activeElement?.closest?.('[data-note-text]')`,
    3000,
    'the text of the new note to have the cursor',
  );
  await app.keys(words);
  await app.click('[data-note-name]');
  await app.keys(name);
  await app.press('Enter');
  await sleep(300);
}

/** Shows the notes of the box as its surface: the choice Surface | List over the notes. */
async function showSurface(app) {
  // The first box, in the column at the left; a box comes up as its surface the first time it is shown.
  await app.click('[data-box-row="first"]');
  await sleep(300);
  if (!(await app.exists(SURFACE)))
    await app.click('[data-shown-as-choice] [role="radio"][aria-label="Surface"]');
  await app.waitFor(SURFACE, 5000);
  await sleep(500);
}

const app = await App.launch({ dataDir, keepData: true, width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.keys(['Control', '3']);
  await app.waitFor('[data-notebook]', 8000);

  // ---- three notes made on the page, then the surface ----
  await app.waitFor('[data-notebook-empty]', 8000);
  await makeNote(app, await app.findByText('[data-notebook-empty] button', 'New note'), 'Owls', 'The owl is hers.');
  await makeNote(app, '[data-new-note]', 'Athens', 'Her city.');
  await makeNote(app, '[data-new-note]', 'Olives', 'Her tree.');
  await showSurface(app);
  const strip = await until(() => stripNames(app), (s) => s.length === 3);
  check('the notes made on the page stand in the strip, newest on top', strip.join('|') === 'Olives|Athens|Owls', strip.join(' | '));
  const heading = await app.exec(`return document.querySelector('${SURFACE} [data-strip] .heading')?.textContent ?? ''`);
  check('the strip says what they are', heading.trim() === 'Not yet placed', heading);
  check('nothing lies on the ground yet', (await cards(app)).length === 0);
  await app.screenshot('notebook-surface-1-strip');

  // ---- dragged from the strip onto the ground ----
  const putOne = async (name, dx, dy) => {
    const item = await app.findByText(`${SURFACE} [data-strip] [data-unplaced]`, name);
    await app.drag(item, { dx, dy });
    await sleep(400);
  };
  await putOne('Owls', 220, 40);
  let owls = await until(() => cardNamed(app, 'Owls'), Boolean);
  check('a note dragged from the strip lies on the ground', !!owls, JSON.stringify(owls));
  check('and is no longer in the strip', !(await stripNames(app)).includes('Owls'));
  await putOne('Athens', 540, 40);
  await putOne('Olives', 220, 300);
  const all = await until(() => cards(app), (c) => c.length === 3);
  check('the three lie on the ground', all.length === 3, all.map((c) => c.name).join(' | '));
  check('and the strip is not shown when every note is put', !(await app.exists(`${SURFACE} [data-strip]`)));
  await app.screenshot('notebook-surface-2-put');

  // ---- left and come back to ----
  owls = await cardNamed(app, 'Owls');
  await app.keys(['Control', '2']);
  await sleep(800);
  await app.keys(['Control', '3']);
  await app.waitFor('[data-notebook]', 8000);
  if (!(await app.exists(SURFACE))) await showSurface(app);
  const back = await until(() => cardNamed(app, 'Owls'), Boolean);
  check(
    'a card lies where it was put after the notebook is left and come back to',
    back && Math.abs(back.x - owls.x) < 1 && Math.abs(back.y - owls.y) < 1,
    `${JSON.stringify(owls)} → ${JSON.stringify(back)}`,
  );

  // ---- a card moved ----
  let k = (await world(app))?.k ?? 1;
  const owlsBefore = await cardNamed(app, 'Owls');
  await app.drag(`${SURFACE} [data-card="${owlsBefore.id}"]`, { dx: 0, dy: 90 });
  await sleep(400);
  const owlsAfter = await cardNamed(app, 'Owls');
  check(
    'a card dragged elsewhere lies there, the distance divided by the zoom',
    Math.abs(owlsAfter.y - owlsBefore.y - 90 / k) < 3 && Math.abs(owlsAfter.x - owlsBefore.x) < 3,
    `${owlsBefore.x},${owlsBefore.y} → ${owlsAfter.x},${owlsAfter.y} at ${k}`,
  );

  // ---- made wider ----
  const athens = await cardNamed(app, 'Athens');
  await app.drag(`${SURFACE} [data-card="${athens.id}"] [data-card-edge]`, { dx: 120, dy: 0 });
  await sleep(400);
  const wider = await cardNamed(app, 'Athens');
  check('a card is made wider by its right edge', wider.width > athens.width + 60, `${athens.width} → ${wider.width}`);
  await app.screenshot('notebook-surface-3-moved-wider');

  // ---- two selected with Ctrl, moved together ----
  const olives = await cardNamed(app, 'Olives');
  const owlsNow = await cardNamed(app, 'Owls');
  await app.click(`${SURFACE} [data-card="${olives.id}"]`);
  await sleep(200);
  await app.drag(`${SURFACE} [data-card="${owlsNow.id}"]`, { dx: 0, dy: 0 }, { keys: ['Control'] });
  await sleep(300);
  const chosen = (await cards(app)).filter((c) => c.selected).map((c) => c.name).sort();
  check('two cards are selected, the second with Ctrl', chosen.join('|') === 'Olives|Owls', chosen.join(' | '));
  await app.drag(`${SURFACE} [data-card="${olives.id}"]`, { dx: -60, dy: 60 });
  await sleep(400);
  const [olives2, owls2, athens2] = [await cardNamed(app, 'Olives'), await cardNamed(app, 'Owls'), await cardNamed(app, 'Athens')];
  check(
    'the cards selected move together',
    Math.abs(olives2.x - olives.x - (owls2.x - owlsNow.x)) < 2 &&
      Math.abs(olives2.y - olives.y - (owls2.y - owlsNow.y)) < 2 &&
      olives2.x < olives.x - 20,
    `olives ${olives.x},${olives.y} → ${olives2.x},${olives2.y}; owls ${owlsNow.x},${owlsNow.y} → ${owls2.x},${owls2.y}`,
  );
  check('and the one not selected stays', athens2.x === wider.x && athens2.y === wider.y);

  // ---- a link from one card to another, given words ----
  await app.hover(`${SURFACE} [data-card="${athens.id}"]`);
  await sleep(200);
  await app.drag(`${SURFACE} [data-card="${athens.id}"] [data-link-handle]`, `${SURFACE} [data-card="${olives.id}"]`);
  await sleep(400);
  check('a link is drawn from the handle of one card to another', (await app.count(`${SURFACE} g.association`)) === 1);
  await atPath(app, `${SURFACE} g.association path.curve`, 'double');
  await app.waitFor(`${SURFACE} .link-field`, 3000);
  await sleep(150);
  await app.keys('grows in');
  await app.press('Enter');
  await sleep(300);
  const words = await app.exec(`return document.querySelector('${SURFACE} .link-label')?.textContent ?? ''`);
  check('two presses on the link give it words', words === 'grows in', words);
  await app.screenshot('notebook-surface-4-linked');

  // ---- the zoom and the pan ----
  const w0 = await world(app);
  await turn(app, -120);
  await turn(app, -120);
  await sleep(200);
  const w1 = await world(app);
  check('the wheel with Ctrl zooms the surface', w1 && w0 && w1.k > w0.k, `${w0?.k} → ${w1?.k}`);
  const ground = await emptyGround(app);
  if (!ground) throw new Error('no empty ground to press');
  await app.drag(SURFACE, { dx: 80, dy: 50 }, { fromX: ground.dx, fromY: ground.dy });
  await sleep(300);
  const w2 = await world(app);
  check('the ground dragged pans the surface', w2 && Math.abs(w2.x - w1.x - 80) < 4 && Math.abs(w2.y - w1.y - 50) < 4, `${JSON.stringify(w1)} → ${JSON.stringify(w2)}`);
  k = w2?.k ?? k;

  // ---- New note here ----
  const free = await emptyGround(app);
  await rightClickAt(app, free.x, free.y);
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'New note here');
  await sleep(500);
  const withNew = await until(() => cards(app), (c) => c.length === 4);
  check('New note here puts a card on the ground', withNew.length === 4, withNew.map((c) => c.name).join(' | '));
  check(
    'and opens the note to be written',
    await app.exists('[data-note-editor] [data-note-text] .ProseMirror'),
  );
  await app.keys('A new thought.');
  await sleep(400);
  await app.screenshot('notebook-surface-5-new-here');

  // ---- two presses open the note beside ----
  // The note opened beside it has made the surface narrower: all of it is shown again first.
  await app.click(`${SURFACE} .controls button[aria-label="Show all"]`);
  await sleep(500);
  await app.doubleClick(`${SURFACE} [data-card="${athens.id}"]`);
  await sleep(500);
  const opened = await app.exec(`return document.querySelector('[data-note-name]')?.value ?? document.querySelector('[data-note-name]')?.textContent ?? ''`);
  check('two presses on a card open the note beside', opened.includes('Athens'), opened);
  check('and the surface is still there beside it', await app.exists(SURFACE));
  await app.screenshot('notebook-surface-6-opened');

  // ---- a card dragged onto the strip ----
  const ids = (await cards(app)).map((c) => c.id);
  await app.click(`${SURFACE} [data-card="${athens.id}"]`);
  await sleep(150);
  const leftOfSurface = await app.exec(
    `const s = document.querySelector('${SURFACE}').getBoundingClientRect();
     const c = document.querySelector('${SURFACE} [data-card="${athens.id}"]').getBoundingClientRect();
     return { dx: Math.round(s.left + 60 - (c.left + c.width / 2)), dy: Math.round(s.top + s.height / 2 - (c.top + c.height / 2)) };`,
  );
  await app.drag(`${SURFACE} [data-card="${athens.id}"]`, leftOfSurface);
  await sleep(400);
  check('a card dragged onto the strip is not put any more', (await stripNames(app)).includes('Athens'), (await stripNames(app)).join(' | '));
  check('and lies on the ground no longer', (await cards(app)).length === ids.length - 1);
  await app.screenshot('notebook-surface-7-taken-off');

  let errors = await app.pageErrors();
  check('no errors in the page of the notebook', errors.length === 0, errors.join(' | '));

  // ---- the map of a project still pans, zooms and draws its associations ----
  await app.home();
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'The wrath');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  const add = async (where, name) => {
    await app.keys(where === 'under' ? ['Alt', 'Shift', 'Enter'] : ['Alt', 'Enter']);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await add('under', 'Achilles');
  await add('after', 'Hector');
  await app.rightClick(await app.findByText('.diagram .node', 'Achilles'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('[role="menuitem"]', 'Associate with');
  await sleep(150);
  await app.click(await app.findByText('.diagram .node', 'Hector'));
  await sleep(300);
  check('the map still draws an association', (await app.count('.diagram g.association')) === 1);
  const m0 = await world(app, '.diagram');
  await turn(app, -120, '.diagram');
  await sleep(200);
  const m1 = await world(app, '.diagram');
  check('the map still zooms with Ctrl and the wheel', m1 && m0 && m1.k > m0.k, `${m0?.k} → ${m1?.k}`);
  const mapGround = await emptyGround(app, '.diagram');
  if (mapGround) {
    await app.drag('.diagram', { dx: 60, dy: 40 }, { fromX: mapGround.dx, fromY: mapGround.dy });
    await sleep(300);
    const m2 = await world(app, '.diagram');
    check('the map still pans when its ground is dragged', m2 && Math.abs(m2.x - m1.x - 60) < 4 && Math.abs(m2.y - m1.y - 40) < 4, `${JSON.stringify(m1)} → ${JSON.stringify(m2)}`);
  } else check('the map has empty ground to drag', false);
  await app.screenshot('notebook-surface-8-map');

  errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.log('FAIL  the script stopped:', error?.message ?? error);
  checks.push({ name: 'the script ran to the end', ok: false });
  await app.screenshot('notebook-surface-stopped').catch(() => {});
} finally {
  await app.close().catch(() => {});
  if (!process.env.GLAUKOPIS_E2E_KEEP) {
    rmSync(dataDir, { recursive: true, force: true });
    rmSync(`${dataDir}-config`, { recursive: true, force: true });
  }
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
