/** The library as the interface holds it: summaries of all entries, and the collections. */

import {
  libraryList,
  libraryRefresh,
  type Collection,
  type LibraryListing,
  type Reference,
  type Summary,
} from '$lib/api/library';
import { t } from '$lib/i18n';
import { notifyError } from '$lib/ui/toast.svelte';

export type SortKey = 'authors' | 'year' | 'title' | 'added' | 'modified';

class LibraryState {
  entries = $state.raw<Summary[]>([]);
  collections = $state.raw<Collection[]>([]);
  warnings = $state.raw<string[]>([]);
  file = $state('');
  loaded = $state(false);
  /** Rises with every change, for those who keep copies of entries. */
  revision = $state(0);

  #byId = $derived(new Map(this.entries.map((e) => [e.id, e])));
  #loading: Promise<void> | null = null;

  get(id: string): Summary | undefined {
    return this.#byId.get(id);
  }

  collection(id: string | null | undefined): Collection | undefined {
    return id ? this.collections.find((c) => c.id === id) : undefined;
  }

  /** Entries of a collection and of those within it. */
  idsIn(collectionId: string): Set<string> {
    const ids = new Set<string>();
    const walk = (id: string) => {
      const c = this.collections.find((x) => x.id === id);
      if (!c) return;
      for (const e of c.entries) ids.add(e);
      for (const child of this.collections) if (child.parent === id) walk(child.id);
    };
    walk(collectionId);
    return ids;
  }

  #take(listing: LibraryListing) {
    this.entries = listing.entries;
    this.collections = listing.collections;
    this.warnings = listing.warnings;
    this.file = listing.file;
    this.loaded = true;
    this.revision++;
  }

  load(): Promise<void> {
    if (this.loaded) return Promise.resolve();
    return this.reload();
  }

  reload(): Promise<void> {
    if (!this.#loading) {
      this.#loading = libraryList()
        .then((listing) => this.#take(listing))
        .catch((error) => {
          notifyError(t('library-unread'), error);
        })
        .finally(() => {
          this.#loading = null;
        });
    }
    return this.#loading;
  }

  /** Takes up changes made to the library file from outside. */
  async checkForChanges() {
    if (!this.loaded) return;
    try {
      const listing = await libraryRefresh();
      if (listing) this.#take(listing);
    } catch (error) {
      notifyError(t('library-unread'), error);
    }
  }

  /** After an entry was added or changed. */
  put(reference: Reference) {
    const i = this.entries.findIndex((e) => e.id === reference.id);
    if (i >= 0) {
      const next = this.entries.slice();
      next[i] = reference.summary;
      this.entries = next;
    } else {
      this.entries = [...this.entries, reference.summary];
    }
    this.revision++;
  }

  forget(ids: string[]) {
    const gone = new Set(ids);
    this.entries = this.entries.filter((e) => !gone.has(e.id));
    this.collections = this.collections.map((c) =>
      c.entries.some((e) => gone.has(e))
        ? { ...c, entries: c.entries.filter((e) => !gone.has(e)) }
        : c,
    );
    this.revision++;
  }

  setCollections(collections: Collection[]) {
    this.collections = collections;
  }
}

export const library = new LibraryState();

/** Lower case and without diacritics, as the search text of entries is. */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/ł/g, 'l')
    .replace(/ς/g, 'σ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Entries that hold every word of the query, as a word or the beginning of one. */
export function search(entries: Summary[], query: string): Summary[] {
  const words = fold(query).split(' ').filter(Boolean);
  if (!words.length) return entries;
  return entries.filter((e) => {
    const hay = ' ' + e.search;
    return words.every((w) => hay.includes(' ' + w));
  });
}

export function sortEntries(entries: Summary[], key: SortKey, descending: boolean): Summary[] {
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  const text = (a: string, b: string) => {
    // Entries without the value go last, whatever the direction.
    if (!a && b) return descending ? -1 : 1;
    if (a && !b) return descending ? 1 : -1;
    return collator.compare(a, b);
  };
  const byAuthor = (a: Summary, b: Summary) =>
    text(a.authorsSort, b.authorsSort) ||
    (a.yearNumber ?? 0) - (b.yearNumber ?? 0) ||
    text(a.title, b.title);
  const compare: Record<SortKey, (a: Summary, b: Summary) => number> = {
    authors: byAuthor,
    year: (a, b) => {
      if (a.yearNumber == null && b.yearNumber != null) return descending ? -1 : 1;
      if (a.yearNumber != null && b.yearNumber == null) return descending ? 1 : -1;
      return (a.yearNumber ?? 0) - (b.yearNumber ?? 0) || byAuthor(a, b);
    },
    title: (a, b) => text(a.title, b.title) || byAuthor(a, b),
    added: (a, b) => a.added.localeCompare(b.added),
    modified: (a, b) => a.modified.localeCompare(b.modified),
  };
  const sorted = entries.slice().sort(compare[key]);
  return descending ? sorted.reverse() : sorted;
}
