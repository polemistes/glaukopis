import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { describe, expect, it } from 'vitest';
import { specOf } from '$lib/editor/kinds';
import { bodySchema } from '$lib/editor/schema';
import { Notebook } from './model/notebook.svelte';
import { firstLineEnd, startKinds } from './starting';

describe('the kinds the lines of a starting text may be', () => {
  it('are text, a point of a list and a numbered point, and a point to tick where the editor has it', () => {
    const kinds = startKinds();
    expect(kinds.slice(0, 3)).toEqual(['text', 'item', 'numbered']);
    expect(kinds.includes('todo')).toBe(!!specOf('todo'));
  });
});

describe('the cursor in a note begun from a starting text', () => {
  it('goes to the end of its first line', () => {
    const nb = new Notebook();
    const s = nb.addStart({ name: 'Plan', text: 'Goal\nSteps', begins: 'item' });
    const id = nb.addNoteFrom(s);
    const doc = yXmlFragmentToProseMirrorRootNode(nb.fragment(id)!, bodySchema);
    const at = firstLineEnd(doc)!;
    expect(doc.textBetween(0, at)).toBe('Goal');
    expect(doc.resolve(at).parent.textContent).toBe('Goal');
    expect(doc.resolve(at).parentOffset).toBe(4);
  });

  it('is nowhere in a text with no line', () => {
    const doc = bodySchema.topNodeType.create();
    expect(firstLineEnd(doc)).toBeNull();
  });
});
