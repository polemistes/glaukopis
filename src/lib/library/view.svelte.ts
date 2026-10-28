/**
 * The view of the references as it was left, kept while the application
 * runs, so that one comes back from a file or a project to the library as it
 * was: the word searched for, the filters, the order, and how far the list
 * was scrolled. The collection and the entry are in the place (`router`).
 */

import type { SortKey } from '$lib/state/library.svelte';
import { noFilters, type Filters } from './filters';

class LibraryUi {
  query = $state('');
  filters = $state<Filters>({ ...noFilters });
  sortKey = $state<SortKey>('authors');
  descending = $state(false);
  /** How far the list was scrolled, read and written by the list itself. */
  scroll = { top: 0 };
}

export const libraryUi = new LibraryUi();
