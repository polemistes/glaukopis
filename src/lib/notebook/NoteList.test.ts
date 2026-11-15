import { afterEach, describe, expect, it, vi } from 'vitest';

// The list is mounted and its selection changed under it, so with the
// browser's Svelte: the tests otherwise run with the server's, in which
// nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);
// A small picture of the store is asked of the Rust side: here it is none.
vi.mock('$lib/figures/pictures.svelte', () => ({
  pictures: { of: () => ({ url: null, state: 'absent' }) },
}));

const { flushSync, mount, unmount } = await import('svelte');
const { Notebook } = await import('./model/notebook.svelte');
const { NoteSelection } = await import('./page.svelte');
const { default: NoteList } = await import('./NoteList.svelte');

/** jsdom measures nothing: the list is as high as it says, and told so once. */
class Resizes {
  #seen: () => void;
  constructor(seen: () => void) {
    this.#seen = seen;
  }
  observe() {
    this.#seen();
  }
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', Resizes);

let done = () => {};

afterEach(() => {
  done();
  done = () => {};
});

function setUp(notebook: InstanceType<typeof Notebook>, height = 600) {
  const target = document.createElement('div');
  document.body.append(target);
  const selection = new NoteSelection();
  const deleted: string[][] = [];
  const opened: string[] = [];
  const list = mount(NoteList, {
    target,
    props: {
      get notes() {
        return notebook.list;
      },
      selection,
      ondelete: (ids: string[]) => deleted.push(ids),
      onopen: (id: string) => opened.push(id),
    },
  });
  const box = target.querySelector<HTMLElement>('[data-notes]')!;
  Object.defineProperty(box, 'clientHeight', { value: height, configurable: true });
  flushSync();
  done = () => {
    unmount(list);
    target.remove();
  };
  const rows = () => Array.from(target.querySelectorAll<HTMLElement>('[data-note]'));
  const key = (key: string, init: KeyboardEventInit = {}) => {
    box.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
    flushSync();
  };
  const press = (row: HTMLElement, init: PointerEventInit = {}) => {
    row.dispatchEvent(new PointerEvent('pointerdown', { button: 0, bubbles: true, ...init }));
    flushSync();
  };
  return { target, selection, rows, key, press, deleted, opened };
}

describe('the list of notes', () => {
  it('shows each note by its name, else how it begins, else as an empty note, newest first', () => {
    const nb = new Notebook();
    const words = nb.addNote({ made: '2026-11-13T10:00:00Z' });
    nb.addText(words, 'Grey-eyed Athena.');
    nb.addNote({ made: '2026-11-14T10:00:00Z' });
    nb.addNote({ name: 'Owls', made: '2026-11-15T10:00:00Z' });
    const { rows } = setUp(nb);
    const titles = rows().map((r) => r.querySelector('.title')!.textContent);
    expect(titles).toEqual(['Owls', 'Empty note', 'Grey-eyed Athena.']);
    expect(rows()[1].querySelector('.title')!.classList.contains('empty')).toBe(true);
    expect(rows()[0].querySelector('.day')!.textContent).toMatch(/2026/);
  });

  it('chooses by a press and the keys, selects more with Ctrl and Shift, and deletes what is selected', () => {
    const nb = new Notebook();
    const ids = [1, 2, 3, 4].map((n) =>
      nb.addNote({ name: `Note ${n}`, made: `2026-11-1${n}T10:00:00Z` }),
    );
    const newest = [...ids].reverse();
    const { rows, press, key, selection, deleted, opened, target } = setUp(nb);
    press(rows()[1]);
    expect(selection.ids).toEqual([newest[1]]);
    expect(rows()[1].getAttribute('aria-selected')).toBe('true');
    key('ArrowDown');
    expect(selection.ids).toEqual([newest[2]]);
    key('Home');
    expect(selection.ids).toEqual([newest[0]]);
    key('Enter');
    expect(opened).toEqual([newest[0]]);
    press(rows()[2], { shiftKey: true });
    expect(selection.ids).toEqual(newest.slice(0, 3));
    press(rows()[1], { ctrlKey: true });
    expect([...selection.ids].sort()).toEqual([newest[0], newest[2]].sort());
    key('Delete');
    expect(deleted).toEqual([[newest[0], newest[2]]]);
    expect(target.querySelectorAll('[aria-selected="true"]')).toHaveLength(2);
  });

  it('draws only the rows in view of a long list', () => {
    const nb = new Notebook();
    nb.transact(() => {
      for (let i = 0; i < 2000; i++)
        nb.addNote({ name: `Note ${i}`, made: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString() });
    });
    const { rows } = setUp(nb, 300);
    expect(rows().length).toBeGreaterThan(4);
    expect(rows().length).toBeLessThan(30);
  });
});
