// The plugin for Firefox, without Firefox (record 0102): the application is
// launched with GLAUKOPIS_FIREFOX_HOSTS_DIR, so that Firefox is set up in a
// folder of the script's own and never in the real ~/.mozilla. Settings ›
// Firefox says it is not set up; Set up writes org.glaukopis.notebook.json
// there, naming the application's own program and the plugin's id; the
// helper is started as Firefox starts it (the program the manifest names,
// with the path of the manifest and the plugin's id) and spoken to in frames
// (four bytes of length in the machine's byte order, then JSON): hello is
// answered with the version; a kind it does not know is not-understood; a
// selection with HTML that holds a link, a script and an image with an
// onerror is answered ok, the application says Added to the notebook within a
// few seconds, Show goes to the note, whose text holds the words and the link
// made whole and nothing of the script, and whose source is the page; a part
// of a page with a small PNG is a note with the picture, the page its source;
// a page is a note named by its title; a box made and, from its menu, made
// the one where notes from outside come, has the tray for its mark, and a
// selection handed over then lies in it; the helper ends when its input ends;
// Remove takes the manifest away; no errors in the page. Screenshots in
// e2e/output/notebook-plugin-<n>-<what>.png.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { endianness, tmpdir } from 'node:os';
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

// The picture of one dot, as notebook.mjs has it.
const DOT = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xf8, 0xcf, 0xc0, 0xf0,
  0x1f, 0x00, 0x05, 0x00, 0x01, 0xff, 0x89, 0x99, 0x3d, 0x1d, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

const MANIFEST_NAME = 'org.glaukopis.notebook.json';
const PLUGIN = 'notebook@glaukopis';

/**
 * The helper, started as Firefox starts it, and spoken to as Firefox speaks:
 * a frame is four bytes of length in the machine's byte order, then JSON.
 */
class Helper {
  constructor(program, manifest, env) {
    this.child = spawn(program, [manifest, PLUGIN], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    this.buffer = Buffer.alloc(0);
    this.waiting = [];
    this.errors = '';
    this.ended = new Promise((resolve) => this.child.on('exit', (code) => resolve(code)));
    this.child.stderr.on('data', (d) => (this.errors += String(d)));
    this.child.stdout.on('data', (d) => {
      this.buffer = Buffer.concat([this.buffer, d]);
      for (;;) {
        if (this.buffer.length < 4) break;
        const length = endianness() === 'LE' ? this.buffer.readUInt32LE(0) : this.buffer.readUInt32BE(0);
        if (this.buffer.length < 4 + length) break;
        const answer = JSON.parse(this.buffer.subarray(4, 4 + length).toString('utf8'));
        this.buffer = this.buffer.subarray(4 + length);
        this.waiting.shift()?.(answer);
      }
    });
  }

  /** Sends one message, and gives the one answer to it (none within `ms`: null). */
  say(message, ms = 10000) {
    const body = Buffer.from(JSON.stringify(message), 'utf8');
    const head = Buffer.alloc(4);
    if (endianness() === 'LE') head.writeUInt32LE(body.length, 0);
    else head.writeUInt32BE(body.length, 0);
    const answered = new Promise((resolve) => this.waiting.push(resolve));
    this.child.stdin.write(Buffer.concat([head, body]));
    return Promise.race([answered, sleep(ms).then(() => null)]);
  }

  /** Ends its input, as Firefox does when the port closes; gives the code it ended with. */
  end(ms = 5000) {
    this.child.stdin.end();
    return Promise.race([this.ended, sleep(ms).then(() => 'still running')]);
  }
}

/** A thing as the plugin hands it over. */
const thing = (kind, page, parts = {}) => ({
  kind,
  url: page.url,
  title: page.title,
  when: new Date().toISOString(),
  text: parts.text ?? '',
  html: parts.html ?? '',
  alt: parts.alt ?? '',
  name: parts.name ?? '',
  ...(parts.image ? { image: parts.image } : {}),
});

// ---- what the script reads of the page ----
const ROWS = '[data-notes] [role="option"]';
const titles = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('${ROWS} .title')).map((t) => t.textContent.trim())`,
  );
const noteText = (app) =>
  app.exec(`return document.querySelector('[data-note-text] .ProseMirror')?.textContent ?? ''`);
const chips = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-note-sources] [data-source]')).map((c) => c.textContent.trim())`,
  );
/** The boxes of the column, as their rows say them: the name, how many notes, whether it is in view and whether it has the tray. */
const boxes = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-box-row]')).filter((r) => r.dataset.boxRow !== 'all').map((r) => ({ name: r.querySelector('.name').textContent.trim(), count: r.querySelector('.count').textContent.trim(), on: r.getAttribute('aria-pressed') === 'true', tray: !!r.querySelector('svg.lucide-inbox') }))`,
  );
/** The row of a box by its name. */
const boxRow = (app, name) =>
  app.exec(
    `return Array.from(document.querySelectorAll('[data-box-row]')).find((r) => r.querySelector('.name')?.textContent.trim() === arguments[0]) ?? null`,
    name,
  );
const toastText = (app) =>
  app.exec(
    `return Array.from(document.querySelectorAll('.toaster .toast')).map((t) => t.textContent.replace(/\\s+/g, ' ').trim()).join(' | ')`,
  );
/** Presses Show in the message that says these words, and waits for the note it goes to. */
async function show(app, words) {
  const was = await app.exec('return location.hash');
  await app.exec(
    `const toast = Array.from(document.querySelectorAll('.toaster .toast')).find((t) => t.textContent.includes(arguments[0]));
     toast.querySelector('.action').click();
     return null;`,
    words,
  );
  // Another note than the one shown before.
  await app.waitUntil(
    `return location.hash.startsWith('#/notebook?note=') && location.hash !== ${JSON.stringify(was)}`,
    5000,
    'the note shown',
  );
  await app.waitFor('[data-note-text] .ProseMirror', 5000);
  await sleep(400);
}
/** Opens the settings at the section of Firefox. */
async function settingsAtFirefox(app) {
  await app.keys(['Control', ',']);
  await app.waitForText('dialog[open] header h2', 'Settings');
  await app.waitFor('[data-firefox] [data-firefox-setup]', 5000);
  await app.exec(`document.querySelector('[data-firefox]').scrollIntoView({ block: 'center' }); return null;`);
  await sleep(300);
}
const firefoxState = (app) =>
  app.exec(`return document.querySelector('[data-firefox-setup]')?.getAttribute('data-firefox-setup') ?? ''`);

const hosts = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-firefox-hosts-'));
const manifestPath = join(hosts, MANIFEST_NAME);

const app = await App.launch({ env: { GLAUKOPIS_FIREFOX_HOSTS_DIR: hosts }, width: 1360, height: 900 });
let helper = null;
try {
  await app.installErrorHook();
  await app.waitFor('#app > *', 15000);

  // ---- Settings › Firefox: not set up, then set up ----
  await settingsAtFirefox(app);
  const before = await until(() => firefoxState(app), (s) => s !== '');
  check('Settings › Firefox says Firefox is not set up', before === 'none' && (await app.text('[data-firefox]')).includes('Firefox is not set up'), before);
  check(
    'with no words of help, and no file of the system said',
    !(await app.text('[data-firefox]')).includes('sends pages') &&
      !(await app.exists('[data-firefox-setup][data-firefox-system]')),
  );
  await app.screenshot('notebook-plugin-1-not-set-up');

  await app.click('[data-firefox-set-up]');
  const after = await until(() => firefoxState(app), (s) => s === 'installed');
  check('Set up sets it up', after === 'installed' && (await app.text('[data-firefox]')).includes('Firefox is set up'), after);
  check('the manifest is written in the script’s folder of hosts, and nowhere else', existsSync(manifestPath));
  let manifest = {};
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    check('the manifest is JSON', false, String(error));
  }
  check(
    'the manifest names the helper, the application’s own program and the plugin',
    manifest.name === 'org.glaukopis.notebook' &&
      manifest.type === 'stdio' &&
      typeof manifest.path === 'string' &&
      existsSync(manifest.path) &&
      realpathSync(manifest.path) === realpathSync(app.binary) &&
      Array.isArray(manifest.allowed_extensions) &&
      manifest.allowed_extensions.includes(PLUGIN),
    JSON.stringify(manifest),
  );
  check(
    'the settings say where the manifest is',
    (await app.exec(`return document.querySelector('[data-firefox-manifest]')?.textContent.trim() ?? ''`)) === manifestPath,
  );
  await app.screenshot('notebook-plugin-2-set-up');
  await app.press('Escape');
  await app.waitGone('dialog[open]');

  // ---- The helper, as Firefox starts it ----
  helper = new Helper(manifest.path ?? app.binary, manifestPath, {
    ...process.env,
    GLAUKOPIS_DATA_DIR: app.dataDir,
    XDG_CONFIG_HOME: app.configDir,
  });
  const hello = await helper.say({ kind: 'hello' });
  check('hello is answered with the version', hello?.ok === true && typeof hello.version === 'string' && hello.version.length > 0, JSON.stringify(hello));
  const strange = await helper.say({ kind: 'nonsense' });
  check('a kind it does not know is not understood', strange?.ok === false && strange.error === 'not-understood', JSON.stringify(strange));

  // ---- A selection, with a link, a script and an image that would run something ----
  const athena = { url: 'https://example.org/owls/athena', title: 'The owl of Athena' };
  const selected = await helper.say(
    thing('selection', athena, {
      text: 'The little owl was hers.\nRead more.',
      html:
        '<p>The little owl was <em>hers</em>.</p>' +
        '<p>Read <a href="/owls/more">more</a>.<script>window.__glaukopisStolen = "script"</script>' +
        '<img src="x" onerror="window.__glaukopisStolen = \'image\'"></p>',
    }),
  );
  check('a selection is answered ok', selected?.ok === true, JSON.stringify(selected));
  await app.waitForText('.toaster .toast', 'Added to the notebook: The owl of Athena', 10000);
  check('the application says it was added, by the page’s title, with Show', /Added to the notebook: The owl of Athena.*Show/.test(await toastText(app)), await toastText(app));
  await app.screenshot('notebook-plugin-3-arrived');
  await show(app, 'The owl of Athena');
  const selectedText = await until(() => noteText(app), (t) => t.includes('little owl'));
  check('the note holds the words selected', selectedText.includes('The little owl was hers.') && selectedText.includes('Read more.'), selectedText);
  const link = await app.exec(`return document.querySelector('[data-note-text] .ProseMirror a')?.getAttribute('href') ?? ''`);
  check('and the link, made a whole address', link === 'https://example.org/owls/more', link);
  check(
    'and nothing of the script or the image',
    !(await app.exec(`return window.__glaukopisStolen ?? null`)) &&
      !(await app.exists('[data-note-text] script')) &&
      !(await app.exists('[data-note-text] .ProseMirror img')) &&
      !selectedText.includes('Stolen'),
  );
  check('its words are taken in', await app.exists('[data-note-text] .ProseMirror .taken'));
  const selectedChips = await until(() => chips(app), (c) => c.some((w) => w.includes('The owl of Athena')));
  check('its source is the page', selectedChips.some((c) => c.includes('The owl of Athena')), selectedChips.join(' | '));
  await app.screenshot('notebook-plugin-4-selection');

  // ---- A part of a page, as a picture ----
  const plates = { url: 'https://example.org/plates', title: 'Plates of owls' };
  const region = await helper.say(thing('region', plates, { image: DOT.toString('base64') }));
  check('a part of a page is answered ok', region?.ok === true, JSON.stringify(region));
  await app.waitForText('.toaster .toast', 'Added to the notebook: Plates of owls', 10000);
  await show(app, 'Plates of owls');
  await app.waitFor('[data-note-text] .figure', 5000).catch(() => {});
  check('the note holds the picture', await app.exists('[data-note-text] .figure'));
  const regionChips = await until(() => chips(app), (c) => c.some((w) => w.includes('Plates of owls')));
  check('its source is the page', regionChips.some((c) => c.includes('Plates of owls')), regionChips.join(' | '));
  await app.screenshot('notebook-plugin-5-region');

  // ---- A page ----
  const coins = { url: 'https://example.org/coins', title: 'Owls in Greek coins' };
  const paged = await helper.say(
    thing('page', coins, {
      text: 'The tetradrachm of Athens shows an owl.\nIt was struck for centuries.',
      html: '<div id="readability-page-1" class="page"><p>The tetradrachm of Athens shows an owl.</p><p>It was struck for centuries.</p></div>',
    }),
  );
  check('a page is answered ok', paged?.ok === true, JSON.stringify(paged));
  await app.waitForText('.toaster .toast', 'Added to the notebook: Owls in Greek coins', 10000);
  await show(app, 'Owls in Greek coins');
  const pageTitles = await until(() => titles(app), (t) => t.includes('Owls in Greek coins'));
  check('a page is a note named by its title', pageTitles.includes('Owls in Greek coins'), pageTitles.join(' | '));
  const pageText = await until(() => noteText(app), (t) => t.includes('tetradrachm'));
  check('it holds the page’s text', pageText.includes('It was struck for centuries.'), pageText);
  check('there are three notes', (await titles(app)).length === 3, (await titles(app)).join(' | '));
  await app.screenshot('notebook-plugin-6-page');

  // ---- The box where notes from outside come ----
  await app.click('[data-new-box]');
  await app.waitFor('[data-box-column] [data-naming]', 3000);
  await app.keys('From the web');
  await app.press('Enter');
  let column = await until(() => boxes(app), (b) => b.some((x) => x.name === 'From the web'));
  check(
    'the first box has the tray, a box made has not',
    column.find((b) => b.name === 'Unsorted')?.tray === true && column.find((b) => b.name === 'From the web')?.tray === false,
    JSON.stringify(column),
  );
  await app.rightClick(await boxRow(app, 'From the web'));
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(200);
  await app.screenshot('notebook-plugin-7-menu-of-a-box');
  await app.clickText('.menu [role="menuitem"]', 'Notes from outside come here');
  column = await until(() => boxes(app), (b) => b.find((x) => x.name === 'From the web')?.tray === true);
  check(
    'made the one where notes from outside come, it has the tray, and the first has not',
    column.find((b) => b.name === 'From the web')?.tray === true && column.find((b) => b.name === 'Unsorted')?.tray === false,
    JSON.stringify(column),
  );
  await app.rightClick(await boxRow(app, 'From the web'));
  await app.waitFor('.menu [role="menuitem"]', 3000);
  await sleep(200);
  check(
    'its menu says so with a tick',
    await app.exec(
      `return Array.from(document.querySelectorAll('.menu [role="menuitem"]')).some((m) => m.textContent.includes('Notes from outside come here') && !!m.querySelector('.check svg'))`,
    ),
  );
  await app.screenshot('notebook-plugin-8-receiving');
  await app.press('Escape');
  await app.click(await boxRow(app, 'Unsorted'));
  await sleep(300);
  const night = { url: 'https://example.org/owls/night', title: 'Owls of the night' };
  const later = await helper.say(thing('selection', night, { text: 'They hunt at night.', html: '' }));
  check('a selection handed over then is answered ok', later?.ok === true, JSON.stringify(later));
  await app.waitForText('.toaster .toast', 'Added to the notebook: Owls of the night', 10000);
  await show(app, 'Owls of the night');
  column = await until(() => boxes(app), (b) => b.find((x) => x.name === 'From the web')?.on === true);
  check(
    'it lies in that box, which Show brings into view, and the first holds what came before',
    column.find((b) => b.name === 'From the web')?.count === '1' &&
      column.find((b) => b.name === 'From the web')?.on === true &&
      column.find((b) => b.name === 'Unsorted')?.count === '3',
    JSON.stringify(column),
  );
  const nightText = await until(() => noteText(app), (t) => t.includes('hunt'));
  check('with its words', nightText.includes('They hunt at night.'), nightText);
  await app.screenshot('notebook-plugin-9-in-the-box');

  const code = await helper.end();
  check('the helper ends when its input ends', code === 0, `${code} ${helper.errors.trim().slice(0, 300)}`);
  helper = null;

  // ---- Remove ----
  await settingsAtFirefox(app);
  await app.click('[data-firefox-remove]');
  const removed = await until(() => firefoxState(app), (s) => s === 'none');
  check('Remove takes the manifest away', removed === 'none' && !existsSync(manifestPath), removed);
  await app.screenshot('notebook-plugin-10-removed');
  await app.press('Escape');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('notebook-plugin-failure').catch(() => {});
  checks.push({ name: 'the script completed', ok: false });
} finally {
  if (helper) helper.child.kill('SIGTERM');
  await app.close().catch(() => {});
  rmSync(hosts, { recursive: true, force: true });
}

// ---- Set up by a package: a file in the system's place, for everyone, and nothing to press ----
const ofTheUser = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-firefox-hosts-'));
const ofTheSystem = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-firefox-system-'));
let packaged = null;
try {
  // The file as the packages install it, naming the program that is tried here in the place of /usr/bin/glaukopis.
  const file = JSON.parse(readFileSync(new URL('../packaging/linux/org.glaukopis.notebook.json', import.meta.url), 'utf8'));
  check('the file of the packages names /usr/bin/glaukopis and the plugin', file.path === '/usr/bin/glaukopis' && file.allowed_extensions?.[0] === 'notebook@glaukopis' && file.type === 'stdio', JSON.stringify(file));
  packaged = await App.launch({
    env: { GLAUKOPIS_FIREFOX_HOSTS_DIR: ofTheUser, GLAUKOPIS_FIREFOX_SYSTEM_HOSTS_DIR: ofTheSystem },
    width: 1360,
    height: 900,
  });
  writeFileSync(join(ofTheSystem, MANIFEST_NAME), JSON.stringify({ ...file, path: realpathSync(packaged.binary) }));
  await packaged.installErrorHook();
  await packaged.waitFor('#app > *', 15000);
  await settingsAtFirefox(packaged);
  const state = await until(() => firefoxState(packaged), (s) => s !== '');
  const said = await packaged.exec(
    `const f = document.querySelector('[data-firefox]');
     return {
       system: !!f.querySelector('[data-firefox-setup][data-firefox-system]'),
       text: f.textContent,
       file: f.querySelector('[data-firefox-manifest]')?.textContent.trim() ?? '',
       buttons: f.querySelectorAll('[data-firefox-set-up], [data-firefox-remove]').length,
     };`,
  );
  check(
    'with the file in the system’s place and none of the user’s, Firefox is set up and there is nothing to press',
    state === 'installed' && said.system && said.text.includes('Firefox is set up') && said.buttons === 0,
    JSON.stringify({ state, ...said }),
  );
  check('the file named is the system’s', said.file === join(ofTheSystem, MANIFEST_NAME), said.file);
  check('and nothing was written for the user', !existsSync(join(ofTheUser, MANIFEST_NAME)));
  await packaged.screenshot('notebook-plugin-6-by-the-package');
  const errors = await packaged.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await packaged?.screenshot('notebook-plugin-failure-package').catch(() => {});
  checks.push({ name: 'the part of the package completed', ok: false });
} finally {
  await packaged?.close().catch(() => {});
  rmSync(ofTheUser, { recursive: true, force: true });
  rmSync(ofTheSystem, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
