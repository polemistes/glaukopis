// Removes from every language the messages that English no longer has, and
// those whose variables are no longer the English ones (a message reworded so
// that it says something else), each with the comment that stands over it: so
// that nothing names what the interface cannot show, and nothing is shown
// with a wrong variable. Only those lines are cut; the rest of the file stays
// as it was written. Run after messages are dropped, renamed or reworded in
// locales/en:
//
//   node scripts/prune-locales.mjs            every language
//   node scripts/prune-locales.mjs de nb      these languages
//
// What English has and a language lacks is left lacking: English is shown for
// it until it is translated (see locales/TRANSLATING.md).

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, Message, Term } from '@fluent/syntax';
import { uses } from './check-locales.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'locales');
const ENGLISH = 'en';
const asked = process.argv.slice(2);

/** The messages of a file, by name, with the variables each uses. */
function messages(text) {
  const out = new Map();
  for (const entry of parse(text, { withSpans: true }).body) {
    if (!(entry instanceof Message || entry instanceof Term)) continue;
    const variables = new Set(entry.value ? uses(entry.value).variables : []);
    for (const a of entry.attributes) for (const v of uses(a.value).variables) variables.add(v);
    out.set(entry.id.name, { entry, variables: [...variables].sort().join(' ') });
  }
  return out;
}

const tags = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== ENGLISH && (!asked.length || asked.includes(d.name)))
  .map((d) => d.name);

let total = 0;
for (const tag of tags) {
  const dir = join(root, tag);
  let pruned = 0;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ftl'))) {
    const path = join(dir, file);
    const english = join(root, ENGLISH, file);
    const known = existsSync(english) ? messages(readFileSync(english, 'utf8')) : new Map();
    let text = readFileSync(path, 'utf8');
    const cuts = [];
    for (const [name, { entry, variables }] of messages(text)) {
      const theirs = known.get(name);
      if (theirs && theirs.variables === variables) continue;
      cuts.push([entry.span.start, entry.span.end]);
    }
    if (!cuts.length) continue;
    // From the end, so that the earlier offsets hold; the line break after each goes with it.
    for (const [start, end] of cuts.sort((a, b) => b[0] - a[0])) {
      const after = text[end] === '\n' ? end + 1 : end;
      text = text.slice(0, start) + text.slice(after);
    }
    pruned += cuts.length;
    writeFileSync(path, text);
  }
  if (pruned) console.log(`${tag}: ${pruned} removed`);
  total += pruned;
}
console.log(`${total} messages removed from ${tags.length} languages`);
