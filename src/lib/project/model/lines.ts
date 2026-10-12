/**
 * The numbers of the lines of verse: which lines show one, and what it
 * says. The same rule is kept in Rust (`document/verse.rs`), by which the
 * documents are made; the editor and the text shown without one follow
 * this one. See ADR 0039.
 *
 * Only lines that are lines are counted: not a speaker's name, not a
 * stage direction. The count begins at the start of the verse, where one
 * is given, or at the first line that was given a number by hand. A number
 * given by hand ("1234", "567a", "1094a1") is shown on its line, and the
 * count goes on from its last run of digits: after "1234" comes 1235,
 * after "1094a1" comes "1094a2", and after "567a" comes 568. One without
 * digits is shown and leaves the count as it was. A line that is not
 * counted shows only what was given it by hand. Of the others, those whose
 * number can be divided by `by` show it, and so does the first line of a
 * verse numbered from its start.
 */

/** What the count needs of a line. */
export interface CountedLine {
  kind: string;
  /** The number or label given by hand, if any. */
  number?: string | null;
  /** False for a line that is not counted. */
  counted?: boolean;
}

/** The number a line shows, and whether it was given by hand. */
export interface Shown {
  label: string;
  set: boolean;
}

/** The count as it stands: what the next line counted is, and what comes before its digits. */
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

/** What each line shows in the margin: its number, or nothing. */
export function lineNumbers(
  start: number | null,
  by: number,
  lines: readonly CountedLine[],
): (Shown | null)[] {
  const every = Math.max(1, Math.round(by) || 5);
  let count: Count | null = start === null ? null : { prefix: '', next: start, width: 0 };
  let first = start !== null;
  return lines.map((line) => {
    if (line.kind !== 'line') return null;
    const given = (line.number ?? '').trim();
    if (line.counted === false) return given ? { label: given, set: true } : null;
    if (given) {
      const read = readLabel(given);
      if (read) count = { prefix: read.prefix, next: read.n + 1, width: read.width };
      first = false;
      return { label: given, set: true };
    }
    if (!count) return null;
    const n = count.next++;
    const shown = first || n % every === 0;
    first = false;
    return shown ? { label: written(count, n), set: false } : null;
  });
}
