import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PagePicture } from '$lib/api/ocr';
import { t } from '$lib/i18n';
import { batchAt, firstWanted, moved, nextBatch } from './strip';

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

describe('the page chosen by the keys', () => {
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

function strip(props: Partial<Parameters<typeof PageStrip>[1]> & { pages: number }) {
  const target = document.createElement('div');
  document.body.append(target);
  const onselect = vi.fn();
  shown = mount(PageStrip, {
    target,
    props: { path: '/a/book.pdf', stored: false, selected: null, onselect, ...props },
  });
  flushSync();
  return { target, onselect };
}

describe('the strip of pages', () => {
  it('draws its pages a batch at a time, and says why a page could not be drawn', async () => {
    ocr.ocrPages.mockImplementation(drawing([45]));
    const { target } = strip({ pages: 90, marks: new Map([[41, 'From 41']]) });
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
    const pages = target.querySelectorAll('[data-strip-page]');
    expect(pages.length).toBe(90);
    const page = (n: number) => target.querySelector(`[data-strip-page="${n}"]`)!;
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
    // The mark in the corner of its page.
    expect(page(41).querySelector('[data-strip-mark]')?.textContent).toBe('From 41');
    expect(target.querySelectorAll('[data-strip-mark]').length).toBe(1);
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

  it('is chosen in by the pointer and the keys, and offers to begin a stretch on the page chosen', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const onbegin = vi.fn();
    const { target, onselect } = strip({ pages: 6, selected: 3, onbegin });
    await settled();
    const row = target.querySelector<HTMLElement>('[role="listbox"]')!;
    const page = (n: number) => target.querySelector<HTMLElement>(`[data-strip-page="${n}"]`)!;
    expect(page(3).getAttribute('aria-selected')).toBe('true');
    expect(page(2).getAttribute('aria-selected')).toBe('false');
    expect(row.getAttribute('aria-activedescendant')).toBe(page(3).id);

    page(5).click();
    expect(onselect).toHaveBeenLastCalledWith(5);
    expect(document.activeElement).toBe(row);
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(onselect).toHaveBeenLastCalledWith(4);
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(onselect).toHaveBeenLastCalledWith(2);
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(onselect).toHaveBeenLastCalledWith(6);
    expect(onselect).toHaveBeenCalledTimes(4);

    const begin = target.querySelectorAll<HTMLButtonElement>('[data-ocr-begin-stretch]');
    expect(begin.length).toBe(1);
    expect(begin[0].closest('.place')?.querySelector('[data-strip-page]')).toBe(page(3));
    expect(begin[0].textContent).toBe(t('ocr-strip-begin'));
    begin[0].click();
    expect(onbegin).toHaveBeenCalledWith(3);
  });

  it('offers no stretch where it is not asked to', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const { target } = strip({ pages: 2, selected: 1 });
    await settled();
    expect(target.querySelector('[data-ocr-begin-stretch]')).toBeNull();
  });

  it('offers no stretch at the first page, where the whole begins', async () => {
    ocr.ocrPages.mockImplementation(drawing());
    const { target } = strip({ pages: 2, selected: 1, onbegin: vi.fn() });
    await settled();
    expect(target.querySelector('[data-ocr-begin-stretch]')).toBeNull();
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
