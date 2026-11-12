// Elements dragged in the outline: by their names, to a place between two
// names, as deep as the pointer has gone sideways, with what is under them;
// the line that shows the place and the mark on the element they would go
// under; a drop where an element stands, which changes nothing; an element
// dragged from the text onto the outline; and the outline beside the
// diagram, where it moves elements as well.

import { App, sleep } from './harness.mjs';

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
  /** The rows of the outline, by name and depth, as far in as each stands. */
  const rows = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.outline [data-outline]')).map((b) =>
         b.querySelector('.name').textContent.trim() + ':' + Math.round((parseFloat(b.style.paddingLeft) - 4) / 12))`,
    );
  /** Where a row of the outline is on the screen. */
  const row = (name) =>
    app.exec(
      `const b = Array.from(document.querySelectorAll('.outline [data-outline]')).find((e) => e.querySelector('.name').textContent.trim() === arguments[0]);
       if (!b) return null;
       const r = b.getBoundingClientRect();
       const n = b.querySelector('.name').getBoundingClientRect();
       return { top: Math.round(r.top), bottom: Math.round(r.bottom), middle: Math.round((r.top + r.bottom) / 2), x: Math.round(n.left + 12) };`,
      name,
    );
  /** What the outline shows of a drag: the line, the element marked, and those dragged. */
  const shown = () =>
    app.exec(
      `const o = document.querySelector('.outline');
       const l = o.querySelector('.drop-line');
       const name = (b) => b.querySelector('.name').textContent.trim();
       return {
         line: l ? { top: parseFloat(l.style.top), left: parseFloat(l.style.left) } : null,
         into: Array.from(o.querySelectorAll('button.into')).map(name),
         lifted: Array.from(o.querySelectorAll('button.lifted')).map(name),
         ghost: document.querySelector('.ghost')?.textContent.trim() ?? null,
       };`,
    );
  /** Pointer actions sent without letting go: a drag is done in steps, and looked at between them. */
  const pointer = (actions) =>
    app.cmd('POST', '/actions', {
      actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions }],
    });
  const to = (x, y, duration = 100) => ({ type: 'pointerMove', origin: 'viewport', x, y, duration });
  /** Takes a row by its name, and holds it. */
  const take = async (name) => {
    const r = await row(name);
    await pointer([
      to(r.x, r.middle, 50),
      { type: 'pointerDown', button: 0 },
      { type: 'pause', duration: 80 },
      to(r.x, r.middle + 8, 60),
    ]);
    return r;
  };
  const letGo = async () => {
    await pointer([{ type: 'pointerUp', button: 0 }]);
    await app.cmd('DELETE', '/actions');
    await sleep(500);
  };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Outlined');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(700);

  // ==== A small tree, made in the text ====
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('One');
  await app.press('Enter');
  await sleep(250);
  await app.keys(['Alt', 'Shift', 'Enter']);
  await sleep(400);
  await app.keys('One A');
  await sleep(250);
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('Two');
  await sleep(200);
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
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('Three');
  await app.keys(['Alt', 'ArrowLeft']);
  await sleep(400);
  const made = ['Outlined:0', 'One:1', 'One A:2', 'Two:1', 'Two A:2', 'Two B:2', 'Three:1'];
  let list = await sections();
  check('the tree is made', same(list, made), list.join(' | '));

  await app.keys(['Control', 'Shift', 'o']);
  await app.waitFor('.outline', 3000);
  await sleep(300);
  list = await rows();
  check('the outline lists it, each as deep as it stands', same(list, made), list.join(' | '));

  // ==== A name dragged: the height says where, the way sideways how deep ====
  const two = await row('Two');
  const three = await take('Three');
  // Straight up, to between One A and Two: as deep as it stood, before Two.
  await pointer([to(three.x, two.top + 4, 160)]);
  await sleep(200);
  const beside = await shown();
  // A step to the right: a level deeper, after One A, under One.
  await pointer([to(three.x + 16, two.top + 4, 80)]);
  await sleep(200);
  const deeper = await shown();
  await app.screenshot('outline-1-drag');
  // Two steps: under One A itself.
  await pointer([to(three.x + 32, two.top + 4, 80)]);
  await sleep(200);
  const deepest = await shown();
  // And to the left: no less deep than the name below.
  await pointer([to(three.x - 30, two.top + 4, 80)]);
  await sleep(200);
  const out = await shown();
  check(
    'held straight over a place, the element would stand there as deep as it stood',
    beside.line && same(beside.into, ['Outlined']),
    JSON.stringify(beside),
  );
  check(
    'a step to the right, a level deeper: under the element over the one above',
    deeper.line && same(deeper.into, ['One']) && deeper.line.left === beside.line.left + 12,
    JSON.stringify(deeper),
  );
  check(
    'two steps, under the one above',
    deepest.line && same(deepest.into, ['One A']) && deepest.line.left === beside.line.left + 24,
    JSON.stringify(deepest),
  );
  check(
    'to the left, no less deep than the name below',
    out.line && same(out.into, ['Outlined']) && out.line.left === beside.line.left,
    JSON.stringify(out),
  );
  check(
    'the line stays between the same two names',
    [deeper, deepest, out].every((s) => s.line?.top === beside.line?.top),
    JSON.stringify([beside.line, deeper.line, deepest.line, out.line]),
  );
  check(
    'what is dragged is marked where it still stands, and named beside the pointer',
    same(beside.lifted, ['Three']) && beside.ghost === 'Three',
    JSON.stringify(beside),
  );
  await pointer([to(three.x + 16, two.top + 4, 80)]);
  await sleep(200);
  await letGo();
  const moved = ['Outlined:0', 'One:1', 'One A:2', 'Three:2', 'Two:1', 'Two A:2', 'Two B:2'];
  list = await rows();
  check('dropped a step to the right, it stands after One A, under One', same(list, moved), list.join(' | '));
  list = await sections();
  check('and so it does in the text', same(list, moved), list.join(' | '));
  const after = await shown();
  check('nothing of the drag is left', !after.line && !after.into.length && !after.lifted.length && !after.ghost, JSON.stringify(after));
  const focused = await app.exec(`return document.activeElement?.querySelector?.('.name')?.textContent.trim() ?? null`);
  check('the element moved has the focus in the outline', focused === 'Three', String(focused));
  await app.keys(['Control', 'z']);
  await sleep(400);
  list = await rows();
  check('undo puts it back', same(list, made), list.join(' | '));

  // ==== With what is under it; and a drop where it stands ====
  const last = await row('Three');
  const taken = await take('Two');
  await pointer([to(taken.x, last.bottom + 10, 160)]);
  await sleep(200);
  const carried = await shown();
  await app.screenshot('outline-2-with-what-is-under-it');
  check(
    'an element is dragged with what is under it',
    same(carried.lifted, ['Two', 'Two A', 'Two B']) && same(carried.into, ['Outlined']),
    JSON.stringify(carried),
  );
  await letGo();
  const below = ['Outlined:0', 'One:1', 'One A:2', 'Three:1', 'Two:1', 'Two A:2', 'Two B:2'];
  list = await rows();
  check('dropped under the last name, it stands after it with all under it', same(list, below), list.join(' | '));

  // One, let go a little under where it was taken: it stands where it stood.
  await take('One');
  await sleep(200);
  const still = await shown();
  await letGo();
  list = await rows();
  check('a drop where the element stands leaves it there', !!still.line && same(list, below), `${JSON.stringify(still)} ${list.join(' | ')}`);
  await app.keys(['Control', 'z']);
  await sleep(400);
  list = await rows();
  check('and is no step of its own: undo takes back the move before it', same(list, made), list.join(' | '));

  // ==== A press is still a press ====
  await app.click(await app.findByText('.outline [data-outline]', 'Two A'));
  await sleep(400);
  list = await rows();
  check('a name pressed moves nothing', same(list, made), list.join(' | '));

  // ==== From the text onto the outline: as deep as the names the pointer is over ====
  const grip = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => (e.querySelector('.heading .title')?.textContent ?? '').trim() === 'One A');
     const g = s.querySelector('.gutter .grip').getBoundingClientRect();
     const o = document.querySelector('.outline ol').getBoundingClientRect();
     return { x: Math.round(g.left + g.width / 2), y: Math.round(g.top + g.height / 2), names: Math.round(o.left + 38) };`,
  );
  const end = await row('Three');
  await pointer([
    to(grip.x, grip.y, 50),
    { type: 'pointerDown', button: 0 },
    { type: 'pause', duration: 80 },
    to(grip.x + 4, grip.y + 12, 60),
    to(grip.names + 2, end.bottom + 10, 200),
  ]);
  await sleep(200);
  const fromText = await shown();
  await pointer([to(grip.names + 14, end.bottom + 10, 80)]);
  await sleep(200);
  const fromTextDeeper = await shown();
  check(
    'an element dragged from the text is taken by the outline, as deep as the names the pointer is over',
    fromText.line && same(fromText.into, ['Outlined']) && same(fromTextDeeper.into, ['Three']),
    JSON.stringify([fromText, fromTextDeeper]),
  );
  await letGo();
  const under = ['Outlined:0', 'One:1', 'Two:1', 'Two A:2', 'Two B:2', 'Three:1', 'One A:2'];
  list = await rows();
  check('dropped there, it stands under the last', same(list, under), list.join(' | '));
  await app.keys(['Control', 'z']);
  await sleep(400);
  list = await rows();
  check('and undone, it is back', same(list, made), list.join(' | '));

  // ==== Under a name folded in the outline: opened, so that it is seen ====
  await app.click(
    await app.exec(
      `return Array.from(document.querySelectorAll('.outline [data-outline]')).find((e) => e.querySelector('.name').textContent.trim() === 'Two').querySelector('.chevron')`,
    ),
  );
  await sleep(300);
  list = await rows();
  check('Two is folded in the outline', same(list, ['Outlined:0', 'One:1', 'One A:2', 'Two:1', 'Three:1']), list.join(' | '));
  const folded = await row('Two');
  const moving = await take('Three');
  await pointer([to(moving.x + 16, folded.bottom + 12, 160)]);
  await sleep(200);
  const intoFolded = await shown();
  await letGo();
  list = await rows();
  check(
    'dropped under a folded name, it is the first under it, and the name is opened',
    same(intoFolded.into, ['Two']) &&
      same(list, ['Outlined:0', 'One:1', 'One A:2', 'Two:1', 'Three:2', 'Two A:2', 'Two B:2']),
    `${JSON.stringify(intoFolded)} ${list.join(' | ')}`,
  );
  await app.keys(['Control', 'z']);
  await sleep(400);

  // ==== Beside the diagram ====
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(600);
  check('the outline stands beside the diagram', same(await rows(), made), (await rows()).join(' | '));
  const one = await row('One');
  const b = await take('Two B');
  await pointer([to(b.x - 16, one.bottom + 2, 160)]);
  await sleep(250);
  const overDiagram = await shown();
  await app.screenshot('outline-3-beside-the-diagram');
  await letGo();
  list = await rows();
  check(
    'an element dragged in the outline beside the diagram goes where the line says',
    same(overDiagram.into, ['One']) &&
      same(list, ['Outlined:0', 'One:1', 'Two B:2', 'One A:2', 'Two:1', 'Two A:2', 'Three:1']),
    `${JSON.stringify(overDiagram)} ${list.join(' | ')}`,
  );
  const drawn = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node')).map((n) => n.querySelector('.caption').textContent.trim()).sort()`,
  );
  check('and the diagram draws every element still', drawn.length === 7, drawn.join(' | '));
  await app.screenshot('outline-4-diagram-after');

  // ==== A long outline scrolls under what is held near its edge ====
  await app.click(
    await app.exec(
      `return Array.from(document.querySelectorAll('.diagram .node')).find((n) => n.querySelector('.caption').textContent.trim() === 'Three');`,
    ),
  );
  await sleep(150);
  for (let i = 4; i <= 15; i++) {
    await app.keys(['Alt', 'Enter']);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(`N${i}`);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(120);
  }
  await app.cmd('POST', '/window/rect', { width: 1360, height: 460 }).catch(() => {});
  await sleep(800);
  const long = await app.exec(
    `const o = document.querySelector('.outline ol');
     o.scrollTop = 0;
     const r = o.getBoundingClientRect();
     return { rows: o.querySelectorAll('[data-outline]').length, more: o.scrollHeight - o.clientHeight, bottom: Math.round(r.bottom) };`,
  );
  check('the outline is longer than its pane', long.rows === 19 && long.more > 40, JSON.stringify(long));
  const before = await rows();
  const top = await take('One A');
  await pointer([to(top.x, long.bottom - 10, 200)]);
  await sleep(900);
  const scrolled = await app.exec(
    `const o = document.querySelector('.outline ol');
     return { top: Math.round(o.scrollTop), most: o.scrollHeight - o.clientHeight, line: !!o.querySelector('.drop-line') };`,
  );
  await app.screenshot('outline-5-scrolled');
  check(
    'held near the lower edge, the names scroll under what is dragged, and the line stays',
    scrolled.top > 40 && scrolled.line,
    JSON.stringify(scrolled),
  );
  await letGo();
  list = await rows();
  check(
    'dropped there, the element stands further down than was in view',
    list.length === before.length && list.findIndex((r) => r.startsWith('One A:')) > 8,
    list.join(' | '),
  );
  await app.cmd('POST', '/window/rect', { width: 1360, height: 900 }).catch(() => {});
  await sleep(500);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('outline-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
