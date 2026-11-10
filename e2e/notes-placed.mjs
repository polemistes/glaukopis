// Where the notes of a document stand, as Look says: at the foot of the page
// or at the end of the text, and back again, in the Typst of the preview;
// the same in a document brought in from a file, whose notes follow Look as
// the notes written here do.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch({ width: 1440, height: 900 });

/** The Typst of the preview, as last made; nothing before it is. */
function typst() {
  const found = execFileSync('find', [app.dataDir, '-name', 'document.typ'], { encoding: 'utf8' })
    .trim()
    .split('\n')[0];
  return found ? readFileSync(found, 'utf8') : '';
}
/** Waits until the Typst of the preview holds what is asked, or not. */
async function typstHas(pattern, yes = true, ms = 20000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (pattern.test(typst()) === yes) return true;
    await sleep(300);
  }
  return false;
}
const FOOT = /#footnote\[/;

// A text with two notes, as another program saves it.
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
writeFileSync(
  join(desk, 'wanderer.md'),
  '# The wanderer\n\nHe saw the cities of many men.[^1] And he suffered much at sea.[^2]\n\n[^1]: And learned their minds.\n\n[^2]: As Nagy says elsewhere.\n',
);
execFileSync('pandoc', ['wanderer.md', '-o', 'wanderer.odt'], { cwd: desk });

try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Odyssey');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(400);
  const body = '.text-view .section .body';
  await app.click(body);
  await app.waitFor(`${body} .prose[contenteditable="true"]`);
  await sleep(200);
  await app.keys('Tell me, Muse, of the man of many ways.');
  await app.keys(['Control', 'Alt', 'f']);
  await app.waitFor('.note-panel .prose');
  await app.keys('Polytropos.');
  await app.press('Escape');
  await app.waitGone('.note-panel');
  await sleep(300);

  await app.keys(['Control', 't']);
  await app.waitFor('.preview .page', 30000);
  check('the note stands at the foot of the page, as the layout has it', await typstHas(FOOT));
  await app.openLook('Notes and citations');
  await app.lookChoose('Notes stand', 'endnotes');
  check('set to stand at the end of the text, it is no footnote', await typstHas(FOOT, false));
  await app.screenshot('notes-placed-1-end');
  await app.lookChoose('Notes stand', 'footnotes');
  check(
    'set to stand at the foot of the page again, it is a footnote again',
    await typstHas(FOOT),
    typst().slice(-600),
  );
  await app.screenshot('notes-placed-2-foot');

  // ---- a document brought in from a file ----
  await app.openLook();
  await app.keys(['Control', 'Shift', 'a']);
  await app.waitGone('.side .look', 3000).catch(() => {});
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
    [join(desk, 'wanderer.odt')],
    at.x,
    at.y,
  );
  await app.waitFor('dialog [data-fact="words"]', 20000);
  await sleep(300);
  await app.screenshot('notes-placed-3-bring-in');
  await app.clickText('dialog footer button', 'Bring it in');
  await app.waitGone('dialog[open]', 15000);
  await sleep(600);
  const trees = await app.mapNames();
  const brought = trees.find((n) => n !== 'Odyssey') ?? trees[trees.length - 1];
  await app.openMap(brought);
  await sleep(800);
  await app.screenshot('notes-placed-4-brought');
  const shownNotes = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .footnote')).map((n) => (n.dataset.place || '') + ':' + n.textContent)`,
  );
  console.log('notes in the text:', JSON.stringify(shownNotes));
  await sleep(1500);
  console.log('typst of the brought-in document:', typst().slice(-900));
  check('the notes brought in stand at the foot of the page, as the layout has it', await typstHas(FOOT));
  await app.openLook('Notes and citations');
  console.log('look says:', await app.lookChosen('Notes stand'));
  await app.lookChoose('Notes stand', 'endnotes');
  check('set to stand at the end of the text, they are no footnotes', await typstHas(FOOT, false));
  await app.lookChoose('Notes stand', 'footnotes');
  check('and at the foot of the page again, footnotes again', await typstHas(FOOT), typst().slice(-900));
  await app.screenshot('notes-placed-5-brought-foot');

  console.log(`\n${checks.filter((c) => c.ok).length} of ${checks.length} passed`);
  const errors = await app.pageErrors();
  if (errors.length) console.log('page errors:', errors);
} finally {
  await app.close();
}
process.exit(checks.every((c) => c.ok) ? 0 : 1);
