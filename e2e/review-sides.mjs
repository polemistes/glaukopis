// A review in progress closes when the other side takes the focus: the
// document pane follows the active side, and the review of the changes is of
// the side it was begun in. Two sides of one project, as diagram and text;
// the review begun in either side, the focus given to the other, the review
// and the tab of changes gone; the focus given back, nothing reopened.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const invoke = (app, cmd, args) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, cmd, args);

async function until(fn, ms = 6000) {
  const start = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - start > ms) return false;
    await sleep(100);
  }
}

/** Puts the focus in a side, as a press in it does. */
const focusSide = (app, i) =>
  app.exec(`document.querySelectorAll('.pane')[arguments[0]].dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`, i);
const focused = (app) => app.exec(`return Array.from(document.querySelectorAll('.pane')).findIndex((p) => p.classList.contains('focused'))`);
const reviewing = (app) => app.exec(`return !!window.__glaukopisHistory?.review`);
const changesShown = (app) => app.exists('[data-document-pane] .side-tabs [data-kind="changes"][aria-selected="true"]');

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-review-sides-'));
const app = await App.launch({ dataDir, width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await invoke(app, 'project_create', { name: 'Homer', id: null, folder: null });
  await app.exec('location.reload();');
  await app.waitFor('[data-projects-pane] .row.project', 10000);
  await sleep(400);
  await app.openProject('Homer');
  await app.waitFor('.top [data-path]', 10000);
  await sleep(400);

  // Something to review: an element with a name.
  await app.newElementUnder();
  await app.keys('Wrath of Achilles');
  await app.press('Enter');
  await sleep(600);

  // Two sides of the project, as diagram and text.
  await app.click('.top button[data-side-by-side]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'This element, as diagram and text');
  check('two sides are shown', await until(async () => (await app.count('.pane')) === 2));

  for (const [from, to] of [
    [0, 1],
    [1, 0],
  ]) {
    await focusSide(app, from);
    await until(async () => (await focused(app)) === from);
    await app.documentPane('changes');
    check(
      `a review begun in side ${from + 1}`,
      await until(async () => (await reviewing(app)) && (await changesShown(app))),
    );
    await focusSide(app, to);
    check(`side ${to + 1} takes the focus`, await until(async () => (await focused(app)) === to));
    check(
      `the review of side ${from + 1} is closed, and the tab of changes with it`,
      await until(async () => !(await reviewing(app)) && !(await changesShown(app))),
      JSON.stringify({ review: await reviewing(app), tab: await changesShown(app) }),
    );
    await focusSide(app, from);
    await sleep(800);
    check(
      `the focus given back to side ${from + 1} does not begin it again`,
      !(await reviewing(app)) && !(await changesShown(app)),
    );
  }

  const errors = await app.pageErrors();
  check('no error in the page', errors.length === 0, errors.join(' | '));
  await app.screenshot('review-sides');
} catch (e) {
  console.log('FAIL  the script stopped:', e.message);
  checks.push({ name: 'the script ran through', ok: false });
  await app.screenshot('review-sides-failed').catch(() => {});
} finally {
  await app.quit().catch(() => app.close());
  rmSync(dataDir, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
