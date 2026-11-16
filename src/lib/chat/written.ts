/**
 * What is written in the chat, and how a message is drawn (record 0107),
 * as plain functions: the words and marks of the field to a message and back
 * again; what is written and not yet sent, with what it answers or changes,
 * as the drafts of the project keep it (record 0094); and the stretches a
 * message is drawn as, its addresses of the web as links, and whether it is
 * a few emojis and nothing else.
 */

import type { Mark, Node as PMNode } from 'prosemirror-model';
import { chatSchema } from '$lib/editor/schema';
import { chatMessageOf, isEmoji, tidyMarks } from '$lib/project/model/changing/chat';
import type { ChatMark, ChatMarkKind, ChatWords } from '$lib/project/model/types';

/**
 * What is written in the field of the chat and not yet sent: its words and
 * marks, the message it answers, or the message of one's own it changes.
 */
export interface Written {
  words: ChatWords;
  /** The message pressed *Answer* on: what is sent answers the message that one answers, or it. */
  to?: string;
  /** The message of one's own being changed. */
  editing?: string;
  /** While a message is changed, what was being written before: it comes back when the change is kept or given up. */
  before?: { words: ChatWords; to?: string };
}

/** A field with nothing written in it. */
export const NOTHING: Written = { words: { text: '' } };

const MARK_KINDS = new Set<string>(['strong', 'em', 'underline', 'strike', 'code']);

/** The words and marks of what the field holds: its lines joined by line breaks. */
export function wordsOf(doc: PMNode): ChatWords {
  let text = '';
  const marks: ChatMark[] = [];
  doc.forEach((line, _offset, index) => {
    if (index > 0) text += '\n';
    line.forEach((inline) => {
      if (inline.isText) {
        const from = text.length;
        text += inline.text!;
        for (const mark of inline.marks)
          if (MARK_KINDS.has(mark.type.name))
            marks.push({ from, to: text.length, mark: mark.type.name as ChatMarkKind });
      } else if (inline.type.name === 'hard_break') text += '\n';
    });
  });
  const tidy = tidyMarks(marks, text.length);
  return tidy.length ? { text, marks: tidy } : { text };
}

/** What the field holds for some words and marks: a line for each line of the words. */
export function docOf(words: ChatWords): PMNode {
  const schema = chatSchema;
  const marks = words.marks ?? [];
  const lines: PMNode[] = [];
  let start = 0;
  for (const line of words.text.split('\n')) {
    const end = start + line.length;
    const cuts = new Set([start, end]);
    for (const m of marks) {
      if (m.from > start && m.from < end) cuts.add(m.from);
      if (m.to > start && m.to < end) cuts.add(m.to);
    }
    const at = [...cuts].sort((a, b) => a - b);
    const content: PMNode[] = [];
    for (let i = 0; i + 1 < at.length; i++) {
      const [from, to] = [at[i], at[i + 1]];
      if (from >= to) continue;
      const on: Mark[] = marks
        .filter((m) => m.from <= from && m.to >= to)
        .map((m) => schema.marks[m.mark].create());
      content.push(schema.text(words.text.slice(from, to), on));
    }
    lines.push(schema.nodes.line.create(null, content));
    start = end + 1;
  }
  return schema.nodes.doc.create(null, lines);
}

/** Whether two words and their marks say the same. */
export function sameWords(a: ChatWords, b: ChatWords): boolean {
  return a.text === b.text && JSON.stringify(a.marks ?? []) === JSON.stringify(b.marks ?? []);
}

/**
 * What is written as the drafts keep it: as JSON in their string, or
 * nothing where nothing is written and nothing answered or changed, so that
 * the field is dropped from the drafts.
 */
export function keptOf(written: Written): string {
  const { words, to, editing, before } = written;
  if (!words.text && !to && !editing) return '';
  return JSON.stringify({
    text: words.text,
    ...(words.marks?.length ? { marks: words.marks } : {}),
    ...(to ? { to } : {}),
    ...(editing ? { editing } : {}),
    ...(editing && before
      ? {
          before: {
            text: before.words.text,
            ...(before.words.marks?.length ? { marks: before.words.marks } : {}),
            ...(before.to ? { to: before.to } : {}),
          },
        }
      : {}),
  });
}

/** Words and marks as they were kept, read with care. */
function keptWords(value: unknown): ChatWords | null {
  const message = chatMessageOf(value);
  if (!message) return null;
  return message.marks ? { text: message.text, marks: message.marks } : { text: message.text };
}

/**
 * What was written, from the string the drafts keep: JSON, as it is kept
 * now; or the plain words an earlier version kept there.
 */
export function writtenOf(kept: string): Written {
  if (!kept) return NOTHING;
  if (kept.startsWith('{')) {
    try {
      const held: unknown = JSON.parse(kept);
      const words = keptWords(held);
      if (words) {
        const { to, editing, before } = held as Record<string, unknown>;
        const was = before && typeof before === 'object' ? keptWords(before) : null;
        const wasTo = was ? (before as Record<string, unknown>).to : undefined;
        return {
          words,
          ...(typeof to === 'string' && to ? { to } : {}),
          ...(typeof editing === 'string' && editing ? { editing } : {}),
          ...(typeof editing === 'string' && editing && was
            ? { before: { words: was, ...(typeof wasTo === 'string' && wasTo ? { to: wasTo } : {}) } }
            : {}),
        };
      }
    } catch {
      // Plain words that begin as JSON does.
    }
  }
  return { words: { text: kept } };
}

/** A stretch of a message as it is drawn: words with one set of marks, and the address it leads to, where it is a link. */
export interface Stretch {
  text: string;
  marks: ChatMarkKind[];
  href?: string;
}

/** Signs that end a sentence or a bracket after an address, and are not taken as part of it. */
const TRAILING = /[.,;:!?'")\]}»”’]+$/;

/** The addresses of the web in some words: from `http://` or `https://` to the next space. */
export function linksOf(text: string): { from: number; to: number; href: string }[] {
  const out: { from: number; to: number; href: string }[] = [];
  for (const match of text.matchAll(/https?:\/\/\S+/gi)) {
    const href = match[0].replace(TRAILING, '');
    if (!/^https?:\/\/[^/\s]/i.test(href)) continue;
    out.push({ from: match.index, to: match.index + href.length, href });
  }
  return out;
}

/**
 * The stretches a message is drawn as: its words cut wherever a mark or a
 * link begins or ends, each with the marks it is within and the address of
 * the link it is part of.
 */
export function stretches(words: ChatWords): Stretch[] {
  const { text } = words;
  const marks = words.marks ?? [];
  const links = linksOf(text);
  const cuts = new Set([0, text.length]);
  for (const m of [...marks, ...links]) {
    cuts.add(Math.max(0, Math.min(text.length, m.from)));
    cuts.add(Math.max(0, Math.min(text.length, m.to)));
  }
  const at = [...cuts].sort((a, b) => a - b);
  const out: Stretch[] = [];
  for (let i = 0; i + 1 < at.length; i++) {
    const [from, to] = [at[i], at[i + 1]];
    if (from >= to) continue;
    const on = marks.filter((m) => m.from <= from && m.to >= to).map((m) => m.mark);
    const link = links.find((l) => l.from <= from && l.to >= to);
    out.push({ text: text.slice(from, to), marks: on, ...(link ? { href: link.href } : {}) });
  }
  return out;
}

/** The most emojis a message may be of and be shown larger. */
const FEW = 3;

/** Whether a message is one to three emojis and nothing else, to be shown larger. */
export function onlyEmojis(text: string): boolean {
  const clean = text.trim();
  if (!clean || clean.length > 64) return false;
  const signs = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(clean)]
    .map((s) => s.segment)
    .filter((s) => !/^\s+$/.test(s));
  return signs.length >= 1 && signs.length <= FEW && signs.every((s) => isEmoji(s));
}
