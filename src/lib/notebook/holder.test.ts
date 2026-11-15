import { Slice } from 'prosemirror-model';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileView } from '$lib/api/files';
import type { NotebookFile } from '$lib/api/notebook';
import { bodySchema } from '$lib/editor/schema';
import { newTextLanguage } from '$lib/i18n';

const HASH = 'a'.repeat(64);
const SHOWN = 'b'.repeat(64);

const api = vi.hoisted(() => ({
  notebookTakeFiles: vi.fn(),
  notebookTakeImage: vi.fn(),
}));
vi.mock('$lib/api/notebook', () => api);
vi.mock('$lib/ui/toast.svelte', () => ({ notifyError: vi.fn() }));

const { holderOfNotebook } = await import('./holder');
const { Notebook } = await import('./model/notebook.svelte');
const { notifyError } = await import('$lib/ui/toast.svelte');

const view = (hash: string, name: string, more: Partial<FileView> = {}): FileView => ({
  hash,
  path: `files/${hash}`,
  name,
  kind: 'picture',
  size: 10,
  exists: true,
  folder: null,
  origin: null,
  added: '2026-11-15T10:00:00Z',
  width: 950,
  height: 600,
  alt: '',
  madeFrom: null,
  bookmarks: [],
  references: [],
  ...more,
});

const taken = (more: Partial<NotebookFile> = {}): NotebookFile => ({
  file: view(HASH, 'owl.heic', { kind: 'other' }),
  shown: view(SHOWN, 'owl.png', { madeFrom: HASH }),
  time: '2026-01-01T10:00:00Z',
  taken: '2025-06-02T14:03:22',
  place: { lat: 59.9, lon: 10.7 },
  ...more,
});

const { doc, paragraph } = bodySchema.nodes;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('the notebook as the holder of its texts', () => {
  it('is one holder for a notebook, with its history and its presence', () => {
    const nb = new Notebook();
    const holder = holderOfNotebook(nb);
    expect(holderOfNotebook(nb)).toBe(holder);
    expect(holder.undoManager).toBe(nb.undoManager);
    expect(holder.awareness).toBe(nb.awareness);
    const id = nb.addNote();
    holder.undo();
    expect(nb.note(id)).toBeUndefined();
    holder.redo();
    expect(nb.note(id)).toBeDefined();
  });

  it('a note is no element and stands in no document', () => {
    const holder = holderOfNotebook(new Notebook());
    expect(holder.passageKinds).toEqual([]);
    expect(holder.passageKinds).toBe(holder.passageKinds);
    expect(holder.refs.size).toBe(0);
    expect(holder.ignored.size).toBe(0);
    expect(holder.ignoreWord).toBeUndefined();
    expect(holder.ownerOf(null as never)).toBeNull();
    expect(holder.has('x')).toBe(false);
    expect(holder.languageOf(null)).toBe(newTextLanguage());
    expect(holder.formatOf('x')).toBeUndefined();
    expect(holder.kindKeysOf(null)).toEqual({ '0': 'text' });
    expect(holder.topOf('x')).toBe('');
    expect(holder.threadsOf('x')).toEqual([]);
    expect(holder.drops).toBeUndefined();
    expect(holder.plugins!().length).toBe(1);
  });

  it('a picture chosen from a file is held, with the file as its source', async () => {
    const nb = new Notebook();
    api.notebookTakeFiles.mockResolvedValue({ files: [taken()], problems: [] });
    const figure = await holderOfNotebook(nb).pictureFromFile('/home/x/owl.heic');
    expect(figure).toEqual({ hash: SHOWN, extension: 'png', name: 'owl.png', width: 950, alt: '' });
    const source = nb.files.get(SHOWN)!.source!;
    expect(nb.sources.get(source)).toMatchObject({
      sort: 'file',
      name: 'owl.heic',
      taken: '2025-06-02T14:03:22',
      place: { lat: 59.9, lon: 10.7 },
    });
    expect(nb.files.get(HASH)!.source).toBe(source);
    expect(nb.files.get(SHOWN)!.madeFrom).toBe(HASH);
  });

  it('a file that no figure can show is said, and gives nothing', async () => {
    const nb = new Notebook();
    api.notebookTakeFiles.mockResolvedValue({ files: [taken({ shown: null })], problems: [] });
    expect(await holderOfNotebook(nb).pictureFromFile('/x.pdf')).toBeNull();
    expect(notifyError).toHaveBeenCalled();
    expect(nb.files.size).toBe(0);
  });

  it('a picture pasted is held with no source', async () => {
    const nb = new Notebook();
    api.notebookTakeImage.mockResolvedValue(taken({ time: null, taken: null, place: null }));
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
    const figure = await holderOfNotebook(nb).pictureFromBlob(blob, 'pasted.png');
    expect(figure?.hash).toBe(SHOWN);
    expect(api.notebookTakeImage).toHaveBeenCalledWith('pasted.png', 'AQID');
    expect(nb.files.get(SHOWN)!.source).toBeNull();
  });

  it('words pasted from elsewhere are taken in one passage, with the page as its source', () => {
    const nb = new Notebook();
    const holder = holderOfNotebook(nb);
    const slice = new Slice(
      doc.create(null, [
        paragraph.create(null, bodySchema.text('Sing, goddess')),
        paragraph.create(),
        paragraph.create(null, bodySchema.text('the wrath')),
      ]).content,
      0,
      0,
    );
    const made = holder.received!(slice, {
      fromGlaukopis: false,
      page: 'https://a.org/iliad',
    }) as Slice;
    const marks = new Set<string>();
    made.content.descendants((node) => {
      if (node.isText) for (const m of node.marks) marks.add(`${m.type.name}:${m.attrs.passage}`);
    });
    expect(marks.size).toBe(1);
    const passage = [...marks][0].split(':')[1];
    expect(nb.passages.get(passage)!.text).toBe('Sing, goddess\nthe wrath');
    const source = nb.passages.get(passage)!.source!;
    expect(nb.sources.get(source)).toMatchObject({ sort: 'web', url: 'https://a.org/iliad' });
    // Another paste from the page shares its source.
    holder.received!(slice, { fromGlaukopis: false, page: 'https://a.org/iliad' });
    expect(nb.sources.size).toBe(1);
  });

  it('what comes from a text of Glaukopis, or holds no words, goes in as it is', () => {
    const nb = new Notebook();
    const holder = holderOfNotebook(nb);
    const words = new Slice(
      doc.create(null, [paragraph.create(null, bodySchema.text('mine'))]).content,
      0,
      0,
    );
    expect(holder.received!(words, { fromGlaukopis: true, page: null })).toBeNull();
    const figure = bodySchema.nodes.figure.create({ file: HASH, extension: 'png' });
    expect(
      holder.received!(new Slice(doc.create(null, [figure]).content, 0, 0), {
        fromGlaukopis: false,
        page: null,
      }),
    ).toBeNull();
    expect(nb.passages.size).toBe(0);
  });

  it('words that carry a passage already keep theirs', () => {
    const nb = new Notebook();
    const holder = holderOfNotebook(nb);
    const old = bodySchema.marks.taken.create({ passage: 'OLD' });
    const slice = new Slice(
      doc.create(null, [
        paragraph.create(null, [bodySchema.text('kept ', [old]), bodySchema.text('new')]),
      ]).content,
      0,
      0,
    );
    const made = holder.received!(slice, { fromGlaukopis: false, page: null }) as Slice;
    const passages: string[] = [];
    made.content.descendants((node) => {
      if (node.isText)
        passages.push(node.marks.find((m) => m.type.name === 'taken')!.attrs.passage);
    });
    expect(passages[0]).toBe('OLD');
    expect(passages[1]).not.toBe('OLD');
    expect(nb.passages.get(passages[1])!.source).toBeNull();
  });
});
