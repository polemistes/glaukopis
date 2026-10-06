// Languages of spelling and of OCR imported (ADR 0032): the server is a
// folder holding the packages that scripts/make-language-packages.py makes;
// Norwegian Bokmål is imported from it in the settings of spelling and is
// then what Norwegian is checked with; Danish is imported from a file; the
// Norwegian of Tesseract is imported in the settings of Tesseract, and
// Tesseract is given it before its own, with its own languages still there;
// taken away, Tesseract has its own again.
//
// Needs packaging/languages/out: run scripts/make-language-packages.py first.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readlinkSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const server = join(root, 'packaging/languages/out');
if (!existsSync(join(server, 'index.json'))) {
  console.error('No packages: run scripts/make-language-packages.py first.');
  process.exit(1);
}
const data = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-'));
writeFileSync(join(data, 'settings.json'), JSON.stringify({ languagesServer: server, language: 'en' }));

const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);

/** Clicks a button by its text within an element. */
const press = (app, within, text) =>
  app.exec(
    `const b = [...document.querySelectorAll(arguments[0] + ' button')].find((b) => b.textContent.trim() === arguments[1]);
     if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true;`,
    within,
    text,
  );

const app = await App.launch({ width: 1360, height: 900, dataDir: data, env: { GLAUKOPIS_LANGUAGE: 'en' } });
try {
  await app.installErrorHook();
  await app.waitFor('.rail a.place', 8000);
  const before = await invoke(app, 'spelling_prepare', { language: 'nb' });
  check('at first there is no dictionary of Bokmål but the system’s', !before || before.dictionaries[0].source === 'system', JSON.stringify(before?.dictionaries?.[0]?.source ?? null));

  // ---- spelling: Bokmål from the server ----
  await app.keys(['Control', ',']);
  await app.waitFor('[data-packages="spelling"]', 8000);
  await press(app, '[data-packages="spelling"]', 'Show languages on the server');
  await app.waitFor('[data-packages="spelling"] [data-offered-name="nb_NO"]', 8000);
  const offered = await app.exec(
    `return [...document.querySelectorAll('[data-packages="spelling"] [data-offered-name]')].map((li) => li.dataset.offeredName)`,
  );
  check('the server offers the nine dictionaries', offered.length === 9, offered.join(' '));
  await press(app, '[data-packages="spelling"] [data-offered-name="nb_NO"]', 'Import');
  await app.waitFor('[data-packages="spelling"] [data-installed="nb_NO"]', 15000);
  check('Bokmål is imported', true);
  await sleep(400);
  const listed = await app.exec(
    `return document.querySelector('[data-dictionaries] li[data-tag="nb-NO"] .source')?.textContent.trim()`,
  );
  check('and listed among the dictionaries as imported', listed === 'Imported', listed);
  const nb = await invoke(app, 'spelling_prepare', { language: 'nb' });
  check('Norwegian is checked with it', nb?.dictionaries[0].source === 'imported', JSON.stringify(nb?.dictionaries[0]));
  const judged = await invoke(app, 'spelling_check', { language: 'nb', words: ['språkpakke', 'stavekontrol'] });
  check('and judges as it should', JSON.stringify(judged) === '[true,false]', JSON.stringify(judged));
  await app.screenshot('language-packages-1-spelling');

  // ---- spelling: Danish from a file ----
  const danish = execFileSync('sh', ['-c', `ls ${server}/spelling-da_DK-*.zip`]).toString().trim();
  const imported = await invoke(app, 'languages_import', { paths: [danish] });
  check('Danish is imported from a file', imported[0]?.name === 'da_DK', JSON.stringify(imported));
  const da = await invoke(app, 'spelling_check', { language: 'da', words: ['sprogværktøjer', 'A/S'] });
  check('and judges as it should', JSON.stringify(da) === '[true,true]', JSON.stringify(da));

  // ---- OCR: Norwegian from the server ----
  await app.waitFor('[data-packages="ocr"]', 8000);
  await press(app, '[data-packages="ocr"]', 'Show languages on the server');
  await app.waitFor('[data-packages="ocr"] [data-offered-name="nor"]', 8000);
  await press(app, '[data-packages="ocr"] [data-offered-name="nor"]', 'Import');
  await app.waitFor('[data-packages="ocr"] [data-installed="nor"]', 30000);
  check('the Norwegian of Tesseract is imported', true);
  const tessdata = join(data, 'languages/tessdata');
  const link = (name) => {
    try {
      return readlinkSync(join(tessdata, name));
    } catch {
      return null;
    }
  };
  check('Tesseract is given it', link('nor.traineddata') === join(data, 'languages/ocr/nor.traineddata'), link('nor.traineddata'));
  check('with its own languages', (link('eng.traineddata') ?? '').includes('tessdata'), link('eng.traineddata'));
  check('and its configurations', existsSync(join(tessdata, 'configs/pdf')));
  const tools = await invoke(app, 'tools_info', { again: false });
  check('it reads all of them', ['nor', 'eng', 'grc'].every((l) => tools.ocrLanguages.includes(l)), tools.ocrLanguages.join(' '));
  await sleep(300);
  await app.exec(`document.querySelector('[data-packages="ocr"]').scrollIntoView({ block: 'center' })`);
  await app.screenshot('language-packages-2-ocr');

  // A page read with the data imported, as the application gives it.
  try {
    const picture = join(data, 'page.png');
    execFileSync('magick', ['-size', '900x160', 'xc:white', '-fill', 'black', '-pointsize', '56', '-annotate', '+30+100', 'Språkpakken virker', picture]);
    const read = execFileSync('tesseract', [picture, '-', '-l', 'nor', 'txt'], {
      env: { ...process.env, TESSDATA_PREFIX: tessdata },
    }).toString();
    check('a page is read with it', /Språkpakken\s+virker/.test(read), read.trim());
  } catch (error) {
    check('a page is read with it', false, String(error.message ?? error).slice(0, 200));
  }

  // ---- taken away ----
  await app.exec(`document.querySelector('[data-packages="ocr"] [data-installed="nor"] button').click()`);
  await sleep(1500);
  const left = await invoke(app, 'tools_info', { again: false });
  check('taken away, Tesseract has its own again', !existsSync(tessdata) && left.ocrLanguages.includes('nor'), left.ocrLanguages.join(' '));
  check('and what it pointed to is untouched', existsSync('/usr/share/tessdata/nor.traineddata'));
  await invoke(app, 'languages_remove', { kind: 'spelling', name: 'nb_NO' });
  const after = await invoke(app, 'spelling_prepare', { language: 'nb' });
  check('and spelling the dictionary of the system, or none', !after || after.dictionaries[0].source !== 'imported', JSON.stringify(after?.dictionaries?.[0]?.source ?? null));

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('language-packages-failure').catch(() => {});
} finally {
  await app.close();
  if (!process.env.GLAUKOPIS_E2E_KEEP) rmSync(data, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
