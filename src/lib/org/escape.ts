/**
 * Text that looks like a sign (ADR 0041, "Text that looks like a sign").
 * Whatever text the editor can hold is written so that it reads back as
 * the same text: a sign that the words would make is written with a
 * backslash before it, and the reader takes the backslash away. A
 * backslash before anything else is kept as it is, so that what Org has of
 * its own (`\alpha`, `\\` at a line's end) stays itself.
 *
 * Two places a sign can be: at the start of a line, where a line of text
 * could read as a headline, an item of a list, a keyword, a table, a
 * speaker; and within a line, where an asterisk could read as bold or a
 * bracket as a kind of words. The first is handled here for a whole line;
 * the second, which depends on what stands around, by the writer of words
 * (`inline.ts`) with the rules below.
 */

/** The signs a backslash takes away before, within a line. */
export const ESCAPABLE = new Set([
  '\\',
  '*',
  '/',
  '_',
  '+',
  '~',
  '=',
  '^',
  '$',
  '[',
  ']',
  '{',
  '}',
  '@',
  ':',
  ' ',
  '\t',
]);

/** Whether a sign is a letter or a digit, of any script: what Org calls a word. */
export const isWord = (c: string | undefined): boolean => !!c && /^[\p{L}\p{N}]/u.test(c);

/** Whether a sign is a space or a tab. */
export const isSpace = (c: string | undefined): boolean => c === ' ' || c === '\t';

/**
 * The lines the reader of a body takes for something else than a line of
 * text: a headline or a bullet, an item of a list, a numbered item, a rule,
 * a keyword or a comment, a table, a grid table, a drawer, a speaker or a
 * direction, and formulas set apart.
 */
export const CONSTRUCTS: readonly RegExp[] = [
  /^\*+(\s|$)/,
  /^[-+](\s|$)/,
  /^\d+[.)](\s|$)/,
  /^-{5,}\s*$/,
  /^#(\+|\s|$)/,
  /^\|/,
  /^\+[-=]/,
  /^:/,
  /^[@>](\s|$)/,
  /^\\\[(\s|$)/,
  /^\\\](\s|$)/,
  /^\\(begin|end)\{/,
];

/** What is escaped at a line's start beyond the constructs: a counter of a list, and every backslash before a bracket of a formula. */
const MORE_SIGNS: readonly RegExp[] = [/^\\[[\]]/, /^\[@/];

/** Whether a line read as it stands would be a construct, when it is not escaped. */
export function isConstruct(line: string): boolean {
  return !isEscapedLine(line) && CONSTRUCTS.some((r) => r.test(line));
}

/**
 * Whether the words of a line, written as they are, would look like a sign
 * at its start. A backslash before such a line makes it text again, and so
 * a line that begins with a backslash before a sign is itself one: the
 * writer puts a backslash before it, and the reader takes one away.
 */
export function looksLikeSign(line: string): boolean {
  if (CONSTRUCTS.some((r) => r.test(line)) || MORE_SIGNS.some((r) => r.test(line))) return true;
  return line.startsWith('\\') && looksLikeSign(line.slice(1));
}

/** A line of words with a backslash before it where it would look like a sign. */
export function escapeLineStart(line: string): string {
  return looksLikeSign(line) ? `\\${line}` : line;
}

/** Whether a line was escaped by `escapeLineStart`. */
export const isEscapedLine = (line: string): boolean =>
  line.startsWith('\\') && looksLikeSign(line.slice(1));

/** A line as it was before `escapeLineStart`. */
export const unescapeLineStart = (line: string): string =>
  isEscapedLine(line) ? line.slice(1) : line;

/** The keywords of a headline that the reader takes for Org's own: a state of a task, or a commented subtree. */
export const HEADLINE_WORDS = ['TODO', 'DONE', 'NEXT', 'WAITING', 'HOLD', 'CANCELLED', 'COMMENT'];

/** Whether the words of a headline would read as one of Org's own things at its start or its end. */
export function headlineSign(name: string): boolean {
  if (new RegExp(`^(${HEADLINE_WORDS.join('|')})(\\s|$)`).test(name)) return true;
  if (/^\[#.\](\s|$)/.test(name)) return true;
  return name.startsWith('\\') && headlineSign(name.slice(1));
}

/** Whether the sign at `at` has a backslash before it: an odd number of them. */
export function escapedAt(s: string, at: number): boolean {
  let n = 0;
  for (let j = at - 1; j >= 0 && s[j] === '\\'; j--) n++;
  return n % 2 === 1;
}

/** A string with a backslash before each of the signs given, and before every backslash. */
export function escapeSigns(s: string, signs: string): string {
  let out = '';
  for (const c of s) out += c === '\\' || signs.includes(c) ? `\\${c}` : c;
  return out;
}

/** A string as it was before `escapeSigns`: a backslash before one of the signs, or before a backslash, is taken away. */
export function unescapeSigns(s: string, signs: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && i + 1 < s.length && (s[i + 1] === '\\' || signs.includes(s[i + 1]))) {
      out += s[i + 1];
      i++;
    } else out += s[i];
  }
  return out;
}

/**
 * The name of a kind of the writer's own as it is written: in small
 * letters, with hyphens for spaces, and nothing else but letters, digits
 * and hyphens ("Ship's name" is `ships-name`).
 */
export function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'kind'
  );
}

/**
 * A line of a source block that Org would take for a headline or a keyword
 * gets a comma, Org's way: after its indentation, before the star or `#+`
 * and before any commas already there, so that Org and this reader both take
 * one comma away. A line that begins with commas and then a space before
 * such a sign gets a comma at its very start, because the reader also takes
 * one away there, for the files of earlier versions (below).
 */
export function escapeCodeLine(line: string): string {
  if (/^\s*,*(\*|#\+)/.test(line)) return line.replace(/^(\s*)/, '$1,');
  if (/^,+\s+,*(\*|#\+)/.test(line)) return `,${line}`;
  return line;
}

/**
 * A line of a source block as it was before it was escaped. Earlier versions
 * put the comma before the indentation (`,    * x`), where Org leaves it; a
 * comma at the start before spaces and such a sign is taken away as well, so
 * that what they wrote reads back as it was.
 */
export function unescapeCodeLine(line: string): string {
  if (/^\s*,,*(\*|#\+)/.test(line)) return line.replace(/^(\s*),/, '$1');
  if (/^,,*\s+,*(\*|#\+)/.test(line)) return line.slice(1);
  return line;
}
