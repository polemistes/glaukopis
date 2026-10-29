import { describe, expect, it } from 'vitest';
import {
  activeTab,
  activated,
  emptySources,
  merged,
  moved,
  placed,
  readSources,
  replaced,
  stepped,
  without,
  withoutOthers,
  withFile,
  zoomed,
} from './sources';

const three = () => {
  let s = emptySources();
  for (const f of ['a', 'b', 'c']) s = withFile(s, f).sources;
  return s;
};
const files = (s: ReturnType<typeof emptySources>) => s.tabs.map((t) => t.file).join('');

describe('the sources of a project', () => {
  it('go to the tab of a file shown again, and make a second only when asked', () => {
    let s = withFile(emptySources(), 'a', { page: 3, at: 0.5 }).sources;
    const first = s.active;
    expect(activeTab(s)?.place).toEqual({ page: 3, at: 0.5 });
    s = withFile(s, 'b').sources;
    s = withFile(s, 'a').sources;
    expect(s.tabs).toHaveLength(2);
    expect(s.active).toBe(first);
    const again = withFile(s, 'a', { page: 9, at: 0 }, true);
    expect(again.sources.tabs).toHaveLength(3);
    expect(again.sources.active).toBe(again.id);
    expect(again.id).not.toBe(first);
  });

  it('stay in the tab shown when it is of the file shown, of two', () => {
    let s = withFile(emptySources(), 'a').sources;
    const again = withFile(s, 'a', undefined, true);
    s = withFile(again.sources, 'a').sources;
    expect(s.active).toBe(again.id);
  });

  it('put a new tab after the one shown', () => {
    let s = three();
    s = activated(s, s.tabs[0].id);
    s = withFile(s, 'd').sources;
    expect(files(s)).toBe('adbc');
  });

  it('show the tab after one closed, or the one before at the end, and none after the last', () => {
    let s = three();
    const [a, b, c] = s.tabs.map((t) => t.id);
    s = activated(s, b);
    s = without(s, b);
    expect(s.active).toBe(c);
    s = without(s, c);
    expect(s.active).toBe(a);
    s = without(s, a);
    expect(s).toEqual({ tabs: [], active: null });
  });

  it('close the other tabs, move one, and step round them', () => {
    const s = three();
    const [a, , c] = s.tabs.map((t) => t.id);
    expect(withoutOthers(s, a)).toEqual({ tabs: [s.tabs[0]], active: a });
    expect(files(moved(s, c, 0))).toBe('cab');
    expect(files(moved(s, a, 9))).toBe('bca');
    expect(stepped(activated(s, c), 1).active).toBe(a);
    expect(stepped(activated(s, a), -1).active).toBe(c);
  });

  it('keep a place and a zoom for each tab, and leave what they were given as it was', () => {
    const s = three();
    const id = s.tabs[1].id;
    const p = placed(s, id, { page: 4, at: 0.25 });
    expect(p.tabs[1].place).toEqual({ page: 4, at: 0.25 });
    expect(s.tabs[1].place).toEqual({ page: 1, at: 0 });
    expect(zoomed(p, id, 2).tabs[1].zoom).toBe(2);
    const r = replaced(zoomed(p, id, 2), id, 'z');
    expect(r.tabs[1]).toMatchObject({ file: 'z', place: { page: 1, at: 0 }, zoom: null });
  });

  it('are read with care: what is not a tab is left out, and the active one is one of them', () => {
    expect(readSources(null)).toEqual({ tabs: [], active: null });
    expect(readSources({ tabs: 'no' })).toEqual({ tabs: [], active: null });
    const s = readSources({
      tabs: [
        { id: 't1', file: 'a', place: { page: 2, at: 0.5 }, zoom: 1.5 },
        { file: '' },
        { id: 't2', file: 'b', place: { page: -1, at: 9 }, zoom: 'big' },
      ],
      active: 'gone',
    });
    expect(s.tabs).toEqual([
      { id: 't1', file: 'a', place: { page: 2, at: 0.5 }, zoom: 1.5 },
      { id: 't2', file: 'b', place: { page: 1, at: 1 }, zoom: null },
    ]);
    expect(s.active).toBe('t1');
  });

  it('take the tabs of a side of no project, each at its place, a file once', () => {
    let project = withFile(emptySources(), 'a').sources;
    let own = withFile(emptySources(), 'a', { page: 5, at: 0 }).sources;
    own = withFile(own, 'b', { page: 7, at: 0.5 }).sources;
    const m = merged(project, own);
    expect(files(m)).toBe('ab');
    expect(m.tabs[1].place).toEqual({ page: 7, at: 0.5 });
    expect(activeTab(m)?.file).toBe('b');
    project = emptySources();
    expect(merged(project, emptySources())).toEqual({ tabs: [], active: null });
  });
});
