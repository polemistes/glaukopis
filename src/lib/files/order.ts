/**
 * The orders the lists of files are shown in. A list is sorted when the
 * files or the order change, and what is searched for is filtered out of
 * the sorted list, which keeps its order: sorted again with each letter
 * typed in the search, a list of thousands of files made the field stutter.
 */

import type { FileView } from '$lib/api/files';
import type { Summary } from '$lib/api/library';
import { referenceWords } from './store.svelte';

export type FileSortKey =
  'name' | 'kind' | 'added' | 'size' | 'reference' | 'year' | 'title' | 'publisher';

/** The orders by what a file's reference says (ADR 0073). */
type ByReference = Extract<FileSortKey, 'reference' | 'year' | 'title' | 'publisher'>;

/** One for all the lists: made once, not for every sort. */
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

const byName = (a: FileView, b: FileView) => collator.compare(a.name, b.name);

const KINDS: FileView['kind'][] = ['pdf', 'picture', 'document', 'other'];

/**
 * What a reference is ordered by, in each order of it, given its people and
 * year as the line of a file names it; none where it says nothing.
 */
const OF_REFERENCE: Record<ByReference, (s: Summary, words: string) => string | number | null> = {
  reference: (_, words) => words,
  year: (s) => s.yearNumber,
  title: (s) => s.title || null,
  publisher: (s) => s.publisher || null,
};

const isByReference = (key: FileSortKey): key is ByReference => key in OF_REFERENCE;

/**
 * The files in an order of the files view. By what their references say,
 * the words of each file's first reference are made once, not twice for
 * every comparison, and the files whose references say nothing of it, or
 * that have none, go last, whatever the direction; files alike in it stand
 * by their people, then by their names.
 */
export function sortFiles(
  files: readonly FileView[],
  key: FileSortKey,
  descending: boolean,
): FileView[] {
  if (isByReference(key)) {
    const of = OF_REFERENCE[key];
    const said = new Map<FileView, { value: string | number | null; people: string }>();
    for (const f of files) {
      const r = f.references[0];
      const people = r ? referenceWords(r) : '';
      said.set(f, r ? { value: of(r, people), people } : { value: null, people });
    }
    return files.slice().sort((a, b) => {
      const x = said.get(a)!;
      const y = said.get(b)!;
      if (x.value === null || y.value === null)
        return (x.value !== null ? -1 : 0) + (y.value !== null ? 1 : 0) || byName(a, b);
      const first =
        typeof x.value === 'number' && typeof y.value === 'number'
          ? x.value - y.value
          : collator.compare(String(x.value), String(y.value));
      const order = first || collator.compare(x.people, y.people) || byName(a, b);
      return descending ? -order : order;
    });
  }
  const compare: Record<Exclude<FileSortKey, ByReference>, (a: FileView, b: FileView) => number> = {
    name: byName,
    // The kinds in the order the filter names them: PDF, image, document, other.
    kind: (a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind) || byName(a, b),
    added: (a, b) => a.added.localeCompare(b.added) || byName(a, b),
    size: (a, b) => a.size - b.size || byName(a, b),
  };
  const sorted = files.slice().sort(compare[key]);
  return descending ? sorted.reverse() : sorted;
}

/** The files to choose for a reference: those that belong to none first, then by name. */
export function forChoosing(files: readonly FileView[]): FileView[] {
  return files
    .slice()
    .sort(
      (a, b) => Number(a.references.length > 0) - Number(b.references.length > 0) || byName(a, b),
    );
}
