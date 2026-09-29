// Reviewing changes afterwards (ADR 0022): the panel of changes beside the
// text, and what it says of a project whose history is not kept.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

let app;
try {
  app = await App.launch({ width: 1360, height: 880 });
  await app.installErrorHook();

  // ---- a project, whose history is not kept ----
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);

  await app.keys(['Control', 'Shift', 'e']);
  await app.waitFor('.review-panel', 5000);
  check('Ctrl+Shift+E opens the panel of changes', true);
  check(
    'beside the text',
    await app.exists('.text-view'),
    (await app.exists('.diagram')) ? 'the diagram is still shown' : '',
  );
  const said = await app.text('.review-panel');
  check(
    'which says why there is nothing to review where the history is not kept',
    said.includes('The history of this project is not kept'),
    said.replace(/\s+/g, ' ').slice(0, 160),
  );
  await app.screenshot('review-1-no-history');

  await app.keys(['Control', 'Shift', 'e']);
  await app.waitGone('.review-panel', 3000);
  check('and closes it again', true);

  await app.click('header button[aria-label="Review changes"]');
  await app.waitFor('.review-panel', 3000);
  await app.keys(['Control', 'Shift', 'r']);
  await app.waitGone('.review-panel', 3000);
  check('the references take the place of the panel', await app.exists('.panel'));

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app?.screenshot('review-failure').catch(() => {});
} finally {
  await app?.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
