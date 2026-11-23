// What another app hands to Glaukopis on the emulator (stage 3 of
// docs/plans/an-app-for-android.md, part C): Share and the menu over
// selected words, read by StartActivity, put into the inbox through the
// door, and the page arriving on the note.
//
// With the app not running (its page ended), words are shared with a
// subject: the app comes to the front on a note that holds them, with no
// source and no name; Back: the app is not in front; started from the
// launcher, it shows the notes, with the note. An address with a subject:
// the note is named by the subject, and its source is the page. Words as
// Chrome hands a selection over ("select" in quotation marks, the subject
// `Including link: `): a note that holds them with the marks, and has no
// name. With the app behind the others, words shared again: it comes to the
// front on the new note. With the app behind and its process ended (am
// kill), so that Android makes the page's activity again from what it kept:
// words shared: the app comes to the front on their note, and the notes
// hold it once. The words of the selection's menu from the shell: a note.
// Then once by taps in Chrome, on a page this script serves from this
// machine (through adb reverse, so that nothing is fetched from elsewhere):
// a word selected, the ⋮ of the menu over it, Glaukopis: the note holds the
// word, and whether within quotation marks is written down; Back: Chrome
// is in front, and its task holds no activity of Glaukopis. A picture
// shared by taps in the app of files: the note holds it as a figure, has
// no name, and notebook/sharing of the app's folder is empty; Back: the app
// of files is in front. A share of nothing: the app does not come to the
// front. A file larger than 50 MB shared as the picture is: no note, the
// app of files stays in front, and what the screen says is written down.
// Run with the new emulator up and the debug app installed:
//   node e2e/android/share.mjs
// Screenshots in e2e/output/android-share-<n>-<what>.png.

import { createServer } from 'node:http';
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
  processText,
  screenshot,
  share,
  shareFile,
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

let port = 9350;
/** The note the page shows, as it says it: its id, its words, its name, its sources, its figures. */
async function shown(most = 20000) {
  return until(async () => {
    const p = await page(port++);
    try {
      return await p.evaluate(`(() => {
        const note = document.querySelector('[data-phone-note]');
        if (!note) return null;
        return {
          id: note.getAttribute('data-phone-note'),
          text: note.querySelector('[data-phone-text] .ProseMirror')?.textContent ?? '',
          name: note.querySelector('[data-phone-name]')?.value ?? note.querySelector('[data-phone-name]')?.textContent ?? '',
          sources: Array.from(note.querySelectorAll('[data-phone-source]')).map((s) => s.textContent.replace(/\\s+/g, ' ').trim()),
          figures: note.querySelectorAll('figure').length,
        };
      })()`);
    } finally {
      p.close();
    }
  }, 'a note shown', most, 700);
}

/** The rows of the notes, as the page says them, once the notes are shown. */
async function rows() {
  const p = await page(port++);
  try {
    await until(() => p.evaluate(`!!document.querySelector('[data-phone-notes]')`), 'the notes', 15000);
    return await p.evaluate(`Array.from(document.querySelectorAll('[data-phone-row]')).map((r) => r.textContent.replace(/\\s+/g, ' ').trim())`);
  } finally {
    p.close();
  }
}

const front = async () => (await inFront()) === PACKAGE;
const back = () => shell('input keyevent 4');
const sharing = () => shell(`run-as ${PACKAGE} sh -c "ls -A files/data/notebook/sharing 2>/dev/null"`);

// ---- anew, the app's page ended ----
await shell(`pm clear ${PACKAGE}`).catch(() => {});
await start();
await rows();
await endPage();

// ---- 1. words with a subject, the app not running ----
await share({ text: 'Owls see in the dark.', subject: 'About owls' });
let note = await shown();
check('words shared with the app not running: it comes to the front on their note', (await front()) && note.text.includes('Owls see in the dark.'), JSON.stringify(note));
check('the note has no name, and the subject is nowhere in it', !note.name && !note.text.includes('About owls'), JSON.stringify(note));
check('and no source', note.sources.every((s) => /no source/i.test(s)), note.sources.join(' | '));
await screenshot('share-1-words');
await back();
await sleep(1500);
check('Back: the app is not in front', !(await front()), await inFront());
await shell(`am start -n ${PACKAGE}/.StartActivity`);
let listed = await rows();
check('started from the launcher, it shows the notes, with the note', listed.some((r) => r.includes('Owls see in the dark.')), listed.join(' | '));

// ---- 2. an address with a subject ----
await shell('input keyevent KEYCODE_HOME');
await sleep(1000);
await share({ text: 'https://example.org/owls', subject: 'The owl of Athena' });
note = await shown();
check('an address alone is a note named by the subject', note.name === 'The owl of Athena', JSON.stringify(note));
check('and its source is the page', note.sources.some((s) => s.includes('The owl of Athena') || s.includes('example.org')), note.sources.join(' | '));
await screenshot('share-2-address');

// ---- 3. words as Chrome hands a selection over ----
await back();
await sleep(1000);
await share({ text: '"select"', subject: 'Including link: ' });
note = await shown();
check('words as Chrome hands a selection over: the note holds them with their quotation marks', note.text.includes('"select"'), note.text);
check('and has no name', !note.name, note.name);

// ---- 4. the app behind, words shared again ----
const before = note.id;
await shell('input keyevent KEYCODE_HOME');
await sleep(1500);
await share({ text: 'Shared with the app behind.' });
note = await shown();
check('with the app behind, a share brings it to the front on the new note', (await front()) && note.id !== before && note.text.includes('Shared with the app behind.'), JSON.stringify(note));

// ---- 5. the app behind and its process ended ----
await shell('input keyevent KEYCODE_HOME');
await sleep(1500);
await shell(`am kill ${PACKAGE}`);
await sleep(1500);
await share({ text: 'Shared into a page made again.' });
note = await shown(30000);
check('with the process ended, a share comes to the front on its note', (await front()) && note.text.includes('Shared into a page made again.'), JSON.stringify(note));
await back();
await sleep(1000);
await shell(`am start -n ${PACKAGE}/.StartActivity`);
listed = await rows();
check('and the notes hold it once', listed.filter((r) => r.includes('Shared into a page made again.')).length === 1, listed.join(' | '));

// ---- 6. the selection's menu, from the shell ----
await shell('input keyevent KEYCODE_HOME');
await sleep(1000);
await processText('Words of the selection menu');
note = await shown();
check('the words of the selection\'s menu become a note', note.text.includes('Words of the selection menu'), note.text);
await back();
await sleep(1000);

// ---- 7. the selection's menu by taps in Chrome ----
const pageServed = createServer((_, answer) => {
  answer.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  answer.end('<!doctype html><meta name="viewport" content="width=device-width"><title>A page of owls</title><h1>Owls</h1><p style="font-size:24px">Athena kept an owl beside her.</p>');
});
await new Promise((done) => pageServed.listen(8766, '127.0.0.1', done));
await adb('reverse', 'tcp:8766', 'tcp:8766');
await shell('echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line');
await shell('am set-debug-app --persistent com.android.chrome');
await shell('am force-stop com.android.chrome');
await shell('am start -a android.intent.action.VIEW -d http://127.0.0.1:8766/ -n com.android.chrome/com.google.android.apps.chrome.Main');
await sleep(5000);
// Chrome's first questions, where it asks them.
await tapWords('No thanks', { exact: true, most: 3000 }).catch(() => {});
const words = await until(async () => (await onScreen()).find((n) => n.text.includes('Athena kept an owl')), 'the words of the page', 15000).catch(() => null);
let selectionNote = null;
if (words) {
  await shell(`input swipe ${words.x - 60} ${words.y} ${words.x - 60} ${words.y} 1200`);
  await sleep(1500);
  await tapWords('More options', { said: true, most: 4000 }).catch(async () => {
    // The ⋮ of the menu over the selection is drawn by Chrome and not in the dump everywhere: found by its place, right of the last word of the menu.
    const menu = (await onScreen()).filter((n) => ['Copy', 'Share', 'Select all'].includes(n.text));
    const last = menu.sort((a, b) => b.x - a.x)[0];
    if (last) await tap(last.x + 190, last.y);
  });
  await sleep(1500);
  await screenshot('share-3-selection-menu');
  await tapWords('Glaukopis', { exact: true, most: 5000 });
  selectionNote = await shown().catch(() => null);
}
check('a word selected in Chrome and given to Glaukopis by the menu over it is a note', !!selectionNote && selectionNote.text.trim().length > 0, JSON.stringify(selectionNote));
console.log(`      the selection's menu handed over: ${JSON.stringify(selectionNote?.text)} (within quotation marks: ${/^".*"$/.test(selectionNote?.text?.trim() ?? '')})`);
await back();
await sleep(2000);
check('Back: Chrome is in front again', (await inFront()) === 'com.android.chrome', await inFront());
const chromeTask = await shell('dumpsys activity activities');
const chromeHolds = /Task\{[^\n]*A=\d+:com\.android\.chrome[\s\S]*?(?=\n {2}\* Task|$)/.exec(chromeTask)?.[0] ?? '';
check('and its task holds no activity of Glaukopis', !chromeHolds.includes(PACKAGE), '');
await shell('am clear-debug-app');
await shell('rm -f /data/local/tmp/chrome-command-line');
await adb('reverse', '--remove', 'tcp:8766');
pageServed.close();

// ---- 8. a picture shared by taps in the app of files ----
const scratch = mkdtempSync(join(tmpdir(), 'glaukopis-android-share-'));
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
writeFileSync(join(scratch, 'owl-dot.png'), png);
await adb('push', join(scratch, 'owl-dot.png'), '/sdcard/Download/owl-dot.png');
await shareFile('owl-dot.png');
note = await shown();
check('a picture shared from the app of files: the note holds it as a figure', note.figures === 1, JSON.stringify(note));
check('and has no name', !note.name, note.name);
check('and nothing is left in notebook/sharing', !(await sharing()).trim(), await sharing());
await screenshot('share-4-picture');
await back();
await sleep(2000);
check('Back: the app of files is in front', (await inFront()) === 'com.google.android.documentsui', await inFront());

// ---- 9. a share of nothing ----
await shell('input keyevent KEYCODE_HOME');
await sleep(1000);
await shell(`am start -a android.intent.action.SEND -t text/plain -n ${PACKAGE}/.StartActivity`);
await sleep(3000);
check('a share of nothing: the app does not come to the front', !(await front()), await inFront());

// ---- 10. a file larger than 50 MB ----
await shell('dd if=/dev/zero of=/sdcard/Download/too-large.bin bs=1048576 count=51 2>/dev/null');
await shell('am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download/too-large.bin');
const notesBefore = (await (async () => {
  await shell(`am start -n ${PACKAGE}/.StartActivity`);
  return rows();
})()).length;
await shell('input keyevent KEYCODE_HOME');
await sleep(1000);
await shareFile('too-large.bin');
await sleep(2500);
const said = (await onScreen()).map((n) => n.text).filter(Boolean).join(' | ');
console.log(`      the screen after a file too large: ${said.slice(0, 300)}`);
await screenshot('share-5-too-large');
check('a file larger than 50 MB: the app of files stays in front', (await inFront()) === 'com.google.android.documentsui', await inFront());
await shell(`am start -n ${PACKAGE}/.StartActivity`);
check('and no note is made of it', (await rows()).length === notesBefore, '');
await shell('rm -f /sdcard/Download/too-large.bin /sdcard/Download/owl-dot.png');

const failed = checks.filter((ok) => !ok).length;
console.log(`\n${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
