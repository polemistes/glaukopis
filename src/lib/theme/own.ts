/**
 * A colouring of the writer's own: four colours chosen, paper, ink, the
 * accent and the second voice, and every token of the design system
 * derived from them, as the themes that come with the application set
 * them by hand. Whether the scheme is light or dark follows from the paper.
 */

export interface OwnTheme {
  paper: string;
  ink: string;
  accent: string;
  gold: string;
}

/** Where a scheme of one's own begins: the colours of the themes that come with the application. */
export const STARTS: Record<'light' | 'dark' | 'mellow', OwnTheme> = {
  light: { paper: '#fbfaf7', ink: '#1f2528', accent: '#3f7174', gold: '#b9832a' },
  dark: { paper: '#171b1d', ink: '#e7e9e6', accent: '#7fb5b1', gold: '#dcae5c' },
  mellow: { paper: '#f7f2ea', ink: '#3b3a45', accent: '#56807a', gold: '#b57f49' },
};

type Rgb = [number, number, number];

export function rgbOf(hex: string): Rgb {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function hexOf([r, g, b]: Rgb): string {
  return (
    '#' +
    [r, g, b]
      .map((c) =>
        Math.round(Math.max(0, Math.min(255, c)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/** `a` with `share` of `b` mixed in, in sRGB. */
export function mix(a: string, b: string, share: number): string {
  const x = rgbOf(a);
  const y = rgbOf(b);
  return hexOf([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * share) as Rgb);
}

function alpha(hex: string, a: number): string {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** The relative luminance of a colour, 0 for black and 1 for white (WCAG). */
export function luminance(hex: string): number {
  const [r, g, b] = rgbOf(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The contrast between two colours, 1 to 21 (WCAG). */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Whether the scheme is dark: its paper is. */
export function isDark(own: OwnTheme): boolean {
  return luminance(own.paper) < 0.4;
}

/** Every token of the design system, derived from the four colours. */
export function derive(own: OwnTheme): Record<string, string> {
  const dark = isDark(own);
  const { paper, ink, accent, gold } = own;
  const white = '#ffffff';
  const black = '#000000';
  const danger = dark ? '#e0806f' : '#b0412f';
  const ok = dark ? '#8fbf8c' : '#4b7a4a';
  const warn = dark ? '#dcae5c' : '#a8741a';
  return {
    '--paper': paper,
    '--paper-raised': dark ? mix(paper, white, 0.05) : mix(paper, white, 0.6),
    '--paper-sunken': dark ? mix(paper, black, 0.12) : mix(paper, ink, 0.04),
    '--paper-hover': dark ? mix(paper, white, 0.06) : mix(paper, ink, 0.07),
    '--canvas': dark ? mix(paper, black, 0.06) : mix(paper, ink, 0.02),
    '--desk': dark ? mix(paper, black, 0.1) : mix(paper, ink, 0.05),
    '--ink': ink,
    '--ink-2': mix(ink, paper, 0.25),
    '--ink-3': mix(ink, paper, 0.4),
    '--ink-4': mix(ink, paper, 0.55),
    '--line': mix(paper, ink, 0.12),
    '--line-strong': mix(paper, ink, 0.22),
    '--accent': accent,
    '--accent-strong': dark ? mix(accent, white, 0.2) : mix(accent, black, 0.2),
    '--accent-soft': mix(paper, accent, dark ? 0.22 : 0.18),
    '--accent-softer': mix(paper, accent, dark ? 0.11 : 0.09),
    '--accent-ink': luminance(accent) > 0.45 ? mix(accent, black, 0.78) : white,
    '--gold': gold,
    '--gold-soft': mix(paper, gold, dark ? 0.25 : 0.2),
    '--highlight': alpha(gold, dark ? 0.32 : 0.45),
    '--danger': danger,
    '--danger-soft': mix(paper, danger, 0.15),
    '--ok': ok,
    '--ok-soft': mix(paper, ok, 0.15),
    '--warn': warn,
    '--picture-ground': dark ? '#b3b8b6' : mix(paper, ink, 0.04),
    '--picture-ground-2': dark ? '#a7acaa' : mix(paper, ink, 0.09),
    '--selection': alpha(accent, dark ? 0.28 : 0.24),
    '--focus-ring': alpha(accent, 0.5),
    '--scrim': alpha(ink, dark ? 0.5 : 0.32),
    '--shadow-1': dark
      ? '0 1px 2px rgba(0, 0, 0, 0.3)'
      : `0 1px 2px ${alpha(ink, 0.06)}, 0 1px 1px ${alpha(ink, 0.04)}`,
    '--shadow-2': dark
      ? '0 4px 14px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.3)'
      : `0 4px 14px ${alpha(ink, 0.08)}, 0 1px 3px ${alpha(ink, 0.06)}`,
    '--shadow-3': dark
      ? '0 18px 50px rgba(0, 0, 0, 0.55), 0 4px 12px rgba(0, 0, 0, 0.35)'
      : `0 18px 50px ${alpha(ink, 0.18)}, 0 4px 12px ${alpha(ink, 0.08)}`,
  };
}

/** Lays the derived tokens on the root, for the theme "own"; `clearOwn` takes them away. */
export function applyOwn(own: OwnTheme, root: HTMLElement = document.documentElement) {
  const tokens = derive(own);
  for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
  root.style.colorScheme = isDark(own) ? 'dark' : 'light';
}

export function clearOwn(root: HTMLElement = document.documentElement) {
  for (const name of Object.keys(derive(STARTS.light))) root.style.removeProperty(name);
  root.style.removeProperty('color-scheme');
}

/** What is said of a scheme: whether its ink reads well on its paper, and its accent is seen on it. */
export function judge(own: OwnTheme): { ink: number; accent: number; fine: boolean } {
  const ink = contrast(own.ink, own.paper);
  const accent = contrast(own.accent, own.paper);
  return { ink, accent, fine: ink >= 4.5 && accent >= 3 };
}
