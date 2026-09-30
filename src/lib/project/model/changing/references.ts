/**
 * What a project keeps of the works it cites and what is written about
 * them; what is added to the text of an element where there is no cursor to
 * say where, citations and figures; and the words spelling leaves alone.
 * These are methods of `Project`, which takes them in (see there).
 */

import * as Y from 'yjs';
import { newId } from '$lib/util/id';
import type { Project } from '../project.svelte';
import type { Inline } from '../text';
import type { RefRecord } from '../types';

export const referenceChanges = {
  /**
   * Cites works at the end of the text of an element: for a reference that
   * is dropped on an element, where there is no cursor to say where.
   */
  cite(this: Project, id: string, refs: string[]) {
    const body = this.fragment(id, 'body');
    if (!body || !refs.length) return;
    this.transact(() => {
      let last = body.length ? body.get(body.length - 1) : null;
      if (!(last instanceof Y.XmlElement) || last.nodeName !== 'paragraph') {
        last = new Y.XmlElement('paragraph');
        body.insert(body.length, [last]);
      }
      const paragraph = last as Y.XmlElement;
      const end = paragraph.length ? paragraph.get(paragraph.length - 1) : null;
      if (end instanceof Y.XmlText) {
        if (end.length && !/\s$/.test(end.toString())) end.insert(end.length, ' ', {});
      } else if (end) {
        paragraph.insert(paragraph.length, [new Y.XmlText(' ')]);
      }
      const citation = new Y.XmlElement('citation');
      citation.setAttribute('items', refs.map((ref) => ({ id: ref })) as unknown as string);
      citation.setAttribute('mode', 'normal');
      paragraph.insert(paragraph.length, [citation]);
    });
  },

  /**
   * A figure at the end of the text of an element: for a picture that is
   * dropped on an element, where there is no cursor to say where.
   */
  addFigure(
    this: Project,
    id: string,
    picture: { hash: string; extension: string; name: string; alt?: string; caption?: Inline[] },
    width = 100,
  ) {
    const body = this.fragment(id, 'body');
    if (!body) return;
    this.transact(() => {
      // An empty paragraph at the end gives way.
      const last = body.length ? body.get(body.length - 1) : null;
      const at =
        last instanceof Y.XmlElement && last.nodeName === 'paragraph' && last.length === 0
          ? body.length - 1
          : body.length;
      const figure = new Y.XmlElement('figure');
      figure.setAttribute('id', newId());
      figure.setAttribute('file', picture.hash);
      figure.setAttribute('extension', picture.extension);
      figure.setAttribute('name', picture.name);
      figure.setAttribute('alt', picture.alt ?? '');
      figure.setAttribute('width', width as unknown as string);
      figure.setAttribute('numbered', true as unknown as string);
      // What is said of the picture in the store is said of the figure, to begin with.
      const said = (picture.caption ?? []).flatMap((i): (Y.XmlElement | Y.XmlText)[] => {
        if (i.kind === 'math' && i.tex) {
          const formula = new Y.XmlElement('math');
          formula.setAttribute('tex', i.tex);
          return [formula];
        }
        if (i.kind !== 'text' || !i.text) return [];
        const text = new Y.XmlText();
        text.insert(0, i.text, i.marks);
        return [text];
      });
      if (said.length) figure.insert(0, said);
      body.insert(at, [figure]);
    });
  },

  /**
   * What is written about a work, for this project. It is changed where it
   * differs, and not replaced, so that two who write in it at once keep what
   * both wrote. Not part of undo: the field it is written in has its own.
   */
  setNote(this: Project, ref: string, text: string) {
    const existing = this.yNotes.get(ref);
    const before = existing instanceof Y.Text ? existing.toString() : '';
    if (before === text) return;
    this.doc.transact(() => {
      if (!text.trim()) {
        this.yNotes.delete(ref);
        return;
      }
      let note = existing instanceof Y.Text ? existing : null;
      if (!note) {
        note = new Y.Text();
        this.yNotes.set(ref, note);
      }
      let start = 0;
      const most = Math.min(before.length, text.length);
      while (start < most && before[start] === text[start]) start++;
      let end = 0;
      while (
        end < most - start &&
        before[before.length - 1 - end] === text[text.length - 1 - end]
      ) {
        end++;
      }
      if (before.length - start - end > 0) note.delete(start, before.length - start - end);
      if (text.length - start - end > 0) note.insert(start, text.slice(start, text.length - end));
    }, 'notes');
  },

  /**
   * Has spelling leave a word alone in this project, for all it is shared
   * with. Not part of undo: it is not the user's writing.
   */
  ignoreWord(this: Project, word: string) {
    const clean = word.trim();
    if (!clean || this.yIgnored.has(clean)) return;
    this.doc.transact(() => this.yIgnored.set(clean, true), 'spelling');
  },

  /** Has spelling check a word again that was ignored in this project. */
  unignoreWord(this: Project, word: string) {
    if (!this.yIgnored.has(word)) return;
    this.doc.transact(() => this.yIgnored.delete(word), 'spelling');
  },

  /** The element whose name or text a piece of the document is. */
  ownerOf(this: Project, fragment: Y.XmlFragment): string | null {
    const parent = fragment.parent;
    if (!(parent instanceof Y.Map)) return null;
    for (const [id, n] of this.yNodes) if (n === parent) return id;
    return null;
  },

  /** Keeps a copy of a reference in the project. Not part of undo: it is not the user's writing. */
  putReference(this: Project, record: RefRecord) {
    const existing = this.yRefs.get(record.id);
    if (existing && existing.modified >= record.modified) return;
    this.doc.transact(() => this.yRefs.set(record.id, record), 'references');
  },
};
