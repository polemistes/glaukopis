import { describe, expect, it } from 'vitest';
import { SourcesStore } from './sources.svelte';
import { withFile, type Sources } from './sources';

describe('the tabs of the projects', () => {
  it('tell what came of a change asked of a project whose tabs have not come, once they come', async () => {
    let answer: (kept: unknown) => void = () => {};
    const store = new SourcesStore({
      read: () => new Promise((resolve) => (answer = resolve)),
      keep: async () => {},
    });
    const told: [Sources, Sources][] = [];
    store.change(
      'p',
      (s) => withFile(s, 'f').sources,
      (before, after) => told.push([before, after]),
    );
    expect(told).toEqual([]);
    answer(null);
    await new Promise((r) => setTimeout(r, 0));
    expect(told).toHaveLength(1);
    expect(told[0][0].tabs).toHaveLength(0);
    expect(told[0][1].tabs.map((t) => t.file)).toEqual(['f']);
    // Asked again, the tabs being there: told at once, the file not given twice.
    store.change(
      'p',
      (s) => withFile(s, 'f').sources,
      (before, after) => told.push([before, after]),
    );
    expect(told).toHaveLength(2);
    expect(told[1][1].tabs).toHaveLength(1);
  });
});
