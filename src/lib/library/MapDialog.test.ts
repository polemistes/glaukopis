import { describe, expect, it, vi } from 'vitest';
import type { Collection, Summary } from '$lib/api/library';

// The dialog is mounted and typed into, so with the browser's Svelte: the
// tests otherwise run with the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);
vi.mock(
  'svelte/reactivity',
  // @ts-expect-error: the same.
  () => import('../../../node_modules/svelte/src/reactivity/index-client.js'),
);
vi.mock('$lib/state/projects.svelte', () => ({
  projects: { loaded: true, list: [], load: vi.fn(), create: vi.fn() },
  openProject: vi.fn(),
}));
vi.mock('./map', async (actual) => {
  const map = await actual<typeof import('./map')>();
  return { ...map, planMap: vi.fn(map.planMap) };
});

const { flushSync, mount, unmount } = await import('svelte');
const { library } = await import('$lib/state/library.svelte');
const { planMap } = await import('./map');
const { default: MapDialog } = await import('./MapDialog.svelte');

function entry(id: string, authors: string): Summary {
  return {
    id,
    key: id,
    type: 'book',
    authors,
    authorsSort: authors.toLowerCase(),
    translators: '',
    year: '1979',
    yearNumber: 1979,
    title: `A book by ${authors}`,
    container: '',
    publisher: '',
    attachments: 0,
  } as Summary;
}

describe('the dialog that makes a map of the library', () => {
  it('lays the map out once, not again for every letter of its name', () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    library.entries = Array.from({ length: 50 }, (_, i) => entry(`e${i}`, `Author ${i}`));
    library.collections = [
      { id: 'c1', name: 'Homer', parent: null, entries: ['e1', 'e2'] } as Collection,
    ];
    const target = document.createElement('div');
    document.body.append(target);
    const dialog = mount(MapDialog, {
      target,
      props: { collection: null, sort: { key: 'authors', descending: false }, onclose: () => {} },
    });
    flushSync();
    const laid = vi.mocked(planMap).mock.calls.length;
    expect(laid).toBeGreaterThan(0);
    expect(target.querySelector('[data-fact="references"] dd')?.textContent).toBe('50');

    const field = target.querySelector<HTMLInputElement>('input')!;
    for (const name of ['T', 'Th', 'The', 'The l', 'The library']) {
      field.value = name;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      flushSync();
    }
    expect(vi.mocked(planMap).mock.calls.length).toBe(laid);

    // A reference added to the library lays it out again.
    library.entries = [...library.entries, entry('e50', 'Author 50')];
    flushSync();
    expect(vi.mocked(planMap).mock.calls.length).toBe(laid + 1);
    expect(target.querySelector('[data-fact="references"] dd')?.textContent).toBe('51');
    unmount(dialog);
    target.remove();
  });
});
