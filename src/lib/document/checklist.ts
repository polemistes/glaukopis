/**
 * The checklist of a document (ADR 0038): what the template requires and
 * what the tree says, as remarks. Words over the limit, the words of the
 * abstract, the keywords, a second element of a kind the document has one
 * of, and parts of a kind the template has no place for. Nothing is
 * refused: every remark names what it is about.
 */

import type { DocumentFormat } from '$lib/api/documents';
import type { Template } from '$lib/api/templates';
import { t } from '$lib/i18n';
import { countWords } from '$lib/project/model/document';
import type { Project } from '$lib/project/model/project.svelte';
import { isDoubled, partOf, type PartSpec } from '$lib/project/parts';

export type RemarkKind = 'words' | 'abstract-words' | 'keywords' | 'doubled' | 'unplaced';

export interface Remark {
  kind: RemarkKind;
  /** In the language of the interface. */
  text: string;
  /** The elements it is about, where it is about some. */
  elements?: string[];
}

/**
 * The remarks on the document of an element, by the template it uses and
 * the layout (`format`), which the checklist does not judge by yet. With
 * no template, only what the tree says.
 */
export function checklist(
  project: Project,
  at: string,
  template: Template | null | undefined,
  format?: DocumentFormat | null,
): Remark[] {
  void format;
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

  return remarks;
}
