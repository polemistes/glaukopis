import { describe, expect, it } from 'vitest';
import { heldMessage, thingsHeld } from './holds';

describe('what is said where a paragraph holds what a name cannot', () => {
  it('names each thing, joined as the language joins a list', () => {
    expect(thingsHeld(['citation'])).toBe('a citation');
    expect(thingsHeld(['citation', 'footnote'])).toBe('a citation and a note');
    expect(thingsHeld(['math', 'refmark', 'crossref', 'linemark'])).toBe(
      'a formula, an inline number, a cross-reference, and a number or words in the margin',
    );
  });

  it('names what it does not know as something a name cannot hold, once', () => {
    expect(thingsHeld(['citation', 'unknown', 'another'])).toBe(
      'a citation and something a name cannot hold',
    );
  });

  it('says it of the paragraph, or of what is selected', () => {
    expect(heldMessage(['citation'], false)).toBe(
      'The paragraph holds a citation and was not made an element',
    );
    expect(heldMessage(['footnote'], true)).toBe(
      'What is selected holds a note and was not made an element',
    );
  });
});
