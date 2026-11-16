import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotesLook, ReadNote, ReadNotes } from '$lib/api/notebook';
import type { Count } from '$lib/api/backend';

// Mounted, and changed under it: with the browser's Svelte.
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

const api = vi.hoisted(() => ({
  notesLook: vi.fn(),
  notesRead: vi.fn(),
  notesReadStop: vi.fn(),
  onNotesProgress: vi.fn(),
  notebookTakeFiles: vi.fn(),
  notebookTakeImage: vi.fn(),
}));
vi.mock('$lib/api/notebook', () => api);
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn() }));

const { flushSync, mount, unmount } = await import('svelte');
const { default: ImportNotesDialog } = await import('./ImportNotesDialog.svelte');
const { Notebook } = await import('./model/notebook.svelte');
const { toasts } = await import('$lib/ui/toast.svelte');
const { open } = await import('@tauri-apps/plugin-dialog');

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false;
};

const LOOK: NotesLook = {
  kind: 'obsidian',
  name: 'Vault',
  notes: 3,
  attachments: 1,
  remarks: ['Two notes are empty.'],
};

const read = (name: string): ReadNote => ({
  key: `${name}.md`,
  name,
  made: null,
  tags: [],
  source: null,
  blocks: [
    {
      kind: 'paragraph',
      name: 'text',
      indent: 0,
      content: [{ kind: 'text', text: name, marks: {} }],
    },
  ],
  held: [],
  attachments: [],
  links: [],
});

const READ: ReadNotes = { notes: [read('One'), read('Two'), read('Three')], problems: [] };

let done = () => {};
/** What the reading was told to say of its progress, by the page. */
let told: ((count: Count) => void) | null = null;

beforeEach(() => {
  vi.clearAllMocks();
  told = null;
  api.onNotesProgress.mockImplementation(async (_ticket: string, f: (c: Count) => void) => {
    told = f;
    return () => {};
  });
  api.notesReadStop.mockResolvedValue(undefined);
  toasts.list.splice(0);
});
afterEach(() => {
  done();
  done = () => {};
  document.body.innerHTML = '';
});

const settle = async () => {
  for (let i = 0; i < 4; i++) await new Promise((r) => setTimeout(r, 0));
  flushSync();
};

/** The window, mounted with what was chosen before it opened. */
async function shown(path: string | null = '/notes/Vault') {
  const notebook = new Notebook();
  const onclose = vi.fn();
  const onshow = vi.fn();
  const target = document.body.appendChild(document.createElement('div'));
  const dialog = mount(ImportNotesDialog, { target, props: { notebook, path, onclose, onshow } });
  done = () => unmount(dialog);
  await settle();
  return { target, notebook, onclose, onshow };
}

const button = (target: HTMLElement, what: string) =>
  target.querySelector<HTMLButtonElement>(`[data-import-${what}]`);

describe('the window that imports notes', () => {
  it('shows what was found before anything is made, then makes the notes and says so', async () => {
    api.notesLook.mockResolvedValue(LOOK);
    api.notesRead.mockResolvedValue(READ);
    const { target, notebook, onclose, onshow } = await shown();
    expect(api.notesLook).toHaveBeenCalledWith('/notes/Vault');
    const found = target.querySelector('[data-import-found]')!;
    expect(found.textContent).toContain('Notes from Obsidian');
    expect(found.textContent).toContain('Vault');
    expect(found.textContent).toContain('3 notes');
    expect(found.textContent).toContain('one picture or file');
    expect(target.querySelector('[data-import-remarks]')!.textContent).toContain(
      'Two notes are empty.',
    );
    expect(api.notesRead).not.toHaveBeenCalled();
    expect(notebook.notes.size).toBe(0);

    button(target, 'do')!.click();
    await settle();
    expect(api.notesRead).toHaveBeenCalledWith('/notes/Vault', expect.any(String));
    expect(notebook.notes.size).toBe(3);
    const box = notebook.boxes.find((b) => b.name === 'Vault')!;
    expect(box).toBeTruthy();
    expect(onclose).toHaveBeenCalled();
    const toast = toasts.list.at(-1)!;
    expect(toast.message).toContain('3 notes imported into');
    expect(toast.message).toContain('Vault');
    toast.action!.run();
    expect(onshow).toHaveBeenCalledWith(box.id);
  });

  it('says the count while it reads, and Stop makes nothing and keeps the window', async () => {
    api.notesLook.mockResolvedValue({ ...LOOK, notes: 340 });
    let fail: (e: unknown) => void = () => {};
    api.notesRead.mockReturnValue(new Promise((_, reject) => (fail = reject)));
    const { target, notebook, onclose } = await shown();
    button(target, 'do')!.click();
    await settle();
    const ticket = api.notesRead.mock.calls[0][1] as string;
    told!({ done: 11, total: 340, name: 'Owls.md' });
    flushSync();
    expect(target.querySelector('[data-import-reading]')!.textContent).toContain(
      'Reading 12 of 340: Owls.md',
    );
    expect(button(target, 'do')).toBeNull();
    expect(button(target, 'folder')!.disabled).toBe(true);

    button(target, 'stop')!.click();
    expect(api.notesReadStop).toHaveBeenCalledWith(ticket);
    fail({ kind: 'stopped', message: 'stopped' });
    await settle();
    expect(notebook.notes.size).toBe(0);
    expect(notebook.boxes).toHaveLength(1);
    expect(onclose).not.toHaveBeenCalled();
    expect(target.querySelector('[data-import-reading]')).toBeNull();
    expect(target.querySelector('[data-import-error]')).toBeNull();
    expect(button(target, 'do')!.disabled).toBe(false);
  });

  it('says why what was chosen could not be looked at, and offers the choice again', async () => {
    api.notesLook.mockRejectedValue({ kind: 'io', message: 'No notes could be found in /x' });
    const { target } = await shown('/x');
    expect(target.querySelector('[data-import-error]')!.textContent).toContain(
      'No notes could be found in /x',
    );
    expect(target.querySelector('[data-import-found]')).toBeNull();
    expect(button(target, 'do')!.disabled).toBe(true);
    expect(button(target, 'folder')!.disabled).toBe(false);

    // Chosen again, it is looked at again.
    vi.mocked(open).mockResolvedValue('/notes/Vault');
    api.notesLook.mockResolvedValue(LOOK);
    button(target, 'folder')!.click();
    await settle();
    expect(vi.mocked(open)).toHaveBeenCalledWith(expect.objectContaining({ directory: true }));
    expect(target.querySelector('[data-import-error]')).toBeNull();
    expect(target.querySelector('[data-import-found]')).not.toBeNull();
  });

  it('says a reading that failed in the window, and makes nothing', async () => {
    api.notesLook.mockResolvedValue(LOOK);
    api.notesRead.mockRejectedValue({ kind: 'io', message: 'The vault went away' });
    const { target, notebook, onclose } = await shown();
    button(target, 'do')!.click();
    await settle();
    expect(target.querySelector('[data-import-error]')!.textContent).toContain(
      'The vault went away',
    );
    expect(notebook.notes.size).toBe(0);
    expect(onclose).not.toHaveBeenCalled();
  });

  it('asks for a folder or a file where nothing was chosen, and Import waits for one', async () => {
    const { target } = await shown(null);
    expect(api.notesLook).not.toHaveBeenCalled();
    expect(button(target, 'folder')).not.toBeNull();
    expect(button(target, 'file')).not.toBeNull();
    expect(button(target, 'do')!.disabled).toBe(true);
    vi.mocked(open).mockResolvedValue('/notes/export.enex');
    api.notesLook.mockResolvedValue({ ...LOOK, kind: 'evernote', name: 'export' });
    button(target, 'file')!.click();
    await settle();
    expect(api.notesLook).toHaveBeenCalledWith('/notes/export.enex');
    expect(target.querySelector('[data-import-found]')!.textContent).toContain(
      'Notes from Evernote',
    );
  });

  it('shows a section of OneNote as any other notes, with what is to be known of it', async () => {
    api.notesLook.mockResolvedValue({
      kind: 'onenote',
      name: 'Section',
      notes: 2,
      attachments: 1,
      remarks: ['One page holds handwriting or drawings, which are not read.'],
    });
    const { target } = await shown('/notes/Section.one');
    const found = target.querySelector('[data-import-found]')!;
    expect(found.textContent).toContain('Notes from OneNote');
    expect(found.textContent).toContain('2 notes');
    expect(target.querySelector('[data-import-remarks]')!.textContent).toContain('handwriting');
    expect(button(target, 'do')!.disabled).toBe(false);
  });

  it('says what could not be read with how many notes were made', async () => {
    api.notesLook.mockResolvedValue(LOOK);
    api.notesRead.mockResolvedValue({
      ...READ,
      problems: ['a.md: not UTF-8', 'b.md: too large', 'c.md: empty', 'd.md: gone'],
    });
    const { target } = await shown();
    button(target, 'do')!.click();
    await settle();
    const toast = toasts.list.at(-1)!;
    expect(toast.detail).toContain('4 things could not be read');
    expect(toast.detail).toContain('a.md: not UTF-8; b.md: too large; c.md: empty');
    expect(toast.detail).not.toContain('d.md');
  });
});
