// Verse and texts side by side (ADR 0041): a poem typed as one types any
// text, Shift+Enter for a line and Enter for a stanza, made Verse from the
// kind menu; a speaker before it; Tab indenting one line; the lines
// numbered through the speaker and across the stanza from Line numbering
// from here; Enter on an empty paragraph of verse leaving it for text; a
// line shared by two speakers, the second half set to begin where the first
// ended from the right-click menu, counted until its window says it is not;
// an original and its translation side by side; a script whose parts are
// chosen from the kind menu, Enter keeping the kind; and the preview set
// with them, without remark, the second half beginning past the first.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** The text of the element written in: found by its section once it is made. */
let prose = '.text-view .section .body .prose';

/**
 * The paragraphs of the text, each as its kind and its lines: the label of a
 * run, the numbers and the margin words are widgets in the paragraph, and are
 * taken out before its words are read.
 */
const paragraphs = () =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).map((p) => {
       const c = p.cloneNode(true);
       c.querySelectorAll('.run-line, .line-number, .line-margin').forEach((w) => w.remove());
       c.querySelectorAll('.hard-break').forEach((b) => b.replaceWith('\\n'));
       return { kind: p.getAttribute('data-kind') ?? 'text', lines: c.textContent.split('\\n').map((l) => l.trim()) };
     })`,
    prose,
  );

/** Puts the cursor right after these words in the text, and gives the editor time to take it up. */
async function cursorAfter(words) {
  await app.exec(
    `const walker = document.createTreeWalker(document.querySelector(arguments[0]), NodeFilter.SHOW_TEXT);
     let node;
     while ((node = walker.nextNode())) {
       if (node.parentElement.closest('.run-line, .line-number, .line-margin')) continue;
       const at = node.data.indexOf(arguments[1]);
       if (at < 0) continue;
       const s = getSelection(); s.collapse(node, at + arguments[1].length);
       return;
     }
     throw new Error('no words ' + arguments[1] + ' in the text');`,
    prose,
    words,
  );
  await sleep(200);
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

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Medea');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.keys(['Alt', 'Shift', 'Enter']);
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The prologue');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const body = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('prologue'));
     return s.querySelector('.body');`,
  );
  prose = `.text-view .section[data-section="${await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes(arguments[0])).dataset.section`,
    'prologue',
  )}"] .body .prose`;
  await app.click(body['element-6066-11e4-a52e-4f735466cecf']);
  await app.waitFor(`${prose}[contenteditable="true"]`);
  await sleep(200);

  // --- A poem typed: Shift+Enter for a line, Enter for a stanza ---
  await app.keys('Nurse');
  await app.press('Enter');
  await app.keys('If only the Argo had never flown');
  await app.keys(['Shift', 'Enter']);
  await app.keys('through the dark Clashing Rocks');
  await app.keys(['Shift', 'Enter']);
  await app.keys('to the land of Colchis,');
  await app.press('Enter');
  await app.keys('nor the pine been felled');
  await app.keys(['Shift', 'Enter']);
  await app.keys('in the glens of Pelion.');
  await sleep(200);
  let ps = await paragraphs();
  check(
    'Shift+Enter makes lines within a paragraph, Enter a new paragraph',
    ps.length === 3 && ps.map((p) => p.lines.length).join(',') === '1,3,2' && ps[1].lines[2] === 'to the land of Colchis,',
    JSON.stringify(ps),
  );

  // --- Made Verse from the kind menu: a label, nothing else changes ---
  await app.keys(['Control', 'a']);
  await chooseKind('Verse', true);
  ps = await paragraphs();
  check(
    'the paragraphs are verse, their lines as they were typed',
    ps.length === 3 && ps.every((p) => p.kind === 'line') && ps.map((p) => p.lines.length).join(',') === '1,3,2',
    JSON.stringify(ps),
  );
  check(
    'the editor makes no passages, no lines of their own, no lists',
    !(await app.exists(`${prose} .passage, ${prose} .verse-line, ${prose} blockquote, ${prose} ul, ${prose} ol`)),
  );
  await app.waitForText('.pane-bar [data-paragraph-kind]', 'Verse', 3000);
  const label = await app.exec(
    `const first = document.querySelectorAll(arguments[0] + ' > p[data-run="line"]');
     return { run: first.length, head: document.querySelector(arguments[0] + ' > p[data-run-first] .run-label')?.textContent.trim() ?? null };`,
    prose,
  );
  check('the verse is one run, bracketed and named', label.run === 3 && label.head === 'Verse', JSON.stringify(label));

  // --- The first paragraph is the speaker, chosen from the kinds of the verse ---
  await cursorAfter('Nurse');
  await chooseKind('Speaker');
  ps = await paragraphs();
  check(
    'a paragraph of the verse is made the speaker, and stays in its run',
    ps[0].kind === 'speaker' &&
      (await app.exists(`${prose} > p[data-kind="speaker"][data-run="line"][data-run-first]`)),
    ps.map((p) => p.kind).join(' '),
  );

  // --- Tab indents the line the cursor is in, by itself ---
  await cursorAfter('through the dark Clashing Rocks');
  await app.press('Tab');
  await sleep(250);
  const indent = await app.exec(
    `const p = document.querySelectorAll(arguments[0] + ' > p')[1];
     return Array.from(p.querySelectorAll('span.linemark')).map((m) => m.getAttribute('data-indent')).join(',') + '|' + (p.getAttribute('data-indent') ?? '');`,
    prose,
  );
  check('Tab indents one line of verse by its mark, not the paragraph', indent === '1|', indent);

  // --- Numbered through the speaker and across the stanza, every 2, from 1 ---
  await cursorAfter('Nurse');
  await app.lineNumberingFromHere();
  await app.waitForText('dialog[open] h2', 'Line numbering from here', 3000);
  await sleep(200);
  const numbering = await app.exec(`return document.querySelector('dialog[open] [data-numbering] select').value`);
  check('the dialog proposes to count the lines', numbering === 'counted', numbering);
  await app.exec(
    `const i = document.querySelector('dialog[open] input[data-number-from], dialog[open] [data-number-from] input'); i.focus(); i.select();`,
  );
  await app.keys('1');
  await app.exec(
    `const i = Array.from(document.querySelectorAll('dialog[open] input')).find((i) => i.placeholder && /5/.test(i.placeholder)); i.focus(); i.select();`,
  );
  await app.keys('2');
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  const numbers = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p span.line-number')).map((w) =>
       w.classList.contains('blank') ? '-' : w.dataset.label + ('given' in w.dataset ? '!' : '')).join(' ')`,
    prose,
  );
  check(
    'every line has its place for a number; the speaker is not counted, the count runs across the stanza',
    numbers === '- 1! 2 - 4 -',
    numbers,
  );
  const ns = await app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).map((p) => (p.getAttribute('data-n') ?? '-') + (p.hasAttribute('data-n-set') ? '!' : '') + ':' + (p.getAttribute('data-numbering') ?? '')).join(' ')`,
    prose,
  );
  // The 1 given does not fall on every second number: the page shows none on that line.
  check('the stretch is numbered on each paragraph', ns === '-:counted -:counted 4:counted', ns);
  check(
    'the bracket says the verse is numbered',
    (await app.exec(`return document.querySelector(arguments[0] + ' > p[data-run-first] .run-label')?.textContent.trim()`, prose)) ===
      'Verse · numbered',
  );
  await app.screenshot('verse-1-lines');

  // --- Enter at the end, then Enter on the empty paragraph of verse, leaves it for text ---
  await cursorAfter('in the glens of Pelion.');
  await app.press('Enter');
  await sleep(150);
  ps = await paragraphs();
  check('Enter makes a new paragraph of verse', ps.length === 4 && ps[3].kind === 'line', ps.map((p) => p.kind).join(' '));
  await app.press('Enter');
  await sleep(200);
  await app.keys('So the nurse begins.');
  await sleep(200);
  ps = await paragraphs();
  check(
    'Enter on an empty paragraph of verse makes it text',
    ps.length === 4 && ps[3].kind === 'text' && ps[3].lines[0] === 'So the nurse begins.' &&
      (await app.count(`${prose} > p[data-run="line"]`)) === 3,
    ps.map((p) => `${p.kind}:${p.lines.join('/')}`).join(' | '),
  );

  // --- A line shared by two speakers: the second half begins where the first ended ---
  await cursorAfter('So the nurse begins.');
  await app.press('Enter');
  await app.keys('Is it you, my sister?');
  await app.press('Enter');
  await app.keys('Ismene');
  await app.press('Enter');
  await app.keys('It is.');
  await app.keys(['Shift', 'Enter']);
  await app.keys('Then speak.');
  await sleep(200);
  await cursorAfter('Is it you, my sister?');
  await chooseKind('Verse', true);
  await cursorAfter('Then speak.');
  await chooseKind('Verse', true);
  await cursorAfter('Ismene');
  await chooseKind('Speaker');
  await cursorAfter('It is.');
  await app.textMenuAtCursor();
  const continues = await app.exec(
    `const item = Array.from(document.querySelectorAll('.menu [role="menuitem"]')).find((i) => i.textContent.includes('Begins where the line before ended'));
     return item ? { checked: !!item.querySelector('.check svg'), off: item.disabled || item.getAttribute('aria-disabled') === 'true' } : null;`,
  );
  check('the right-click menu offers to begin the line where the line before ended', !!continues && !continues.checked && !continues.off, JSON.stringify(continues));
  await app.clickText('.menu [role="menuitem"]', 'Begins where the line before ended');
  await app.waitGone('.menu', 3000);
  await sleep(600);
  /** Where words stand in the text view: the left and right of the first place they are found. */
  const wordsAt = (words) =>
    app.exec(
      `const walker = document.createTreeWalker(document.querySelector(arguments[0]), NodeFilter.SHOW_TEXT);
       let node;
       while ((node = walker.nextNode())) {
         if (node.parentElement.closest('.run-line, .line-number, .line-margin')) continue;
         const at = node.data.indexOf(arguments[1]);
         if (at < 0) continue;
         const r = document.createRange(); r.setStart(node, at); r.setEnd(node, at + arguments[1].length);
         const box = r.getBoundingClientRect();
         return { left: box.left, right: box.right, top: box.top, em: parseFloat(getComputedStyle(node.parentElement.closest('p')).fontSize) };
       }
       return null;`,
      prose,
      words,
    );
  const first = await wordsAt('my sister?');
  const second = await wordsAt('It is.');
  check(
    'the second half of the line begins where the first ended, and an em',
    !!first && !!second && second.top > first.top && Math.abs(second.left - (first.right + first.em)) <= 2,
    JSON.stringify({ first, second }),
  );
  check(
    'its mark says so',
    (await app.exec(`return document.querySelectorAll(arguments[0] + ' > p span.linemark[data-continues]').length`, prose)) === 1,
  );
  // Typing in the line before moves the second half with its end.
  await cursorAfter('my sister?');
  await app.keys(' Speak');
  await sleep(600);
  const longer = await wordsAt('It is.');
  const moved = await wordsAt('sister? Speak');
  check(
    'written on, the line before takes the second half with it',
    !!longer && !!moved && Math.abs(longer.left - (moved.right + moved.em)) <= 2 && longer.left > second.left,
    JSON.stringify({ moved, longer }),
  );
  for (let i = 0; i < ' Speak'.length; i++) await app.press('Backspace');
  await sleep(600);
  const back = await wordsAt('It is.');
  check('and taken back, it stands where it stood', !!back && Math.abs(back.left - second.left) <= 1, JSON.stringify(back));
  // Numbered: the second half is counted until its window says otherwise.
  await cursorAfter('Is it you, my sister?');
  await app.lineNumberingFromHere();
  await app.waitForText('dialog[open] h2', 'Line numbering from here', 3000);
  await app.exec(
    `const s = document.querySelector('dialog[open] [data-numbering] select'); s.value = 'counted';
     s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(150);
  await app.exec(`const i = document.querySelector('dialog[open] input[data-every]'); i.focus(); i.select();`);
  await app.keys('1');
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  const sharedNumbers = () =>
    app.exec(
      `return Array.from(document.querySelectorAll(arguments[0] + ' > p')).slice(-3).map((p) =>
         Array.from(p.querySelectorAll('span.line-number')).map((w) => w.classList.contains('blank') ? '-' : w.dataset.label).join(' ')).join(' | ')`,
      prose,
    );
  check('the second half is counted as any line is', (await sharedNumbers()) === '1 | - | 2 3', await sharedNumbers());
  await cursorAfter('It is.');
  await app.numberingOfThisLine();
  await app.waitForText('dialog[open] h2', 'Numbering of this line', 3000);
  await app.click('dialog[open] input[data-counted]');
  await sleep(100);
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  check(
    'said not to be counted in its window, it is passed over, and the next line counts on',
    (await sharedNumbers()) === '1 | - | - 2',
    await sharedNumbers(),
  );
  check(
    'and it still begins where the line before ended',
    (await app.exec(`return document.querySelectorAll(arguments[0] + ' > p span.linemark[data-continues][data-uncounted]').length`, prose)) === 1,
  );
  await app.screenshot('verse-1b-shared');
  // Out of the verse again, for what follows.
  await cursorAfter('Then speak.');
  await app.press('Enter');
  await app.press('Enter');
  await sleep(200);

  // --- Two texts side by side ---
  await app.click('.pane-bar [data-insert]');
  await app.waitFor('.menu');
  await app.clickText('.menu [role="menuitem"]', 'Two texts side by side');
  await sleep(300);
  await app.keys('Εἴθ᾽ ὤφελ᾽ Ἀργοῦς');
  await app.press('Tab');
  await app.keys('If only the Argo');
  await sleep(200);
  const sides = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .parallel .parallel-side')).map((s) => s.textContent.trim())`,
  );
  check(
    'the two sides are written, Tab going across',
    sides.length === 2 && sides[0].startsWith('Εἴθ') && sides[1] === 'If only the Argo',
    sides.join(' | '),
  );
  await app.screenshot('verse-2-parallel');

  // --- A script: each part chosen from the kind menu, Enter keeping the kind ---
  await app.exec(
    `const ps = Array.from(document.querySelectorAll(arguments[0] + ' > p')); const l = ps[ps.length - 1]; const s = getSelection(); s.selectAllChildren(l); s.collapseToEnd();`,
    prose,
  );
  await sleep(150);
  await app.press('Enter');
  await sleep(150);
  // The parts of a script are not in hand until one is used: under More….
  await chooseKind('Scene heading', true);
  await app.keys('Int. Palace – night');
  await app.press('Enter');
  await sleep(150);
  const kept = await app.exec(`return Array.from(document.querySelectorAll(arguments[0] + ' > p')).pop().getAttribute('data-kind')`, prose);
  check('Enter after a scene heading makes another of the same kind', kept === 'scene', String(kept));
  // In a script, its parts are in hand at the head of the menu.
  await chooseKind('Action');
  await app.keys('Medea paces.');
  await app.press('Enter');
  await chooseKind('Character');
  await app.keys('Nurse');
  await app.press('Enter');
  await chooseKind('Dialogue');
  await app.keys('If only the Argo had never flown.');
  await sleep(200);
  ps = await paragraphs();
  const script = ps
    .filter((p) => ['scene', 'action', 'character', 'dialogue'].includes(p.kind))
    .map((p) => `${p.kind}:${p.lines.join('/')}`)
    .join(' | ');
  check(
    'a scene heading, an action, a character and its dialogue',
    script === 'scene:Int. Palace – night | action:Medea paces. | character:Nurse | dialogue:If only the Argo had never flown.',
    script,
  );
  await app.waitForText('.pane-bar [data-paragraph-kind]', 'Dialogue', 3000);
  await app.screenshot('verse-2b-script');

  // --- The preview sets them ---
  await app.typeset();
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  check('the preview is made without remark', !(await app.exists('.preview footer .issues')));
  await app.screenshot('verse-3-preview');
  const onPage = await app.exec(
    `const spans = Array.from(document.querySelectorAll('.preview .page .texts span'));
     const first = spans.find((s) => s.textContent.includes('my sister?'));
     const second = spans.find((s) => s.textContent.includes('It is.'));
     if (!first || !second) return { first: !!first, second: !!second };
     const a = first.getBoundingClientRect(), b = second.getBoundingClientRect();
     return { end: Math.round(a.right), begin: Math.round(b.left), below: b.top > a.top };`,
  );
  check(
    'on the page the second half of the shared line begins to the right of where the first ended',
    onPage.below && onPage.begin > onPage.end,
    JSON.stringify(onPage),
  );

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('verse-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
