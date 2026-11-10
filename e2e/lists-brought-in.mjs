// A numbered list brought in from an ODT file, with paragraphs of text
// between its points: only the points are numbered, the paragraphs between
// them are set in under the point before them, and the count goes on past
// them, in the text and in the Typst of the preview. Both as LibreOffice
// writes such paragraphs (entries without a number, `text:list-header`)
// and as further paragraphs of an entry.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

// ---- the files ----
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
writeFileSync(join(desk, 'base.md'), '# Rules\n\n1. A placeholder.\n');
execFileSync('pandoc', ['base.md', '-o', 'base.odt'], { cwd: desk });
const unpacked = join(desk, 'base');
mkdirSync(unpacked);
execFileSync('unzip', ['-q', '../base.odt'], { cwd: unpacked });
const content = readFileSync(join(unpacked, 'content.xml'), 'utf8');
const style = content.match(/<text:list [^>]*>/)[0];
const p = (words) => `<text:p text:style-name="List_20_Number">${words}</text:p>`;
const item = (...ps) => `<text:list-item>${ps.join('')}</text:list-item>`;
const header = (words) => `<text:list-header>${p(words)}</text:list-header>`;
/** An ODT whose list is `list`, made from the one Pandoc wrote. */
function odt(name, list) {
  const from = content.indexOf('<text:list ');
  const to = content.indexOf('</text:list>') + '</text:list>'.length;
  writeFileSync(join(unpacked, 'content.xml'), content.slice(0, from) + list + content.slice(to));
  execFileSync('zip', ['-q', '-X', '-0', `../${name}`, 'mimetype'], { cwd: unpacked });
  execFileSync('zip', ['-q', '-X', '-r', `../${name}`, '.', '-x', 'mimetype'], { cwd: unpacked });
}
// As LibreOffice writes it: the paragraphs without a number between the entries.
odt(
  'unnumbered.odt',
  `${style}${item(p('First rule.'))}${header('Said of the first.')}${header('And more of it.')}${item(p('Second rule.'))}${header('Said of the second.')}${item(p('Third rule.'))}</text:list>`,
);
// Further paragraphs of an entry.
odt(
  'paragraphs.odt',
  `${style}${item(p('First rule.'), p('Said of the first.'), p('And more of it.'))}${item(p('Second rule.'), p('Said of the second.'))}${item(p('Third rule.'))}</text:list>`,
);

const app = await App.launch({ width: 1360, height: 900 });

/** The Typst of the preview, as last made. */
function typst() {
  // The one made last: each document in view has its own.
  const found = execFileSync('find', [app.dataDir, '-name', 'document.typ', '-printf', '%T@ %p\n'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .sort((a, b) => Number(a.split(' ')[0]) - Number(b.split(' ')[0]))
    .pop()
    ?.split(' ')
    .slice(1)
    .join(' ');
  return found ? readFileSync(found, 'utf8') : '';
}
async function typstHas(pattern, ms = 20000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (pattern.test(typst())) return true;
    await sleep(300);
  }
  return false;
}

try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Rules');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(400);

  const drop = async (file) => {
    const at = await app.exec(
      `const r = document.querySelector('.project .work .panes').getBoundingClientRect();
       return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
    );
    await app.execAsync(
      `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
       const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
       await emit('tauri://drag-enter', { paths: arguments[0], position });
       await emit('tauri://drag-over', { position });
       await emit('tauri://drag-drop', { paths: arguments[0], position });`,
      [join(desk, file)],
      at.x,
      at.y,
    );
    await app.waitFor('dialog [data-fact="words"]', 20000);
    await sleep(300);
    await app.exec(
      `const i = document.querySelector('dialog input');
       const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
       set.call(i, arguments[0]);
       i.dispatchEvent(new Event('input', { bubbles: true }));`,
      file,
    );
    await app.clickText('dialog footer button', 'Bring it in');
    await app.waitGone('dialog[open]', 15000);
    await sleep(600);
    await app.openMap(file);
    await sleep(900);
  };
  /** The paragraphs of the text in view: the number shown before each, its kind, its indent, its words. */
  const paragraphs = () =>
    app.exec(
      `return Array.from(document.querySelectorAll('.text-view .section .body .prose p')).map((p) => {
         // The number the style sheet puts before a point: written, or counted on from one given.
         return [p.dataset.kind ?? 'text', p.dataset.indent ?? '0', p.textContent.trim(), p.dataset.number ?? p.dataset.given ?? ''];
       })`,
    );
  const RULES = [
    ['numbered', '0', 'First rule.'],
    ['text', '1', 'Said of the first.'],
    ['text', '1', 'And more of it.'],
    ['numbered', '0', 'Second rule.'],
    ['text', '1', 'Said of the second.'],
    ['numbered', '0', 'Third rule.'],
  ];

  for (const [file, how] of [
    ['unnumbered.odt', 'as LibreOffice writes paragraphs without a number'],
    ['paragraphs.odt', 'as further paragraphs of an entry'],
  ]) {
    await drop(file);
    const read = await paragraphs();
    check(
      `${how}: only the points are numbered, the paragraphs between them set in under the point before`,
      JSON.stringify(read.map((r) => r.slice(0, 3))) === JSON.stringify(RULES),
      JSON.stringify(read),
    );
    check(
      `${how}: and the points are 1, 2 and 3`,
      JSON.stringify(read.map((r) => r[3])) === JSON.stringify(['1', '', '', '2', '', '3']),
      JSON.stringify(read.map((r) => r[3])),
    );
    await app.screenshot(`lists-brought-in-${file.replace('.odt', '')}`);
    // Where it is written, the same.
    await app.click('.text-view .section .body p');
    await app.waitFor('.text-view .section .body .ProseMirror[contenteditable="true"]', 5000);
    await sleep(400);
    const written = await paragraphs();
    check(
      `${how}: where it is written, the second and the third point count on from their numbers`,
      JSON.stringify(written.map((r) => (r[0] === 'numbered' ? r[3] : '-'))) ===
        JSON.stringify(['', '-', '-', '2', '-', '3']),
      JSON.stringify(written),
    );
    await app.screenshot(`lists-brought-in-${file.replace('.odt', '')}-written`);
    await app.press('Escape');
    await app.keys(['Control', 't']);
    await app.waitFor('.preview .page', 30000);
    check(
      `${how}: in the document the count goes on past them, 2 and 3`,
      (await typstHas(/Third rule/)) &&
        /start: 2\)\s*\+ Second rule/.test(typst()) &&
        /start: 3\)\s*\+ Third rule/.test(typst()) &&
        /inset: \(left: [^)]+\)\)\[\s*Said of the first/.test(typst()),
      typst().slice(typst().indexOf('<gk-front>\n') + 11),
    );
    await app.screenshot(`lists-brought-in-${file.replace('.odt', '')}-preview`);
    await app.keys(['Control', 't']);
    await sleep(400);
  }

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('lists-brought-in-failure').catch(() => {});
} finally {
  await app.close();
}
console.log(`\n${checks.filter((c) => c.ok).length} of ${checks.length} passed`);
process.exit(checks.every((c) => c.ok) ? 0 : 1);
