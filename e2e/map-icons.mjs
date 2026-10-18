// The small round buttons that enter an element and go up again, in the
// diagram and in the text; an element with no text is written in at once;
// and the keys that make new elements work in an empty text.

import { App, sleep } from './harness.mjs';

const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch();
try {
  await app.installErrorHook();

  /** Where the focus is: the element whose section holds it, and which part. */
  const where = () =>
    app.exec(
      `const a = document.activeElement;
       const s = a?.closest?.('[data-section]');
       return {
         tag: a?.tagName ?? null,
         section: s ? (s.querySelector('.heading .title')?.textContent ?? '').trim() : null,
         part: a?.closest?.('[data-part]')?.dataset.part ?? null,
         editor: !!a?.closest?.('.ProseMirror'),
       };`,
    );
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
  /** A press of the pointer at a point of the window. */
  const clickAt = async (x, y) => {
    await app.cmd('POST', '/actions', {
      actions: [
        {
          type: 'pointer',
          id: 'mouse',
          parameters: { pointerType: 'mouse' },
          actions: [
            { type: 'pointerMove', origin: 'viewport', x: Math.round(x), y: Math.round(y) },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ],
    });
    await app.cmd('DELETE', '/actions');
  };
  /** How much an element is seen, given as the page or as the driver names it. */
  const opacity = (el) =>
    app.exec(
      `return getComputedStyle(arguments[0]).opacity`,
      typeof el === 'string' ? { [ELEMENT]: el } : el,
    );
  const rootName = () =>
    app.exec(`return document.querySelector('.diagram .node.root .caption')?.textContent.trim() ?? null`);
  const blur = () => app.exec(`document.activeElement?.blur?.()`);

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Icons');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(600);

  // --- A new project: its text is empty, and the cursor is in it ---
  let at = await where();
  check(
    'a new project opens with the cursor in its empty text',
    at.editor && at.part === 'body' && at.section === 'Icons',
    JSON.stringify(at),
  );
  check(
    'the text says nothing of where to write',
    !(await app.exec(`return document.querySelector('.text-view')?.textContent.includes('Write here')`)),
  );

  // --- The keys that make elements, from an empty text ---
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys('Alpha');
  await app.press('Enter');
  await sleep(250);
  at = await where();
  check('Ctrl+Enter in the empty text of the element in view begins the first element', at.section === 'Alpha' && at.part === 'body', JSON.stringify(at));
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys('Beta');
  await app.press('Enter');
  await sleep(250);
  await app.keys(['Control', 'Shift', 'Enter']);
  await sleep(400);
  await app.keys('Beta one');
  await app.press('Enter');
  await sleep(250);
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys('Beta two');
  await app.press('Enter');
  await sleep(250);
  let list = await sections();
  check(
    'Ctrl+Enter and Ctrl+Shift+Enter each make an element from an empty text',
    JSON.stringify(list) === JSON.stringify(['Icons:0', 'Alpha:1', 'Beta:1', 'Beta one:2', 'Beta two:2']),
    list.join(' | '),
  );

  // Tab in an empty text leaves the cursor there, and the keys still work.
  await app.press('Tab');
  await sleep(200);
  at = await where();
  check('Tab in an empty text leaves the cursor in it', at.section === 'Beta two' && at.part === 'body' && at.editor, JSON.stringify(at));
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys('Beta three');
  await sleep(250);
  list = await sections();
  check('and Ctrl+Enter after it makes one', list.includes('Beta three:2'), list.join(' | '));

  // A press in the gutter beside an empty text puts the cursor in it.
  await blur();
  await sleep(150);
  const alpha = await section('Alpha');
  const gutterPoint = await app.exec(
    `const g = arguments[0].querySelector('.gutter').getBoundingClientRect();
     const b = arguments[0].querySelector('.body').getBoundingClientRect();
     return { x: g.left + 4, y: b.top + b.height / 2 };`,
    alpha,
  );
  await clickAt(gutterPoint.x, gutterPoint.y);
  await sleep(300);
  at = await where();
  check('a press beside an empty text puts the cursor in it', at.section === 'Alpha' && at.part === 'body' && at.editor, JSON.stringify(at));
  await app.keys(['Control', 'Enter']);
  await sleep(400);
  await app.keys('Alpha two');
  await sleep(250);
  list = await sections();
  check('and the keys make an element from there', list[2] === 'Alpha two:1', list.join(' | '));

  // A press between the elements puts the cursor at the end of the one before.
  await blur();
  await sleep(150);
  const between = await app.exec(
    `const all = Array.from(document.querySelectorAll('.text-view .section'));
     const a = all[2].getBoundingClientRect(), b = all[3].getBoundingClientRect();
     return { x: a.left + a.width / 2, y: (a.bottom + b.top) / 2, gap: b.top - a.bottom };`,
  );
  await clickAt(between.x, between.y);
  await sleep(300);
  at = await where();
  check('a press between two elements puts the cursor in the one before', at.section === 'Alpha two' && at.editor, JSON.stringify({ ...at, gap: between.gap }));
  await app.screenshot('map-icons-1-text');

  // --- The diagram: the button to enter shows under the pointer ---
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(500);
  const beta = await app.findByText('.diagram .node', 'Beta');
  const betaNode = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node')).find((n) => n.querySelector('.caption').textContent.trim() === 'Beta');`,
  );
  const enterOf = await app.exec(`return arguments[0].querySelector('.corner.enter')`, betaNode);
  check('an element that is not selected has its button to enter, unseen', !!enterOf && Number(await opacity(enterOf)) === 0);
  await app.hover(beta);
  await sleep(350);
  check('it shows under the pointer', Number(await opacity(enterOf)) === 1, await opacity(enterOf));
  check(
    'the element in view of the project has no button to go up: the owl does that',
    !(await app.exists('.diagram .node.root .corner')),
  );
  await app.screenshot('map-icons-2-hover');
  await app.click(enterOf);
  await sleep(600);
  check('pressed, the element is entered', (await rootName()) === 'Beta', await rootName());

  // On the element in view, the one to go up.
  const leave = await app.waitFor('.diagram .node.root .corner.leave', 3000);
  check('the element in view has a button to go up, unseen until the pointer is on it', Number(await opacity(leave)) === 0);
  await app.hover('.diagram .node.root');
  await sleep(350);
  check('it shows under the pointer', Number(await opacity(leave)) === 1);
  const tip = await app.attr(leave, 'aria-label');
  check('it says where it goes', tip === 'Up to “Icons”', tip);
  await app.screenshot('map-icons-3-leave');
  await app.click(leave);
  await sleep(600);
  check('pressed, the element over it is in view', (await rootName()) === 'Icons', await rootName());
  const selected = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node.selected')).map((n) => n.querySelector('.caption').textContent.trim())`,
  );
  check('with the element come from selected', selected.join() === 'Beta', selected.join());

  // --- An element with only a name, entered and shown as text: written in at once ---
  const alphaNode = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node')).find((n) => n.querySelector('.caption').textContent.trim() === 'Alpha');`,
  );
  await app.click(alphaNode);
  await sleep(200);
  await app.keys(['Alt', 'Shift', 'ArrowDown']);
  await sleep(600);
  check('Alt+Shift+Down enters it', (await rootName()) === 'Alpha', await rootName());
  await app.clickText('header [role="radio"]', 'Text');
  await app.waitFor('.text-view .section', 8000);
  await sleep(600);
  at = await where();
  check('shown as text, its empty text has the cursor', at.section === 'Alpha' && at.part === 'body' && at.editor, JSON.stringify(at));
  await app.keys('Typed at once.');
  await sleep(300);
  const typed = await app.exec(
    `return document.querySelector('.text-view .section.level-0 .body')?.textContent.trim()`,
  );
  check('and what is typed goes into it', typed === 'Typed at once.', typed);

  // --- The text: the button to go up, by the name of the element in view ---
  const heading = await app.find('.text-view .section.level-0 .heading');
  const textLeave = await app.find('.text-view .section.level-0 .gutter .corner.leave');
  check('in the text, the button to go up is unseen', Number(await opacity(textLeave)) === 0);
  await app.hover(heading);
  await sleep(350);
  check('and shows with the pointer on the name', Number(await opacity(textLeave)) === 1);
  await app.screenshot('map-icons-4-text-leave');
  // From the name to the button, through the gutter: it stays.
  await app.hover(textLeave);
  await sleep(250);
  check('and stays as the pointer goes to it', Number(await opacity(textLeave)) === 1);
  await app.click(textLeave);
  await sleep(700);
  list = await sections();
  check('pressed, the text of the element over it is shown', list[0] === 'Icons:0', list.join(' | '));
  check('with no button to go up from the project', !(await app.exists('.text-view .section.level-0 .corner')));

  // The button to enter, by the name of any other element.
  const betaSection = await section('Beta');
  const textEnter = await app.exec(`return arguments[0].querySelector('.gutter .corner.enter')`, betaSection);
  await app.hover(await app.exec(`return arguments[0].querySelector('.heading')`, betaSection));
  await sleep(350);
  check('in the text, the button to enter shows by the name of an element', Number(await opacity(textEnter)) === 1);
  await app.screenshot('map-icons-5-text-enter');
  await app.click(textEnter);
  await sleep(700);
  list = await sections();
  check('pressed, the element is entered', list[0] === 'Beta:0', list.join(' | '));

  // --- An empty text not yet written in takes no room, and pressed under its name, takes the cursor ---
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.clickText('header [role="radio"]', 'Text');
  await app.waitFor('.text-view .section', 8000);
  await sleep(600);
  const blanks = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .body .static.blank')).map((b) => Math.round(b.parentElement.closest('.body').getBoundingClientRect().height))`,
  );
  check('an empty text takes no room', blanks.length > 0 && blanks.every((h) => h === 0), blanks.join(' '));
  const one = await section('Beta one');
  // Pressed as a hand does it, under the name: see `App.click`.
  await app.click(await app.exec(`return arguments[0].querySelector('.body')`, one));
  await sleep(300);
  at = await where();
  check('and pressed, has the cursor', at.section === 'Beta one' && at.part === 'body' && at.editor, JSON.stringify(at));
  await app.keys(['Control', 'Shift', 'Enter']);
  await sleep(400);
  await app.keys('Beta one a');
  await sleep(250);
  list = await sections();
  check('where Ctrl+Shift+Enter makes one under it', list.includes('Beta one a:2'), list.join(' | '));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('map-icons-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
