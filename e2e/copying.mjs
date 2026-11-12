// References and citations copied as a reference style writes them (record
// 0090): references from the library in the usual style, by Ctrl+C and by
// the menu, as words and as HTML; a citation in the style of its document,
// by the button where it is opened, and by Ctrl+C when it is selected
// alone; references from the pane of a document, in the usual style still;
// and a citation that was copied, pasted back as the citation it is.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();

  /** What the clipboard holds, read as a paste reads it. */
  const clip = () =>
    app.execAsync(
      `const c = await window.__TAURI_INTERNALS__.invoke('clipboard_read', { primary: false });
       return { text: c.text ?? '', html: c.html ?? '' };`,
    );
  /** Waits until the clipboard holds words that are as said, and gives what it holds then. */
  const copied = async (as, ms = 8000) => {
    const until = Date.now() + ms;
    let held = await clip();
    while (!as.test(held.text) && Date.now() < until) {
      await sleep(250);
      held = await clip();
    }
    return held;
  };
  /** Chooses the item of an open menu that says exactly this. */
  const choose = async (label) => {
    await app.waitFor('[role="menuitem"]', 3000);
    await app.click(
      await app.exec(
        `return Array.from(document.querySelectorAll('[role="menuitem"]')).find((e) => e.textContent.replace(/\\s+/g, ' ').trim().startsWith(arguments[0] + ' ') || e.textContent.trim() === arguments[0]) ?? null`,
        label,
      ),
    );
  };
  const short = (s) => (s.length > 160 ? `${s.slice(0, 160)}…` : s);

  // ==== The library: references in the usual style ====
  await app.go('#/library');
  await app.waitForText('h3', 'Your library is empty');
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await app.click('.split-more');
  await app.clickText('[role="menuitem"]', 'Paste references');
  await app.waitFor('dialog textarea');
  await app.exec(
    `const t = document.querySelector('dialog textarea');
     t.value = arguments[0];
     t.dispatchEvent(new Event('input', { bubbles: true }));`,
    bib,
  );
  await app.clickText('dialog footer button', 'Continue');
  await app.waitForText('dialog h2', 'Import references');
  await app.clickText('dialog footer button', 'Import');
  await app.waitGone('dialog', 10000);
  await app.waitUntil(`return document.querySelectorAll('.list .item').length >= 10`, 5000, 'the list to fill');
  const count = await app.exec(`return Number(/(\\d+) references/.exec(document.querySelector('.middle footer').textContent)?.[1])`);

  // One, by Ctrl+C in the list.
  await app.click(await app.findByText('.list .item', 'The Best of the Achaeans'));
  await sleep(300);
  await app.keys(['Control', 'c']);
  let held = await copied(/^Nagy, Gregory\./);
  check(
    'Ctrl+C in the list copies the reference as the usual style writes it in a bibliography',
    /^Nagy, Gregory\. The Best of the Achaeans.*1979\.$/.test(held.text) && !held.text.includes('\n'),
    short(held.text),
  );
  check(
    'and as HTML, with the title in italics',
    /<(em|i)\b[^>]*>The Best of the/.test(held.html) && !/<script|data-cites|csl-entry/.test(held.html),
    short(held.html),
  );
  await app.waitForText('.toast', 'Copied', 4000);
  check('and says that it was copied', true);
  await app.screenshot('copying-1-reference');

  // All of them, by the menu.
  await app.click(await app.findByText('.list .item', 'The Singer of Tales'));
  await app.keys(['Control', 'a']);
  await sleep(200);
  await app.rightClick(await app.findByText('.list .item', 'The Singer of Tales'));
  await app.waitFor('[role="menu"]', 3000);
  const items = await app.exec(
    `return Array.from(document.querySelectorAll('[role="menuitem"]')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim()).filter((s) => s.startsWith('Copy'))`,
  );
  await app.screenshot('copying-2-menu');
  check(
    'the menu of references begins its copies with Copy, with its key',
    items[0] === 'Copy Ctrl+C' && items.includes('Copy as BibLaTeX'),
    items.join(' | '),
  );
  await choose('Copy');
  held = await copied(/Lord, Albert B\./);
  const lines = held.text.split('\n');
  check(
    'Copy in the menu copies every reference selected, a line each, in the order of the style',
    lines.length === count &&
      lines.every((l) => l.trim().length > 20) &&
      lines.some((l) => l.startsWith('Nagy, Gregory.')) &&
      lines.some((l) => l.startsWith('West, M. L.')) &&
      JSON.stringify(lines) === JSON.stringify([...lines].sort((a, b) => a.localeCompare(b, 'en'))),
    `${lines.length} of ${count}: ${short(held.text)}`,
  );
  check(
    'and a paragraph each in the HTML',
    (held.html.match(/<p\b/g) ?? []).length === count,
    `${(held.html.match(/<p\b/g) ?? []).length} paragraphs`,
  );

  // ==== A citation, in the style of its document ====
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Copying');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(700);
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('One');
  await app.press('Enter');
  await sleep(250);
  await app.keys('As was said ');
  await app.keys('@');
  await app.waitFor('.picker input');
  await app.keys('nagy best');
  await sleep(400);
  await app.press('Enter');
  await app.waitFor('.editor .locator input');
  await app.keys('45');
  await app.press('Enter');
  await app.waitGone('.editor');
  await sleep(200);
  await app.keys(' and more.');
  await sleep(300);
  const body = '.text-view .section .body';
  const cited = () => app.exec(`return Array.from(document.querySelectorAll('${body} .citation')).map((c) => c.textContent.trim())`);
  check('the text holds the citation, in its neutral form', JSON.stringify(await cited()) === '["(Nagy 1979, 45)"]', (await cited()).join(' | '));

  // Opened, it has a button that copies it: in the style of a new document, a note.
  await app.click(`${body} .citation`);
  await app.waitFor('.editor [data-citation-copy]', 3000);
  await app.screenshot('copying-3-citation-opened');
  await app.click('.editor [data-citation-copy]');
  held = await copied(/^Gregory Nagy,/);
  check(
    'Copy the citation copies it as the style of its document writes it: a note, whole, with its page',
    /^Gregory Nagy, The Best of the Achaeans.*1979\), 45\.$/.test(held.text),
    short(held.text),
  );
  check(
    'its HTML has the italics, and says which citation it is',
    /<(em|i)\b[^>]*>The Best of the/.test(held.html) && /data-citation=/.test(held.html),
    short(held.html),
  );
  await app.press('Escape');
  await app.waitGone('.editor');

  // The document is given another style: the citation is copied in that.
  await app.openLook();
  const offered = await app.lookChoose('Reference style', 'apa');
  await sleep(600);
  check('the document is given the style of the APA', offered && (await app.lookChosen('Reference style')) === 'apa');
  await app.click(`${body} .citation`);
  await app.waitFor('.editor [data-citation-copy]', 3000);
  await app.click('.editor [data-citation-copy]');
  held = await copied(/^\(Nagy, 1979, p\. 45\)$/);
  check(
    'in a document of another style, the citation is copied in that style',
    held.text === '(Nagy, 1979, p. 45)',
    short(held.text),
  );
  await app.press('Escape');
  await app.waitGone('.editor');

  // Selected alone, Ctrl+C copies it so too, once the style has written it.
  // The text has the focus again where the citation was closed.
  await app.waitUntil(`return !!document.activeElement?.closest?.('${body}')`, 3000, 'the text to have the focus');
  // The arrows select the citation on their way through the text: back from its end,
  // since the line is broken where the look stands beside it.
  await app.keys(['Control', 'End']);
  let selected = false;
  for (let i = 0; i < 30 && !selected; i++) {
    await app.press('ArrowLeft');
    await sleep(60);
    selected = await app.exists(`${body} .citation.selected`);
  }
  // Something else on the clipboard first, so that what comes is this copy's.
  await app.execAsync(`await navigator.clipboard.writeText('something else')`);
  await app.keys(['Control', 'c']);
  held = await copied(/^\(Nagy, 1979, p\. 45\)$/);
  check(
    'Ctrl+C on a citation selected alone copies it as the style of its document writes it',
    selected && held.text === '(Nagy, 1979, p. 45)' && /data-citation=/.test(held.html),
    `${selected} ${short(held.text)} / ${short(held.html)}`,
  );

  // Pasted into the text, it is the citation again.
  await app.keys(['Control', 'End']);
  await app.keys(' ');
  await app.keys(['Control', 'v']);
  await app.waitUntil(`return document.querySelectorAll('${body} .citation').length === 2`, 6000, 'the citation pasted').catch(() => {});
  const twice = await cited();
  check(
    'pasted into a text here, what was copied is the citation again',
    JSON.stringify(twice) === '["(Nagy 1979, 45)","(Nagy 1979, 45)"]',
    twice.join(' | '),
  );
  await app.screenshot('copying-4-pasted');

  // Words copied with a citation are copied as they were: as Org, the citation by its key.
  await app.keys(['Control', 'a']);
  await app.keys(['Control', 'c']);
  held = await copied(/cite:/);
  check(
    'words copied with their citations are copied as before, as Org',
    /^As was said \[cite:@nagy1979[^\]]*45\] and more\./.test(held.text),
    short(held.text),
  );
  await sleep(1500);
  const later = await clip();
  check('and nothing writes over them afterwards', later.text === held.text, short(later.text));

  // ==== The references of the document, in its pane: in the usual style still ====
  await app.documentPane('references');
  await app.waitFor('.panel [role="option"]', 5000);
  await app.rightClick(await app.findByText('.panel [role="option"]', 'The Best of the Achaeans'));
  await choose('Copy');
  held = await copied(/^Nagy, Gregory\./);
  check(
    'a reference copied in the pane of a document is written in the usual style, not the document’s',
    /^Nagy, Gregory\. The Best of the Achaeans.*1979\.$/.test(held.text),
    short(held.text),
  );
  await app.screenshot('copying-5-document-pane');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('copying-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
