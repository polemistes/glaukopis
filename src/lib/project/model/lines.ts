/**
 * The numbers of the paragraphs of a numbered passage: which show one, and
 * what it says. The same rule is kept in Rust (`document/numbers.rs`), by
 * which the documents are made; the editor and the text shown without one
 * follow this one. See ADR 0039 and 0040.
 *
 * A passage that is *counted* counts its counted paragraphs — those whose
 * kind is counted, less those the writer said are not — and the count
 * begins at the first of them that was given a number by hand. A number
 * given by hand ("1234", "567a", "1094a1") is shown on its paragraph, and
 * the count goes on from its last run of digits: after "1234" comes 1235,
 * after "1094a1" comes "1094a2", and after "567a" comes 568. One without
 * digits is shown and leaves the count as it was. A paragraph that is not
 * counted shows only what was given it by hand. Of the others, those whose
 * number can be divided by `every` show it. A passage whose numbering is
 * *given* shows only the numbers given by hand, and counts nothing; one
 * numbered *not at all* shows nothing.
 */

import type { Numbering } from './families';

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
