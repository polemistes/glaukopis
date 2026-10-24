// Text read from PDFs and pictures by Tesseract (ADR 0018): a scanned PDF
// and a picture brought into a project as trees under the element in view
// (ADR 0037), through the workbench of a reading (ADR 0061): the pages, the
// panes of the page in view, a page tried and tried again, stretches made by
// selecting, what each page takes, and what is made of it chosen after the
// reading; a reading stopped, a PDF
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
    const at = await middleOf('.pane-bar');
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
  /** Clicks the button at the foot of the dialog that reads, once it can. */
  const readIt = async () => {
    await app.waitUntil(
      `const b = document.querySelector('dialog [data-ocr-read]'); return !!b && !b.disabled`,
      15000,
      'the button that reads',
    );
    await app.click('dialog [data-ocr-read]');
  };
  /** What the line over the pages says each page gets. */
  const said = () => app.text('dialog [data-pages-said]');
  /** What the pages of the strip are marked to get, in order. */
  const sources = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('dialog [data-strip-page] [data-strip-source]')).map((b) => b.dataset.stripSource)`,
    );
  /** Opens the pages of the reading, to be looked at and tried, from its summary. */
  const openPages = async () => {
    await app.click('dialog [data-open-pages]');
    await app.waitFor('dialog [data-workbench][data-view="pages"]', 5000);
    await sleep(300);
  };
  const footLabel = () =>
    app.exec(`return document.querySelector('dialog [data-ocr-read]')?.textContent.trim() ?? ''`);
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
  const onProjects = await middleOf('[data-start] .welcome');
  await drop([scan], onProjects.x, onProjects.y);
  await app.waitFor('dialog [data-ocr="asking"]', 15000);
  check(
    'a scan dropped among the projects is to be read, to be a project of its own',
    /A project from a document/.test(
      await app.exec(`return document.querySelector('dialog').textContent`),
    ),
  );
  await readIt();
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
  await app.home();
  await sleep(300);

  // ---- a scanned PDF becomes a tree under the element in view, in a project ----
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Homer');
  await app.clickText('dialog footer button', 'Create');
  // A new project opens as text: the diagram is turned to.
  await app.waitFor('.text-view .section', 8000);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);

  await dropOnTabs(scan);
  await app.waitFor('dialog [data-workbench][data-view="summary"]', 15000);
  await sleep(400);
  const facts0 = await app.text('dialog [data-summary-facts]');
  check(
    'the dialog opens on a summary: what the file is',
    /^2 pages, scanned at \d+ dots to the inch, without text of their own\.$/.test(facts0),
    facts0,
  );
  const about = await said();
  check(
    'and that every page is read with Tesseract, with no choice where there is no text to choose',
    /All 2 pages are read with Tesseract/.test(about) &&
      !(await app.exists('dialog [data-summary-whole] [role="radio"]')),
    about,
  );
  check(
    'the pages themselves are not shown until asked for',
    !(await app.exists('dialog [data-page-strip]')) && (await app.exists('dialog [data-open-pages]')),
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
  check(
    'the settings stand in the summary, not folded away, with 300 dots to the inch, for every page',
    (await app.exists(
      'dialog [data-read-settings] [data-ocr-dpi] [role="radio"][aria-label="300"][aria-checked="true"]',
    )) && /all 2 pages/i.test(await app.text('dialog [data-settings-scope]')),
    await app.text('dialog [data-settings-scope]'),
  );
  check('the button at the foot says what it does', (await footLabel()) === 'Read 2 pages', await footLabel());
  await app.screenshot('ocr-1-summary');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('ocr-1-summary-dark');
  await app.setTheme('light');

  await openPages();
  check(
    'opened, the pages are marked in the strip',
    JSON.stringify(await sources()) === '["read","read"]',
    JSON.stringify(await sources()),
  );
  check(
    'the first page to be read is the page in view, and the one selected',
    (await app.exists('dialog [data-strip-page="1"][data-strip-view="true"]')) &&
      /page 1/.test(await app.text('dialog [data-settings-scope]')),
    await app.text('dialog [data-settings-scope]'),
  );
  check(
    'a scan has no text of its own to stand beside: two panes',
    (await app.exec(`return document.querySelector('dialog [data-page-panes]')?.dataset.pagePanes`)) === '2',
  );
  await app.screenshot('ocr-1-workbench');

  // ---- a page tried, and tried again otherwise ----
  await app.click('dialog [data-ocr-try]');
  const sure = await until(
    'the page tried to be shown',
    () =>
      app.exec(
        `const v = document.querySelector('dialog [data-ocr-tried-confidence]'); return v && v.dataset.ocrTriedConfidence ? v.dataset.ocrTriedConfidence : null`,
      ),
    60000,
  );
  check('it is read, and said how sure the reading was', Number(sure) >= 80, sure);
  const triedText = await app.text('dialog [data-ocr-tried-text]');
  check('its text stands beside its picture', /wrath of Achilles/.test(triedText), triedText.slice(0, 80));
  check(
    'the picture Tesseract read is shown, with the blocks it found over it',
    (await app.exec(
      `const i = document.querySelector('dialog [data-ocr-tried-picture]'); return !!i && i.naturalWidth > 0`,
    )) &&
      Number(
        await app.exec(
          `return document.querySelector('dialog [data-ocr-tried-blocks]')?.dataset.ocrTriedBlocks ?? 0`,
        ),
      ) >= 1,
  );
  check(
    'a page read well is not said to be poor',
    (await app.exec(`return document.querySelector('dialog [data-ocr-tried-confidence]').dataset.poorly`)) === 'false',
  );
  const verdict = (await app.text('dialog [data-ocr-tried-confidence]')).replace(/\s+/g, ' ').trim();
  check(
    'how sure, and how many of its words Tesseract was unsure of, is said in one line, in percent',
    /^Page 1: (Good|High) confidence \(\d+%\) · (no word unsure|\d+ of \d+ words unsure)$/.test(verdict),
    verdict,
  );
  check(
    'the panes have no buttons of their own to give the pages a text',
    !(await app.exists('dialog [data-pane-use-pdf], dialog [data-pane-use-read]')),
  );
  check('the trial is kept', (await app.exec(`return document.querySelectorAll('dialog [data-trial]').length`)) === 1);
  check(
    'and said in percent',
    /^\d+%$/.test((await app.text('dialog [data-trial="1"] [data-trial-confidence]')).trim()),
    await app.text('dialog [data-trial="1"] [data-trial-confidence]'),
  );
  // The picture at its own size is moved by dragging it, not by bars at its edges.
  await app.click('dialog [data-picture-zoom] [role="radio"][aria-label="100%"]');
  await sleep(300);
  const roomAt = () =>
    app.exec(
      `const r = document.querySelector('dialog [data-picture-room]'); return { left: r.scrollLeft, top: r.scrollTop, bars: r.offsetWidth - r.clientWidth }`,
    );
  const dragFrom = await roomAt();
  const grip = await app.exec(
    `const r = document.querySelector('dialog [data-picture-room]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }`,
  );
  await app.cmd('POST', '/actions', {
    actions: [
      {
        type: 'pointer',
        id: 'mouse',
        parameters: { pointerType: 'mouse' },
        actions: [
          { type: 'pointerMove', origin: 'viewport', x: grip.x, y: grip.y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerMove', origin: 'viewport', x: grip.x - 120, y: grip.y - 80, duration: 120 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ],
  });
  await app.cmd('DELETE', '/actions');
  await sleep(200);
  const dragTo = await roomAt();
  check(
    'the picture at its own size is moved by dragging it, with no bars at its edges',
    dragTo.left - dragFrom.left === 120 && dragTo.top - dragFrom.top === 80 && dragTo.bars === 0,
    `${JSON.stringify(dragFrom)} → ${JSON.stringify(dragTo)}`,
  );
  await app.click('dialog [data-picture-zoom] [role="radio"][aria-label="Fit"]');
  await sleep(200);
  await app.screenshot('ocr-1b-tried');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('ocr-1b-tried-dark');
  await app.setTheme('light');

  // ---- a setting changed for the page selected makes a stretch ----
  await app.click('dialog [data-ocr-dpi] [role="radio"][aria-label="400"]');
  await sleep(200);
  check(
    'a resolution chosen for the first page alone makes two stretches, shown over the strip',
    (await app.exists('dialog [data-strip-stretch="1"]')) &&
      (await app.exists('dialog [data-strip-stretch="2"]')),
  );
  await app.waitFor('dialog [data-strip-page="2"] img', 30000);
  check('the pages are shown, small, at the top', await app.exists('dialog [data-strip-page="1"] img'));
  await app.screenshot('ocr-1c-stretches');
  await app.click('dialog [data-ocr-try]');
  await until(
    'the page to be tried again',
    () => app.exec(`return document.querySelectorAll('dialog [data-trial]').length === 2`),
    60000,
  );
  check(
    'tried again, both trials are kept, the newest shown',
    (await app.exec(`return document.querySelector('dialog [data-trial="1"]').getAttribute('aria-selected')`)) === 'true',
  );
  await app.click('dialog [data-trial="2"]');
  await sleep(200);
  check(
    'and can be shown again',
    (await app.exec(`return document.querySelector('dialog [data-trial="2"]').getAttribute('aria-selected')`)) === 'true',
  );
  await app.click('dialog [data-trial="2"] [data-trial-use]');
  await sleep(200);
  check(
    'its settings taken again, the page is read as the others, in one stretch',
    !(await app.exists('dialog [data-strip-stretch="2"]')) &&
      (await app.exists('dialog [data-ocr-dpi] [role="radio"][aria-label="300"][aria-checked="true"]')),
  );

  // ---- pages chosen in the strip ----
  await app.click('dialog [data-strip-page="2"]');
  await sleep(300);
  check(
    'a page chosen is the page in view, and the settings hold for it',
    (await app.exists('dialog [data-strip-page="2"][data-strip-view="true"]')) &&
      /page 2/.test(await app.text('dialog [data-settings-scope]')),
    await app.text('dialog [data-settings-scope]'),
  );
  await app.click('dialog [data-pages-all]');
  await sleep(200);
  check(
    'or for every page',
    /all 2 pages/i.test(await app.text('dialog [data-settings-scope]')),
    await app.text('dialog [data-settings-scope]'),
  );
  await app.click('dialog [data-close-pages]');
  await app.waitFor('dialog [data-workbench][data-view="summary"]', 5000);
  await openPages();
  check(
    'back at the summary and in the pages again, the page in view is as it was',
    await app.exists('dialog [data-strip-page="2"][data-strip-view="true"]'),
  );
  await app.click('dialog [data-strip-page="1"]');
  await sleep(300);
  check(
    'and the trials of the first page are as they were',
    (await app.exec(`return document.querySelectorAll('dialog [data-trial]').length`)) === 2,
  );

  await readIt();
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
  check('and no page was read poorly', !told.some((r) => /read poorly/.test(r)), told.join(' ‖ '));
  check('what is made of it is asked after the reading', await app.exists('dialog [data-made-of] [data-made-shape]'));
  await app.screenshot('ocr-2-made');
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
  await app.up();
  await inView('Homer');
  await sleep(300);
  await dropOnTabs(picture);
  await app.waitFor('dialog [data-workbench][data-view="summary"]', 15000);
  check(
    'a picture opens on its summary: that it is read, and how',
    /The text is read from the image/.test(await app.text('dialog [data-summary-facts]')) &&
      (await app.exists('dialog [data-read-settings]')),
  );
  await openPages();
  check(
    'tried, it is read in the workbench, without pages to choose from, at once',
    !(await app.exists('dialog [data-page-strip]')) &&
      (await app.exec(`return document.querySelector('dialog [data-page-panes]')?.dataset.pagePanes`)) === '2',
  );
  await app.waitFor('dialog [data-ocr-tried-text]', 60000);
  check('what it reads is shown', /Many a brave soul/.test(await app.text('dialog [data-ocr-tried-text]')));
  await readIt();
  await app.waitFor('dialog [data-fact="words"]', 60000);
  await sleep(200);
  check(
    'the picture is read',
    /one\.png · Image/.test(
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
  await app.up();
  await inView('Homer');
  await sleep(300);
  await dropOnTabs(written);
  await app.waitFor('dialog [data-workbench][data-view="summary"]', 15000);
  await sleep(300);
  check(
    'a PDF that has text is said to take it, chosen for the whole PDF in the summary',
    /The page takes the text the PDF has/.test(await said()) &&
      (await app.exists('dialog [data-summary-whole="pdf"]')) &&
      /^One page, with text of its own\.$/.test(await app.text('dialog [data-summary-facts]')),
    `${await said()} | ${await app.text('dialog [data-summary-facts]')}`,
  );
  check(
    'with nothing to read, the settings stand greyed, still to be set',
    await app.exists('dialog [data-read-settings].idle [data-settings-idle]'),
  );
  await app.click(await app.findByText('dialog [data-summary-whole] [role="radio"]', 'Read with Tesseract'));
  await sleep(200);
  check(
    'the whole PDF can be read with Tesseract instead, which the button says',
    (await footLabel()) === 'Read one page' &&
      !(await app.exists('dialog [data-read-settings].idle')),
    await footLabel(),
  );
  await app.click(await app.findByText('dialog [data-summary-whole] [role="radio"]', "The PDF's text"));
  await sleep(200);
  await app.screenshot('ocr-2a-summary-text');
  await openPages();
  await app.waitFor('dialog [data-pane-pdf] [data-text-page]', 10000);
  const previewed = await app.text('dialog [data-pane-pdf]');
  check('the text it has is shown beside the picture', /The wrath of Achilles/.test(previewed), previewed);
  check(
    'it reads as text, and that is said',
    await app.exists('dialog [data-text-verdict="sound"]'),
  );
  check('as it is, its text is taken', (await footLabel()) === 'Take the text', await footLabel());
  await app.click('dialog [data-ocr-try]');
  await app.waitFor('dialog [data-ocr-tried-text]', 60000);
  check(
    'a page that takes its text can be tried all the same, the two texts side by side',
    /wrath of Achilles/.test(await app.text('dialog [data-ocr-tried-text]')) &&
      (await app.exec(`return document.querySelector('dialog [data-page-panes]')?.dataset.pagePanes`)) === '3',
  );
  await app.screenshot('ocr-2b-side-by-side');
  await app.click('dialog [data-pages-read]');
  await sleep(200);
  check(
    'it can be read with Tesseract instead, which the strip and the button say',
    JSON.stringify(await sources()) === '["read"]' && (await footLabel()) === 'Read one page',
    `${JSON.stringify(await sources())} ${await footLabel()}`,
  );
  await app.click('dialog [data-pages-pdf]');
  await sleep(200);
  check(
    'and given its own text again',
    JSON.stringify(await sources()) === '["pdf"]' && (await footLabel()) === 'Take the text',
    `${JSON.stringify(await sources())} ${await footLabel()}`,
  );
  await readIt();
  await app.waitFor('dialog [data-fact="words"]', 30000);
  check(
    'and it is taken at once',
    (await facts()).parts === '1' && (await remarks()).length === 0,
    JSON.stringify(await facts()),
  );
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);

  // ---- Greek kept by the names of its glyphs: translated ----
  await dropOnTabs(porson);
  await app.waitFor('dialog [data-workbench][data-view="summary"]', 15000);
  check(
    'the scheme of the font is said in the summary',
    /glyph names of PorsonGreekSF/.test(await app.text('dialog [data-text-scheme="greek-names"]')),
  );
  check(
    'its text is taken as translated at first',
    await app.exec(`return document.querySelector('dialog [data-text-translated]').checked`),
  );
  await openPages();
  await app.waitFor('dialog [data-pane-pdf] [data-text-page]', 15000);
  check(
    'and in the pages too, nothing read',
    (await app.exec(`return document.querySelector('dialog [data-text-translated]').checked`)) &&
      JSON.stringify(await sources()) === '["pdf"]',
    JSON.stringify(await sources()),
  );
  check(
    'the pane shows the text as translated',
    /ἥσθην ἀπειλαῖς, ἐγέλασα ψολοκομπίαις/.test(await app.text('dialog [data-pane-pdf]')),
    await app.text('dialog [data-pane-pdf]'),
  );
  await sleep(300);
  await app.screenshot('ocr-2d-translate');
  await app.setTheme('dark');
  await sleep(200);
  await app.screenshot('ocr-2d-translate-dark');
  await app.setTheme('light');
  await app.click('dialog [data-text-translated]');
  await sleep(200);
  check(
    'and as it is, when it is not to be translated',
    !/ἐγέλασα/.test(await app.text('dialog [data-pane-pdf]')),
    await app.text('dialog [data-pane-pdf]'),
  );
  await app.click('dialog [data-text-translated]');
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);
  const translated = await invoke('ocr_read', {
    path: porson,
    asked: { languages: [], text: 'translate', dpi: 0, layout: '', contrast: false },
  });
  check(
    'read with translation, the text is Greek, and nothing is read from a picture',
    /ἐγέλασα ψολοκομπίαις/.test(JSON.stringify(translated.imported.sections)) &&
      translated.imported.remarks.length === 0,
    JSON.stringify(translated.imported.remarks),
  );

  // ---- Beta Code: translated as well ----
  await dropOnTabs(betaCode);
  await app.waitFor('dialog [data-workbench][data-view="summary"]', 15000);
  check(
    'Beta Code is said to be that',
    await app.exists('dialog [data-text-scheme="beta-code"]'),
  );
  await openPages();
  await app.waitFor('dialog [data-pane-pdf] [data-text-page]', 15000);
  check(
    'and is shown in Greek',
    /μῆνιν ἄειδε θεὰ/.test(await app.text('dialog [data-pane-pdf]')),
    await app.text('dialog [data-pane-pdf]'),
  );
  await app.clickText('dialog footer button', 'Cancel');
  await app.waitGone('dialog[open]', 5000);

  // ---- text that does not read as text, in no scheme ----
  await dropOnTabs(junk);
  await app.waitFor('dialog [data-workbench][data-view="summary"]', 15000);
  check(
    'text that does not read as text is said so in the summary, and read at first',
    /which does not read as text/.test(await app.text('dialog [data-summary-facts]')) &&
      (await app.exists('dialog [data-summary-whole="read"]')),
    await app.text('dialog [data-summary-facts]'),
  );
  await openPages();
  await app.waitFor('dialog [data-pane-pdf] [data-text-page]', 15000);
  check(
    'text that does not read as text is said to be so',
    (await app.exists('dialog [data-text-verdict="poor"]')) &&
      (await app.exists('dialog [data-strip-page="1"] [data-strip-verdict="poor"]')),
  );
  check(
    'and its page is to be read anew at first',
    JSON.stringify(await sources()) === '["read"]' && /read with Tesseract/.test(await said()),
    await said(),
  );
  check(
    'what the PDF has is shown, to judge by',
    /ÌÞíéí/.test(await app.text('dialog [data-pane-pdf]')),
    await app.text('dialog [data-pane-pdf]'),
  );
  check('there is nothing to translate', !(await app.exists('dialog [data-text-translated]')));
  await app.click('dialog [data-pages-pdf]');
  await sleep(200);
  check('it can take its own text all the same', JSON.stringify(await sources()) === '["pdf"]');
  await app.click('dialog [data-pages-decide]');
  await sleep(200);
  check(
    'and decided by the quality of its text, it is read',
    JSON.stringify(await sources()) === '["read"]',
    JSON.stringify(await sources()),
  );
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
  await app.waitFor('dialog [data-workbench]', 15000);
  await readIt();
  await app.waitFor('dialog [data-styles-found] [data-style]', 30000);
  await sleep(300);
  check(
    'the shape of the pages is kept at first',
    await app.exec(`return document.querySelector('dialog [data-made-shape]')?.checked === true`),
  );
  await app.click('dialog [data-made-shape]');
  await app.waitGone('dialog [data-styles-found]', 10000);
  check(
    'without it, the same reading is plain paragraphs, a part a page, at once and without reading again',
    !(await app.exists('dialog [data-outline]')) &&
      (await facts()).parts === '4' &&
      !(await app.exists('dialog [data-ocr="reading"]')),
    JSON.stringify(await facts()),
  );
  await app.click('dialog [data-made-shape]');
  await app.waitFor('dialog [data-styles-found] [data-style]', 10000);
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

  await app.up();
  await inView('Homer');
  await sleep(300);

  // ---- a file made from a written document, with an outline of its own headings ----
  const structurePdf = join(root, 'e2e', 'fixtures', 'structure.pdf');
  const readStructure = async (pages) => {
    await dropOnTabs(structurePdf);
    await app.waitFor('dialog [data-workbench]', 15000);
    await readIt();
    await app.waitFor('dialog form input', 30000);
    await sleep(400);
    if (pages) {
      // Chosen after the reading, and made anew from it.
      await app.click(await app.findByText('dialog [data-made-structure] [role="radio"]', 'By its 2 pages'));
      await app.waitGone('dialog [data-outline]', 10000);
      await sleep(200);
    }
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
  check(
    'the tree is said to be by its headings, counted',
    /By its 4 headings/.test(await app.text('dialog [data-made-structure]')),
    await app.text('dialog [data-made-structure]'),
  );
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
  await app.up();
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
  await app.up();
  await inView('Homer');
  await sleep(300);

  // ---- an English scan read as Ancient Greek: its pages are said to be read poorly ----
  if (/^grc$/m.test(langs)) {
    await dropOnTabs(scan);
    await app.waitFor('dialog [data-workbench][data-view="summary"]', 15000);
    await sleep(300);
    // In the summary, the languages hold for every page.
    await app.exec(
      `const s = document.querySelector('dialog [data-languages] select'); s.value = 'grc'; s.dispatchEvent(new Event('change', { bubbles: true }));`,
    );
    await sleep(200);
    await app.click('dialog [data-languages] .chip[data-language="eng"] button');
    await sleep(200);
    check('read as Greek alone', JSON.stringify(await chips()) === '["grc"]', JSON.stringify(await chips()));
    await openPages();
    await app.click('dialog [data-ocr-try]');
    const poor = await until(
      'the page tried as Greek',
      () => app.exec(`return document.querySelector('dialog [data-ocr-tried-confidence]')?.dataset.poorly ?? null`),
      60000,
    );
    check('the page tried is said to be read poorly', poor === 'true', poor);
    await app.screenshot('ocr-1d-tried-poorly');
    await readIt();
    await app.waitFor('dialog [data-fact="words"]', 60000);
    const saidPoorly = await remarks();
    check(
      'the reading names the pages read poorly',
      saidPoorly.some((r) => /^2 pages were read poorly: 1–2\./.test(r)),
      saidPoorly.join(' ‖ '),
    );
    check(
      'and, Greek never having been set in Gothic type, does not name the Fraktur model',
      !saidPoorly.some((r) => /Fraktur \(Gothic type\), German, chosen first/.test(r)),
    );
    await app.screenshot('ocr-2e-read-poorly');
    await app.clickText('dialog footer button', 'Cancel');
    await app.waitGone('dialog[open]', 5000);
    await sleep(300);
  } else {
    console.log('Tesseract has no Ancient Greek: a reading in the wrong language is not tried.');
  }

  // ---- a reading stopped ----
  await dropOnTabs(long);
  await app.waitFor('dialog [data-workbench]', 15000);
  await readIt();
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
  await app.waitFor('dialog [data-workbench="searchable"]', 15000);
  await sleep(300);
  const aboutPdf = await said();
  check(
    'a PDF of the library is looked at in the same workbench before it is made searchable',
    /All 2 pages are read with Tesseract/.test(aboutPdf),
    aboutPdf,
  );
  check(
    'no page has text, so there is no text of its own to show',
    !(await app.exists('dialog [data-pane-pdf]')),
  );
  check('how it is read stands beside the pages here too', await app.exists('dialog [data-read-settings] [data-ocr-dpi]'));
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
  await app.waitFor('dialog [data-workbench="searchable"]', 15000);
  await sleep(300);
  check(
    'with text on every page, the text it has, which was read here, is kept at first',
    /All 2 pages take the text the PDF has/.test(await said()),
    await said(),
  );
  check(
    'and there is nothing to do',
    await app.exec(`return document.querySelector('dialog [data-ocr-make]').disabled`),
  );
  await openPages();
  check('every page is marked so in the strip', JSON.stringify(await sources()) === '["pdf","pdf"]');
  await app.click('dialog [data-pages-read]');
  await sleep(200);
  check(
    'the page selected can be read anew, which the strip says',
    JSON.stringify(await sources()) === '["read","pdf"]' &&
      !(await app.exec(`return document.querySelector('dialog [data-ocr-make]').disabled`)),
    JSON.stringify(await sources()),
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
  await app.waitFor('dialog [data-workbench]', 15000);
  check(
    'and the PDF is looked at where it is stored',
    /take the text the PDF has/.test(await said()),
    await said(),
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
  const kept = (await invoke('settings_load')).settings;
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
