/**
 * The numbers of the lines of a numbered stretch: which show one, and what
 * it says; and the lines and stretches of a text. The same rule is kept in
 * Rust (`document/numbers.rs`), by which the documents are made; the editor
 * and the text shown without one follow this one. See ADR 0039 and 0041.
 *
 * A text is paragraphs, and a paragraph is lines, parted by line breaks.
 * A stretch is consecutive paragraphs with the same numbering settings,
 * whatever their kinds; its lines are numbered together. A line is counted
 * when its paragraph's kind is counted, the stretch counts every kind or
 * that one (`only`), its mark does not say otherwise, and it holds
 * something to read; an empty line, as between two stanzas, never is. A
 * stretch that is *counted* begins its count at the first counted line
 * that was given a number by hand, and the count goes on from the last run
 * of digits of a number given: after "1234" comes 1235, after "1094a1"
 * comes "1094a2", and after "11b" comes 12. One without digits leaves the
 * count as it was.
 *
 * Which numbers stand on the page: a counted line's, where its number can
 * be divided by `every`; a number given by hand the same, so that a count
 * from 1 or 41 every 5 shows 5 or 45 first; but a label that holds
 * anything but digits ("567a", "11b", "§5", "*") always, since no count
 * can make it, and so does what was given a line that is not counted, or
 * a line in a stretch whose numbering is *given*, which shows only the
 * numbers given by hand and counts nothing. A line marked `shown` always
 * shows its number, one marked `hidden` never. A number given that does
 * not stand on the page is still said (`printed: false`), so that the
 * editor can show it while the pointer rests on its paragraph. A stretch numbered *not at all* shows
 * nothing.
 */

import { countedKind, type BasedKind, type Numbering, type Side } from './families';
import type { Block, Inline, InlineLineMark, ParagraphBlock } from './text';

/** What the count needs of a line. */
export interface CountedLine {
  /** Whether the count takes it in: its kind is counted, and the writer did not say otherwise. */
  counted: boolean;
  /** The number or label given by hand, if any. */
  number?: string | null;
  /** Whether the writer said its number is always shown. */
  shown?: boolean;
}

/**
 * The number a line has, whether it was given by hand, and whether it
 * stands on the page; one given by hand that does not is shown only where
 * one writes.
 */
export interface Shown {
  label: string;
  set: boolean;
  printed: boolean;
}

/** The count as it stands: what the next paragraph counted is, and what comes before its digits. */
interface Count {
  prefix: string;
  next: number;
  /** How many digits, where they began with a nought: "0567". */
  width: number;
}

/** A number given by hand, read for the count: what is before its last run of digits, and that run. */
export function readLabel(label: string): { prefix: string; n: number; width: number } | null {
  const found = /^(.*?)(\d+)\D*$/.exec(label);
  if (!found) return null;
  const digits = found[2];
  const n = Number(digits);
  if (!Number.isSafeInteger(n)) return null;
  return { prefix: found[1], n, width: digits.length > 1 && digits[0] === '0' ? digits.length : 0 };
}

function written(count: Count, n: number): string {
  const digits = String(Math.abs(n)).padStart(count.width, '0');
  return `${count.prefix}${n < 0 ? '-' : ''}${digits}`;
}

/** Whether a number given by hand is more than digits: a label, which no count could make, and which is always shown. */
export const isLabel = (given: string): boolean => /\D/.test(given);

/**
 * What each line shows in the margin: its number, or nothing. `every` is
 * the stretch's, or the layout's. See the head of this file for which
 * numbers stand on the page.
 */
export function lineNumbers(
  numbering: Numbering,
  every: number,
  lines: readonly CountedLine[],
): (Shown | null)[] {
  if (numbering === 'none') return lines.map(() => null);
  const step = Math.max(1, Math.round(every) || 1);
  let count: Count | null = null;
  return lines.map((line) => {
    const given = (line.number ?? '').trim();
    if (numbering === 'given' || !line.counted)
      return given ? { label: given, set: true, printed: true } : null;
    if (given) {
      const read = readLabel(given);
      if (read) count = { prefix: read.prefix, next: read.n + 1, width: read.width };
      const printed = !!line.shown || isLabel(given) || !read || read.n % step === 0;
      return { label: given, set: true, printed };
    }
    if (!count) return null;
    const n = count.next++;
    return n % step === 0 || line.shown
      ? { label: written(count, n), set: false, printed: true }
      : null;
  });
}

// ---- the lines of a paragraph, and the stretches of a text ----

/** A line of a paragraph: the mark that begins it, if any, what stands in it after the mark, and whether it holds nothing to read. */
export interface Line {
  mark: InlineLineMark | null;
  content: Inline[];
  blank: boolean;
}

/** Whether inline content holds nothing to read: no words, or only spaces and marks of lines. */
function blankOf(content: Inline[]): boolean {
  return content.every((i) =>
    i.kind === 'text' ? !i.text.trim() : i.kind === 'linemark' || i.kind === 'break',
  );
}

/** The lines of a paragraph's content, parted by its line breaks; a paragraph without one is one line, and an empty paragraph one blank line. */
export function linesOf(content: Inline[]): Line[] {
  const out: Line[] = [];
  let line: Inline[] = [];
  const close = () => {
    const mark = line[0]?.kind === 'linemark' ? line[0] : null;
    const rest = mark ? line.slice(1) : line;
    out.push({ mark, content: rest, blank: blankOf(rest) });
    line = [];
  };
  for (const i of content) {
    if (i.kind === 'break') close();
    else line.push(i);
  }
  close();
  return out;
}

/** A stretch of a text: the indices of its paragraphs among the blocks given, from and to (not included), and its settings. */
export interface Stretch {
  from: number;
  to: number;
  numbering: Numbering;
  every: number | null;
  side: Side | null;
  /** The one kind whose lines are counted; nothing for every kind that is counted. */
  only: string | null;
}

/** The numbering of a paragraph, as its settings say; `none` where it says nothing. */
const numberingOf = (p: ParagraphBlock): Numbering => p.numbering ?? 'none';

/**
 * The numbered stretches of a text, in order: runs of consecutive
 * paragraphs whose numbering is not *none* and whose settings are the same.
 * Anything that is not a paragraph ends a stretch.
 */
export function stretches(blocks: readonly Block[]): Stretch[] {
  const out: Stretch[] = [];
  let at: Stretch | null = null;
  blocks.forEach((b, i) => {
    if (b.kind !== 'paragraph' || numberingOf(b) === 'none') {
      at = null;
      return;
    }
    const every = b.every ?? null;
    const side = b.side ?? null;
    const only = b.only ?? null;
    if (
      at &&
      at.to === i &&
      at.numbering === numberingOf(b) &&
      at.every === every &&
      at.side === side &&
      at.only === only
    ) {
      at.to = i + 1;
      return;
    }
    at = { from: i, to: i + 1, numbering: numberingOf(b), every, side, only };
    out.push(at);
  });
  return out;
}

/**
 * What each line of a stretch shows, paragraph by paragraph and line by
 * line: the paragraphs of the stretch, how it is numbered, every how many
 * (the stretch's, else the layout's), the kinds of the writer's own, for
 * which kinds are counted, and the one kind the stretch counts, where it
 * counts one. A line marked hidden shows nothing.
 */
export function stretchNumbers(
  paragraphs: readonly ParagraphBlock[],
  numbering: Numbering,
  every: number,
  own: readonly BasedKind[] = [],
  only: string | null = null,
): (Shown | null)[][] {
  const lines = paragraphs.map((p) => linesOf(p.content));
  const counted = countedFlags(paragraphs, lines, own, only);
  const flat = lineNumbers(numbering, every, counted);
  const out: (Shown | null)[][] = [];
  let at = 0;
  for (const ls of lines) {
    out.push(
      ls.map((l) => {
        const shown = flat[at++];
        return l.mark?.hidden ? null : shown;
      }),
    );
  }
  return out;
}

/**
 * Whether the lines of a kind are counted in a stretch: the kind is one
 * that is counted, and the stretch counts every kind, or that one.
 */
export function countedIn(name: string, own: readonly BasedKind[], only: string | null): boolean {
  return countedKind(name, own) && (!only || name === only);
}

/** What the count needs of every line of the paragraphs given, in order. */
function countedFlags(
  paragraphs: readonly ParagraphBlock[],
  lines: Line[][],
  own: readonly BasedKind[],
  only: string | null,
): CountedLine[] {
  const out: CountedLine[] = [];
  paragraphs.forEach((p, i) => {
    const kindCounted = countedIn(p.name, own, only);
    for (const l of lines[i])
      out.push({
        counted: kindCounted && l.mark?.counted !== false && !l.blank,
        number: l.mark?.number ?? null,
        shown: l.mark?.shown === true,
      });
  });
  return out;
}
