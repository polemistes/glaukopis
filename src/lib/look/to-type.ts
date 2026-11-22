/**
 * A document type made from a document (the plan of one form, stage 2): the
 * writer sets a document up as they want it, in Look, and says where that
 * goes. Underneath nothing changes: the type is a template, its pages a
 * layout of the writer's own, and what the document sets otherwise, its
 * changes over them, is taken off the document as it goes into the type.
 */

import { formatsSave, type DocumentFormat } from '$lib/api/documents';
import { templatesSave, type ContentsItem, type Template } from '$lib/api/templates';
import { compositionPaths, composed, type CompositionChanges } from '$lib/document/composition';
import { partsStanding } from '$lib/document/stands';
import { asOwn } from '$lib/document/templates';
import { documents, templateFor } from '$lib/preview/documents.svelte';
import type { Project } from '$lib/project/model/project.svelte';
import type { DocumentSettings } from '$lib/project/model/types';
import { partSpec, type PartSpec } from '$lib/project/parts';
import { countOf, laidOver, type LookChanges } from './changes';

/**
 * What a type's contents and kinds become, made from the parts a document
 * has (`partsStanding`): its parts in the order they stand, a part
 * Glaukopis makes as `{ part }`, another as `{ kind }`, and the text where
 * it begins (where the document has none, before the first part of the
 * back, or last). A cover is on no page: it is kept among the kinds, and so
 * is offered, but has no place in the order; a kind printed nowhere is
 * passed over. The notes, which the layout places, stand before the
 * bibliography, or last, where the type had them. Where the document has
 * no part at all, the type's contents are kept as they are. Pure.
 */
export function typeContents(
  standing: readonly string[],
  type: Pick<Template, 'contents' | 'kinds'>,
  specOf: (id: string) => PartSpec | undefined = partSpec,
): { contents: ContentsItem[]; kinds: string[] } {
  const kinds = [...type.kinds];
  const offer = (id: string) => {
    if (!kinds.includes(id)) kinds.push(id);
  };
  const parts: string[] = [];
  for (const id of standing) {
    if (id === 'body') continue;
    const spec = specOf(id);
    if (!spec || spec.place === 'none') continue;
    if (spec.place === 'cover') offer(id);
    else parts.push(id);
  }
  if (!parts.length) return { contents: type.contents.map((c) => ({ ...c })), kinds };

  const contents: ContentsItem[] = standing
    .filter((id) => id === 'body' || parts.includes(id))
    .map((id) =>
      id === 'body'
        ? { part: 'body' }
        : specOf(id)?.made
          ? ({ part: id } as ContentsItem)
          : { kind: id },
    );
  if (!contents.some((c) => 'part' in c && c.part === 'body')) {
    const back = contents.findIndex(
      (c) => ('kind' in c ? specOf(c.kind) : specOf(c.part))?.group === 'back',
    );
    contents.splice(back < 0 ? contents.length : back, 0, { part: 'body' });
  }
  if (type.contents.some((c) => 'part' in c && c.part === 'notes')) {
    const bibliography = contents.findIndex((c) => 'part' in c && c.part === 'bibliography');
    contents.splice(bibliography < 0 ? contents.length : bibliography, 0, { part: 'notes' });
  }
  return { contents, kinds };
}

/** The changes of a document that a type takes in, and Reset takes away. */
export interface DocumentChanges {
  /** The changes of the look, of the element and those over it. */
  look: number;
  /** The changes of what is required, of the element and those over it. */
  requirements: number;
  /** Whether the element or one over it chooses a look or a reference style of its own. */
  chosen: boolean;
}

/** What is a requirement among the paths of a document's composition changes. */
const isRequirement = (path: string) => path.startsWith('requirements.');

/** How many changes a document has over its type, and whether it chooses a look or a style. */
export function changesOf(project: Project, at: string): DocumentChanges {
  return {
    look: countOf(project.lookOf(at).changes),
    requirements: compositionPaths(project.compositionOf(at).changes).filter(isRequirement).length,
    chosen: project
      .pathTo(at)
      .some((id) => !!project.node(id)?.document.format || !!project.node(id)?.document.style),
  };
}

/** Whether an element says anything of the document that a type takes in. */
function setsAny(document: DocumentSettings): boolean {
  return (
    countOf(document.look) > 0 ||
    compositionPaths(document.composition).length > 0 ||
    !!document.format ||
    !!document.style
  );
}

/**
 * The elements a type made of a document is set on: the highest on the way
 * to `at` that sets anything a type takes in, or that sets the type; or
 * `at`. `clear` is it and those under it down to `at`, whose changes go.
 */
export function makersOf(project: Project, at: string): { on: string; clear: string[] } {
  const way = project.pathTo(at);
  const setter = project.documentOf(at).from.get('template');
  const first = way.findIndex((id) => id === setter || setsAny(project.node(id)?.document ?? {}));
  const from = first < 0 ? way.length - 1 : first;
  return { on: way[from], clear: way.slice(from) };
}

/**
 * Takes every change of a document away, of the look and of what is
 * required, on the element and those over it: one step of undo.
 */
export function resetDocument(project: Project, at: string) {
  const way = project.pathTo(at);
  project.checkpoint();
  project.transact(() => {
    for (const id of way) {
      const document = project.node(id)?.document;
      if (!document) continue;
      const patch: Partial<DocumentSettings> = {};
      if (document.look !== undefined) patch.look = undefined;
      if (compositionPaths(document.composition).some(isRequirement)) {
        const kept = { ...document.composition };
        delete kept.requirements;
        patch.composition = compositionPaths(kept).length
          ? (kept as CompositionChanges)
          : undefined;
      }
      if (Object.keys(patch).length) project.setDocument(id, patch);
    }
  });
  project.checkpoint();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Puts everything a document sets otherwise into a document type, and takes
 * it off the document: into the type it has, where that is the writer's
 * own and `name` is not given; else into a new type of the writer's own of
 * that name, made from the type in use, which the document is then given.
 *
 * 1. The pages: the layout with all the changes is saved as a layout of the
 *    writer's own, over the type's where that is theirs already, else as a
 *    new one named as the type is.
 * 2. The type: the type in use with the document's changes of what is
 *    required, the layout of 1, the reference style where the document or
 *    the type chose one, and the parts the document has (`typeContents`).
 * 3. The project: the type is set where it was set or where the changes
 *    were, the highest of them, and what the elements from there down to
 *    the document set of the look, the style and what is required is taken
 *    away, in one step of undo; the project keeps a copy of the type.
 *
 * Where `parts` is false the type keeps the parts and the kinds it has:
 * a type that is edited is written as the look is changed, and a look
 * changed is no change of what the type suggests.
 */
export async function saveToType(
  project: Project,
  at: string,
  name: string | null = null,
  parts = true,
): Promise<Template> {
  const inherited = project.documentOf(at);
  const choice = await documents.choiceRead(inherited.settings, project);
  const type = clone(await templateFor(project, choice.template)) as Template;
  const fresh = name !== null || type.group !== 'own' || !documents.templateSummary(type.id);
  const typeName = fresh ? (name ?? type.name).replace(/\s+/g, ' ').trim() || type.name : type.name;

  // 1. The pages.
  const layout = clone(await documents.format(choice.format)) as DocumentFormat;
  const made = laidOver(clone(layout), project.lookOf(at).changes as LookChanges);
  made.lineNumbers = layout.lineNumbers;
  const theirs = !fresh && type.layout ? documents.formatSummary(type.layout) : undefined;
  const pages = await formatsSave(
    theirs?.own
      ? { ...made, id: theirs.id, name: theirs.name, kind: 'own' }
      : { ...made, id: '', name: typeName, basedOn: layout.id, kind: 'own' },
  );
  documents.forgetFormat(pages.id);

  // 2. The type.
  const chose = !!inherited.settings.style || !!type.style;
  const { contents, kinds } = parts
    ? typeContents(partsStanding(project, at), type)
    : { contents: type.contents, kinds: type.kinds };
  const next: Template = {
    ...composed(type, project.compositionOf(at).changes),
    layout: pages.id,
    style: chose ? choice.style : undefined,
    contents,
    kinds,
  };
  const taken = documents.templates.map((s) => s.id);
  const saved = await templatesSave(fresh ? asOwn(next, typeName, taken, true) : next);
  documents.forgetTemplate(saved.id);

  // 3. The project.
  const { on, clear } = makersOf(project, at);
  project.checkpoint();
  project.transact(() => {
    for (const id of clear) {
      const patch: Partial<DocumentSettings> = {
        format: undefined,
        style: undefined,
        look: undefined,
        composition: undefined,
      };
      if (id === on) patch.template = saved.id;
      else if (project.node(id)?.document.template !== undefined) patch.template = undefined;
      project.setDocument(id, patch);
    }
  });
  project.checkpoint();
  project.keepTemplate(saved);
  await documents.reload();
  return saved;
}
