// A second instance of the application, on data another is already at work in.

import { execFileSync, spawn } from 'node:child_process';
import { join } from 'node:path';
import { App, root, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const app = await App.launch();
let second = null;
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis');

  // The same program, on the same display and the same data.
  let said = '';
  second = spawn(app.binary, [], {
    env: {
      ...process.env,
      DISPLAY: app.display,
      GDK_BACKEND: 'x11',
      WAYLAND_DISPLAY: '',
      LIBGL_ALWAYS_SOFTWARE: '1',
      WEBKIT_DISABLE_DMABUF_RENDERER: '1',
      NO_AT_BRIDGE: '1',
      GLAUKOPIS_DATA_DIR: app.dataDir,
      GLAUKOPIS_LANGUAGE: 'en',
      GLAUKOPIS_LOG: 'info',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ended = null;
  second.on('exit', (code) => (ended = code));
  second.stderr.on('data', (d) => (said += String(d)));
  second.stdout.on('data', (d) => (said += String(d)));
  for (let i = 0; i < 100 && !said.includes('in use by another instance'); i++) await sleep(200);
  check('a second instance on the same data sees that another is at work in it', said.includes('in use by another instance'));
  await sleep(1500);
  execFileSync('import', ['-display', app.display, '-window', 'root', join(root, 'e2e', 'output', 'instances-1-second.png')]);
  check('and says so, waiting to be read', ended === null);
  check('it does not read the library or the projects', !said.includes('library read'), said.split('\n').filter(Boolean).slice(-3).join(' | '));

  // The first goes on as before.
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Still here');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  check('the first goes on as before', true);

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.error(error);
  await app.screenshot('instances-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
} finally {
  if (second && second.exitCode === null) second.kill('SIGTERM');
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
