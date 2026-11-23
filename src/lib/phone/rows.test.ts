import { describe, expect, it } from 'vitest';
import { Notebook } from '$lib/notebook/model/notebook.svelte';
import { phoneRowOf, sourceOf } from './rows';

describe('a row of the phone', () => {
  it('says no source where the note took in nothing', () => {
    const nb = new Notebook();
    const note = nb.addNote();
    nb.addText(note, 'My own words.');
    expect(sourceOf(nb, nb.note(note)!)).toBeNull();
  });

  it('says *No source* where what the note took in has none', () => {
    const nb = new Notebook();
    const note = nb.addNote();
    nb.addText(note, 'Pasted from somewhere', nb.addPassage(null, 'Pasted from somewhere'));
    expect(sourceOf(nb, nb.note(note)!)).toBe('No source');
  });

  it('says the source of the first of what the note took in', () => {
    const nb = new Notebook();
    const note = nb.addNote();
    const web = nb.addSource({ sort: 'web', url: 'https://www.owls.org/a', title: '', read: '' });
    const words = nb.addSource({ sort: 'words', words: 'A letter from a friend' });
    nb.addText(note, 'First', nb.addPassage(web, 'First'));
    nb.addText(note, 'Second', nb.addPassage(words, 'Second'));
    expect(sourceOf(nb, nb.note(note)!)).toBe('owls.org');
  });

  it('says what the computer’s row says, with the tags', () => {
    const nb = new Notebook();
    const note = nb.addNote({ name: 'Owls', tags: ['birds', 'athena'] });
    const row = phoneRowOf(nb, nb.note(note)!);
    expect(row).toMatchObject({ title: 'Owls', empty: false, source: null });
    expect(row.tags).toEqual(['athena', 'birds']);
    expect(row.day).not.toBe('');
  });
});
