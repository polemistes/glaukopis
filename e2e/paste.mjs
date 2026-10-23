// Pasting on Linux goes past WebKitGTK, which ends the whole application
// when it pastes from an empty clipboard (record 0048): from an empty
// clipboard and an empty selection nothing comes and the application lives;
// what is copied in the text comes back with its marks; the middle button
// pastes what is selected; a field takes text as it did.

import { execFileSync } from 'node:child_process';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch();
/** Whether the page still answers; a crash of WebKit leaves it none. */
const alive = () => Promise.race([app.exec('return true').catch(() => false), sleep(5000).then(() => false)]);
const body = '.text-view .section .body';
const words = () => app.exec(`return document.querySelector('${body}').textContent`);
const strong = () => app.exec(`return document.querySelectorAll('${body} strong').length`);
/** A press of the middle button on the private display, at the start of the text. */
function middleClick() {
  const onTheDisplay = { env: { ...process.env, DISPLAY: app.display } };
  return app
    .exec(`const r = document.querySelector('${body} p').getBoundingClientRect(); return [Math.round(r.x + 2), Math.round(r.y + r.height / 2)]`)
    .then(([x, y]) => {
      const win = execFileSync('xdotool', ['search', '--onlyvisible', '--name', 'Glaukopis'], onTheDisplay)
        .toString()
        .trim()
        .split('\n')[0];
      execFileSync('xdotool', ['mousemove', '--window', win, String(x), String(y), 'click', '2'], onTheDisplay);
    });
}

try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Paste');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor(body, 8000);
  await app.click(body);
  await app.keys('Alpha ');
  await app.keys(['Control', 'b']);
  await app.keys('beta');
  await app.keys(['Control', 'b']);
  await app.keys(' gamma.');
  await sleep(300);
  const written = await words();

  // --- Nothing to paste ---
  await app.keys(['Control', 'v']);
  await sleep(1500);
  check('Ctrl+V with an empty clipboard: the application lives', await alive());
  check('and nothing is pasted', (await words()) === written, await words());
  await middleClick();
  await sleep(1500);
  check('the middle button with nothing selected: the application lives', await alive());
  check('and nothing is pasted', (await words()) === written, await words());

  // --- What is copied in the text ---
  await app.click(body);
  await app.keys(['Control', 'a']);
  await app.keys(['Control', 'c']);
  await app.keys(['Control', 'End']);
  await app.exec(`document.addEventListener('paste', (e) => (window.__types = [...e.clipboardData.types]), true); return true`);
  await app.keys(['Control', 'v']);
  await app.waitUntil(`return document.querySelector('${body}').textContent.split('Alpha').length === 3`, 5000, 'the paste');
  check('Ctrl+V gives back what was copied', (await words()).split('Alpha').length === 3, await words());
  const types = await app.exec('return window.__types ?? []');
  check('the paste given again carries the HTML and the text', types.includes('text/html') && types.includes('text/plain'), types.join(', '));
  check('and the marks come back', (await strong()) === 2, `${await strong()} strong`);

  // --- The middle button pastes what is selected ---
  await app.keys(['Control', 'a']);
  await sleep(300);
  await middleClick();
  await app.waitUntil(`return document.querySelector('${body}').textContent.split('Alpha').length > 3`, 5000, 'the middle paste').catch(() => {});
  check('the middle button pastes the selection', (await words()).split('Alpha').length > 3, await words());
  check('the application lives', await alive());

  // --- A field ---
  await app.exec(`
    const input = document.createElement('input');
    input.id = 'paste-field';
    input.addEventListener('paste', (e) => (window.__heard = e.clipboardData.getData('text/plain')));
    document.body.append(input);
    input.focus();
    return true;`);
  await app.keys(['Control', 'v']);
  await app.waitUntil(`return document.getElementById('paste-field').value !== ''`, 5000, 'the field').catch(() => {});
  const value = await app.exec(`return document.getElementById('paste-field').value`);
  const heard = await app.exec('return window.__heard ?? ""');
  // The text copies with its marks as Org: *beta*.
  check('a field takes the text', value.startsWith('Alpha *beta* gamma.'), JSON.stringify(value));
  check('and its own handler hears what is pasted', heard === value, JSON.stringify(heard));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('paste-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await Promise.race([app.close().catch(() => {}), sleep(5000)]);
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
