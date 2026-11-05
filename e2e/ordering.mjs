// The order of the document is its own (record 0083): an element dragged to
// the background of the map is placed there and keeps its place in the
// order; dragged between two of those beside it, over the first or under the
// last, with the line that shows where it goes, it takes that place and
// flows with the rest; with Shift held it is placed alone, with no line;
// and the numbers of the diagram can count every element from the element
// in view, whatever the look prints.
import { App, Key, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const FIND = `const n = Array.from(document.querySelectorAll('.diagram .node')).find((n) => (n.querySelector('.caption .name')?.textContent ?? '').trim() === arguments[0]) ?? null;`;
  const node = (name) => app.exec(`${FIND} return n;`, name);
  /** The box of an element in the window, by its name. */
  const box = (name) =>
    app.exec(
      `${FIND} if (!n) return null; const r = n.getBoundingClientRect();
       return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, x: r.left + r.width / 2, y: r.top + r.height / 2 };`,
      name,
    );
  const toDiagram = async () => {
    await app.view('diagram');
    await app.waitFor('.diagram .node.root', 8000);
    await sleep(400);
  };
  const select = async (name) => {
    await app.click(await node(name));
    await sleep(200);
  };
  /** Presses keys that make an element, and names it. */
  const make = async (keys, name) => {
    await app.keys(keys);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(150);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(200);
  };
  /** The names of the elements as the text has them, in order; the diagram shown again after. */
  const textOrder = async () => {
    await app.view('text');
    await app.waitFor('.text-view .section', 8000);
    await sleep(400);
    const names = await app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section .heading .title')).map((e) => e.textContent.trim())`,
    );
    await toDiagram();
    return names.join('|');
  };
  /** The name of every box of the map, with the number before it. */
  const mapNumbers = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.diagram .node')).map((n) => ((n.querySelector('.caption .number')?.textContent.trim() ?? '') + ' ' + (n.querySelector('.caption .name')?.textContent.trim() ?? '')).trim()).sort()`,
    );
  const move = (steps) =>
    app.cmd('POST', '/actions', {
      actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: steps }],
    });
  /**
   * Holds an element by the pointer and carries it to a point of the
   * window in steps, says whether the line of a slot shows there, nudging
   * up and down by a pixel or two where it is wanted and does not show,
   * takes a picture where asked, and lets go.
   */
  const carry = async (name, x, y, { shot = null, wantLine = false } = {}) => {
    const from = await box(name);
    await move([
      { type: 'pointerMove', origin: 'viewport', x: Math.round(from.x), y: Math.round(from.y) },
      { type: 'pointerDown', button: 0 },
      { type: 'pause', duration: 60 },
    ]);
    const n = 6;
    for (let i = 1; i <= n; i++) {
      await move([
        {
          type: 'pointerMove',
          origin: 'viewport',
          x: Math.round(from.x + ((x - from.x) * i) / n),
          y: Math.round(from.y + ((y - from.y) * i) / n),
          duration: 30,
        },
      ]);
    }
    await sleep(150);
    let line = await app.exists('.diagram line.slot');
    if (wantLine && !line) {
      for (const dy of [-1, 1, -2, 2]) {
        await move([{ type: 'pointerMove', origin: 'viewport', x: Math.round(x), y: Math.round(y) + dy, duration: 30 }]);
        await sleep(120);
        line = await app.exists('.diagram line.slot');
        if (line) break;
      }
    }
    if (shot) await app.screenshot(shot);
    await move([{ type: 'pointerUp', button: 0 }]);
    await app.cmd('DELETE', '/actions');
    await sleep(500);
    return line;
  };

  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Order');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(700);
  await toDiagram();
  await select('Order');
  await make(['Alt', 'Shift', 'Enter'], 'Alpha');
  await make(['Alt', 'Enter'], 'Beta');
  await make(['Alt', 'Enter'], 'Gamma');
  await make(['Alt', 'Enter'], 'Delta');
  check('four elements come in the order they were made', (await textOrder()) === 'Order|Alpha|Beta|Gamma|Delta', await textOrder());

  // --- The map reads down the right side, then down the left ---
  const root = await box('Order');
  let alpha = await box('Alpha');
  let beta = await box('Beta');
  let gamma = await box('Gamma');
  let delta = await box('Delta');
  check(
    'the map reads down the right side, then down the left',
    alpha.x > root.x && beta.x > root.x && alpha.y < beta.y && gamma.x < root.x && delta.x < root.x && gamma.y < delta.y,
    JSON.stringify({ alpha, beta, gamma, delta }),
  );

  // --- Dragged to the background, an element is placed there and keeps its place in the order ---
  const far = { x: alpha.right + 140, y: alpha.top - 90 };
  const lineFar = await carry('Gamma', far.x, far.y);
  check('away from every column, no line shows', !lineFar);
  check('dragged to the background, an element keeps its place in the order', (await textOrder()) === 'Order|Alpha|Beta|Gamma|Delta', await textOrder());
  gamma = await box('Gamma');
  check('and stands where it was dropped', Math.abs(gamma.x - far.x) < 40 && Math.abs(gamma.y - far.y) < 40 && gamma.x > root.x, JSON.stringify({ gamma, far }));
  await app.screenshot('ordering-1-placed');

  // --- Dragged over the first of a column, an element takes that place in the order ---
  beta = await box('Beta');
  delta = await box('Delta');
  check('the rest flow on, the placed one out of their column', beta.x < root.x && delta.x < root.x && beta.y < delta.y, JSON.stringify({ beta, delta }));
  const lineOver = await carry('Delta', beta.x, beta.top - 10, { wantLine: true });
  check('over the first of a column, a line shows', lineOver);
  check('and dropped there, the element comes before it', (await textOrder()) === 'Order|Alpha|Delta|Beta|Gamma', await textOrder());

  // --- Dragged between two, a placed element takes that place and flows with the rest ---
  delta = await box('Delta');
  beta = await box('Beta');
  // On the left, the boxes of a column align by their inner edge, the right one.
  check('the column stands in the new order', delta.y < beta.y && Math.abs(delta.right - beta.right) < 2, JSON.stringify({ delta, beta }));
  const lineBetween = await carry('Gamma', delta.x, (delta.bottom + beta.top) / 2, { wantLine: true, shot: 'ordering-2-slot' });
  check('between two of a column, a line shows', lineBetween);
  check('and dropped there, the element comes between them', (await textOrder()) === 'Order|Alpha|Delta|Gamma|Beta', await textOrder());
  // Four flowing again, two to each side: Alpha and Delta to the right, Gamma over Beta to the left.
  alpha = await box('Alpha');
  gamma = await box('Gamma');
  delta = await box('Delta');
  beta = await box('Beta');
  check(
    'and flows with the rest',
    gamma.x < root.x && Math.abs(gamma.right - beta.right) < 2 && gamma.y < beta.y && delta.x > root.x && Math.abs(delta.left - alpha.left) < 2,
    JSON.stringify({ alpha, delta, gamma, beta }),
  );

  // --- With Shift held, the element is placed alone where it is dropped, with no line ---
  const lineShift = await (async () => {
    const from = await box('Beta');
    // Between Alpha and Delta on the right: a slot, were Shift not held.
    const to = { x: alpha.x, y: (alpha.bottom + delta.top) / 2 };
    const pointer = [
      { type: 'pointerMove', origin: 'viewport', x: Math.round(from.x), y: Math.round(from.y) },
      { type: 'pointerDown', button: 0 },
      { type: 'pause', duration: 60 },
      { type: 'pointerMove', origin: 'viewport', x: Math.round((from.x + to.x) / 2), y: Math.round((from.y + to.y) / 2), duration: 100 },
      { type: 'pointerMove', origin: 'viewport', x: Math.round(to.x), y: Math.round(to.y), duration: 100 },
      { type: 'pause', duration: 300 },
    ];
    // Shift pressed in the first tick and held through every tick of the pointer's, until the pointer is up.
    const held = [{ type: 'keyDown', value: Key.Shift }, ...pointer.slice(1).map(() => ({ type: 'pause', duration: 0 }))];
    await app.cmd('POST', '/actions', {
      actions: [
        { type: 'key', id: 'keyboard', actions: held },
        { type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: pointer },
      ],
    });
    await sleep(150);
    const line = await app.exists('.diagram line.slot');
    await app.cmd('POST', '/actions', {
      actions: [
        { type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [{ type: 'pointerUp', button: 0 }] },
        { type: 'key', id: 'keyboard', actions: [{ type: 'keyUp', value: Key.Shift }] },
      ],
    });
    await app.cmd('DELETE', '/actions');
    await sleep(500);
    return line;
  })();
  check('with Shift held, no line shows', !lineShift);
  check('and the element is placed, its order as it was', (await textOrder()) === 'Order|Alpha|Delta|Gamma|Beta', await textOrder());
  beta = await box('Beta');
  check('placed where it was dropped, over the column', Math.abs(beta.x - alpha.x) < 40 && beta.x > root.x, JSON.stringify({ beta, alpha }));
  // Taken back, so that the map flows whole for the numbers.
  await app.keys(['Control', 'z']);
  await sleep(400);

  // --- The numbers of every element ---
  await select('Alpha');
  await make(['Alt', 'Shift', 'Enter'], 'Alpha one');
  const chooseNumbers = async (word) => {
    await app.keys(['Control', ',']);
    await app.waitForText('dialog[open] header h2', 'Settings', 5000);
    await app.waitFor('[data-heading-numbers]', 8000);
    await app.exec(`document.querySelector('[data-heading-numbers]').scrollIntoView({ block: 'center' })`);
    await sleep(200);
    await app.clickText('[data-heading-numbers-view="diagram"] [role="radio"]', word);
    await sleep(200);
    if (word === 'Of every element') await app.screenshot('ordering-3-setting');
    await app.press('Escape');
    await app.waitGone('dialog[open]', 5000);
    await sleep(300);
  };
  check('as the document prints them, a new project has no numbers', (await app.count('.diagram .node .caption .number')) === 0);
  await chooseNumbers('Of every element');
  await app.waitFor('.diagram .node .caption .number', 5000);
  const every = await mapNumbers();
  check(
    'of every element, every box is numbered from the element in view, in the order of the tree',
    every.join('|') === '1 Alpha|1.1 Alpha one|2 Delta|3 Gamma|4 Beta|Order',
    every.join('|'),
  );
  await app.screenshot('ordering-4-numbers');
  await select('Alpha');
  await app.keys(['Alt', 'Shift', 'ArrowDown']);
  await app.waitUntil(`return document.querySelector('.diagram .node.root .caption .name')?.textContent.trim() === 'Alpha'`, 5000, 'Alpha in view');
  await sleep(400);
  const within = await mapNumbers();
  check('entered, the count begins at the element in view', within.join('|') === '1 Alpha one|Alpha', within.join('|'));
  await app.keys(['Alt', 'Shift', 'ArrowUp']);
  await app.waitUntil(`return document.querySelector('.diagram .node.root .caption .name')?.textContent.trim() === 'Order'`, 5000, 'the project in view');
  await sleep(300);
  await chooseNumbers('Hidden');
  check('hidden, none', (await app.count('.diagram .node .caption .number')) === 0);
  await chooseNumbers('As the document prints them');
  check('as printed, none here either', (await app.count('.diagram .node .caption .number')) === 0);

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('ordering-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
