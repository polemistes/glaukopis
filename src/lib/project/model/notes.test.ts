import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { noteOf, Project } from './project.svelte';
import { PROJECT } from './types';

describe('the notes of a thread, as another copy wrote them', () => {
  it('are read with every part a note has, where a part is missing or not of its type', () => {
    const p = new Project(null);
    p.begin('Iliad');
    const a = p.addChild(PROJECT, { title: 'A' })!;
    const thread = p.comment(a, null, 'Mine.')!;
    // As a peer, older or gone wrong, might send it.
    const notes = p.yComments.get(thread)!.get('notes') as Y.Array<unknown>;
    p.doc.transact(() =>
      notes.push([
        { id: 'n2', text: 'No one wrote this.', created: 12 },
        { text: 'Nor this.', author: 'Hector' },
        { id: 'n4', author: { id: 7, name: 'Paris' } },
        null,
      ]),
    );
    const read = p.comments.get(thread)!.notes;
    expect(read.map((n) => n.text)).toEqual(['Mine.', 'No one wrote this.', 'Nor this.']);
    expect(read[1]).toEqual({
      id: 'n2',
      author: { id: '', name: '' },
      created: '',
      text: 'No one wrote this.',
    });
    expect(read[2].author).toEqual({ id: '', name: '' });
    expect(read[2].id).toBe('');
  });

  it('keep what a note has as it was', () => {
    const note = {
      id: 'n1',
      author: { id: 'u1', name: 'Andromache' },
      created: '2026-10-18T10:00:00Z',
      edited: '2026-10-18T11:00:00Z',
      text: 'Stay.',
    };
    expect(noteOf(note)).toEqual(note);
    expect(noteOf({ ...note, edited: undefined })).not.toHaveProperty('edited');
  });
});
