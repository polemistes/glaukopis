// Kinds of paragraph and of words, as labels (ADR 0041): a paragraph made
// an epigraph from the kind menu; Enter after it making another epigraph,
// which is made the attribution from the kinds of its run; Enter on an
// empty paragraph of a kind making it text; a headword and, after Enter,
// its gloss; a word underlined with Ctrl+U, one marked as a term and one as
// a speaker from Words; a kind of the writer's own, made from "Make a
// kind…" and given to the paragraph at once, its run named by it; and the
// preview set with them all, without remark.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** The ids of the kinds that come with the application: a kind of one's own has another. */
const CATALOGUE = [
  'text',
  'quote',
  'epigraph',
  'attribution',
  'line',
  'speaker',
  'direction',
  'scene',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
  'headword',
  'gloss',
  'item',
  'numbered',
  'code',
  'break',
  'draft',
  'foreign',
  'title',
  'term',
  'mention',
  'highlight',
];

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Letters from the island');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click('.diagram .node.root');
  await app.keys(['Alt', 'Shift', 'Enter']);
  await app.waitFor('.diagram .node.renaming .prose', 3000);
  await sleep(120);
  await app.keys('The first letter');
  await app.press('Enter');
  await app.waitGone('.diagram .node.renaming', 3000);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section', 5000);
  await sleep(400);
  const body = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading').textContent.includes('first letter'));
     return s.querySelector('.body');`,
  );
  await app.click(body['element-6066-11e4-a52e-4f735466cecf']);
  await app.waitFor('.text-view .section .body .prose[contenteditable="true"]');
  await sleep(200);

  // ---- helpers ----

  /** Puts the cursor at the end of the paragraph of the text that holds these words. */
  const cursorAtEnd = async (words) => {
    await app.exec(
      `const p = ${paragraphsJs}.find((e) => e.words.includes(arguments[0]))?.p;
       if (!p) throw new Error('no paragraph holding ' + arguments[0]);
       const s = getSelection(); s.selectAllChildren(p); s.collapseToEnd();`,
      words,
    );
    await sleep(150);
  };

  /** Selects a word of the text, where it first stands. */
  const selectWord = async (word) => {
    await app.exec(
      `const word = arguments[0];
       const walker = document.createTreeWalker(document.querySelector('.text-view'), NodeFilter.SHOW_TEXT);
       let node;
       while ((node = walker.nextNode())) {
         const at = node.data.indexOf(word);
         if (at < 0) continue;
         const range = document.createRange();
         range.setStart(node, at);
         range.setEnd(node, at + word.length);
         const s = getSelection(); s.removeAllRanges(); s.addRange(range);
         return;
       }
       throw new Error('no word ' + word + ' in the text');`,
      word,
    );
    await sleep(150);
  };

  /** The paragraphs of the text, without the widgets of the bracket and the numbers. */
  const paragraphsJs = `Array.from(document.querySelectorAll('.text-view .body .prose > p')).map((p) => {
       const c = p.cloneNode(true);
       c.querySelectorAll('.run-line, .line-number, .line-margin').forEach((w) => w.remove());
       return { p, words: c.textContent.trim() };
     })`;

  /** The kind of the paragraph that holds these words, with the run it is seen in: "epigraph@epigraph", "text@" where it is in none. */
  const kindOf = (words) =>
    app.exec(
      `const found = ${paragraphsJs}.find((e) => e.words.includes(arguments[0]));
       if (!found) return null;
       return (found.p.getAttribute('data-kind') ?? 'text') + '@' + (found.p.getAttribute('data-run') ?? '');`,
      words,
    );

  /** The kinds of the paragraphs of the letter, in their order. */
  const kinds = () =>
    app.exec(
      `return ${paragraphsJs}.filter((e) => e.p.closest('.section').querySelector('.heading').textContent.includes('first letter')).map((e) => (e.p.getAttribute('data-kind') ?? 'text') + ':' + e.words).join(' | ')`,
    );

  /** Whether the kind button over the text comes to read so. */
  const buttonReads = async (word) => {
    try {
      await app.waitForText('.pane-bar .tools .style', word, 3000);
      return true;
    } catch {
      return false;
    }
  };

  /** Opens the kind menu over the text and chooses a kind: at its head where the run has it in hand, else under More…. */
  const chooseKind = async (name) => {
    await app.click('.pane-bar .tools .style');
    await app.waitFor('.menu');
    await sleep(150);
    const pick = () =>
      app.exec(
        `const item = Array.from(document.querySelectorAll('.menu [role="menuitem"]'))
           .filter((i) => i.offsetParent !== null)
           .reverse()
           .find((i) => (i.querySelector('.label > .truncate') ?? i).textContent.replace(/\\s+/g, ' ').trim() === arguments[0]);
         if (!item) return false;
         item.click();
         return true;`,
        name,
      );
    if (!(await pick())) {
      await app.clickText('.menu [role="menuitem"]', 'More…');
      await sleep(250);
      if (!(await pick())) throw new Error('no kind ' + name + ' in the menu');
    }
    await sleep(300);
  };

  // --- A few paragraphs ---
  await app.keys('There is no frigate like a book.');
  await app.press('Enter');
  await app.keys('The sea was calm that morning, and the boats went out.');
  await app.press('Enter');
  await app.keys('Dear reader, I write to you from the island.');
  await sleep(200);
  const written = await app.exec(`return ${paragraphsJs}.filter((e) => e.words).length`);
  check('three paragraphs are written', written === 3, String(written));

  // --- The first is made an epigraph, from More… in the kind menu ---
  await cursorAtEnd('frigate');
  await chooseKind('Epigraph');
  const epigraph = await kindOf('frigate');
  check('the paragraph is an epigraph, seen as a run of its kind', epigraph === 'epigraph@epigraph', String(epigraph));
  check('the kind button reads Epigraph', await buttonReads('Epigraph'));
  await app.screenshot('kinds-1-epigraph');

  // --- Enter at its end makes another epigraph, which is made the attribution ---
  await cursorAtEnd('frigate');
  await app.press('Enter');
  await sleep(200);
  await app.keys('Emily Dickinson');
  await sleep(200);
  check('Enter keeps the kind: the new paragraph is an epigraph', (await kindOf('Emily Dickinson')) === 'epigraph@epigraph', await kindOf('Emily Dickinson'));
  await chooseKind('Attribution');
  const attribution = await kindOf('Emily Dickinson');
  check('it is made the attribution from the kind menu', attribution === 'attribution@attribution', String(attribution));
  const order = await app.exec(
    `const all = ${paragraphsJs};
     const i = all.findIndex((e) => e.words.includes('frigate'));
     return all[i + 1]?.words ?? null;`,
  );
  check('and it stands under the epigraph', order === 'Emily Dickinson', String(order));
  check('the kind button reads Attribution', await buttonReads('Attribution'));

  // --- Enter, and Enter on the empty attribution, makes it text ---
  await cursorAtEnd('Dickinson');
  await app.press('Enter');
  await sleep(150);
  const empty = await app.exec(
    `const all = ${paragraphsJs};
     const i = all.findIndex((e) => e.words.includes('Dickinson'));
     return all[i + 1] ? (all[i + 1].p.getAttribute('data-kind') ?? 'text') + ':' + all[i + 1].words : null;`,
  );
  await app.press('Enter');
  await sleep(200);
  const left = await app.exec(
    `const all = ${paragraphsJs};
     const i = all.findIndex((e) => e.words.includes('Dickinson'));
     return all[i + 1] ? (all[i + 1].p.getAttribute('data-kind') ?? 'text') + ':' + all[i + 1].words + ':' + (all[i + 2]?.words ?? '') : null;`,
  );
  check(
    'Enter on an empty paragraph of a kind makes it text, and makes no new one',
    empty === 'attribution:' && left === 'text::The sea was calm that morning, and the boats went out.',
    `${empty} → ${left}`,
  );

  // --- A headword, and after Enter its gloss ---
  await app.keys('Argo');
  await sleep(100);
  await chooseKind('Headword');
  const headword = await kindOf('Argo');
  check('a paragraph is made a headword', headword === 'headword@headword', String(headword));
  await cursorAtEnd('Argo');
  await app.press('Enter');
  await sleep(200);
  check(
    'Enter after a headword makes a headword',
    (await app.exec(`const all = ${paragraphsJs}; const i = all.findIndex((e) => e.words === 'Argo'); return all[i + 1]?.p.getAttribute('data-kind') ?? null;`)) === 'headword',
  );
  await chooseKind('Gloss');
  await app.keys('The ship in which Jason sailed.');
  await sleep(200);
  const gloss = await kindOf('Jason');
  check('it is made the gloss from the kinds of its run', gloss === 'gloss@gloss', String(gloss));
  check('the kind button reads Gloss', await buttonReads('Gloss'));
  check(
    'the kinds stand in the order they were written',
    (await kinds()) ===
      'epigraph:There is no frigate like a book. | attribution:Emily Dickinson | headword:Argo | gloss:The ship in which Jason sailed. | text:The sea was calm that morning, and the boats went out. | text:Dear reader, I write to you from the island.',
    await kinds(),
  );
  await app.screenshot('kinds-2-glossary');

  // --- A word underlined with Ctrl+U, and one marked as a term from Words ---
  await selectWord('calm');
  await app.keys(['Control', 'u']);
  await sleep(200);
  const underlined = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .body u')).map((u) => u.textContent).join('|')`,
  );
  check('Ctrl+U underlines the word', underlined === 'calm', underlined);
  await selectWord('morning');
  await app.click('.pane-bar .tools .words');
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'Term');
  await sleep(300);
  const term = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .body span.kind[data-kind="term"]')).map((s) => s.textContent).join('|')`,
  );
  check('a word is marked as a term from Words', term === 'morning', term);
  await selectWord('Dear');
  await app.click('.pane-bar .tools .words');
  await app.waitFor('.menu');
  await sleep(150);
  check(
    'the Words menu lists a speaker and a stage direction after the kinds of words',
    await app.exec(
      `const words = Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((i) => (i.querySelector('.label > .truncate') ?? i).textContent.trim());
       const term = words.indexOf('Term'), speaker = words.indexOf('Speaker'), direction = words.indexOf('Stage direction');
       return term >= 0 && speaker > term && direction > speaker;`,
    ),
  );
  await app.clickText('.menu [role="menuitem"]', 'Speaker');
  await sleep(300);
  const speaker = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .body span.kind[data-kind="speaker"]')).map((s) => s.textContent + ':' + getComputedStyle(s).fontVariantCaps).join('|')`,
  );
  check('a word within a line is marked a speaker from Words, in small capitals as a speaker is', speaker === 'Dear:small-caps', speaker);
  await app.screenshot('kinds-3-words');

  // --- A kind of one's own, made from the menu and given at once ---
  await cursorAtEnd('Dear reader');
  await app.click('.pane-bar .tools .style');
  await app.waitFor('.menu');
  await sleep(150);
  await app.clickText('.menu [role="menuitem"]', 'More…');
  await sleep(250);
  await app.clickText('.menu [role="menuitem"]', 'Make a kind…');
  await app.waitForText('dialog[open]', 'A kind of your own', 3000);
  await sleep(300);
  await app.exec(`const i = document.querySelector('dialog[open] input'); i.focus(); i.select();`);
  await app.keys('Letter');
  await app.exec(
    `const selects = Array.from(document.querySelectorAll('dialog[open] select'));
     for (const s of selects) {
       const o = Array.from(s.options).find((o) => o.value === 'epigraph' || o.textContent.trim() === 'Epigraph');
       if (!o) continue;
       s.value = o.value;
       s.dispatchEvent(new Event('input', { bubbles: true }));
       s.dispatchEvent(new Event('change', { bubbles: true }));
       return;
     }
     throw new Error('no Epigraph to base the kind on: ' + selects.map((s) => Array.from(s.options).map((o) => o.value).join(',')).join(' / '));`,
  );
  await sleep(150);
  await app.clickText('dialog[open] button', 'Create');
  await app.waitGone('dialog[open]', 3000);
  await sleep(400);
  const own = await app.exec(
    `const p = ${paragraphsJs}.find((e) => e.words.includes('Dear reader'))?.p;
     return p ? p.getAttribute('data-kind') : null;`,
  );
  check(
    'the paragraph is of a kind of its own, not of the catalogue',
    !!own && !CATALOGUE.includes(own),
    String(own),
  );
  check('the kind button reads Letter', await buttonReads('Letter'));
  const ownRun = await app.exec(
    `const found = ${paragraphsJs}.find((e) => e.words.includes('Dear reader'));
     return found.p.getAttribute('data-run') === found.p.getAttribute('data-kind') && found.p.querySelector('.run-label')?.textContent.trim();`,
  );
  check('its run is named by it', ownRun === 'Letter', String(ownRun));
  await app.screenshot('kinds-4-own-kind');

  // --- The preview sets them all ---
  await app.keys(['Control', 'p']);
  const opened = await app.waitFor('.preview', 3000).then(
    () => true,
    () => false,
  );
  if (!opened) await app.click('header button[aria-label="Preview and export"]');
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  check('the preview is made without remark', !(await app.exists('.preview footer .issues')));
  await app.screenshot('kinds-5-preview');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('kinds-of-passage-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
