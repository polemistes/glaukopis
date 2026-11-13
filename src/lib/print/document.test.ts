import { beforeEach, describe, expect, it, vi } from 'vitest';
import { t } from '$lib/i18n';
import type { Project } from '$lib/project/model/project.svelte';
import { panes } from '$lib/project/panes.svelte';
import { toasts } from '$lib/ui/toast.svelte';

const api = vi.hoisted(() => ({
  log: [] as string[],
  whole: vi.fn(),
  stop: vi.fn(),
  pages: vi.fn(),
  printPages: vi.fn(),
  request: vi.fn(),
  choiceRead: vi.fn(),
}));

vi.mock('$lib/api/documents', () => ({
  documentPreviewWhole: api.whole,
  documentPreviewStop: api.stop,
  documentPrintPages: api.pages,
}));
vi.mock('$lib/preview/documents.svelte', () => ({
  documentRequest: api.request,
  documents: { choiceRead: api.choiceRead },
}));
vi.mock('./pages', async (original) => ({
  ...(await original<typeof import('./pages')>()),
  printPages: api.printPages,
}));

const { PRINT_BATCH, paneOpened, printDocument, printKey, printSetPages, printSide, requestOf } =
  await import('./document');

/** A page as Typst draws it: an SVG whose viewBox is its size in points. */
const svg = (width: number, height: number) =>
  `<svg class="typst-doc" viewBox="0 0 ${width} ${height}" width="${width}pt" height="${height}pt"></svg>`;

const project = {
  documentOf: () => ({ settings: {} }),
  node: () => ({ title: 'Iliad' }),
} as unknown as Project;

let made = 0;
let revoked: string[] = [];

beforeEach(() => {
  api.log = [];
  made = 0;
  revoked = [];
  URL.createObjectURL = () => `blob:page-${++made}`;
  URL.revokeObjectURL = (url: string) => void revoked.push(url);
  for (const toast of [...toasts.list]) toasts.dismiss(toast.id);
  panes.typesetting = null;
  api.request.mockReset().mockImplementation(async (_p: Project, id: string) => ({
    document: {},
    style: 'chicago',
    format: {},
    output: 'document',
    key: id,
  }));
  api.choiceRead.mockReset().mockResolvedValue({});
  api.whole.mockReset().mockImplementation(async () => {
    api.log.push('set');
    return { count: 3, width: 595.28, height: 841.89 };
  });
  api.stop.mockReset().mockImplementation(async (key: string) => void api.log.push(`stop ${key}`));
  api.pages
    .mockReset()
    .mockImplementation(async (_key: string, from: number, to: number) =>
      Array.from({ length: to - from + 1 }, (_, i) => ({ number: from + i, svg: svg(300, 400) })),
    );
  api.printPages.mockReset().mockImplementation(async () => void api.log.push('print'));
});

describe('the pages of a set document printed', () => {
  it('are fetched a batch at a time and handed to the page together', async () => {
    const printed = await printSetPages('k', 50, { width: 1, height: 2 }, 'Iliad');
    expect(api.pages.mock.calls).toEqual([
      ['k', 1, PRINT_BATCH],
      ['k', PRINT_BATCH + 1, 2 * PRINT_BATCH],
      ['k', 2 * PRINT_BATCH + 1, 50],
    ]);
    expect(api.printPages).toHaveBeenCalledTimes(1);
    const [pages, name, options] = api.printPages.mock.calls[0];
    expect(pages).toHaveLength(50);
    expect(name).toBe('Iliad');
    expect(options).toEqual({ toFile: undefined });
    // Each page has the size its SVG says; the page takes the pictures over.
    expect(pages[0]).toEqual({ url: 'blob:page-1', width: 300, height: 400 });
    expect(revoked).toEqual([]);
    expect(printed).toEqual({ count: 50, width: 300, height: 400 });
  });

  it('take the size asked where a page says none, and go to a file where one is named', async () => {
    api.pages.mockResolvedValueOnce([{ number: 1, svg: '<svg></svg>' }]);
    const printed = await printSetPages('k', 1, { width: 595, height: 842 }, 'Iliad', {
      toFile: '/tmp/out.pdf',
    });
    expect(printed).toEqual({ count: 1, width: 595, height: 842 });
    expect(api.printPages.mock.calls[0][2]).toEqual({ toFile: '/tmp/out.pdf' });
  });

  it('are counted in a notice that is gone when the printing is handed over', async () => {
    let during = -1;
    api.printPages.mockImplementationOnce(async () => void (during = toasts.list.length));
    let fetching = -1;
    api.pages.mockImplementationOnce(async () => {
      fetching = toasts.list.length;
      return [{ number: 1, svg: svg(10, 10) }];
    });
    await printSetPages('k', 1, { width: 1, height: 1 }, 'Iliad');
    expect(fetching).toBe(1);
    expect(during).toBe(0);
    expect(toasts.list).toHaveLength(0);
  });

  it('are not printed where the fetching is called off, and their pictures are let go of', async () => {
    let calls = 0;
    const printed = await printSetPages('k', 50, { width: 1, height: 2 }, 'Iliad', {
      cancelled: () => ++calls > 1,
    });
    expect(printed).toBeNull();
    expect(api.printPages).not.toHaveBeenCalled();
    expect(revoked).toHaveLength(PRINT_BATCH);
    expect(toasts.list).toHaveLength(0);
  });

  it('say what failed when a batch cannot be fetched, and let go of what was fetched', async () => {
    api.pages.mockImplementationOnce(async () => [{ number: 1, svg: svg(10, 10) }]);
    api.pages.mockRejectedValueOnce(new Error('no more'));
    await expect(printSetPages('k', 50, { width: 1, height: 2 }, 'Iliad')).rejects.toThrow(
      'no more',
    );
    expect(revoked).toEqual(['blob:page-1']);
    expect(toasts.list).toHaveLength(0);
  });
});

describe('a document printed out of sight', () => {
  it('is set under a key of its own, printed, and let go of', async () => {
    const printed = await printDocument(project, 'p1', 'e1');
    expect(printKey('p1')).toBe('p1-print');
    expect(api.whole).toHaveBeenCalledTimes(1);
    const [request, wanted] = api.whole.mock.calls[0];
    // The pane's key is the project's own: it is not touched.
    expect(request.key).toBe('p1-print');
    expect(wanted).toEqual([]);
    expect(api.pages.mock.calls).toEqual([['p1-print', 1, 3]]);
    expect(api.printPages.mock.calls[0][1]).toBe('Iliad');
    expect(printed).toEqual({ count: 3, width: 300, height: 400 });
    expect(api.stop.mock.calls).toEqual([['p1-print']]);
    // The core is let go of before the dialog may open and stay open.
    expect(api.log).toEqual(['set', 'stop p1-print', 'print']);
    expect(toasts.list).toHaveLength(0);
  });

  it('says at once that the pages are being set', async () => {
    let said = '';
    api.whole.mockImplementationOnce(async () => {
      said = toasts.list.map((toast) => toast.message).join('|');
      return { count: 1, width: 10, height: 10 };
    });
    await printDocument(project, 'p1', 'e1');
    expect(said).toBe(t('project-print-setting'));
  });

  it('is made from what its template, layout and styles are once they are read', async () => {
    const order: string[] = [];
    api.choiceRead.mockImplementationOnce(async () => void order.push('read'));
    api.request.mockImplementationOnce(async () => {
      order.push('request');
      return { document: {}, key: 'p1' };
    });
    await requestOf(project, 'p1', 'e1');
    expect(order).toEqual(['read', 'request']);
  });

  it('is let go of, and says why, where it cannot be set; and nothing is printed', async () => {
    api.whole.mockRejectedValueOnce({ kind: 'failed', message: 'Typst could not set it' });
    const printed = await printDocument(project, 'p1', 'e1');
    expect(printed).toBeNull();
    expect(api.printPages).not.toHaveBeenCalled();
    expect(api.stop.mock.calls).toEqual([['p1-print']]);
    const [told] = toasts.list;
    expect(told.kind).toBe('error');
    expect(told.message).toBe(t('preview-print-failed'));
    // The notice of the setting is gone.
    expect(toasts.list).toHaveLength(1);
  });

  it('is let go of once only, where the printing fails after its pages were fetched', async () => {
    api.printPages.mockRejectedValueOnce(new Error('the dialog could not open'));
    const printed = await printDocument(project, 'p1', 'e1');
    expect(printed).toBeNull();
    expect(api.stop.mock.calls).toEqual([['p1-print']]);
    expect(toasts.list.map((toast) => toast.kind)).toEqual(['error']);
  });

  it('asks the core for nothing where its request cannot be made, and has nothing to let go of', async () => {
    api.request.mockRejectedValueOnce(new Error('no template'));
    expect(await printDocument(project, 'p1', 'e1')).toBeNull();
    expect(api.whole).not.toHaveBeenCalled();
    expect(api.stop).not.toHaveBeenCalled();
    expect(toasts.list.map((toast) => toast.kind)).toEqual(['error']);
  });

  it('is never printed twice at once, and again when the first is over', async () => {
    let release: () => void = () => {};
    api.whole.mockImplementationOnce(
      () =>
        new Promise((done) => {
          release = () => done({ count: 1, width: 10, height: 10 });
        }),
    );
    const first = printDocument(project, 'p1', 'e1');
    await vi.waitFor(() => expect(api.whole).toHaveBeenCalledTimes(1));
    expect(await printDocument(project, 'p1', 'e1')).toBeNull();
    expect(api.whole).toHaveBeenCalledTimes(1);
    release();
    expect(await first).not.toBeNull();
    expect(await printDocument(project, 'p1', 'e1')).not.toBeNull();
    expect(api.whole).toHaveBeenCalledTimes(2);
  });

  it('prints nothing of a document that has no pages', async () => {
    api.whole.mockResolvedValueOnce({ count: 0, width: 10, height: 10 });
    expect(await printDocument(project, 'p1', 'e1')).toBeNull();
    expect(api.pages).not.toHaveBeenCalled();
    expect(api.stop.mock.calls).toEqual([['p1-print']]);
  });
});

describe('the document of a side printed', () => {
  const side = { key: 'a', project: 'p1' };

  it('goes through the typesetting pane where it is open for the side', async () => {
    const print = vi.fn(async () => ({ count: 2, width: 1, height: 1 }));
    const closed = paneOpened({ print });
    panes.typesetting = 'a';
    expect(await printSide(side, project, 'e1', '/tmp/x.pdf')).toEqual({
      count: 2,
      width: 1,
      height: 1,
    });
    expect(print).toHaveBeenCalledWith('/tmp/x.pdf');
    expect(api.whole).not.toHaveBeenCalled();
    closed();
  });

  it('is set out of sight where the pane shows the other side, and the pane stays as it is', async () => {
    const print = vi.fn();
    const closed = paneOpened({ print });
    panes.typesetting = 'b';
    await printSide(side, project, 'e1');
    expect(print).not.toHaveBeenCalled();
    expect(api.whole).toHaveBeenCalledTimes(1);
    expect(panes.typesetting).toBe('b');
    closed();
  });

  it('is set out of sight where the pane is closed, and the pane stays closed', async () => {
    await printSide(side, project, 'e1');
    expect(api.whole).toHaveBeenCalledTimes(1);
    expect(panes.typesetting).toBeNull();
  });

  it('is set out of sight once the pane that was open has gone', async () => {
    const print = vi.fn();
    const closed = paneOpened({ print });
    closed();
    panes.typesetting = 'a';
    await printSide(side, project, 'e1');
    expect(print).not.toHaveBeenCalled();
    expect(api.whole).toHaveBeenCalledTimes(1);
  });
});
