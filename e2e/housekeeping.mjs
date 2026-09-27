// Putting things in order: duplicates in the library, deleted projects,
// earlier versions of a project.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1280, height: 860 });
try {
  await app.installErrorHook();

  // A library in which two references are there twice: once by ISBN, once by title and author.
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  const twice = `
@book{nagy-best,
  author = {Nagy, G.},
  title = {The Best of the Achaeans},
  year = {1979},
  isbn = {0801823889},
  pagetotal = {392},
}
@book{lord:singer,
  author = {Lord, Albert Bates},
  title = {The singer of tales},
  year = {1960},
  location = {Cambridge, Mass.},
}`;
  const before = await app.execAsync(
    `const invoke = window.__TAURI_INTERNALS__.invoke;
     await invoke('import_apply', { plan: await invoke('import_bib_text', { text: arguments[0] }) });
     const plan = await invoke('import_bib_text', { text: arguments[1] });
     // Against the advice of the application.
     for (const item of plan.items) item.action = { kind: 'add' };
     await invoke('import_apply', { plan });
     return (await invoke('library_list')).entries.length;`,
    bib,
    twice,
  );

  await app.keys(['Control', '2']);
  await app.waitFor('.split-more', 8000);
  await sleep(300);
  await app.click('.split-more');
  await app.clickText('[role="menuitem"]', 'Find duplicates');
  await app.waitFor('dialog .group', 8000);
  await sleep(300);
  await app.screenshot('housekeeping-1-duplicates');
  check('both pairs are found', (await app.count('dialog .group')) === 2);
  const whys = await app.exec(`return Array.from(document.querySelectorAll('dialog .why')).map((e) => e.textContent.trim())`);
  check('one of them for certain', whys.some((w) => w.startsWith('The same')) , whys.join(' | '));

  // The second is said to be different; the first is made one.
  await app.exec(`
    const groups = Array.from(document.querySelectorAll('dialog .group'));
    const lord = groups.find((g) => g.textContent.includes('inger of'));
    Array.from(lord.querySelectorAll('button')).find((b) => b.textContent.includes('They are different')).click();`);
  await sleep(200);
  check('what is said to be different is let be', (await app.count('dialog .group')) === 1);
  await app.clickText('dialog .group button', 'Make them one');
  await app.waitForText('dialog', 'No more duplicates', 8000);
  await app.screenshot('housekeeping-2-merged');
  const after = await app.execAsync(
    `const invoke = window.__TAURI_INTERNALS__.invoke;
     const listing = await invoke('library_list');
     const nagy = listing.entries.filter((e) => e.title.includes('Best of the'));
     const full = await invoke('library_get', { id: nagy[0].id });
     return { count: listing.entries.length, nagy: nagy.length, pages: full.fields.pagetotal, publisher: full.fields.publisher };`,
  );
  check('two have become one', after.count === before - 1 && after.nagy === 1, JSON.stringify(after));
  check('which has what either had', after.pages === '392' && /Johns Hopkins/.test(after.publisher ?? ''), JSON.stringify(after));
  await app.clickText('dialog footer button', 'Close');
  await app.waitGone('dialog[open]');

  // ---- deleted projects ----
  await app.keys(['Control', '1']);
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const id = await app.exec(`return location.hash.split('/')[2]`);

  // Two states, so that the first of them is kept as an earlier version.
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The word mênis');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 8000);
  await app.click('.card');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.click('.diagram .node.root');
  await app.press('Tab');
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('Reception');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 8000);
  await sleep(400);

  await app.rightClick('.card');
  await app.clickText('[role="menuitem"]', 'Earlier versions');
  await app.waitFor('dialog li', 8000);
  await sleep(200);
  await app.screenshot('housekeeping-3-versions');
  check('an earlier version has been kept', (await app.count('dialog li')) >= 1);
  await app.exec(`
    const rows = Array.from(document.querySelectorAll('dialog li'));
    rows[rows.length - 1].querySelector('button').click();`);
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  const then = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node .caption')).map((e) => e.textContent.trim())`,
  );
  check(
    'it opens as a project of its own, as it was then',
    then.includes('The word mênis') && !then.includes('Reception') && (await app.exec(`return location.hash.split('/')[2]`)) !== id,
    then.join(' | '),
  );
  await app.click('header button[aria-label="All projects"]');
  await app.waitFor('.card', 8000);
  await sleep(300);
  check('beside the one it was taken from', (await app.count('.card')) === 2);

  await app.rightClick(await app.findByText('.card', 'as of'));
  await app.clickText('[role="menuitem"]', 'Delete');
  await app.waitForText('dialog h2', 'Delete');
  await sleep(250);
  await app.clickText('dialog footer button', 'Delete project');
  await app.waitForText('.under button', '1 deleted project', 8000);
  check('a project that is deleted is in the trash', (await app.count('.card')) === 1);
  await app.click('.under button');
  await app.waitFor('dialog li', 5000);
  await sleep(250);
  await app.screenshot('housekeeping-4-trash');
  await app.clickText('dialog li button', 'Bring back');
  await until(async () => (await app.count('.card')) === 2);
  check('and can be brought back', true);
  check('after which the trash is empty, and not shown', !(await app.exists('.under button')));

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('housekeeping-failure').catch(() => {});
} finally {
  await app.close();
}

async function until(fn, ms = 8000) {
  const start = Date.now();
  while (!(await fn())) {
    if (Date.now() - start > ms) throw new Error('timed out');
    await sleep(100);
  }
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
