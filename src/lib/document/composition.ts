/**
 * What a document sets otherwise than its template (ADR 0054): the parts the
 * core makes itself, turned on or off, and what is required, each present
 * only where it is set. As the changes of a document to its layout are
 * (`look/changes.ts`), the changes of an element are laid over those of the
 * elements above it, path by path (`Project.compositionOf`), and the result
 * over the template: that is the template the preview, every export and the
 * checklist are made with (`templateUsed`). The core is given the template
 * as it is to be used, and knows nothing of changes.
 *
 * Pure: no words of the interface, nothing reactive, so that the model and
 * the Org form can use it.
 */

import type { ContentsItem, GeneratedPart, PartPlace, Template } from '$lib/api/templates';
import { pathsOf, setAt, withoutPath, type LookChanges } from '$lib/look/changes';
import { GENERATED_PARTS } from './parts-order';

/** What is required, set otherwise than the template; null takes a requirement away. */
export interface RequirementChanges {
  words?: number | null;
  abstractWords?: number | null;
  keywords?: number | null;
  anonymous?: boolean | null;
}

/** What a document sets otherwise than its template, each present only where set. */
export interface CompositionChanges {
  /** The parts the core makes itself, turned on (true) or off (false), by id. */
  parts?: Partial<Record<GeneratedPart, boolean>>;
  /** What is required, set otherwise than the template; null takes a requirement away. */
  requirements?: RequirementChanges;
}

/** A path into the changes, dotted: `parts.contents`, `requirements.words`. */
export type CompositionPath = string;

/** The requirements that are limits: how many words, words of the abstract, keywords at most; nothing or nought for none. */
export const LIMITS = ['words', 'abstractWords', 'keywords'] as const;
export type Limit = (typeof LIMITS)[number];

/**
 * The parts the core makes wherever there is something to make them of,
 * whatever the template says, as it has them now: the text, which is never
 * left out; the notes, which the layout places; and the bibliography, which
 * stands at the end where the template gives it no place. They are never
 * taken out, so that the template as used says what the document is.
 */
export const ALWAYS_MADE: readonly GeneratedPart[] = ['body', 'notes', 'bibliography'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function copy<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

/** Every path that is set, to a leaf. */
export function compositionPaths(changes: CompositionChanges | undefined): CompositionPath[] {
  return pathsOf(changes as LookChanges | undefined);
}

/** The changes with a value at a path, and the objects on the way to it; those given are not touched. */
export function withCompositionPath(
  changes: CompositionChanges | undefined,
  path: CompositionPath,
  value: unknown,
): CompositionChanges {
  const out = copy(changes) ?? {};
  setAt(out, path, value);
  return out;
}

/** The changes without one path, and without the objects above it it leaves empty. */
export function withoutCompositionPath(
  changes: CompositionChanges | undefined,
  path: CompositionPath,
): CompositionChanges {
  return withoutPath(changes as LookChanges | undefined, path) as CompositionChanges;
}

/** Whether the template as used has a generated part. */
export function hasPart(template: Template, part: GeneratedPart): boolean {
  return template.contents.some((item) => 'part' in item && item.part === part);
}

/**
 * Puts a part into the contents before the first part that comes later in
 * the usual order, passing over the kinds of elements; else at the end.
 */
function putIn(contents: ContentsItem[], part: GeneratedPart) {
  const rank = GENERATED_PARTS.indexOf(part);
  const at = contents.findIndex(
    (item) => 'part' in item && GENERATED_PARTS.indexOf(item.part) > rank,
  );
  contents.splice(at < 0 ? contents.length : at, 0, { part });
}

/** A thing of a document in the order it is printed: a part the core makes, on or off, or a kind of element. */
export type Printed = { part: GeneratedPart; on: boolean } | { kind: string };

/**
 * Everything a document type is made of, in the order it is printed, as
 * the core orders a document (`export/mod.rs`, `order`): the type's
 * contents as they stand; each part the core makes that is off where it
 * would stand turned on; then the kinds the type names and does not place,
 * by their place, a kind of the front before the text and the others after
 * everything, the cover's and those printed nowhere last. A kind listed
 * twice is listed once.
 */
export function printOrder(
  template: Template,
  placeOf: (kind: string) => PartPlace | null | undefined,
): Printed[] {
  const contents: ContentsItem[] = [];
  const kinds = new Set<string>();
  for (const item of template.contents) {
    if ('kind' in item) {
      if (kinds.has(item.kind)) continue;
      kinds.add(item.kind);
    } else if (contents.some((c) => 'part' in c && c.part === item.part)) continue;
    contents.push(item);
  }
  const on = new Set(contents.flatMap((c) => ('part' in c ? [c.part] : [])));
  for (const part of GENERATED_PARTS) if (!on.has(part)) putIn(contents, part);
  const out: Printed[] = contents.map((c) =>
    'part' in c ? { part: c.part, on: on.has(c.part) || ALWAYS_MADE.includes(c.part) } : c,
  );
  const unplaced = template.kinds.filter(
    (k, i) => !kinds.has(k) && template.kinds.indexOf(k) === i,
  );
  const front = unplaced.filter((k) => placeOf(k) === 'front').map((kind) => ({ kind }));
  const body = out.findIndex((p) => 'part' in p && p.part === 'body');
  out.splice(body < 0 ? out.length : body, 0, ...front);
  const last = (k: string) => placeOf(k) === 'cover' || placeOf(k) === 'none';
  out.push(...unplaced.filter((k) => placeOf(k) !== 'front' && !last(k)).map((kind) => ({ kind })));
  out.push(...unplaced.filter(last).map((kind) => ({ kind })));
  return out;
}

/**
 * A copy of the template with the changes laid over it: a part turned on is
 * put into `contents` before the first part that comes later in
 * GENERATED_PARTS (kind items are passed over), or at the end; a part turned
 * off is taken out, but for those always made; the requirements are set,
 * null (or nought, for a limit) meaning none. What the changes hold that is
 * not of their shape, as a file written by hand may, is passed over.
 */
export function composed(template: Template, changes: CompositionChanges | undefined): Template {
  const out = copy(template);
  const parts: Record<string, unknown> = changes && isObject(changes.parts) ? changes.parts : {};
  for (const part of GENERATED_PARTS) {
    if (parts[part] === true && !hasPart(out, part)) putIn(out.contents, part);
    else if (parts[part] === false && !ALWAYS_MADE.includes(part))
      out.contents = out.contents.filter((item) => !('part' in item && item.part === part));
  }
  const asked: Record<string, unknown> =
    changes && isObject(changes.requirements) ? changes.requirements : {};
  for (const limit of LIMITS) {
    const value = asked[limit];
    if (value === null) out.requirements[limit] = null;
    else if (typeof value === 'number' && Number.isFinite(value) && value >= 0)
      out.requirements[limit] = value || null;
  }
  if (asked.anonymous === null) out.requirements.anonymous = false;
  else if (typeof asked.anonymous === 'boolean') out.requirements.anonymous = asked.anonymous;
  return out;
}
