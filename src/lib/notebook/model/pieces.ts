/**
 * The pieces of a note, read from its text without an editor: what is
 * dragged and what goes somewhere (record 0101). A picture is a piece by
 * itself, and so is a file; paragraphs taken whole from one passage are one
 * piece; the rest, the writer's own (which may hold taken words within a
 * paragraph), tables, formulas and anything else, are pieces in the runs
 * they stand in. Empty paragraphs belong to no piece: a run goes on across
 * them where what follows goes on with it, and they are left out at its
 * edges.
 */

import * as Y from 'yjs';
import {
  blocksOfElement,
  blocksText,
  type Block,
  type Inline,
  type ParagraphBlock,
} from '$lib/project/model/text';
import type { Holds, Piece } from './types';

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/** The passage words were taken in as, where they carry the mark `taken`. */
export function passageOf(marks: Record<string, Record<string, unknown> | true>): string | null {
  const taken = marks.taken;
  return taken && typeof taken === 'object' && typeof taken.passage === 'string' && taken.passage
    ? taken.passage
    : null;
}

/** Whether a paragraph holds nothing to read: no words, nothing that stands for any. */
function isEmpty(p: ParagraphBlock): boolean {
  return p.content.every(
    (i) => (i.kind === 'text' && !i.text.trim()) || i.kind === 'break' || i.kind === 'linemark',
  );
}

/**
 * The one passage a paragraph is taken whole from: it has words, and every
 * letter of them carries the mark `taken` of that passage. None otherwise.
 */
export function takenWhole(p: ParagraphBlock): string | null {
  let passage: string | null = null;
  for (const i of p.content) {
    if (i.kind !== 'text' || !i.text.trim()) continue;
    const of = passageOf(i.marks);
    if (!of || (passage && of !== passage)) return null;
    passage = of;
  }
  return passage;
}

/** What a part at the top of a text is, for its piece. */
type Part =
  | { kind: 'empty' }
  | { kind: 'own'; blocks: Block[] }
  | { kind: 'passage'; blocks: Block[]; passage: string }
  | { kind: 'figure'; blocks: Block[]; hash: string; extension: string; name: string }
  | { kind: 'file'; hash: string; name: string; extension: string };

function partOf(child: Y.XmlElement): Part {
  if (child.nodeName === 'file')
    return {
      kind: 'file',
      hash: text(child.getAttribute('hash') as unknown),
      name: text(child.getAttribute('name') as unknown),
      extension: text(child.getAttribute('extension') as unknown),
    };
  const blocks = blocksOfElement(child);
  if (child.nodeName === 'figure')
    return {
      kind: 'figure',
      blocks,
      hash: text(child.getAttribute('file') as unknown),
      extension: text(child.getAttribute('extension') as unknown),
      name: text(child.getAttribute('name') as unknown),
    };
  if (child.nodeName === 'paragraph' && blocks.length === 1 && blocks[0].kind === 'paragraph') {
    const p = blocks[0];
    if (isEmpty(p)) return { kind: 'empty' };
    const passage = takenWhole(p);
    if (passage) return { kind: 'passage', blocks, passage };
  }
  return { kind: 'own', blocks };
}

/** Whether a text holds nothing but empty paragraphs. */
export function holdsNothing(fragment: Y.XmlFragment): boolean {
  return fragment
    .toArray()
    .every(
      (c) =>
        c instanceof Y.XmlElement &&
        c.nodeName === 'paragraph' &&
        c.toArray().every((t) => t instanceof Y.XmlText && !t.toString().trim()),
    );
}

/** The pieces of a note's text, in the order they stand. */
export function piecesOf(fragment: Y.XmlFragment | null | undefined): Piece[] {
  if (!fragment) return [];
  const children = fragment.toArray();
  const pieces: Piece[] = [];
  /** The run being gathered: its first and last parts that are not empty, and what it holds. */
  let run: {
    from: number;
    to: number;
    kind: 'own' | 'passage';
    passage: string;
    blocks: Block[][];
  } | null = null;
  /** The blocks of the empty paragraphs since the last part of the run. */
  let between: Block[][] = [];
  const end = () => {
    if (run) {
      const blocks = run.blocks.flat();
      pieces.push(
        run.kind === 'own'
          ? { kind: 'own', from: run.from, to: run.to, blocks }
          : { kind: 'passage', from: run.from, to: run.to, blocks, passage: run.passage },
      );
    }
    run = null;
    between = [];
  };
  children.forEach((child, index) => {
    if (!(child instanceof Y.XmlElement)) return;
    const part = partOf(child);
    if (part.kind === 'empty') {
      if (run) between.push(blocksOfElement(child));
      return;
    }
    if (part.kind === 'own' || part.kind === 'passage') {
      const passage = part.kind === 'passage' ? part.passage : '';
      if (run && run.kind === part.kind && run.passage === passage) {
        run.blocks.push(...between, part.blocks);
        run.to = index + 1;
        between = [];
        return;
      }
      end();
      run = { from: index, to: index + 1, kind: part.kind, passage, blocks: [part.blocks] };
      return;
    }
    end();
    if (part.kind === 'figure')
      pieces.push({
        kind: 'figure',
        from: index,
        to: index + 1,
        blocks: part.blocks,
        hash: part.hash,
        extension: part.extension,
        name: part.name,
      });
    else
      pieces.push({
        kind: 'file',
        from: index,
        to: index + 1,
        hash: part.hash,
        name: part.name,
        extension: part.extension,
      });
  });
  end();
  return pieces;
}

/** Every block, and every block within one, in the order they stand. */
export function eachBlock(blocks: Block[], visit: (block: Block) => void) {
  for (const b of blocks) {
    visit(b);
    if (b.kind === 'parallel') {
      eachBlock(b.left, visit);
      eachBlock(b.right, visit);
    } else if (b.kind === 'row') eachBlock(b.items, visit);
    else if (b.kind === 'table')
      for (const row of b.rows) for (const c of row) eachBlock(c.content, visit);
  }
}

/** Every piece of inline content of the blocks, notes and what is said of figures and tables with it. */
export function eachInline(blocks: Block[], visit: (inline: Inline) => void) {
  const inlines = (list: Inline[]) => {
    for (const i of list) {
      visit(i);
      if (i.kind === 'footnote') inlines(i.content);
    }
  };
  eachBlock(blocks, (b) => {
    if (b.kind === 'paragraph') inlines(b.content);
    else if (b.kind === 'figure' || b.kind === 'table') inlines(b.caption);
  });
}

/** What a note's pieces hold that has a source: the passages its words were taken in, and its files, in the order met, each once. */
export type Met = { passage: string } | { hash: string };

export function metOf(pieces: Piece[]): Met[] {
  const out: Met[] = [];
  const seen = new Set<string>();
  const meet = (key: string, met: Met) => {
    if (seen.has(key)) return;
    seen.add(key);
    out.push(met);
  };
  for (const piece of pieces) {
    if (piece.kind === 'file') {
      if (piece.hash) meet(`f:${piece.hash}`, { hash: piece.hash });
      continue;
    }
    // In the order they stand: a picture after the words before it.
    eachBlock(piece.blocks, (b) => {
      if (b.kind === 'figure' && b.file) meet(`f:${b.file}`, { hash: b.file });
      const visit = (list: Inline[]) => {
        for (const i of list) {
          if (i.kind === 'text') {
            const passage = passageOf(i.marks);
            if (passage) meet(`p:${passage}`, { passage });
          } else if (i.kind === 'footnote') visit(i.content);
        }
      };
      if (b.kind === 'paragraph') visit(b.content);
      else if (b.kind === 'figure' || b.kind === 'table') visit(b.caption);
    });
  }
  return out;
}

/** The text of the pieces, as plain text: a line to a paragraph; files by their names. */
function piecesText(pieces: Piece[]): string {
  return pieces
    .map((p) => (p.kind === 'file' ? p.name : blocksText(p.blocks)))
    .filter((s) => s.trim())
    .join('\n');
}

/** A note's words for finding: its name and its text, in lower case. */
export function wordsOf(pieces: Piece[], name: string): string {
  return `${name}\n${piecesText(pieces)}`.toLowerCase();
}

/** How many signs of a note's first words are shown where it has no name. */
const BEGINS = 120;

/** How a note begins: the first words of its text, in one line, cut where long. Empty where it has no words. */
export function beginsOf(pieces: Piece[]): string {
  const words = pieces
    .map((p) => (p.kind === 'file' ? '' : blocksText(p.blocks)))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (words.length <= BEGINS) return words;
  const cut = words.slice(0, BEGINS);
  const space = cut.lastIndexOf(' ');
  return `${(space > BEGINS / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** The name of the first file or picture of a note's pieces; empty where it holds none. */
export function firstFileName(pieces: Piece[]): string {
  for (const piece of pieces)
    if ((piece.kind === 'file' || piece.kind === 'figure') && piece.name) return piece.name;
  return '';
}

/** What a note's pieces hold. */
export function holdsOf(pieces: Piece[]): Holds {
  const holds: Holds = { own: false, passages: false, pictures: false, files: false, links: false };
  for (const piece of pieces) {
    if (piece.kind === 'file') {
      holds.files = true;
      continue;
    }
    eachBlock(piece.blocks, (b) => {
      if (b.kind === 'figure') holds.pictures = true;
      // A formula or a table is no taking: it is the writer's own.
      else if (b.kind === 'equation' || b.kind === 'table') holds.own = true;
    });
    eachInline(piece.blocks, (i) => {
      if (i.kind === 'text') {
        if (i.marks.link) holds.links = true;
        if (passageOf(i.marks)) holds.passages = true;
        else if (i.text.trim()) holds.own = true;
      } else if (i.kind === 'math' || i.kind === 'citation') holds.own = true;
    });
  }
  return holds;
}

/** The first picture the pieces hold. */
export function pictureOf(pieces: Piece[]): { hash: string; extension: string } | null {
  for (const piece of pieces) {
    if (piece.kind === 'file') continue;
    let found: { hash: string; extension: string } | null = null;
    eachBlock(piece.blocks, (b) => {
      if (!found && b.kind === 'figure' && b.file) found = { hash: b.file, extension: b.extension };
    });
    if (found) return found;
  }
  return null;
}
