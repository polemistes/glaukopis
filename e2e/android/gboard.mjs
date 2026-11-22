// Google's keyboard on the emulator's device (a Pixel 7, 1080 by 2400,
// upright, English), typed on key by key with taps, so that what reaches
// the page is what a finger sends: the keyboard's composing, its
// suggestions and its corrections. `adb shell input text` sends keys of a
// hardware keyboard instead, and tries none of that.
//
// The places are read off a picture of this keyboard on this device; on
// another device, or another keyboard, they are others.

import { sleep, tap } from './device.mjs';

const ROWS = [
  { y: 1716, keys: 'qwertyuiop', x: [58, 164, 271, 378, 486, 593, 700, 806, 913, 1020] },
  { y: 1870, keys: 'asdfghjkl', x: [112, 218, 324, 432, 539, 646, 754, 859, 966] },
  { y: 2026, keys: 'zxcvbnm', x: [218, 324, 432, 539, 646, 754, 859] },
];
const NAMED = {
  shift: [84, 2026],
  backspace: [994, 2026],
  ',': [218, 2179],
  ' ': [592, 2179],
  '.': [859, 2179],
  enter: [994, 2179],
};
/** The three suggestions over the keys, where the keyboard shows them. */
export const SUGGESTION = { left: [250, 1575], middle: [540, 1575], right: [830, 1575] };

function place(key) {
  if (NAMED[key]) return NAMED[key];
  for (const row of ROWS) {
    const at = row.keys.indexOf(key);
    if (at >= 0) return [row.x[at], row.y];
  }
  throw new Error(`the keyboard has no key ${JSON.stringify(key)} here`);
}

/** Taps one key: a letter, a space, a comma, a full stop, or `shift`, `backspace`, `enter`. */
export async function key(name, pause = 140) {
  const [x, y] = place(name);
  await tap(x, y);
  await sleep(pause);
}

/** Types small letters, spaces, commas and full stops, a tap for each. */
export async function type(text) {
  for (const sign of text) await key(sign);
}
