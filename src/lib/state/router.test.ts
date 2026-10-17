import { describe, expect, it } from 'vitest';
import { formatRoute, parseRoute } from './router.svelte';

describe('where one is', () => {
  it('names the owl map, and a folder entered on it', () => {
    expect(parseRoute('#/owl')).toEqual({ view: 'owl' });
    expect(parseRoute('#/owl/abc')).toEqual({ view: 'owl', at: 'abc' });
    expect(formatRoute({ view: 'owl' })).toBe('#/owl');
    expect(formatRoute({ view: 'owl', at: 'a b' })).toBe('#/owl/a%20b');
    expect(parseRoute(formatRoute({ view: 'owl', at: 'a b' }))).toEqual({ view: 'owl', at: 'a b' });
  });
});
