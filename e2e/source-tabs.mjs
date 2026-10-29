// Sources in tabs (docs/plans/sources-in-tabs-bookmarks-and-the-scrolling-of-pages.md): the
// files read beside a text are the tabs of a file side, each at a place of its own, the sources
// of the project beside it; they follow the project beside, stay when its map closes, and come
// back with the window. Bookmarks are of the file, the same in every project; the file's own
// contents beside them.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-source-tabs-'));
const structure = join(root, 'e2e/fixtures/structure.pdf');
const porson = join(root, 'e2e/fixtures/porson.pdf');
const owl = join(root, 'resources/brand/owl.png');

const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);
const until = async (what, test, ms = 10000) => {
  const start = Date.now();
  for (;;) {
    const got = await test();
    if (got) return got;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
};
/** What the window shows: the kinds of its sides, the tabs of the file side, the page its bar says, the project its cell names. */
const shown = (app) =>
  app.exec(`
    const side = document.querySelector('[data-file-side]');
    const tabs = side ? Array.from(side.querySelectorAll('[data-tab]')) : [];
    const pages = side?.querySelector('[data-viewer-pages]');
    return {
      kinds: Array.from(document.querySelectorAll('[data-side-key]')).map((s) => (s.matches('[data-file-side]') ? 'file' : 'map')),
      tabs: tabs.map((t) => t.dataset.tabFile),
      ids: tabs.map((t) => t.dataset.tab),
      active: tabs.find((t) => t.getAttribute('aria-selected') === 'true')?.dataset.tab ?? null,
      file: side?.dataset.fileSide ?? null,
      page: Number(side?.querySelector('[data-viewer-page]')?.dataset.viewerPage ?? 0),
      scrolled: pages ? Math.round(pages.scrollTop) : null,
      drawn: side ? Array.from(side.querySelectorAll('.page[data-page] img')).filter((i) => i.complete && i.naturalWidth > 0).length : 0,
      image: !!side?.querySelector('[data-viewer-image] img'),
      project: document.querySelector('.top .cell [data-path][data-file] [data-crumb="project"] .name')?.textContent.trim() ?? null,
      focused: !!side?.classList.contains('focused') || document.querySelectorAll('[data-side-key]').length === 1,
      empty: side?.textContent.includes('No files here yet') ?? false,
    };`);
const clickTab = (app, id) => app.click(`[data-file-side] [data-tab="${id}"]`);
const anotherProject = async (app, name) => {
  await app.click('.top button[data-side-by-side]');
  await sleep(300);
  await app.clickText('.menu [role="menuitem"]', 'Another project…');
  await app.waitFor('dialog [data-beside-chooser] .row.project', 5000);
  await app.clickText('dialog [data-beside-chooser] .row.project', name);
  await app.waitGone('dialog [data-beside-chooser]', 3000);
  await sleep(600);
};

let app = await App.launch({ dataDir, keepData: true });
const hashes = {};
try {
  await app.installErrorHook();
  const taken = await invoke(app, 'files_take_in', { paths: [structure, porson, owl], folder: null, structure: true, ticket: null });
  for (const f of taken.files) hashes[f.name.split('.')[0]] = f.hash;
  check('three files are taken into the library', hashes.structure && hashes.porson && hashes.owl, Object.keys(hashes).join());

  // Two projects: Odyssey, then Wrath, which stays open.
  for (const name of ['Odyssey', 'Wrath']) {
    await app.beginProject();
    await app.waitFor('dialog input');
    await app.type('dialog input', name);
    await app.clickText('dialog footer button', 'Create');
    await app.waitFor('.text-view .section', 8000);
  }

  // ---- a file shown comes beside the text, as a tab ----
  await app.exec(`window.__glaukopisViewer.show(arguments[0])`, hashes.structure);
  let s = await until('the first tab', async () => {
    const got = await shown(app);
    return got.tabs.length === 1 && got.drawn ? got : null;
  }, 20000);
  check('a file comes beside the map, as the one tab of a file side', s.kinds.join() === 'map,file' && s.tabs.join() === hashes.structure, s.kinds.join());
  check('the file side has the focus, and its cell names the project', s.focused && s.project === 'Wrath', String(s.project));

  await app.exec(`window.__glaukopisViewer.show(arguments[0])`, hashes.porson);
  s = await until('a second tab', async () => ((await shown(app)).tabs.length === 2 ? shown(app) : null));
  check('another file is another tab, and is shown', s.tabs[1] === hashes.porson && s.active === s.ids[1] && s.file === hashes.porson);
  await app.exec(`window.__glaukopisViewer.show(arguments[0])`, hashes.structure);
  await sleep(500);
  s = await shown(app);
  check('a file shown again goes to its tab, and makes none', s.tabs.length === 2 && s.active === s.ids[0], s.tabs.length);

  // ---- a second tab of the same file, each at its own place ----
  await app.exec(`window.__glaukopisViewer.again(arguments[0])`, hashes.structure);
  s = await until('a third tab', async () => ((await shown(app)).tabs.length === 3 ? shown(app) : null));
  const [first, second, third] = s.ids;
  check('the same file again in a tab of its own, after the one shown', s.tabs.join() === [hashes.structure, hashes.structure, hashes.porson].join() && s.active === second);
  await until('its pages', async () => (await shown(app)).drawn > 0, 15000);
  await app.click('[data-file-side] [data-viewer-pages]');
  await app.press('PageDown');
  await until('page 2 in the second tab', async () => (await shown(app)).page === 2);
  await sleep(600);
  await clickTab(app, first);
  s = await until('the first tab again', async () => {
    const got = await shown(app);
    return got.active === first && got.drawn ? got : null;
  });
  check('the first tab of the file is where it was, at page 1', s.page === 1 && s.scrolled === 0, `page ${s.page}, scrolled ${s.scrolled}`);
  await clickTab(app, second);
  s = await until('the second tab again', async () => {
    const got = await shown(app);
    return got.active === second && got.drawn ? got : null;
  });
  check('the second tab of the same file is at its own place, page 2', s.page === 2 && s.scrolled > 0, `page ${s.page}, scrolled ${s.scrolled}`);

  // ---- the keys of the tabs ----
  await app.click('[data-file-side] [data-viewer-pages]');
  await app.keys(['Control', 'PageDown']);
  await sleep(400);
  check('Ctrl+PageDown shows the next tab', (await shown(app)).active === third);
  await app.keys(['Control', 'PageUp']);
  await sleep(400);
  check('Ctrl+PageUp the one before', (await shown(app)).active === second);

  // ---- the plus adds a file from the library ----
  await app.click('[data-file-side] [data-tab-add]');
  await app.waitFor('[data-file-chooser]', 5000);
  await app.keys('owl');
  await sleep(300);
  await app.click('[data-choose-file]');
  s = await until('the image in a tab', async () => {
    const got = await shown(app);
    return got.tabs.length === 4 && got.image ? got : null;
  }, 10000);
  check('the plus adds a file, an image here, in a tab', s.tabs.includes(hashes.owl) && s.file === hashes.owl);
  await app.screenshot('sources-1-tabs');

  // ---- the map closes: the file side keeps its project ----
  await app.click('.top .cell:not(:has([data-file])) [data-close-side]');
  s = await until('one side', async () => ((await shown(app)).kinds.length === 1 ? shown(app) : null));
  check('with the map closed, the file side stays and still names the project', s.kinds.join() === 'file' && s.project === 'Wrath' && s.tabs.length === 4, String(s.project));

  // ---- another project beside: the tabs follow it ----
  await anotherProject(app, 'Odyssey');
  s = await until('Odyssey beside', async () => ((await shown(app)).project === 'Odyssey' ? shown(app) : null));
  check('another project beside, the file side shows its sources, none yet', s.kinds.length === 2 && s.tabs.length === 0 && s.empty, `${s.kinds.join()}, ${s.tabs.length} tabs`);
  await app.screenshot('sources-2-after-switch');
  await app.click('[data-file-side]');
  await anotherProject(app, 'Wrath');
  s = await until('Wrath beside again', async () => {
    const got = await shown(app);
    return got.project === 'Wrath' && got.tabs.length === 4 ? got : null;
  });
  check('the first project beside again, its four tabs are back, the one shown last shown', s.file === hashes.owl, s.tabs.length);

  // ---- bookmarks: of the file, the same in every project ----
  await clickTab(app, second);
  await until('the second tab, at page 2', async () => {
    const got = await shown(app);
    return got.active === second && got.page === 2 && got.drawn ? got : null;
  });
  await app.click('[data-file-side] [data-viewer-pages]');
  await app.keys(['Control', 'Shift', 'b']);
  await app.waitFor('[data-viewer-places-list] [data-bookmark-name]', 3000);
  const offered = await app.exec(`return document.querySelector('[data-bookmark-name]').value`);
  check('Ctrl+Shift+B offers a bookmark named after the page', offered === 'Page 2', offered);
  await app.press('Enter');
  await until('the bookmark kept', () => app.exists('[data-viewer-places-list] [data-bookmark]'), 5000);
  await app.screenshot('sources-4-places');
  const contents = await app.exec(`return Array.from(document.querySelectorAll('[data-contents-page]')).map((c) => c.dataset.contentsPage + ':' + c.querySelector('.name').textContent.trim())`);
  check('the file’s own contents are listed under the bookmarks', contents.length === 4 && /Beginnings/.test(contents[0]), contents.join(' | '));
  await app.press('Escape');
  await sleep(300);
  await app.click('[data-file-side] [data-viewer-pages]');
  await app.press('Home');
  await until('page 1', async () => (await shown(app)).page === 1);
  await app.click('[data-file-side] [data-viewer-places]');
  await app.waitFor('[data-viewer-places-list] [data-bookmark-go]', 3000);
  await app.click('[data-viewer-places-list] [data-bookmark-go]');
  s = await until('the bookmark’s place', async () => ((await shown(app)).page === 2 ? shown(app) : null));
  check('a bookmark goes to its place', s.page === 2 && s.scrolled > 0, `page ${s.page}`);
  await app.click('[data-file-side] [data-viewer-places]');
  await app.waitFor('[data-viewer-places-list] [data-bookmark-menu]', 3000);
  await app.click('[data-viewer-places-list] [data-bookmark-menu]');
  await app.clickText('.menu [role="menuitem"]', 'Rename');
  await app.waitFor('[data-bookmark-rename]', 3000);
  await app.exec(`const i = document.querySelector('[data-bookmark-rename]'); i.value = 'The second section'; i.dispatchEvent(new Event('input', { bubbles: true }));`);
  await app.press('Enter');
  await until('the bookmark renamed', async () => (await app.exec(`return document.querySelector('[data-bookmark] .name')?.textContent.trim()`)) === 'The second section', 5000);
  check('a bookmark is renamed from its menu', true);
  await app.press('Escape');
  await sleep(300);
  // In another project, the same file has the same bookmark.
  await app.click('[data-file-side]');
  await anotherProject(app, 'Odyssey');
  await until('Odyssey beside', async () => (await shown(app)).project === 'Odyssey');
  await app.exec(`window.__glaukopisViewer.show(arguments[0])`, hashes.structure);
  await until('the file in Odyssey', async () => {
    const got = await shown(app);
    return got.file === hashes.structure && got.drawn ? got : null;
  }, 15000);
  await app.click('[data-file-side] [data-viewer-places]');
  await app.waitFor('[data-viewer-places-list]', 3000);
  const there = await app.exec(`return Array.from(document.querySelectorAll('[data-bookmark] .name')).map((n) => n.textContent.trim())`);
  check('the bookmark is there from another project', there.join() === 'The second section', there.join());
  // A heading of the contents goes to its page.
  await app.exec(`Array.from(document.querySelectorAll('[data-contents-page="2"]'))[0]?.click()`);
  await until('the heading’s page', async () => (await shown(app)).page === 2);
  check('a heading of the contents goes to its page', true);
  // Removed, it is gone everywhere.
  await app.click('[data-file-side] [data-viewer-places]');
  await app.waitFor('[data-viewer-places-list] [data-bookmark-menu]', 3000);
  await app.click('[data-viewer-places-list] [data-bookmark-menu]');
  await app.clickText('.menu [role="menuitem"]', 'Remove');
  await until('no bookmarks', async () => !(await app.exists('[data-viewer-places-list] [data-bookmark]')), 5000);
  check('a bookmark removed from its menu is gone', (await app.exec(`return document.querySelector('[data-viewer-places-list]')?.textContent.includes('No bookmarks yet')`)) === true);
  await app.press('Escape');
  await sleep(300);
  await app.click('[data-file-side]');
  await anotherProject(app, 'Wrath');
  await until('Wrath beside, once more', async () => {
    const got = await shown(app);
    return got.project === 'Wrath' && got.tabs.length === 4 ? got : null;
  });

  await clickTab(app, second);
  await until('the second tab before leaving', async () => (await shown(app)).active === second);
  await sleep(800);

  const errors = await app.exec('return window.__glaukopisErrors ?? []');
  if (errors.length) console.log('errors in the page:', JSON.stringify(errors).slice(0, 2000));
  check('no errors in the page', !errors.length);
  await app.quit();
} catch (error) {
  console.log('FAIL  the first run stopped:', error?.message ?? error);
  checks.push({ name: 'the first run ran to the end', ok: false });
  await app.screenshot('sources-stopped-1').catch(() => {});
  console.log('page errors:', JSON.stringify(await app.exec('return window.__glaukopisErrors ?? []').catch(() => [])).slice(0, 2000));
  await app.close();
}

// ---- the window as it was left ----
app = await App.launch({ dataDir, keepData: true });
try {
  await app.installErrorHook();
  let s = await until('the sides again', async () => {
    const got = await shown(app);
    return got.kinds.length === 2 && got.tabs.length && got.drawn ? got : null;
  }, 20000);
  check('the window comes back with the map and its sources in four tabs', s.tabs.length === 4 && s.project === 'Wrath', `${s.kinds.join()}, ${s.tabs.length} tabs`);
  check('the tab shown last is shown, at its place', s.active === s.ids[1] && s.page === 2, `page ${s.page}`);
  await app.screenshot('sources-3-as-left');

  // ---- Ctrl+W closes a tab, and the side with its last ----
  await app.click('[data-file-side] [data-viewer-pages]');
  await app.keys(['Control', 'w']);
  await sleep(500);
  s = await shown(app);
  check('Ctrl+W on a file side closes the tab shown', s.tabs.length === 3 && s.kinds.length === 2, `${s.tabs.length} tabs`);
  for (let i = 0; i < 3; i++) {
    await app.click('[data-file-side] [data-tab][aria-selected="true"] ~ [data-tab-close], [data-file-side] [data-tab-cell].shown [data-tab-close]');
    await sleep(400);
  }
  s = await shown(app);
  check('closing the last tab closes the side', s.kinds.join() === 'map', s.kinds.join());

  const errors = await app.exec('return window.__glaukopisErrors ?? []');
  if (errors.length) console.log('errors in the page:', JSON.stringify(errors).slice(0, 2000));
  check('no errors in the page, again', !errors.length);
  await app.close();
} catch (error) {
  console.log('FAIL  the second run stopped:', error?.message ?? error);
  checks.push({ name: 'the second run ran to the end', ok: false });
  await app.screenshot('sources-stopped-2').catch(() => {});
  console.log('page errors:', JSON.stringify(await app.exec('return window.__glaukopisErrors ?? []').catch(() => [])).slice(0, 2000));
  await app.close();
}

rmSync(dataDir, { recursive: true, force: true });
const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
