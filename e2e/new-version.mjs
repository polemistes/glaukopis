// Told of a new version (record 0099): on Linux nothing is asked at the
// start and the row under Settings › About is not there; a folder of the
// script's own, asked through the hook as Windows and macOS ask the site,
// names a newer version, which is told of once at the foot of the window
// with Download page and named under About; one that is not newer, or a
// folder without the file, tells of nothing. Download page is not pressed:
// it would open a browser.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const toastText = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.toaster .toast')).map((t) => t.textContent.replace(/\\s+/g, ' ').trim()).join(' | ')`,
  );

const app = await App.launch({ width: 1200, height: 1100 });
try {
  await app.installErrorHook();
  await app.waitFor('[data-start]', 10000);
  await sleep(1500);
  check('nothing is told at the start on Linux', !/is out/.test(await toastText(app)), await toastText(app));

  await app.keys(['Control', ',']);
  await app.waitForText('dialog[open] header h2', 'Settings');
  await sleep(300);
  check('About has no row of new versions on Linux', !(await app.exists('[data-new-versions]')));
  await app.press('Escape');
  await app.waitGone('dialog[open]');

  // The site, as a folder of the script's own.
  const site = join(app.dataDir, 'site');
  mkdirSync(site, { recursive: true });
  const offer = (version) => writeFileSync(join(site, 'version.json'), JSON.stringify({ version }));
  const ask = () => app.execAsync(`await window.__glaukopisAskForNewVersion(${JSON.stringify(site)});`);

  offer('99.0.0');
  await ask();
  await app.waitForText('.toaster .toast', 'Glaukopis 99.0.0 is out.', 5000);
  check(
    'a newer version is told of, with Download page',
    (await app.exec(`return document.querySelector('.toaster .toast .action')?.textContent.trim()`)) === 'Download page',
    await toastText(app),
  );
  await app.screenshot('new-version-1-told');
  await sleep(5500);
  check('the message stays until it is closed', /99\.0\.0 is out/.test(await toastText(app)));
  await app.click('.toaster .toast .close');
  await sleep(300);

  await ask();
  await sleep(500);
  check('it is told of once', !/is out/.test(await toastText(app)), await toastText(app));

  await app.keys(['Control', ',']);
  await app.waitForText('dialog[open] header h2', 'Settings');
  await app.exec(`document.querySelector('[data-new-versions]')?.scrollIntoView({ block: 'center' })`);
  await sleep(300);
  const row = await app.exec(
    `return document.querySelector('[data-new-versions]')?.textContent.replace(/\\s+/g, ' ').trim() ?? ''`,
  );
  check(
    'About names it, with Download page, and the asking on',
    /Tell me when a new version is out/.test(row) &&
      /Glaukopis 99\.0\.0 is out\./.test(row) &&
      (await app.exists('[data-new-versions] [data-download-page]')) &&
      (await app.text('[data-new-versions] button.selected')) === 'On',
    row,
  );
  await app.screenshot('new-version-2-about');

  // Turned off, it names nothing; on again, as it was.
  await app.click('[data-new-versions] button[aria-checked="false"]');
  await sleep(300);
  check(
    'turned off, About names no version',
    !(await app.exists('[data-new-versions] [data-download-page]')) &&
      (await app.text('[data-new-versions] button.selected')) === 'Off',
  );
  await app.screenshot('new-version-3-off');
  await app.click('[data-new-versions] button[aria-checked="false"]');
  await sleep(300);
  await app.press('Escape');
  await app.waitGone('dialog[open]');

  offer('0.0.1');
  await ask();
  await sleep(500);
  check('a version that is not newer tells of nothing', !/is out/.test(await toastText(app)));
  await app.keys(['Control', ',']);
  await app.waitForText('dialog[open] header h2', 'Settings');
  await sleep(300);
  check('nor is it named under About', !(await app.exists('[data-new-versions]')));
  await app.press('Escape');
  await app.waitGone('dialog[open]');

  offer('99.0.1');
  await ask();
  await app.waitForText('.toaster .toast', 'Glaukopis 99.0.1 is out.', 5000);
  check('another newer version is told of again', true);
  await app.click('.toaster .toast .close');

  writeFileSync(join(site, 'version.json'), 'not a version');
  await ask();
  await sleep(500);
  check('a file that cannot be read tells of nothing', !/is out|could not/.test(await toastText(app)));

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('new-version-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
