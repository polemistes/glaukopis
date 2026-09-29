/**
 * What the engine of the history works out, done in the document that is
 * worked in: as a change of this person's, which undo takes back and the
 * history keeps like any other. See `Edit` in `engine.ts`.
 */

import * as Y from 'yjs';
import { updateYFragment } from 'y-prosemirror';
import { bodySchema, titleSchema } from '$lib/editor/schema';
import type { Project } from '$lib/project/model/project.svelte';
import type { Edit, NodeJSON } from './engine';
import { findItem, wordId } from './moments';

function typeOf(doc: Y.Doc, word: string): Y.XmlElement | null {
  const id = wordId(word);
  const item = id ? findItem(doc, id) : null;
  if (!item || item.deleted || !(item.content instanceof Y.ContentType)) return null;
  const type = item.content.type;
  return type instanceof Y.XmlElement ? type : null;
}

/** Makes a Yjs element what the node says, keeping what is the same. */
function fill(doc: Y.Doc, element: Y.XmlElement, node: NodeJSON, part: 'title' | 'body') {
  const schema = part === 'title' ? titleSchema : bodySchema;
  const made = schema.nodeFromJSON(node);
  updateYFragment(doc, element, made, { mapping: new Map(), isOMark: new Map() });
}

/** Does edits in the project, as one change of this person's. Returns how many were done. */
export function applyEdits(project: Project, edits: Edit[]): number {
  let done = 0;
  project.checkpoint();
  project.transact(() => {
    for (const edit of edits) {
      try {
        if (edit.kind === 'block') {
          const element = typeOf(project.doc, edit.block);
          if (!element) continue;
          fill(project.doc, element, edit.node, edit.part);
          done++;
          continue;
        }
        const container =
          'block' in edit.container
            ? typeOf(project.doc, edit.container.block)
            : project.fragment(edit.container.element, edit.part);
        if (!container) continue;
        // Where the block stood: after what is still there before it.
        const at = wordId(edit.at);
        let index = 0;
        let found = false;
        for (let item = container._start; item !== null; item = item.right) {
          if (at && item.id.client === at.client && item.id.clock === at.clock) {
            found = true;
            break;
          }
          if (!item.deleted && item.countable) index++;
        }
        if (!found) index = container.length;
        const element = new Y.XmlElement(edit.node.type);
        container.insert(index, [element]);
        fill(project.doc, element, edit.node, edit.part);
        done++;
      } catch (error) {
        console.error('a change of the history could not be made', error);
      }
    }
  });
  project.checkpoint();
  return done;
}
