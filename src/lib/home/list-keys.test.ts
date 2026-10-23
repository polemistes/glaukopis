import { describe, expect, it, vi } from 'vitest';
import { pressed, type ListRow, type ListSurface } from './list-keys';

const row = (key: string, over: Partial<ListRow> = {}): ListRow => ({
  key,
  kind: 'project',
  parent: null,
  holds: false,
  unfolded: false,
  changeable: true,
  own: false,
  ...over,
});

const rows: ListRow[] = [
  row('owl', { kind: 'owl', changeable: false, holds: true, unfolded: true }),
  row('f:g', { kind: 'folder', parent: 'owl', holds: true, unfolded: true }),
  row('p:1', { parent: 'f:g' }),
  row('p:2', { parent: 'f:g', changeable: false, holds: true, unfolded: true }),
  row('e:2:a', { kind: 'element', parent: 'p:2', changeable: false, own: true }),
];

function surface(selected: string | null = 'p:1') {
  const s = {
    rows,
    selected,
    select: vi.fn((k: string) => (s.selected = k)),
    toggle: vi.fn(),
    foldAll: vi.fn(),
    make: vi.fn(),
    shift: vi.fn(),
    deeper: vi.fn(),
    shallower: vi.fn(),
    open: vi.fn(),
    up: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    menu: vi.fn(),
    bringIntoView: vi.fn(),
  };
  return s as typeof s & ListSurface;
}

const key = (k: string, mods: Partial<KeyboardEvent> = {}) =>
  ({
    key: k,
    code: '',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...mods,
  }) as KeyboardEvent;

describe('the keys of the list of projects', () => {
  it('goes up and down the rows, to the row above, and to the first under', () => {
    const s = surface('p:1');
    pressed(key('ArrowDown'), s);
    expect(s.selected).toBe('p:2');
    pressed(key('ArrowRight'), s);
    expect(s.selected).toBe('e:2:a');
    pressed(key('ArrowLeft'), s);
    expect(s.selected).toBe('p:2');
    pressed(key('ArrowUp'), s);
    expect(s.selected).toBe('p:1');
    const none = surface(null);
    pressed(key('ArrowDown'), none);
    expect(none.selected).toBe('owl');
  });

  it('folds with Tab, and all with Shift+Tab', () => {
    const s = surface('f:g');
    pressed(key('Tab'), s);
    expect(s.toggle).toHaveBeenCalledWith('f:g');
    pressed(key('Tab', { shiftKey: true }), s);
    expect(s.foldAll).toHaveBeenCalled();
    const leaf = surface('p:1');
    expect(pressed(key('Tab'), leaf)).toBe(true);
    expect(leaf.toggle).not.toHaveBeenCalled();
  });

  it('makes a project with Alt+Enter and a folder with Alt+Shift+Enter', () => {
    const s = surface();
    pressed(key('Enter', { altKey: true }), s);
    expect(s.make).toHaveBeenLastCalledWith('project');
    pressed(key('Enter', { altKey: true, shiftKey: true }), s);
    expect(s.make).toHaveBeenLastCalledWith('folder');
  });

  it('moves: things deeper and less deep, elements of the open project up and down as well', () => {
    const s = surface('p:1');
    pressed(key('ArrowRight', { altKey: true }), s);
    expect(s.deeper).toHaveBeenCalledWith('p:1');
    pressed(key('ArrowLeft', { altKey: true }), s);
    expect(s.shallower).toHaveBeenCalledWith('p:1');
    pressed(key('ArrowUp', { altKey: true }), s);
    expect(s.shift).not.toHaveBeenCalled();
    const e = surface('e:2:a');
    pressed(key('ArrowDown', { altKey: true }), e);
    expect(e.shift).toHaveBeenCalledWith('e:2:a', 1);
    pressed(key('ArrowRight', { altKey: true }), e);
    expect(e.deeper).toHaveBeenCalledWith('e:2:a');
  });

  it('enters and goes up with Alt+Shift and the arrows, and opens with Enter', () => {
    const s = surface('p:1');
    pressed(key('ArrowDown', { altKey: true, shiftKey: true }), s);
    expect(s.open).toHaveBeenCalledWith('p:1');
    pressed(key('ArrowUp', { altKey: true, shiftKey: true }), s);
    expect(s.up).toHaveBeenCalled();
    pressed(key('Enter'), s);
    expect(s.open).toHaveBeenCalledTimes(2);
  });

  it('renames and deletes what may be, not the open project', () => {
    const s = surface('p:1');
    pressed(key('F2'), s);
    expect(s.rename).toHaveBeenCalledWith('p:1');
    pressed(key('x'), s);
    expect(s.rename).toHaveBeenLastCalledWith('p:1', 'x');
    pressed(key('Delete'), s);
    expect(s.remove).toHaveBeenCalledWith('p:1');
    const open = surface('p:2');
    pressed(key('F2'), open);
    pressed(key('Delete'), open);
    expect(open.rename).not.toHaveBeenCalled();
    expect(open.remove).not.toHaveBeenCalled();
  });

  it('opens the menu of the row, and leaves Ctrl and Space alone', () => {
    const s = surface('p:1');
    pressed(key('F10', { shiftKey: true }), s);
    expect(s.menu).toHaveBeenCalledWith('p:1');
    expect(pressed(key('z', { ctrlKey: true }), s)).toBe(false);
    expect(pressed(key(' '), s)).toBe(false);
    expect(s.toggle).not.toHaveBeenCalled();
  });
});
