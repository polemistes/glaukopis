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

/** Makes the name or text of an element what a document says, keeping what is the same. */
function fillFragment(doc: Y.Doc, fragment: Y.XmlFragment, node: NodeJSON, part: 'title' | 'body') {
  const schema = part === 'title' ? titleSchema : bodySchema;
  // A name is always one line; a text that had nothing has nothing.
  const content =
    node.content?.length || part === 'body' ? (node.content ?? []) : [{ type: 'title' }];
  const made = schema.nodeFromJSON({ ...node, content });
  updateYFragment(doc, fragment, made, { mapping: new Map(), isOMark: new Map() });
}

/** Does edits in the project, as one change of this person's. Returns how many were done. */
export function applyEdits(project: Project, edits: Edit[]): number {
  let done = 0;
  project.checkpoint();
  project.transact(() => {
    for (const edit of edits) {
      try {
        if (edit.kind === 'fragment') {
          const fragment = project.fragment(edit.element, edit.part);
          if (!fragment) continue;
          fillFragment(project.doc, fragment, edit.node, edit.part);
          done++;
          continue;
        }
        if (edit.kind === 'element') {
          const node = new Y.Map<unknown>();
          for (const [key, value] of Object.entries(edit.values))
            node.set(key, value instanceof Y.AbstractType ? value.clone() : structuredClone(value));
          const title = new Y.XmlFragment();
          const body = new Y.XmlFragment();
          node.set('title', title);
          node.set('body', body);
          project.yNodes.set(edit.element, node);
          fillFragment(project.doc, title, edit.title, 'title');
          fillFragment(project.doc, body, edit.body, 'body');
          done++;
          continue;
        }
        if (edit.kind === 'place') {
          const node = project.yNodes.get(edit.element);
          if (!node) continue;
          node.set('parent', edit.parent);
          node.set('order', edit.order);
          done++;
          continue;
        }
        if (edit.kind === 'remove') {
          if (!project.yNodes.has(edit.element)) continue;
          project.yNodes.delete(edit.element);
          for (const [id, link] of project.yLinks)
            if (link.get('from') === edit.element || link.get('to') === edit.element)
              project.yLinks.delete(id);
          done++;
          continue;
        }
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
