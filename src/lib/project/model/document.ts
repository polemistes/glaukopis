/**
 * An element as a document: the elements under it in the order of the
 * text, with the level of each heading, as preview and export want it. See
 * ADRs 0003, 0037 and 0038.
 *
 * - The name of the element at the top is the title; its text stands before
 *   the first section.
 * - What is excluded is left out, with everything under it.
 * - A clone has its original's branch in its place (ADR 0065): its own name
 *   is the heading, the original's text follows, and then the original's
 *   sections, one level below. Of its own a clone has nothing but its name:
 *   text or sub-elements an older project gave it are not printed.
 * - An element without a name gives its text only, and does not deepen
 *   what is under it.
 * - The children of every element stand in the order of the tree (ADR
 *   0118): no kind moves an element. Of a kind a document has one of, the
 *   first among siblings is taken and the others are left out; a kind
 *   printed nowhere is left out. Those of a kind of the catalogue
 *   (`project/parts.ts`) among the direct children of the element at the
 *   top are the parts of the document, each a branch of its own: its text
 *   at level 0, its children from level 1. Among them are those of what
 *   Glaukopis makes itself, a title page, a table of contents, a
 *   bibliography: each is printed where its element stands, and nothing of
 *   the kind where there is none. Deeper down such an element is of the
 *   element it stands under, and is printed when that is the document.
 * - `order` says where the parts stand among the runs of the text.
 */

import type {
  ExportDocument,
  ExportPart,
  ExportPlaced,
  ExportReference,
  ExportSection,
  LeanDocument,
  LeanSection,
  OwnKind,
} from '$lib/api/documents';
import { partOf, type PartSpec } from '$lib/project/parts';
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
  /** A clone, whose own text is not printed: its original's follows it. */
  clone?: boolean;
  /** The top of a branch: of the document itself, of a part of it, or of one that stands in the place of an element. */
  root: boolean;
  /** The element the document is made of, whose name is the title. */
  top: boolean;
  /** What its kind is in the document, by the id of the catalogue; nothing where it is nothing there. */
  kind?: string;
  /** The part of the document it is, or stands within: a direct child of the top, of a matter or cover kind. */
  part?: string;
}

interface Child {
  id: string;
  part: PartSpec | null;
}

/**
 * The children of an element as the document has them, in the order of the
 * tree: of a kind a document has one of, the first only; nothing of a kind
 * printed nowhere.
 */
function childrenPrinted(project: Project, children: readonly string[]): Child[] {
  const out: Child[] = [];
  const taken = new Set<string>();
  for (const id of children) {
    const node = project.node(id);
    if (!node || node.excluded) continue;
    const part = partOf(project, node.kind);
    if (part?.one) {
      if (taken.has(part.id)) continue;
      taken.add(part.id);
    }
    if (part?.place === 'none') continue;
    out.push({ id, part });
  }
  return out;
}

/**
 * The elements of a document in its order, each with its place there. What
 * is excluded is passed over with everything under it; a branch that stands
 * in the place of an element is walked in that place.
 */
export function walkDocument(project: Project, id: string, visit: (placed: Placed) => void) {
  const tree = project.tree();
  /**
   * A branch: the document itself, a part of it, or what stands in the
   * place of an element. `part` is the part it stands within, where it
   * does; `kind` what its top is in the document.
   */
  const walkBranch = (
    top: string,
    level: number,
    within: Set<string>,
    isTop: boolean,
    part: string | undefined,
    kind: string | undefined,
  ) => {
    const isPart = part === top;
    const walk = (nodeId: string, at: number, isRoot: boolean, kind: string | undefined) => {
      const node = project.node(nodeId);
      if (!node || node.excluded) return;
      const printed = !isRoot && node.titleHtml.length > 0;
      const clone = !isRoot && !!node.include;
      visit({
        id: nodeId,
        level: isRoot ? (isTop || isPart ? 0 : Math.max(at, 1)) : Math.min(at, DEEPEST),
        printed,
        ...(clone ? { clone } : {}),
        root: isRoot,
        top: isRoot && isTop,
        ...(kind ? { kind } : {}),
        ...(part ? { part } : {}),
      });

      const next = isRoot ? at + (isTop || isPart ? 1 : 0) : printed ? at + 1 : at;

      if (clone) {
        // The original's branch, where it does not hold the document itself; nothing of the clone's own.
        if (node.include && !within.has(node.include) && project.node(node.include)) {
          const inner = new Set(within);
          inner.add(node.include);
          walkBranch(node.include, Math.max(next, 1), inner, false, part, undefined);
        }
        return;
      }
      for (const child of childrenPrinted(project, tree.children.get(nodeId) ?? [])) {
        // A part of the document: a direct child of the top, of a kind of the catalogue.
        if (isRoot && isTop && child.part) {
          walkBranch(child.id, 0, within, false, child.id, child.part.id);
          continue;
        }
        // Deeper down, what a cover output alone prints is not printed, nor what
        // Glaukopis makes for the element it stands under.
        if (child.part?.place === 'cover' || child.part?.made) continue;
        walk(child.id, Math.max(next, 1), false, child.part?.id);
      }
    };
    walk(top, level, true, kind);
  };
  if (project.node(id)) walkBranch(id, 0, new Set([id]), true, undefined, undefined);
}

export function buildDocument(project: Project, id: string): ExportDocument {
  const sections: ExportSection[] = [];
  const parts: ExportPart[] = [];
  const order: ExportPlaced[] = [];
  /** Where the run of the text that is being walked begins, among the sections. */
  let run = 0;
  const endRun = () => {
    if (sections.length > run) order.push({ sections: [run, sections.length] });
    run = sections.length;
  };
  const cited = new Set<string>();

  walkDocument(project, id, (placed) => {
    if (!placed.clone) for (const ref of project.node(placed.id)?.cited ?? []) cited.add(ref);
    const blocks = placed.clone ? [] : project.blocksOf(placed.id);
    let into = sections;
    if (placed.part) {
      if (placed.part === placed.id) {
        // A part begins: the text before it is a run, and the part stands after it.
        endRun();
        order.push({ part: parts.length });
        parts.push({
          kind: placed.kind ?? '',
          element: placed.id,
          title: readTitle(project.fragment(placed.id, 'title') ?? undefined),
          sections: [],
        });
      }
      into = parts[parts.length - 1].sections;
    }
    if (placed.root) {
      // The text of the top of a branch, before its first section. Its name
      // is the title of the document or of the part, or the heading of what
      // stood for it.
      if (blocks.length)
        into.push({ level: placed.level, heading: null, blocks, element: placed.id });
      return;
    }
    const heading = placed.printed
      ? readTitle(project.fragment(placed.id, 'title') ?? undefined)
      : [];
    into.push({
      level: placed.level,
      heading: heading.length ? heading : null,
      blocks,
      element: placed.id,
      ...(placed.kind ? { kind: placed.kind } : {}),
    });
  });

  endRun();

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
    contributors: (settings.contributors ?? []).filter((c) => c.name?.trim()),
    date: settings.date,
    keywords: settings.keywords ?? [],
    language: settings.language,
    identifiers: settings.identifiers ?? {},
    parts,
    sections,
    order,
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
      // A clone counts its original's words, and nothing of its own.
      if (node.include) {
        if (!within.has(node.include) && project.node(node.include)) {
          const inner = new Set(within);
          inner.add(node.include);
          visit(node.include, inner);
        }
        return;
      }
      withNotes += node.words;
      notes += node.noteWords;
      for (const c of tree.children.get(nodeId) ?? []) walk(c);
    };
    walk(top);
  };
  visit(id, new Set([id]));
  return { text: withNotes - notes, withNotes };
}
