/**
 * An element as a document: the elements under it in the order of the
 * text, with the level of each heading, as preview and export want it. See
 * ADRs 0003 and 0037.
 *
 * - The name of the element at the top is the title; its text stands before
 *   the first section.
 * - What is excluded is left out, with everything under it.
 * - An element that stands for another element has that one's branch in its
 *   place: its own name is the heading, the other's text follows, and then
 *   the other's sections, one level below.
 * - An element whose name is not printed gives its text only, and does not
 *   deepen what is under it.
 */

import type {
  ExportDocument,
  ExportReference,
  ExportSection,
  LeanDocument,
  LeanSection,
  OwnKind,
} from '$lib/api/documents';
import type { Project } from './project.svelte';
import { readTitle, type Inline } from './text';

const DEEPEST = 12;

/** An element as it stands in the document. */
export interface Placed {
  id: string;
  /** The level of its heading; 0 for what stands before the first section. */
  level: number;
  /** Whether its name is printed as a heading. */
  printed: boolean;
  /** The top of a branch: of the document itself, or of one that stands in the place of an element. */
  root: boolean;
  /** The element the document is made of, whose name is the title. */
  top: boolean;
}

/**
 * The elements of a document in its order, each with its place there. What
 * is excluded is passed over with everything under it; a branch that stands
 * in the place of an element is walked in that place.
 */
export function walkDocument(project: Project, id: string, visit: (placed: Placed) => void) {
  const tree = project.tree();
  const walkBranch = (top: string, level: number, within: Set<string>, isTop: boolean) => {
    const walk = (nodeId: string, at: number, isRoot: boolean) => {
      const node = project.node(nodeId);
      if (!node || node.excluded) return;
      const printed = !isRoot && node.heading && node.titleHtml.length > 0;
      visit({
        id: nodeId,
        level: isRoot ? (isTop ? 0 : Math.max(at, 1)) : Math.min(at, DEEPEST),
        printed,
        root: isRoot,
        top: isRoot && isTop,
      });

      const next = isRoot ? at + (isTop ? 1 : 0) : printed ? at + 1 : at;

      if (!isRoot && node.include && !within.has(node.include) && project.node(node.include)) {
        const inner = new Set(within);
        inner.add(node.include);
        walkBranch(node.include, Math.max(next, 1), inner, false);
      }
      for (const child of tree.children.get(nodeId) ?? []) walk(child, Math.max(next, 1), false);
    };
    walk(top, level, true);
  };
  if (project.node(id)) walkBranch(id, 0, new Set([id]), true);
}

export function buildDocument(project: Project, id: string): ExportDocument {
  const sections: ExportSection[] = [];
  const cited = new Set<string>();

  walkDocument(project, id, (placed) => {
    for (const ref of project.node(placed.id)?.cited ?? []) cited.add(ref);
    const blocks = project.blocksOf(placed.id);
    if (placed.root) {
      // The text of the top of a branch, before its first section. Its name
      // is the title of the document, or the heading of what stood for it.
      if (blocks.length)
        sections.push({ level: placed.level, heading: null, blocks, element: placed.id });
      return;
    }
    const heading = placed.printed
      ? readTitle(project.fragment(placed.id, 'title') ?? undefined)
      : [];
    sections.push({
      level: placed.level,
      heading: heading.length ? heading : null,
      blocks,
      element: placed.id,
    });
  });

  const { settings } = project.documentOf(id);
  const title: Inline[] = settings.title?.trim()
    ? [{ kind: 'text', text: settings.title.trim(), marks: {} }]
    : project.node(id)
      ? readTitle(project.fragment(id, 'title') ?? undefined)
      : [];

  const references: ExportReference[] = [];
  for (const ref of cited) {
    const r = project.refs.get(ref);
    if (r)
      references.push({ id: r.id, key: r.key, type: r.type, fields: r.fields, names: r.names });
  }

  // The kinds of paragraph and of words of the writer's own, with what each
  // is based on and how it differs, so that every target can set them.
  const kinds: OwnKind[] = project.passageKinds.map(({ id, name, family, basedOn, look }) => ({
    id,
    name,
    family,
    basedOn,
    look,
  }));

  return {
    title,
    subtitle: settings.subtitle,
    authors: (settings.authors ?? []).filter((a) => a.name?.trim()),
    date: settings.date,
    abstract: settings.abstract,
    keywords: settings.keywords ?? [],
    language: settings.language,
    ...(settings.cover ? { cover: settings.cover } : {}),
    sections,
    references,
    kinds,
  };
}

/**
 * A document as it is sent for the preview: the text of a part is sent only
 * if it was not sent before, which `sent` says, by the stamps of the texts.
 * Of a long document in which a word was changed, the part with the word
 * is what is sent.
 */
export function leanDocument(
  project: Project,
  id: string,
  sent: ReadonlySet<string> = new Set(),
): LeanDocument {
  const whole = buildDocument(project, id);
  let n = 0;
  const sections: LeanSection[] = whole.sections.map((section) => {
    // A part that is of no element, or of one that is read as it is asked for, is sent as it is.
    const stamp = (section.element && project.stampOf(section.element)) || `?.${n++}`;
    const known = !stamp.startsWith('?') && sent.has(stamp);
    return {
      level: section.level,
      heading: section.heading,
      element: section.element,
      stamp,
      blocks: known ? null : section.blocks,
    };
  });
  return { ...whole, sections };
}

/**
 * What a document is made of, in few words: whatever changes in the
 * document changes this, the kinds of the writer's own among it, and what
 * changes nothing in the document (where an element stands in the diagram,
 * whether a branch is folded) changes it not, unless the element itself is
 * changed.
 */
export function documentMark(document: LeanDocument): string {
  const { sections, ...head } = document;
  const parts = sections.map(
    (s) => `${s.stamp}/${s.level}/${s.heading ? JSON.stringify(s.heading) : ''}`,
  );
  return `${JSON.stringify(head)}\n${parts.join('\n')}`;
}

/** The words of a document, as they would be counted by a publisher: without the notes, and with them. */
export function countWords(project: Project, id: string): { text: number; withNotes: number } {
  // The count of each element includes its notes; the notes are counted apart to take them off.
  let withNotes = 0;
  let notes = 0;
  const tree = project.tree();
  const visit = (top: string, within: Set<string>) => {
    const walk = (nodeId: string) => {
      const node = project.node(nodeId);
      if (!node || node.excluded) return;
      withNotes += node.words;
      notes += node.noteWords;
      if (node.include && !within.has(node.include) && project.node(node.include)) {
        const inner = new Set(within);
        inner.add(node.include);
        visit(node.include, inner);
      }
      for (const c of tree.children.get(nodeId) ?? []) walk(c);
    };
    walk(top);
  };
  visit(id, new Set([id]));
  return { text: withNotes - notes, withNotes };
}
