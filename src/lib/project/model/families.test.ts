import { describe, expect, it } from 'vitest';
import {
  countedKind,
  factsOf,
  groupingOf,
  PARAGRAPH_KINDS,
  renamed,
  WORD_KINDS,
  wordsKind,
} from './families';

const own = [
  { id: 'chorus', basedOn: 'speaker' },
  { id: 'verse2', basedOn: 'verse' },
  { id: 'letter', basedOn: 'text' },
  { id: 'odd', basedOn: 'nothing-known' },
  { id: 'c1', basedOn: 'c2' },
  { id: 'c2', basedOn: 'c1' },
];

// The same cases as the test of `facts` in `crates/core/src/formats/kinds.rs`: the two must agree.
describe('the facts of kinds', () => {
  it('follow the catalogue', () => {
    expect(groupingOf('line')).toBe('lines');
    expect(groupingOf('quote')).toBe('quote');
    expect(groupingOf('item')).toBe('list');
    expect(groupingOf('headword')).toBe('glossary');
    expect(groupingOf('dialogue')).toBe('none');
    expect(countedKind('line') && countedKind('text') && !countedKind('speaker')).toBe(true);
    expect(countedKind('attribution') || countedKind('break') || countedKind('draft')).toBe(false);
  });

  it('let a speaker and a direction stand on words as well', () => {
    expect(wordsKind('speaker') && wordsKind('direction') && wordsKind('foreign')).toBe(true);
    expect(wordsKind('line') || wordsKind('text')).toBe(false);
    expect(WORD_KINDS).toEqual([
      'foreign',
      'title',
      'term',
      'mention',
      'highlight',
      'speaker',
      'direction',
    ]);
    expect(PARAGRAPH_KINDS).toContain('speaker');
    expect(PARAGRAPH_KINDS).not.toContain('foreign');
  });

  it('read the old ids', () => {
    expect(renamed('verse')).toBe('line');
    expect(groupingOf('verse')).toBe('lines');
    expect(groupingOf('list')).toBe('list');
  });

  it('give a kind of the writer’s own the facts of what it is based on', () => {
    expect(factsOf('chorus', own)).toEqual({ grouping: 'none', counted: false, words: true });
    expect(groupingOf('verse2', own)).toBe('lines');
    expect(countedKind('verse2', own)).toBe(true);
  });

  it('give one based on text, on nothing known, or in a circle, the facts of text', () => {
    expect(factsOf('letter', own)).toEqual(factsOf('text'));
    expect(factsOf('odd', own)).toEqual(factsOf('text'));
    expect(factsOf('c1', own)).toEqual(factsOf('text'));
    expect(factsOf('nothing')).toBe(factsOf('text'));
  });
});
