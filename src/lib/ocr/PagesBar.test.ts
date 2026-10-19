import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Looked, Verdict } from '$lib/api/ocr';
import { t } from '$lib/i18n';
import { firstPlan, withSource, type PagePlan, type PageSettings } from './plan';

// The bar mounted, with the browser's Svelte: the tests otherwise run with
// the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
const { default: PagesBar } = await import('./PagesBar.svelte');

const eng: PageSettings = { languages: ['eng'], dpi: 0, layout: '', contrast: false };

/** What a look at a PDF of these verdicts found. */
function looked(verdicts: Verdict[], more: Partial<Looked> = {}): Looked {
  const withText = verdicts.filter((v) => v !== 'none').length;
  return {
    file: '/a/book.pdf',
    picture: false,
    pages: verdicts.length,
    withText,
    poor: verdicts.filter((v) => v === 'poor').length,
    fonts: [],
    schemes: [],
    sample: null,
    title: null,
    searchable: true,
    locked: false,
    resolution: null,
    firstWithoutText: null,
    outline: [],
    verdicts,
    ...more,
  };
}

let shown: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (shown) unmount(shown);
  shown = null;
  document.body.innerHTML = '';
});

function bar(props: {
  looked: Looked;
  plan?: PagePlan[];
  selection?: number[];
  canRead?: boolean;
}) {
  const target = document.createElement('div');
  document.body.append(target);
  const onsource = vi.fn();
  const ondecide = vi.fn();
  const onall = vi.fn();
  shown = mount(PagesBar, {
    target,
    props: {
      plan: firstPlan(props.looked.verdicts, eng, 'pdf'),
      selection: [],
      canRead: true,
      onsource,
      ondecide,
      onall,
      ...props,
    },
  });
  flushSync();
  const find = <E extends HTMLElement = HTMLElement>(what: string) =>
    target.querySelector<E>(`[${what}]`);
  const said = () => find('data-pages-said')?.textContent?.trim();
  const button = (what: string) => find<HTMLButtonElement>(what)!;
  return { target, onsource, ondecide, onall, find, said, button };
}

describe('the line over the strip of pages', () => {
  it('says how many pages take the PDF’s text and how many are read', () => {
    const verdicts: Verdict[] = ['sound', 'sound', 'none', 'poor', 'none'];
    expect(bar({ looked: looked(verdicts) }).said()).toBe(
      t('ocr-pages-said-both', { pdf: 3, read: 2 }),
    );
  });

  it('says it of all where they are all one way', () => {
    const verdicts: Verdict[] = ['sound', 'sound', 'poor'];
    expect(bar({ looked: looked(verdicts) }).said()).toBe(t('ocr-pages-said-pdf', { pages: 3 }));
    unmount(shown!);
    shown = null;
    expect(bar({ looked: looked(verdicts), plan: firstPlan(verdicts, eng, 'read') }).said()).toBe(
      t('ocr-pages-said-read', { pages: 3 }),
    );
  });

  it('says that the pages to be read cannot be, where Tesseract is not installed', () => {
    const verdicts: Verdict[] = ['sound', 'none', 'none'];
    expect(bar({ looked: looked(verdicts), canRead: false }).said()).toBe(
      t('ocr-pages-said-both-unreadable', { pdf: 1, read: 2 }),
    );
    unmount(shown!);
    shown = null;
    const scan: Verdict[] = ['none', 'none'];
    expect(bar({ looked: looked(scan), canRead: false }).said()).toBe(
      t('ocr-pages-said-unreadable', { pages: 2 }),
    );
  });

  it('says of a picture only that it is read, and offers nothing for pages', () => {
    const { said, find } = bar({ looked: looked([], { picture: true, pages: 1 }), plan: [] });
    expect(said()).toBe(t('ocr-pages-said-picture'));
    expect(find('data-pages-scope')).toBeNull();
    expect(find('data-pages-read')).toBeNull();
  });

  it('warns of scans of too few dots to the inch', () => {
    const { find } = bar({ looked: looked(['poor', 'poor'], { resolution: 72 }) });
    const warn = find('data-ocr-low-resolution')!;
    expect(warn.dataset.ocrLowResolution).toBe('72');
    expect(warn.textContent).toContain(t('ocr-low-resolution', { dpi: 72 }));
    expect(warn.textContent).toContain(t('ocr-low-resolution-text'));
  });

  it('says what the actions hold for: every page, or those selected, with a way back to all', () => {
    const verdicts: Verdict[] = Array(559).fill('sound');
    const all = bar({ looked: looked(verdicts) });
    expect(all.find('data-pages-scope')?.textContent).toBe(
      t('ocr-pages-scope-all', { pages: 559 }),
    );
    expect(all.find('data-pages-scope')?.textContent).toBe('For all 559 pages');
    expect(all.find('data-pages-all')).toBeNull();
    unmount(shown!);
    shown = null;

    const some = bar({
      looked: looked(verdicts),
      selection: Array.from({ length: 82 }, (_, i) => 39 + i),
    });
    expect(some.find('data-pages-scope')?.textContent).toBe('For pages 39–120');
    some.button('data-pages-all').click();
    expect(some.onall).toHaveBeenCalledTimes(1);
  });

  it('acts on the pages selected by its three buttons', () => {
    const verdicts: Verdict[] = ['sound', 'poor', 'none'];
    const { button, onsource, ondecide } = bar({ looked: looked(verdicts), selection: [2] });
    button('data-pages-pdf').click();
    expect(onsource).toHaveBeenLastCalledWith('pdf');
    button('data-pages-read').click();
    expect(onsource).toHaveBeenLastCalledWith('read');
    button('data-pages-decide').click();
    expect(ondecide).toHaveBeenCalledTimes(1);
    expect(button('data-pages-pdf').textContent?.trim()).toBe(t('ocr-pages-pdf'));
    expect(button('data-pages-read').title).toBe(t('ocr-pages-read-hint'));
  });

  it('offers the PDF’s text only where a page of the selection has text', () => {
    const verdicts: Verdict[] = ['sound', 'none', 'none'];
    const plan = withSource(firstPlan(verdicts, eng, 'read'), [], 'read', verdicts);
    const none = bar({ looked: looked(verdicts), plan, selection: [2, 3] });
    expect(none.button('data-pages-pdf').disabled).toBe(true);
    unmount(shown!);
    shown = null;
    const some = bar({ looked: looked(verdicts), plan, selection: [1, 3] });
    expect(some.button('data-pages-pdf').disabled).toBe(false);
    unmount(shown!);
    shown = null;
    const scan = bar({ looked: looked(['none', 'none']) });
    expect(scan.button('data-pages-pdf').disabled).toBe(true);
    // Nothing to decide by, where the file has no text.
    expect(scan.button('data-pages-decide').disabled).toBe(true);
    expect(scan.button('data-pages-read').disabled).toBe(false);
  });

  it('offers no reading where Tesseract is not installed', () => {
    const { button } = bar({ looked: looked(['sound', 'poor']), canRead: false });
    expect(button('data-pages-read').disabled).toBe(true);
    expect(button('data-pages-decide').disabled).toBe(true);
    expect(button('data-pages-pdf').disabled).toBe(false);
  });
});
