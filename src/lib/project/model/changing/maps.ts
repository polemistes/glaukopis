/**
 * Changing the maps of a project: making them, whole or from a branch or as
 * a copy, naming them, saying how their document is made, putting them in
 * order, and deleting them. These are methods of `Project`, which takes them
 * in (see there).
 */

import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import { newTextLanguage, t } from '$lib/i18n';
import { newId } from '$lib/util/id';
import { nowIso } from '../origins';
import type { Project } from '../project.svelte';
import { subtree } from '../tree';
import type { DocumentSettings, TimelineSettings } from '../types';
import { cloneLinks, cloneNode, deleteNodes, makeNode } from './elements';

export const mapChanges = {
  createMap(this: Project, name: string, options: { title?: string } = {}): string {
    const clean = name.replace(/\s+/g, ' ').trim() || t('project-untitled');
    const id = newId();
    const root = newId();
    this.transact(() => {
      const last = this.maps.length ? this.maps[this.maps.length - 1].order : null;
      const m = new Y.Map<unknown>();
      m.set('name', clean);
      m.set('root', root);
      m.set('order', generateKeyBetween(last, null));
      m.set('created', nowIso());
      // The language is written into the map, so that it is the same for
      // everyone the project is shared with (ADR 0020).
      m.set('document', { language: newTextLanguage() });
      this.yMaps.set(id, m);
      makeNode(this, root, {
        map: id,
        parent: null,
        order: 'a0',
        title: options.title ?? clean,
        pos: { x: 0, y: 0 },
      });
    });
    return id;
  },

  /**
   * A map made whole, in one step that undo takes back as one: for a
   * document that is brought in. The first of the parts is the centre; every
   * other says which part it stands under, by the place of that part in the
   * list, and stands after it. `fill` writes the name and the text of each.
   */
  buildMap(
    this: Project,
    name: string,
    parts: { under: number }[],
    fill: (part: number, title: Y.XmlFragment, body: Y.XmlFragment) => void,
    document: DocumentSettings = {},
  ): { map: string; nodes: string[] } {
    const clean = name.replace(/\s+/g, ' ').trim() || t('project-untitled');
    const id = newId();
    const nodes = parts.length ? parts.map(() => newId()) : [newId()];
    // Under what each stands, and the others that stand there, in their order.
    const under = parts.map((p, i) => (i > 0 && p.under > 0 && p.under < i ? p.under : 0));
    const beside = new Map<number, number[]>();
    for (let i = 1; i < parts.length; i++) {
      const list = beside.get(under[i]);
      if (list) list.push(i);
      else beside.set(under[i], [i]);
    }
    const orders = new Map<number, string>();
    for (const list of beside.values()) {
      const keys = generateNKeysBetween(null, null, list.length);
      list.forEach((part, i) => orders.set(part, keys[i]));
    }
    const settings: Record<string, unknown> = {
      ...document,
      language: document.language || newTextLanguage(),
    };
    for (const [k, v] of Object.entries(settings)) {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length))
        delete settings[k];
    }
    this.transact(() => {
      const last = this.maps.length ? this.maps[this.maps.length - 1].order : null;
      const m = new Y.Map<unknown>();
      m.set('name', clean);
      m.set('root', nodes[0]);
      m.set('order', generateKeyBetween(last, null));
      m.set('created', nowIso());
      m.set('document', settings);
      this.yMaps.set(id, m);
      nodes.forEach((node, i) => {
        const n = makeNode(this, node, {
          map: id,
          parent: i === 0 ? null : nodes[under[i]],
          order: orders.get(i) ?? 'a0',
          title: i === 0 && !parts.length ? clean : '',
          pos: i === 0 ? { x: 0, y: 0 } : null,
        });
        if (parts.length) fill(i, n.get('title') as Y.XmlFragment, n.get('body') as Y.XmlFragment);
      });
    });
    return { map: id, nodes };
  },

  renameMap(this: Project, id: string, name: string) {
    const clean = name.replace(/\s+/g, ' ').trim();
    const m = this.yMaps.get(id);
    if (!m || !clean || m.get('name') === clean) return;
    this.transact(() => m.set('name', clean));
  },

  setDocument(this: Project, id: string, patch: Partial<DocumentSettings>) {
    const m = this.yMaps.get(id);
    if (!m) return;
    this.transact(() => {
      const current = (m.get('document') as DocumentSettings | undefined) ?? {};
      const next: Record<string, unknown> = { ...current, ...patch };
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete next[k];
      }
      m.set('document', next);
    });
  },

  /** Changes how a map is shown as a timeline. */
  setTimeline(this: Project, id: string, patch: Partial<TimelineSettings>) {
    const m = this.yMaps.get(id);
    if (!m) return;
    this.transact(() => {
      const current = (m.get('timeline') as TimelineSettings | undefined) ?? {};
      const next: Record<string, unknown> = { ...current, ...patch };
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete next[k];
      }
      if (Object.keys(next).length) m.set('timeline', next);
      else m.delete('timeline');
    });
  },

  /** Puts a map before another in the list of maps, or last. */
  moveMap(this: Project, id: string, before: string | null) {
    const m = this.yMaps.get(id);
    if (!m) return;
    const others = this.maps.filter((x) => x.id !== id);
    const index = before ? others.findIndex((x) => x.id === before) : others.length;
    const at = index < 0 ? others.length : index;
    const prev = at > 0 ? others[at - 1].order : null;
    const next = at < others.length ? others[at].order : null;
    this.transact(() => {
      m.set(
        'order',
        prev !== null && next !== null && prev >= next
          ? generateKeyBetween(prev, null)
          : generateKeyBetween(prev, next),
      );
    });
  },

  /** Deletes a map and all its elements. Elements that include it cease to. */
  deleteMap(this: Project, id: string) {
    if (!this.yMaps.has(id)) return;
    this.transact(() => {
      const doomed = new Set<string>();
      for (const [nodeId, n] of this.yNodes) {
        if (n.get('map') === id) doomed.add(nodeId);
        else if (n.get('include') === id) n.delete('include');
      }
      deleteNodes(this, doomed);
      this.yMaps.delete(id);
    });
  },

  /** A copy of a map, with everything in it. Returns the id of the copy. */
  duplicateMap(this: Project, id: string, name?: string): string | null {
    const source = this.map(id);
    if (!source) return null;
    const tree = this.tree(id);
    const copyId = newId();
    this.transact(() => {
      const ids = new Map<string, string>();
      for (const old of tree.sequence) ids.set(old, newId());
      const m = new Y.Map<unknown>();
      m.set('name', name?.trim() || t('project-map-copy', { name: source.name }));
      m.set('root', ids.get(source.root) ?? newId());
      const index = this.maps.findIndex((x) => x.id === id);
      const next = this.maps[index + 1]?.order ?? null;
      m.set(
        'order',
        next !== null && source.order >= next
          ? generateKeyBetween(source.order, null)
          : generateKeyBetween(source.order, next),
      );
      m.set('created', nowIso());
      m.set('document', { ...source.document });
      this.yMaps.set(copyId, m);
      for (const old of tree.sequence) {
        const parent = tree.parent.get(old) ?? null;
        cloneNode(this, old, ids.get(old)!, {
          map: copyId,
          parent: parent ? (ids.get(parent) ?? null) : null,
          origin: { map: id, node: old },
        });
      }
      cloneLinks(this, ids);
    });
    return copyId;
  },

  /** A new map that begins as a copy of a branch. The branch stays where it is. */
  mapFromBranch(this: Project, nodeId: string, name?: string): string | null {
    const node = this.node(nodeId);
    if (!node) return null;
    const tree = this.tree(node.map);
    const branch = subtree(tree, nodeId);
    const mapId = newId();
    this.transact(() => {
      const ids = new Map<string, string>();
      for (const old of branch) ids.set(old, newId());
      const last = this.maps.length ? this.maps[this.maps.length - 1].order : null;
      const m = new Y.Map<unknown>();
      m.set('name', name?.trim() || node.title || t('project-untitled'));
      m.set('root', ids.get(nodeId)!);
      m.set('order', generateKeyBetween(last, null));
      m.set('created', nowIso());
      // The text is the text of the map it comes from, in its language.
      const language = this.maps.find((x) => x.id === node.map)?.document.language;
      m.set('document', language ? { language } : {});
      this.yMaps.set(mapId, m);
      for (const old of branch) {
        const parent = old === nodeId ? null : (tree.parent.get(old) ?? null);
        const copy = cloneNode(this, old, ids.get(old)!, {
          map: mapId,
          parent: parent ? (ids.get(parent) ?? null) : null,
          origin: { map: node.map, node: old },
        });
        if (old === nodeId) {
          copy.set('pos', { x: 0, y: 0 });
          copy.delete('side');
          copy.set('heading', true);
          copy.delete('excluded');
        }
      }
      cloneLinks(this, ids);
    });
    return mapId;
  },
};
