// The bracket of a run, measured: its segments, one beside each paragraph,
// are to stand in one line, outside the numbers where the run is numbered
// at the left. Three cases. Six paragraphs of prose, the third and the
// fourth numbered: the bracket of text follows the numbered stretch, so
// that those two have it and no others. A verse of four lines with a
// speaker between, numbered, and a fifth line added after it with Enter:
// one offset for all its segments. And a verse of three paragraphs of which
// the last two are numbered: the bracket stands outside the numbers along
// the whole run, the paragraph that is not numbered too.
//
// The window of the numbers is opened from the right-click menu of the
// text, by either of its names (it is being split in two), and set to
// count from the first number given; nothing else of it is touched.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** The text of the element written in: found by its section once it is made. */
let prose = '.text-view .section .body .prose';

/** The words of the text in a paragraph, without the widgets of the bracket, the numbers and the margin. */
const TEXT_NODES = `(p) => {
  const out = [];
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode()))
    if (!node.parentElement.closest('.run-line, .line-number, .line-margin')) out.push(node);
  return out;
}`;

/** Puts the cursor at the end of the paragraph of that index, and gives the editor time to take it up. */
async function toEndOf(i) {
  await app.exec(
    `const nodes = (${TEXT_NODES})(document.querySelectorAll(arguments[0] + ' > p')[arguments[1]]);
     const last = nodes[nodes.length - 1];
     getSelection().collapse(last, last.data.length);`,
    prose,
    i,
  );
  await sleep(200);
}

/** Selects the paragraphs from the one of index `from` to the one of index `to`, their words whole. */
async function selectParagraphs(from, to) {
  await app.exec(
    `const ps = document.querySelectorAll(arguments[0] + ' > p');
     const first = (${TEXT_NODES})(ps[arguments[1]])[0];
     const lasts = (${TEXT_NODES})(ps[arguments[2]]);
     const last = lasts[lasts.length - 1];
     getSelection().setBaseAndExtent(first, 0, last, last.data.length);`,
    prose,
    from,
    to,
  );
  await sleep(250);
}

/** Opens the kind menu and chooses a kind; under More… where it is not in hand. */
async function chooseKind(name, more = false) {
  await app.click('.pane-bar [data-paragraph-kind]');
  await app.waitFor('.menu', 3000);
  await sleep(150);
  if (more) {
    await app.clickText('[role="menuitem"]', 'More…');
    await sleep(200);
  }
  await app.exec(
    `const item = Array.from(document.querySelectorAll('.menu [role="menuitem"], .menu [role="menuitemradio"], .menu [role="menuitemcheckbox"]'))
       .filter((i) => i.offsetParent !== null)
       .reverse()
       .find((i) => (i.querySelector('.label > .truncate') ?? i).textContent.replace(/\\s+/g, ' ').trim() === arguments[0]);
     if (!item) throw new Error('no kind ' + arguments[0] + ' in the menu');
     item.click();`,
    name,
  );
  await sleep(300);
}

/**
 * Numbers the lines of what is selected, or of what the cursor is in, from
 * the right-click menu of the text: counted from the first number given,
 * the rest as the window proposes.
 */
async function numberHere() {
  const at = await app.exec(
    `const s = getSelection();
     const range = s.getRangeAt(0);
     const r = range.getClientRects()[0] ?? range.getBoundingClientRect();
     return { x: Math.round(r.left + 2), y: Math.round((r.top + r.bottom) / 2) };`,
  );
  await app.exec(
    `const x = arguments[0], y = arguments[1];
     const common = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, screenX: x, screenY: y, view: window };
     const send = (event) => document.elementFromPoint(x, y)?.dispatchEvent(event);
     send(new PointerEvent('pointerdown', { ...common, button: 2, buttons: 2, pointerType: 'mouse', isPrimary: true }));
     send(new MouseEvent('mousedown', { ...common, button: 2, buttons: 2 }));
     send(new MouseEvent('contextmenu', { ...common, button: 2, buttons: 2 }));
     send(new PointerEvent('pointerup', { ...common, button: 2, buttons: 0, pointerType: 'mouse', isPrimary: true }));
     send(new MouseEvent('mouseup', { ...common, button: 2, buttons: 0 }));`,
    at.x,
    at.y,
  );
  await app.waitFor('.menu', 3000);
  await sleep(150);
  await app.exec(
    `const names = ['Line numbering from here…', 'Number these lines…'];
     const item = Array.from(document.querySelectorAll('.menu [role="menuitem"]'))
       .find((i) => names.includes((i.querySelector('.label > .truncate') ?? i).textContent.replace(/\\s+/g, ' ').trim()));
     if (!item) throw new Error('no item for the numbering of lines in the menu of the text');
     item.click();`,
  );
  await app.waitFor('dialog[open]', 3000);
  await sleep(200);
  await app.exec(
    `const s = Array.from(document.querySelectorAll('dialog[open] select')).find((s) => Array.from(s.options).some((o) => o.value === 'counted'));
     s.value = 'counted';
     s.dispatchEvent(new Event('input', { bubbles: true }));
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(150);
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(400);
}

/**
 * Every paragraph of the text as it is drawn: its words' beginning, the run
 * it is marked with, and where its segment of a bracket and its first number
 * stand, in pixels from the left edge of the text; nothing where it has none.
 */
const drawn = () =>
  app.exec(
    `const root = document.querySelector(arguments[0]);
     const edge = root.getBoundingClientRect().left;
     const at = (el) => (el ? Math.round((el.getBoundingClientRect().left - edge) * 10) / 10 : null);
     return Array.from(root.querySelectorAll(':scope > p')).map((p) => ({
       words: (${TEXT_NODES})(p).map((n) => n.data).join('').slice(0, 18),
       kind: p.getAttribute('data-kind') ?? 'text',
       run: p.getAttribute('data-run'),
       first: p.hasAttribute('data-run-first'),
       numbers: p.getAttribute('data-numbers'),
       line: at(p.querySelector(':scope > .run-line')),
       number: at(p.querySelector('.line-number:not(.blank)')),
     }));`,
    prose,
  );

/** The offsets of the segments of these paragraphs, as one line for the log. */
const offsets = (ps) => ps.map((p) => (p.line === null ? '-' : p.line)).join(' ');

/** Whether the segments of these paragraphs stand within a pixel of each other. */
const straight = (ps) => {
  const lines = ps.map((p) => p.line);
  return lines.every((l) => l !== null) && Math.max(...lines) - Math.min(...lines) <= 1;
};

/** The labels of the brackets, in their order. */
const labels = () =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p[data-run-first] .run-label')).map((l) => l.textContent.trim())`,
    prose,
  );

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Brackets');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.keys(['Alt', 'Shift', 'Enter']);
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The measures');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const body = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('measures'));
     return s.querySelector('.body');`,
  );
  const section = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('measures')).dataset.section`,
  );
  prose = `.text-view .section[data-section="${section}"] .body .prose`;
  await app.click(body);
  await app.waitFor(`${prose}[contenteditable="true"]`);
  await sleep(200);

  // --- Six paragraphs of prose, the third and the fourth numbered ---
  const prosaic = [
    'The first paragraph of prose.',
    'The second paragraph of prose.',
    'The third paragraph, numbered.',
    'The fourth paragraph, numbered.',
    'The fifth paragraph of prose.',
    'The sixth paragraph of prose.',
  ];
  for (const [i, words] of prosaic.entries()) {
    if (i) await app.press('Enter');
    await app.keys(words);
  }
  await sleep(200);
  await selectParagraphs(2, 3);
  await numberHere();
  let ps = await drawn();
  const text = ps.slice(0, 6);
  console.log(`prose: segments at ${offsets(text)}; numbers at ${text.map((p) => p.number ?? '-').join(' ')}`);
  check(
    'the third and fourth of six paragraphs of prose are numbered',
    text.map((p) => (p.numbers ? '#' : '-')).join('') === '--##--',
    text.map((p) => p.numbers ?? '-').join(' '),
  );
  check(
    'the bracket of the text follows the numbered stretch: the two numbered paragraphs have it, the others not',
    text.map((p) => (p.line === null ? '-' : '|')).join('') === '--||--' &&
      text.map((p) => p.run ?? '-').join(' ') === '- - text text - -' &&
      text[2].first &&
      !text[3].first,
    `${offsets(text)}; ${text.map((p) => p.run ?? '-').join(' ')}`,
  );
  check('its label says it is numbered text', (await labels()).join(' | ') === 'Text · numbered', (await labels()).join(' | '));
  check(
    'its two segments stand in one line, outside the numbers',
    straight(text.slice(2, 4)) && text.slice(2, 4).every((p) => p.number !== null && p.line < p.number),
    `${offsets(text.slice(2, 4))}; numbers at ${text.slice(2, 4).map((p) => p.number).join(' ')}`,
  );
  await app.screenshot('brackets-1-prose');

  // --- A verse of four lines with a speaker between, numbered, and a fifth line added after with Enter ---
  await toEndOf(5);
  await app.press('Enter');
  await app.keys('Strophe, the first line,');
  await app.keys(['Shift', 'Enter']);
  await app.keys('the second line of it;');
  await app.press('Enter');
  await app.keys('Chorus');
  await app.press('Enter');
  await app.keys('the third line, after the speaker,');
  await app.keys(['Shift', 'Enter']);
  await app.keys('and the fourth line.');
  await sleep(200);
  await selectParagraphs(6, 8);
  await chooseKind('Verse', true);
  await toEndOf(7);
  await chooseKind('Speaker');
  await toEndOf(6);
  await numberHere();
  await toEndOf(8);
  await app.press('Enter');
  await app.keys('A fifth line, added after.');
  await sleep(400);
  ps = await drawn();
  const verse = ps.slice(6, 10);
  console.log(`verse: segments at ${offsets(verse)}; numbers at ${verse.map((p) => p.number ?? '-').join(' ')}`);
  check(
    'the verse with its speaker and the line added after is one run, numbered',
    verse.map((p) => `${p.kind}@${p.run}${p.numbers ? '#' : ''}`).join(' ') === 'line@line# speaker@line# line@line# line@line#',
    verse.map((p) => `${p.kind}@${p.run}${p.numbers ? '#' : ''}`).join(' '),
  );
  check(
    'every segment of its bracket stands in one line, outside the numbers',
    straight(verse) && verse.every((p) => p.number === null || p.line < p.number),
    `${offsets(verse)}; numbers at ${verse.map((p) => p.number ?? '-').join(' ')}`,
  );
  check('it stands where the bracket of the numbered prose stands', straight([verse[0], text[2]]), `${verse[0].line} and ${text[2].line}`);
  await app.screenshot('brackets-2-verse');

  // --- A verse of three paragraphs, its last two numbered ---
  await toEndOf(9);
  await app.press('Enter');
  await app.press('Enter');
  await sleep(200);
  await app.keys('Prose between the two verses.');
  const antistrophe = ['Antistrophe, the first line,', 'the second line, numbered,', 'the third line, numbered.'];
  for (const words of antistrophe) {
    await app.press('Enter');
    await app.keys(words);
  }
  await sleep(200);
  await selectParagraphs(11, 13);
  await chooseKind('Verse', true);
  await selectParagraphs(12, 13);
  await numberHere();
  ps = await drawn();
  const between = ps[10];
  const second = ps.slice(11, 14);
  console.log(`second verse: segments at ${offsets(second)}; numbers at ${second.map((p) => p.number ?? '-').join(' ')}`);
  check(
    'the prose between the two verses is not numbered and has no bracket',
    between.kind === 'text' && !between.numbers && between.line === null,
    JSON.stringify(between),
  );
  check(
    'the second verse is one run, its last two paragraphs numbered',
    second.map((p) => `${p.run}${p.numbers ? '#' : ''}`).join(' ') === 'line line# line#' && second[0].first,
    second.map((p) => `${p.run}${p.numbers ? '#' : ''}`).join(' '),
  );
  check(
    'its bracket stands outside the numbers along the whole run, beside the paragraph that is not numbered too',
    straight(second) && straight([second[0], verse[0]]) && second.every((p) => p.number === null || p.line < p.number),
    `${offsets(second)}; the first verse at ${verse[0].line}`,
  );
  await app.screenshot('brackets-3-partly-numbered');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('brackets-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
