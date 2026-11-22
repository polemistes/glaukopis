import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EditorView } from 'prosemirror-view';
import type { NoteText } from '$lib/api/notewindow';

// The window is mounted and written in, so with the browser's Svelte: the
// tests otherwise run with the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../../node_modules/svelte/src/index-client.js'),
);
vi.mock(
  'svelte/reactivity',
  // @ts-expect-error: the same.
  () => import('../../../../node_modules/svelte/src/reactivity/index-client.js'),
);

// The window as the shell has it, which the page shows, names, closes and destroys.
const shell = vi.hoisted(() => ({
  show: vi.fn(async () => {}),
  setFocus: vi.fn(async () => {}),
  setTitle: vi.fn(async () => {}),
  close: vi.fn(async () => {}),
  destroy: vi.fn(async () => {}),
  onCloseRequested: vi.fn(async () => () => {}),
}));
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ label: 'note', ...shell }),
}));
vi.mock('@tauri-apps/api/webview', () => ({
  getCurrentWebview: () => ({ onDragDropEvent: async () => () => {} }),
}));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(async () => null) }));
vi.mock('$lib/api/backend', async (original) => ({
  ...(await original<typeof import('$lib/api/backend')>()),
  inTauri: true,
}));
const api = vi.hoisted(() => ({
  noteWindowKeep: vi.fn(async (_text: unknown) => {}),
  noteWindowSend: vi.fn(async (_text: unknown) => {}),
  noteWindowAddFiles: vi.fn(),
  noteWindowAddBytes: vi.fn(),
  noteWindowFilePath: vi.fn(),
  noteWindowStart: vi.fn(),
}));
vi.mock('$lib/api/notewindow', () => api);

// What the editor measures as it scrolls to the cursor, which jsdom does not lay out.
const none = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
Range.prototype.getClientRects ??= none;
Range.prototype.getBoundingClientRect ??= () => new DOMRect();

const { flushSync, mount, tick, unmount } = await import('svelte');
const { viewsByDom } = await import('$lib/editor/ui.svelte');
const { default: NoteWindow } = await import('./NoteWindow.svelte');

let done = () => {};
afterEach(() => {
  done();
  done = () => {};
  vi.clearAllMocks();
});

const settle = async () => {
  await tick();
  await new Promise((resolve) => setTimeout(resolve, 30));
  flushSync();
};

async function setUp(unsent: NoteText | null = null) {
  const target = document.createElement('div');
  document.body.append(target);
  const window = mount(NoteWindow, { target, props: { unsent } });
  flushSync();
  await settle();
  done = () => {
    unmount(window);
    target.remove();
  };
  const dom = target.querySelector<HTMLElement>('[data-note-window-field] .ProseMirror')!;
  const view = viewsByDom.get(dom) as EditorView;
  const button = () => target.querySelector<HTMLButtonElement>('[data-note-window-send]')!;
  const write = (text: string) => {
    view.dispatch(view.state.tr.insertText(text));
    flushSync();
  };
  const press = (key: string, mods: { ctrlKey?: boolean } = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods });
    dom.dispatchEvent(event);
    flushSync();
    return event;
  };
  return { target, dom, view, button, write, press };
}

describe('the window of a note', () => {
  it('is shown with its title, the field and the row, and sends nothing while empty', async () => {
    const { target, button } = await setUp();
    expect(shell.show).toHaveBeenCalled();
    expect(shell.setTitle).toHaveBeenCalledWith('Note');
    expect(target.querySelector('[data-note-window-mark="strong"]')).toBeTruthy();
    expect(target.querySelector('[data-note-window-list="todo"]')).toBeTruthy();
    expect(target.querySelector('[data-note-window-add]')).toBeTruthy();
    expect(button().textContent).toContain('To the notebook');
    expect(button().disabled).toBe(true);
  });

  it('closes with Escape where the note is empty, and does nothing where it is not', async () => {
    const { press, write } = await setUp();
    press('Escape');
    expect(shell.close).toHaveBeenCalledTimes(1);
    write('A thought');
    press('Escape');
    expect(shell.close).toHaveBeenCalledTimes(1);
  });

  it('sends with Ctrl+S, the text with its words, and goes', async () => {
    const { press, write, button } = await setUp();
    write('A thought');
    expect(button().disabled).toBe(false);
    const event = press('s', { ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    await settle();
    expect(api.noteWindowSend).toHaveBeenCalledTimes(1);
    const sent = api.noteWindowSend.mock.calls[0][0] as NoteText;
    expect(sent.words).toBe('A thought');
    expect(sent.files).toEqual([]);
    expect(JSON.stringify(sent.doc)).toContain('A thought');
    expect(shell.destroy).toHaveBeenCalled();
  });

  it('stays, with its note, and says so where the note cannot be written', async () => {
    api.noteWindowSend.mockRejectedValueOnce({ kind: 'io', message: 'the disk is full' });
    const { target, write, button } = await setUp();
    write('Not lost');
    button().click();
    await settle();
    expect(shell.destroy).not.toHaveBeenCalled();
    const said = target.querySelector('[data-note-window-problem]')!.textContent!;
    expect(said).toContain('The note could not be written into the notebook');
    expect(said).toContain('the disk is full');
  });

  it('begins a new note where it cannot go, as the one window of a phone: empty, saying the note is sent, and keeping what is written next', async () => {
    shell.destroy.mockRejectedValueOnce(new Error('a window that cannot go'));
    const { target, view, write, button } = await setUp();
    write('Sent away');
    button().click();
    await settle();
    expect(api.noteWindowSend).toHaveBeenCalledTimes(1);
    expect(target.querySelector('[data-note-window-problem]')).toBeNull();
    expect(target.querySelector('[data-note-window-told]')!.textContent).toContain(
      'The note is sent to the notebook',
    );
    expect(view.state.doc.textContent).toBe('');
    api.noteWindowKeep.mockClear();
    write('The next');
    expect(target.querySelector('[data-note-window-told]')).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const kept = api.noteWindowKeep.mock.calls.at(-1)![0] as NoteText;
    expect(kept.words).toBe('The next');
  });

  it('keeps what is written a moment after it is written', async () => {
    const { write } = await setUp();
    write('Kept');
    expect(api.noteWindowKeep).not.toHaveBeenCalled();
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(api.noteWindowKeep).toHaveBeenCalled();
    const kept = api.noteWindowKeep.mock.calls.at(-1)![0] as NoteText;
    expect(kept.words).toBe('Kept');
  });

  it('opens with the note not sent before', async () => {
    const unsent: NoteText = {
      doc: {
        type: 'doc',
        content: [
          { type: 'paragraph', attrs: { kind: 'item' }, content: [{ type: 'text', text: 'Kept' }] },
        ],
      },
      words: 'Kept',
      files: [],
    };
    const { view, button } = await setUp(unsent);
    expect(view.state.doc.textContent).toBe('Kept');
    expect(view.state.doc.firstChild!.attrs.kind).toBe('item');
    expect(button().disabled).toBe(false);
  });

  it('marks words and makes lists by the buttons of the row', async () => {
    const { target, view, write } = await setUp();
    write('Bold words');
    view.dispatch(view.state.tr.setSelection(textSelection(view, 1, 5)));
    target.querySelector<HTMLButtonElement>('[data-note-window-mark="strong"]')!.click();
    flushSync();
    let bold = '';
    view.state.doc.descendants((n) => {
      if (n.marks.some((m) => m.type.name === 'strong')) bold = n.text!;
    });
    expect(bold).toBe('Bold');
    target.querySelector<HTMLButtonElement>('[data-note-window-list="numbered"]')!.click();
    flushSync();
    expect(view.state.doc.firstChild!.attrs.kind).toBe('numbered');
  });
});

const { TextSelection } = await import('prosemirror-state');
const textSelection = (view: EditorView, from: number, to: number) =>
  TextSelection.create(view.state.doc, from, to);
