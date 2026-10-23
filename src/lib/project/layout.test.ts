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

  it('keeps where each text was read, which side had the focus, and whether the sides were switched', () => {
    const stored = {
      panes: [
        { at: 'a', mode: 'diagram' as const },
        { at: 'b', mode: 'text' as const },
      ],
      tops: [null, 'c'],
      focused: 1,
      mirrored: true,
    };
    const left = arranged(elements, stored, null);
    expect(left.tops).toEqual([null, 'c']);
    expect(left.focused).toBe(1);
    expect(left.mirrored).toBe(true);
    expect(toStore(left, elements, [])).toMatchObject({
      tops: [null, 'c'],
      focused: 1,
      mirrored: true,
    });

    // As a project is first met, or as it was kept before these were.
    const first = arranged(elements, {}, null);
    expect(first.tops).toEqual([null]);
    expect(first.focused).toBe(0);
    expect(first.mirrored).toBe(false);
  });

  it('reads a text where it was only while its pane shows what it showed', () => {
    const stored = {
      panes: [
        { at: 'a', mode: 'text' as const },
        { at: 'b', mode: 'text' as const },
      ],
      tops: ['b', 'gone'],
      focused: 7,
      mirrored: true,
    };
    // An element that is no longer there is not looked for; the focus is within the panes.
    const left = arranged(elements, stored, null);
    expect(left.tops).toEqual(['b', null]);
    expect(left.focused).toBe(1);
    // A place that names another element shows it alone, from its top, with the focus and nothing to switch.
    const named = arranged(elements, stored, { at: 'c', mode: 'text' });
    expect(named.tops).toEqual([null]);
    expect(named.focused).toBe(0);
    expect(named.mirrored).toBe(false);
    // The same element named, as the place kept names it, is read where it was.
    expect(arranged(elements, stored, { at: 'a', mode: 'text' }).tops).toEqual(['b']);
    // A pane that shows the diagram now has no place in a text.
    expect(arranged(elements, stored, { at: 'a', mode: 'diagram' }).tops).toEqual([null]);
    // Something unreadable is taken for nothing.
    const odd = arranged(
      elements,
      { ...stored, tops: 'b' as never, focused: 'one' as never, mirrored: 'yes' as never },
      null,
    );
    expect([odd.tops, odd.focused, odd.mirrored]).toEqual([[null, null], 0, false]);
  });

  it('keeps the top of a text beside in the project beside, whose elements it cannot know', () => {
    const stored = {
      panes: [
        { at: 'a', mode: 'text' as const },
        { at: 'theirs', mode: 'text' as const, project: 'other' },
      ],
      tops: ['a', 'deep in theirs'],
    };
    const left = arranged(elements, stored, null);
    expect(left.tops).toEqual(['a', 'deep in theirs']);
    // A pane that shows the diagram keeps no top; one side has nothing to switch.
    left.panes[1] = { ...left.panes[1], mode: 'diagram' };
    expect(toStore(left, elements, []).tops).toEqual(['a', null]);
    left.panes = [left.panes[0]];
    left.mirrored = true;
    left.focused = 1;
    expect(toStore(left, elements, [])).toMatchObject({ tops: ['a'], focused: 0, mirrored: false });
  });

  it('gives the panels at the side what the room allows', () => {
    expect(sideWidth('references', 300, -1000, 1200)).toBe(600);
    expect(sideWidth('references', 300, 1000, 1200)).toBe(240);
    expect(sideWidth('preview', 500, -2000, 1000)).toBe(700);
  });
});
