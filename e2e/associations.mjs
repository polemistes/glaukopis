// Associations with arrows, colours and words in lines (record 0093): two
// elements associated by the menu; words of two lines written with
// Shift+Enter, shown as two lines, and Escape leaving them as they were;
// an arrow given by the menu of the curve and its arrowhead drawn, both
// ways two; a colour given, and the curve, its heads and its words in it;
// the menu by the key while the association is selected; the picture of
// the diagram as SVG with the arrowheads and both lines; the same
// association in the margin of the text, in its colour, with arrowheads in
// place of its dots, and its menu there with the ends to go to; and undo
// taking each change back, one by one.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const TEAL = 'rgb(14, 116, 144)';

const app = await App.launch();
try {
  await app.installErrorHook();
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

  /**
   * Sends the events of a press of a button at a point of a path, where its
   * stroke is (the middle of its box may be off the stroke of a curve), to
   * what is under that point: the words of the association, where they
   * stand there.
   */
  const atPath = (selector, kind, at = 0.5) =>
    app.exec(
      `const path = document.querySelector(arguments[0]);
       if (!path) return false;
       const p = path.getPointAtLength(path.getTotalLength() * arguments[2]);
       const m = path.getScreenCTM();
       const x = m.a * p.x + m.c * p.y + m.e, y = m.b * p.x + m.d * p.y + m.f;
       const common = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, view: window };
       const under = document.elementFromPoint(x, y) ?? path;
       if (arguments[1] === 'context') {
         under.dispatchEvent(new PointerEvent('pointerdown', { ...common, button: 2, buttons: 2, pointerType: 'mouse', isPrimary: true }));
         under.dispatchEvent(new MouseEvent('contextmenu', { ...common, button: 2, buttons: 2 }));
         under.dispatchEvent(new PointerEvent('pointerup', { ...common, button: 2, buttons: 0, pointerType: 'mouse', isPrimary: true }));
       } else if (arguments[1] === 'double') {
         under.dispatchEvent(new MouseEvent('dblclick', { ...common, button: 0, detail: 2 }));
       } else {
         under.dispatchEvent(new PointerEvent('pointerdown', { ...common, button: 0, buttons: 1, pointerType: 'mouse', isPrimary: true }));
         under.dispatchEvent(new PointerEvent('pointerup', { ...common, button: 0, buttons: 0, pointerType: 'mouse', isPrimary: true }));
         under.dispatchEvent(new MouseEvent('click', { ...common, button: 0, detail: 1 }));
       }
       return true;`,
      selector,
      kind,
      at,
    );

  const menuItems = async () => {
    await app.waitFor('.menu [role="menuitem"]', 3000);
    await sleep(150);
    return app.exec(
      `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.textContent.trim())`,
    );
  };
  /** Chooses an item of the menu of the association, in a submenu where one is named. */
  const choose = async (submenu, item) => {
    if (submenu) {
      await app.clickText('.menu [role="menuitem"]', submenu);
      await sleep(200);
    }
    await app.clickText('.menu [role="menuitem"]', item);
    await sleep(300);
  };
  const curveMenu = async () => {
    await atPath('.diagram g.association path.curve', 'context', 0.3);
    return menuItems();
  };
  const look = () =>
    app.exec(
      `const g = document.querySelector('.diagram g.association');
       const label = document.querySelector('.diagram .link-label');
       const lines = (() => {
         if (!label) return 0;
         const r = document.createRange();
         r.selectNodeContents(label);
         return new Set(Array.from(r.getClientRects()).map((x) => Math.round(x.top))).size;
       })();
       return {
         heads: g ? g.querySelectorAll('path.head').length : -1,
         stroke: g ? getComputedStyle(g.querySelector('path.curve')).stroke : '',
         fill: g?.querySelector('path.head') ? getComputedStyle(g.querySelector('path.head')).fill : '',
         words: label?.textContent ?? '',
         colour: label ? getComputedStyle(label).color : '',
         lines,
         selected: !!g?.classList.contains('selected'),
       };`,
    );

  // --- Associated by the menu ---
  await app.rightClick(await app.findByText('.diagram .node', 'Achilles'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('[role="menuitem"]', 'Associate with');
  await sleep(150);
  await app.click(await app.findByText('.diagram .node', 'Hector'));
  await sleep(300);
  check('two elements are associated by the menu', (await app.count('.diagram .association')) === 1);
  let now = await look();
  check('a new association has no arrowhead', now.heads === 0, JSON.stringify(now));
  const gold = now.stroke;

  // --- Its menu, on a right click on the curve ---
  const items = await curveMenu();
  check(
    'the menu of the curve has the words, the arrow, the colour and the removing',
    ['Add a label…', 'Arrow', 'Colour', 'Remove the association'].every((i) => items.includes(i)),
    items.join(' | '),
  );
  check('a right click selects the association', (await look()).selected);
  await app.screenshot('associations-1-menu');

  // --- Words in two lines ---
  await choose(null, 'Add a label…');
  await app.waitFor('.diagram .link-field textarea', 3000);
  await app.keys('son of Peleus');
  await app.keys(['Shift', 'Enter']);
  await app.keys('slayer of Hector');
  await sleep(150);
  const field = await app.exec(
    `const f = document.querySelector('.diagram .link-field textarea'); return { value: f.value, height: f.offsetHeight };`,
  );
  check('Shift+Enter makes a new line in the field', field.value === 'son of Peleus\nslayer of Hector', JSON.stringify(field));
  check('the field grows with its lines', field.height > 30, String(field.height));
  await app.screenshot('associations-2-field');
  await app.press('Enter');
  await app.waitGone('.diagram .link-field', 3000);
  await sleep(200);
  now = await look();
  check('Enter keeps the words', now.words === 'son of Peleus\nslayer of Hector', JSON.stringify(now.words));
  check('the words are shown as two lines', now.lines === 2, String(now.lines));

  // Escape leaves them as they were.
  await atPath('.diagram g.association path.curve', 'double', 0.3);
  await app.waitFor('.diagram .link-field textarea', 3000);
  await app.keys(' and more');
  await app.press('Escape');
  await app.waitGone('.diagram .link-field', 3000);
  await sleep(150);
  check('Escape leaves the words as they were', (await look()).words === 'son of Peleus\nslayer of Hector');

  // --- An arrow ---
  await curveMenu();
  await choose('Arrow', 'To “Hector”');
  now = await look();
  check('an arrow given by the menu draws an arrowhead', now.heads === 1, JSON.stringify(now));
  const tip = await app.exec(
    `const head = document.querySelector('.diagram g.association path.head').getBoundingClientRect();
     const hector = Array.from(document.querySelectorAll('.diagram .node')).find((n) => n.textContent.includes('Hector')).getBoundingClientRect();
     const near = (a, b) => Math.max(0, a.left - b.right, b.left - a.right, a.top - b.bottom, b.top - a.bottom);
     return near(head, hector);`,
  );
  check('the arrowhead stands at the element it points to', tip < 8, `${tip} px away`);
  await curveMenu();
  const arrows = await app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.textContent.trim())`,
  );
  await app.clickText('.menu [role="menuitem"]', 'Arrow');
  await sleep(200);
  const checked = await app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).filter((m) => m.querySelector('.check svg')).map((m) => m.textContent.trim())`,
  );
  check('the arrow that holds is checked', checked.includes('To “Hector”'), `${checked.join(', ')}; ${arrows.length} items`);
  await app.clickText('.menu [role="menuitem"]', 'Both ways');
  await sleep(300);
  check('both ways, two arrowheads', (await look()).heads === 2);

  // --- A colour ---
  await curveMenu();
  await choose('Colour', 'Teal');
  now = await look();
  check('a colour given colours the curve', now.stroke === TEAL, `${gold} → ${now.stroke}`);
  check('and its arrowheads', now.fill === TEAL, now.fill);
  check('and its words', now.colour === TEAL, now.colour);
  await app.screenshot('associations-3-diagram');

  // --- The menu by the key, while it is selected ---
  await app.closeMenu();
  await atPath('.diagram g.association path.curve', 'press', 0.25);
  await sleep(150);
  await app.keys(['Shift', 'F10']);
  const byKey = await menuItems();
  check('the menu key opens the menu of the association selected', byKey.includes('Arrow'), byKey.join(' | '));
  await app.closeMenu();

  // --- The picture of the diagram ---
  const svgPath = join(app.dataDir, 'pictures-out', 'The wrath.svg');
  await app.execAsync(`await window.__glaukopisPicture.save('svg', arguments[0]);`, svgPath);
  await sleep(300);
  const svg = existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : '';
  check('the picture is written', svg.includes('<svg'));
  check(
    'the picture holds the arrowheads, filled in the colour',
    (svg.match(/<path d="M [-\d. ]+L [-\d. ]+L [-\d. ]+Z" fill="#0e7490"/g) ?? []).length === 2,
  );
  check('the curve is in the colour', /stroke="#0e7490"[^>]*stroke-dasharray/.test(svg));
  check(
    'and the words in two lines',
    /<text[^>]*>[^\n]*son of Peleus[^\n]*<\/text>\n<text[^>]*>[^\n]*slayer of Hector/.test(svg),
  );

  // --- In the margin of the text ---
  await app.view('text');
  await app.waitFor('.text-view .bracket', 8000);
  await sleep(400);
  const margin = () =>
    app.exec(
      `const b = document.querySelector('.text-view .bracket');
       return {
         stroke: getComputedStyle(b.querySelector('path.line')).stroke,
         heads: b.querySelectorAll('path.head').length,
         dots: b.querySelectorAll('circle').length,
         fill: b.querySelector('path.head') ? getComputedStyle(b.querySelector('path.head')).fill : '',
       };`,
    );
  let m = await margin();
  check('the bracket in the margin takes the colour', m.stroke === TEAL, m.stroke);
  check('an arrowhead in place of each dot, both ways', m.heads === 2 && m.dots === 0, JSON.stringify(m));
  check('the arrowheads in the colour', m.fill === TEAL, m.fill);
  await app.screenshot('associations-4-margin');
  await atPath('.text-view .bracket path.hit', 'press');
  const inText = await menuItems();
  check(
    'its menu in the margin has the ends to go to first, then the same menu',
    inText[0] === 'Go to “Achilles”' && inText[1] === 'Go to “Hector”' && inText.includes('Arrow') && inText.includes('Colour'),
    inText.join(' | '),
  );
  await app.screenshot('associations-5-margin-menu');
  await choose('Arrow', 'To “Achilles”');
  m = await margin();
  check('an arrow to the upper end: one head, one dot', m.heads === 1 && m.dots === 1, JSON.stringify(m));

  // --- Undo takes each back ---
  await app.view('diagram');
  await app.waitFor('.diagram g.association', 8000);
  await sleep(300);
  await app.click('.diagram .node.root');
  await sleep(150);
  const undo = async () => {
    await app.keys(['Control', 'z']);
    await sleep(300);
    return look();
  };
  now = await undo();
  check('undo takes back the arrow given in the margin', now.heads === 2, JSON.stringify(now));
  now = await undo();
  check('then the colour', now.stroke === gold && now.heads === 2, JSON.stringify(now));
  now = await undo();
  check('then both ways', now.heads === 1, JSON.stringify(now));
  now = await undo();
  check('then the arrow', now.heads === 0, JSON.stringify(now));
  now = await undo();
  check('then the words', now.words === '', JSON.stringify(now));
  check('and the association is still there', (await app.count('.diagram .association')) === 1);
  await app.screenshot('associations-6-undone');

  const errors = await app.exec('return window.__glaukopisErrors ?? []');
  check('no errors in the page', !errors?.length, JSON.stringify(errors).slice(0, 2000));
} catch (error) {
  console.log('FAIL  the script stopped:', error?.message ?? error);
  checks.push({ name: 'the script ran to the end', ok: false });
  await app.screenshot('associations-stopped').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
