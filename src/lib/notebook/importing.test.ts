import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { describe, expect, it, vi } from 'vitest';
import type { FileView } from '$lib/api/files';
import type { NotebookFile, ReadNote, ReadNotes } from '$lib/api/notebook';
import { bodySchema } from '$lib/editor/schema';
import type { Block } from '$lib/project/model/text';

vi.mock('$lib/api/notebook', () => ({ notebookTakeFiles: vi.fn(), notebookTakeImage: vi.fn() }));
vi.mock('$lib/ui/toast.svelte', () => ({ notifyError: vi.fn() }));

const { notesOfRead, freeBoxName } = await import('./importing');
const { Notebook } = await import('./model/notebook.svelte');
const { FIRST_BOX } = await import('./model/boxes');

type Book = InstanceType<typeof Notebook>;

const PNG = 'a'.repeat(64);
const PDF = 'b'.repeat(64);

const view = (hash: string, name: string, kind: FileView['kind']): FileView => ({
  hash,
  path: `files/${hash}`,
  name,
  kind,
  size: 10,
  exists: true,
  folder: null,
  origin: null,
  added: '2026-11-15T10:00:00Z',
  width: kind === 'picture' ? 320 : null,
  height: kind === 'picture' ? 200 : null,
  alt: '',
  madeFrom: null,
  bookmarks: [],
  references: [],
});

const picture: NotebookFile = {
  file: view(PNG, 'owl.png', 'picture'),
  shown: view(PNG, 'owl.png', 'picture'),
  time: null,
  taken: null,
  place: null,
};
const pdf: NotebookFile = {
  file: view(PDF, 'letter.pdf', 'pdf'),
  shown: null,
  time: null,
  taken: null,
  place: null,
};

const paragraph = (text: string): Block => ({
  kind: 'paragraph',
  name: 'text',
  indent: 0,
  content: [{ kind: 'text', text, marks: {} }],
});

const figure: Block = {
  kind: 'figure',
  id: 'f1',
  file: PNG,
  extension: 'png',
  name: 'owl.png',
  caption: [],
  alt: 'An owl',
  width: 50,
  numbered: true,
};

const note = (over: Partial<ReadNote>): ReadNote => ({
  key: '',
  name: '',
  made: null,
  tags: [],
  source: null,
  blocks: [],
  held: [],
  attachments: [],
  links: [],
  ...over,
});

/** Three notes: one clipped from a page, one with a picture and a file, the last two linked. */
const three = (): ReadNotes => ({
  notes: [
    note({
      key: 'Athena.md',
      name: 'Athena',
      made: '2026-01-02T10:00:00Z',
      tags: ['owls', '#Greek gods'],
      source: { url: 'https://example.org/athena', title: 'Athena' },
      blocks: [paragraph('The owl was hers.'), paragraph('She was wise.')],
    }),
    note({
      key: 'Owl.md',
      name: 'Owl',
      blocks: [paragraph('A picture of an owl.'), figure],
      held: [picture, pdf],
      attachments: [PDF],
      links: ['Glaux.md'],
    }),
    note({
      key: 'Glaux.md',
      name: 'Glaux',
      blocks: [paragraph('The little owl.')],
      links: ['Owl.md', 'Nowhere.md'],
    }),
  ],
  problems: [],
});

const docOf = (nb: Book, id: string) => {
  const node = yXmlFragmentToProseMirrorRootNode(nb.fragment(id)!, bodySchema);
  node.check();
  return node;
};

const byName = (nb: Book, name: string) => [...nb.notes.values()].find((n) => n.name === name)!;

describe('notes read from another program, made notes', () => {
  it('makes a box named after what was imported, with a note for each, not placed and not looked at', () => {
    const nb = new Notebook();
    const made = notesOfRead(nb, three(), 'Vault')!;
    expect(made.notes).toHaveLength(3);
    const box = nb.boxes.find((b) => b.id === made.box)!;
    expect(box.name).toBe('Vault');
    expect(made.box).not.toBe(FIRST_BOX);
    for (const id of made.notes) {
      const n = nb.note(id)!;
      expect(n.box).toBe(made.box);
      expect(n.at).toBeNull();
      expect(n.seen).toBe(false);
    }
    expect(made.notes.map((id) => nb.note(id)!.name)).toEqual(['Athena', 'Owl', 'Glaux']);
  });

  it('keeps when a note was made, and of those that say none, each after the one before', () => {
    const nb = new Notebook();
    const made = notesOfRead(nb, three(), 'Vault')!;
    const [athena, owl, glaux] = made.notes.map((id) => nb.note(id)!);
    expect(athena.made).toBe('2026-01-02T10:00:00.000Z');
    expect(owl.made < glaux.made).toBe(true);
    expect(Date.parse(glaux.made) - Date.parse(owl.made)).toBe(1);
  });

  it('cleans the tags as the notebook cleans them', () => {
    const nb = new Notebook();
    notesOfRead(nb, three(), 'Vault');
    const athena = byName(nb, 'Athena');
    expect(athena.tags).toHaveLength(2);
    expect(athena.tags).toContain('owls');
    expect(athena.tags.some((t) => t.includes('#'))).toBe(false);
    expect(nb.tags.map((t) => t.tag)).toEqual(expect.arrayContaining(athena.tags));
  });

  it('takes a note clipped from a page in from it as one passage; another is the writer’s own', () => {
    const nb = new Notebook();
    notesOfRead(nb, three(), 'Vault');
    const athena = byName(nb, 'Athena');
    const passages = athena.pieces.filter((p) => p.kind === 'passage');
    expect(passages).toHaveLength(1);
    const passage = passages[0].kind === 'passage' ? passages[0].passage : '';
    const kept = nb.passages.get(passage)!;
    expect(kept.text).toBe('The owl was hers.\nShe was wise.');
    const source = nb.sources.get(kept.source!)!;
    expect(source).toMatchObject({
      sort: 'web',
      url: 'https://example.org/athena',
      title: 'Athena',
    });
    expect(nb.changedSince(athena.id, passage)).toBe(false);
    // Every word of it is marked.
    docOf(nb, athena.id).descendants((node) => {
      if (node.isText) expect(node.marks.some((m) => m.type.name === 'taken')).toBe(true);
    });

    const owl = byName(nb, 'Owl');
    expect(owl.pieces.some((p) => p.kind === 'passage')).toBe(false);
    expect(owl.sources).toEqual([null]);
    expect(JSON.stringify(docOf(nb, owl.id).toJSON())).not.toContain('taken');
  });

  it('holds the files read, the picture as its figure and the other file at the note’s end', () => {
    const nb = new Notebook();
    notesOfRead(nb, three(), 'Vault');
    expect(nb.files.get(PNG)).toMatchObject({ name: 'owl.png', source: null });
    expect(nb.files.get(PDF)).toMatchObject({ name: 'letter.pdf', source: null });
    const owl = byName(nb, 'Owl');
    const doc = docOf(nb, owl.id);
    expect(doc.childCount).toBe(3);
    expect(doc.child(0).textContent).toBe('A picture of an owl.');
    expect(doc.child(1).type.name).toBe('figure');
    expect(doc.child(1).attrs.file).toBe(PNG);
    expect(doc.child(2).type.name).toBe('file');
    expect(doc.child(2).attrs).toMatchObject({ hash: PDF, name: 'letter.pdf', extension: 'pdf' });
    expect(nb.summary().files).toEqual([PNG, PDF].sort());
  });

  it('holds the files of a note clipped from a page with the page as their source', () => {
    const nb = new Notebook();
    const read = three();
    read.notes[0].held = [picture];
    read.notes[0].blocks = [...read.notes[0].blocks, figure];
    read.notes[1].held = [pdf];
    read.notes[1].blocks = [paragraph('A file.')];
    notesOfRead(nb, read, 'Vault');
    const athena = byName(nb, 'Athena');
    expect(nb.files.get(PNG)!.source).toBe(athena.sources[0]);
    expect(nb.sources.get(athena.sources[0]!)).toMatchObject({ url: 'https://example.org/athena' });
  });

  it('links two notes that name each other once, and none to a note not read with them', () => {
    const nb = new Notebook();
    notesOfRead(nb, three(), 'Vault');
    const owl = byName(nb, 'Owl');
    const glaux = byName(nb, 'Glaux');
    expect(nb.links).toHaveLength(1);
    const [link] = nb.links;
    expect([link.from, link.to].sort()).toEqual([owl.id, glaux.id].sort());
  });

  it('is one step of undo, apart from what was done before', () => {
    const nb = new Notebook();
    nb.addNote({ name: 'Before' });
    const made = notesOfRead(nb, three(), 'Vault')!;
    expect(nb.notes.size).toBe(4);
    nb.undo();
    expect(nb.notes.size).toBe(1);
    expect(byName(nb, 'Before')).toBeTruthy();
    expect(nb.boxes.some((b) => b.id === made.box)).toBe(false);
    expect(nb.links).toHaveLength(0);
    expect(nb.files.size).toBe(0);
    expect(nb.sources.size).toBe(0);
    nb.redo();
    expect(nb.notes.size).toBe(4);
  });

  it('names the box with a number after it where a box of that name is there', () => {
    const nb = new Notebook();
    nb.addBox('Vault');
    const second = notesOfRead(nb, three(), 'Vault')!;
    expect(nb.boxes.find((b) => b.id === second.box)!.name).toBe('Vault 2');
    const third = notesOfRead(nb, three(), 'vault')!;
    expect(nb.boxes.find((b) => b.id === third.box)!.name).toBe('vault 3');
    expect(freeBoxName(['A', 'B'], '  New   box ')).toBe('New box');
  });

  it('does not make a note with no name, no text and no files; nor a box where nothing is left', () => {
    const nb = new Notebook();
    const read = three();
    read.notes.push(note({ key: 'empty.md', blocks: [paragraph('   ')] }));
    const made = notesOfRead(nb, read, 'Vault')!;
    expect(made.notes).toHaveLength(3);
    expect(notesOfRead(nb, { notes: [note({ key: 'x' })], problems: [] }, 'Empty')).toBeNull();
    expect(nb.boxes.some((b) => b.name === 'Empty')).toBe(false);
  });

  it('makes a note with a name and no text, and one with only a file', () => {
    const nb = new Notebook();
    const made = notesOfRead(
      nb,
      {
        notes: [
          note({ key: 'a', name: 'Only a name' }),
          note({ key: 'b', held: [pdf], attachments: [PDF] }),
        ],
        problems: [],
      },
      'Few',
    )!;
    expect(made.notes).toHaveLength(2);
    const [, file] = made.notes;
    expect(docOf(nb, file).child(0).type.name).toBe('file');
  });
});
