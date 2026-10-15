// Text read from PDFs and pictures by Tesseract (ADR 0018): a scanned PDF
// and a picture brought into a project as trees under the element in view
// (ADR 0037), a reading stopped, a PDF
// attached to a reference made searchable (with how it is read changed, and
// the text it has taken away), a map from a PDF of the library, the text of a
// picture of the store, and Tesseract in the settings.
//
// The files are made here with Typst: pages of text drawn as pictures, and
// PDFs whose only content is those pictures, as scans are. The file chooser
// of the system is answered by the script, in the page.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
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
  execFileSync('typst', ['compile', `${name}.typ`, name, ...(ppi ? ['--ppi', String(ppi)] : [])], {
    cwd: desk,
  });
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
const long = scanOf(
  'long.pdf',
  Array.from({ length: 12 }, (_, i) => (i % 2 ? 'two.png' : 'one.png')),
);
const forLibrary = scanOf('nagy.pdf', ['two.png', 'one.png']);
const picture = join(desk, 'one.png');
// A PDF with text of its own, as one made from a written document is.
const written = typst(
  'written.pdf',
  PAGE(
    'The wrath of Achilles is the subject of the Iliad. Homer sings of the quarrel between the king and the hero, and of all that came of it.',
  ),
);
// A PDF whose text is Greek as an old font keeps it: Latin letters and signs, which do not read as text.
const betaCode = typst(
  'beta.pdf',
  PAGE(
    '#"Mh=nin a)/eide qea\\\\ Phlhi+a/dew *)Axilh=os ou)lome/nhn, h(\\\\ muri/\' *)Axaioi=s a)/lge\' e)/qhke, polla\\\\s d\' i)fqi/mous yuxa\\\\s *)/Ai+di proi/+ayen h(rw/wn, au)tou\\\\s de\\\\ e(lw/ria teu=xe ku/nessin oi)wnoi=si/ te pa=si"',
  ),
);
// Greek read in the encoding of Western Europe: text that does not read as text, in no scheme.
const junk = typst(
  'junk.pdf',
  PAGE(
    'ÌÞíéí ¢åéäå èåÜ Ðçëçúáäåù ¢÷éëÞïò ïõëïìÝíçí, ç ìõñß¢ ¢÷áéïÿò Üëãå¢ Ýèçêå, ðïëëÜò ä¢ éöèßìïõò øõ÷Üò ¢Ûúäé ðñïÚáøåí çñþùí, áõôïýò äÝ åëþñéá ôåý÷å êýíåóóéí',
  ),
);
// Greek kept by the names of its glyphs, as the Oxford Aristophanes keeps it (written by the core's tests).
const porson = join(root, 'e2e', 'fixtures', 'porson.pdf');

const app = await App.launch({ width: 1360, height: 900 });
try {
  await app.installErrorHook();
  const invoke = (command, args = {}) =>
    app.execAsync(
      `return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`,
      command,
      args,
    );
  // Files are dropped as the window tells of files dropped from the desktop.
  const drop = (paths, x, y) =>
    app.execAsync(
      `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
       const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
       await emit('tauri://drag-enter', { paths: arguments[0], position });
       await emit('tauri://drag-over', { position });
       await emit('tauri://drag-drop', { paths: arguments[0], position });`,
      paths,
      x,
      y,
    );
  const middleOf = (selector) =>
    app.exec(
      `const r = document.querySelector(arguments[0]).getBoundingClientRect();
       return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
      selector,
    );
  /** Drops a file on the tabs of the maps, where it becomes a map of its own. */
  const dropOnTabs = async (path) => {
    const at = await middleOf('.pane-bar .maps');
    await drop([path], at.x, at.y);
  };
  const tabs = () => app.mapNames();
  const facts = () =>
    app.exec(
      `const out = {};
       for (const e of document.querySelectorAll('dialog [data-fact]'))
         out[e.dataset.fact] = (e.querySelector('dd') || e).textContent.trim();
       return out;`,
    );
  const remarks = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('dialog .remarks li')).map((e) => e.textContent.trim())`,
    );
  const chips = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('dialog [data-languages] .chip')).map((e) => e.dataset.language)`,
    );
  /** Waits for the text view to read the element of this name as its document. */
  const inView = (name) =>
    app.waitUntil(
      `return document.querySelector('.text-view .section.level-0 .heading .prose.title')?.textContent.trim() === ${JSON.stringify(name)}`,
      8000,
      `${name} in view`,
    );
  const sections = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => ({
         level: (s.className.match(/level-(\\d)/) || [])[1],
         name: (s.querySelector('.heading .prose.title') || {}).textContent?.trim(),
         text: (s.querySelector('.prose.body') || {}).textContent?.replace(/\\s+/g, ' ').trim() ?? '',
       }))`,
    );
  const work = join(app.dataDir, 'work');
  const leftOver = () =>
    existsSync(work) ? readdirSync(work).filter((n) => n.startsWith('ocr-')) : [];

  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await invoke('import_apply', { plan: await invoke('import_bib_text', { text: bib }) });

  // ---- a scanned PDF becomes a project, among the projects ----
  await app.waitForText('h2', 'Welcome to Glaukopis');
  const onProjects = await middleOf('.home');
  await drop([scan], onProjects.x, onProjects.y);
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  check(
    'a scan dropped among the projects is to be read, to be a project of its own',
    /A project from a document/.test(
      await app.exec(`return document.querySelector('dialog').textContent`),
    ),
  );
  await app.click('dialog [data-ocr-read]');
  await app.waitFor('dialog [data-fact="words"]', 60000);
  await sleep(200);
  await app.clickText('dialog footer button', 'Make the project');
  await app.waitFor('.text-view .section', 20000);
  await sleep(500);
  check(
    'the project is made, and the scan is the tree under it',
    JSON.stringify(await tabs()) === '["The Wrath of Achilles"]',
    JSON.stringify(await tabs()),
  );
  await app.keys(['Control', '1']);
  await app.waitFor('.home', 5000);
  await sleep(300);

  // ---- a scanned PDF becomes a tree under the element in view, in a project ----
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Homer');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.clickText('header [role="radio"]', 'Diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);

  await dropOnTabs(scan);
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  await sleep(300);
  const about = await app.text('dialog [data-ocr="asking"] .about');
  check(
    'a scan is looked at, and said to be read from pictures of its pages',
    /None of the 2 pages has text/.test(about),
    about,
  );
  check(
    'it is to be read in the language of the text, English',
    JSON.stringify(await chips()) === '["eng"]',
    JSON.stringify(await chips()),
  );
  check(
    'in words, not by the name Tesseract has for it',
    (await app.text('dialog [data-languages] .chip')).trim() === 'English',
  );
  check('how it is read is closed at first', (await app.exists('dialog [data-ocr-dpi]')) === false);
  await app.click('dialog [data-ocr-how]');
  await app.waitFor('dialog [data-ocr-dpi]', 3000);
  check(
    'opened, it offers the resolution, with 300 chosen',
    await app.exists('dialog [data-ocr-dpi] [role="radio"][aria-label="300"][aria-checked="true"]'),
  );
  await app.click('dialog [data-ocr-dpi] [role="radio"][aria-label="400"]');
  check(
    'and the resolution can be changed',
    await app.exists('dialog [data-ocr-dpi] [role="radio"][aria-label="400"][aria-checked="true"]'),
  );
  await app.screenshot('ocr-1-asking');
  await app.click('dialog [data-ocr-read]');
  await app.waitFor('dialog [data-fact="words"]', 60000);
  await sleep(300);
  const counted = await facts();
  check(
    'it is read: a part for each page',
    counted.parts === '2' && Number(counted.words) > 40,
    JSON.stringify(counted),
  );
  const title = await app.exec(`return document.querySelector('dialog input').value`);
  check('its title is the one the file gives itself', title === 'The Wrath of Achilles', title);
  const subtitle = await app.exec(`return document.querySelector('dialog').textContent`);
  check('it is said to be a PDF', /wrath\.pdf · PDF/.test(subtitle));
  const told = await remarks();
  check(
    'what was done is said',
    told.includes('2 pages read by Tesseract, none taken from the PDF\'s own text, none that could not be read.'),
    told.join(' ‖ '),
  );
  await app.screenshot('ocr-2-read');
  await app.clickText('dialog footer button', 'Bring it in');
  await app.waitGone('dialog[open]', 15000);
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);
  check(
    'a tree is made under the project, named after the document',
    JSON.stringify(await tabs()) === '["The Wrath of Achilles"]',
    JSON.stringify(await tabs()),
  );
  // Entered, it is read as a document of its own.
  await app.openMap('The Wrath of Achilles');
  await inView('The Wrath of Achilles');
  await sleep(300);
  const read = await sections();
  check(
    'its elements are the pages, named by their numbers',
    JSON.stringify(read.map((s) => `${s.level} ${s.name}`)) ===
      JSON.stringify(['0 The Wrath of Achilles', '1 1', '1 2']),
    JSON.stringify(read.map((s) => `${s.level} ${s.name}`)),
  );
  check(
    'with the text of each page, a word broken at the end of a line whole again',
    /The wrath of Achilles is the subject of the Iliad\. Homer sings of the quarrel between the king/.test(
      read[1]?.text ?? '',
    ) && /Milman Parry/.test(read[2]?.text ?? ''),
    `${read[1]?.text} ‖ ${read[2]?.text}`,
  );
  check(
    'its paragraphs as they were',
    (await app.exec(
      `return document.querySelectorAll('.text-view .section.level-1')[0].querySelectorAll('.prose.body p').length`,
    )) === 2,
  );
  await app.screenshot('ocr-3-map');

  // ---- a picture becomes a tree under the project ----
  await app.click('.maps .up');
  await inView('Homer');
  await sleep(300);
  await dropOnTabs(picture);
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  check(
    'a picture is to be read as it is',
    /The text is read from the picture/.test(await app.text('dialog [data-ocr="asking"] .about')),
  );
  await app.click('dialog [data-ocr-read]');
  await app.waitFor('dialog [data-fact="words"]', 60000);
  await sleep(200);
  check(
    'the picture is read',
    /one\.png · Picture/.test(
      await app.exec(`return document.querySelector('dialog').textContent`),
    ) && (await facts()).parts === '0',
  );
  await app.clickText('dialog footer button', 'Bring it in');
  await app.waitGone('dialog[open]', 15000);
  await sleep(600);
  await app.openMap('one');
  await inView('one');
  await sleep(300);
  const fromPicture = await sections();
  check(
    'and its text is the text of the element made of it',
    fromPicture.length === 1 &&
      fromPicture[0].name === 'one' &&
      /Many a brave soul/.test(fromPicture[0].text),
    JSON.stringify(fromPicture),
  );

  // ---- a PDF that has text: taken as it is, or read anew ----
  await app.click('.maps .up');
  await inView('Homer');
  await sleep(300);
  await dropOnTabs(written);
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  const aboutText = await app.text('dialog [data-ocr="asking"] .about');
  check(
    'a PDF that has text is said to be taken as it is',
    /The page has text, which is taken as it is/.test(aboutText),
    aboutText,
  );
  check('no languages are asked for', !(await app.exists('dialog [data-languages]')));
  await app.waitFor('dialog [data-text-preview] [data-text-page]', 10000);
  const previewed = await app.text('dialog [data-text-preview]');
  check('the whole of its text is shown beside', /The wrath of Achilles/.test(previewed), previewed);
  check(
    'and what was found is said',
    /Text on 1 of 1 pages/.test(await app.text('dialog [data-text-found]')),
    await app.text('dialog [data-text-found]'),
  );
  check(
    'and it reads as text, so it is kept at first',
    !(await app.exists('dialog [data-text-poor]')) &&
      (await app.exec(`return document.querySelector('dialog [data-choice="keep"]').checked`)),
  );
  await app.click('dialog [data-choice="anew"]');
  check('unless its pages are to be read anew', await app.exists('dialog [data-languages]'));
  check(
    'which is said',
    /read anew/.test(await app.text('dialog [data-ocr="asking"] .about')),
    await app.text('dialog [data-ocr="asking"] .about'),
  );
  await app.click('dialog [data-choice="keep"]');
  check(
    'as it is, its text is taken',
    (await app.text('dialog [data-ocr-read]')).trim() === 'Take the text',
  );
  await app.click('dialog [data-ocr-read]');
  await app.waitFor('dialog [data-fact="words"]', 30000);
  check(
    'and it is read at once',
    (await facts()).parts === '1' && (await remarks()).length === 0,
    JSON.stringify(await facts()),
  );
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);

  // ---- Greek kept by the names of its glyphs: translated ----
  await dropOnTabs(porson);
  await app.waitFor('dialog [data-ocr="asking"] [data-text-preview] [data-text-page]', 15000);
  check(
    'the scheme of the font is said',
    /glyph names of PorsonGreekSF/.test(await app.text('dialog [data-text-scheme="greek-names"]')),
    await app.text('dialog [data-text-found]'),
  );
  check(
    'and translating is chosen at first, with no languages to read with',
    (await app.exec(`return document.querySelector('dialog [data-choice="translate"]').checked`)) &&
      !(await app.exists('dialog [data-languages]')),
  );
  check(
    'the preview shows the text as translated',
    /ἥσθην ἀπειλαῖς, ἐγέλασα ψολοκομπίαις/.test(await app.text('dialog [data-text-preview]')),
    await app.text('dialog [data-text-preview]'),
  );
  await sleep(300);
  await app.screenshot('ocr-2d-translate');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('ocr-2d-translate-dark');
  await app.setTheme('light');
  await app.click('dialog [data-choice="keep"]');
  check(
    'and as it is, when it is to be kept',
    !/ἐγέλασα/.test(await app.text('dialog [data-text-preview]')),
    await app.text('dialog [data-text-preview]'),
  );
  await app.click('dialog [data-choice="translate"]');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);
  const translated = await invoke('ocr_read', {
    path: porson,
    asked: { languages: [], text: 'translate', dpi: 0, layout: '', contrast: false },
  });
  check(
    'read with translation, the text is Greek, and nothing is read from a picture',
    /ἐγέλασα ψολοκομπίαις/.test(JSON.stringify(translated.sections)) &&
      translated.remarks.length === 0,
    JSON.stringify(translated.remarks),
  );

  // ---- Beta Code: translated as well ----
  await dropOnTabs(betaCode);
  await app.waitFor('dialog [data-ocr="asking"] [data-text-preview] [data-text-page]', 15000);
  check(
    'Beta Code is said to be that',
    await app.exists('dialog [data-text-scheme="beta-code"]'),
  );
  check(
    'and is shown in Greek',
    /μῆνιν ἄειδε θεὰ/.test(await app.text('dialog [data-text-preview]')),
    await app.text('dialog [data-text-preview]'),
  );
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);

  // ---- text that does not read as text, in no scheme ----
  await dropOnTabs(junk);
  await app.waitFor('dialog [data-ocr="asking"] [data-text-preview] [data-text-page]', 15000);
  check('text that does not read as text is said to be so', await app.exists('dialog [data-text-poor]'));
  check(
    'and every page is to be read anew at first, with languages to read with',
    (await app.exec(`return document.querySelector('dialog [data-choice="anew"]').checked`)) &&
      (await app.exists('dialog [data-languages]')),
  );
  check(
    'what the PDF has is shown, to judge by',
    /ÌÞíéí/.test(await app.text('dialog [data-text-preview]')),
    await app.text('dialog [data-text-preview]'),
  );
  check('there is nothing to translate', !(await app.exists('dialog [data-choice="translate"]')));
  await sleep(300);
  await app.screenshot('ocr-2c-poor-text');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('ocr-2c-poor-text-dark');
  await app.setTheme('light');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);

  // ---- the shape of the pages: headings, kept lines, a style named ----
  const shapePdf = join(root, 'e2e', 'fixtures', 'shape.pdf');
  await dropOnTabs(shapePdf);
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  check(
    'the shape of the pages is kept at first',
    await app.exec(`return document.querySelector('dialog [data-choice="shape"]')?.checked === true`),
  );
  await app.click('dialog [data-ocr-read]');
  await app.waitFor('dialog [data-styles-found] [data-style]', 30000);
  await sleep(300);
  const styles = await app.exec(
    `return Array.from(document.querySelectorAll('dialog [data-style]')).map((s) => s.textContent.replace(/\\s+/g, ' ').trim())`,
  );
  check(
    'one style beside the body is found, shown with its sample and how often',
    styles.length === 1 && /1\. A note at the foot/.test(styles[0]) && /4/.test(styles[0]),
    JSON.stringify(styles),
  );
  await app.screenshot('ocr-6-styles');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('ocr-6-styles-dark');
  await app.setTheme('light');
  await app.exec(
    `const s = document.querySelector('dialog [data-style] select');
     s.value = '+own';
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await app.waitFor('dialog [data-style-name] input, dialog input[data-style-name]', 5000);
  await app.exec(
    `const f = document.querySelector('dialog input[data-style-name]') ?? document.querySelector('dialog [data-style-name] input');
     f.value = 'Foot notes';
     f.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  const outlined = await app.exec(
    `return Array.from(document.querySelectorAll('dialog [data-outline] li')).map((l) => l.dataset.outlineLevel + ' ' + l.textContent.trim())`,
  );
  check(
    'the outline of what will be made is shown first',
    JSON.stringify(outlined) === JSON.stringify(['0 The Measure of Things', '1 Lines That Keep Their Place', '1 The Last Part']),
    JSON.stringify(outlined),
  );
  await app.clickText('dialog footer button', 'Bring it in');
  await app.waitGone('dialog[open]', 15000);
  await sleep(600);
  check('the title found names the map', (await tabs()).includes('The Measure of Things'), JSON.stringify(await tabs()));
  await app.openMap('The Measure of Things');
  await inView('The Measure of Things');
  await sleep(400);
  const shaped = await sections();
  const names = shaped.map((s) => s.name);
  check(
    'the headings are elements under the document, and the pages are not',
    names.includes('Lines That Keep Their Place') &&
      names.includes('The Last Part') &&
      !names.some((n) => /^[1-4]$/.test(n ?? '')) &&
      shaped.filter((s) => s.level === '1').length === 2,
    JSON.stringify(shaped.map((s) => [s.level, s.name])),
  );
  const pageMarks = () =>
    app.exec(`return Array.from(document.querySelectorAll('.text-view .refmark')).map((m) => m.dataset.refmark)`);
  check('a mark stands where each page begins', JSON.stringify(await pageMarks()) === '["1","2","3","4"]', JSON.stringify(await pageMarks()));
  check(
    'the running head is left out',
    !shaped.some((s) => /A Book of Tests/.test(s.text)),
  );
  const marks = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .linemark')).map((m) => m.dataset.number)`,
  );
  check('the lines are kept, with the numbers that stood in the margin', JSON.stringify(marks) === '["4","8"]', JSON.stringify(marks));
  const footKinds = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view [data-kind]'))
       .filter((p) => /^\\d\\. A note at the foot/.test(p.textContent.trim()))
       .map((p) => p.dataset.kind)`,
  );
  check(
    'the style found has the kind it was named, one of the project\'s own',
    footKinds.length === 4 && new Set(footKinds).size === 1 && footKinds[0] !== 'text',
    JSON.stringify(footKinds),
  );
  await app.screenshot('ocr-6-shape');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('ocr-6-shape-dark');
  await app.setTheme('light');

  await app.click('.maps .up');
  await inView('Homer');
  await sleep(300);

  // ---- a file made from a written document, with an outline of its own headings ----
  const structurePdf = join(root, 'e2e', 'fixtures', 'structure.pdf');
  const readStructure = async (pages) => {
    await dropOnTabs(structurePdf);
    await app.waitFor('dialog [data-ocr="asking"]', 15000);
    if (pages) await app.clickText('dialog [data-choice="structure"] [role="radio"]', 'By its pages');
    await sleep(200);
    await app.click('dialog [data-ocr-read]');
    await app.waitFor('dialog form input', 30000);
    await sleep(400);
  };
  await readStructure(false);
  const treatise = await app.exec(
    `return Array.from(document.querySelectorAll('dialog [data-outline] li')).map((l) => l.dataset.outlineLevel + ' ' + l.textContent.trim())`,
  );
  check(
    'its outline nests the headings as the file and their numbers say',
    JSON.stringify(treatise) ===
      JSON.stringify(['0 A Short Treatise', '1 1 Beginnings', '2 1.1 The First Part', '2 1.2 The Second Part', '1 2 Endings']),
    JSON.stringify(treatise),
  );
  const titleField = () => app.exec(`return document.querySelector('dialog form input').value`);
  check('the title found is the title offered', (await titleField()) === 'A Short Treatise', await titleField());
  await app.screenshot('ocr-6b-outline');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('ocr-6b-outline-dark');
  await app.setTheme('light');
  await app.clickText('dialog footer button', 'Bring it in');
  await app.waitGone('dialog[open]', 15000);
  await sleep(600);
  await app.openMap('A Short Treatise');
  await inView('A Short Treatise');
  await sleep(400);
  const tree = await sections();
  check(
    'the map has the document’s structure',
    JSON.stringify(tree.filter((s) => s.level !== '0').map((s) => [s.level, s.name])) ===
      JSON.stringify([['1', '1 Beginnings'], ['2', '1.1 The First Part'], ['2', '1.2 The Second Part'], ['1', '2 Endings']]),
    JSON.stringify(tree.map((s) => [s.level, s.name])),
  );
  check('what stood before the first heading is the document’s own', /Anna Lind/.test(tree[0]?.text ?? ''), tree[0]?.text);
  const beginnings = await app.exec(
    `const s = Array.from(document.querySelectorAll('.text-view .section')).find((s) => s.querySelector('.heading .prose.title')?.textContent.trim() === '1 Beginnings');
     return Array.from(s.querySelectorAll('.prose.body p')).map((p) => p.querySelectorAll('.refmark').length)`,
  );
  check(
    'the paragraph that runs over the edge of the page is one, with the mark of the page within it',
    JSON.stringify(beginnings) === '[0,1]',
    JSON.stringify(beginnings),
  );
  // By its pages: an element for each page, the headings under them, and no marks.
  await app.click('.maps .up');
  await inView('Homer');
  await sleep(300);
  await readStructure(true);
  check('by its pages, no outline is shown', !(await app.exists('dialog [data-outline]')));
  await app.exec(
    `const f = document.querySelector('dialog form input');
     f.value = 'A Short Treatise by its pages';
     f.dispatchEvent(new Event('input', { bubbles: true }));`,
  );
  await app.clickText('dialog footer button', 'Bring it in');
  await app.waitGone('dialog[open]', 15000);
  await sleep(600);
  await app.openMap('A Short Treatise by its pages');
  await inView('A Short Treatise by its pages');
  await sleep(400);
  const byPages = (await sections()).filter((s) => s.level === '1').map((s) => s.name);
  check('by its pages, the pages are the elements', JSON.stringify(byPages) === '["1","2"]', JSON.stringify(byPages));
  check('and no mark stands in the text', (await pageMarks()).length === 0, JSON.stringify(await pageMarks()));
  await app.click('.maps .up');
  await inView('Homer');
  await sleep(300);

  // ---- a reading stopped ----
  await dropOnTabs(long);
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  await app.click('dialog [data-ocr-read]');
  const shown = await until(
    'the pages to be shown as they are read',
    () =>
      app.exec(
        `const d = document.querySelector('dialog [data-ocr="reading"] .doing'); return d && /of 12 pages read/.test(d.textContent) ? d.textContent.trim() : null`,
      ),
    60000,
  );
  check('the pages are shown as they are read', /^\d+ of 12 pages read$/.test(shown), shown);
  await app.screenshot('ocr-4-reading');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);
  await sleep(1500);
  // The trees made before: the scan, the picture, the file with a shape, and the treatise twice.
  check('cancelled, no tree is made', (await tabs()).length === 5, JSON.stringify(await tabs()));
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
  check(
    'a PDF of the library is looked at before it is made searchable',
    /2 of the 2 pages have no text/.test(aboutPdf),
    aboutPdf,
  );
  check(
    'no page has text, so there is nothing to keep or read anew',
    !(await app.exists('dialog [data-text-choice]')),
  );
  check('how it is read can be opened here too', await app.exists('dialog [data-ocr-how]'));
  await app.screenshot('ocr-5-searchable');
  await app.click('dialog [data-ocr-make]');
  await app.waitGone('dialog[open]', 90000);
  await sleep(500);
  const toast = await app.exec(
    `return document.querySelector('.toasts, .toaster, [role="status"]')?.textContent ?? ''`,
  );
  check(
    'it is said to be searchable',
    /The PDF is searchable: 2 pages were read/.test(toast),
    toast,
  );
  const after = (await invoke('library_get', { id: singer.id })).files[0];
  check(
    'the reference points to another file, under the same name',
    after.path !== before.path && after.name === before.name,
    `${before.path} → ${after.path}`,
  );
  const stored = join(app.dataDir, 'library', after.path);
  check(
    'which is larger by the text',
    statSync(stored).size > before.size,
    `${before.size} → ${statSync(stored).size}`,
  );
  check(
    'and the scan is gone from the store',
    !existsSync(join(app.dataDir, 'library', before.path)),
  );
  const again = await invoke('ocr_look', { path: after.path, stored: true });
  check(
    'its pages have text now',
    again.pages === 2 && again.withText === 2,
    JSON.stringify(again),
  );
  const text = installed('pdftotext', [stored, '-']);
  if (text !== null)
    check(
      'and the text can be read out of it',
      /Milman Parry/.test(text) && /wrath of Achilles/.test(text),
      text.slice(0, 120),
    );
  check(
    'the file of the reference is shown, and can be made searchable again',
    await app.exists('.pane [data-searchable]'),
  );
  await app.click('.pane [data-searchable]');
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  check(
    'with text on every page, it is said to be searchable already',
    /Every page has text/.test(await app.text('dialog [data-ocr="asking"] .about')),
  );
  check(
    'the text it has, which was read here, is kept at first',
    await app.exec(`return document.querySelector('dialog [data-choice="keep"]').checked`),
  );
  await app.click('dialog [data-choice="anew"]');
  check(
    'read anew, the text it has is taken away, and that is said',
    /unseen text the pages have is taken away/.test(await app.text('dialog [data-ocr="asking"]')),
  );
  check(
    'and so is what is done',
    /read anew/.test(await app.text('dialog [data-ocr="asking"] .about')),
  );
  await app.screenshot('ocr-5b-anew');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);

  // ---- a PDF of the library made readable by translation ----
  const other = entries.entries.find((e) => e.id !== singer.id);
  const given = await invoke('attachment_add', { id: other.id, paths: [porson] });
  const porsonFile = given.files[given.files.length - 1];
  const readable = await invoke('ocr_searchable', {
    id: other.id,
    path: porsonFile.path,
    asked: { languages: [], text: 'translate', dpi: 0, layout: '', contrast: false },
  });
  check(
    'a PDF kept by glyph names is made readable: its font given its letters, nothing read',
    readable.remapped === 1 && readable.read === 0,
    JSON.stringify({ remapped: readable.remapped, read: readable.read }),
  );
  const readableText = installed('pdftotext', [join(app.dataDir, 'library', readable.file.path), '-']);
  if (readableText !== null)
    check(
      'and another reader gets the Greek out of it',
      /ἐγέλασα ψολοκομπίαις/.test(readableText),
      readableText.slice(0, 80),
    );

  // ---- a map from a PDF of the library ----
  check('a PDF of the library can become a map', await app.exists('.pane [data-pdf-map]'));
  await app.click('.pane [data-pdf-map]');
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  check(
    'the dialog asks which project the map goes into',
    await app.exists('dialog [data-ocr-into] select'),
  );
  const intoOptions = await app.exec(
    `return Array.from(document.querySelectorAll('dialog [data-ocr-into] option')).map((o) => o.textContent.trim())`,
  );
  check(
    'a new project, or one of those there are',
    intoOptions[0] === 'A new project, named after it' && intoOptions.includes('Homer'),
    JSON.stringify(intoOptions),
  );
  check(
    'and the PDF is looked at where it is stored',
    /Every page has text/.test(await app.text('dialog [data-ocr="asking"] .about')),
    await app.text('dialog [data-ocr="asking"] .about'),
  );
  await app.screenshot('ocr-5c-map');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);

  // ---- the text of a picture of the store ----
  await app.keys(['Control', '3']);
  await app.waitFor('.pictures', 5000);
  await sleep(500);
  const onStore = await middleOf('.pictures');
  await drop([picture], onStore.x, onStore.y);
  await app.waitFor('.pictures [data-hash]', 8000);
  await sleep(300);
  await app.click('.pictures [data-hash]');
  await app.waitFor('.picture-pane [data-ocr-picture]', 5000);
  await app.click('.picture-pane [data-ocr-picture]');
  await app.waitFor('dialog [data-ocr="asking"]', 5000);
  await app.click('dialog [data-ocr-read]');
  await app.waitFor('dialog [data-ocr-text]', 60000);
  const pictureText = await app.text('dialog [data-ocr-text]');
  check(
    'a picture of the store has its text read, and shown',
    /Homer sings of the quarrel/.test(pictureText),
    pictureText.slice(0, 100),
  );
  check(
    'outside a project, it can be copied but not made a map of',
    (await app.exists('dialog [data-ocr-map]')) === false,
  );
  await app.screenshot('ocr-6-picture');
  await app.clickText('dialog footer button', 'Close');
  await app.waitGone('dialog[open]', 5000);

  // ---- Tesseract in the settings ----
  await app.go('#/settings');
  await app.waitFor('[data-program="tesseract"] .version', 8000);
  const card = await app.text('[data-program="tesseract"]');
  check(
    'the settings say where Tesseract is, and its version',
    /Tesseract\s*\d/.test(card) && /tesseract/.test(card),
    card.slice(0, 120),
  );
  check(
    'the languages it reads are listed under the languages, from the system',
    await app.exists('[data-ocr-languages] [data-language="eng"][data-source="other"]'),
  );
  check(
    'and how text is read at first',
    (await app.exists('[data-ocr-settings-how] [data-ocr-dpi]')) &&
      /Default OCR settings/.test(await app.text('[data-ocr-settings-how]')),
  );
  await app.exec(
    `const s = document.querySelector('[data-ocr-settings] select.add');
     s.value = 'grc';
     s.dispatchEvent(new Event('change', { bubbles: true }));`,
  );
  await sleep(800);
  const kept = await invoke('settings_load');
  check(
    'a language to read in at first is kept',
    JSON.stringify(kept.ocrLanguages) === '["grc"]',
    JSON.stringify(kept.ocrLanguages),
  );
  await app.exec(
    `document.querySelector('[data-program="tesseract"]').scrollIntoView({ block: 'center' })`,
  );
  await sleep(300);
  await app.screenshot('ocr-7-settings');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  // What was shown when it went wrong.
  await app.screenshot('ocr-failed').catch(() => {});
  const shown = await app
    .exec(
      `return document.querySelector('dialog[open]')?.textContent ?? document.body.textContent.slice(0, 400)`,
    )
    .catch(() => '');
  console.log(`shown: ${shown}`);
  console.log(`errors: ${(await app.pageErrors().catch(() => [])).join(' | ')}`);
  throw error;
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
