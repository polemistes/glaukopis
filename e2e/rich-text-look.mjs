// The look of the document on a sheet of rich text (record 0113, its
// addendum of the document's look; `src/lib/byhand/sheet.ts`). On the
// sheet the paragraphs of text are drawn as the document sets them: in its
// font, with its line spacing, its alignment, the first line of a paragraph
// that follows another begun in, and its space between paragraphs; a change
// in the Look is drawn at once. The text around the sheet is drawn as the
// editor draws any text. A paragraph centred by hand begins with the rest.
// Where the text is only shown, before it is pressed, the sheet is drawn
// the same, with what is set by hand: the size and the colour of words and
// how a paragraph stands; pressed, nothing moves. In a note of the
// notebook, which is of no document, a sheet is drawn as the text around it.
// Screenshots in e2e/output/rich-text-look-<n>-<what>.png.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** Waits, at most `ms`, until `probe` gives what `ok` takes; gives the last it gave. */
async function until(probe, ok, ms = 6000) {
  const end = Date.now() + ms;
  let got = await probe();
  while (!ok(got) && Date.now() < end) {
    await sleep(150);
    got = await probe();
  }
  return got;
}

const PROSE = '.text-view .section .body .prose';

/** How the paragraphs of the text are drawn: those of the sheet, and the one before it. */
const drawn = (app) =>
  app.exec(
    `const prose = document.querySelector('${PROSE}');
     const box = prose?.querySelector('.rich');
     if (!box) return null;
     const px = (v) => Math.round(parseFloat(v) * 100) / 100;
     const of = (p) => { const s = getComputedStyle(p); return { indent: px(s.textIndent), line: Math.round(parseFloat(s.lineHeight) / parseFloat(s.fontSize) * 100) / 100, align: s.textAlign, font: s.fontFamily.split(',')[0].replace(/"/g, '').trim(), above: px(s.marginTop), top: Math.round(p.getBoundingClientRect().top - box.getBoundingClientRect().top), size: px(s.fontSize) }; };
     const said = getComputedStyle(prose.closest('.rich-text') ?? prose);
     return {
       shown: !box.querySelector('.rich-head'),
       point: parseFloat(said.getPropertyValue('--text-size') || '17') / parseFloat(said.getPropertyValue('--hand-base') || '11'),
       base: said.getPropertyValue('--hand-base').trim(),
       before: of(prose.querySelector(':scope > p')),
       sheet: Array.from(box.querySelectorAll('p')).map(of),
       height: Math.round(box.getBoundingClientRect().height),
       big: (() => { const s = box.querySelector('span[data-size]'); return s ? px(getComputedStyle(s).fontSize) : null; })(),
       red: (() => { const s = box.querySelector('span[data-colour]'); return s ? getComputedStyle(s).color : null; })(),
     };`,
  );

const near = (a, b, by = 0.6) => Math.abs(a - b) <= by;

const app = await App.launch({ width: 1360, height: 880 });
try {
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'A look');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  const id = await app.execAsync(`const list = await window.__TAURI_INTERNALS__.invoke('project_list'); return list.find((p) => p.name === 'A look')?.id ?? null;`);
  await app.click('.text-view .section .body');
  await app.keys('Before the sheet.');
  await app.press('Enter');
  await app.insert('Rich text');
  await app.waitFor(`${PROSE} .rich`, 5000);
  await app.keys('The first paragraph on the sheet is long enough to run over more than one line of it, so that its lines and how they stand between the edges can be seen with the eye.');
  await app.press('Enter');
  await app.keys('The second follows it.');
  await app.press('Enter');
  await app.keys('The third is centred by hand.');
  await app.exec(`document.querySelector('${PROSE} .rich [data-rich-align="center"]').click()`);
  await sleep(300);
  // A size and a colour by hand, on words of the second paragraph.
  await app.exec(
    `const p = document.querySelectorAll('${PROSE} .rich .rich-body p')[1];
     const n = Array.from(p.childNodes).find((c) => c.nodeType === 3);
     const r = document.createRange(); r.setStart(n, 4); r.setEnd(n, 10);
     const s = getSelection(); s.removeAllRanges(); s.addRange(r);`,
  );
  await sleep(300);
  await app.click('[data-rich-size]');
  await app.keys('24');
  await app.press('Enter');
  await sleep(250);
  await app.exec(`window.__glaukopisRichColour('#b0322a')`);
  await sleep(300);
  await app.installErrorHook();

  // ---- the look is set in the Look, and drawn on the sheet ----
  await app.openLook('Type');
  await app.lookChoose('Font', 'Gentium Plus');
  await app.lookWrite('Size', '12');
  await app.lookChoose('Line spacing', '1.5');
  await app.lookChoose('Alignment', 'justified');
  await app.lookSection('Paragraphs');
  await app.lookWrite('Indent first line', '1');
  await app.lookWrite('Space between paragraphs', '0.2');
  let now = await until(() => drawn(app), (d) => !!d && d.base === '12' && d.sheet[1]?.indent > 0 && d.sheet[1]?.line === 1.8 && d.sheet[1]?.above > 0, 8000);
  // A centimetre and a fifth of one, in the points of the document as they are drawn.
  const cm = (72 / 2.54) * now.point;
  check('the sheet is drawn in the font of the document', now.sheet[0].font === 'Gentium Plus' && now.sheet[1].font === 'Gentium Plus', now.sheet[0].font);
  check('with its line spacing: one and a half of 1.2', now.sheet[0].line === 1.8 && now.sheet[1].line === 1.8, `${now.sheet[0].line}`);
  check('and its alignment', now.sheet[0].align === 'justify' && now.sheet[1].align === 'justify', now.sheet[0].align);
  check('a paragraph that follows another begins a centimetre in, drawn in proportion', near(now.sheet[1].indent, cm), `${now.sheet[1].indent} of ${cm.toFixed(2)}`);
  check('the first on the sheet follows the paragraph before the sheet, and begins in too', near(now.sheet[0].indent, cm), `${now.sheet[0].indent}`);
  check('between two paragraphs is what the layout says', near(now.sheet[1].above, cm / 5), `${now.sheet[1].above} of ${(cm / 5).toFixed(2)}`);
  check('a paragraph centred by hand begins with the rest', now.sheet[2].align === 'center' && now.sheet[2].indent === 0, JSON.stringify(now.sheet[2]));
  check('the text around the sheet is drawn as the editor draws any text', now.before.indent === 0 && now.before.line === 1.62 && now.before.font !== 'Gentium Plus', JSON.stringify(now.before));
  await app.screenshot('rich-text-look-1-written');

  await app.lookWrite('Indent first line', '0');
  now = await until(() => drawn(app), (d) => d?.sheet[1]?.indent === 0, 6000);
  check('with no indent in the layout, none is drawn', now.sheet[0].indent === 0 && now.sheet[1].indent === 0, JSON.stringify(now.sheet[1]));
  await app.lookWrite('Indent first line', '1');
  await until(() => drawn(app), (d) => d?.sheet[1]?.indent > 0, 6000);

  const written = await drawn(app);
  check('a size set by hand is drawn in proportion to the size of the document', near(written.big, 24 * written.point), `${written.big} of ${(24 * written.point).toFixed(2)}`);

  // ---- shown only, the sheet is drawn the same ----
  await app.home();
  await app.go(`#/project/${encodeURIComponent(id)}`);
  await app.waitFor(`${PROSE} .rich`, 10000);
  const shown = await until(() => drawn(app), (d) => !!d && d.shown && d.base === '12' && d.sheet.length === 3, 8000);
  await app.screenshot('rich-text-look-2-shown');
  check('where the text is only shown, the sheet is drawn in the look of the document', shown.shown && shown.sheet[0].font === 'Gentium Plus' && shown.sheet[1].line === 1.8 && near(shown.sheet[1].indent, cm) && near(shown.sheet[0].indent, cm) && shown.sheet[1].align === 'justify', JSON.stringify(shown.sheet[1]));
  check('with what is set by hand: the size and the colour of words', near(shown.big, written.big, 0.05) && shown.red === 'rgb(176, 50, 42)', `${shown.big} ${shown.red}`);
  check('and how a paragraph stands', shown.sheet[2].align === 'center' && shown.sheet[2].indent === 0, JSON.stringify(shown.sheet[2]));
  await app.click(`${PROSE} .rich p`);
  await app.waitFor(`${PROSE} .rich .rich-head`, 5000);
  await sleep(400);
  const pressed = await drawn(app);
  check(
    'pressed, the editor takes its place and nothing moves',
    !pressed.shown && pressed.height === shown.height && pressed.sheet.every((p, i) => p.top === shown.sheet[i].top && near(p.indent, shown.sheet[i].indent, 0.05)),
    `${shown.height} ${pressed.height} ${JSON.stringify(shown.sheet.map((p) => p.top))} ${JSON.stringify(pressed.sheet.map((p) => p.top))}`,
  );
  await app.screenshot('rich-text-look-3-pressed');

  const errors = await app.pageErrors();
  check('the page said nothing was wrong', errors.length === 0, JSON.stringify(errors).slice(0, 400));
} catch (e) {
  check('the script ran to its end', false, e?.message ?? String(e));
  await app.screenshot('rich-text-look-stopped').catch(() => {});
} finally {
  await app.close().catch(() => {});
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
