/**
 * A project brought into shape when it is opened (ADR 0037): its own
 * element is made where there is none, and a document written before, as
 * maps with a centre each and loose elements beside them, becomes one tree.
 * An abstract or a cover written into an element's settings becomes an
 * element under it (ADR 0038). A text written in the shape of before ADR
 * 0040 — block quotes, verse, script paragraphs, passages of a name, lists
 * — is written anew as paragraphs of a kind in passages; the hand of the
 * project goes, and the kinds `verse` and `list` are named `line` and
 * `item` wherever the project names them. Done within a transaction of the
 * caller's; nothing happens to a project that is in shape, so it can be
 * asked of every document that is read.
 */

import { generateKeyBetween } from 'fractional-indexing';
import * as Y from 'yjs';
import { newId } from '$lib/util/id';
import { blockElements } from './blocks';
import { RENAMED, type BasedKind } from './families';
import { str } from './origins';
import {
  fillBody,
  fillTitle,
  inlineText,
  isOldShape,
  readBasedKinds,
  readBlocks,
  readTitle,
} from './text';
import { PROJECT, type DocumentSettings, type TimelineSettings } from './types';

type YNode = Y.Map<unknown>;

/** The shape of texts as they are written now: kept in `meta.texts`, so that a document in shape is not read through again. */
export const TEXTS_SHAPE = 2;

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
 * with maps, with an abstract or a cover in an element's settings, or
 * without the word that its texts were written in the shape of now.
 */
export function needsMigration(doc: Y.Doc): boolean {
  if (doc.getMap('maps').size > 0 || !doc.getMap('nodes').has(PROJECT)) return true;
  for (const n of doc.getMap<YNode>('nodes').values()) if (holdsParts(n)) return true;
  return doc.getMap<unknown>('meta').get('texts') !== TEXTS_SHAPE;
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

  if (yMaps.size) {
    oneTree(yMaps, yNodes);
    changed = true;
  }
  if (partsOut(yNodes, word)) changed = true;
  if (textsInShape(doc)) changed = true;
  return changed;
}

/** Maps become children of the project, in order; loose elements after them (ADR 0037). */
function oneTree(yMaps: Y.Map<YNode>, yNodes: Y.Map<YNode>) {
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
    // The hand a map had goes, as the hand of the project does (ADR 0040).
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

  for (const map of maps) yMaps.delete(map.id);
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

/**
 * The texts of a project written in the shape of now (ADR 0040), where the
 * document does not say they are: every element of the old shape in a
 * text, with those next to it, is read as `text.ts` reads it and written
 * as `blocks.ts` writes it, in its place; what else stands in the text is
 * left as it is, so that comments on it keep their place. The hand goes,
 * and the kinds `verse` and `list` are named anew in the kinds of the
 * writer's own and in what kinds of elements begin in. Returns whether
 * anything was changed, which is whether the document did not say so yet.
 */
function textsInShape(doc: Y.Doc): boolean {
  const yMeta = doc.getMap<unknown>('meta');
  if (yMeta.get('texts') === TEXTS_SHAPE) return false;
  const yNodes = doc.getMap<YNode>('nodes');
  const yPassageKinds = doc.getMap<unknown>('passageKinds');
  const yKinds = doc.getMap<unknown>('kinds');

  for (const k of yPassageKinds.values()) {
    if (!(k instanceof Y.Map)) continue;
    const basedOn = k.get('basedOn');
    if (typeof basedOn === 'string' && basedOn in RENAMED) k.set('basedOn', RENAMED[basedOn]);
  }
  for (const k of yKinds.values()) {
    if (!(k instanceof Y.Map)) continue;
    const begins = k.get('begins');
    if (typeof begins === 'string' && begins in RENAMED) k.set('begins', RENAMED[begins]);
  }
  const own = readBasedKinds(yPassageKinds);
  for (const n of yNodes.values()) {
    const body = n.get('body');
    if (body instanceof Y.XmlFragment) rewriteIn(body, own);
  }
  yMeta.delete('hand');
  yMeta.set('texts', TEXTS_SHAPE);
  return true;
}

/**
 * Rewrites the elements of the old shape in a text or a side of a parallel
 * text: each run of them, read together so that what belongs together is
 * joined, is written anew in its place.
 */
function rewriteIn(parent: Y.XmlFragment | Y.XmlElement, own: readonly BasedKind[]) {
  let i = 0;
  while (i < parent.length) {
    const child = parent.get(i);
    if (child instanceof Y.XmlElement && child.nodeName === 'parallel') {
      for (const side of child.toArray()) if (side instanceof Y.XmlElement) rewriteIn(side, own);
      i++;
      continue;
    }
    if (!(child instanceof Y.XmlElement) || !isOldShape(child)) {
      i++;
      continue;
    }
    const run: Y.XmlElement[] = [];
    for (let j = i; j < parent.length; j++) {
      const next = parent.get(j);
      if (next instanceof Y.XmlElement && isOldShape(next)) run.push(next);
      else break;
    }
    const made = blockElements(readBlocks(run, own));
    parent.delete(i, run.length);
    if (made.length) parent.insert(i, made);
    i += made.length;
  }
}
