// Breaks, elements across projects, and the pane of projects (ADR 0033): the
// break within a paragraph is drawn with a sign that is not text; a regular
// expression finds across a paragraph break with \p, and a replacement joins
// and splits paragraphs and takes a break away; the pane of projects opens
// with Ctrl+Shift+L, marks the project that is open and opens another with a
// click, staying open; an element copied in one project is pasted in another
// with its text; and the menu of an element offers the other projects.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const ELEMENT = 'element-6066-11e4-a52e-4f735466cecf';

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
    await sleep(100);
  }
}

const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
const data = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-'));
writeFileSync(
  join(desk, 'wrath.md'),
  `---
title: The wrath
---
Sing, goddess,
the wrath of Achilles.

A second paragraph begins.

# One

Under one, a text.
`,
);

const app = await App.launch({ width: 1360, height: 900, dataDir: data, env: { GLAUKOPIS_LANGUAGE: 'en' } });
try {
  await app.installErrorHook();
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
  const said = () => app.exec(`return document.querySelector('.search-bar .said')?.textContent.trim() ?? null`);
  /** The paragraphs of the text of the document's top element, a tree under the project. */
  const paragraphs = () =>
    app.exec(
      `const s = Array.from(document.querySelectorAll('.text-view .section')).find((e) => e.querySelector('.heading .title')?.textContent.trim() === 'The wrath'); return Array.from(s.querySelectorAll('.body p')).map((p) => p.textContent)`,
    );
  const fill = async (index, words) => {
    await app.exec(`const i = document.querySelectorAll('.search-bar input')[arguments[0]]; i.focus(); i.select();`, index);
    await app.keys(words);
    await sleep(700);
  };

  // ---- a project of the document ----
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(300);
  const at = await app.exec(
    `const r = document.querySelector('.project .work .panes').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }`,
  );
  await drop([join(desk, 'wrath.md')], at.x, at.y);
  await app.waitFor('dialog [data-fact="words"]', 15000);
  // The document is brought in as a tree under the project, and shown in the text.
  await app.clickText('dialog footer button', 'Bring it in');
  await app.waitGone('dialog[open]', 15000);
  await app.waitForText('.text-view .section .heading .title', 'The wrath', 8000);
  await sleep(800);

  // ---- the break within a paragraph is drawn, and is not text ----
  const sign = await app.exec(
    `const b = document.querySelector('.text-view .hard-break');
     if (!b) return null;
     const p = b.closest('p');
     return { sign: getComputedStyle(b, '::before').content, text: p.textContent, lines: p.getClientRects().length && Math.round(p.getBoundingClientRect().height) }`,
  );
  check('the break within a paragraph is drawn with ↵', !!sign && sign.sign.includes('↵'), JSON.stringify(sign));
  check('which is not text', !!sign && !sign.text.includes('↵'), sign?.text);
  check('the text has its two paragraphs', (await paragraphs()).length === 2, JSON.stringify(await paragraphs()));
  await app.screenshot('breaks-1-sign');

  // ---- \p finds across a paragraph break ----
  await app.click('.text-view .section .body');
  await sleep(200);
  await app.keys(['Control', 'h']);
  await app.waitFor('.search-bar input', 3000);
  await app.click('.search-bar button[aria-label^="A regular expression"]');
  await fill(0, 'Achilles\\.\\pA second');
  check('a regular expression finds across a paragraph break with \\p', (await said()) === '1 of 1', await said());
  const marked = await app.exec(`let m = ''; for (const r of CSS.highlights.get('search-current') ?? []) m = r.toString(); return m`);
  check('and marks it across the paragraphs', /Achilles\.[\s\S]*A second/.test(marked), JSON.stringify(marked));
  await app.screenshot('breaks-2-across');

  // ---- replacing joins and splits paragraphs, and takes a break away ----
  await fill(1, 'Achilles. A second');
  await app.clickText('.search-bar button', 'Replace all');
  await sleep(800);
  let paras = await paragraphs();
  check('replacing across a paragraph break joins the paragraphs', paras.length === 1 && paras[0].includes('Achilles. A second'), JSON.stringify(paras));
  await fill(0, 'goddess,\\nthe');
  check('\\n finds the break within a paragraph', (await said()) === '1 of 1', await said());
  await fill(1, 'goddess, the');
  await app.clickText('.search-bar button', 'Replace all');
  await sleep(800);
  check('and replacing it takes the break away', (await app.exec(`return document.querySelectorAll('.text-view .section .hard-break').length`)) === 0);
  await fill(0, 'begins\\.');
  await fill(1, 'begins.\\pA third.\\nWith a break.');
  await app.clickText('.search-bar button', 'Replace all');
  await sleep(800);
  paras = await paragraphs();
  check('\\p in what replaces splits the paragraph', paras.length === 2 && paras[1].startsWith('A third.'), JSON.stringify(paras));
  check('and \\n makes a break within it', (await app.exec(`return document.querySelectorAll('.text-view .section .hard-break').length`)) === 1);
  await app.keys(['Escape']);
  await sleep(300);

  // ---- the pane of projects ----
  check('the list of projects is shown at first', await app.exists('[data-projects-pane]'));
  await app.keys(['Control', 'Shift', 'l']);
  await app.waitGone('[data-projects-pane]', 3000);
  check('Ctrl+Shift+L hides it', !(await app.exists('[data-projects-pane]')));
  await app.keys(['Control', 'Shift', 'l']);
  await app.waitFor('[data-projects-pane]', 3000);
  const current = await app.exec(`return document.querySelector('[data-projects-pane] [data-current]')?.textContent.trim() ?? null`);
  check('and shows it again, with the project that is open marked', !!current && current.includes('Wrath'), current);
  check('and its button says it is shown', (await app.exec(`return document.querySelector('[data-projects-button]')?.getAttribute('aria-pressed')`)) === 'true');
  await app.screenshot('breaks-3-pane');

  // A second project, made from the start screen.
  await app.beginProject();
  await app.type('dialog input', 'Odyssey');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);
  check('the pane is open in the other project too', await app.exists('[data-projects-pane]'));
  const row = (name) =>
    app.exec(
      `return Array.from(document.querySelectorAll('[data-projects-pane] [data-project]')).find((r) => r.textContent.includes(arguments[0])) || null`,
      name,
    ).then((r) => r?.[ELEMENT] ?? null);

  // ---- an element copied in one project is pasted in another ----
  await app.click(await row('Wrath'));
  await until('Wrath open', async () => (await app.exec(`return document.querySelector('[data-projects-pane] [data-current]')?.textContent ?? ''`)).includes('Wrath'));
  await app.waitFor('[data-bar] [data-view]', 8000);
  await sleep(500);
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(400);
  await app.click(await app.findByText('.diagram .node', 'One'));
  await sleep(150);
  await app.keys(['Control', 'c']);
  await sleep(200);
  await app.click(await row('Odyssey'));
  await until('Odyssey open', async () => (await app.exec(`return document.querySelector('[data-projects-pane] [data-current]')?.textContent ?? ''`)).includes('Odyssey'));
  await sleep(500);
  if (!(await app.exists('.diagram .node.root'))) {
    await app.view('diagram');
    await app.waitFor('.diagram .node.root', 8000);
  }
  await sleep(300);
  await app.click('.diagram .node.root');
  await sleep(150);
  await app.keys(['Control', 'v']);
  await sleep(600);
  const pasted = await app.exec(`return Array.from(document.querySelectorAll('.diagram .node')).some((n) => n.textContent.includes('One'))`);
  check('an element copied in one project is pasted in another', pasted);
  await app.view('text');
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);
  const text = await app.exec(
    `return Array.from(document.querySelectorAll('.text-view .section')).map((s) => s.textContent).find((t) => t.includes('One')) ?? null`,
  );
  check('with its text', !!text && text.includes('Under one, a text.'), text);
  await app.screenshot('breaks-4-pasted');

  // ---- the menu of an element offers the project, its trees and the other projects ----
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.rightClick(await app.findByText('.diagram .node', 'One'));
  await app.waitFor('.menu');
  await sleep(200);
  await app.clickText('.menu [role="menuitem"]', 'Copy to');
  await sleep(400);
  const offered = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.textContent.trim())`);
  check('Copy to offers the project itself', offered.some((m) => m === 'Odyssey'), offered.join(' | '));
  check('and the other projects', offered.some((m) => m.includes('Wrath')), offered.join(' | '));
  // Another project chosen: the element goes there at once, under its project element.
  await app.clickText('.menu [role="menuitem"]', 'Wrath');
  const toast = await until('the toast of the copy', () => app.exec(`return Array.from(document.querySelectorAll('.toast, [role="status"]')).map((t) => t.textContent).find((t) => /copied/i.test(t)) ?? null`), 15000);
  check('and copies the element there', !!toast, toast);
  await app.screenshot('breaks-5-copied');

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('breaks-failure').catch(() => {});
} finally {
  await app.close();
  if (!process.env.GLAUKOPIS_E2E_KEEP) {
    rmSync(data, { recursive: true, force: true });
    rmSync(desk, { recursive: true, force: true });
  }
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
