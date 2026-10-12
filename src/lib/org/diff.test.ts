import { describe, expect, it } from 'vitest';
import { anyChange, changedWords, diffLines } from './diff';

describe('the difference between two Org texts', () => {
  it('is nothing where they are the same', () => {
    const text = '* Medea\n\nSing, goddess.\n';
    const lines = diffLines(text, text);
    expect(lines.every((l) => l.kind === 'same')).toBe(true);
    expect(anyChange(lines)).toBe(false);
  });

  it('says the lines put in and taken out, in their places', () => {
    const lines = diffLines('one\ntwo\nthree\n', 'one\nthree\nfour\n');
    expect(lines).toEqual([
      { kind: 'same', text: 'one' },
      { kind: 'removed', text: 'two' },
      { kind: 'same', text: 'three' },
      { kind: 'added', text: 'four' },
    ]);
  });

  it('pairs a line taken out with one put in at its place, and marks the words that changed', () => {
    const lines = diffLines(
      '#+BEGIN_QUOTE\nSing, goddess, the wrath\n#+END_QUOTE',
      '#+BEGIN_QUOTE\nSing, Muse, the /wrath/\n#+END_QUOTE',
    );
    expect(lines[0]).toEqual({ kind: 'same', text: '#+BEGIN_QUOTE' });
    expect(lines[1]).toEqual({
      kind: 'changed',
      before: [
        { text: 'Sing, ', changed: false },
        { text: 'goddess,', changed: true },
        { text: ' the ', changed: false },
        { text: 'wrath', changed: true },
      ],
      after: [
        { text: 'Sing, ', changed: false },
        { text: 'Muse,', changed: true },
        { text: ' the ', changed: false },
        { text: '/wrath/', changed: true },
      ],
    });
    expect(lines[2]).toEqual({ kind: 'same', text: '#+END_QUOTE' });
  });

  it('what is left over of lines put in or taken out stands alone', () => {
    const lines = diffLines('a\nb c\nd', 'a\nb e\nnew\nd');
    expect(lines.map((l) => l.kind)).toEqual(['same', 'changed', 'added', 'same']);
  });

  it('an empty text is all put in, or all taken out', () => {
    expect(diffLines('', 'x\ny')).toEqual([
      { kind: 'added', text: 'x' },
      { kind: 'added', text: 'y' },
    ]);
    expect(diffLines('x', '')).toEqual([{ kind: 'removed', text: 'x' }]);
  });

  it('marks words within a line, the spaces kept', () => {
    expect(changedWords('a b c', 'a x c')).toEqual({
      before: [
        { text: 'a ', changed: false },
        { text: 'b', changed: true },
        { text: ' c', changed: false },
      ],
      after: [
        { text: 'a ', changed: false },
        { text: 'x', changed: true },
        { text: ' c', changed: false },
      ],
    });
  });

  it('long texts that differ throughout are compared without running out of room', () => {
    const a = Array.from({ length: 3000 }, (_, i) => `a${i}`).join('\n');
    const b = Array.from({ length: 3000 }, (_, i) => `b${i}`).join('\n');
    const lines = diffLines(a, b);
    expect(lines).toHaveLength(3000);
    expect(lines.every((l) => l.kind === 'changed')).toBe(true);
  });
});
