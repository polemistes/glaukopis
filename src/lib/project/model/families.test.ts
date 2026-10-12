import { describe, expect, it } from 'vitest';
import { countedKind, factsOf, familyOf, joinsBefore, nextOf, renamed, tabOf } from './families';

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
    expect(familyOf('line')).toBe('verse');
    expect(countedKind('line') && !countedKind('speaker') && !countedKind('text')).toBe(true);
    expect(joinsBefore('attribution') && !joinsBefore('quote')).toBe(true);
    expect(nextOf('character')).toBe('dialogue');
    expect(nextOf('code')).toBe('code');
    expect(tabOf('item')).toBe('indent');
  });

  it('read the old ids', () => {
    expect(renamed('verse')).toBe('line');
    expect(familyOf('verse')).toBe('verse');
    expect(familyOf('list')).toBe('list');
  });

  it('give a kind of the writer’s own the facts of what it is based on', () => {
    expect(factsOf('chorus', own)).toEqual({
      family: 'verse',
      counted: false,
      joins: false,
      next: 'line',
    });
    expect(familyOf('verse2', own)).toBe('verse');
    expect(countedKind('verse2', own)).toBe(true);
  });

  it('make one based on text, or on nothing known, a family of its own whose paragraphs count', () => {
    expect(factsOf('letter', own)).toEqual({
      family: 'letter',
      counted: true,
      joins: false,
      next: undefined,
    });
    // Enter after a letter makes another: the passage goes on.
    expect(nextOf('letter', own)).toBe('letter');
    expect(familyOf('odd', own)).toBe('odd');
    expect(familyOf('c1', own)).toBe('c1');
    expect(countedKind('c1', own)).toBe(true);
  });

  it('take a kind that is not known at all for text', () => {
    expect(familyOf('nothing', own)).toBe('text');
    expect(factsOf('nothing')).toBe(factsOf('text'));
  });
});
