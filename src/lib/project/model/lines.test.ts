import { describe, expect, it } from 'vitest';
import { lineNumbers, type CountedLine } from './lines';

const line = (number: string | null = null, counted = true, kind = 'line'): CountedLine => ({
  kind,
  number,
  counted,
});
const plain = (n: number) => Array.from({ length: n }, () => line());

function shown(start: number | null, by: number, lines: CountedLine[]): string[] {
  return lineNumbers(start, by, lines).map((s) => (s ? (s.set ? `${s.label}!` : s.label) : '-'));
}

// The same cases as the test in `crates/core/src/document/verse.rs`: the two must count alike.
describe('the numbers of the lines of verse', () => {
  it('count from the start, every so many, and not the speakers', () => {
    expect(shown(1, 5, [line(null, true, 'speaker'), ...plain(6)])).toEqual([
      '-',
      '1',
      '-',
      '-',
      '-',
      '5',
      '-',
    ]);
  });

  it('begin at a number given by hand where the verse has no start', () => {
    expect(shown(null, 5, [...plain(2), line('1234'), ...plain(6)])).toEqual([
      '-',
      '-',
      '1234!',
      '1235',
      '-',
      '-',
      '-',
      '-',
      '1240',
    ]);
  });

  it('go on from the number of a label with a letter at its end', () => {
    expect(shown(null, 2, [line('567'), line('567a'), line(), line()])).toEqual([
      '567!',
      '567a!',
      '568',
      '-',
    ]);
  });

  it('pass over a line that is not counted, which shows only its own label', () => {
    expect(shown(4, 5, [line(), line(null, false), line('4b', false), line()])).toEqual([
      '4',
      '-',
      '4b!',
      '5',
    ]);
  });

  it('count the last run of digits, keeping what is before it and the noughts', () => {
    expect(shown(null, 5, [line('1094a1'), ...plain(5), line('007'), ...plain(3)])).toEqual([
      '1094a1!',
      '-',
      '-',
      '-',
      '1094a5',
      '-',
      '007!',
      '-',
      '-',
      '010',
    ]);
  });

  it('leave the count as it was after a label without digits', () => {
    expect(shown(1, 2, [line(), line('*'), line()])).toEqual(['1', '*!', '2']);
  });
});
