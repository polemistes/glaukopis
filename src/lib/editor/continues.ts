/**
 * Lines that begin where the line before ended (ADR 0067), as the second
 * part of a line of verse shared by two speakers is set: the mark at the
 * start of such a line (`continues` in `schema.ts`) is given the width of
 * the line before, as it is drawn, and an em, so that the line's words
 * begin past where those of the line before end. The line before is the
 * nearest above with words in it, speakers and directions passed over
 * (`lineBefore` in `numbers.ts`). Where nothing can be measured, the mark
 * keeps the width app.css gives it.
 *
 * Only the marks that say so are measured, after the view has been drawn:
 * where they stand is kept, mapped through each change, and only the
 * places a change touched are looked at for new ones, so that a keystroke
 * does no work in proportion to the whole text.
 */

import type { Node } from 'prosemirror-model';
import { Plugin, PluginKey } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { BasedKind } from '$lib/project/model/families';
import { changedRanges } from './changes';
import { lineBefore } from './numbers';

const key = new PluginKey<number[]>('continues');

/** Whether a node is a line mark that says its line begins where the line before ended. */
const continuing = (node: Node | null | undefined): boolean =>
  node?.type.name === 'linemark' && node.attrs.continues === true;

/** Where the marks that say so stand in the whole text. */
function all(doc: Node): number[] {
  const out: number[] = [];
  doc.descendants((node, pos) => {
    if (continuing(node)) out.push(pos);
    return !node.isLeaf;
  });
  return out;
}

/** Gives each mark that says so its width, from where the line before it ends as it is drawn. */
function measure(view: EditorView, at: readonly number[], own: readonly BasedKind[]) {
  const { doc } = view.state;
  for (const pos of at) {
    const dom = view.nodeDOM(pos);
    if (!(dom instanceof HTMLElement)) continue;
    const end = lineBefore(doc, pos, own);
    let width: string | null = null;
    if (end !== null) {
      try {
        const before = view.coordsAtPos(end, -1);
        const em = parseFloat(getComputedStyle(dom).fontSize) || 16;
        const from = dom.getBoundingClientRect().left;
        width = `${Math.max(0, before.left - from) + em}px`;
      } catch {
        width = null;
      }
    }
    if (width === null) dom.style.removeProperty('--continues');
    else if (dom.style.getPropertyValue('--continues') !== width)
      dom.style.setProperty('--continues', width);
  }
}

/**
 * Sets in the lines that begin where the line before ended. `own` gives
 * the kinds of the writer's own, by which speakers and directions are
 * known.
 */
export function continuesPlugin(own: () => readonly BasedKind[] = () => []): Plugin<number[]> {
  return new Plugin<number[]>({
    key,
    state: {
      init: (_config, state) => all(state.doc),
      apply: (tr, at) => {
        if (!tr.docChanged) return at;
        const kept = at
          .map((pos) => tr.mapping.mapResult(pos, 1))
          .filter((r) => !r.deleted)
          .map((r) => r.pos);
        // New marks, or marks that say so now, stand only where the change was.
        for (const [from, to] of changedRanges([tr]))
          tr.doc.nodesBetween(
            Math.max(0, from - 1),
            Math.min(tr.doc.content.size, to + 1),
            (node, pos) => {
              if (continuing(node)) kept.push(pos);
              return !node.isLeaf;
            },
          );
        return [...new Set(kept)]
          .filter((pos) => pos < tr.doc.content.size && continuing(tr.doc.nodeAt(pos)))
          .sort((a, b) => a - b);
      },
    },
    view(view) {
      let frame = 0;
      const later = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (!view.isDestroyed) measure(view, key.getState(view.state) ?? [], own());
        });
      };
      // The width of the text, and so where its lines end, changes with the window and the fonts.
      const resized = typeof ResizeObserver === 'function' ? new ResizeObserver(later) : null;
      resized?.observe(view.dom);
      later();
      return {
        update(view, before) {
          if (view.state.doc !== before.doc || (key.getState(view.state) ?? []).length) later();
        },
        destroy() {
          if (frame) cancelAnimationFrame(frame);
          resized?.disconnect();
        },
      };
    },
  });
}
