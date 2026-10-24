/**
 * The checklist of a document (ADR 0038): what the template requires and
 * what the tree says, as remarks. Words over the limit, the words of the
 * abstract, the keywords, a second element of a kind the document has one
 * of, and parts of a kind the template has no place for; a front page that
 * names the authors where the template asks for an anonymous document; and
 * quotations in the text long enough for the layout to set them off. Nothing
 * is refused: every remark names what it is about.
 */

import type { DocumentFormat } from '$lib/api/documents';
import type { Template } from '$lib/api/templates';
import { points, specOf } from '$lib/editor/kinds';
import { t } from '$lib/i18n';
import { countWords } from '$lib/project/model/document';
import type { Project } from '$lib/project/model/project.svelte';
import { inlineText } from '$lib/project/model/text';
import type { PassageKindRecord } from '$lib/project/model/types';
import { isDoubled, partOf, type PartSpec } from '$lib/project/parts';

export type RemarkKind =
  'words' | 'abstract-words' | 'keywords' | 'doubled' | 'unplaced' | 'anonymous' | 'quotation';

export interface Remark {
  kind: RemarkKind;
  /** In the language of the interface. */
  text: string;
  /** The elements it is about, where it is about some. */
  elements?: string[];
}

/** The sizes of the pages a layout names, in points: width and height. */
const PAGES: Record<string, [number, number]> = {
  a4: [595, 842],
  letter: [612, 792],
  a5: [420, 595],
  b5: [499, 709],
  legal: [612, 1008],
};

/**
 * How many letters a line of the text holds, about, as the layout sets it:
 * the width of a column, its page less the margins and the gaps, over half
 * the size of the type, which is near the width of a letter of a book face.
 * The lines a quotation takes are known only once it is set; this is what
 * the checklist can know before.
 */
export function lettersALine(f: DocumentFormat): number {
  const pt = (length: string) => points(length) ?? 0;
  const [width] = f.page.size === 'custom' ? [pt(f.page.width)] : (PAGES[f.page.size] ?? PAGES.a4);
  const columns = Math.max(1, f.page.columns ?? 1);
  const gaps = (columns - 1) * pt(f.page.columnGap ?? '1cm');
  const measure = (width - pt(f.page.marginLeft) - pt(f.page.marginRight) - gaps) / columns;
  return Math.max(10, measure / (0.5 * Math.max(1, f.font.size)));
}

/**
 * The quotation marks a paragraph may have, opening and closing. Of these,
 * the paragraph's are those whose opening mark stands first in it, so that
 * the space between two quotations is not taken for one of another kind
 * (» og « between «en» and «to»), nor the German closing mark for the
 * English opening one.
 */
const MARKS: readonly [string, string][] = [
  ['„', '“'],
  ['“', '”'],
  ['«', '»'],
  ['»', '«'],
  ['”', '”'],
  ['"', '"'],
];

/** The runs of a paragraph between quotation marks, without the marks. */
export function quotationsIn(text: string): string[] {
  let marks: [string, string] | undefined;
  let first = Infinity;
  for (const pair of MARKS) {
    const at = text.indexOf(pair[0]);
    if (at >= 0 && at < first) [marks, first] = [pair, at];
  }
  if (!marks) return [];
  const [open, close] = marks;
  const out: string[] = [];
  let at = 0;
  for (;;) {
    const from = text.indexOf(open, at);
    if (from < 0) break;
    const to = text.indexOf(close, from + open.length);
    if (to < 0) break;
    out.push(text.slice(from + open.length, to));
    at = to + close.length;
  }
  return out;
}

/** Whether a kind of paragraph is the kind Quotation, or based on it, of the catalogue or the writer's own. */
function isQuotation(id: string, own: readonly PassageKindRecord[]): boolean {
  const seen = new Set<string>();
  let at: string | undefined = id;
  for (let depth = 0; at && depth < 8 && !seen.has(at); depth++) {
    if (at === 'quote') return true;
    seen.add(at);
    at = specOf(at)?.basedOn ?? own.find((k) => k.id === at)?.basedOn ?? undefined;
  }
  return false;
}

/**
 * The remarks on the document of an element, by the template it uses and
 * the layout as the document uses it (`format`), with its changes. With no
 * template, only what the tree and the layout say.
 */
export function checklist(
  project: Project,
  at: string,
  template: Template | null | undefined,
  format?: DocumentFormat | null,
): Remark[] {
  const remarks: Remark[] = [];
  if (!project.node(at)) return remarks;
  const tree = project.tree(at);
  const children = (id: string) =>
    (tree.children.get(id) ?? []).filter((c) => !project.node(c)?.excluded);
  const requirements = template?.requirements;

  if (requirements?.words) {
    const { text } = countWords(project, at);
    if (text > requirements.words)
      remarks.push({
        kind: 'words',
        text: t('checklist-words', { count: text, limit: requirements.words }),
      });
  }

  if (requirements?.abstractWords) {
    const abstract = children(at).find(
      (c) => partOf(project, project.node(c)?.kind)?.id === 'abstract',
    );
    if (abstract) {
      const { text } = countWords(project, abstract);
      if (text > requirements.abstractWords)
        remarks.push({
          kind: 'abstract-words',
          text: t('checklist-abstract-words', { count: text, limit: requirements.abstractWords }),
          elements: [abstract],
        });
    }
  }

  if (requirements?.keywords) {
    const count = (project.documentOf(at).settings.keywords ?? []).length;
    if (count > requirements.keywords)
      remarks.push({
        kind: 'keywords',
        text: t('checklist-keywords', { count, limit: requirements.keywords }),
      });
  }

  // A second element of a kind the document has one of, among siblings,
  // anywhere under the element: all but the first, by the parent and the kind.
  const doubled = new Map<string, { part: PartSpec; elements: string[] }>();
  for (const id of tree.sequence) {
    const node = project.node(id);
    if (!node || !node.kind || id === at) continue;
    const part = partOf(project, node.kind);
    if (!part?.one || !isDoubled(project, id)) continue;
    const key = `${tree.parent.get(id)}/${part.id}`;
    const entry = doubled.get(key) ?? { part, elements: [] };
    entry.elements.push(id);
    doubled.set(key, entry);
  }
  for (const { part, elements } of doubled.values())
    remarks.push({
      kind: 'doubled',
      text: t('checklist-doubled', { kind: part.label(), count: elements.length }),
      elements,
    });

  // What a cover output alone prints, where the template makes none.
  if (template && !template.outputs.some((o) => o.places?.includes('cover'))) {
    const unplaced = children(at).filter(
      (c) => partOf(project, project.node(c)?.kind)?.place === 'cover',
    );
    if (unplaced.length)
      remarks.push({
        kind: 'unplaced',
        text: t('checklist-unplaced', { count: unplaced.length }),
        elements: unplaced,
      });
  }

  // A front page that names the authors, where the template asks for an anonymous document.
  if (requirements?.anonymous && format && !format.title.anonymous)
    remarks.push({ kind: 'anonymous', text: t('checklist-anonymous') });

  // Quotations in the text, in a paragraph of text, that the layout would set off by their length.
  const words = format?.quote.fromWords || null;
  const lines = format?.quote.fromLines || null;
  if (format && (words || lines)) {
    const perLine = lettersALine(format);
    const own = project.passageKinds;
    for (const id of tree.sequence) {
      if (project.node(id)?.excluded) continue;
      for (const block of project.blocksOf(id)) {
        if (block.kind !== 'paragraph' || isQuotation(block.name, own)) continue;
        let longest: { words: number; lines: number } | null = null;
        for (const run of quotationsIn(inlineText(block.content))) {
          const count = run.split(/\s+/).filter(Boolean).length;
          const across = run.length / perLine;
          if ((words && count >= words) || (lines && across >= lines)) {
            if (!longest || count > longest.words) longest = { words: count, lines: across };
          }
        }
        if (!longest) continue;
        const byWords = !!words && longest.words >= words;
        remarks.push({
          kind: 'quotation',
          text: t('checklist-long-quotation', {
            element: project.node(id)?.title || t('project-untitled'),
            words: longest.words,
            lines: Math.max(1, Math.round(longest.lines)),
            limit: byWords ? words : (lines ?? 0),
            by: byWords ? 'words' : 'lines',
          }),
          elements: [id],
        });
      }
    }
  }

  return remarks;
}
