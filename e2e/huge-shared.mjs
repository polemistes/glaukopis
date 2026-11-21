// A huge project that is shared, joined by another: how long the window of
// the one who joins stands still while the project arrives and is drawn, and
// when the application is started again at that project. It measures, and
// fails where the window stands still for long: it stood still for minutes
// when the diagram was laid out anew for each of its elements.
//
// And the way out: a start that never arrives at the place that was kept,
// as when the window is ended from outside while a project is on its way,
// is followed by a start at the start screen.
//
//     node e2e/huge-shared.mjs            makes, shares, joins, starts again
//
// GLAUKOPIS_E2E_PARTS says how many elements the project has, 1500 where
// nothing is said, and GLAUKOPIS_E2E_PARAGRAPHS how many paragraphs each has,
// of some 95 words, 2 where nothing is said. GLAUKOPIS_E2E_STILL says how
// long the window may stand still, in milliseconds: 4000 where nothing is
// said, which is what the drawing of 1500 elements takes with room to spare.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, root, sleep, freePort } from './harness.mjs';

const PARTS = Number(process.env.GLAUKOPIS_E2E_PARTS ?? 1500);
const PARAGRAPHS = Number(process.env.GLAUKOPIS_E2E_PARAGRAPHS ?? 2);
/** How long the window may stand still, in milliseconds, at the most. */
const STILL = Number(process.env.GLAUKOPIS_E2E_STILL ?? 4000);

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
    await sleep(120);
  }
}

/**
 * Puts into the page what tells how long it stood still: a timer that
 * should come every ten milliseconds, and the longest wait between two of
 * its comings, with every wait over a fifth of a second and when it was.
 */
const PROBE = `
  window.__stills = [];
  window.__still = 0;
  window.__last = performance.now();
  window.__probe = setInterval(() => {
    const now = performance.now();
    const gap = now - window.__last;
    if (gap > 200) window.__stills.push({ at: Math.round(now), ms: Math.round(gap) });
    window.__still = Math.max(window.__still, gap);
    window.__last = now;
  }, 10);`;

const stood = (app) =>
  app.exec(
    `const s = { most: Math.round(window.__still ?? -1), all: window.__stills ?? [] };
     window.__still = 0; window.__stills = [];
     return s;`,
  );

const said = (s) =>
  `${s.most} ms at the most${s.all.length ? `; ${s.all.map((g) => `${g.ms} ms at ${g.at}`).join(', ')}` : ''}`;

// ---- the server ----
const binary = join(root, 'target', 'debug', 'glaukopis-server');
if (!existsSync(binary)) throw new Error(`No server at ${binary}. Build it first: cargo build -p glaukopis-server`);
const serverData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-server-'));
const port = await freePort();
const address = `127.0.0.1:${port}`;
const serverLog = [];
const server = spawn(binary, ['--listen', address, '--data', serverData, '--password', 'sesame'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stderr.on('data', (d) => serverLog.push(String(d)));
server.stdout.on('data', (d) => serverLog.push(String(d)));
for (let i = 0; ; i++) {
  try {
    if ((await fetch(`http://${address}/api/info`)).ok) break;
  } catch {
    if (i > 60) throw new Error(`the server did not answer:\n${serverLog.join('')}`);
    await sleep(100);
  }
}

// ---- the book ----
const desk = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-desk-'));
const words =
  'Sing, goddess, the wrath of Achilles son of Peleus, the accursed wrath which brought countless sorrows upon the Achaeans, and sent down to Hades many valiant souls of warriors. ';
let long = '---\ntitle: A huge book\n---\n\n';
let n = 0;
for (let h = 0; h < PARTS; h++) {
  long += `${h % 6 === 0 ? '#' : h % 3 === 0 ? '###' : '##'} Part ${h + 1}\n\n`;
  for (let i = 0; i < PARAGRAPHS; i++) {
    long += `${words.repeat(3)}*Emphasised.*${n % 10 === 0 ? ` (Nagy 1979, ${i + 1})^[${words.trim()}]` : ''}\n\n`;
    n++;
  }
}
writeFileSync(join(desk, 'huge.md'), long);

const guestData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-guest-'));
let owner;
let guest;
try {
  owner = await App.launch({ width: 1280, height: 820 });
  await owner.installErrorHook();

  // ---- the owner makes the project, of the book ----
  await owner.beginProject();
  await owner.waitFor('dialog input');
  await owner.type('dialog input', 'Huge');
  await owner.clickText('dialog footer button', 'Create');
  await owner.waitFor('.text-view .section', 8000);
  await owner.view('diagram');
  await owner.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  const at = await owner.exec(
    `const r = document.querySelector('.project .work .panes').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }`,
  );
  let began = Date.now();
  await owner.execAsync(
    `const emit = (event, payload) => window.__TAURI_INTERNALS__.invoke('plugin:event|emit', { event, payload });
     const position = { x: arguments[1] * devicePixelRatio, y: arguments[2] * devicePixelRatio };
     await emit('tauri://drag-enter', { paths: arguments[0], position });
     await emit('tauri://drag-over', { position });
     await emit('tauri://drag-drop', { paths: arguments[0], position });`,
    [join(desk, 'huge.md')],
    at.x,
    at.y,
  );
  await owner.waitFor('dialog [data-fact="words"]', 300000);
  const counted = await owner.exec(
    `return document.querySelector('dialog [data-fact="words"]').textContent.replace(/\\s+/g, ' ').trim()`,
  );
  console.log(`      the book is read in ${Date.now() - began} ms: ${counted}`);
  began = Date.now();
  await owner.clickText('dialog footer button', 'Bring it in');
  await until('the map', () => owner.exec(`return !document.querySelector('dialog[open]')`), 600000);
  if (await owner.exists('.found-panel')) {
    await owner.click('.found-panel header button[aria-label="Close"]');
    await owner.waitGone('.found-panel', 60000);
  }
  console.log(`      and brought in in ${Date.now() - began} ms`);
  // Until it is kept.
  await sleep(6000);

  // ---- and shares it ----
  began = Date.now();
  await owner.shareWindow();
  await owner.waitForText('dialog h2', 'Share this project', 20000);
  await owner.type('dialog input[placeholder="glaukopis.example.org"]', address);
  await owner.click('dialog input[placeholder="As the others know you"]');
  await owner.waitFor('dialog input[type="password"]', 5000);
  await owner.keys('Robert');
  await owner.type('dialog input[type="password"]', 'sesame');
  await owner.clickText('dialog footer button', 'Share');
  await owner.waitForText('dialog h2', 'Shared project', 120000);
  await owner.waitForText('dialog .state', 'Connected', 120000);
  console.log(`      shared in ${Date.now() - began} ms`);
  await owner.clickText('dialog button', 'Make an invitation code');
  await owner.waitFor('dialog .code', 5000);
  const code = (await owner.text('dialog .code')).trim();
  await owner.clickText('dialog footer button', 'Done');
  await owner.waitGone('dialog[open]');
  // Until the server has all of it.
  await sleep(5000);

  // ---- the guest joins ----
  guest = await App.launch({ width: 1280, height: 820, dataDir: guestData });
  await guest.installErrorHook();
  await guest.waitForText('h2', 'Welcome to Glaukopis');
  await guest.clickText('button', 'Join a shared project');
  await guest.waitForText('dialog h2', 'Join a shared project');
  await guest.type('dialog input[name="server"]', address);
  await guest.type('dialog input[name="code"]', code);
  await guest.type('dialog input[placeholder="As the others know you"]', 'Anna Lind');
  await guest.exec(PROBE);
  began = Date.now();
  await guest.clickText('dialog footer button', 'Join');
  await guest.waitFor('.project', 600000);
  const elements = await until(
    'the project to arrive',
    async () => {
      const n = await guest.exec(`return document.querySelectorAll('.diagram .node, .text-view .section').length`);
      return n > 1 ? n : null;
    },
    600000,
  );
  const arrived = Date.now() - began;
  console.log(`      the project arrived with the one who joined after ${arrived} ms (${elements} elements drawn)`);
  let s = await stood(guest);
  console.log(`      while it arrived the window stood still for ${said(s)}`);
  check('the window of the one who joins does not stand still while the project arrives', s.most < STILL, `${s.most} ms`);
  // What comes after: the saving, the readable copy, the search, the history.
  await sleep(20000);
  s = await stood(guest);
  console.log(`      in the twenty seconds after, for ${said(s)}`);
  check('nor in the time after', s.most < STILL, `${s.most} ms`);
  await guest.screenshot('huge-shared-1-joined');
  const errors = await guest.pageErrors();
  check('nothing went wrong in the page of the one who joined', errors.length === 0, errors.slice(0, 3).join(' | '));

  // ---- the application is started again, at the project ----
  const leaving = guest;
  guest = null;
  began = Date.now();
  await leaving.quit(300000);
  console.log(`      the window of the one who joined closed in ${Date.now() - began} ms`);
  began = Date.now();
  guest = await App.launch({ width: 1280, height: 820, dataDir: guestData });
  await guest.exec(PROBE);
  await guest.waitFor('.project', 600000);
  await until(
    'the project to be shown',
    async () =>
      (await guest.exec(`return document.querySelectorAll('.diagram .node, .text-view .section').length`)) > 1,
    600000,
  );
  console.log(`      started again, the project is shown after ${Date.now() - began} ms`);
  await sleep(20000);
  s = await stood(guest);
  console.log(`      the window stood still, after it could be asked, for ${said(s)}`);
  check('started again at the project, the window does not stand still', s.most < STILL, `${s.most} ms`);
  await guest.screenshot('huge-shared-2-again');
  const kept = () => JSON.parse(readFileSync(join(guestData, 'settings.json'), 'utf8')).lastPlace ?? null;
  check('arrived at, the place is kept', /^#?\/project\//.test(kept() ?? ''), String(kept()));

  // ---- a start that never arrives ----
  // The window is closed as one closes it, at the project: the place is kept. Then the project
  // is as one that was joined and never fetched, and its server is gone: started, the
  // application goes to it and waits for what does not come.
  const closing = guest;
  guest = null;
  await closing.quit(120000);
  check('closed at the project, the place is kept', /^#?\/project\//.test(kept() ?? ''), String(kept()));
  server.kill();
  const [joined] = readdirSync(join(guestData, 'projects')).filter((d) =>
    existsSync(join(guestData, 'projects', d, 'project.json')),
  );
  rmSync(join(guestData, 'projects', joined, 'state.bin'), { force: true });
  rmSync(join(guestData, 'projects', joined, 'updates.log'), { force: true });
  guest = await App.launch({ width: 1280, height: 820, dataDir: guestData });
  const place = (app) => app.exec(`return location.hash`);
  await until('the project to be gone to', async () => (await place(guest)).startsWith('#/project/'), 30000);
  await sleep(3000);
  check(
    'a project that is on its way is gone to, and nothing of it is shown yet',
    (await place(guest)).startsWith('#/project/') && (await guest.count('.diagram .node, .text-view .section')) <= 1,
  );
  check('the place is not kept before it is arrived at', kept() === null, String(kept()));
  // Ended from outside, as a window that stands still is: nothing is asked of the window.
  const ended = guest;
  guest = null;
  await ended.close();
  guest = await App.launch({ width: 1280, height: 820, dataDir: guestData });
  await guest.waitFor('[data-start]', 30000);
  await sleep(1000);
  check(
    'the start after is at the start screen, not at the project again',
    !(await place(guest)).startsWith('#/project/') && (await guest.exists('[data-start]')),
    await place(guest),
  );
  await guest.waitFor('[data-start-project]', 10000);
  check('where the project stands among those last opened', (await guest.count('[data-start-project]')) === 1);
  await guest.screenshot('huge-shared-3-start');
} finally {
  await owner?.close().catch(() => {});
  await guest?.close().catch(() => {});
  server.kill();
  rmSync(serverData, { recursive: true, force: true });
  rmSync(guestData, { recursive: true, force: true });
  rmSync(`${guestData}-config`, { recursive: true, force: true });
  rmSync(desk, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(failed.length ? `\n${failed.length} of ${checks.length} failed` : `\nall ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
