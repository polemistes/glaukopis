/**
 * A map of the library, or of one collection: the collections as elements,
 * nested as they are, and under each the references it holds, every one an
 * element whose text is a citation of it. A project made of it has the
 * bibliography follow from the citations.
 */

import type { Collection, Summary } from '$lib/api/library';
import { t } from '$lib/i18n';
import { writeBody, writeName } from '$lib/project/model/blocks';
import type { Project } from '$lib/project/model/project.svelte';
import { sortEntries, type SortKey } from '$lib/state/library.svelte';

/** An element of the map to be: a collection, or a reference. */
export interface Part {
  /** The place in the list of the part this stands under; 0 is the centre. */
  under: number;
  title: string;
  /** The reference it stands for, where it is one. */
  reference?: string;
}

export interface Plan {
  name: string;
  parts: Part[];
  /** The ids of the references in it, each once. */
  cited: string[];
  collections: number;
  references: number;
}

/** "Nagy 1979 The Best of the Achaeans", as the list shows it. */
export function elementName(entry: Summary): string {
  return [entry.authors, entry.year, entry.title || t('library-untitled')]
    .filter(Boolean)
    .join(' ');
}

/**
 * Lays the map out. `root` is the collection the map is of, or null for the
 * whole library; the references that are in none of the collections shown
 * stand under the centre.
 */
export function planMap(
  name: string,
  root: Collection | null,
  collections: Collection[],
  entries: Summary[],
  sort: { key: SortKey; descending: boolean } = { key: 'authors', descending: false },
): Plan {
  const byId = new Map(entries.map((e) => [e.id, e]));
  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  const parts: Part[] = [{ under: 0, title: name }];
  const cited = new Set<string>();
  let shown = 0;

  const references = (ids: string[], under: number) => {
    const held = ids.flatMap((id) => {
      const e = byId.get(id);
      return e ? [e] : [];
    });
    for (const e of sortEntries(held, sort.key, sort.descending)) {
      parts.push({ under, title: elementName(e), reference: e.id });
      cited.add(e.id);
    }
  };
  const walk = (parent: string | null, under: number) => {
    const children = collections
      .filter((c) => (c.parent ?? null) === parent)
      .sort((a, b) => collator.compare(a.name, b.name));
    for (const c of children) {
      parts.push({ under, title: c.name });
      shown++;
      const at = parts.length - 1;
      references(c.entries, at);
      walk(c.id, at);
    }
  };

  if (root) {
    references(root.entries, 0);
    walk(root.id, 0);
  } else {
    // Those in no collection at all stand at the centre.
    const inSome = new Set(collections.flatMap((c) => c.entries));
    references(
      entries.filter((e) => !inSome.has(e.id)).map((e) => e.id),
      0,
    );
    walk(null, 0);
  }
  return {
    name,
    parts,
    cited: [...cited],
    collections: shown,
    references: parts.filter((p) => p.reference).length,
  };
}

/** Makes the map in the project, in one step that undo takes back as one. */
export function makeLibraryMap(project: Project, plan: Plan): { map: string; nodes: string[] } {
  project.checkpoint();
  const made = project.buildMap(plan.name, plan.parts, (i, title, body) => {
    const part = plan.parts[i];
    writeName(title, [{ kind: 'text', text: part.title, marks: {} }]);
    if (part.reference) {
      writeBody(body, [
        {
          kind: 'paragraph',
          content: [{ kind: 'citation', items: [{ id: part.reference }], mode: 'normal' }],
        },
      ]);
    }
  });
  project.checkpoint();
  return made;
}
