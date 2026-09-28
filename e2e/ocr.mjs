// Text read from PDFs and pictures by Tesseract (ADR 0018): a scanned PDF
// and a picture brought into a project as maps, a reading stopped, a PDF
// attached to a reference made searchable, the text of a picture of the
// store, and Tesseract in the settings.
//
// The files are made here with Typst: pages of text drawn as pictures, and
// PDFs whose only content is those pictures, as scans are. The file chooser
// of the system is answered by the script, in the page.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 8000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(150);
  }
}

function installed(program, args) {
  try {
    return execFileSync(program, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return null;
  }
}

const langs = installed('tesseract', ['--list-langs']);
if (!installed('typst', ['--version']) || !langs || !/^eng$/m.test(langs)) {
  console.log('Typst, or Tesseract with English, is not installed: nothing is tried.');
  process.exit(0);
}

// ---- the files ----
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-ocr-'));
const typst = (name, source, ppi) => {
  writeFileSync(join(desk, `${name}.typ`), source);
  const out = join(desk, name);
  execFileSync('typst', ['compile', `${name}.typ`, name, ...(ppi ? ['--ppi', String(ppi)] : [])], { cwd: desk });
  return out;
};
const PAGE = (text) =>
  `#set page(width: 150mm, height: 100mm, margin: 14mm)\n#set text(size: 12pt)\n${text}\n`;
typst(
  'one.png',
  PAGE(
    'The wrath of Achilles is the subject of the Iliad. Homer sings of the quar-\\\nrel between the king and the hero, and of all that came of it.\n\nMany a brave soul it sent down to Hades.',
  ),
  200,
);
typst(
  'two.png',
  PAGE('The oral theory of Milman Parry changed the field. Albert Lord went on with the work.'),
  200,
);
const scanOf = (name, pictures, title) =>
  typst(
    name,
    `${title ? `#set document(title: "${title}")\n` : ''}#set page(width: 150mm, height: 100mm, margin: 0pt)\n` +
      pictures.map((p) => `#image("${p}", width: 100%, height: 100%)`).join('\n#pagebreak()\n') +
      '\n',
  );
const scan = scanOf('wrath.pdf', ['one.png', 'two.png'], 'The Wrath of Achilles');
const long = scanOf('long.pdf', Array.from({ length: 12 }, (_, i) => (i % 2 ? 'two.png' : 'one.png')));
const forLibrary = scanOf('nagy.pdf', ['two.png', 'one.png']);
const picture = join(desk, 'one.png');

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const invoke = (command, args = {}) =>
    app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
  // The file chooser of the system answers with what the script puts here.
  await app.exec(
    `const real = window.__TAURI_INTERNALS__.invoke;
     window.__chosen = null;
     window.__TAURI_INTERNALS__.invoke = (command, args, options) =>
       command === 'plugin:dialog|open' && window.__chosen
         ? Promise.resolve(window.__chosen)
         : real(command, args, options);`,
  );
  const choose = (path) => app.exec(`window.__chosen = arguments[0];`, path);
  const tabs = () =>
    app.exec(`return Array.from(document.querySelectorAll('.tabs .tab .name')).map((e) => e.textContent.trim())`);
  const facts = () =>
    app.exec(
      `const out = {};
       for (const e of document.querySelectorAll('dialog [data-fact]'))
         out[e.dataset.fact] = (e.querySelector('dd') || e).textContent.trim();
       return out;`,
    );
  const remarks = () =>
    app.exec(`return Array.from(document.querySelectorAll('dialog .remarks li')).map((e) => e.textContent.trim())`);
  const chips = () =>
    app.exec(`return Array.from(document.querySelectorAll('dialog [data-languages] .chip')).map((e) => e.dataset.language)`);
  const sections = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => ({
         level: (s.className.match(/level-(\\d)/) || [])[1],
         name: (s.querySelector('.heading .prose.title') || {}).textContent?.trim(),
         text: (s.querySelector('.prose.body') || {}).textContent?.replace(/\\s+/g, ' ').trim() ?? '',
       }))`,
    );
  const work = join(app.dataDir, 'work');
  const leftOver = () => (existsSync(work) ? readdirSync(work).filter((n) => n.startsWith('ocr-')) : []);

  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await invoke('import_apply', { plan: await invoke('import_bib_text', { text: bib }) });

  // ---- a scanned PDF becomes a map ----
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Homer');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);

  await choose(scan);
  await app.click('.tabs button[aria-label="A map from a document…"]');
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  await sleep(300);
  const about = await app.text('dialog [data-ocr="asking"] .about');
  check('a scan is looked at, and said to be read from pictures of its pages', /None of the 2 pages has text/.test(about), about);
  check('it is to be read in the language of the text, English', JSON.stringify(await chips()) === '["eng"]', JSON.stringify(await chips()));
  check('in words, not by the name Tesseract has for it', (await app.text('dialog [data-languages] .chip')).trim() === 'English');
  await app.screenshot('ocr-1-asking');
  await app.click('dialog [data-ocr-read]');
  await app.waitFor('dialog [data-fact="words"]', 60000);
  await sleep(300);
  const counted = await facts();
  check('it is read: a part for each page', counted.parts === '2' && Number(counted.words) > 40, JSON.stringify(counted));
  const title = await app.exec(`return document.querySelector('dialog input').value`);
  check('its title is the one the file gives itself', title === 'The Wrath of Achilles', title);
  const subtitle = await app.exec(`return document.querySelector('dialog').textContent`);
  check('it is said to be a PDF', /wrath\.pdf · PDF/.test(subtitle));
  const told = await remarks();
  check('what was done is said', told.includes('2 pages were read from pictures of them.'), told.join(' ‖ '));
  await app.screenshot('ocr-2-read');
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitGone('dialog[open]', 15000);
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);
  check('the map is made, named after the document', JSON.stringify(await tabs()) === '["Homer","The Wrath of Achilles"]', JSON.stringify(await tabs()));
  const read = await sections();
  check(
    'its elements are the pages, named by their numbers',
    JSON.stringify(read.map((s) => `${s.level} ${s.name}`)) === JSON.stringify(['0 The Wrath of Achilles', '1 1', '1 2']),
    JSON.stringify(read.map((s) => `${s.level} ${s.name}`)),
  );
  check(
    'with the text of each page, a word broken at the end of a line whole again',
    /The wrath of Achilles is the subject of the Iliad\. Homer sings of the quarrel between the king/.test(read[1]?.text ?? '') &&
      /Milman Parry/.test(read[2]?.text ?? ''),
    `${read[1]?.text} ‖ ${read[2]?.text}`,
  );
  check('its paragraphs as they were', (await app.exec(`return document.querySelectorAll('.text-view .section.level-1')[0].querySelectorAll('.prose.body p').length`)) === 2);
  await app.screenshot('ocr-3-map');

  // ---- a picture becomes a map ----
  await choose(picture);
  await app.click('.tabs button[aria-label="A map from a document…"]');
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  check('a picture is to be read as it is', /The text is read from the picture/.test(await app.text('dialog [data-ocr="asking"] .about')));
  await app.click('dialog [data-ocr-read]');
  await app.waitFor('dialog [data-fact="words"]', 60000);
  await sleep(200);
  check('the picture is read', /one\.png · Picture/.test(await app.exec(`return document.querySelector('dialog').textContent`)) && (await facts()).parts === '0');
  await app.clickText('dialog footer button', 'Make the map');
  await app.waitGone('dialog[open]', 15000);
  await sleep(600);
  const fromPicture = await sections();
  check(
    'and its text is the text of the centre of its map',
    fromPicture.length === 1 && fromPicture[0].name === 'one' && /Many a brave soul/.test(fromPicture[0].text),
    JSON.stringify(fromPicture),
  );

  // ---- a reading stopped ----
  await choose(long);
  await app.click('.tabs button[aria-label="A map from a document…"]');
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  await app.click('dialog [data-ocr-read]');
  const shown = await until(
    'the pages to be shown as they are read',
    () => app.exec(`const d = document.querySelector('dialog [data-ocr="reading"] .doing'); return d && /of 12 pages read/.test(d.textContent) ? d.textContent.trim() : null`),
    60000,
  );
  check('the pages are shown as they are read', /^\d+ of 12 pages read$/.test(shown), shown);
  await app.screenshot('ocr-4-reading');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);
  await sleep(1500);
  check('cancelled, no map is made', (await tabs()).length === 3, JSON.stringify(await tabs()));
  check('and what was made on the way is gone', leftOver().length === 0, leftOver().join(', '));

  // ---- a PDF of the library made searchable ----
  await app.go('#/library');
  await app.waitFor('.list .item', 8000);
  await app.click(await app.findByText('.list .item', 'The Singer of Tales'));
  await app.waitFor('.pane [data-field="title"] textarea', 5000);
  const entries = await invoke('library_list');
  const singer = entries.entries.find((e) => /Singer of Tales/.test(e.title));
  await invoke('attachment_add', { id: singer.id, paths: [forLibrary] });
  // The pane shows what the library has now.
  await app.click(await app.findByText('.list .item', 'The Best of the Achaeans'));
  await sleep(300);
  await app.click(await app.findByText('.list .item', 'The Singer of Tales'));
  await app.waitFor('.pane [data-searchable]', 5000);
  const before = (await invoke('library_get', { id: singer.id })).files[0];
  await app.click('.pane [data-searchable]');
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  const aboutPdf = await app.text('dialog [data-ocr="asking"] .about');
  check('a PDF of the library is looked at before it is made searchable', /2 of the 2 pages have no text/.test(aboutPdf), aboutPdf);
  await app.screenshot('ocr-5-searchable');
  await app.click('dialog [data-ocr-make]');
  await app.waitGone('dialog[open]', 90000);
  await sleep(500);
  const toast = await app.exec(`return document.querySelector('.toasts, .toaster, [role="status"]')?.textContent ?? ''`);
  check('it is said to be searchable', /The PDF is searchable: 2 pages were read/.test(toast), toast);
  const after = (await invoke('library_get', { id: singer.id })).files[0];
  check('the reference points to another file, under the same name', after.path !== before.path && after.name === before.name, `${before.path} → ${after.path}`);
  const stored = join(app.dataDir, 'library', after.path);
  check('which is larger by the text', statSync(stored).size > before.size, `${before.size} → ${statSync(stored).size}`);
  check('and the scan is gone from the store', !existsSync(join(app.dataDir, 'library', before.path)));
  const again = await invoke('ocr_look', { path: after.path, stored: true });
  check('its pages have text now', again.pages === 2 && again.withText === 2, JSON.stringify(again));
  const text = installed('pdftotext', [stored, '-']);
  if (text !== null) check('and the text can be read out of it', /Milman Parry/.test(text) && /wrath of Achilles/.test(text), text.slice(0, 120));
  check('the file of the reference is shown, and can be made searchable again', await app.exists('.pane [data-searchable]'));

  // ---- the text of a picture of the store ----
  const taken = await invoke('picture_add_file', { path: picture });
  await app.keys(['Control', '3']);
  await app.waitFor('.pictures', 5000);
  await sleep(500);
  await app.click(`.pictures [data-hash="${taken.hash}"]`);
  await app.waitFor('.picture-pane [data-ocr-picture]', 5000);
  await app.click('.picture-pane [data-ocr-picture]');
  await app.waitFor('dialog [data-ocr="asking"]', 5000);
  await app.click('dialog [data-ocr-read]');
  await app.waitFor('dialog [data-ocr-text]', 60000);
  const pictureText = await app.text('dialog [data-ocr-text]');
  check('a picture of the store has its text read, and shown', /Homer sings of the quarrel/.test(pictureText), pictureText.slice(0, 100));
  check('outside a project, it can be copied but not made a map of', (await app.exists('dialog [data-ocr-map]')) === false);
  await app.screenshot('ocr-6-picture');
  await app.clickText('dialog footer button', 'Close');
  await app.waitGone('dialog[open]', 5000);

  // ---- Tesseract in the settings ----
  await app.go('#/settings');
  await app.waitFor('[data-program="tesseract"] .version', 8000);
  const card = await app.text('[data-program="tesseract"]');
  check('the settings say where Tesseract is, and its version', /Tesseract\s*\d/.test(card) && /tesseract/.test(card), card.slice(0, 120));
  check('and the languages it reads', /It reads .*English/.test(card), card);
  await app.exec(
    `const s = document.querySelector('[data-program="tesseract"] select.add');
     s.value = 'grc';
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(800);
  const kept = await invoke('settings_load');
  check('a language to read in at first is kept', JSON.stringify(kept.ocrLanguages) === '["grc"]', JSON.stringify(kept.ocrLanguages));
  await app.screenshot('ocr-7-settings');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
