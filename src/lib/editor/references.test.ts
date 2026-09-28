import { afterEach, describe, expect, it } from 'vitest';
import { has, languages } from '$lib/i18n';
import { Project } from '$lib/project/model/project.svelte';
import { citationLabel, languageOf, locatorWord, setProject } from './references.svelte';
import { LOCATOR_LABELS, type CiteItem } from './schema';

/** A project with one map, in a language, and a reference of its own. */
function project(language?: string) {
  const p = new Project(null);
  const map = p.createMap('Wrath');
  if (language) p.setDocument(map, { language });
  p.putReference({
    id: 'nagy',
    key: 'nagy1979',
    type: 'book',
    fields: {},
    names: {},
    modified: '2026-01-01',
    authors: 'Nagy',
    year: '1979',
    title: 'The Best of the Achaeans',
    container: '',
  });
  setProject(p);
  return p.map(map)!.root;
}

afterEach(() => {
  setProject(null);
  languages.current = 'en';
});

describe('what a locator counts', () => {
  it('is named in the menu of a citation, whatever its kind', () => {
    for (const [kind] of LOCATOR_LABELS) expect(has(`editor-locator-${kind}`), kind).toBe(true);
  });

  it('is said in a text in English as it always was', () => {
    expect(locatorWord('chapter')).toBe('ch.');
    expect(locatorWord('chapter', 'en-US')).toBe('ch.');
    expect(locatorWord('volume', 'en-GB')).toBe('vol.');
  });

  it('is said in the language of the text, in the words of CSL', () => {
    expect(locatorWord('chapter', 'nb')).toBe('kap.');
    expect(locatorWord('chapter', 'no')).toBe('kap.');
    // Where CSL has no short form, the word itself.
    expect(locatorWord('line', 'nb-NO')).toBe('linje');
    expect(locatorWord('volume', 'de')).toBe('Bd.');
    expect(locatorWord('chapter', 'el')).toBe('κεφ.');
  });

  it('is said in English where CSL does not have the language', () => {
    expect(locatorWord('chapter', 'grc')).toBe('ch.');
  });

  it('is a sign where English has one, in every language', () => {
    expect(locatorWord('section', 'nb')).toBe('§');
    expect(locatorWord('paragraph', 'de')).toBe('¶');
  });

  it('is not said where it is not a kind that is offered', () => {
    expect(locatorWord('opus', 'nb')).toBe('');
  });
});

describe('a citation in the text', () => {
  const items: CiteItem[] = [{ id: 'nagy', locator: '3', label: 'chapter' }];

  it('says what its locator counts in the language of the map', () => {
    const element = project('nb');
    expect(languageOf(element)).toBe('nb');
    expect(citationLabel(items, 'normal', languageOf(element))).toBe('(Nagy 1979, kap. 3)');
    expect(citationLabel(items, 'intext', languageOf(element))).toBe('Nagy (1979, kap. 3)');
  });

  it('says it in English where the language is not given, or is English', () => {
    const element = project();
    expect(citationLabel(items, 'normal')).toBe('(Nagy 1979, ch. 3)');
    expect(citationLabel(items, 'normal', languageOf(element))).toBe('(Nagy 1979, ch. 3)');
  });

  it('tells in the language of the interface what is wrong with it', () => {
    project('en-GB');
    languages.current = 'nb';
    expect(citationLabel([], 'normal')).toBe('(kildehenvisning)');
    expect(citationLabel([{ id: 'gone' }], 'normal', 'en-GB')).toBe(
      '([referansen ble ikke funnet])',
    );
    languages.current = 'en';
    expect(citationLabel([{ id: 'gone' }], 'normal')).toBe('([reference not found])');
  });
});
