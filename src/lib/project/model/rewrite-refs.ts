/**
 * The works a project cites, read from every piece of its text, and
 * written anew: for a project made of a project file, whose works this
 * library may have under other ids than the file (ADR 0036), and for the
 * file itself, which carries the works as the library has them.
 *
 * Citations stand in the names and the texts of elements, and within them
 * in notes and in the captions of figures: each is a `citation` whose
 * `items` name the works by their ids.
 */

import * as Y from 'yjs';
import type { Project } from './project.svelte';
import { TIDY } from './origins';
import type { RefRecord } from './types';

/** The names and texts of the elements of a project. */
function* fragments(project: Project): Generator<Y.XmlFragment> {
  for (const node of project.yNodes.values()) {
    if (!(node instanceof Y.Map)) continue;
    for (const value of node.values()) if (value instanceof Y.XmlFragment) yield value;
  }
}

/** The citations within a piece of text, however deep. */
function* citations(fragment: Y.XmlFragment): Generator<Y.XmlElement> {
  for (const child of fragment.toArray()) {
    if (!(child instanceof Y.XmlElement)) continue;
    if (child.nodeName === 'citation') yield child;
    else yield* citations(child);
  }
}

/** What a citation cites, as the document holds it. */
function itemsOf(citation: Y.XmlElement): { id: string }[] {
  const items = citation.getAttribute('items') as unknown;
  return Array.isArray(items)
    ? (items as { id: unknown }[]).filter((i): i is { id: string } => typeof i?.id === 'string')
    : [];
}

/** The ids of the works cited anywhere in the project. */
export function citedIds(project: Project): Set<string> {
  const out = new Set<string>();
  for (const fragment of fragments(project))
    for (const citation of citations(fragment))
      for (const item of itemsOf(citation)) out.add(item.id);
  return out;
}

/** The records of the works cited, as the project keeps them; those it keeps none of are left out. */
export function citedRecords(project: Project): RefRecord[] {
  const out: RefRecord[] = [];
  for (const id of citedIds(project)) {
    const record = project.yRefs.get(id);
    if (record) out.push({ ...record, id });
  }
  return out;
}

/** A work cited by the id `from`, to be cited by `to`, and kept as `record` says, where it says. */
export interface Rewrite {
  from: string;
  to: string;
  record: RefRecord | null;
}

/**
 * Cites each work by the id it is to be cited by, everywhere, and keeps
 * its record, and what the project says of it, under that id. One change,
 * which is saved and not undone: it is no writing of the user's.
 */
export function rewriteReferences(project: Project, rewrites: Rewrite[]) {
  const to = new Map(rewrites.filter((r) => r.from !== r.to).map((r) => [r.from, r.to]));
  project.doc.transact(() => {
    if (to.size) {
      for (const fragment of fragments(project)) {
        for (const citation of citations(fragment)) {
          const items = citation.getAttribute('items') as unknown;
          if (!Array.isArray(items)) continue;
          const touched = (items as { id?: unknown }[]).some(
            (i) => typeof i?.id === 'string' && to.has(i.id),
          );
          if (!touched) continue;
          const written = (items as { id?: unknown }[]).map((i) =>
            typeof i?.id === 'string' && to.has(i.id) ? { ...i, id: to.get(i.id) } : i,
          );
          citation.setAttribute('items', written as unknown as string);
        }
      }
    }
    for (const { from, to: id } of rewrites) {
      if (from === id) continue;
      const kept = project.yRefs.get(from);
      project.yRefs.delete(from);
      if (kept && !project.yRefs.has(id)) project.yRefs.set(id, { ...kept, id });
      // What the project says of the work goes with it; where two become one, both are kept.
      const note = project.yNotes.get(from);
      if (note instanceof Y.Text) {
        const text = note.toString();
        project.yNotes.delete(from);
        const there = project.yNotes.get(id);
        if (there instanceof Y.Text) {
          if (text.trim()) there.insert(there.length, there.length ? `\n\n${text}` : text);
        } else if (text.trim()) {
          project.yNotes.set(id, new Y.Text(text));
        }
      }
    }
    for (const { to: id, record } of rewrites) if (record) project.yRefs.set(id, { ...record, id });
  }, TIDY);
}

/**
 * Keeps the records given as the records of the works they are of, whether
 * or not they are later than those the project has: as the library has
 * them, where a project is written to a file. Not undone.
 */
export function keepRecords(project: Project, records: RefRecord[]) {
  if (!records.length) return;
  project.doc.transact(() => {
    for (const record of records) project.yRefs.set(record.id, record);
  }, TIDY);
}
