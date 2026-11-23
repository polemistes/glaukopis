import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// The place is mounted and changed under it, so with the browser's Svelte.
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
const opened = vi.hoisted(() => ({
  theNotebook: { current: null, failure: null as string | null },
}));
vi.mock('$lib/notebook/open.svelte', () => opened);

const { flushSync, mount, unmount } = await import('svelte');
const { Notebook } = await import('$lib/notebook/model/notebook.svelte');
const { settings } = await import('$lib/state/settings.svelte');
const { NOTEBOOK_VIEW } = await import('$lib/state/settings.svelte');
const { places } = await import('./places.svelte');
const { default: NotesPlace } = await import('./NotesPlace.svelte');

let done = () => {};

beforeAll(() => {
  // Not in jsdom: the list measures its rows by it.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  settings.value.notebookView = structuredClone(NOTEBOOK_VIEW);
  places.begin();
});

afterEach(() => {
  done();
  done = () => {};
});

function setUp(notebook: InstanceType<typeof Notebook> | null) {
  const target = document.createElement('div');
  document.body.append(target);
  const place = mount(NotesPlace, { target, props: { notebook } });
  flushSync();
  done = () => {
    unmount(place);
    target.remove();
  };
  const q = <E extends HTMLElement = HTMLElement>(selector: string) =>
    document.querySelector<E>(selector);
  const rows = () =>
    Array.from(target.querySelectorAll<HTMLElement>('[data-phone-row]')).map((r) =>
      r.querySelector('[data-phone-row-title]')!.textContent!.trim(),
    );
  const find = (words: string) => {
    const field = q<HTMLInputElement>('[data-phone-find]')!;
    field.value = words;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  };
  return { target, q, rows, find };
}

describe('the notes, on the phone', () => {
  it('says the notebook is empty, and makes a note that is opened, fresh', () => {
    const nb = new Notebook();
    const { q } = setUp(nb);
    expect(q('[data-phone-empty]')!.dataset.phoneEmpty).toBe('empty');
    q('[data-phone-new]')!.click();
    flushSync();
    expect(nb.notes.size).toBe(1);
    const [note] = nb.list;
    expect(places.current).toEqual({ at: 'note', note: note.id, fresh: true });
  });

  it('says the notebook could not be read, with what the reading said', () => {
    opened.theNotebook.failure = 'The notebook was written by a later version';
    const { q } = setUp(null);
    const empty = q('[data-phone-empty]')!;
    expect(empty.dataset.phoneEmpty).toBe('unreadable');
    expect(empty.textContent).toContain('The notebook was written by a later version');
    expect(q('[data-phone-new]')).toBeNull();
    opened.theNotebook.failure = null;
  });

  it('shows the notes newest first, finds by a word, and shows all again by the ×', () => {
    const nb = new Notebook();
    nb.addNote({ name: 'Owls', made: '2026-11-20T10:00:00.000Z' });
    const words = nb.addNote({ made: '2026-11-21T10:00:00.000Z' });
    nb.addText(words, 'Grey-eyed Athena');
    const { q, rows, find } = setUp(nb);
    expect(rows()).toEqual(['Grey-eyed Athena', 'Owls']);
    find('athena');
    expect(rows()).toEqual(['Grey-eyed Athena']);
    find('nothing like it');
    expect(q('[data-phone-empty]')!.dataset.phoneEmpty).toBe('nothing-found');
    q('[data-phone-find-clear]')!.click();
    flushSync();
    expect(rows()).toEqual(['Grey-eyed Athena', 'Owls']);
  });

  it('opens a note when its row is pressed', () => {
    const nb = new Notebook();
    const id = nb.addNote({ name: 'Owls' });
    const { q } = setUp(nb);
    q(`[data-phone-row="${id}"]`)!.click();
    expect(places.current).toEqual({ at: 'note', note: id });
  });

  it('is narrowed by the filter: a box, a tag, and all notes again; Back closes the sheet', () => {
    const nb = new Notebook();
    const box = nb.addBox('Birds');
    nb.addNote({ name: 'In the box', box, made: '2026-11-20T10:00:00.000Z' });
    nb.addNote({ name: 'Tagged', tags: ['athena'], made: '2026-11-21T10:00:00.000Z' });
    nb.addNote({ name: 'Plain', made: '2026-11-22T10:00:00.000Z' });
    const { q, rows } = setUp(nb);
    expect(q('[data-phone-filter]')!.hasAttribute('data-on')).toBe(false);

    q('[data-phone-filter]')!.click();
    flushSync();
    expect(q('[data-phone-sheet]')).not.toBeNull();
    q(`[data-phone-filter-box="${box}"]`)!.click();
    flushSync();
    expect(rows()).toEqual(['In the box']);
    expect(q('[data-phone-filter]')!.hasAttribute('data-on')).toBe(true);

    q('[data-phone-filter-box="all"]')!.click();
    q('[data-phone-filter-tag="athena"]')!.click();
    flushSync();
    expect(rows()).toEqual(['Tagged']);

    // A new note is made with the tags that are on, in the box that receives.
    places.back();
    flushSync();
    expect(q('[data-phone-sheet]')).toBeNull();
    expect(places.current).toEqual({ at: 'notes' });
    q('[data-phone-new]')!.click();
    const made = nb.list[0];
    expect(made.tags).toEqual(['athena']);
    expect(made.box).toBe(nb.receiving);
  });

  it('closes the filter by Done, and one step less is left', () => {
    const nb = new Notebook();
    nb.addNote({ name: 'Owls' });
    const { q } = setUp(nb);
    const before = places.depth;
    q('[data-phone-filter]')!.click();
    flushSync();
    expect(places.depth).toBe(before + 1);
    q('[data-phone-filter-done]')!.click();
    flushSync();
    expect(q('[data-phone-sheet]')).toBeNull();
    expect(places.depth).toBe(before);
  });
});
