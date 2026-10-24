import { describe, expect, it } from 'vitest';
import type { DocumentFormat } from '$lib/api/documents';
import { changesBetween, countOf, laidOver, modernised, pathsOf, withoutPath } from './changes';
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

  it('read the choice of an older document between the indent and the space as the other length made nought', () => {
    const layout = manuscript();
    const old = (paragraphs: string, more: object = {}) =>
      ({ text: { paragraphs, ...more } }) as never;
    // Spaced: no indent; the space as the layout has it.
    const spaced = laidOver(layout, old('spaced', { spaceBetween: '6pt' }));
    expect([spaced.text.indent, spaced.text.spaceBetween]).toEqual(['0cm', '6pt']);
    expect('paragraphs' in spaced.text).toBe(false);
    // Indented: no space, though the layout had one.
    const roomy = { ...layout, text: { ...layout.text, spaceBetween: '12pt' } };
    expect(laidOver(roomy, old('indent')).text.spaceBetween).toBe('0pt');
    expect(laidOver(roomy, old('indent')).text.indent).toBe(layout.text.indent);
    // What the document says of the other length itself is kept.
    expect(modernised(old('spaced', { indent: '2cm' }))).toEqual({ text: { indent: '2cm' } });
    // Not written again: what is written is what differs, the lengths.
    expect(changesBetween(layout, spaced)).toEqual({
      text: { indent: '0cm', spaceBetween: '6pt' },
    });
    // Changes without it are read as they are.
    const plain = { font: { size: 11 } };
    expect(modernised(plain)).toBe(plain);
  });

  it('take a list whole', () => {
    const layout = manuscript();
    const levels = layout.headings.levels.slice(0, 1).map((l) => ({ ...l, bold: !l.bold }));
    const effective = laidOver(layout, { headings: { levels } });
    expect(effective.headings.levels).toEqual(levels);
    expect(pathsOf({ headings: { levels } })).toEqual(['headings.levels']);
    expect(changesBetween(layout, effective)).toEqual({ headings: { levels } });
  });

  it('take the places of the header and the footer whole', () => {
    const layout = manuscript();
    const effective = laidOver(layout, {
      header: { shown: true, left: [{ kind: 'author' }, { kind: 'title' }] },
    });
    expect(effective.header.left).toEqual([{ kind: 'author' }, { kind: 'title' }]);
    expect(effective.header.right).toEqual(layout.header.right);
    expect(pathsOf(changesBetween(layout, effective))).toEqual(['header.shown', 'header.left']);
  });

  it('pass over changes made under the names the margins had before', () => {
    const layout = manuscript();
    const old = {
      pageNumbers: { show: false },
      runningHead: { content: 'title' },
      font: { size: 13 },
    } as never;
    const effective = laidOver(layout, old);
    expect(effective.font.size).toBe(13);
    expect(effective.footer).toEqual(layout.footer);
    expect('pageNumbers' in effective).toBe(false);
    expect(pathsOf(old)).toEqual(['font.size']);
    expect(countOf(old)).toBe(1);
  });

  it('read levels taken whole before they said where they begin', () => {
    const layout = manuscript();
    const { begins: _b, numbering: _n, ...before } = layout.headings.levels[0];
    const levels = [{ ...before, newPage: true }] as never;
    const level = laidOver(layout, { headings: { levels } }).headings.levels[0];
    expect(level.begins).toBe('page');
    expect(level.numbering).toBe('as-above');
    expect('newPage' in level).toBe(false);
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
