/**
 * A project brought into shape when it is opened (ADR 0037): its own
 * element is made where there is none, and a document written before, as
 * maps with a centre each and loose elements beside them, becomes one tree.
 * An abstract or a cover written into an element's settings becomes an
 * element under it (ADR 0038). Done within a transaction of the caller's;
 * nothing happens to a project that is in shape, so it can be asked of
 * every document that is read.
 */

import { generateKeyBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import { newId } from '$lib/util/id';
import { str } from './origins';
import { fillBody, fillTitle, inlineText, readTitle } from './text';
import { PROJECT, type DocumentSettings, type Hand, type TimelineSettings } from './types';

type YNode = Y.Map<unknown>;

const record = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/** Whether an element's settings still hold an abstract or a cover, which are elements now. */
const holdsParts = (n: YNode): boolean => {
  const document = record(n.get('document'));
  return !!document && ('abstract' in document || 'cover' in document);
};

/**
 * Whether the document is not yet in shape: without its project element,
 * with maps, or with an abstract or a cover in an element's settings.
 */
export function needsMigration(doc: Y.Doc): boolean {
  if (doc.getMap('maps').size > 0 || !doc.getMap('nodes').has(PROJECT)) return true;
  for (const n of doc.getMap<YNode>('nodes').values()) if (holdsParts(n)) return true;
  return false;
}

/**
 * Brings the document into shape. `name` is the project's name, for its
 * element when that is made and nothing else names it; `language` is the
 * language new texts are given, for a project that begins now, written
 * into it as it was into a new map, so that it is the same for all who
 * share it. `word` gives a word of documents in a language (`term` of the
 * words of the interface), left out where this runs in a thread of its own
 * that must not take the interface in (the search through everything).
 * Returns whether anything was changed.
 */
export function migrate(
  doc: Y.Doc,
  name: string,
  language?: string,
  word?: (language: string | null | undefined, id: string) => string | null,
): boolean {
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

  if (!yMaps.size) return partsOut(yNodes, word) || changed;

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
  partsOut(yNodes, word);
  return true;
}

/** The language of an element's document: its own, or the nearest over it. */
function languageOf(yNodes: Y.Map<YNode>, id: string): string | undefined {
  const seen = new Set<string>();
  for (let at: string | undefined = id; at && !seen.has(at);) {
    seen.add(at);
    const n: YNode | undefined = yNodes.get(at);
    if (!n) return undefined;
    const language = str(record(n.get('document'))?.language).trim();
    if (language) return language;
    at = str(n.get('parent')) || undefined;
  }
  return undefined;
}

/**
 * An abstract or a cover that was written into an element's settings
 * becomes an element under it, first among its children (ADR 0038): the
 * abstract an element of the kind `abstract`, named as documents name it
 * in the language of the document, with the text as paragraphs; the cover
 * an element of the kind `cover`, whose text is the picture as a figure.
 * The settings lose the two. Returns whether anything was changed.
 */
function partsOut(
  yNodes: Y.Map<YNode>,
  word?: (language: string | null | undefined, id: string) => string | null,
): boolean {
  let changed = false;
  for (const [id, n] of [...yNodes.entries()]) {
    if (!holdsParts(n)) continue;
    const document = { ...record(n.get('document')) };
    const abstract = str(document.abstract).trim();
    const cover = record(document.cover);
    const hash = str(cover?.hash).trim();
    delete document.abstract;
    delete document.cover;
    if (Object.keys(document).length) n.set('document', document);
    else n.delete('document');
    changed = true;

    // Before the first child; the cover, where there is one, before the abstract.
    let first: string | null = null;
    for (const [other, m] of yNodes) {
      if (other === id || m.get('parent') !== id) continue;
      const order = str(m.get('order'), 'a0');
      if (first === null || order < first) first = order;
    }
    const make = (name: string, kind: string, fill: (body: Y.XmlFragment) => void) => {
      const child = new Y.Map<unknown>();
      child.set('parent', id);
      child.set('order', (first = generateKeyBetween(null, first)));
      child.set('kind', kind);
      const title = new Y.XmlFragment();
      const body = new Y.XmlFragment();
      child.set('title', title);
      child.set('body', body);
      yNodes.set(newId(), child);
      fillTitle(title, name);
      fill(body);
    };
    if (abstract)
      make(word?.(languageOf(yNodes, id), 'document-abstract') ?? 'Abstract', 'abstract', (body) =>
        fillBody(body, abstract),
      );
    if (hash)
      make('Cover', 'cover', (body) => {
        const figure = new Y.XmlElement('figure');
        figure.setAttribute('id', newId());
        figure.setAttribute('file', hash);
        figure.setAttribute('extension', str(cover?.extension));
        figure.setAttribute('name', '');
        figure.setAttribute('alt', '');
        figure.setAttribute('width', 100 as unknown as string);
        figure.setAttribute('numbered', false as unknown as string);
        body.insert(0, [figure]);
      });
  }
  return changed;
}
