import { afterEach, describe, expect, it } from 'vitest';
import { languages, t } from '$lib/i18n';
import { pieces } from './pieces';

afterEach(() => {
  languages.current = 'en';
});

describe('the words of a project', () => {
  it('say in English what was said before they had names', () => {
    expect(t('project-deleted', { name: 'Wrath', under: 0 })).toBe('“Wrath” was deleted');
    expect(t('project-deleted', { name: 'Wrath', under: 1 })).toBe(
      '“Wrath” was deleted, with 1 element under it',
    );
    expect(t('project-deleted', { name: 'Wrath', under: 3 })).toBe(
      '“Wrath” was deleted, with 3 elements under it',
    );
    expect(t('project-deleted-many', { count: 2 })).toBe('2 elements deleted');
    expect(t('project-deleted-many', { count: 1200 })).toBe('1,200 elements deleted');
    expect(t('project-delete-map-message', { count: 1 })).toBe(
      '1 element and the text in it will go. This can be undone while the project is open.',
    );
    expect(t('project-delete-map-message', { count: 7 })).toBe(
      '7 elements and the text in them will go. This can be undone while the project is open.',
    );
    expect(t('project-cited-in', { count: 1, name: 'Wrath' })).toBe(
      'The reference is cited in “Wrath”',
    );
    expect(t('project-cited-in-element', { count: 2 })).toBe(
      '2 references are cited in “the element”',
    );
    expect(t('project-copied-to', { name: 'Wrath' })).toBe('Copied to “Wrath”');
    expect(t('project-found-hint', { count: 12 })).toBe('12 to go through, and make citations of');
    expect(t('project-words', { count: 1 })).toBe('1 word');
    expect(t('project-words', { count: 12345 })).toBe('12,345 words');
    expect(t('project-references-foreign', { count: 1 })).toBe(
      '1 in this project is not in your library.',
    );
    expect(t('project-pictures-absent-map', { count: 3 })).toBe(
      '3 in this map are not on this computer.',
    );
  });

  it('are said in Norwegian, with its plurals and its way of writing numbers', () => {
    languages.current = 'nb';
    expect(t('project-deleted', { name: 'Vreden', under: 0 })).toBe('«Vreden» ble slettet');
    expect(t('project-deleted', { name: 'Vreden', under: 3 })).toBe(
      '«Vreden» ble slettet, sammen med 3 elementer under det',
    );
    expect(t('project-deleted-many', { count: 1 })).toBe('1 element ble slettet');
    expect(t('project-deleted-many', { count: 1200 })).toMatch(/^1\s200 elementer ble slettet$/);
    expect(t('project-untitled')).toBe('Uten navn');
  });
});

describe('the words of a diagram', () => {
  it('have the keys where the language puts them', () => {
    const hint = () => pieces((m) => t('diagram-hint-empty', m), { tab: 'Tab', enter: 'Enter' });
    expect(
      hint()
        .map((p) => p.text)
        .join(''),
    ).toBe(
      'Tab adds an idea under the one selected · Enter adds one beside it · double-click to write',
    );
    expect(hint().filter((p) => p.name)).toEqual([
      { text: 'Tab', name: 'tab' },
      { text: 'Enter', name: 'enter' },
    ]);
    languages.current = 'nb';
    expect(hint()[0]).toEqual({ text: 'Tab', name: 'tab' });
    expect(hint().filter((p) => p.name)).toHaveLength(2);
  });

  it('say how large the map is shown in the way of the language', () => {
    expect(t('diagram-zoom', { percent: 100 })).toBe('100%');
    languages.current = 'nb';
    expect(t('diagram-zoom', { percent: 100 })).toBe('100 %');
  });
});
