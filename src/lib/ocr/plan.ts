/**
 * The plan of the pages of a PDF, as the workbench of a reading keeps it:
 * for each page, where its text comes from (the text the PDF has, or what
 * Tesseract reads) and what Tesseract reads it with. Pages are counted from
 * one; a list of pages that is empty stands for every page. The stretches
 * of the core are what falls out of the plan: pages in a row with the same
 * settings (`runsOf`), from which a reading is asked (`askedOf`).
 */

import type { Asked, Layout, Stretch, Verdict } from '$lib/api/ocr';

/** Where a page's text comes from: the text the PDF has, or what Tesseract reads. */
export type Source = 'pdf' | 'read';

/** What Tesseract reads a page with. */
export interface PageSettings {
  /** Tesseract's names of the languages, the likeliest first. */
  languages: string[];
  /** The dots to the inch the page is drawn at; 0 for 300. */
  dpi: number;
  layout: Layout;
  /** Whether the picture is made black and white before it is read. */
  contrast: boolean;
}

/** A page's source and settings. */
export interface PagePlan extends PageSettings {
  source: Source;
}

/** A run of pages in a row with the same settings, counted from one, both ends in. */
export interface Run {
  from: number;
  to: number;
  settings: PageSettings;
}

/** The settings alone, with a list of languages of their own. */
function settingsOf(page: PageSettings): PageSettings {
  return {
    languages: [...page.languages],
    dpi: page.dpi,
    layout: page.layout,
    contrast: page.contrast,
  };
}

/**
 * The indexes (counted from nought) of the pages given, counted from one,
 * those that are not pages of the plan left out; every page where none are
 * given.
 */
function indexesOf(plan: PagePlan[], pages: number[]): Set<number> {
  if (!pages.length) return new Set(plan.keys());
  const out = new Set<number>();
  for (const page of pages)
    if (Number.isInteger(page) && page >= 1 && page <= plan.length) out.add(page - 1);
  return out;
}

/** The plan at first: `source` for the pages whose verdict is not none, `read` for the rest, all with `settings`. */
export function firstPlan(verdicts: Verdict[], settings: PageSettings, source: Source): PagePlan[] {
  return verdicts.map((verdict) => ({
    ...settingsOf(settings),
    source: verdict === 'none' ? 'read' : source,
  }));
}

/** The plan with `change` laid on the pages given (counted from one; every page where none are). */
export function withSettings(
  plan: PagePlan[],
  pages: number[],
  change: Partial<PageSettings>,
): PagePlan[] {
  const at = indexesOf(plan, pages);
  return plan.map((page, i) =>
    at.has(i)
      ? {
          source: page.source,
          languages: [...(change.languages ?? page.languages)],
          dpi: change.dpi ?? page.dpi,
          layout: change.layout ?? page.layout,
          contrast: change.contrast ?? page.contrast,
        }
      : page,
  );
}

/** The plan with the source of the pages given set; `pdf` is not laid on a page whose verdict is none. */
export function withSource(
  plan: PagePlan[],
  pages: number[],
  source: Source,
  verdicts: Verdict[],
): PagePlan[] {
  const at = indexesOf(plan, pages);
  return plan.map((page, i) =>
    at.has(i) && page.source !== source && (source === 'read' || hasText(verdicts[i]))
      ? { ...page, source }
      : page,
  );
}

/** Whether a page has text to take: its verdict is not none, nor unknown. */
function hasText(verdict: Verdict | undefined): boolean {
  return verdict === 'sound' || verdict === 'poor';
}

/** The pages given decided by their verdicts: sound takes the PDF's text, the rest are read. */
export function decided(plan: PagePlan[], pages: number[], verdicts: Verdict[]): PagePlan[] {
  const at = indexesOf(plan, pages);
  return plan.map((page, i) => {
    if (!at.has(i)) return page;
    const source: Source = verdicts[i] === 'sound' ? 'pdf' : 'read';
    return page.source === source ? page : { ...page, source };
  });
}

/** The resolution as it is read: 0 is 300. */
const dotsOf = (dpi: number) => (dpi === 0 ? 300 : dpi);

/** Whether two settings are the same; 0 and 300 dots are the same resolution. */
export function sameSettings(a: PageSettings, b: PageSettings): boolean {
  return (
    dotsOf(a.dpi) === dotsOf(b.dpi) &&
    a.layout === b.layout &&
    a.contrast === b.contrast &&
    a.languages.length === b.languages.length &&
    a.languages.every((code, i) => code === b.languages[i])
  );
}

/** The runs of pages in a row with the same settings, in the order of the pages. */
export function runsOf(plan: PagePlan[]): Run[] {
  const runs: Run[] = [];
  plan.forEach((page, i) => {
    const last = runs.at(-1);
    if (last && sameSettings(last.settings, page)) last.to = i + 1;
    else runs.push({ from: i + 1, to: i + 1, settings: settingsOf(page) });
  });
  return runs;
}

/** Settings where nothing says otherwise: no language (the core reads English), 300 dots, as Tesseract judges, in colour. */
const NOTHING: PageSettings = { languages: [], dpi: 0, layout: '', contrast: false };

/**
 * What is asked of a reading: the first run as the whole's settings, the
 * others as stretches, the pages read as `read`, always given, so that the
 * core never falls back on `text` for the pages. Where the plan is empty
 * (a picture), the settings given, and `read` nothing.
 */
export function askedOf(
  plan: PagePlan[],
  text: 'keep' | 'translate',
  shape: boolean,
  settings: PageSettings = NOTHING,
): Asked {
  if (!plan.length) return { ...settingsOf(settings), text, shape, read: null };
  const [first, ...rest] = runsOf(plan);
  const stretches: Stretch[] = rest.map((run) => ({ from: run.from, ...run.settings }));
  const read: number[] = [];
  plan.forEach((page, i) => {
    if (page.source === 'read') read.push(i + 1);
  });
  return { ...first.settings, text, shape, stretches, read };
}

/** How many pages take the PDF's text, and how many are read. */
export function counted(plan: PagePlan[]): { pdf: number; read: number } {
  let pdf = 0;
  for (const page of plan) if (page.source === 'pdf') pdf++;
  return { pdf, read: plan.length - pdf };
}

/**
 * The settings of a page, counted from one: of the first or the last where
 * it is before or past them, and settings where nothing says otherwise in an
 * empty plan.
 */
export function settingsAt(plan: PagePlan[], page: number): PageSettings {
  if (!plan.length) return settingsOf(NOTHING);
  const i = Math.min(plan.length, Math.max(1, Math.floor(page) || 1)) - 1;
  return settingsOf(plan[i]);
}

/** Whether the pages given (every page where none) have one and the same settings. */
export function sameAcross(plan: PagePlan[], pages: number[]): boolean {
  let first: PageSettings | null = null;
  for (const i of indexesOf(plan, pages)) {
    if (!first) first = plan[i];
    else if (!sameSettings(first, plan[i])) return false;
  }
  return true;
}

/** What every page takes, chosen for the whole PDF: the PDF's text, a reading, or each by its text's quality. */
export type Whole = Source | 'decide';

/** The plan with `whole` laid on every page. */
export function withWhole(plan: PagePlan[], whole: Whole, verdicts: Verdict[]): PagePlan[] {
  return whole === 'decide' ? decided(plan, [], verdicts) : withSource(plan, [], whole, verdicts);
}

/**
 * The choice for the whole PDF that the pages are marked as now: the one
 * chosen last (`preferred`) where it still holds, else the first that does,
 * else none, where pages were marked one by one. Where two hold, as the
 * PDF's text and deciding by quality do where every page's text is sound,
 * the one chosen last is said.
 */
export function wholeOf(
  plan: PagePlan[],
  verdicts: Verdict[],
  preferred: Whole | null,
): Whole | null {
  const holds = (whole: Whole) =>
    withWhole(plan, whole, verdicts).every((page, i) => page.source === plan[i].source);
  const order: Whole[] = ['pdf', 'read', 'decide'];
  return [...(preferred ? [preferred] : []), ...order].find(holds) ?? null;
}

/** What the interface says by a name, given so that what is said here can be tested. */
type Say = (id: string, args?: Record<string, string | number>) => string;

/**
 * What the pages will take, in a sentence: *412 pages take the text the PDF
 * has; 147 are read with Tesseract.* Of a picture, that it is read.
 */
export function pagesSaid(
  looked: { picture: boolean },
  plan: PagePlan[],
  canRead: boolean,
  t: Say,
): string {
  if (looked.picture)
    return canRead ? t('ocr-pages-said-picture') : t('ocr-pages-said-picture-unreadable');
  if (!plan.length) return '';
  const { pdf, read } = counted(plan);
  if (!read) return t('ocr-pages-said-pdf', { pages: pdf });
  if (!pdf)
    return canRead
      ? t('ocr-pages-said-read', { pages: read })
      : t('ocr-pages-said-unreadable', { pages: read });
  return canRead
    ? t('ocr-pages-said-both', { pdf, read })
    : t('ocr-pages-said-both-unreadable', { pdf, read });
}
