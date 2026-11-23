// The editor under Google's keyboard, the harder cases: bold begun and
// ended from the row of tools while the keyboard is up, Backspace over
// the edge of bold, a list begun, a second point, Backspace at the start
// of a paragraph, and the note kept on disk by itself.
import { page, screenshot, shell, sleep, start, tap } from './device.mjs';
import { key, type } from './gboard.mjs';

const html = (p) => p.evaluate(`document.querySelector('[data-phone-text] .ProseMirror').innerHTML.replace(/ class="[^"]*"/g, '')`);
/** Taps the tool so named in the row over the note, and waits a moment. */
const tool = async (p, name) => {
  const at = await p.middle(`[data-phone-tool="${name.toLowerCase()}"]`);
  await tap(at.x, at.y);
  await sleep(350);
};

await start();
const p = await page();
await sleep(4000);
console.log('buttons:', await p.evaluate(`JSON.stringify([...document.querySelectorAll('button')].map((b) => b.getAttribute('aria-label') || b.title || b.textContent.trim()))`));
// The phone's page: a new note, whose text has the cursor and the keyboard.
const fresh = await p.middle('[data-phone-new]');
await tap(fresh.x, fresh.y);
await sleep(1500);
const line = await p.middle('[data-phone-text] .ProseMirror');
await tap(line.x, line.y);
await sleep(2500);

await type('plain ');
await tool(p, 'Bold');
console.log('focus kept:', await p.evaluate(`document.activeElement?.classList.contains('ProseMirror')`));
await type('bold');
await tool(p, 'Bold');
await type(' after');
console.log('bold in the middle:', await html(p));
for (let i = 0; i < 8; i++) await key('backspace');
console.log('eight Backspaces, over the edge of bold:', await html(p));
await key('enter');
await tool(p, 'List');
await type('one');
await key('enter');
await type('two');
console.log('a list of two:', await html(p));
await key('enter');
await key('enter');
await type('out');
console.log('Enter twice leaves the list:', await html(p));
for (let i = 0; i < 4; i++) await key('backspace');
console.log('Backspace at the start of the paragraph:', await html(p));
await screenshot('marks-done');
await sleep(2500);
// What was written is kept on disk without being asked for, and the run's log says what went wrong.
console.log(await shell('run-as org.glaukopis.app sh -c "ls files/data/notebook"'));
p.close();
