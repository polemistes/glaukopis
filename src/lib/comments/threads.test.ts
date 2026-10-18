import { describe, expect, it } from 'vitest';
import { Schema } from 'prosemirror-model';
import { EditorState, type Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import { commentMarks, markComments } from './marks';

function project() {
  const p = new Project(null);
  p.begin('Wrath');
  p.setMe({ id: 'robert', name: 'Robert' });
  const a = p.addChild(PROJECT, { title: 'A' })!;
  const b = p.addChild(PROJECT, { title: 'B' })!;
  return { p, a, b };
}

const schema = new Schema({ nodes: { doc: { content: 'text*' }, text: {} } });

/** An editor with the marks of comments, as far as `markComments` sees one, that counts what is dispatched into it. */
function editor() {
  const view = {
    isDestroyed: false,
    state: EditorState.create({ schema, plugins: [commentMarks()] }),
    dispatched: 0,
    dispatch(tr: Transaction) {
      view.dispatched++;
      view.state = view.state.apply(tr);
    },
  };
  return view as typeof view & EditorView;
}

describe('the threads of an element', () => {
  it('are the same, unsorted again, while only threads elsewhere change', () => {
    const { p, a, b } = project();
    p.comment(a, null, 'Is this right?');
    const onB = p.comment(b, null, 'And this?')!;
    const threadsOfA = p.threadsOf(a);
    expect(p.threadsOf(a)).toBe(threadsOfA);

    p.reply(onB, 'Yes.');
    p.comment(b, null, 'One more.');
    p.setResolved(onB, true);
    expect(p.threadsOf(a)).toBe(threadsOfA);
    expect(p.threadsOf(b).map((t) => t.notes[0].text)).toEqual(['And this?', 'One more.']);
  });

  it('are new when one of them changes, oldest first, and none when the last goes', () => {
    const { p, a } = project();
    const one = p.comment(a, null, 'First.')!;
    const two = p.comment(a, null, 'Second.')!;
    const before = p.threadsOf(a);
    p.reply(one, 'An answer.');
    expect(p.threadsOf(a)).not.toBe(before);
    expect(p.threadsOf(a).map((t) => t.id)).toEqual([one, two]);
    // A thread goes with its last note.
    p.deleteNote(two, p.comments.get(two)!.notes[0].id);
    expect(p.threadsOf(a).map((t) => t.id)).toEqual([one]);
    p.deleteNote(one, p.comments.get(one)!.notes[1].id);
    p.deleteNote(one, p.comments.get(one)!.notes[0].id);
    expect(p.comments.size).toBe(0);
    expect(p.threadsOf(a)).toEqual([]);
  });
});

describe('the marks of comments in an editor', () => {
  it('are drawn again only when what they show changes', () => {
    const { p, a, b } = project();
    const one = p.comment(a, null, 'Is this right?')!;
    const onB = p.comment(b, null, 'And this?')!;
    const editorOfA = editor();
    const editorOfB = editor();
    const show = () => {
      // What each editor's effect does whenever the threads it read change.
      markComments(editorOfA, p.threadsOf(a));
      markComments(editorOfB, p.threadsOf(b));
    };
    show();
    expect([editorOfA.dispatched, editorOfB.dispatched]).toEqual([1, 1]);

    // Answers and edited notes change no mark, here or elsewhere.
    for (let i = 0; i < 10; i++) {
      p.reply(onB, `Answer ${i}.`);
      show();
    }
    p.editNote(one, p.comments.get(one)!.notes[0].id, 'Is this quite right?');
    show();
    expect([editorOfA.dispatched, editorOfB.dispatched]).toEqual([1, 1]);

    // Settling a thread does.
    p.setResolved(one, true);
    show();
    expect([editorOfA.dispatched, editorOfB.dispatched]).toEqual([2, 1]);
  });
});
