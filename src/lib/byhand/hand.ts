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

/**
 * The ground of words (ADR 0116): the colour behind them, a highlight. A
 * mark with one value as those set by hand are, but of every text and not
 * of a box alone: it is not among `HAND_MARKS`, which are taken away
 * outside a box.
 */
export const GROUND = 'ground';

/** The marks that are kept with one value each: those set by hand, and the ground. */
export const VALUED_MARKS = [...HAND_MARKS, GROUND] as const;
export type ValuedMark = (typeof VALUED_MARKS)[number];

export const isValuedMark = (name: string): name is ValuedMark =>
  (VALUED_MARKS as readonly string[]).includes(name);

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

/** The attributes of a mark set by hand, or of the ground, as the schema keeps them; nothing where what was given says nothing. */
export function handMarkAttrs(name: ValuedMark, value: unknown): Record<string, unknown> | null {
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

/** A heading in rich text: how many levels under the element its text is of. */
export type HandHeading = 1 | 2;

/** How a paragraph stands across the line. */
export type HandAlign = 'left' | 'center' | 'right' | 'justified';

/**
 * How a paragraph stands, set by hand: laid over what the layout gives its
 * kind. Lengths are written with their unit (`12pt`, `1cm`); line spacing
 * is a number, 1 for single. What is not said is the layout's.
 */
export interface HandLook {
  /**
   * A heading that is no element (ADR 0115): the paragraph is set as the
   * layout sets the headings one level under the element the text is of
   * (1), or two (2), and what else is said here is laid over that.
   */
  heading?: HandHeading;
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
  const heading = typeof given.heading === 'string' ? Number(given.heading) : given.heading;
  if (heading === 1 || heading === 2) look.heading = heading;
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

/* ---- As it is drawn where a text is written and where it is shown ---- */

/**
 * A point of the document where a text is drawn: the size of the text
 * there over the document's size of type, so that lengths are drawn in
 * proportion, as the sizes of letters are.
 */
const POINT = 'calc(var(--text-size, 17px) / var(--hand-base, 11))';

/** A length of so many points of the document, as a style sheet has it where a text is drawn. */
export const drawnLength = (points: number) => `calc(${POINT} * ${Math.round(points * 100) / 100})`;

/** A font, a size in points and a colour of words, as the style of what holds them. */
export const fontStyle = (family: string) => `font-family: "${family}"`;
export const sizeStyle = (pt: number) =>
  `font-size: calc(var(--text-size, 17px) * ${pt} / var(--hand-base, 11))`;
export const colourStyle = (value: string) => `color: ${value}`;
/** The ground of words: the colour is said, and the style sheet draws it (`app.css`), fainter where it is only for the eye. */
export const groundStyle = (value: string) => `--ground: ${value}`;

/**
 * How a paragraph that stands by hand is drawn, as the style of the
 * paragraph. Single spacing is that of the document, which the text says
 * where it is of one (`--hand-single`, see `sheet.ts`); else the line of
 * the editor's own text. The space before and after is added to what the
 * paragraph has between it and the next. Centred, set to the right or set
 * in, its first line begins with the rest unless it was said where it
 * begins: as the document sets it. A heading (ADR 0115) is drawn by the
 * style sheet, by its level; here it begins with the rest too.
 */
export function handStyle(hand: HandLook | null): string {
  if (!hand) return '';
  const length = (value: string) => drawnLength(pointsOf(value));
  // Added to what stands between paragraphs; a space taken away is taken from it.
  const space = (side: 'top' | 'bottom', value: string) =>
    `${pointsOf(value) < 0 ? 'margin' : 'padding'}-${side}: ${length(value)}`;
  const said: string[] = [];
  if (hand.align) said.push(`text-align: ${hand.align === 'justified' ? 'justify' : hand.align}`);
  if (hand.lineSpacing)
    said.push(
      `line-height: calc(var(--hand-single, 1.62) * ${Math.round(hand.lineSpacing * 100) / 100})`,
    );
  if (hand.spaceBefore) said.push(space('top', hand.spaceBefore));
  if (hand.spaceAfter) said.push(space('bottom', hand.spaceAfter));
  if (hand.indentLeft) said.push(`margin-left: ${length(hand.indentLeft)}`);
  if (hand.indentRight) said.push(`margin-right: ${length(hand.indentRight)}`);
  if (hand.firstLine) said.push(`text-indent: ${length(hand.firstLine)}`);
  else if (
    hand.heading ||
    hand.indentLeft ||
    hand.indentRight ||
    hand.align === 'center' ||
    hand.align === 'right'
  )
    said.push('text-indent: 0');
  // The room about a heading is its own, all of it (`sheet.ts`): none of what stands between paragraphs.
  if (hand.heading && !(hand.spaceBefore && pointsOf(hand.spaceBefore) < 0))
    said.push('margin-top: 0');
  return said.join('; ');
}
