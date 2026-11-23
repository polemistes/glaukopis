/**
 * Where a style says `:hover` outside `@media (hover: hover)`: what is shown
 * under a pointer, shown where there is none. A touch screen leaves the last
 * thing tapped as if the pointer stayed over it, and a tool turned off again
 * looked on (record 0121). The phone's page draws nothing that does so
 * (`hover.test.ts`).
 */

/** The scrollbar's thumb under the pointer, which a finger never brings. */
const PASSED = /::-webkit-scrollbar[\w-]*:hover/g;

/** The style of a Svelte file (its `<style>` blocks), or a stylesheet as it is. */
export function styleOf(source: string, file: string): string {
  if (!file.endsWith('.svelte')) return source;
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
}

/** The selectors with `:hover` that stand outside a block for a pointer that hovers, each with its line. */
export function hoverOutside(css: string): { line: number; selector: string }[] {
  const found: { line: number; selector: string }[] = [];
  // What each open brace began: whether it is a block for a pointer that hovers.
  const open: boolean[] = [];
  let prelude = '';
  let preludeAt = 0;
  let line = 1;
  let i = 0;
  while (i < css.length) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const skipped = css.slice(i, end < 0 ? css.length : end + 2);
      line += (skipped.match(/\n/g) ?? []).length;
      i += skipped.length;
      continue;
    }
    if (c === '\n') line++;
    if (c === '{') {
      const text = prelude.trim();
      const hovering = /^@media\b[^{]*\(\s*hover\s*:\s*hover\s*\)/.test(text);
      const inside = open.includes(true);
      if (!text.startsWith('@') && !inside && text.replace(PASSED, '').includes(':hover'))
        found.push({ line: preludeAt, selector: text.replace(/\s+/g, ' ') });
      open.push(hovering);
      prelude = '';
    } else if (c === '}') {
      open.pop();
      prelude = '';
    } else if (c === ';') {
      prelude = '';
    } else {
      if (!prelude.trim()) preludeAt = line;
      prelude += c;
    }
    i++;
  }
  return found;
}
