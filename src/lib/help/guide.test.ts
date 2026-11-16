import { describe, expect, it } from 'vitest';
import source from '/docs/guide.md?raw';
import {
  chapterHtml,
  findInGuide,
  foldMapped,
  hitsIn,
  lineAround,
  loadGuide,
  partByTitle,
  queryWords,
  readGuide,
} from './guide';

const SMALL = `# A guide

What comes first.

## The idea

You make a **map**.

### Notes

A note under the idea.

#### Smaller

Still the notes.

## The text

### Notes

Notes again, of the text: Pelée.
`;

describe('the guide in chapters', () => {
  it('makes a chapter of each ## heading, and a first one of what stands before them, named by the # heading', () => {
    const guide = readGuide(SMALL);
    expect(guide.chapters.map((c) => c.title)).toEqual(['A guide', 'The idea', 'The text']);
    expect(guide.chapters.map((c) => c.id)).toEqual(['a-guide', 'the-idea', 'the-text']);
  });

  it('makes a part of the beginning of each chapter and of each ### heading, with ids of their own', () => {
    const guide = readGuide(SMALL);
    const idea = guide.chapters[1];
    expect(idea.parts.map((p) => [p.id, p.title])).toEqual([
      ['the-idea', 'The idea'],
      ['notes', 'Notes'],
    ]);
    expect(idea.parts[1].text).toBe('A note under the idea. Smaller Still the notes.');
    expect(guide.chapters[2].parts[1].id).toBe('notes-2');
  });

  it('writes a chapter with its name as h2, its parts as h3, and what is lower as h4', () => {
    const html = chapterHtml(readGuide(SMALL).chapters[1]);
    expect(html).toBe(
      [
        '<h2 data-help-heading="the-idea">The idea</h2>',
        '<p>You make a <strong>map</strong>.</p>',
        '<h3 data-help-heading="notes">Notes</h3>',
        '<p>A note under the idea.</p>',
        '<h4>Smaller</h4>',
        '<p>Still the notes.</p>',
      ].join('\n'),
    );
  });

  it('finds the part a heading names', () => {
    const guide = readGuide(SMALL);
    const found = partByTitle(guide, 'Notes');
    expect(found?.chapter.id).toBe('the-idea');
    expect(found?.part.id).toBe('notes');
    expect(partByTitle(guide, 'Nowhere')).toBeNull();
  });

  it('reads the whole guide, the first chapter named by its title', async () => {
    const guide = await loadGuide();
    expect(guide.chapters[0].title).toBe('A guide to Glaukopis');
    expect(guide.chapters.length).toBeGreaterThan(30);
    expect(guide.chapters.map((c) => c.title)).toContain('The notebook');
    expect(new Set(guide.chapters.flatMap((c) => c.parts.map((p) => p.id))).size).toBe(
      guide.chapters.reduce((n, c) => n + c.parts.length, 0),
    );
  });
});

describe('finding in the guide', () => {
  it('folds letters as the library does, and knows where each folded sign came from', () => {
    const mapped = foldMapped('Pelée, Straße!');
    expect(mapped.text).toBe('pelee  strasse ');
    expect(mapped.from[3]).toBe(3);
    expect([mapped.from[12], mapped.to[12]]).toEqual([11, 12]);
    expect(queryWords('  Pelée STRASSE ')).toEqual(['pelee', 'strasse']);
  });

  it('finds the words at the beginnings of words, as stretches of the text as it is', () => {
    expect(hitsIn('The plugin for Firefox, and plugins.', ['plugin', 'fire'])).toEqual([
      [4, 10],
      [15, 19],
      [28, 34],
    ]);
    expect(hitsIn('unplugged', ['plug'])).toEqual([]);
    expect(hitsIn('Pelée', ['pelee'])).toEqual([[0, 5]]);
  });

  it('gives the parts whose words hold every word, with their chapter and a line around the first', () => {
    const guide = readGuide(SMALL);
    const found = findInGuide(guide, 'notes pelee');
    expect(found.map((f) => [f.chapter.title, f.part.id])).toEqual([['The text', 'notes-2']]);
    expect(found[0]).toMatchObject({
      before: '',
      hit: 'Notes',
      after: ' again, of the text: Pelée.',
    });
    expect(findInGuide(guide, 'note').map((f) => f.part.id)).toEqual(['notes', 'notes-2']);
    expect(findInGuide(guide, '   ')).toEqual([]);
  });

  it('cuts the line around a hit at words', () => {
    const text =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty';
    const line = lineAround(text, ['eleven']);
    expect(line.hit).toBe('eleven');
    expect(line.before.startsWith('…')).toBe(true);
    expect(line.before.endsWith('ten ')).toBe(true);
    expect(line.after.endsWith('…')).toBe(true);
    expect(text).toContain(line.before.slice(1) + line.hit + line.after.slice(0, -1));
  });

  it('finds the plugin for Firefox under the notebook', () => {
    const guide = readGuide(source);
    const found = findInGuide(guide, 'plugin Firefox');
    expect(found.some((f) => f.chapter.title === 'The notebook')).toBe(true);
  });
});
