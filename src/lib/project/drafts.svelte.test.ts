import { describe, expect, it } from 'vitest';
import { Drafts } from './drafts.svelte';

describe('what is written in a field and not yet sent', () => {
  it('is there until it is dropped, though the field be emptied', () => {
    const drafts = new Drafts();
    expect(drafts.of('chat')).toBe('');
    expect(drafts.has('chat')).toBe(false);
    drafts.write('chat', 'Shall we');
    expect(drafts.of('chat')).toBe('Shall we');
    drafts.write('chat', '');
    expect(drafts.has('chat')).toBe(true);
    expect(drafts.fields()).toEqual(['chat']);
    drafts.drop('chat');
    expect(drafts.has('chat')).toBe(false);
    expect(drafts.fields()).toEqual([]);
  });

  it('keeps, from one opening to the next, the fields that hold words and still have their place', () => {
    const drafts = new Drafts({ chat: 'Shall we', 'answer:a': 'Yes' });
    drafts.write('answer:b', 'No');
    drafts.write('note:a:n', '');
    expect(drafts.kept()).toEqual({ chat: 'Shall we', 'answer:a': 'Yes', 'answer:b': 'No' });
    expect(drafts.kept((field) => field !== 'answer:b')).toEqual({
      chat: 'Shall we',
      'answer:a': 'Yes',
    });
    drafts.load({ chat: 'Another' });
    expect(drafts.kept()).toEqual({ chat: 'Another' });
  });
});
