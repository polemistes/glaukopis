import { describe, expect, it } from 'vitest';
import type { DocumentFormat } from '$lib/api/documents';
import { handStyle } from './hand';
import { sheetLook } from './sheet';

// The style sheet as it is written: the tests are given style sheets empty,
// so it is read from the tree, by Node, whose types the interface has not.
const node = 'node:';
const { readFileSync } = (await import(/* @vite-ignore */ `${node}fs`)) as {
  readFileSync(path: string, encoding: 'utf8'): string;
};
const css = readFileSync('src/app.css', 'utf8');

/** The tokens a block of the style sheet sets, by name. */
function tokens(css: string, selector: string): Map<string, string> {
  const at = css.indexOf(`\n${selector} {`);
  if (at < 0) throw new Error(`no ${selector} in the style sheet`);
  const block = css.slice(at, css.indexOf('\n}', at));
  const found = new Map<string, string>();
  for (const m of block.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)) found.set(m[1], m[2].trim());
  return found;
}

describe('the sheet of a box of rich text', () => {
  const light = tokens(css, ':root');
  const sheet = tokens(css, '.prose .rich');

  it('is drawn in the colours of the light scheme, whatever the scheme of the window', () => {
    expect(sheet.size).toBeGreaterThan(20);
    for (const [name, value] of sheet)
      expect(`${name}: ${value}`).toBe(`${name}: ${light.get(name)}`);
  });

  it('has every colour the dark scheme changes that a text is drawn with', () => {
    const dark = tokens(css, ":root[data-theme='dark']");
    // What is no part of a text on a sheet: the grounds around it, the shadows, the scrim.
    const around = /^--(canvas|desk|picture-ground|shadow|scrim)/;
    const missing = [...dark.keys()].filter((name) => !sheet.has(name) && !around.test(name));
    expect(missing).toEqual([]);
  });
});

describe('the look of the document on the sheet', () => {
  /** A layout, as far as the sheet reads one. */
  const format = (
    text: Partial<DocumentFormat['text']>,
    font = { family: 'EB Garamond', size: 12 },
  ) =>
    ({
      font,
      text: {
        lineSpacing: 1.5,
        align: 'justified',
        indent: '1cm',
        indentFirst: false,
        indentStep: '1cm',
        spaceBetween: '0pt',
        ...text,
      },
    }) as DocumentFormat;
  /** What a style says, by name. */
  const said = (style: string) =>
    new Map(
      style
        .split('; ')
        .filter(Boolean)
        .map((one) => [one.slice(0, one.indexOf(':')), one.slice(one.indexOf(':') + 2)] as const),
    );

  it('says nothing where the text is of no document', () => {
    expect(sheetLook(undefined)).toBe('');
  });

  it('says the font, the size of type, the line, the alignment, the indent and the space between', () => {
    const look = said(sheetLook(format({ spaceBetween: '6pt' })));
    expect(look.get('--hand-base')).toBe('12');
    expect(look.get('--sheet-font')).toBe('"EB Garamond", var(--font-editor, var(--font-text))');
    // One and a half of single spacing, which is 1.2 of the size of type.
    expect(look.get('--hand-single')).toBe('1.2');
    expect(look.get('--sheet-line')).toBe('1.8');
    expect(look.get('--sheet-align')).toBe('justify');
    // A centimetre in points.
    expect(look.get('--sheet-indent')).toBe('28.35');
    expect(look.get('--sheet-indent-first')).toBe('0');
    expect(look.get('--sheet-between')).toBe('6');
  });

  it('sets the first paragraph in too where the layout sets every one in', () => {
    const look = said(sheetLook(format({ indentFirst: true, indent: '12pt' })));
    expect(look.get('--sheet-indent-first')).toBe('12');
  });

  it('sets no first line in where the text is centred, as the typesetter does not', () => {
    const look = said(sheetLook(format({ align: 'center', indentFirst: true })));
    expect(look.get('--sheet-indent')).toBe('0');
    expect(look.get('--sheet-indent-first')).toBe('0');
  });

  it('lets no name of a font through that a style sheet could read as something else', () => {
    const look = sheetLook(format({}, { family: 'Evil"; color: red', size: 11 }));
    expect(look).toContain('--sheet-font: "Evil color: red",');
  });

  it('says how the two levels of heading under the element are set', () => {
    const level = (size: number, more: Record<string, unknown> = {}) => ({
      size,
      bold: true,
      italic: false,
      align: 'left',
      case: 'none',
      indent: false,
      spaceBefore: '24pt',
      spaceAfter: '6pt',
      ...more,
    });
    const laid = {
      ...format({ lineSpacing: 2, spaceBetween: '0pt' }),
      headings: {
        numbered: false,
        levels: [
          level(20, { align: 'center' }),
          level(16, { case: 'upper' }),
          level(13, { bold: false, italic: true, case: 'smallcaps', indent: true }),
        ],
      },
    } as unknown as DocumentFormat;
    // In the text of the document itself: the first level and the second.
    const top = said(sheetLook(laid, 0));
    expect(top.get('--sheet-h1-size')).toBe('20');
    expect(top.get('--sheet-h1-align')).toBe('center');
    expect(top.get('--sheet-h1-weight')).toBe('700');
    expect(top.get('--sheet-h2-size')).toBe('16');
    expect(top.get('--sheet-h2-transform')).toBe('uppercase');
    // Under an element of the first level: the second and the third.
    const under = said(sheetLook(laid, 1));
    expect(under.get('--sheet-h1-size')).toBe('16');
    expect(under.get('--sheet-h2-size')).toBe('13');
    expect(under.get('--sheet-h2-style')).toBe('italic');
    expect(under.get('--sheet-h2-weight')).toBe('400');
    expect(under.get('--sheet-h2-caps')).toBe('small-caps');
    // Set in as a paragraph is: a centimetre.
    expect(under.get('--sheet-h2-in')).toBe('28.35');
    // Deeper than the layout has levels: its last, for both.
    expect(said(sheetLook(laid, 7)).get('--sheet-h1-size')).toBe('13');
    // The room over a heading of 20 points in a text of 12 at double spacing: its
    // 24 points, of which the lines hold 8.4 (half of 16.8) and 2 (a tenth of 20).
    expect(top.get('--sheet-h1-before')).toBe('13.6');
    // Under it: its 6 points and the 14.4 that double spacing asks for, less the same.
    expect(top.get('--sheet-h1-after')).toBe('10');
  });

  it('draws a heading by its level, and what follows it as the first of a run', () => {
    expect(css).toContain('font-size: calc(var(--sheet-point) * var(--sheet-h1-size, 15.4));');
    expect(css).toContain('font-size: calc(var(--sheet-point) * var(--sheet-h2-size, 12.65));');
    expect(css).toContain('.prose .rich p[data-heading]:not([data-kind]) + p:not([data-kind]) {');
  });

  it('is drawn by the style sheet on the paragraphs of text of a sheet', () => {
    expect(css).toContain('font-family: var(--sheet-font, inherit);');
    expect(css).toContain('line-height: var(--sheet-line, inherit);');
    expect(css).toContain('text-indent: calc(var(--sheet-point) * var(--sheet-indent, 0));');
    expect(css).toContain('margin-top: var(--sheet-between-drawn, 0.62em);');
  });
});

describe('a paragraph that stands by hand, as it is drawn', () => {
  it('has its lines by the single spacing of the document, or of the editor where there is none', () => {
    expect(handStyle({ lineSpacing: 2 })).toBe('line-height: calc(var(--hand-single, 1.62) * 2)');
  });

  it('adds its space before and after to what stands between paragraphs', () => {
    const style = handStyle({ spaceBefore: '12pt', spaceAfter: '6pt' });
    expect(style).toContain('padding-top: calc(');
    expect(style).toContain('* 12)');
    expect(style).toContain('padding-bottom: calc(');
    expect(handStyle({ spaceBefore: '-6pt' })).toContain('margin-top: calc(');
  });

  it('begins with the rest where it is centred or set in, unless its first line was said', () => {
    expect(handStyle({ align: 'center' })).toBe('text-align: center; text-indent: 0');
    expect(handStyle({ indentLeft: '1cm' })).toContain('text-indent: 0');
    expect(handStyle({ align: 'justified' })).toBe('text-align: justify');
    const first = handStyle({ align: 'center', firstLine: '10pt' });
    expect(first).toContain('* 10)');
    expect(first).not.toContain('text-indent: 0');
  });

  it('says nothing where nothing is set', () => {
    expect(handStyle(null)).toBe('');
  });
});
