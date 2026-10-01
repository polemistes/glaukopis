/**
 * A time as it is written and as it is counted. An element says when it is
 * in words — `431 BC`, `c. 480 BCE`, `May 1453`, `1453-05-29`, `5th century
 * BC`, `Year 12`, `Day 3` — and a timeline needs a number on one axis for
 * it. A time is read as a span of what it may be: a year is the whole year,
 * a century the whole century, so that imprecision is drawn, not hidden.
 *
 * Two axes: **dates**, counted in years with astronomical numbering (1 BC is
 * 0, 2 BC is -1), on which a date is a fraction of a year; and **units** of
 * an invented world, counted in whatever the timeline calls them, on which
 * a time is a number.
 */

export type Axis = 'dates' | 'units';

export interface Time {
  /** The text as it was written. */
  text: string;
  /** The earliest and the latest the time may be, on the axis; the latest excluded. */
  from: number;
  to: number;
  /** What the words said: `c.`, `ca.`, `about`, `~`. */
  approx: boolean;
}

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];
const MONTHS_NB = [
  'januar',
  'februar',
  'mars',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'desember',
];

/** The days before each month begins, in a year of 365 days. */
const BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

function monthNumber(word: string): number | null {
  const w = word.toLowerCase().replace(/\.$/, '');
  for (const names of [MONTHS, MONTHS_NB]) {
    const i = names.findIndex((m) => m === w || (w.length >= 3 && m.startsWith(w)));
    if (i >= 0) return i + 1;
  }
  return null;
}

/** A year as it is counted: 1 BC is 0. */
function yearNumber(year: number, bc: boolean): number {
  return bc ? 1 - year : year;
}

/** The fraction of a year a day stands at. */
function dayFraction(month: number, day: number): number {
  return (BEFORE_MONTH[month - 1] + day - 1) / 365;
}

const APPROX = /^(?:c\.?|ca\.?|circa|about|around|~|omkring|rundt|ca)\s*/i;
const BC = /\s*(?:bc|bce|b\.c\.|b\.c\.e\.|f\.?kr\.?|fvt\.?)\.?$/i;
const AD = /\s*(?:ad|ce|a\.d\.|c\.e\.|e\.?kr\.?|evt\.?)\.?$/i;
const AD_FIRST = /^(?:ad|a\.d\.)\s+/i;

/**
 * Reads a time written in words, on an axis; nothing where it cannot be
 * read. On the axis of dates a bare number is a year.
 */
export function readTime(written: string, axis: Axis): Time | null {
  let text = written.trim();
  if (!text) return null;
  let approx = false;
  const m = APPROX.exec(text);
  if (m) {
    approx = true;
    text = text.slice(m[0].length).trim();
  }
  const made = (from: number, to: number): Time => ({ text: written.trim(), from, to, approx });

  if (axis === 'units') {
    // `Year 12`, `Day 3`, `12`, `-4`, `12.5`: the number is what counts.
    const n = /^(?:[\p{L}.]+\s+)?(-?\d+(?:[.,]\d+)?)(?:\s+[\p{L}.]+)?$/u.exec(text);
    if (!n) return null;
    const value = Number(n[1].replace(',', '.'));
    if (!Number.isFinite(value)) return null;
    return made(value, value + 1);
  }

  let bc = false;
  if (BC.test(text)) {
    bc = true;
    text = text.replace(BC, '').trim();
  } else if (AD.test(text)) {
    text = text.replace(AD, '').trim();
  } else if (AD_FIRST.test(text)) {
    text = text.replace(AD_FIRST, '').trim();
  }

  // 1453-05-29, 1453-05, 29.5.1453, 29/5/1453.
  let d = /^(-?\d{1,5})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(text);
  if (d) {
    const year = yearNumber(Number(d[1]), bc);
    const month = Number(d[2]);
    const day = d[3] ? Number(d[3]) : null;
    if (month < 1 || month > 12 || (day !== null && (day < 1 || day > 31))) return null;
    return day === null
      ? made(year + dayFraction(month, 1), year + (month === 12 ? 1 : dayFraction(month + 1, 1)))
      : made(year + dayFraction(month, day), year + dayFraction(month, day) + 1 / 365);
  }
  d = /^(\d{1,2})[./](\d{1,2})[./](-?\d{1,5})$/.exec(text);
  if (d) {
    const year = yearNumber(Number(d[3]), bc);
    const month = Number(d[2]);
    const day = Number(d[1]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return made(year + dayFraction(month, day), year + dayFraction(month, day) + 1 / 365);
  }

  // 29 May 1453, May 29, 1453, May 1453.
  d = /^(?:(\d{1,2})\.?\s+)?([\p{L}.]+)\s+(?:(\d{1,2}),?\s+)?(-?\d{1,5})$/u.exec(text);
  if (d && monthNumber(d[2]) !== null) {
    const month = monthNumber(d[2])!;
    const year = yearNumber(Number(d[4]), bc);
    const day = d[1] ? Number(d[1]) : d[3] ? Number(d[3]) : null;
    if (day !== null && (day < 1 || day > 31)) return null;
    return day === null
      ? made(year + dayFraction(month, 1), year + (month === 12 ? 1 : dayFraction(month + 1, 1)))
      : made(year + dayFraction(month, day), year + dayFraction(month, day) + 1 / 365);
  }

  // 5th century, 12. århundre, the 1920s, 1920s.
  d = /^(?:the\s+)?(\d{1,2})(?:st|nd|rd|th|\.)?\s+(?:century|c\.|århundre|hundreår)$/i.exec(text);
  if (d) {
    const n = Number(d[1]);
    // The fifth century BC is 500 to 401 BC; the fifth century AD is 401 to 500.
    return bc
      ? made(yearNumber(n * 100, true), yearNumber(n * 100 - 100, true))
      : made(n * 100 - 99, n * 100 + 1);
  }
  d = /^(?:the\s+)?(\d{1,4}0)(?:s|-tallet|-årene|-åra)$/i.exec(text);
  if (d) {
    const n = Number(d[1]);
    // The 1920s are ten years; the 1900s, written so, a hundred.
    const span = /00$/.test(d[1]) ? 100 : 10;
    return bc ? made(yearNumber(n + span - 1, true), yearNumber(n - 1, true)) : made(n, n + span);
  }

  // A year.
  d = /^(-?\d{1,5})$/.exec(text);
  if (d) {
    const n = Number(d[1]);
    const year = bc ? yearNumber(n, true) : n;
    return made(year, year + 1);
  }
  return null;
}

/** Whether the text can be read on the axis. */
export function isTime(written: string, axis: Axis): boolean {
  return readTime(written, axis) !== null;
}

/** The lengths of time a margin may be written in, and what each is in years. */
const LENGTHS: [RegExp, number][] = [
  [/^(?:years?|yrs?|y|år)$/i, 1],
  [/^(?:decades?|tiår)$/i, 10],
  [/^(?:centuries|century|c|århundrer?|hundreår)$/i, 100],
  [/^(?:months?|mo|måneder?|månader|mnd)$/i, 1 / 12],
  [/^(?:weeks?|wks?|uker?|veker?)$/i, 7 / 365],
  [/^(?:days?|d|dager?|dagar)$/i, 1 / 365],
];

/**
 * A length of time, as a margin either side of a time is written: `5
 * years`, `3 months`, `10 days`, a bare number of years; on the axis of
 * units a number, with or without the unit's name. A sign of plus and
 * minus before it is allowed. Nothing where it cannot be read.
 */
export function readDuration(written: string, axis: Axis): number | null {
  const text = written
    .trim()
    .replace(/^(?:±|\+\/-|\+-|-\/\+)\s*/, '')
    .trim();
  if (!text) return null;
  const m = /^(\d+(?:[.,]\d+)?)\s*([\p{L}.]*)$/u.exec(text);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return null;
  const word = m[2].replace(/\.$/, '');
  if (axis === 'units' || !word) return n;
  const length = LENGTHS.find(([re]) => re.test(word));
  return length ? n * length[1] : null;
}

/** A year as it is written on the axis of dates: 0 is 1 BC. */
export function writeYear(value: number, bcWord = 'BC'): string {
  const year = Math.floor(value);
  return year <= 0 ? `${1 - year} ${bcWord}` : String(year);
}

/** How finely a written time is given: the grain a dragged time keeps. */
export type Precision = 'day' | 'month' | 'year' | 'decade' | 'century' | 'unit';

/** The precision of a written time, from how long what was written is; nothing where it cannot be read. */
export function precisionOf(written: string, axis: Axis): Precision | null {
  const time = readTime(written, axis);
  if (!time) return null;
  if (axis === 'units') return 'unit';
  const length = time.to - time.from;
  if (length < 2 / 365) return 'day';
  if (length < 0.5) return 'month';
  if (length < 5) return 'year';
  if (length < 50) return 'decade';
  return 'century';
}

/** A value on the axis moved to the nearest time of a precision: the start of a day, a month, a year, a decade, a century. */
export function snap(value: number, precision: Precision): number {
  switch (precision) {
    case 'day':
      return Math.round(value * 365) / 365;
    case 'month': {
      // To the start of the nearest month, as months are read: by their days.
      const year = Math.floor(value + 1e-9);
      const fraction = value - year;
      let best = 1;
      for (let month = 1; month <= 12; month++) {
        if (
          Math.abs(BEFORE_MONTH[month - 1] / 365 - fraction) <
          Math.abs(BEFORE_MONTH[best - 1] / 365 - fraction)
        )
          best = month;
      }
      if (1 - fraction < Math.abs(BEFORE_MONTH[best - 1] / 365 - fraction)) return year + 1;
      return year + BEFORE_MONTH[best - 1] / 365;
    }
    case 'decade':
      return Math.round(value / 10) * 10;
    case 'century':
      return Math.round(value / 100) * 100;
    default:
      return Math.round(value);
  }
}

/** The ordinal of a number in English: 1st, 2nd, 3rd, 4th, 11th. */
function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  const last = n % 10;
  return `${n}${last === 1 ? 'st' : last === 2 ? 'nd' : last === 3 ? 'rd' : 'th'}`;
}

/** The month and the day a fraction of a year stands at, in a year of 365 days. */
function dayOfYear(fraction: number): { month: number; day: number } {
  const days = Math.min(364, Math.max(0, Math.round(fraction * 365)));
  let month = 12;
  while (month > 1 && BEFORE_MONTH[month - 1] > days) month--;
  return { month, day: days - BEFORE_MONTH[month - 1] + 1 };
}

/**
 * A time written anew at a value of the axis, as finely as it was written
 * before (`like`), in the way it was written: with the sign of BC that was
 * used, and the word of the unit that stood with the number.
 */
export function writeTime(value: number, precision: Precision, axis: Axis, like = ''): string {
  if (axis === 'units') {
    const n = Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
    // "Year 12" keeps its word; "12" stays a number.
    const m = /^([\p{L}.]+\s+)?-?\d+(?:[.,]\d+)?(\s+[\p{L}.]+)?$/u.exec(like.trim());
    return `${m?.[1] ?? ''}${n}${m?.[2] ?? ''}`;
  }
  const year = Math.floor(value + 1e-9);
  const bc = year <= 0;
  const bcWord = (BC.exec(like.trim())?.[0] ?? ' BC').trim();
  const era = bc ? ` ${bcWord}` : '';
  const written = bc ? 1 - year : year;
  const two = (n: number) => String(n).padStart(2, '0');
  switch (precision) {
    case 'day': {
      const { month, day } = dayOfYear(value - year);
      return `${written}-${two(month)}-${two(day)}${era}`;
    }
    case 'month': {
      const { month } = dayOfYear(value - year);
      return `${written}-${two(month)}${era}`;
    }
    case 'decade': {
      // The 1920s begin at 1920; the 420s BC at 429 BC, which is -428 on the axis.
      const start = bc ? Math.floor((1 - year) / 10) * 10 : Math.floor(year / 10) * 10;
      return `${start}s${era}`;
    }
    case 'century': {
      // The fifth century BC is 500 to 401 BC; the fifth century AD 401 to 500.
      const n = bc ? Math.ceil((1 - year) / 100) : Math.ceil(year / 100);
      return `${ordinal(Math.max(1, n))} century${era}`;
    }
    default:
      return `${written}${era}`;
  }
}
