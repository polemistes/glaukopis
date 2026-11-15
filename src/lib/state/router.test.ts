import { describe, expect, it } from 'vitest';
import { formatRoute, parseRoute, router } from './router.svelte';

describe('where one is', () => {
  it('names the start screen, and reads the old places of the home as it', () => {
    expect(formatRoute({ view: 'home' })).toBe('#/');
    // The empty place, the map of all projects and its folders, the page of projects, the page of
    // the search through everything (in the list of projects since record 0098), and what is not known.
    for (const place of [
      '',
      '#/',
      '#/owl',
      '#/owl/abc',
      '#/projects',
      '#/project',
      '#/search',
      '#/nowhere',
    ])
      expect(parseRoute(place)).toEqual({ view: 'home' });
  });

  it('names a file at its page, and the project whose tabs it is shown among', () => {
    const place = { view: 'file' as const, file: 'abc', page: 3, project: 'p1' };
    expect(formatRoute(place)).toBe('#/file/abc?page=3&project=p1');
    expect(parseRoute(formatRoute(place))).toEqual(place);
    expect(parseRoute('#/file/abc')).toEqual({ view: 'file', file: 'abc', page: undefined });
  });

  it('reads a place with a stray % as it is written, and does not throw', () => {
    expect(parseRoute('#/project/a%E0%A4%A/b%')).toEqual({
      view: 'project',
      project: 'a%E0%A4%A',
      at: 'b%',
      mode: undefined,
    });
    expect(parseRoute('#/project/%E0%A4%A4')).toMatchObject({ project: '\u0924' });
  });
});

describe('the library as it was left', () => {
  it('is the references or the files, whichever was shown last, each where it was', async () => {
    const { router } = await import('./router.svelte');
    expect(router.lastLibrary).toBeNull();
    router.replace({ view: 'files', folder: 'f1', file: 'abc' });
    expect(router.lastFiles).toEqual({ view: 'files', folder: 'f1', file: 'abc' });
    expect(router.lastLibrary).toEqual(router.lastFiles);
    router.replace({ view: 'project', project: 'p' });
    expect(router.lastLibrary).toEqual({ view: 'files', folder: 'f1', file: 'abc' });
    router.replace({ view: 'library', collection: 'c', entry: 'e' });
    expect(router.lastReferences).toEqual({ view: 'library', collection: 'c', entry: 'e' });
    expect(router.lastLibrary).toEqual(router.lastReferences);
    // The files are where they were, behind the references.
    expect(router.lastFiles).toEqual({ view: 'files', folder: 'f1', file: 'abc' });
    router.replace({ view: 'home' });
  });
});

describe('the notebook', () => {
  it('is a place of its own, with the note chosen in it', () => {
    expect(parseRoute('#/notebook')).toEqual({ view: 'notebook', note: undefined });
    expect(parseRoute('#/notebook?note=n1')).toEqual({ view: 'notebook', note: 'n1' });
    expect(formatRoute({ view: 'notebook' })).toBe('#/notebook');
    expect(formatRoute({ view: 'notebook', note: 'n 1' })).toBe('#/notebook?note=n%201');
    expect(parseRoute(formatRoute({ view: 'notebook', note: 'n 1' }))).toEqual({
      view: 'notebook',
      note: 'n 1',
    });
  });

  it('is gone back to at the note that was chosen when it was left', () => {
    router.replace({ view: 'notebook', note: 'n1' });
    router.replace({ view: 'library' });
    expect(router.lastNotebook).toEqual({ view: 'notebook', note: 'n1' });
  });
});
