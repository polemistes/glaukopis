// Headings in rich text (record 0115): a paragraph of a sheet that looks
// like a heading of the document and is no element. The first tool in the
// head of a sheet says whether the paragraph the cursor is in is Text, a
// Heading or a Subheading, and makes it one. A heading is drawn as the Look
// sets the headings one level under the element the text is of, a
// subheading as those two under it: their size, their weight, how they
// stand. Enter at the end of a heading goes on in text. What is set by hand
// of a heading is laid over it. A heading made a point of a list is a
// heading no more. The typesetting pane sets it as a block kept with what
// follows, and not as a heading of the document; the readable copy says it
// of the paragraph; where the text is only shown it is drawn the same, and
// pressed, nothing moves. In a note of the notebook, of no document, a
// heading is bold and larger.
// Screenshots in e2e/output/rich-text-headings-<n>-<what>.png.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
const near = (a, b, by = 0.6) => Math.abs(a - b) <= by;

const app = await App.launch({ width: 1500, height: 900 });

/** The paragraphs of the first sheet, as they are drawn. */
const drawn = () =>
  app.exec(
    `const prose = document.querySelector('${PROSE}');
     const box = prose?.querySelector('.rich');
     if (!box) return null;
     const px = (v) => Math.round(parseFloat(v) * 100) / 100;
     const said = getComputedStyle(prose.closest('.rich-text') ?? prose);
     const words = (el) => { const c = el.cloneNode(true); c.querySelectorAll('.ProseMirror-widget, [contenteditable="false"]').forEach((w) => w.remove()); return c.textContent.replace(/\\u200b/g, ''); };
     return {
       shown: !box.querySelector('.rich-head'),
       point: parseFloat(said.getPropertyValue('--text-size') || '17') / parseFloat(said.getPropertyValue('--hand-base') || '11'),
       height: Math.round(box.getBoundingClientRect().height),
       level: box.querySelector('[data-rich-level]')?.value ?? null,
       paragraphs: Array.from(box.querySelectorAll('p')).map((p) => { const s = getComputedStyle(p); return {
         words: words(p), heading: p.dataset.heading ?? '', kind: p.dataset.kind ?? '', size: px(s.fontSize), weight: s.fontWeight, style: s.fontStyle, align: s.textAlign,
         indent: px(s.textIndent), over: px(s.paddingTop), under: px(s.paddingBottom), top: Math.round(p.getBoundingClientRect().top - box.getBoundingClientRect().top) }; }),
     };`,
  );

/** Chooses in the first tool of the head: '' for Text, '1' for Heading, '2' for Subheading. */
const level = (value) =>
  app.exec(`const s = document.querySelector('${PROSE} .rich [data-rich-level]'); s.value = arguments[0]; s.dispatchEvent(new Event('change', { bubbles: true }));`, value);

/** The Typst of the preview, as last made; nothing before it is. */
function typst() {
  const found = execFileSync('find', [app.dataDir, '-name', 'document.typ'], { encoding: 'utf8' }).trim().split('\n')[0];
  return found ? readFileSync(found, 'utf8') : '';
}

try {
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'A headed letter');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  const id = await app.execAsync(`const list = await window.__TAURI_INTERNALS__.invoke('project_list'); return list.find((p) => p.name === 'A headed letter')?.id ?? null;`);
  await app.click('.text-view .section .body');
  await app.keys('Before the sheet.');
  await app.press('Enter');
  await app.insert('Rich text');
  await app.waitFor(`${PROSE} .rich [data-rich-level]`, 5000);
  await app.installErrorHook();

  // ---- the first tool makes the paragraph a heading; Enter goes on in text ----
  const offered = await app.exec(`return Array.from(document.querySelector('${PROSE} .rich [data-rich-level]').options).map((o) => o.textContent.trim())`);
  check('the first tool of the head offers Text, Heading and Subheading', offered.join(' | ') === 'Text | Heading | Subheading', offered.join(' | '));
  await level('1');
  await app.keys('The opening');
  let now = await drawn();
  check('the paragraph the cursor is in is made a heading, and the tool says so', now.paragraphs[0]?.heading === '1' && now.level === '1', JSON.stringify(now.paragraphs[0]));
  await app.press('Enter');
  await app.keys('Dear all, welcome.');
  now = await drawn();
  check('Enter at the end of a heading goes on in text', now.paragraphs[1]?.heading === '' && now.level === '' && now.paragraphs[1]?.words === 'Dear all, welcome.', JSON.stringify(now.paragraphs[1]));
  await app.press('Enter');
  await level('2');
  await app.keys('The programme');
  await app.press('Enter');
  await app.keys('First this, then that.');
  await sleep(300);

  // ---- what is set by hand is laid over it ----
  await app.click(`${PROSE} .rich .rich-body p:nth-child(3)`);
  await app.exec(`document.querySelector('${PROSE} .rich [data-rich-align="right"]')?.click()`);
  now = await until(drawn, (d) => d?.paragraphs[2]?.align === 'right', 3000);
  check('a subheading set to the right by hand stands to the right, and is a subheading still', now.paragraphs[2].align === 'right' && now.paragraphs[2].heading === '2' && now.level === '2', JSON.stringify(now.paragraphs[2]));

  // ---- drawn as the Look sets the headings under the element ----
  await app.openLook('Headings');
  // The text is that of the document itself: Heading is its first level, Subheading its second.
  now = await until(drawn, (d) => !!d && d.paragraphs.length === 4, 4000);
  const [h1, text1, h2, text2] = now.paragraphs;
  check('a heading is larger than the text, and a subheading no larger than the heading', h1.size > text1.size && h2.size <= h1.size && h2.size >= text2.size, `${h1.size} ${h2.size} ${text1.size}`);
  check('neither begins in, and the text under one begins as the first of a run', h1.indent === 0 && h2.indent === 0, `${h1.indent} ${h2.indent} ${text1.indent}`);
  check('there is room over a heading', h1.over > 0 && h2.over > 0, `${h1.over} ${h2.over}`);
  await app.screenshot('rich-text-headings-1-written');

  // The size of the first level is changed in the Look, and the heading on the sheet follows.
  const sizeBefore = h1.size;
  const set = await app.exec(
    `const first = document.querySelector('.side .look details.level[data-level="1"]');
     if (first) first.open = true;
     const rows = Array.from(first?.querySelectorAll('.row') ?? []);
     const row = rows.find((r) => r.querySelector('.what')?.firstChild?.textContent.trim() === 'Size' && r.querySelector('input'));
     if (!row) return null;
     const i = row.querySelector('input'); const was = i.value;
     i.value = '26'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true }));
     return was;`,
  );
  now = await until(drawn, (d) => !!d && d.paragraphs[0]?.size !== sizeBefore, 6000);
  check('the size of the first level set in the Look is the size of the heading on the sheet, in proportion', set !== null && near(now.paragraphs[0].size, 26 * now.point), `was ${set}pt; ${now.paragraphs[0]?.size} of ${(26 * now.point).toFixed(2)}`);

  // ---- the typesetting pane ----
  const set_ = await until(async () => typst(), (t) => /#block\(width: 100%, sticky: true, above: [^)]*\)\[[^\n]*\n#text\(size: 26pt\)\[[^\n]*The opening/.test(t), 30000);
  check('the typesetting pane sets the heading as a block kept with what follows, in the size of its level', /#block\(width: 100%, sticky: true, above: [^)]*\)\[[^\n]*\n#text\(size: 26pt\)\[[^\n]*The opening/.test(set_), (set_.match(/[^\n]*\n[^\n]*The opening[^\n]*/) ?? [''])[0].slice(0, 300));
  check('and not as a heading of the document', !set_.split('\n').some((l) => /^=+ /.test(l) && /The opening|The programme/.test(l)) && /#set align\(right\)[^\n]*\n[^\n]*The programme/.test(set_));
  const failed = await app.exec(`return document.querySelector('.side.typesetting [role="alert"]')?.textContent.trim() ?? ''`);
  const pages = await until(() => app.exec(`return document.querySelectorAll('.side.typesetting .preview img, .side.typesetting .preview canvas, .side.typesetting .preview .page').length`), (n) => n > 0, 30000);
  check('the pages are made', pages > 0 && !failed, `${pages} ${failed}`);
  await sleep(1200);
  await app.screenshot('rich-text-headings-2-typeset');

  // ---- a heading made a point of a list is a heading no more ----
  await app.click(`${PROSE} .rich .rich-body p:nth-child(3)`);
  await app.paragraphKind('List');
  now = await until(drawn, (d) => d?.paragraphs[2]?.kind === 'item', 3000);
  check('a heading made a point of a list is a heading no more', now.paragraphs[2].kind === 'item' && now.paragraphs[2].heading === '', JSON.stringify(now.paragraphs[2]));
  await app.keys(['Control', 'z']);
  now = await until(drawn, (d) => d?.paragraphs[2]?.heading === '2', 3000);
  check('which undo takes back in one step', now.paragraphs[2].heading === '2' && now.paragraphs[2].kind === '', JSON.stringify(now.paragraphs[2]));

  // ---- the readable copy, and opened again ----
  const written = await drawn();
  await app.home();
  const orgPath = join(app.dataDir, 'projects', id, 'project.org');
  const org = await until(() => (existsSync(orgPath) ? readFileSync(orgPath, 'utf8') : ''), (text) => text.includes(':heading 2'), 20000);
  check(
    'the readable copy says of each paragraph that it is a heading, and has no headline for it',
    /#\+ATTR_GLAUKOPIS: :heading 1\nThe opening\n/.test(org) && /#\+ATTR_GLAUKOPIS: :heading 2 :align right\nThe programme\n/.test(org) && !/^\*+ The (opening|programme)/m.test(org),
    org.slice(org.indexOf('#+BEGIN_rich'), org.indexOf('#+BEGIN_rich') + 200),
  );
  await app.go(`#/project/${encodeURIComponent(id)}`);
  await app.waitFor(`${PROSE} .rich`, 10000);
  const shown = await until(drawn, (d) => !!d && d.shown && d.paragraphs.length === 4 && near(d.paragraphs[0].size, written.paragraphs[0].size, 0.05), 8000);
  await app.screenshot('rich-text-headings-3-shown');
  check(
    'where the text is only shown the headings are drawn the same',
    shown.shown && shown.paragraphs.every((p, i) => p.heading === written.paragraphs[i].heading && near(p.size, written.paragraphs[i].size, 0.05) && p.weight === written.paragraphs[i].weight && p.align === written.paragraphs[i].align),
    JSON.stringify(shown.paragraphs.map((p) => [p.heading, p.size, p.weight, p.align])),
  );
  await app.click(`${PROSE} .rich p:nth-child(2)`);
  await app.waitFor(`${PROSE} .rich .rich-head`, 5000);
  await sleep(400);
  const pressed = await drawn();
  check(
    'pressed, the editor takes its place and nothing moves',
    !pressed.shown && pressed.height === shown.height && pressed.paragraphs.every((p, i) => p.top === shown.paragraphs[i].top),
    `${shown.height} ${pressed.height} ${JSON.stringify(shown.paragraphs.map((p) => p.top))} ${JSON.stringify(pressed.paragraphs.map((p) => p.top))}`,
  );

  const errors = await app.pageErrors();
  check('the page said nothing was wrong', errors.length === 0, JSON.stringify(errors).slice(0, 400));
} catch (e) {
  check('the script ran to its end', false, e?.message ?? String(e));
  await app.screenshot('rich-text-headings-stopped').catch(() => {});
} finally {
  await app.close().catch(() => {});
}

const failedChecks = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failedChecks.length} of ${checks.length} checks passed`);
process.exit(failedChecks.length ? 1 : 0);
