/**
 * Texts for the tests of the editor, written out in one line a block:
 *
 *     line>1 #counted/5 right only=line new: {n=12,i=1}Sing, goddess / {-}the wrath|
 *
 * The kind of the paragraph, its indent after `>`, its numbering after `#`,
 * every how many after `/`, the side, the one kind counted after `only=`, the number counted from after `from=`,
 * and `new`; after the colon its content, where ` / ` is a line break,
 * `{…}` a line mark (`n=` its number, `m=` its margin words, `i=` its
 * indent, `-` not counted, `~` hidden, `+` always shown, `^` begins where
 * the line before ended) and `|` the cursor. `pagebreak` and `pagebreak
 * column` are breaks. The same
 * form is read and written, so that a text can be compared with what is
 * expected.
 */

import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { bodyPlugins, type EditorHooks } from './plugins';
import { bodySchema } from './schema';

const { doc, paragraph, hard_break, linemark, pagebreak } = bodySchema.nodes;

/** The attributes of a line mark, as written between braces. */
function readMark(said: string): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  for (const part of said.split(',').map((p) => p.trim())) {
    if (part === '-') attrs.counted = false;
    else if (part === '~') attrs.hidden = true;
    else if (part === '+') attrs.shown = true;
    else if (part === '^') attrs.continues = true;
    else if (part.startsWith('n=')) attrs.number = part.slice(2);
    else if (part.startsWith('m=')) attrs.margin = part.slice(2);
    else if (part.startsWith('i=')) attrs.indent = Number(part.slice(2));
  }
  return attrs;
}

/** A line mark written between braces. */
function writeMark(node: Node): string {
  const a = node.attrs;
  const out: string[] = [];
  if (a.number) out.push(`n=${a.number}`);
  if (a.counted === false) out.push('-');
  if (a.hidden === true) out.push('~');
  if (a.shown === true) out.push('+');
  if (a.continues === true) out.push('^');
  if (a.margin) out.push(`m=${a.margin}`);
  if (a.indent) out.push(`i=${a.indent}`);
  return `{${out.join(',')}}`;
}

const HEAD =
  /^([\w-]+)(?:>(\d))?(?: #(counted|given))?(?:\/(\d+))?(?: (left|right))?(?: only=([\w-]+))?(?: from=([\w-]+))?( new)?: ?(.*)$/;

/** A text read from its blocks written out, with where the cursor is, if it is said. */
export function text(...blocks: string[]): { doc: Node; cursor: number | null } {
  const nodes: Node[] = [];
  let cursor: number | null = null;
  let pos = 0;
  for (const block of blocks) {
    if (block.startsWith('pagebreak')) {
      const node = pagebreak.create({ what: block.includes('column') ? 'column' : 'page' });
      nodes.push(node);
      pos += node.nodeSize;
      continue;
    }
    const m = HEAD.exec(block);
    if (!m) throw new Error(`Not a block: ${block}`);
    const [, kind, indent, numbering, every, side, only, from, isNew, content] = m;
    const inline: Node[] = [];
    let at = pos + 1;
    for (const piece of content.split(/( \/ |\{[^}]*\}|\|)/)) {
      if (!piece) continue;
      if (piece === ' / ') inline.push(hard_break.create());
      else if (piece === '|') {
        cursor = at;
        continue;
      } else if (piece.startsWith('{')) inline.push(linemark.create(readMark(piece.slice(1, -1))));
      else inline.push(bodySchema.text(piece));
      at += inline[inline.length - 1].nodeSize;
    }
    const node = paragraph.create(
      {
        kind,
        indent: Number(indent ?? 0),
        numbering: numbering ?? null,
        every: every ? Number(every) : null,
        side: side ?? null,
        only: only ?? null,
        from: from ?? null,
        new: isNew ? true : null,
      },
      inline,
    );
    nodes.push(node);
    pos += node.nodeSize;
  }
  return { doc: doc.create(null, nodes), cursor };
}

/** A block written out, with the cursor where it is, if it is in it. */
function writeBlock(node: Node, pos: number, cursor: number | null): string {
  if (node.type === pagebreak)
    return node.attrs.what === 'column' ? 'pagebreak column' : 'pagebreak';
  if (node.type !== paragraph) return node.type.name;
  const a = node.attrs;
  let head = String(a.kind);
  if (a.indent) head += `>${a.indent}`;
  if (a.numbering) head += ` #${a.numbering}`;
  if (a.every) head += `/${a.every}`;
  if (a.side) head += ` ${a.side}`;
  if (a.only) head += ` only=${a.only}`;
  if (a.from) head += ` from=${a.from}`;
  if (a.new) head += ' new';
  let out = '';
  node.forEach((child, offset) => {
    const at = pos + 1 + offset;
    if (cursor === at) out += '|';
    if (child.isText) {
      const words = child.text ?? '';
      if (cursor !== null && cursor > at && cursor < at + words.length)
        out += words.slice(0, cursor - at) + '|' + words.slice(cursor - at);
      else out += words;
    } else if (child.type === hard_break) out += ' / ';
    else if (child.type === linemark) out += writeMark(child);
    else out += `[${child.type.name}]`;
  });
  if (cursor === pos + node.nodeSize - 1) out += '|';
  return `${head}: ${out}`;
}

/** The blocks of a text written out, with the cursor where it is, if it is given. */
export function written(docNode: Node, cursor: number | null = null): string[] {
  const out: string[] = [];
  docNode.forEach((node, offset) => out.push(writeBlock(node, offset, cursor)));
  return out;
}

/** The blocks of an editor's text written out, with its cursor where nothing is selected. */
export function shapeOf(view: EditorView): string[] {
  const { selection } = view.state;
  return written(view.state.doc, selection.empty ? selection.head : null);
}

/** An editor with the plugins of a text, holding the text given, with the cursor where it says. */
export function editorOf(blocks: string[], hooks: Partial<EditorHooks> = {}): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const made = text(...blocks);
  let state = EditorState.create({
    doc: made.doc,
    plugins: bodyPlugins(bodySchema, { undo: () => {}, redo: () => {}, ...hooks }),
  });
  if (made.cursor !== null)
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, made.cursor)));
  return new EditorView(place, { state });
}

/** A key pressed in an editor, as the keymaps take it; whether one of them took it. */
export function press(
  view: EditorView,
  key: string,
  mods: { shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean } = {},
): boolean {
  const event = new KeyboardEvent('keydown', { key, ...mods, bubbles: true, cancelable: true });
  return !!view.someProp('handleKeyDown', (f) => f(view, event));
}

/** Types words at the cursor, as a person does, each offered to the rules first. */
export function type(view: EditorView, words: string) {
  for (const sign of words) {
    const { from, to } = view.state.selection;
    const taken = view.someProp('handleTextInput', (f) =>
      f(view, from, to, sign, () => view.state.tr.insertText(sign, from, to)),
    );
    if (!taken) view.dispatch(view.state.tr.insertText(sign, from, to));
  }
}
