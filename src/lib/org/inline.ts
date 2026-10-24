/**
 * Words and what stands among them, as Org text and back (ADR 0041, "Marks
 * on words", "Citations and notes", "Verse, with what is said of its
 * lines").
 *
 * Org's own marks: `*bold*`, `/italic/`, `_underlined_`, `+struck+`,
 * `~code~`, `^{raised}`, `_{lowered}`, `[[https://…][words]]` for a link.
 * What Org cannot say takes one bracket form, `[words]{what}`: `sc` for
 * small capitals, a kind of words by its name (`foreign lang=grc`,
 * `title`, a kind of the writer's own by the slug of its name), `lang=de`
 * for the language of some words, `found …` for a loose citation. One of
 * Org's marks that Org would not read where it stands, as one that begins
 * within a word, is written in the bracket form as well: `[Hom]{em}eric`.
 * Citations are org-cite (`cite.ts`), notes `[fn::…]` with `@foot` or
 * `@end` first where they say where they stand, formulas `$…$` (or
 * `\(…\)` where a `$` could not be read), reference marks `{#3:16}`,
 * cross-references `[[fig:hull]]`, `[[fig:hull][n]]`, `[[fig:hull][name]]`
 * and `[[id:…]]` for a part.
 *
 * What is said of a line by hand stands at its end, in braces: `{45}` a
 * number or label, `{-}` not counted, `{~}` counted with no number shown,
 * `{| words}` words in the margin, `{> 2}` its indent where it is not
 * verse; together as `{45 - > 2 | words}`. In verse a line's indent is two
 * spaces a step at its start.
 *
 * A line is written in the plainest way that reads back as it was: first
 * with signs escaped only where they would read as signs; where that does
 * not read back the same, with every sign of the words escaped; and last
 * with every mark in the bracket form. The reader is the judge: what is
 * written is read back before it is given out.
 */

import { linesOf } from '$lib/project/model/lines';
import type { Inline, InlineLineMark, InlineText } from '$lib/project/model/text';
import { readCitation, writeCitation } from './cite';
import {
  ESCAPABLE,
  escapeLineStart,
  escapedAt,
  isSpace,
  isWord,
  unescapeLineStart,
  unescapeSigns,
} from './escape';

type Marks = InlineText['marks'];

// ---- what the marks are ----

/** The marks that hold nothing but that they are there. */
const PLAIN_MARKS = ['em', 'strong', 'smallcaps', 'sup', 'sub', 'strike', 'underline', 'code'];

/** The marks Org writes with a sign on either side, by their sign. */
const EMPHASIS: Record<string, string> = { strong: '*', em: '/', underline: '_', strike: '+' };
const EMPHASIS_OF: Record<string, string> = {
  '*': 'strong',
  '/': 'em',
  _: 'underline',
  '+': 'strike',
};

/**
 * The signs something may begin with (see `Reader.attempt`): at any other
 * the reader goes on at once, without asking what begins there and keeping
 * the answer for every letter of the text.
 */
const BEGINNINGS = new Set(['[', '_', '^', '~', '=', '$', '{', ...Object.keys(EMPHASIS_OF)]);

/** The names the bracket form gives marks that are not kinds of words. */
const SPAN_NAMES: Record<string, string> = {
  sc: 'smallcaps',
  em: 'em',
  strong: 'strong',
  underline: 'underline',
  strike: 'strike',
  code: 'code',
  sup: 'sup',
  sub: 'sub',
  '.smallcaps': 'smallcaps',
  '.underline': 'underline',
};

/** The names a kind of the writer's own may not be written by, being signs of their own here. */
export const RESERVED_NAMES = new Set([
  ...Object.keys(SPAN_NAMES),
  'lang',
  'found',
  'link',
  'kind',
]);

/** The order marks are opened in where they reach as far: the outermost first. */
const ORDER = [
  'link',
  'found',
  'kind',
  'lang',
  'strong',
  'em',
  'underline',
  'strike',
  'smallcaps',
  'sup',
  'sub',
  'code',
];

const FOUND_BY = ['zotero', 'mendeley', 'key', 'form'];

/** What the mark `found` holds, in full, from what may be it. */
function foundOf(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const held = value as Record<string, unknown>;
  if (typeof held.id !== 'string' || !held.id) return null;
  return {
    id: held.id,
    by: FOUND_BY.includes(held.by as string) ? held.by : 'form',
    items: Array.isArray(held.items) ? held.items : [],
    mode: held.mode === 'intext' ? 'intext' : 'normal',
    left: held.left === true,
  };
}

/**
 * Marks as they are written and read: a plain mark as `true`, a link with
 * its address, a kind with its name and language, a language with its
 * tag, a found citation with all it holds. A mark that is not known, or
 * that lacks what it needs, is left out.
 */
export function canonicalMarks(marks: Marks | undefined): Marks {
  const out: Marks = {};
  for (const [named, value] of Object.entries(marks ?? {})) {
    const name = named.split('--')[0];
    if (value == null || (value as unknown) === false) continue;
    const held = (typeof value === 'object' ? value : {}) as Record<string, unknown>;
    if (PLAIN_MARKS.includes(name)) out[name] = true;
    else if (name === 'link') {
      if (typeof held.href === 'string' && held.href) out.link = { href: held.href };
    } else if (name === 'kind') {
      if (typeof held.name === 'string' && held.name)
        out.kind = { name: held.name, lang: typeof held.lang === 'string' ? held.lang : '' };
    } else if (name === 'lang') {
      if (typeof held.tag === 'string' && held.tag) out.lang = { tag: held.tag };
    } else if (name === 'found') {
      const found = foundOf(value);
      if (found) out.found = found;
    }
  }
  return out;
}

/** JSON with the keys of every object in order, so that two equal values are written alike. */
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableJson((value as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

/** A line mark with only what it says, or nothing where it says nothing. */
export function lineMark(said: Omit<InlineLineMark, 'kind'>): InlineLineMark | null {
  const mark: InlineLineMark = {
    kind: 'linemark',
    ...(said.number?.trim() ? { number: said.number.trim() } : {}),
    ...(said.counted === false ? { counted: false as const } : {}),
    ...(said.hidden ? { hidden: true as const } : {}),
    ...(said.shown && !said.hidden ? { shown: true as const } : {}),
    ...(said.margin?.trim() ? { margin: said.margin.trim() } : {}),
    ...(said.indent ? { indent: Math.max(0, Math.min(8, Math.round(said.indent))) } : {}),
  };
  return Object.keys(mark).length > 1 ? mark : null;
}

/**
 * Inline content as it is written and read: marks in their plain form,
 * runs of words with the same marks as one, no empty words, line marks and
 * formulas and reference marks that say something, notes the same within.
 */
export function normalInlines(items: readonly Inline[]): Inline[] {
  const out: Inline[] = [];
  for (const i of items) {
    if (i.kind === 'text') {
      if (!i.text) continue;
      const marks = canonicalMarks(i.marks);
      const last = out[out.length - 1];
      if (last?.kind === 'text' && stableJson(last.marks) === stableJson(marks))
        out[out.length - 1] = { ...last, text: last.text + i.text };
      else out.push({ kind: 'text', text: i.text, marks });
    } else if (i.kind === 'footnote') {
      out.push({
        kind: 'footnote',
        content: normalInlines(i.content).filter((c) => c.kind !== 'linemark'),
        ...(i.place === 'foot' || i.place === 'end' ? { place: i.place } : {}),
      });
    } else if (i.kind === 'linemark') {
      const mark = lineMark(i);
      if (mark) out.push(mark);
    } else if (i.kind === 'math') {
      if (i.tex.trim()) out.push({ kind: 'math', tex: i.tex.trim() });
    } else if (i.kind === 'refmark') {
      if (i.label.trim()) out.push({ kind: 'refmark', label: i.label.trim() });
    } else if (i.kind === 'citation') {
      out.push({ kind: 'citation', items: i.items.map((c) => ({ ...c })), mode: i.mode });
    } else out.push({ ...i });
  }
  return out;
}

/** Whether two runs of inline content are the same, as written and read. */
export const sameInlines = (a: readonly Inline[], b: readonly Inline[]): boolean =>
  stableJson(normalInlines(a)) === stableJson(normalInlines(b));

// ---- writing ----

/** What writing words needs of the project: names of kinds, keys of references, what cross-references point to. */
export interface InlineWriting {
  /** The name a kind of words is written by: the id of one of the catalogue, the slug of one of the writer's own. */
  kindName: (id: string) => string;
  /** The key a reference is cited by. */
  citeKey: (id: string) => string;
  /** What a cross-reference points to: `fig`, `tab`, `eq`, or `id` for a part. */
  refPrefix: (target: string) => string;
  /**
   * Told of words that no way of writing them reads back the same, with
   * their text: they are written as near as can be, and the writer of the
   * whole says so once.
   */
  unsure?: (text: string) => void;
}

/** How hard the words are escaped: only where needed; every sign; every sign and every mark in brackets. */
type Mode = 0 | 1 | 2;

interface Writing extends InlineWriting {
  mode: Mode;
}

type MarkNode =
  | { t: 'text'; text: string }
  | { t: 'mark'; name: string; value: unknown; kids: MarkNode[] }
  | { t: 'atom'; item: Inline };

const markKey = (name: string, value: unknown) => `${name}\u0001${stableJson(value)}`;

/** Runs of words with their marks as a tree: the mark that reaches furthest opens first. */
function treeOf(items: readonly Inline[], open: ReadonlySet<string> = new Set()): MarkNode[] {
  const out: MarkNode[] = [];
  const rank = (n: string) => {
    const r = ORDER.indexOf(n);
    return r < 0 ? ORDER.length : r;
  };
  let i = 0;
  while (i < items.length) {
    const item = items[i];
    if (item.kind !== 'text') {
      out.push({ t: 'atom', item });
      i++;
      continue;
    }
    const fresh = Object.keys(item.marks).filter((n) => !open.has(markKey(n, item.marks[n])));
    if (!fresh.length) {
      out.push({ t: 'text', text: item.text });
      i++;
      continue;
    }
    let best = fresh[0];
    let reach = -1;
    for (const name of fresh) {
      const key = markKey(name, item.marks[name]);
      let j = i + 1;
      while (j < items.length) {
        const next = items[j];
        if (next.kind !== 'text' || !(name in next.marks)) break;
        if (markKey(name, next.marks[name]) !== key) break;
        j++;
      }
      if (j > reach || (j === reach && rank(name) < rank(best))) {
        best = name;
        reach = j;
      }
    }
    const inner = new Set(open);
    inner.add(markKey(best, item.marks[best]));
    out.push({
      t: 'mark',
      name: best,
      value: item.marks[best],
      kids: treeOf(items.slice(i, reach), inner),
    });
    i = reach;
  }
  return out;
}

const EMPHASIS_SIGNS = new Set(['*', '/', '_', '+', '~', '=']);

/** Whether a sign of emphasis could open where it stands, as the reader has it. */
const couldOpen = (before: string, after: string) =>
  (before === '' || before === '\n' || !isWord(before)) &&
  after !== '' &&
  after !== '\n' &&
  !isSpace(after);

/** Whether a sign of emphasis could close where it stands. */
const couldClose = (before: string, after: string) =>
  before !== '' &&
  before !== '\n' &&
  !isSpace(before) &&
  (after === '' || after === '\n' || !isWord(after));

/**
 * Words with a backslash before every sign they would make where they
 * stand, and before a space at either end of a line, which would be taken
 * for the line's indentation or trimmed away. `before` is the sign written before them ('' at a line's start,
 * '\n' after a line break), `after` the first sign of what follows them.
 */
function escapeWords(text: string, before: string, after: string, mode: Mode): string {
  const chars = Array.from(text.replace(/\0/g, '').replace(/\r?\n/g, ' '));
  let out = '';
  for (let k = 0; k < chars.length; k++) {
    const c = chars[k];
    const b = k ? chars[k - 1] : before;
    const a = k + 1 < chars.length ? chars[k + 1] : after;
    let escape = false;
    if (c === '\\') escape = ESCAPABLE.has(a) || a === '(';
    else if (isSpace(c) && (a === '' || a === '\n')) {
      // A space at a line's end, kept from whatever trims lines by empty braces after it.
      out += `\\${c}{}`;
      continue;
    } else if (isSpace(c)) escape = b === '' || b === '\n';
    else if (EMPHASIS_SIGNS.has(c))
      escape = mode > 0 || couldOpen(b, a) || couldClose(b, a) || (c === '_' && a === '{');
    else if (c === '$' || c === '{' || c === '}') escape = true;
    else if (c === '^') escape = a === '{';
    else if (c === '[') {
      const rest = chars.slice(k, k + 6).join('');
      escape = mode > 0 || a === '[' || /^\[(cite[:/]|fn:)/i.test(rest);
    } else if (c === ']') escape = mode > 0 || a === ']';
    else if (c === ':') escape = a === ':' && (b === '' || b === '\n' || isSpace(b));
    out += escape ? `\\${c}` : c;
  }
  return out;
}

/** The first sign a node is written with, as far as what stands before it needs to know. */
function firstSign(node: MarkNode | undefined, after: string): string {
  if (!node) return after;
  if (node.t === 'text') return Array.from(node.text)[0] ?? after;
  if (node.t === 'mark') return node.name === 'sup' ? '^' : '[';
  switch (node.item.kind) {
    case 'break':
      return '\n';
    case 'refmark':
      return '{';
    case 'math':
      return '$';
    case 'linemark':
      return after;
    default:
      return '[';
  }
}

const lastSign = (s: string) => {
  const chars = Array.from(s);
  return chars[chars.length - 1] ?? '';
};

/** A sequence of nodes. `before` and `after` are the signs written on either side of it. */
function writeNodes(nodes: MarkNode[], before: string, after: string, w: Writing): string {
  let out = '';
  let prev = before;
  nodes.forEach((node, i) => {
    const piece = writeNode(node, prev, firstSign(nodes[i + 1], after), w);
    out += piece;
    if (piece) prev = lastSign(piece);
  });
  return out;
}

/** A link's address, or the target of a cross-reference, as Org writes it within `[[…]]`. */
const linkTarget = (s: string) => s.replace(/[\\[\]]/g, (c) => `\\${c}`);

/** A value of the bracket form: bare where it can be, else as JSON. */
const specValue = (v: string) => (/^[^\s"{}[\]=\\]+$/.test(v) ? v : JSON.stringify(v));

/** What the bracket form says of a mark: `sc`, `title`, `foreign lang=grc`, `lang=de`. */
function spanSpec(name: string, value: unknown, w: Writing): string {
  const held = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  switch (name) {
    case 'smallcaps':
      return 'sc';
    case 'lang':
      return `lang=${specValue(String(held.tag ?? ''))}`;
    case 'link':
      return `link href=${specValue(String(held.href ?? ''))}`;
    case 'kind': {
      const kind = w.kindName(String(held.name ?? ''));
      const named = /^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(kind)
        ? kind
        : `kind name=${specValue(kind)}`;
      return held.lang ? `${named} lang=${specValue(String(held.lang))}` : named;
    }
    case 'found': {
      const found = foundOf(value) ?? {};
      const items = (found.items as Record<string, unknown>[]) ?? [];
      const key = items.find((i) => typeof i?.key === 'string')?.key as string | undefined;
      const said = [
        'found',
        ...(key && /^[^\s"{}[\]=]+$/.test(key) ? [`key=${key}`] : []),
        `id=${specValue(String(found.id))}`,
        ...(found.by !== 'form' ? [`by=${specValue(String(found.by))}`] : []),
        ...(found.mode === 'intext' ? ['mode=intext'] : []),
        ...(found.left ? ['left'] : []),
        ...(items.length ? [`items=${JSON.stringify(items)}`] : []),
      ];
      return said.join(' ');
    }
    default:
      return name;
  }
}

function writeSpan(node: Extract<MarkNode, { t: 'mark' }>, w: Writing): string {
  return `[${writeNodes(node.kids, '[', ']', w)}]{${spanSpec(node.name, node.value, w)}}`;
}

/** Whether a link may be written as Org's own: not one that would read as a cross-reference or a picture. */
const orgLink = (href: string) =>
  !!href && !/[\n\0]/.test(href) && !/^(fig|tab|eq|id|file):/i.test(href);

function writeNode(node: MarkNode, before: string, after: string, w: Writing): string {
  if (node.t === 'text') return escapeWords(node.text, before, after, w.mode);
  if (node.t === 'mark') {
    const { name } = node;
    const edgeOk =
      (before === '' || before === '\n' || !isWord(before)) &&
      (after === '' || after === '\n' || !isWord(after));
    if (EMPHASIS[name] && w.mode < 2) {
      const sign = EMPHASIS[name];
      const inner = writeNodes(node.kids, sign, sign, w);
      const first = inner[0];
      const last = lastSign(inner);
      if (inner && edgeOk && !isSpace(first) && first !== '\n' && !isSpace(last) && last !== '\n')
        return `${sign}${inner}${sign}`;
    }
    if (name === 'code' && w.mode < 2 && node.kids.length === 1 && node.kids[0].t === 'text') {
      const text = node.kids[0].text;
      if (text && !/[~\n\0]/.test(text) && !isSpace(text[0]) && !isSpace(lastSign(text)) && edgeOk)
        return `~${text}~`;
    }
    if (name === 'sup' || name === 'sub')
      return `${name === 'sup' ? '^' : '_'}{${writeNodes(node.kids, '{', '}', w)}}`;
    if (name === 'link') {
      const href = String((node.value as { href?: unknown })?.href ?? '');
      if (orgLink(href)) return `[[${linkTarget(href)}][${writeNodes(node.kids, '[', ']', w)}]]`;
    }
    return writeSpan(node, w);
  }
  const item = node.item;
  switch (item.kind) {
    case 'citation':
      return writeCitation(item.items, item.mode, w.citeKey);
    case 'footnote': {
      let inner = writeNodes(
        treeOf(item.content.filter((i) => i.kind !== 'linemark')),
        item.place ? ' ' : ':',
        ']',
        w,
      );
      if (!item.place && /^@(foot|end)(\s|$)/.test(inner)) inner = `\\${inner}`;
      return `[fn::${item.place ? `@${item.place} ` : ''}${inner}]`;
    }
    case 'math': {
      const tex = item.tex.trim();
      const dollar =
        w.mode < 2 &&
        !/[$\n]/.test(tex) &&
        !isSpace(tex[0]) &&
        !isSpace(lastSign(tex)) &&
        (before === '' || before === '\n' || !isWord(before)) &&
        (after === '' || after === '\n' || !isWord(after));
      return dollar ? `$${tex}$` : `\\(${tex.replace(/\n/g, ' ')}\\)`;
    }
    case 'crossref': {
      const target = `[[${w.refPrefix(item.target)}:${linkTarget(item.target)}]`;
      return item.form === 'number'
        ? `${target}[n]]`
        : item.form === 'name'
          ? `${target}[name]]`
          : `${target}]`;
    }
    case 'refmark':
      return `{#${item.label.replace(/[\\{}]/g, (c) => `\\${c}`)}}`;
    case 'break':
      return '\n';
    default:
      return '';
  }
}

/** A number given to a line by hand as it stands in the braces: bare where it can be. */
const numberToken = (n: string) =>
  /^[^\s{}"|\\~>#+-][^\s{}"|\\]*$/.test(n)
    ? n
    : JSON.stringify(n).replace(/[{}]/g, (c) => (c === '{' ? '\\u007b' : '\\u007d'));

/** What is said of a line, in braces, for its end; '' where nothing is said. The indent is said only where asked. */
export function markText(mark: InlineLineMark | null, withIndent: boolean): string {
  if (!mark) return '';
  const said: string[] = [];
  if (mark.number) said.push(numberToken(mark.number));
  if (mark.counted === false) said.push('-');
  if (mark.hidden) said.push('~');
  if (mark.shown) said.push('+');
  if (withIndent && mark.indent) said.push(`> ${mark.indent}`);
  if (mark.margin) said.push(`| ${mark.margin.replace(/[\\{}]/g, (c) => `\\${c}`)}`);
  return said.length ? `{${said.join(' ')}}` : '';
}

/** How the lines of a paragraph are written: as prose, with `\\` for a line break; or as verse, a line a line. */
export type LineForm = 'prose' | 'verse';

/**
 * The lines a paragraph's content is written in, for one way of escaping.
 * Prose: every line but the last ends with ` \\`, a line break; what is
 * said of a line stands at its end, its indent in the braces. Verse: a line
 * a line, its indent as two spaces a step at its start, an empty line as
 * `\\` alone, so that it does not part the stanza.
 */
function contentLines(content: Inline[], form: LineForm, w: Writing): string[] {
  const segments: string[] = [];
  for (const line of linesOf(content)) {
    const raw = writeNodes(treeOf(line.content), '', '', w);
    const parts = raw.split('\n').map(escapeLineStart);
    const mark = markText(line.mark, form === 'prose');
    const lastAt = parts.length - 1;
    if (mark) parts[lastAt] = parts[lastAt] ? `${parts[lastAt]} ${mark}` : mark;
    if (form === 'verse' && line.mark?.indent) {
      // The indent as spaces at the start; where the line has no words, in the braces.
      if (raw) parts[0] = `${'  '.repeat(line.mark.indent)}${parts[0]}`;
      else parts[0] = markText(line.mark, true);
    }
    segments.push(...parts);
  }
  if (form === 'verse') return segments.map((s) => s || '\\\\');
  const out: string[] = [];
  segments.forEach((s, k) => {
    const more = k < segments.length - 1;
    if (!more && !s && k > 0) return;
    out.push(more ? (s ? `${s} \\\\` : '\\\\') : s);
  });
  return out;
}

/**
 * The lines a paragraph's content is written in: in the plainest way that
 * reads back the same, by `readContentLines`.
 */
export function writeContentLines(
  content: readonly Inline[],
  form: LineForm,
  writing: InlineWriting,
  reading: InlineReading,
): string[] {
  const want = normalInlines(content);
  let lines: string[] = [];
  for (const mode of [0, 1, 2] as Mode[]) {
    lines = contentLines(want, form, { ...writing, mode });
    if (sameInlines(readContentLines(lines, form, reading), want)) return lines;
  }
  writing.unsure?.(lines.join('\n'));
  return lines;
}

/** Words on one line, as a name or a caption is: written in the plainest way that reads back the same. */
export function writeLine(
  content: readonly Inline[],
  writing: InlineWriting,
  reading: InlineReading,
): string {
  const want = normalInlines(content).filter((i) => i.kind !== 'break' && i.kind !== 'linemark');
  let line = '';
  for (const mode of [0, 1, 2] as Mode[]) {
    line = escapeLineStart(writeNodes(treeOf(want), '', '', { ...writing, mode }));
    if (sameInlines(readLine(line, reading), want)) return line;
  }
  writing.unsure?.(line);
  return line;
}

// ---- reading ----

/** What reading words needs of the project: kinds of words by their names, references by their keys. */
export interface InlineReading {
  /** The id of a kind of words by the name it is written by. */
  kindOf: (name: string) => string;
  /** The id of a reference by its key. */
  citeId: (key: string) => string;
}

/** Where what is said of a line stood, while the words around it are read. */
interface Placeholder {
  kind: 'placeholder';
  /** Which of the places in the text read it stands for, in order. */
  at: number;
}
type Item = Inline | Placeholder;

/** The sign at `at`, whole: a letter outside the basic plane is two units. */
function signAt(s: string, at: number): string {
  if (at < 0 || at >= s.length) return '';
  const code = s.codePointAt(at)!;
  return String.fromCodePoint(code);
}

/** The sign that ends just before `at`. */
function signBefore(s: string, at: number): string {
  if (at <= 0) return '';
  const low = s.charCodeAt(at - 1);
  if (low >= 0xdc00 && low <= 0xdfff && at >= 2) return s.slice(at - 2, at);
  return s[at - 1];
}

/** Adds a mark to every run of words given, not to what is within a note. */
function withMark(items: Item[], name: string, value: Record<string, unknown> | true): Item[] {
  return items.map((i) =>
    i.kind === 'text' && !(name in i.marks) ? { ...i, marks: { ...i.marks, [name]: value } } : i,
  );
}

/** What the bracket form says, read: its name, and what is said with it. */
function readSpec(spec: string): { name: string | null; said: Map<string, unknown> } | null {
  const said = new Map<string, unknown>();
  let name: string | null = null;
  let i = 0;
  let first = true;
  const s = spec.trim();
  while (i < s.length) {
    while (isSpace(s[i])) i++;
    if (i >= s.length) break;
    const word = /^[^\s=]+/.exec(s.slice(i))?.[0] ?? '';
    i += word.length;
    if (s[i] !== '=') {
      if (first) name = word;
      else said.set(word, true);
      first = false;
      continue;
    }
    i++;
    first = false;
    const at = s[i];
    if (at === '"') {
      let j = i + 1;
      for (; j < s.length && s[j] !== '"'; j++) if (s[j] === '\\') j++;
      try {
        said.set(word, JSON.parse(s.slice(i, j + 1)));
      } catch {
        return null;
      }
      i = j + 1;
    } else if (at === '[' || at === '{') {
      let depth = 0;
      let j = i;
      let quoted = false;
      for (; j < s.length; j++) {
        const c = s[j];
        if (quoted) {
          if (c === '\\') j++;
          else if (c === '"') quoted = false;
        } else if (c === '"') quoted = true;
        else if (c === '[' || c === '{') depth++;
        else if (c === ']' || c === '}') {
          depth--;
          if (!depth) break;
        }
      }
      try {
        said.set(word, JSON.parse(s.slice(i, j + 1)));
      } catch {
        return null;
      }
      i = j + 1;
    } else {
      const value = /^[^\s]*/.exec(s.slice(i))?.[0] ?? '';
      said.set(word, value);
      i += value.length;
    }
  }
  if (name !== null && !/^\.?[\p{L}\p{N}][\p{L}\p{N}_.-]*$/u.test(name)) return null;
  if (name === null && !said.has('lang')) return null;
  return { name, said };
}

/** Where the braces of the bracket form close, from just after they open; -1 where they do not. */
function specEnd(s: string, from: number): number {
  let quoted = false;
  let depth = 0;
  for (let j = from; j < s.length; j++) {
    const c = s[j];
    if (c === '\n' || c === '\0') return -1;
    if (quoted) {
      if (c === '\\') j++;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '\\') j++;
    else if (c === '{') depth++;
    else if (c === '}') {
      if (!depth) return j;
      depth--;
    }
  }
  return -1;
}

const LINK_PARTS = /^(fig|tab|eq|id):(.+)$/s;

class Reader {
  i = 0;
  /** The places of the placeholders in the text, by where they stand. */
  readonly places = new Map<number, number>();
  constructor(
    readonly s: string,
    readonly ctx: InlineReading,
  ) {
    for (let j = s.indexOf('\0'); j >= 0; j = s.indexOf('\0', j + 1))
      this.places.set(j, this.places.size);
  }

  /** What stands from here until `stop` says to stop, or to the end: of the line, unless `lines` says to go on over breaks, as a note does. */
  seq(stop: () => boolean, lines = false): Item[] {
    const s = this.s;
    const out: Item[] = [];
    let words = '';
    const flush = () => {
      if (words) out.push({ kind: 'text', text: words, marks: {} });
      words = '';
    };
    while (this.i < s.length) {
      if (stop()) break;
      const c = s[this.i];
      if (c === '\n' && !lines) break;
      if (c === '\\') {
        const next = s[this.i + 1];
        if (next === '(') {
          const math = this.parenMath();
          if (math) {
            flush();
            out.push(math);
            continue;
          }
        }
        if (next !== undefined && ESCAPABLE.has(next)) {
          words += next;
          this.i += 2;
        } else {
          words += c;
          this.i++;
        }
        continue;
      }
      if (c === '\n') {
        flush();
        out.push({ kind: 'break' });
        this.i++;
        continue;
      }
      if (c === '\0') {
        flush();
        out.push({ kind: 'placeholder', at: this.places.get(this.i) ?? -1 });
        this.i++;
        continue;
      }
      const got = BEGINNINGS.has(c) ? this.construct(c) : null;
      if (got) {
        flush();
        out.push(...got);
        continue;
      }
      words += c;
      this.i++;
    }
    flush();
    return out;
  }

  /** What was read at each place where something may begin, so that nothing is read twice. */
  readonly read = new Map<number, { got: Item[] | null; end: number }>();

  /** How many signs are open around what is being read: past a limit, one more is taken for itself. */
  depth = 0;

  /**
   * Where a sign stands last in the text, found once. A sign that opens
   * something is read as opening it only where what closes it stands later
   * in the text: without that, each of a run of signs that never close read
   * all the rest of the line before it was given up, each one again past
   * the depth at which nothing more is opened, and a line of them took the
   * square of its length.
   */
  readonly #last = new Map<string, number>();
  lastOf(sign: string): number {
    let at = this.#last.get(sign);
    if (at === undefined) this.#last.set(sign, (at = this.s.lastIndexOf(sign)));
    return at;
  }

  /** Where the last sign `c` stands that could close what it opened. */
  readonly #lastCloser = new Map<string, number>();
  lastCloser(c: string): number {
    let at = this.#lastCloser.get(c);
    if (at === undefined) {
      at = -1;
      for (let j = this.s.lastIndexOf(c); j > 0; j = this.s.lastIndexOf(c, j - 1))
        if (this.closes(j, 0)) {
          at = j;
          break;
        }
      this.#lastCloser.set(c, at);
    }
    return at;
  }

  construct(c: string): Item[] | null {
    const at = this.i;
    const known = this.read.get(at);
    if (known) {
      this.i = known.end;
      return known.got;
    }
    if (this.depth > 48) return null;
    this.depth++;
    let got: Item[] | null;
    try {
      got = this.attempt(c);
    } finally {
      this.depth--;
    }
    this.read.set(at, { got, end: this.i });
    return got;
  }

  attempt(c: string): Item[] | null {
    const s = this.s;
    const at = this.i;
    let got: Item[] | null = null;
    if (c === '[') {
      if (s.startsWith('[[', at)) got = this.link();
      else if (/^\[cite[:/]/.test(s.slice(at, at + 6))) got = this.cite();
      else if (s.startsWith('[fn:', at)) got = this.note();
      if (!got) {
        this.i = at;
        got = this.span();
      }
    } else if (c === '_' && s[at + 1] === '{') got = this.script('sub');
    else if (c === '^' && s[at + 1] === '{') got = this.script('sup');
    else if (EMPHASIS_OF[c]) got = this.emphasis(c);
    else if (c === '~' || c === '=') got = this.verbatim(c);
    else if (c === '$') got = this.math();
    else if (c === '{' && s[at + 1] === '#') got = this.refmark();
    else if (c === '{' && s[at + 1] === '}') {
      // Empty braces, as Org writes after an entity or a space at a line's end: nothing.
      this.i += 2;
      got = [];
    }
    if (!got) this.i = at;
    return got;
  }

  opens(at: number): boolean {
    const before = signBefore(this.s, at);
    const after = this.s[at + 1];
    return (
      !isWord(before) && after !== undefined && after !== '\n' && after !== '\0' && !isSpace(after)
    );
  }

  closes(at: number, from: number): boolean {
    const before = signBefore(this.s, at);
    return (
      at > from &&
      !isSpace(before) &&
      before !== '\n' &&
      before !== '\0' &&
      !isWord(signAt(this.s, at + 1))
    );
  }

  emphasis(c: string): Item[] | null {
    const from = this.i;
    if (!this.opens(from) || this.lastCloser(c) <= from + 1) return null;
    this.i++;
    const kids = this.seq(() => this.s[this.i] === c && this.closes(this.i, from + 1));
    if (this.s[this.i] !== c || !kids.length) return null;
    this.i++;
    return withMark(kids, EMPHASIS_OF[c], true);
  }

  verbatim(c: string): Item[] | null {
    const s = this.s;
    const from = this.i;
    if (!this.opens(from) || this.lastCloser(c) <= from + 1) return null;
    for (let j = from + 2; j < s.length; j++) {
      if (s[j] === '\n' || s[j] === '\0') return null;
      if (s[j] === c && this.closes(j, from + 1)) {
        this.i = j + 1;
        return [{ kind: 'text', text: s.slice(from + 1, j), marks: { code: true } }];
      }
    }
    return null;
  }

  math(): Item[] | null {
    const s = this.s;
    const from = this.i;
    if (s.startsWith('$$', from)) {
      if (this.lastOf('$$') < from + 2) return null;
      const end = s.indexOf('$$', from + 2);
      const tex = end > 0 ? s.slice(from + 2, end) : '';
      if (end < 0 || !tex.trim() || /[\n\0]/.test(tex)) return null;
      this.i = end + 2;
      return [{ kind: 'math', tex: tex.trim() }];
    }
    if (!this.opens(from) || this.lastCloser('$') <= from + 1) return null;
    for (let j = from + 2; j < s.length; j++) {
      if (s[j] === '\n' || s[j] === '\0') return null;
      if (s[j] === '$' && this.closes(j, from + 1)) {
        this.i = j + 1;
        return [{ kind: 'math', tex: s.slice(from + 1, j).trim() }];
      }
    }
    return null;
  }

  parenMath(): Inline | null {
    const s = this.s;
    if (this.lastOf('\\)') < this.i + 2) return null;
    const end = s.indexOf('\\)', this.i + 2);
    if (end < 0) return null;
    const tex = s.slice(this.i + 2, end);
    if (!tex.trim() || /[\n\0]/.test(tex)) return null;
    this.i = end + 2;
    return { kind: 'math', tex: tex.trim() };
  }

  script(name: 'sup' | 'sub'): Item[] | null {
    if (this.lastOf('}') < this.i + 2) return null;
    this.i += 2;
    const kids = this.seq(() => this.s[this.i] === '}');
    if (this.s[this.i] !== '}' || !kids.length) return null;
    this.i++;
    return withMark(kids, name, true);
  }

  refmark(): Item[] | null {
    const s = this.s;
    if (this.lastOf('}') < this.i + 2) return null;
    let label = '';
    for (let j = this.i + 2; j < s.length; j++) {
      const c = s[j];
      if (c === '\n' || c === '\0') return null;
      if (c === '\\' && j + 1 < s.length && '\\{}'.includes(s[j + 1])) {
        label += s[++j];
      } else if (c === '}') {
        if (!label.trim()) return null;
        this.i = j + 1;
        return [{ kind: 'refmark', label: label.trim() }];
      } else label += c;
    }
    return null;
  }

  link(): Item[] | null {
    const s = this.s;
    const from = this.i;
    let target = '';
    let j = from + 2;
    for (; j < s.length; j++) {
      const c = s[j];
      if (c === '\\' && '[]\\'.includes(s[j + 1] ?? '')) target += s[++j];
      else if (c === ']') break;
      else if (c === '[' || c === '\n' || c === '\0') return null;
      else target += c;
    }
    if (s[j] !== ']' || !target) return null;
    const parts = LINK_PARTS.exec(target);
    if (s[j + 1] === ']') {
      this.i = j + 2;
      if (parts) return [{ kind: 'crossref', target: parts[2], form: 'full' }];
      return [{ kind: 'text', text: target, marks: { link: { href: target } } }];
    }
    if (s[j + 1] !== '[') return null;
    const descFrom = j + 2;
    if (this.lastOf(']]') < descFrom) return null;
    this.i = descFrom;
    const kids = this.seq(() => this.s.startsWith(']]', this.i));
    if (!this.s.startsWith(']]', this.i)) return null;
    const desc = s.slice(descFrom, this.i);
    this.i += 2;
    if (parts && (desc === 'n' || desc === 'name'))
      return [{ kind: 'crossref', target: parts[2], form: desc === 'n' ? 'number' : 'name' }];
    if (!kids.length) return [{ kind: 'text', text: target, marks: { link: { href: target } } }];
    return withMark(kids, 'link', { href: target });
  }

  cite(): Item[] | null {
    if (this.lastOf(']') < this.i) return null;
    const got = readCitation(this.s, this.i, this.ctx.citeId);
    if (!got) return null;
    this.i = got.end;
    return [got.citation];
  }

  note(): Item[] | null {
    const s = this.s;
    const head = /^\[fn:([^\s:\]]*):/.exec(s.slice(this.i, this.i + 80));
    if (!head || this.lastOf(']') < this.i + head[0].length) return null;
    this.i += head[0].length;
    let place: 'foot' | 'end' | null = null;
    const said = /^@(foot|end)(?=\s|\])/.exec(s.slice(this.i, this.i + 6));
    if (said) {
      place = said[1] as 'foot' | 'end';
      this.i += said[0].length;
      if (s[this.i] === ' ') this.i++;
    }
    const kids = this.seq(() => this.s[this.i] === ']', true);
    if (this.s[this.i] !== ']') return null;
    this.i++;
    return [
      {
        kind: 'footnote',
        content: kids.filter((k): k is Inline => k.kind !== 'placeholder'),
        ...(place ? { place } : {}),
      },
    ];
  }

  span(): Item[] | null {
    const s = this.s;
    if (this.lastOf(']{') <= this.i) return null;
    this.i++;
    const kids = this.seq(() => this.s[this.i] === ']' && this.s[this.i + 1] === '{');
    if (!(s[this.i] === ']' && s[this.i + 1] === '{')) return null;
    const end = specEnd(s, this.i + 2);
    if (end < 0) return null;
    const spec = readSpec(s.slice(this.i + 2, end));
    if (!spec) return null;
    this.i = end + 1;
    const { name, said } = spec;
    const text = (key: string) => {
      const v = said.get(key);
      return typeof v === 'string' ? v : '';
    };
    if (name === null) return withMark(kids, 'lang', { tag: text('lang') });
    if (SPAN_NAMES[name]) return withMark(kids, SPAN_NAMES[name], true);
    if (name === 'link')
      return text('href') ? withMark(kids, 'link', { href: text('href') }) : kids;
    if (name === 'found') {
      const found = foundOf({
        id: text('id') || text('key'),
        by: text('by') || 'form',
        items: Array.isArray(said.get('items')) ? said.get('items') : [],
        mode: text('mode'),
        left: said.get('left') === true || said.get('left') === 't',
      });
      return found ? withMark(kids, 'found', found) : kids;
    }
    const kind = name === 'kind' ? text('name') : name.replace(/^\./, '');
    if (!kind) return kids;
    return withMark(kids, 'kind', { name: this.ctx.kindOf(kind), lang: text('lang') });
  }
}

/** Inline content from text in which `\n` is a line break and `\0` stands where a line mark was. */
function parseItems(s: string, ctx: InlineReading): Item[] {
  return new Reader(s, ctx).seq(() => false, true);
}

/** Merges runs of words with the same marks, as `normalInlines` does, keeping placeholders where they are. */
function merged(items: Item[]): Item[] {
  const out: Item[] = [];
  for (const i of items) {
    if (i.kind === 'text') {
      if (!i.text) continue;
      const last = out[out.length - 1];
      if (last?.kind === 'text' && stableJson(last.marks) === stableJson(i.marks)) {
        out[out.length - 1] = { ...last, text: last.text + i.text };
        continue;
      }
    }
    out.push(i);
  }
  return out;
}

/** What is said of a line, read from what stands in its braces; null where it is not that. */
export function readMarkText(said: string): Omit<InlineLineMark, 'kind'> | null {
  let s = said.trim();
  const out: Omit<InlineLineMark, 'kind'> = {};
  if (s.startsWith('"')) {
    let j = 1;
    for (; j < s.length && s[j] !== '"'; j++) if (s[j] === '\\') j++;
    try {
      out.number = JSON.parse(s.slice(0, j + 1));
    } catch {
      return null;
    }
    s = s.slice(j + 1);
  } else {
    const n = /^[^\s{}"|\\~>#+-][^\s{}"|\\]*/.exec(s)?.[0];
    if (n) {
      out.number = n;
      s = s.slice(n.length);
    }
  }
  for (;;) {
    s = s.replace(/^\s+/, '');
    if (!s) break;
    if (/^-(\s|$)/.test(s)) {
      out.counted = false;
      s = s.slice(1);
    } else if (/^~(\s|$)/.test(s)) {
      out.hidden = true;
      s = s.slice(1);
    } else if (/^\+(\s|$)/.test(s)) {
      out.shown = true;
      s = s.slice(1);
    } else if (/^>\s*\d+(\s|$)/.test(s)) {
      const m = /^>\s*(\d+)/.exec(s)!;
      out.indent = Number(m[1]);
      s = s.slice(m[0].length);
    } else if (s.startsWith('|')) {
      out.margin = unescapeSigns(s.slice(1).trim(), '{}');
      break;
    } else return null;
  }
  return Object.keys(out).length ? out : null;
}

/** What is said at a line's end, and the line without it; the line as it was where nothing is said. */
export function splitMark(line: string): {
  line: string;
  mark: Omit<InlineLineMark, 'kind'> | null;
} {
  const t = line.replace(/\s+$/, '');
  if (!t.endsWith('}') || escapedAt(t, t.length - 1)) return { line, mark: null };
  let open = -1;
  for (let j = t.length - 2; j >= 0; j--)
    if (t[j] === '{' && !escapedAt(t, j)) {
      open = j;
      break;
    }
  if (open < 0 || (open > 0 && !isSpace(t[open - 1])) || t[open + 1] === '#')
    return { line, mark: null };
  const mark = readMarkText(t.slice(open + 1, -1));
  if (!mark) return { line, mark: null };
  return { line: open > 0 ? t.slice(0, open - 1) : '', mark };
}

/** A line with the sign of a line break at its end taken off, and whether it had one: an even run of backslashes. */
export function splitBreak(line: string): { line: string; broken: boolean } {
  const run = /\\+$/.exec(line)?.[0].length ?? 0;
  if (!run || run % 2) return { line, broken: false };
  let rest = line.slice(0, -2);
  if (rest.endsWith(' ')) rest = rest.slice(0, -1);
  return { line: rest, broken: true };
}

/**
 * The content of a paragraph from the lines it is written in (see
 * `contentLines`). Prose: leading spaces are not part of the words; a line
 * that ends with ` \\` breaks the line, a bare newline joins with a space,
 * as Org reads it. Verse: every line a line, its leading spaces its indent.
 */
export function readContentLines(
  lines: readonly string[],
  form: LineForm,
  ctx: InlineReading,
): Inline[] {
  let s = '';
  const said: Omit<InlineLineMark, 'kind'>[] = [];
  lines.forEach((raw, k) => {
    let line = raw.replace(/\r$/, '');
    let indent = 0;
    if (form === 'verse') {
      const lead = /^ */.exec(line)![0].length;
      indent = Math.floor(lead / 2);
      line = line.slice(lead);
    } else line = line.replace(/^\s+/, '');
    const cut = splitBreak(line);
    line = cut.line;
    const marked = splitMark(line);
    line = unescapeLineStart(marked.line);
    if (form === 'verse') {
      if (indent || marked.mark) {
        said.push({ ...(indent ? { indent } : {}), ...(marked.mark ?? {}) });
        s += '\0';
      }
      s += line;
      if (k < lines.length - 1) s += '\n';
      return;
    }
    s += line;
    if (marked.mark) {
      said.push(marked.mark);
      s += '\0';
    }
    if (cut.broken) s += '\n';
    else if (k < lines.length - 1) {
      // A bare newline joins with a space, as Org reads it; spaces before it that are not words go.
      while (/[ \t]$/.test(s) && !escapedAt(s, s.length - 1)) s = s.slice(0, -1);
      s += ' ';
    }
  });
  return settle(parseItems(s, ctx), said);
}

/** Words on one line, as `writeLine` writes them. */
export function readLine(line: string, ctx: InlineReading): Inline[] {
  return normalInlines(
    settle(parseItems(unescapeLineStart(line.replace(/^\s+/, '')), ctx), []).filter(
      (i) => i.kind !== 'linemark',
    ),
  );
}

/**
 * The placeholders of a paragraph read, made into line marks: what is said
 * of a line, from its start and its end, as one mark at its start. One
 * that stood within a note is dropped.
 */
function settle(items: Item[], said: Omit<InlineLineMark, 'kind'>[]): Inline[] {
  const out: Inline[] = [];
  let line: Inline[] = [];
  let mark: Omit<InlineLineMark, 'kind'> = {};
  const close = () => {
    const made = lineMark(mark);
    if (made) out.push(made);
    out.push(...line);
    line = [];
    mark = {};
  };
  for (const i of merged(items)) {
    if (i.kind === 'placeholder') {
      mark = { ...mark, ...(said[i.at] ?? {}) };
    } else if (i.kind === 'break') {
      close();
      out.push(i);
    } else line.push(i);
  }
  close();
  return normalInlines(out);
}
