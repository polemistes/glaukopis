// How quick the file view is (sources in tabs, the scrolling of pages): a book of three hundred
// pages shown in a side, the time to its first page, the gaps between frames while it is
// scrolled, the pages passed without a picture, a page jumped to cold and from the cache, and,
// where there are tabs, a tab switched to. Each is measured inside the page, so that the
// driver's round trips add nothing. The numbers are printed as one JSON line; the checks say
// only that each was measured, so that a slow machine never makes the script fail.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok: !!ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-viewer-speed-'));
const book = join(dataDir, 'long.pdf');
const source = join(dataDir, 'long.typ');
writeFileSync(
  source,
  `#set page(paper: "a4")
#set text(size: 11pt)
#for n in range(300) {
  if calc.rem(n, 10) == 0 { heading(level: 1)[Chapter #(calc.quo(n, 10) + 1)] }
  lorem(350)
  if n < 299 { pagebreak() }
}
`,
);
try {
  execFileSync('typst', ['compile', source, book], { stdio: 'pipe' });
} catch (e) {
  console.log(`Typst could not make the book (${e.message.split('\n')[0]}): nothing is measured.`);
  rmSync(dataDir, { recursive: true, force: true });
  process.exit(0);
}

const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);

/** Waits in the page until a page of the file side has its picture, and gives the milliseconds since `since`. */
const PICTURED = `
  const pictured = (n) => {
    const img = document.querySelector('[data-file-side] .page[data-page="' + n + '"] img');
    return !!img && img.complete && img.naturalWidth > 0;
  };
  const until = (test, ms = 60000) => new Promise((done, failed) => {
    const start = performance.now();
    const tick = () => {
      if (test()) done();
      else if (performance.now() - start > ms) failed(new Error('timed out'));
      else setTimeout(tick, 10);
    };
    tick();
  });`;

/** Goes to a page by the bar's field and gives the milliseconds until its picture is there. */
const jump = (app, page) =>
  app.execAsync(
    `${PICTURED}
    const input = document.querySelector('[data-file-side] [data-viewer-go]');
    const start = performance.now();
    input.value = String(arguments[0]);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form.requestSubmit();
    await until(() => pictured(arguments[0]));
    return Math.round(performance.now() - start);`,
    page,
  );

const numbers = {};
let app = await App.launch({ dataDir, keepData: true });
try {
  await app.installErrorHook();
  const taken = await invoke(app, 'files_take_in', { paths: [book], folder: null, structure: true, ticket: null });
  const hash = taken.files.find((f) => f.name.endsWith('.pdf'))?.hash ?? '';
  check('the book is taken into the library', hash);

  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Speed');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);

  // ---- the first page ----
  numbers.first = await app.execAsync(
    `${PICTURED}
    const start = performance.now();
    window.__glaukopisViewer.show(arguments[0]);
    await until(() => pictured(1));
    return Math.round(performance.now() - start);`,
    hash,
  );
  check('the time to the first page', numbers.first > 0, `${numbers.first} ms`);
  numbers.pages = await app.exec(`return Number(/of (\\d+)/.exec(document.querySelector('[data-file-side] [data-viewer-bar] .page')?.textContent ?? '')?.[1] ?? 0)`);
  await sleep(1500);

  // ---- scrolling: a tenth of a page every 50 ms until page 60 is passed ----
  await app.exec(`
    const scroller = document.querySelector('[data-file-side] [data-viewer-pages]');
    const step = document.querySelector('[data-file-side] .page[data-page="1"]').getBoundingClientRect().height / 10;
    const speed = (window.__speed = { gaps: [], samples: 0, blank: 0, done: false });
    let last = 0;
    const frame = (t) => {
      if (last && t - last > 32) speed.gaps.push(t - last);
      last = t;
      if (!speed.done) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    const sampler = setInterval(() => {
      const box = scroller.getBoundingClientRect();
      const hit = document.elementsFromPoint(box.left + box.width / 2, box.top + box.height / 2).find((e) => e.matches('.page[data-page]'));
      const img = hit?.querySelector('img');
      speed.samples++;
      if (!(img && img.complete && img.naturalWidth > 0)) speed.blank++;
    }, 300);
    const mover = setInterval(() => {
      scroller.scrollTop += step;
      const page = Number(document.querySelector('[data-file-side] [data-viewer-page]')?.dataset.viewerPage ?? 0);
      if (page > 60 || scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1) {
        clearInterval(mover);
        clearInterval(sampler);
        speed.done = true;
      }
    }, 50);`);
  const scrolled = await (async () => {
    for (let i = 0; i < 600; i++) {
      const s = await app.exec(`return window.__speed.done ? window.__speed : null`);
      if (s) return s;
      await sleep(300);
    }
    throw new Error('the scrolling did not end');
  })();
  numbers.longestGap = Math.round(Math.max(0, ...scrolled.gaps));
  numbers.gapsOver50 = scrolled.gaps.filter((g) => g > 50).length;
  numbers.blank = scrolled.blank;
  numbers.samples = scrolled.samples;
  check('the gaps between frames while scrolling', scrolled.samples > 0, `longest ${numbers.longestGap} ms, ${numbers.gapsOver50} over 50 ms`);
  check('the pages passed without a picture', scrolled.samples > 0, `${scrolled.blank} of ${scrolled.samples} samples`);
  await app.screenshot('viewer-speed-1-scrolled');

  // ---- a page jumped to, cold and from the cache ----
  numbers.jumpCold = await jump(app, 200);
  check('a page jumped to, not drawn before', numbers.jumpCold > 0, `${numbers.jumpCold} ms`);
  await sleep(800);
  numbers.jumpWarm = await jump(app, 1);
  check('a page jumped to, drawn before', numbers.jumpWarm >= 0, `${numbers.jumpWarm} ms`);
  await sleep(800);

  // ---- a tab switched to, where there are tabs ----
  if (await app.exec(`return typeof window.__glaukopisViewer?.again === 'function'`)) {
    const first = await app.exec(`return document.querySelector('[data-file-side] [data-tab][aria-selected="true"]')?.dataset.tab ?? ''`);
    await app.exec(`window.__glaukopisViewer.again(arguments[0])`, hash);
    await sleep(800);
    const second = await app.exec(`return document.querySelector('[data-file-side] [data-tab][aria-selected="true"]')?.dataset.tab ?? ''`);
    await jump(app, 150);
    await sleep(800);
    await app.execAsync(
      `${PICTURED}
      document.querySelector('[data-file-side] [data-tab="' + arguments[0] + '"]').click();
      await until(() => pictured(1));`,
      first,
    );
    await sleep(800);
    numbers.switch = await app.execAsync(
      `${PICTURED}
      const start = performance.now();
      document.querySelector('[data-file-side] [data-tab="' + arguments[0] + '"]').click();
      await until(() => pictured(150));
      return Math.round(performance.now() - start);`,
      second,
    );
    check('a tab switched to, at another place of the same file', first && second && first !== second && numbers.switch >= 0, `${numbers.switch} ms`);
  }

  const errors = await app.exec('return window.__glaukopisErrors ?? []');
  check('no errors in the page', !errors.length, JSON.stringify(errors).slice(0, 600));
} catch (e) {
  check('the script ran to its end', false, e.message);
  await app.screenshot('viewer-speed-stopped').catch(() => {});
} finally {
  await app.close();
  rmSync(dataDir, { recursive: true, force: true });
}

console.log(JSON.stringify(numbers));
const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
