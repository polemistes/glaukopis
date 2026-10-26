// A file in a view (ADR 0069): a PDF and an image of the library shown in a side of the window,
// turned and zoomed, its text copied, kept with the window, and shown from the ways in.

import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-file-view-'));
const pdf = join(root, 'e2e/fixtures/structure.pdf');
const png = join(root, 'src/lib/shell/owl-small.png');

const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
const until = async (what, test, ms = 8000) => {
  const start = Date.now();
  for (;;) {
    const got = await test();
    if (got) return got;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
};
/** What the file side shows: its file, the page its bar says, the pages drawn. */
const fileSide = (app) =>
  app.exec(`
    const side = document.querySelector('[data-file-side]');
    if (!side) return null;
    return {
      file: side.dataset.fileSide,
      page: Number(side.querySelector('[data-viewer-page]')?.dataset.viewerPage ?? 0),
      bar: side.querySelector('[data-viewer-bar] .page')?.textContent.trim() ?? '',
      drawn: Array.from(side.querySelectorAll('.page[data-page] img')).filter((i) => i.src.startsWith('data:image/png')).map((i) => Number(i.closest('.page').dataset.page)),
      width: side.querySelector('.page[data-page="1"]')?.getBoundingClientRect().width ?? 0,
      lines: side.querySelectorAll('[data-page-text] .line').length,
      kinds: Array.from(document.querySelectorAll('[data-side-key]')).map((s) => (s.matches('[data-file-side]') ? 'file' : 'map')),
    };
  `);

let app = await App.launch({ dataDir, keepData: true });
let pdfHash = '';
let pngHash = '';
let projectId = '';
try {
  await app.installErrorHook();

  // ---- the library: references, a PDF attached to one, an image among the files ----
  const bib = readFileSync(join(root, 'e2e/fixtures/sample.bib'), 'utf8');
  await invoke(app, 'import_apply', { plan: await invoke(app, 'import_bib_text', { text: bib }) });
  const taken = await invoke(app, 'files_take_in', { paths: [pdf, png], folder: null, structure: true, ticket: null });
  pdfHash = taken.files.find((f) => f.name.endsWith('.pdf'))?.hash ?? '';
  pngHash = taken.files.find((f) => f.name.endsWith('.png'))?.hash ?? '';
  check('the PDF and the image are taken into the library', pdfHash && pngHash);
  const listing = await invoke(app, 'library_list');
  const singer = listing.entries.find((e) => /Singer of Tales/.test(e.title));
  await invoke(app, 'attachment_add', { id: singer.id, paths: [pdf] });

  // ---- a project, and the file shown in its side ----
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath and the hero');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  projectId = decodeURIComponent((await app.exec('return location.hash')).split('/')[2]);

  await app.execAsync(`window.__glaukopisViewer.show(arguments[0]);`, pdfHash);
  const first = await until('the first page drawn', async () => {
    const s = await fileSide(app);
    return s?.drawn.includes(1) ? s : null;
  }, 20000);
  check('the file takes the place of the map in the active side', first.kinds.join() === 'file', first.kinds.join());
  check('the bar says the page and how many', /^Page 1 of \d+/.test(first.bar), first.bar);
  check('the first page is drawn by the core, in colour', first.drawn.includes(1));
  const cell = await app.exec(`return document.querySelector('.top .cell [data-path][data-file] [data-crumb-last] .name')?.textContent.trim()`);
  check('the path over the side names the file', /structure/.test(cell ?? ''), cell);
  check('the place names the file', (await app.exec('return location.hash')).startsWith(`#/file/${pdfHash}`));
  check('the document pane is closed with no map shown', !(await app.exists('[data-document-pane]')));
  await app.screenshot('file-view-1-pdf');

  // ---- turning and zooming, from the keys ----
  await app.click('[data-viewer-pages]');
  await app.press('PageDown');
  const second = await until('page 2', async () => {
    const s = await fileSide(app);
    return s?.page === 2 ? s : null;
  });
  check('PageDown turns to the next page', second.page === 2);
  check('the place follows the page', (await app.exec('return location.hash')).endsWith('?page=2'));
  const before = second.width;
  await app.keys(['Control', '-']);
  await sleep(500);
  const smaller = await fileSide(app);
  check('Ctrl+- makes the pages smaller', smaller.width > 0 && smaller.width < before, `${Math.round(before)} → ${Math.round(smaller.width)}`);
  await app.keys(['Control', '0']);
  await sleep(300);
  await app.press('End');
  const last = await until('the last page', async () => {
    const s = await fileSide(app);
    const count = Number(/of (\d+)/.exec(s?.bar ?? '')?.[1] ?? 0);
    return s && count && s.page === count ? s : null;
  });
  check('End goes to the last page', !!last);
  await app.press('Home');
  await until('the first page again', async () => (await fileSide(app))?.page === 1);

  // ---- the field goes to a page ----
  await app.click('[data-viewer-go]');
  await app.keys('3');
  await app.press('Enter');
  await until('page 3 from the field', async () => (await fileSide(app))?.page === 3);
  check('the field goes to a page', true);
  await app.press('Home');
  await sleep(300);

  // ---- the text over the page ----
  const text = await until('the text of the first page', async () => {
    const s = await fileSide(app);
    return s?.lines ? s : null;
  }, 15000);
  check('the text of the page lies over it', text.lines > 3, `${text.lines} lines`);
  const copied = await app.exec(`
    const layer = document.querySelector('[data-page-text="1"]');
    const range = document.createRange();
    range.selectNodeContents(layer);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    return sel.toString();`);
  check('what is selected on the page is its words', /Short Treatise/.test(copied) && /Anna Lind/.test(copied), copied.slice(0, 60).replace(/\n/g, ' | '));
  check('a line is copied as a line', copied.split('\n').filter(Boolean).length > 3);
  await app.screenshot('file-view-2-text');
  await app.exec('getSelection().removeAllRanges()');

  // ---- closing the side: the map does not come back ----
  await app.click('.top .cell [data-close-side]');
  await until('the start screen', async () => (await app.exec('return location.hash')) === '#/');
  check('closing the file side closes the view, and the map does not reappear', !(await app.exists('[data-side-key]')));

  // ---- the project from the list, and the file beside it ----
  await app.openProject('Wrath and the hero');
  await app.waitFor('.text-view .section', 8000);
  await app.execAsync(`window.__glaukopisViewer.beside(arguments[0]);`, pdfHash);
  const beside = await until('the file beside', async () => {
    const s = await fileSide(app);
    return s?.drawn.includes(1) ? s : null;
  }, 20000);
  check('beside, the file is in a second side, the map in the first', beside.kinds.join() === 'map,file', beside.kinds.join());
  // The document pane, opened from the map's bar, is of the map while the file has the focus.
  await app.click('[data-side-key]:not([data-file-side]) [data-bar] button[aria-label="Document"]').catch(() => {});
  await app.click('[data-viewer-pages]');
  await sleep(400);
  const other = await app.exec(`return document.querySelector('[data-document-of-other]')?.textContent.trim() ?? null`);
  check('while the file has the focus, the document pane says it shows the other side', other === 'The document of the other side', String(other));
  await app.screenshot('file-view-3-beside');

  // ---- an image ----
  await app.execAsync(`window.__glaukopisViewer.show(arguments[0]);`, pngHash);
  const image = await until('the image', () => app.exec(`return document.querySelector('[data-viewer-image] img')?.naturalWidth ?? 0`), 10000);
  check('an image of the library is shown as one page', image > 0, `${image} wide`);
  await app.screenshot('file-view-4-image');
  await app.execAsync(`window.__glaukopisViewer.show(arguments[0]);`, pdfHash);
  await until('the PDF again', async () => (await fileSide(app))?.drawn.length > 0, 20000);
  await app.click('[data-viewer-pages]');
  await app.press('PageDown');
  await until('page 2 again', async () => (await fileSide(app))?.page === 2);
  await sleep(1500);
  await app.quit();
} catch (error) {
  console.log('FAIL  the first run stopped:', error?.message ?? error);
  checks.push({ name: 'the first run ran to the end', ok: false });
  await app.screenshot('file-view-stopped-1').catch(() => {});
  console.log('page errors:', JSON.stringify(await app.exec('return window.__glaukopisErrors ?? []').catch(() => [])).slice(0, 2000));
  await app.close();
}

// ---- the window as it was left ----
app = await App.launch({ dataDir, keepData: true });
try {
  await app.installErrorHook();
  const again = await until('the two sides again', async () => {
    const s = await fileSide(app);
    return s?.kinds.length === 2 && s.drawn.length ? s : null;
  }, 20000);
  check('the window comes back with the map and the file', again.kinds.join() === 'map,file', again.kinds.join());
  check('the file at the page it was left at', again.page === 2, `page ${again.page}`);
  await app.screenshot('file-view-5-as-left');

  // ---- from the files of the library: a double-click shows it in the active side ----
  await app.go('#/files');
  await app.waitFor('.list [data-file], .list .row, .list .item', 8000).catch(() => {});
  const row = await app.exec(`return Array.from(document.querySelectorAll('[role="row"], [role="option"], .row, .item')).find((r) => r.textContent.includes('structure')) ?? null`);
  if (row) await app.doubleClick(row);
  const fromFiles = await until('the window with the file', async () => {
    const s = await fileSide(app);
    return s && (await app.exec('return location.hash')).startsWith('#/file/') ? s : null;
  }, 10000).catch(() => null);
  check('a double-click among the files shows the PDF in the window', !!fromFiles);

  // ---- from a citation: the file beside the text ----
  await app.openProject('Wrath and the hero');
  await app.waitFor('.text-view .section', 8000);
  // One side, the map's: the file side closes first where the window kept two.
  for (const key of await app.exec(`return Array.from(document.querySelectorAll('[data-file-side]')).map((s) => s.dataset.sideKey)`)) {
    void key;
    await app.click('.top .cell:has([data-file]) [data-close-side]').catch(() => {});
    await sleep(300);
  }
  await app.view('diagram');
  await app.waitFor('.diagram .node.root', 8000);
  await app.doubleClick('.diagram .node.root');
  await app.waitFor('.box .text .prose');
  await sleep(250);
  await app.keys('The poem is composed in performance ');
  await app.click('.box [data-insert]');
  await app.clickText('.menu [role="menuitem"]', 'Citation');
  await app.waitFor('.picker input');
  await app.keys('singer');
  await sleep(400);
  await app.press('Enter');
  await app.waitFor('.editor .locator input', 5000);
  const showButton = await until('Show the file in the editor', () => app.exec(`return document.querySelector('.editor [data-show-file]')`), 5000).catch(() => null);
  check('the editor of a citation offers to show the work’s file', !!showButton);
  if (showButton) {
    await app.click(showButton);
    const fromCitation = await until('the file beside the text', async () => {
      const s = await fileSide(app);
      return s?.kinds.length === 2 ? s : null;
    }, 15000).catch(() => null);
    check('from a citation the file comes in the other side', fromCitation?.kinds.join() === 'map,file', fromCitation?.kinds.join());
    await app.screenshot('file-view-6-from-citation');
  }
  await app.press('Escape');
  await sleep(300);

  // ---- Split view: a file of the library, chosen by name ----
  await app.click('.top button[data-side-by-side]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  const offered = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.textContent.trim())`);
  check('Split view offers a file of the library', offered.some((o) => /A file of the library/.test(o)), offered.join(' | '));
  await app.clickText('.menu [role="menuitem"]', 'A file of the library');
  await app.waitFor('[data-file-chooser]', 5000);
  await app.keys('owl');
  await sleep(300);
  await app.screenshot('file-view-7-chooser');
  await app.click('[data-choose-file]');
  await until('the image beside', () => app.exec(`return document.querySelector('[data-viewer-image] img')?.naturalWidth ?? 0`), 10000);
  check('the file chosen in Split view comes in the new side', true);

  const errors = await app.exec('return window.__glaukopisErrors ?? []');
  if (errors.length) console.log('errors in the page:', JSON.stringify(errors).slice(0, 2000));
  await app.close();
} catch (error) {
  console.log('FAIL  the second run stopped:', error?.message ?? error);
  checks.push({ name: 'the second run ran to the end', ok: false });
  await app.screenshot('file-view-stopped-2').catch(() => {});
  console.log('page errors:', JSON.stringify(await app.exec('return window.__glaukopisErrors ?? []').catch(() => [])).slice(0, 2000));
  await app.close();
}

rmSync(dataDir, { recursive: true, force: true });
mkdirSync(join(root, 'e2e', 'output'), { recursive: true });
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
