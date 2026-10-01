/**
 * Replacing what was found, where the project keeps the text (ADR 0017): in
 * elements with an editor and without one alike. An editor that is bound to
 * the text takes the change up as it takes up what others write.
 *
 * In the project a run of text with its marks is one piece of a `Y.XmlText`,
 * so a match within the text of a paragraph is a delete and an insert there,
 * and what is put in has the marks of the first letter of what it replaces.
 * What spans a line that was broken within a paragraph is more than one
 * piece: the paragraph is then written anew by the means the editors write
 * with. Only text is replaced: what stands outside it is not searched when
 * text is to be replaced.
 */

import type { Attrs, Mark, Node } from 'prosemirror-model';
import { Transform } from 'prosemirror-transform';
import { updateYFragment } from 'y-prosemirror';
import * as Y from 'yjs';
import { bodySchema } from '$lib/editor/schema';
import { nodeOf } from '$lib/found/change';
import { markName } from '$lib/found/gather';
import type { Project } from '$lib/project/model/project.svelte';
import { refForm } from '$lib/project/model/text';
import { NO_TEXT, PassageMaker, pieceAt, type Labels, type Passage } from './passages';
import { positionOf, readLine } from './prosemirror';

/** Where a piece of a passage is kept in the project. */
export interface Kept {
  /** Of text: the text it is part of, where in it it begins, and its marks. */
  text?: Y.XmlText;
  index?: number;
  attributes?: Record<string, unknown>;
  /** Of what is no text: the element it is. */
  element?: Y.XmlElement;
}

export interface ReadY {
  passages: Passage[];
  refs: Kept[][];
  /** What holds each passage: a paragraph, what is said of a figure or a table, a note; the name. */
  holders: (Y.XmlElement | Y.XmlFragment | null)[];
}

const str = (value: unknown): string => (typeof value === 'string' ? value : '');

class Reader {
  readonly maker: PassageMaker<Kept>;
  readonly holders: ReadY['holders'] = [];

  constructor(labels: Labels | null) {
    this.maker = new PassageMaker<Kept>(labels);
  }

  get read(): ReadY {
    return { passages: this.maker.passages, refs: this.maker.refs, holders: this.holders };
  }

  line(
    holder: Y.XmlElement | Y.XmlFragment,
    kind: 'line' | 'note',
    within?: Passage['within'],
    said = false,
  ) {
    const { maker } = this;
    const passage = maker.begin(kind, within);
    this.holders[passage.index] = holder;
    const notes: { holder: Y.XmlElement; at: number }[] = [];
    const visit = (parent: Y.XmlElement | Y.XmlFragment) => {
      for (const child of parent.toArray()) {
        if (child instanceof Y.XmlText) {
          let index = 0;
          for (const op of child.toDelta() as {
            insert: unknown;
            attributes?: Record<string, unknown>;
          }[]) {
            if (typeof op.insert !== 'string') {
              index += 1;
              continue;
            }
            maker.put(passage, 'text', op.insert, {
              text: child,
              index,
              attributes: op.attributes ?? {},
            });
            index += op.insert.length;
          }
        } else if (child instanceof Y.XmlElement) {
          const at: Kept = { element: child };
          switch (child.nodeName) {
            case 'citation':
              maker.put(
                passage,
                'citation',
                maker.citation(child.getAttribute('items'), child.getAttribute('mode')),
                at,
              );
              break;
            case 'footnote':
              if (said) break;
              maker.put(passage, 'note', NO_TEXT, at);
              if (kind === 'line') notes.push({ holder: child, at: passage.text.length - 1 });
              break;
            case 'hard_break':
              maker.put(passage, 'break', '\n', at);
              break;
            case 'math': {
              const tex = str(child.getAttribute('tex') as unknown).trim();
              if (tex) maker.put(passage, 'math', maker.math(tex), at);
              break;
            }
            case 'crossref': {
              const target = str(child.getAttribute('target') as unknown);
              if (target)
                maker.put(
                  passage,
                  'crossref',
                  maker.crossref(target, refForm(child.getAttribute('form'))),
                  at,
                );
              break;
            }
            default:
              // Something a later version added: its text is read where it stands.
              visit(child);
          }
        }
      }
    };
    visit(holder);
    for (const n of notes) this.line(n.holder, 'note', { passage: passage.index, at: n.at });
  }

  blocks(parent: Y.XmlElement | Y.XmlFragment) {
    for (const child of parent.toArray()) {
      if (!(child instanceof Y.XmlElement)) continue;
      switch (child.nodeName) {
        case 'blockquote':
        case 'row':
        case 'verse':
        case 'parallel':
        case 'parallel_side':
          this.blocks(child);
          break;
        case 'bullet_list':
        case 'ordered_list':
          for (const item of child.toArray()) if (item instanceof Y.XmlElement) this.blocks(item);
          break;
        case 'equation': {
          const tex = str(child.getAttribute('tex') as unknown).trim();
          if (tex) this.holders[this.maker.equation(tex, { element: child }).index] = child;
          break;
        }
        case 'tabular':
          this.table(child);
          break;
        case 'figure':
          this.line(child, 'line', undefined, true);
          break;
        default:
          this.line(child, 'line');
      }
    }
  }

  table(tabular: Y.XmlElement) {
    const parts = tabular.toArray().filter((c): c is Y.XmlElement => c instanceof Y.XmlElement);
    const said = parts.find((c) => c.nodeName === 'table_caption');
    const table = parts.find((c) => c.nodeName === 'table');
    const rows = (table?.toArray() ?? [])
      .filter((r): r is Y.XmlElement => r instanceof Y.XmlElement)
      .map((row) => row.toArray().filter((c): c is Y.XmlElement => c instanceof Y.XmlElement))
      .filter((row) => row.length);
    // A table without cells is not shown, and is not read.
    if (!rows.length) return;
    if (said) this.line(said, 'line', undefined, true);
    else this.holders[this.maker.begin('line').index] = null;
    for (const row of rows) for (const cell of row) this.blocks(cell);
  }
}

/** The passages of the text of an element as the project keeps it. */
export function readBodyY(fragment: Y.XmlFragment, labels: Labels | null = null): ReadY {
  const reader = new Reader(labels);
  reader.blocks(fragment);
  return reader.read;
}

/** The passage of the name of an element as the project keeps it. */
export function readTitleY(fragment: Y.XmlFragment): ReadY {
  const reader = new Reader(null);
  reader.line(fragment, 'line');
  return reader.read;
}

/** Something to be replaced, as it was found. */
export interface Replacing {
  element: string;
  part: 'title' | 'body';
  passage: number;
  start: number;
  end: number;
  /** The text that was found, which must still stand there. */
  found: string;
  /** What is put in its place. */
  text: string;
}

/** The marks of ProseMirror that attributes of the project stand for. */
function marksOf(attributes: Record<string, unknown>): readonly Mark[] {
  let marks: readonly Mark[] = [];
  for (const [name, value] of Object.entries(attributes)) {
    const type = bodySchema.marks[markName(name)];
    if (type && value != null) marks = type.create(value as Attrs).addToSet(marks);
  }
  return marks;
}

/**
 * Writes the changes of one passage by writing what holds it anew, as an
 * editor would: for what spans more than one piece of text.
 */
function rewrite(
  project: Project,
  holder: Y.XmlElement,
  kind: 'line' | 'note',
  list: Replacing[],
  read: ReadY,
  passage: number,
): number {
  let node: Node;
  try {
    node = nodeOf(holder);
  } catch {
    return 0;
  }
  const doc = readLine(node, kind);
  if (doc.passages[0]?.text !== read.passages[passage].text) return 0;
  const tr = new Transform(node);
  let done = 0;
  for (const change of list) {
    const from = positionOf(doc, 0, change.start);
    const to = positionOf(doc, 0, change.end, true);
    const first = read.refs[passage][pieceAt(read.passages[passage], change.start)];
    const marks = marksOf(first?.attributes ?? {});
    try {
      if (change.text) tr.replaceWith(from, to, bodySchema.text(change.text, marks));
      else tr.delete(from, to);
      done++;
    } catch {
      // Not a place where text can stand: it is left as it is.
    }
  }
  if (done)
    updateYFragment(project.doc, holder, tr.doc, { mapping: new Map(), isOMark: new Map() });
  return done;
}

/**
 * Replaces the changes of one passage, the last first, so that where the
 * others are stays as it was read. Returns how many were made.
 */
function replaceIn(project: Project, read: ReadY, passage: number, list: Replacing[]): number {
  const p = read.passages[passage];
  if (!p) return 0;
  const refs = read.refs[passage];
  const standing = list.filter((c) => p.text.slice(c.start, c.end) === c.found && c.end > c.start);
  // What spans more than one piece of the project is written as an editor would write it.
  const one = (c: Replacing) => {
    const first = pieceAt(p, c.start);
    const last = pieceAt(p, c.end - 1);
    for (let i = first; i <= last; i++) {
      if (p.pieces[i].kind !== 'text' || refs[i].text !== refs[first].text) return false;
    }
    return true;
  };
  const spanning = standing.filter((c) => !one(c));
  if (spanning.length) {
    const holder = read.holders[passage];
    // Only text and broken lines are replaced: what stands outside the text is not.
    const text = spanning.every((c) => {
      for (let i = pieceAt(p, c.start); i <= pieceAt(p, c.end - 1); i++)
        if (p.pieces[i].kind !== 'text' && p.pieces[i].kind !== 'break') return false;
      return true;
    });
    if (!(holder instanceof Y.XmlElement) || !text || p.kind === 'equation') return 0;
    return rewrite(
      project,
      holder,
      p.kind === 'note' ? 'note' : 'line',
      [...standing].sort((a, b) => b.start - a.start),
      read,
      passage,
    );
  }
  let done = 0;
  for (const change of [...standing].sort((a, b) => b.start - a.start)) {
    const first = pieceAt(p, change.start);
    const last = pieceAt(p, change.end - 1);
    const kept = refs[first];
    const type = kept.text!;
    const from = kept.index! + (change.start - p.pieces[first].start);
    const to = refs[last].index! + (change.end - p.pieces[last].start);
    type.delete(from, to - from);
    if (change.text) type.insert(from, change.text, { ...(kept.attributes ?? {}) });
    else if (type.length === 0 && type.parent) {
      // A text that is empty is no longer a text: it goes, as an editor would leave it.
      const parent = type.parent as Y.XmlElement | Y.XmlFragment;
      const at = parent.toArray().indexOf(type);
      if (at >= 0) parent.delete(at, 1);
    }
    done++;
  }
  return done;
}

/**
 * Replaces what was found, in one step that undo takes back as one. What no
 * longer stands where it was found is left. Returns how many were replaced.
 */
export function replaceAll(project: Project, list: Replacing[]): number {
  if (!list.length) return 0;
  const byPart = new Map<string, Replacing[]>();
  for (const change of list) {
    const key = `${change.element}\u0000${change.part}`;
    const those = byPart.get(key);
    if (those) those.push(change);
    else byPart.set(key, [change]);
  }
  let done = 0;
  project.checkpoint();
  try {
    project.transact(() => {
      for (const those of byPart.values()) {
        const { element, part } = those[0];
        const fragment = project.fragment(element, part);
        if (!fragment) continue;
        const read = part === 'title' ? readTitleY(fragment) : readBodyY(fragment);
        const byPassage = new Map<number, Replacing[]>();
        for (const change of those) {
          const in_ = byPassage.get(change.passage);
          if (in_) in_.push(change);
          else byPassage.set(change.passage, [change]);
        }
        // Notes are read after the passage they stand in, and are changed before it.
        for (const passage of [...byPassage.keys()].sort((a, b) => b - a))
          done += replaceIn(project, read, passage, byPassage.get(passage)!);
      }
    });
  } finally {
    project.checkpoint();
  }
  return done;
}
