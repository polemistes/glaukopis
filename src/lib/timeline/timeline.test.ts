import { describe, expect, it } from 'vitest';
import { describeWhen, solve, type When } from './solve';
import { readTime, writeYear } from './time';

describe('times as they are written', () => {
  it('reads years, with BC and AD, as astronomers count them', () => {
    expect(readTime('431 BC', 'dates')).toMatchObject({ from: -430, to: -429, approx: false });
    expect(readTime('1 BC', 'dates')).toMatchObject({ from: 0, to: 1 });
    expect(readTime('AD 14', 'dates')).toMatchObject({ from: 14, to: 15 });
    expect(readTime('14 CE', 'dates')).toMatchObject({ from: 14, to: 15 });
    expect(readTime('480 f.Kr.', 'dates')).toMatchObject({ from: -479, to: -478 });
    expect(readTime('1453', 'dates')).toMatchObject({ from: 1453, to: 1454 });
    expect(readTime('c. 480 BCE', 'dates')).toMatchObject({ from: -479, approx: true });
    expect(readTime('about 1200', 'dates')).toMatchObject({ from: 1200, approx: true });
    expect(writeYear(-430)).toBe('431 BC');
    expect(writeYear(0)).toBe('1 BC');
    expect(writeYear(1453.4)).toBe('1453');
  });

  it('reads dates and months, as fractions of a year', () => {
    const fall = readTime('1453-05-29', 'dates')!;
    expect(fall.from).toBeCloseTo(1453 + 148 / 365, 5);
    expect(readTime('29 May 1453', 'dates')!.from).toBeCloseTo(fall.from, 5);
    expect(readTime('May 29, 1453', 'dates')!.from).toBeCloseTo(fall.from, 5);
    expect(readTime('29.5.1453', 'dates')!.from).toBeCloseTo(fall.from, 5);
    expect(readTime('29. mai 1453', 'dates')!.from).toBeCloseTo(fall.from, 5);
    const may = readTime('May 1453', 'dates')!;
    expect(may.from).toBeCloseTo(1453 + 120 / 365, 5);
    expect(may.to).toBeCloseTo(1453 + 151 / 365, 5);
    expect(readTime('December 1453', 'dates')!.to).toBe(1454);
    expect(readTime('1453-13', 'dates')).toBeNull();
  });

  it('reads centuries and decades as the spans they are', () => {
    expect(readTime('5th century BC', 'dates')).toMatchObject({ from: -499, to: -399 });
    expect(readTime('the 5th century', 'dates')).toMatchObject({ from: 401, to: 501 });
    expect(readTime('12. århundre', 'dates')).toMatchObject({ from: 1101, to: 1201 });
    expect(readTime('the 1920s', 'dates')).toMatchObject({ from: 1920, to: 1930 });
    expect(readTime('1900s', 'dates')).toMatchObject({ from: 1900, to: 2000 });
  });

  it('reads the units of an invented world as numbers', () => {
    expect(readTime('Year 12', 'units')).toMatchObject({ from: 12, to: 13 });
    expect(readTime('Day 3', 'units')).toMatchObject({ from: 3, to: 4 });
    expect(readTime('12', 'units')).toMatchObject({ from: 12 });
    expect(readTime('-4', 'units')).toMatchObject({ from: -4 });
    expect(readTime('3,5 cycles', 'units')).toMatchObject({ from: 3.5 });
    expect(readTime('c. 40', 'units')).toMatchObject({ from: 40, approx: true });
    expect(readTime('soon', 'units')).toBeNull();
    expect(readTime('', 'dates')).toBeNull();
    expect(readTime('next year', 'dates')).toBeNull();
  });
});

describe('where elements stand in time', () => {
  const at = (at: string): When => ({ start: { at } });
  const over = (from: string, to: string): When => ({ start: { at: from }, end: { at: to } });

  it('places what is written where it is written, as long as it was written', () => {
    const s = solve(
      [
        { id: 'a', when: at('431 BC') },
        { id: 'b', when: over('431 BC', '404 BC') },
        { id: 'c', when: at('5th century BC') },
      ],
      'dates',
    );
    expect(s.scaled).toBe(true);
    expect(s.placed.get('a')).toMatchObject({ from: -430, to: -429, span: false, fixed: true });
    expect(s.placed.get('b')).toMatchObject({ from: -430, to: -402, span: true, fixed: true });
    expect(s.placed.get('c')).toMatchObject({ from: -499, to: -399 });
    expect(s.range).toEqual([-499, -399]);
  });

  it('solves what is relative into the windows of what it may be', () => {
    const s = solve(
      [
        { id: 'war', when: over('431 BC', '404 BC') },
        { id: 'peace', when: at('421 BC') },
        { id: 'plague', when: { start: { after: 'war-start' }, during: undefined } as never },
      ],
      'dates',
    );
    expect(s.placed.get('plague')!.problem).toBe('unknown');

    const t = solve(
      [
        { id: 'war', when: over('431 BC', '404 BC') },
        { id: 'peace', when: at('421 BC') },
        // After the peace, before the war ends: in a window of 17 years, drawn in its middle.
        { id: 'sicily', when: { start: { after: 'peace', before: 'war-end' } } },
        { id: 'war-end', when: at('404 BC') },
        // After the war, with nothing after it: a little way past its end.
        { id: 'thirty', when: { start: { after: 'war' } } },
        // During the war, as a span: within it.
        { id: 'plague', when: { start: { during: 'war' }, end: { during: 'war' } } },
      ],
      'dates',
    );
    const sicily = t.placed.get('sicily')!;
    expect(sicily.fixed).toBe(false);
    // The peace may be anywhere in 421 BC, the war's end anywhere in 404 BC.
    expect(sicily.window).toEqual({ start: [-420, -402], end: [-420, -402] });
    expect(sicily.from).toBeCloseTo(-411, 5);
    const thirty = t.placed.get('thirty')!;
    // The war may end anywhere in 404 BC: from its earliest end, a little way on.
    expect(thirty.from).toBeGreaterThan(-403);
    expect(thirty.window!.start).toEqual([-403, Infinity]);
    const plague = t.placed.get('plague')!;
    expect(plague.from).toBeGreaterThanOrEqual(-430);
    expect(plague.to).toBeLessThanOrEqual(-402);
    expect(plague.to).toBeGreaterThan(plague.from);
  });

  it('draws a chain of elements each after the last in its order', () => {
    const s = solve(
      [
        { id: 'peace', when: at('421 BC') },
        { id: 'expedition', when: { start: { after: 'peace' } } },
        { id: 'plague', when: { start: { after: 'expedition' } } },
        { id: 'end', when: { start: { after: 'plague' }, end: { after: 'plague' } } },
      ],
      'dates',
    );
    const from = (id: string) => s.placed.get(id)!.from;
    expect(from('peace')).toBeLessThan(from('expedition'));
    expect(from('expedition')).toBeLessThan(from('plague'));
    expect(from('plague')).toBeLessThan(from('end'));
    expect(s.placed.get('end')!.to).toBeGreaterThan(from('end'));
    // After the expedition and before the peace, which the expedition is after: nowhere.
    const c = solve(
      [
        { id: 'peace', when: at('421 BC') },
        { id: 'expedition', when: { start: { after: 'peace' } } },
        { id: 'plague', when: { start: { after: 'expedition', before: 'peace' } } },
      ],
      'dates',
    );
    expect(c.placed.get('plague')!.problem).toBe('contradiction');
  });

  it('reports contradictions, and what refers to nothing', () => {
    const s = solve(
      [
        { id: 'a', when: at('431 BC') },
        { id: 'b', when: at('400 BC') },
        // After b, before a: nowhere.
        { id: 'g', when: { start: { after: 'b', before: 'a' } } },
        { id: 'c', when: { start: { after: 'd' } } },
        { id: 'd', when: { start: { after: 'c' } } },
        { id: 'e', when: { start: { after: 'nobody' } } },
        { id: 'f', when: at('whenever') },
      ],
      'dates',
    );
    expect(s.placed.get('g')!.problem).toBe('contradiction');
    // What is written stands where it is written, whatever contradicts it.
    expect(s.placed.get('b')!.from).toBe(-399);
    expect(s.placed.get('a')!.from).toBe(-430);
    expect(s.placed.get('e')!.problem).toBe('unknown');
    expect(s.placed.get('f')!.problem).toBe('unknown');
    // Two that are only after each other have no window and are not placed.
    expect(Number.isNaN(s.placed.get('c')!.from)).toBe(true);
  });

  it('orders what has no times at all, each after what it comes after', () => {
    const s = solve(
      [
        { id: 'quarrel', when: { start: {} } },
        { id: 'embassy', when: { start: { after: 'quarrel' } } },
        { id: 'death', when: { start: { after: 'embassy' } } },
        { id: 'wrath', when: { start: { after: 'quarrel' }, end: { before: 'death' } } },
        { id: 'games', when: { start: { during: 'wrath' } } },
        { id: 'ransom', when: { start: { before: 'death' } } },
      ],
      'units',
    );
    expect(s.scaled).toBe(false);
    const level = (id: string) => s.placed.get(id)!.from;
    expect(level('quarrel')).toBe(0);
    expect(level('embassy')).toBe(1);
    expect(level('death')).toBe(2);
    expect(level('wrath')).toBe(1);
    expect(s.placed.get('wrath')!.to).toBeGreaterThan(level('games'));
    expect(level('ransom')).toBe(0);
    expect(s.range).toEqual([0, 3]);
    const circle = solve(
      [
        { id: 'x', when: { start: { after: 'y' } } },
        { id: 'y', when: { start: { after: 'x' } } },
      ],
      'units',
    );
    expect(circle.placed.get('x')!.problem).toBe('contradiction');
  });

  it('says a placement in words', () => {
    const words = { after: 'after', before: 'before', during: 'during', to: 'to', approx: 'c.' };
    const name = (id: string) => ({ war: 'the war', peace: 'the peace' })[id] ?? id;
    expect(describeWhen({ start: { at: '431 BC', approx: true } }, name, words)).toBe('c. 431 BC');
    expect(describeWhen({ start: { after: 'peace', before: 'war' } }, name, words)).toBe(
      'after the peace, before the war',
    );
    expect(describeWhen({ start: { at: '431 BC' }, end: { during: 'war' } }, name, words)).toBe(
      '431 BC to during the war',
    );
  });
});
