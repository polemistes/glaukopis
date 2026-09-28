// Pictures that projects kept by themselves, as they first did, are taken
// into the store when the application starts.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const data = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-old-'));
const drawing =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><circle cx="100" cy="50" r="40" fill="#7a2e2e"/></svg>';
const hash = createHash('sha256').update(drawing).digest('hex');
const id = '0a1b2c3d-0000-4000-8000-00000000000a';
const old = join(data, 'projects', id, 'files');
mkdirSync(old, { recursive: true });
writeFileSync(join(old, `${hash}.svg`), drawing);
writeFileSync(
  join(data, 'projects', id, 'project.json'),
  JSON.stringify({ id, name: 'From before', description: '', created: '2026-09-28T00:00:00Z', modified: '2026-09-28T00:00:00Z', maps: [], words: 0, references: 0 }),
);

const app = await App.launch({ width: 1200, height: 800, dataDir: data });
try {
  await app.installErrorHook();
  await app.waitForText('body', 'From before', 8000);
  const kept = join(data, 'pictures', 'files', `${hash}.svg`);
  check('the picture is in the store', existsSync(kept) && readFileSync(kept, 'utf8') === drawing);
  check('and no longer with the project', !existsSync(old));
  check('which is there as it was', existsSync(join(data, 'projects', id, 'project.json')));
  const known = JSON.parse(readFileSync(join(data, 'pictures', 'pictures.json'), 'utf8'));
  check('the store knows of it', known.length === 1 && known[0].hash === hash && known[0].extension === 'svg', JSON.stringify(known).slice(0, 200));
  await app.keys(['Control', '3']);
  await app.waitFor('.pictures .tile', 8000);
  await sleep(400);
  check('and shows it', (await app.count('.pictures .tile')) === 1);
  check('nothing else is in the store', readdirSync(join(data, 'pictures', 'files')).length === 1);
  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('taken-in-failure').catch(() => {});
} finally {
  await app.close();
  rmSync(data, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
