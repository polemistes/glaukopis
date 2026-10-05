// The settings, exercised through the interface.

import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
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

  // Pandoc and Tesseract; Typst is part of the application.
  check('the programs that are installed are found', (await app.count('.program .mark.ok')) === 2);
  check('with their versions', /\d+\.\d+/.test(await app.text('.program .version')));

  // A Pandoc that is older than what is needed is said to be so.
  const oldPandoc = join(app.dataDir, 'old-pandoc');
  writeFileSync(oldPandoc, '#!/bin/sh\necho "pandoc 3.1.1"\n');
  chmodSync(oldPandoc, 0o755);
  const pandocField = 'input[aria-label="Where Pandoc is"]';
  await app.type(pandocField, oldPandoc);
  await app.exec(`document.querySelector('${pandocField}').blur()`);
  await app.waitForText('.program', 'Older than Glaukopis needs', 8000).catch(() => {});
  const said = await app.exec(
    `return Array.from(document.querySelectorAll('.program')).map((p) => p.textContent.replace(/\\s+/g, ' ').trim()).join(' | ')`,
  );
  check(
    'a program older than what is needed is said to be so',
    /Pandoc 3\.1\.1.*Older than Glaukopis needs: 3\.1\.10 or newer/.test(said),
    said,
  );
  await app.screenshot('settings-1b-old-pandoc');
  await app.exec(
    `const f = document.querySelector('${pandocField}'); f.focus(); f.value = ''; f.dispatchEvent(new Event('input', { bubbles: true })); f.blur();`,
  );
  for (let i = 0; i < 40 && (await app.count('.program .mark.ok')) !== 2; i++) await sleep(200);
  const again = await app.exec(
    `return Array.from(document.querySelectorAll('.program')).map((p) => p.textContent.replace(/\\s+/g, ' ').trim().slice(0, 60)).join(' | ')`,
  );
  check(
    'and found again as it was when the path is taken away',
    (await app.count('.program .mark.ok')) === 2,
    again,
  );

  await app.clickText('.segmented button', 'Dark');
  await sleep(200);
  check(
    'the theme changes at once',
    (await app.exec(`return document.documentElement.dataset.theme`)) === 'dark',
  );
  await app.screenshot('settings-2-dark');
  await app.clickText('.segmented button', 'Mellow');
  await sleep(200);
  check(
    'Mellow is a theme of its own, with pastel colours',
    (await app.exec(`return document.documentElement.dataset.theme`)) === 'mellow' &&
      (await app.exec(
        `return getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()`,
      )) === '#f7f2ea',
  );
  await app.screenshot('settings-2b-mellow');
  await app.clickText('.segmented button', 'Your own');
  await sleep(300);
  const ownBefore = await app.exec(
    `return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`,
  );
  await app.exec(
    `const i = document.querySelectorAll('[data-own-theme] input[type=color]')[2]; i.value = '#7a6f9b'; i.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await sleep(300);
  const ownAfter = await app.exec(
    `return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`,
  );
  check(
    "a colouring of one's own: the accent chosen is laid on the root, and the rest follows",
    (await app.exec(`return document.documentElement.dataset.theme`)) === 'own' &&
      ownAfter === '#7a6f9b' &&
      ownBefore !== ownAfter &&
      (await app.exec(
        `return getComputedStyle(document.documentElement).getPropertyValue('--accent-soft').trim()`,
      )) !== '',
    `${ownBefore} -> ${ownAfter}`,
  );
  await app.screenshot('settings-2c-own');
  await app.clickText('.segmented button', 'Light');

  // The whole interface grows, as the window is zoomed: fewer pixels of the page fit in it.
  const wide = await app.exec(`return window.innerWidth`);
  await app.exec(`
    const range = document.querySelector('#interface-size');
    range.value = '1.25';
    range.dispatchEvent(new Event('change', { bubbles: true }));`);
  await sleep(500);
  const zoomed = await app.exec(`return window.innerWidth`);
  await app.screenshot('settings-3-larger');
  check(
    'the interface can be made larger',
    Math.abs(zoomed - wide / 1.25) < 4,
    `${wide} → ${zoomed}`,
  );
  await app.exec(`
    const range = document.querySelector('#interface-size');
    range.value = '1';
    range.dispatchEvent(new Event('change', { bubbles: true }));`);
  await sleep(500);
  check('and as it was again', (await app.exec(`return window.innerWidth`)) === wide);

  await app.exec(`
    const range = document.querySelector('#text-size');
    range.value = '20';
    range.dispatchEvent(new Event('input', { bubbles: true }));`);
  await sleep(150);
  const size = await app.exec(
    `return getComputedStyle(document.querySelector('.sample')).fontSize`,
  );
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
    kept.theme === 'light' &&
      kept.textSize === 20 &&
      kept.displayName === 'Anna Lind' &&
      !kept.contactEmail,
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
