import { afterEach, describe, expect, it, vi } from 'vitest';

// The column is mounted and changed under it, so with the browser's Svelte:
// the tests otherwise run with the server's, in which nothing is followed.
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
// What is asked first is answered here: yes, and what was asked is kept.
const asked = vi.hoisted(() => ({ questions: [] as { title: string; message?: string }[] }));
vi.mock('$lib/ui/confirm.svelte', () => ({
  confirm: async (q: { title: string; message?: string }) => {
    asked.questions.push(q);
    return true;
  },
}));

// The menu of the right button is not opened: what it would hold is kept.
interface Offered {
  label: string;
  checked?: boolean;
  action: () => void;
}
const menu = vi.hoisted(() => ({ items: [] as unknown[] }));
vi.mock('$lib/ui/menu.svelte', async (original) => ({
  ...(await original<typeof import('$lib/ui/menu.svelte')>()),
  openContextMenu: (_event: MouseEvent, items: unknown[]) => {
    menu.items = items;
  },
}));

const { flushSync, mount, tick, unmount } = await import('svelte');
const { Notebook } = await import('./model/notebook.svelte');
const { FIRST_BOX } = await import('./model/boxes');
const { default: BoxColumn } = await import('./BoxColumn.svelte');

let done = () => {};

afterEach(() => {
  done();
  done = () => {};
  asked.questions = [];
});

function setUp(notebook: InstanceType<typeof Notebook>, inView: string | null = null) {
  const target = document.createElement('div');
  document.body.append(target);
  const state = $state({ box: inView, tags: [] as string[] });
  const moved: [string[], string][] = [];
  const deleted: string[] = [];
  const column = mount(BoxColumn, {
    target,
    props: {
      notebook,
      get box() {
        return state.box;
      },
      get tags() {
        return state.tags;
      },
      onchoose: (box: string | null) => (state.box = box),
      ontags: (tags: string[]) => (state.tags = tags),
      onmoveto: (ids: string[], box: string) => moved.push([ids, box]),
      ondeleted: (box: string) => deleted.push(box),
    },
  });
  flushSync();
  done = () => {
    unmount(column);
    target.remove();
  };
  /** The rows of the boxes and of the tags, each as it reads: its name and its count. */
  const rows = (what: 'box' | 'tag') =>
    Array.from(target.querySelectorAll<HTMLElement>(`[data-${what}-row]`)).map((r) => ({
      id: r.dataset[what === 'box' ? 'boxRow' : 'tagRow']!,
      name: r.querySelector('.name')!.textContent!.trim(),
      count: r.querySelector('.count')!.textContent!.trim(),
      on: r.classList.contains('selected'),
    }));
  const row = (what: 'box' | 'tag', id: string) =>
    target.querySelector<HTMLElement>(`[data-${what}-row="${id}"]`)!;
  const naming = () => target.querySelector<HTMLInputElement>('[data-naming]');
  const type = async (value: string, key: string) => {
    const input = naming()!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    flushSync();
    await tick();
    await Promise.resolve();
    flushSync();
  };
  const key = (el: HTMLElement, key: string) => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    flushSync();
  };
  return { target, state, rows, row, naming, type, key, moved, deleted };
}

describe('the column of boxes and tags', () => {
  it('shows All notes, then the first box as Unsorted and the others in their order, each with how many notes it holds', () => {
    const nb = new Notebook();
    const homer = nb.addBox('Homer');
    const plato = nb.addBox('Plato');
    nb.addNote();
    nb.addNote({ box: homer });
    nb.addNote({ box: homer });
    const { rows } = setUp(nb, homer);
    expect(rows('box').filter((r) => r.id !== 'all')).toEqual([
      { id: FIRST_BOX, name: 'Unsorted', count: '1', on: false },
      { id: homer, name: 'Homer', count: '2', on: true },
      { id: plato, name: 'Plato', count: '0', on: false },
    ]);
    expect(rows('box')[0]).toMatchObject({ id: 'all', name: 'All notes', count: '3' });
  });

  it('makes a box named in place: Enter keeps it and shows it, Escape gives it up', async () => {
    const nb = new Notebook();
    const { target, naming, type, rows, state } = setUp(nb);
    target.querySelector<HTMLElement>('[data-new-box]')!.click();
    flushSync();
    await tick();
    expect(naming()).not.toBeNull();
    await type('Escaped', 'Escape');
    expect(nb.boxes).toHaveLength(1);
    target.querySelector<HTMLElement>('[data-new-box]')!.click();
    flushSync();
    await tick();
    await type('Homer', 'Enter');
    expect(nb.boxes.map((b) => b.name)).toEqual(['', 'Homer']);
    expect(state.box).toBe(nb.boxes[1].id);
    expect(rows('box').map((r) => r.name)).toEqual(['All notes', 'Unsorted', 'Homer']);
  });

  it('renames a box by F2 in place, and the first box back to Unsorted given nothing', async () => {
    const nb = new Notebook();
    const homer = nb.addBox('Homer');
    const { row, key, type } = setUp(nb);
    key(row('box', homer), 'F2');
    await tick();
    await type('The Iliad', 'Enter');
    expect(nb.boxes[1].name).toBe('The Iliad');
    key(row('box', FIRST_BOX), 'F2');
    await tick();
    await type('Inbox', 'Enter');
    expect(nb.boxes[0].name).toBe('Inbox');
    key(row('box', FIRST_BOX), 'F2');
    await tick();
    await type('', 'Enter');
    expect(nb.boxes[0].name).toBe('');
    expect(row('box', FIRST_BOX).textContent).toContain('Unsorted');
  });

  it('deletes a box by Delete, asking first where it holds notes, which go to the first; never the first', async () => {
    const nb = new Notebook();
    const empty = nb.addBox('Empty');
    const full = nb.addBox('Full');
    const note = nb.addNote({ box: full });
    const { row, key, state, deleted } = setUp(nb, full);
    key(row('box', FIRST_BOX), 'Delete');
    key(row('box', empty), 'Delete');
    await tick();
    expect(asked.questions).toEqual([]);
    expect(nb.boxes.map((b) => b.name)).toEqual(['', 'Full']);
    key(row('box', full), 'Delete');
    await tick();
    await Promise.resolve();
    flushSync();
    expect(asked.questions).toHaveLength(1);
    expect(asked.questions[0]).toMatchObject({
      title: 'Delete Full?',
      message: 'The note in it goes to Unsorted.',
    });
    expect(nb.boxes).toHaveLength(1);
    expect(nb.note(note)!.box).toBe(FIRST_BOX);
    expect(state.box).toBe(FIRST_BOX);
    expect(deleted).toEqual([empty, full]);
  });

  it('the menu of a box makes it the one where notes from outside come, marked by the tray; chosen again, the first is', () => {
    const nb = new Notebook();
    const homer = nb.addBox('Homer');
    const { row } = setUp(nb);
    const tray = (id: string) => row('box', id).querySelector('svg.lucide-inbox') !== null;
    /** The item of the menu of a box that makes it the one that receives. */
    const offered = (id: string) => {
      row('box', id).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
      return (menu.items as Offered[]).find((i) => i.label === 'Notes from outside come here')!;
    };
    expect([tray(FIRST_BOX), tray(homer)]).toEqual([true, false]);
    expect(offered(FIRST_BOX).checked).toBe(true);
    const item = offered(homer);
    expect(item.checked).toBe(false);
    item.action();
    flushSync();
    expect(nb.receiving).toBe(homer);
    expect([tray(FIRST_BOX), tray(homer)]).toEqual([false, true]);
    expect(offered(homer).checked).toBe(true);
    // One step of undo.
    nb.undo();
    flushSync();
    expect(nb.receiving).toBe(FIRST_BOX);
    nb.redo();
    offered(homer).action();
    flushSync();
    expect(nb.receiving).toBe(FIRST_BOX);
    expect([tray(FIRST_BOX), tray(homer)]).toEqual([true, false]);
  });

  it('shows the tags under the boxes, as words are sorted, with their counts; a press turns one on and off', () => {
    const nb = new Notebook();
    const a = nb.addNote({ tags: ['owls', 'Athena'] });
    nb.addNote({ tags: ['owls'] });
    const { rows, row, state, target } = setUp(nb);
    expect(rows('tag')).toEqual([
      { id: 'Athena', name: 'Athena', count: '1', on: false },
      { id: 'owls', name: 'owls', count: '2', on: false },
    ]);
    row('tag', 'owls').click();
    flushSync();
    row('tag', 'Athena').click();
    flushSync();
    expect(state.tags).toEqual(['owls', 'Athena']);
    expect(rows('tag').map((r) => r.on)).toEqual([true, true]);
    row('tag', 'owls').click();
    flushSync();
    expect(state.tags).toEqual(['Athena']);
    nb.removeTag([a], 'Athena');
    nb.removeTag([a], 'owls');
    nb.deleteTag('owls');
    flushSync();
    expect(target.querySelector('.tags-heading')).toBeNull();
  });

  it('renames a tag in place, asking first where a tag of that name is there, and the tag that was on stays on', async () => {
    const nb = new Notebook();
    const a = nb.addNote({ tags: ['owl'] });
    const b = nb.addNote({ tags: ['owls'] });
    const { row, key, type, state } = setUp(nb);
    row('tag', 'owl').click();
    flushSync();
    key(row('tag', 'owl'), 'F2');
    await tick();
    await type('owls', 'Enter');
    expect(asked.questions).toEqual([
      { title: 'Rename owl to owls?', message: 'owl and owls will be one tag.', confirm: 'Rename' },
    ]);
    expect(nb.note(a)!.tags).toEqual(['owls']);
    expect(nb.note(b)!.tags).toEqual(['owls']);
    expect(nb.tags).toEqual([{ tag: 'owls', count: 2 }]);
    expect(state.tags).toEqual(['owls']);
  });
});
