/**
 * The layouts and the reference styles as they are offered to choose from,
 * in groups: by what a layout is for, by how a style cites.
 */

import { t } from '$lib/i18n';
import { documents, formatKindWords, kindWords } from '$lib/preview/documents.svelte';

/** The layouts by what they are for: the writer's own first. */
export function formatGroups() {
  return ['own', 'general', 'fiction', 'stage', 'poetry', 'style-guide', 'publisher', 'journal']
    .map((kind) => ({
      name: formatKindWords(kind) ?? kind,
      formats: documents.formats.filter((f) => f.kind === kind),
    }))
    .filter((g) => g.formats.length);
}

/** The reference styles by how they cite: in notes, by author and date, by number… */
export function styleGroups() {
  const groups = new Map<string, typeof documents.styles>();
  const other = t('style-kind-other');
  for (const s of documents.styles) {
    const name = kindWords(s.kind) || other;
    groups.set(name, [...(groups.get(name) ?? []), s]);
  }
  const order = [
    ...['note', 'author-date', 'numeric', 'label', 'author'].map((kind) => kindWords(kind)),
    other,
  ];
  return [...groups].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
}

/** A layout by its name; its id where it is not known. */
export const layoutName = (id: string | undefined) =>
  id ? (documents.formatSummary(id)?.name ?? id) : '';

/** A reference style by its name; its id where it is not known. */
export const styleName = (id: string | undefined) => (id ? (documents.style(id)?.title ?? id) : '');
