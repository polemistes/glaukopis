// Help, the user's guide in a window over the view: F1 on the start screen
// opens it at A first project, with the guide's chapters at the left; a
// chapter pressed in the contents is shown, with its parts under it in the
// contents and the chapter after it at its foot; Escape closes it, and F1
// again at the same place opens it where it was left, at that chapter and
// as far down as it was read; Ctrl+F goes to Find in the guide, where
// plugin Firefox gives a hit under The notebook, and Enter shows that part
// with the words marked in the text and the first in view; Escape empties
// the field, and Escape again closes Help; the question mark in the row at
// the top opens it, lit, and pressing there again closes it; opening the
// settings closes Help, and F1 closes the settings; in the notebook F1 opens
// it at The notebook, and in the text of a new project, the cursor in the
// text, at The text; F1 closes it again. Then, with the interface in
// Norwegian, the window's own words are Norwegian (the title, the field,
// the step to the next chapter). No errors in the page. Screenshots in
// e2e/output/help-<n>-<what>.png.

import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** F1, as WebDriver names it. */
const F1 = '\uE031';

/** What Help shows: the chapter lit in the contents, the heading of the text, how far down it is read. */
const shown = (app) =>
  app.exec(`const help = document.querySelector('[data-help]');
    if (!help) return null;
    const page = help.querySelector('.page');
    return {
      chapter: help.querySelector('[data-help-chapter][aria-current="page"]')?.dataset.helpChapter ?? null,
      heading: help.querySelector('[data-help-text] h2')?.textContent.trim() ?? null,
      scroll: Math.round(page?.scrollTop ?? 0),
    };`);

/** Presses F1, and waits until Help is open with a chapter drawn. */
async function openByKey(app) {
  await app.keys([F1]);
  await app.waitFor('[data-help] [data-help-text] h2', 8000);
  await sleep(400);
}

/** Waits until Help is closed. */
async function closed(app) {
  return app.waitGone('[data-help]', 3000).then(
    () => true,
    () => false,
  );
}

/** Presses the middle of what a selector finds, as a hand would, whatever lies over it. */
async function pressAt(app, selector) {
  const at = await app.exec(
    `const r = document.querySelector(arguments[0]).getBoundingClientRect();
     return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };`,
    selector,
  );
  await app.cmd('POST', '/actions', {
    actions: [
      {
        type: 'pointer',
        id: 'mouse',
        parameters: { pointerType: 'mouse' },
        actions: [
          { type: 'pointerMove', origin: 'viewport', x: at.x, y: at.y },
          { type: 'pointerDown', button: 0 },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ],
  });
  await app.cmd('DELETE', '/actions');
}

let app = await App.launch({ width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.waitForText('h2', 'Welcome to Glaukopis', 10000);
  await sleep(300);

  // ---- F1 on the start screen ----
  await openByKey(app);
  let now = await shown(app);
  check('F1 on the start screen opens Help at A first project', now?.chapter === 'a-first-project' && now.heading === 'A first project', JSON.stringify(now));
  const chapters = await app.exec(`return Array.from(document.querySelectorAll('[data-help-chapter]')).map((c) => c.textContent.trim())`);
  check('the contents list the chapters of the guide', chapters[0] === 'A guide to Glaukopis' && chapters.includes('The notebook') && chapters.includes('Keys'), chapters.slice(0, 4).join(' | '));
  check('the window says Help', (await app.text('dialog[open] header h2')) === 'Help');
  await app.screenshot('help-1-start');

  // ---- a chapter pressed ----
  await app.click('[data-help-chapter="the-library"]');
  await app.waitForText('[data-help-text] h2', 'The library', 3000);
  await sleep(300);
  now = await shown(app);
  check('a chapter pressed in the contents is shown', now?.chapter === 'the-library' && now.heading === 'The library', JSON.stringify(now));
  const parts = await app.exec(`return Array.from(document.querySelectorAll('[data-help-part]')).map((p) => p.textContent.trim())`);
  check('its parts stand under it in the contents', parts.includes('The files of the library') && parts.includes('Importing'), parts.join(' | '));
  check('its foot names the chapter after it', (await app.text('[data-help-next]')).includes('The notebook'));
  await app.exec(`document.querySelector('[data-help] .page').scrollTop = 700; return null;`);
  await sleep(300);
  const left = (await shown(app)).scroll;
  await app.screenshot('help-2-chapter');

  // ---- Escape closes; F1 again opens where it was left ----
  await app.press('Escape');
  check('Escape closes Help', await closed(app));
  await openByKey(app);
  await sleep(300);
  now = await shown(app);
  check('F1 again at the same place opens where it was left', now?.chapter === 'the-library' && Math.abs(now.scroll - left) < 30, `${JSON.stringify(now)}, left at ${left}`);

  // ---- finding ----
  await app.keys(['Control', 'f']);
  await sleep(200);
  check('Ctrl+F goes to Find in the guide', await app.exec(`return document.activeElement?.hasAttribute('data-help-find') ?? false`));
  await app.keys('plugin Firefox');
  await app.waitFor('[data-help-hit]', 3000);
  await sleep(300);
  const hits = await app.exec(
    `return Array.from(document.querySelectorAll('[data-help-hit]')).map((h) => ({
       part: h.dataset.helpHit,
       chapter: h.querySelector('.chapter-name')?.textContent.trim() ?? h.querySelector('.title').textContent.trim(),
     }))`,
  );
  const under = hits.findIndex((h) => h.chapter === 'The notebook');
  check('plugin Firefox gives a hit under The notebook', under >= 0, hits.map((h) => `${h.chapter}: ${h.part}`).join(' | '));
  await app.screenshot('help-3-found');
  for (let i = 0; i < under; i++) await app.press('ArrowDown');
  await sleep(200);
  check('the arrows move among the hits', await app.exec(`return document.querySelectorAll('[data-help-hit]')[arguments[0]]?.getAttribute('aria-selected') === 'true'`, Math.max(0, under)));
  await app.press('Enter');
  await sleep(600);
  now = await shown(app);
  const marked = await app.exec(
    `const page = document.querySelector('[data-help] .page').getBoundingClientRect();
     const marks = Array.from(document.querySelectorAll('[data-help-text] mark[data-help-mark]'));
     const inView = marks.some((m) => { const r = m.getBoundingClientRect(); return r.top >= page.top && r.bottom <= page.bottom; });
     return { words: [...new Set(marks.map((m) => m.textContent.toLowerCase()))], inView };`,
  );
  check('Enter shows the part in The notebook', now?.chapter === 'the-notebook' && now.heading === 'The notebook', JSON.stringify(now));
  check('with the words marked in the text', marked.words.includes('plugin') && marked.words.includes('firefox'), marked.words.join(' '));
  check('and one of them in view', marked.inView);
  await app.screenshot('help-4-marked');

  await app.press('Escape');
  await sleep(300);
  check('Escape in the field empties it, and Help stays open', (await app.exec(`return document.querySelector('[data-help-find]')?.value ?? null`)) === '' && (await app.exists('[data-help-chapter]')));
  check('and the marks go', !(await app.exists('[data-help-text] mark[data-help-mark]')));
  await app.press('Escape');
  check('Escape in the empty field closes Help', await closed(app));

  // ---- the question mark in the row ----
  await app.click('[data-place="help"]');
  await app.waitFor('[data-help] [data-help-text] h2', 5000);
  await sleep(300);
  check('the question mark in the row opens Help, lit while it is open', await app.exists('[data-place="help"].current'));
  await pressAt(app, '[data-place="help"]');
  check('pressing there again closes it', await closed(app));

  // ---- one window over the view at a time ----
  await openByKey(app);
  await app.keys(['Control', ',']);
  await app.waitForText('dialog[open] header h2', 'Settings', 3000);
  check('opening the settings closes Help', !(await app.exists('[data-help]')));
  await app.keys([F1]);
  await app.waitFor('[data-help] [data-help-text] h2', 5000);
  check('F1 opens Help in place of the settings', !(await app.exists('.settings')));
  await app.keys([F1]);
  check('F1 closes Help', await closed(app));

  // ---- in the notebook ----
  await app.keys(['Control', '3']);
  await app.waitFor('[data-notebook]', 8000);
  await sleep(400);
  await openByKey(app);
  now = await shown(app);
  check('F1 in the notebook opens Help at The notebook', now?.chapter === 'the-notebook' && now.heading === 'The notebook', JSON.stringify(now));
  await app.screenshot('help-5-notebook');
  await app.keys([F1]);
  check('F1 closes it there too', await closed(app));

  // ---- in the text, with the cursor in it ----
  await app.beginProject();
  await app.type('dialog input', 'Help tried');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
  await sleep(500);
  await app.click('.text-view .ProseMirror');
  await sleep(200);
  check('the cursor is in the text', await app.exec(`return !!document.activeElement?.closest('.ProseMirror')`));
  await openByKey(app);
  now = await shown(app);
  check('F1 while a text has the cursor opens Help at The text', now?.chapter === 'the-text' && now.heading === 'The text', JSON.stringify(now));
  await app.screenshot('help-6-text');
  await app.press('Escape');
  await closed(app);

  await sleep(400);
  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await app.quit();

  // ---- in Norwegian ----
  app = await App.launch({ width: 1360, height: 880, env: { GLAUKOPIS_LANGUAGE: 'nb-NO' } });
  await app.installErrorHook();
  await app.waitFor('[data-row-end] .place', 10000);
  await sleep(400);
  await openByKey(app);
  const words = await app.exec(
    `return {
       title: document.querySelector('dialog[open] header h2')?.textContent.trim(),
       find: document.querySelector('[data-help-find]')?.placeholder,
       next: document.querySelector('[data-help-next] .what')?.textContent.trim(),
       button: document.querySelector('[data-place="help"]')?.getAttribute('aria-label'),
     }`,
  );
  check(
    "with the interface in Norwegian, the window's own words are Norwegian",
    words.title === 'Hjelp' && words.find === 'Finn i veiledningen' && words.next === 'Neste kapittel' && words.button === 'Hjelp',
    JSON.stringify(words),
  );
  await app.screenshot('help-7-norwegian');
  await app.press('Escape');
  await closed(app);
  const errorsNb = await app.pageErrors();
  check('no errors in the page in Norwegian', errorsNb.length === 0, errorsNb.join(' | '));
  await app.quit();
} catch (error) {
  console.error(error);
  await app.screenshot('help-failure').catch(() => {});
  checks.push({ name: 'the run completed', ok: false });
  await app.close().catch(() => {});
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
