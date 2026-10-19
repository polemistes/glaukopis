/**
 * The changes a document makes to its layout (ADR 0042): the values it sets
 * otherwise than the layout, with the shape of a layout, each present only
 * where it is set. The changes of an element are laid over those of the
 * elements above it, path by path, and the result over the layout: that is
 * the layout the preview, every export and the looks of kinds are made
 * with. A list (the levels of headings) is taken whole. Where the layout
 * says something of a kind and the document leaves it unsaid, the change
 * is `null`.
 *
 * Pure: no words of the interface, nothing reactive, so that the Org form
 * can use it.
 */

import type { DocumentFormat } from '$lib/api/documents';
import { read } from '$lib/ui/settings/rows';

/**
 * The look fields of a layout: everything but what names and describes it,
 * what it brings (`style`, `suggests`), and `lineNumbers`, which the
 * document sets by a setting of its own.
 */
export type LookFields = Omit<
  DocumentFormat,
  | 'id'
  | 'name'
  | 'kind'
  | 'description'
  | 'source'
  | 'basedOn'
  | 'style'
  | 'suggests'
  | 'lineNumbers'
  | 'limits'
>;

/** Objects partial all the way down; lists as they are, taken whole. */
export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> | null }
    : T;

/** The values a document sets otherwise than its layout, each present only where set. */
export type LookChanges = DeepPartial<LookFields>;

/** A path into a layout, dotted: `font.family`, `page.marginTop`, `headings.levels`, `kinds.quote.italic`. */
export type LookPath = string;

/** What a layout has that is not of its look, and is never a change. */
const NOT_LOOK = new Set([
  'id',
  'name',
  'kind',
  'description',
  'source',
  'basedOn',
  'style',
  'suggests',
  'lineNumbers',
  'limits',
]);

/**
 * What layouts said of the margins of the page before the header and the
 * footer (ADR 0057). Changes a document made under these names are passed
 * over: they were few, and days old.
 */
const OLD = new Set(['pageNumbers', 'runningHead']);

/** The changes already said to be passed over, so that the log says it once. */
const toldOld = new Set<string>();

/** Where a change left unsaid takes the measure away: the looks of kinds and of parts. */
const UNSAID_AWAY = /^(kinds|parts)\./;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function copy<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

/** Every path that is set, to a leaf; a list counts as one. */
export function pathsOf(changes: LookChanges | undefined): LookPath[] {
  const out: LookPath[] = [];
  const walk = (value: unknown, path: string) => {
    if (isObject(value)) {
      for (const [key, inner] of Object.entries(value)) {
        if (inner !== undefined) walk(inner, path ? `${path}.${key}` : key);
      }
    } else if (path && !OLD.has(path.split('.')[0])) out.push(path);
  };
  walk(changes, '');
  return out;
}

/** The value at a path; nothing where the way is not there. */
export function getAt(target: unknown, path: LookPath): unknown {
  return read(target, path);
}

/** Sets a value at a path, making the objects on the way. */
export function setAt<T extends object>(target: T, path: LookPath, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop()!;
  let at = target as Record<string, unknown>;
  for (const key of keys) {
    if (!isObject(at[key])) at[key] = {};
    at = at[key] as Record<string, unknown>;
  }
  at[last] = value;
}

/** Takes a path away, with the objects above it it leaves empty. */
function removeAt(target: Record<string, unknown>, path: LookPath) {
  const keys = path.split('.');
  const walk = (at: Record<string, unknown>, i: number) => {
    const key = keys[i];
    if (i === keys.length - 1) {
      delete at[key];
      return;
    }
    const inner = at[key];
    if (!isObject(inner)) return;
    walk(inner, i + 1);
    if (!Object.keys(inner).length) delete at[key];
  };
  walk(target, 0);
}

/** The changes without one path, and without the objects above it it leaves empty. */
export function withoutPath(changes: LookChanges | undefined, path: LookPath): LookChanges {
  const out = (copy(changes) ?? {}) as Record<string, unknown>;
  removeAt(out, path);
  return out as LookChanges;
}

/** A copy of a layout with changes laid over it, path by path; lists replaced whole. */
export function laidOver(layout: DocumentFormat, changes: LookChanges | undefined): DocumentFormat {
  const out = copy(layout) as DocumentFormat;
  const old = Object.keys((changes ?? {}) as object).filter((key) => OLD.has(key));
  if (old.length) {
    const said = JSON.stringify(old.map((key) => (changes as Record<string, unknown>)[key]));
    if (!toldOld.has(said)) {
      toldOld.add(said);
      console.info(
        `changes to ${old.join(' and ')}, of the shape before the header and the footer, passed over`,
      );
    }
  }
  for (const path of pathsOf(changes)) {
    if (NOT_LOOK.has(path.split('.')[0])) continue;
    const value = getAt(changes, path);
    if (value === null && UNSAID_AWAY.test(path)) removeAt(out as never, path);
    else setAt(out, path, copy(value));
  }
  // Levels of heading taken whole from before they said where they begin.
  for (const level of out.headings?.levels ?? []) {
    const was = level as typeof level & { newPage?: boolean };
    if (was.begins === undefined) was.begins = was.newPage ? 'page' : 'text';
    if (was.numbering === undefined) was.numbering = 'as-above';
    delete was.newPage;
  }
  return out;
}

/** Every leaf (a list whole) where a layout as used differs from the layout, as JSON compares them. */
export function changesBetween(layout: DocumentFormat, effective: DocumentFormat): LookChanges {
  const out: Record<string, unknown> = {};
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const walk = (was: unknown, is: unknown, path: string) => {
    if (isObject(is) || isObject(was)) {
      const a = isObject(was) ? was : {};
      const b = isObject(is) ? is : {};
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (!path && NOT_LOOK.has(key)) continue;
        walk(a[key], b[key], path ? `${path}.${key}` : key);
      }
      return;
    }
    if (same(was ?? null, is ?? null)) return;
    setAt(out, path, is === undefined ? null : copy(is));
  };
  walk(layout, effective, '');
  return out as LookChanges;
}

/** How many values the changes set. */
export function countOf(changes: LookChanges | undefined): number {
  return pathsOf(changes).length;
}
