// The keys: the sheet of them, and the palette of what can be done.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch();
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');

  // --- The sheet, by Ctrl+/ and by the rail ---
  await app.keys(['Control', '/']);
  await app.waitForText('dialog[open] h2', 'Keys', 3000);
  await sleep(300);
  await app.screenshot('keys-1-sheet');
  const groups = await app.exec(`return Array.from(document.querySelectorAll('dialog[open] h3')).map((h) => h.textContent.trim())`);
  check('Ctrl+/ shows the keys, by where they hold', groups.includes('Everywhere') && groups.includes('In the diagram') && groups.includes('Writing'), groups.join(' | '));
  await app.press('Escape');
  await app.waitGone('dialog[open]');
  await app.click('nav.rail button[aria-label="Keys"]');
  await app.waitForText('dialog[open] h2', 'Keys', 3000);
  check('and so does the button in the rail', true);
  await app.press('Escape');
  await app.waitGone('dialog[open]');

  // --- The palette, in a project ---
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await sleep(200);
  await app.keys('refer');
  await sleep(150);
  await app.screenshot('keys-2-palette');
  const first = await app.exec(`return document.querySelector('dialog[open] li.active .label')?.textContent.trim()`);
  check('Ctrl+K finds what is to be done by its name', first === 'References', first);
  await app.press('Enter');
  await app.waitGone('dialog[open]');
  await app.waitFor('.panel[aria-label="References"]', 3000);
  check('and does it', true);

  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await sleep(200);
  await app.keys('two side');
  await app.press('Enter');
  await app.waitGone('dialog[open]');
  await sleep(300);
  check('what has no key is there as well', (await app.count('.pane')) === 2);

  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await app.keys('nothing of the kind');
  await sleep(150);
  check('and says so when nothing answers', /Nothing here goes by that name/.test(await app.text('dialog[open] .list')));
  await app.press('Escape');
  await app.waitGone('dialog[open]');

  // --- The keys of a project go on as before, through the table ---
  await app.keys(['Control', 'Shift', 'h']);
  await app.waitFor('.history-panel', 3000);
  check('the keys of a project are done from the table', await app.exists('.side-tabs [aria-label="History"][aria-selected="true"]'));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('keys-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
