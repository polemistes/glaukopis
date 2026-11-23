// What the phone collects (stage 3 of docs/plans/an-app-for-android.md, part
// B), through `glaukopis --phone` at 412 by 915. Before the role is started,
// three things of the kind `shared` are laid into `notebook/inbox/` of its
// folder as shared.rs lays them (an item.json, and under files/ each file by
// the SHA-256 of what it holds): words as Chrome hands a selection over,
// within straight quotation marks and with the subject `Including link: `;
// an address alone with a subject; a picture with words beside it and a
// subject. The role starts: three notes, not looked at, and the inbox empty.
// The first begins as the words do, with their quotation marks, is not
// named, and its source is No source. The second is named by the subject,
// its text is the address, and its source says the page. The third holds the
// words and the picture as a figure, whose source is the file, is not named,
// and the row of the list shows the picture small; the file is in the store.
//
// Then, with the page running and `window.glaukopisAndroid` stood in for by
// the script (an object that counts how often `leave` and `photographed` are
// asked): a fourth thing laid into the inbox and asked({ arrived: [its
// name] }): its note is shown, without the cursor in its text; Back (the
// hook): the notes, and `leave` was asked once. A note opened from the list,
// a fifth thing arrived: its note is shown; the arrow at its head: the note
// from before, and `leave` not asked again; the arrow once more: the notes.
// asked({ note: true }): a new note, with the cursor in its text, in the box
// that receives. In that note: the seven tools are in the row and within the
// window; file('plate.png', ...): a figure in the text, the file its source;
// file('paper.pdf', ...): a file at the note's end; a file of two megabytes
// and a half of pseudo-random bytes, which goes in five pieces (counted by
// taking.test.ts: the page's calls cannot be counted from a script): the
// store's file is the one the script worked out and notebook/taking holds
// nothing; a photograph handed to the
// field of the camera, as the camera hands one: a figure, and the Android
// part is told once. Back: the notes, and `leave` not asked. The command
// `notebook_take_files` is refused, as the phone's list holds it. No errors
// in the page. Then once more at 320 by 568 on the same folder: the note
// opened, the row of seven is within the window.
//
// What it presses and reads, beside the attributes of the plan: of the notes,
// data-phone-row, data-phone-row-title, data-phone-row-source and
// data-unseen; of a note, data-phone-note, data-phone-name, data-phone-text,
// data-phone-box, data-phone-source (a chip under the text, `none` for no
// source), data-phone-back and data-phone-tools; of the row of tools,
// data-phone-tool (`file`, `photograph`) and the hidden fields
// data-phone-input="file" and data-phone-input="photograph"; the hooks of
// window.__glaukopisPhone: asked, back, file and note.
// Screenshots in e2e/output/phone-collect-<n>-<what>.png.

import { createHash, randomBytes } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { App, sleep } from './harness.mjs';

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
    await sleep(150);
  }
}

/** A picture of one colour, as a file: no other that the notebook holds is the same. */
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

/**
 * Bytes that look random and are the same wherever this is run, the page
 * and here alike (xorshift): the page makes them and the script works out
 * what the store should hold, with nothing large sent between the two.
 */
function scrambled(size) {
  const bytes = new Uint8Array(size);
  let x = 2463534242;
  for (let i = 0; i < size; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    bytes[i] = (x >>> 8) & 0xff;
  }
  return bytes;
}

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Every file under a folder, but for those that begin with a dot. */
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

const OWL_PLATE = makePng(8, 8, [60, 120, 180]);
const PLATE = makePng(8, 8, [196, 64, 48]);
const PHOTO = makePng(8, 8, [40, 160, 80]);
const PAPER = Buffer.from('%PDF-1.4\n% a paper of one line\n%%EOF\n', 'latin1');
const SCAN = 2.5 * 1024 * 1024;

const dataDir = mkdtempSync(join(tmpdir(), 'glaukopis-e2e-phone-collect-'));
const inbox = join(dataDir, 'notebook', 'inbox');
const store = join(dataDir, 'library', 'attachments');
const taking = join(dataDir, 'notebook', 'taking');
mkdirSync(inbox, { recursive: true });

/**
 * Lays a thing of the kind `shared` into the inbox as shared.rs does: whole,
 * as `.tmp-<id>` first and then named, with each file under `files/` by the
 * hash of what it holds. An id is thirteen digits of milliseconds, a dash and
 * eight signs; gives it, which is the name of the thing the page is told.
 */
let at = Date.now();
function lay({ text = '', subject = '', files = [] }, when) {
  const id = `${String(++at).padStart(13, '0')}-${randomBytes(4).toString('hex')}`;
  const writing = join(inbox, `.tmp-${id}`);
  mkdirSync(join(writing, 'files'), { recursive: true });
  const held = files.map(({ name, bytes }) => {
    const hash = sha(bytes);
    writeFileSync(join(writing, 'files', hash), bytes);
    return { hash, name };
  });
  writeFileSync(
    join(writing, 'item.json'),
    JSON.stringify({ kind: 'shared', url: '', title: subject, when, text, html: '', alt: '', name: '', files: held }),
  );
  renameSync(writing, join(inbox, id));
  return id;
}

/** A moment some minutes ago, one after another, so that the notes stand in the order the things were laid. */
const minutesAgo = (n) => new Date(Date.now() - n * 60_000).toISOString();

const hook = (app, name, ...args) =>
  app.execAsync(`return await window.__glaukopisPhone[arguments[0]](...arguments[1]);`, name, args);

const tryInvoke = (app, command, args = {}) =>
  app.execAsync(
    `try { return { ok: await window.__TAURI_INTERNALS__.invoke(arguments[0], arguments[1]) }; } catch (e) { return { refused: String(e?.message ?? e) }; }`,
    command,
    args,
  );

/** The rows of the list as they read, newest first. */
const rows = (app) =>
  app.exec(`return [...document.querySelectorAll('[data-phone-row]')].map((r) => ({
    id: r.dataset.phoneRow,
    title: r.querySelector('[data-phone-row-title]')?.textContent.trim() ?? '',
    source: r.querySelector('[data-phone-row-source]')?.textContent.trim() ?? null,
    unseen: r.hasAttribute('data-unseen'),
    picture: !!r.querySelector('img'),
  }));`);

/** What the note shown holds: its id, name, words, the box it lies in, the chips of its sources, how many figures and which files (by their hashes) stand in its text. */
const shown = (app) =>
  app.exec(`const note = document.querySelector('[data-phone-note]');
    if (!note) return null;
    return {
      id: note.dataset.phoneNote,
      name: note.querySelector('[data-phone-name]')?.value ?? null,
      words: note.querySelector('[data-phone-text] .ProseMirror')?.textContent ?? '',
      box: note.querySelector('[data-phone-box]')?.textContent.trim() ?? '',
      chips: [...note.querySelectorAll('[data-phone-source]')].map((c) => c.dataset.phoneSource + ':' + c.textContent.trim()),
      figures: note.querySelectorAll('[data-phone-text] figure').length,
      files: [...note.querySelectorAll('[data-phone-text] .held-file')].map((f) => f.dataset.file ?? ''),
    };`);

/** Whether the cursor is in the text of the note shown. */
const inText = (app) =>
  app.exec(`return !!document.activeElement?.closest?.('[data-phone-note] [data-phone-text] .ProseMirror');`);

/** The row of tools: how many tools it has, and whether every one is within the window and the page does not scroll sideways. */
const toolRow = (app) =>
  app.exec(`const w = window.innerWidth;
    const buttons = [...document.querySelectorAll('[data-phone-tools] button')];
    return {
      count: buttons.length,
      names: buttons.map((b) => b.dataset.phoneTool),
      out: buttons.filter((b) => { const r = b.getBoundingClientRect(); return r.left < -0.5 || r.right > w + 0.5; }).map((b) => b.dataset.phoneTool),
      width: w,
      scroll: document.documentElement.scrollWidth,
    };`);

/** Stands in for the Android part: it counts how often it is asked to leave, and told of a photograph. */
const standIn = (app) =>
  app.exec(`window.glaukopisAndroid = {
      left: 0,
      told: 0,
      ground() {},
      asked() { return '{}'; },
      leave() { this.left++; },
      photographed() { this.told++; },
    };
    return true;`);
const told = (app) => app.exec(`return { left: window.glaukopisAndroid.left, photographed: window.glaukopisAndroid.told };`);

/** What is left in the inbox: everything in it, set aside or not. */
const inInbox = () => (existsSync(inbox) ? readdirSync(inbox) : []);

/** The notes shown in the list, once there are this many. */
const listOf = (app, count) => until(`${count} rows`, async () => ((await rows(app)).length === count ? rows(app) : null));

/** Opens a note from the list and waits for it. */
async function openNote(app, id) {
  await app.click(`[data-phone-row="${id}"]`);
  await app.waitFor(`[data-phone-note="${id}"]`, 5000);
  await sleep(300);
}

/** The arrow at the head of the note. */
async function arrow(app) {
  await app.click('[data-phone-back]');
  await sleep(300);
}

const idOfThing = {};
let phone;
try {
  // ---- 1. three things in the inbox, before the role starts ----
  const selection = '"Owls were sacred to Athena"';
  idOfThing.selection = lay({ text: selection, subject: 'Including link: ' }, minutesAgo(30));
  idOfThing.address = lay({ text: 'https://owls.example/athena', subject: 'The owl of Athena' }, minutesAgo(20));
  idOfThing.picture = lay(
    {
      text: 'The owl on the plate',
      subject: 'Photos from the museum',
      files: [{ name: 'owl-plate.png', bytes: OWL_PLATE }],
    },
    minutesAgo(10),
  );

  phone = await App.launch({ args: ['--phone'], width: 412, height: 915, dataDir, keepData: true });
  await phone.installErrorHook();
  await phone.waitFor('[data-phone-notes]', 15000);
  const three = await listOf(phone, 3);
  check('three notes were made of the three things', three.length === 3);
  check('none is looked at', three.every((r) => r.unseen));
  check('the inbox is empty', inInbox().length === 0, inInbox().join(', '));
  await phone.screenshot('phone-collect-1-notes');

  const [onPicture, onAddress, onSelection] = three;
  check(
    'the first begins as the words do, with their quotation marks, and says No source',
    onSelection.title.startsWith('"Owls were sacred') && onSelection.source === 'No source',
    JSON.stringify(onSelection),
  );
  check(
    'the second is named by the subject, and its source says the page',
    onAddress.title === 'The owl of Athena' && onAddress.source === 'The owl of Athena',
    JSON.stringify(onAddress),
  );
  check(
    'the third begins as its words do, and its row shows the picture small',
    onPicture.title.startsWith('The owl on the plate') && onPicture.picture,
    JSON.stringify(onPicture),
  );

  await openNote(phone, onSelection.id);
  let note = await shown(phone);
  check('the words of a selection are kept with their marks, and the note has no name', note.words.includes(selection) && note.name === '', JSON.stringify(note));
  check('the subject Including link is nowhere in it', !note.words.includes('Including') && note.name === '');
  check('its source is No source', note.chips.length === 1 && note.chips[0] === 'none:No source', note.chips.join(' | '));
  await arrow(phone);

  await openNote(phone, onAddress.id);
  note = await shown(phone);
  check('the address alone is named by the subject, its text the address', note.name === 'The owl of Athena' && note.words.includes('https://owls.example/athena'), JSON.stringify(note));
  check('and its source is the page', note.chips.length === 1 && note.chips[0].endsWith(':The owl of Athena'), note.chips.join(' | '));
  await arrow(phone);

  await openNote(phone, onPicture.id);
  note = await shown(phone);
  check('the picture shared holds its words and a figure, and no name', note.words.includes('The owl on the plate') && note.figures === 1 && note.name === '', JSON.stringify(note));
  check('and the file is its source', note.chips.some((c) => c.endsWith(':owl-plate.png')), note.chips.join(' | '));
  check(
    'and the store holds the file',
    existsSync(join(store, sha(OWL_PLATE).slice(0, 2), sha(OWL_PLATE))),
    sha(OWL_PLATE),
  );
  await phone.screenshot('phone-collect-2-picture-shared');
  await arrow(phone);

  // ---- 2. the page running, the Android part stood in for ----
  await standIn(phone);
  const before = (await rows(phone)).length;

  // A thing arrived: its note is shown, without the keyboard.
  idOfThing.fourth = lay({ text: 'Shared while the page runs', subject: 'A subject' }, new Date().toISOString());
  await hook(phone, 'asked', { arrived: [idOfThing.fourth] });
  await sleep(500);
  note = await shown(phone);
  check('a thing arrived: its note is shown', !!note && note.words.includes('Shared while the page runs'), JSON.stringify(note));
  check('without the cursor in its text', !(await inText(phone)));
  check('and the inbox is empty again', inInbox().length === 0, inInbox().join(', '));
  await phone.screenshot('phone-collect-3-arrived');
  await hook(phone, 'back');
  await phone.waitFor('[data-phone-notes]', 4000);
  let said = await told(phone);
  check('Back: the notes, and the app was asked to leave once', said.left === 1 && (await phone.exists('[data-phone-notes]')), JSON.stringify(said));
  check('the notes hold the one more', (await rows(phone)).length === before + 1, String((await rows(phone)).length));

  // A note opened from the list, a thing arrived over it.
  await openNote(phone, onSelection.id);
  idOfThing.fifth = lay({ text: 'Shared over a note', subject: '' }, new Date().toISOString());
  await hook(phone, 'asked', { arrived: [idOfThing.fifth] });
  await sleep(500);
  note = await shown(phone);
  check('a thing arrived over a note: its note is shown', !!note && note.words.includes('Shared over a note'), JSON.stringify(note));
  await arrow(phone);
  note = await shown(phone);
  check('the arrow shows the note from before', note?.id === onSelection.id, JSON.stringify(note));
  said = await told(phone);
  check('and the app was not asked to leave again', said.left === 1, JSON.stringify(said));
  await arrow(phone);
  check('the arrow once more: the notes', await phone.exists('[data-phone-notes]'));

  // A new note asked for from outside, and what is put into it.
  await hook(phone, 'asked', { note: true });
  await phone.waitFor('[data-phone-note]', 5000);
  await until('the cursor in the new note', () => inText(phone), 5000).catch(() => {});
  note = await shown(phone);
  check('a new note asked for is shown with the cursor in its text', !!note && (await inText(phone)), JSON.stringify(note));
  check('it lies in the box that receives, and holds nothing', note.box.includes('Unsorted') && note.words.trim() === '' && note.name === '', JSON.stringify(note));
  await phone.screenshot('phone-collect-4-new-note');

  const row = await toolRow(phone);
  check(
    'the seven tools are in the row, and within the window',
    row.count === 7 && row.out.length === 0 && row.scroll <= row.width && row.names.includes('file') && row.names.includes('photograph'),
    JSON.stringify(row),
  );

  // The calls of the page to the shell cannot be counted from the page:
  // Tauri defines `invoke` and `ipc` of `__TAURI_INTERNALS__` unwritable and
  // frozen. How many pieces a file goes in is held by `taking.test.ts`
  // beside the code; here, that the file arrives whole and leaves nothing.

  await hook(phone, 'file', 'plate.png', PLATE.toString('base64'));
  await sleep(500);
  note = await shown(phone);
  check('a picture by file(): a figure in the text', note.figures === 1, JSON.stringify(note));
  check('and the file is its source', note.chips.some((c) => c.endsWith(':plate.png')), note.chips.join(' | '));

  await hook(phone, 'file', 'paper.pdf', PAPER.toString('base64'));
  await sleep(500);
  note = await shown(phone);
  check('a file that is no picture stands in the note', note.files.includes(sha(PAPER)), JSON.stringify(note));
  const order = await phone.exec(`const text = document.querySelector('[data-phone-note] [data-phone-text] .ProseMirror');
    const kids = [...text.children];
    return { figure: kids.findIndex((e) => e.matches('figure')), file: kids.findIndex((e) => e.matches('.held-file')) };`);
  check('and it stands after the figure, at the end of the note', order.figure >= 0 && order.file > order.figure, JSON.stringify(order));
  check('and the file is its source', note.chips.some((c) => c.endsWith(':paper.pdf')), note.chips.join(' | '));
  await phone.screenshot('phone-collect-5-files');

  // A file of two megabytes and a half, made in the page and worked out here.
  const scan = Buffer.from(scrambled(SCAN));
  await phone.execAsync(
    `const make = ${scrambled.toString()};
     const bytes = make(arguments[0]);
     let binary = '';
     for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
     await window.__glaukopisPhone.file('scan.bin', btoa(binary));
     return true;`,
    SCAN,
  );
  await sleep(500);
  const hash = sha(scan);
  const stored = filesUnder(join(store, hash.slice(0, 2), hash));
  check(
    'the store holds it, byte for byte, under the hash the script worked out',
    stored.length === 1 && Buffer.compare(readFileSync(stored[0]), scan) === 0,
    stored.join(', '),
  );
  check('and nothing is left in notebook/taking', filesUnder(taking).length === 0, filesUnder(taking).join(', '));
  note = await shown(phone);
  check('the note holds it as a file', note.files.includes(hash), JSON.stringify(note));
  check('and it has itself as its source', note.chips.some((c) => c.endsWith(':scan.bin')), note.chips.join(' | '));

  // A photograph, handed to the field of the camera as the camera hands it.
  await phone.exec(
    `const bytes = Uint8Array.from(atob(arguments[0]), (c) => c.charCodeAt(0));
     const data = new DataTransfer();
     data.items.add(new File([bytes], 'photo.png', { type: 'image/png' }));
     const field = document.querySelector('[data-phone-input="photograph"]');
     field.files = data.files;
     field.dispatchEvent(new Event('change', { bubbles: true }));
     return true;`,
    PHOTO.toString('base64'),
  );
  await until('the photograph in the note', async () => (await shown(phone)).figures === 2, 6000).catch(() => {});
  note = await shown(phone);
  check('a photograph taken in: a second figure in the text', note.figures === 2, JSON.stringify(note));
  check('and its source is the file', note.chips.some((c) => c.endsWith(':photo.png')), note.chips.join(' | '));
  said = await told(phone);
  check('and the Android part was told of it once', said.photographed === 1, JSON.stringify(said));
  await phone.screenshot('phone-collect-6-photograph');

  await hook(phone, 'back');
  await phone.waitFor('[data-phone-notes]', 4000);
  said = await told(phone);
  check('Back from the new note: the notes, and the app was not asked to leave', said.left === 1 && (await phone.exists('[data-phone-notes]')), JSON.stringify(said));

  // ---- 3. the commands of the computer ----
  const refused = await tryInvoke(phone, 'notebook_take_files', { paths: [] });
  check('notebook_take_files is not the phone’s', !!refused.refused && /not found/i.test(refused.refused), refused.refused ?? 'answered');

  const errors = await phone.pageErrors();
  check('no errors in the page', errors.length === 0, errors.join(' | '));
  await phone.close();
  phone = null;

  // ---- 4. at 320 by 568 ----
  phone = await App.launch({ args: ['--phone'], width: 320, height: 568, dataDir, keepData: true });
  await phone.installErrorHook();
  await phone.waitFor('[data-phone-notes]', 15000);
  const all = await until('the rows', async () => ((await rows(phone)).length >= 5 ? rows(phone) : null));
  const withFiles = all.find((r) => r.picture) ?? all[0];
  await openNote(phone, withFiles.id);
  const narrow = await toolRow(phone);
  check(
    'at 320, the row of seven is within the window',
    narrow.count === 7 && narrow.out.length === 0 && narrow.scroll <= narrow.width,
    JSON.stringify(narrow),
  );
  await phone.screenshot('phone-collect-7-narrow');
  const narrowErrors = await phone.pageErrors();
  check('no errors in the page at 320', narrowErrors.length === 0, narrowErrors.join(' | '));
} catch (error) {
  check('the script ran to its end', false, error.stack ?? String(error));
  await phone?.screenshot('phone-collect-8-failed').catch(() => {});
} finally {
  await phone?.close().catch(() => {});
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(`${dataDir}-config`, { recursive: true, force: true });
}

const failed = checks.filter((c) => !c.ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
