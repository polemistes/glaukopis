/**
 * The trees of projects that are not open, as the pane of projects shows
 * them under their rows (ADR 0037): read from disk as the search reads a
 * project, and changed in memory only. A project written before ADR 0037 is
 * read in the shape it opens in; nothing is written back. What is read is
 * kept, and read again only when the project's `modified` changes.
 */

import { SvelteMap } from 'svelte/reactivity';
import * as Y from 'yjs';
import { projectLoad, type ProjectInfo } from '$lib/api/projects';
import { migrate, needsMigration } from '$lib/project/model/migrate';
import { inlineText, readTitle } from '$lib/project/model/text';
import { buildTree, type FlatNode, type Tree } from '$lib/project/model/tree';
import type { Position } from '$lib/project/model/types';
import { projects } from '$lib/state/projects.svelte';

/** The tree of a project that is not open, and the name of each element. */
export interface ClosedTree {
  tree: Tree;
  names: Map<string, string>;
  /** Where each element was put by hand, from its parent, and whether it is folded: as its map shows it. */
  places: Map<string, { pos: Position | null; collapsed: boolean }>;
}

/** Reads the tree of a project from its state and the changes after it, as the disk keeps them. */
export function readTree(
  name: string,
  state: Uint8Array | null,
  updates: Uint8Array[],
): ClosedTree {
  const doc = new Y.Doc();
  if (state) Y.applyUpdate(doc, state);
  for (const update of updates) {
    try {
      Y.applyUpdate(doc, update);
    } catch {
      // A change that cannot be applied is left, as when the project is opened.
    }
  }
  if (needsMigration(doc)) migrate(doc, name);
  const flat: FlatNode[] = [];
  const names = new Map<string, string>();
  const places = new Map<string, { pos: Position | null; collapsed: boolean }>();
  for (const [id, n] of doc.getMap<Y.Map<unknown>>('nodes')) {
    if (!(n instanceof Y.Map)) continue;
    const order = n.get('order');
    flat.push({
      id,
      parent: (n.get('parent') as string | null | undefined) ?? null,
      order: typeof order === 'string' ? order : 'a0',
    });
    names.set(id, inlineText(readTitle(n.get('title') as Y.XmlFragment | undefined)).trim());
    const pos = n.get('pos') as Position | null | undefined;
    places.set(id, {
      pos: pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) ? { x: pos.x, y: pos.y } : null,
      collapsed: n.get('collapsed') === true,
    });
  }
  doc.destroy();
  return { tree: buildTree(flat), names, places };
}

export type Reading =
  | { state: 'reading'; modified: string }
  | { state: 'read'; modified: string; tree: ClosedTree }
  | { state: 'failed'; modified: string };

class ClosedTrees {
  #read = new SvelteMap<string, Reading>();
  /** The time of change of each project as it was last asked for: what is being read, or was. */
  #asked = new Map<string, string>();

  /** What is known of the tree of a project: nothing until it is asked for. */
  get(id: string): Reading | undefined {
    return this.#read.get(id);
  }

  /** Reads the tree of a project, unless what was read of it, or is being read, is as new as it is. */
  want(info: ProjectInfo) {
    const modified = info.modified;
    if (this.#asked.get(info.id) === modified) return;
    this.#asked.set(info.id, modified);
    // What was read before stays in view while the new is read.
    if (this.#read.get(info.id)?.state !== 'read') {
      this.#read.set(info.id, { state: 'reading', modified });
    }
    void (async () => {
      let reading: Reading;
      try {
        // A project that is being closed is read when it is on disk.
        await projects.closed(info.id);
        const loaded = await projectLoad(info.id);
        reading = {
          state: 'read',
          modified,
          tree: readTree(info.name, loaded.state, loaded.updates),
        };
      } catch (error) {
        console.error(error);
        reading = { state: 'failed', modified };
      }
      // Something newer was asked for meanwhile: its reading is kept.
      if (this.#asked.get(info.id) === modified) this.#read.set(info.id, reading);
    })();
  }
}

export const closedTrees = new ClosedTrees();
