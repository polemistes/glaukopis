import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  filesUnassign: vi.fn(async () => {}),
  filesList: vi.fn(async () => ({ folders: [], files: [] })),
  libraryRemove: vi.fn(async (ids: string[]) => ids.length),
  library: { reload: vi.fn(async () => {}) },
}));

vi.mock('$lib/api/files', async (original) => ({
  ...(await original<typeof import('$lib/api/files')>()),
  filesUnassign: api.filesUnassign,
  filesList: api.filesList,
}));
vi.mock('$lib/api/library', async (original) => ({
  ...(await original<typeof import('$lib/api/library')>()),
  libraryRemove: api.libraryRemove,
}));
vi.mock('$lib/state/library.svelte', async (original) => ({
  ...(await original<typeof import('$lib/state/library.svelte')>()),
  library: api.library,
}));

const { filesUi, rememberGoing, undoLast } = await import('./store.svelte');
const { toasts } = await import('$lib/ui/toast.svelte');

describe('undoing a going-through', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    filesUi.lastDone = null;
    filesUi.lastToast = null;
    for (const toast of [...toasts.list]) toasts.dismiss(toast.id);
  });

  it('offers one undo at a time, and each undoes what it tells of', async () => {
    const a = { assigned: [{ hash: 'a1', id: 'r1' }], made: [] };
    const b = { assigned: [{ hash: 'b1', id: 'r2' }], made: [] };
    rememberGoing(a, 'A done');
    rememberGoing(b, 'B done');
    // The message of A is taken away when B's comes: no two undos stand together.
    expect(toasts.list.map((t) => t.message)).toEqual(['B done']);
    toasts.list[0].action!.run();
    await vi.waitFor(() => expect(api.filesUnassign).toHaveBeenCalledTimes(1));
    expect(api.filesUnassign).toHaveBeenCalledWith([{ hash: 'b1', id: 'r2' }]);
    expect(filesUi.lastDone).toBeNull();
  });

  it('does not undo a later going-through from the offer of an earlier one', async () => {
    const a = { assigned: [{ hash: 'a1', id: 'r1' }], made: [] };
    const b = { assigned: [{ hash: 'b1', id: 'r2' }], made: [] };
    rememberGoing(a, 'A done');
    const offerOfA = toasts.list[0].action!.run;
    rememberGoing(b, 'B done');
    await undoLast(a);
    offerOfA();
    expect(api.filesUnassign).not.toHaveBeenCalled();
    expect(filesUi.lastDone).toBe(b);
  });
});

describe('a file named by its reference', () => {
  const work = (more: Partial<import('$lib/api/library').Summary>) =>
    ({
      id: 'w',
      authors: 'Lord',
      year: '1960',
      title: 'The Singer of Tales',
      translators: '',
      ...more,
    }) as import('$lib/api/library').Summary;
  const file = (references: import('$lib/api/library').Summary[]) =>
    ({
      hash: 'h',
      name: 'lord-singer.pdf',
      references,
    }) as unknown as import('$lib/api/files').FileView;

  it('by the short form of its reference, the title and the name in the tooltip', async () => {
    const { fileLabel } = await import('./store.svelte');
    expect(fileLabel(file([work({})]))).toEqual({
      name: 'Lord 1960',
      title: 'The Singer of Tales\nlord-singer.pdf',
      named: true,
    });
    expect(fileLabel(file([]))).toEqual({
      name: 'lord-singer.pdf',
      title: 'lord-singer.pdf',
      named: false,
    });
    expect(fileLabel(undefined, 'gone')).toEqual({ name: 'gone', title: 'gone', named: false });
  });

  it('with its own name only where its work has another file of the same ending', async () => {
    const { twinsOf } = await import('./store.svelte');
    const at = (hash: string, path: string, references: import('$lib/api/library').Summary[]) =>
      ({ hash, path, name: path, references }) as unknown as import('$lib/api/files').FileView;
    const twins = twinsOf([
      at('v1', 'aa/v1/Volume 1.pdf', [work({})]),
      at('v2', 'aa/v2/Volume 2.PDF', [work({})]),
      at('ep', 'aa/ep/Singer.epub', [work({})]),
      at('other', 'aa/ot/Other.pdf', [work({ id: 'x' })]),
      at('loose1', 'aa/l1/scan.pdf', []),
      at('loose2', 'aa/l2/scan2.pdf', []),
    ]);
    expect([...twins].sort()).toEqual(['v1', 'v2']);
  });

  it('with its people and their roles, the translators after the others', async () => {
    const { peopleWords } = await import('./store.svelte');
    expect(peopleWords(work({}))).toBe('Lord');
    expect(peopleWords(work({ authors: 'Homer', translators: 'Lattimore' }))).toBe(
      'Homer; tr. Lattimore',
    );
  });
});
