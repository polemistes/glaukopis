import { afterEach, describe, expect, it } from 'vitest';
import { languages, t } from '$lib/i18n';

afterEach(() => {
  languages.current = 'en';
});

// These were sentences put together in code; they are said as they were.
describe('the words of a document brought in', () => {
  it('say how often works are cited', () => {
    expect(t('documents-cited-in-library', { cited: 1 })).toBe(
      'Works of your library are cited once.',
    );
    expect(t('documents-cited-in-library', { cited: 6 })).toBe(
      'Works of your library are cited 6 times.',
    );
    expect(t('documents-cited-not-in-library', { missing: 2 })).toBe(
      'Works that are not in your library are cited twice.',
    );
    expect(t('documents-cited-both', { cited: 1200, missing: 1 })).toBe(
      'Works of your library are cited 1,200 times, works that are not in it once.',
    );
    languages.current = 'nb';
    expect(t('documents-cited-both', { cited: 2, missing: 1 })).toBe(
      'Det vises til verk i biblioteket ditt to ganger, og til verk som ikke er i det, én gang.',
    );
  });

  it('say how many citations were found, and how many a program made', () => {
    expect(t('documents-found', { count: 1 })).toBe('One citation was found.');
    expect(t('documents-found', { count: 3 })).toBe('3 citations were found.');
    expect(t('documents-found-made', { count: 1 })).toBe(
      'One citation was found, made by a program that keeps references.',
    );
    expect(t('documents-found-made', { count: 4 })).toBe(
      '4 citations were found, all made by a program that keeps references.',
    );
    expect(t('documents-found-some-made', { count: 4, made: 1 })).toBe(
      '4 citations were found, 1 of them made by a program that keeps references.',
    );
  });
});

describe('the words of the library that were put together', () => {
  it('say what an import will do', () => {
    expect(t('library-import-counts', { add: 3, merge: 0, skip: 0 })).toBe('3 to add');
    expect(t('library-import-counts', { add: 0, merge: 1, skip: 2 })).toBe(
      '0 to add, 1 to complete, 2 left out',
    );
    languages.current = 'nb';
    expect(t('library-import-counts', { add: 3, merge: 0, skip: 2 })).toBe(
      '3 legges til, 2 utelates',
    );
  });

  it('say what deleting references takes with it', () => {
    expect(t('library-delete-one', { files: 0 })).toBe(
      'This removes the reference from your library, from every collection. Citations of it in your projects will no longer resolve.',
    );
    expect(t('library-delete-many', { files: 1 })).toBe(
      'This removes them from your library, from every collection, together with 1 attached file. Citations of them in your projects will no longer resolve.',
    );
  });

  it('say what is not known of what was looked up, and what is read from Zotero', () => {
    expect(t('library-lookup-unknown', { kind: 'arxiv' })).toBe(
      'Nothing is known of this arXiv number where it was asked for. The reference can be entered by hand below.',
    );
    expect(t('library-zotero-read', { count: 0 })).toBe('Read');
    expect(t('library-zotero-read', { count: 3 })).toBe('Read 3 references');
  });

  it('say where the words of a note go, when it becomes a citation', () => {
    const around = (has: string) =>
      t('found-note-around', { has, before: 'See', after: 'and elsewhere' });
    const style = ' The style of the references sets it in the line or in a note.';
    expect(around('before')).toBe(
      `What else the note says goes before and after its works: “See” before.${style}`,
    );
    expect(around('after')).toBe(
      `What else the note says goes before and after its works: “and elsewhere” after.${style}`,
    );
    expect(around('both')).toBe(
      `What else the note says goes before and after its works: “See” before, “and elsewhere” after.${style}`,
    );
  });
});
