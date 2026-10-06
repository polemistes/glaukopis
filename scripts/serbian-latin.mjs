// Makes the Serbian of the Latin script, locales/sr-Latn/, from that of the
// Cyrillic, locales/sr-Cyrl/, letter for letter: the two scripts write the
// same language, and the transliteration is fixed. Run it again whenever the
// Cyrillic changes. The names of messages, the variables and everything in
// Latin letters already are left as they are, since only Cyrillic letters
// are changed.
//
//   node scripts/serbian-latin.mjs

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'locales');
const from = join(root, 'sr-Cyrl');
const to = join(root, 'sr-Latn');

const LETTERS = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'đ', е: 'e', ж: 'ž', з: 'z', и: 'i', ј: 'j', к: 'k',
  л: 'l', љ: 'lj', м: 'm', н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'ć', у: 'u',
  ф: 'f', х: 'h', ц: 'c', ч: 'č', џ: 'dž', ш: 'š',
};

const isCyrillic = (c) => /[Ѐ-ӿ]/.test(c);
const isUpper = (c) => c !== c.toLowerCase();

/** A Cyrillic text in Latin letters. Capitals that stand among capitals become two capitals: ЉУБАВ is LJUBAV, Љубав is Ljubav. */
export function latin(text) {
  const chars = [...text];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const lower = c.toLowerCase();
    const mapped = LETTERS[lower];
    if (mapped === undefined) {
      out += c;
      continue;
    }
    if (!isUpper(c)) {
      out += mapped;
      continue;
    }
    if (mapped.length === 1) {
      out += mapped.toUpperCase();
      continue;
    }
    // A two-letter capital: all capitals when the letter beside it is one.
    const beside = chars[i + 1] ?? chars[i - 1] ?? '';
    const amongCapitals = isCyrillic(beside) && isUpper(beside);
    out += amongCapitals ? mapped.toUpperCase() : mapped[0].toUpperCase() + mapped.slice(1);
  }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(to, { recursive: true });
  let count = 0;
  for (const file of readdirSync(from)) {
    const text = readFileSync(join(from, file), 'utf8');
    let made = latin(text);
    if (file === 'GLOSSARY.md') {
      made = `<!-- Made from sr-Cyrl/GLOSSARY.md by scripts/serbian-latin.mjs; change the Cyrillic. -->\n\n${made}`;
    } else if (file.endsWith('.ftl')) {
      made = `# Made from sr-Cyrl/${file} by scripts/serbian-latin.mjs; change the Cyrillic, not this.\n${made}`;
    }
    writeFileSync(join(to, file), made);
    count++;
  }
  console.log(`${count} files of sr-Latn made from sr-Cyrl`);
}
