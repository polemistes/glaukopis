import { describe, expect, it } from 'vitest';
import { lineNumbers, linesOf, stretches, stretchNumbers, type CountedLine } from './lines';
import { linemark, pagebreak, paragraph, type Inline } from './text';
import type { Numbering } from './families';

const line = (number: string | null = null, counted = true, always = false): CountedLine => ({
  counted,
  number,
  ...(always ? { shown: true } : {}),
});
const plain = (n: number) => Array.from({ length: n }, () => line());

/** What stands on the page, line by line: "-" where nothing, "!" after a number given by hand. */
function shown(numbering: Numbering, every: number, lines: CountedLine[]): string[] {
  return shownFrom(numbering, every, null, lines);
}

/** The same, the stretch counting from the number given. */
function shownFrom(
  numbering: Numbering,
  every: number,
  from: string | null,
  lines: CountedLine[],
): string[] {
  return lineNumbers(numbering, every, lines, from).map((s) =>
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

  it('count from the number the stretch begins from, showing it only where it falls on every', () => {
    expect(shownFrom('counted', 5, '1', plain(6))).toEqual(['-', '-', '-', '-', '5', '-']);
    expect(shownFrom('counted', 5, '41', plain(6))).toEqual(['-', '-', '-', '-', '45', '-']);
    expect(shownFrom('counted', 5, '45', plain(6))).toEqual(['45', '-', '-', '-', '-', '50']);
    expect(shownFrom('counted', 1, '1', plain(2))).toEqual(['1', '2']);
    // Taken up at the first counted line: one not counted before it is passed over.
    expect(shownFrom('counted', 5, '5', [line(null, false), ...plain(6)])).toEqual([
      '-',
      '5',
      '-',
      '-',
      '-',
      '-',
      '10',
    ]);
  });

  it('show a number given by hand, and go on from it, whatever the stretch begins from', () => {
    expect(shownFrom('counted', 5, '1', [line('41'), ...plain(5)])).toEqual([
      '41!',
      '-',
      '-',
      '-',
      '45',
      '-',
    ]);
    expect(shownFrom('counted', 5, '1', [...plain(2), line('12'), ...plain(3)])).toEqual([
      '-',
      '-',
      '12!',
      '-',
      '-',
      '15',
    ]);
    expect(lineNumbers('counted', 5, [line('12')], '1')).toEqual([{ label: '12', set: true }]);
  });

  it('always show a label with letters, and go on from it: after 11b comes 12', () => {
    expect(shown('counted', 1, [line('10'), line(), line('11b'), ...plain(2)])).toEqual([
      '10!',
      '11',
      '11b!',
      '12',
      '13',
    ]);
    expect(shown('counted', 5, [line('10'), line('11b'), ...plain(4)])).toEqual([
      '10!',
      '11b!',
      '-',
      '-',
      '-',
      '15',
    ]);
  });

  it('show the number of a line said to be always shown, and never that of one hidden', () => {
    expect(shown('counted', 5, [line('40'), line(), line(null, true, true), line()])).toEqual([
      '40!',
      '-',
      '42',
      '-',
    ]);
    expect(shown('counted', 5, [line('41', true, true), line()])).toEqual(['41!', '-']);
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

// ---- lines, stretches, and the numbers of a stretch ----

const w = (text: string): Inline => ({ kind: 'text', text, marks: {} });
const br: Inline = { kind: 'break' };
const shownOf = (rows: ({ label: string; set: boolean } | null)[][]) =>
  rows.map((r) => r.map((s) => (s ? (s.set ? `${s.label}!` : s.label) : '-')).join(' '));

// The same cases as the test of `stretch_numbers` in `crates/core/src/document/numbers.rs`.
describe('the lines of a paragraph', () => {
  it('are parted by its line breaks, each with the mark that begins it', () => {
    const lines = linesOf([
      linemark({ number: '45' }),
      w('one'),
      br,
      w('two'),
      br,
      linemark({ hidden: true }),
      w('three'),
    ]);
    expect(
      lines.map((l) => [l.mark?.number ?? l.mark?.hidden ?? null, l.content.length, l.blank]),
    ).toEqual([
      ['45', 1, false],
      [null, 1, false],
      [true, 1, false],
    ]);
  });

  it('are one blank line for an empty paragraph, and a blank line between two breaks', () => {
    expect(linesOf([]).map((l) => l.blank)).toEqual([true]);
    expect(linesOf([w('a'), br, br, w('b')]).map((l) => l.blank)).toEqual([false, true, false]);
  });
});

describe('the stretches of a text', () => {
  it('are runs of paragraphs with the same numbering settings, whatever their kinds', () => {
    const blocks = [
      paragraph([w('prose')]),
      paragraph([w('Nurse')], 'speaker', { indent: 0, numbering: 'counted' }),
      paragraph([w('a')], 'line', { indent: 0, numbering: 'counted' }),
      paragraph([w('b')], 'text', { indent: 0, numbering: 'counted', every: 2 }),
      pagebreak(),
      paragraph([w('c')], 'line', { indent: 0, numbering: 'counted', every: 2 }),
      paragraph([w('d')], 'line', { indent: 0, numbering: 'counted', every: 2, only: 'line' }),
    ];
    expect(stretches(blocks).map((s) => [s.from, s.to, s.every, s.only])).toEqual([
      [1, 3, null, null],
      [3, 4, 2, null],
      [5, 6, 2, null],
      [6, 7, 2, 'line'],
    ]);
  });
});

describe('the numbers of a stretch', () => {
  it('count lines across stanzas and through a speaker, and pass over an empty line', () => {
    const rows = stretchNumbers(
      [
        paragraph([w('Nurse')], 'speaker'),
        paragraph([linemark({ number: '1' }), w('one'), br, w('two'), br, w('three')], 'line'),
        paragraph([w('four'), br, br, w('five')], 'line'),
      ],
      'counted',
      1,
    );
    expect(shownOf(rows)).toEqual(['-', '1! 2 3', '4 - 5']);
  });

  it('count a line marked hidden and show nothing on it, and pass over one not counted', () => {
    const rows = stretchNumbers(
      [
        paragraph(
          [
            linemark({ number: '1' }),
            w('a'),
            br,
            linemark({ hidden: true }),
            w('b'),
            br,
            w('c'),
            br,
            linemark({ counted: false }),
            w('d'),
            br,
            w('e'),
          ],
          'line',
        ),
      ],
      'counted',
      2,
    );
    expect(shownOf(rows)).toEqual(['1! - - - 4']);
  });

  it('number prose paragraph by paragraph, each one line', () => {
    const rows = stretchNumbers(
      [paragraph([linemark({ number: '1' }), w('First.')]), paragraph([w('Second.')])],
      'counted',
      1,
    );
    expect(shownOf(rows)).toEqual(['1!', '2']);
  });

  it('show only what was given where the numbering is given', () => {
    const rows = stretchNumbers(
      [
        paragraph(
          [linemark({ number: '45' }), w('a'), br, w('b'), br, linemark({ number: '77' }), w('c')],
          'line',
        ),
      ],
      'given',
      1,
    );
    expect(shownOf(rows)).toEqual(['45! - 77!']);
  });

  it('count only the lines of the one kind said, passing over the others as a speaker is', () => {
    const rows = stretchNumbers(
      [
        paragraph([linemark({ number: '1' }), w('a'), br, w('b')], 'line'),
        paragraph([w('Quoted.'), br, linemark({ number: 'Q' }), w('More.')], 'quote'),
        paragraph([w('c')], 'line'),
      ],
      'counted',
      1,
      [],
      'line',
    );
    expect(shownOf(rows)).toEqual(['1! 2', '- Q!', '3']);
  });

  it('show a line said to be always shown, in a count every five', () => {
    const rows = stretchNumbers(
      [
        paragraph(
          [linemark({ number: '40' }), w('a'), br, w('b'), br, linemark({ shown: true }), w('c')],
          'line',
        ),
      ],
      'counted',
      5,
    );
    expect(shownOf(rows)).toEqual(['40! - 42']);
  });
});
