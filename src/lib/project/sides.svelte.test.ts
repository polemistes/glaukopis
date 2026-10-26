import { describe, expect, it } from 'vitest';
import { Sides, isMap, paneParts, type MapSide, type SideSpec } from './sides.svelte';

/** The sides as maps: these tests open projects alone. */
const maps = (sides: SideSpec[]): MapSide[] => sides.filter(isMap);

const route = (project: string, at?: string) => ({ view: 'project' as const, project, at });
const panes = {
  typesetting: null,
  look: false,
  document: false,
  tab: 'references' as const,
  marks: true,
  typesettingWidth: 0,
  documentWidth: 0,
  lookWidth: 0,
  zoom: null,
};

describe('the sides of the window', () => {
  it('open a project in the active side, and leave the other as it was', () => {
    const s = new Sides();
    s.open('a');
    expect(maps(s.sides).map((x) => x.project)).toEqual(['a']);
    expect(maps(s.sides)[0].at).toBeNull();
    s.beside('b', 'e');
    expect(maps(s.sides).map((x) => x.project)).toEqual(['a', 'b']);
    expect(s.index).toBe(1);
    const first = s.sides[0].key;
    s.open('c');
    expect(maps(s.sides).map((x) => x.project)).toEqual(['a', 'c']);
    expect(s.sides[0].key).toBe(first);
  });

  it('turn a side to another element of its project without making it anew', () => {
    const s = new Sides();
    s.open('a', 'x');
    const key = s.active!.key;
    s.open('a', 'y', 'text');
    expect(s.active).toMatchObject({ key, at: 'y', mode: 'text' });
  });

  it('show the element in view both ways, and close the side without the focus', () => {
    const s = new Sides();
    s.open('a', 'x', 'diagram');
    s.bothWays();
    expect(maps(s.sides).map((x) => [x.project, x.at, x.mode])).toEqual([
      ['a', 'x', 'diagram'],
      ['a', 'x', 'text'],
    ]);
    s.switchSides();
    expect(s.mirrored).toBe(true);
    s.close(s.sides[1].key);
    expect(s.sides).toHaveLength(1);
    expect(s.mirrored).toBe(false);
  });

  it('close every side of a project, and are none after the last', () => {
    const s = new Sides();
    s.open('a');
    s.beside('a', 'y');
    s.closeProject('a');
    expect(s.sides).toEqual([]);
    expect(s.active).toBeUndefined();
  });

  it('are laid out as they were kept where the place names the active side kept', () => {
    const s = new Sides();
    s.open('a', 'x');
    s.beside('b', 'y', 'text');
    s.switchSides();
    s.split = 0.3;
    const kept = JSON.parse(JSON.stringify(s.toKeep({ ...panes, typesetting: s.sides[0].key })));
    expect(kept).toMatchObject({ focused: 1, mirrored: true, split: 0.3, typesetting: 0 });

    const again = new Sides();
    again.arrange(kept, route('b'));
    expect(maps(again.sides).map((x) => [x.project, x.at, x.mode])).toEqual([
      ['a', 'x', 'diagram'],
      ['b', 'y', 'text'],
    ]);
    expect([again.index, again.mirrored, again.split]).toEqual([1, true, 0.3]);
    expect(paneParts(kept, again).typesetting).toBe(again.sides[0].key);
  });

  it('are one side at the place where it names another project, or a project kept is gone', () => {
    const kept = { sides: [{ project: 'a', at: 'x' }, { project: 'b' }], focused: 0 } as never;
    const s = new Sides();
    s.arrange(kept, route('c', 'e'));
    expect(maps(s.sides).map((x) => [x.project, x.at])).toEqual([['c', 'e']]);
    s.arrange(kept, route('a'), (id) => id !== 'b');
    expect(maps(s.sides).map((x) => x.project)).toEqual(['a']);
    s.arrange({ sides: 'nonsense' } as never, route('a'));
    expect(maps(s.sides).map((x) => x.project)).toEqual(['a']);
  });

  it('read the tabs of an older arrangement: Look as the references, the pictures as the images', () => {
    const s = new Sides();
    s.open('a');
    expect(paneParts({ tab: 'look' } as never, s).tab).toBe('references');
    expect(paneParts({ tab: 'pictures' } as never, s).tab).toBe('images');
    expect(paneParts({ tab: 'history', lookWidth: 300 }, s)).toMatchObject({
      tab: 'history',
      lookWidth: 300,
    });
  });

  it('keep the zoom of the typesetting pane, none being the width of the pane', () => {
    const s = new Sides();
    s.open('a');
    expect(s.toKeep({ ...panes, zoom: 1.5 }).zoom).toBe(1.5);
    expect(paneParts({ zoom: 1.5 }, s).zoom).toBe(1.5);
    expect(paneParts({}, s).zoom).toBe(null);
    expect(paneParts({ zoom: 'large' } as never, s).zoom).toBe(null);
  });

  it('show a file in the active side, in the place of a project, and a project in the place of a file', () => {
    const s = new Sides();
    s.open('a');
    s.openFile('f', 3);
    expect(s.sides).toHaveLength(1);
    expect(s.active).toMatchObject({ kind: 'file', file: 'f', page: 3, zoom: null });
    expect(s.map).toBeUndefined();
    s.open('b', 'e');
    expect(s.active).toMatchObject({ kind: 'map', project: 'b', at: 'e' });
  });

  it('show a file beside, in the other side, which gets the focus, and keep the map for the panes', () => {
    const s = new Sides();
    s.open('a', 'x');
    s.besideFile('f');
    expect(s.sides.map((x) => x.kind)).toEqual(['map', 'file']);
    expect(s.index).toBe(1);
    // The panes follow the map of the other side while the file has the focus.
    expect(s.map).toMatchObject({ project: 'a' });
    expect(s.across).toBe(false);
    s.besideFile('g', 5);
    expect(s.sides).toHaveLength(2);
    expect(s.active).toMatchObject({ file: 'g', page: 5 });
  });

  it('keep a file side with the window, its page and zoom, and leave it out when the file is gone', () => {
    const s = new Sides();
    s.open('a', 'x');
    s.besideFile('f', 7);
    s.setFileZoom(s.active!.key, 1.25);
    const kept = JSON.parse(JSON.stringify(s.toKeep(panes)));
    const again = new Sides();
    again.arrange(kept, { view: 'file', file: 'f' });
    expect(again.sides.map((x) => x.kind)).toEqual(['map', 'file']);
    expect(again.active).toMatchObject({ kind: 'file', file: 'f', page: 7, zoom: 1.25 });
    const without = new Sides();
    without.arrange(
      kept,
      route('a', 'x'),
      () => true,
      () => false,
    );
    expect(without.sides.map((x) => x.kind)).toEqual(['map']);
  });

  it('close a file side as any side, and the map does not come back', () => {
    const s = new Sides();
    s.open('a');
    s.openFile('f');
    s.close(s.active!.key);
    expect(s.sides).toEqual([]);
  });
});
