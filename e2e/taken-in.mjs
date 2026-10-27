// Images that were kept apart, in the store of pictures and before that by
// each project, are taken into the library's files when the application
// starts (ADR 0070): in a folder Images, with what they show, without the
// captions and notes once kept with them; the old store set aside.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const data = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-old-'));

// A project that kept its own picture, as projects first did.
const drawing =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><circle cx="100" cy="50" r="40" fill="#7a2e2e"/></svg>';
const drawingHash = sha(drawing);
const id = '0a1b2c3d-0000-4000-8000-00000000000a';
const old = join(data, 'projects', id, 'files');
mkdirSync(old, { recursive: true });
writeFileSync(join(old, `${drawingHash}.svg`), drawing);
writeFileSync(
  join(data, 'projects', id, 'project.json'),
  JSON.stringify({ id, name: 'From before', description: '', created: '2026-09-28T00:00:00Z', modified: '2026-09-28T00:00:00Z', maps: [], words: 0, references: 0 }),
);

// The store of pictures, with what was said of each.
const owl = readFileSync(join(root, 'src/lib/shell/owl-small.png'));
const owlHash = sha(owl);
const square = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#246"/></svg>';
const squareHash = sha(square);
const store = join(data, 'pictures');
mkdirSync(join(store, 'files'), { recursive: true });
mkdirSync(join(store, 'small'), { recursive: true });
writeFileSync(join(store, 'files', `${owlHash}.png`), owl);
writeFileSync(join(store, 'files', `${squareHash}.svg`), square);
writeFileSync(
  join(store, 'pictures.json'),
  JSON.stringify([
    {
      hash: owlHash,
      extension: 'png',
      name: 'The owl.png',
      size: owl.length,
      added: '2026-10-01T10:00:00Z',
      caption: [{ kind: 'text', text: 'An owl on a branch', marks: {} }],
      alt: 'An owl, drawn in ink',
      note: 'Ask the owner about the drawing.',
    },
    { hash: squareHash, extension: 'svg', name: 'Square.svg', size: square.length, added: '2026-10-02T10:00:00Z', alt: '' },
  ]),
);

const app = await App.launch({ width: 1200, height: 800, dataDir: data });
try {
  await app.installErrorHook();
  await app.waitForText('body', 'From before', 8000);

  // ---- on disk ----
  const record = JSON.parse(readFileSync(join(data, 'library', 'files.json'), 'utf8'));
  const byHash = Object.fromEntries(record.files.map((f) => [f.hash, f]));
  const images = record.folders.find((f) => f.name === 'Images');
  check('the folder Images is made at the top', !!images && !images.parent, JSON.stringify(record.folders));
  check('the images of the store and of the project are files of the library', [owlHash, squareHash, drawingHash].every((h) => byHash[h]?.folder === images?.id), Object.keys(byHash).length);
  const owlFile = byHash[owlHash] ?? {};
  check('each keeps its name and when it was taken in', owlFile.name === 'The owl.png' && owlFile.added === '2026-10-01T10:00:00Z', JSON.stringify(owlFile));
  check('and what it shows, and how large it is', owlFile.alt === 'An owl, drawn in ink' && owlFile.width > 0 && owlFile.height > 0);
  const written = readFileSync(join(data, 'library', 'files.json'), 'utf8');
  check('the caption and the note are not taken', !written.includes('An owl on a branch') && !written.includes('Ask the owner'));
  const stored = join(data, 'library', owlFile.path ?? 'none');
  check('the file is in the library, as it was', existsSync(stored) && sha(readFileSync(stored)) === owlHash);
  const aside = readdirSync(data).filter((n) => n.startsWith('pictures.old-'));
  check('the old store is set aside, as it was', aside.length === 1 && existsSync(join(data, aside[0], 'pictures.json')), aside.join());
  check('and is no longer where it was', !existsSync(store));
  check('what the project kept is no longer with it', !existsSync(old));
  check('the project is there as it was', existsSync(join(data, 'projects', id, 'project.json')));

  // ---- in the window ----
  await app.go('#/pictures');
  await app.waitFor('[data-file-list]', 8000);
  check('the way to the images leads to the files', await app.exists('[data-file-list]'));
  await app.go(`#/files?folder=${images.id}`);
  await sleep(600);
  const names = await app.exec(`return Array.from(document.querySelectorAll('[data-file-list] [data-hash] .name')).map((r) => r.textContent.trim())`);
  check('the files of Images are listed', ['The owl.png', 'Square.svg'].every((n) => names.some((r) => r.includes(n))), names.join(' | '));
  await app.screenshot('taken-in-images');

  // ---- again: nothing more ----
  await app.close();
  const again = await App.launch({ width: 1200, height: 800, dataDir: data, keepData: true });
  await again.waitFor('[data-file-list], [data-start]', 8000);
  await sleep(800);
  const after = JSON.parse(readFileSync(join(data, 'library', 'files.json'), 'utf8'));
  check('started again, nothing is taken twice', after.files.length === record.files.length && after.folders.length === record.folders.length);
  check('and the old store is not set aside again', readdirSync(data).filter((n) => n.startsWith('pictures')).length === 1);
  const errors = await again.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
  await again.close();
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('taken-in-failure').catch(() => {});
  await app.close().catch(() => {});
} finally {
  rmSync(data, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
