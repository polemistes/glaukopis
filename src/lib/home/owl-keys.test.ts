import { describe, expect, it } from 'vitest';
import type { Folder, ProjectInfo } from '$lib/api/projects';
import { layout, type Layout } from '$lib/project/diagram/layout';
import type { NodeRecord } from '$lib/project/model/types';
import { folderKey, OWL, owlTree, projectKey } from './owl';
import { pressed, type OwlSurface } from './owl-keys';

const project = (id: string, name: string, folder?: string): ProjectInfo => ({
  id,
  name,
  description: '',
  created: '',
  modified: '',
  maps: [],
  words: 0,
  references: 0,
  folder,
});
const folder = (id: string, name: string, parent?: string): Folder => ({
  id,
  name,
  parent,
  order: '',
});

/** An owl map that writes down what it is asked to do. */
function surface(selection: string[], at?: string) {
  const folders = [folder('g', 'Greek'), folder('l', 'Latin')];
  const projects = [project('1', 'Iliad', 'g'), project('2', 'Notes')];
  const { tree, nodes } = owlTree(folders, projects, new Map(), { at });
  const lay: Layout = layout(tree, nodes as unknown as ReadonlyMap<string, NodeRecord>, new Map());
  const calls: string[] = [];
  const log =
    (name: string) =>
    (...args: unknown[]) =>
      calls.push([name, ...args.map((a) => JSON.stringify(a))].join(' '));
  const owl: OwlSurface = {
    tree,
    lay,
    selection,
    select: (keys) => {
      owl.selection.splice(0, owl.selection.length, ...keys);
      log('select')(keys);
    },
    open: log('open'),
    up: log('up'),
    rename: log('rename'),
    make: log('make'),
    deeper: log('deeper'),
    shallower: log('shallower'),
    fold: log('fold'),
    remove: log('remove'),
    menu: log('menu'),
    fit: log('fit'),
    zoomBy: log('zoomBy'),
    bringIntoView: () => {},
    undo: log('undo'),
    redo: log('redo'),
  };
  return { owl, calls, lay };
}

const key = (k: string, mods: Partial<KeyboardEventInit> = {}) =>
  new KeyboardEvent('keydown', { key: k, ...mods });

describe('the keys of the owl map', () => {
  it('make a project with Enter and Ctrl+Enter, a folder with Tab and Ctrl+Shift+Enter', () => {
    const { owl, calls } = surface([OWL]);
    pressed(key('Enter'), owl);
    pressed(key('Enter', { ctrlKey: true }), owl);
    pressed(key('Tab'), owl);
    pressed(key('Enter', { ctrlKey: true, shiftKey: true }), owl);
    expect(calls).toEqual(['make "project"', 'make "project"', 'make "folder"', 'make "folder"']);
  });

  it('rename with F2, or begin a new name with a letter', () => {
    const { owl, calls } = surface([projectKey('1')]);
    pressed(key('F2'), owl);
    pressed(key('a'), owl);
    expect(calls).toEqual([`rename "${projectKey('1')}"`, `rename "${projectKey('1')}" "a"`]);
    // The owl has no name to give.
    const owlOnly = surface([OWL]);
    expect(pressed(key('F2'), owlOnly.owl)).toBe(true);
    expect(pressed(key('a'), owlOnly.owl)).toBe(false);
    expect(owlOnly.calls).toEqual([]);
  });

  it('go about with the arrows, from the centre where nothing is selected', () => {
    const { owl, calls } = surface([]);
    pressed(key('ArrowRight'), owl);
    expect(calls).toEqual([`select ${JSON.stringify([OWL])}`]);
    pressed(key('ArrowRight'), owl);
    pressed(key('ArrowLeft'), owl);
    expect(owl.selection.length).toBe(1);
    expect(owl.selection[0]).not.toBe(undefined);
    const before = owl.selection[0];
    pressed(key('ArrowDown', { shiftKey: true }), owl);
    expect(owl.selection[0]).toBe(before);
  });

  it('put deeper and less deep as the arrow points on its side of the map', () => {
    const { owl, calls, lay } = surface([projectKey('2')]);
    const side = lay.placed.get(projectKey('2'))?.side;
    const outwards = side === 'left' ? 'ArrowLeft' : 'ArrowRight';
    const inwards = side === 'left' ? 'ArrowRight' : 'ArrowLeft';
    pressed(key(outwards, { altKey: true }), owl);
    pressed(key(inwards, { altKey: true }), owl);
    pressed(key('ArrowUp', { altKey: true }), owl);
    expect(calls).toEqual([
      `deeper ${JSON.stringify([projectKey('2')])}`,
      `shallower ${JSON.stringify([projectKey('2')])}`,
    ]);
  });

  it('open, enter and go up with Alt+Shift and the arrows', () => {
    const { owl, calls } = surface([folderKey('g')]);
    pressed(key('ArrowDown', { altKey: true, shiftKey: true }), owl);
    pressed(key('ArrowUp', { altKey: true, shiftKey: true }), owl);
    expect(calls).toEqual([`open "${folderKey('g')}"`, 'up']);
  });

  it('fold a folder with Space, delete with Delete, clear with Escape', () => {
    const { owl, calls } = surface([folderKey('g')]);
    pressed(key(' '), owl);
    pressed(key('Delete'), owl);
    pressed(key('Escape'), owl);
    expect(calls).toEqual([
      `fold "${folderKey('g')}"`,
      `remove ${JSON.stringify([folderKey('g')])}`,
      'select []',
    ]);
    // Escape with nothing selected is not the map's.
    expect(pressed(key('Escape'), owl)).toBe(false);
  });

  it('do not move or delete the folder at the centre', () => {
    const { owl, calls } = surface([folderKey('g')], folderKey('g'));
    pressed(key('Delete'), owl);
    pressed(key(' '), owl);
    pressed(key('F2'), owl);
    expect(calls).toEqual([`rename "${folderKey('g')}"`]);
  });

  it('select all but the centre, undo and redo, open the menu, and zoom', () => {
    const { owl, calls } = surface([]);
    pressed(key('a', { ctrlKey: true }), owl);
    expect(owl.selection).not.toContain(OWL);
    expect(owl.selection).toContain(projectKey('2'));
    pressed(key('z', { ctrlKey: true }), owl);
    pressed(key('z', { ctrlKey: true, shiftKey: true }), owl);
    pressed(key('y', { ctrlKey: true }), owl);
    pressed(key('F10', { shiftKey: true }), owl);
    pressed(key('0', { ctrlKey: true }), owl);
    expect(calls.slice(1)).toEqual(['undo', 'redo', 'redo', `menu "${projectKey('2')}"`, 'fit']);
  });

  it('leave the keys that are not theirs', () => {
    const { owl } = surface([]);
    expect(pressed(key('q', { ctrlKey: true }), owl)).toBe(false);
    expect(pressed(key('Tab', { shiftKey: true }), owl)).toBe(false);
  });
});
