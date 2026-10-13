import { describe, expect, it } from 'vitest';
import type { DocumentFormat } from '$lib/api/documents';
import { changesBetween, countOf, laidOver, pathsOf, withoutPath } from './changes';
import layout from '../../../resources/formats/manuscript.json';

const manuscript = () => JSON.parse(JSON.stringify(layout)) as DocumentFormat;

describe('the changes of a document over its layout', () => {
  it('come back as they went: laid over the layout, and read from what that makes', () => {
    const layout = manuscript();
    const effective = laidOver(layout, {
      font: { family: 'EB Garamond' },
      page: { columns: 2 },
      kinds: { quote: { italic: true } },
    });
    expect(effective.font.family).toBe('EB Garamond');
    expect(effective.font.size).toBe(layout.font.size);
    expect(effective.page.columns).toBe(2);
    expect(effective.kinds?.quote?.italic).toBe(true);
    // The layout itself is not touched.
    expect(layout.font.family).not.toBe('EB Garamond');
    expect(changesBetween(layout, effective)).toEqual({
      font: { family: 'EB Garamond' },
      page: { columns: 2 },
      kinds: { quote: { italic: true } },
    });
    expect(changesBetween(layout, laidOver(layout, {}))).toEqual({});
  });

  it('take a list whole', () => {
    const layout = manuscript();
    const levels = layout.headings.levels.slice(0, 1).map((l) => ({ ...l, bold: !l.bold }));
    const effective = laidOver(layout, { headings: { levels } });
    expect(effective.headings.levels).toEqual(levels);
    expect(pathsOf({ headings: { levels } })).toEqual(['headings.levels']);
    expect(changesBetween(layout, effective)).toEqual({ headings: { levels } });
  });

  it('leave unsaid what the layout says of a kind, by a change that is nothing', () => {
    const layout = laidOver(manuscript(), { kinds: { epigraph: { italic: true, size: 10 } } });
    const effective = JSON.parse(JSON.stringify(layout)) as DocumentFormat;
    delete effective.kinds!.epigraph.italic;
    const changes = changesBetween(layout, effective);
    expect(changes).toEqual({ kinds: { epigraph: { italic: null } } });
    expect(laidOver(layout, changes).kinds?.epigraph).toEqual({ size: 10 });
  });

  it('never hold what names a layout or what it brings', () => {
    const layout = manuscript();
    const other = { ...laidOver(layout, {}), name: 'Another', style: 'apa', lineNumbers: true };
    expect(changesBetween(layout, other)).toEqual({});
  });

  it('give every path, kinds within kinds as well', () => {
    const changes = {
      font: { family: 'X', size: 11 },
      kinds: { quote: { italic: true }, scene: { bold: false } },
    };
    expect(pathsOf(changes)).toEqual([
      'font.family',
      'font.size',
      'kinds.quote.italic',
      'kinds.scene.bold',
    ]);
    expect(countOf(changes)).toBe(4);
  });

  it('lose a path, and the objects above it left empty', () => {
    const changes = { font: { family: 'X' }, kinds: { quote: { italic: true } } };
    expect(withoutPath(changes, 'kinds.quote.italic')).toEqual({ font: { family: 'X' } });
    expect(withoutPath(changes, 'font.family')).toEqual({ kinds: { quote: { italic: true } } });
    expect(withoutPath(changes, 'page.size')).toEqual(changes);
    // The changes given are not touched.
    expect(changes.font.family).toBe('X');
  });
});
