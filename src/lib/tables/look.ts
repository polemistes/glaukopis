/**
 * How a table looks where it is written and where it is shown: as the
 * format of the document has its tables. What is said here is read by the
 * style sheet (`app.css`, the section on tables).
 */

import type { DocumentFormat } from '$lib/api/documents';

/** Sets an attribute, or takes it away, where it is not so already. */
export function say(el: HTMLElement, name: string, value: string | null) {
  if (value === null) {
    if (el.hasAttribute(name)) el.removeAttribute(name);
  } else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

/**
 * Where what is said of the table stands, over it unless the format has it
 * under; the lines of the table, over and under it and under its headings
 * unless the format has others or none; and whether the headings are bold,
 * which they are not unless the format has them so.
 */
export function dress(figure: HTMLElement, format: DocumentFormat | undefined) {
  const tables = format?.tables;
  say(figure, 'data-caption', tables?.captionPosition === 'below' ? 'below' : null);
  say(
    figure,
    'data-rules',
    tables?.rules === 'grid' || tables?.rules === 'none' ? tables.rules : null,
  );
  say(figure, 'data-bold-headings', tables?.headerBold ? '' : null);
}
