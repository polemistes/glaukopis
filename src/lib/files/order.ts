/**
 * The orders the lists of files are shown in. A list is sorted when the
 * files or the order change, and what is searched for is filtered out of
 * the sorted list, which keeps its order: sorted again with each letter
 * typed in the search, a list of thousands of files made the field stutter.
 */

import type { FileView } from '$lib/api/files';
import { referenceWords } from './store.svelte';

export type FileSortKey = 'name' | 'kind' | 'added' | 'size' | 'reference';

/** One for all the lists: made once, not for every sort. */
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

const byName = (a: FileView, b: FileView) => collator.compare(a.name, b.name);

const KINDS: FileView['kind'][] = ['pdf', 'picture', 'document', 'other'];

/**
 * The files in an order of the files view. By reference, the words of each
 * file's first reference are made once, not twice for every comparison,
 * and the files with no reference go last, whatever the direction.
 */
export function sortFiles(
  files: readonly FileView[],
  key: FileSortKey,
  descending: boolean,
): FileView[] {
  if (key === 'reference') {
    const words = new Map<FileView, string | null>();
    for (const f of files) words.set(f, f.references[0] ? referenceWords(f.references[0]) : null);
    return files.slice().sort((a, b) => {
      const x = words.get(a)!;
      const y = words.get(b)!;
      if (x === null || y === null)
        return (x !== null ? -1 : 0) + (y !== null ? 1 : 0) || byName(a, b);
      const said = collator.compare(x, y) || byName(a, b);
      return descending ? -said : said;
    });
  }
  const compare: Record<Exclude<FileSortKey, 'reference'>, (a: FileView, b: FileView) => number> = {
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
