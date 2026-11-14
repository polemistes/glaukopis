import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ImportOutcome } from '$lib/api/library';

// Taking images in and importing references reach the core; here each says
// what it was given, and what it made of it.
const made = vi.hoisted(() => ({
  taken: [] as string[][],
  imported: [] as string[][],
  images: [] as { hash: string }[],
  added: [] as string[],
  outcome: true,
}));
vi.mock('$lib/figures/images.svelte', () => ({
  takeIn: async (paths: string[]) => {
    made.taken.push(paths);
    return made.images;
  },
}));
vi.mock('$lib/library/references.svelte', () => ({
  importDropped: async (paths: string[]): Promise<ImportOutcome | null> => {
    made.imported.push(paths);
    return made.outcome
      ? { added: made.added, updated: [], skipped: 0, files: 0, problems: [] }
      : null;
  },
}));

const { arrivals, arrive, dropOnList } = await import('./pane-adding.svelte');

beforeEach(() => {
  made.taken = [];
  made.imported = [];
  made.images = [];
  made.added = [];
  made.outcome = true;
  arrivals.waiting = null;
});

describe('what came into the library through a list of the pane', () => {
  it('waits for the panel of its tab, with what came', () => {
    arrive('images', ['abc']);
    expect(arrivals.waiting).toEqual({ tab: 'images', ids: ['abc'] });
    arrive('references', ['lord1960', 'nagy1979']);
    expect(arrivals.waiting).toEqual({ tab: 'references', ids: ['lord1960', 'nagy1979'] });
  });

  it('is not told where nothing came', () => {
    arrive('references', []);
    expect(arrivals.waiting).toBeNull();
  });
});

describe('files dropped on a list of the pane', () => {
  it('give the images among them to be taken in, and the rest to the import of references', async () => {
    made.images = [{ hash: 'abc' }];
    await dropOnList(['/desk/The shield.png', '/desk/Parry.pdf', '/desk/all.bib'], 'references');
    expect(made.taken).toEqual([['/desk/The shield.png', '/desk/Parry.pdf', '/desk/all.bib']]);
    expect(made.imported).toEqual([['/desk/Parry.pdf', '/desk/all.bib']]);
  });

  it('import nothing where all of them are images', async () => {
    made.images = [{ hash: 'abc' }, { hash: 'def' }];
    await dropOnList(['/desk/a.png', '/desk/b.svg'], 'references');
    expect(made.imported).toEqual([]);
  });

  it('show the images where an image is dropped on the references', async () => {
    made.images = [{ hash: 'abc' }];
    await dropOnList(['/desk/The shield.png'], 'references');
    expect(arrivals.waiting).toEqual({ tab: 'images', ids: ['abc'] });
  });

  it('show the references where a PDF is dropped on the images', async () => {
    made.added = ['parry1971'];
    await dropOnList(['/desk/Parry.pdf'], 'images');
    expect(arrivals.waiting).toEqual({ tab: 'references', ids: ['parry1971'] });
  });

  it('show what is of the kind of the list, where such files are dropped on it', async () => {
    made.images = [{ hash: 'abc' }];
    await dropOnList(['/desk/The shield.png'], 'images');
    expect(arrivals.waiting).toEqual({ tab: 'images', ids: ['abc'] });
    arrivals.waiting = null;
    made.added = ['parry1971'];
    await dropOnList(['/desk/Parry.pdf'], 'references');
    expect(arrivals.waiting).toEqual({ tab: 'references', ids: ['parry1971'] });
  });

  it('leave the tab where it is where both kinds came, and show what is of its kind', async () => {
    made.images = [{ hash: 'abc' }];
    made.added = ['parry1971'];
    const paths = ['/desk/The shield.png', '/desk/Parry.pdf'];
    await dropOnList(paths, 'references');
    expect(arrivals.waiting).toEqual({ tab: 'references', ids: ['parry1971'] });
    await dropOnList(paths, 'images');
    expect(arrivals.waiting).toEqual({ tab: 'images', ids: ['abc'] });
  });

  it('show nothing where nothing came: the import given up, or only what was known', async () => {
    made.outcome = false;
    await dropOnList(['/desk/Parry.pdf'], 'references');
    expect(arrivals.waiting).toBeNull();
    made.outcome = true;
    made.added = [];
    await dropOnList(['/desk/Parry.pdf'], 'images');
    expect(arrivals.waiting).toBeNull();
  });

  it('show the images where the references were given up, and the rest went to the import', async () => {
    made.outcome = false;
    made.images = [{ hash: 'abc' }];
    await dropOnList(['/desk/The shield.png', '/desk/Parry.pdf'], 'references');
    expect(arrivals.waiting).toEqual({ tab: 'images', ids: ['abc'] });
  });
});
