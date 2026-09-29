/**
 * The search through everything (ADR 0017): the projects, read from what is
 * kept of them on disk, and searched without an editor. It runs in a Web
 * Worker (`everything.worker.ts`), so that the window does not stand still
 * while a large project is read; what it has read of a project is kept
 * while the project does not change.
 *
 * What is searched is the text of every element of every map, as the text
 * of a map is searched (`passages.ts`); and, where what stands outside the
 * texts is asked for, citations as they are shown, words that point and
 * formulas, the details of the document of each map, what is written about
 * the works cited, and the words that name associations.
 */

import * as Y from 'yjs';
import { LOCATOR_LABELS, type CiteItem, type CiteMode } from '$lib/editor/schema';
import {
  bodyFacts,
  inlineText,
  readBody,
  readTitle,
  refForm,
  type Block,
  type RefForm,
  type SetOff,
} from '$lib/project/model/text';
import { buildTree, type FlatNode, type Tree } from '$lib/project/model/tree';
import type { DocumentSettings, RefRecord } from '$lib/project/model/types';
import { Matcher, type SearchOptions } from './matching';
import {
  bodyPassages,
  NO_TEXT,
  titlePassage,
  translate,
  type Labels,
  type Passage,
} from './passages';

/** An element, as it is searched. */
interface ElementRead {
  id: string;
  name: string;
  title: Passage;
  body: Passage[];
  blocks: Block[];
  excluded: boolean;
  heading: boolean;
  include: string | null;
  set: SetOff[];
  /** The passages with what stands outside the text, when they have been read so. */
  shown?: Passage[];
}

interface MapRead {
  id: string;
  name: string;
  tree: Tree;
  elements: ElementRead[];
  byId: Map<string, ElementRead>;
  document: DocumentSettings;
  links: { from: string; to: string; label: string }[];
}

/** A project as it is searched. */
export interface ProjectRead {
  id: string;
  name: string;
  maps: MapRead[];
  refs: Map<string, RefRecord>;
  /** What is written about the works cited, for this project, by the reference. */
  notes: { ref: string; text: string }[];
}

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

/** Reads a project from its state and the changes after it, as the disk keeps them. */
export function readProject(
  id: string,
  name: string,
  state: Uint8Array | null,
  updates: Uint8Array[],
): ProjectRead {
  const doc = new Y.Doc();
  if (state) Y.applyUpdate(doc, state);
  for (const update of updates) {
    try {
      Y.applyUpdate(doc, update);
    } catch {
      // A change that cannot be applied is left, as when the project is opened.
    }
  }
  const yMaps = doc.getMap<Y.Map<unknown>>('maps');
  const yNodes = doc.getMap<Y.Map<unknown>>('nodes');
  const yLinks = doc.getMap<Y.Map<unknown>>('links');
  const yRefs = doc.getMap<RefRecord>('refs');
  const yNotes = doc.getMap<Y.Text>('notes');

  const flat: FlatNode[] = [];
  const nodes = new Map<string, Y.Map<unknown>>();
  for (const [nodeId, n] of yNodes) {
    if (!(n instanceof Y.Map)) continue;
    nodes.set(nodeId, n);
    flat.push({
      id: nodeId,
      map: str(n.get('map')),
      parent: (n.get('parent') as string | null | undefined) ?? null,
      order: str(n.get('order'), 'a0'),
    });
  }

  const links: { from: string; to: string; label: string }[] = [];
  for (const l of yLinks.values()) {
    if (!(l instanceof Y.Map)) continue;
    const label = str(l.get('label'));
    if (label) links.push({ from: str(l.get('from')), to: str(l.get('to')), label });
  }

  const listed: {
    id: string;
    name: string;
    root: string;
    order: string;
    document: DocumentSettings;
  }[] = [];
  for (const [mapId, m] of yMaps) {
    if (!(m instanceof Y.Map)) continue;
    listed.push({
      id: mapId,
      // A map without a name is called so by the interface, in its language.
      name: str(m.get('name')),
      root: str(m.get('root')),
      order: str(m.get('order'), 'a0'),
      document: (m.get('document') as DocumentSettings | undefined) ?? {},
    });
  }
  listed.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : a.id < b.id ? -1 : 1));

  const maps: MapRead[] = listed.map((m) => {
    const tree = buildTree(flat, m.id, m.root || null);
    const elements: ElementRead[] = [];
    for (const nodeId of tree.sequence) {
      const n = nodes.get(nodeId);
      if (!n) continue;
      const title = readTitle(n.get('title') as Y.XmlFragment | undefined);
      const blocks = readBody(n.get('body') as Y.XmlFragment | undefined);
      elements.push({
        id: nodeId,
        name: inlineText(title).trim(),
        title: titlePassage(title),
        body: bodyPassages(blocks),
        blocks,
        excluded: n.get('excluded') === true,
        heading: n.get('heading') !== false,
        include: (n.get('include') as string | null | undefined) || null,
        set: bodyFacts(blocks).set,
      });
    }
    const inMap = new Set(elements.map((e) => e.id));
    return {
      id: m.id,
      name: m.name,
      tree,
      elements,
      byId: new Map(elements.map((e) => [e.id, e])),
      document: m.document,
      links: links.filter((l) => inMap.has(l.from) && inMap.has(l.to)),
    };
  });

  const refs = new Map<string, RefRecord>();
  for (const [refId, r] of yRefs) if (r && typeof r === 'object') refs.set(refId, r);
  const notes: { ref: string; text: string }[] = [];
  for (const [ref, text] of yNotes) {
    const said = text instanceof Y.Text ? text.toString() : '';
    if (said.trim()) notes.push({ ref, text: said });
  }
  doc.destroy();
  return { id, name: str(name), maps, refs, notes };
}

// ---- what stands outside the text, as the text of a map shows it ----

/** A work in short, as a citation shows it: see `editor/references.svelte.ts`. */
function workOf(project: ProjectRead, id: string): string {
  const r = project.refs.get(id);
  if (!r) return '';
  const who = r.authors?.replace(/ \(eds?\.\)$/, '') || r.title?.split(/[:.?!]\s/)[0] || r.key;
  return `${who} ${r.year || 'n.d.'}`.trim();
}

function citationOf(project: ProjectRead, items: CiteItem[], mode: CiteMode): string {
  const one = (item: CiteItem, withoutAuthor = false) => {
    const r = project.refs.get(item.id);
    let out = [
      item.prefix?.trim(),
      withoutAuthor || item.suppressAuthor ? (r?.year ?? '') : workOf(project, item.id),
    ]
      .filter(Boolean)
      .join(' ');
    if (item.locator) {
      const label =
        item.label && item.label !== 'page'
          ? (LOCATOR_LABELS.find(([name]) => name === item.label)?.[2] ?? '')
          : '';
      out += `, ${label ? `${label} ` : ''}${item.locator}`;
    }
    const after = item.suffix?.trim();
    if (after) out += /^[,;:.!?)]/.test(after) ? after : ` ${after}`;
    return out;
  };
  if (!items.length) return '';
  if (mode === 'intext') {
    const [first, ...rest] = items;
    const who = project.refs.get(first.id)?.authors ?? '';
    return `${who} (${[one(first, true), ...rest.map((i) => one(i))].join('; ')})`;
  }
  return `(${items.map((i) => one(i)).join('; ')})`;
}

/**
 * What words that point say in the document of a map, counted as the
 * document counts: see `figures/numbering.svelte.ts`. The words are those of
 * a document without a format of its own.
 */
function pointersOf(
  project: ProjectRead,
  map: MapRead,
): Map<string, { kind: string; number: string | null; words: string }> {
  const out = new Map<string, { kind: string; number: string | null; words: string }>();
  const counted: Record<string, number> = { figure: 0, table: 0, equation: 0 };
  const walkMap = (mapId: string, within: Set<string>) => {
    const m = project.maps.find((x) => x.id === mapId);
    if (!m?.tree.root) return;
    const walk = (id: string, root: boolean) => {
      const e = m.byId.get(id);
      if (!e || e.excluded) return;
      if (!root && e.heading && e.name && !out.has(id))
        out.set(id, { kind: 'part', number: null, words: e.name });
      for (const s of e.set) {
        const number = s.numbered ? String(++counted[s.kind]) : null;
        if (s.id && !out.has(s.id)) out.set(s.id, { kind: s.kind, number, words: s.words });
      }
      if (!root && e.include && !within.has(e.include))
        walkMap(e.include, new Set([...within, e.include]));
      for (const child of m.tree.children.get(id) ?? []) walk(child, false);
    };
    walk(m.tree.root!, true);
  };
  walkMap(map.id, new Set([map.id]));
  return out;
}

function pointerOf(
  pointed: { kind: string; number: string | null; words: string } | undefined,
  form: RefForm,
): string {
  if (!pointed) return '';
  if (pointed.kind === 'figure' || pointed.kind === 'table') {
    const called = pointed.kind === 'figure' ? 'Figure' : 'Table';
    if (pointed.number === null) return called;
    return form === 'number' ? pointed.number : `${called} ${pointed.number}`;
  }
  if (pointed.kind === 'equation') {
    if (pointed.number === null) return '';
    return form === 'number' ? pointed.number : `(${pointed.number})`;
  }
  return pointed.words;
}

// ---- searching ----

export type Where = 'text' | 'details' | 'association' | 'note';

/** Something that was found in a project, with the words around it. */
export interface Found {
  where: Where;
  map: string | null;
  mapName: string;
  /** The element it was found in; of an association, the element it begins at. */
  element: string | null;
  elementName: string;
  part: 'title' | 'body' | null;
  passage: number;
  /** Whether it is in a note. */
  note?: boolean;
  start: number;
  end: number;
  before: string;
  text: string;
  after: string;
  /** Of what is written about a work: the reference, and the work in short. */
  ref?: string;
  work?: string;
}

export interface ProjectFound {
  project: string;
  name: string;
  count: number;
  found: Found[];
}

/** The words around what was found, cut at the ends of words, and shown without what is no text. */
export function around(
  text: string,
  start: number,
  end: number,
  room = 56,
): [string, string, string] {
  const clean = (s: string) => s.replaceAll(NO_TEXT, '').replace(/\s+/g, ' ');
  let from = Math.max(0, start - room);
  if (from > 0) {
    const space = text.indexOf(' ', from);
    if (space >= 0 && space < start) from = space + 1;
  }
  let to = Math.min(text.length, end + room);
  if (to < text.length) {
    const space = text.lastIndexOf(' ', to);
    if (space > end) to = space;
  }
  return [
    (from > 0 ? '…' : '') + clean(text.slice(from, start)).trimStart(),
    clean(text.slice(start, end)),
    clean(text.slice(end, to)).trimEnd() + (to < text.length ? '…' : ''),
  ];
}

/**
 * Searches a project. What is found is counted all; so many of it are kept,
 * with the words around them, in the order of the maps and their texts.
 */
export function searchProject(
  project: ProjectRead,
  words: string,
  options: SearchOptions,
  most = 300,
): ProjectFound | { error: string } | null {
  const made = Matcher.make(words, options);
  if (!made) return null;
  if ('error' in made) return made;
  const matcher = made.matcher;
  const out: ProjectFound = { project: project.id, name: project.name, count: 0, found: [] };
  /** Keeps what was found, with the words around it in a text, where it stands there. */
  const put = (
    found: Omit<Found, 'before' | 'text' | 'after'>,
    text: string,
    start = found.start,
    end = found.end,
  ) => {
    out.count++;
    if (out.found.length >= most) return;
    const [before, middle, after] = around(text, start, end);
    out.found.push({ ...found, before, text: middle, after });
  };

  for (const map of project.maps) {
    let pointers: ReturnType<typeof pointersOf> | null = null;
    // What stands outside the text, as the text shows it: searched where that is asked for,
    // and shown in the words around what is found in any case.
    const labels: Labels = {
      citation: (items, mode) => citationOf(project, items, mode),
      crossref: (target, form) =>
        pointerOf((pointers ??= pointersOf(project, map)).get(target), refForm(form)),
    };
    for (const e of map.elements) {
      const base = {
        where: 'text' as const,
        map: map.id,
        mapName: map.name,
        element: e.id,
        elementName: e.name,
      };
      for (const hit of matcher.find(e.title.text))
        put({ ...base, part: 'title', passage: 0, start: hit.start, end: hit.end }, e.title.text);
      const shown = () => (e.shown ??= bodyPassages(e.blocks, labels));
      for (const p of options.labels ? shown() : e.body) {
        if (!p.text) continue;
        for (const hit of matcher.find(p.text)) {
          const found = {
            ...base,
            part: 'body' as const,
            passage: p.index,
            start: hit.start,
            end: hit.end,
          };
          if (options.labels) put(found, p.text);
          else {
            const seen = shown()[p.index] ?? p;
            put(found, seen.text, translate(p, seen, hit.start), translate(p, seen, hit.end));
          }
        }
      }
    }
    if (!options.labels) continue;
    // The details of the document, and the words that name associations.
    const d = map.document;
    const details = [
      d.title,
      d.subtitle,
      ...(d.authors ?? []).flatMap((a) => [a.name, a.affiliation, a.email]),
      d.abstract,
      (d.keywords ?? []).join(', '),
      d.date,
    ].filter((x): x is string => typeof x === 'string' && !!x.trim());
    for (const line of details) {
      for (const hit of matcher.find(line))
        put(
          {
            where: 'details',
            map: map.id,
            mapName: map.name,
            element: null,
            elementName: '',
            part: null,
            passage: 0,
            start: hit.start,
            end: hit.end,
          },
          line,
        );
    }
    for (const link of map.links) {
      for (const hit of matcher.find(link.label))
        put(
          {
            where: 'association',
            map: map.id,
            mapName: map.name,
            element: link.from,
            elementName: `${map.byId.get(link.from)?.name ?? ''} ↔ ${map.byId.get(link.to)?.name ?? ''}`,
            part: null,
            passage: 0,
            start: hit.start,
            end: hit.end,
          },
          link.label,
        );
    }
  }
  if (options.labels) {
    for (const note of project.notes) {
      for (const hit of matcher.find(note.text))
        put(
          {
            where: 'note',
            map: null,
            mapName: '',
            element: null,
            elementName: '',
            part: null,
            passage: 0,
            start: hit.start,
            end: hit.end,
            ref: note.ref,
            work: workOf(project, note.ref),
          },
          note.text,
        );
    }
  }
  return out;
}
