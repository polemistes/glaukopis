// Kinds of elements: made from an element's menu with a name, a colour and
// a text to begin with; shown on the element in the diagram, in the text
// and in the outline; changed and deleted from the kinds of the project.

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
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
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
  await add('Tab', 'Achilles');
  await add('Enter', 'Troy');

  // --- A kind is made from the menu, and given to the element ---
  await app.rightClick(await app.findByText('.diagram .node', 'Achilles'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Kind');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'New kind…');
  await app.waitForText('dialog[open] h2', 'New kind', 3000);
  await sleep(200);
  await app.keys('Character');
  await app.click('dialog[open] .swatch[aria-label="Rose"]');
  await app.click('dialog[open] textarea');
  await app.keys('Wants');
  await app.keys(['Shift', 'Enter']);
  await app.keys('Fears');
  await app.clickText('dialog[open] footer button', 'Create');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  const kinded = await app.exec(
    `const n = Array.from(document.querySelectorAll('.diagram .node')).find((e) => e.textContent.includes('Achilles'));
     return n.classList.contains('kinded') + ' ' + getComputedStyle(n).getPropertyValue('--kind').trim()`,
  );
  check('the element is of the kind, in its colour', kinded === 'true #be185d', kinded);
  await app.screenshot('kinds-1-diagram');

  // --- The text began with the kind's lines ---
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const section = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('Achilles'));
     return s.querySelector('.tag.kind').textContent.trim() + ' | ' + Array.from(s.querySelectorAll('.body p')).map((p) => p.textContent.trim()).join(', ')`,
  );
  check('the text names the kind, and began with its lines', section === 'Character | Wants, Fears', section);
  await app.keys(['Control', 'Shift', 'o']);
  await app.waitFor('.outline', 3000);
  await sleep(200);
  check('the outline shows the kind as a dot', await app.exists('.outline .dot'));
  await app.screenshot('kinds-2-text');
  await app.keys(['Control', 'Shift', 'o']);
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await sleep(300);

  // --- A second element of the same kind, from the list; and of none ---
  await app.rightClick(await app.findByText('.diagram .node', 'Troy'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Kind');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'Character');
  await sleep(300);
  check('a kind is given from the list', (await app.exec(`return document.querySelectorAll('.diagram .node.kinded').length`)) === 2);
  await app.rightClick(await app.findByText('.diagram .node', 'Troy'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Kind');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'None');
  await sleep(300);
  check('and taken away', (await app.exec(`return document.querySelectorAll('.diagram .node.kinded').length`)) === 1);

  // --- The kinds of the project: changed, and deleted ---
  await app.rightClick(await app.findByText('.diagram .node', 'Troy'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Kind');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'Kinds of this project…');
  await app.waitForText('dialog[open] h2', 'Kinds of elements', 3000);
  const listed = await app.exec(`return document.querySelector('dialog[open] .kind').textContent.replace(/\\s+/g, ' ').trim()`);
  check('the kinds are listed with how many are of them', listed === 'Character 1 element', listed);
  await app.click('dialog[open] .kind');
  await app.waitForText('dialog[open] h2', 'Change the kind', 3000);
  await sleep(200);
  await app.exec(`const i = document.querySelector('dialog[open] input'); i.focus(); i.select();`);
  await app.keys('Person');
  await app.clickText('dialog[open] footer button', 'Save');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(300);
  check('a kind renamed is renamed on its elements', (await app.exec(`return document.querySelector('.text-view .tag.kind').textContent.trim()`)) === 'Person');
  await app.keys(['Control', 'd']);
  await app.waitFor('.diagram .node.root', 5000);
  await sleep(300);
  await app.rightClick(await app.findByText('.diagram .node', 'Achilles'));
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Kind');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'Kinds of this project…');
  await app.waitForText('dialog[open] h2', 'Kinds of elements', 3000);
  await app.click('dialog[open] .kind');
  await app.waitForText('dialog[open] h2', 'Change the kind', 3000);
  await app.clickText('dialog[open] footer button', 'Delete');
  await app.waitForText('dialog[open] h2', 'Delete the kind', 3000);
  await sleep(200);
  // The question stands over the kind's dialog: its own button, the last of them.
  await app.exec(
    `const d = Array.from(document.querySelectorAll('dialog[open]')).pop();
     Array.from(d.querySelectorAll('footer button')).find((b) => b.textContent.trim() === 'Delete').click()`,
  );
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  check('a kind deleted leaves its elements of none', !(await app.exists('.diagram .node.kinded')));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('kinds-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
