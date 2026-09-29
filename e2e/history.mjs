// The full history of a project (ADR 0021), in the running application: it
// is turned on, what is written is kept, and the history answers as the
// review asks it (`src/lib/history/types.ts`).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** Asks the history of the project that is open, in the page. */
const ask = (app, body, ...args) =>
  app.execAsync(`const { history: h, positions } = window.__glaukopisHistory; ${body}`, ...args);

const bodyText = (app) =>
  app.exec(`return document.querySelector('.text-view .section .body')?.textContent.trim() ?? ''`);

const app = await App.launch({ width: 1360, height: 880 });
try {
  await app.installErrorHook();
  await app.clickText('button', 'Begin a project');
  await app.waitFor('dialog input');
  await app.type('dialog input', 'Wrath');
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.diagram .node.root', 8000);
  await sleep(300);
  await app.keys(['Control', 'd']);
  await app.waitFor('.text-view .section .body', 8000);
  await app.click('.text-view .section .body');
  await sleep(300);
  await app.keys('Sing, goddess, the wrath.');
  await sleep(800);

  // ---- turned on ----
  await ask(app, `await h.turnOn();`);
  await sleep(500);
  const id = await app.exec(`return window.__glaukopisHistory.history.id`);
  const dir = join(app.dataDir, 'projects', id);
  check('turned on, the history begins on disk', existsSync(join(dir, 'changes.log')));
  const settings = JSON.parse(readFileSync(join(app.dataDir, 'settings.json'), 'utf8'));
  check('this installation has a person id', /^[0-9a-f-]{36}$/.test(settings.person ?? ''), settings.person);

  const since = await ask(app, `return Array.from((await h.now()).snapshot);`);
  await app.keys(' Of Achilles.');
  await sleep(1200);

  // ---- compare ----
  const map = await app.exec(`return window.__glaukopisHistory.history.project.maps[0].id`);
  const changes = await ask(
    app,
    `const c = await h.compare(arguments[0], { moment: new Uint8Array(arguments[1]), accepted: [] });
     return c.passages.map((p) => ({ kind: p.kind, path: p.place.path, pieces: p.pieces.map((x) => [x.status, x.text, x.by]) }));`,
    map,
    since,
  );
  const body = changes.find((p) => p.kind === 'paragraph');
  const added = body?.pieces.filter((p) => p[0] === 'added') ?? [];
  check(
    'what was written since is added, by this person',
    added.length === 1 && added[0][1] === ' Of Achilles.' && added[0][2] === settings.person,
    JSON.stringify(changes),
  );
  const people = await ask(app, `return await h.people();`);
  check('the project knows its people', people.some((p) => p.id === settings.person), JSON.stringify(people));

  // ---- versions ----
  const versions = await ask(
    app,
    `const c = await h.compare(arguments[0], { moment: new Uint8Array(arguments[1]), accepted: [] });
     const p = c.passages.find((x) => x.kind === 'paragraph');
     const s = positions.whole(p);
     const v = await h.versions(p.place, s.from, s.to, { moment: new Uint8Array(arguments[1]), accepted: [] });
     return v.map((x) => ({ by: x.by, text: x.pieces.filter((y) => y.status !== 'removed').map((y) => y.text).join('') }));`,
    map,
    since,
  );
  check(
    'the versions of the paragraph go from what it was to what it is',
    versions.length >= 2 &&
      versions[0].text === 'Sing, goddess, the wrath.' &&
      versions[versions.length - 1].text === 'Sing, goddess, the wrath. Of Achilles.',
    JSON.stringify(versions),
  );

  // ---- revert, and undo ----
  await ask(
    app,
    `const c = await h.compare(arguments[0], { moment: new Uint8Array(arguments[1]), accepted: [] });
     const p = c.passages.find((x) => x.kind === 'paragraph');
     await h.revert(p, p.pieces.filter((x) => x.status === 'added'));`,
    map,
    since,
  );
  await sleep(500);
  check('what was added is taken back, in the text', (await bodyText(app)) === 'Sing, goddess, the wrath.', await bodyText(app));
  await app.click('button[aria-label="Undo"]');
  await sleep(500);
  check('and it can be undone', (await bodyText(app)) === 'Sing, goddess, the wrath. Of Achilles.', await bodyText(app));

  // ---- restore ----
  await ask(
    app,
    `const c = await h.compare(arguments[0], { moment: new Uint8Array(arguments[1]), accepted: [] });
     const p = c.passages.find((x) => x.kind === 'paragraph');
     const s = positions.whole(p);
     await h.restore(p.place, s.from, s.to, new Uint8Array(arguments[1]));`,
    map,
    since,
  );
  await sleep(500);
  check('a stretch is made as it was at a moment', (await bodyText(app)) === 'Sing, goddess, the wrath.', await bodyText(app));

  // ---- kept through saving and opening again ----
  await app.click('button[aria-label="All projects"]');
  await sleep(1500);
  await app.clickText('.home .card', 'Wrath');
  await app.waitFor('.text-view .section .body', 8000);
  await sleep(500);
  const sessions = await ask(app, `return (await h.sessions()).map((s) => [s.person, s.added, s.removed]);`);
  check('opened again, the history holds what was done', sessions.length >= 2 && sessions.some((s) => s[1] > 0), JSON.stringify(sessions));
  const room = await ask(app, `return await h.room();`);
  check('the room it takes is known', room > 0, `${room} bytes`);

  // ---- the panel ----
  const writeAtEnd = async (words) => {
    await app.click('.text-view .section .body');
    await sleep(400);
    await app.keys(['Control', 'End']);
    await app.keys(words);
    await sleep(1200);
  };
  await writeAtEnd(' Of Achilles.');
  await app.click('button[aria-label="History"]');
  await app.waitFor('.history-panel .moment', 10000);
  await sleep(600);
  const rows = () =>
    app.exec(`return Array.from(document.querySelectorAll('.history-panel .moment')).map((m) => m.textContent.replace(/\\s+/g, ' ').trim())`);
  let listed = await rows();
  check('the panel lists the sessions, the newest first', listed.length >= 2 && listed[listed.length - 1].includes('The history begins'), JSON.stringify(listed));
  await app.screenshot('history-1-panel');

  // A moment: the map as it was, with what changed since the moment before marked.
  await app.click('.history-panel .moment');
  await app.waitFor('.past .text .element', 8000);
  await sleep(300);
  const marked = await app.exec(`return Array.from(document.querySelectorAll('.past .piece.added')).map((p) => p.textContent)`);
  check('the map is shown as it was, what was written marked', marked.join('').includes('Of Achilles'), JSON.stringify(marked));
  check('it is not to be written in', !(await app.exists('.past .ProseMirror')) && !(await app.exists('.panes .text-view')));
  await app.screenshot('history-2-as-it-was');

  // Named.
  await app.click('button[aria-label="Name this moment"]');
  await app.waitFor('.past input.naming');
  await app.keys('With Achilles');
  await app.press('Enter');
  await app.waitForText('.history-panel .moment.named', 'With Achilles', 5000);
  check('a moment is given a name, and stands among the sessions', true);

  // Brought back: the text is changed, and the element is brought back as it was at the named moment.
  await app.click('.past .bar button.primary');
  await app.waitFor('.text-view .section .body', 5000);
  await app.click('.text-view .section .body');
  await sleep(400);
  await app.keys(['Control', 'a']);
  await app.press('Backspace');
  await app.keys('Nothing.');
  await sleep(1200);
  check('the text is changed', (await bodyText(app)) === 'Nothing.', await bodyText(app));
  await app.clickText('.history-panel .moment.named', 'With Achilles');
  await app.waitFor('.past .text .element', 8000);
  await app.exec(`document.querySelector('.past .element .back').click()`);
  await sleep(600);
  await app.click('.past .bar button.primary');
  await app.waitFor('.text-view .section .body', 5000);
  await sleep(400);
  check('an element is brought back as it was', (await bodyText(app)) === 'Sing, goddess, the wrath. Of Achilles.', await bodyText(app));
  await app.click('button[aria-label="Undo"]');
  await sleep(500);
  check('and that is undone as one change', (await bodyText(app)) === 'Nothing.', await bodyText(app));

  // ---- kept less finely, as if weeks had passed ----
  const merged = await ask(app, `return await h.thinAsOf(Date.now() + 60 * 24 * 3600 * 1000);`);
  check('older history is merged', merged > 0, `${merged} stretches`);
  await app.click('button[aria-label="History"]');
  await app.click('button[aria-label="History"]');
  await app.waitFor('.history-panel .moment', 10000);
  await sleep(600);
  listed = await rows();
  check('merged history is shown as such, and the named moment is kept', listed.some((r) => r.includes('kept less finely')) && listed.some((r) => r.includes('With Achilles')), JSON.stringify(listed));

  // ---- archived and deleted ----
  const archive = join(app.dataDir, 'Wrath until then.glaukopis-history');
  const before = await ask(app, `return (await h.sessions()).length;`);
  await ask(
    app,
    `const s = await h.sessions(); const at = s[1].last; await h.cutting(at); await h.cut(at, arguments[0]);`,
    archive,
  );
  const archived = await app.execAsync(
    `const b = await window.__TAURI_INTERNALS__.invoke('history_archive_read', { path: arguments[0] }); return b.byteLength;`,
    archive,
  );
  const after = await ask(app, `return (await h.sessions()).length;`);
  check('history before a moment is archived into a file that can be read again', existsSync(archive) && archived > 0 && after < before, `${before} → ${after} sessions, ${archived} bytes`);
  const first = await ask(app, `const s = await h.sessions(); return [s[0].first, s[0].person];`);
  check('what is left begins with the project as it was', first[0] === 0 && first[1] === null && (await bodyText(app)) === 'Nothing.', JSON.stringify(first));

  // Deleted before a moment, from the settings: the moment of what is written now.
  await writeAtEnd(' And more.');
  await app.click('button[aria-label="History"]');
  await app.click('button[aria-label="History"]');
  await app.waitFor('.history-panel .moment:not(.named)', 10000);
  await sleep(600);
  await app.click('.history-panel .moment:not(.named)');
  await app.waitFor('.past .text', 8000);
  const beforeDeleting = await ask(app, `return (await h.sessions()).length;`);
  await app.click('button[aria-label="Settings of the history"]');
  await app.clickText('.history-panel button', 'Delete');
  await app.waitForText('dialog h2', 'Delete the history before', 5000);
  await app.screenshot('history-3-delete');
  await app.clickText('dialog footer button', 'Delete');
  await app.waitGone('dialog[open]', 8000);
  await sleep(800);
  const left = await ask(app, `return (await h.sessions()).length;`);
  check('history before a moment is deleted', left < beforeDeleting, `${beforeDeleting} → ${left} sessions`);

  // ---- turned off ----
  await app.click('.history-panel input[type="checkbox"]');
  await app.waitForText('dialog h2', 'Stop keeping the history?', 5000);
  await app.clickText('dialog footer button', 'Delete the history');
  await app.waitGone('dialog[open]', 8000);
  await sleep(1500);
  check('turned off, what was kept is deleted', !existsSync(join(dir, 'changes.log')));
  await app.waitForText('.history-panel', 'is not kept', 5000);

  const errors = await app.pageErrors();
  check('no errors in the window', errors.length === 0, errors.join(' ‖ '));
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await app.screenshot('history-failure').catch(() => {});
} finally {
  await app.close();
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} passed`);
process.exit(failed.length ? 1 : 0);
