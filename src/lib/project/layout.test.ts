import { describe, expect, it } from 'vitest';
import { arranged, sideWidth, toStore, withoutGone, type Pane } from './layout';
import type { MapRecord } from './model/types';

const map = (id: string): MapRecord => ({
  id,
  name: id,
  root: `${id}-root`,
  order: 'a0',
  created: '',
  document: {},
  timeline: {},
});
const maps = [map('a'), map('b'), map('c')];

describe('the layout of the view of a project', () => {
  it('is as it was left, or as a project is first met', () => {
    const first = arranged(maps, {}, null);
    expect(first.panes).toEqual([{ map: 'a', mode: 'diagram' }]);
    expect(first.side).toBeNull();
    expect(first.lastSide).toBe('references');
    expect(first.sizes).toEqual({ split: 0.5, preview: 0, references: 0 });

    const left = arranged(
      maps,
      {
        panes: [
          { map: 'b', mode: 'text' },
          { map: 'c', mode: 'diagram' },
        ],
        side: 'pictures',
        outline: true,
        sizes: { split: 0.3 },
      },
      null,
    );
    expect(left.panes.map((p) => p.map)).toEqual(['b', 'c']);
    expect(left.side).toBe('pictures');
    expect(left.outline).toBe(true);
    expect(left.sizes.split).toBe(0.3);
  });

  it('shows first, and alone, the map the place in the application names', () => {
    const stored = {
      panes: [
        { map: 'b', mode: 'text' as const },
        { map: 'c', mode: 'text' as const },
      ],
    };
    expect(arranged(maps, stored, { map: 'c', mode: 'text' }).panes).toEqual([
      { map: 'c', mode: 'text' },
    ]);
    // A map that is not there is not shown.
    expect(arranged(maps, { panes: [{ map: 'gone', mode: 'text' }] }, null).panes[0].map).toBe('a');
  });

  it('opens the changes only when they are asked for, and reads what was kept before there were tabs', () => {
    expect(arranged(maps, { side: 'changes' }, null).side).toBeNull();
    expect(arranged(maps, { history: true }, null).side).toBe('history');
  });

  it('keeps the cameras of maps that are there, and not the changes', () => {
    const layout = arranged(maps, {}, null);
    layout.cameras = { a: { cx: 1, cy: 2, k: 1 }, gone: { cx: 0, cy: 0, k: 1 } };
    layout.side = 'changes';
    const kept = toStore(layout, maps, ['x']);
    expect(Object.keys(kept.cameras ?? {})).toEqual(['a']);
    expect(kept.side).toBeNull();
    expect(kept.folded).toEqual(['x']);
  });

  it('shows no map that is gone', () => {
    const panes: Pane[] = [
      { map: 'gone', mode: 'text' },
      { map: 'b', mode: 'diagram' },
    ];
    expect(withoutGone(panes, maps)).toEqual([
      { map: 'a', mode: 'text' },
      { map: 'b', mode: 'diagram' },
    ]);
    expect(withoutGone([{ map: 'a', mode: 'text' }], maps)).toBeNull();
    expect(withoutGone(panes, [])).toBeNull();
  });

  it('gives the panels at the side what the room allows', () => {
    expect(sideWidth('references', 300, -1000, 1200)).toBe(600);
    expect(sideWidth('references', 300, 1000, 1200)).toBe(240);
    expect(sideWidth('preview', 500, -2000, 1000)).toBe(700);
  });
});
