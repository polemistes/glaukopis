import { describe, expect, it } from 'vitest';
import type { Thread } from '$lib/project/model/types';
import {
  answerField,
  BEGINNING_FIELD,
  fieldThere,
  keptBeginning,
  noteField,
  readBeginning,
} from './unsent';

const thread = (id: string, notes: string[]): Thread =>
  ({
    id,
    element: 'e',
    passage: null,
    resolved: false,
    card: null,
    notes: notes.map((n) => ({ id: n })),
  }) as never;

describe('what is written in the panel of comments and not yet sent', () => {
  it('has its place while the thread of an answer, and the note being changed, are there', () => {
    const comments = new Map([['t', thread('t', ['n'])]]);
    expect(fieldThere(answerField('t'), comments)).toBe(true);
    expect(fieldThere(answerField('gone'), comments)).toBe(false);
    expect(fieldThere(noteField('t', 'n'), comments)).toBe(true);
    expect(fieldThere(noteField('t', 'gone'), comments)).toBe(false);
    expect(fieldThere(noteField('gone', 'n'), comments)).toBe(false);
    expect(fieldThere(BEGINNING_FIELD, comments)).toBe(true);
    expect(fieldThere('chat', comments)).toBe(true);
  });

  it('keeps a comment being begun with the positions of its passage, and reads it back', () => {
    const beginning = {
      element: 'e',
      passage: { from: new Uint8Array([0, 7, 255]), to: new Uint8Array([9]), text: 'the wrath' },
    };
    const kept = JSON.parse(JSON.stringify(keptBeginning(beginning)));
    expect(typeof kept.passage.from).toBe('string');
    expect(readBeginning(kept)).toEqual(beginning);
    expect(keptBeginning({ element: 'e', passage: null })).toEqual({ element: 'e' });
    expect(readBeginning({ element: 'e' })).toEqual({ element: 'e', passage: null });
  });

  it('reads as none what cannot be read', () => {
    for (const kept of [undefined, null, 'e', {}, { element: 3 }, { element: 'e', passage: 4 }])
      expect(readBeginning(kept)).toBeNull();
  });
});
