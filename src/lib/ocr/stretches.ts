/**
 * The stretches of a PDF's pages read with languages and a layout of their
 * own, as the dialogs that read keep them: a list in the order of their
 * pages whose first stretch begins at page 1 and holds the choices of the
 * whole. The dialog's language picker and layout edit one stretch at a
 * time, the current one; what they hold is laid into the list (`withCurrent`)
 * before it is read or another stretch is chosen.
 */

import type { Asked, Layout, OutlinePart, Stretch } from '$lib/api/ocr';

/** What a stretch is read with. */
export interface Choices {
  languages: string[];
  layout: Layout;
}

/** The list with the current stretch given `choices`. */
export function withCurrent(list: Stretch[], current: number, choices: Choices): Stretch[] {
  return list.map((s, i) =>
    i === current ? { from: s.from, languages: [...choices.languages], layout: choices.layout } : s,
  );
}

/** The stretch that holds a page, counted from one: the last that begins at it or before. */
export function stretchOf(list: Stretch[], page: number): number {
  let found = 0;
  list.forEach((s, i) => {
    if (s.from <= page) found = i;
  });
  return found;
}

/**
 * A stretch begun at a page with `choices`, in its place in the list; where
 * one begins there already, it is that one. The list, and the index of the
 * stretch that begins at the page.
 */
export function beginStretch(
  list: Stretch[],
  page: number,
  choices: Choices,
): { list: Stretch[]; index: number } {
  const at = list.findIndex((s) => s.from === page);
  if (at >= 0) return { list, index: at };
  const stretch: Stretch = {
    from: page,
    languages: [...choices.languages],
    layout: choices.layout,
  };
  const next = [...list, stretch].sort((a, b) => a.from - b.from);
  return { list: next, index: next.indexOf(stretch) };
}

/** The list without a stretch, whose pages fall to the one before; the first is never taken away. */
export function removeStretch(list: Stretch[], index: number): Stretch[] {
  return index <= 0 ? list : list.filter((_, i) => i !== index);
}

/**
 * Stretches begun at each part of the outline, as `beginStretch` begins
 * them, those at page 1 or past the last page left out: for the writer to
 * set the languages of, part by part.
 */
export function stretchesAtOutline(
  list: Stretch[],
  outline: OutlinePart[],
  pages: number,
  choices: Choices,
): Stretch[] {
  let out = list;
  for (const part of outline) {
    if (part.page > 1 && part.page <= pages) out = beginStretch(out, part.page, choices).list;
  }
  return out;
}

/** The first stretch of the whole file, at page 1, with `choices`. */
export function firstStretch(choices: Choices): Stretch[] {
  return [{ from: 1, languages: [...choices.languages], layout: choices.layout }];
}

/** What is asked of a reading by the stretches: the first as the whole's languages and layout, the rest as stretches. */
export function askedOf(list: Stretch[]): Pick<Asked, 'languages' | 'layout' | 'stretches'> {
  const [first, ...rest] = list;
  return {
    languages: first ? [...first.languages] : [],
    layout: first?.layout ?? '',
    stretches: rest.map((s) => ({ ...s, languages: [...s.languages] })),
  };
}

/** The pages a stretch holds, counted from one: from its page to the page before the next, or to the last. */
export function pagesOf(
  list: Stretch[],
  index: number,
  pages: number,
): { from: number; to: number } {
  const from = list[index]?.from ?? 1;
  const next = list[index + 1]?.from;
  return { from, to: next ? next - 1 : pages };
}
