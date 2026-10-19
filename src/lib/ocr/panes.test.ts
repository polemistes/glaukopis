import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PageTextView, TextBlock, Tried, TriedWord } from '$lib/api/ocr';
import type { PageSettings } from './plan';
import type { Trial } from './trials';

// The panes mounted, with the browser's Svelte: the tests otherwise run with
// the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
const { languages, t } = await import('$lib/i18n');
const { ocrLanguageName } = await import('./languages');
const { paragraphText } = await import('./trials');
const { default: PagePanes } = await import('./PagePanes.svelte');
const { default: ReadSettings } = await import('./ReadSettings.svelte');

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const word = (text: string, confidence: number | null, left = 10): TriedWord => ({
  text,
  confidence,
  left,
  top: 20,
  width: 30,
  height: 12,
  line: false,
});

const tried = (paragraphs: TriedWord[][], confidence: number | null = 88): Tried => {
  const words = paragraphs.flat();
  return {
    page: 3,
    label: 'iii',
    paragraphs,
    words: words.length,
    unsure: words.filter((w) => w.confidence != null && w.confidence < 70).length,
    confidence,
    poorly: confidence != null && confidence < 80,
    png: 'AAAA',
    width: 400,
    height: 600,
    blocks: [],
  };
};

const settings = (change: Partial<PageSettings> = {}): PageSettings => ({
  languages: ['eng'],
  dpi: 0,
  layout: '',
  contrast: false,
  ...change,
});

const paragraphs = [
  [word('Det', 96), word('var', 40, 50), word('en', 93, 90)],
  [word('Morgen', 20, 10), word('i', 91, 60), word('Mai.', 95, 80)],
];
const older: Trial = { settings: settings(), tried: tried(paragraphs, 62), at: 1 };
const newer: Trial = {
  settings: settings({ dpi: 400, layout: 'column' }),
  tried: tried(paragraphs, 88),
  at: 2,
};

const textPage: PageTextView = {
  number: 3,
  label: 'iii',
  lines: ['Mnvlp Ijkr', 'xqz'],
  translated: ['Μῆνιν ἄειδε', 'θεά'],
  hasText: true,
};

const blocks: TextBlock[] = [
  { left: 10, top: 10, width: 200, height: 100 },
  { left: 10, top: 200, width: 200, height: 300 },
];

let shown: ReturnType<typeof mount> | null = null;
/** Takes away what was mounted, to mount anew. */
function again() {
  if (shown) unmount(shown);
  shown = null;
  document.body.replaceChildren();
}
afterEach(() => {
  again();
  languages.current = 'en';
});

/** The panes mounted, each pane's props as below with what is given laid over them; `pdf: null` for none. */
function panes(
  change: {
    hasPdfText?: boolean;
    picture?: Record<string, unknown>;
    pdf?: Record<string, unknown> | null;
    tesseract?: Record<string, unknown>;
  } = {},
) {
  const host = document.createElement('div');
  document.body.append(host);
  const calls: [string, unknown?][] = [];
  const call =
    (name: string) =>
    (arg?: unknown): void => {
      calls.push([name, arg]);
    };
  const props = {
    hasPdfText: true,
    picture: {
      picture: 'data:image/png;base64,AAAA',
      width: 400,
      height: 600,
      label: 'iii',
      blocks,
      unsure: paragraphs.flat().filter((w) => w.confidence! < 70),
      loading: false,
      failure: null,
    },
    pdf: {
      page: textPage,
      loading: false,
      failure: null,
      verdict: 'poor' as const,
      translated: true,
      canTranslate: true,
      ontranslated: call('translated'),
      canUse: true,
      onuse: call('use-pdf'),
      scope: 'pages 3–5',
    },
    tesseract: {
      page: 3,
      shown: newer,
      trials: [newer, older],
      trying: false,
      failure: null,
      current: newer.settings,
      nameOf: (code: string) => ocrLanguageName(code),
      canUse: true,
      onuse: call('use-read'),
      onshow: call('show'),
      onsettings: call('settings'),
      scope: 'pages 3–5',
    },
  };
  const laid = {
    hasPdfText: change.hasPdfText ?? props.hasPdfText,
    picture: { ...props.picture, ...change.picture },
    pdf: change.pdf === null ? null : { ...props.pdf, ...change.pdf },
    tesseract: { ...props.tesseract, ...change.tesseract },
  };
  shown = mount(PagePanes, { target: host, props: laid });
  flushSync();
  return { host, calls };
}

const q = (host: Element, selector: string) => host.querySelector<HTMLElement>(selector);

describe('the panes of the page in view', () => {
  it('are three where the PDF has text, and two where it has none', () => {
    const { host } = panes();
    expect(q(host, '[data-page-panes]')!.dataset.pagePanes).toBe('3');
    expect(q(host, '[data-pane-picture]')).not.toBeNull();
    expect(q(host, '[data-pane-pdf]')).not.toBeNull();
    expect(q(host, '[data-pane-tesseract]')).not.toBeNull();
    again();
    const two = panes({ hasPdfText: false, pdf: null });
    expect(q(two.host, '[data-page-panes]')!.dataset.pagePanes).toBe('2');
    expect(q(two.host, '[data-pane-pdf]')).toBeNull();
    // The picture first.
    const order = [...q(two.host, '[data-page-panes]')!.children].map((c) =>
      c.hasAttribute('data-pane-picture') ? 'picture' : 'tesseract',
    );
    expect(order).toEqual(['picture', 'tesseract']);
  });
});

describe('the pane of the text the PDF has', () => {
  it('shows the page as translated, with its verdict, and gives the text to the pages', () => {
    const { host, calls } = panes();
    const pane = q(host, '[data-pane-pdf]')!;
    expect(pane.querySelector('h3')!.textContent).toBe('The text the PDF has');
    expect(q(pane, '.lines')!.textContent).toContain('Μῆνιν ἄειδε');
    expect(q(pane, '[data-text-verdict]')!.dataset.textVerdict).toBe('poor');
    expect(q(pane, '[data-text-verdict]')!.textContent!.trim()).toMatch(/^Does not read as text/);
    const use = q(pane, '[data-pane-use-pdf]') as HTMLButtonElement;
    expect(use.textContent!.trim()).toBe('Use for pages 3–5');
    use.click();
    const translated = q(pane, '[data-text-translated]') as HTMLInputElement;
    expect(translated.checked).toBe(true);
    translated.click();
    expect(calls).toEqual([
      ['use-pdf', undefined],
      ['translated', false],
    ]);
  });

  it('shows the lines as the PDF has them where the switch is off, and none where the page has none', () => {
    const off = panes({ pdf: { translated: false } });
    expect(q(off.host, '[data-pane-pdf] .lines')!.textContent).toContain('Mnvlp Ijkr');
    again();
    const none = panes({
      pdf: { page: { ...textPage, hasText: false, lines: [] }, canUse: false },
    });
    expect(q(none.host, '[data-text-none]')!.textContent).toBe(t('ocr-text-page-none'));
    expect(q(none.host, '[data-text-verdict]')).toBeNull();
    expect((q(none.host, '[data-pane-use-pdf]') as HTMLButtonElement).disabled).toBe(true);
    again();
    const plain = panes({ pdf: { canTranslate: false, verdict: 'sound' } });
    expect(q(plain.host, '[data-text-translated]')).toBeNull();
    expect(q(plain.host, '[data-text-verdict]')!.textContent!.trim()).toBe('Reads as text');
  });
});

describe('the pane of what Tesseract read', () => {
  it('says how sure it was, counts the unsure words, and marks them in the text', () => {
    const { host } = panes();
    const pane = q(host, '[data-pane-tesseract]')!;
    expect(q(pane, '[data-ocr-tried-confidence]')!.dataset.ocrTriedConfidence).toBe('88');
    expect(q(pane, '[data-ocr-tried-confidence]')!.dataset.poorly).toBe('false');
    expect(q(pane, '[data-unsure]')!.dataset.unsure).toBe('2');
    expect(q(pane, '[data-unsure]')!.textContent!.trim()).toBe('2 of 6 words unsure');
    const marks = [...pane.querySelectorAll<HTMLElement>('mark[data-unsure-word]')];
    expect(marks.map((m) => [m.textContent, m.dataset.unsureWord])).toEqual([
      ['var', '40'],
      ['Morgen', '20'],
    ]);
    // The words with one space between them, the marks no different.
    const shownParagraphs = [...pane.querySelectorAll('[data-ocr-tried-text] p')];
    expect(shownParagraphs.map((p) => p.textContent)).toEqual(paragraphs.map(paragraphText));
  });

  it('lists the trials, the newest first, the one shown selected', () => {
    const { host, calls } = panes({
      tesseract: { shown: older, current: newer.settings },
    });
    const rows = [...host.querySelectorAll<HTMLElement>('[data-trial]')];
    expect(rows.map((r) => r.dataset.trial)).toEqual(['1', '2']);
    expect(rows.map((r) => r.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    expect(q(rows[0], '.said')!.textContent).toBe('English · 400 · One column');
    expect(q(rows[1], '[data-trial-confidence]')!.dataset.trialConfidence).toBe('62');
    // The older was read otherwise than the page is now.
    expect(q(rows[0], '[data-trial-differs]')).toBeNull();
    expect(q(rows[1], '[data-trial-differs]')).not.toBeNull();
    // The poorly read trial shown says so.
    expect(q(host, '[data-ocr-tried-confidence]')!.dataset.poorly).toBe('true');
    rows[0].click();
    (q(rows[1], '[data-trial-use]') as HTMLButtonElement).click();
    expect(calls).toEqual([
      ['show', newer],
      ['settings', older.settings],
    ]);
  });

  it('says how to try where nothing was tried, and reads while trying', () => {
    const { host } = panes({ tesseract: { shown: null, trials: [] } });
    expect(q(host, '[data-ocr-try-hint]')!.textContent).toContain('Try page 3');
    expect(q(host, '[data-trials]')).toBeNull();
    again();
    const busy = panes({ tesseract: { trying: true } });
    expect(q(busy.host, '[data-pane-tesseract]')!.textContent).toContain('Reading page 3…');
    expect(q(busy.host, '[data-ocr-tried-text]')).toBeNull();
    again();
    const failed = panes({ tesseract: { failure: 'It broke.' } });
    expect(q(failed.host, '[data-ocr-try-failed]')!.textContent).toContain('It broke.');
  });
});

describe('the picture of the page', () => {
  it('is drawn at its own size and twice it, with the blocks and the unsure words over it', () => {
    const { host } = panes();
    const pane = q(host, '[data-pane-picture]')!;
    expect(pane.querySelector('h3')!.textContent).toBe('Page iii');
    expect(q(pane, '[data-picture-zoom]')!.dataset.pictureZoom).toBe('fit');
    const sizes = [...pane.querySelectorAll<HTMLButtonElement>('[data-picture-zoom] button')];
    sizes[1].click();
    flushSync();
    expect(q(pane, '[data-picture-zoom]')!.dataset.pictureZoom).toBe('1');
    const sheet = q(pane, '.sheet')!;
    expect([sheet.style.width, sheet.style.height]).toEqual(['400px', '600px']);
    expect(q(pane, '[data-ocr-tried-blocks]')!.dataset.ocrTriedBlocks).toBe('2');
    expect(q(pane, '[data-unsure-marks]')!.dataset.unsureMarks).toBe('2');
    // The numbers of the blocks are as large on the screen at every zoom.
    expect(pane.querySelector('[data-ocr-tried-blocks] text')!.getAttribute('font-size')).toBe(
      '13',
    );
    sizes[2].click();
    flushSync();
    expect(q(pane, '.sheet')!.style.width).toBe('800px');
    expect(pane.querySelector('[data-ocr-tried-blocks] text')!.getAttribute('font-size')).toBe(
      '6.5',
    );
    (q(pane, '[data-ocr-tried-show-blocks]') as HTMLInputElement).click();
    flushSync();
    expect(q(pane, '[data-ocr-tried-blocks]')).toBeNull();
    expect(q(pane, '[data-unsure-marks]')).not.toBeNull();
  });
});

describe('the reading settings', () => {
  function column(change: Record<string, unknown> = {}) {
    const host = document.createElement('div');
    document.body.append(host);
    const calls: [string, unknown?][] = [];
    shown = mount(ReadSettings, {
      target: host,
      props: {
        value: settings({ languages: ['eng', 'grc'], dpi: 400 }),
        scope: 'For pages 39–120',
        installed: ['eng', 'grc', 'nor'],
        page: 280,
        trying: false,
        canTry: true,
        missing: false,
        onchange: (s: PageSettings) => calls.push(['change', s]),
        ontry: () => calls.push(['try']),
        ...change,
      },
    });
    flushSync();
    return { host, calls };
  }

  it('say what they hold for, warn of scripts alike, and try the page in view', () => {
    const { host, calls } = column();
    expect(q(host, '[data-read-settings]')).not.toBeNull();
    expect(q(host, '[data-settings-scope]')!.textContent).toBe('For pages 39–120');
    expect(q(host, '[data-scripts-alike]')!.dataset.scriptsAlike).toBe('Greek Latin');
    const tryIt = q(host, '[data-ocr-try]') as HTMLButtonElement;
    expect(tryIt.textContent!.trim()).toBe('Try page 280');
    tryIt.click();
    const layout = q(host, '[data-ocr-layout] select') as HTMLSelectElement;
    layout.value = 'sparse';
    layout.dispatchEvent(new Event('change', { bubbles: true }));
    expect(calls).toEqual([
      ['try'],
      ['change', settings({ languages: ['eng', 'grc'], dpi: 400, layout: 'sparse' })],
    ]);
  });

  it('are shown disabled where Tesseract is not installed', () => {
    const { host } = column({ missing: true, installed: [] });
    expect(q(host, '[data-ocr-missing]')!.textContent).toContain('Tesseract');
    expect((q(host, '[data-ocr-try]') as HTMLButtonElement).disabled).toBe(true);
    expect((q(host, 'fieldset') as HTMLFieldSetElement).disabled).toBe(true);
    expect(q(host, '[data-scripts-alike]')).toBeNull();
  });

  it('cannot try while trying, and are said in the language of the interface', () => {
    languages.current = 'nb';
    const { host } = column({ trying: true });
    const tryIt = q(host, '[data-ocr-try]') as HTMLButtonElement;
    expect(tryIt.disabled).toBe(true);
    expect(tryIt.textContent!.trim()).toBe('Prøv side 280');
  });
});
