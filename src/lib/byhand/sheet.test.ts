import { describe, expect, it } from 'vitest';

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
