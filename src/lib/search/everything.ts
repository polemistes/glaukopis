/**
 * The search through everything (ADR 0017): the projects, read from what is
 * kept of them on disk, and searched without an editor. It runs in a Web
 * Worker (`everything.worker.ts`), so that the window does not stand still
 * while a large project is read; what it has read of a project is kept
 * while the project does not change.
 *
 * What is searched is the text of every element of a project, as the text
 * in view is searched (`passages.ts`); and, where what stands outside the
 * texts is asked for, citations as they are shown, words that point and
 * formulas, the details of the document said of each element, what is
 * written about the works cited, and the words that name associations.
 *
 * Where what is searched for holds a paragraph break, the paragraphs of a
 * text are read as one (`passages.ts`), and the words around what is found
 * show a ¶ where the paragraph broke.
 */

import * as Y from 'yjs';
import {
  citationText,
  citationWordsOf,
  PLAIN_WORDS,
  pointerText,
  workText,
  type CitedWork,
  type LabelWords,
  type PointedKind,
} from '$lib/editor/labels';
import { migrate, needsMigration } from '$lib/project/model/migrate';
import {
  bodyFacts,
  inlineText,
  readBasedKinds,
  readBody,
  readTitle,
  refForm,
  type Block,
  type SetOff,
} from '$lib/project/model/text';
import { buildTree, pathTo, type FlatNode, type Tree } from '$lib/project/model/tree';
import {
  OWN_SETTINGS,
  PROJECT,
  type DocumentSettings,
  type RefRecord,
} from '$lib/project/model/types';
import { Matcher, type SearchOptions } from './matching';
import {
  bodyPassages,
  joined,
  NO_TEXT,
  PARAGRAPH,
  placeIn,
  titlePassage,
  translate,
  type Joined,
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
  /** What is said of it as a document, of its own. */
  document: DocumentSettings;
  /**
   * The tree under the project it is in: that child of the project, by its
   * id; nothing for the project itself.
   */
  tree: string | null;
  /** The passages with what stands outside the text, when they have been read so, and the words they were read with. */
  shown?: { key: string; passages: Passage[] };
}

/** A project as it is searched: one tree, the project's own element at the top (ADR 0037). */
export interface ProjectRead {
  id: string;
  name: string;
  tree: Tree;
  /** Every element, in the order of the text, the project's own first. */
  elements: ElementRead[];
  byId: Map<string, ElementRead>;
  /** The associations that have a name. */
  links: { from: string; to: string; label: string }[];
  refs: Map<string, RefRecord>;
  /** What is written about the works cited, for this project, by the reference. */
  notes: { ref: string; text: string }[];
  /** How many of the changes on disk could not be applied: the project is read only in part. */
  unapplied: number;
}

const str = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

/**
 * Reads a project from its state and the changes after it, as the disk
 * keeps them. A project written before ADR 0037, as maps, is read in the
 * shape it opens in; nothing is written back.
 */
export function readProject(
  id: string,
  name: string,
  state: Uint8Array | null,
  updates: Uint8Array[],
): ProjectRead {
  const doc = new Y.Doc();
  if (state) Y.applyUpdate(doc, state);
  // A change that cannot be applied is left, as when the project is opened,
  // and counted: what is found is then said to be of a project read in part.
  let unapplied = 0;
  for (const update of updates) {
    try {
      Y.applyUpdate(doc, update);
    } catch {
      unapplied++;
    }
  }
  if (needsMigration(doc)) migrate(doc, name);
  const yNodes = doc.getMap<Y.Map<unknown>>('nodes');
  const yLinks = doc.getMap<Y.Map<unknown>>('links');
  const yRefs = doc.getMap<RefRecord>('refs');
  const yNotes = doc.getMap<Y.Text>('notes');
  // The kinds of the writer's own, which the reading of texts takes.
  const own = readBasedKinds(doc.getMap<unknown>('passageKinds'));

  const flat: FlatNode[] = [];
  const nodes = new Map<string, Y.Map<unknown>>();
  for (const [nodeId, n] of yNodes) {
    if (!(n instanceof Y.Map)) continue;
    nodes.set(nodeId, n);
    flat.push({
      id: nodeId,
      parent: (n.get('parent') as string | null | undefined) ?? null,
      order: str(n.get('order'), 'a0'),
    });
  }
  const tree = buildTree(flat);
  const elements: ElementRead[] = [];
  for (const nodeId of tree.sequence) {
    const n = nodes.get(nodeId);
    if (!n) continue;
    const title = readTitle(n.get('title') as Y.XmlFragment | undefined);
    const blocks = readBody(n.get('body') as Y.XmlFragment | undefined, own);
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
      document: (n.get('document') as DocumentSettings | undefined) ?? {},
      tree: pathTo(tree, nodeId)[1] ?? null,
    });
  }
  const byId = new Map(elements.map((e) => [e.id, e]));

  const links: { from: string; to: string; label: string }[] = [];
  for (const l of yLinks.values()) {
    if (!(l instanceof Y.Map)) continue;
    const label = str(l.get('label'));
    const from = str(l.get('from'));
    const to = str(l.get('to'));
    if (label && byId.has(from) && byId.has(to)) links.push({ from, to, label });
  }

  const refs = new Map<string, RefRecord>();
  for (const [refId, r] of yRefs) if (r && typeof r === 'object') refs.set(refId, r);
  const notes: { ref: string; text: string }[] = [];
  for (const [ref, text] of yNotes) {
    const said = text instanceof Y.Text ? text.toString() : '';
    if (said.trim()) notes.push({ ref, text: said });
  }
  doc.destroy();
  return { id, name: str(name), tree, elements, byId, links, refs, notes, unapplied };
}

// ---- what stands outside the text, as the text in view shows it ----

/** Something words can point to, in the document it is counted in. */
type Pointed = { kind: PointedKind; number: string | null; words: string };

/** A reference a project keeps, as a citation shows it. */
const workOf = (r: RefRecord): CitedWork => ({
  authors: r.authors ?? '',
  year: r.year ?? '',
  title: r.title ?? '',
  key: r.key ?? '',
});

/**
 * The documents of a project, the project's own and each tree under it,
 * with what is said of each as a document: its own settings laid over the
 * project's, as `Project.documentOf` lays them, but for the title and the
 * subtitle, which are each document's own. The window works out from them
 * the words each document shows (`LabelWords`), which it has and the
 * worker has not: the format and the language.
 */
export interface ReadDocument {
  /** The tree under the project, by its id; the project itself for its own. */
  tree: string;
  settings: DocumentSettings;
}

export function documentsOf(project: ProjectRead): ReadDocument[] {
  const own = project.byId.get(PROJECT)?.document ?? {};
  const set = (d: DocumentSettings) =>
    Object.fromEntries(
      Object.entries(d).filter(
        ([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length),
      ),
    ) as DocumentSettings;
  const shared = Object.fromEntries(
    Object.entries(set(own)).filter(([k]) => !OWN_SETTINGS.includes(k as keyof DocumentSettings)),
  ) as DocumentSettings;
  return [
    { tree: PROJECT, settings: set(own) },
    ...(project.tree.children.get(PROJECT) ?? []).map((tree) => ({
      tree,
      settings: { ...shared, ...set(project.byId.get(tree)?.document ?? {}) },
    })),
  ];
}

/**
 * What words that point say in the document of an element, counted as the
 * document counts: see `figures/numbering.svelte.ts`. The document is walked
 * from `top`: the tree under the project that is the document, or the
 * project itself, for the whole of it.
 */
function pointersOf(project: ProjectRead, top: string = PROJECT): Map<string, Pointed> {
  const out = new Map<string, Pointed>();
  const counted: Record<string, number> = { figure: 0, table: 0, equation: 0 };
  const walkBranch = (branch: string, within: Set<string>) => {
    const walk = (id: string, root: boolean) => {
      const e = project.byId.get(id);
      if (!e || e.excluded) return;
      if (!root && e.heading && e.name && !out.has(id))
        out.set(id, { kind: 'part', number: null, words: e.name });
      for (const s of e.set) {
        const number = s.numbered ? String(++counted[s.kind]) : null;
        if (s.id && !out.has(s.id)) out.set(s.id, { kind: s.kind, number, words: s.words });
      }
      if (!root && e.include && !within.has(e.include))
        walkBranch(e.include, new Set([...within, e.include]));
      for (const child of project.tree.children.get(id) ?? []) walk(child, false);
    };
    walk(branch, true);
  };
  walkBranch(top, new Set([top]));
  return out;
}

// ---- searching ----

export type Where = 'text' | 'details' | 'association' | 'note';

/** Something that was found in a project, with the words around it. */
export interface Found {
  where: Where;
  /**
   * The tree under the project it is in: that child of the project, by its
   * id, and its name. Nothing for the project's own element, and for what
   * is in no element.
   */
  tree: string | null;
  treeName: string;
  /** The element it was found in; of an association, the element it begins at; of details, the element they are said of. */
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
  /** How many of the project's changes could not be applied when it was read (`ProjectRead`). */
  unapplied: number;
}

/** The words around what was found, cut at the ends of words, and shown without what is no text. */
export function around(
  text: string,
  start: number,
  end: number,
  room = 56,
): [string, string, string] {
  const clean = (s: string) =>
    s.replaceAll(NO_TEXT, '').replaceAll(PARAGRAPH, ' ¶ ').replace(/\s+/g, ' ');
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

/** Each passage by itself, as lines read as one are. */
function alone(passages: Passage[]): Joined[] {
  return passages.map((p) => ({ text: p.text, passages: [p], starts: [0] }));
}

/**
 * The same lines read as one, read with what stands outside the text as it
 * is shown; and where a place in the first is in it.
 */
function shownAs(j: Joined, shown: Passage[]): { text: string; place: (offset: number) => number } {
  const seen = j.passages.map((p) => shown[p.index] ?? p);
  const starts: number[] = [];
  let text = '';
  seen.forEach((p, i) => {
    if (i) text += PARAGRAPH;
    starts.push(text.length);
    text += p.text;
  });
  return {
    text,
    place: (offset) => {
      const at = placeIn(j, offset);
      const i = j.passages.findIndex((p) => p.index === at.passage);
      return starts[i] + translate(j.passages[i], seen[i], at.offset);
    },
  };
}

/** The references a project cites, each once, as its texts have them. */
export function citedIn(project: ProjectRead): string[] {
  const out = new Set<string>();
  for (const element of project.elements) {
    for (const id of bodyFacts(element.blocks).cited) out.add(id);
  }
  return [...out];
}

/**
 * Searches a project. What is found is counted all; so many of it are kept,
 * with the words around them, in the order of the texts.
 */
export function searchProject(
  project: ProjectRead,
  words: string,
  options: SearchOptions,
  most = 300,
  shownWords: Record<string, LabelWords> = {},
): ProjectFound | { error: string } | null {
  const made = Matcher.make(words, options);
  if (!made) return null;
  if ('error' in made) return made;
  const matcher = made.matcher;
  const out: ProjectFound = {
    project: project.id,
    name: project.name,
    count: 0,
    found: [],
    unapplied: project.unapplied,
  };
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

  // What stands outside the text, as the text shows it: searched where that
  // is asked for, and shown in the words around what is found in any case.
  // Each document shows it in its own words, which the window sends
  // (`LabelWords`); one it sent none for, in those of a document without a
  // format of its own. The words that point are counted in each document.
  const wordsOf = (tree: string) => shownWords[tree] ?? PLAIN_WORDS;
  const lookup = (id: string) => {
    const r = project.refs.get(id);
    return r ? workOf(r) : null;
  };
  const labelled = new Map<string, { labels: Labels; key: string }>();
  const labelsOf = (tree: string) => {
    let known = labelled.get(tree);
    if (!known) {
      const said = wordsOf(tree);
      const citation = citationWordsOf(said.citation);
      let pointers: Map<string, Pointed> | null = null;
      const labels: Labels = {
        citation: (items, mode) => citationText(items, mode, lookup, citation),
        crossref: (target, form) =>
          pointerText(
            (pointers ??= pointersOf(project, tree)).get(target),
            refForm(form),
            said.pointer,
          ),
      };
      labelled.set(tree, (known = { labels, key: JSON.stringify(said) }));
    }
    return known;
  };
  /** The tree under the project an element is in, as what is found says it. */
  const treeOf = (e: ElementRead | undefined) => ({
    tree: e?.tree ?? null,
    treeName: e?.tree ? (project.byId.get(e.tree)?.name ?? '') : '',
  });
  {
    for (const e of project.elements) {
      const base = {
        where: 'text' as const,
        ...treeOf(e),
        element: e.id,
        elementName: e.name,
      };
      for (const hit of matcher.find(e.title.text))
        put({ ...base, part: 'title', passage: 0, start: hit.start, end: hit.end }, e.title.text);
      // Read with labels once for the words they are read with: other words, read anew.
      const shown = () => {
        const { labels, key } = labelsOf(e.tree ?? PROJECT);
        if (e.shown?.key !== key) e.shown = { key, passages: bodyPassages(e.blocks, labels) };
        return e.shown.passages;
      };
      const list = options.labels ? shown() : e.body;
      for (const j of matcher.acrossParagraphs ? joined(list) : alone(list)) {
        if (!j.text) continue;
        let seen: ReturnType<typeof shownAs> | null = null;
        for (const hit of matcher.find(j.text)) {
          const a = placeIn(j, hit.start);
          const b = placeIn(j, hit.end);
          const found = {
            ...base,
            part: 'body' as const,
            passage: a.passage,
            start: a.offset,
            end: b.offset,
          };
          if (options.labels) put(found, j.text, hit.start, hit.end);
          // Once so many are kept, the rest are only counted.
          else if (out.found.length >= most) put(found, '');
          else {
            seen ??= shownAs(j, shown());
            put(found, seen.text, seen.place(hit.start), seen.place(hit.end));
          }
        }
      }
    }
  }
  if (options.labels) {
    // The details of the document said of each element, and the words that name associations.
    for (const e of project.elements) {
      const d = e.document;
      const details = [
        d.title,
        d.subtitle,
        ...(d.authors ?? []).flatMap((a) => [a.name, a.affiliation, a.email]),
        (d.keywords ?? []).join(', '),
        d.date,
      ].filter((x): x is string => typeof x === 'string' && !!x.trim());
      for (const line of details) {
        for (const hit of matcher.find(line))
          put(
            {
              where: 'details',
              ...treeOf(e),
              element: e.id,
              elementName: e.name,
              part: null,
              passage: 0,
              start: hit.start,
              end: hit.end,
            },
            line,
          );
      }
    }
    for (const link of project.links) {
      const from = project.byId.get(link.from);
      for (const hit of matcher.find(link.label))
        put(
          {
            where: 'association',
            ...treeOf(from),
            element: link.from,
            elementName: `${from?.name ?? ''} ↔ ${project.byId.get(link.to)?.name ?? ''}`,
            part: null,
            passage: 0,
            start: hit.start,
            end: hit.end,
          },
          link.label,
        );
    }
    for (const note of project.notes) {
      for (const hit of matcher.find(note.text))
        put(
          {
            where: 'note',
            tree: null,
            treeName: '',
            element: null,
            elementName: '',
            part: null,
            passage: 0,
            start: hit.start,
            end: hit.end,
            ref: note.ref,
            work: (() => {
              const r = project.refs.get(note.ref);
              return r ? workText(workOf(r), wordsOf(PROJECT).citation) : '';
            })(),
          },
          note.text,
        );
    }
  }
  return out;
}
