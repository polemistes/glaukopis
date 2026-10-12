// The language of a passage: a word given German from Words › Language,
// a Greek word given Ancient Greek by its tag in "Other language…", and two
// paragraphs given German at once. Each is a span with its language and its
// name on hover, and the menu checks the language of the passage the
// cursor is in. Spelling checks the German by a German dictionary, and
// leaves the Greek alone, which has none, where the English dictionary had
// underlined them all; the text drawn without an editor does the same. The
// preview is made without remark, and the Typst it was set from carries the
// languages; so does a document made as Word by the command of export, which
// is asked here, as the dialog that asks where to save cannot be answered.

import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** How WebDriver names an element that is returned from the page. */
const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf';

// The writer's own dictionaries: the English ones kept in the repository,
// and a small German one made here, which knows the German words below
// but one.
const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-'));
const dictionaries = join(dataDir, 'dictionaries');
mkdirSync(dictionaries, { recursive: true });
for (const name of ['en_US', 'en_GB']) {
  for (const ending of ['aff', 'dic']) {
    copyFileSync(
      join(root, 'packaging/languages/dictionaries', `${name}.${ending}`),
      join(dictionaries, `${name}.${ending}`),
    );
  }
}
const GERMAN = ['Weltschmerz', 'Sehnsucht', 'Absatz', 'Deutsch', 'die', 'der', 'ist', 'groß', 'und', 'tief', 'ein', 'zweiter', 'auf'];
writeFileSync(join(dictionaries, 'de_DE.aff'), 'SET UTF-8\nTRY esianrtolcdugmphbyfvkwzESIANRTOLCDUGMPHBYFVKWZ\n');
writeFileSync(join(dictionaries, 'de_DE.dic'), `${GERMAN.length}\n${GERMAN.join('\n')}\n`);

const app = await App.launch({ width: 1360, height: 900, dataDir });

async function until(what, fn, ms = 10000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
}

/** The misspelt words underlined in the text, in order. */
const underlined = (within = '.text-view') =>
  app.exec(
    `return Array.from(document.querySelectorAll(arguments[0] + ' .misspelt')).map((e) => e.textContent)`,
    within,
  );

/** Clicks the item of the menus open that reads exactly so. */
async function choose(label) {
  const item = await until(`the item “${label}”`, () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).find((e) => e.textContent.replace(/\\s+/g, ' ').trim().startsWith(arguments[0])) || null`,
      label,
    ),
  );
  await app.click(item[ELEMENT]);
  await sleep(250);
}

/** Opens Words › Language over the text. */
async function languageMenu() {
  await app.click('.pane-bar .tools .words');
  await app.waitFor('.menu');
  await sleep(150);
  await choose('Language');
}

/** Selects text, from where these words first stand to where those end. */
async function select(from, to = from) {
  await app.exec(
    `const [from, to] = arguments;
     // The text in one, as its nodes are parted by the spans of spelling and of marks.
     const walker = document.createTreeWalker(document.querySelector('.text-view .body .ProseMirror'), NodeFilter.SHOW_TEXT);
     const nodes = [];
     let all = '';
     for (let n = walker.nextNode(); n; n = walker.nextNode()) {
       nodes.push([n, all.length]);
       all += n.data;
     }
     const at = (i, end) => {
       for (let k = nodes.length - 1; k >= 0; k--) {
         const [n, begins] = nodes[k];
         if (i > begins || (i === begins && !end)) return [n, i - begins];
       }
       return [nodes[0][0], 0];
     };
     const a = all.indexOf(from);
     const b = a < 0 ? -1 : all.indexOf(to, a);
     if (a < 0 || b < 0) throw new Error('no ' + from + ' … ' + to + ' in the text');
     const start = at(a, false);
     const end = at(b + to.length, true);
     const range = document.createRange();
     range.setStart(...start);
     range.setEnd(...end);
     const s = getSelection(); s.removeAllRanges(); s.addRange(range);`,
    from,
    to,
  );
  await sleep(200);
}

/**
 * The passages with a language, as [language, text, name]: the spans of a
 * paragraph that follow one another with the same language are one.
 */
const passages = (within = '.text-view .body .ProseMirror') =>
  app.exec(
    `const out = [];
     for (const p of document.querySelectorAll(arguments[0] + ' p')) {
       let last = null;
       for (const span of p.querySelectorAll('span.lang')) {
         const lang = span.getAttribute('lang');
         const next = last && last.span.nextSibling === span && last.lang === lang;
         if (next) out[out.length - 1][1] += span.textContent;
         else out.push([lang, span.textContent, span.getAttribute('title')]);
         last = { span, lang };
       }
     }
     return out;`,
    within,
  );

try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Longing');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(400);
  await app.click('.text-view .section .body');
  await app.waitFor('.text-view .section .body .prose[contenteditable="true"]');
  await sleep(300);

  // --- Three paragraphs, the last two in German ---
  await app.keys('He felt Weltschmerz and spoke of ἀρετή, which is a mistaek.');
  await app.press('Enter');
  await app.keys('Die Sehnsucht ist groß und der Weltschmertz ist tief.');
  await app.press('Enter');
  await app.keys('Ein zweiter Absatz auf Deutsch.');
  await sleep(300);
  const before = await until('the words to be underlined in English', async () => {
    const words = await underlined();
    return words.includes('mistaek') && words.includes('Sehnsucht') ? words : null;
  });
  check(
    'in English, the German is underlined',
    ['Weltschmerz', 'Sehnsucht', 'Absatz'].every((w) => before.includes(w)),
    before.join(' '),
  );
  await app.screenshot('language-1-english');

  // --- A word is given German ---
  await select('Weltschmerz');
  await languageMenu();
  await app.screenshot('language-2-menu');
  await choose('German');
  let found = await passages();
  check(
    'a word given German is a span with the language and its name',
    found.length === 1 && found[0][0] === 'de' && found[0][1] === 'Weltschmerz' && found[0][2] === 'German',
    JSON.stringify(found),
  );
  check(
    'the Words button tells that the words have something of it',
    await app.exec(`return document.querySelector('.pane-bar .tools .words').classList.contains('on')`),
  );

  // --- A Greek word given Ancient Greek by its tag ---
  await select('ἀρετή');
  await languageMenu();
  await choose('Other language…');
  await app.waitFor('dialog[open] input[data-language-tag]', 3000);
  await sleep(200);
  await app.type('dialog[open] input[data-language-tag]', 'grc');
  await sleep(200);
  const named = await app.exec(
    `return document.querySelector('dialog[open] .field .message')?.textContent.trim() ?? ''`,
  );
  check('the dialog names the language of the tag', named === 'Ancient Greek', named);
  check(
    'and offers languages scholars quote, by name',
    await app.exec(
      `const b = document.querySelector('dialog[open] [data-suggested="hbo"]'); return !!b && b.textContent.includes('Biblical Hebrew')`,
    ),
  );
  await app.screenshot('language-3-other');
  await app.clickText('dialog[open] footer button', 'Apply');
  await app.waitGone('dialog[open]', 3000);
  await sleep(300);
  found = await passages();
  check(
    'the Greek word is in Ancient Greek',
    found.some(([lang, text]) => lang === 'grc' && text === 'ἀρετή'),
    JSON.stringify(found),
  );

  // --- Two paragraphs given German at once ---
  await select('Die Sehnsucht', 'auf Deutsch.');
  await languageMenu();
  await choose('German');
  found = await passages();
  check(
    'a selection over two paragraphs gives each its language, whole',
    found.some(([l, t]) => l === 'de' && t === 'Die Sehnsucht ist groß und der Weltschmertz ist tief.') &&
      found.some(([l, t]) => l === 'de' && t === 'Ein zweiter Absatz auf Deutsch.'),
    JSON.stringify(found),
  );

  // --- The menu checks the language the cursor is in ---
  await select('zweiter');
  await languageMenu();
  const checked = await app.exec(
    `const menus = Array.from(document.querySelectorAll('.menu'));
     const last = menus[menus.length - 1];
     return Array.from(last.querySelectorAll('[role="menuitem"]')).filter((e) => e.querySelector('.check svg')).map((e) => e.textContent.trim());`,
  );
  check('the menu checks German in a German paragraph', checked.length === 1 && checked[0].startsWith('German'), JSON.stringify(checked));
  await app.press('Escape');
  await app.press('Escape');
  await sleep(200);

  // --- Spelling follows the languages ---
  const after = await until('the German to be checked in German', async () => {
    const words = await underlined();
    return !words.includes('Sehnsucht') && words.includes('Weltschmertz') ? words : null;
  }).catch(async () => underlined());
  check(
    'spelling checks German by the German dictionary, leaves Greek alone, and English as before',
    after.join(' ') === 'mistaek Weltschmertz',
    after.join(' '),
  );
  await app.screenshot('language-4-spelling');

  // --- The same in the text drawn without an editor: opened anew, it is drawn until it is clicked ---
  await app.keys(['Control', '1']);
  await sleep(300);
  await app.clickText('.card', 'Longing');
  await app.waitFor('.diagram .node.root, .text-view .section', 8000);
  if (!(await app.exists('.text-view .section'))) await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section .body .static', 8000);
  const drawn = await until('the text drawn without an editor', async () => {
    const has = await app.exec(`return document.querySelectorAll('.text-view .static span.lang').length`);
    const words = await underlined('.text-view .static');
    return has && words.includes('mistaek') ? { has, words } : null;
  }, 15000).catch(() => null);
  check(
    'drawn without an editor, the passages have their language, and are checked in it',
    !!drawn && drawn.has >= 3 && drawn.words.join(' ') === 'mistaek Weltschmertz',
    JSON.stringify(drawn),
  );
  await app.screenshot('language-5-drawn');

  // --- The preview, set by Typst from the project, and a document made as Word ---
  await app.keys(['Control', 'p']);
  const opened = await app.waitFor('.preview', 3000).then(
    () => true,
    () => false,
  );
  if (!opened) await app.click('header button[aria-label="Preview and export"]');
  await app.waitFor('.preview .page', 30000);
  await sleep(1500);
  check('the preview is made without remark', !(await app.exists('.preview footer .issues')));
  await app.screenshot('language-6-preview');
  // What the preview was set from is kept in the working folder of the data.
  const typ = execFileSync('find', [dataDir, '-name', 'document.typ'], { encoding: 'utf8' }).trim().split('\n')[0];
  const typst = typ ? readFileSync(typ, 'utf8') : '';
  check(
    'the Typst of the preview has the language of each passage',
    typst.includes('#text(lang: "de")[Weltschmerz]') &&
      typst.includes('#text(lang: "grc")[ἀρετή]') &&
      typst.includes('#text(lang: "de")[Ein zweiter Absatz auf Deutsch.]'),
    typst.slice(typst.indexOf('Weltschmerz') - 300, typst.indexOf('Weltschmerz') + 500),
  );

  // The dialog that asks where to save cannot be answered here: Word is made by the command behind it.
  const out = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-out-'));
  const made = await app.execAsync(
    `const invoke = window.__TAURI_INTERNALS__.invoke;
     const format = await invoke('formats_get', { id: 'manuscript' });
     const t = (text, marks = {}) => ({ kind: 'text', text, marks });
     const document = {
       title: [t('Longing')], authors: [], keywords: [], references: [], language: 'en-US',
       sections: [{ level: 1, heading: [t('Longing')], element: null, blocks: [
         { kind: 'paragraph', content: [t('He felt '), t('Weltschmerz', { lang: { tag: 'de' } }), t(' and spoke of '),
           t('ἀρετή', { kind: { name: 'foreign', lang: 'el' }, lang: { tag: 'grc' } }), t('.')] },
         { kind: 'paragraph', content: [t('Ein zweiter Absatz auf Deutsch.', { lang: { tag: 'de' } })] },
       ] }],
     };
     const request = { document, style: 'chicago-author-date', format, key: 'language' };
     return await invoke('document_export', { request, target: 'docx', path: arguments[0], options: {} });`,
    join(out, 'longing.docx'),
  ).catch((e) => ({ error: String(e.message ?? e) }));
  check('a document is made as Word', !made.error, JSON.stringify(made).slice(0, 300));
  if (!made.error) {
    const xml = execFileSync('unzip', ['-p', join(out, 'longing.docx'), 'word/document.xml'], {
      encoding: 'utf8',
    });
    const run = (word) => {
      const at = xml.indexOf(word);
      return at < 0 ? '' : xml.slice(xml.lastIndexOf('<w:r>', at), at);
    };
    check(
      'Word has the language of each passage, that of the passage before that of foreign words',
      run('Weltschmerz').includes('<w:lang w:val="de"') &&
        run('ἀρετή').includes('<w:lang w:val="grc"') &&
        !run('ἀρετή').includes('w:val="el"') &&
        run('Ein zweiter Absatz').includes('<w:lang w:val="de"'),
      ['Weltschmerz', 'ἀρετή', 'Ein zweiter'].map(run).join(' ‖ ').slice(0, 600),
    );
  }
  rmSync(out, { recursive: true, force: true });

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('language-of-passage-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
  rmSync(dataDir, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
