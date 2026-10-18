/**
 * The words of a language as Fluent files, read and written by the place of
 * each message in its file, so that what is put back changes only what was
 * changed: the comments, the order and the blank lines stay as they are. As
 * `scripts/locale-sheet.mjs` does it for a spreadsheet, and with the same
 * checks as `scripts/check-locales.mjs`: what is put back must be good
 * Fluent, with the variables and references of the English and the plural
 * forms of the language.
 *
 * A part of a message is its value (`name`) or one of its attributes
 * (`name.hint`). Its text is shown and edited without the indentation of
 * its lines, and indented again when it is written.
 */

import { parse, type Pattern } from '@fluent/syntax';

/** The plural forms, by the name Fluent and Unicode give them. */
const CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

/** A part of a message and where its text stands in the file. */
export interface Part {
  key: string;
  start: number;
  end: number;
}

export interface Message {
  id: string;
  /** Where the whole message stands, with its attributes. */
  start: number;
  end: number;
  /** What the file says of it for translators. */
  comment: string;
  parts: Part[];
}

/** A file read: its text, its messages, and the text of each part without its indentation. */
export interface FileRead {
  text: string;
  messages: Message[];
  parts: Map<string, { text: string; indent: number }>;
  /** Whether any of it cannot be read. */
  faulty: boolean;
}

/** The messages of the text of a Fluent file, in their order; and whether any of it cannot be read. */
export function messagesOf(text: string): { messages: Message[]; faulty: boolean } {
  const resource = parse(text, { withSpans: true });
  const messages: Message[] = [];
  for (const entry of resource.body) {
    if (entry.type !== 'Message') continue;
    const parts: Part[] = [];
    if (entry.value?.span)
      parts.push({ key: entry.id.name, start: entry.value.span.start, end: entry.value.span.end });
    for (const a of entry.attributes) {
      if (a.value.span)
        parts.push({
          key: `${entry.id.name}.${a.id.name}`,
          start: a.value.span.start,
          end: a.value.span.end,
        });
    }
    messages.push({
      id: entry.id.name,
      start: entry.span?.start ?? 0,
      end: entry.span?.end ?? 0,
      comment: entry.comment?.content ?? '',
      parts,
    });
  }
  return { messages, faulty: resource.body.some((e) => e.type === 'Junk') };
}

/** The indentation of the lines after the first of a text as it stands in a file. */
export function indentOf(source: string): number {
  const lines = source
    .split('\n')
    .slice(1)
    .filter((l) => l.trim());
  if (!lines.length) return 4;
  return Math.min(...lines.map((l) => l.length - l.trimStart().length));
}

/** A text as it is shown: without the indentation of its lines. */
export function dedent(source: string): string {
  const n = indentOf(source);
  return source
    .split('\n')
    .map((line, i) =>
      i === 0 ? line : line.slice(Math.min(n, line.length - line.trimStart().length)),
    )
    .join('\n');
}

/** A text as it is written in a file, its lines after the first indented by `n`. */
export function indent(text: string, n: number): string {
  const pad = ' '.repeat(n);
  return text
    .split('\n')
    .map((line, i) => (i === 0 || !line.trim() ? line.trimEnd() : pad + line.trimEnd()))
    .join('\n');
}

/** A text made tidy: no line endings of Windows, no empty lines at its ends, no spaces at the end of a line. */
export function tidy(text: string | null | undefined): string {
  return (text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
}

/** A file read, with the text of each of its parts. */
export function readFile(text: string): FileRead {
  const { messages, faulty } = messagesOf(text);
  const parts = new Map<string, { text: string; indent: number }>();
  for (const m of messages) {
    for (const p of m.parts) {
      const source = text.slice(p.start, p.end);
      parts.set(p.key, { text: dedent(source), indent: indentOf(source) });
    }
  }
  return { text, messages, parts, faulty };
}

/** What a pattern uses: its variables, the messages it refers to, and its choices by number. */
export function uses(pattern: Pattern | null | undefined): {
  variables: Set<string>;
  references: Set<string>;
  selects: string[][];
} {
  const variables = new Set<string>();
  const references = new Set<string>();
  const selects: string[][] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }
    const n = node as {
      type?: string;
      id?: { name: string };
      variants?: { key: { type: string; name?: string; value?: string } }[];
    };
    if (n.type === 'VariableReference' && n.id) variables.add(n.id.name);
    if ((n.type === 'MessageReference' || n.type === 'TermReference') && n.id)
      references.add(n.id.name);
    if (n.type === 'SelectExpression' && n.variants) {
      const keys = n.variants.map((v) =>
        v.key.type === 'Identifier' ? (v.key.name ?? '') : String(v.key.value),
      );
      // A choice among plural forms names a form besides `other`.
      if (keys.some((k) => CATEGORIES.has(k) && k !== 'other'))
        selects.push(keys.filter((k) => CATEGORIES.has(k)));
    }
    for (const [key, value] of Object.entries(node)) {
      if (key !== 'span' && key !== 'type') walk(value);
    }
  };
  walk(pattern);
  return { variables, references, selects };
}

/** The plural forms of a language: all of them, and those whole numbers take. */
export function plurals(tag: string): { all: Set<string>; whole: Set<string> } {
  let rules: Intl.PluralRules;
  try {
    rules = new Intl.PluralRules(tag);
  } catch {
    rules = new Intl.PluralRules('en');
  }
  const all = new Set<string>(rules.resolvedOptions().pluralCategories);
  const whole = new Set<string>();
  for (let n = 0; n <= 200; n++) whole.add(rules.select(n));
  for (const n of [1000, 1001, 1002, 1005, 1021, 1000000]) whole.add(rules.select(n));
  return { all, whole };
}

/** The pattern of a text, as the value of a message; nothing where it is not one good text. */
function patternOf(text: string): { pattern: Pattern | null; fault: string | null } {
  const resource = parse(`probe = ${indent(text, 4)}\n`, { withSpans: false });
  const junk = resource.body.find((e) => e.type === 'Junk');
  if (junk) {
    const said = junk.type === 'Junk' ? junk.annotations[0]?.message : null;
    return { pattern: null, fault: said ?? 'not good Fluent' };
  }
  const messages = resource.body.filter((e) => e.type === 'Message');
  if (messages.length !== 1 || messages[0].type !== 'Message' || !messages[0].value)
    return { pattern: null, fault: 'not one text' };
  if (messages[0].attributes.length) return { pattern: null, fault: 'a line begins with “.”' };
  return { pattern: messages[0].value, fault: null };
}

/** Why a text cannot be put back for a part, or nothing where it can. */
export interface Fault {
  kind: 'fluent' | 'variables' | 'reference' | 'plurals';
  detail: string;
}

/**
 * What is wrong with a text for a part of a message in a language, or
 * nothing. `english` is the English of the part; for English itself, the
 * text as it was, whose variables are those the program gives.
 */
export function fault(tag: string, text: string, english: string): Fault | null {
  const mine = patternOf(text);
  if (!mine.pattern) return { kind: 'fluent', detail: mine.fault ?? '' };
  const theirs = patternOf(english).pattern;
  if (!theirs) return null;
  const a = uses(mine.pattern);
  const b = uses(theirs);
  const list = (set: Set<string>) => [...set].sort().join(', ') || '—';
  const same =
    [...a.variables].every((v) => b.variables.has(v)) && a.variables.size === b.variables.size;
  if (!same) return { kind: 'variables', detail: `${list(a.variables)} ≠ ${list(b.variables)}` };
  for (const ref of a.references)
    if (!b.references.has(ref)) return { kind: 'reference', detail: ref };
  const { all, whole } = plurals(tag);
  for (const keys of a.selects) {
    const missing = [...whole].filter((c) => !keys.includes(c));
    const foreign = keys.filter((c) => !all.has(c));
    if (missing.length || foreign.length)
      return { kind: 'plurals', detail: [...missing, ...foreign.map((f) => `−${f}`)].join(', ') };
  }
  return null;
}

/** A change to be put into a file: the new text of a part, and its text when it was taken out. */
export interface Change {
  file: string;
  key: string;
  text: string;
  was: string;
}

/** What came of putting changes into the files of a language. */
export interface Applied {
  /** The files changed, by name, with their new text. */
  files: Map<string, string>;
  /** The changes that were put in. */
  done: Change[];
  /** Changed in the file since it was taken out: left as the file has it. */
  conflicts: Change[];
  /** Not put in, and why. */
  refused: { change: Change; fault: Fault | { kind: 'missing' | 'file'; detail: string } }[];
}

/**
 * Puts changes into the files of a language: `own` are its files as they
 * are now, by name (`common.ftl`), `english` the English ones. A change is
 * put in where the file has the part as it was when it was taken out, and
 * where it is good; a message the language lacks is added after the one
 * before it in the English, a file it lacks begins as the English begins.
 */
export function apply(
  tag: string,
  english: Map<string, string>,
  own: Map<string, string>,
  changes: Change[],
): Applied {
  const result: Applied = { files: new Map(), done: [], conflicts: [], refused: [] };
  const byFile = new Map<string, Change[]>();
  for (const c of changes) {
    const englishFile = english.get(c.file);
    const source = englishFile ? readFile(englishFile).parts.get(c.key) : undefined;
    if (!source) {
      result.refused.push({ change: c, fault: { kind: 'missing', detail: c.key } });
      continue;
    }
    const now = own.has(c.file) ? (readFile(own.get(c.file)!).parts.get(c.key)?.text ?? '') : '';
    if (tidy(now) !== tidy(c.was)) {
      result.conflicts.push(c);
      continue;
    }
    const why = fault(tag, c.text, tag === 'en' ? c.was : source.text);
    if (why) {
      result.refused.push({ change: c, fault: why });
      continue;
    }
    byFile.set(c.file, [...(byFile.get(c.file) ?? []), c]);
  }

  for (const [file, wanted] of byFile) {
    const englishFile = readFile(english.get(file)!);
    let text = own.get(file) ?? '';
    if (!text) {
      const first = englishFile.messages[0];
      const end = first
        ? first.comment
          ? englishFile.text.lastIndexOf('\n#', first.start) + 1
          : first.start
        : englishFile.text.length;
      const head = englishFile.text.slice(0, end);
      text = head.trim() ? `${head.trimEnd()}\n` : '';
    }
    const { messages } = messagesOf(text);
    const byId = new Map(messages.map((m) => [m.id, m]));
    const want = new Map(wanted.map((c) => [c.key, c]));
    const edits: [number, number, string][] = [];
    const added = new Map<number | 'end', string[]>();
    const put: Change[] = [];
    for (const m of englishFile.messages) {
      const keys = m.parts.map((p) => p.key).filter((k) => want.has(k));
      if (!keys.length) continue;
      const mine = byId.get(m.id);
      if (mine) {
        for (const key of keys) {
          const part = mine.parts.find((p) => p.key === key);
          const change = want.get(key)!;
          if (part) {
            const n = indentOf(text.slice(part.start, part.end));
            edits.push([part.start, part.end, indent(change.text, n)]);
          } else {
            const attr = key.slice(key.indexOf('.') + 1);
            edits.push([mine.end, mine.end, `\n    .${attr} = ${indent(change.text, 8)}`]);
          }
          put.push(change);
        }
        continue;
      }
      // A message the language lacks, written as the English is.
      const value = m.parts.find((p) => p.key === m.id);
      const valueChange = want.get(m.id);
      if (value && !valueChange) {
        for (const key of keys)
          result.refused.push({ change: want.get(key)!, fault: { kind: 'missing', detail: m.id } });
        continue;
      }
      const lines: string[] = [];
      if (m.comment) lines.push(...m.comment.split('\n').map((l) => (l ? `# ${l}` : '#')));
      lines.push(`${m.id} =${valueChange ? ` ${indent(valueChange.text, 4)}` : ''}`);
      for (const p of m.parts.filter((p) => p.key !== m.id && want.has(p.key))) {
        lines.push(`    .${p.key.slice(m.id.length + 1)} = ${indent(want.get(p.key)!.text, 8)}`);
      }
      const index = englishFile.messages.indexOf(m);
      const before = englishFile.messages
        .slice(0, index)
        .reverse()
        .find((e) => byId.has(e.id));
      const anchor = before ? byId.get(before.id)!.end : ('end' as const);
      added.set(anchor, [...(added.get(anchor) ?? []), lines.join('\n')]);
      for (const key of keys) put.push(want.get(key)!);
    }
    for (const [anchor, blocks] of added) {
      if (anchor === 'end') {
        const lead = text && !text.endsWith('\n') ? '\n' : '';
        edits.push([
          text.length,
          text.length,
          `${lead}${text.trim() ? '\n' : ''}${blocks.join('\n')}\n`,
        ]);
      } else edits.push([anchor, anchor, `\n${blocks.join('\n')}`]);
    }
    // Applied from the end, so that each offset still holds. Of those at the
    // same offset the one made last is applied first, and so lands after
    // those made before it: the new parts of a message (made first) come
    // right after it, in their English order, and a new message that follows
    // it (made after) comes after them, not between the message and its parts.
    const order = new Map(edits.map((e, i) => [e, i]));
    edits.sort((a, b) => b[0] - a[0] || order.get(b)! - order.get(a)!);
    for (const [start, end, replacement] of edits)
      text = text.slice(0, start) + replacement + text.slice(end);
    if (messagesOf(text).faulty) {
      for (const c of put)
        result.refused.push({ change: c, fault: { kind: 'file', detail: file } });
      continue;
    }
    result.files.set(file, text);
    result.done.push(...put);
  }
  return result;
}

/**
 * Changes to be put over the own words of a language (ADR 0035), as `apply`
 * takes them. `there` are the files of own words as they are, `builtIn` the
 * language's files as they are built in. A message a change touches that the
 * own words lack is first given as it is built in, whole, so that a part is
 * changed within its message and the message laid over keeps its other
 * parts; and each change is made against what is there now, so that it is
 * put over it rather than refused as changed since.
 */
export function overOwn(
  builtIn: Map<string, string>,
  there: Map<string, string>,
  changes: Change[],
): { own: Map<string, string>; changes: Change[] } {
  const own = new Map(there);
  const files = new Set(changes.map((c) => c.file));
  for (const file of files) {
    let text = own.get(file) ?? '';
    const have = new Set(messagesOf(text).messages.map((m) => m.id));
    const source = builtIn.get(file) ?? '';
    const built = messagesOf(source).messages;
    const wanted = new Set(changes.filter((c) => c.file === file).map((c) => c.key.split('.')[0]));
    const given = built
      .filter((m) => wanted.has(m.id) && !have.has(m.id))
      .map((m) => source.slice(m.start, m.end).trimEnd());
    if (given.length) {
      const lead = text && !text.endsWith('\n') ? '\n' : '';
      text = `${text}${lead}${given.join('\n')}\n`;
      own.set(file, text);
    }
  }
  const read = new Map([...own].map(([file, text]) => [file, readFile(text)]));
  return {
    own,
    changes: changes.map((c) => ({
      ...c,
      was: read.get(c.file)?.parts.get(c.key)?.text ?? '',
    })),
  };
}
