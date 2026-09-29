/**
 * The changes that are reviewed, marked in an editor (`marks.ts`): what was
 * added and formatted anew by decorations over its text, what was deleted by
 * widgets where it was, which draw its words by the style sheet and are no
 * text of the page. The editor is given its marks anew whenever the changes
 * are worked out; meanwhile they follow what is written.
 */

import type { Node } from 'prosemirror-model';
import { Plugin, PluginKey, type EditorState } from 'prosemirror-state';
import { Mapping, StepMap } from 'prosemirror-transform';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { ySyncPluginKey } from 'y-prosemirror';
import type { Mark } from './marks';

const key = new PluginKey<DecorationSet>('review-marks');

/** Where a block of the text is in a document of an editor: before it, and the node. */
export function blockIn(
  doc: Node,
  part: Mark['part'],
  path: Mark['path'],
  whole = false,
): { pos: number; node: Node } | null {
  if (part === 'title') {
    const line = doc.firstChild;
    return line ? { pos: 0, node: line } : null;
  }
  let node = doc;
  // Where the content of `node` begins.
  let start = 0;
  let pos = -1;
  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    let index = step;
    let wanted: string | null = null;
    if (step === 'note') {
      index = Number(path[++i]);
      wanted = 'footnote';
    }
    if (typeof index !== 'number') return null;
    let found: { pos: number; node: Node } | null = null;
    let count = 0;
    node.forEach((child, offset, n) => {
      if (found) return;
      if (wanted) {
        if (child.type.name !== wanted) return;
        if (count++ === index) found = { pos: start + offset, node: child };
      } else if (n === index) found = { pos: start + offset, node: child };
    });
    const at = found as { pos: number; node: Node } | null;
    if (!at) return null;
    node = at.node;
    pos = at.pos;
    start = pos + 1;
  }
  if (pos < 0) return null;
  // A table's text is what is said of it.
  if (!whole && node.type.name === 'tabular' && node.firstChild?.type.name === 'table_caption')
    return { pos: pos + 1, node: node.firstChild };
  return { pos, node };
}

/** Where a place in the text of a block is, counting signs as the history does. */
export function placeIn(block: { pos: number; node: Node }, offset: number): number {
  const start = block.pos + 1;
  let at = 0;
  let found = start + block.node.content.size;
  let done = false;
  block.node.forEach((child, childOffset) => {
    if (done) return;
    const length = child.isText ? (child.text ?? '').length : 1;
    if (offset < at + length) {
      // Within a thing that is no text: before it.
      found = start + childOffset + (child.isText ? offset - at : 0);
      done = true;
      return;
    }
    at += length;
  });
  return found;
}

function removed(mark: Mark, block: boolean): HTMLElement {
  const el = document.createElement(block ? 'div' : 'span');
  el.className = `review-removed${block ? ' block' : ''}${mark.current ? ' current' : ''}`;
  el.dataset.text = mark.text ?? '';
  el.dataset.change = mark.change;
  el.style.setProperty('--by', mark.colour);
  el.contentEditable = 'false';
  return el;
}

function decorate(state: EditorState, marks: Mark[], part: Mark['part']): DecorationSet {
  const list: Decoration[] = [];
  const size = state.doc.content.size;
  for (const m of marks) {
    if (m.part !== part) continue;
    const style = `--by: ${m.colour}`;
    const current = m.current ? ' current' : '';
    const attrs = { 'data-change': m.change, style };
    if (m.kind === 'gone') {
      // A block deleted stands before the block that has its place now, or at the end.
      const parent = m.path.slice(0, -1);
      const last = m.path[m.path.length - 1];
      const container = parent.length ? blockIn(state.doc, part, parent) : null;
      const at = blockIn(state.doc, part, m.path);
      let pos = at?.pos ?? (container ? container.pos + container.node.nodeSize - 1 : size);
      if (!at && !container && typeof last === 'number') pos = size;
      list.push(
        Decoration.widget(pos, () => removed(m, true), {
          side: -1,
          key: `${m.change}:gone:${pos}`,
        }),
      );
      continue;
    }
    if (m.kind === 'note') {
      const note = blockIn(state.doc, part, [...m.path, 'note', m.from]);
      if (note)
        list.push(
          Decoration.node(note.pos, note.pos + note.node.nodeSize, {
            class: `review-note${current}`,
            ...attrs,
          }),
        );
      continue;
    }
    if (m.kind === 'object') {
      const object = blockIn(state.doc, part, m.path, true);
      if (object)
        list.push(
          Decoration.node(object.pos, object.pos + object.node.nodeSize, {
            class: `review-object${current}`,
            ...attrs,
          }),
        );
      continue;
    }
    const block = blockIn(state.doc, part, m.path);
    if (!block) continue;
    const from = placeIn(block, m.from);
    if (m.kind === 'removed') {
      list.push(
        Decoration.widget(from, () => removed(m, false), {
          side: -1,
          marks: [],
          key: `${m.change}:${m.from}:${m.text}:${m.colour}:${m.current}`,
        }),
      );
      continue;
    }
    const to = placeIn(block, m.to);
    if (to > from)
      list.push(
        Decoration.inline(from, to, {
          class: `review-${m.kind}${current}`,
          ...attrs,
        }),
      );
  }
  return DecorationSet.create(state.doc, list);
}

/** The plugin that draws the marks of a review in an editor of a name or a text. */
export function reviewMarks(part: Mark['part']): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key,
    state: {
      init: () => DecorationSet.empty,
      apply: (tr, set, _before, state) => {
        const marks = tr.getMeta(key) as Mark[] | undefined;
        if (marks) return marks.length ? decorate(state, marks, part) : DecorationSet.empty;
        if (!tr.docChanged) return set;
        // y-prosemirror puts the whole text in anew for what comes through the
        // document: there, how places moved is found by comparing.
        if (!tr.getMeta(ySyncPluginKey)) return set.map(tr.mapping, tr.doc);
        const start = _before.doc.content.findDiffStart(tr.doc.content);
        if (start == null) return set;
        let { a, b } = _before.doc.content.findDiffEnd(tr.doc.content)!;
        const overlap = start - Math.min(a, b);
        if (overlap > 0) {
          a += overlap;
          b += overlap;
        }
        return set.map(new Mapping([new StepMap([start, a - start, b - start])]), tr.doc);
      },
    },
    props: { decorations: (state) => key.getState(state) },
  });
}

/** The marks an editor was last given. */
const given = new WeakMap<EditorView, Mark[]>();

/** Gives an editor the marks of a review, in place of those it had; none, to take them away. */
export function markReview(view: EditorView, marks: Mark[]) {
  if (view.isDestroyed || !key.getState(view.state)) return;
  if (given.get(view) === marks) return;
  const had = given.get(view);
  given.set(view, marks);
  if (!marks.length && (!had || !had.length)) return;
  view.dispatch(view.state.tr.setMeta(key, marks).setMeta('addToHistory', false));
}
