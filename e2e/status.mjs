// How far the writing of each element has come: said from its menu, shown
// on it lightly, and counted for the map in the diagram and under the text.

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
  await add('Tab', 'The quarrel');
  await add('Enter', 'The embassy');
  await add('Enter', 'The return');
  await sleep(300);
  check(
    'no element says how far it has come, and the map says nothing of it',
    !(await app.exists('.diagram .mark.status')) && !(await app.exists('.diagram .progress')),
  );

  const say = async (name, status) => {
    await app.rightClick(await app.findByText('.diagram .node', name));
    await app.waitFor('.menu');
    await sleep(150);
    await app.clickText('.menu [role="menuitem"]', 'Status');
    await sleep(200);
    await app.clickText('.menu [role="menuitem"]', status);
    await sleep(300);
  };
  await say('The quarrel', 'Done');
  await say('The embassy', 'Draft');
  await say('The return', 'Idea');
  const marks = await app.exec(
    `return Array.from(document.querySelectorAll('.diagram .node')).map((n) => {
       const m = n.querySelector('.mark.status');
       return n.querySelector('.caption').textContent.trim() + ':' + (m ? ['idea', 'draft', 'done'].find((s) => m.classList.contains(s)) : '-');
     })`,
  );
  check(
    'each says how far it has come, from its menu',
    ['The quarrel:done', 'The embassy:draft', 'The return:idea'].every((m) => marks.includes(m)),
    marks.join(' | '),
  );
  const said = await app.exec(
    `return document.querySelector('.diagram .mark.status.draft').getAttribute('aria-label')`,
  );
  check('and says it with its words when asked', said === 'Draft · 0 words', said);
  const progress = await app.text('.diagram .progress');
  check(
    'the map says how far it has come',
    progress.trim() === '1 done · 1 draft · 1 idea',
    progress,
  );
  await app.screenshot('status-1-diagram');

  // --- Under the text, the same ---
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const under = await app.exec(
    `return document.querySelector('.text-view footer .progress')?.textContent.trim() ?? ''`,
  );
  check('and so does the foot of the text', under === '1 done · 1 draft · 1 idea', under);
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await sleep(300);

  // --- Unsaid, and said again by undo ---
  await say('The return', 'No status');
  const left = await app.exec(`return document.querySelectorAll('.diagram .mark.status').length`);
  check('what is said of an element can be taken back', left === 2, `${left} left`);
  check(
    'and the map counts what is said',
    (await app.text('.diagram .progress')).trim() === '1 done · 1 draft',
  );
  await app.keys(['Control', 'z']);
  await sleep(300);
  check(
    'and undo says it again',
    (await app.exec(`return document.querySelectorAll('.diagram .mark.status').length`)) === 3,
  );

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('status-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
