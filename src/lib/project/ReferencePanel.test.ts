import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Summary } from '$lib/api/library';

// The panel is mounted and pressed, so with the browser's Svelte: the tests
// otherwise run with the server's, in which nothing is followed.
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
// Dropped files reach the core; here each only says what it was given.
const dropped = vi.hoisted(() => ({ taken: [] as string[][], imported: [] as string[][] }));
vi.mock('$lib/figures/images.svelte', () => ({
  takeIn: async (paths: string[]) => {
    dropped.taken.push(paths);
    return [];
  },
}));
vi.mock('$lib/library/references.svelte', async (actual) => {
  const real = await actual<typeof import('$lib/library/references.svelte')>();
  return {
    ...real,
    importDropped: async (paths: string[]) => {
      dropped.imported.push(paths);
      return null;
    },
  };
});

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const { flushSync, mount, tick, unmount } = await import('svelte');
const { library } = await import('$lib/state/library.svelte');
const { menuState, closeMenu } = await import('$lib/ui/menu.svelte');
const { outsideDrop } = await import('$lib/ui/drag.svelte');
const { Project } = await import('./model/project.svelte');
const { PROJECT } = await import('./model/types');
const { arrivals, arrive } = await import('./pane-adding.svelte');
const { default: ReferencePanel } = await import('./ReferencePanel.svelte');

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
    search: authors.toLowerCase(),
  } as Summary;
}

/** A library of three, of which the project cites one. */
function setUp() {
  library.entries = [entry('lord', 'Lord'), entry('nagy', 'Nagy'), entry('parry', 'Parry')];
  library.loaded = true;
  const project = new Project(null);
  project.begin('Wrath');
  project.cite(PROJECT, ['nagy']);
  const target = document.createElement('div');
  document.body.append(target);
  const panel = mount(ReferencePanel, { target, props: { project, onclose: () => {} } });
  flushSync();
  const done = () => {
    unmount(panel);
    target.remove();
  };
  const names = () =>
    Array.from(target.querySelectorAll<HTMLElement>('.item')).map((i) => i.dataset.id);
  const selected = () =>
    Array.from(target.querySelectorAll<HTMLElement>('.item[aria-selected="true"]')).map(
      (i) => i.dataset.id,
    );
  const choices = () =>
    Array.from(target.querySelectorAll<HTMLElement>('[role="radio"]')).map((r) =>
      r.textContent!.trim(),
    );
  const choose = (word: string) => {
    Array.from(target.querySelectorAll<HTMLElement>('[role="radio"]'))
      .find((r) => r.textContent!.trim() === word)!
      .click();
    flushSync();
  };
  return { project, target, names, selected, choices, choose, done };
}

afterEach(() => {
  arrivals.waiting = null;
  closeMenu();
  dropped.taken = [];
  dropped.imported = [];
});

describe('the references of the document pane', () => {
  it('have two choices, those the project cites and all, and begin with those it cites', () => {
    const { names, choices, choose, done } = setUp();
    expect(choices()).toEqual(['Cited', 'All']);
    expect(names()).toEqual(['nagy']);
    choose('All');
    expect(names()).toEqual(['lord', 'nagy', 'parry']);
    choose('Cited');
    expect(names()).toEqual(['nagy']);
    done();
  });

  it('have one plus, which opens the menu of the Library page for adding, with a new reference first', () => {
    const { target, done } = setUp();
    expect(target.querySelectorAll('.tools .row > button').length).toBe(1);
    target.querySelector<HTMLElement>('button[aria-label="Add references"]')!.click();
    flushSync();
    const items = menuState.current!.items.map((i) => (i.kind === 'separator' ? '—' : i.label));
    expect(items).toEqual([
      'New reference',
      '—',
      'Import Bib(La)TeX…',
      'Import from Zotero…',
      'Paste references…',
      'Add PDF files…',
    ]);
    done();
  });

  it('show what came as all of the library, nothing searched for, with it selected', async () => {
    const { target, names, selected, choices, done } = setUp();
    const field = target.querySelector<HTMLInputElement>('input[type="search"]')!;
    field.value = 'Nagy';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    expect(names()).toEqual(['nagy']);
    arrive('references', ['parry']);
    flushSync();
    await tick();
    expect(arrivals.waiting).toBeNull();
    expect(field.value).toBe('');
    expect(names()).toEqual(['lord', 'nagy', 'parry']);
    expect(selected()).toEqual(['parry']);
    expect(choices()).toEqual(['Cited', 'All']);
    expect(target.querySelector('[role="radio"][aria-checked="true"]')!.textContent).toContain(
      'All',
    );
    done();
  });

  it('take what came as the pane shows them, made after it came', async () => {
    arrive('references', ['lord', 'parry']);
    const { names, selected, done } = setUp();
    flushSync();
    await tick();
    expect(arrivals.waiting).toBeNull();
    expect(names()).toEqual(['lord', 'nagy', 'parry']);
    expect(selected()).toEqual(['lord', 'parry']);
    done();
  });

  it('leave alone what came as images, for the panel of the images', () => {
    arrive('images', ['abc']);
    const { names, done } = setUp();
    expect(arrivals.waiting).toEqual({ tab: 'images', ids: ['abc'] });
    expect(names()).toEqual(['nagy']);
    done();
  });

  it('take any files dropped on them, and give them to the pane to be sorted by kind', async () => {
    const { target, done } = setUp();
    const aside = target.querySelector('aside')!;
    // jsdom does not lay anything out: the point is the panel's wherever it is.
    document.elementFromPoint = () => aside;
    expect(
      outsideDrop(
        { kind: 'files', data: ['/desk/Parry.pdf', '/desk/The shield.png'], label: '2 files' },
        10,
        10,
      ),
    ).toBe(true);
    await vi.waitFor(() => expect(dropped.imported).toEqual([['/desk/Parry.pdf']]));
    expect(dropped.taken).toEqual([['/desk/Parry.pdf', '/desk/The shield.png']]);
    done();
  });
});
