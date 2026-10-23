// A new project opens in its diagram, as the settings have it at first; when
// the settings say its text, the next new project opens on its text.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

// The settings as the application makes them, not as the other scripts have them.
const app = await App.launch({ width: 1360, height: 900, newProjectView: null });
try {
  await app.installErrorHook();
  const begin = async (name) => {
    await app.go('#/');
    await sleep(600);
    // From the welcome at first, then by the plus of the map's bar: the one that is seen.
    await app.beginProject();
    await app.type('dialog input', name);
    await app.clickText('dialog footer button', 'Create');
    await app.waitFor('.project', 8000);
    await sleep(800);
  };
  // The view the bar of the side says is shown.
  const view = () => app.viewShown();

  // ---- at first, in the diagram ----
  await begin('First');
  check('a new project opens in its diagram', (await app.exists('.diagram .node.root')) && !(await app.exists('.text-view .section')), String(await view()));
  check('and the diagram is the view chosen', (await view()) === 'diagram', String(await view()));
  await app.screenshot('new-project-view-1-diagram');

  // ---- the setting ----
  await app.go('#/settings');
  await app.waitFor('[data-new-project-view]', 8000);
  await sleep(300);
  const chosen = () =>
    app.exec(
      `return document.querySelector('[data-new-project-view] [role="radio"][aria-checked="true"]')?.textContent.trim() ?? null`,
    );
  check('the settings say that new projects open in the diagram', (await chosen()) === 'Diagram', String(await chosen()));
  await app.exec(`document.querySelector('[data-new-project-view]').scrollIntoView({ block: 'center' })`);
  await sleep(200);
  await app.screenshot('new-project-view-2-settings');
  await app.clickText('[data-new-project-view] [role="radio"]', 'Text');
  await sleep(400);
  check('the text is chosen', (await chosen()) === 'Text', String(await chosen()));
  // The settings stand over the home: they are closed.
  await app.press('Escape');
  await app.waitGone('dialog[open]', 5000);

  // ---- then, on its text ----
  await begin('Second');
  await app.waitFor('.text-view .section', 8000);
  check('a new project then opens on its text', (await view()) === 'text', String(await view()));

  // ---- a project that is opened again opens as it was left ----
  await app.go('#/');
  await app.waitFor('[data-start]', 8000);
  await sleep(1500);
  await app.openProject('First');
  await sleep(800);
  check('a project opened again opens where it was left', (await view()) === 'diagram', String(await view()));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed} of ${checks.length} passed`);
process.exit(failed ? 1 : 0);
