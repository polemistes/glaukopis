import { describe, expect, it } from 'vitest';
import { Project } from '$lib/project/model/project.svelte';
import { addChronology } from './chronology';
import { timelineOf } from './lanes';
import { describeWhen, solve, type When } from './solve';
import {
  precisionOf,
  readDuration,
  readTime,
  snap,
  writeDuration,
  writeTime,
  writeYear,
} from './time';

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

describe('a length of time', () => {
  it('is read as a margin either side of a time', () => {
    expect(readDuration('5 years', 'dates')).toBe(5);
    expect(readDuration('± 3 months', 'dates')).toBeCloseTo(0.25, 6);
    expect(readDuration('+/- 10 days', 'dates')).toBeCloseTo(10 / 365, 6);
    expect(readDuration('2 centuries', 'dates')).toBe(200);
    expect(readDuration('7', 'dates')).toBe(7);
    expect(readDuration('1,5 år', 'dates')).toBe(1.5);
    expect(readDuration('3 cycles', 'units')).toBe(3);
    expect(readDuration('3', 'units')).toBe(3);
    expect(readDuration('soon', 'dates')).toBeNull();
    expect(readDuration('5 moons', 'dates')).toBeNull();
    expect(readDuration('', 'dates')).toBeNull();
  });

  it('is written anew in the words it had', () => {
    expect(writeDuration(5.4, 'dates', '2 years')).toBe('5 years');
    expect(writeDuration(0.5, 'dates', '2 måneder')).toBe('6 måneder');
    expect(writeDuration(3.2, 'dates')).toBe('3 years');
    expect(writeDuration(0.4, 'dates')).toBe('5 months');
    expect(writeDuration(0.01, 'dates')).toBe('4 days');
    expect(writeDuration(2.25, 'units', '3 cycles')).toBe('2.3 cycles');
    expect(writeDuration(0, 'dates', '2 years')).toBe('');
  });
});

describe('a time moved along the axis', () => {
  it('keeps the grain of what was written, and the way it was written', () => {
    expect(precisionOf('431 BC', 'dates')).toBe('year');
    expect(precisionOf('May 1453', 'dates')).toBe('month');
    expect(precisionOf('1453-05-29', 'dates')).toBe('day');
    expect(precisionOf('the 1920s', 'dates')).toBe('decade');
    expect(precisionOf('5th century BC', 'dates')).toBe('century');
    expect(precisionOf('Year 12', 'units')).toBe('unit');
    expect(precisionOf('soon', 'dates')).toBeNull();
    expect(snap(-430.4, 'year')).toBe(-430);
    expect(snap(1453.37, 'month')).toBeCloseTo(1453 + 120 / 365, 9);
    expect(snap(-427, 'decade')).toBe(-430);
    expect(writeTime(-430, 'year', 'dates', '431 BC')).toBe('431 BC');
    expect(writeTime(-425, 'year', 'dates', '431 BCE')).toBe('426 BCE');
    expect(writeTime(1453, 'year', 'dates', '1450')).toBe('1453');
    expect(writeTime(1453 + 120 / 365, 'month', 'dates', 'May 1453')).toBe('1453-05');
    expect(writeTime(readTime('1453-05-29', 'dates')!.from, 'day', 'dates', '1453-05-29')).toBe(
      '1453-05-29',
    );
    expect(writeTime(1920, 'decade', 'dates', 'the 1920s')).toBe('1920s');
    expect(writeTime(-499, 'century', 'dates', '5th century BC')).toBe('5th century BC');
    expect(writeTime(401, 'century', 'dates', '5th century')).toBe('5th century');
    expect(writeTime(15, 'unit', 'units', 'Year 12')).toBe('Year 15');
    expect(writeTime(15, 'unit', 'units', '12')).toBe('15');
    // What is written anew reads back where it was put.
    for (const [value, precision, like] of [
      [-430, 'year', '431 BC'],
      [1453 + 120 / 365, 'month', 'May 1453'],
      [1920, 'decade', '1920s'],
      [-499, 'century', '5th century BC'],
    ] as const) {
      expect(readTime(writeTime(value, precision, 'dates', like), 'dates')!.from).toBeCloseTo(
        value,
        6,
      );
    }
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

  it('gives a time a margin either side, within which what is relative to it may be', () => {
    const s = solve(
      [
        { id: 'peace', when: { start: { at: '421 BC', margin: '5 years' } } },
        { id: 'later', when: { start: { after: 'peace' } } },
        { id: 'war', when: { start: { at: '431 BC' }, end: { at: '404 BC', margin: '2 years' } } },
      ],
      'dates',
    );
    const peace = s.placed.get('peace')!;
    // Drawn where it was written; the margin carried for the drawing.
    expect(peace.from).toBe(-420);
    expect(peace.to).toBe(-419);
    expect(peace.margins).toEqual([5, 5]);
    expect(s.placed.get('war')!.margins).toEqual([0, 2]);
    // The peace may be five years earlier: what is after it may be from then on.
    expect(s.placed.get('later')!.window!.start[0]).toBe(-425);
    // The range takes the margins in.
    expect(s.range![0]).toBe(-430);
    expect(s.range![1]).toBe(-400);
    // A margin that cannot be read is none.
    const odd = solve([{ id: 'x', when: { start: { at: '421 BC', margin: 'soon' } } }], 'dates');
    expect(odd.placed.get('x')!.margins).toEqual([0, 0]);
  });

  it('shows only lanes in which something says when it is', () => {
    const p = new Project(null);
    const map = p.createMap('Cities');
    const root = p.map(map)!.root;
    const athens = p.addChild(root, { title: 'Athens' })!;
    const plague = p.addChild(athens, { title: 'The plague' })!;
    const sparta = p.addChild(root, { title: 'Sparta' })!;
    const sources = p.addChild(root, { title: 'Sources' })!;
    p.addChild(sources, { title: 'Thucydides' });
    p.setWhen(plague, { start: { at: '430 BC' } });
    p.setWhen(sparta, { start: { at: '431 BC' }, end: { at: '404 BC' } });
    const lanes = timelineOf(p, map, () => null).lanes.map((l) => l.name);
    expect(lanes).toEqual(['Athens', 'Sparta']);
    // With what waits wanted: the lanes stay, the one of the sources among them, and what waits is in each with its path.
    const shown = timelineOf(p, map, () => null, true);
    expect(shown.lanes.map((l) => `${l.name}${l.empty ? '*' : ''}`)).toEqual([
      'Athens',
      'Sparta',
      'Sources*',
    ]);
    const athens2 = shown.lanes[0];
    expect(athens2.waiting.map((w) => [w.name, w.path.join('/')])).toEqual([['Athens', '']]);
    const sourcesLane = shown.lanes[2];
    expect(sourcesLane.waiting.map((w) => w.name)).toEqual(['Sources', 'Thucydides']);
    const herodotus = p.addChild(p.node(sourcesLane.waiting[1].id)!.id, { title: 'Histories' })!;
    const again = timelineOf(p, map, () => null, true).lanes[2];
    expect(again.waiting.find((w) => w.id === herodotus)!.path).toEqual(['Thucydides']);
  });

  it('stands what says nothing of its time within the nearest element over it that does', () => {
    const p = new Project(null);
    const map = p.createMap('Cities');
    const root = p.map(map)!.root;
    const athens = p.addChild(root, { title: 'Athens' })!;
    const war = p.addChild(athens, { title: 'The war' })!;
    const plague = p.addChild(war, { title: 'The plague' })!;
    const oration = p.addChild(plague, { title: 'The funeral oration' })!;
    const peace = p.addChild(war, { title: 'The peace' })!;
    const sources = p.addChild(athens, { title: 'Sources' })!;
    p.addChild(sources, { title: 'Thucydides' });
    p.setWhen(war, { start: { at: '431 BC' }, end: { at: '404 BC' } });
    p.setWhen(peace, { start: { at: '421 BC' } });
    const lane = timelineOf(p, map, () => null).lanes[0];
    // The writer placed the war and the peace; the plague, and the oration under
    // it, are implied within the war, in the order of the text, the oration with
    // its path. They are shown whether or not what waits is.
    expect(lane.events.map((e) => e.name)).toEqual(['The war', 'The peace']);
    expect(lane.implied.map((i) => [i.name, i.parent, i.path.join('/')])).toEqual([
      ['The plague', war, ''],
      ['The funeral oration', war, 'The plague'],
    ]);
    expect(lane.waiting).toEqual([]);
    // With what waits shown: the sources wait, nothing over them saying when it is; what is implied does not wait.
    const shown = timelineOf(p, map, () => null, true).lanes[0];
    expect(shown.waiting.map((w) => w.name)).toEqual(['Athens', 'Sources', 'Thucydides']);
    expect(shown.implied.map((i) => i.name)).toEqual(['The plague', 'The funeral oration']);
    // Once the lane's own element says when it is, the sources are implied within it, and nothing waits.
    p.setWhen(athens, { start: { at: '500 BC' }, end: { at: '300 BC' } });
    const own = timelineOf(p, map, () => null, true).lanes[0];
    expect(own.waiting).toEqual([]);
    expect(own.implied.map((i) => [i.name, i.parent === athens])).toEqual([
      ['The plague', false],
      ['The funeral oration', false],
      ['Sources', true],
      ['Thucydides', true],
    ]);
    expect(own.implied.find((i) => i.name === 'Thucydides')!.path).toEqual(['Sources']);
    // With Athens's children the lanes, Athens itself is in none. The sources
    // belong to a lane of their own, in which nothing is placed: they wait there
    // when what waits is shown, and are not implied elsewhere under Athens.
    p.setTimeline(map, { lanes: [{ element: athens, each: true }] });
    const each = timelineOf(p, map, () => null);
    expect(each.elsewhere.map((e) => e.name)).toEqual(['Athens']);
    expect(each.impliedElsewhere).toEqual([]);
    expect(each.lanes.map((l) => l.name)).toEqual(['The war']);
    const eachShown = timelineOf(p, map, () => null, true);
    expect(eachShown.lanes[1].waiting.map((w) => w.name)).toEqual(['Sources', 'Thucydides']);
    expect(eachShown.waitingElsewhere).toEqual([]);
    // With the war the one lane, the sources are in no lane: they stand within Athens, elsewhere.
    p.setTimeline(map, { lanes: [{ element: war }] });
    const one = timelineOf(p, map, () => null);
    expect(one.elsewhere.map((e) => e.name)).toEqual(['Athens']);
    expect(one.impliedElsewhere.map((i) => i.name)).toEqual(['Sources', 'Thucydides']);
    // The chronology lists only what the writer placed (and, as it stands, not
    // the lane's own element, whose placement is the span of the lane).
    const chronology = addChronology(p, map)!;
    const table = p.blocksOf(chronology).find((b) => b.kind === 'table');
    const rows = table && table.kind === 'table' ? table.rows.slice(1) : [];
    const what = rows.map((r) => {
      const cell = r[1].content[0];
      return cell.kind === 'paragraph'
        ? cell.content.map((i) => ('text' in i ? i.text : '')).join('')
        : '';
    });
    expect(what).toEqual(['Athens', 'The peace']);
    for (const name of ['The plague', 'The funeral oration', 'Sources', 'Thucydides'])
      expect(what).not.toContain(name);
  });

  it('says a placement in words', () => {
    const words = { after: 'after', before: 'before', during: 'during', to: 'to', approx: 'c.' };
    const name = (id: string) => ({ war: 'the war', peace: 'the peace' })[id] ?? id;
    expect(describeWhen({ start: { at: '431 BC', approx: true } }, name, words)).toBe('c. 431 BC');
    expect(describeWhen({ start: { at: '431 BC', margin: '5 years' } }, name, words)).toBe(
      '431 BC ± 5 years',
    );
    expect(describeWhen({ start: { after: 'peace', before: 'war' } }, name, words)).toBe(
      'after the peace, before the war',
    );
    expect(describeWhen({ start: { at: '431 BC' }, end: { during: 'war' } }, name, words)).toBe(
      '431 BC to during the war',
    );
  });
});
