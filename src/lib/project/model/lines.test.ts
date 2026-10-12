import { describe, expect, it } from 'vitest';
import { lineNumbers, type CountedLine } from './lines';
import type { Numbering } from './families';

const line = (number: string | null = null, counted = true): CountedLine => ({ counted, number });
const plain = (n: number) => Array.from({ length: n }, () => line());

function shown(numbering: Numbering, every: number, lines: CountedLine[]): string[] {
  return lineNumbers(numbering, every, lines).map((s) =>
    s ? (s.set ? `${s.label}!` : s.label) : '-',
  );
}

// The same cases as the test in `crates/core/src/document/numbers.rs`: the two must count alike.
describe('the numbers of the paragraphs of a passage', () => {
  it('show nothing where nothing is numbered', () => {
    expect(shown('none', 5, [line('1'), ...plain(3)])).toEqual(['-', '-', '-', '-']);
  });

  it('count from the first number given, every so many, and not what is not counted', () => {
    expect(shown('counted', 5, [line(null, false), line('1'), ...plain(5)])).toEqual([
      '-',
      '1!',
      '-',
      '-',
      '-',
      '5',
      '-',
    ]);
  });

  it('show nothing before the first number given', () => {
    expect(shown('counted', 5, [...plain(2), line('1234'), ...plain(6)])).toEqual([
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

  it('go on from the digits of a label, keeping what stands before them', () => {
    expect(shown('counted', 1, [line('1094a1'), ...plain(2), line('567a'), line()])).toEqual([
      '1094a1!',
      '1094a2',
      '1094a3',
      '567a!',
      '568',
    ]);
  });

  it('keep the noughts a label began with', () => {
    expect(shown('counted', 1, [line('0098'), ...plain(2)])).toEqual(['0098!', '0099', '0100']);
  });

  it('leave the count as it was after a label without digits', () => {
    expect(shown('counted', 1, [line('10'), line('*'), line()])).toEqual(['10!', '*!', '11']);
  });

  it('pass over a paragraph that is not counted, showing only its own label', () => {
    expect(shown('counted', 1, [line('10'), line(null, false), line('b', false), line()])).toEqual([
      '10!',
      '-',
      'b!',
      '11',
    ]);
  });

  it('count every so many by the numbers, not by the lines', () => {
    expect(shown('counted', 5, [line('1235'), ...plain(2), line('1239'), line()])).toEqual([
      '1235!',
      '-',
      '-',
      '1239!',
      '1240',
    ]);
  });

  it('show only what was given where the numbering is given', () => {
    expect(shown('given', 5, [line('45'), line('77'), line(), line('46', false), line()])).toEqual([
      '45!',
      '77!',
      '-',
      '46!',
      '-',
    ]);
  });

  it('take every number as at least one', () => {
    expect(shown('counted', 0, [line('1'), line()])).toEqual(['1!', '2']);
  });
});
