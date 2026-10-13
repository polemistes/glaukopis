/**
 * Changing the elements of a project: adding them, naming them, setting
 * what is said of them, moving, copying and removing them, and making a
 * branch of them in one step. These are methods of `Project`, which takes
 * them in (see there).
 */

import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import { newId } from '$lib/util/id';
import { str, type YNode } from '../origins';
import type { Project } from '../project.svelte';
import { fillBody, fillTitle } from '../text';
import { isAncestor, subtree, topmost } from '../tree';
import type { When } from '$lib/timeline/solve';
import {
  PROJECT,
  type DocumentSettings,
  type NodeRecord,
  type Position,
  type Status,
  type TimelineSettings,
} from '../types';
import { deleteComments } from './comments';
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
    parent: string | null;
    order: string;
    title?: string;
    body?: string;
    pos?: Position | null;
  },
): YNode {
  const n = new Y.Map<unknown>();
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

/** What is not copied with an element: its place, its content, and what documents of before said of it. */
const NOT_CLONED = new Set(['title', 'body', 'map', 'side']);

export function cloneNode(
  p: Project,
  from: string,
  id: string,
  change: { parent: string; origin?: NodeRecord['origin']; order?: string },
): YNode {
  const source = p.yNodes.get(from)!;
  const n = new Y.Map<unknown>();
  for (const [key, value] of source) {
    if (NOT_CLONED.has(key)) continue;
    n.set(key, value instanceof Y.AbstractType ? value.clone() : structuredClone(value));
  }
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

/** A record of settings with nothing empty in it. */
function clean<T extends object>(given: T): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(given as Record<string, unknown>) };
  for (const [k, v] of Object.entries(out)) {
    if (
      v === undefined ||
      v === null ||
      v === '' ||
      (Array.isArray(v) && !v.length) ||
      (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)
    )
      delete out[k];
  }
  return out;
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
  deleteComments(p, ids);
  for (const [linkId, l] of p.yLinks) {
    if (ids.has(str(l.get('from'))) || ids.has(str(l.get('to')))) p.yLinks.delete(linkId);
  }
  // What stood for one of them stands for nothing. A lane of a timeline
  // that was one of them is a lane no more: a choice of lanes that named
  // only what is gone goes with it, and each child of the element in view
  // is a lane again.
  for (const n of p.yNodes.values()) {
    const include = n.get('include');
    if (typeof include === 'string' && ids.has(include)) n.delete('include');
    const timeline = n.get('timeline') as TimelineSettings | undefined;
    const lanes = timeline?.lanes;
    if (!lanes?.some((l) => l.element && ids.has(l.element))) continue;
    const kept = lanes.filter((l) => !l.element || !ids.has(l.element));
    const next: TimelineSettings = { ...timeline, lanes: kept };
    if (!kept.length) delete next.lanes;
    if (Object.keys(next).length) n.set('timeline', next);
    else n.delete('timeline');
  }
}

export const elementChanges = {
  /**
   * Adds an element under another. `index` is its place among the children,
   * at the end when absent; `pos` where it stands, relative to its parent,
   * when it is not to be placed automatically.
   */
  addChild(
    this: Project,
    parentId: string,
    options: { title?: string; body?: string; index?: number; pos?: Position } = {},
  ): string | null {
    const parent = this.node(parentId);
    if (!parent) return null;
    const tree = this.tree();
    const siblings = tree.children.get(parentId) ?? [];
    const id = newId();
    this.transact(() => {
      const order = keyAt(this, siblings, options.index ?? siblings.length);
      makeNode(this, id, {
        parent: parentId,
        order,
        title: options.title,
        body: options.body,
        pos: options.pos ? { x: Math.round(options.pos.x), y: Math.round(options.pos.y) } : null,
      });
      const p = this.yNodes.get(parentId);
      if (p?.get('collapsed') === true) p.delete('collapsed');
    });
    return id;
  },

  /** Adds an element after another, under the same parent. After the project itself, adds a child. */
  addSibling(
    this: Project,
    nodeId: string,
    options: { title?: string; before?: boolean } = {},
  ): string | null {
    const node = this.node(nodeId);
    if (!node) return null;
    const tree = this.tree();
    const parentId = tree.parent.get(nodeId) ?? null;
    if (parentId === null) return this.addChild(nodeId, options);
    const siblings = tree.children.get(parentId) ?? [];
    const index = siblings.indexOf(nodeId) + (options.before ? 0 : 1);
    const id = newId();
    this.transact(() => {
      makeNode(this, id, {
        parent: parentId,
        order: keyAt(this, siblings, index),
        title: options.title,
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

  /** Says how far the writing of elements has come; with nothing, no longer says it. */
  setStatus(this: Project, ids: string[], status: Status | null) {
    this.transact(() => {
      for (const id of ids) set(this, id, 'status', status, null);
    });
  },

  /** Says when an element is, in time; with nothing, no longer says it. */
  setWhen(this: Project, id: string, when: When | null) {
    set(this, id, 'when', when, null);
  },

  setExcluded(this: Project, id: string, excluded: boolean) {
    set(this, id, 'excluded', excluded, false);
  },

  /** Changes what is said of an element as a document. What is set empty is no longer said. */
  setDocument(this: Project, id: string, patch: Partial<DocumentSettings>) {
    const n = this.yNodes.get(id);
    if (!n) return;
    this.transact(() => {
      const current = (n.get('document') as DocumentSettings | undefined) ?? {};
      const next = clean({ ...current, ...patch });
      if (Object.keys(next).length) n.set('document', next);
      else n.delete('document');
    });
  },

  /** Changes how an element is shown as a timeline. */
  setTimeline(this: Project, id: string, patch: Partial<TimelineSettings>) {
    const n = this.yNodes.get(id);
    if (!n) return;
    this.transact(() => {
      const current = (n.get('timeline') as TimelineSettings | undefined) ?? {};
      const next = clean({ ...current, ...patch });
      if (Object.keys(next).length) n.set('timeline', next);
      else n.delete('timeline');
    });
  },

  /**
   * Whether an element `at` that stood for `id` in the document would make
   * a document hold itself: when `id` is `at` or over it, or holds, by
   * what stands for other elements within it, an element that is.
   */
  wouldLoop(this: Project, at: string, id: string): boolean {
    const tree = this.tree();
    const seen = new Set<string>();
    const visit = (e: string): boolean => {
      if (e === at || isAncestor(tree, e, at)) return true;
      if (seen.has(e)) return false;
      seen.add(e);
      for (const d of subtree(tree, e)) {
        const include = this.nodes.get(d)?.include;
        if (include && visit(include)) return true;
      }
      return false;
    };
    return visit(id);
  },

  /** Makes an element stand for another in the document. Returns false when that would loop. */
  setInclude(this: Project, id: string, element: string | null): boolean {
    const node = this.node(id);
    if (!node) return false;
    if (element && (!this.nodes.has(element) || this.wouldLoop(id, element))) return false;
    set(this, id, 'include', element, null);
    return true;
  },

  /** Removes the positions the user gave, so that the branches are laid out automatically. */
  tidy(this: Project, ids: string[]) {
    this.transact(() => {
      const tree = this.tree();
      for (const top of ids) {
        if (!this.node(top)) continue;
        for (const id of subtree(tree, top)) {
          if (id === PROJECT) continue;
          this.yNodes.get(id)?.delete('pos');
        }
      }
    });
  },

  /**
   * Moves elements, with all under them, to a parent, at a place among its
   * children. Elements cannot be moved under themselves; the project itself
   * cannot be moved. `pos` is where the first will stand, relative to the
   * parent, the rest below it; null has them placed automatically; nothing
   * leaves their places as they were. The parent is unfolded, unless it is
   * to stay folded. Returns the ids that were moved.
   */
  move(
    this: Project,
    ids: string[],
    parentId: string,
    index?: number,
    options: { pos?: Position | null; keepFolded?: boolean } = {},
  ): string[] {
    if (!this.node(parentId)) return [];
    const tree = this.tree();
    const movable = topmost(
      tree,
      ids.filter((id) => this.node(id)),
    ).filter((id) => id !== PROJECT && id !== parentId && !isAncestor(tree, id, parentId));
    if (!movable.length) return [];

    this.transact(() => {
      const moving = new Set(movable);
      const list = tree.children.get(parentId) ?? [];
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
        }
        n.delete('side');
      });
      const p = this.yNodes.get(parentId);
      if (!options.keepFolded && p?.get('collapsed') === true) p.delete('collapsed');
    });
    return movable;
  },

  /**
   * Copies elements, with all under them, to a parent, at a place among its
   * children. Each copy remembers what it was copied from. `pos` as for
   * `move`; without it the copies are placed automatically. Returns the ids
   * of the copies of the elements named.
   */
  copy(
    this: Project,
    ids: string[],
    parentId: string,
    index?: number,
    options: { pos?: Position | null } = {},
  ): string[] {
    if (!this.node(parentId)) return [];
    const tree = this.tree();
    const tops = topmost(
      tree,
      ids.filter((id) => this.node(id) && id !== PROJECT),
    );
    const made: string[] = [];

    this.transact(() => {
      const list = tree.children.get(parentId) ?? [];
      const siblings = list.slice();
      let at = index ?? list.length;
      const map = new Map<string, string>();
      for (const top of tops) {
        for (const old of subtree(tree, top)) map.set(old, newId());
      }
      for (const top of tops) {
        for (const old of subtree(tree, top)) {
          const isTop = old === top;
          const oldParent = tree.parent.get(old) ?? null;
          const copy = cloneNode(this, old, map.get(old)!, {
            parent: isTop ? parentId : (map.get(oldParent!) ?? parentId),
            origin: { node: old },
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
            else copy.delete('pos');
          }
        }
      }
      cloneLinks(this, map);
      const p = this.yNodes.get(parentId);
      if (p?.get('collapsed') === true) p.delete('collapsed');
    });
    return made;
  },

  /**
   * Removes elements. With `keepChildren`, what is under them moves up to
   * their parent; otherwise it goes with them. The project itself cannot be
   * removed. Returns how many elements went.
   */
  remove(this: Project, ids: string[], options: { keepChildren?: boolean } = {}): number {
    const tree = this.tree();
    const doomed = new Set<string>();
    this.transact(() => {
      if (options.keepChildren) {
        for (const id of ids) {
          if (id === PROJECT || !this.yNodes.has(id)) continue;
          const parent = tree.parent.get(id) ?? PROJECT;
          const children = tree.children.get(id) ?? [];
          const list = tree.children.get(parent) ?? [];
          const siblings = list.filter((s) => s !== id);
          const at = list.indexOf(id);
          children.forEach((c, i) => {
            const n = this.yNodes.get(c)!;
            n.set('parent', parent);
            n.set('order', keyAt(this, siblings, at + i));
            siblings.splice(at + i, 0, c);
            n.delete('pos');
          });
          doomed.add(id);
        }
      } else {
        for (const top of topmost(tree, ids)) {
          if (top === PROJECT || !this.yNodes.has(top)) continue;
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

  /**
   * A branch made whole under an element, at the end of what is under it,
   * in one step that undo takes back as one: for a document that is brought
   * in. The first of the parts is the top of the branch; every other says
   * which part it stands under, by the place of that part in the list, and
   * stands after it. `fill` writes the name and the text of each; without
   * parts, one element is made, named `name`. `document` is said of the top.
   * Returns the top and every element, in the order of the parts.
   */
  buildBranch(
    this: Project,
    under: string,
    name: string,
    parts: { under: number }[],
    fill: (part: number, title: Y.XmlFragment, body: Y.XmlFragment) => void,
    document: DocumentSettings = {},
  ): { top: string; nodes: string[] } | null {
    if (!this.node(under)) return null;
    const tree = this.tree();
    const siblings = tree.children.get(under) ?? [];
    const nodes = parts.length ? parts.map(() => newId()) : [newId()];
    // Under what each stands, and the others that stand there, in their order.
    const over = parts.map((p, i) => (i > 0 && p.under > 0 && p.under < i ? p.under : 0));
    const beside = new Map<number, number[]>();
    for (let i = 1; i < parts.length; i++) {
      const list = beside.get(over[i]);
      if (list) list.push(i);
      else beside.set(over[i], [i]);
    }
    const orders = new Map<number, string>();
    for (const list of beside.values()) {
      const keys = generateNKeysBetween(null, null, list.length);
      list.forEach((part, i) => orders.set(part, keys[i]));
    }
    const settings = clean(document);
    this.transact(() => {
      const topOrder = keyAt(this, siblings, siblings.length);
      nodes.forEach((node, i) => {
        const n = makeNode(this, node, {
          parent: i === 0 ? under : nodes[over[i]],
          order: i === 0 ? topOrder : (orders.get(i) ?? 'a0'),
          title: i === 0 && !parts.length ? name.replace(/\s+/g, ' ').trim() : '',
        });
        if (i === 0 && Object.keys(settings).length) n.set('document', settings);
        if (parts.length) fill(i, n.get('title') as Y.XmlFragment, n.get('body') as Y.XmlFragment);
      });
      const p = this.yNodes.get(under);
      if (p?.get('collapsed') === true) p.delete('collapsed');
    });
    return { top: nodes[0], nodes };
  },
};
