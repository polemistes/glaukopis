/**
 * A map as a document: the elements in the order of the text, with the level
 * of each heading, as preview and export want it. See ADR 0003.
 *
 * - The name of the centre is the title; its text stands before the first section.
 * - What is excluded is left out, with everything under it. Loose elements
 *   are never part of the document.
 * - An element that stands for another map has that map in its place: its
 *   own name is the heading, the text of the other map's centre follows, and
 *   then the other map's sections, one level below.
 * - An element whose name is not printed gives its text only, and does not
 *   deepen what is under it.
 */

import type { ExportDocument, ExportReference, ExportSection } from '$lib/api/documents';
import type { Project } from './project.svelte';
import { readBody, readTitle, type Inline } from './text';

const DEEPEST = 12;

/** An element as it stands in the document. */
export interface Placed {
  id: string;
  /** The level of its heading; 0 for what stands before the first section. */
  level: number;
  /** Whether its name is printed as a heading. */
  printed: boolean;
  /** The centre of a map: of the map itself, or of one that stands in the place of an element. */
  root: boolean;
  /** The centre of the map the document is made of, whose name is the title. */
  top: boolean;
}

/**
 * The elements of a map in the order of the document, each with its place
 * there. What is excluded is passed over with everything under it; a map
 * that stands in the place of an element is walked in that place.
 */
export function walkDocument(project: Project, mapId: string, visit: (placed: Placed) => void) {
  const walkMap = (id: string, level: number, within: Set<string>, withRoot: boolean) => {
    const tree = project.tree(id);
    if (!tree.root) return;
    const walk = (nodeId: string, at: number, isRoot: boolean) => {
      const node = project.node(nodeId);
      if (!node || node.excluded) return;
      const printed = !isRoot && node.heading && node.titleHtml.length > 0;
      visit({
        id: nodeId,
        level: isRoot ? (withRoot ? 0 : Math.max(at, 1)) : Math.min(at, DEEPEST),
        printed,
        root: isRoot,
        top: isRoot && withRoot,
      });

      const next = isRoot ? at + (withRoot ? 1 : 0) : printed ? at + 1 : at;

      if (!isRoot && node.include && !within.has(node.include) && project.map(node.include)) {
        const inner = new Set(within);
        inner.add(node.include);
        walkMap(node.include, Math.max(next, 1), inner, false);
      }
      for (const child of tree.children.get(nodeId) ?? []) walk(child, Math.max(next, 1), false);
    };
    walk(tree.root, level, true);
  };
  walkMap(mapId, 0, new Set([mapId]), true);
}

export function buildDocument(project: Project, mapId: string): ExportDocument {
  const map = project.map(mapId);
  const sections: ExportSection[] = [];
  const cited = new Set<string>();

  walkDocument(project, mapId, (placed) => {
    for (const ref of project.node(placed.id)?.cited ?? []) cited.add(ref);
    const blocks = readBody(project.fragment(placed.id, 'body') ?? undefined);
    if (placed.root) {
      // The text of the centre, before the first section. Its name is the
      // title of the document, or the heading of what included the map.
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

  const root = map ? project.node(map.root) : undefined;
  const settings = map?.document ?? {};
  const title: Inline[] = settings.title?.trim()
    ? [{ kind: 'text', text: settings.title.trim(), marks: {} }]
    : root
      ? readTitle(project.fragment(root.id, 'title') ?? undefined)
      : [];

  const references: ExportReference[] = [];
  for (const id of cited) {
    const r = project.refs.get(id);
    if (r)
      references.push({ id: r.id, key: r.key, type: r.type, fields: r.fields, names: r.names });
  }

  return {
    title,
    subtitle: settings.subtitle,
    authors: (settings.authors ?? []).filter((a) => a.name?.trim()),
    date: settings.date,
    abstract: settings.abstract,
    keywords: settings.keywords ?? [],
    language: settings.language,
    sections,
    references,
  };
}

/** The words of a document, as they would be counted by a publisher: without the notes, and with them. */
export function countWords(project: Project, mapId: string): { text: number; withNotes: number } {
  // The count of each element includes its notes; the notes are counted apart to take them off.
  let withNotes = 0;
  let notes = 0;
  const visit = (id: string, within: Set<string>) => {
    const tree = project.tree(id);
    const walk = (nodeId: string) => {
      const node = project.node(nodeId);
      if (!node || node.excluded) return;
      withNotes += node.words;
      for (const block of readBody(project.fragment(nodeId, 'body') ?? undefined)) {
        notes += noteWords(block);
      }
      if (node.include && !within.has(node.include) && project.map(node.include)) {
        const inner = new Set(within);
        inner.add(node.include);
        visit(node.include, inner);
      }
      for (const c of tree.children.get(nodeId) ?? []) walk(c);
    };
    if (tree.root) walk(tree.root);
  };
  visit(mapId, new Set([mapId]));
  return { text: withNotes - notes, withNotes };
}

function noteWords(block: import('./text').Block): number {
  const count = (text: string) =>
    text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  const inlines = (list: Inline[]): number =>
    list.reduce((n, i) => {
      if (i.kind !== 'footnote') return n;
      return n + count(i.content.map((c) => (c.kind === 'text' ? c.text : ' ')).join(''));
    }, 0);
  switch (block.kind) {
    case 'paragraph':
      return inlines(block.content);
    case 'blockquote':
      return block.content.reduce((n, b) => n + noteWords(b), 0);
    case 'figure':
    case 'equation':
      return 0;
    case 'row':
      return block.items.reduce((n, b) => n + noteWords(b), 0);
    case 'table':
      return block.rows.reduce(
        (n, row) =>
          n + row.reduce((m, cell) => m + cell.content.reduce((k, b) => k + noteWords(b), 0), 0),
        0,
      );
    default:
      return block.items.reduce((n, item) => n + item.reduce((m, b) => m + noteWords(b), 0), 0);
  }
}
