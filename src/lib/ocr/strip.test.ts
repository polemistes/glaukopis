import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PagePicture, Verdict } from '$lib/api/ocr';
import { t } from '$lib/i18n';
import { firstPlan, withSettings, type PagePlan, type PageSettings } from './plan';
import { batchAt, firstWanted, moved, nextBatch, runSaid, ticksOf } from './strip';

describe('the batches of pages drawn', () => {
  it('follow one another to the end', () => {
    expect(nextBatch(0, 559)).toEqual({ from: 0, count: 40 });
    expect(nextBatch(40, 559)).toEqual({ from: 40, count: 40 });
    expect(nextBatch(520, 559)).toEqual({ from: 520, count: 39 });
    expect(nextBatch(559, 559)).toBeNull();
    expect(nextBatch(0, 3)).toEqual({ from: 0, count: 3 });
    expect(nextBatch(0, 0)).toBeNull();
    expect(nextBatch(10, 100, 25)).toEqual({ from: 10, count: 25 });
    expect(nextBatch(0, 100, 0)).toBeNull();
  });

  it('begin at a page that comes into sight, and stop before what is drawn already', () => {
    const drawn = new Set([...Array(40).keys()].map((i) => i + 400));
    const asked = (i: number) => drawn.has(i);
    // Far from what is drawn: a whole batch.
    expect(batchAt(100, 559, asked)).toEqual({ from: 100, count: 40 });
    // Coming back from the right: up to the first page drawn.
    expect(batchAt(380, 559, asked)).toEqual({ from: 380, count: 20 });
    expect(batchAt(399, 559, asked)).toEqual({ from: 399, count: 1 });
    // At the end of the file.
    expect(batchAt(540, 559, asked)).toEqual({ from: 540, count: 19 });
    // Drawn already, or not a page.
    expect(batchAt(410, 559, asked)).toBeNull();
    expect(batchAt(559, 559, asked)).toBeNull();
    expect(batchAt(-1, 559, asked)).toBeNull();
  });

  it('are of the first page in sight that is not drawn', () => {
    const asked = (i: number) => i < 10;
    expect(firstWanted([12, 4, 11, 30], asked)).toBe(11);
    expect(firstWanted([3, 4], asked)).toBeNull();
    expect(firstWanted([], asked)).toBeNull();
  });
});

describe('the page in view by the keys', () => {
  it('moves by a page, and to the ends', () => {
    expect(moved(3, 'ArrowRight', 10)).toBe(4);
    expect(moved(3, 'ArrowLeft', 10)).toBe(2);
    expect(moved(10, 'ArrowRight', 10)).toBe(10);
    expect(moved(1, 'ArrowLeft', 10)).toBe(1);
    expect(moved(5, 'Home', 10)).toBe(1);
    expect(moved(5, 'End', 10)).toBe(10);
    // Nothing chosen yet: the first.
    expect(moved(null, 'ArrowRight', 10)).toBe(1);
    expect(moved(null, 'ArrowLeft', 10)).toBe(1);
    expect(moved(null, 'End', 10)).toBe(10);
    // Other keys, or no pages, move nothing.
    expect(moved(5, 'ArrowUp', 10)).toBeNull();
    expect(moved(5, 'Enter', 10)).toBeNull();
    expect(moved(null, 'ArrowRight', 0)).toBeNull();
  });
});

const named = (code: string) =>
  ({ nor: 'Norwegian', eng: 'English', grc: 'Ancient Greek' })[code] ?? code;

describe('the band over a run of pages', () => {
  it('names the languages, and nothing more where the rest is as at first', () => {
    const settings: PageSettings = {
      languages: ['nor', 'eng'],
      dpi: 0,
      layout: '',
      contrast: false,
    };
    expect(runSaid(settings, named, t)).toBe('Norwegian, English');
    expect(runSaid({ ...settings, dpi: 300 }, named, t)).toBe('Norwegian, English');
  });

  it('says the resolution where it is not 300, the layout where it is told, and black and white', () => {
    expect(
      runSaid({ languages: ['grc'], dpi: 400, layout: 'column', contrast: true }, named, t),
    ).toBe(
      `Ancient Greek · ${t('ocr-strip-band-dpi', { dpi: '400' })} · ${t('ocr-how-layout-column')} · ${t('ocr-strip-band-contrast')}`,
    );
    expect(
      runSaid({ languages: ['eng'], dpi: 0, layout: 'sparse', contrast: false }, named, t),
    ).toBe(`English · ${t('ocr-how-layout-sparse')}`);
  });

  it('says what is read where no language is chosen', () => {
    expect(runSaid({ languages: [], dpi: 0, layout: '', contrast: false }, named, t)).toBe(
      t('ocr-strip-band-none'),
    );
  });
});

describe('the ticks of the outline under the pages', () => {
  it('stand at the parts’ pages, in order, with room to the next', () => {
    const ticks = ticksOf(
      [
        { title: 'One', page: 7 },
        { title: 'Preface', page: 3 },
        { title: 'One, again', page: 7 },
        { title: 'Beyond', page: 40 },
      ],
      20,
    );
    expect(ticks).toEqual([
      { page: 3, titles: ['Preface'], index: 1, span: 4 },
      { page: 7, titles: ['One', 'One, again'], index: 0, span: 14 },
    ]);
    expect(ticksOf([], 20)).toEqual([]);
  });
});

// The strip mounted, with the browser's Svelte (the tests otherwise run with
// the server's, in which nothing is followed), and the core stood in for.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);
const ocr = vi.hoisted(() => ({ ocrPages: vi.fn(), ocrStop: vi.fn() }));
vi.mock('$lib/api/ocr', () => ocr);

const { flushSync, mount, unmount } = await import('svelte');
const { default: PageStrip } = await import('./PageStrip.svelte');

/** Every page put before it is in sight at once, as a strip of few pages is. */
globalThis.IntersectionObserver = class {
  constructor(private told: IntersectionObserverCallback) {}
  observe(target: Element) {
    queueMicrotask(() =>
      this.told(
        [{ target, isIntersecting: true } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      ),
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

/** The core: each page drawn, but those of `failing`, which say why. */
function drawing(failing: number[] = []) {
  return async (_path: string, _stored: boolean, from: number, count: number) =>
    Array.from({ length: count }, (_, i): PagePicture =>
      failing.includes(from + i + 1)
        ? {
            number: from + i + 1,
            picture: null,
            failed: `Page ${from + i + 1} could not be drawn.`,
          }
        : { number: from + i + 1, picture: 'data:image/png;base64,iVBORw0KGgo=', failed: null },
    );
}

/** Lets what is asked of the core come back, and the strip follow. */
async function settled() {
  for (let i = 0; i < 10; i++) await new Promise((done) => setTimeout(done, 0));
  flushSync();
}

let shown: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (shown) unmount(shown);
  shown = null;
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

const eng: PageSettings = { languages: ['eng'], dpi: 0, layout: '', contrast: false };

type StripProps = Parameters<typeof PageStrip>[1];

/** The strip of `pages` pages, every one with sound text taken from the PDF, unless the props say otherwise. */
function strip(props: Partial<StripProps> & { pages: number }) {
  const target = document.createElement('div');
  document.body.append(target);
  const onview = vi.fn();
  const onselect = vi.fn();
  const verdicts: Verdict[] = props.verdicts ?? Array(props.pages).fill('sound');
  shown = mount(PageStrip, {
    target,
    props: {
      path: '/a/book.pdf',
      stored: false,
      verdicts,
      plan: firstPlan(verdicts, eng, 'pdf'),
      outline: [],
      selection: [],
      inView: 1,
      onview,
      onselect,
      nameOf: named,
      ...props,
    },
  });
  flushSync();
  const page = (n: number) => target.querySelector<HTMLElement>(`[data-strip-page="${n}"]`)!;
  const list = target.querySelector<HTMLElement>('[role="listbox"]')!;
  const press = (key: string, more: KeyboardEventInit = {}) =>
    list.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...more }));
  const click = (n: number, more: MouseEventInit = {}) =>
    page(n).dispatchEvent(new MouseEvent('click', { bubbles: true, ...more }));
  return { target, onview, onselect, page, list, press, click };
}

describe('the strip of pages', () => {
  it('draws its pages a batch at a time, and says why a page could not be drawn', async () => {
    ocr.ocrPages.mockImplementation(drawing([45]));
    const { target, page } = strip({ pages: 90 });
    await settled();
    const asked = ocr.ocrPages.mock.calls.map(([path, stored, from, count, width]) => [
      path,
      stored,
      from,
      count,
      width,
    ]);
    expect(asked).toEqual([
      ['/a/book.pdf', false, 0, 40, 120],
      ['/a/book.pdf', false, 40, 40, 120],
      ['/a/book.pdf', false, 80, 10, 120],
    ]);
    expect(target.querySelectorAll('[data-strip-page]').length).toBe(90);
    expect(page(1).querySelector('img')?.getAttribute('src')).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    );
    expect(page(1).querySelector('.number')?.textContent).toBe('1');
    expect(page(1).getAttribute('data-state')).toBe('drawn');
    // The page that could not be drawn says why, in words.
    expect(page(45).getAttribute('data-state')).toBe('failed');
    expect(page(45).querySelector('img')).toBeNull();
    expect(page(45).querySelector('[data-strip-page-failed]')?.textContent).toBe(
      'Page 45 could not be drawn.',
    );
    // The same ticket every time, by which it is stopped.
    const tickets = new Set(ocr.ocrPages.mock.calls.map((call) => call[5]));
    expect(tickets.size).toBe(1);
  });

  it('shows the pages not drawn yet as sheets, and a page the core left out as not drawn', async () => {
    let answer: (pictures: PagePicture[]) => void = () => {};
    ocr.ocrPages.mockImplementation(() => new Promise((done) => (answer = done)));
    const { target } = strip({ pages: 3 });
    await settled();
    const waiting = target.querySelectorAll('[data-state="waiting"] .blank');
    expect(waiting.length).toBe(3);
    expect(target.querySelector('.blank.drawing')).not.toBeNull();
    // The file had two pages, not three.
    answer([
      { number: 1, picture: 'data:image/png;base64,AA==', failed: null },
      { number: 2, picture: 'data:image/png;base64,AA==', failed: null },
    ]);
    await settled();
    const third = target.querySelector('[data-strip-page="3"]')!;
    expect(third.getAttribute('data-state')).toBe('failed');
    expect(third.textContent).toContain(t('ocr-strip-page-failed'));
  });

  it('says in the strip that a batch could not be drawn, and tries it again', async () => {
    ocr.ocrPages.mockRejectedValueOnce({ kind: 'invalid', message: 'The file is damaged.' });
    ocr.ocrPages.mockImplementation(drawing());
    const { target } = strip({ pages: 5 });
    await settled();
    const failed = target.querySelector('[data-strip-failed]')!;
    expect(failed.textContent).toContain(t('ocr-strip-failed', { from: '1', to: '5' }));
    expect(failed.textContent).toContain('The file is damaged.');
    expect(target.querySelectorAll('[data-state="waiting"]').length).toBe(5);
    target.querySelector<HTMLButtonElement>('[data-strip-retry]')!.click();
    await settled();
    expect(target.querySelector('[data-strip-failed]')).toBeNull();
    expect(target.querySelectorAll('[data-state="drawn"]').length).toBe(5);
    expect(ocr.ocrPages).toHaveBeenCalledTimes(2);
  });

  it('marks what each page gets, tinted where its text does not read as text', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const verdicts: Verdict[] = ['sound', 'poor', 'none', 'poor'];
    const plan: PagePlan[] = firstPlan(verdicts, eng, 'pdf');
    plan[3] = { ...plan[3], source: 'read' };
    const { target, page } = strip({ pages: 4, verdicts, plan });
    await settled();
    const mark = (n: number) => page(n).querySelector<HTMLElement>('[data-strip-source]')!;
    expect([1, 2, 3, 4].map((n) => mark(n).dataset.stripSource)).toEqual([
      'pdf',
      'pdf',
      'read',
      'read',
    ]);
    expect([1, 2, 3, 4].map((n) => mark(n).dataset.stripVerdict)).toEqual([
      'sound',
      'poor',
      'none',
      'poor',
    ]);
    expect(target.querySelectorAll('[data-strip-verdict="poor"]').length).toBe(2);
    expect(mark(1).textContent?.trim()).toBe(t('ocr-strip-source-pdf'));
    expect(mark(3).textContent?.trim()).toBe(t('ocr-strip-source-read'));
    // In words, for the pointer and for the reader of the screen.
    expect(mark(1).title).toBe(t('ocr-strip-source-pdf-hint'));
    expect(mark(2).title).toBe(`${t('ocr-strip-source-pdf-hint')} ${t('ocr-strip-poor')}`);
    expect(page(3).getAttribute('aria-label')).toBe(
      `${t('ocr-strip-page', { number: '3' })}. ${t('ocr-strip-source-read-hint')}`,
    );
  });

  it('shows the pages selected and the page in view', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const { page, list } = strip({ pages: 6, selection: [2, 3, 5], inView: 3 });
    await settled();
    expect([1, 2, 3, 4, 5, 6].map((n) => page(n).getAttribute('aria-selected'))).toEqual([
      'false',
      'true',
      'true',
      'false',
      'true',
      'false',
    ]);
    expect(page(3).dataset.stripView).toBe('true');
    expect(page(2).dataset.stripView).toBeUndefined();
    expect(list.getAttribute('aria-activedescendant')).toBe(page(3).id);
    expect(list.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('shows a page clicked and selects it alone, a range with Shift, and adds or takes away with Ctrl', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const { onview, onselect, list, click } = strip({ pages: 9, selection: [2, 3], inView: 2 });
    await settled();

    click(5);
    expect(onview).toHaveBeenLastCalledWith(5);
    expect(onselect).toHaveBeenLastCalledWith([5]);
    expect(document.activeElement).toBe(list);

    // From the page clicked last without Shift.
    click(8, { shiftKey: true });
    expect(onselect).toHaveBeenLastCalledWith([5, 6, 7, 8]);
    expect(onview).toHaveBeenLastCalledWith(8);
    click(3, { shiftKey: true });
    expect(onselect).toHaveBeenLastCalledWith([3, 4, 5]);

    // Ctrl and Cmd add a page or take it away, and the page in view stays.
    onview.mockClear();
    click(7, { ctrlKey: true });
    expect(onselect).toHaveBeenLastCalledWith([2, 3, 7]);
    click(3, { metaKey: true });
    expect(onselect).toHaveBeenLastCalledWith([2]);
    expect(onview).not.toHaveBeenCalled();
    // And are where Shift begins.
    click(9, { shiftKey: true });
    expect(onselect).toHaveBeenLastCalledWith([3, 4, 5, 6, 7, 8, 9]);
  });

  it('does not select anew a page that is selected alone and in view', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const { onview, onselect, click } = strip({ pages: 3, selection: [2], inView: 2 });
    await settled();
    click(2);
    expect(onview).not.toHaveBeenCalled();
    expect(onselect).not.toHaveBeenCalled();
  });

  it('is moved through by the keys, which extend the selection with Shift', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const { onview, onselect, press } = strip({ pages: 6, selection: [], inView: 3 });
    await settled();
    press('ArrowRight');
    expect(onview).toHaveBeenLastCalledWith(4);
    expect(onselect).toHaveBeenLastCalledWith([4]);
    press('ArrowLeft');
    expect(onview).toHaveBeenLastCalledWith(2);
    expect(onselect).toHaveBeenLastCalledWith([2]);
    press('End');
    expect(onview).toHaveBeenLastCalledWith(6);
    expect(onselect).toHaveBeenLastCalledWith([6]);
    // Other keys move nothing.
    onview.mockClear();
    press('ArrowUp');
    press('a');
    expect(onview).not.toHaveBeenCalled();
  });

  it('extends the selection by Shift and the keys from where it began', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const { onview, onselect, press } = strip({ pages: 6, selection: [3], inView: 3 });
    await settled();
    press('ArrowRight', { shiftKey: true });
    expect(onselect).toHaveBeenLastCalledWith([3, 4]);
    expect(onview).toHaveBeenLastCalledWith(4);
    press('End', { shiftKey: true });
    expect(onselect).toHaveBeenLastCalledWith([3, 4, 5, 6]);
    press('Home', { shiftKey: true });
    expect(onselect).toHaveBeenLastCalledWith([1, 2, 3]);
  });

  it('selects every page by Ctrl+A, which is the selection of none', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const { onview, onselect, press } = strip({ pages: 6, selection: [2, 3], inView: 3 });
    await settled();
    press('a', { ctrlKey: true });
    expect(onselect).toHaveBeenLastCalledWith([]);
    press('A', { metaKey: true });
    expect(onselect).toHaveBeenCalledTimes(2);
    expect(onview).not.toHaveBeenCalled();
  });

  it('bands the runs of pages read alike, and a band selects its pages', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const verdicts: Verdict[] = Array(8).fill('sound');
    let plan = firstPlan(verdicts, eng, 'pdf');
    plan = withSettings(plan, [4, 5, 6], { languages: ['nor', 'eng'], dpi: 400 });
    const { target, onview, onselect } = strip({ pages: 8, verdicts, plan, inView: 1 });
    await settled();
    const bands = [...target.querySelectorAll<HTMLButtonElement>('[data-strip-stretch]')];
    expect(bands.map((b) => b.dataset.stripStretch)).toEqual(['1', '4', '7']);
    expect(bands[1].textContent).toBe(
      `Norwegian, English · ${t('ocr-strip-band-dpi', { dpi: '400' })}`,
    );
    expect(bands[1].title).toBe(
      t('ocr-strip-band-hint', { count: 3, from: '4', to: '6', said: bands[1].textContent! }),
    );
    // Over its pages: from the fourth, three pages wide.
    expect(bands[1].style.getPropertyValue('--from')).toBe('3');
    expect(bands[1].style.getPropertyValue('--count')).toBe('3');

    // The page in view is not among them: the first of them is shown.
    bands[1].click();
    expect(onselect).toHaveBeenLastCalledWith([4, 5, 6]);
    expect(onview).toHaveBeenLastCalledWith(4);
    onview.mockClear();
    bands[0].click();
    expect(onselect).toHaveBeenLastCalledWith([1, 2, 3]);
    expect(onview).not.toHaveBeenCalled();
  });

  it('has no band where every page is read alike', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const { target } = strip({ pages: 4 });
    await settled();
    expect(target.querySelector('[data-strip-stretch]')).toBeNull();
    expect(target.querySelector('.bands')).toBeNull();
  });

  it('ticks the parts of the outline under their pages, and a tick selects the part’s pages', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const outline = [
      { title: 'Preface', page: 2 },
      { title: 'The first part', page: 5 },
      { title: 'Past the end', page: 30 },
    ];
    const { target, onview, onselect } = strip({ pages: 8, outline, inView: 1 });
    await settled();
    const ticks = [...target.querySelectorAll<HTMLButtonElement>('[data-strip-part]')];
    expect(ticks.map((tick) => tick.dataset.stripPart)).toEqual(['2', '5']);
    expect(ticks[1].title).toBe('The first part');
    expect(ticks[1].textContent).toBe('The first part');
    expect(ticks[0].style.getPropertyValue('--count')).toBe('3');
    ticks[1].click();
    expect(onselect).toHaveBeenLastCalledWith([5, 6, 7, 8]);
    expect(onview).toHaveBeenLastCalledWith(5);
    ticks[0].click();
    expect(onselect).toHaveBeenLastCalledWith([2, 3, 4]);
  });

  it('stops the batch it is drawing when it is left', async () => {
    ocr.ocrPages.mockImplementation(() => new Promise(() => {}));
    ocr.ocrStop.mockResolvedValue(undefined);
    strip({ pages: 50 });
    await settled();
    expect(ocr.ocrPages).toHaveBeenCalledTimes(1);
    const ticket = ocr.ocrPages.mock.calls[0][5];
    unmount(shown!);
    shown = null;
    expect(ocr.ocrStop).toHaveBeenCalledWith(ticket);
  });
});
