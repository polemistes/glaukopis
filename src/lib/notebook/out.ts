/**
 * What goes from a note into a text of a project (record 0101): a note, or
 * pieces of one, dragged into a text, or onto an element whose text is not
 * being written, or put in from the menu; and what is copied in a note and
 * pasted into a text. Every way goes through one conversion, over the
 * blocks the pieces of a note carry (`project/model/text.ts`):
 *
 * - the writer's own words arrive as they are;
 * - paragraphs taken whole in one passage arrive as paragraphs of the kind
 *   Quotation, with the citation of the passage's source after the last;
 * - taken words within a paragraph of the writer's stay where they are,
 *   with the citation of their source after each unbroken run of them;
 * - a picture arrives as the figure it is, and its file is from then a file
 *   of the library, with where it came from;
 * - a file that is no picture does not go into a text.
 *
 * A source that is no reference of the library is made one first. The note
 * says where its pieces went.
 */

import { Fragment, Slice, type Node, type Schema } from 'prosemirror-model';
import { dropPoint } from 'prosemirror-transform';
import type { EditorView } from 'prosemirror-view';
import { yXmlFragmentToProseMirrorFragment, ySyncPluginKey } from 'y-prosemirror';
import * as Y from 'yjs';
import { libraryAdd } from '$lib/api/library';
import { notebookToLibrary } from '$lib/api/notebook';
import { copiedBlocks } from '$lib/editor/clipboard';
import { keepReference } from '$lib/editor/references.svelte';
import type { CiteItem } from '$lib/editor/schema';
import { hooksOf, viewsByDom } from '$lib/editor/ui.svelte';
import { files } from '$lib/files/store.svelte';
import { t } from '$lib/i18n';
import { openProjects } from '$lib/project/open-projects.svelte';
import { blockElements } from '$lib/project/model/blocks';
import type { Project } from '$lib/project/model/project.svelte';
import type { Block, Inline, InlineText, ParagraphBlock } from '$lib/project/model/text';
import { library } from '$lib/state/library.svelte';
import { router } from '$lib/state/router.svelte';
import type { DragPayload } from '$lib/ui/drag.svelte';
import { notify, notifyError, toasts } from '$lib/ui/toast.svelte';
import type { Notebook } from './model/notebook.svelte';
import { eachBlock, eachInline, metOf, passageOf, takenWhole } from './model/pieces';
import type { NoteRecord, Piece, Source, Went } from './model/types';
import { theNotebook } from './open.svelte';
import { draftOf, originOf, sourceLabel } from './sources';

/** What is dragged from the list of notes: a note, or pieces of it. */
export const NOTE_PIECES = 'note-pieces';

export interface NotePieces {
  note: string;
  /** The places of the pieces among the note's (`NoteRecord.pieces`); none for the whole note. */
  pieces: number[] | null;
}

/** What may become of a piece in a text. */
export type Became = Extract<Went['what'], 'text' | 'quotation' | 'figure'>;

// =====================================================================
// The conversion
// =====================================================================

/** The citation of what was taken in a passage: none, where its source is no reference. */
export type CiteOf = (passage: string) => CiteItem | null;

/** What a conversion gives: the blocks to put in, and what arrived of each kind. */
export interface Converted {
  blocks: Block[];
  became: Set<Became>;
}

const isEmpty = (p: ParagraphBlock): boolean =>
  p.content.every(
    (i) => (i.kind === 'text' && !i.text.trim()) || i.kind === 'break' || i.kind === 'linemark',
  );

const hasWords = (p: ParagraphBlock): boolean =>
  p.content.some((i) => (i.kind === 'text' && !!i.text.trim()) || i.kind !== 'text');

function withoutTaken(marks: InlineText['marks']): InlineText['marks'] {
  const out = { ...marks };
  delete out.taken;
  return out;
}

/** A space before what is put after the inline content, where it does not end in one. */
function spaced(content: Inline[]) {
  const last = content[content.length - 1];
  if (!last || (last.kind === 'text' && /\s$/.test(last.text))) return;
  content.push({ kind: 'text', text: ' ', marks: {} });
}

function citationOf(item: CiteItem): Inline {
  return { kind: 'citation', items: [item], mode: 'normal' };
}

/**
 * Inline content with the mark `taken` gone, and the citation of each
 * unbroken run of taken words after it. Words of `whole`, the passage a
 * paragraph is taken whole from, are not cited here: the paragraph is.
 */
function inlinesConverted(
  list: Inline[],
  cite: CiteOf,
  found: { taken: boolean },
  whole: string | null = null,
): Inline[] {
  const out: Inline[] = [];
  list.forEach((i, at) => {
    if (i.kind === 'footnote') {
      out.push({ ...i, content: inlinesConverted(i.content, cite, found) });
      return;
    }
    if (i.kind !== 'text') {
      out.push(i);
      return;
    }
    const passage = passageOf(i.marks);
    if (!passage) {
      out.push(i);
      return;
    }
    out.push({ ...i, marks: withoutTaken(i.marks) });
    if (passage === whole) return;
    found.taken = true;
    const next = list[at + 1];
    if (next?.kind === 'text' && passageOf(next.marks) === passage) return;
    const item = cite(passage);
    if (item) {
      spaced(out);
      out.push(citationOf(item));
    }
  });
  return out;
}

/** The blocks within another: taken words lose their mark and are cited where they stand. */
function within(blocks: Block[], cite: CiteOf, became: Set<Became>): Block[] {
  return blocks.map((b) => converted1(b, cite, became));
}

/** One block that is not a paragraph taken whole at the top of the text. */
function converted1(b: Block, cite: CiteOf, became: Set<Became>): Block {
  const found = { taken: false };
  let out: Block;
  switch (b.kind) {
    case 'paragraph':
      out = { ...b, content: inlinesConverted(b.content, cite, found) };
      if (hasWords(b)) became.add('text');
      break;
    case 'figure':
      // A figure dropped twice is two figures: each is given an id of its own.
      out = { ...b, id: '', caption: inlinesConverted(b.caption, cite, found) };
      became.add('figure');
      break;
    case 'table':
      out = {
        ...b,
        id: '',
        caption: inlinesConverted(b.caption, cite, found),
        rows: b.rows.map((row) =>
          row.map((cell) => ({ ...cell, content: within(cell.content, cite, became) })),
        ),
      };
      became.add('text');
      break;
    case 'equation':
      out = { ...b, id: '' };
      became.add('text');
      break;
    case 'parallel':
      out = { ...b, left: within(b.left, cite, became), right: within(b.right, cite, became) };
      break;
    case 'row':
      out = { ...b, items: within(b.items, cite, became) };
      break;
    default:
      out = b;
  }
  if (found.taken) became.add('quotation');
  return out;
}

/**
 * The blocks of what came from notes, as they arrive in a text. With
 * `inline`, they are words going into a paragraph where they are put, and
 * no paragraph of them becomes a quotation of its own.
 */
export function convertBlocks(blocks: Block[], cite: CiteOf, inline = false): Converted {
  const became = new Set<Became>();
  const out: Block[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    const passage = !inline && b.kind === 'paragraph' ? takenWhole(b) : null;
    if (!passage) {
      out.push(converted1(b, cite, became));
      i++;
      continue;
    }
    // The run of paragraphs taken whole in the passage, empty ones between them.
    let last = i;
    for (let j = i + 1; j < blocks.length; j++) {
      const n = blocks[j];
      if (n.kind !== 'paragraph') break;
      if (isEmpty(n)) continue;
      if (takenWhole(n) !== passage) break;
      last = j;
    }
    const found = { taken: false };
    for (let k = i; k <= last; k++) {
      const p = blocks[k] as ParagraphBlock;
      if (isEmpty(p)) {
        out.push(p);
        continue;
      }
      const content = inlinesConverted(p.content, cite, found, passage);
      if (k === last) {
        const item = cite(passage);
        if (item) {
          spaced(content);
          content.push(citationOf(item));
        }
      }
      out.push({ ...p, name: 'quote', content });
    }
    became.add('quotation');
    i = last + 1;
  }
  return { blocks: out, became };
}

// =====================================================================
// Sources made references
// =====================================================================

/** Sources being made references now, so that two drops at once make one. */
const making = new Map<string, Promise<string | null>>();

/**
 * The reference of the library a source is: the one it has been made, where
 * the library has it; a reference's own; else one made of it now, and said.
 * Nothing where none can be made, which is said.
 */
export function referenceOf(notebook: Notebook, source: Source): Promise<string | null> {
  let made = making.get(source.id);
  if (!made) {
    made = madeReference(notebook, source).finally(() => making.delete(source.id));
    making.set(source.id, made);
  }
  return made;
}

async function madeReference(notebook: Notebook, source: Source): Promise<string | null> {
  await library.load();
  if (source.reference && library.get(source.reference)) return source.reference;
  if (source.sort === 'reference') return source.reference;
  const draft = draftOf(source);
  if (!draft) return null;
  try {
    const saved = await libraryAdd(draft);
    library.put(saved);
    notebook.madeReference(source.id, saved.id);
    toasts.show({
      kind: 'ok',
      message: t('notebook-pane-reference-made', {
        title: saved.summary.title || sourceLabel(source),
      }),
      action: {
        label: t('common-show'),
        run: () => router.go({ view: 'library', entry: saved.id }),
      },
    });
    return saved.id;
  } catch (error) {
    notifyError(t('notebook-pane-reference-not-made', { source: sourceLabel(source) }), error);
    return null;
  }
}

/** The passages whose words the blocks hold, each once. */
function passagesIn(blocks: Block[]): Set<string> {
  const out = new Set<string>();
  eachInline(blocks, (i) => {
    if (i.kind !== 'text') return;
    const passage = passageOf(i.marks);
    if (passage) out.add(passage);
  });
  return out;
}

/** The pictures the blocks show, by their hashes, each once. */
function picturesIn(blocks: Block[]): Set<string> {
  const out = new Set<string>();
  eachBlock(blocks, (b) => {
    if (b.kind === 'figure' && b.file) out.add(b.file);
  });
  return out;
}

/**
 * How each passage is cited: the source of each made a reference first,
 * each source once. The references cited are given with it.
 */
async function citationsOf(
  notebook: Notebook,
  passages: Set<string>,
): Promise<{ cite: CiteOf; cited: string[] }> {
  const sources = new Map<string, Source>();
  for (const id of passages) {
    const source = notebook.passages.get(id)?.source;
    const found = source ? notebook.sources.get(source) : undefined;
    if (found) sources.set(found.id, found);
  }
  const references = new Map<string, string>();
  for (const source of sources.values()) {
    const reference = await referenceOf(notebook, source);
    if (reference) references.set(source.id, reference);
  }
  const items = new Map<string, CiteItem>();
  for (const id of passages) {
    const source = notebook.passages.get(id)?.source;
    const reference = source ? references.get(source) : undefined;
    if (!source || !reference) continue;
    const s = sources.get(source);
    items.set(id, {
      id: reference,
      ...(s?.sort === 'reference' && s.locator ? { locator: s.locator } : {}),
      ...(s?.sort === 'reference' && s.label ? { label: s.label } : {}),
    });
  }
  return {
    cite: (passage) => items.get(passage) ?? null,
    cited: [...new Set(references.values())],
  };
}

/**
 * Puts the pictures the notebook holds among the library's files, with
 * where they came from. Gives those that could not be, which are said.
 */
async function picturesToLibrary(notebook: Notebook, hashes: Set<string>): Promise<Set<string>> {
  const failed = new Set<string>();
  let moved = false;
  for (const hash of hashes) {
    const held = notebook.files.get(hash);
    if (!held) continue;
    const source = held.source ? (notebook.sources.get(held.source) ?? null) : null;
    try {
      await notebookToLibrary(hash, originOf(source));
      moved = true;
    } catch (error) {
      failed.add(hash);
      notifyError(t('notebook-pane-picture-not-moved', { name: held.name }), error);
    }
  }
  if (moved) void files.reload();
  return failed;
}

/** The blocks without the figures of these pictures. */
function withoutPictures(blocks: Block[], hashes: Set<string>): Block[] {
  if (!hashes.size) return blocks;
  return blocks.flatMap((b): Block[] => {
    if (b.kind === 'figure') return hashes.has(b.file) ? [] : [b];
    if (b.kind === 'row') return [{ ...b, items: withoutPictures(b.items, hashes) }];
    return [b];
  });
}

// =====================================================================
// What arrives
// =====================================================================

/** What arrives in a text of a project, with what is to be told of it. */
export interface Arrival {
  blocks: Block[];
  /** Words going into the paragraph where they are put. */
  inline: boolean;
  /** For each note something came from, what of it arrived. */
  notes: Map<string, Set<Became>>;
  /** The references cited, which the project keeps a copy of. */
  cited: string[];
  /** Whether files that are no pictures were left out. */
  leftOut: boolean;
}

/**
 * Makes what arrives of blocks that came from notes: the sources made
 * references, the pictures put among the library's files, the blocks
 * converted. `whose` says for each kind that arrived which notes it came
 * from.
 */
async function arrival(
  notebook: Notebook,
  blocks: Block[],
  inline: boolean,
  whose: (
    became: Set<Became>,
    passages: Set<string>,
    pictures: Set<string>,
  ) => Map<string, Set<Became>>,
  leftOut: boolean,
): Promise<Arrival> {
  const passages = passagesIn(blocks);
  const { cite, cited } = await citationsOf(notebook, passages);
  const held = new Set([...picturesIn(blocks)].filter((h) => notebook.files.has(h)));
  const failed = await picturesToLibrary(notebook, held);
  const converted = convertBlocks(withoutPictures(blocks, failed), cite, inline);
  const pictures = new Set([...held].filter((h) => !failed.has(h)));
  return {
    blocks: converted.blocks,
    inline,
    notes: whose(converted.became, passages, pictures),
    cited,
    leftOut,
  };
}

/** The pieces of a note dragged: those asked for, or all of them. */
function piecesOf(note: NoteRecord, indexes: number[] | null): Piece[] {
  if (!indexes) return note.pieces;
  return indexes.flatMap((i) => (note.pieces[i] ? [note.pieces[i]] : []));
}

/** What arrives of pieces of a note dragged or put in. */
export async function arrivalOfPieces(
  notebook: Notebook,
  dragged: NotePieces,
): Promise<Arrival | null> {
  const note = notebook.note(dragged.note);
  if (!note) return null;
  const pieces = piecesOf(note, dragged.pieces);
  const shown = pieces.flatMap((p) => (p.kind === 'file' ? [] : [p]));
  const blocks = shown.flatMap((p) => p.blocks);
  const inline =
    shown.length === 1 &&
    shown[0].kind === 'own' &&
    blocks.length === 1 &&
    blocks[0].kind === 'paragraph';
  return arrival(
    notebook,
    blocks,
    inline,
    (became) => new Map(became.size ? [[note.id, became]] : []),
    shown.length < pieces.length,
  );
}

/** Whether what is pasted came from a note: words taken, a file, or a picture the notebook holds. */
export function holdsWhatNotesHold(slice: Slice, notebook: Notebook | null): boolean {
  let found = false;
  slice.content.descendants((node) => {
    if (found) return false;
    if (node.isText) found = node.marks.some((m) => m.type.name === 'taken');
    else if (node.type.name === 'file') found = true;
    else if (node.type.name === 'figure') found = !!notebook?.files.has(node.attrs.file);
    return !found;
  });
  return found;
}

/** The notes whose texts hold the passages or the pictures, each with what of it arrived. */
function notesHolding(
  notebook: Notebook,
  passages: Set<string>,
  pictures: Set<string>,
): Map<string, Set<Became>> {
  const out = new Map<string, Set<Became>>();
  for (const note of notebook.notes.values()) {
    const became = new Set<Became>();
    for (const met of metOf(note.pieces)) {
      if ('passage' in met && passages.has(met.passage)) became.add('quotation');
      if ('hash' in met && pictures.has(met.hash)) became.add('figure');
    }
    if (became.size) out.set(note.id, became);
  }
  return out;
}

/**
 * What arrives of what was copied in a note and is pasted. A part of one
 * paragraph goes in where it is pasted; anything more stands as paragraphs
 * of its own.
 */
export async function arrivalOfSlice(notebook: Notebook, slice: Slice): Promise<Arrival | null> {
  let leftOut = false;
  const kept: Node[] = [];
  slice.content.forEach((node) => {
    if (node.type.name === 'file') leftOut = true;
    else kept.push(node);
  });
  const schema = slice.content.firstChild?.type.schema;
  const content = Fragment.from(kept);
  const blocks = schema && content.size ? copiedBlocks(new Slice(content, 0, 0), schema) : null;
  const one = kept.length === 1 && kept[0].type.name === 'paragraph';
  const inline = (one && slice.openStart > 0 && slice.openEnd > 0) || !!kept[0]?.isInline;
  return arrival(
    notebook,
    blocks ?? [],
    inline,
    (_, passages, pictures) => notesHolding(notebook, passages, pictures),
    leftOut,
  );
}

// =====================================================================
// Putting it in
// =====================================================================

/** Blocks as an editor holds them. */
export function nodesOf(blocks: Block[], schema: Schema): Fragment {
  const held = new Y.Doc().getXmlFragment('arriving');
  held.insert(0, blockElements(blocks));
  return yXmlFragmentToProseMirrorFragment(held, schema);
}

/** What arrives as a slice, to be put where the cursor is, as a paste. */
export function sliceOf(arrived: Arrival, schema: Schema): Slice {
  const content = nodesOf(arrived.blocks, schema);
  return arrived.inline && content.childCount === 1 && content.firstChild!.isTextblock
    ? new Slice(content, 1, 1)
    : new Slice(content, 0, 0);
}

/**
 * Puts what arrives into a text being written: words of one paragraph
 * where they are put, within the paragraph; anything else as paragraphs of
 * its own at the nearest place blocks can stand. One step of undo.
 */
export function putInto(project: Project, view: EditorView, at: number | null, arrived: Arrival) {
  if (view.isDestroyed) return false;
  const slice = sliceOf(arrived, view.state.schema);
  if (!slice.content.size) return false;
  const { state } = view;
  const pos = Math.min(at ?? state.selection.from, state.doc.content.size);
  const tr = state.tr;
  if (slice.openStart && state.doc.resolve(pos).parent.inlineContent) tr.replace(pos, pos, slice);
  else {
    const closed = new Slice(slice.content, 0, 0);
    const point = dropPoint(state.doc, pos, closed) ?? state.doc.content.size;
    tr.replace(point, point, closed);
  }
  project.checkpoint();
  view.dispatch(tr.scrollIntoView());
  project.checkpoint();
  view.focus();
  return true;
}

/**
 * Puts what arrives at the end of the text of an element that is not
 * being written, as paragraphs of its own: an empty paragraph at the end
 * gives way. One step of undo.
 */
export function putAtEnd(project: Project, element: string, arrived: Arrival): boolean {
  const body = project.fragment(element, 'body');
  const elements = blockElements(arrived.blocks);
  if (!body || !elements.length) return false;
  project.checkpoint();
  project.transact(() => {
    const last = body.length ? body.get(body.length - 1) : null;
    const at =
      last instanceof Y.XmlElement && last.nodeName === 'paragraph' && last.length === 0
        ? body.length - 1
        : body.length;
    body.insert(at, elements);
  });
  project.checkpoint();
  return true;
}

/** The project's id, as the window has it open. */
export function idOf(project: Project): string | undefined {
  return openProjects.all().find((o) => o.project === project)?.id;
}

/** What follows what arrived: the references kept by the project, and the notes told where their pieces went. */
function arrived(notebook: Notebook, project: Project, element: string | null, what: Arrival) {
  for (const id of what.cited) if (!project.refs.has(id)) void keepReference(project, id);
  const id = idOf(project);
  for (const [note, became] of what.notes)
    for (const kind of became)
      notebook.went(note, {
        what: kind,
        ...(id ? { project: id } : {}),
        ...(project.name ? { name: project.name } : {}),
        ...(element ? { element } : {}),
      });
}

/** Says that nothing arrived, where a file was all there was. */
function sayNothing(what: Arrival) {
  if (what.leftOut) notify(t('notebook-pane-file-not-into-text'));
}

/** The element whose text an editor holds, where it is a project's. */
export function elementOf(project: Project, view: EditorView): string | null {
  const given = hooksOf.get(view)?.element;
  if (given) return given;
  const type = (ySyncPluginKey.getState(view.state) as { type?: unknown } | undefined)?.type;
  return type instanceof Y.XmlFragment ? project.ownerOf(type) : null;
}

/** Pieces of a note dropped on a text being written, or put in from the menu where the cursor is. */
export async function piecesIntoText(
  project: Project,
  view: EditorView,
  at: number | null,
  dragged: NotePieces,
) {
  try {
    const notebook = await theNotebook.open();
    const what = await arrivalOfPieces(notebook, dragged);
    if (!what) return;
    if (!what.blocks.length || !putInto(project, view, at, what)) {
      sayNothing(what);
      return;
    }
    arrived(notebook, project, elementOf(project, view), what);
  } catch (error) {
    notifyError(t('notebook-pane-not-into-text'), error);
  }
}

/** Pieces of a note dropped on an element whose text is not being written: at the end of its text. */
export async function piecesIntoElement(project: Project, element: string, dragged: NotePieces) {
  try {
    const notebook = await theNotebook.open();
    const what = await arrivalOfPieces(notebook, dragged);
    if (!what) return;
    if (!what.blocks.length || !putAtEnd(project, element, what)) {
      sayNothing(what);
      return;
    }
    arrived(notebook, project, element, what);
  } catch (error) {
    notifyError(t('notebook-pane-not-into-text'), error);
  }
}

/** The pieces dragged, from what is dragged. */
export function draggedPieces(payload: DragPayload): NotePieces | null {
  const data = payload.data as Partial<NotePieces> | null;
  return payload.kind === NOTE_PIECES && data && typeof data.note === 'string'
    ? { note: data.note, pieces: Array.isArray(data.pieces) ? data.pieces : null }
    : null;
}

/** The editor that has the focus, and the element whose text it holds. */
function focusedText(project: Project): { view: EditorView; element: string | null } | null {
  const dom = document.activeElement?.closest('.ProseMirror');
  const view = dom ? viewsByDom.get(dom) : undefined;
  return view ? { view, element: elementOf(project, view) } : null;
}

/**
 * What a text of a project makes of what is pasted into it: nothing of a
 * paste that holds nothing from a note, which goes in as it is; else the
 * slice converted, when the sources have been made references.
 */
export function receivedFromNotes(project: Project, slice: Slice): Promise<Slice> | null {
  if (!holdsWhatNotesHold(slice, theNotebook.current)) return null;
  const into = focusedText(project);
  return (async () => {
    const notebook = await theNotebook.open();
    const what = await arrivalOfSlice(notebook, slice);
    if (!what) return slice;
    const schema = slice.content.firstChild?.type.schema ?? into?.view.state.schema;
    if (!schema) return slice;
    const made = sliceOf(what, schema);
    if (!made.content.size) sayNothing(what);
    else arrived(notebook, project, into?.element ?? null, what);
    return made;
  })();
}
