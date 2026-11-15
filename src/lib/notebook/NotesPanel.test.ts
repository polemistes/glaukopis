import { afterEach, describe, expect, it, vi } from 'vitest';

// The panel is mounted and typed in, so with the browser's Svelte: the tests
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

const held = vi.hoisted(() => ({ notebook: null as unknown, observed: [] as (() => void)[] }));
vi.mock('./open.svelte', () => ({
  theNotebook: {
    get current() {
      return held.notebook;
    },
    failure: null,
    open: async () => held.notebook,
  },
}));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
// The end of the cards drawn comes into view when it is told to.
globalThis.IntersectionObserver = class {
  #seen: (entries: { isIntersecting: boolean }[]) => void;
  constructor(seen: (entries: { isIntersecting: boolean }[]) => void) {
    this.#seen = seen;
  }
  observe() {
    held.observed.push(() => this.#seen([{ isIntersecting: true }]));
  }
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;
Element.prototype.scrollTo ??= () => {};

const { flushSync, mount, unmount } = await import('svelte');
const { Notebook } = await import('./model/notebook.svelte');
const { Project } = await import('$lib/project/model/project.svelte');
const { openProjects } = await import('$lib/project/open-projects.svelte');
const { default: NotesPanel } = await import('./NotesPanel.svelte');

let done: (() => void) | null = null;

afterEach(() => {
  done?.();
  done = null;
  held.observed = [];
  vi.restoreAllMocks();
});

function setUp(fill: (nb: InstanceType<typeof Notebook>) => void) {
  const nb = new Notebook();
  fill(nb);
  held.notebook = nb;
  const project = new Project(null);
  project.begin('Wrath');
  const target = document.body.appendChild(document.createElement('div'));
  const panel = mount(NotesPanel, { target, props: { project, onclose: () => {} } });
  flushSync();
  done = () => {
    unmount(panel);
    target.remove();
  };
  const titles = () =>
    Array.from(target.querySelectorAll<HTMLElement>('article .name')).map((n) => n.textContent);
  const search = (words: string) => {
    const field = target.querySelector<HTMLInputElement>('input[type="search"]')!;
    field.value = words;
    field.dispatchEvent(new Event('input'));
    flushSync();
  };
  return { nb, project, target, titles, search };
}

describe('the notes in the document pane', () => {
  it('lists the notes newest first, each by its name or how it begins, and finds them by their words', () => {
    const { titles, search } = setUp((nb) => {
      const a = nb.addNote({ made: '2026-11-13T10:00:00Z' });
      nb.addText(a, 'Owls hunt at night.');
      const b = nb.addNote({ name: 'Herons', made: '2026-11-14T10:00:00Z' });
      nb.addText(b, 'They stand still.');
    });
    expect(titles()).toEqual(['Herons', 'Owls hunt at night.']);
    search('owls');
    expect(titles()).toEqual(['Owls hunt at night.']);
    search('nothing like it');
    expect(titles()).toEqual([]);
  });

  it('shows a passage with its source under it, and No source where it has none', () => {
    const { target } = setUp((nb) => {
      const source = nb.addSource({
        sort: 'web',
        url: 'https://a.example',
        title: 'Page A',
        read: '',
      });
      const note = nb.addNote();
      nb.addText(note, 'Taken words.', nb.addPassage(source, 'Taken words.'));
      const other = nb.addNote();
      nb.addText(other, 'From nowhere.', nb.addPassage(null, 'From nowhere.'));
    });
    const sources = Array.from(target.querySelectorAll('.piece.passage .source')).map(
      (s) => s.textContent,
    );
    expect(sources.sort()).toEqual(['No source', 'Page A']);
  });

  it('marks a note used in this project', () => {
    const { target, project } = setUp((nb) => {
      const note = nb.addNote();
      nb.addText(note, 'Used.');
      nb.went(note, { what: 'text', project: 'p1' });
      nb.addText(nb.addNote(), 'Not used.');
    });
    expect(target.querySelectorAll('.used').length).toBe(0);
    done?.();
    vi.spyOn(openProjects, 'all').mockReturnValue([
      { id: 'p1', project } as unknown as ReturnType<typeof openProjects.all>[number],
    ]);
    const target2 = document.body.appendChild(document.createElement('div'));
    const panel = mount(NotesPanel, { target: target2, props: { project, onclose: () => {} } });
    flushSync();
    done = () => {
      unmount(panel);
      target2.remove();
    };
    expect(target2.querySelectorAll('.used').length).toBe(1);
  });

  it('draws many notes in batches as the list is scrolled', () => {
    const { titles } = setUp((nb) => {
      for (let i = 0; i < 70; i++)
        nb.addText(
          nb.addNote({ made: `2026-11-15T10:${String(i).padStart(2, '0')}:00Z` }),
          `N${i}`,
        );
    });
    expect(titles().length).toBe(30);
    held.observed.at(-1)!();
    flushSync();
    expect(titles().length).toBe(60);
  });

  it('offers the notebook where it is empty', () => {
    const { target } = setUp(() => {});
    expect(target.querySelector('.empty h3')?.textContent).toBe('The notebook is empty');
    expect(target.querySelector('.empty button')?.textContent?.trim()).toBe('Open the notebook');
  });
});
