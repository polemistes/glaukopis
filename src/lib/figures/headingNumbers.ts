/**
 * The numbers of headings as the document prints them: the rule of the core
 * (`resolved_numbering`, `count_heading` and `heading_number` in
 * `crates/core/src/formats/mod.rs`), so that the list, the text view and the
 * map show the number the typesetting pane does (record 0079).
 */

import type { DocumentFormat, NumberStyle } from '$lib/api/documents';

export type Headings = DocumentFormat['headings'];

/**
 * The style of each level as it comes to be (record 0058): its own, that of
 * the level above where it says so, the first level arabic; null where it
 * is not numbered, and everywhere where the headings are not.
 */
export function resolvedNumbering(headings: Headings | undefined): (NumberStyle | null)[] {
  const levels = headings?.levels ?? [];
  if (!headings?.numbered) return levels.map(() => null);
  const out: (NumberStyle | null)[] = [];
  for (const level of levels) {
    const own = level.numbering ?? 'as-above';
    out.push(
      own === 'as-above'
        ? out.length
          ? out[out.length - 1]
          : 'arabic'
        : own === 'none'
          ? null
          : own === 'alpha'
            ? 'letters'
            : own === 'alpha-lower'
              ? 'letters-lower'
              : own,
    );
  }
  return out;
}

/** Which levels are counted on through the document (record 0078); the first never, nothing above begins it anew. */
export function throughLevels(headings: Headings | undefined): boolean[] {
  return (headings?.levels ?? []).map((l, i) => i > 0 && l.counted === 'through');
}

/** What a list says of a level (from 0); levels deeper than it says are as its last. */
const atLevel = <T>(list: T[], level: number, none: T): T =>
  list.length ? list[Math.min(level, list.length - 1)] : none;

export function countedThrough(through: boolean[], level: number): boolean {
  return atLevel(through, level, false);
}

/**
 * A heading of a level (from 0) counted: its own count goes up, and the
 * levels under it begin anew, but for those counted on through the document.
 */
export function countHeading(counts: number[], level: number, through: boolean[]) {
  counts[level] = (counts[level] ?? 0) + 1;
  for (let i = level + 1; i < counts.length; i++) if (!countedThrough(through, i)) counts[i] = 0;
}

/**
 * The number of a heading from the counts down to it, the last its own: the
 * numbers of the numbered levels from the nearest level counted on through
 * the document, in their styles, with full stops between; null where its own
 * level is not numbered.
 */
export function headingNumber(
  counts: number[],
  numbering: (NumberStyle | null)[],
  through: boolean[],
): string | null {
  const own = counts.length - 1;
  if (own < 0) return null;
  const style = (i: number) => atLevel(numbering, i, null);
  if (!style(own)) return null;
  let from = 0;
  for (let i = own; i >= 0; i--) {
    if (countedThrough(through, i)) {
      from = i;
      break;
    }
  }
  const parts: string[] = [];
  for (let i = from; i <= own; i++) {
    const s = style(i);
    if (s) parts.push(styledNumber(counts[i], s));
  }
  return parts.join('.');
}

const ROMAN: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** A number in a style: 4 as 4, IV, iv, D or d; 28 as AB. */
export function styledNumber(n: number, style: NumberStyle): string {
  switch (style) {
    case 'arabic':
      return String(n);
    case 'roman':
    case 'roman-lower': {
      let out = '';
      let left = n;
      for (const [value, numeral] of ROMAN) {
        while (left >= value) {
          out += numeral;
          left -= value;
        }
      }
      return style === 'roman' ? out : out.toLowerCase();
    }
    case 'letters':
    case 'letters-lower': {
      let out = '';
      let left = n;
      while (left > 0) {
        left -= 1;
        out = String.fromCharCode(65 + (left % 26)) + out;
        left = Math.floor(left / 26);
      }
      return style === 'letters' ? out : out.toLowerCase();
    }
  }
}
