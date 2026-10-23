import { describe, expect, it } from 'vitest';
import { Project } from '../model/project.svelte';
import { PROJECT } from '../model/types';
import { layout } from './layout';
import { foldAll, pressed, type Diagram } from './keys';

/**
 * A project of A (with A1 under it), B (with B1) and C, and a diagram of it
 * that writes down what it is asked to do.
 */
function diagram(pick: (ids: Record<string, string>) => string[] = () => []) {
  const p = new Project(null);
  p.begin('Wrath');
  const a = p.addChild(PROJECT, { title: 'A' })!;
  const a1 = p.addChild(a, { title: 'A1' })!;
  const b = p.addChild(PROJECT, { title: 'B' })!;
  const b1 = p.addChild(b, { title: 'B1' })!;
  const c = p.addChild(PROJECT, { title: 'C' })!;
  const ids = { root: PROJECT, a, a1, b, b1, c };
  const names = new Map(Object.entries(ids).map(([name, id]) => [id, name]));
  const name = (id: string) => names.get(id) ?? id;
  const calls: string[] = [];
  const log =
    (what: string) =>
    (...args: unknown[]) =>
      calls.push(
        [what, ...args.map((x) => (typeof x === 'string' ? name(x) : String(x)))].join(' '),
      );
  const tree = p.tree();
  const d: Diagram = {
    project: p,
    tree,
    lay: layout(tree, p.nodes, new Map()),
    selection: pick(ids),
    linkFrom: null,
    selectedLink: null,
    actions: {},
    select: (s) => {
      d.selection.splice(0, d.selection.length, ...s);
      log('select')(...s);
    },
    add: (kind, at) => log(kind)(at),
    copy: log('copy'),
    cut: log('cut'),
    paste: log('paste'),
    open: log('open'),
    foldAll: () => {
      log('foldAll')();
      foldAll(p, tree);
    },
    enter: log('enter'),
    rename: log('rename'),
    menu: () => [],
    beginName: log('beginName'),
    fit: log('fit'),
    zoomBy: log('zoomBy'),
    bringIntoView: () => {},
    elementAt: () => null,
    openedByKey: () => {},
  };
  const folded = () =>
    Object.entries(ids)
      .filter(([, id]) => p.node(id)?.collapsed)
      .map(([n]) => n);
  return { p, d, ids, calls, folded };
}

const key = (k: string, mods: Partial<KeyboardEventInit> = {}) =>
  new KeyboardEvent('keydown', { key: k, ...mods });

describe('the keys of the diagram', () => {
  it('make a new element after the one selected with Alt+Enter, under the element in view with nothing selected', () => {
    const one = diagram(({ b }) => [b]);
    expect(pressed(key('Enter', { altKey: true }), one.d)).toBe(true);
    expect(one.calls).toEqual(['sibling b']);

    // The element in view has nothing beside it: the new element is the first under it.
    const top = diagram(({ root }) => [root]);
    pressed(key('Enter', { altKey: true }), top.d);
    expect(top.calls).toEqual(['child root']);

    const none = diagram();
    pressed(key('Enter', { altKey: true }), none.d);
    expect(none.calls).toEqual(['child root']);

    // Of several selected, none is the one.
    const many = diagram(({ a, b }) => [a, b]);
    pressed(key('Enter', { altKey: true }), many.d);
    expect(many.calls).toEqual([]);
  });

  it('make a new element under the one selected with Alt+Shift+Enter', () => {
    const one = diagram(({ c }) => [c]);
    expect(pressed(key('Enter', { altKey: true, shiftKey: true }), one.d)).toBe(true);
    expect(one.calls).toEqual(['child c']);

    const none = diagram();
    pressed(key('Enter', { altKey: true, shiftKey: true }), none.d);
    expect(none.calls).toEqual(['child root']);
  });

  it('make nothing while an association is drawn', () => {
    const { d, ids, calls } = diagram(({ b }) => [b]);
    d.linkFrom = ids.a;
    expect(pressed(key('Enter', { altKey: true }), d)).toBe(true);
    expect(pressed(key('Enter', { altKey: true, shiftKey: true }), d)).toBe(true);
    expect(calls).toEqual([]);
    expect(d.linkFrom).toBe(ids.a);
  });

  it('open the text of the element selected with Enter, and end an association with it', () => {
    const one = diagram(({ b }) => [b]);
    expect(pressed(key('Enter'), one.d)).toBe(true);
    expect(one.calls).toEqual(['open b']);

    const linking = diagram(({ b }) => [b]);
    linking.d.linkFrom = linking.ids.a;
    pressed(key('Enter'), linking.d);
    expect(linking.calls).toEqual([]);
    expect(linking.d.linkFrom).toBeNull();
    expect(linking.p.links.map((l) => [l.from, l.to])).toEqual([[linking.ids.a, linking.ids.b]]);

    // With nothing selected, Enter selects the element in view.
    const none = diagram();
    pressed(key('Enter'), none.d);
    expect(none.calls).toEqual(['select root']);
  });

  it('fold and unfold what is under the element with Tab, and keep the focus with nothing to fold', () => {
    const { d, calls, folded } = diagram(({ a }) => [a]);
    expect(pressed(key('Tab'), d)).toBe(true);
    expect(folded()).toEqual(['a']);
    expect(pressed(key('Tab'), d)).toBe(true);
    expect(folded()).toEqual([]);

    // C has nothing under it: Tab does nothing, but is taken, so that the focus stays in the diagram.
    const bare = diagram(({ c }) => [c]);
    expect(pressed(key('Tab'), bare.d)).toBe(true);
    expect(bare.folded()).toEqual([]);
    expect(bare.calls).toEqual([]);
    expect(calls).toEqual([]);
  });

  it('fold everything at the first level with Shift+Tab, and unfold all where anything is folded', () => {
    const { p, d, ids, calls, folded } = diagram();
    expect(pressed(key('Tab', { shiftKey: true }), d)).toBe(true);
    expect(calls).toEqual(['foldAll']);
    expect(folded()).toEqual(['a', 'b']);
    pressed(key('Tab', { shiftKey: true }), d);
    expect(folded()).toEqual([]);

    // One folded anywhere under the element in view is enough to unfold all.
    p.setCollapsed(ids.b, true);
    pressed(key('Tab', { shiftKey: true }), d);
    expect(folded()).toEqual([]);
  });

  it('enter the element selected with Alt+Shift+Down, and leave going up to the view', () => {
    const { d, calls } = diagram(({ b }) => [b]);
    expect(pressed(key('ArrowDown', { altKey: true, shiftKey: true }), d)).toBe(true);
    expect(calls).toEqual(['enter b']);
    expect(pressed(key('ArrowUp', { altKey: true, shiftKey: true }), d)).toBe(false);
  });

  it('move the element with Alt and the arrows', () => {
    const { p, d, ids } = diagram(({ c }) => [c]);
    expect(pressed(key('ArrowUp', { altKey: true }), d)).toBe(true);
    expect(p.tree().children.get(PROJECT)).toEqual([ids.a, ids.c, ids.b]);
  });

  it('rename with F2, and begin a new name with a letter', () => {
    const { d, calls } = diagram(({ b }) => [b]);
    pressed(key('F2'), d);
    pressed(key('x'), d);
    expect(calls).toEqual(['rename b', 'beginName b x']);
  });

  it('do nothing with Space, Ctrl+Enter or Ctrl+Shift+Enter, which once made and folded elements', () => {
    const { d, calls, folded } = diagram(({ a }) => [a]);
    expect(pressed(key(' '), d)).toBe(false);
    expect(pressed(key('Enter', { ctrlKey: true }), d)).toBe(false);
    expect(pressed(key('Enter', { ctrlKey: true, shiftKey: true }), d)).toBe(false);
    expect(calls).toEqual([]);
    expect(folded()).toEqual([]);
  });
});
