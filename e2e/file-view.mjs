// A file in a view (ADR 0069): a PDF and an image of the library shown in a side of the window,
// turned and zoomed, its text copied, kept with the window, and shown from the ways in.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
const png = join(root, 'resources/brand/owl.png');
const shape = join(root, 'e2e/fixtures/shape.pdf');
const porson = join(root, 'e2e/fixtures/porson.pdf');
// An image of one red dot, made here: a file the tabs have not had.
const dotDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-file-view-dot-'));
const dot = join(dotDir, 'dot.png');
writeFileSync(dot, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'));

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
      drawn: Array.from(side.querySelectorAll('.page[data-page] canvas[data-drawn]')).filter((i) => i.dataset.drawn.startsWith('blob:')).map((i) => Number(i.closest('.page').dataset.page)),
      width: side.querySelector('.page[data-page="1"]')?.getBoundingClientRect().width ?? 0,
      lines: side.querySelectorAll('[data-page-text] .line').length,
      kinds: Array.from(document.querySelectorAll('[data-side-key]')).map((s) => (s.matches('[data-file-side]') ? 'file' : 'map')),
    };
  `);

let app = await App.launch({ dataDir, keepData: true });
let pdfHash = '';
let pngHash = '';
let shapeHash = '';
let porsonHash = '';
let dotHash = '';
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
  check('the file comes beside the map, among the sources of its project', first.kinds.join() === 'map,file', first.kinds.join());
  check('the bar says the page and how many', /^Page 1 of \d+/.test(first.bar), first.bar);
  check('the first page is drawn by the core, in colour', first.drawn.includes(1));
  const cell = await app.exec(`return document.querySelector('.top .cell [data-path][data-file] [data-crumb-last] .name')?.textContent.trim()`);
  check('the path over the side names the file', /structure/.test(cell ?? ''), cell);
  const named = await app.exec(`return document.querySelector('.top .cell [data-path][data-file]')?.dataset.projectName`);
  check('and knows the project whose tabs these are, without naming it', named === 'Wrath and the hero' && !(await app.exists('.top .cell [data-path][data-file] [data-crumb="project"]')), named);
  const tabWords = await until('the tab named by its reference', async () => {
    const tab = await app.exec(`const t = document.querySelector('[data-file-side] [data-tab][aria-selected="true"]'); return t ? { name: t.querySelector('.name').textContent.trim(), title: t.title } : null`);
    return tab?.name === 'Lord 1960' ? tab : null;
  }, 5000).catch(async () => app.exec(`const t = document.querySelector('[data-file-side] [data-tab][aria-selected="true"]'); return t ? { name: t.querySelector('.name').textContent.trim(), title: t.title } : null`));
  check('the tab of a file of a reference is named by it, its title and the file in the tooltip', tabWords?.name === 'Lord 1960' && /Singer of Tales/.test(tabWords?.title ?? '') && /structure\.pdf/.test(tabWords?.title ?? ''), JSON.stringify(tabWords));
  // The text of a project just made takes the focus a moment later; the place follows the side that has it.
  await app.click('[data-viewer-pages]');
  const placeNow = await until('the place of the file', async () => {
    const hash = await app.exec('return location.hash');
    return hash.startsWith(`#/file/${pdfHash}`) ? hash : null;
  }, 3000).catch(async () => app.exec('return location.hash'));
  check('the place names the file', placeNow.startsWith(`#/file/${pdfHash}`), placeNow);
  check('the document pane stays closed', !(await app.exists('[data-document-pane]')));
  await app.screenshot('file-view-1-pdf');

  // ---- turning and zooming, from the keys ----
  await app.click('[data-viewer-pages]');
  await app.press('PageDown');
  const second = await until('page 2', async () => {
    const s = await fileSide(app);
    return s?.page === 2 ? s : null;
  });
  check('PageDown turns to the next page', second.page === 2);
  check('the place still names the file', (await app.exec('return location.hash')).startsWith(`#/file/${pdfHash}`));
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

  // ---- zooming about the pointer: the wheel, the field, the menu ----
  /** What lies under a point of the view: the page, and where on it, as fractions of its size. */
  const under = (selector, sx, sy) =>
    app.exec(`
      const el = document.querySelector(arguments[0]);
      const box = el.getBoundingClientRect();
      const x = box.left + box.width * arguments[1], y = box.top + box.height * arguments[2];
      const hit = document.elementsFromPoint(x, y).find((e) => e.matches('.page[data-page], [data-viewer-image] canvas, [data-viewer-image] img'));
      if (!hit) return null;
      const r = hit.getBoundingClientRect();
      return { page: Number(hit.dataset.page ?? 1), fx: (x - r.left) / r.width, fy: (y - r.top) / r.height, width: r.width };`, selector, sx, sy);
  /** A turn of the wheel with Ctrl held, at a point of the view. */
  const wheel = (selector, sx, sy, deltaY) =>
    app.exec(`
      const el = document.querySelector(arguments[0]);
      const box = el.getBoundingClientRect();
      el.dispatchEvent(new WheelEvent('wheel', { deltaY: arguments[3], ctrlKey: true, bubbles: true, cancelable: true,
        clientX: box.left + box.width * arguments[1], clientY: box.top + box.height * arguments[2] }));`, selector, sx, sy, deltaY);
  const same = (a, b) => a && b && a.page === b.page && Math.abs(a.fx - b.fx) < 0.02 && Math.abs(a.fy - b.fy) < 0.02;
  const pdfBefore = await under('[data-viewer-pages]', 0.7, 0.35);
  // While the wheel turns, nothing in the document is made anew: counted while the burst runs.
  await app.exec(`
    const column = document.querySelector('[data-viewer-pages] .column');
    const counts = (window.__zoomCounts = { pagesRemoved: 0, picturesAdded: 0 });
    const mo = new MutationObserver((muts) => { for (const m of muts) {
      for (const n of m.removedNodes) if (n.nodeType === 1 && n.matches('.page')) counts.pagesRemoved++;
      for (const n of m.addedNodes) if (n.nodeType === 1 && (n.matches('canvas') || n.querySelector?.('canvas'))) counts.picturesAdded++;
    } });
    mo.observe(column, { childList: true, subtree: true });
    window.__zoomCountsStop = () => mo.disconnect();`);
  // The small, quick turns of a touchpad, in a burst.
  for (let i = 0; i < 6; i++) {
    await wheel('[data-viewer-pages]', 0.7, 0.35, -25);
    await sleep(20);
  }
  const midway = await app.exec(`const p = document.querySelector('[data-viewer-pages] .page[data-page]'); return { transform: p?.style.transform ?? '', zoomed: Array.from(document.querySelectorAll('[data-viewer-pages] .page')).map((e) => e.classList.contains('zooming')) }`);
  check('while the wheel turns, the pages are shown scaled by a transform, laid out as they were', /scale\(/.test(midway.transform) && midway.zoomed.every(Boolean), JSON.stringify(midway));
  const pdfMidway = await under('[data-viewer-pages]', 0.7, 0.35);
  check('and the place under the pointer stays under it meanwhile', same(pdfBefore, pdfMidway), JSON.stringify([pdfBefore, pdfMidway]));
  // Once the zoom rests, the pages are laid out at the new size, the transform taken off.
  await sleep(500);
  const counts = await app.exec(`window.__zoomCountsStop(); return window.__zoomCounts`);
  check('no page was removed and no picture made anew by the turns', counts.pagesRemoved === 0 && counts.picturesAdded === 0, JSON.stringify(counts));
  const rested = await app.exec(`return Array.from(document.querySelectorAll('[data-viewer-pages] .page')).map((e) => e.style.transform || '')`);
  check('once it rests, the pages are laid out anew without a transform', rested.length > 0 && rested.every((t) => !t), JSON.stringify(rested));
  const pdfAfter = await under('[data-viewer-pages]', 0.7, 0.35);
  check('Ctrl and the wheel zoom the pages in', pdfAfter?.width > pdfBefore?.width * 1.3, `${Math.round(pdfBefore?.width)} → ${Math.round(pdfAfter?.width)}`);
  check('the place under the pointer stays under it', same(pdfBefore, pdfAfter), JSON.stringify([pdfBefore, pdfAfter]));
  for (let i = 0; i < 6; i++) {
    await wheel('[data-viewer-pages]', 0.3, 0.6, 25);
    await sleep(20);
  }
  await sleep(100);
  const pdfOut = await under('[data-viewer-pages]', 0.3, 0.6);
  check('turned the other way, the pages zoom out', pdfOut?.width < pdfAfter?.width, `${Math.round(pdfAfter?.width)} → ${Math.round(pdfOut?.width)}`);
  await sleep(400);
  const widthAtRest = await fileSide(app);
  check('the pages are drawn again once the zoom rests', widthAtRest.drawn.includes(1));
  // The field takes any percent.
  await app.click('[data-viewer-zoom-field]');
  await app.keys('100');
  await app.press('Enter');
  await sleep(300);
  const hundred = (await fileSide(app)).width;
  await app.click('[data-viewer-zoom-field]');
  await app.keys('250');
  await app.press('Enter');
  await sleep(300);
  const twoFifty = (await fileSide(app)).width;
  check('a percent written in the field zooms to it', Math.abs(twoFifty / hundred - 2.5) < 0.02, `${Math.round(hundred)} → ${Math.round(twoFifty)}`);
  const field = await app.exec(`return document.querySelector('[data-viewer-zoom-field]').value`);
  check('the field shows the percent', field === '250', field);
  await app.click('[data-viewer-zoom-field]');
  await app.keys('12,5');
  await app.press('Enter');
  await sleep(300);
  const eighth = (await fileSide(app)).width;
  check('an eighth, written with a comma', Math.abs(eighth / hundred - 0.125) < 0.01, `${Math.round(eighth)}`);
  // The menu offers the steps, and fitting to the width.
  await app.click('[data-viewer-zoom]');
  await sleep(300);
  const items = await app.exec(`return Array.from(document.querySelectorAll('[role="menuitem"]')).map((m) => m.textContent.trim())`);
  check('the menu offers steps from an eighth to four times', ['12.5%', '25%', '50%', '100%', '200%', '400%'].every((p) => items.some((i) => i.startsWith(p))), items.join(' | '));
  await app.clickText('[role="menuitem"]', 'As wide as the view');
  await sleep(300);
  const fitted = await fileSide(app);
  check('fitted again from the menu', fitted.width > eighth && (await app.exec(`return document.querySelector('[data-viewer-zoom]').textContent.trim()`)) === 'As wide as the view');

  // ---- the field goes to a page ----
  await app.click('[data-viewer-go]');
  await app.keys('2');
  await app.press('Enter');
  await until('page 2 from the field', async () => (await fileSide(app))?.page === 2);
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

  // ---- closing the file side: the map stays ----
  await app.click('.top .cell:has([data-file]) [data-close-side]');
  await until('one side', async () => (await app.count('[data-side-key]')) === 1);
  check('closing the file side leaves the map as it was', !(await app.exists('[data-file-side]')) && (await app.exists('.text-view .section')));

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
  const image = await until('the image', () => app.exec(`const c = document.querySelector('[data-viewer-image] canvas'); return c?.dataset.drawn ? c.width : 0`), 10000);
  check('an image of the library is shown as one page', image > 0, `${image} wide`);
  await app.screenshot('file-view-4-image');
  const fitLabel = await app.exec(`return document.querySelector('[data-viewer-zoom]').textContent.trim()`);
  const fitPercent = Number(await app.exec(`return document.querySelector('[data-viewer-zoom-field]').value`));
  check('a large image is fitted whole, as small as that takes', fitLabel === 'The whole image in the view' && fitPercent > 0 && fitPercent < 50, `${fitLabel}, ${fitPercent}%`);
  const whole = await app.exec(`const i = document.querySelector('[data-viewer-image] canvas'), s = i.closest('[data-viewer-image]'); return i.getBoundingClientRect().height <= s.clientHeight && i.getBoundingClientRect().width <= s.clientWidth`);
  check('the whole image is in the view', whole);
  // At its own size it is larger than the side: the place under the pointer is kept.
  await app.click('[data-viewer-zoom-field]');
  await app.keys('100');
  await app.press('Enter');
  await sleep(300);
  const imageBefore = await under('[data-viewer-image]', 0.3, 0.4);
  for (let i = 0; i < 6; i++) {
    await wheel('[data-viewer-image]', 0.3, 0.4, -25);
    await sleep(20);
  }
  await sleep(100);
  const imageAfter = await under('[data-viewer-image]', 0.3, 0.4);
  check('the image zooms in with the wheel', imageAfter?.width > imageBefore?.width * 1.3, `${Math.round(imageBefore?.width)} → ${Math.round(imageAfter?.width)}`);
  check('the place of the image under the pointer stays under it', same(imageBefore, imageAfter), JSON.stringify([imageBefore, imageAfter]));
  await app.screenshot('file-view-4b-image-zoomed');
  // ---- the files of the library, from a menu of their own beside the chevron, with a field ----
  await app.click('.top [data-path][data-file] [data-path-files]');
  await app.waitFor('[data-files-menu] [data-library-trees]', 3000);
  check('the menu of files opens with the cursor in its field', await app.exec(`const a = document.activeElement; return !!a && a.tagName === 'INPUT' && !!a.closest('[data-files-menu]')`));
  // A file of a reference is named by it, its own name in the tooltip.
  const fileRows = await app.exec(`return Array.from(document.querySelectorAll('[data-library-trees] [data-tree-kind="file"]')).map((r) => r.title || r.querySelector('.name').textContent.trim())`);
  check('the files that can be shown are listed, images among them, the one shown marked', fileRows.some((n) => n.endsWith('.pdf')) && fileRows.some((n) => n.endsWith('.png')) && (await app.exists('[data-library-trees] [data-tree-row="file:' + pngHash + '"].current')), fileRows.join(' | '));
  await sleep(300); // the menu fades in
  await app.screenshot('file-view-4c-trees');
  await app.keys('structure');
  await sleep(300);
  const sought = await app.exec(`return Array.from(document.querySelectorAll('[data-library-trees] [data-tree-kind="file"]')).map((r) => r.title || r.querySelector('.name').textContent.trim())`);
  check('what is written in the field leaves the files that answer to it', sought.length === 1 && /structure/.test(sought[0]), sought.join(' | '));
  await app.press('Enter');
  const fromTree = await until('the PDF from the menu', async () => {
    const s = await fileSide(app);
    return s?.file === pdfHash && s.drawn.length ? s : null;
  }, 20000);
  check('Enter shows the file found in that side, and the menu closes', fromTree.kinds.join() === 'map,file' && !(await app.exists('[data-files-menu]')));
  // The chevron of a side has the projects alone; the menu of files stands over a map side too.
  await app.click('.top [data-path]:not([data-file]) [data-path-all]');
  await app.waitFor('[data-path-tree]', 3000);
  check('the chevron has the projects alone', !(await app.exists('[data-path-tree] [data-library-trees]')) && (await app.exists('.top [data-path]:not([data-file]) [data-path-files]')));
  await app.press('Escape');
  await sleep(200);
  await app.click('[data-viewer-pages]');
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

  // ---- from the files of the library: Add to a project's tabs…, a menu of projects (ADR 0074) ----
  // Two more PDFs, neither among the project's tabs.
  const more = await invoke(app, 'files_take_in', { paths: [shape, porson, dot], folder: null, structure: true, ticket: null });
  shapeHash = more.files.find((f) => f.name.startsWith('shape'))?.hash ?? '';
  porsonHash = more.files.find((f) => f.name.startsWith('porson'))?.hash ?? '';
  dotHash = more.files.find((f) => f.name.startsWith('dot'))?.hash ?? '';
  await app.go('#/files');
  await app.waitFor('[data-file-list] [data-hash]', 8000).catch(() => {});
  const notice = (pattern) =>
    until(`the notice ${pattern}`, () => app.exec(`return Array.from(document.querySelectorAll('.toast')).map((t) => t.querySelector('.message')?.textContent.trim()).find((t) => ${pattern}.test(t)) ?? null`), 5000).catch(() => null);
  const toProject = async (hash) => {
    await app.click(`[data-file-list] [data-hash="${hash}"]`);
    await app.waitFor(`.file-pane[data-file="${hash}"] [data-action="show"]`, 5000);
    await app.click('.file-pane [data-action="show"]');
    await app.waitFor('[role="menu"]', 3000);
    await sleep(250); // the menu slides in
    await app.clickText('[role="menuitem"]', 'Wrath and the hero');
  };
  await toProject(shapeHash);
  check('a PDF is added to the tabs of the project chosen', !!(await notice(/^Added to the tabs of Wrath and the hero$/)));
  const stayed = await app.exec(`return { place: location.hash, sides: document.querySelectorAll('[data-file-side], [data-side-key]').length }`);
  check('and the library stays as it was, nothing of the window shown', stayed.place.startsWith('#/files') && stayed.sides === 0, JSON.stringify(stayed));
  const keptTabs = await until('the tabs to be kept', async () => {
    const kept = await invoke(app, 'project_sources', { id: projectId });
    return kept?.tabs?.some((t) => t.file === shapeHash) ? kept : null;
  }, 5000).catch(() => null);
  check('the project keeps it among its tabs', !!keptTabs, JSON.stringify(keptTabs?.tabs?.map((t) => t.file)));
  await app.exec(`document.querySelectorAll('.toast .close').forEach((b) => b.click())`);
  await toProject(pdfHash);
  check('a file among the tabs already is not given twice: the notice says so', !!(await notice(/^Already in the tabs of Wrath and the hero$/)));
  await app.screenshot('file-view-6-added-to-tabs');
  await app.clickText('.toast button.action', 'Show');
  const fromFiles = await until('the window with the file', async () => {
    const s = await fileSide(app);
    return s?.file === pdfHash && (await app.exec('return location.hash')).startsWith('#/file/') ? s : null;
  }, 10000).catch(() => null);
  check('Show in the notice opens the project with the file among its tabs', !!fromFiles, JSON.stringify(fromFiles));
  const besideIt = await app.exec(`return document.querySelector('.top .cell [data-path][data-file]')?.dataset.projectName`);
  check('the tabs of the project chosen', besideIt === 'Wrath and the hero', besideIt);

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
    // The other side is whichever the text is not in: here the first, which the window kept from before.
    const textStays = await app.exec(`return !!document.querySelector('[data-side-key]:not([data-file-side]) .box .text .prose, [data-side-key]:not([data-file-side]) .diagram')`);
    check(
      'from a citation the file comes in the other side, and the map stays',
      [...(fromCitation?.kinds ?? [])].sort().join() === 'file,map' && textStays,
      fromCitation?.kinds.join(),
    );
    await app.screenshot('file-view-6-from-citation');
  }
  await app.press('Escape');
  await sleep(300);

  // ---- the plus of the tabs: files of the library, several chosen by name (ADR 0074); Split view offers none ----
  await app.click('.top button[data-side-by-side]');
  await app.waitFor('.menu [role="menuitem"]', 3000);
  const offered = await app.exec(`return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).map((m) => m.textContent.trim())`);
  check("Split view offers the project's tabs, and no files", offered.some((o) => /The project's tabs/.test(o)) && !offered.some((o) => /files/i.test(o)), offered.join(' | '));
  await app.press('Escape');
  await sleep(200);
  await app.click('[data-file-side] [data-tab-add]');
  await app.waitFor('[data-file-chooser]', 5000);
  const choosable = () => app.exec(`return Array.from(document.querySelectorAll('[data-file-chooser] [data-choose-file]')).map((e) => e.dataset.chooseFile)`);
  const offeredFiles = await choosable();
  check('the files among the tabs already are not offered', offeredFiles.some((n) => n.startsWith('porson')) && offeredFiles.some((n) => n.startsWith('dot')) && !offeredFiles.some((n) => n.startsWith('structure') || n.startsWith('shape')), offeredFiles.join(' | '));
  await app.keys('porson');
  await sleep(300);
  await app.click('[data-choose-file]');
  await app.exec(`const i = document.querySelector('dialog .search input'); i.select();`);
  await app.keys('dot');
  await sleep(300);
  await app.click('[data-choose-file]');
  const button = await app.text('[data-choose-add]');
  check('two chosen, one after the other, the button says so', /Add 2 files/.test(button), button);
  await app.screenshot('file-view-7-chooser');
  await app.click('[data-choose-add]');
  await until('the image beside', () => app.exec(`const c = document.querySelector('[data-viewer-image] canvas'); return c?.dataset.drawn ? c.width : 0`), 10000);
  const tabsNow = await app.exec(`return Array.from(document.querySelectorAll('[data-file-side] [data-tab]')).map((t) => t.dataset.tabFile)`);
  check('both come among the tabs in the order chosen, the last shown', tabsNow.indexOf(porsonHash) >= 0 && tabsNow.indexOf(dotHash) === tabsNow.indexOf(porsonHash) + 1, JSON.stringify(tabsNow));

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
rmSync(dotDir, { recursive: true, force: true });
mkdirSync(join(root, 'e2e', 'output'), { recursive: true });
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
