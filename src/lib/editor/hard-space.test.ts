import { EditorState, TextSelection } from 'prosemirror-state';
import { DecorationSet, EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it } from 'vitest';
import { readBlocks } from '$lib/org/read';
import { writeBlocks } from '$lib/org/write';
import { blocksHtml } from '$lib/project/model/html';
import { paragraph } from '$lib/project/model/text';
import { HARD_SPACE, insertHardSpace } from './hard-space';
import { bodyPlugins } from './plugins';
import { bodySchema } from './schema';

const views: EditorView[] = [];

function editor(text = ''): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const view = new EditorView(place, {
    state: EditorState.create({
      schema: bodySchema,
      plugins: bodyPlugins(bodySchema, { undo: () => {}, redo: () => {} }),
    }),
  });
  views.push(view);
  if (text) view.dispatch(view.state.tr.insertText(text));
  return view;
}

/** Where the rings stand, as places in the text. */
function rings(view: EditorView): number[] {
  const found: number[] = [];
  view.someProp('decorations', (f) => {
    const set = f(view.state);
    if (set instanceof DecorationSet)
      for (const d of set.find()) if (d.spec.hardSpace) found.push(d.from);
  });
  return found.sort((a, b) => a - b);
}

afterEach(() => {
  for (const v of views.splice(0)) {
    v.dom.parentElement?.remove();
    v.destroy();
  }
});

describe('the hard space', () => {
  it('is written at the cursor as the character U+00A0, in the place of what is selected', () => {
    const view = editor('p. 12');
    // The ordinary space between "p." and "12" selected.
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 3, 4)));
    insertHardSpace(view.state, view.dispatch, view);
    expect(view.state.doc.textContent).toBe(`p.${HARD_SPACE}12`);
  });

  it('is ringed where it is written and where it was already, and the ring goes with it', () => {
    const view = editor(`a${HARD_SPACE}b c`);
    expect(rings(view)).toEqual([2]);
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 6)));
    insertHardSpace(view.state, view.dispatch, view);
    expect(rings(view)).toEqual([2, 6]);
    // Written before it, the ring moves with the space; taken away, the ring goes.
    view.dispatch(view.state.tr.insertText('xx', 1));
    expect(rings(view)).toEqual([4, 8]);
    view.dispatch(view.state.tr.delete(4, 5));
    expect(rings(view)).toEqual([7]);
    expect(view.dom.querySelectorAll('.hard-space').length).toBe(1);
  });

  it('is ringed in a text drawn without an editor', () => {
    const html = blocksHtml([
      paragraph([{ kind: 'text', text: `3${HARD_SPACE}km`, marks: {} }], 'text'),
    ]);
    expect(html).toContain(`3<span class="hard-space">${HARD_SPACE}</span>km`);
  });

  it('stays itself in the Org form, written and read again', () => {
    const blocks = [
      paragraph([{ kind: 'text', text: `Dr.${HARD_SPACE}Watson`, marks: {} }], 'text'),
    ];
    const org = writeBlocks(blocks);
    expect(org).toContain(`Dr.${HARD_SPACE}Watson`);
    const back = readBlocks(org);
    expect(JSON.stringify(back)).toContain(`Dr.${HARD_SPACE}Watson`);
  });
});
