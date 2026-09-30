// Copies between maps: a copy says when its original has changed since it
// was made, and the two can be compared, and the copy take what the
// original is now.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const titles = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node .caption')).map((e) => e.textContent.trim())`,
  );

const app = await App.launch();
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);

  const add = async (key, name) => {
    await app.press(key);
    await app.waitFor('.diagram .node.renaming .prose', 3000);
    await sleep(120);
    await app.keys(name);
    await app.press('Enter');
    await app.waitGone('.diagram .node.renaming', 3000);
    await sleep(80);
  };
  await app.click('.diagram .node.root');
  await add('Tab', 'The word menis');

  // A second map, and back to the first.
  await app.click('.tabs .add');
  await app.waitFor('.tabs .naming input');
  await app.keys('Article');
  await app.press('Enter');
  await sleep(400);
  await app.exec(
    `Array.from(document.querySelectorAll('.tabs .tab')).find((t) => t.textContent.includes('Wrath')).click()`,
  );
  await app.waitFor('.diagram .node:not(.root)', 5000);
  await sleep(300);

  // --- The element is copied to the other map ---
  await app.rightClick(await app.findByText('.diagram .node', 'The word menis'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Copy to map');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'Article');
  await sleep(400);
  check('an element is copied to another map', true);

  // --- The original changes ---
  await app.click(await app.findByText('.diagram .node', 'The word menis'));
  await app.press('F2');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys(['Control', 'a']);
  await app.keys('The word mênis');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await sleep(300);

  // --- The copy says so ---
  await app.exec(
    `Array.from(document.querySelectorAll('.tabs .tab')).find((t) => t.textContent.includes('Article')).click()`,
  );
  await app.waitFor('.diagram .node .mark.behind', 5000);
  await sleep(300);
  check(
    'the copy is marked, as its original has changed',
    (await titles(app)).includes('The word menis'),
    (await titles(app)).join(' | '),
  );
  await app.screenshot('copies-1-behind');

  // --- The two are compared ---
  await app.click('.diagram .node .mark.behind');
  await app.waitForText('dialog[open] h2', 'The copy and its original', 3000);
  await sleep(200);
  const compared = await app.exec(
    `const d = document.querySelector('dialog[open]');
     return { gone: Array.from(d.querySelectorAll('.compared .gone')).map((e) => e.textContent),
              added: Array.from(d.querySelectorAll('.compared .new')).map((e) => e.textContent),
              said: d.querySelector('.said').textContent.trim() }`,
  );
  check(
    'the comparison says that the original has changed',
    /has changed since/.test(compared.said),
    compared.said,
  );
  check(
    'and shows where the two differ',
    compared.gone.includes('mênis') && compared.added.includes('menis'),
    JSON.stringify(compared),
  );
  await app.screenshot('copies-2-compared');

  // --- The copy takes what the original is now ---
  await app.clickText('dialog[open] footer button', 'Take the original’s name and text');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  check(
    'the copy takes the original’s name',
    (await titles(app)).includes('The word mênis'),
    (await titles(app)).join(' | '),
  );
  check('and is no longer marked', !(await app.exists('.diagram .node .mark.behind')));

  // --- Taking it back marks it again ---
  await app.keys(['Control', 'z']);
  await sleep(400);
  check(
    'undo takes it back, and the mark with it',
    (await titles(app)).includes('The word menis') &&
      (await app.exists('.diagram .node .mark.behind')),
  );

  // --- The change can be seen without taking it ---
  await app.rightClick(await app.findByText('.diagram .node', 'The word menis'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Compare with the original…');
  await app.waitForText('dialog[open] h2', 'The copy and its original', 3000);
  await app.clickText('dialog[open] footer button', 'Keep this copy as it is');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  check(
    'a change that was seen is no longer marked, and the copy keeps its own',
    !(await app.exists('.diagram .node .mark.behind')) &&
      (await titles(app)).includes('The word menis'),
  );

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('copies-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
