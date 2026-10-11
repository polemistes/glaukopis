import { describe, expect, it } from 'vitest';
import * as contract from '$lib/api/contract.generated';
import type { PartKindEntry } from '$lib/api/templates';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';
import {
  PART_GROUPS,
  PARTS,
  isCatalogueKind,
  isDoubled,
  kindLabel,
  partOf,
  partSpec,
  partsAmong,
  placeOf,
} from './parts';

function project(): Project {
  const p = new Project(null);
  p.begin('Wrath');
  return p;
}

describe('the catalogue of the kinds that make a document', () => {
  it('is the same as the core has it: the ids, groups, bases, places, and one or many', () => {
    // The core's catalogue reaches the contract when its test is run; until
    // then there is nothing to compare with.
    const core = (contract as Record<string, unknown>).partKinds as PartKindEntry[] | undefined;
    if (!core) {
      console.warn('parts: the contract has no partKinds yet; the catalogue is not compared');
      return;
    }
    const theirs = core
      .map((k) => [k.id, k.group, k.basedOn, k.place, k.one])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    const ours = PARTS.map((k) => [k.id, k.group, k.basedOn, k.place, k.one]).sort((a, b) =>
      String(a[0]).localeCompare(String(b[0])),
    );
    expect(ours).toEqual(theirs);
  });

  it('has every kind in a group that is listed, based on a kind that is there, and names it', () => {
    const groups = PART_GROUPS.map((g) => g.id);
    for (const kind of PARTS) {
      expect(groups, kind.id).toContain(kind.group);
      expect(kind.label(), kind.id).not.toMatch(/^parts-/);
      if (kind.basedOn) {
        const base = partSpec(kind.basedOn)!;
        expect(base, kind.id).toBeDefined();
        expect(base.basedOn, kind.id).toBeNull();
        expect(base.group, kind.id).toBe(kind.group);
        expect(base.place, kind.id).toBe(kind.place);
      }
    }
    for (const group of PART_GROUPS) expect(group.label()).not.toMatch(/^parts-/);
    expect(isCatalogueKind('abstract')).toBe(true);
    expect(isCatalogueKind('project')).toBe(false);
    expect(isCatalogueKind(null)).toBe(false);
    expect(partsAmong(['appendix', 'nobody', 'abstract']).map((p) => p.id)).toEqual([
      'abstract',
      'appendix',
    ]);
  });

  it('says what a kind is in the document: itself, its base, or nothing', () => {
    const p = project();
    const note = p.createKind({ name: "Author's note", colour: 'teal', template: '' })!;
    p.updateKind(note, { basedOn: 'front-section' });
    const character = p.createKind({ name: 'Character', colour: 'rose', template: '' })!;
    expect(partOf(p, 'abstract')?.id).toBe('abstract');
    expect(partOf(p, note)?.id).toBe('front-section');
    expect(partOf(p, character)).toBeNull();
    expect(partOf(p, null)).toBeNull();
    expect(partOf(p, 'nobody')).toBeNull();
    expect(placeOf(p, 'appendix')).toBe('back');
    expect(placeOf(p, note)).toBe('front');
    expect(placeOf(p, character)).toBeNull();
    // A kind based on a kind that is not of the catalogue is nothing in the document.
    p.updateKind(note, { basedOn: 'nobody' });
    expect(partOf(p, note)).toBeNull();
  });

  it('labels a kind of the project in its colour, and a kind of the catalogue plainly', () => {
    const p = project();
    const character = p.createKind({ name: 'Character', colour: 'rose', template: '' })!;
    expect(kindLabel(p, character)).toEqual({ name: 'Character', colour: 'rose', part: false });
    expect(kindLabel(p, 'abstract')).toEqual({ name: 'Abstract', colour: 'part', part: true });
    expect(kindLabel(p, 'nobody')).toBeNull();
    expect(kindLabel(p, null)).toBeNull();
  });

  it('marks the second of a kind a document has one of, among siblings', () => {
    const p = project();
    const first = p.addChild(PROJECT, { title: 'Abstract' })!;
    const second = p.addChild(PROJECT, { title: 'Abstract again' })!;
    const appendixA = p.addChild(PROJECT, { title: 'A' })!;
    const appendixB = p.addChild(PROJECT, { title: 'B' })!;
    const elsewhere = p.addChild(appendixA, { title: 'Abstract of A' })!;
    p.setKind([first, second, elsewhere], 'abstract');
    p.setKind([appendixA, appendixB], 'appendix');
    expect(isDoubled(p, first)).toBe(false);
    expect(isDoubled(p, second)).toBe(true);
    expect(isDoubled(p, elsewhere)).toBe(false);
    expect(isDoubled(p, appendixB)).toBe(false);
    // Moved before the first, it is the one that is printed.
    p.move([second], PROJECT, 0);
    expect(isDoubled(p, second)).toBe(false);
    expect(isDoubled(p, first)).toBe(true);
  });
});
