// The chain under the element in view (record 0082): a project whose one
// element has nothing under it has it beside the project's box; given three
// parts, that element stands under the project and the parts go to both
// sides of it, drawn as the first level, their chapters as the second; the
// line from the project to it runs straight down; entered, the book is in
// the middle with its parts about it as before.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-chain-'));

/** The box of each element of the diagram on the screen, its middle and its level, by name. */
const boxes = (app) =>
  app.exec(`
    const out = {};
    for (const n of document.querySelectorAll('.pane .diagram .node')) {
      const name = n.querySelector('.caption .name')?.textContent.trim();
      const r = n.getBoundingClientRect();
      const level = [...n.classList].find((c) => c.startsWith('depth-'));
      out[name] = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, level, root: n.classList.contains('root') };
    }
    return out;`);
/** The zoom of the diagram. */
const zoom = (app) =>
  app.exec(`return Number(/scale\\(([\\d.]+)\\)/.exec(document.querySelector('.pane .diagram .world')?.style.transform ?? '')?.[1] ?? NaN)`);

const app = await App.launch({ width: 1440, height: 900, dataDir });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'A thesis');
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

  // --- One element with nothing under it stands beside ---
  await add('under', 'The book');
  await sleep(300);
  let b = await boxes(app);
  check('a single element with nothing under it stands beside the project', b['The book'].x > b['A thesis'].x + b['A thesis'].w / 2 && Math.abs(b['The book'].y - b['A thesis'].y) < 2, JSON.stringify(b['The book']));

  // --- Given parts, it stands under the project, and they go to both sides ---
  await add('under', 'Introduction');
  await add('after', 'Part one');
  await add('under', 'Chapter one');
  await add('after', 'Chapter two');
  await add('after', 'Chapter three');
  await app.clickText('.diagram .node .caption .name', 'Part one');
  await sleep(150);
  await add('after', 'Part two');
  await add('under', 'Chapter four');
  await add('after', 'Chapter five');
  await app.clickText('.diagram .node .caption .name', 'Part two');
  await sleep(150);
  await add('after', 'Conclusion');
  await app.press('Escape');
  await sleep(500);
  b = await boxes(app);
  const book = b['The book'];
  const top = b['A thesis'];
  check('the book stands under the project', Math.abs(book.x - top.x) < 2 && book.y > top.y + top.h / 2, `${JSON.stringify(top)} ${JSON.stringify(book)}`);
  const parts = ['Introduction', 'Part one', 'Part two', 'Conclusion'];
  const right = parts.filter((p) => b[p].x > book.x + book.w / 2);
  const left = parts.filter((p) => b[p].x < book.x - book.w / 2);
  check('its parts go to both sides of it', right.length > 0 && left.length > 0 && right.length + left.length === parts.length, `right ${right}, left ${left}`);
  check('the book and its parts are drawn as the first level', ['The book', ...parts].every((p) => b[p].level === 'depth-1'), parts.map((p) => b[p].level).join(' '));
  check('the chapters as the second', ['Chapter one', 'Chapter four'].every((p) => b[p].level === 'depth-2'));
  check('the project keeps its own look', top.root && top.level === 'depth-0');
  const line = await app.exec(`
    const ls = [...document.querySelectorAll('.pane .diagram svg line, .pane .diagram svg path')];
    return ls.length;`);
  check('the lines are drawn', line > 0, String(line));

  // --- Fitted, the whole map is seen ---
  await app.keys(['Control', '0']).catch(() => {});
  await sleep(600);
  console.log(`zoom fitted: ${await zoom(app)}`);
  await app.screenshot('chain-0-book-under-project');

  // --- Entered, the book is in the middle with its parts about it ---
  await app.openMap('The book');
  await sleep(500);
  b = await boxes(app);
  check('entered, the book is the element in view', b['The book'].root);
  check('and its parts stand beside it', parts.every((p) => Math.abs(b[p].x - b['The book'].x) > b['The book'].w / 2));
  await app.screenshot('chain-1-book-entered');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await app.quit();
} catch (e) {
  console.error(e);
  await app.screenshot('chain-failed').catch(() => {});
  checks.push({ name: 'the script ran through', ok: false });
  await app.close();
}
rmSync(dataDir, { recursive: true, force: true });

const failed = checks.filter((c) => !c.ok);
console.log(failed.length ? `\n${failed.length} of ${checks.length} checks failed` : `\nAll ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
