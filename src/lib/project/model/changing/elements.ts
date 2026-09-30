/**
 * Changing the elements of a map: adding them, naming them, setting what is
 * said of them, moving, copying and removing them. These are methods of
 * `Project`, which takes them in (see there).
 */

import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import { newId } from '$lib/util/id';
import { str, type YNode } from '../origins';
import type { Project } from '../project.svelte';
import { fillBody, fillTitle } from '../text';
import { isAncestor, subtree, topmost } from '../tree';
import type { NodeRecord, Position } from '../types';
import { makeLink } from './links';

/** A key that sorts between two siblings. `siblings` is the list the element will join, without it. */
export function keyAt(p: Project, siblings: string[], index: number): string {
  const at = Math.max(0, Math.min(index, siblings.length));
  const before = at > 0 ? order(p, siblings[at - 1]) : null;
  const after = at < siblings.length ? order(p, siblings[at]) : null;
  if (before !== null && after !== null && before >= after) {
    // Keys made at the same moment by two people can be equal. Give the
    // whole list fresh keys, leaving room for the newcomer.
    const keys = generateNKeysBetween(null, null, siblings.length + 1);
    siblings.forEach((id, i) => {
      const n = p.yNodes.get(id);
      if (n) n.set('order', keys[i < at ? i : i + 1]);
    });
    return keys[at];
  }
  try {
    return generateKeyBetween(before, after);
  } catch {
    return generateKeyBetween(before, null);
  }
}

function order(p: Project, id: string): string {
  return str(p.yNodes.get(id)?.get('order'), 'a0');
}

export function makeNode(
  p: Project,
  id: string,
  init: {
    map: string;
    parent: string | null;
    order: string;
    title?: string;
    body?: string;
    pos?: Position | null;
  },
): YNode {
  const n = new Y.Map<unknown>();
  n.set('map', init.map);
  n.set('parent', init.parent);
  n.set('order', init.order);
  if (init.pos) n.set('pos', init.pos);
  const title = new Y.XmlFragment();
  const body = new Y.XmlFragment();
  n.set('title', title);
  n.set('body', body);
  p.yNodes.set(id, n);
  fillTitle(title, init.title ?? '');
  if (init.body) fillBody(body, init.body);
  return n;
}

export function cloneNode(
  p: Project,
  from: string,
  id: string,
  change: { map: string; parent: string | null; origin?: NodeRecord['origin']; order?: string },
): YNode {
  const source = p.yNodes.get(from)!;
  const n = new Y.Map<unknown>();
  for (const [key, value] of source) {
    if (key === 'title' || key === 'body') continue;
    n.set(key, value instanceof Y.AbstractType ? value.clone() : structuredClone(value));
  }
  n.set('map', change.map);
  n.set('parent', change.parent);
  if (change.order) n.set('order', change.order);
  // What the original is now is kept with the copy, to tell whether it changes.
  const print = p.fingerprint(from);
  if (change.origin) n.set('origin', print ? { ...change.origin, print } : change.origin);
  for (const key of ['title', 'body'] as const) {
    const f = source.get(key);
    n.set(key, f instanceof Y.XmlFragment ? f.clone() : new Y.XmlFragment());
  }
  p.yNodes.set(id, n);
  return n;
}

/** Copies the links among a set of copied elements. */
export function cloneLinks(p: Project, ids: Map<string, string>) {
  for (const l of p.links) {
    const from = ids.get(l.from);
    const to = ids.get(l.to);
    if (from && to) makeLink(p, from, to, l.label);
  }
}

function set(p: Project, id: string, key: string, value: unknown, absentWhen: unknown) {
  const n = p.yNodes.get(id);
  if (!n) return;
  p.transact(() => {
    if (value === absentWhen || value === null || value === undefined) n.delete(key);
    else n.set(key, value);
  });
}

/**
 * The element an item makes up: the element itself, or one of its parts
 * (its name, its text, where it stands). Not what is written within them.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function elementOf(p: Project, item: Y.Item): Y.AbstractType<any> | null {
  if (item.parent === p.yNodes)
    return item.content instanceof Y.ContentType ? item.content.type : null;
  const parent = item.parent;
  return parent instanceof Y.Map && parent._item?.parent === p.yNodes ? parent : null;
}

export function deleteNodes(p: Project, ids: Set<string>) {
  for (const id of ids) p.yNodes.delete(id);
  for (const [linkId, l] of p.yLinks) {
    if (ids.has(str(l.get('from'))) || ids.has(str(l.get('to')))) p.yLinks.delete(linkId);
  }
}

export const elementChanges = {
  /** Adds an element under another. `index` is its place among the children; at the end when absent. */
  addChild(
    this: Project,
    parentId: string,
    options: { title?: string; body?: string; index?: number } = {},
  ): string | null {
    const parent = this.node(parentId);
    if (!parent) return null;
    const tree = this.tree(parent.map);
    const siblings = tree.children.get(parentId) ?? [];
    const id = newId();
    this.transact(() => {
      const order = keyAt(this, siblings, options.index ?? siblings.length);
      makeNode(this, id, {
        map: parent.map,
        parent: parentId,
        order,
        title: options.title,
        body: options.body,
      });
      const p = this.yNodes.get(parentId);
      if (p?.get('collapsed') === true) p.delete('collapsed');
    });
    return id;
  },

  /** Adds an element after another, under the same parent. After the centre, adds a child. */
  addSibling(
    this: Project,
    nodeId: string,
    options: { title?: string; before?: boolean } = {},
  ): string | null {
    const node = this.node(nodeId);
    if (!node) return null;
    const tree = this.tree(node.map);
    const parentId = tree.parent.get(nodeId) ?? null;
    if (nodeId === tree.root) return this.addChild(nodeId, options);
    if (parentId === null) {
      // Beside a loose element: another loose element, below it.
      const pos = node.pos ?? { x: 0, y: 0 };
      return this.addLoose(node.map, { x: pos.x, y: pos.y + 70 }, options.title);
    }
    const siblings = tree.children.get(parentId) ?? [];
    const index = siblings.indexOf(nodeId) + (options.before ? 0 : 1);
    const id = newId();
    this.transact(() => {
      makeNode(this, id, {
        map: node.map,
        parent: parentId,
        order: keyAt(this, siblings, index),
        title: options.title,
      });
    });
    return id;
  },

  /** Adds an element that is attached to nothing. */
  addLoose(this: Project, mapId: string, pos: Position, title?: string): string | null {
    if (!this.yMaps.has(mapId)) return null;
    const tree = this.tree(mapId);
    const id = newId();
    this.transact(() => {
      makeNode(this, id, {
        map: mapId,
        parent: null,
        order: keyAt(this, tree.loose, tree.loose.length),
        title,
        pos: { x: Math.round(pos.x), y: Math.round(pos.y) },
      });
    });
    return id;
  },

  /**
   * The name of an element as it stands, with its marks: to be put back,
   * once, by `restoreTitle`. A copy that is not in a document cannot be
   * copied again: its content would be lost.
   */
  copyTitle(this: Project, id: string): (Y.XmlElement | Y.XmlText)[] | null {
    const f = this.fragment(id, 'title');
    return f ? f.toArray().map((part) => (part as Y.XmlElement | Y.XmlText).clone()) : null;
  },

  /** Puts back a name that `copyTitle` kept. */
  restoreTitle(this: Project, id: string, copy: (Y.XmlElement | Y.XmlText)[]) {
    const f = this.fragment(id, 'title');
    if (!f) return;
    this.transact(() => {
      f.delete(0, f.length);
      f.insert(0, copy);
    });
  },

  /** Replaces the name of an element by plain text. */
  setTitle(this: Project, id: string, text: string) {
    const f = this.fragment(id, 'title');
    if (!f) return;
    const clean = text.replace(/\s+/g, ' ').trim();
    if (clean === this.node(id)?.title) return;
    this.transact(() => fillTitle(f, clean));
  },

  setPosition(this: Project, id: string, pos: Position | null) {
    set(this, id, 'pos', pos ? { x: Math.round(pos.x), y: Math.round(pos.y) } : null, null);
  },

  setCollapsed(this: Project, id: string, collapsed: boolean) {
    set(this, id, 'collapsed', collapsed, false);
  },

  setHeading(this: Project, id: string, heading: boolean) {
    set(this, id, 'heading', heading, true);
  },

  setExcluded(this: Project, id: string, excluded: boolean) {
    set(this, id, 'excluded', excluded, false);
  },

  /** Whether including `mapId` in an element of `inMap` would make a map include itself. */
  wouldLoop(this: Project, inMap: string, mapId: string): boolean {
    if (inMap === mapId) return true;
    const seen = new Set<string>();
    const visit = (m: string): boolean => {
      if (m === inMap) return true;
      if (seen.has(m)) return false;
      seen.add(m);
      for (const n of this.nodes.values()) {
        if (n.map === m && n.include && visit(n.include)) return true;
      }
      return false;
    };
    return visit(mapId);
  },

  /** Makes an element stand for another map in the document. Returns false when that would loop. */
  setInclude(this: Project, id: string, mapId: string | null): boolean {
    const node = this.node(id);
    if (!node) return false;
    if (mapId && (!this.yMaps.has(mapId) || this.wouldLoop(node.map, mapId))) return false;
    set(this, id, 'include', mapId, null);
    return true;
  },

  /** Removes the positions the user gave, so that the branch is laid out automatically. */
  tidy(this: Project, ids: string[]) {
    this.transact(() => {
      for (const top of ids) {
        const node = this.node(top);
        if (!node) continue;
        const tree = this.tree(node.map);
        for (const id of subtree(tree, top)) {
          const parent = tree.parent.get(id) ?? null;
          // The centre and loose elements keep their place: they have no other.
          if (parent === null) continue;
          this.yNodes.get(id)?.delete('pos');
        }
      }
    });
  },

  /**
   * Moves elements, with all under them, to a parent (or to none: loose), at a
   * place among its children. Elements cannot be moved under themselves.
   * Returns the ids that were moved.
   */
  move(
    this: Project,
    ids: string[],
    parentId: string | null,
    index?: number,
    options: { pos?: Position | null; map?: string } = {},
  ): string[] {
    const first = this.node(ids[0]);
    if (!first) return [];
    const sourceMap = first.map;
    const targetMap = parentId
      ? (this.node(parentId)?.map ?? sourceMap)
      : (options.map ?? sourceMap);
    const sourceTree = this.tree(sourceMap);
    const targetTree = this.tree(targetMap);
    const movable = topmost(
      sourceTree,
      ids.filter((id) => this.node(id)?.map === sourceMap),
    ).filter(
      (id) =>
        id !== sourceTree.root &&
        id !== parentId &&
        !(parentId && sourceMap === targetMap && isAncestor(sourceTree, id, parentId)),
    );
    if (!movable.length) return [];

    this.transact(() => {
      const moving = new Set(movable);
      const list = parentId ? (targetTree.children.get(parentId) ?? []) : targetTree.loose;
      // Where in the list, counted without those that are moving.
      let at = index ?? list.length;
      at -= list.slice(0, at).filter((id) => moving.has(id)).length;
      const siblings = list.filter((id) => !moving.has(id));

      movable.forEach((id, i) => {
        const n = this.yNodes.get(id)!;
        const order = keyAt(this, siblings, at + i);
        siblings.splice(at + i, 0, id);
        if (n.get('parent') !== parentId) n.set('parent', parentId);
        n.set('order', order);
        if (options.pos !== undefined) {
          if (options.pos) {
            n.set('pos', { x: Math.round(options.pos.x), y: Math.round(options.pos.y + i * 60) });
          } else n.delete('pos');
        } else if (parentId === null && !n.get('pos')) {
          n.set('pos', { x: 0, y: 0 });
        }
        n.delete('side');
        if (targetMap !== sourceMap) {
          for (const d of subtree(sourceTree, id)) this.yNodes.get(d)?.set('map', targetMap);
        }
      });
      if (parentId) {
        const p = this.yNodes.get(parentId);
        if (p?.get('collapsed') === true) p.delete('collapsed');
      }
    });
    return movable;
  },

  /**
   * Copies elements, with all under them, to a parent in any map (or to none:
   * loose, in `options.map`). Each copy remembers what it was copied from.
   * Returns the ids of the copies of the elements named.
   */
  copy(
    this: Project,
    ids: string[],
    parentId: string | null,
    index?: number,
    options: { pos?: Position | null; map?: string } = {},
  ): string[] {
    const first = this.node(ids[0]);
    if (!first) return [];
    const sourceTree = this.tree(first.map);
    const targetMap = parentId ? this.node(parentId)?.map : (options.map ?? first.map);
    if (!targetMap || !this.yMaps.has(targetMap)) return [];
    const targetTree = this.tree(targetMap);
    const tops = topmost(
      sourceTree,
      ids.filter((id) => this.node(id)?.map === first.map),
    );
    const made: string[] = [];

    this.transact(() => {
      const list = parentId ? (targetTree.children.get(parentId) ?? []) : targetTree.loose;
      const siblings = list.slice();
      let at = index ?? list.length;
      const map = new Map<string, string>();
      for (const top of tops) {
        for (const old of subtree(sourceTree, top)) map.set(old, newId());
      }
      for (const top of tops) {
        for (const old of subtree(sourceTree, top)) {
          const isTop = old === top;
          const oldParent = sourceTree.parent.get(old) ?? null;
          const copy = cloneNode(this, old, map.get(old)!, {
            map: targetMap,
            parent: isTop ? parentId : (map.get(oldParent!) ?? null),
            origin: { map: first.map, node: old },
            order: isTop ? keyAt(this, siblings, at) : undefined,
          });
          if (isTop) {
            siblings.splice(at, 0, map.get(old)!);
            at++;
            made.push(map.get(old)!);
            if (options.pos)
              copy.set('pos', {
                x: Math.round(options.pos.x),
                y: Math.round(options.pos.y + (made.length - 1) * 60),
              });
            else if (parentId === null) copy.set('pos', copy.get('pos') ?? { x: 0, y: 0 });
            else copy.delete('pos');
            copy.delete('side');
          }
        }
      }
      cloneLinks(this, map);
    });
    return made;
  },

  /**
   * Removes elements. With `keepChildren`, what is under them moves up to
   * their parent; otherwise it goes with them. The centre of a map cannot be
   * removed. Returns how many elements went.
   */
  remove(this: Project, ids: string[], options: { keepChildren?: boolean } = {}): number {
    const first = this.node(ids[0]);
    if (!first) return 0;
    const tree = this.tree(first.map);
    const doomed = new Set<string>();
    this.transact(() => {
      if (options.keepChildren) {
        for (const id of ids) {
          if (id === tree.root || !this.yNodes.has(id)) continue;
          const parent = tree.parent.get(id) ?? null;
          const children = tree.children.get(id) ?? [];
          const siblings = (parent ? (tree.children.get(parent) ?? []) : tree.loose).filter(
            (s) => s !== id,
          );
          const at = (parent ? (tree.children.get(parent) ?? []) : tree.loose).indexOf(id);
          children.forEach((c, i) => {
            const n = this.yNodes.get(c)!;
            n.set('parent', parent);
            n.set('order', keyAt(this, siblings, at + i));
            siblings.splice(at + i, 0, c);
            n.delete('pos');
            if (parent === null) n.set('pos', { x: 0, y: 0 });
          });
          doomed.add(id);
        }
      } else {
        for (const top of topmost(tree, ids)) {
          if (top === tree.root || !this.yNodes.has(top)) continue;
          for (const id of subtree(tree, top)) doomed.add(id);
        }
      }
      deleteNodes(this, doomed);
    });
    return doomed.size;
  },

  /**
   * The change of the original of a copy has been seen: the copy keeps what
   * the original is now, and is no longer said to be behind it.
   */
  settleCopy(this: Project, id: string) {
    const n = this.yNodes.get(id);
    const origin = n?.get('origin') as NodeRecord['origin'] | undefined;
    const print = origin ? this.fingerprint(origin.node) : null;
    if (!n || !origin || !print || origin.print === print) return;
    this.transact(() => n.set('origin', { ...origin, print }));
  },

  /** A copy takes the name and the text its original has now, in one step that undo takes back. */
  takeOriginal(this: Project, id: string) {
    const origin = this.node(id)?.origin;
    if (!origin || !this.node(origin.node)) return;
    this.transact(() => {
      for (const which of ['title', 'body'] as const) {
        const from = this.fragment(origin.node, which);
        const to = this.fragment(id, which);
        if (!from || !to) continue;
        to.delete(0, to.length);
        to.insert(
          0,
          from.toArray().map((part) => (part as Y.XmlElement | Y.XmlText).clone()),
        );
      }
    });
    // Then it is no longer behind its original.
    this.settleCopy(id);
  },
};
