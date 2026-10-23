import { describe, expect, it } from 'vitest';
import { Sides, paneParts } from './sides.svelte';

const route = (project: string, at?: string) => ({ view: 'project' as const, project, at });
const panes = {
  typesetting: null,
  look: false,
  document: false,
  tab: 'references' as const,
  marks: true,
  typesettingWidth: 0,
  documentWidth: 0,
};

describe('the sides of the window', () => {
  it('open a project in the active side, and leave the other as it was', () => {
    const s = new Sides();
    s.open('a');
    expect(s.sides.map((x) => x.project)).toEqual(['a']);
    expect(s.active?.at).toBeNull();
    s.beside('b', 'e');
    expect(s.sides.map((x) => x.project)).toEqual(['a', 'b']);
    expect(s.index).toBe(1);
    const first = s.sides[0].key;
    s.open('c');
    expect(s.sides.map((x) => x.project)).toEqual(['a', 'c']);
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
    expect(s.sides.map((x) => [x.project, x.at, x.mode])).toEqual([
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
    expect(again.sides.map((x) => [x.project, x.at, x.mode])).toEqual([
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
    expect(s.sides.map((x) => [x.project, x.at])).toEqual([['c', 'e']]);
    s.arrange(kept, route('a'), (id) => id !== 'b');
    expect(s.sides.map((x) => x.project)).toEqual(['a']);
    s.arrange({ sides: 'nonsense' } as never, route('a'));
    expect(s.sides.map((x) => x.project)).toEqual(['a']);
  });
});
