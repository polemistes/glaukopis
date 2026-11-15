import { describe, expect, it } from 'vitest';
import { holderOf } from './holder';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';

/** A project begun, with one element under its own. */
function project() {
  const p = new Project(null);
  p.begin('Wrath');
  const child = p.addChild(PROJECT)!;
  return { p, child };
}

describe('a project as the holder of its texts', () => {
  it('is one holder for a project, whenever it is asked for', () => {
    const { p } = project();
    expect(holderOf(p)).toBe(holderOf(p));
    expect(holderOf(new Project(null))).not.toBe(holderOf(p));
  });

  it('has the history and the presence of the project', () => {
    const { p } = project();
    const holder = holderOf(p);
    expect(holder.undoManager).toBe(p.undoManager);
    expect(holder.awareness).toBe(p.awareness);
    p.setName('Rage');
    expect(p.name).toBe('Rage');
    holder.undo();
    expect(p.name).toBe('Wrath');
    holder.redo();
    expect(p.name).toBe('Rage');
  });

  it('knows which elements are there, and whose text a piece of the document is', () => {
    const { p, child } = project();
    const holder = holderOf(p);
    expect(holder.has(child)).toBe(true);
    expect(holder.has('nothing')).toBe(false);
    expect(holder.has(null)).toBe(false);
    expect(holder.ownerOf(p.fragment(child, 'body')!)).toBe(child);
    expect(holder.ownerOf(p.fragment(child, 'title')!)).toBe(child);
    // The top of the tree under the project an element stands in: itself, for one right under the project.
    const deeper = p.addChild(child)!;
    expect(holder.topOf(deeper)).toBe(child);
    expect(holder.topOf(child)).toBe(child);
    expect(holder.topOf(PROJECT)).toBe(PROJECT);
  });

  it('says the language of the document of an element, and nothing where there is no element', () => {
    const { p, child } = project();
    const holder = holderOf(p);
    p.setLanguage('nb');
    expect(holder.languageOf(child)).toBe('nb');
    expect(holder.languageOf(PROJECT)).toBe('nb');
    expect(holder.languageOf(null)).toBeNull();
    expect(holder.languageOf('nothing')).toBeNull();
  });

  it('gives text for the digit 0 where the type of the document is not known', () => {
    const { p } = project();
    expect(holderOf(p).kindKeysOf(null)).toEqual({ '0': 'text' });
    expect(holderOf(p).kindKeysOf('nothing')).toEqual({ '0': 'text' });
  });

  it('keeps the words spelling passes over, the kinds and the works of the project', () => {
    const { p } = project();
    const holder = holderOf(p);
    holder.ignoreWord?.('Peleus');
    expect(holder.ignored.has('Peleus')).toBe(true);
    expect(holder.ignored).toBe(p.ignored);
    expect(holder.passageKinds).toBe(p.passageKinds);
    expect(holder.refs).toBe(p.refs);
    expect(holder.threadsOf(PROJECT)).toEqual([]);
  });
});
