import { EditorState, TextSelection, type Command } from 'prosemirror-state';
import type { Node } from 'prosemirror-model';
import { describe, expect, it } from 'vitest';
import { bodySchema } from '$lib/editor/schema';
import { RICH_TEXT_OFFERED, richTextOffered } from './offered';
import {
  backOutOfBox,
  boxAt,
  deleteBox,
  holdsBox,
  insertBox,
  leaveBox,
  selectBox,
  unwrapBox,
} from './box';

const { paragraph, rich, parallel, parallel_side, pagebreak } = bodySchema.nodes;
const p = (words = '', kind = 'text') =>
  paragraph.create({ kind }, words ? bodySchema.text(words) : null);
const box = (...blocks: Node[]) => rich.create(null, blocks);
const text = (...blocks: Node[]) => bodySchema.node('doc', null, blocks);

/** A state with the selection from `from` to `to`, where each is [block at the top, block within a box or null, offset]. */
function state(doc: Node, from: number, to = from): EditorState {
  return EditorState.create({ doc, selection: TextSelection.create(doc, from, to) });
}

function run(command: Command, before: EditorState): EditorState | null {
  let after: EditorState | null = null;
  const done = command(before, (tr) => (after = before.apply(tr)));
  return done ? after : null;
}

/** A text as its blocks, a box in brackets. */
const shape = (doc: Node): string => {
  const one = (n: Node): string =>
    n.type.name === 'rich'
      ? `[${Array.from({ length: n.childCount }, (_, i) => one(n.child(i))).join(' | ')}]`
      : n.type.name === 'paragraph'
        ? `${n.attrs.kind === 'text' ? '' : `${n.attrs.kind}:`}${n.textContent}`
        : n.type.name;
  return Array.from({ length: doc.childCount }, (_, i) => one(doc.child(i))).join(' | ');
};

describe('rich text', () => {
  it('is not offered yet, and is under the scripts of the running application', () => {
    // The guard goes out a release ahead of the box, and nothing is set by hand in it yet: see `offered.ts`.
    expect(RICH_TEXT_OFFERED).toBe(false);
    expect(richTextOffered).toBe(false);
  });
});

describe('putting a box in', () => {
  it('puts an empty one after the paragraph the cursor is in, with the cursor in it', () => {
    const after = run(insertBox, state(text(p('One'), p('Two')), 2))!;
    expect(shape(after.doc)).toBe('One | [] | Two');
    expect(boxAt(after)?.pos).toBe(5);
    expect(after.selection.$from.parent.content.size).toBe(0);
  });

  it('puts it in the place of an empty paragraph', () => {
    const after = run(insertBox, state(text(p('One'), p(), p('Two')), 6))!;
    expect(shape(after.doc)).toBe('One | [] | Two');
    expect(boxAt(after)).not.toBeNull();
  });

  it('puts it around the blocks the selection touches, which stay as they are', () => {
    const doc = text(
      p('One'),
      p('Two', 'quote'),
      pagebreak.create(),
      p('Three', 'item'),
      p('Four'),
    );
    // From within "Two" to within "Three".
    const after = run(insertBox, state(doc, 7, 14))!;
    expect(shape(after.doc)).toBe('One | [quote:Two | pagebreak | item:Three] | Four');
    expect(after.doc.textBetween(after.selection.from, after.selection.to, '|')).toBe('wo|Th');
  });

  it('is not put within a box, nor around texts side by side', () => {
    const boxed = text(box(p('In')), p('Out'));
    expect(run(insertBox, state(boxed, 3))).toBeNull();
    const sides = parallel.create(null, [
      parallel_side.create(null, p('Left')),
      parallel_side.create(null, p('Right')),
    ]);
    const doc = text(p('One'), sides, p('Two'));
    expect(run(insertBox, state(doc, 2, doc.content.size - 2))).toBeNull();
    // With only the cursor in a side, it is put after the two texts.
    const after = run(insertBox, state(doc, 8))!;
    expect(after.doc.child(2).type.name).toBe('rich');
  });
});

describe('leaving a box', () => {
  it('is done by Enter in an empty paragraph at its end, which goes out to stand after it', () => {
    const doc = text(box(p('In'), p()), p('Out'));
    const after = run(leaveBox, state(doc, 6))!;
    expect(shape(after.doc)).toBe('[In] |  | Out');
    expect(boxAt(after)).toBeNull();
    expect(after.selection.$from.parent.content.size).toBe(0);
    expect(after.selection.$from.depth).toBe(1);
  });

  it('makes a paragraph after a box that ends the text', () => {
    const after = run(leaveBox, state(text(box(p('In'), p())), 6))!;
    expect(shape(after.doc)).toBe('[In] | ');
  });

  it('is not done from a paragraph that is all the box holds, that is not the last, that holds something, or that is of a kind', () => {
    expect(run(leaveBox, state(text(box(p())), 2))).toBeNull();
    expect(run(leaveBox, state(text(box(p(), p('In'))), 2))).toBeNull();
    expect(run(leaveBox, state(text(box(p('In'), p('More'))), 7))).toBeNull();
    expect(run(leaveBox, state(text(box(p('In'), p('', 'item'))), 6))).toBeNull();
    expect(run(leaveBox, state(text(p('Out'), p()), 6))).toBeNull();
  });

  it('takes an empty box away by Backspace, and leaves a paragraph', () => {
    const after = run(backOutOfBox, state(text(p('One'), box(p()), p('Two')), 7))!;
    expect(shape(after.doc)).toBe('One |  | Two');
    expect(after.selection.$from.depth).toBe(1);
    expect(run(backOutOfBox, state(text(box(p('In'))), 2))).toBeNull();
    expect(run(backOutOfBox, state(text(box(p(), p())), 2))).toBeNull();
  });
});

describe('from the head of a box', () => {
  const doc = text(p('One'), box(p('In', 'quote'), p('More')), p('Two'));

  it('makes it ordinary text, with what was selected in it selected still', () => {
    const before = state(doc, 8, 9);
    expect(before.doc.textBetween(8, 9)).toBe('n');
    const after = run(unwrapBox(5), before)!;
    expect(shape(after.doc)).toBe('One | quote:In | More | Two');
    expect(after.doc.textBetween(after.selection.from, after.selection.to)).toBe('n');
    expect(holdsBox(after.doc)).toBe(false);
  });

  it('selects all it holds', () => {
    const after = run(selectBox(5), state(doc, 2))!;
    expect(after.doc.textBetween(after.selection.from, after.selection.to, '|')).toBe('In|More');
  });

  it('deletes it with all it holds, and leaves a paragraph where it was the whole text', () => {
    expect(shape(run(deleteBox(5), state(doc, 2))!.doc)).toBe('One | Two');
    const alone = run(deleteBox(0), state(text(box(p('In'))), 3))!;
    expect(shape(alone.doc)).toBe('');
    expect(alone.doc.childCount).toBe(1);
  });

  it('does nothing where no box stands', () => {
    expect(run(unwrapBox(0), state(doc, 2))).toBeNull();
    expect(run(selectBox(99), state(doc, 2))).toBeNull();
    expect(run(deleteBox(0), state(doc, 2))).toBeNull();
  });
});
