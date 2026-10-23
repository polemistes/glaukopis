import { describe, expect, it } from 'vitest';
import { leftAt, OUTLINE_WIDTH, readMemory, sideWidth, toStore } from './layout';
import { PROJECT } from './model/types';

const elements = new Set(['a', 'b']);

describe('what a project keeps of how it was looked at', () => {
  it('is as a project first met where nothing, or nothing readable, was kept', () => {
    for (const kept of [undefined, null, 'x', {}, { cameras: 3, tops: ['a'], outlineWidth: 5 }])
      expect(readMemory(kept)).toEqual({
        cameras: {},
        tops: {},
        outlineWidth: OUTLINE_WIDTH,
        left: null,
      });
    expect(leftAt(readMemory(null), elements)).toEqual({ at: PROJECT, mode: 'diagram' });
  });

  it('reads back as it was written: cameras, folds, tops, the outline and where it was left', () => {
    const memory = {
      cameras: { a: { cx: 1, cy: 2, k: 1 }, gone: { cx: 0, cy: 0, k: 1 } },
      tops: { a: 'b', b: 'gone' },
      outlineWidth: 300,
      left: { at: 'a', mode: 'text' as const },
    };
    const stored = toStore(memory, elements, ['a']);
    expect(stored).toEqual({
      cameras: { a: { cx: 1, cy: 2, k: 1 } },
      folded: ['a'],
      tops: { a: 'b' },
      outlineWidth: 300,
      at: 'a',
      mode: 'text',
    });
    expect(readMemory(JSON.parse(JSON.stringify(stored)))).toEqual({
      ...memory,
      cameras: { a: { cx: 1, cy: 2, k: 1 } },
      tops: { a: 'b' },
    });
  });

  it('is left at the project where the element it was left at is gone', () => {
    const memory = readMemory({ at: 'gone', mode: 'text' });
    expect(leftAt(memory, elements)).toEqual({ at: PROJECT, mode: 'text' });
    expect(toStore(memory, elements, [])).not.toHaveProperty('at');
  });

  it('reads where it was left from the first pane of a view kept before the sides were the window’s', () => {
    expect(
      readMemory({
        panes: [
          { at: 'b', mode: 'text' },
          { at: 'a', project: 'x' },
        ],
      }).left,
    ).toEqual({
      at: 'b',
      mode: 'text',
    });
  });

  it('gives the panes beside the sides what the room allows', () => {
    expect(sideWidth('references', 300, -1000, 1200)).toBe(600);
    expect(sideWidth('references', 300, 1000, 1200)).toBe(240);
    expect(sideWidth('preview', 500, -2000, 1000)).toBe(700);
  });
});
