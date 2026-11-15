import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileView } from '$lib/api/files';
import type { NotebookFile } from '$lib/api/notebook';
import { bodySchema } from '$lib/editor/schema';

const PHOTO = 'a'.repeat(64);
const UPRIGHT = 'b'.repeat(64);
const PDF = 'c'.repeat(64);
const PASTED = 'd'.repeat(64);

const api = vi.hoisted(() => ({
  notebookTakeFiles: vi.fn(),
  notebookTakeImage: vi.fn(),
}));
vi.mock('$lib/api/notebook', () => api);
vi.mock('$lib/ui/toast.svelte', () => ({ notifyError: vi.fn() }));

const { takeFiles, takePasted, htmlText } = await import('./taking');
const { Notebook } = await import('./model/notebook.svelte');
const { notifyError } = await import('$lib/ui/toast.svelte');

const view = (hash: string, name: string, kind: FileView['kind'] = 'picture'): FileView => ({
  hash,
  path: `files/${hash}`,
  name,
  kind,
  size: 10,
  exists: true,
  folder: null,
  origin: null,
  added: '2026-11-15T10:00:00Z',
  width: kind === 'picture' ? 1900 : null,
  height: null,
  alt: '',
  madeFrom: null,
  bookmarks: [],
  references: [],
});

const photo: NotebookFile = {
  file: view(PHOTO, 'photo.jpg'),
  shown: view(UPRIGHT, 'photo.jpg'),
  time: '2026-01-01T10:00:00Z',
  taken: '2025-06-02T14:03:22',
  place: { lat: 59.9, lon: 10.7 },
};
const letter: NotebookFile = {
  file: view(PDF, 'letter.pdf', 'pdf'),
  shown: null,
  time: '2026-02-01T10:00:00Z',
  taken: null,
  place: null,
};

/** A paste, as the window gives one again after reading the clipboard. */
function paste(parts: Record<string, string>, files: File[] = []): DataTransfer {
  const list = Object.assign([...files], { item: (i: number) => files[i] }) as unknown as FileList;
  return {
    files: list,
    types: Object.keys(parts),
    getData: (type: string) => parts[type] ?? '',
  } as unknown as DataTransfer;
}

const checked = (nb: InstanceType<typeof Notebook>, id: string) => {
  const node = yXmlFragmentToProseMirrorRootNode(nb.fragment(id)!, bodySchema);
  node.check();
  return node;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('files taken in as notes', () => {
  it('each file is a note of its own, with itself as its source, in one step of undo', async () => {
    const nb = new Notebook();
    api.notebookTakeFiles.mockResolvedValue({
      files: [photo, letter],
      problems: ['x.bin: unreadable'],
    });
    const ids = await takeFiles(nb, ['/p/photo.jpg', '/p/letter.pdf', '/p/x.bin']);
    expect(ids.length).toBe(2);
    expect(api.notebookTakeFiles).toHaveBeenCalledWith([
      '/p/photo.jpg',
      '/p/letter.pdf',
      '/p/x.bin',
    ]);
    const [first, second] = ids.map((id) => nb.note(id)!);
    expect(first.pieces).toEqual([expect.objectContaining({ kind: 'figure', hash: UPRIGHT })]);
    expect(second.pieces).toEqual([
      expect.objectContaining({ kind: 'file', hash: PDF, name: 'letter.pdf', extension: 'pdf' }),
    ]);
    expect(checked(nb, ids[0]).firstChild!.type.name).toBe('figure');
    expect(checked(nb, ids[1]).firstChild!.type.name).toBe('file');
    // The photograph and what is shown of it are both held, with one source.
    const source = nb.files.get(UPRIGHT)!.source!;
    expect(nb.files.get(PHOTO)!.source).toBe(source);
    expect(nb.sources.get(source)).toMatchObject({ sort: 'file', name: 'photo.jpg' });
    expect(first.sources).toEqual([source]);
    expect(nb.sources.get(nb.files.get(PDF)!.source!)).toMatchObject({
      sort: 'file',
      name: 'letter.pdf',
      time: '2026-02-01T10:00:00Z',
    });
    expect(nb.summary().files).toEqual([PHOTO, UPRIGHT, PDF].sort());
    expect(notifyError).toHaveBeenCalledWith(expect.any(String), 'x.bin: unreadable');
    // Made together, they stand in the list in the order they were given, over what was there before.
    const before = nb.addNote({ made: '2020-01-01T00:00:00.000Z' });
    expect(nb.list.map((n) => n.id)).toEqual([ids[0], ids[1], before]);
    nb.undo();
    // One step of undo takes them all back.
    nb.undo();
    expect(nb.list).toEqual([]);
  });

  it('a failure of the store is said, and makes nothing', async () => {
    const nb = new Notebook();
    api.notebookTakeFiles.mockRejectedValue(new Error('no store'));
    expect(await takeFiles(nb, ['/a'])).toEqual([]);
    expect(notifyError).toHaveBeenCalled();
    expect(nb.list).toEqual([]);
  });
});

describe('a paste outside any text', () => {
  it('words are a note, taken in one passage from the page the paste says', async () => {
    const nb = new Notebook();
    const id = await takePasted(
      nb,
      paste({
        'text/plain': 'Sing, goddess,\n\nthe wrath',
        'application/x-glaukopis-page': 'https://a.org/iliad',
      }),
    );
    const note = nb.note(id!)!;
    expect(note.pieces.map((p) => p.kind)).toEqual(['passage']);
    const passage = note.pieces[0].kind === 'passage' ? note.pieces[0].passage : '';
    expect(nb.passages.get(passage)!.text).toBe('Sing, goddess,\nthe wrath');
    expect(nb.changedSince(id!, passage)).toBe(false);
    expect(nb.sources.get(note.sources[0]!)).toMatchObject({
      sort: 'web',
      url: 'https://a.org/iliad',
    });
    checked(nb, id!);
  });

  it('where there is only HTML, its words are taken; with no page, the passage has no source', async () => {
    const nb = new Notebook();
    const id = await takePasted(nb, paste({ 'text/html': '<p>One <b>two</b></p><p>three</p>' }));
    expect(nb.note(id!)!.begins).toBe('One two three');
    expect(nb.note(id!)!.sources).toEqual([null]);
  });

  it('pictures are figures in a note: one copied as a file from its path, one as a picture from what it holds', async () => {
    const nb = new Notebook();
    api.notebookTakeFiles.mockResolvedValue({ files: [photo], problems: [] });
    api.notebookTakeImage.mockResolvedValue({
      file: view(PASTED, 'image.png'),
      shown: view(PASTED, 'image.png'),
      time: null,
      taken: null,
      place: null,
    });
    const asFile = new File([], 'photo.jpg', { type: 'image/jpeg' });
    const asPicture = new File([new Uint8Array([1, 2, 3])], 'image.png', { type: 'image/png' });
    const id = await takePasted(
      nb,
      paste(
        {
          'text/plain': 'ignored',
          'application/x-glaukopis-picture-paths': JSON.stringify(['/p/photo.jpg', null]),
        },
        [asFile, asPicture],
      ),
    );
    expect(api.notebookTakeFiles).toHaveBeenCalledWith(['/p/photo.jpg']);
    expect(api.notebookTakeImage).toHaveBeenCalledWith('image.png', 'AQID');
    const note = nb.note(id!)!;
    expect(note.pieces.map((p) => (p.kind === 'figure' ? p.hash : p.kind))).toEqual([
      UPRIGHT,
      PASTED,
    ]);
    expect(nb.files.get(PASTED)!.source).toBeNull();
    expect(nb.files.get(UPRIGHT)!.source).not.toBeNull();
    checked(nb, id!);
  });

  it('a paste with neither words nor pictures makes nothing', async () => {
    const nb = new Notebook();
    expect(await takePasted(nb, paste({ 'text/plain': '   ' }))).toBeNull();
    expect(nb.list).toEqual([]);
  });
});

describe('the words of HTML', () => {
  it('a line to each block and line break', () => {
    expect(htmlText('<div>a<br>b</div><ul><li>c</li><li>d  e</li></ul><script>x</script>')).toBe(
      'a\nb\nc\nd e',
    );
  });
});
