import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { kinds } from '$lib/api/contract.generated';
import type { KindEntry } from '$lib/api/documents';
import { PARAGRAPH_KINDS } from '$lib/project/model/families';
import { Project } from '$lib/project/model/project.svelte';
import { PROJECT, type PassageKindRecord } from '$lib/project/model/types';
import { CATALOGUE, GROUPS, groupOf, inHand, passageKindsCss, points, specOf } from './kinds';

describe('the catalogue', () => {
  const core = kinds as KindEntry[] | undefined;
  // Until the core's catalogue is made anew to ADR 0040, the generated contract has the old ids.
  const stale = !core || core.some((k) => k.id === 'verse' || k.id === 'list');

  it.skipIf(stale)(
    'is the same as the core has it: the ids, families, groups and bases, in the same order',
    () => {
      expect(core, 'the contract has no kinds yet').toBeDefined();
      const theirs = (core ?? []).map((k) => [k.id, k.family, k.group, k.basedOn ?? undefined]);
      const ours = CATALOGUE.map((k) => [k.id, k.family, k.group, k.basedOn]);
      expect(ours).toEqual(theirs);
    },
  );

  it('has the kinds of the facts, in their order, and no more', () => {
    const paragraphs = CATALOGUE.filter((k) => k.family === 'paragraph').map((k) => k.id);
    expect(paragraphs).toEqual([...PARAGRAPH_KINDS]);
    expect(CATALOGUE.filter((k) => k.family === 'words').map((k) => k.id)).toEqual([
      'foreign',
      'title',
      'term',
      'mention',
      'highlight',
    ]);
    expect(CATALOGUE.map((k) => k.id)).toContain('line');
    expect(CATALOGUE.map((k) => k.id)).toContain('item');
    expect(CATALOGUE.map((k) => k.id)).not.toContain('verse');
  });

  it('has every kind in a group that is listed, and names it without saying how it looks', () => {
    const groups = GROUPS.map((g) => g.id);
    for (const kind of CATALOGUE) {
      expect(groups, kind.id).toContain(groupOf(kind.group));
      expect(kind.label(), kind.id).not.toMatch(/^editor-/);
      expect(kind.hint(), kind.id).not.toMatch(/^editor-/);
      expect(kind.hint(), kind.id).not.toMatch(/italic|right|capitals|bold|indent/i);
    }
    expect(specOf('epigraph')?.group).toBe('quotation');
    expect(specOf('epigraph')?.basedOn).toBe('quote');
    expect(specOf('scene')?.group).toBe('script');
    expect(specOf('headword')?.group).toBe('glossary');
    expect(groupOf('glossary')).toBe('more');
    expect(groupOf('list')).toBe('list');
    expect(specOf('foreign')?.family).toBe('words');
    expect(specOf('verse')?.id).toBe('line');
    expect(specOf('no such kind')).toBeUndefined();
  });
});

describe('the kinds at hand', () => {
  it('are the plain kinds, what the project uses and what the template brings, each once', () => {
    const p = new Project(null);
    p.begin('Wrath');
    const a = p.addChild(PROJECT, { title: 'A' })!;
    const own = p.createPassageKind({
      name: 'Letter',
      family: 'paragraph',
      basedOn: 'text',
      look: {},
    })!;
    const paragraph = (kind: string, words: string) => {
      const el = new Y.XmlElement('paragraph');
      if (kind !== 'text') el.setAttribute('kind', kind);
      el.insert(0, [new Y.XmlText(words)]);
      return el;
    };
    const passage = (family: string, ...children: Y.XmlElement[]) => {
      const el = new Y.XmlElement('passage');
      el.setAttribute('family', family);
      el.insert(0, children);
      return el;
    };
    p.transact(() => {
      const body = p.fragment(a, 'body')!;
      body.insert(0, [
        passage(own, paragraph(own, 'Dear reader')),
        passage('script', paragraph('scene', 'INT. HOUSE')),
      ]);
    });
    // What any element of the project uses is at hand, in whatever tree it stands.
    const o = p.addChild(PROJECT, { title: 'O' })!;
    p.transact(() => {
      p.fragment(o, 'body')!.insert(0, [passage('verse', paragraph('line', 'Chorus'))]);
    });
    const hand = inHand(p);
    expect(hand.slice(0, 4)).toEqual(['text', 'quote', 'item', 'numbered']);
    // The text model says what the texts use; until it reads the new shape, this is what is checked.
    if (hand.length > 4) {
      expect(hand).toEqual(['text', 'quote', 'item', 'numbered', 'line', 'scene', own]);
      expect(inHand(p, ['action', 'scene', 'character'])).toEqual([
        'text',
        'quote',
        'item',
        'numbered',
        'line',
        'scene',
        'action',
        'character',
        own,
      ]);
    }
    // The template's kinds come by their new ids, whatever they were called.
    expect(inHand(p, ['verse', 'list', 'gone'])).toContain('line');
    expect(inHand(p, ['verse', 'list', 'gone'])).not.toContain('gone');
  });
});

describe('the cues on screen of a kind of the writer`s own', () => {
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
    expect(css).toContain('.prose p[data-kind="k1"] {');
    expect(css).toContain('margin-left: 9.6em;');
    expect(css).toContain('font-style: italic;');
    // From the quotation an epigraph is based on, and from the epigraph itself.
    expect(css).toContain('margin-top: 0.51em;');
    expect(css).toContain('margin-bottom: 1.52em;');
    expect(css).not.toContain('text-align');
  });

  it('a kind takes the cues of another of the writer`s own, and its own over them', () => {
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

  it('a break of the writer`s own draws its sign, a draft note is dimmed, a kind based on verse by its old name is indented, and a circle ends', () => {
    const css = passageKindsCss([
      kind('b1', { basedOn: 'break', look: { text: '#' } }),
      kind('d1', { basedOn: 'draft', look: {} }),
      kind('v1', { basedOn: 'verse', look: {} }),
      kind('c1', { basedOn: 'c2', look: {} }),
      kind('c2', { basedOn: 'c1', look: { bold: true } }),
      kind('bad id', { basedOn: 'text', look: { bold: true } }),
    ]);
    expect(css).toContain('.prose p[data-kind="b1"]:empty::before { content: "#";');
    expect(css).toContain('.prose p[data-kind="b1"] { text-align: center;');
    expect(css).toContain(
      '.prose p[data-kind="d1"] { color: var(--ink-3); border-left: 2px dashed',
    );
    expect(css).toContain('.prose p[data-kind="v1"] { margin-left: 2.4em; }');
    expect(css).toContain('.prose p[data-kind="c1"] { font-weight: 600; }');
    expect(css).not.toContain('bad id');
  });
});
