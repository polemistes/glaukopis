import { describe, expect, it } from 'vitest';
import type { Place } from '$lib/viewer/pages';
import { emptySources, type Sources } from '$lib/viewer/sources';
import type { SourcesOf } from '$lib/viewer/sources.svelte';
import { Sides, isMap, paneParts, type MapSide, type SideSpec } from './sides.svelte';

/** The sources of the projects, kept here as the store keeps them, at once. */
class FakeSources implements SourcesOf {
  by = new Map<string, Sources>();
  forgotten: string[] = [];
  of(project: string) {
    return this.by.get(project) ?? emptySources();
  }
  change(project: string, change: (s: Sources) => Sources) {
    this.by.set(project, change(this.of(project)));
  }
  place(project: string, id: string, place: Place) {
    const tab = this.by.get(project)?.tabs.find((t) => t.id === id);
    if (tab) tab.place = { ...place };
  }
  forget(project: string) {
    this.forgotten.push(project);
    this.by.delete(project);
  }
}

const withSources = () => {
  const store = new FakeSources();
  return { s: new Sides(store), store };
};

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
    const s = new Sides(new FakeSources());
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
    const s = new Sides(new FakeSources());
    s.open('a', 'x');
    const key = s.active!.key;
    s.open('a', 'y', 'text');
    expect(s.active).toMatchObject({ key, at: 'y', mode: 'text' });
  });

  it('show the element in view both ways, and close the side without the focus', () => {
    const s = new Sides(new FakeSources());
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
    const s = new Sides(new FakeSources());
    s.open('a');
    s.beside('a', 'y');
    s.closeProject('a');
    expect(s.sides).toEqual([]);
    expect(s.active).toBeUndefined();
  });

  it('are laid out as they were kept where the place names the active side kept', () => {
    const s = new Sides(new FakeSources());
    s.open('a', 'x');
    s.beside('b', 'y', 'text');
    s.switchSides();
    s.split = 0.3;
    const kept = JSON.parse(JSON.stringify(s.toKeep({ ...panes, typesetting: s.sides[0].key })));
    expect(kept).toMatchObject({ focused: 1, mirrored: true, split: 0.3, typesetting: 0 });

    const again = new Sides(new FakeSources());
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
    const s = new Sides(new FakeSources());
    s.arrange(kept, route('c', 'e'));
    expect(maps(s.sides).map((x) => [x.project, x.at])).toEqual([['c', 'e']]);
    s.arrange(kept, route('a'), (id) => id !== 'b');
    expect(maps(s.sides).map((x) => x.project)).toEqual(['a']);
    s.arrange({ sides: 'nonsense' } as never, route('a'));
    expect(maps(s.sides).map((x) => x.project)).toEqual(['a']);
  });

  it('read the tabs of an older arrangement: Look as the references, the pictures as the images', () => {
    const s = new Sides(new FakeSources());
    s.open('a');
    expect(paneParts({ tab: 'look' } as never, s).tab).toBe('references');
    expect(paneParts({ tab: 'pictures' } as never, s).tab).toBe('images');
    expect(paneParts({ tab: 'history', lookWidth: 300 }, s)).toMatchObject({
      tab: 'history',
      lookWidth: 300,
    });
  });

  it('keep the zoom of the typesetting pane, none being the width of the pane', () => {
    const s = new Sides(new FakeSources());
    s.open('a');
    expect(s.toKeep({ ...panes, zoom: 1.5 }).zoom).toBe(1.5);
    expect(paneParts({ zoom: 1.5 }, s).zoom).toBe(1.5);
    expect(paneParts({}, s).zoom).toBe(null);
    expect(paneParts({ zoom: 'large' } as never, s).zoom).toBe(null);
  });

  it('show a file beside the map, among its sources, and go to its tab when it is shown again', () => {
    const { s, store } = withSources();
    s.open('a', 'x');
    s.showFile('f', { page: 3, at: 0 });
    expect(s.sides.map((x) => x.kind)).toEqual(['map', 'file']);
    expect(s.index).toBe(1);
    expect(s.active).toMatchObject({ kind: 'file', project: 'a', own: null });
    // The panes follow the map of the other side while the file has the focus.
    expect(s.map).toMatchObject({ project: 'a' });
    expect(s.across).toBe(false);
    s.showFile('g');
    s.showFile('f');
    const tabs = store.of('a');
    expect(tabs.tabs.map((t) => t.file)).toEqual(['f', 'g']);
    expect(s.activeTab(s.active!.key)).toMatchObject({ file: 'f', place: { page: 3, at: 0 } });
    expect(s.sides).toHaveLength(2);
  });

  it('take the other of two maps for the file side, of the project that has the focus', () => {
    const { s } = withSources();
    s.open('a', 'x');
    s.beside('b', 'y');
    s.focus(s.sides[0].key);
    s.showFile('f');
    expect(s.sides.map((x) => x.kind)).toEqual(['map', 'file']);
    expect(s.active).toMatchObject({ kind: 'file', project: 'a' });
  });

  it('follow the project beside, keep it when the map closes, and take the one the window was last in', () => {
    const { s, store } = withSources();
    s.open('a', 'x');
    s.showFile('f');
    const file = s.active!.key;
    s.close(s.sides[0].key);
    expect(s.sides).toHaveLength(1);
    expect(s.active).toMatchObject({ key: file, project: 'a' });
    s.beside('b', 'y');
    expect(s.byKey(file)).toMatchObject({ project: 'b' });
    expect(store.of('b').tabs).toEqual([]);
    expect(store.of('a').tabs.map((t) => t.file)).toEqual(['f']);
    expect(s.lastProject).toBe('b');
    s.clear();
    s.showFile('g');
    expect(s.active).toMatchObject({ kind: 'file', project: 'b' });
  });

  it('give a side of no project its own tabs, and give them to the first project beside it', () => {
    const { s, store } = withSources();
    s.showFile('f', { page: 4, at: 0.5 });
    expect(s.active).toMatchObject({ kind: 'file', project: null });
    expect(s.activeTab(s.active!.key)?.file).toBe('f');
    s.beside('a', 'x');
    const file = s.sides.find((x) => x.kind === 'file')!;
    expect(file).toMatchObject({ project: 'a', own: null });
    expect(store.of('a').tabs).toMatchObject([{ file: 'f', place: { page: 4, at: 0.5 } }]);
  });

  it('show a file chosen in the tree of a map side in that side, of the project beside or its own', () => {
    const { s, store } = withSources();
    s.open('a', 'x');
    s.beside('b', 'y');
    s.showFileIn(s.sides[0].key, 'f');
    expect(s.sides.map((x) => x.kind)).toEqual(['file', 'map']);
    expect(s.sides[0]).toMatchObject({ project: 'b' });
    expect(store.of('b').tabs.map((t) => t.file)).toEqual(['f']);
    const one = withSources();
    one.s.open('c', 'z');
    one.s.showFileIn(one.s.sides[0].key, 'g');
    expect(one.s.sides).toMatchObject([{ kind: 'file', project: 'c' }]);
  });

  it('close a tab, the side with its last, and the other tabs; open one again; step round them', () => {
    const { s, store } = withSources();
    s.open('a', 'x');
    s.showFile('f');
    const key = s.active!.key;
    s.showFile('g');
    const [f, g] = store.of('a').tabs;
    s.again(key, g.id);
    expect(store.of('a').tabs.map((t) => t.file)).toEqual(['f', 'g', 'g']);
    s.stepTab(key, 1);
    expect(s.activeTab(key)?.id).toBe(f.id);
    s.closeOtherTabs(key, f.id);
    expect(store.of('a').tabs.map((t) => t.id)).toEqual([f.id]);
    s.closeTab(key, f.id);
    expect(s.sides.map((x) => x.kind)).toEqual(['map']);
    expect(store.of('a').tabs).toEqual([]);
  });

  it('keep the place of a tab without a change of the sources, and its zoom with one', () => {
    const { s, store } = withSources();
    s.open('a', 'x');
    s.showFile('f');
    const key = s.active!.key;
    const before = store.of('a');
    const id = before.tabs[0].id;
    s.setPlace(key, id, { page: 9, at: 0.3 });
    expect(store.of('a')).toBe(before);
    expect(store.of('a').tabs[0].place).toEqual({ page: 9, at: 0.3 });
    s.setTabZoom(key, id, 2);
    expect(store.of('a')).not.toBe(before);
    expect(store.of('a').tabs[0].zoom).toBe(2);
    s.setFile(key, 'f2');
    expect(store.of('a').tabs[0]).toMatchObject({
      file: 'f2',
      place: { page: 1, at: 0 },
      zoom: null,
    });
  });

  it('keep a file side with the window by its project, and the project the window was last in', () => {
    const { s } = withSources();
    s.open('a', 'x');
    s.showFile('f');
    const kept = JSON.parse(JSON.stringify(s.toKeep(panes)));
    expect(kept.lastProject).toBe('a');
    const again = withSources().s;
    again.arrange(kept, route('a', 'x'));
    expect(again.sides.map((x) => x.kind)).toEqual(['map']);
    const asLeft = withSources().s;
    asLeft.arrange({ ...kept, focused: 0 }, route('a', 'x'));
    expect(asLeft.sides).toMatchObject([{ kind: 'map' }, { kind: 'file', project: 'a' }]);
    expect(asLeft.lastProject).toBe('a');
    const gone = withSources().s;
    gone.arrange({ ...kept, focused: 0 }, route('b'), (id) => id !== 'a');
    expect(gone.sides).toMatchObject([{ kind: 'map', project: 'b' }]);
    expect(gone.lastProject).toBe('b');
  });

  it('show a file the place names among the sources of the window as it was kept', () => {
    const { s, store } = withSources();
    s.open('a', 'x');
    const kept = JSON.parse(JSON.stringify(s.toKeep(panes)));
    s.arrange(kept, { view: 'file', file: 'f', page: 2 });
    expect(s.sides).toMatchObject([
      { kind: 'map', project: 'a' },
      { kind: 'file', project: 'a' },
    ]);
    expect(store.of('a').tabs).toMatchObject([{ file: 'f', place: { page: 2, at: 0 } }]);
  });

  it('read a file side kept before it had tabs as one of no project, with its file at its page', () => {
    const { s } = withSources();
    s.arrange(
      { sides: [{ kind: 'file', file: 'f', page: 7, zoom: 1.25 } as never], focused: 0 },
      { view: 'file', file: 'f' },
    );
    expect(s.active).toMatchObject({ kind: 'file', project: null });
    expect(s.activeTab(s.active!.key)).toMatchObject({
      file: 'f',
      place: { page: 7, at: 0 },
      zoom: 1.25,
    });
    expect(s.tabs(s.active!.key).tabs).toHaveLength(1);
  });

  it('close the sides of a project that is gone, its file side too, and forget its sources', () => {
    const { s, store } = withSources();
    s.open('a', 'x');
    s.showFile('f');
    s.closeProject('a');
    expect(s.sides).toEqual([]);
    expect(store.forgotten).toEqual(['a']);
    expect(s.lastProject).toBe(null);
  });
});
