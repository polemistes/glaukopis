/**
 * What is set by hand in a box of rich text (ADR 0113), as it is kept: of
 * words, their font, their size and their colour, each a mark of its own;
 * of a paragraph, how it stands, in the measures a look has. What is read
 * of either, from the document, from Org or from what is pasted, is read
 * through these, which let nothing through that is not one of them.
 *
 * It takes nothing from the rest of the interface, so that whatever reads a
 * text may use it.
 */

/** The marks of words that are set by hand, and live only in a box. */
export const HAND_MARKS = ['font', 'size', 'colour'] as const;
export type HandMark = (typeof HAND_MARKS)[number];

export const isHandMark = (name: string): name is HandMark =>
  (HAND_MARKS as readonly string[]).includes(name);

/** The smallest and the largest size of letters, in points. */
export const SMALLEST = 4;
export const LARGEST = 400;

/**
 * The name of a font as it is kept: as it was given, without what a name
 * of a font does not hold and a style sheet or a typesetter could read as
 * something else; nothing where nothing is left.
 */
export function fontOf(value: unknown): string | null {
  const given =
    typeof value === 'object' && value !== null ? (value as { family?: unknown }).family : value;
  if (typeof given !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const name = given
    .replace(/[\u0000-\u001f\u007f"'\\{}<>;]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return name && name.length <= 100 ? name : null;
}

/** A size in points as it is kept: to the half point, within what letters can be; nothing where it is no size. */
export function sizeOf(value: unknown): number | null {
  const given =
    typeof value === 'object' && value !== null ? (value as { pt?: unknown }).pt : value;
  const pt = typeof given === 'string' && given.trim() ? Number(given) : given;
  if (typeof pt !== 'number' || !Number.isFinite(pt)) return null;
  const rounded = Math.round(pt * 2) / 2;
  return rounded >= SMALLEST && rounded <= LARGEST ? rounded : null;
}

/** A colour as it is kept: `#rrggbb` in small letters; nothing where it is no such colour. */
export function colourOf(value: unknown): string | null {
  const given =
    typeof value === 'object' && value !== null ? (value as { value?: unknown }).value : value;
  if (typeof given !== 'string') return null;
  const hex = given.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(hex)) return hex;
  // The short form, as it is often written by hand.
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(hex);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : null;
}

/** The attributes of a mark set by hand as the schema keeps them; nothing where what was given says nothing. */
export function handMarkAttrs(name: HandMark, value: unknown): Record<string, unknown> | null {
  if (name === 'font') {
    const family = fontOf(value);
    return family ? { family } : null;
  }
  if (name === 'size') {
    const pt = sizeOf(value);
    return pt === null ? null : { pt };
  }
  const colour = colourOf(value);
  return colour ? { value: colour } : null;
}

/** How a paragraph stands across the line. */
export type HandAlign = 'left' | 'center' | 'right' | 'justified';

/**
 * How a paragraph stands, set by hand: laid over what the layout gives its
 * kind. Lengths are written with their unit (`12pt`, `1cm`); line spacing
 * is a number, 1 for single. What is not said is the layout's.
 */
export interface HandLook {
  align?: HandAlign;
  lineSpacing?: number;
  spaceBefore?: string;
  spaceAfter?: string;
  indentLeft?: string;
  indentRight?: string;
  firstLine?: string;
}

/** The lengths of a look set by hand, in the order they are written. */
export const HAND_LENGTHS = [
  'spaceBefore',
  'spaceAfter',
  'indentLeft',
  'indentRight',
  'firstLine',
] as const;

const ALIGNS: readonly string[] = ['left', 'center', 'right', 'justified'];

/** A length as it is kept: a number and a unit, with no space between; nothing where it is none. */
export function lengthOf(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = /^(-?\d+(?:\.\d+)?)\s*(pt|mm|cm|in)$/.exec(value.trim().toLowerCase());
  if (!m) return null;
  const number = Number(m[1]);
  return Number.isFinite(number) && Math.abs(number) <= 1000 ? `${number}${m[2]}` : null;
}

/** A length in points. */
export function pointsOf(length: string): number {
  const m = /^(-?\d+(?:\.\d+)?)(pt|mm|cm|in)$/.exec(length);
  if (!m) return 0;
  const per = { pt: 1, mm: 72 / 25.4, cm: 72 / 2.54, in: 72 }[m[2] as 'pt' | 'mm' | 'cm' | 'in'];
  return Number(m[1]) * per;
}

/** How a paragraph stands by hand, as it is kept: only what is said, and said well; nothing where nothing is. */
export function handOf(value: unknown): HandLook | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const given = value as Record<string, unknown>;
  const look: HandLook = {};
  if (typeof given.align === 'string' && ALIGNS.includes(given.align))
    look.align = given.align as HandAlign;
  const spacing =
    typeof given.lineSpacing === 'string' ? Number(given.lineSpacing) : given.lineSpacing;
  if (typeof spacing === 'number' && Number.isFinite(spacing) && spacing >= 0.5 && spacing <= 5)
    look.lineSpacing = Math.round(spacing * 100) / 100;
  for (const key of HAND_LENGTHS) {
    const length = lengthOf(given[key]);
    if (length !== null) look[key] = length;
  }
  return Object.keys(look).length ? look : null;
}

/** Whether two looks set by hand say the same. */
export function sameHand(a: HandLook | null | undefined, b: HandLook | null | undefined): boolean {
  const one = handOf(a) ?? {};
  const other = handOf(b) ?? {};
  const keys = new Set([...Object.keys(one), ...Object.keys(other)]) as Set<keyof HandLook>;
  for (const key of keys) if (one[key] !== other[key]) return false;
  return true;
}
