/**
 * Notes brought in from other programs, made notes of the notebook
 * (`docs/plans/the-notebook.md`, stage 5): what the core read of a folder
 * or a file of notes (`notesRead`) becomes a box of its own with a note
 * for each that holds anything, all in one step of undo.
 *
 * Each note keeps its name, when it was made, and its tags; its text is
 * written as the editors write one, without an editor (`blockElements`).
 * A note that says where it was clipped from is taken in from that page as
 * one passage, every word of its paragraphs marked; any other is the
 * writer's own. The files read with a note are held by the notebook, with
 * the page as their source where there is one; those that are no picture of
 * its text stand at its end. A note that links to another read with it is
 * linked to it in the notebook.
 */

import * as Y from 'yjs';
import type { NotebookFile, ReadNote, ReadNotes } from '$lib/api/notebook';
import { blockElements } from '$lib/project/model/blocks';
import { inlineText, type Block } from '$lib/project/model/text';
import { fileEnding } from '$lib/util/file-name';
import { cleanBoxName } from './model/boxes';
import { readsNow } from './model/marks';
import type { Notebook } from './model/notebook.svelte';
import { eachBlock } from './model/pieces';
import { holdTaken } from './taking';

/** A name for a new box that no box has yet: the name, else the name with a number after it. */
export function freeBoxName(taken: readonly string[], name: string): string {
  const given = cleanBoxName(name);
  const names = new Set(taken.map((n) => cleanBoxName(n).toLowerCase()));
  if (!names.has(given.toLowerCase())) return given;
  let n = 2;
  while (names.has(`${given} ${n}`.toLowerCase())) n++;
  return `${given} ${n}`;
}

/** Whether a paragraph of a text read holds words. */
function holdsWords(blocks: Block[]): boolean {
  let words = false;
  eachBlock(blocks, (b) => {
    if (b.kind === 'paragraph' && inlineText(b.content).trim()) words = true;
  });
  return words;
}

/** Whether a text read holds anything: words, or what stands by itself (an equation, a figure, a table). */
function holdsText(blocks: Block[]): boolean {
  let any = false;
  eachBlock(blocks, (b) => {
    if (b.kind === 'equation' || b.kind === 'figure' || b.kind === 'table') any = true;
  });
  return any || holdsWords(blocks);
}

/** Whether a note read holds anything to make a note of: a name, a text, or a file. */
function holdsAnything(note: ReadNote): boolean {
  return !!note.name.trim() || holdsText(note.blocks) || note.held.length > 0;
}

/** When a note was made, as the notebook keeps it; where it says no time that can be read, `fallback`. */
function madeOf(made: string | null, fallback: string): string {
  if (!made) return fallback;
  const time = new Date(made);
  return Number.isNaN(time.getTime()) ? fallback : time.toISOString();
}

/**
 * Marks every word of the paragraphs of a text as taken in a passage: the
 * runs of words that stand in a paragraph itself, not what is said of a
 * figure or a table, nor a note within a paragraph.
 */
function markTaken(parent: Y.XmlFragment | Y.XmlElement, passage: string) {
  for (const child of parent.toArray()) {
    if (!(child instanceof Y.XmlElement)) continue;
    if (child.nodeName === 'paragraph') {
      for (const run of child.toArray())
        if (run instanceof Y.XmlText && run.length)
          run.format(0, run.length, { taken: { passage } });
    } else if (child.nodeName !== 'figure') markTaken(child, passage);
  }
}

/** Writes what was read of a note into its text, in place of the empty paragraph it was made with. */
function writeText(notebook: Notebook, id: string, note: ReadNote, source: () => string | null) {
  const fragment = notebook.fragment(id);
  if (!fragment) return;
  const elements = blockElements(note.blocks);
  if (!elements.length) return;
  fragment.delete(0, fragment.length);
  fragment.insert(0, elements);
  const from = note.source ? source() : null;
  if (!from || !holdsWords(note.blocks)) return;
  // The passage keeps the words as they read in the text once marked.
  const passage = notebook.addPassage(from, '');
  markTaken(fragment, passage);
  const kept = notebook.yPassages.get(passage);
  if (kept) notebook.yPassages.set(passage, { ...kept, text: readsNow(fragment, passage) });
}

/** Holds the files read with a note, and puts those that are no picture of its text at its end. */
function writeFiles(notebook: Notebook, id: string, note: ReadNote, source: string | null) {
  for (const taken of note.held) holdTaken(notebook, taken, source);
  const byHash = new Map<string, NotebookFile>(note.held.map((h) => [h.file.hash, h]));
  for (const hash of note.attachments) {
    const file = byHash.get(hash)?.file;
    if (file) notebook.addFile(id, { hash, name: file.name, extension: fileEnding(file.name) });
  }
}

/**
 * Makes notes of what was read, in a box of their own named after what was
 * imported, not yet placed on its surface, each not yet looked at; all in
 * one step of undo. Gives the box and the ids of the notes, in the order
 * read; nothing where no note read holds anything.
 */
export function notesOfRead(
  notebook: Notebook,
  read: ReadNotes,
  name: string,
): { box: string; notes: string[] } | null {
  const made = read.notes.filter(holdsAnything);
  if (!made.length) return null;
  const now = Date.now();
  notebook.checkpoint();
  const out = notebook.transact(() => {
    const box = notebook.addBox(
      freeBoxName(
        notebook.boxes.map((b) => b.name),
        name,
      ),
    );
    // The notebook knows a source it was given only once the step is made:
    // within it, notes clipped from one page are given its source here.
    const pages = new Map<string, string>();
    const sourceOf = (note: ReadNote, read: string): string | null => {
      const url = note.source?.url.trim();
      if (!url) return null;
      let id = pages.get(url);
      if (!id) {
        id = notebook.addSource({ sort: 'web', url, title: note.source!.title.trim(), read });
        pages.set(url, id);
      }
      return id;
    };
    const ids = new Map<string, string>();
    const notes = made.map((note, i) => {
      // Of notes that say no time, each is a thousandth of a second after the one before.
      const when = madeOf(note.made, new Date(now + i).toISOString());
      const id = notebook.addNote({
        name: note.name,
        made: when,
        box,
        tags: note.tags,
        seen: false,
      });
      if (note.key) ids.set(note.key, id);
      let source: string | null | undefined;
      const sourced = () => (source === undefined ? (source = sourceOf(note, when)) : source);
      writeText(notebook, id, note, sourced);
      writeFiles(notebook, id, note, note.held.length ? sourced() : null);
      return id;
    });
    // One link for a pair, whichever way each names the other.
    const linked = new Set<string>();
    made.forEach((note, i) => {
      for (const key of note.links) {
        const from = notes[i];
        const to = ids.get(key);
        if (!to || to === from) continue;
        const pair = from < to ? `${from} ${to}` : `${to} ${from}`;
        if (linked.has(pair)) continue;
        linked.add(pair);
        notebook.addLink(from, to);
      }
    });
    return { box, notes };
  });
  notebook.checkpoint();
  return out;
}
