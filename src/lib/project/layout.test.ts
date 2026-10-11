import { describe, expect, it } from 'vitest';
import { arranged, sideWidth, toStore } from './layout';
import { PROJECT } from './model/types';

const elements = new Set([PROJECT, 'a', 'b', 'c']);

describe('the layout of the view of a project', () => {
  it('is as it was left, or as a project is first met', () => {
    const first = arranged(elements, {}, null);
    expect(first.panes).toEqual([{ at: PROJECT, mode: 'diagram' }]);
    expect(first.side).toBeNull();
    expect(first.lastSide).toBe('references');
    expect(first.sizes).toEqual({ split: 0.5, preview: 0, references: 0 });

    const left = arranged(
      elements,
      {
        panes: [
          { at: 'b', mode: 'text' },
          { at: 'c', mode: 'diagram' },
        ],
        side: 'pictures',
        outline: true,
        sizes: { split: 0.3 },
      },
      null,
    );
    expect(left.panes.map((p) => p.at)).toEqual(['b', 'c']);
    expect(left.side).toBe('pictures');
    expect(left.outline).toBe(true);
    expect(left.sizes.split).toBe(0.3);
  });

  it('shows first, and alone, the element the place in the application names', () => {
    const stored = {
      panes: [
        { at: 'b', mode: 'text' as const },
        { at: 'c', mode: 'text' as const },
      ],
    };
    expect(arranged(elements, stored, { at: 'c', mode: 'text' }).panes).toEqual([
      { at: 'c', mode: 'text' },
    ]);
    // An element that is not there is not shown: the project is.
    expect(arranged(elements, { panes: [{ at: 'gone', mode: 'text' }] }, null).panes[0].at).toBe(
      PROJECT,
    );
    // The project itself can be in view before its element has arrived.
    expect(arranged(new Set(), {}, { at: PROJECT }).panes[0].at).toBe(PROJECT);
  });

  it('opens another project beside as it was left, in its diagram or its text', () => {
    const stored = {
      panes: [
        { at: 'a', mode: 'diagram' as const, project: 'other' },
        { at: 'elsewhere', mode: 'timeline' as const, project: 'other' },
      ],
    };
    // The first pane is always of the project of the view.
    expect(arranged(elements, stored, null).panes).toEqual([
      { at: 'a', mode: 'diagram' },
      { at: 'elsewhere', mode: 'diagram', project: 'other' },
    ]);
    // A place in the application that names an element shows that one alone.
    expect(arranged(elements, stored, { at: 'b' }).panes).toHaveLength(1);
    const layout = arranged(elements, stored, null);
    expect(toStore(layout, elements, []).panes?.[1]).toEqual({
      at: 'elsewhere',
      mode: 'diagram',
      project: 'other',
    });
  });

  it('opens the changes only when they are asked for, and reads what was kept before there were tabs', () => {
    expect(arranged(elements, { side: 'changes' }, null).side).toBeNull();
    expect(arranged(elements, { history: true }, null).side).toBe('history');
  });

  it('keeps the cameras of elements that are there, and not the changes', () => {
    const layout = arranged(elements, {}, null);
    layout.cameras = { a: { cx: 1, cy: 2, k: 1 }, gone: { cx: 0, cy: 0, k: 1 } };
    layout.side = 'changes';
    const kept = toStore(layout, elements, ['x']);
    expect(Object.keys(kept.cameras ?? {})).toEqual(['a']);
    expect(kept.side).toBeNull();
    expect(kept.folded).toEqual(['x']);
  });

  it('gives the panels at the side what the room allows', () => {
    expect(sideWidth('references', 300, -1000, 1200)).toBe(600);
    expect(sideWidth('references', 300, 1000, 1200)).toBe(240);
    expect(sideWidth('preview', 500, -2000, 1000)).toBe(700);
  });
});
