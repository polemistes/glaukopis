/**
 * The form of the texts (ADR 0111): a number that rises each time the
 * texts may hold something an earlier version of the application does not
 * know, a block or a mark that is not in its schema (`schema.ts`).
 *
 * Why it must be known before a text is shown: the binding of the editor to
 * the document (y-prosemirror) takes out of the document whatever its
 * schema cannot make, the block or the words with the mark, and what it
 * takes out is gone for everyone who shares the project. So a document of a
 * later form is never given to an editor of this version: it is not opened
 * (`state/projects.svelte.ts`, `notebook/open.svelte.ts`), and what the
 * others send of it is not taken in (`sharing/connection.svelte.ts`).
 *
 * A document says its form in a map of its own, `form`, with the number as
 * the key and nothing told by the value. A key and not a value, each set
 * once and never again: only what is set for the first time names its map
 * and its key in the change it travels in, so that the form of a change
 * can be read from its bytes, before anything of it is taken in.
 */

import type { Node } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import * as Y from 'yjs';

/**
 * The form of the texts this version writes and reads. The second came with
 * the box of rich text (ADR 0112).
 */
export const FORM = 2;

/**
 * The blocks of a text that an earlier form does not know, by their names
 * in the schema, each with the form it came with. A block is asked at the
 * top of a text only, where each of these stands.
 */
const SINCE: Readonly<Record<string, number>> = { rich: 2 };

/** The map of a document that says its form. */
const NAME = 'form';

/** A key of the map as the form it stands for; 0 for a key that is none. */
function number(key: unknown): number {
  if (typeof key !== 'string' || !/^[1-9][0-9]{0,8}$/.test(key)) return 0;
  return Number(key);
}

/** The form of a document: the highest it says, and the first where it says none. */
export function formOf(doc: Y.Doc): number {
  let form = 1;
  for (const key of doc.getMap(NAME).keys()) form = Math.max(form, number(key));
  return form;
}

/**
 * Says that the document is of the form `to` from now on, where it is not
 * already. In a change of its own, to be made before the first thing of
 * that form is put into a text: a server that knows of forms lets those go
 * who do not know this one when it is told, before the thing itself comes.
 */
export function raiseForm(doc: Y.Doc, to: number): void {
  if (to <= 1 || !Number.isInteger(to)) return;
  const said = doc.getMap<boolean>(NAME);
  if (said.has(String(to))) return;
  doc.transact(() => said.set(String(to), true));
}

/** The form a text is of by what it holds, as the editor has it: the first where it holds nothing a later form brought. */
export function formOfText(text: Node): number {
  let form = 1;
  text.forEach((block) => {
    form = Math.max(form, SINCE[block.type.name] ?? 1);
  });
  return form;
}

/** The form the blocks of a text are of, as the document keeps them. */
export function formOfElements(blocks: readonly Y.XmlElement[]): number {
  let form = 1;
  for (const block of blocks) form = Math.max(form, SINCE[block.nodeName] ?? 1);
  return form;
}

/**
 * Has the document of a text say the form of what is put into the text,
 * before it is put in: asked of every change of the text in the editor,
 * whoever makes it, a command, a paste, a drop or an undo. The binding
 * writes the change into the document only after it has been made here, so
 * the form is said first, in a change of its own.
 */
export function saysForm(text: Y.XmlFragment): Plugin {
  return new Plugin({
    filterTransaction(tr) {
      const doc = text.doc;
      if (!tr.docChanged || !doc) return true;
      const form = formOfText(tr.doc);
      if (form > 1 && formOf(doc) < form) raiseForm(doc, form);
      return true;
    },
  });
}

/** The name of the map as a change names it: its length, then its letters. */
const NAMED = [NAME.length, ...new TextEncoder().encode(NAME)];

/**
 * Whether the bytes hold the name of the map at all. A change that sets a
 * form for the first time names the map so; most changes, and every project
 * that says no form, do not, and are not read further: a whole project is
 * many thousands of pieces, and this is asked of each one that is opened.
 */
function namesTheMap(update: Uint8Array): boolean {
  for (let at = update.indexOf(NAMED[0]); at >= 0; at = update.indexOf(NAMED[0], at + 1)) {
    let same = at + NAMED.length <= update.length;
    for (let i = 1; same && i < NAMED.length; i++) same = update[at + i] === NAMED[i];
    if (same) return true;
  }
  return false;
}

/**
 * The highest form a change says, read from its bytes with nothing taken
 * in; 0 where it says none. Bytes that are no change say none: what takes
 * them in says what is wrong with them.
 */
export function formInUpdate(update: Uint8Array): number {
  if (!namesTheMap(update)) return 0;
  let form = 0;
  try {
    for (const struct of Y.decodeUpdate(update).structs) {
      const item = struct as { parent?: unknown; parentSub?: unknown };
      if (item.parent === NAME) form = Math.max(form, number(item.parentSub));
    }
  } catch {
    return 0;
  }
  return form;
}

/** The highest form among a state and the changes after it, as they are kept on disk; the first where none is said. */
export function formOfStored(state: Uint8Array | null, updates: Uint8Array[]): number {
  let form = state ? formInUpdate(state) : 0;
  for (const update of updates) form = Math.max(form, formInUpdate(update));
  return Math.max(form, 1);
}

/** That a document is of a later form than this version knows, in the words of where it was met. */
export class LaterForm extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LaterForm';
  }
}
