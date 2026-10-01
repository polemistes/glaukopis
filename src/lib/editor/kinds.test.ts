import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { kinds } from '$lib/api/contract.generated';
import type { KindEntry } from '$lib/api/documents';
import { Project } from '$lib/project/model/project.svelte';
import { beginsIn, fillBody } from '$lib/project/model/text';
import type { PassageKindRecord } from '$lib/project/model/types';
import { CATALOGUE, GROUPS, inHand, nextOf, passageKindsCss, points, specOf, tabOf } from './kinds';

describe('the catalogue', () => {
  it('is the same as the core has it: the ids, families and groups, in the same order', () => {
    const core = kinds as KindEntry[] | undefined;
    expect(core, 'the contract has no kinds yet').toBeDefined();
    const theirs = (core ?? []).map((k) => [k.id, k.family, k.group, k.basedOn ?? undefined]);
    const ours = CATALOGUE.map((k) => [k.id, k.family, k.group, k.basedOn]);
    expect(ours).toEqual(theirs);
  });

  it('has every kind in a group that is listed, and names it', () => {
    const groups = GROUPS.map((g) => g.id);
    for (const kind of CATALOGUE) {
      expect(groups, kind.id).toContain(kind.group);
      expect(kind.label(), kind.id).not.toMatch(/^editor-/);
      expect(kind.hint(), kind.id).not.toMatch(/^editor-/);
    }
    expect(specOf('epigraph')?.structure).toBe('passage');
    expect(specOf('scene')?.structure).toBe('script');
    expect(specOf('foreign')?.structure).toBe('mark');
    expect(specOf('no such kind')).toBeUndefined();
  });

  it('agrees with the text model on what a text begins in', () => {
    for (const kind of CATALOGUE) {
      const expected =
        kind.structure === 'verse' || kind.structure === 'script' || kind.structure === 'passage'
          ? kind.structure
          : 'text';
      expect(beginsIn(kind.id), kind.id).toBe(expected);
    }
    expect(beginsIn('k1')).toBe('passage');
    expect(beginsIn('')).toBe('text');
  });

  it('says what Enter and Tab make after each kind, and a kind of the writer`s own does as its base', () => {
    expect(nextOf('text')).toBe('text');
    expect(nextOf('epigraph')).toBe('attribution');
    expect(nextOf('attribution')).toBe('text');
    expect(nextOf('character')).toBe('dialogue');
    expect(nextOf('code')).toBe('code');
    expect(tabOf('text')).toBeUndefined();
    expect(tabOf('headword')).toBe('gloss');
    expect(tabOf('action')).toBe('character');
    const own = [
      { id: 'k1', basedOn: 'epigraph' },
      { id: 'k2', basedOn: 'code' },
      { id: 'k3', basedOn: 'k2' },
      { id: 'k4', basedOn: 'gone' },
      { id: 'a', basedOn: 'b' },
      { id: 'b', basedOn: 'a' },
    ];
    expect(nextOf('k1', own)).toBe('attribution');
    // A kind that is followed by itself: the writer's own kind is followed by itself.
    expect(nextOf('k2', own)).toBe('k2');
    expect(nextOf('k3', own)).toBe('k3');
    expect(nextOf('k4', own)).toBe('text');
    expect(nextOf('a', own)).toBe('text');
    expect(tabOf('k1', own)).toBeUndefined();
    expect(nextOf('nothing', own)).toBe('text');
  });
});

describe('the kinds in hand', () => {
  it('are the plain kinds, what the map uses, what is pinned and suggested, less what is unpinned', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const root = p.map(map)!.root;
    const a = p.addChild(root, { title: 'A' })!;
    const own = p.createPassageKind({
      name: 'Letter',
      family: 'paragraph',
      basedOn: 'text',
      look: {},
    })!;
    p.transact(() => {
      fillBody(p.fragment(a, 'body')!, 'Dear reader', own);
      const b = new Y.XmlElement('script');
      b.setAttribute('part', 'scene');
      p.fragment(a, 'body')!.insert(0, [b]);
    });
    // Another map's uses are its own.
    const other = p.createMap('Other');
    const o = p.addChild(p.map(other)!.root, { title: 'O' })!;
    p.transact(() => fillBody(p.fragment(o, 'body')!, 'Chorus', 'verse'));

    expect(inHand(p, map)).toEqual(['text', 'quote', 'list', 'numbered', 'scene', own]);
    expect(inHand(p, other)).toEqual(['text', 'quote', 'list', 'numbered', 'verse']);
    expect(inHand(p, map, ['action', 'scene', 'character'])).toEqual([
      'text',
      'quote',
      'list',
      'numbered',
      'scene',
      'action',
      'character',
      own,
    ]);
    p.setHand(map, { pinned: ['epigraph', 'headword'], unpinned: ['scene', 'quote'] });
    expect(inHand(p, map, ['action'])).toEqual([
      'text',
      'list',
      'numbered',
      'epigraph',
      'action',
      'headword',
      own,
    ]);
    // Text cannot be unpinned; what is not known is not in hand; and what
    // was unpinned before is in hand again, the scene among it.
    p.setHand(map, { pinned: ['gone'], unpinned: ['text'] });
    expect(inHand(p, map)).toEqual(['text', 'quote', 'list', 'numbered', 'scene', own]);
  });
});

describe('the look on screen of a kind of the writer`s own', () => {
  const kind = (id: string, more: Partial<PassageKindRecord>): PassageKindRecord => ({
    id,
    name: id,
    family: 'paragraph',
    basedOn: 'text',
    look: {},
    order: 'a0',
    ...more,
  });

  it('reads lengths as they are written', () => {
    expect(points('12pt')).toBe(12);
    expect(points('1in')).toBe(72);
    expect(points('2.54cm')).toBeCloseTo(72);
    expect(points('25.4mm')).toBeCloseTo(72);
    expect(points('1,5 cm')).toBeCloseTo(42.52, 1);
    expect(points(6)).toBe(6);
    expect(points('wide')).toBeNull();
    expect(points(undefined)).toBeNull();
  });

  it('a kind based on an epigraph, in italics, is indented and italic', () => {
    const css = passageKindsCss([kind('k1', { basedOn: 'epigraph', look: { italic: true } })]);
    expect(css).toContain('.prose .passage[data-kind="k1"] {');
    expect(css).toContain('margin-left: 9.6em;');
    expect(css).toContain('font-style: italic;');
    // From the quotation an epigraph is based on, and from the epigraph itself.
    expect(css).toContain('margin-top: 0.51em;');
    expect(css).toContain('margin-bottom: 1.52em;');
    expect(css).not.toContain('text-align');
  });

  it('a kind takes the look of another of the writer`s own, and its own over it', () => {
    const css = passageKindsCss([
      kind('k1', { basedOn: 'epigraph', look: { italic: true, align: 'center' } }),
      kind('k2', { basedOn: 'k1', look: { italic: false, size: 10, spaceAfter: '0pt' } }),
    ]);
    const k2 = css.split('\n').find((line) => line.includes('"k2"'))!;
    expect(k2).toContain('text-align: center;');
    expect(k2).toContain('margin-left: 9.6em;');
    expect(k2).toContain('margin-bottom: 0em;');
    expect(k2).toContain('font-style: normal;');
    expect(k2).toContain('font-size: 0.83em;');
  });

  it('a kind of words is set as words are, with the quotation marks of a mention', () => {
    const css = passageKindsCss([
      kind('w1', { family: 'words', basedOn: 'foreign', look: { bold: true, indentLeft: '2cm' } }),
      kind('w2', { family: 'words', basedOn: 'mention', look: {} }),
      kind('w3', { family: 'words', basedOn: 'highlight', look: { underline: true } }),
    ]);
    expect(css).toContain('.prose .kind[data-kind="w1"] { font-weight: 600; font-style: italic; }');
    expect(css).not.toContain('margin-left');
    expect(css).toContain(
      '.prose .kind[data-kind="w2"]:lang(nb), .prose .kind[data-kind="w2"]:lang(nn)',
    );
    expect(css).toContain('.prose .kind[data-kind="w2"]::before { content: open-quote; }');
    expect(css).toContain(
      '.prose .kind[data-kind="w3"] { text-decoration: underline; background: var(--highlight);',
    );
  });

  it('a break of the writer`s own draws its sign, a draft note is dimmed, and a circle ends', () => {
    const css = passageKindsCss([
      kind('b1', { basedOn: 'break', look: { text: '#' } }),
      kind('d1', { basedOn: 'draft', look: {} }),
      kind('c1', { basedOn: 'c2', look: {} }),
      kind('c2', { basedOn: 'c1', look: { bold: true } }),
      kind('bad id', { basedOn: 'text', look: { bold: true } }),
    ]);
    expect(css).toContain('.prose .passage[data-kind="b1"]:empty::before { content: "#";');
    expect(css).toContain('.prose .passage[data-kind="b1"] { text-align: center;');
    expect(css).toContain(
      '.prose .passage[data-kind="d1"] { color: var(--ink-3); border-left: 2px dashed',
    );
    expect(css).toContain('.prose .passage[data-kind="c1"] { font-weight: 600; }');
    expect(css).not.toContain('bad id');
  });
});
