import { describe, expect, it } from 'vitest';
import { formatRoute, parseRoute } from './router.svelte';

describe('where one is', () => {
  it('names the start screen, and reads the old places of the home as it', () => {
    expect(formatRoute({ view: 'home' })).toBe('#/');
    // The empty place, the map of all projects and its folders, the page of projects, and what is not known.
    for (const place of ['', '#/', '#/owl', '#/owl/abc', '#/projects', '#/project', '#/nowhere'])
      expect(parseRoute(place)).toEqual({ view: 'home' });
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
