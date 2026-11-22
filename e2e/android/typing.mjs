// The editor of the texts under Google's keyboard, on the emulator: words
// typed with the keyboard's own suggestions and corrections, a paragraph
// begun with Enter, letters taken away with Backspace. What the page then
// holds is read from the editor.
//
// Run with the emulator up and the debug app installed:
//   node e2e/android/typing.mjs
import { page, screenshot, sleep, start, tap } from './device.mjs';
import { key, type, SUGGESTION } from './gboard.mjs';

const held = (p) =>
  p.evaluate(`JSON.stringify([...document.querySelectorAll('.ProseMirror > *')].map((e) => e.tagName + ': ' + e.textContent))`);

await start();
const p = await page();
await sleep(4000);
const line = await p.middle('.ProseMirror');
await tap(line.x, line.y);
await sleep(2500);

await type('helo');
await screenshot('typing-1-composing');
console.log('composing "helo":', await held(p));
await key(' ');
console.log('after a space:', await held(p));
await type('wor');
await screenshot('typing-2-suggestions');
await tap(...SUGGESTION.middle);
await sleep(400);
console.log('after the middle suggestion:', await held(p));
await key('enter');
await type('second lines');
await key('backspace');
console.log('after Enter, a line, one Backspace:', await held(p));
await key('.');
await key(' ');
await type('next');
console.log('after a full stop:', await held(p));
await screenshot('typing-3-done');
p.close();
