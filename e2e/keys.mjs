// The keys: the sheet of them, and the palette of what can be done; Escape
// closes any menu, the text's right-click menu keeping the focus.

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

  // --- The sheet, by Ctrl+/ and by the rail ---
  await app.keys(['Control', '/']);
  await app.waitForText('dialog[open] h2', 'Keys', 3000);
  await sleep(300);
  await app.screenshot('keys-1-sheet');
  const groups = await app.exec(`return Array.from(document.querySelectorAll('dialog[open] h3')).map((h) => h.textContent.trim())`);
  check('Ctrl+/ shows the keys, by where they hold', groups.includes('Everywhere') && groups.includes('In the diagram') && groups.includes('Writing'), groups.join(' | '));
  await app.press('Escape');
  await app.waitGone('dialog[open]');
  await app.click('nav.rail button[aria-label="Keys"]');
  await app.waitForText('dialog[open] h2', 'Keys', 3000);
  check('and so does the button in the rail', true);
  await app.press('Escape');
  await app.waitGone('dialog[open]');

  // --- The palette, in a project ---
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await sleep(200);
  await app.keys('refer');
  await sleep(150);
  await app.screenshot('keys-2-palette');
  const first = await app.exec(`return document.querySelector('dialog[open] li.active .label')?.textContent.trim()`);
  check('Ctrl+K finds what is to be done by its name', first === 'References', first);
  await app.press('Enter');
  await app.waitGone('dialog[open]');
  await app.waitFor('.panel[aria-label="References"]', 3000);
  check('and does it', true);

  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await sleep(200);
  await app.keys('open or close the document pane');
  await app.press('Enter');
  await app.waitGone('dialog[open]');
  await sleep(300);
  check('what has no key is there as well', !(await app.exists('.panel[aria-label="References"]')));

  // Split view, from the palette, opens its menu at its button.
  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await sleep(200);
  await app.keys('split view');
  await app.press('Enter');
  await app.waitGone('dialog[open]');
  await app.clickText('.menu [role="menuitem"]', 'This element, as diagram and text');
  await sleep(300);
  check('Split view, from the palette, opens its menu', (await app.count('.pane')) === 2);

  await app.keys(['Control', 'k']);
  await app.waitFor('dialog[open] .query', 3000);
  await app.keys('nothing of the kind');
  await sleep(150);
  check('and says so when nothing answers', /Nothing here goes by that name/.test(await app.text('dialog[open] .list')));
  await app.press('Escape');
  await app.waitGone('dialog[open]');

  // --- The keys of a project go on as before, through the table ---
  await app.keys(['Control', 'Shift', 'h']);
  await app.waitFor('.history-panel', 3000);
  check('the keys of a project are done from the table', await app.exists('.side-tabs [aria-label="History"][aria-selected="true"]'));

  // --- Escape closes any menu: the text's right-click menu keeps the focus, and a menu closes whoever has it ---
  await app.keys(['Control', 'w']);
  await sleep(400);
  await app.view('text');
  await app.waitFor('.text-view .section .body', 5000);
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys('Sing, goddess, the wrath of Achilles.');
  await sleep(600);

  // --- Ctrl+Alt and a digit: the kind of paragraph the document type gives it ---
  const kindNow = () =>
    app.exec(`return document.querySelector('.text-view .section .body .prose > p')?.getAttribute('data-kind') ?? 'text'`);
  await app.keys(['Control', 'Alt', '1']);
  await sleep(400);
  check('Ctrl+Alt+1 makes the paragraph a quotation in a plain document', (await kindNow()) === 'quote', await kindNow());
  await app.keys(['Control', 'Alt', '0']);
  await sleep(400);
  check('and Ctrl+Alt+0 text again', (await kindNow()) === 'text', await kindNow());
  await app.keys(['Control', '/']);
  await app.waitForText('dialog[open] h2', 'Keys', 3000);
  await sleep(300);
  const kindRows = await app.exec(
    `return Array.from(document.querySelectorAll('dialog[open] dt')).map((dt) => dt.textContent.trim() + ' ' + Array.from(dt.nextElementSibling.querySelectorAll('kbd')).map((k) => k.textContent.trim()).join(' '))`,
  );
  check(
    'the sheet lists the keys of the kinds by the kinds the document type gives them',
    kindRows.includes('Text Ctrl+Alt+0') && kindRows.includes('Verse Ctrl+Alt+2') && kindRows.includes("Quotation Ctrl+' Ctrl+Alt+1"),
    kindRows.filter((r) => r.includes('Ctrl+Alt+')).join(' | '),
  );
  await app.screenshot('keys-3-kinds');
  await app.press('Escape');
  await app.waitGone('dialog[open]');
  // Opened anew, the text is drawn without its editor, which the right press then makes.
  await app.openProject('Wrath');
  await app.waitFor('.text-view .section .body p', 8000);
  await sleep(600);
  await app.rightClick('.text-view .section .body p');
  await app.waitFor('.menu', 3000);
  await sleep(400);
  check(
    'the text’s right-click menu keeps the focus as the editor is made where it was pressed',
    await app.exec(`return !!document.activeElement?.closest('.menu')`),
    await app.exec(`return document.activeElement?.className ?? ''`),
  );
  await app.press('Escape');
  await sleep(300);
  check('and Escape closes it', !(await app.exists('.menu')));
  await app.rightClick('.text-view .section .body p');
  await app.waitFor('.menu', 3000);
  await sleep(300);
  await app.exec(`document.querySelector('.text-view .ProseMirror')?.focus()`);
  await sleep(100);
  await app.press('Escape');
  await sleep(300);
  check('Escape closes a menu where the text has the focus', !(await app.exists('.menu')));

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('keys-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
