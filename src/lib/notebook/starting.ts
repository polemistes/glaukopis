/**
 * What the page needs of the starting texts of new notes (stage 4;
 * `model/starts.ts`): the kinds of paragraph their lines may be, and where
 * the cursor goes in a note begun from one.
 */

import type { Node as PMNode } from 'prosemirror-model';
import { specOf } from '$lib/editor/kinds';

/**
 * The kinds of paragraph the lines of a starting text may be, as ids of
 * the editor's catalogue: text, a point of a list, a numbered point, and a
 * point to tick where the catalogue has that kind.
 */
export function startKinds(): string[] {
  return ['text', 'item', 'numbered', 'todo'].filter((id) => !!specOf(id));
}

/** The place at the end of the first line of a text: where the cursor goes in a note begun from a starting text. */
export function firstLineEnd(doc: PMNode): number | null {
  let at: number | null = null;
  doc.descendants((node, pos) => {
    if (at !== null) return false;
    if (node.isTextblock) {
      at = pos + 1 + node.content.size;
      return false;
    }
    return true;
  });
  return at;
}
