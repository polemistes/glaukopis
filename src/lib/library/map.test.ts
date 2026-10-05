import { describe, expect, it } from 'vitest';
import type { Collection, Summary } from '$lib/api/library';
import { Project } from '$lib/project/model/project.svelte';
import { readBody } from '$lib/project/model/text';
import { elementName, makeLibraryMap, planMap } from './map';

function entry(partial: Partial<Summary>): Summary {
  return {
    id: partial.key ?? 'x',
    key: 'x',
    type: 'book',
    authors: '',
    authorsSort: partial.authors?.toLowerCase() ?? '',
    year: '',
    yearNumber: null,
    title: '',
    container: '',
    publisher: '',
    attachments: 0,
    hasNote: false,
    added: '',
    modified: '',
    search: '',
    ...partial,
  };
}

function collection(
  id: string,
  name: string,
  parent: string | null,
  entries: string[],
): Collection {
  return { id, name, parent, entries, created: '' };
}

const nagy = entry({
  key: 'nagy',
  authors: 'Nagy',
  year: '1979',
  title: 'The Best of the Achaeans',
});
const lord = entry({ key: 'lord', authors: 'Lord', year: '1960', title: 'The Singer of Tales' });
const parry = entry({
  key: 'parry',
  authors: 'Parry',
  year: '1971',
  title: 'The Making of Homeric Verse',
});
const anon = entry({ key: 'anon', title: 'Ἰλιάς' });
const entries = [nagy, lord, parry, anon];
const collections = [
  collection('oral', 'Oral poetry', null, ['lord', 'parry']),
  collection('field', 'Fieldwork', 'oral', ['parry']),
  collection('hero', 'The hero', null, ['nagy']),
];

const outline = (parts: { under: number; title: string }[]) =>
  parts.map((p) => `${p.under} ${p.title}`);

describe('a map of the library', () => {
  it('names an element as the list shows the reference', () => {
    expect(elementName(nagy)).toBe('Nagy 1979 The Best of the Achaeans');
    expect(elementName(anon)).toBe('Ἰλιάς');
  });

  it('has the collections nested, the references under theirs, the rest at the centre', () => {
    const plan = planMap('The library', null, collections, entries);
    expect(outline(plan.parts)).toEqual([
      '0 The library',
      '0 Ἰλιάς',
      '0 Oral poetry',
      '2 Lord 1960 The Singer of Tales',
      '2 Parry 1971 The Making of Homeric Verse',
      '2 Fieldwork',
      '5 Parry 1971 The Making of Homeric Verse',
      '0 The hero',
      '7 Nagy 1979 The Best of the Achaeans',
    ]);
    expect(plan.collections).toBe(3);
    expect(plan.references).toBe(5);
    expect(plan.cited.sort()).toEqual(['anon', 'lord', 'nagy', 'parry']);
  });

  it('of one collection, holds that collection and what lies within it', () => {
    const plan = planMap('Oral poetry', collections[0], collections, entries);
    expect(outline(plan.parts)).toEqual([
      '0 Oral poetry',
      '0 Lord 1960 The Singer of Tales',
      '0 Parry 1971 The Making of Homeric Verse',
      '0 Fieldwork',
      '3 Parry 1971 The Making of Homeric Verse',
    ]);
    expect(plan.collections).toBe(1);
    expect(plan.cited.sort()).toEqual(['lord', 'parry']);
  });

  it('is made in the project with a citation as the text of every reference', () => {
    const project = new Project(null);
    const plan = planMap('The library', null, collections, entries);
    const made = makeLibraryMap(project, plan);
    const tree = project.tree(made.map);
    expect(tree.sequence.map((id) => `${tree.depth.get(id)} ${project.node(id)?.title}`)).toEqual([
      '0 The library',
      '1 Ἰλιάς',
      '1 Oral poetry',
      '2 Lord 1960 The Singer of Tales',
      '2 Parry 1971 The Making of Homeric Verse',
      '2 Fieldwork',
      '3 Parry 1971 The Making of Homeric Verse',
      '1 The hero',
      '2 Nagy 1979 The Best of the Achaeans',
    ]);
    const lordNode = made.nodes[3];
    expect(readBody(project.fragment(lordNode, 'body') ?? undefined)).toEqual([
      {
        kind: 'paragraph',
        content: [{ kind: 'citation', items: [{ id: 'lord' }], mode: 'normal' }],
      },
    ]);
    // A collection has no text of its own.
    expect(readBody(project.fragment(made.nodes[2], 'body') ?? undefined)).toEqual([]);
    expect(project.usedReferences(made.map).sort()).toEqual(['anon', 'lord', 'nagy', 'parry']);
  });
});
