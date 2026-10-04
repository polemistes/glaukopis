/**
 * Showing a citation that was found where the text of its map is shown:
 * the element it stands in is brought into view and given an editor, and
 * the text of the citation is selected there, without the cursor, as a
 * search shows what it found (`search/text.svelte.ts`). In a note, the
 * note is opened with the text selected in it.
 *
 * The citation is known by its passage as the project holds it and by
 * offsets in the text of that passage, as `gather.ts` reads it. The editor
 * is read by the rules of the search, which read the same text with the
 * same signs for what is no text, so that the offsets are the same once the
 * passage is found among those of the editor.
 */

import { NodeSelection, TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { quietly, SHOW, type ShowIn } from '$lib/editor/ui.svelte';
import { editorRange, readEditor } from '$lib/search/marking';
import { pieceAt, type Passage } from '$lib/search/passages';
import { positionOf, readLine, type ReadDoc } from '$lib/search/prosemirror';
import type { Match } from '$lib/search/searching';
import type { Surface } from '$lib/search/text.svelte';
import type { Target } from './change';
import { gatherElement } from './gather';

/** The note that was last shown, to be left when another citation is shown. */
let lastNote: { view: EditorView; pos: number } | null = null;

/**
 * Shows a citation that was found on a surface that shows the text of its
 * map. Returns whether it could be shown.
 */
export async function revealFound(
  surface: Surface,
  target: Target,
  element: string,
): Promise<boolean> {
  const view = await surface.reveal(element, 'body');
  if (!view || view.isDestroyed) return false;
  leaveNote();
  const gathered = gatherElement(surface.project, element);
  const index = gathered.places.findIndex((p) => p.id === target.passage);
  const place = gathered.places[index];
  if (!place) return false;
  const read = readEditor(view, 'body', null);
  const passage = passageIn(read, index, place.text, place.note);
  if (!passage) return false;
  const shown: Match = {
    element,
    part: 'body',
    passage: passage.index,
    start: target.start,
    end: target.end,
    text: target.text,
    hit: { start: target.start, end: target.end },
    ...(passage.within ? { within: passage.within } : {}),
  };
  try {
    const { doc } = view.state;
    if (passage.within) {
      const outer = read.passages[passage.within.passage];
      const at = outer && read.refs[passage.within.passage][pieceAt(outer, passage.within.at)];
      if (!at || at.node.type.name !== 'footnote') return false;
      quietly(view, () =>
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(doc, at.pos))),
      );
      lastNote = { view, pos: at.pos };
      const note = readLine(at.node, 'note', null);
      const detail: ShowIn = {
        from: positionOf(note, 0, target.start),
        to: positionOf(note, 0, target.end, true),
        focus: false,
      };
      scrollTo(surface, view, read, shown);
      view.nodeDOM(at.pos)?.dispatchEvent(new CustomEvent(SHOW, { detail }));
      return true;
    }
    const from = positionOf(read, passage.index, target.start);
    const to = positionOf(read, passage.index, target.end, true);
    quietly(view, () =>
      view.dispatch(view.state.tr.setSelection(TextSelection.create(doc, from, to))),
    );
    scrollTo(surface, view, read, shown);
    return true;
  } catch (error) {
    console.error('the citation that was found could not be shown', error);
    return false;
  }
}

/**
 * The passage of an editor that is a passage of the project: the one at
 * the same place in the order, where it reads the same; else the first that
 * reads the same. The editor reads an equation as a passage of its own,
 * which the project does not.
 */
function passageIn(read: ReadDoc, index: number, text: string, note: boolean): Passage | null {
  const lines = read.passages.filter((p) => p.kind !== 'equation');
  const at = lines[index];
  if (at && at.text === text && (at.kind === 'note') === note) return at;
  return lines.find((p) => p.text === text && (p.kind === 'note') === note) ?? null;
}

/** Closes the note that was last shown, if it is still selected: the cursor goes after it. */
function leaveNote() {
  const last = lastNote;
  lastNote = null;
  if (!last || last.view.isDestroyed) return;
  const { view, pos } = last;
  const { selection } = view.state;
  if (!(selection instanceof NodeSelection) || selection.from !== pos) return;
  const node = view.state.doc.nodeAt(pos);
  const after = Math.min(pos + (node?.nodeSize ?? 1), view.state.doc.content.size);
  quietly(view, () =>
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, after))),
  );
}

/** Brings what is shown into the middle of the view, unless it is in view. */
function scrollTo(surface: Surface, view: EditorView, read: ReadDoc, m: Match) {
  const scroller = surface.scroller();
  if (!scroller) return;
  const mark = editorRange(view, read, m, null);
  const rect = mark?.getBoundingClientRect();
  if (!rect || (!rect.width && !rect.height)) return;
  const box = scroller.getBoundingClientRect();
  const margin = Math.min(80, box.height / 4);
  if (rect.top >= box.top + margin && rect.bottom <= box.bottom - margin) return;
  scroller.scrollTop += rect.top - (box.top + box.height / 2) + rect.height / 2;
}
