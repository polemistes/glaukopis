// The settings, exercised through the interface.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1200, height: 1500 });
try {
  await app.installErrorHook();
  await app.keys(['Control', ',']);
  await app.waitForText('h1', 'Settings');
  await app.waitFor('.program .mark.ok', 8000);
  await sleep(300);
  await app.screenshot('settings-1');

  // Pandoc, Typst and Tesseract.
  check('the programs that are installed are found', (await app.count('.program .mark.ok')) === 3);
  check('with their versions', /\d+\.\d+/.test(await app.text('.program .version')));

  await app.clickText('.segmented button', 'Dark');
  await sleep(200);
  check('the theme changes at once', (await app.exec(`return document.documentElement.dataset.theme`)) === 'dark');
  await app.screenshot('settings-2-dark');
  await app.clickText('.segmented button', 'Light');

  await app.exec(`
    const range = document.querySelector('#text-size');
    range.value = '20';
    range.dispatchEvent(new Event('input', { bubbles: true }));`);
  await sleep(150);
  const size = await app.exec(`return getComputedStyle(document.querySelector('.sample')).fontSize`);
  check('the size of the text follows', size === '20px', size);

  const nameField = await app.exec(
    `return Array.from(document.querySelectorAll('label')).find((l) => l.textContent.trim() === 'Name').getAttribute('for')`,
  );
  await app.type(`#${nameField}`, 'Anna Lind');
  const contact = await app.find('input[type="email"]');
  await app.type(contact, 'not an address');
  await app.click('h1');
  await app.waitForText('.settings', 'does not look like an address');
  check('an address that is none is not kept', true);
  await sleep(600);
  const kept = JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8'));
  check(
    'what is set is on disk',
    kept.theme === 'light' && kept.textSize === 20 && kept.displayName === 'Anna Lind' && !kept.contactEmail,
    JSON.stringify(kept),
  );

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('settings-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
