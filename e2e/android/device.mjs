// The app on an Android device or emulator, reached from a script: `adb`
// for what is the system's (installing, starting, tapping, the screen as a
// picture), and the web view's own door for debugging (the DevTools
// protocol, over `adb forward`) for what is the page's. Nothing but Node
// and `adb`: no driver, no package.
//
// The app must be a debug build: only that opens the door.

import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));

export const PACKAGE = 'org.glaukopis.app';
export const OUTPUT = join(here, '..', 'output');

const ADB = process.env.ADB || 'adb';
// Always one device by its name, never "whatever is connected": a phone of
// the owner's may be plugged in, and another emulator may run. The name is
// that of the emulator `emulator.sh` starts, unless another is asked for.
const SERIAL = ['-s', process.env.ANDROID_SERIAL || 'emulator-5584'];

/** Runs `adb` with the arguments, and gives what it wrote. */
export async function adb(...args) {
  const { stdout } = await run(ADB, [...SERIAL, ...args], { maxBuffer: 64 * 1024 * 1024 });
  return stdout;
}

/** Runs a command in the device's shell. */
export const shell = (command) => adb('shell', command);

export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Waits until `ready` gives something, asked every `every` ms, for at most `most` ms. */
export async function until(ready, what, most = 30000, every = 300) {
  const end = Date.now() + most;
  let last;
  for (;;) {
    try {
      const got = await ready();
      if (got) return got;
    } catch (error) {
      last = error;
    }
    if (Date.now() > end) throw new Error(`waited ${most} ms for ${what}${last ? `: ${last.message}` : ''}`);
    await sleep(every);
  }
}

/** The screen as a PNG in `e2e/output/android-<name>.png`. */
export async function screenshot(name) {
  mkdirSync(OUTPUT, { recursive: true });
  const { stdout } = await run(ADB, [...SERIAL, 'exec-out', 'screencap', '-p'], {
    encoding: 'buffer',
    maxBuffer: 64 * 1024 * 1024,
  });
  const path = join(OUTPUT, `android-${name}.png`);
  writeFileSync(path, stdout);
  return path;
}

/** A tap at a place of the screen, in its own pixels. */
export const tap = (x, y) => shell(`input tap ${Math.round(x)} ${Math.round(y)}`);

/** Starts the app anew, and waits for its process. */
export async function start() {
  await shell(`am force-stop ${PACKAGE}`);
  // The way in the launcher takes, which looks at the web view before the page.
  await shell(`am start -n ${PACKAGE}/.StartActivity`);
  return until(async () => (await shell(`pidof ${PACKAGE}`)).trim(), 'the app to start');
}

/**
 * The words on the screen, where there is no page to ask (what the app
 * says of a web view too old): the texts of the views Android draws, read
 * from a dump of the window.
 */
export async function screenText() {
  await shell('uiautomator dump /data/local/tmp/glaukopis-window.xml >/dev/null');
  const xml = await shell('cat /data/local/tmp/glaukopis-window.xml');
  return [...xml.matchAll(/ text="([^"]*)"/g)]
    .map((m) => m[1].replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
    .filter(Boolean);
}

/**
 * What the screen holds that can be pressed or read, with the middle of
 * each: its words (`text`, or what it says to a reader of the screen,
 * `content-desc`), read from a dump of the window.
 */
export async function onScreen() {
  await shell('uiautomator dump /data/local/tmp/glaukopis-window.xml >/dev/null');
  const xml = await shell('cat /data/local/tmp/glaukopis-window.xml');
  const unescape = (s) => s.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  return [...xml.matchAll(/<node [^>]*>/g)]
    .map(([node]) => {
      const text = unescape(/ text="([^"]*)"/.exec(node)?.[1] ?? '');
      const said = unescape(/ content-desc="([^"]*)"/.exec(node)?.[1] ?? '');
      const b = / bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(node);
      return b ? { text, said, x: (+b[1] + +b[3]) / 2, y: (+b[2] + +b[4]) / 2 } : null;
    })
    .filter((n) => n && (n.text || n.said));
}

/**
 * Taps what shows these words, by its text or what it says, as found on
 * the screen and not by a place written into the script; `exact` asks for
 * the whole text. Waits until it is there.
 */
export async function tapWords(words, { exact = false, said = false, most = 10000 } = {}) {
  const fits = (s) => (exact ? s === words : s.includes(words));
  const found = await until(async () => (await onScreen()).find((n) => (said ? fits(n.said) : fits(n.text))), `"${words}" on the screen`, most);
  await tap(found.x, found.y);
  return found;
}

/** A thing shared to the app from the shell: words, with a subject where given. */
export function share({ text, subject }) {
  const quote = (s) => `'${s.replace(/'/g, `'\\''`)}'`;
  const extras = [`--es android.intent.extra.TEXT ${quote(text)}`];
  if (subject !== undefined) extras.push(`--es android.intent.extra.SUBJECT ${quote(subject)}`);
  return shell(`am start -a android.intent.action.SEND -t text/plain ${extras.join(' ')} -n ${PACKAGE}/.StartActivity`);
}

/** Words selected in another app, handed over as its menu over them does. */
export function processText(text) {
  const quote = `'${text.replace(/'/g, `'\\''`)}'`;
  return shell(`am start -a android.intent.action.PROCESS_TEXT -t text/plain --es android.intent.extra.PROCESS_TEXT ${quote} -n ${PACKAGE}/.StartActivity`);
}

/**
 * A file of the shared storage, under `Download`, shared to the app by taps
 * in the app of files, as a person shares one: the shell cannot give the
 * app leave to read another app's file (the fifth trial of stage 3). The
 * file is held down, then *Share*, then *Glaukopis*.
 */
export async function shareFile(name) {
  await shell('am force-stop com.google.android.documentsui');
  await shell('am start -a android.intent.action.VIEW -d content://com.android.externalstorage.documents/root/primary -n com.google.android.documentsui/com.android.documentsui.files.FilesActivity');
  await tapWords('Download', { exact: true });
  const file = await until(async () => (await onScreen()).find((n) => n.text === name), `${name} in the app of files`, 10000);
  await shell(`input swipe ${file.x} ${file.y} ${file.x} ${file.y} 1200`);
  await tapWords('Share', { exact: true, said: true }).catch(() => tapWords('Share', { exact: true }));
  await tapWords('Glaukopis', { exact: true });
}

/** The task of the app, by its number, where it has one. */
export async function task() {
  const said = await shell('dumpsys activity activities');
  return new RegExp(`Task\\{[0-9a-f]+ #(\\d+) type=standard A=\\d+:${PACKAGE.replace(/\./g, '\\.')}`).exec(said)?.[1] ?? null;
}

/**
 * The page ended as an app swiped out of the recent ones ends: its task
 * removed, the page's activity destroyed and the process with it.
 * `always_finish_activities` does nothing on Android 16 (the third trial).
 */
export async function endPage() {
  const number = await task();
  if (number) await shell(`am stack remove ${number}`);
  await until(async () => !(await shell(`pidof ${PACKAGE} || true`)).trim(), 'the app to end', 10000);
}

/** Which app is in front. */
export async function inFront() {
  return /topResumedActivity=ActivityRecord\{\S+ \S+ ([^/ ]+)/.exec(await shell('dumpsys activity activities | grep -m1 topResumedActivity'))?.[1] ?? '';
}

/** A file of the app's own folder, as text: the log of a run, a note kept. */
export const ownFile = (path) => adb('exec-out', 'run-as', PACKAGE, 'cat', path);

/** The files of a folder of the app's own. */
export const ownFiles = (path) => adb('exec-out', 'run-as', PACKAGE, 'ls', '-la', path);

/**
 * The page of the app: connected to through the web view's door for
 * debugging. `evaluate` runs an expression in the page and gives its value
 * (a promise is awaited); `send` is any command of the protocol.
 */
export async function page(port = 9333) {
  const pid = await until(async () => (await shell(`pidof ${PACKAGE}`)).trim(), 'the app to run');
  await adb('forward', `tcp:${port}`, `localabstract:webview_devtools_remote_${pid}`);
  const target = await until(async () => {
    const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    return pages.find((p) => p.type === 'page' && p.webSocketDebuggerUrl);
  }, 'the page of the web view');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((opened, failed) => {
    socket.addEventListener('open', opened, { once: true });
    socket.addEventListener('error', () => failed(new Error('the door of the web view did not open')), { once: true });
  });
  let next = 0;
  let origin = null;
  const waiting = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const asked = waiting.get(message.id);
    if (!asked) return;
    waiting.delete(message.id);
    if (message.error) asked.failed(new Error(message.error.message));
    else asked.done(message.result);
  });
  const send = (method, params = {}) =>
    new Promise((done, failed) => {
      const id = ++next;
      waiting.set(id, { done, failed });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const got = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (got.exceptionDetails) {
      const said = got.exceptionDetails.exception?.description ?? got.exceptionDetails.text;
      throw new Error(`in the page: ${said}`);
    }
    return got.result.value;
  };
  return {
    url: target.url,
    send,
    evaluate,
    /**
     * Where an element lies on the screen, in the screen's pixels: its
     * middle. The page does not begin at the screen's corner (the system's
     * bar lies over it), and does not know where it begins: that is found
     * once, by a tap at a known place of the screen, which the page is
     * asked where it felt. The tap is on the foot of the page, where
     * nothing is.
     */
    async middle(selector) {
      origin ??= await (async () => {
        const size = /(\d+)x(\d+)/.exec(await shell('wm size'));
        const tapped = { x: Number(size[1]) / 2, y: Number(size[2]) * 0.55 };
        await evaluate(`new Promise((done) => { window.__felt = null; document.addEventListener('pointerdown', (e) => { window.__felt = { x: e.clientX, y: e.clientY, ratio: devicePixelRatio }; }, { capture: true, once: true }); done(true); })`);
        await tap(tapped.x, tapped.y);
        const felt = await until(() => evaluate('window.__felt'), 'the page to feel a tap', 5000, 100);
        return { x: tapped.x - felt.x * felt.ratio, y: tapped.y - felt.y * felt.ratio };
      })();
      const at = await evaluate(`(() => {
        const e = document.querySelector(${JSON.stringify(selector)});
        if (!e) return null;
        const r = e.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, ratio: window.devicePixelRatio };
      })()`);
      if (!at) throw new Error(`nothing in the page is ${selector}`);
      return { x: origin.x + at.x * at.ratio, y: origin.y + at.y * at.ratio };
    },
    close: () => socket.close(),
  };
}
