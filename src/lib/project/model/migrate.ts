/**
 * A project brought into shape when it is opened (ADR 0037): its own
 * element is made where there is none, and a document written before, as
 * maps with a centre each and loose elements beside them, becomes one tree.
 * Done within a transaction of the caller's; nothing happens to a project
 * that is in shape, so it can be asked of every document that is read.
 */

import { generateKeyBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import { str } from './origins';
import { fillTitle, inlineText, readTitle } from './text';
import { PROJECT, type DocumentSettings, type Hand, type TimelineSettings } from './types';

type YNode = Y.Map<unknown>;

/** Whether the document is not yet in shape: without its project element, or with maps. */
export function needsMigration(doc: Y.Doc): boolean {
  return doc.getMap('maps').size > 0 || !doc.getMap('nodes').has(PROJECT);
}

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/**
 * Brings the document into shape. `name` is the project's name, for its
 * element when that is made and nothing else names it; `language` is the
 * language new texts are given, for a project that begins now, written
 * into it as it was into a new map, so that it is the same for all who
 * share it. Returns whether anything was changed.
 */
export function migrate(doc: Y.Doc, name: string, language?: string): boolean {
  const yMaps = doc.getMap<YNode>('maps');
  const yNodes = doc.getMap<YNode>('nodes');
  const yMeta = doc.getMap<unknown>('meta');
  let changed = false;
  let made = false;

  if (!yNodes.has(PROJECT)) {
    const n = new Y.Map<unknown>();
    n.set('parent', null);
    n.set('order', 'a0');
    const title = new Y.XmlFragment();
    n.set('title', title);
    n.set('body', new Y.XmlFragment());
    yNodes.set(PROJECT, n);
    fillTitle(title, (str(yMeta.get('name')) || name).replace(/\s+/g, ' ').trim());
    changed = true;
    made = true;
  }
  const project = yNodes.get(PROJECT)!;

  // The language new maps were given becomes the project's own, which every element inherits.
  const had = str(yMeta.get('language')).trim();
  if (had) {
    const own = record(project.get('document')) ?? {};
    if (!own.language) project.set('document', { ...own, language: had });
    yMeta.delete('language');
    changed = true;
  } else if (made && language) {
    // A project that begins now: in the language new texts are given.
    const own = record(project.get('document')) ?? {};
    if (!own.language) project.set('document', { ...own, language });
  }

  if (!yMaps.size) return changed;

  const maps = [...yMaps.entries()]
    .filter((entry): entry is [string, YNode] => entry[1] instanceof Y.Map)
    .map(([id, m]) => ({ id, m, order: str(m.get('order'), 'a0') }))
    .sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : a.id < b.id ? -1 : 1));
  const mapOrder = new Map(maps.map((m, i) => [m.id, i]));

  // The maps go after what already stands under the project.
  let last: string | null = null;
  for (const [id, n] of yNodes) {
    if (id !== PROJECT && n.get('parent') === PROJECT) {
      const order = str(n.get('order'), 'a0');
      if (last === null || order > last) last = order;
    }
  }
  const next = () => (last = generateKeyBetween(last, null));
  const hasChildren = (id: string) => {
    for (const [other, n] of yNodes) if (other !== id && n.get('parent') === id) return true;
    return false;
  };

  const centres = new Map<string, string>();
  const hand: Hand = { pinned: [], unpinned: [] };
  for (const map of maps) {
    const root = str(map.m.get('root'));
    const centre = root ? yNodes.get(root) : undefined;
    if (centre instanceof Y.Map) {
      centres.set(map.id, root);
      centre.set('parent', PROJECT);
      centre.set('order', next());
      centre.delete('pos');
      centre.delete('side');
      // The centre keeps its name; one without any is named as the map was.
      const title = centre.get('title');
      if (title instanceof Y.XmlFragment && !inlineText(readTitle(title)).trim())
        fillTitle(title, str(map.m.get('name')));
      const document = record(map.m.get('document')) as DocumentSettings | null;
      if (document && Object.keys(document).length)
        centre.set('document', { ...(record(centre.get('document')) ?? {}), ...document });
      const timeline = record(map.m.get('timeline')) as TimelineSettings | null;
      if (timeline && Object.keys(timeline).length) centre.set('timeline', { ...timeline });
      // Folded where it stands under the project, when it holds anything.
      if (hasChildren(root)) centre.set('collapsed', true);
    }
    const kept = record(map.m.get('hand'));
    for (const key of ['pinned', 'unpinned'] as const) {
      const ids = kept?.[key];
      if (Array.isArray(ids))
        for (const id of ids)
          if (typeof id === 'string' && id && !hand[key].includes(id)) hand[key].push(id);
    }
  }

  // Loose elements, and any left with no parent to stand under, go under
  // the project after the maps: those of the first map first, in their order.
  const loose: { id: string; n: YNode; map: number; order: string }[] = [];
  const isCentre = new Set(centres.values());
  for (const [id, n] of yNodes) {
    if (id === PROJECT || isCentre.has(id)) continue;
    const parent = n.get('parent');
    if (typeof parent === 'string' && parent !== id && yNodes.has(parent)) continue;
    loose.push({
      id,
      n,
      map: mapOrder.get(str(n.get('map'))) ?? maps.length,
      order: str(n.get('order'), 'a0'),
    });
  }
  loose.sort((a, b) =>
    a.map !== b.map
      ? a.map - b.map
      : a.order < b.order
        ? -1
        : a.order > b.order
          ? 1
          : a.id < b.id
            ? -1
            : 1,
  );
  for (const { n } of loose) {
    n.set('parent', PROJECT);
    n.set('order', next());
    n.delete('side');
  }

  // What stood for a map stands for its centre.
  for (const [, n] of yNodes) {
    const include = n.get('include');
    if (typeof include === 'string' && yMaps.has(include)) {
      const centre = centres.get(include);
      if (centre) n.set('include', centre);
      else n.delete('include');
    }
  }

  if (hand.pinned.length || hand.unpinned.length) {
    const own = record(yMeta.get('hand'));
    const merge = (key: 'pinned' | 'unpinned') => [
      ...new Set([
        ...((own?.[key] as unknown[]) ?? []).filter((id): id is string => typeof id === 'string'),
        ...hand[key],
      ]),
    ];
    const pinned = merge('pinned');
    const unpinned = merge('unpinned').filter((id) => !pinned.includes(id));
    yMeta.set('hand', { pinned, unpinned });
  }

  for (const map of maps) yMaps.delete(map.id);
  return true;
}
