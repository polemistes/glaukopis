// The phone's page on the emulator (stage 2 of docs/plans/an-app-for-android.md):
// what only Android tries. The app started clean: the notes. New note, and
// words typed on Google's keyboard, key by key; whether the keyboard came
// up by itself is written down. Back: once puts the keyboard away, once
// more is the notes, with the note's row; a sheet open, Back closes it and
// nothing else; at the notes, Back puts the app behind the others with its
// process kept. Home and the app again: the engine said it was not in front
// and that it was again. The app ended from outside and started: the note
// is there. Dark chosen in the settings: the top and the foot of the screen
// are the page's ground. The system's letters at 1.3: screenshots of the
// notes and of a note. The page in Bokmål where the system is.
// Run with the new emulator up and the debug app installed:
//   node e2e/android/page.mjs
// Screenshots in e2e/output/android-page-<n>-<what>.png.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PACKAGE, adb, page, screenshot, shell, sleep, start, tap, until } from './device.mjs';
import { key, type } from './gboard.mjs';

const run = promisify(execFile);
const checks = [];
function check(name, ok, detail = '') {
  checks.push(ok);
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}
const inFront = async () => (await shell('dumpsys activity activities | grep -m1 topResumedActivity')).includes(PACKAGE);
const pid = async () => (await shell(`pidof ${PACKAGE} || true`)).trim();
const keyboardUp = async () => /mInputShown=true|isInputViewShown=true/.test(await shell('dumpsys input_method | grep -E "mInputShown|isInputViewShown"'));
const log = () => shell(`run-as ${PACKAGE} sh -c "cat files/data/logs/* 2>/dev/null"`);
/** The colour of one pixel of a screenshot, as `r,g,b`: decoded by Python, which this machine has. */
async function pixel(path, x, y) {
  const { stdout } = await run('python3', ['-I', '-c', `
import sys, zlib, struct
data = open(sys.argv[1], 'rb').read()
w, h = struct.unpack('>II', data[16:24]); ct = data[25]
idat = b''; i = 8
while i < len(data):
    n = struct.unpack('>I', data[i:i+4])[0]; t = data[i+4:i+8]
    if t == b'IDAT': idat += data[i+8:i+8+n]
    i += 12 + n
raw = zlib.decompress(idat); bpp = 4 if ct == 6 else 3; stride = w * bpp
x, y = int(sys.argv[2]), int(sys.argv[3]); rows = []; prev = bytearray(stride)
for r in range(y + 1):
    f = raw[r * (stride + 1)]; line = bytearray(raw[r * (stride + 1) + 1:(r + 1) * (stride + 1)])
    for j in range(stride):
        a = line[j - bpp] if j >= bpp else 0; b = prev[j]; c = prev[j - bpp] if j >= bpp else 0
        if f == 1: line[j] = (line[j] + a) & 255
        elif f == 2: line[j] = (line[j] + b) & 255
        elif f == 3: line[j] = (line[j] + (a + b) // 2) & 255
        elif f == 4:
            p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
            line[j] = (line[j] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
    prev = line
print(','.join(str(v) for v in prev[x * bpp:x * bpp + 3]))
`, path, String(x), String(y)]);
  return stdout.trim();
}

await shell(`pm clear ${PACKAGE}`).catch(() => {});
await start();
let p = await page();
await until(() => p.evaluate(`!!document.querySelector('[data-phone-notes]')`), 'the notes', 15000);
check('the app starts at the notes', true);

// ---- New note, typed on the keyboard ----
let at = await p.middle('[data-phone-new]');
await tap(at.x, at.y);
await until(() => p.evaluate(`!!document.querySelector('[data-phone-note]')`), 'the note', 5000);
await sleep(1500);
const cameUp = await keyboardUp();
console.log(`      the keyboard came up by itself in a new note: ${cameUp}`);
if (!cameUp) {
  at = await p.middle('[data-phone-text] .ProseMirror');
  await tap(at.x, at.y);
  await sleep(1500);
}
await type('owls at dusk');
await sleep(800);
const words = await p.evaluate(`document.querySelector('[data-phone-text] .ProseMirror').textContent`);
check('words typed on the keyboard are in the note', /owls at dusk/i.test(words), words);
await screenshot('page-1-note');

// ---- Back ----
await shell('input keyevent 4');
await sleep(800);
check('Back once puts the keyboard away and leaves the note shown', !(await keyboardUp()) && (await p.evaluate(`!!document.querySelector('[data-phone-note]')`)));
await shell('input keyevent 4');
await sleep(800);
const row = await p.evaluate(`Array.from(document.querySelectorAll('[data-phone-row]')).map((r) => r.textContent).join(' | ')`);
check('Back once more is the notes, with the note\'s row', /owls at dusk/i.test(row), row);
at = await p.middle('[data-phone-filter]');
await tap(at.x, at.y);
await until(() => p.evaluate(`!!document.querySelector('[data-phone-sheet]')`), 'the sheet', 3000);
await shell('input keyevent 4');
await sleep(800);
check('a sheet open, Back closes it and the notes stay', await p.evaluate(`!document.querySelector('[data-phone-sheet]') && !!document.querySelector('[data-phone-notes]')`));
const before = await pid();
await shell('input keyevent 4');
await sleep(1500);
check('at the notes, Back puts the app behind the others', !(await inFront()));
check('and its process is kept', (await pid()) === before && before !== '', `${before} → ${await pid()}`);
await shell(`am start -n ${PACKAGE}/.StartActivity`);
await sleep(2500);
check('started again, it is the same process and in front', (await pid()) === before && (await inFront()));

// ---- home, and back in front ----
await shell('input keyevent KEYCODE_HOME');
await sleep(2000);
await shell(`am start -n ${PACKAGE}/.StartActivity`);
await sleep(2500);
const said = await log();
check('the engine said it was not in front', said.includes('the app is not in front'));
check('and that it was in front again', said.includes('the app is in front again'));
p.close();

// ---- ended from outside, and started ----
await shell(`am force-stop ${PACKAGE}`);
await start();
p = await page();
await until(() => p.evaluate(`!!document.querySelector('[data-phone-row]')`), 'the rows', 15000);
check('ended and started, the note is there', /owls at dusk/i.test(await p.evaluate(`document.querySelector('[data-phone-notes]').textContent`)));

// ---- dark, and the ground behind the bars ----
at = await p.middle('[data-phone-to-settings]');
await tap(at.x, at.y);
await until(() => p.evaluate(`!!document.querySelector('[data-phone-settings]')`), 'the settings', 5000);
await p.evaluate(`(() => { const b = Array.from(document.querySelectorAll('[data-phone-theme] [role="radio"], [data-phone-theme] button')).find((e) => /dark/i.test(e.textContent)); b.click(); return !!b; })()`);
await sleep(1500);
const ground = await p.evaluate(`getComputedStyle(document.body).backgroundColor`);
const shot = await screenshot('page-2-dark');
const { stdout: size } = await run('python3', ['-I', '-c', 'import sys,struct;d=open(sys.argv[1],"rb").read();print(*struct.unpack(">II",d[16:24]))', shot]);
const [w, h] = size.trim().split(' ').map(Number);
const top = await pixel(shot, 10, 5);
const foot = await pixel(shot, 10, h - 5);
const page_ = await pixel(shot, Math.round(w / 2), Math.round(h / 2));
console.log(`      the page's ground ${ground}; the top ${top}, the foot ${foot}, the middle ${page_}`);
check('the top of the screen is the page\'s ground', top === page_, `${top} / ${page_}`);
check('the foot of the screen is the page\'s ground', foot === page_, `${foot} / ${page_}`);
await p.evaluate(`(() => { const b = Array.from(document.querySelectorAll('[data-phone-theme] [role="radio"], [data-phone-theme] button')).find((e) => /system/i.test(e.textContent)); b?.click(); return true; })()`);
p.close();

// ---- the system's letters at 1.3 ----
await shell('settings put system font_scale 1.3');
await shell(`am force-stop ${PACKAGE}`);
await start();
p = await page();
await until(() => p.evaluate(`!!document.querySelector('[data-phone-row]')`), 'the rows', 15000);
await screenshot('page-3-notes-large');
at = await p.middle('[data-phone-row]');
await tap(at.x, at.y);
await sleep(1500);
await shell('input keyevent 4');
await sleep(500);
await screenshot('page-4-note-large');
const wide = await p.evaluate(`document.documentElement.scrollWidth <= window.innerWidth`);
check('with large letters nothing lies outside the window', wide);
await shell('settings put system font_scale 1.0');
p.close();

// ---- the system in Norwegian ----
await shell(`cmd locale set-app-locales ${PACKAGE} --locales nb-NO`).catch(() => {});
await shell(`am force-stop ${PACKAGE}`);
await start();
p = await page();
await until(() => p.evaluate(`!!document.querySelector('[data-phone-notes]')`), 'the notes', 15000);
const lang = await p.evaluate(`JSON.stringify({ lang: document.documentElement.lang, nav: navigator.language, search: document.querySelector('[data-phone-find]')?.getAttribute('placeholder') })`);
check('the page is in Bokmål where the system is', /"lang":"nb/.test(lang), lang);
await screenshot('page-5-norwegian');
await shell(`cmd locale set-app-locales ${PACKAGE} --locales ""`).catch(() => {});
p.close();

const failed = checks.filter((ok) => !ok).length;
console.log(`${checks.length - failed} of ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
