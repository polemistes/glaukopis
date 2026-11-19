/**
 * What is dragged within a text, kept from where the drag begins to where
 * it is dropped.
 *
 * Words that are selected are dragged as the web view and the editor have
 * it, and the editor takes what was dragged away by its selection. The web
 * view of Linux lets the selection go as soon as the drag has begun (it puts
 * the cursor where the button was pressed), so nothing was taken away, and
 * the words stood in both places. Where they stood is therefore kept here,
 * through whatever is changed in the text meanwhile, and the selection is
 * put back before the editor reads the drop.
 *
 * A block that holds text is not dragged by itself, as a figure is: a press
 * in it is for its text. It is dragged whole by a grip of its own
 * (`dragWhole`), and put down by what is here.
 */

import { Fragment, Slice } from 'prosemirror-model';
import { Plugin, PluginKey, Selection, TextSelection } from 'prosemirror-state';
import { dropPoint } from 'prosemirror-transform';
import type { EditorView } from 'prosemirror-view';

/** What is dragged: where it stands, and whether it is a block dragged whole. */
export interface Dragged {
  from: number;
  to: number;
  whole: boolean;
}

const key = new PluginKey<Dragged | null>('dragged');

/** What is being dragged in a text; nothing, where nothing of it is. */
export const draggedIn = (view: EditorView): Dragged | null => key.getState(view.state) ?? null;

/**
 * What is dragged is said when the event that began the drag is over: the
 * web view is not to be given anything to draw anew while it begins one.
 */
function say(view: EditorView, held: Dragged | null) {
  setTimeout(() => {
    if (!view.isDestroyed) view.dispatch(view.state.tr.setMeta(key, held));
  });
}

/**
 * Begins the drag of the block at `pos`, whole, from a grip of its own:
 * called by what hears the grip's `dragstart`. `shown` is what follows the
 * pointer. False where there is nothing to drag.
 */
export function dragWhole(
  view: EditorView,
  pos: number,
  event: DragEvent,
  shown?: Element,
): boolean {
  const node = view.state.doc.nodeAt(pos);
  const data = event.dataTransfer;
  if (!node || !data || !view.editable) return false;
  const slice = new Slice(Fragment.from(node), 0, 0);
  const { dom, text } = view.serializeForClipboard(slice);
  data.clearData();
  data.setData('text/html', dom.innerHTML);
  data.setData('text/plain', text);
  data.effectAllowed = 'copyMove';
  if (shown) {
    const box = shown.getBoundingClientRect();
    data.setDragImage(shown, event.clientX - box.left, event.clientY - box.top);
  }
  // What shows where it would be put down reads this.
  view.dragging = { slice, move: true };
  say(view, { from: pos, to: pos + node.nodeSize, whole: true });
  return true;
}

/** Puts a block that was dragged whole where it was dropped: before or after the block it was dropped on. */
function putWhole(view: EditorView, event: DragEvent, held: Dragged, moved: boolean) {
  const { doc } = view.state;
  const tr = view.state.tr.setMeta(key, null);
  const node = doc.nodeAt(held.from);
  const at = view.posAtCoords({ left: event.clientX, top: event.clientY });
  const to =
    node && at && held.from + node.nodeSize === held.to
      ? dropPoint(doc, at.pos, new Slice(Fragment.from(node), 0, 0))
      : null;
  // Dropped on itself, or where it cannot stand, it stays where it is.
  if (!node || to === null || (moved && to >= held.from && to <= held.to)) {
    view.dispatch(tr);
    return;
  }
  // Put in before it is taken away: a text is never left with nothing in it.
  tr.insert(to, node);
  if (moved) tr.delete(tr.mapping.map(held.from, 1), tr.mapping.map(held.to, -1));
  const landed = moved && to >= held.to ? to - node.nodeSize : to;
  tr.setSelection(Selection.near(tr.doc.resolve(landed + 1), 1));
  view.focus();
  view.dispatch(tr.setMeta('uiEvent', 'drop'));
}

export function movesDragged(): Plugin<Dragged | null> {
  return new Plugin<Dragged | null>({
    key,
    state: {
      init: () => null,
      apply(tr, was) {
        const said = tr.getMeta(key) as Dragged | null | undefined;
        if (said !== undefined) return said;
        if (!was || !tr.docChanged) return was;
        const from = tr.mapping.map(was.from, 1);
        const to = tr.mapping.map(was.to, -1);
        return from < to ? { ...was, from, to } : null;
      },
    },
    props: {
      handleDOMEvents: {
        dragstart(view, event) {
          const { selection } = view.state;
          const at =
            selection instanceof TextSelection && !selection.empty
              ? view.posAtCoords({ left: event.clientX, top: event.clientY })
              : null;
          const held =
            at && at.pos >= selection.from && at.pos <= selection.to
              ? { from: selection.from, to: selection.to, whole: false }
              : null;
          if (held || draggedIn(view)) say(view, held);
          return false;
        },
        dragend(view) {
          // After the drop, which is read first where the drop was in this text.
          if (draggedIn(view)) say(view, null);
          return false;
        },
      },
      handleDrop(view, event, _slice, moved) {
        const held = draggedIn(view);
        if (!held) return false;
        if (held.whole) {
          putWhole(view, event, held, moved);
          return true;
        }
        const tr = view.state.tr.setMeta(key, null);
        const at = moved ? view.posAtCoords({ left: event.clientX, top: event.clientY }) : null;
        // Words dropped on themselves stay where they are.
        const onItself = !!at && at.pos >= held.from && at.pos <= held.to;
        const { selection } = view.state;
        // What was dragged is what is taken away: the editor takes its selection.
        if (moved && !onItself && (selection.from !== held.from || selection.to !== held.to))
          tr.setSelection(TextSelection.create(view.state.doc, held.from, held.to));
        view.dispatch(tr);
        return onItself;
      },
    },
  });
}
