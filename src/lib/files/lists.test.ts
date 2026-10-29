import { describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';
import type { FileView } from '$lib/api/files';
import type { Summary } from '$lib/api/library';

// The lists are mounted and searched in, so with the browser's Svelte: the
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

const { flushSync, mount, unmount } = await import('svelte');
const { files } = await import('./store.svelte');
const { library } = await import('$lib/state/library.svelte');
const { default: FileChooser } = await import('./FileChooser.svelte');
const { default: ReferenceChooser } = await import('./ReferenceChooser.svelte');
const { default: FilesView } = await import('./FilesView.svelte');

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true;
};
Element.prototype.scrollIntoView ??= () => {};
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const reference = (i: number) =>
  ({
    id: `r${i}`,
    key: `r${i}`,
    type: 'book',
    authors: `Author ${i}`,
    authorsSort: `author ${i}`,
    year: '1979',
    yearNumber: 1979,
    title: `Book ${i}`,
    search: `author ${i} book ${i} 1979`,
    added: '',
    modified: '',
  }) as unknown as Summary;

const file = (i: number): FileView => ({
  hash: `h${i}`,
  path: `f${i}.pdf`,
  name: `File ${i}.pdf`,
  kind: 'pdf',
  size: 1,
  exists: true,
  folder: null,
  origin: null,
  added: '',
  width: null,
  height: null,
  alt: '',
  madeFrom: null,
  bookmarks: [],
  references: [],
});

/**
 * Mounts a list, and types a search into it letter by letter. Says how many
 * times anything was sorted while it was typed, and what the list showed.
 */
function typeInto<Props extends Record<string, unknown>>(
  component: Component<Props>,
  props: Props,
  letters: string[],
) {
  const target = document.createElement('div');
  document.body.append(target);
  const shown = mount(component, { target, props });
  flushSync();
  const field =
    target.querySelector<HTMLInputElement>('input[type="search"]') ??
    target.querySelector<HTMLInputElement>('input')!;
  const sorts = vi.spyOn(Array.prototype, 'sort');
  for (const query of letters) {
    field.value = query;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  }
  const sorted = sorts.mock.calls.length;
  sorts.mockRestore();
  const text = target.textContent ?? '';
  unmount(shown);
  target.remove();
  return { sorted, text };
}

describe('a list searched in', () => {
  it('of the files to choose, is sorted once, not again for every letter typed', () => {
    files.load = vi.fn(async () => {});
    files.files = Array.from({ length: 100 }, (_, i) => file(i));
    const { sorted, text } = typeInto(
      FileChooser,
      { title: 'Files', except: [], onpick: () => {}, onclose: () => {} },
      ['F', 'Fi', 'Fil', 'File', 'File 1'],
    );
    expect(sorted).toBe(0);
    expect(text).toContain('File 1.pdf');
    expect(text).not.toContain('File 2.pdf');
  });

  it('of the references to choose, is sorted once, not again for every letter typed', () => {
    library.load = vi.fn(async () => {});
    library.entries = Array.from({ length: 100 }, (_, i) => reference(i));
    const { sorted, text } = typeInto(ReferenceChooser, { onpick: () => {}, onclose: () => {} }, [
      'A',
      'Au',
      'Auth',
      'Author',
      'Author 2',
    ]);
    expect(sorted).toBe(0);
    expect(text).toContain('Book 2');
    expect(text).not.toContain('Book 3');
  });

  it('of the files of the library, is sorted once, not again for every letter typed', () => {
    files.reload = vi.fn(async () => {});
    files.loaded = true;
    library.load = vi.fn(async () => {});
    files.files = Array.from({ length: 100 }, (_, i) => file(i));
    const { sorted, text } = typeInto(FilesView, {}, ['F', 'Fi', 'Fil', 'File', 'File 1']);
    expect(sorted).toBe(0);
    // The rows are drawn as they are scrolled to, which they are not here: File 1 and 10 to 19.
    expect(text).toMatch(/\b11 of 100\b/);
  });
});
