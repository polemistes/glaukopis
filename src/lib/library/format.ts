/** Words for things of the library. */

import type { Reason, SummaryLite } from '$lib/api/library';

/** "Nagy 1979", "Nagy and Lord 1996", "The Oxford Classical Dictionary 2012". */
export function shortLabel(s: { authors: string; year: string; title: string }): string {
  const who = s.authors.replace(/ \(eds?\.\)$/, '') || truncate(s.title, 32) || 'Untitled';
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
    doi: 'the same DOI',
    isbn: 'the same ISBN',
    identical: 'alike in all that tells one work from another',
    'title-author-year': 'the same title, author and year',
    file: 'the same file',
  };
  const list = reasons.map((r) => words[r]);
  if (list.length <= 1) return list[0] ?? '';
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

export function describe(s: SummaryLite): string {
  const parts = [s.authors, s.year].filter(Boolean).join(' ');
  return [parts, s.title].filter(Boolean).join(', ');
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function dateWords(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}
