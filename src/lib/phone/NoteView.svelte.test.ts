import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { NotebookFile } from '$lib/api/notebook';

// The view is mounted and written in, so with the browser's Svelte: the
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

// A file is taken in by the core, which the tests have none of: what it says
// of the file is made here, and what is done with it in the note is the page's.
const taking = vi.hoisted(() => ({ takeFile: vi.fn() }));
vi.mock('./taking', async (original) => ({
  ...(await original<typeof import('./taking')>()),
  takeFile: taking.takeFile,
}));

// The scripts' hooks are set, as where the harness asked for them.
vi.mock('$lib/shell/testing', () => ({
  testing: true,
  testHook: (name: string, value: unknown) => {
    (window as unknown as Record<string, unknown>)[name] = value;
  },
}));

// What the editor measures as it scrolls to the cursor, which jsdom does not lay out.
const none = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
Range.prototype.getClientRects ??= none;
Range.prototype.getBoundingClientRect ??= () => new DOMRect();

const { flushSync, mount, tick, unmount } = await import('svelte');
const { Notebook } = await import('$lib/notebook/model/notebook.svelte');
const { FIRST_BOX } = await import('$lib/notebook/model/boxes');
const { viewsByDom } = await import('$lib/editor/ui.svelte');
const { toasts } = await import('$lib/ui/toast.svelte');
const { places } = await import('./places.svelte');
const { default: NoteView } = await import('./NoteView.svelte');

let done = () => {};
afterEach(() => {
  done();
  done = () => {};
  for (const toast of [...toasts.list]) toasts.dismiss(toast.id);
});

const settle = async () => {
  await tick();
  await new Promise((resolve) => setTimeout(resolve, 30));
  flushSync();
};

async function setUp(fresh = false) {
  const notebook = new Notebook();
  const id = notebook.addNote();
  // As a note read from the disk: nothing to undo yet.
  notebook.undoManager.clear();
  // The steps begun anew, as the page begins them when it starts: one note gone to from the notes.
  places.begin();
  places.go({ at: 'note', note: id, fresh });
  const target = document.createElement('div');
  document.body.append(target);
  const view = mount(NoteView, { target, props: { notebook, id, fresh } });
  flushSync();
  await settle();
  done = () => {
    unmount(view);
    target.remove();
  };
  const find = <T extends HTMLElement = HTMLElement>(selector: string) =>
    document.querySelector<T>(selector);
  const press = async (selector: string) => {
    const button = find<HTMLButtonElement>(selector);
    expect(button, selector).toBeTruthy();
    button!.click();
    flushSync();
    await settle();
  };
  const typeIn = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  };
  const key = (input: HTMLInputElement, key: string) => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    flushSync();
  };
  const editor = () =>
    viewsByDom.get(target.querySelector<HTMLElement>('[data-phone-text] .ProseMirror')!) as
      EditorView | undefined;
  /** The hidden field of a tool is given files, as the system's picker or the camera gives them. */
  const choose = async (tool: 'file' | 'photograph', files: File[]) => {
    const input = find<HTMLInputElement>(`[data-phone-input="${tool}"]`)!;
    Object.defineProperty(input, 'files', { configurable: true, value: files });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    flushSync();
    await settle();
  };
  return { notebook, id, target, find, press, typeIn, key, editor, choose };
}

/** What the core says of a file taken in: the file as the store keeps it, and the same shown where it is a picture. */
function taken(name: string, hash: string, picture: boolean): NotebookFile {
  const file = { hash, name, size: 10, width: 100, alt: '' } as NotebookFile['file'];
  return {
    file,
    shown: picture ? file : null,
    time: null,
    taken: '2026-11-15T14:03:22',
    place: null,
  };
}

const HASH = (letter: string) => letter.repeat(64);
const file = (name: string) => new File([new Uint8Array([1, 2, 3])], name);

/** The kinds of the blocks of the text, with the hash of the file of each that holds one. */
function blocks(view: EditorView): string[] {
  const out: string[] = [];
  view.state.doc.forEach((node) =>
    out.push(
      node.type.name === 'figure' || node.type.name === 'file'
        ? `${node.type.name}:${(node.attrs.file ?? node.attrs.hash) as string}`
        : `${node.type.name}:${node.textContent}`,
    ),
  );
  return out;
}

describe('a note on the phone', () => {
  it('stands with its id, its name, its tags, its box, its text and the row of tools', async () => {
    const { target, id, find, editor } = await setUp();
    expect(target.querySelector(`[data-phone-note="${id}"]`)).toBeTruthy();
    expect(find('[data-phone-name]')).toBeTruthy();
    expect(find('[data-tag-field]')).toBeTruthy();
    expect(find('[data-phone-box]')!.textContent).toContain('Unsorted');
    expect(editor()).toBeTruthy();
    const tools = [...target.querySelectorAll<HTMLElement>('[data-phone-tool]')];
    expect(tools.map((b) => b.dataset.phoneTool)).toEqual([
      'bold',
      'italic',
      'list',
      'todo',
      'file',
      'photograph',
      'undo',
    ]);
  });

  it('keeps the name written as the note’s', async () => {
    const { notebook, id, find, typeIn } = await setUp();
    typeIn(find<HTMLInputElement>('[data-phone-name]')!, 'A thought ');
    expect(notebook.note(id)!.name).toBe('A thought');
  });

  it('adds a tag and takes it away, each a step of undo', async () => {
    const { notebook, id, find, typeIn, key } = await setUp();
    const field = find<HTMLInputElement>('[data-tag-field]')!;
    typeIn(field, 'owls');
    key(field, 'Enter');
    expect(notebook.note(id)!.tags).toEqual(['owls']);
    typeIn(field, 'Homer,');
    expect(notebook.note(id)!.tags).toEqual(['Homer', 'owls']);
    find<HTMLButtonElement>('[data-tag="owls"] button')!.click();
    flushSync();
    expect(notebook.note(id)!.tags).toEqual(['Homer']);
    notebook.undo();
    flushSync();
    expect(notebook.note(id)!.tags).toEqual(['Homer', 'owls']);
  });

  it('moves the note to another box, and into a new box, by the sheet of the boxes', async () => {
    const { notebook, id, find, press, typeIn } = await setUp();
    const ideas = notebook.addBox('Ideas');
    flushSync();
    await press('[data-phone-box]');
    expect(find(`[data-phone-box-row="${FIRST_BOX}"]`)!.getAttribute('aria-current')).toBe('true');
    await press(`[data-phone-box-row="${ideas}"]`);
    expect(notebook.note(id)!.box).toBe(ideas);
    expect(find('[data-phone-boxes]')).toBeNull();
    expect(find('[data-phone-box]')!.textContent).toContain('Ideas');

    await press('[data-phone-box]');
    typeIn(find<HTMLInputElement>('[data-phone-box-name]')!, 'Later');
    await press('[data-phone-box-new]');
    const later = notebook.boxes.find((b) => b.name === 'Later');
    expect(later).toBeTruthy();
    expect(notebook.note(id)!.box).toBe(later!.id);
    expect(find('[data-phone-boxes]')).toBeNull();
  });

  it('is deleted from More, goes back to the notes, and comes back by Undo in the line that says it', async () => {
    const { notebook, id, press } = await setUp();
    await press('[data-phone-more]');
    await press('[data-phone-delete]');
    expect(notebook.note(id)).toBeUndefined();
    expect(places.current).toEqual({ at: 'notes' });
    const told = toasts.list.at(-1)!;
    expect(told.message).toBe('Note deleted');
    expect(told.action!.label).toBe('Undo');
    told.action!.run();
    expect(notebook.note(id)).toBeTruthy();
  });

  it('goes back where the note is deleted elsewhere while it is shown', async () => {
    const { notebook, id } = await setUp();
    expect(places.current).toMatchObject({ at: 'note', note: id });
    notebook.deleteNotes([id]);
    flushSync();
    await settle();
    expect(places.current).toEqual({ at: 'notes' });
  });

  it('undoes by the row and redoes from More', async () => {
    const { notebook, id, find, press, typeIn, key } = await setUp();
    const undo = find<HTMLButtonElement>('[data-phone-tool="undo"]')!;
    expect(undo.disabled).toBe(true);
    const field = find<HTMLInputElement>('[data-tag-field]')!;
    typeIn(field, 'owls');
    key(field, 'Enter');
    expect(undo.disabled).toBe(false);
    await press('[data-phone-more]');
    expect(find<HTMLButtonElement>('[data-phone-redo]')!.disabled).toBe(true);
    await press('[data-phone-tool="undo"]');
    expect(notebook.note(id)!.tags).toEqual([]);
    await press('[data-phone-more]');
    expect(find<HTMLButtonElement>('[data-phone-redo]')!.disabled).toBe(false);
    await press('[data-phone-redo]');
    expect(notebook.note(id)!.tags).toEqual(['owls']);
    expect(find('[data-phone-redo]')).toBeNull();
  });

  it('sets bold and a list by the row, which keeps the cursor in the text and says what is on', async () => {
    const { notebook, id, find, editor } = await setUp(true);
    const view = editor()!;
    view.focus();
    find('[data-phone-text]')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    flushSync();
    const bold = find<HTMLButtonElement>('[data-phone-tool="bold"]')!;
    expect(bold.disabled).toBe(false);
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    bold.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    bold.click();
    flushSync();
    view.dispatch(view.state.tr.insertText('Strong'));
    flushSync();
    expect(bold.getAttribute('aria-pressed')).toBe('true');
    find<HTMLButtonElement>('[data-phone-tool="list"]')!.click();
    flushSync();
    expect(view.state.doc.firstChild!.attrs.kind).toBe('item');
    expect(find('[data-phone-tool="list"]')!.getAttribute('aria-pressed')).toBe('true');
    expect(notebook.note(id)!.words).toContain('strong');
  });

  it('shows the source of words taken in with none, and opens its sheet', async () => {
    const { notebook, id, find, press } = await setUp();
    const passage = notebook.addPassage(null, 'Found words');
    notebook.addText(id, 'Found words', passage);
    flushSync();
    await settle();
    expect(find('[data-phone-source="none"]')!.textContent).toContain('No source');
    await press('[data-phone-source="none"]');
    expect(find('[data-phone-source-sheet]')).toBeTruthy();
    expect(find('[data-phone-passage]')).toBeTruthy();
  });

  it('is looked at once shown', async () => {
    const notebook = new Notebook();
    const id = notebook.addNote({ seen: false });
    expect(notebook.note(id)!.seen).toBe(false);
    const target = document.createElement('div');
    document.body.append(target);
    const view = mount(NoteView, { target, props: { notebook, id } });
    flushSync();
    done = () => {
      unmount(view);
      target.remove();
    };
    expect(notebook.note(id)!.seen).toBe(true);
  });
});

describe('a note on the phone, with pictures and files taken in', () => {
  const photographed = vi.fn();

  beforeEach(() => {
    taking.takeFile.mockReset();
    photographed.mockReset();
    window.glaukopisAndroid = {
      ground: () => {},
      leave: () => {},
      asked: () => '{}',
      photographed,
    };
  });

  afterEach(() => {
    delete window.glaukopisAndroid;
  });

  it('puts a picture chosen into the text as a figure, with the file as its source', async () => {
    const { notebook, editor, press, choose } = await setUp();
    taking.takeFile.mockResolvedValueOnce(taken('plate.png', HASH('a'), true));
    await press('[data-phone-tool="file"]');
    await choose('file', [file('plate.png')]);
    expect(blocks(editor()!)).toContain(`figure:${HASH('a')}`);
    const held = notebook.files.get(HASH('a'));
    expect(held?.name).toBe('plate.png');
    expect(notebook.sources.get(held!.source!)).toMatchObject({
      sort: 'file',
      name: 'plate.png',
      taken: '2026-11-15T14:03:22',
    });
  });

  it('puts a file that is no picture at the end of the note', async () => {
    const { notebook, id, editor, press, choose } = await setUp();
    taking.takeFile.mockResolvedValueOnce(taken('paper.pdf', HASH('b'), false));
    await press('[data-phone-tool="file"]');
    await choose('file', [file('paper.pdf')]);
    expect(notebook.fragment(id)!.toString()).toContain('<file');
    expect(blocks(editor()!).at(-1)).toBe(`file:${HASH('b')}`);
    expect(notebook.files.get(HASH('b'))?.name).toBe('paper.pdf');
  });

  it('puts a picture where the cursor was when the button was pressed, and else at the end', async () => {
    const { find, editor, press, choose } = await setUp(true);
    const view = editor()!;
    view.focus();
    find('[data-phone-text]')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    flushSync();
    // Two paragraphs, the cursor in the first.
    view.dispatch(view.state.tr.insertText('one'));
    const paragraph = view.state.schema.nodes.paragraph;
    view.dispatch(
      view.state.tr.insert(
        view.state.doc.content.size,
        paragraph.create(null, view.state.schema.text('two')),
      ),
    );
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 2)));
    flushSync();
    taking.takeFile.mockResolvedValueOnce(taken('plate.png', HASH('a'), true));
    await press('[data-phone-tool="file"]');
    // The picker took the cursor away before the file came.
    find('[data-phone-text]')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    await choose('file', [file('plate.png')]);
    expect(blocks(view)).toEqual(['paragraph:one', `figure:${HASH('a')}`, 'paragraph:two']);

    // Pressed with no cursor in the text: at the end.
    taking.takeFile.mockResolvedValueOnce(taken('second.png', HASH('c'), true));
    await press('[data-phone-tool="photograph"]');
    await choose('photograph', [file('second.png')]);
    expect(blocks(view).at(-1)).toBe(`figure:${HASH('c')}`);
    expect(blocks(view).slice(0, 3)).toEqual([
      'paragraph:one',
      `figure:${HASH('a')}`,
      'paragraph:two',
    ]);
  });

  it('takes the files in their order, the first where the cursor was and the next after it', async () => {
    const { editor, press, choose } = await setUp();
    taking.takeFile
      .mockResolvedValueOnce(taken('one.png', HASH('d'), true))
      .mockResolvedValueOnce(taken('two.png', HASH('e'), true))
      .mockResolvedValueOnce(taken('three.png', HASH('f'), true));
    await press('[data-phone-tool="file"]');
    await choose('file', [file('one.png'), file('two.png'), file('three.png')]);
    expect(
      blocks(editor()!)
        .filter((b) => b.startsWith('figure'))
        .map((b) => b.slice(-1)),
    ).toEqual(['d', 'e', 'f']);
    expect(taking.takeFile.mock.calls.map(([f]) => (f as File).name)).toEqual([
      'one.png',
      'two.png',
      'three.png',
    ]);
  });

  it('tells the Android part after a photograph that was taken in, and not after a picture chosen', async () => {
    const { press, choose } = await setUp();
    taking.takeFile.mockResolvedValue(taken('JPEG_1.jpg', HASH('a'), true));
    await press('[data-phone-tool="file"]');
    await choose('file', [file('plate.png')]);
    expect(photographed).not.toHaveBeenCalled();
    await press('[data-phone-tool="photograph"]');
    await choose('photograph', [file('JPEG_1.jpg')]);
    expect(photographed).toHaveBeenCalledTimes(1);
  });

  it('does not tell the Android part where the photograph could not be taken in, and says so', async () => {
    const { notebook, id, press, choose } = await setUp();
    taking.takeFile.mockRejectedValueOnce(new Error('JPEG_1.jpg is larger than 50 MB'));
    await press('[data-phone-tool="photograph"]');
    await choose('photograph', [file('JPEG_1.jpg')]);
    expect(photographed).not.toHaveBeenCalled();
    expect(notebook.fragment(id)!.toString()).not.toContain('<figure');
    const told = toasts.list.at(-1)!;
    expect(told.kind).toBe('error');
    expect(told.message).toBe('Some files could not be taken in');
    expect(told.detail).toBe('JPEG_1.jpg is larger than 50 MB');
  });

  it('says what could not be taken in once, when all are done, and takes in the rest', async () => {
    const { editor, press, choose } = await setUp();
    taking.takeFile
      .mockRejectedValueOnce(new Error('film.mov is larger than 50 MB'))
      .mockResolvedValueOnce(taken('plate.png', HASH('a'), true))
      .mockRejectedValueOnce(new Error('nothing.txt'));
    await press('[data-phone-tool="file"]');
    await choose('file', [file('film.mov'), file('plate.png'), file('nothing.txt')]);
    expect(blocks(editor()!)).toContain(`figure:${HASH('a')}`);
    const errors = toasts.list.filter((m) => m.kind === 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Some files could not be taken in');
    expect(errors[0].detail).toBe('film.mov is larger than 50 MB\nnothing.txt');
  });

  it('has the two buttons not there to be pressed while a file is taken in', async () => {
    const { find, press, choose } = await setUp();
    let free: (value: NotebookFile) => void = () => {};
    taking.takeFile.mockImplementationOnce(
      () => new Promise<NotebookFile>((resolve) => (free = resolve)),
    );
    await press('[data-phone-tool="file"]');
    const pending = choose('file', [file('plate.png')]);
    await vi.waitFor(() =>
      expect(find<HTMLButtonElement>('[data-phone-tool="file"]')!.disabled).toBe(true),
    );
    expect(find<HTMLButtonElement>('[data-phone-tool="photograph"]')!.disabled).toBe(true);
    free(taken('plate.png', HASH('a'), true));
    await pending;
    await vi.waitFor(() =>
      expect(find<HTMLButtonElement>('[data-phone-tool="file"]')!.disabled).toBe(false),
    );
    expect(find<HTMLButtonElement>('[data-phone-tool="photograph"]')!.disabled).toBe(false);
  });

  it('puts nothing and tells nothing where the note is gone while the file is taken in', async () => {
    const { notebook, id, press, choose } = await setUp();
    let free: (value: NotebookFile) => void = () => {};
    taking.takeFile.mockImplementationOnce(
      () => new Promise<NotebookFile>((resolve) => (free = resolve)),
    );
    await press('[data-phone-tool="photograph"]');
    const pending = choose('photograph', [file('JPEG_1.jpg')]);
    await vi.waitFor(() => expect(taking.takeFile).toHaveBeenCalled());
    notebook.deleteNotes([id]);
    free(taken('JPEG_1.jpg', HASH('a'), true));
    await pending;
    await settle();
    expect(notebook.files.has(HASH('a'))).toBe(false);
    expect(photographed).not.toHaveBeenCalled();
  });

  it('takes a file in by the hook of the scripts, as the picker does, with no cursor', async () => {
    const { editor } = await setUp();
    taking.takeFile.mockResolvedValueOnce(taken('plate.png', HASH('a'), true));
    const hooks = (
      window as unknown as {
        __glaukopisPhone: { file(name: string, content64: string): Promise<void> };
      }
    ).__glaukopisPhone;
    await hooks.file('plate.png', btoa('png bytes'));
    await settle();
    const [given] = taking.takeFile.mock.calls[0] as [File];
    expect(given.name).toBe('plate.png');
    expect(given.size).toBe(9);
    expect(blocks(editor()!)).toContain(`figure:${HASH('a')}`);
  });
});

describe('a note arrived at from outside', () => {
  it('goes to the notes by the arrow where it is deleted, and the app stays where it is', async () => {
    const leave = vi.fn();
    window.glaukopisAndroid = {
      ground: () => {},
      leave,
      asked: () => '{}',
      photographed: () => {},
    };
    const notebook = new Notebook();
    const id = notebook.addNote();
    notebook.undoManager.clear();
    places.begin();
    places.arrive({ at: 'note', note: id });
    const target = document.createElement('div');
    document.body.append(target);
    const view = mount(NoteView, { target, props: { notebook, id } });
    done = () => {
      unmount(view);
      target.remove();
      delete window.glaukopisAndroid;
    };
    flushSync();
    await settle();
    expect(places.current).toMatchObject({ at: 'note', note: id });
    notebook.deleteNotes([id]);
    flushSync();
    await settle();
    expect(places.current).toEqual({ at: 'notes' });
    expect(leave).not.toHaveBeenCalled();
  });
});
