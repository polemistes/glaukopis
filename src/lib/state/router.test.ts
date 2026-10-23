import { describe, expect, it } from 'vitest';
import { formatRoute, parseRoute } from './router.svelte';

describe('where one is', () => {
  it('names the map of all projects, the home, and a folder entered on it', () => {
    expect(parseRoute('#/owl')).toEqual({ view: 'owl' });
    expect(parseRoute('#/owl/abc')).toEqual({ view: 'owl', at: 'abc' });
    expect(formatRoute({ view: 'owl' })).toBe('#/');
    // The map is the home: the empty place, the old place of the page of projects, and what is not known.
    expect(parseRoute('')).toEqual({ view: 'owl' });
    expect(parseRoute('#/')).toEqual({ view: 'owl' });
    expect(parseRoute('#/projects')).toEqual({ view: 'owl' });
    expect(parseRoute('#/project')).toEqual({ view: 'owl' });
    expect(formatRoute({ view: 'owl', at: 'a b' })).toBe('#/owl/a%20b');
    expect(parseRoute(formatRoute({ view: 'owl', at: 'a b' }))).toEqual({ view: 'owl', at: 'a b' });
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
