// The languages: the interface in that of the system, changed in the
// settings at once, and new texts written in the language of the system.
// The computer the script runs on is told that its language is Norwegian.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1300, height: 1100, env: { GLAUKOPIS_LANGUAGE: 'nb-NO' } });
try {
  await app.installErrorHook();
  await app.waitFor('.rail a.place', 8000);
  await sleep(300);
  const rail = () =>
    app.exec(`return Array.from(document.querySelectorAll('.rail a.place')).map((a) => a.getAttribute('aria-label'))`);
  check('the interface is in the language of the system', (await rail()).join(' ') === 'Prosjekter Bibliotek Bilder Innstillinger', (await rail()).join(' '));
  check('and the page says so', (await app.exec(`return document.documentElement.lang`)) === 'nb');
  await app.screenshot('languages-1-norwegian');

  // ---- the settings ----
  await app.keys(['Control', ',']);
  await app.waitForText('h2', 'Språk');
  const selects = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.field')).filter((f) => f.querySelector('select')).map((f) => ({ label: f.querySelector('label')?.textContent.trim(), value: f.querySelector('select').value, shown: f.querySelector('select').selectedOptions[0]?.textContent.trim() }))`,
    );
  const before = await selects();
  const language = before.find((s) => s.label === 'Grensesnittet');
  const texts = before.find((s) => s.label === 'Språk for nye tekster');
  check('the interface is as the system, and says what that is', language?.value === 'system' && language?.shown === 'Som systemet (Norsk bokmål)', JSON.stringify(language));
  check('and so are new texts', texts?.value === 'system' && /bokmål/i.test(texts?.shown ?? ''), JSON.stringify(texts));
  await app.screenshot('languages-2-settings');

  await app.exec(
    `const f = Array.from(document.querySelectorAll('.field')).find((f) => f.querySelector('label')?.textContent.trim() === 'Grensesnittet');
     const s = f.querySelector('select'); s.value = 'en'; s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(300);
  check('English is chosen, and the interface changes at once', (await rail()).join(' ') === 'Projects Library Pictures Settings', (await rail()).join(' '));
  check('the page says so', (await app.exec(`return document.documentElement.lang`)) === 'en');
  await sleep(500);
  const kept = JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8'));
  check('what was chosen is kept', kept.language === 'en', JSON.stringify(kept.language));

  // ---- a new text is in the language of the system ----
  await app.keys(['Control', '1']);
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Vreden');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.keys(['Control', 'p']);
  await app.waitFor('.preview', 8000);
  await app.click('.preview button[aria-label="Title, authors, abstract"]');
  await app.waitFor('dialog select');
  const written = await app.exec(`return document.querySelector('dialog select').value`);
  check('a new map is written in the language of the system', written === 'nb', written);
  await app.screenshot('languages-3-details');

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('languages-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
