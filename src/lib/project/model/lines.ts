/**
 * The numbers of the lines of a numbered stretch: which show one, and what
 * it says; and the lines and stretches of a text. The same rule is kept in
 * Rust (`document/numbers.rs`), by which the documents are made; the editor
 * and the text shown without one follow this one. See ADR 0039 and 0041.
 *
 * A text is paragraphs, and a paragraph is lines, parted by line breaks.
 * A stretch is consecutive paragraphs with the same numbering settings,
 * whatever their kinds; its lines are numbered together. A line is counted
 * when its paragraph's kind is counted, its mark does not say otherwise,
 * and it holds something to read; an empty line, as between two stanzas,
 * never is. A stretch that is *counted* begins its count at the first
 * counted line that was given a number by hand. A number given by hand
 * ("1234", "567a", "1094a1") is shown on its line, and the count goes on
 * from its last run of digits: after "1234" comes 1235, after "1094a1"
 * comes "1094a2", and after "567a" comes 568. One without digits is shown
 * and leaves the count as it was. A line that is not counted shows only
 * what was given it by hand. Of the others, those whose number can be
 * divided by `every` show it. A line marked hidden is counted and shows
 * nothing. A stretch whose numbering is *given* shows only the numbers
 * given by hand, and counts nothing; one numbered *not at all* shows
 * nothing.
 */

import { countedKind, type BasedKind, type Numbering, type Side } from './families';
import type { Block, Inline, InlineLineMark, ParagraphBlock } from './text';

/** What the count needs of a paragraph. */
export interface CountedLine {
  /** Whether the count takes it in: its kind is counted, and the writer did not say otherwise. */
  counted: boolean;
  /** The number or label given by hand, if any. */
  number?: string | null;
}

/** The number a paragraph shows, and whether it was given by hand. */
export interface Shown {
  label: string;
  set: boolean;
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

/** What each paragraph shows in the margin: its number, or nothing. `every` is the passage's, or the layout's. */
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
    if (numbering === 'given' || !line.counted) return given ? { label: given, set: true } : null;
    if (given) {
      const read = readLabel(given);
      if (read) count = { prefix: read.prefix, next: read.n + 1, width: read.width };
      return { label: given, set: true };
    }
    if (!count) return null;
    const n = count.next++;
    return n % step === 0 ? { label: written(count, n), set: false } : null;
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
    if (
      at &&
      at.to === i &&
      at.numbering === numberingOf(b) &&
      at.every === every &&
      at.side === side
    ) {
      at.to = i + 1;
      return;
    }
    at = { from: i, to: i + 1, numbering: numberingOf(b), every, side };
    out.push(at);
  });
  return out;
}

/**
 * What each line of a stretch shows, paragraph by paragraph and line by
 * line: the paragraphs of the stretch, how it is numbered, every how many
 * (the stretch's, else the layout's), and the kinds of the writer's own, for
 * which kinds are counted.
 */
export function stretchNumbers(
  paragraphs: readonly ParagraphBlock[],
  numbering: Numbering,
  every: number,
  own: readonly BasedKind[] = [],
): (Shown | null)[][] {
  const lines = paragraphs.map((p) => linesOf(p.content));
  const counted = countedFlags(paragraphs, lines, own);
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

/** What the count needs of every line of the paragraphs given, in order. */
function countedFlags(
  paragraphs: readonly ParagraphBlock[],
  lines: Line[][],
  own: readonly BasedKind[],
): CountedLine[] {
  const out: CountedLine[] = [];
  paragraphs.forEach((p, i) => {
    const kindCounted = countedKind(p.name, own);
    for (const l of lines[i])
      out.push({
        counted: kindCounted && l.mark?.counted !== false && !l.blank,
        number: l.mark?.number ?? null,
      });
  });
  return out;
}
