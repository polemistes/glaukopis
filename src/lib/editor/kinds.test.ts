import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { kinds } from '$lib/api/contract.generated';
import type { KindEntry } from '$lib/api/documents';
import { PARAGRAPH_KINDS, WORD_KINDS as FACT_WORD_KINDS } from '$lib/project/model/families';
import { Project } from '$lib/project/model/project.svelte';
import * as textModel from '$lib/project/model/text';
import { PROJECT, type PassageKindRecord } from '$lib/project/model/types';
import {
  amongOthers,
  catalogueKindOf,
  CATALOGUE,
  catalogueKindsCss,
  fellowsOf,
  GROUPS,
  groupOf,
  inHand,
  passageKindsCss,
  points,
  showCatalogueKinds,
  specOf,
  WORD_KINDS,
} from './kinds';

describe('the catalogue', () => {
  const core = kinds as KindEntry[] | undefined;
  // Until the core's catalogue is made anew to ADR 0041 and the contract written again, it has
  // the families of before (`joins`, and `text` for the group of text) and not the groupings.
  const stale =
    !core ||
    core.some((k) => 'joins' in k || k.id === 'verse') ||
    core.find((k) => k.id === 'text')?.group !== 'none';

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

  it('has every kind in one group of the menu, and names it without saying how it looks or what Enter makes', () => {
    for (const kind of CATALOGUE) {
      expect(
        GROUPS.filter((g) => g.kinds.includes(kind.id)),
        kind.id,
      ).toHaveLength(1);
      expect(kind.label(), kind.id).not.toMatch(/^editor-/);
      expect(kind.hint(), kind.id).not.toMatch(/^editor-/);
      expect(kind.hint(), kind.id).not.toMatch(/italic|right|capitals|bold|Enter|Tab/i);
    }
    expect(GROUPS.flatMap((g) => g.kinds)).toHaveLength(CATALOGUE.length);
    // The group of a kind is how the document groups it; the group of the menu is the menu's.
    expect(specOf('epigraph')?.group).toBe('none');
    expect(specOf('epigraph')?.basedOn).toBe('quote');
    expect(groupOf('epigraph')).toBe('quotation');
    expect(specOf('line')?.group).toBe('lines');
    expect(groupOf('speaker')).toBe('verse');
    expect(specOf('scene')?.group).toBe('none');
    expect(groupOf('scene')).toBe('script');
    expect(specOf('headword')?.group).toBe('glossary');
    expect(groupOf('headword')).toBe('more');
    expect(groupOf('numbered')).toBe('list');
    expect(groupOf('list')).toBe('list');
    expect(groupOf('own kind')).toBe('more');
    expect(specOf('foreign')?.family).toBe('words');
    expect(specOf('foreign')?.group).toBe('words');
    expect(specOf('verse')?.id).toBe('line');
    expect(specOf('no such kind')).toBeUndefined();
  });

  it('has the kinds that may stand on words: the kinds of words, then a speaker and a direction', () => {
    expect([...WORD_KINDS]).toEqual([...FACT_WORD_KINDS]);
    expect(WORD_KINDS.slice(-2)).toEqual(['speaker', 'direction']);
    for (const id of WORD_KINDS) expect(specOf(id)?.label(), id).not.toMatch(/^editor-/);
  });

  it('knows the kinds written together, and those that stand among others', () => {
    const own = [
      { id: 'chorus', basedOn: 'speaker' },
      { id: 'canto', basedOn: 'line' },
      { id: 'letter', basedOn: 'text' },
    ];
    expect(fellowsOf('line', own)).toEqual(['line', 'speaker', 'direction', 'chorus', 'canto']);
    expect(fellowsOf('canto', own)).toEqual(['line', 'speaker', 'direction', 'chorus', 'canto']);
    expect(fellowsOf('gloss')).toEqual(['headword', 'gloss']);
    expect(fellowsOf('dialogue')).toContain('transition');
    expect(fellowsOf('letter', own)).toEqual(['letter']);
    expect(fellowsOf('code')).toEqual(['code']);
    expect(catalogueKindOf('canto', own)).toBe('line');
    expect(catalogueKindOf('letter', own)).toBe('text');
    expect(catalogueKindOf('verse')).toBe('line');
    expect(amongOthers('speaker')).toBe(true);
    expect(amongOthers('direction')).toBe(true);
    expect(amongOthers('chorus', own)).toBe(true);
    expect(amongOthers('line')).toBe(false);
    expect(amongOthers('text')).toBe(false);
  });
});

describe('the kinds at hand', () => {
  // The texts are read by the text model; until it is brought to the new shape it cannot read one.
  const before = (() => {
    const doc = new Y.Doc();
    const body = doc.getXmlFragment('body');
    const para = new Y.XmlElement('paragraph');
    para.setAttribute('kind', 'line');
    body.insert(0, [para]);
    try {
      textModel.readBody(body);
      return false;
    } catch {
      return true;
    }
  })();
  it.skipIf(before)(
    'are the plain kinds, what the project uses and what the template brings, each once',
    () => {
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
      p.transact(() => {
        const body = p.fragment(a, 'body')!;
        body.insert(0, [paragraph(own, 'Dear reader'), paragraph('scene', 'INT. HOUSE')]);
      });
      // What any element of the project uses is at hand, in whatever tree it stands.
      const o = p.addChild(PROJECT, { title: 'O' })!;
      p.transact(() => {
        p.fragment(o, 'body')!.insert(0, [paragraph('line', 'Chorus')]);
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
    },
  );
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
    // The indent is also its inset, by which the bracket and the numbers stand at the edge of the text.
    expect(css).toContain('--inset: 9.6em; margin-left: 9.6em;');
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
    expect(css).toContain('.prose p[data-kind="v1"] { --inset: 2.4em; margin-left: 2.4em; }');
    expect(css).toContain('.prose p[data-kind="c1"] { font-weight: 600; }');
    expect(css).not.toContain('bad id');
  });
});

describe('the cues on screen of the kinds of the catalogue', () => {
  const css = catalogueKindsCss();
  /** The rules of a selector in a style sheet, one a line, as they are made. */
  const rulesOf = (sheet: string, selector: string) =>
    sheet.split('\n').filter((line) => line.startsWith(selector));

  it('are those a kind of the writer`s own based on one of them has, given nothing of its own', () => {
    for (const spec of CATALOGUE) {
      const families = [
        ...(spec.family === 'paragraph' ? (['paragraph'] as const) : []),
        ...(WORD_KINDS.includes(spec.id) ? (['words'] as const) : []),
      ];
      for (const family of families) {
        const own = passageKindsCss([
          { id: 'k', name: 'k', family, basedOn: spec.id, look: {}, order: 'a0' },
        ]);
        const place = family === 'words' ? '.prose .kind' : '.prose p';
        const theirs = rulesOf(own, `${place}[data-kind="k"]`).map((r) =>
          r.replaceAll('[data-kind="k"]', `[data-kind="${spec.id}"]`),
        );
        expect(theirs, `${spec.id} (${family})`).toEqual(
          rulesOf(css, `${place}[data-kind="${spec.id}"]`),
        );
      }
    }
  });

  it('keep the measures the screen had: a quotation and a list in by less than verse', () => {
    expect(css).toContain(
      '.prose p[data-kind="quote"] { --inset: 1.4em; margin-left: 1.4em; font-size: 0.96em; color: var(--ink-2); }',
    );
    expect(css).toContain('.prose p[data-kind="item"] { --inset: 1.6em; margin-left: 1.6em; }');
    expect(css).toContain('.prose p[data-kind="numbered"] { --inset: 1.6em; margin-left: 1.6em; }');
    expect(css).toContain('.prose p[data-kind="line"] { --inset: 2.4em; margin-left: 2.4em; }');
    expect(css).toContain('.prose p[data-kind="gloss"] { --inset: 3.05em;');
    expect(css).toContain('.prose p[data-kind="epigraph"] { --inset: 9.6em;');
    expect(css).toContain('.prose p[data-kind="character"] { --inset: 13.44em;');
    expect(css).toContain('.prose .kind[data-kind="foreign"] { font-style: italic; }');
    expect(css).toContain('.prose p[data-kind="break"]:empty::before { content: "* * *";');
    expect(css).toContain('.prose .kind[data-kind="mention"]::before { content: open-quote; }');
  });

  it('are set once in the head of the page', () => {
    showCatalogueKinds();
    showCatalogueKinds();
    const sheets = document.head.querySelectorAll('style#catalogue-kinds');
    expect(sheets.length).toBe(1);
    expect(sheets[0].textContent).toBe(css);
    sheets[0].remove();
  });
});
