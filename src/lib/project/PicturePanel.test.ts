import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FileView } from '$lib/api/files';
import type { Block } from './model/text';

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
vi.mock('$lib/figures/images.svelte', async (actual) => {
  const real = await actual<typeof import('$lib/figures/images.svelte')>();
  return {
    ...real,
    addPictures: async () => [],
    takeIn: async (paths: string[]) => {
      dropped.taken.push(paths);
      return [];
    },
  };
});
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
Element.prototype.scrollIntoView ??= () => {};

const { flushSync, mount, tick, unmount } = await import('svelte');
const { SvelteMap } = await import('svelte/reactivity');
const { files } = await import('$lib/files/store.svelte');
const { outsideDrop } = await import('$lib/ui/drag.svelte');
const { writeBody } = await import('./model/blocks');
const { Project } = await import('./model/project.svelte');
const { paragraph } = await import('./model/text');
const { PROJECT } = await import('./model/types');
const { arrivals, arrive } = await import('./pane-adding.svelte');
const { default: PicturePanel } = await import('./PicturePanel.svelte');

const picture = (name: string, hash: string): FileView => ({
  hash,
  path: name,
  name,
  kind: 'picture',
  size: 1,
  exists: true,
  folder: null,
  origin: null,
  added: name,
  width: 10,
  height: 10,
  alt: '',
  madeFrom: null,
  bookmarks: [],
  references: [],
});

const figure = (file: string, name: string): Block => ({
  kind: 'figure',
  id: `f-${file}`,
  file,
  extension: 'png',
  name,
  caption: [],
  alt: '',
  width: 100,
  numbered: true,
});

/** A library of three images, of which a figure of the project shows one, unless it has none. */
function setUp(figures = true) {
  files.files = [
    picture('Rings.png', 'rings'),
    picture('The shield.png', 'shield'),
    picture('Plate.png', 'plate'),
  ];
  files.loaded = true;
  const project = new Project(null);
  project.begin('Wrath');
  const element = project.addChild(PROJECT, { title: 'Part' })!;
  if (figures)
    project.transact(() =>
      writeBody(project.fragment(element, 'body')!, [
        paragraph([]),
        figure('shield', 'The shield.png'),
      ]),
    );
  const target = document.createElement('div');
  document.body.append(target);
  // The window holds which images are shown, and the panel is bound to it.
  const held = new SvelteMap<string, 'project' | 'library'>([['scope', 'project']]);
  const shown = {
    get scope() {
      return held.get('scope')!;
    },
    set scope(to: 'project' | 'library') {
      held.set('scope', to);
    },
  };
  const props = { project, at: PROJECT, onclose: () => {} };
  Object.defineProperty(props, 'scope', {
    enumerable: true,
    get: () => shown.scope,
    set: (to: 'project' | 'library') => (shown.scope = to),
  });
  const panel = mount(PicturePanel, { target, props });
  flushSync();
  const done = () => {
    unmount(panel);
    target.remove();
  };
  const names = () =>
    Array.from(target.querySelectorAll<HTMLElement>('[role="option"]')).map((r) => r.dataset.hash);
  const selected = () =>
    Array.from(target.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]')).map(
      (r) => r.dataset.hash,
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
  return { target, shown, names, selected, choices, choose, done };
}

afterEach(() => {
  arrivals.waiting = null;
  dropped.taken = [];
  dropped.imported = [];
});

describe('the images of the document pane', () => {
  it('have two choices, those the figures show and all, and begin with those the figures show', () => {
    const { names, choices, choose, done } = setUp();
    expect(choices()).toEqual(['Used', 'All']);
    expect(names()).toEqual(['shield']);
    choose('All');
    expect(names().sort()).toEqual(['plate', 'rings', 'shield']);
    choose('Used');
    expect(names()).toEqual(['shield']);
    done();
  });

  it('say, where no figure shows an image, that all of them are under All', () => {
    const { target, done } = setUp(false);
    const words = target.querySelector('.body')!.textContent!;
    expect(words).toContain('Every image of the library is under All');
    done();
  });

  it('show what came as all of the library, nothing searched for, with it selected', async () => {
    const { target, shown, names, selected, done } = setUp();
    const field = target.querySelector<HTMLInputElement>('input[type="search"]')!;
    field.value = 'shield';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
    arrive('images', ['rings']);
    flushSync();
    await tick();
    expect(arrivals.waiting).toBeNull();
    expect(shown.scope).toBe('library');
    expect(field.value).toBe('');
    expect(names().sort()).toEqual(['plate', 'rings', 'shield']);
    expect(selected()).toEqual(['rings']);
    done();
  });

  it('leave alone what came as references, for the panel of the references', () => {
    arrive('references', ['lord']);
    const { names, shown, done } = setUp();
    expect(arrivals.waiting).toEqual({ tab: 'references', ids: ['lord'] });
    expect(shown.scope).toBe('project');
    expect(names()).toEqual(['shield']);
    done();
  });

  it('take any files dropped on them, and give them to the pane to be sorted by kind', async () => {
    const { target, done } = setUp();
    const aside = target.querySelector('aside')!;
    // jsdom does not lay anything out: the point is the panel's wherever it is.
    document.elementFromPoint = () => aside;
    expect(outsideDrop({ kind: 'files', data: ['/desk/Parry.pdf'], label: '1 file' }, 10, 10)).toBe(
      true,
    );
    await vi.waitFor(() => expect(dropped.imported).toEqual([['/desk/Parry.pdf']]));
    expect(dropped.taken).toEqual([['/desk/Parry.pdf']]);
    done();
  });
});
