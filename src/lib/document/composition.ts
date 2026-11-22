/**
 * What a document sets otherwise than its template (ADR 0054): what is
 * required, each present only where it is set. (The parts the core makes
 * were turned on and off here once; they are elements now, ADR 0118, and
 * what a document says of them is kept and not read.) As the changes of a document to its layout are
 * (`look/changes.ts`), the changes of an element are laid over those of the
 * elements above it, path by path (`Project.compositionOf`), and the result
 * over the template: that is the template the preview, every export and the
 * checklist are made with (`templateUsed`). The core is given the template
 * as it is to be used, and knows nothing of changes.
 *
 * Pure: no words of the interface, nothing reactive, so that the model and
 * the Org form can use it.
 */

import type { GeneratedPart, Template } from '$lib/api/templates';
import { pathsOf, setAt, withoutPath, type LookChanges } from '$lib/look/changes';

/** What is required, set otherwise than the template; null takes a requirement away. */
export interface RequirementChanges {
  words?: number | null;
  abstractWords?: number | null;
  keywords?: number | null;
  anonymous?: boolean | null;
}

/** What a document sets otherwise than its template, each present only where set. */
export interface CompositionChanges {
  /** As documents had it before ADR 0118; kept where it is, and read by nothing. */
  parts?: Partial<Record<GeneratedPart, boolean>>;
  /** What is required, set otherwise than the template; null takes a requirement away. */
  requirements?: RequirementChanges;
}

/** A path into the changes, dotted: `parts.contents`, `requirements.words`. */
export type CompositionPath = string;

/** The requirements that are limits: how many words, words of the abstract, keywords at most; nothing or nought for none. */
export const LIMITS = ['words', 'abstractWords', 'keywords'] as const;
export type Limit = (typeof LIMITS)[number];

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

/**
 * The kinds of elements a document type suggests, in its usual order (ADR
 * 0118): what its contents list, a part Glaukopis makes by the kind of
 * element that places it, then the kinds it names without listing them.
 * The text and the notes are of no kind. Each once.
 */
export function suggestedParts(template: Template): string[] {
  const out: string[] = [];
  const put = (kind: string) => {
    if (!out.includes(kind)) out.push(kind);
  };
  for (const item of template.contents) {
    if ('kind' in item) put(item.kind);
    else if (item.part !== 'body' && item.part !== 'notes') put(item.part);
  }
  for (const kind of template.kinds) put(kind);
  return out;
}

/**
 * A copy of the template with the changes laid over it: the requirements
 * are set, null (or nought, for a limit) meaning none. What the changes
 * hold that is not of their shape, as a file written by hand may, is passed
 * over; so are the parts a document once turned on and off, which are
 * elements now and printed where they stand (ADR 0118).
 */
export function composed(template: Template, changes: CompositionChanges | undefined): Template {
  const out = copy(template);
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
