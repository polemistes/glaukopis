import { describe, expect, it } from 'vitest';
import { pageElements, paperOf, printStyle, PRINT_PAGES_ID, svgSize } from './pages';

describe('the pages laid into the page for printing', () => {
  it("print on the first page's paper, with no margins, and are never shown on the screen", () => {
    const paper = paperOf([
      { width: 595.28, height: 841.89 },
      { width: 841.89, height: 595.28 },
    ]);
    expect(paper).toEqual([595.28, 841.89]);
    const style = printStyle(paper);
    expect(style).toContain('@page { size: 595.28pt 841.89pt; margin: 0; }');
    // A sheet a fraction taller than the paper would leave an empty sheet after every page.
    expect(style).toContain('.page { width: 595.28pt; height: 840.89pt;');
    expect(style).toContain(`#${PRINT_PAGES_ID} { display: none; }`);
    expect(style).toContain(`body > :not(#${PRINT_PAGES_ID}) { display: none !important; }`);
    // Each page after the first begins a sheet of its own, and no empty sheet follows the last.
    expect(style).toContain('.page + .page { break-before: page;');
    expect(style).not.toContain('break-after');
  });

  it('take A4 where nothing is said of the size', () => {
    expect(printStyle(paperOf([]))).toContain('size: 595.28pt 841.89pt');
  });

  it('give each page its own size where it fits, and fit a larger one into the paper', () => {
    const [first, second, third] = pageElements(
      [
        { url: 'blob:one', width: 595.28, height: 841.89 },
        { url: 'blob:two', width: 300, height: 400.123 },
        { url: 'blob:three', width: 841.89, height: 595.28 },
      ],
      [595.28, 841.89],
    );
    expect(first.className).toBe('page');
    // The page of the paper's size is printed at its size, not shrunk by the point the sheet lacks.
    expect(first.querySelector('img')!.style.height).toBe('841.89pt');
    const img = second.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('blob:two');
    expect(img.style.width).toBe('300pt');
    expect(img.style.height).toBe('400.12pt');
    // A page turned on its side is made as wide as the paper, keeping its proportions.
    const turned = third.querySelector('img')!;
    expect(turned.style.width).toBe('595.28pt');
    expect(turned.style.height).toBe('420.91pt');
  });
});

describe('the size of a page drawn as SVG', () => {
  it('is read from the viewBox, in points', () => {
    expect(
      svgSize(
        '<svg class="typst-doc" viewBox="0 0 595.2755905511812 841.8897637795276" width="595.27pt" height="841.89pt">',
      ),
    ).toEqual([595.2755905511812, 841.8897637795276]);
  });

  it('is nothing where there is no viewBox, or an empty one', () => {
    expect(svgSize('<svg width="10pt">')).toBeNull();
    expect(svgSize('<svg viewBox="0 0 0 10">')).toBeNull();
  });
});
