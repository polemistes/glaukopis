// What is collected in the app itself on the emulator (stage 3 of
// docs/plans/an-app-for-android.md): New note on the icon held down, and in
// a note Photograph and Picture or file.
//
// New note asked for as the icon's shortcut asks, with the app not running
// (its page ended) and with it behind: a new note with the keyboard up;
// Back twice: the notes. `dumpsys shortcut` names the shortcut. In a note,
// Photograph pressed by a tap: the emulator's camera, the photograph taken
// and accepted (Shutter, Done): the note holds a figure, its source says
// when it was taken, and the folder wry left the file in is empty. Picture
// or file: two files chosen in the system's picker by taps (the first held
// down, the second tapped, Select), one a PDF: a figure and a file in the
// note. And with the app's process ended while the camera is in front
// (am kill): Photograph, the photograph taken, the app back: the
// photograph is a note of its own in the list, and the folder is empty.
// Run with the new emulator up and the debug app installed:
//   node e2e/android/collect.mjs
// Screenshots in e2e/output/android-collect-<n>-<what>.png.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PACKAGE,
  adb,
  endPage,
  inFront,
  onScreen,
  page,
  screenshot,
  shell,
  sleep,
  start,
  tap,
  tapWords,
  until,
} from './device.mjs';

const checks = [];
function check(name, ok, detail = '') {
  checks.push(ok);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const keyboardUp = async () =>
  /mInputShown=true|isInputViewShown=true/.test(await shell('dumpsys input_method | grep -E "mInputShown|isInputViewShown"'));
const cameraFolder = '/storage/emulated/0/Android/data/org.glaukopis.app/files/Pictures';
const leftByCamera = async () => (await shell(`ls -A ${cameraFolder} 2>/dev/null || true`)).trim();
const newNote = () => shell(`am start -a org.glaukopis.app.NEW_NOTE -n ${PACKAGE}/.StartActivity`);

let port = 9370;
/**
 * One connection to the page for each process of the app. Where the page
 * begins on the screen is found once by a tap of its own (`middle`), which
 * is made at the notes, where it falls on nothing: in a note it would land
 * in the text, or on a figure.
 */
let connected = null;
async function withPage(fn) {
  const pid = (await shell(`pidof ${PACKAGE} || true`)).trim();
  if (!connected || connected.pid !== pid) {
    connected?.p.close();
    const p = await page(port++);
    connected = { pid, p, measured: false };
  }
  return fn(connected.p);
}
/** Where the page begins, found at the notes. */
async function measure() {
  await withPage(async (p) => {
    if (connected.measured) return;
    await until(() => p.evaluate(`!!document.querySelector('[data-phone-notes]')`), 'the notes', 15000);
    await p.middle('[data-phone-notes]');
    connected.measured = true;
  });
}
const noteShown = () =>
  withPage((p) =>
    until(() => p.evaluate(`(() => {
      const note = document.querySelector('[data-phone-note]');
      if (!note) return null;
      return {
        id: note.getAttribute('data-phone-note'),
        figures: note.querySelectorAll('figure').length,
        files: note.querySelectorAll('[data-file]').length - note.querySelectorAll('figure [data-file]').length,
        sources: Array.from(note.querySelectorAll('[data-phone-source]')).map((s) => s.textContent.replace(/\\s+/g, ' ').trim()),
      };
    })()`), 'a note shown', 20000, 500),
  );
const notesShown = () => withPage((p) => until(() => p.evaluate(`!!document.querySelector('[data-phone-notes]')`), 'the notes', 15000));
const rowCount = () => withPage((p) => p.evaluate(`document.querySelectorAll('[data-phone-row]').length`));
/** Taps what the page shows by its selector. */
async function press(selector) {
  await withPage(async (p) => {
    const at = await p.middle(selector);
    await tap(at.x, at.y);
  });
}

// ---- anew ----
await shell(`pm clear ${PACKAGE}`).catch(() => {});
await start();
await notesShown();
await measure();
check('the shortcut New note is named by the system', (await shell('dumpsys shortcut')).includes('new_note'));

// ---- 1. New note, the app not running ----
await endPage();
await newNote();
let note = await noteShown();
await sleep(1500);
check('New note with the app not running: a new note', !!note.id, JSON.stringify(note));
check('with the keyboard up', await keyboardUp());
await screenshot('collect-1-new-note');
await shell('input keyevent 4');
await sleep(800);
await shell('input keyevent 4');
await sleep(1200);
check('Back twice: the notes', (await inFront()) === PACKAGE && (await notesShown()));
await measure();

// ---- 2. New note, the app behind ----
await shell('input keyevent KEYCODE_HOME');
await sleep(1200);
await newNote();
note = await noteShown();
await sleep(1500);
check('New note with the app behind: a new note with the keyboard up', !!note.id && (await keyboardUp()), JSON.stringify(note));
await shell('input keyevent 4');
await sleep(800);

// ---- 3. Photograph ----
await press('[data-phone-tool="photograph"]');
await until(async () => (await inFront()) === 'com.android.camera2', 'the camera', 15000);
await tapWords('Shutter', { said: true, exact: true, most: 15000 });
await tapWords('Done', { said: true, exact: true, most: 15000 }).catch(() => tapWords('Done', { exact: true }));
await until(async () => (await inFront()) === PACKAGE, 'the app again', 15000);
note = await until(async () => {
  const n = await noteShown();
  return n.figures ? n : null;
}, 'the photograph in the note', 20000, 700);
check('Photograph: the note holds a figure', note.figures === 1, JSON.stringify(note));
check('its source says when it was taken', note.sources.some((s) => /\d/.test(s)), note.sources.join(' | '));
check('and the folder the camera left the file in is empty', !(await leftByCamera()), await leftByCamera());
await screenshot('collect-2-photograph');

// ---- 4. Picture or file ----
const scratch = mkdtempSync(join(tmpdir(), 'glaukopis-android-collect-'));
writeFileSync(join(scratch, 'plate.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
writeFileSync(join(scratch, 'paper.pdf'), '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
for (const name of ['plate.png', 'paper.pdf']) {
  await adb('push', join(scratch, name), `/sdcard/Download/${name}`);
  await shell(`am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download/${name}`);
}
await press('[data-phone-tool="file"]');
await until(async () => (await inFront()) === 'com.google.android.documentsui', 'the picker', 15000);
await sleep(1500);
const first = await until(async () => (await onScreen()).find((n) => n.text === 'paper.pdf'), 'paper.pdf in the picker', 10000);
await shell(`input swipe ${first.x} ${first.y} ${first.x} ${first.y} 1200`);
await sleep(800);
await tapWords('plate.png', { exact: true });
await sleep(800);
await tapWords('Select', { exact: true });
await until(async () => (await inFront()) === PACKAGE, 'the app again', 15000);
note = await until(async () => {
  const n = await noteShown();
  return n.figures >= 2 && n.files >= 1 ? n : null;
}, 'the picture and the file in the note', 20000, 700).catch(() => null);
check('Picture or file: two chosen, a figure and a file in the note', !!note, JSON.stringify(note));
await screenshot('collect-3-picture-or-file');

// ---- 5. the process ended while the camera is in front ----
// Counted at the notes; then a note there is opened, from which the camera
// is asked. Back puts the keyboard away first where it is up. (Android may
// have ended the app's process while the picker was in front, so nothing is
// pressed in the page before the notes are shown.)
if (await keyboardUp()) {
  await shell('input keyevent 4');
  await sleep(800);
}
await shell('input keyevent 4');
await sleep(1200);
await notesShown();
await measure();
const before = await rowCount();
await press('[data-phone-row]');
await noteShown();
await press('[data-phone-tool="photograph"]');
await until(async () => (await inFront()) === 'com.android.camera2', 'the camera', 15000);
await tapWords('Shutter', { said: true, exact: true, most: 15000 });
await sleep(1500);
await shell(`am kill ${PACKAGE}`);
await sleep(1500);
await tapWords('Done', { said: true, exact: true, most: 15000 }).catch(() => tapWords('Done', { exact: true }));
await until(async () => (await inFront()) === PACKAGE, 'the app again', 20000);
await sleep(4000);
await shell('input keyevent 4');
await sleep(1500);
await shell(`am start -n ${PACKAGE}/.StartActivity`);
await notesShown();
await measure();
const after = await until(async () => {
  const n = await rowCount();
  return n > before ? n : null;
}, 'a note of the photograph', 20000, 1000).catch(() => before);
check('with the app ended while the camera was in front, the photograph is a note of its own', after === before + 1, `${before} → ${after}`);
check('and the folder is empty', !(await leftByCamera()), await leftByCamera());
await screenshot('collect-4-photograph-alone');
await shell('rm -f /sdcard/Download/plate.png /sdcard/Download/paper.pdf');

const failed = checks.filter((ok) => !ok).length;
console.log(`\n${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
