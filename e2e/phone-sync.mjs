// The settings of the phone, and the synchronization set up from the phone
// (stage 2 of docs/plans/an-app-for-android.md, part E): `glaukopis --phone`
// beside the application as a computer of the same writer and the real
// server, each in a folder of the run, as e2e/synchronization.mjs makes its
// two. What a script presses or reads is, of part E, `data-phone-settings`,
// `data-phone-language` (the chooser of the language), `data-phone-theme`
// (the three colours) and `data-sync-...` of the section of the
// synchronization; of part C, `data-phone-notes`, `data-phone-to-settings`,
// `data-phone-row={id}` and `data-phone-back` (the arrow of the top row);
// of part D, `data-phone-note={id}`; the hook `window.__glaukopisPhone` has
// `note`, `remove`, `box` (C) and `picture` (D). The words of the lines the
// engine logs when the app is not in front are named at the head of the
// script (`LEFT_FRONT`, `BACK_IN_FRONT`), as the plan words them.
//
// The settings: the language chosen is kept (Norwegian, spoken at once, then
// English again), and so are the colours (dark, then light), and the page
// is dark where the colours say so. The computer holds a project, a
// reference with a file, a file of the library alone and a note; it starts a
// home and makes a code. On the phone: the settings, with the sentence of a
// device that takes the notes under Synchronization, the keyboard asked for
// an address and for a code in capitals; Join with a code, the server, the
// name the system offers changed to Phone, the code, Join; the devices are
// listed, the phone as this device. The note of the computer is in the list
// of the phone, and one written on the computer later is there without a new
// start. A note written on the phone, with a picture put into it by the
// hook, is on the computer: its words in the computer's notebook, and the
// picture in its store, byte for byte. The phone's folder holds the
// reference and none of the computer's projects, files or settings. Add a
// device... on the phone shows a code, and a device is renamed (the computer
// knows it by its new name).
//
// Then the phone is started once more at 320 by 568, on the same folder,
// where nothing of the settings lies outside the window, and what is pressed
// is at least 44 pixels high and wide: with the code shown, with the
// question of renaming open, and later with the section turned off. The
// line over the notes: the server is ended and a note is written on the
// phone, and the line says that it is kept here (and the status says that
// it waits); the server is started again on the same folder and port,
// Synchronize now is pressed in the settings, the line is gone and the note
// is on the computer. Not in front: the page's visibilityState is made
// hidden and the event sent, and the log of the phone says that nothing is
// asked at regular times; made visible again, the log says so and a round is
// made. Last, the computer stops synchronizing; on the phone Stop
// synchronizing on this device asks the question of the last device that
// takes the notes (the projects and the files of the library are not on it,
// and what the server keeps of them is deleted), and confirmed, the section
// says that the device is not synchronized and the server keeps nothing of
// the home. No errors in either page.
// Screenshots in e2e/output/phone-sync-<n>-<what>.png.

import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { App, freePort, root, sleep } from './harness.mjs';

/**
 * What the log of the phone says when the app leaves the front, and when it
 * is in front again (`Sync::front` of crates/core/src/sync/engine.rs): matched
 * as the plan words the two lines, to be made what the log says if it says
 * otherwise.
 */
const LEFT_FRONT = /not in front/i;
const BACK_IN_FRONT = /in front again/i;

const checks = [];
function check(name, ok, detail = '') {
  checks.push({ name, ok });
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

async function until(what, fn, ms = 15000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`timed out waiting for ${what}`);
    await sleep(250);
  }
}

const invoke = (app, command, args = {}) =>
  app.execAsync(`return await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]);`, command, args);

/** When everything was last the same on a device, in milliseconds; 0 before the first time. */
async function lastSame(app) {
  const status = await invoke(app, 'sync_status');
  return status.last ? Date.parse(status.last) : 0;
}

/** Rounds at once on the device until everything was the same after `since`. */
async function settle(app, since, what) {
  await invoke(app, 'sync_now');
  await until(what, async () => (await lastSame(app)) > since, 30000);
}

/** Puts words in place of what a field holds. */
async function fill(app, selector, words) {
  await app.exec(`const i = document.querySelector(arguments[0]); i.focus(); i.select(); return null;`, selector);
  await app.keys(words);
}

/** A picture of one colour, as a file: no other that the library holds is the same. */
function makePng(width, height, [red, green, blue]) {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes) => {
    let c = 0xffffffff;
    for (const b of bytes) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits
  header[9] = 2; // colour: red, green, blue
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => [red, green, blue]).flat())]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// The picture the computer's library holds alone: one dot, as the library takes one in.
const DOT =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
// The picture put into the note written on the phone.
const PICTURE = makePng(16, 16, [196, 64, 48]);

/** The files under a folder, with their bytes. */
function filesUnder(dir) {
  const found = [];
  const walk = (at) => {
    if (!existsSync(at)) return;
    for (const entry of readdirSync(at, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(at, entry.name));
      else if (!entry.name.startsWith('.')) found.push(join(at, entry.name));
    }
  };
  walk(dir);
  return found;
}

// ---- the server ----
const binary = join(root, 'target', 'debug', 'glaukopis-server');
if (!existsSync(binary)) throw new Error(`No server at ${binary}. Build it first: cargo build -p glaukopis-server`);
const serverData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-server-'));
const port = await freePort();
const address = `127.0.0.1:${port}`;
const serverLog = [];

function startServer() {
  const child = spawn(binary, ['--listen', address, '--data', serverData, '--password', 'sesame'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', (d) => serverLog.push(String(d)));
  child.stdout.on('data', (d) => serverLog.push(String(d)));
  return child;
}

async function serverAnswers() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://${address}/api/info`)).ok) return;
    } catch {
      await sleep(100);
    }
  }
  throw new Error(`the server did not answer:\n${serverLog.join('')}`);
}

/** The server ended, as a network that is gone. */
async function endServer() {
  const ended = new Promise((done) => server.once('exit', done));
  server.kill();
  await ended;
}

const homes = () => (existsSync(join(serverData, 'homes')) ? readdirSync(join(serverData, 'homes')) : []);

let server = startServer();
await serverAnswers();

// ---- the notebook of the computer, and the notes of the phone ----
const ROWS = '[data-notes] [role="option"]';
/** The titles of the rows of the notebook of the computer, as they stand. */
const titles = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('${ROWS} .title')).map((t) => t.textContent.trim())`);
/** The words of the text of the note chosen on the computer. */
const noteText = (app) =>
  app.exec(`return document.querySelector('[data-note-text] .ProseMirror')?.textContent ?? ''`);
/** What the rows of the notes of the phone say, one string for them all. */
const phoneRows = (app) =>
  app.exec(`return Array.from(document.querySelectorAll('[data-phone-notes] [data-phone-row]')).map((r) => r.textContent.replace(/\\s+/g, ' ').trim()).join(' | ')`);
/** What the place of the notes says, the line over it among it. */
const notesText = (app) =>
  app.exec(`return (document.querySelector('[data-phone-notes]')?.textContent ?? '').replace(/\\s+/g, ' ')`);

/** The computer's notebook is shown, and a new note written in it. */
async function deskNote(app, name, words) {
  if (!(await app.exists('[data-notebook]'))) {
    await app.click('[data-place="library"]');
    await app.waitFor('[data-top-row] [data-library-switch]', 8000);
    await app.clickText('[data-library-switch] [role="radio"]', 'Notebook');
    await app.waitFor('[data-notebook]', 8000);
  }
  if (await app.exists('[data-notebook-empty]')) await app.clickText('[data-notebook-empty] button', 'New note');
  else await app.click('[data-new-note]');
  await app.waitFor('[data-note-editor] [data-note-text] .ProseMirror', 5000);
  await app.waitUntil(`return !!document.activeElement?.closest?.('[data-note-text]')`, 3000, 'the new note to have the cursor');
  await app.keys(words);
  await app.click('[data-note-name]');
  await app.keys(name);
  await app.press('Enter');
  await sleep(500);
}

/** What lies outside the window, and what is pressed that is smaller than a finger, within a place of the phone. */
const measure = (app, place) =>
  app.exec(
    `const root = document.querySelector(arguments[0]);
     const width = window.innerWidth;
     const describe = (el, r) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '') + ' ' + Math.round(r.left) + '..' + Math.round(r.right) + 'x' + Math.round(r.height);
     const outside = [];
     const sideways = [];
     const small = [];
     for (const el of root.querySelectorAll('*')) {
       if (el.closest('[hidden]')) continue;
       const r = el.getBoundingClientRect();
       if (!r.width && !r.height) continue;
       if (r.right > width + 0.5 || r.left < -0.5) outside.push(describe(el, r));
       // A field or a chooser holds more than it shows, and says so with the cursor: only what lies in the page's way is looked for.
       if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) && el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible' && el.clientWidth > 0) sideways.push(describe(el, r));
     }
     for (const el of root.querySelectorAll('button, select, input, [role="radio"]')) {
       if (el.closest('[hidden]') || el.closest('[data-phone-bar]')) continue;
       const own = el.getBoundingClientRect();
       if (!own.width && !own.height) continue;
       // A field is pressed by its frame, which is what the finger finds.
       const r = (el.closest('.frame') ?? el).getBoundingClientRect();
       if (r.height < 43.5 || r.width < 43.5) small.push(describe(el, r));
     }
     return { width, scrollWidth: document.documentElement.scrollWidth, outside, sideways, small };`,
    place,
  );

/**
 * The place is within the window, and, where `fingers` is asked, what is
 * pressed in it is for a finger: of the settings, which are part E's; the
 * notes are part C's, and their buttons are looked at in its script.
 */
async function fits(app, place, what, { fingers = true } = {}) {
  const m = await measure(app, place);
  check(`${what}: nothing lies outside the window`, m.scrollWidth <= m.width && m.outside.length === 0 && m.sideways.length === 0, `window ${m.width}, page ${m.scrollWidth}; ${[...m.outside, ...m.sideways].slice(0, 4).join('; ')}`);
  if (fingers) check(`${what}: what is pressed is at least 44 pixels high and wide`, m.small.length === 0, m.small.slice(0, 6).join('; '));
}

/** To the settings from the notes, and the section of the synchronization shown. */
async function toSettings(app) {
  await app.waitFor('[data-phone-notes]', 15000);
  await app.click('[data-phone-to-settings]');
  await app.waitFor('[data-phone-settings]', 5000);
  await app.waitFor('[data-synchronization]:not([data-synchronization=""])', 8000);
}

/** Back to the notes by the arrow of the top row. */
async function toNotes(app) {
  await app.click('[data-phone-back]');
  await app.waitFor('[data-phone-notes]', 5000);
}

/** Opens the note of this id from the list of the notes. */
async function openNote(app, id) {
  await app.click(`[data-phone-row="${id}"]`);
  await app.waitFor(`[data-phone-note="${id}"] .ProseMirror`, 5000);
  await sleep(300);
}

const hook = (app, call, ...args) =>
  app.execAsync(`return await window.__glaukopisPhone.${call}(...arguments);`, ...args);

// A folder for the phone that outlives the one start of it: the second start is on the same.
const phoneData = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-phone-'));

let desk;
let phone;
try {
  desk = await App.launch({ width: 1280, height: 860 });
  phone = await App.launch({ args: ['--phone'], dataDir: phoneData, keepData: true, width: 412, height: 915 });
  await desk.installErrorHook();
  await phone.installErrorHook();

  // ---- 1. the settings: the language and the colours ----
  await toSettings(phone);
  await phone.waitUntil(`return !!window.__glaukopisPhone`, 8000, 'the hooks of the page');
  const headings = await phone.exec(`return Array.from(document.querySelectorAll('[data-phone-settings] h2')).map((h) => h.textContent.trim())`);
  check('the settings say Synchronization, Language, Colours and About, in that order', headings.join(' | ') === 'Synchronization | Language | Colours | About', headings.join(' | '));
  check('the top row says Settings and has Back', (await phone.text('[data-phone-bar]')).includes('Settings') && (await phone.exists('[data-phone-back]')));
  await phone.screenshot('phone-sync-1-settings');

  const asked = await phone.exec(`
    const s = document.querySelector('input[name="sync-server"]');
    return { inputmode: s.getAttribute('inputmode'), capitals: s.getAttribute('autocapitalize'), correct: s.getAttribute('autocorrect'), remember: s.getAttribute('autocomplete') };`);
  check('the field of the server asks the keyboard for an address, with no capital, no correction and nothing remembered', asked.inputmode === 'url' && asked.capitals === 'off' && asked.correct === 'off' && asked.remember === 'off', JSON.stringify(asked));
  const aboutNotes = await phone.text('[data-sync-about]');
  check('under Synchronization is the sentence of a device that takes the notes', aboutNotes.includes('Your notebook, the same on this device as on your others') && !aboutNotes.includes('projects'), aboutNotes);
  const nameLabel = await phone.exec(`return document.querySelector('input[name="sync-name"]').closest('.field')?.querySelector('label')?.textContent.trim() ?? ''`);
  check('the field of the name says device', nameLabel === 'Name of this device', nameLabel);
  const about = await phone.text('[data-phone-about]');
  check('the settings say what the program is, with its version', /Glaukopis \d+\.\d+\.\d+/.test(about) && about.includes('Free software'), about.replace(/\s+/g, ' '));

  // Norwegian, spoken at once and kept; then English again.
  const choose = (tag) =>
    phone.exec(`const s = document.querySelector('[data-phone-language]'); s.value = arguments[0]; s.dispatchEvent(new Event('change', { bubbles: true })); return s.value;`, tag);
  const options = await phone.exec(`return Array.from(document.querySelector('[data-phone-language]').options).map((o) => o.value)`);
  check('the language is chosen of a list that has the system’s first and Norwegian among the others', options[0] === 'system' && options.includes('nb') && options.includes('en'), options.join(' '));
  await choose('nb');
  await phone.waitForText('[data-phone-settings] h2', 'Synkronisering', 5000);
  check('the words are those of the language chosen, at once', (await phone.text('[data-phone-bar]')).includes('Innstillinger'));
  const kept = () => (existsSync(join(phoneData, 'settings.json')) ? JSON.parse(readFileSync(join(phoneData, 'settings.json'), 'utf8')) : {});
  await until('the language to be written to the settings', () => kept().language === 'nb', 5000);
  check('and it is kept in the settings of the phone', kept().language === 'nb', String(kept().language));
  await phone.screenshot('phone-sync-2-norwegian');
  await choose('en');
  await phone.waitForText('[data-phone-settings] h2', 'Synchronization', 5000);

  await phone.clickText('[data-phone-theme] [role="radio"]', 'Dark');
  await until('the colours to be written to the settings', () => kept().theme === 'dark', 5000);
  check('dark is kept in the settings of the phone', kept().theme === 'dark', String(kept().theme));
  check('and the page is dark', (await phone.exec(`return document.documentElement.dataset.theme ?? ''`)) === 'dark');
  check('the choice made is the one shown as chosen', (await phone.exec(`return Array.from(document.querySelectorAll('[data-phone-theme] [role="radio"][aria-checked="true"]')).map((r) => r.textContent.trim())`)).join() === 'Dark');
  await phone.screenshot('phone-sync-3-dark');
  await phone.clickText('[data-phone-theme] [role="radio"]', 'Light');
  await until('the colours to be written to the settings', () => kept().theme === 'light', 5000);
  check('light is kept in the settings of the phone', kept().theme === 'light', String(kept().theme));

  // ---- 2. what the computer holds: a project, a reference with a file, a file of the library alone and a note ----
  await invoke(desk, 'project_create', { name: 'A book', id: null, folder: null });
  const reference = await invoke(desk, 'library_add', {
    draft: { key: 'Ibsen1879', type: 'book', fields: { title: 'Et dukkehjem', year: '1879' }, names: {} },
  });
  await invoke(desk, 'attachment_add', { id: reference.id, paths: [join(root, 'e2e', 'fixtures', 'shape.pdf')] });
  await invoke(desk, 'files_add_image', { name: 'dot.png', content: DOT, folder: null });
  await invoke(desk, 'settings_set', { changed: { theme: 'dark' } });
  await deskNote(desk, 'Seen from the desk', 'Written at the desk, before the phone came.');
  await invoke(desk, 'sync_start', { server: address, name: 'Desk', password: 'sesame' });
  await settle(desk, 0, 'the computer to have made its first round');
  const { code } = await invoke(desk, 'sync_code');

  // ---- 3. the phone joins, from its settings ----
  await phone.clickText('[data-synchronization] [role="radio"]', 'Join with a code');
  await phone.waitFor('input[name="sync-code"]', 3000);
  const asksCode = await phone.exec(`const c = document.querySelector('input[name="sync-code"]'); return { capitals: c.getAttribute('autocapitalize'), correct: c.getAttribute('autocorrect') };`);
  check('the field of the code asks the keyboard for capitals and no correction', asksCode.capitals === 'characters' && asksCode.correct === 'off', JSON.stringify(asksCode));
  await fill(phone, 'input[name="sync-server"]', address);
  // Leaving the field asks the server.
  await phone.click('input[name="sync-name"]');
  const offered = await phone.exec(`return document.querySelector('input[name="sync-name"]').value`);
  check('the name the system gives the device is offered', offered.length > 0, offered);
  await fill(phone, 'input[name="sync-name"]', 'Phone');
  await fill(phone, 'input[name="sync-code"]', code);
  await phone.screenshot('phone-sync-4-before-joining');
  await phone.click('[data-sync-begin]');
  await phone.waitFor('[data-sync-computer="Phone"][data-sync-you]', 15000);
  await phone.waitFor('[data-sync-computer="Desk"]', 8000);
  const devices = await phone.exec(`return Array.from(document.querySelectorAll('[data-sync-computer]')).map((d) => d.textContent.replace(/\\s+/g, ' ').trim())`);
  check('the devices are listed, the phone as this device', devices.length === 2 && devices.some((d) => d.startsWith('Phone (this device)')), devices.join(' | '));
  const listHeading = await phone.exec(`return document.querySelector('[data-synchronization] h3')?.textContent.trim() ?? ''`);
  check('the list says Devices, and the way to another says Add a device…', listHeading === 'Devices' && (await phone.text('[data-sync-add]')).trim() === 'Add a device…', listHeading);
  await phone.screenshot('phone-sync-5-joined');
  await settle(phone, 0, 'the phone to have made its first round');
  await settle(phone, await lastSame(phone), 'a second round of the phone');
  await settle(desk, 0, 'the computer to have made a round with the phone in the home');

  // ---- 4. what the phone holds ----
  const sync = JSON.parse(readFileSync(join(phoneData, 'sync', 'sync.json'), 'utf8'));
  check('the phone\'s folder says it takes the notes', sync.takes === 'notes', JSON.stringify(sync.takes));
  const bib = existsSync(join(phoneData, 'library', 'library.bib')) ? readFileSync(join(phoneData, 'library', 'library.bib'), 'utf8') : '';
  check('the phone holds the reference', bib.includes('Ibsen1879'));
  const projectsHere = existsSync(join(phoneData, 'projects'))
    ? readdirSync(join(phoneData, 'projects')).filter((n) => !n.startsWith('.') && !n.endsWith('.json'))
    : [];
  check('the phone holds no project', projectsHere.length === 0, projectsHere.join(', '));
  check('the phone has not the computer\'s setting', kept().theme !== 'dark', String(kept().theme));
  const filesHere = filesUnder(join(phoneData, 'library', 'attachments'));
  check('the phone holds no file of the library', filesHere.length === 0, filesHere.join(', '));

  // ---- 5. the note of the computer is in the list of the phone, and one written later without a new start ----
  await toNotes(phone);
  await until('the note of the computer in the list of the phone', async () => (await phoneRows(phone)).includes('Seen from the desk'), 30000);
  check('the note of the computer is in the list of the phone', true, await phoneRows(phone));
  await deskNote(desk, 'Written later at the desk', 'A second note, with the phone in the home.');
  await invoke(desk, 'sync_now');
  await invoke(phone, 'sync_now');
  await until('the second note of the computer in the list of the phone', async () => (await phoneRows(phone)).includes('Written later at the desk'), 45000);
  check('a note written on the computer later is in the list without a new start', true, await phoneRows(phone));
  await phone.screenshot('phone-sync-6-notes');

  // ---- 6. a note written on the phone, with a picture, is on the computer ----
  const noteId = await hook(phone, 'note', { name: 'Seen on the phone', words: 'Written on the phone, with a picture.' });
  await sleep(500);
  await openNote(phone, noteId);
  await hook(phone, 'picture', 'colour.png', PICTURE.toString('base64'));
  await sleep(1500);
  await toNotes(phone);
  await sleep(1000);
  await invoke(phone, 'sync_now');
  await until('the note of the phone in the notebook of the computer', async () => {
    await invoke(desk, 'sync_now');
    return (await titles(desk)).includes('Seen on the phone');
  }, 45000);
  await desk.clickText(ROWS, 'Seen on the phone');
  await sleep(500);
  const words = await until('its words in the computer', async () => {
    const text = await noteText(desk);
    return text.includes('Written on the phone, with a picture.') ? text : '';
  }, 8000);
  check('a note written on the phone is on the computer, with its words', !!words, words);
  const pictureHere = await until('the picture in the store of the computer', async () => {
    await invoke(desk, 'sync_now');
    return filesUnder(join(desk.dataDir, 'library', 'attachments')).find((f) => Buffer.compare(readFileSync(f), PICTURE) === 0);
  }, 45000).catch(() => null);
  check('and the picture put into it is in the computer\'s store, byte for byte', !!pictureHere, pictureHere ?? '');
  await desk.screenshot('phone-sync-7-on-the-computer');

  // ---- 7. a code for one more device, and a device renamed ----
  await toSettings(phone);
  await phone.click('[data-sync-add]');
  const shown = await until('a code to be shown', async () => (await phone.exec(`return document.querySelector('[data-sync-code]')?.textContent.trim() ?? ''`)) || '', 8000);
  check('Add a device… on the phone shows a code', /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(shown), shown);
  await phone.clickText('[data-sync-computer="Desk"] button', 'Rename');
  await phone.waitFor('dialog[open] input', 5000);
  await fill(phone, 'dialog[open] input', 'Study');
  await phone.clickText('dialog[open] footer button', 'Rename');
  await phone.waitFor('[data-sync-computer="Study"]', 8000);
  const named = await invoke(desk, 'sync_home');
  check('a device is renamed, and the server knows it by its new name', named.devices.some((d) => d.name === 'Study') && !named.devices.some((d) => d.name === 'Desk'), named.devices.map((d) => d.name).join(', '));
  await phone.screenshot('phone-sync-8-renamed');

  const errorsFirst = await phone.pageErrors();
  const deskErrors = await desk.pageErrors();
  check('no errors in the page of the phone, started at 412', errorsFirst.length === 0, errorsFirst.join(' | '));
  check('no errors in the computer\'s page', deskErrors.length === 0, deskErrors.join(' | '));

  // ---- 8. the phone once more, 320 by 568, on the same folder ----
  await phone.close();
  phone = await App.launch({ args: ['--phone'], dataDir: phoneData, keepData: true, width: 320, height: 568 });
  await phone.installErrorHook();
  await toSettings(phone);
  await phone.waitFor('[data-sync-computer="Study"]', 15000);
  check('the phone is synchronized still, as the device it was', await phone.exists('[data-sync-computer="Phone"][data-sync-you]'));
  await fits(phone, '[data-phone-settings]', 'the settings at 320, the section on');
  await phone.click('[data-sync-add]');
  await until('a code to be shown', async () => await phone.exists('[data-sync-code]'), 8000);
  await fits(phone, '[data-phone-settings]', 'the settings at 320, with a code shown');
  await phone.screenshot('phone-sync-9-narrow-on');
  await phone.clickText('[data-sync-computer="Study"] button', 'Rename');
  await phone.waitFor('dialog[open]', 5000);
  const box = await phone.exec(`const r = document.querySelector('dialog[open]').getBoundingClientRect(); return { left: r.left, right: r.right, width: window.innerWidth };`);
  check('the question of renaming stands within 320', box.left >= -0.5 && box.right <= box.width + 0.5, JSON.stringify(box));
  await phone.screenshot('phone-sync-10-narrow-rename');
  await phone.clickText('dialog[open] footer button', 'Cancel');
  await phone.waitGone('dialog[open]', 3000);

  // ---- 9. the line over the notes: the server ended, a note written, the server back ----
  await toNotes(phone);
  await phone.waitUntil(`return !!window.__glaukopisPhone`, 8000, 'the hooks of the page');
  check('there is no line over the notes while the server is reached and nothing waits', !(await notesText(phone)).includes('Kept here, and sent when the server is reached'));
  await endServer();
  await hook(phone, 'note', { name: 'Written without the server', words: 'Kept here until the server is back.' });
  await sleep(1500);
  const waiting = await until('the status to say that something waits', async () => {
    await invoke(phone, 'sync_now');
    await sleep(1500);
    const status = await invoke(phone, 'sync_status');
    return status.state === 'offline' && status.waiting === true ? status : null;
  }, 60000);
  check('the status says that the server is not reached and that something waits', waiting.waiting === true && waiting.state === 'offline', JSON.stringify(waiting));
  await phone.waitForText('[data-phone-notes]', 'Kept here, and sent when the server is reached', 8000);
  check('the line over the notes says that what was written is kept here', true);
  await fits(phone, '[data-phone-notes]', 'the notes at 320, with the line', { fingers: false });
  await phone.screenshot('phone-sync-11-waiting');

  server = startServer();
  await serverAnswers();
  const before = await lastSame(phone);
  await toSettings(phone);
  await phone.click('[data-sync-now]');
  await until('a round to have ended well', async () => {
    const status = await invoke(phone, 'sync_status');
    return status.state === 'idle' && status.waiting === false && Date.parse(status.last ?? '') > before;
  }, 60000);
  await toNotes(phone);
  await until('the line to be gone', async () => !(await notesText(phone)).includes('Kept here, and sent when the server is reached'), 8000);
  check('the server back and a round made, the line is gone', true);
  await until('the note written without the server in the notebook of the computer', async () => {
    await invoke(desk, 'sync_now');
    return (await titles(desk)).includes('Written without the server');
  }, 60000);
  check('and the note written meanwhile is on the computer', true);
  await phone.screenshot('phone-sync-12-sent');

  // ---- 10. not in front: nothing asked at regular times, and a round when it comes back ----
  const shownAs = (state) =>
    phone.exec(
      `Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => arguments[0] });
       Object.defineProperty(document, 'hidden', { configurable: true, get: () => arguments[0] === 'hidden' });
       document.dispatchEvent(new Event('visibilitychange'));
       return null;`,
      state,
    );
  await shownAs('hidden');
  await until('the log to say that the app is not in front', () => LEFT_FRONT.test(phone.log.join('')), 10000);
  check('not in front, the log of the phone says that nothing is asked at regular times', true);
  const left = await lastSame(phone);
  await shownAs('visible');
  await until('the log to say that the app is in front again', () => BACK_IN_FRONT.test(phone.log.join('')), 10000);
  check('in front again, the log says so', true);
  await until('a round to be made when it came back', async () => (await lastSame(phone)) > left, 30000);
  check('and a round is made when it comes back', true);

  // ---- 11. the computer stops; the phone, the last device, stops, and the question is its own ----
  await invoke(desk, 'sync_stop');
  await toSettings(phone);
  await until('the phone to list itself alone', async () => (await phone.count('[data-sync-computer]')) === 1, 20000);
  check('the phone lists itself alone', true);
  await phone.click('[data-sync-stop]');
  await phone.waitForText('dialog h2', 'Stop synchronizing on this device?', 5000);
  const question = await phone.exec(`return Array.from(document.querySelectorAll('dialog[open]')).map((d) => d.textContent).join(' ')`);
  check(
    'the last device that takes the notes is told that the projects and the files of the library are not on it, and what the server keeps of them is deleted',
    question.includes('nothing is left on the server') &&
      question.includes('Your projects and the files of your library are not on this device') &&
      question.includes('what the server keeps of them is deleted'),
    question.replace(/\s+/g, ' '),
  );
  await phone.screenshot('phone-sync-13-stop');
  await phone.clickText('dialog footer button', 'Stop synchronizing');
  await phone.waitFor('[data-synchronization="off"]', 10000);
  check('the section says that the device is not synchronized, and offers to begin again', await phone.exists('[data-sync-begin]'));
  await until('the server to keep nothing of the home', async () => homes().length === 0, 10000);
  check('and the server keeps nothing of the home', homes().length === 0, homes().join(', '));
  await fits(phone, '[data-phone-settings]', 'the settings at 320, the section off');
  await phone.screenshot('phone-sync-14-narrow-off');
  await toNotes(phone);
  const kept320 = await phoneRows(phone);
  check('the phone keeps what it held: its notes are there', kept320.includes('Seen from the desk') && kept320.includes('Seen on the phone'), kept320);
  check('and its reference', readFileSync(join(phoneData, 'library', 'library.bib'), 'utf8').includes('Ibsen1879'));

  // ---- 12. no errors ----
  const phoneErrors = await phone.pageErrors();
  check('no errors in the page of the phone, started at 320', phoneErrors.length === 0, phoneErrors.join(' | '));
} catch (error) {
  check('the script ran to its end', false, error.stack ?? String(error));
  await phone?.screenshot('phone-sync-failure').catch(() => {});
} finally {
  await phone?.close().catch(() => {});
  await desk?.close().catch(() => {});
  server.kill();
  rmSync(serverData, { recursive: true, force: true });
  rmSync(phoneData, { recursive: true, force: true });
  rmSync(`${phoneData}-config`, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
