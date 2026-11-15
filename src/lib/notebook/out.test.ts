import { Slice } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import type { Reference } from '$lib/api/library';
import { bodySchema } from '$lib/editor/schema';
import { Project } from '$lib/project/model/project.svelte';
import { readBody, type Block, type Inline } from '$lib/project/model/text';
import { PROJECT } from '$lib/project/model/types';

const HASH = 'a'.repeat(64);
const PDF = 'd'.repeat(64);

const api = vi.hoisted(() => ({
  libraryAdd: vi.fn(),
  libraryGet: vi.fn(),
  notebookToLibrary: vi.fn(),
  notify: vi.fn(),
  notifyError: vi.fn(),
  show: vi.fn(),
  opened: null as unknown,
}));

vi.mock('$lib/api/library', async (original) => ({
  ...(await original<typeof import('$lib/api/library')>()),
  libraryAdd: api.libraryAdd,
  libraryGet: api.libraryGet,
  libraryList: vi.fn(async () => ({ entries: [], collections: [], warnings: [], file: '' })),
}));
vi.mock('$lib/api/notebook', async (original) => ({
  ...(await original<typeof import('$lib/api/notebook')>()),
  notebookToLibrary: api.notebookToLibrary,
}));
vi.mock('$lib/ui/toast.svelte', async (original) => ({
  ...(await original<typeof import('$lib/ui/toast.svelte')>()),
  notify: api.notify,
  notifyError: api.notifyError,
  toasts: { show: api.show },
}));
vi.mock('./open.svelte', () => ({
  theNotebook: {
    get current() {
      return api.opened;
    },
    open: async () => api.opened,
  },
}));

const { Notebook } = await import('./model/notebook.svelte');
const out = await import('./out');
const { library } = await import('$lib/state/library.svelte');
const { files } = await import('$lib/files/store.svelte');
const { openProjects } = await import('$lib/project/open-projects.svelte');
type Notebook = InstanceType<typeof Notebook>;

/** A reference as the library gives it back when it is added. */
function saved(id: string, title: string): Reference {
  return {
    id,
    key: id,
    type: 'online',
    fields: { title },
    names: {},
    attachments: [],
    added: '',
    modified: '2026-11-15T10:00:00Z',
    summary: { id, key: id, type: 'online', title } as Reference['summary'],
    files: [],
    collections: [],
  };
}

/** A paragraph at the end of a note, of runs of words, each taken in a passage where one is given. */
function paragraph(nb: Notebook, note: string, runs: [string, string | null][], kind = 'text') {
  nb.transact(() => {
    const fragment = nb.fragment(note)!;
    // The empty paragraph a new note begins with gives way.
    const first = fragment.get(0);
    if (
      fragment.length === 1 &&
      first instanceof Y.XmlElement &&
      first.toArray().every((c) => c instanceof Y.XmlText && !c.toString())
    )
      fragment.delete(0, 1);
    const el = new Y.XmlElement('paragraph');
    el.setAttribute('kind', kind);
    el.setAttribute('indent', 0 as unknown as string);
    const text = new Y.XmlText();
    el.insert(0, [text]);
    fragment.insert(fragment.length, [el]);
    let at = 0;
    for (const [words, passage] of runs) {
      text.insert(at, words, passage ? { taken: { passage } } : {});
      at += words.length;
    }
  });
}

/** A project begun, with one element to write in. */
function project() {
  const p = new Project(null);
  p.begin('Wrath');
  const element = p.addChild(PROJECT)!;
  return { p, element, body: () => readBody(p.fragment(element, 'body')!) };
}

/** What a paragraph holds, in short: words as they are, a citation as [ids locator]. */
function said(content: Inline[]): string {
  return content
    .map((i) =>
      i.kind === 'text'
        ? i.text
        : i.kind === 'citation'
          ? `[${i.items.map((c) => [c.id, c.locator, c.label].filter(Boolean).join(' ')).join(';')}]`
          : `<${i.kind}>`,
    )
    .join('');
}

function shape(blocks: Block[]): string[] {
  return blocks.map((b) =>
    b.kind === 'paragraph'
      ? `${b.name}: ${said(b.content)}`
      : `${b.kind}${b.kind === 'figure' ? ` ${b.file}` : ''}`,
  );
}

const marksOf = (blocks: Block[]) =>
  blocks.flatMap((b) =>
    b.kind === 'paragraph'
      ? b.content.flatMap((i) => (i.kind === 'text' ? Object.keys(i.marks) : []))
      : [],
  );

let nb: Notebook;
let views: EditorView[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  nb = new Notebook();
  api.opened = nb;
  library.entries = [];
  library.loaded = true;
  vi.spyOn(files, 'reload').mockResolvedValue();
  api.libraryGet.mockRejectedValue(new Error('not found'));
});

afterEach(() => {
  for (const v of views) v.destroy();
  views = [];
  vi.restoreAllMocks();
});

describe('what goes from a note into a text', () => {
  it('the writer’s own words arrive as they are, with their kinds and marks', async () => {
    const note = nb.addNote();
    paragraph(nb, note, [['A heading', null]], 'heading');
    nb.transact(() => {
      const el = nb.fragment(note)!.get(0) as Y.XmlElement;
      (el.get(0) as Y.XmlText).format(2, 7, { em: {} });
    });
    paragraph(nb, note, [['My own words.', null]]);
    const { p, element, body } = project();
    await out.piecesIntoElement(p, element, { note, pieces: null });
    expect(shape(body())).toEqual(['heading: A heading', 'text: My own words.']);
    expect(marksOf(body())).toContain('em');
    expect(nb.note(note)!.went.map((w) => w.what)).toEqual(['text']);
  });

  it('a passage of two paragraphs from a page is two quotations and one citation, its reference made once', async () => {
    const source = nb.addSource({
      sort: 'web',
      url: 'https://owls.example/night',
      title: 'Owls at night',
      read: '2026-11-15T09:00:00Z',
    });
    const passage = nb.addPassage(source, 'Owls hunt.\nThey see well.');
    const note = nb.addNote();
    nb.addText(note, 'Owls hunt.\nThey see well.', passage);
    api.libraryAdd.mockResolvedValue(saved('r1', 'Owls at night'));
    const { p, element, body } = project();
    // Dropped twice at once: the source is still made a reference once.
    await Promise.all([
      out.piecesIntoElement(p, element, { note, pieces: null }),
      out.piecesIntoElement(p, element, { note, pieces: [0] }),
    ]);
    expect(api.libraryAdd).toHaveBeenCalledTimes(1);
    expect(api.libraryAdd.mock.calls[0][0]).toMatchObject({
      type: 'online',
      fields: { title: 'Owls at night', url: 'https://owls.example/night', urldate: '2026-11-15' },
    });
    expect(nb.sources.get(source)!.reference).toBe('r1');
    expect(library.get('r1')).toBeTruthy();
    expect(api.show).toHaveBeenCalledTimes(1);
    expect(shape(body()).slice(0, 2)).toEqual(['quote: Owls hunt.', 'quote: They see well. [r1]']);
    expect(marksOf(body())).not.toContain('taken');
    expect(nb.note(note)!.went.map((w) => w.what)).toEqual(['quotation', 'quotation']);
    // The project keeps a copy of the reference it cites.
    expect(api.libraryGet).toHaveBeenCalledWith('r1');
  });

  it('taken words within a paragraph of the writer’s stay, with the citation after them', async () => {
    const source = nb.addSource({ sort: 'web', url: 'https://a.example', title: 'A', read: '' });
    const passage = nb.addPassage(source, 'they see well');
    const note = nb.addNote();
    paragraph(nb, note, [
      ['Some say ', null],
      ['they see well', passage],
      [' in the dark.', null],
    ]);
    api.libraryAdd.mockResolvedValue(saved('r2', 'A'));
    const { p, element, body } = project();
    await out.piecesIntoElement(p, element, { note, pieces: null });
    expect(shape(body())).toEqual(['text: Some say they see well [r2] in the dark.']);
    expect(new Set(nb.note(note)!.went.map((w) => w.what))).toEqual(new Set(['text', 'quotation']));
  });

  it('a passage with no source is a quotation with no citation', async () => {
    const passage = nb.addPassage(null, 'Words from somewhere.');
    const note = nb.addNote();
    nb.addText(note, 'Words from somewhere.', passage);
    const { p, element, body } = project();
    await out.piecesIntoElement(p, element, { note, pieces: null });
    expect(shape(body())).toEqual(['quote: Words from somewhere.']);
    expect(api.libraryAdd).not.toHaveBeenCalled();
  });

  it('a source that is a reference with a place is cited at that place, and nothing is made', async () => {
    const source = nb.addSource({
      sort: 'reference',
      reference: 'nagy',
      locator: '73',
      label: 'line',
    });
    const passage = nb.addPassage(source, 'The best of the Achaeans.');
    const note = nb.addNote();
    nb.addText(note, 'The best of the Achaeans.', passage);
    const { p, element, body } = project();
    await out.piecesIntoElement(p, element, { note, pieces: null });
    expect(shape(body())).toEqual(['quote: The best of the Achaeans. [nagy 73 line]']);
    expect(api.libraryAdd).not.toHaveBeenCalled();
  });

  it('a picture is the figure it is, and its file is put among the library’s with its origin', async () => {
    const source = nb.addSource({
      sort: 'web',
      url: 'https://owls.example/owl.png',
      title: '',
      read: '',
    });
    const note = nb.addNote();
    nb.holdFile({ hash: HASH, name: 'owl.png', extension: 'png' }, source);
    nb.addFigure(note, { hash: HASH, name: 'owl.png', extension: 'png', alt: 'An owl' });
    api.notebookToLibrary.mockResolvedValue({});
    const { p, element, body } = project();
    await out.piecesIntoElement(p, element, { note, pieces: null });
    expect(api.notebookToLibrary).toHaveBeenCalledWith(HASH, 'https://owls.example/owl.png');
    expect(files.reload).toHaveBeenCalled();
    const [figure] = body();
    expect(figure).toMatchObject({ kind: 'figure', file: HASH, alt: 'An owl' });
    // Given an id of its own, not the note's.
    const inNote = nb.note(note)!.pieces[0];
    expect(inNote.kind === 'figure' && (figure as { id: string }).id).not.toBe(
      inNote.kind === 'figure' ? (inNote.blocks[0] as { id: string }).id : '',
    );
    expect(nb.note(note)!.went.map((w) => w.what)).toEqual(['figure']);
  });

  it('a picture whose file could not be put among the library’s is left out, and said', async () => {
    const note = nb.addNote();
    nb.holdFile({ hash: HASH, name: 'owl.png', extension: 'png' }, null);
    nb.addFigure(note, { hash: HASH, name: 'owl.png', extension: 'png' });
    api.notebookToLibrary.mockRejectedValue(new Error('no'));
    const { p, element, body } = project();
    await out.piecesIntoElement(p, element, { note, pieces: null });
    expect(body()).toEqual([]);
    expect(api.notifyError).toHaveBeenCalled();
  });

  it('a file that is no picture is left out; a note of nothing else says so', async () => {
    const note = nb.addNote();
    nb.addFile(note, { hash: PDF, name: 'paper.pdf', extension: 'pdf' });
    const { p, element, body } = project();
    await out.piecesIntoElement(p, element, { note, pieces: null });
    expect(body()).toEqual([]);
    expect(api.notify).toHaveBeenCalledWith('A file does not go into a text');
    expect(nb.note(note)!.went).toEqual([]);

    const mixed = nb.addNote();
    paragraph(nb, mixed, [['Read this.', null]]);
    nb.addFile(mixed, { hash: PDF, name: 'paper.pdf', extension: 'pdf' });
    await out.piecesIntoElement(p, element, { note: mixed, pieces: null });
    expect(shape(body())).toEqual(['text: Read this.']);
    expect(api.notify).toHaveBeenCalledTimes(1);
  });

  it('the note says where its pieces went: the project, its name and the element', async () => {
    const note = nb.addNote();
    paragraph(nb, note, [['Mine.', null]]);
    const { p, element } = project();
    vi.spyOn(openProjects, 'all').mockReturnValue([
      { id: 'p1', project: p } as unknown as ReturnType<typeof openProjects.all>[number],
    ]);
    await out.piecesIntoElement(p, element, { note, pieces: [0] });
    expect(nb.note(note)!.went).toMatchObject([
      { what: 'text', project: 'p1', name: 'Wrath', element },
    ]);
  });
});

describe('into a text being written', () => {
  function editor(text = 'Before after.') {
    const place = document.body.appendChild(document.createElement('div'));
    const doc = bodySchema.node('doc', null, [
      bodySchema.node('paragraph', null, [bodySchema.text(text)]),
    ]);
    const view = new EditorView(place, { state: EditorState.create({ schema: bodySchema, doc }) });
    views.push(view);
    return view;
  }

  it('own words of one paragraph go in at the point, within the paragraph', async () => {
    const note = nb.addNote();
    paragraph(nb, note, [['mine ', null]]);
    const { p } = project();
    const view = editor();
    await out.piecesIntoText(p, view, 1 + 'Before '.length, { note, pieces: null });
    expect(view.state.doc.childCount).toBe(1);
    expect(view.state.doc.textContent).toBe('Before mine after.');
  });

  it('a passage stands as paragraphs of its own beside the paragraph it is dropped in', async () => {
    const passage = nb.addPassage(null, 'Taken.');
    const note = nb.addNote();
    nb.addText(note, 'Taken.', passage);
    const { p } = project();
    const view = editor();
    await out.piecesIntoText(p, view, 3, { note, pieces: null });
    expect(view.state.doc.childCount).toBe(2);
    const kinds = [] as string[];
    view.state.doc.forEach((n) => kinds.push(`${n.attrs.kind}: ${n.textContent}`));
    expect(kinds.sort()).toEqual(['quote: Taken.', 'text: Before after.']);
  });

  it('what is pasted holding nothing from a note goes in as it is, and costs nothing', () => {
    const { p } = project();
    const slice = new Slice(
      bodySchema.node('doc', null, [bodySchema.node('paragraph', null, [bodySchema.text('Plain')])])
        .content,
      0,
      0,
    );
    expect(out.receivedFromNotes(p, slice)).toBeNull();
    expect(api.libraryAdd).not.toHaveBeenCalled();
  });

  it('a passage copied in a note and pasted is a quotation with its citation', async () => {
    const source = nb.addSource({ sort: 'web', url: 'https://b.example', title: 'B', read: '' });
    const passage = nb.addPassage(source, 'One.\nTwo.');
    const note = nb.addNote();
    nb.addText(note, 'One.\nTwo.', passage);
    api.libraryAdd.mockResolvedValue(saved('r3', 'B'));
    const taken = bodySchema.marks.taken.create({ passage });
    const content = bodySchema.node('doc', null, [
      bodySchema.node('paragraph', null, [bodySchema.text('One.', [taken])]),
      bodySchema.node('paragraph', null, [bodySchema.text('Two.', [taken])]),
    ]).content;
    const { p } = project();
    const made = await out.receivedFromNotes(p, new Slice(content, 1, 1))!;
    expect(made.openStart).toBe(0);
    const lines: string[] = [];
    made.content.forEach((n) => {
      const cited =
        n.lastChild?.type.name === 'citation' ? `[${n.lastChild.attrs.items[0].id}]` : '';
      lines.push(`${n.attrs.kind}: ${n.textContent}${cited}`);
    });
    expect(lines).toEqual(['quote: One.', 'quote: Two. [r3]']);
    let marked = false;
    made.content.descendants((n) => {
      if (n.marks.some((m) => m.type.name === 'taken')) marked = true;
    });
    expect(marked).toBe(false);
    expect(nb.note(note)!.went.map((w) => w.what)).toEqual(['quotation']);
  });

  it('a part of a passage pasted within a paragraph goes in at the point, cited', async () => {
    const source = nb.addSource({ sort: 'reference', reference: 'nagy', locator: '12' });
    const passage = nb.addPassage(source, 'a long passage');
    const taken = bodySchema.marks.taken.create({ passage });
    const content = bodySchema.node('doc', null, [
      bodySchema.node('paragraph', null, [bodySchema.text('long', [taken])]),
    ]).content;
    const { p } = project();
    const view = editor();
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 8)));
    const made = await out.receivedFromNotes(p, new Slice(content, 1, 1))!;
    view.dispatch(view.state.tr.replaceSelection(made));
    expect(view.state.doc.childCount).toBe(1);
    const first = view.state.doc.firstChild!;
    expect(first.textContent).toBe('Before long after.');
    let cited = '';
    first.forEach((n) => {
      if (n.type.name === 'citation') cited = n.attrs.items[0].locator;
    });
    expect(cited).toBe('12');
  });
});

describe('the conversion', () => {
  it('cites each unbroken run of taken words, and not the words of a paragraph taken whole', () => {
    const blocks: Block[] = [
      {
        kind: 'paragraph',
        name: 'text',
        indent: 0,
        content: [
          { kind: 'text', text: 'x', marks: { taken: { passage: 'p1' } } },
          { kind: 'text', text: 'y', marks: { taken: { passage: 'p1' }, em: true } },
          { kind: 'text', text: 'z', marks: { taken: { passage: 'p2' } } },
        ],
      },
    ];
    const cite = (p: string) => ({ id: `r-${p}` });
    expect(shape(out.convertBlocks(blocks, cite).blocks)).toEqual(['text: xy [r-p1]z [r-p2]']);
    expect(shape(out.convertBlocks(blocks, cite, true).blocks)).toEqual([
      'text: xy [r-p1]z [r-p2]',
    ]);
  });
});
