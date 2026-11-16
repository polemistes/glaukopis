import { describe, expect, it } from 'vitest';
import {
  activeFilters,
  applyFilters,
  cameFrom,
  dayKey,
  daySpan,
  linkedNotes,
  noFilters,
  parseDay,
  passes,
  type FilterContext,
  type NoteFilters,
} from './filters';
import { Notebook } from './model/notebook.svelte';
import type { NoteRecord, Source } from './model/types';

const HASH = 'a'.repeat(64);
const PDF = 'b'.repeat(64);

/** A note as the notebook reads it, with what is given. */
function note(id: string, over: Partial<NoteRecord> = {}): NoteRecord {
  return {
    id,
    name: '',
    made: '2026-11-10T12:00:00.000Z',
    pieces: [],
    words: '',
    begins: '',
    holds: { own: true, passages: false, pictures: false, files: false, links: false },
    sources: [],
    picture: null,
    went: [],
    box: 'first',
    at: null,
    width: null,
    height: null,
    tags: [],
    seen: true,
    ...over,
  };
}

const sorts: Record<string, Source['sort']> = { w: 'web', r: 'reference', f: 'file', o: 'words' };
const ctx = (over: Partial<FilterContext> = {}): FilterContext => ({
  sortOf: (id) => sorts[id],
  linked: new Set(),
  ...over,
});
const only = (f: Partial<NoteFilters>): NoteFilters => ({ ...noFilters, ...f });

describe('how many filters are on', () => {
  it('counts what is held, the days and where it came from each as one', () => {
    expect(activeFilters(noFilters)).toBe(0);
    expect(activeFilters(only({ holds: ['pictures', 'files'] }))).toBe(1);
    expect(activeFilters(only({ from: '2026-01-01' }))).toBe(1);
    expect(activeFilters(only({ from: '2026-01-01', to: '2026-02-01' }))).toBe(1);
    expect(activeFilters(only({ came: ['web', 'none'] }))).toBe(1);
    expect(activeFilters(only({ unseen: true, use: 'used' }))).toBe(2);
    expect(
      activeFilters({
        holds: ['links'],
        from: null,
        to: '2026-01-01',
        came: ['file'],
        unseen: true,
        use: 'unused',
      }),
    ).toBe(5);
  });
});

describe('days', () => {
  it('reads a year, a month or a day as its first day, or its last', () => {
    expect(parseDay('2026')).toBe('2026-01-01');
    expect(parseDay('2026', true)).toBe('2026-12-31');
    expect(parseDay('2026-2')).toBe('2026-02-01');
    expect(parseDay('2026-02', true)).toBe('2026-02-28');
    expect(parseDay('2024-02', true)).toBe('2024-02-29');
    expect(parseDay(' 2026-11-16 ')).toBe('2026-11-16');
    expect(parseDay('2026.11.16', true)).toBe('2026-11-16');
  });

  it('reads nothing of what is no day', () => {
    expect(parseDay('')).toBeNull();
    expect(parseDay('soon')).toBeNull();
    expect(parseDay('2026-13')).toBeNull();
    expect(parseDay('2026-02-30')).toBeNull();
    expect(parseDay('26')).toBeNull();
  });

  it('gives the day of a time on this computer, and the first and last of notes', () => {
    const at = new Date(2026, 10, 16, 23, 30).toISOString();
    expect(dayKey(at)).toBe('2026-11-16');
    expect(dayKey('')).toBe('');
    expect(
      daySpan([
        note('a', { made: new Date(2026, 3, 2, 12).toISOString() }),
        note('b', { made: new Date(2025, 0, 9, 12).toISOString() }),
        note('c', { made: new Date(2026, 10, 1, 12).toISOString() }),
      ]),
    ).toEqual(['2025-01-09', '2026-11-01']);
    expect(daySpan([])).toBeNull();
  });
});

describe('what passes', () => {
  it('passes everything with no filter on', () => {
    const notes = [note('a'), note('b', { seen: false })];
    expect(applyFilters(notes, noFilters, ctx())).toBe(notes);
  });

  it('asks a note to hold every one of what is ticked', () => {
    const both = note('a', {
      holds: { own: false, passages: true, pictures: true, files: false, links: false },
    });
    const picture = note('b', {
      holds: { own: false, passages: false, pictures: true, files: false, links: false },
    });
    const file = note('c', {
      holds: { own: false, passages: false, pictures: false, files: true, links: false },
    });
    const notes = [both, picture, file];
    expect(applyFilters(notes, only({ holds: ['pictures'] }), ctx()).map((n) => n.id)).toEqual([
      'a',
      'b',
    ]);
    expect(
      applyFilters(notes, only({ holds: ['pictures', 'passages'] }), ctx()).map((n) => n.id),
    ).toEqual(['a']);
    expect(applyFilters(notes, only({ holds: ['files'] }), ctx()).map((n) => n.id)).toEqual(['c']);
  });

  it('takes a link to be one between notes, not one in the text', () => {
    const linkedInText = note('a', {
      holds: { own: true, passages: false, pictures: false, files: false, links: true },
    });
    const linked = note('b');
    const f = only({ holds: ['links'] });
    const c = ctx({ linked: linkedNotes([{ from: 'b', to: 'z' }]) });
    expect(passes(linkedInText, f, c)).toBe(false);
    expect(passes(linked, f, c)).toBe(true);
    expect([...linkedNotes([{ from: 'x', to: 'y' }])].sort()).toEqual(['x', 'y']);
  });

  it('lets through the days asked for, both ends with them', () => {
    const at = (d: number) => note(`n${d}`, { made: new Date(2026, 10, d, 9).toISOString() });
    const notes = [at(1), at(10), at(20), note('none', { made: '' })];
    const f = only({ from: '2026-11-10', to: '2026-11-20' });
    expect(applyFilters(notes, f, ctx()).map((n) => n.id)).toEqual(['n10', 'n20']);
    expect(applyFilters(notes, only({ to: '2026-11-09' }), ctx()).map((n) => n.id)).toEqual(['n1']);
  });

  it('asks where a note came from any one of what is ticked', () => {
    const web = note('web', { sources: ['w'] });
    const ref = note('ref', { sources: ['r', 'w'] });
    const file = note('file', { sources: ['f'] });
    const other = note('other', { sources: ['o'] });
    const unsourced = note('unsourced', { sources: [null] });
    const own = note('own', { sources: [] });
    const notes = [web, ref, file, other, unsourced, own];
    const ids = (f: NoteFilters) => applyFilters(notes, f, ctx()).map((n) => n.id);
    expect(ids(only({ came: ['web'] }))).toEqual(['web', 'ref']);
    expect(ids(only({ came: ['reference', 'file'] }))).toEqual(['ref', 'file']);
    expect(ids(only({ came: ['words'] }))).toEqual(['other']);
    expect(ids(only({ came: ['none'] }))).toEqual(['unsourced', 'own']);
    expect([...cameFrom(note('mixed', { sources: ['w', null] }), ctx().sortOf)]).toEqual([
      'web',
      'none',
    ]);
    // A source that is gone is none.
    expect([...cameFrom(note('gone', { sources: ['x'] }), ctx().sortOf)]).toEqual(['none']);
  });

  it('shows the notes not looked at, and keeps those looked at since the filters changed', () => {
    const seen = note('seen');
    const fresh = note('fresh', { seen: false });
    const f = only({ unseen: true });
    expect(applyFilters([seen, fresh], f, ctx()).map((n) => n.id)).toEqual(['fresh']);
    expect(
      applyFilters([seen, fresh], f, ctx({ lookedNow: new Set(['seen']) })).map((n) => n.id),
    ).toEqual(['seen', 'fresh']);
  });

  it('tells used notes from those not used', () => {
    const used = note('used', { went: [{ what: 'text', when: '2026-11-11T00:00:00Z' }] });
    const unused = note('unused');
    expect(applyFilters([used, unused], only({ use: 'used' }), ctx()).map((n) => n.id)).toEqual([
      'used',
    ]);
    expect(applyFilters([used, unused], only({ use: 'unused' }), ctx()).map((n) => n.id)).toEqual([
      'unused',
    ]);
  });

  it('holds with the notes of a notebook as it reads them', () => {
    const nb = new Notebook();
    const pictured = nb.addNote({ seen: false });
    nb.addFigure(pictured, { hash: HASH, name: 'owl.png', extension: 'png' });
    nb.holdFile(
      { hash: HASH, name: 'owl.png', extension: 'png' },
      nb.addSource({ sort: 'file', name: 'owl.png' }),
    );
    const filed = nb.addNote();
    nb.addFile(filed, { hash: PDF, name: 'letter.pdf', extension: 'pdf' });
    const written = nb.addNote();
    nb.addText(written, 'Own words');
    const c: FilterContext = {
      sortOf: (id) => nb.sources.get(id)?.sort,
      linked: linkedNotes(nb.links),
    };
    const ids = (f: NoteFilters) => applyFilters(nb.list, f, c).map((n) => n.id);
    expect(ids(only({ holds: ['pictures'] }))).toEqual([pictured]);
    expect(ids(only({ holds: ['files'] }))).toEqual([filed]);
    expect(ids(only({ came: ['file'] }))).toEqual([pictured]);
    expect(ids(only({ unseen: true }))).toEqual([pictured]);
    expect(ids(only({ came: ['none'] })).sort()).toEqual([filed, written].sort());
  });
});
