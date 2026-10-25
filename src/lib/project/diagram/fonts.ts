/**
 * The fonts a picture of the diagram carries with it: of the faces the page
 * declares (`@font-face`, split by range of letters as the fonts that come
 * with the application are), those the words of the picture are set in,
 * each put into the file as it is, so that the picture looks the same
 * wherever it is opened.
 */

/** A face the page declares: a family, upright or italic, the letters it holds, where its file is. */
export interface Face {
  family: string;
  italic: boolean;
  /** As the rule says it: `200 900`. */
  weight: string;
  /** The ranges of letters it holds, as code points; nothing where it holds every letter. */
  ranges: [number, number][] | null;
  /** As the rule says it, for the face written into the picture. */
  range: string;
  url: string;
}

/** What is set in a family: whether in italics, and which letters. */
export interface Setting {
  /** The families asked for, in order, as the style names them. */
  families: string[];
  italic: boolean;
  text: string;
}

/** The ranges of a `unicode-range`: `U+0000-00FF, U+0131, U+1F??`. Nothing where it says none. */
export function parseRanges(said: string): [number, number][] | null {
  const out: [number, number][] = [];
  for (const part of said.split(',')) {
    const p = part.trim().replace(/^u\+/i, '');
    if (!p) continue;
    if (p.includes('?')) {
      out.push([parseInt(p.replace(/\?/g, '0'), 16), parseInt(p.replace(/\?/g, 'F'), 16)]);
    } else if (p.includes('-')) {
      const [a, b] = p.split('-');
      out.push([parseInt(a, 16), parseInt(b, 16)]);
    } else {
      const n = parseInt(p, 16);
      out.push([n, n]);
    }
  }
  const good = out.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  return good.length ? good : null;
}

/** The families of a `font-family`, without their quotes. */
export function familiesOf(said: string): string[] {
  return said
    .split(',')
    .map((f) => f.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

const holds = (face: Face, cp: number) =>
  !face.ranges || face.ranges.some(([a, b]) => cp >= a && cp <= b);

/**
 * The faces the settings need: for each, the first family asked for that
 * the page declares faces of, in the style of the setting, and of those the
 * faces that hold a letter of the text. A letter no face holds is left to
 * the families after, as the browser leaves it.
 */
export function facesFor(faces: Face[], settings: Setting[]): Face[] {
  const chosen = new Set<Face>();
  for (const s of settings) {
    const family = s.families.find((f) => faces.some((face) => face.family === f));
    if (!family) continue;
    const of = faces.filter((f) => f.family === family && f.italic === s.italic);
    for (const ch of s.text) {
      const cp = ch.codePointAt(0)!;
      if (/\s/.test(ch)) continue;
      const face = of.find((f) => holds(f, cp));
      if (face) chosen.add(face);
    }
  }
  return faces.filter((f) => chosen.has(f));
}

/** The faces the page declares, with their files where the page can fetch them. */
export function pageFaces(): Face[] {
  const out: Face[] = [];
  const walk = (rules: CSSRuleList, base: string) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule) {
        const style = rule.style;
        const url = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(style.getPropertyValue('src'))?.[1];
        const family = familiesOf(style.getPropertyValue('font-family'))[0];
        if (!url || !family) continue;
        let href: string;
        try {
          href = new URL(url, base).href;
        } catch {
          continue;
        }
        const range = style.getPropertyValue('unicode-range').trim();
        out.push({
          family,
          italic: /italic|oblique/.test(style.getPropertyValue('font-style')),
          weight: style.getPropertyValue('font-weight').trim() || 'normal',
          ranges: range ? parseRanges(range) : null,
          range,
          url: href,
        });
      } else if ('cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules, base);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    walk(rules, sheet.href ?? document.baseURI);
  }
  return out;
}
