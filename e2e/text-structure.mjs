// The keys that make, enter and move elements, one scheme in the diagram
// and in the text; elements dragged in the text put as deep as the pointer
// is far to the right; and the three ways the text shows how deep each
// element stands, in a wide window and a narrow one.

import { App, sleep } from './harness.mjs';

const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();

  /** The sections of the text, by name and depth. */
  const sections = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) =>
         (s.querySelector('.heading .title')?.textContent ?? '').trim() + ':' + (s.className.match(/level-(\\d)/) || [])[1])`,
    );
  /** The section of an element, by its name. */
  const section = (name) =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === arguments[0]) ?? null;`,
      name,
    );
  /** Where the cursor is: in which element, which part, how far in. */
  const where = () =>
    app.exec(
      `const a = document.activeElement;
       const s = a?.closest?.('[data-section]');
       const sel = getSelection();
       return {
         section: s ? (s.querySelector('.heading .title')?.textContent ?? '').trim() : null,
         part: a?.closest?.('[data-part]')?.dataset.part ?? null,
         offset: sel?.anchorOffset ?? null,
       };`,
    );
  const bodyOf = (name) =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === arguments[0]);
       return s?.querySelector('.body')?.textContent.trim() ?? null;`,
      name,
    );
  const clickTitle = async (name) => {
    const s = await section(name);
    await app.click(await app.exec(`return arguments[0].querySelector('.heading .title')`, s));
    await sleep(250);
    await app.press('End');
    await sleep(100);
  };
  const rootName = () =>
    app.exec(`return document.querySelector('.diagram .node.root .caption')?.textContent.trim() ?? null`);
  const textRoot = async () => (await sections())[0]?.split(':')[0];
  const shown = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.diagram .node')).map((n) => n.querySelector('.caption').textContent.trim())`,
    );
  /** Pointer actions sent without letting go: a drag is done in steps, and looked at between them. */
  const pointer = (actions) =>
    app.cmd('POST', '/actions', {
      actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions }],
    });

  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Structure');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(700);

  // ==== The text ====
  // From the empty text of the project: Alt+Enter the first element.
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('One');
  await app.press('Enter');
  await sleep(250);
  await app.keys('Alpha beta');
  for (let i = 0; i < 4; i++) await app.press('ArrowLeft');
  await app.keys(['Alt', 'Shift', 'Enter']);
  await sleep(400);
  let list = await sections();
  check(
    'Alt+Shift+Enter in a text makes the first element under it, the rest of the paragraph its name',
    JSON.stringify(list) === JSON.stringify(['Structure:0', 'One:1', 'beta:2']) &&
      (await bodyOf('One')) === 'Alpha',
    `${list.join(' | ')} / ${await bodyOf('One')}`,
  );
  // The cursor is at the end of the new name: it is written anew.
  for (let i = 0; i < 4; i++) await app.press('Backspace');
  await app.keys('One A');
  await sleep(250);

  // In a name: Alt+Enter one after; Alt+Left less deep, the cursor staying where it was.
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('Two');
  await sleep(200);
  await app.keys(['Alt', 'ArrowLeft']);
  await sleep(400);
  list = await sections();
  let at = await where();
  check('Alt+Left makes the element less deep', list.includes('Two:1'), list.join(' | '));
  check('and the cursor stays where it was in its name', at.section === 'Two' && at.part === 'title' && at.offset === 3, JSON.stringify(at));
  await app.keys(['Alt', 'ArrowRight']);
  await sleep(400);
  list = await sections();
  check('Alt+Right deeper again', list.includes('Two:2'), list.join(' | '));
  await app.keys(['Alt', 'ArrowLeft']);
  await sleep(400);

  await app.press('Enter');
  await sleep(250);
  await app.keys(['Alt', 'Shift', 'Enter']);
  await sleep(400);
  await app.keys('Two A');
  await app.press('Enter');
  await sleep(250);
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('Two B');
  await sleep(200);
  await app.keys(['Alt', 'ArrowUp']);
  await sleep(400);
  list = await sections();
  at = await where();
  check('Alt+Up moves it up among those beside it', list.indexOf('Two B:2') < list.indexOf('Two A:2'), list.join(' | '));
  check('the cursor still in its name, where it was', at.section === 'Two B' && at.part === 'title' && at.offset === 5, JSON.stringify(at));
  await app.keys(['Alt', 'ArrowDown']);
  await sleep(400);
  list = await sections();
  check('and Alt+Down down again', list.indexOf('Two B:2') > list.indexOf('Two A:2'), list.join(' | '));
  // Tab in a name folds what is under the element, of which Two B has nothing: it no longer makes it deeper.
  await app.press('Tab');
  await sleep(300);
  check('Tab in a name no longer makes the element deeper', (await sections()).includes('Two B:2'));
  // Alt and the arrows in a text move the element, not the cursor.
  await app.press('Enter');
  await sleep(250);
  await app.keys('Some words here');
  await app.press('ArrowLeft');
  await app.press('ArrowLeft');
  await sleep(100);
  const before = await where();
  await app.keys(['Alt', 'ArrowUp']);
  await sleep(400);
  const afterUp = await where();
  list = await sections();
  check(
    'Alt+Up in a text moves the element, and the cursor stays in its text where it was',
    list.indexOf('Two B:2') < list.indexOf('Two A:2') &&
      afterUp.section === 'Two B' && afterUp.part === 'body' && afterUp.offset === before.offset,
    `${list.join(' | ')} ${JSON.stringify(before)} → ${JSON.stringify(afterUp)}`,
  );
  await app.keys(['Alt', 'ArrowDown']);
  await sleep(400);
  await clickTitle('Two B');
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('Three');
  await app.keys(['Alt', 'ArrowLeft']);
  await sleep(400);
  list = await sections();
  check(
    'the tree is as it was made',
    JSON.stringify(list) ===
      JSON.stringify(['Structure:0', 'One:1', 'One A:2', 'Two:1', 'Two A:2', 'Two B:2', 'Three:1']),
    list.join(' | '),
  );
  // Ctrl+Enter makes nothing in the text any more.
  await app.keys(['Control', 'Enter']);
  await sleep(300);
  check('Ctrl+Enter makes no element in the text', (await sections()).length === 7);

  // --- In and out: Alt+Shift+Down and Alt+Shift+Up, from a name and from a text ---
  await clickTitle('Two');
  await app.keys(['Alt', 'Shift', 'ArrowDown']);
  await sleep(700);
  check('Alt+Shift+Down in the text enters the element the cursor is in', (await textRoot()) === 'Two', (await sections()).join(' | '));
  at = await where();
  await clickTitle('Two A');
  await app.keys(['Alt', 'Shift', 'ArrowUp']);
  await sleep(700);
  check('Alt+Shift+Up with the cursor in a name goes up', (await textRoot()) === 'Structure', (await sections()).join(' | '));
  await clickTitle('Two');
  await app.keys(['Alt', 'Shift', 'ArrowDown']);
  await sleep(700);
  const twoA = await section('Two A');
  await app.click(await app.exec(`return arguments[0].querySelector('.body')`, twoA));
  await sleep(300);
  at = await where();
  await app.keys(['Alt', 'Shift', 'ArrowUp']);
  await sleep(700);
  check('and with the cursor in a text', at.part === 'body' && (await textRoot()) === 'Structure', JSON.stringify(at));

  // --- The numbers, as in an outline ---
  const numbers = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => (s.querySelector('.gutter .depth')?.textContent ?? '').trim())`,
  );
  check(
    'each element has its number in the gutter, the element in view none',
    JSON.stringify(numbers) === JSON.stringify(['', '1', '1.1', '2', '2.1', '2.2', '3']),
    numbers.join(' '),
  );
  await app.exec(`document.activeElement?.blur?.()`);
  await app.hover('.text-view footer');
  await sleep(300);
  await app.screenshot('text-structure-1-numbers');

  // ==== Dragging in the text: the pointer's height chooses where, its distance to the right how deep ====
  const oneA = await section('One A');
  const grip = await app.exec(`return arguments[0].querySelector('.gutter .grip')`, oneA);
  const box = await app.exec(
    `const all = Array.from(document.querySelectorAll('.text-view .section'));
     const name = (s) => (s.querySelector('.heading .title')?.textContent ?? '').trim();
     const b = all.find((s) => name(s) === 'Two B').getBoundingClientRect();
     const c = all.find((s) => name(s) === 'Three').getBoundingClientRect();
     const col = document.querySelector('.text-view .column').getBoundingClientRect();
     const g = arguments[0].getBoundingClientRect();
     return { y: Math.round((b.bottom + c.top) / 2), left: Math.round(col.left + 44), gx: Math.round(g.left + g.width / 2), gy: Math.round(g.top + g.height / 2) };`,
    grip,
  );
  const line = () =>
    app.exec(
      `const l = document.querySelector('.text-view .drop-line');
       return l ? { label: l.textContent.trim(), top: l.style.top, left: l.style.left } : null;`,
    );
  await pointer([
    { type: 'pointerMove', origin: 'viewport', x: box.gx, y: box.gy, duration: 50 },
    { type: 'pointerDown', button: 0 },
    { type: 'pause', duration: 80 },
    { type: 'pointerMove', origin: 'viewport', x: box.gx + 4, y: box.gy + 12, duration: 60 },
    { type: 'pointerMove', origin: 'viewport', x: box.left + 2 * 24 + 4, y: box.y, duration: 120 },
  ]);
  await sleep(200);
  const deep = await line();
  await pointer([{ type: 'pointerMove', origin: 'viewport', x: box.left + 24 + 4, y: box.y, duration: 80 }]);
  await sleep(200);
  const beside = await line();
  await app.screenshot('text-structure-2-drag');
  await pointer([{ type: 'pointerMove', origin: 'viewport', x: box.left - 10, y: box.y, duration: 80 }]);
  await sleep(200);
  const out = await line();
  check('far to the right, the line says it goes under the element above', deep?.label === 'Under “Two B”', JSON.stringify(deep));
  check('less far, after it', beside?.label === 'After “Two B”', JSON.stringify(beside));
  check('at the left, before the element below', out?.label === 'Before “Three”', JSON.stringify(out));
  check(
    'the line is set in as deep as it says, and stays at the same height',
    deep && beside && out && deep.top === beside.top && beside.top === out.top &&
      parseFloat(deep.left) > parseFloat(beside.left) && parseFloat(beside.left) > parseFloat(out.left),
    JSON.stringify([deep, beside, out]),
  );
  await pointer([{ type: 'pointerUp', button: 0 }]);
  await app.cmd('DELETE', '/actions');
  await sleep(500);
  list = await sections();
  check(
    'dropped at the left, it stands before the element below, as deep',
    JSON.stringify(list) ===
      JSON.stringify(['Structure:0', 'One:1', 'Two:1', 'Two A:2', 'Two B:2', 'One A:1', 'Three:1']),
    list.join(' | '),
  );
  await app.keys(['Control', 'z']);
  await sleep(400);
  list = await sections();
  check('and undone, it is back', list[2] === 'One A:2', list.join(' | '));

  // ==== The diagram: the same keys ====
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(500);
  const node = (name) =>
    app.exec(
      `return Array.from(document.querySelectorAll('.diagram .node')).find((n) => n.querySelector('.caption').textContent.trim() === arguments[0]);`,
      name,
    );
  const name = async (keys, text) => {
    await app.keys(keys);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(150);
    await app.keys(text);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(150);
  };
  await app.click(await node('Three'));
  await sleep(150);
  await name(['Alt', 'Enter'], 'Four');
  await name(['Alt', 'Shift', 'Enter'], 'Four A');
  await app.clickText('header [role="radio"]', 'Text');
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);
  list = await sections();
  check(
    'in the diagram, Alt+Enter makes one after the element selected, Alt+Shift+Enter one under it',
    list.slice(-3).join(' | ') === 'Three:1 | Four:1 | Four A:2',
    list.join(' | '),
  );
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(500);
  // Alt+Up and Alt+Down among those beside it.
  await app.click(await node('Four'));
  await sleep(150);
  await app.keys(['Alt', 'ArrowUp']);
  await sleep(400);
  await app.clickText('header [role="radio"]', 'Text');
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);
  list = await sections();
  check('Alt+Up moves the element selected up', list.indexOf('Four:1') < list.indexOf('Three:1'), list.join(' | '));
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(500);
  // Sideways, as the arrow points: deeper on the right of the map, less deep on the left.
  const side = await app.exec(`return arguments[0].classList.contains('left') ? 'left' : 'right'`, await node('Four'));
  await app.click(await node('Four'));
  await sleep(150);
  await app.keys(['Alt', side === 'right' ? 'ArrowRight' : 'ArrowLeft']);
  await sleep(500);
  const deeper = await app.exec(`return arguments[0]?.classList.contains('depth-2')`, await node('Four'));
  check(`Alt and the arrow outwards, on the ${side} of the map, makes it deeper`, deeper === true);
  await app.click(await node('Four'));
  await sleep(150);
  const side2 = await app.exec(`return arguments[0].classList.contains('left') ? 'left' : 'right'`, await node('Four'));
  await app.keys(['Alt', side2 === 'right' ? 'ArrowLeft' : 'ArrowRight']);
  await sleep(500);
  check('and the arrow inwards less deep', await app.exec(`return arguments[0]?.classList.contains('depth-1')`, await node('Four')));
  // In and out.
  await app.click(await node('Two'));
  await sleep(150);
  await app.keys(['Alt', 'Shift', 'ArrowDown']);
  await sleep(600);
  check('Alt+Shift+Down enters the element selected', (await rootName()) === 'Two', await rootName());
  await app.keys(['Alt', 'Shift', 'ArrowUp']);
  await sleep(600);
  check('Alt+Shift+Up goes up again', (await rootName()) === 'Structure', await rootName());
  await app.keys(['Control', 'Enter']);
  await sleep(300);
  check('Ctrl+Enter no longer enters an element', (await rootName()) === 'Structure');
  void shown;

  // ==== Dots, and setting in, as the settings say ====
  await app.clickText('header [role="radio"]', 'Text');
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);
  const choose = async (label) => {
    await app.keys(['Control', ',']);
    await app.waitForText('dialog[open] header h2', 'Settings');
    await sleep(300);
    await app.clickText('dialog[open] [role="radiogroup"][aria-label="Document structure"] [role="radio"]', label);
    await sleep(200);
    await app.press('Escape');
    await app.waitGone('dialog[open]', 3000);
    await sleep(400);
  };
  await choose('Dots');
  const dots = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => s.querySelectorAll('.gutter .depth i').length)`,
  );
  check('dots: one for each level', JSON.stringify(dots) === JSON.stringify([0, 1, 2, 1, 2, 2, 1, 2, 1]), dots.join(' '));
  await app.hover('.text-view footer');
  await sleep(300);
  await app.screenshot('text-structure-3-dots');

  await choose('Set in, with lines');
  const lefts = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => Math.round(s.querySelector('.heading').getBoundingClientRect().left))`,
  );
  const guides = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => s.querySelectorAll('.gutter .guide').length)`,
  );
  check(
    'set in: each level further in, with a line for each level over it',
    lefts[2] > lefts[1] && lefts[1] === lefts[3] && JSON.stringify(guides) === JSON.stringify([0, 0, 1, 0, 1, 1, 0, 1, 0]) &&
      !(await app.exists('.text-view .gutter .depth')),
    `${lefts.join(' ')} / ${guides.join(' ')}`,
  );
  await app.hover('.text-view footer');
  await sleep(300);
  await app.screenshot('text-structure-4-indent');
  // Under the pointer, the icons of the gutter are there beside the lines.
  await app.hover(await app.exec(`return arguments[0].querySelector('.heading')`, await section('Two A')));
  await sleep(300);
  const icons = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === 'Two A');
     return ['.grip'].map((q) => getComputedStyle(s.querySelector(q)).opacity);`,
  );
  // No button to enter stands by a name in the text: the menu and Alt+Shift+Down do it.
  check('the grip shows under the pointer', icons.every((o) => o === '1'), icons.join(' '));
  await app.screenshot('text-structure-5-indent-hover');

  // --- A narrow window: nothing runs out of it ---
  await app.cmd('POST', '/window/rect', { width: 480, height: 900 }).catch(() => {});
  await sleep(800);
  for (const mode of ['Set in, with lines', 'Numbers', 'Dots']) {
    if (mode !== 'Set in, with lines') await choose(mode);
    const fit = await app.exec(
      `const sc = document.querySelector('.text-view .scroller');
       const r = sc.getBoundingClientRect();
       const out = Array.from(document.querySelectorAll('.text-view .section .heading')).filter((h) => h.getBoundingClientRect().right > r.right + 1 || h.getBoundingClientRect().width < 60).length;
       return { width: window.innerWidth, scroll: sc.scrollWidth - sc.clientWidth, out };`,
    );
    check(`in a window 480 pixels wide, ${mode.toLowerCase()}: the names fit`, fit.out === 0 && fit.scroll <= 0, JSON.stringify(fit));
    await app.screenshot(`text-structure-6-narrow-${mode.split(' ')[0].toLowerCase()}`);
  }
  await app.cmd('POST', '/window/rect', { width: 1360, height: 900 }).catch(() => {});
  await sleep(500);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('text-structure-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

void ELEMENT;
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
