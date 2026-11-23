import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EditorView } from 'prosemirror-view';

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
  return { notebook, id, target, find, press, typeIn, key, editor };
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
