/**
 * Citations as Org has them (org-cite): `[cite:see @nagy1979 73 for the
 * phrase; @west2001]`, `[cite/t:@nagy1979]` for the author named in the
 * sentence, `-@nagy1979` for a work whose author is left out. Each item is
 * its prefix, its key, its locator and its suffix; a locator of pages is
 * written bare, any other with the short word of its label (`ch. 3`,
 * `l. 45`), and read back by it. A locator with a space in it, or one that
 * could be taken for words, stands in braces: `{45 ff.}`; where there is
 * no locator and the suffix could be taken for one, empty braces say so.
 */

import { LOCATOR_LABELS, type CiteItem, type CiteMode } from '$lib/editor/schema';
import type { InlineCitation } from '$lib/project/model/text';
import { unescapeSigns } from './escape';

/** The signs that a backslash goes before in the words of a citation. */
const SIGNS = ';[]@{}';

const SHORT = new Map(LOCATOR_LABELS.map(([label, short]) => [label, short]));
/** The short words a locator's label is read by, the longest first; `pp.` as well as `p.`. */
const WORDS: [string, string][] = (
  [...LOCATOR_LABELS.map(([label, short]) => [short, label]), ['pp.', 'page']] as [string, string][]
).sort((a, b) => b[0].length - a[0].length);

const escape = (s: string): string => {
  let out = '';
  for (const c of s) out += c === '\\' || SIGNS.includes(c) ? `\\${c}` : c;
  return out;
};

/** The short word a suffix begins with, if it begins with one followed by a space. */
const labelWord = (s: string): [string, string] | undefined =>
  WORDS.find(([word]) => s.startsWith(`${word} `));

/** A locator as one token: bare where it can be, else in braces. */
function locatorToken(locator: string, page: boolean): string {
  const bare = /^[^\s;[\]{}\\@]+$/.test(locator) && (!page || /^\d/.test(locator));
  return bare ? locator : `{${escape(locator)}}`;
}

/** A citation as Org writes it. `keyOf` gives the key of a reference by its id. */
export function writeCitation(
  items: CiteItem[],
  mode: CiteMode,
  keyOf: (id: string) => string,
): string {
  const parts = items.map((item) => {
    let out = item.prefix ? `${escape(item.prefix)} ` : '';
    out += `${item.suppressAuthor ? '-@' : '@'}${keyOf(item.id)}`;
    const locator = item.locator ?? '';
    const label = item.label && item.label !== 'page' ? item.label : '';
    if (locator) {
      out += label
        ? ` ${SHORT.get(label) ?? label} ${locatorToken(locator, false)}`
        : ` ${locatorToken(locator, true)}`;
    }
    if (item.suffix) {
      if (!locator && (/^[\d{]/.test(item.suffix) || labelWord(item.suffix))) out += ' {}';
      out += ` ${escape(item.suffix)}`;
    }
    return out;
  });
  return `[cite${mode === 'intext' ? '/t' : ''}:${parts.join('; ')}]`;
}

/** Splits at the signs given where they have no backslash before them. */
function splitAt(s: string, sign: string): string[] {
  const out: string[] = [];
  let at = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') i++;
    else if (s[i] === sign) {
      out.push(s.slice(at, i));
      at = i + 1;
    }
  }
  out.push(s.slice(at));
  return out;
}

/** One token at the start: in braces, or up to a space. */
function token(s: string): { value: string; rest: string } | null {
  if (s.startsWith('{')) {
    for (let i = 1; i < s.length; i++) {
      if (s[i] === '\\') i++;
      else if (s[i] === '}')
        return { value: unescapeSigns(s.slice(1, i), SIGNS), rest: s.slice(i + 1) };
    }
    return null;
  }
  const m = /^\S+/.exec(s);
  return m ? { value: unescapeSigns(m[0], SIGNS), rest: s.slice(m[0].length) } : null;
}

/** One item of a citation from what stands between two semicolons; null where it names no work. */
function readItem(raw: string, idOf: (key: string) => string): CiteItem | null {
  // The key: an `@` with no backslash before it, at the start or after a space, or after a `-` that is.
  let at = -1;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\\') {
      i++;
      continue;
    }
    if (raw[i] !== '@') continue;
    const before = i ? raw[i - 1] : ' ';
    const minus = before === '-' && (i < 2 || /\s/.test(raw[i - 2]));
    if (/\s/.test(before) || minus) {
      at = i;
      break;
    }
  }
  if (at < 0) return null;
  const key = /^[^\s;\]\\]+/.exec(raw.slice(at + 1))?.[0];
  if (!key) return null;
  const suppress = at > 0 && raw[at - 1] === '-' && (at < 2 || /\s/.test(raw[at - 2]));
  let prefix = raw.slice(0, suppress ? at - 1 : at);
  if (prefix.endsWith(' ')) prefix = prefix.slice(0, -1);
  let rest = raw.slice(at + 1 + key.length);
  if (rest.startsWith(' ')) rest = rest.slice(1);

  const item: CiteItem = { id: idOf(key) };
  const word = labelWord(rest);
  let locator: string | null = null;
  let label: string | null = null;
  if (word) {
    const got = token(rest.slice(word[0].length + 1));
    if (got) {
      locator = got.value;
      label = word[1];
      rest = got.rest;
    }
  } else if (/^[\d{]/.test(rest)) {
    const got = token(rest);
    if (got) {
      locator = got.value;
      rest = got.rest;
    }
  }
  if (locator !== null && rest.startsWith(' ')) rest = rest.slice(1);
  prefix = unescapeSigns(prefix, SIGNS);
  const suffix = unescapeSigns(rest, SIGNS);
  if (prefix) item.prefix = prefix;
  if (locator) item.locator = locator;
  if (locator && label && label !== 'page') item.label = label;
  if (suffix) item.suffix = suffix;
  if (suppress) item.suppressAuthor = true;
  return item;
}

/**
 * The citation that begins at `at`, and where it ends; null where what
 * begins there is no citation. `idOf` gives the id of a reference by its
 * key. What stands between items that names no work is kept: before the
 * first, as its prefix; after the last, as its suffix.
 */
export function readCitation(
  s: string,
  at: number,
  idOf: (key: string) => string,
): { citation: InlineCitation; end: number } | null {
  const head = /^\[cite(\/[^:\]\s]*)?:/.exec(s.slice(at, at + 40));
  if (!head) return null;
  const from = at + head[0].length;
  let end = -1;
  for (let i = from; i < s.length; i++) {
    if (s[i] === '\\') i++;
    else if (s[i] === '\n' || s[i] === '\0') return null;
    else if (s[i] === ']') {
      end = i;
      break;
    }
  }
  if (end < 0) return null;
  const style = head[1]?.slice(1) ?? '';
  const mode: CiteMode = style === 't' || style.startsWith('text') ? 'intext' : 'normal';
  const items: CiteItem[] = [];
  let before = '';
  let after = '';
  splitAt(s.slice(from, end), ';').forEach((part, n) => {
    const raw = n && part.startsWith(' ') ? part.slice(1) : part;
    const item = readItem(raw, idOf);
    if (item) {
      if (!items.length && before) item.prefix = `${before}${item.prefix ? ` ${item.prefix}` : ''}`;
      items.push(item);
    } else if (raw.trim()) {
      const words = unescapeSigns(raw.trim(), SIGNS);
      if (items.length) after += after ? `; ${words}` : words;
      else before += before ? `; ${words}` : words;
    }
  });
  if (after && items.length) {
    const last = items[items.length - 1];
    last.suffix = last.suffix ? `${last.suffix}; ${after}` : after;
  }
  return { citation: { kind: 'citation', items, mode }, end: end + 1 };
}
