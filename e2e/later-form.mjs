// A project and the notebook that a later version has written in (record
// 0111): each says which form its texts are in, and one of a later form
// than this version knows is not opened, since the editor would take out of
// it what it does not know. Two projects are made; the change a later
// version would make, saying the second form, is written into the log of
// one of them on disk, as the application writes changes; that project is
// not opened and says why, in a side, and nothing more is written into it;
// the other opens as before; the same change written into the notebook
// keeps the notebook's page from opening it, with its own words.
// Screenshots in e2e/output/later-form-<n>-<what>.png.

import * as Y from 'yjs';
import { App, sleep } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

/** Waits, at most `ms`, until `probe` gives what `ok` takes; gives the last it gave. */
async function until(probe, ok, ms = 8000) {
  const end = Date.now() + ms;
  let got = await probe();
  while (!ok(got) && Date.now() < end) {
    await sleep(150);
    got = await probe();
  }
  return got;
}

/** The change by which a later version says that the texts are of the form after the one known here: see `src/lib/editor/form.ts`. */
function saysLaterForm() {
  const doc = new Y.Doc();
  doc.getMap('form').set('2', true);
  return Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
}

const idOf = (app, name) =>
  app.execAsync(
    `const list = await window.__TAURI_INTERNALS__.invoke('project_list');
     return list.find((p) => p.name === arguments[0])?.id ?? null;`,
    name,
  );

/** Adds a change to the log of the notebook, as the application does. */
const notebookAppend = (app, update64) =>
  app.execAsync(
    `const update = Uint8Array.from(atob(arguments[0]), (c) => c.charCodeAt(0));
     const head = new TextEncoder().encode(JSON.stringify({ time: null }));
     const body = new Uint8Array(4 + head.length + update.length);
     new DataView(body.buffer).setUint32(0, head.length, true);
     body.set(head, 4);
     body.set(update, 4 + head.length);
     return await window.__TAURI_INTERNALS__.invoke('notebook_append', body);`,
    update64,
  );

const said = (app) =>
  app.exec(`return (document.querySelector('.pane-body')?.textContent ?? '').replace(/\\s+/g, ' ').trim()`);

async function begin(app, name) {
  await app.beginProject();
  await app.waitFor('dialog input');
  await app.type('dialog input', name);
  await app.clickText('dialog footer button', 'Create');
  await app.waitFor('.text-view .section', 8000);
}

const app = await App.launch({ width: 1360, height: 880 });
try {
  // ---- two projects, each written in ----
  await begin(app, 'Written later');
  await app.home();
  await begin(app, 'Written now');
  await app.home();
  await sleep(600);

  const later = await idOf(app, 'Written later');
  const now = await idOf(app, 'Written now');
  check('two projects are made', !!later && !!now);

  // ---- a later version writes in one of them ----
  await app.projectAppend(later, saysLaterForm());
  const before = await app.projectLoad(later);

  await app.go(`#/project/${encodeURIComponent(later)}`);
  const text = await until(
    () => said(app),
    (t) => t.includes('later version'),
  );
  check('a project of a later form is not opened', text.includes('The project could not be opened'), text.slice(0, 200));
  check(
    'and says why, and what to do',
    text.includes('This project was written by a later version of Glaukopis. Update Glaukopis to open it.'),
    text.slice(0, 200),
  );
  check('no text of it is shown', !(await app.exists('.text-view .section')) && !(await app.exists('.ProseMirror')));
  await app.screenshot('later-form-1-project');

  await app.home();
  await sleep(800);
  const after = await app.projectLoad(later);
  check(
    'nothing is written into it',
    after.state === before.state && JSON.stringify(after.updates) === JSON.stringify(before.updates),
    `${before.updates.length} changes before, ${after.updates.length} after`,
  );

  // ---- the other opens as before ----
  await app.go(`#/project/${encodeURIComponent(now)}`);
  await app.waitFor('.text-view .section', 8000);
  check('a project of the form known is opened', await app.exists('.text-view .section'));
  await app.home();

  // ---- the notebook ----
  await notebookAppend(app, saysLaterForm());
  await app.go('#/notebook');
  const page = await until(
    () => app.exec(`return (document.querySelector('main, body')?.textContent ?? '').replace(/\\s+/g, ' ').trim()`),
    (t) => t.includes('later version'),
  );
  check(
    'a notebook of a later form is not opened, and says why',
    page.includes('The notebook could not be read') &&
      page.includes('The notebook was written by a later version of Glaukopis. Update Glaukopis to open it.'),
    page.slice(0, 300),
  );
  await app.screenshot('later-form-2-notebook');

  const errors = await app.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
} catch (error) {
  console.log('FAIL  the script stopped:', error?.message ?? error);
  checks.push({ name: 'the script ran to the end', ok: false });
  await app.screenshot('later-form-stopped').catch(() => {});
} finally {
  await app.close().catch(() => {});
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
