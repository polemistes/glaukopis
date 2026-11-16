// A paragraph made an element, in the text (record 0108). Alt+Enter with the
// cursor in a paragraph, wherever in it, makes the whole paragraph the name
// of a new element after this one, the paragraphs below it the new element's
// text, the paragraphs above staying; with words selected, the words are the
// name, what stood before them stays, and what stood after them in the
// paragraph begins the new text. Alt+Shift+Enter puts the new element under
// the one the cursor is in. Enter and then Alt+Enter make an empty element and
// leave no empty line behind. A paragraph with a bold word, which a name
// cannot hold, is the first paragraph of the new element's text, and a message
// says why. The entry of the right-click menu says what it does, with and
// without words selected. Ctrl+Z takes each step back whole.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();

  const FIRST = 'Sing, goddess, the wrath.';
  const SECOND = 'Of Achilles, son of Peleus.';
  const THIRD = 'That brought woes.';
  const BOOK = [FIRST, SECOND, THIRD];
  const MARKED = 'The wrath of achilles.';

  /** The sections of the text, by name and depth. */
  const sections = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) =>
         (s.querySelector('.heading .title')?.textContent ?? '').trim() + ':' + (s.className.match(/level-(\\d)/) || [])[1])`,
    );
  /** The section of an element, by its name, scrolled into view. */
  const section = (name) =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === arguments[0]) ?? null;
       s?.scrollIntoView({ block: 'center' });
       return s;`,
      name,
    );
  /** The paragraphs of an element's text, each as its words, the empty ones left out. */
  const paragraphs = (name) =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === arguments[0]);
       const body = s?.querySelector('[data-part="body"] .ProseMirror');
       return body ? Array.from(body.children).map((p) => p.textContent.trim()).filter((t) => t) : [];`,
      name,
    );
  /** How many paragraphs an element's text has, the empty ones too. */
  const lines = (name) =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => (s.querySelector('.heading .title')?.textContent ?? '').trim() === arguments[0]);
       return s?.querySelector('[data-part="body"] .ProseMirror')?.children.length ?? 0;`,
      name,
    );
  /** Where the cursor is: in which element, which part, how far in. */
  const where = () =>
    app.exec(
      `const a = document.activeElement;
       const s = a?.closest?.('[data-section]');
       return {
         section: s ? (s.querySelector('.heading .title')?.textContent ?? '').trim() : null,
         part: a?.closest?.('[data-part]')?.dataset.part ?? null,
         offset: getSelection()?.anchorOffset ?? null,
       };`,
    );
  const toasts = () =>
    app.exec(`return Array.from(document.querySelectorAll('.toaster .toast')).map((t) => t.textContent.trim())`);
  /** Puts the cursor in the name of an element, at its end. */
  const intoName = async (name) => {
    const s = await section(name);
    await app.click(await app.exec(`return arguments[0].querySelector('.heading .title')`, s));
    await sleep(250);
    await app.press('End');
    await sleep(100);
  };
  /** Puts the cursor in a paragraph of an element's text, at its start, and on by so many letters, or at its end. */
  const intoParagraph = async (name, words, right = 0, end = false) => {
    const s = await section(name);
    const p = await app.exec(
      `return Array.from(arguments[0].querySelectorAll('[data-part="body"] .ProseMirror > *')).find((p) => p.textContent.trim().startsWith(arguments[1])) ?? null`,
      s,
      words,
    );
    if (!p) throw new Error(`no paragraph “${words}” in ${name}`);
    await app.click(p);
    await sleep(200);
    await app.press(end ? 'End' : 'Home');
    for (let i = 0; i < right; i++) await app.press('ArrowRight');
    await sleep(100);
  };
  /** Selects so many letters from the cursor on, to the right. */
  const select = async (letters) => {
    for (let i = 0; i < letters; i++) await app.keys(['Shift', 'ArrowRight']);
    await sleep(100);
  };
  /** The state the cases begin from, and are taken back to. */
  const base = ['Paragraphs:0', 'Book:1', 'Marked:1'];
  const back = async (what) => {
    await app.keys(['Control', 'z']);
    await sleep(500);
    const list = await sections();
    const book = await paragraphs('Book');
    check(
      `Ctrl+Z takes ${what} back in one step`,
      JSON.stringify(list) === JSON.stringify(base) && JSON.stringify(book) === JSON.stringify(BOOK),
      `${list.join(' | ')} / ${book.join(' | ')}`,
    );
  };

  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Paragraphs');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(700);

  // ==== A text of three paragraphs, and an element after it with a bold word in its text ====
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('Book');
  await app.press('Enter');
  await sleep(250);
  await app.keys(FIRST);
  await app.press('Enter');
  await app.keys(SECOND);
  await app.press('Enter');
  await app.keys(THIRD);
  await sleep(300);
  await intoName('Book');
  await app.keys(['Alt', 'Enter']);
  await sleep(400);
  await app.keys('Marked');
  await app.press('Enter');
  await sleep(250);
  await app.keys('The ');
  await app.keys(['Control', 'b']);
  await app.keys('wrath');
  await app.keys(['Control', 'b']);
  await app.keys(' of achilles.');
  await sleep(300);
  check(
    'a text of three paragraphs, and an element after it with a bold word',
    JSON.stringify(await sections()) === JSON.stringify(base) &&
      JSON.stringify(await paragraphs('Book')) === JSON.stringify(BOOK) &&
      JSON.stringify(await paragraphs('Marked')) === JSON.stringify([MARKED]),
    `${(await sections()).join(' | ')} / ${(await paragraphs('Book')).join(' | ')} / ${(await paragraphs('Marked')).join(' | ')}`,
  );
  await app.screenshot('paragraph-element-1-text');

  // ==== The cursor anywhere in a paragraph: the whole paragraph is the name ====
  for (const [place, right, end] of [
    ['at its start', 0, false],
    ['in its middle', 6, false],
    ['at its very end', 0, true],
  ]) {
    await intoParagraph('Book', 'Of Achilles', right, end);
    await app.keys(['Alt', 'Enter']);
    await sleep(600);
    const list = await sections();
    const at = await where();
    check(
      `Alt+Enter with the cursor ${place} in a paragraph makes the whole paragraph the name of a new element after this one`,
      JSON.stringify(list) === JSON.stringify(['Paragraphs:0', 'Book:1', `${SECOND}:1`, 'Marked:1']),
      list.join(' | '),
    );
    check(
      `${place}: the paragraph below is its text, and the paragraph above stays`,
      JSON.stringify(await paragraphs(SECOND)) === JSON.stringify([THIRD]) &&
        JSON.stringify(await paragraphs('Book')) === JSON.stringify([FIRST]),
      `${(await paragraphs(SECOND)).join(' | ')} / ${(await paragraphs('Book')).join(' | ')}`,
    );
    check(
      `${place}: the cursor is at the end of the new name`,
      at.section === SECOND && at.part === 'title' && at.offset === SECOND.length,
      JSON.stringify(at),
    );
    if (place === 'in its middle') await app.screenshot('paragraph-element-2-paragraph');
    await back(`the paragraph made an element, the cursor ${place},`);
  }

  // ==== Words selected: the words are the name ====
  await intoParagraph('Book', 'Of Achilles', 'Of Achilles, '.length);
  await select('son of'.length);
  await app.keys(['Alt', 'Enter']);
  await sleep(600);
  let list = await sections();
  let at = await where();
  check(
    'with words selected, Alt+Enter makes them the name of a new element after this one',
    JSON.stringify(list) === JSON.stringify(['Paragraphs:0', 'Book:1', 'son of:1', 'Marked:1']),
    list.join(' | '),
  );
  check(
    'what stood before them stays, without the space at its end',
    JSON.stringify(await paragraphs('Book')) === JSON.stringify([FIRST, 'Of Achilles,']),
    (await paragraphs('Book')).join(' | '),
  );
  check(
    'what stood after them in the paragraph is the first paragraph of the new text, the paragraphs below it after',
    JSON.stringify(await paragraphs('son of')) === JSON.stringify(['Peleus.', THIRD]),
    (await paragraphs('son of')).join(' | '),
  );
  check(
    'the cursor is at the end of the new name',
    at.section === 'son of' && at.part === 'title' && at.offset === 'son of'.length,
    JSON.stringify(at),
  );
  await app.screenshot('paragraph-element-3-selection');
  await back('the selection made an element');

  // ==== Alt+Shift+Enter: the new element under this one ====
  await intoParagraph('Book', 'Of Achilles', 6);
  await app.keys(['Alt', 'Shift', 'Enter']);
  await sleep(600);
  list = await sections();
  check(
    'Alt+Shift+Enter makes the paragraph the name of an element under this one, the first',
    JSON.stringify(list) === JSON.stringify(['Paragraphs:0', 'Book:1', `${SECOND}:2`, 'Marked:1']) &&
      JSON.stringify(await paragraphs(SECOND)) === JSON.stringify([THIRD]),
    list.join(' | '),
  );
  await back('the paragraph made an element under it');

  // ==== The entry of the menu says what it does ====
  await intoParagraph('Book', 'Of Achilles', 6);
  await app.textMenuAtCursor();
  let items = await app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check(
    'the menu of the text says Make the paragraph an element, and no longer Split here',
    items.some((t) => t.startsWith('Make the paragraph an element')) &&
      !items.some((t) => t.includes('Split here') || t.includes('Make the selection')),
    JSON.stringify(items),
  );
  await app.screenshot('paragraph-element-4-menu');
  await app.clickText('.menu [role="menuitem"]', 'Make the paragraph an element');
  await sleep(600);
  list = await sections();
  check(
    'and chosen, it makes the paragraph an element',
    JSON.stringify(list) === JSON.stringify(['Paragraphs:0', 'Book:1', `${SECOND}:1`, 'Marked:1']) &&
      JSON.stringify(await paragraphs(SECOND)) === JSON.stringify([THIRD]),
    list.join(' | '),
  );
  await back('what the menu made');

  await intoParagraph('Book', 'Of Achilles', 'Of Achilles, '.length);
  await select('son of'.length);
  await app.textMenuAtCursor();
  items = await app.exec(
    `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check(
    'with words selected, it says Make the selection an element',
    items.some((t) => t.startsWith('Make the selection an element')) &&
      !items.some((t) => t.includes('Make the paragraph')),
    JSON.stringify(items),
  );
  await app.clickText('.menu [role="menuitem"]', 'Make the selection an element');
  await sleep(600);
  list = await sections();
  check(
    'and chosen, it makes the selection the name of a new element',
    JSON.stringify(list) === JSON.stringify(['Paragraphs:0', 'Book:1', 'son of:1', 'Marked:1']) &&
      JSON.stringify(await paragraphs('son of')) === JSON.stringify(['Peleus.', THIRD]),
    list.join(' | '),
  );
  await back('what the menu made of the selection');

  // ==== A paragraph a name cannot hold is the first paragraph of the new text ====
  await intoParagraph('Marked', 'The wrath', 0, true);
  await app.keys(['Alt', 'Enter']);
  await sleep(600);
  list = await sections();
  at = await where();
  const said = await toasts();
  check(
    'a paragraph with a bold word makes an element after this one with an empty name, the cursor in the name',
    JSON.stringify(list) === JSON.stringify([...base, ':1']) && at.part === 'title' && at.section === '' && at.offset === 0,
    `${list.join(' | ')} ${JSON.stringify(at)}`,
  );
  const kept = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section'))[3];
     const body = s?.querySelector('[data-part="body"] .ProseMirror');
     return body ? { paragraphs: Array.from(body.children).map((p) => p.textContent.trim()), bold: body.querySelectorAll('strong').length } : null;`,
  );
  check(
    'and the paragraph, the bold word in it, is the first of its text',
    kept?.paragraphs.length === 1 && kept.paragraphs[0] === MARKED && kept.bold === 1,
    JSON.stringify(kept),
  );
  check(
    'a message says why',
    said.some((t) => t.includes('holds what a name cannot')),
    JSON.stringify(said),
  );
  check(
    'and nothing of it is left where it was',
    (await paragraphs('Marked')).length === 0,
    JSON.stringify(await paragraphs('Marked')),
  );
  await app.screenshot('paragraph-element-5-kept');
  await app.keys(['Control', 'z']);
  await sleep(500);
  check(
    'Ctrl+Z takes it back in one step',
    JSON.stringify(await sections()) === JSON.stringify(base) &&
      JSON.stringify(await paragraphs('Marked')) === JSON.stringify([MARKED]),
    `${(await sections()).join(' | ')} / ${(await paragraphs('Marked')).join(' | ')}`,
  );

  // ==== Enter and then Alt+Enter: an empty element, and no empty line behind it ====
  await intoParagraph('Book', 'That brought', 0, true);
  await app.press('Enter');
  await sleep(150);
  check('the empty line is there before', (await lines('Book')) === 4, String(await lines('Book')));
  await app.keys(['Alt', 'Enter']);
  await sleep(600);
  list = await sections();
  at = await where();
  check(
    'in the empty line, Alt+Enter makes an element with an empty name after this one, the cursor in its name',
    JSON.stringify(list) === JSON.stringify(['Paragraphs:0', 'Book:1', ':1', 'Marked:1']) &&
      at.part === 'title' &&
      at.section === '' &&
      at.offset === 0,
    `${list.join(' | ')} ${JSON.stringify(at)}`,
  );
  check(
    'and no empty line is left behind, nor any word taken from the text',
    (await lines('Book')) === 3 && JSON.stringify(await paragraphs('Book')) === JSON.stringify(BOOK),
    `${await lines('Book')} / ${(await paragraphs('Book')).join(' | ')}`,
  );
  await app.screenshot('paragraph-element-6-empty');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('paragraph-element-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
