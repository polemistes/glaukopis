// A shared project that a later version writes in (record 0111): the real
// server, the application running twice, and the script itself standing in
// for a later version of Glaukopis, which speaks to the server as the
// application does and says that it knows the second form of the texts.
// The owner makes a project, writes in it and shares it; a guest joins and
// writes too. The later version then says that the texts are of the second
// form and puts a block into the text that neither application knows, both
// in one change. The server lets both applications go before anything of
// it reaches them; each says once, in a dialog, that the project has been
// written in by a later version, and its sharing window says so after;
// neither has lost a word, neither has the block, and neither can delete
// it: what the later version wrote is still on the server, whole, for one
// who knows the form, and one who does not is not let in. What is written
// in an application after is kept there.
//
// With GLAUKOPIS_E2E_EARLIER=1 and GLAUKOPIS_E2E_BINARY naming a version of
// the application from before the guard (0.2.13 or earlier), the same is
// tried of that version: it has no words for it, and shows the server as
// not within reach; the rest must hold as well, since it is the server that
// keeps such a version out. GLAUKOPIS_E2E_SERVER names another server than
// the one built here: with a server from before the guard and such an
// application, the checks of what is kept fail, which is the fault itself.
// Screenshots in e2e/output/later-form-shared-<n>-<what>.png.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import { messageYjsSyncStep2, readSyncMessage, writeSyncStep1, writeUpdate } from 'y-protocols/sync';
import * as Y from 'yjs';
import { App, root, sleep, freePort } from './harness.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 10000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(120);
  }
}

const OWNERS = 'Sing, goddess, the wrath.';
const GUESTS = 'Of Achilles, son of Peleus.';
const LATERS = 'What an earlier version does not know.';
const AFTER = 'Written while kept out.';
const body = '.text-view .section .body';
const written = (app) =>
  app.exec(`return Array.from(document.querySelectorAll(arguments[0])).map((b) => b.textContent).join(' ')`, body);

// ---- the server ----
/** Whether the applications are of a version from before the guard, which is kept out by the server alone. */
const EARLIER = process.env.GLAUKOPIS_E2E_EARLIER === '1';
const binary = process.env.GLAUKOPIS_E2E_SERVER ?? join(root, 'target', 'debug', 'glaukopis-server');
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

/**
 * One who has the project open through the server, speaking as the
 * application does, and knowing the form `form` of the texts: the document
 * as the server gives it, and the code the server closed the socket with,
 * if it did.
 */
async function enter(room, token, form) {
  const answer = await fetch(`http://${address}/api/rooms/${room}/tickets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  const doc = new Y.Doc();
  const socket = new WebSocket(`ws://${address}/ws/${room}?ticket=${answer.ticket}${form ? `&form=${form}` : ''}`);
  socket.binaryType = 'arraybuffer';
  const one = { doc, synced: false, closed: null, leave: () => socket.close() };
  const send = (fill) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0);
    fill(encoder);
    if (socket.readyState === WebSocket.OPEN) socket.send(encoding.toUint8Array(encoder));
  };
  socket.onopen = () => send((e) => writeSyncStep1(e, doc));
  socket.onclose = (event) => (one.closed = event.code);
  socket.onmessage = (event) => {
    const decoder = decoding.createDecoder(new Uint8Array(event.data));
    while (decoding.hasContent(decoder)) {
      const kind = decoding.readVarUint(decoder);
      if (kind === 1) decoding.readVarUint8Array(decoder);
      else if (kind === 0) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 0);
        const step = readSyncMessage(decoder, encoder, doc, 'server');
        if (encoding.length(encoder) > 1) socket.send(encoding.toUint8Array(encoder));
        if (step === messageYjsSyncStep2) one.synced = true;
      } else if (kind !== 3) return;
    }
  };
  doc.on('update', (update, origin) => {
    if (origin !== 'server') send((e) => writeUpdate(e, update));
  });
  return one;
}

/** The text of the project's own element, as a document holds it. */
const textOf = (doc) => doc.getMap('nodes').get('project')?.get('body')?.toString() ?? '';

/** A project as it is on disk, as a document. */
async function onDisk(app, id) {
  const loaded = await app.projectLoad(id);
  const doc = new Y.Doc();
  const bytes = (b64) => Uint8Array.from(Buffer.from(b64, 'base64'));
  if (loaded.state) Y.applyUpdate(doc, bytes(loaded.state));
  for (const update of loaded.updates) Y.applyUpdate(doc, bytes(update));
  return doc;
}

let owner;
let guest;
try {
  // A program that is not the one built here is kept from the Firefox of this computer, whatever it would do.
  const env = { GLAUKOPIS_FIREFOX_HOSTS_DIR: mkdtempSync(join(tmpdir(), 'glaukopis-e2e-hosts-')) };
  owner = await App.launch({ width: 1280, height: 820, env });
  guest = await App.launch({ width: 1280, height: 820, env });
  await owner.installErrorHook();
  await guest.installErrorHook();

  // ---- the owner makes a project, writes in it and shares it ----
  await owner.beginProject();
  await owner.waitFor('dialog input');
  await owner.type('dialog input', 'Shared, and written in later');
  await owner.clickText('dialog footer button', 'Create');
  await owner.waitFor('.text-view .section', 8000);
  await owner.click(body);
  await owner.keys(OWNERS);
  await until('the owner’s words', async () => (await written(owner)).includes(OWNERS));

  await owner.shareWindow();
  await owner.waitForText('dialog h2', 'Share this project');
  await owner.type('dialog input[placeholder="glaukopis.example.org"]', address);
  await owner.click('dialog input[placeholder="As the others know you"]');
  await owner.waitFor('dialog input[type="password"]', 5000);
  await owner.keys('Robert');
  await owner.type('dialog input[type="password"]', 'sesame');
  await owner.clickText('dialog footer button', 'Share');
  await owner.waitForText('dialog h2', 'Shared project', 8000);
  await owner.waitForText('dialog .state', 'Connected', 8000);
  await owner.clickText('dialog button', 'Make an invitation code');
  await owner.waitFor('dialog .code', 5000);
  const code = (await owner.text('dialog .code')).trim();
  await owner.clickText('dialog footer button', 'Done');
  await owner.waitGone('dialog[open]');

  const list = JSON.parse(
    await owner.execAsync(`return JSON.stringify(await window.__TAURI_INTERNALS__.invoke('project_list'));`),
  );
  const room = list[0].id;
  const token = readFileSync(join(owner.dataDir, 'projects', room, 'sharing.key'), 'utf8').trim();

  // ---- the guest joins, and writes too ----
  await guest.waitForText('h2', 'Welcome to Glaukopis');
  await guest.clickText('button', 'Join a shared project');
  await guest.waitForText('dialog h2', 'Join a shared project');
  await guest.type('dialog input[name="server"]', address);
  await guest.type('dialog input[name="code"]', code);
  await guest.type('dialog input[placeholder="As the others know you"]', 'Anna Lind');
  await guest.clickText('dialog footer button', 'Join');
  await guest.waitFor('.project', 10000);
  await guest.view('text');
  await until('the owner’s words to reach the guest', async () => (await written(guest)).includes(OWNERS));
  await guest.click(body);
  await guest.keys(['Control', 'End']);
  await guest.press('Enter');
  await guest.keys(GUESTS);
  await until('the guest’s words to reach the owner', async () => (await written(owner)).includes(GUESTS));
  check('two share a project, and each has what the other wrote', true);
  const guestId = JSON.parse(
    await guest.execAsync(`return JSON.stringify(await window.__TAURI_INTERNALS__.invoke('project_list'));`),
  )[0].id;

  // ---- a later version enters, and writes in a form the two do not know ----
  const later = await enter(room, token, 2);
  await until('the later version to be given the project', () => later.synced && textOf(later.doc).includes(GUESTS));
  later.doc.transact(() => {
    later.doc.getMap('form').set('2', true);
    const text = later.doc.getMap('nodes').get('project').get('body');
    const block = new Y.XmlElement('of-a-later-form');
    const paragraph = new Y.XmlElement('paragraph');
    paragraph.insert(0, [new Y.XmlText(LATERS)]);
    block.insert(0, [paragraph]);
    text.insert(text.length, [block]);
  });

  // ---- both are told, once ----
  const badgeOf = (app) => app.attr('.top [data-path] [data-crumb="project"] .badge', 'data-status');
  if (EARLIER) {
    // A version from before the guard has no words for it: it is let go, and shows the server as not within reach.
    for (const [who, app] of [['owner', owner], ['guest', guest]]) {
      const end = Date.now() + 15000;
      let badge = await badgeOf(app);
      while (badge !== 'offline' && Date.now() < end) {
        await sleep(200);
        badge = await badgeOf(app);
      }
      check(`the ${who}, of a version from before the guard, is let go by the server`, badge === 'offline', String(badge));
    }
    await owner.screenshot('later-form-shared-1-earlier');
  } else {
    for (const [who, app] of [['owner', owner], ['guest', guest]]) {
      await app.waitForText('dialog h2', 'Written in by a later version', 15000);
      const told = await app.text('dialog[open]');
      check(
        `the ${who} is told that a later version has written in the project`,
        told.includes('Update Glaukopis to work on it with the others') && told.includes('What you write is kept here'),
        told.replace(/\s+/g, ' ').slice(0, 220),
      );
    }
    await owner.screenshot('later-form-shared-1-told');
    for (const app of [owner, guest]) {
      await app.clickText('dialog footer button', 'Understood');
      await app.waitGone('dialog[open]');
    }
  }
  await sleep(1500);
  check('the later version stays', later.closed === null, String(later.closed));
  check('the server says in its log whom it let go', serverLog.join('').includes('is let go'), serverLog.slice(-4).join(''));

  // ---- neither lost a word, neither has what it does not know ----
  for (const [who, app, id] of [['owner', owner, room], ['guest', guest, guestId]]) {
    const shown = await written(app);
    check(`the ${who} still has every word`, shown.includes(OWNERS) && shown.includes(GUESTS), shown);
    check(`and nothing of what the later version wrote`, !shown.includes(LATERS), shown);
    const badge = await badgeOf(app);
    check(`the sign of the project of the ${who} says that the server is not within reach`, badge === 'offline', String(badge));
  }

  // ---- what is written after is kept ----
  await owner.click(body);
  await owner.keys(['Control', 'End']);
  await owner.press('Enter');
  await owner.keys(AFTER);
  await until('the words written after', async () => (await written(owner)).includes(AFTER));
  await owner.shareWindow();
  await owner.waitForText('dialog h2', 'Shared project', 8000);
  const state = (await owner.text('dialog .state')).replace(/\s+/g, ' ').trim();
  if (EARLIER) check('the sharing window says that the server cannot be reached', state.includes('cannot be reached'), state);
  else check('the sharing window says why', state.includes('has been written in by a later version of Glaukopis'), state);
  await owner.screenshot('later-form-shared-2-window');
  await owner.clickText('dialog footer button', 'Done');
  await owner.waitGone('dialog[open]');
  // To the start screen, so that the project is let go and written whole.
  await owner.home();
  await guest.home();
  await sleep(1200);
  for (const [who, app, id] of [['owner', owner, room], ['guest', guest, guestId]]) {
    const doc = await onDisk(app, id);
    const text = textOf(doc);
    check(
      `on the disk of the ${who} the project is of the first form, with every word and no block it does not know`,
      doc.getMap('form').size === 0 && text.includes(OWNERS) && text.includes(GUESTS) && !text.includes('of-a-later-form'),
      text.slice(0, 300),
    );
    if (who === 'owner') check('and with what was written after', text.includes(AFTER), text.slice(0, 300));
  }

  // ---- and nobody deleted what the later version wrote ----
  await sleep(1500);
  const again = await enter(room, token, 2);
  await until('one who knows the form to be given the project', () => again.synced);
  const kept = textOf(again.doc);
  check(
    'what the later version wrote is on the server, whole, with what the two wrote',
    kept.includes(`<of-a-later-form><paragraph>${LATERS}</paragraph></of-a-later-form>`) &&
      kept.includes(OWNERS) &&
      kept.includes(GUESTS),
    kept,
  );
  check('what was written while kept out is not there yet', !kept.includes(AFTER));
  const earlier = await enter(room, token, 0);
  await until('the server to answer one who says no form', () => earlier.closed !== null);
  check('one who does not know the form is not let in', earlier.closed === 4007 && !earlier.synced, String(earlier.closed));
  later.leave();
  again.leave();

  for (const [who, app] of [['owner', owner], ['guest', guest]]) {
    const errors = (await app.pageErrors()).filter((e) => !/WebSocket|websocket|Failed to load resource/.test(e));
    check(`no errors in the window of the ${who}`, errors.length === 0, errors.join(' ‖ '));
  }
} catch (error) {
  console.error(error);
  check('the script ran to its end', false, String(error.message ?? error));
  await owner?.screenshot('later-form-shared-failure-owner').catch(() => {});
  await guest?.screenshot('later-form-shared-failure-guest').catch(() => {});
  console.error(serverLog.slice(-20).join(''));
} finally {
  await owner?.close();
  await guest?.close();
  server.kill('SIGTERM');
  await sleep(200);
  rmSync(serverData, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
process.exit(failed.length ? 1 : 0);
