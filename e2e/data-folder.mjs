// The data folder chosen by the writer, from the settings: Change… with a
// folder that holds something else (refused), one that holds Glaukopis's data
// (Use what is in, cancelled), and an empty one (Move everything to, moved):
// the files copied where the folder is on another disk, the work folder left
// out, the file that says where the data is written in the run's own settings
// place, and the application closing, which under the harness ends it instead
// of starting it again. The folder picker is passed by a hook.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const app = await App.launch({ width: 1200, height: 1100 });
// Folders of the run: two beside the data, and the one moved to under the
// repository, which is on another disk than the temporary folders where
// those are a disk of their own in memory, so that the copy is seen.
const scratch = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-folders-'));
const target = join(root, 'e2e', 'output', `data-folder-moved-${process.pid}`);
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');
  // A project, so that there is something of the writer's to move.
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Moved along');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  // Something in the work folder, which is made again and not moved.
  mkdirSync(join(app.dataDir, 'work', 'kept-not'), { recursive: true });
  writeFileSync(join(app.dataDir, 'work', 'kept-not', 'made-again.txt'), 'x');

  // From the rail: in the text, Ctrl+, is a key of the writing.
  await app.click('nav button[aria-label="Settings"]');
  await app.waitForText('dialog[open] header h2', 'Settings');
  await app.waitFor('[data-data-folder-change]');
  check('Change… stands beside the data folder', await app.exists('[data-data-folder-change]'));

  // A folder with a stray file in it.
  const stray = join(scratch, 'stray');
  mkdirSync(stray);
  writeFileSync(join(stray, 'notes.txt'), 'not Glaukopis');
  await app.exec(`window.__glaukopisDataFolder.choose(${JSON.stringify(stray)}); return null;`);
  await app.waitFor('[data-data-folder-dialog="other"]');
  const strayText = await app.exec(
    `return document.querySelector('[data-data-folder-dialog]').textContent;`,
  );
  check('a folder holding something else is refused', strayText.includes('The folder is not empty'), strayText.trim());
  await app.clickText('dialog[open] footer button', 'Close');
  await sleep(300);

  // A folder holding Glaukopis's data already.
  const other = join(scratch, 'other data');
  mkdirSync(join(other, 'library'), { recursive: true });
  writeFileSync(join(other, 'library', 'library.bib'), '');
  await app.exec(`window.__glaukopisDataFolder.choose(${JSON.stringify(other)}); return null;`);
  await app.waitFor('[data-data-folder-dialog="glaukopis"]');
  const useText = await app.exec(
    `return document.querySelector('[data-data-folder-dialog]').textContent;`,
  );
  check(
    'a folder holding Glaukopis’s data is offered for use, saying what stays',
    useText.includes(`Use what is in “${other}”`) &&
      useText.includes(`What is in “${app.dataDir}” now stays there, unused.`) &&
      useText.includes('Glaukopis closes and starts again.'),
    useText.trim(),
  );
  await app.screenshot('data-folder-1-use');
  await app.clickText('dialog[open] footer button', 'Cancel');
  await sleep(300);
  check('cancelled, nothing is written', !existsSync(join(app.configDir, 'glaukopis', 'data-folder.json')));

  // An empty folder, not there yet: everything is moved.
  await app.exec(`window.__glaukopisDataFolder.choose(${JSON.stringify(target)}); return null;`);
  await app.waitFor('[data-data-folder-dialog="empty"]');
  const moveText = await app.exec(
    `return document.querySelector('[data-data-folder-dialog]').textContent;`,
  );
  check(
    'an empty folder is offered for everything to be moved to',
    moveText.includes(`Move everything to “${target}”`) && moveText.includes('Glaukopis closes and starts again.'),
    moveText.trim(),
  );
  await app.screenshot('data-folder-2-move');
  const pids = app.appPids();
  await app.clickText('dialog[open] footer button', 'Move');
  for (let i = 0; i < 300 && pids.some(alive); i++) await sleep(100);
  check('the application closes', pids.length > 0 && !pids.some(alive), `processes ${pids.join(' ')}`);
  const log = app.log.join('');
  check(
    'and, run by the harness, ends instead of starting again',
    log.includes('the application would start again, but the harness runs it'),
  );

  const file = join(app.configDir, 'glaukopis', 'data-folder.json');
  const written = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  check(
    'the file in the run’s settings place names the folder and where the data is moved from',
    written?.folder === target && written?.movingFrom === app.dataDir,
    JSON.stringify(written),
  );

  if (log.includes('the data folder is copied, and checked')) {
    const project = readdirSync(join(app.dataDir, 'projects')).find((n) =>
      existsSync(join(app.dataDir, 'projects', n, 'project.json')),
    );
    check('on another disk, the files are copied before closing', existsSync(join(target, 'settings.json')));
    check(
      'the project with them',
      !!project && existsSync(join(target, 'projects', project, 'project.json')),
      project ?? 'no project',
    );
    check('and the folders, empty or not', existsSync(join(target, 'library')) && existsSync(join(target, 'dictionaries')));
    check('the work folder is not among them', !existsSync(join(target, 'work')));
    check('nor the claim', !existsSync(join(target, '.in-use')));
  } else {
    check(
      'on the same disk, nothing is copied: the folder is renamed at the next start',
      !existsSync(join(target, 'library')),
    );
  }
} catch (error) {
  console.error(error);
  await app.screenshot('data-folder-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  await app.close();
  rmSync(scratch, { recursive: true, force: true });
  rmSync(target, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
