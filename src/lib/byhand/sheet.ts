/**
 * The look of the document on a sheet of rich text (ADR 0113): where a text
 * is of a document, the sheet draws its paragraphs of text as the document
 * sets them, in its font, with its line spacing, its alignment, the indent
 * of its first lines and the space between its paragraphs. What is set by
 * hand is laid over that, there as in the document. A heading on a sheet
 * (ADR 0115) is drawn as the layout sets the headings of its level.
 *
 * It is said here as properties of what holds the text, the editor and
 * what shows a text that is not written in alike, and the style sheet
 * (`app.css`) draws the sheet by them. A text of no document, as a note of
 * the notebook, says none of them, and its sheets are drawn as the text
 * around them.
 */

import type { DocumentFormat } from '$lib/api/documents';
import { fontOf, lengthOf, pointsOf } from './hand';

/** A length of a layout in points; nought where it says none. */
const points = (length: string | undefined): number => {
  const kept = lengthOf(length);
  return kept ? Math.round(pointsOf(kept) * 100) / 100 : 0;
};

/**
 * The properties of the sheets of a text whose document is laid out so, as
 * a style. Lengths are numbers of points of the document, which the style
 * sheet draws in proportion (`--hand-base` is the document's size of type);
 * a line is 1.2 of the size of type at single spacing, as the typesetter
 * has it (`formats/typst.rs`, `leading`).
 */
export function sheetLook(format: DocumentFormat | undefined, depth = 0): string {
  if (!format) return '';
  const said: string[] = [];
  const size = format.font?.size;
  if (typeof size === 'number' && size > 0) said.push(`--hand-base: ${size}`);
  const family = fontOf(format.font?.family);
  if (family) said.push(`--sheet-font: "${family}", var(--font-editor, var(--font-text))`);
  const text = format.text;
  if (!text) return said.join('; ');
  said.push('--hand-single: 1.2');
  const spacing =
    typeof text.lineSpacing === 'number' && text.lineSpacing > 0 ? text.lineSpacing : 1;
  said.push(`--sheet-line: ${Math.round(spacing * 1.2 * 1000) / 1000}`);
  const align = text.align === 'justified' ? 'justify' : text.align;
  if (align === 'left' || align === 'center' || align === 'right' || align === 'justify')
    said.push(`--sheet-align: ${align}`);
  // The first line begins in where the text stands to the left: a centred line is not set in.
  const indent = align === 'center' || align === 'right' ? 0 : points(text.indent);
  said.push(`--sheet-indent: ${indent}`);
  // The paragraph that follows no other begins with the rest, unless the layout sets every one in.
  said.push(`--sheet-indent-first: ${text.indentFirst ? indent : 0}`);
  const between = points(text.spaceBetween);
  said.push(`--sheet-between: ${between}`);
  said.push(
    ...headings(format, depth, typeof size === 'number' && size > 0 ? size : 11, spacing, between),
  );
  return said.join('; ');
}

/**
 * The headings of a sheet (ADR 0115), which are paragraphs and no
 * elements: *Heading* is drawn as the layout sets the headings one level
 * under the element the text is of, *Subheading* as those two under it.
 * `depth` is how deep that element stands in its document.
 *
 * The room over and under one is counted as the typesetter leaves it
 * (`formats/typst.rs`, `heading_rule`): over it the larger of its space
 * before and what stands between two paragraphs; under it the larger of
 * its space after, with what wide line spacing adds, and the same. Of that
 * the sheet's lines hold some themselves: half of what is between the
 * lines of the text, and a tenth of the heading's size. The rest is said.
 */
function headings(
  format: DocumentFormat,
  depth: number,
  size: number,
  spacing: number,
  between: number,
): string[] {
  const levels = format.headings?.levels ?? [];
  if (!levels.length) return [];
  const round = (n: number) => Math.round(n * 100) / 100;
  const lead = Math.max(0, (spacing * 1.2 - 1) * size);
  const paragraphs = lead + between;
  const said: string[] = [];
  for (const n of [1, 2]) {
    const h = levels[Math.min(Math.max(depth + n, 1), levels.length) - 1];
    const own = typeof h.size === 'number' && h.size > 0 ? h.size : size;
    const held = lead / 2 + own * 0.1;
    const over = Math.max(points(h.spaceBefore), paragraphs);
    const under = Math.max(
      points(h.spaceAfter) + Math.max(0, (spacing - 1) * 1.2 * size),
      paragraphs,
    );
    const name = `--sheet-h${n}`;
    said.push(
      `${name}-size: ${round(own)}`,
      `${name}-weight: ${h.bold ? 700 : 400}`,
      `${name}-style: ${h.italic ? 'italic' : 'normal'}`,
      `${name}-align: ${h.align === 'center' || h.align === 'right' ? h.align : 'left'}`,
      `${name}-transform: ${h.case === 'upper' ? 'uppercase' : 'none'}`,
      `${name}-caps: ${h.case === 'smallcaps' ? 'small-caps' : 'normal'}`,
      `${name}-in: ${h.indent ? points(format.text.indent) : 0}`,
      `${name}-before: ${round(Math.max(0, over - held))}`,
      `${name}-after: ${round(Math.max(0, under - held))}`,
    );
  }
  return said;
}
