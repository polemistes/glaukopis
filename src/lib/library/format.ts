/** Words for things of the library. */

import type { Reason, SummaryLite } from '$lib/api/library';
import { languages, t, type Args } from '$lib/i18n';

/**
 * A message one of whose variables is shown otherwise than as words, as a
 * piece of code or in bold: the words before it and after it, which the
 * language puts where they belong.
 */
export function wordsAround(id: string, variable: string, args: Args = {}): [string, string] {
  const mark = '\u{E000}';
  const said = t(id, { ...args, [variable]: mark });
  const at = said.indexOf(mark);
  return at < 0 ? [said, ''] : [said.slice(0, at), said.slice(at + mark.length)];
}

/** "Nagy 1979", "Nagy and Lord 1996", "The Oxford Classical Dictionary 2012". */
export function shortLabel(s: { authors: string; year: string; title: string }): string {
  const who =
    s.authors.replace(/ \(eds?\.\)$/, '') || truncate(s.title, 32) || t('library-untitled');
  return s.year ? `${who} ${s.year}` : who;
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  const cut = text.slice(0, length);
  const space = cut.lastIndexOf(' ');
  return (space > length * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–-]+$/, '') + '…';
}

export function reasonWords(reasons: Reason[]): string {
  const words: Record<Reason, string> = {
    doi: t('library-reason-doi'),
    isbn: t('library-reason-isbn'),
    identical: t('library-reason-identical'),
    'title-author-year': t('library-reason-title-author-year'),
    file: t('library-reason-file'),
  };
  const list = reasons.map((r) => words[r]);
  if (list.length <= 1) return list[0] ?? '';
  return t('library-reasons', {
    others: list.slice(0, -1).join(', '),
    last: list[list.length - 1],
  });
}

export function describe(s: SummaryLite): string {
  const parts = [s.authors, s.year].filter(Boolean).join(' ');
  return [parts, s.title].filter(Boolean).join(', ');
}

export function fileSize(bytes: number): string {
  // Written in the way of the language, with as many decimals as before, and not grouped.
  const size = (n: number, decimals = 0) =>
    n.toLocaleString(languages.current, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: false,
    });
  if (bytes < 1024) return t('library-size-bytes', { size: size(bytes) });
  if (bytes < 1024 * 1024)
    return t('library-size-kilobytes', { size: size(Math.round(bytes / 1024)) });
  return t('library-size-megabytes', { size: size(bytes / 1024 / 1024, 1) });
}

export function dateWords(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(languages.current, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}
