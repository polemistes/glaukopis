import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileView } from '$lib/api/files';
import type { NotebookFile } from '$lib/api/notebook';
import { bodySchema } from '$lib/editor/schema';

const api = vi.hoisted(() => ({ notebookTakeImage: vi.fn() }));
vi.mock('$lib/api/notebook', () => api);
const toast = vi.hoisted(() => ({ toasts: { show: vi.fn() }, notifyError: vi.fn() }));
vi.mock('$lib/ui/toast.svelte', () => toast);
const go = vi.hoisted(() => vi.fn());
vi.mock('$lib/state/router.svelte', () => ({ router: { go } }));

const { Notebook } = await import('./model/notebook.svelte');
const opened = vi.hoisted(() => ({ notebook: null as unknown }));
vi.mock('./open.svelte', () => ({
  theNotebook: { open: () => Promise.resolve(opened.notebook) },
}));

const {
  joinLines,
  markedRect,
  noteOfPicture,
  noteOfWords,
  pagesOf,
  pictureName,
  placeOf,
  referenceChosen,
  sayAdded,
  selectedLines,
  sourceOf,
} = await import('./from-file');

describe('the lines selected, joined', () => {
  it('into running text, with a space between lines', () => {
    expect(joinLines(['The owl of Minerva', 'spreads its wings', 'at dusk.'])).toBe(
      'The owl of Minerva spreads its wings at dusk.',
    );
  });

  it('without the hyphen where a word was broken before a small letter', () => {
    expect(joinLines(['the hyphen-', 'ated word and an exam-', 'ple'])).toBe(
      'the hyphenated word and an example',
    );
    // A soft hyphen is never kept.
    expect(joinLines(['Fug\u00ad', 'Lehre'])).toBe('FugLehre');
  });

  it('keeping a real hyphen before a capital, without a space', () => {
    expect(joinLines(['the North-', 'American owls'])).toBe('the North-American owls');
    // A dash with a space before it is no broken word.
    expect(joinLines(['owls -', 'and hawks'])).toBe('owls - and hawks');
  });

  it('with an empty line between paragraphs where the selection has one', () => {
    expect(joinLines(['First line', 'goes on.', '', 'Second', 'paragraph.'])).toBe(
      'First line goes on.\n\nSecond paragraph.',
    );
    expect(joinLines(['', '  One  ', '', '', 'Two', ''])).toBe('One\n\nTwo');
  });

  it('changing nothing else', () => {
    expect(joinLines(['«Hello,»  she said;', '— the ‘owl’ (sic)'])).toBe(
      '«Hello,»  she said; — the ‘owl’ (sic)',
    );
  });
});

/** Pages of a PDF as the viewer draws them: each line placed in percents of its page. */
function pages(...each: [number, number, string][][]): HTMLElement {
  const root = document.createElement('div');
  each.forEach((lines, i) => {
    const page = document.createElement('div');
    page.className = 'page';
    page.dataset.page = String(i + 1);
    const text = document.createElement('div');
    text.className = 'text';
    text.dataset.pageText = String(i + 1);
    for (const [top, height, words] of lines) {
      const line = document.createElement('div');
      line.className = 'line';
      line.style.top = `${top}%`;
      line.style.height = `${height}%`;
      const span = document.createElement('span');
      span.textContent = words;
      line.append(span, document.createElement('br'));
      text.append(line);
    }
    page.append(text);
    root.append(page);
  });
  document.body.replaceChildren(root);
  return root;
}

const textOf = (root: HTMLElement, page: number, line: number) =>
  root.querySelectorAll(`[data-page-text="${page}"] .line span`)[line].firstChild as Text;

describe('a selection over the pages', () => {
  it('is read line by line, as much of each as it takes in', () => {
    const root = pages([
      [10, 2, 'Short Treatise on owls'],
      [12.5, 2, 'and their hab-'],
      [15, 2, 'its in winter.'],
      [17.5, 2, 'Not this one.'],
    ]);
    const range = document.createRange();
    range.setStart(textOf(root, 1, 0), 6);
    range.setEnd(textOf(root, 1, 2), 14);
    expect(selectedLines(root, range)).toEqual([
      'Treatise on owls',
      'and their hab-',
      'its in winter.',
    ]);
    expect(joinLines(selectedLines(root, range))).toBe(
      'Treatise on owls and their habits in winter.',
    );
  });

  it('parts paragraphs where the room between lines is larger than a line', () => {
    const root = pages([
      [10, 2, 'One line'],
      [12.5, 2, 'and another.'],
      [17, 2, 'A new paragraph'],
      [19.5, 2, 'goes on.'],
    ]);
    const range = document.createRange();
    range.setStart(textOf(root, 1, 0), 0);
    range.setEnd(textOf(root, 1, 3), 8);
    expect(joinLines(selectedLines(root, range))).toBe(
      'One line and another.\n\nA new paragraph goes on.',
    );
  });

  it('runs on from one page to the next, and knows which pages it is on', () => {
    const root = pages(
      [
        [80, 2, 'At the foot of a page'],
        [82.5, 2, 'the sen-'],
      ],
      [[10, 2, 'tence goes on.']],
    );
    const range = document.createRange();
    range.setStart(textOf(root, 1, 0), 0);
    range.setEnd(textOf(root, 2, 0), 14);
    expect(joinLines(selectedLines(root, range))).toBe(
      'At the foot of a page the sentence goes on.',
    );
    expect(pagesOf(root, range)).toEqual([1, 2]);
    const one = document.createRange();
    one.setStart(textOf(root, 2, 0), 0);
    one.setEnd(textOf(root, 2, 0), 5);
    expect(pagesOf(root, one)).toEqual([2, 2]);
    // An end that lies on no page: the pages of the lines it takes in.
    const wide = document.createRange();
    wide.setStart(root, 0);
    wide.setEnd(textOf(root, 1, 1), 3);
    expect(pagesOf(root, wide)).toEqual([1, 1]);
  });

  it('says its place by the numbers in print, a dash between the first and the last', () => {
    const labels = ['i', 'ii', '1', '2', '233', '234'];
    expect(placeOf(labels, 3)).toBe('1');
    expect(placeOf(labels, 5, 6)).toBe('233–234');
    expect(placeOf(labels, 2, 2)).toBe('ii');
    // Where the file tells no number, its count.
    expect(placeOf([], 4, 7)).toBe('4–7');
  });
});

describe('the source of what is taken from a file', () => {
  it('is its one reference, with the place', () => {
    expect(sourceOf({ name: 'a.pdf', references: ['R1'] }, '233–234')).toEqual({
      sort: 'reference',
      reference: 'R1',
      locator: '233–234',
    });
    expect(sourceOf({ name: 'owl.jpg', references: ['R1'] }, null)).toEqual({
      sort: 'reference',
      reference: 'R1',
    });
  });

  it('is the file itself, with the page, where it belongs to no reference', () => {
    expect(sourceOf({ name: 'letter.pdf', references: [] }, '12')).toEqual({
      sort: 'file',
      name: 'letter.pdf',
      locator: '12',
    });
  });

  it('is the one chosen among several, which is kept for the file', () => {
    const file = { name: 'a.pdf', references: ['R1', 'R2'] };
    expect(sourceOf(file, '3')).toBeNull();
    expect(sourceOf(file, '3', 'R9')).toBeNull();
    expect(referenceChosen.get('hash')).toBeNull();
    referenceChosen.set('hash', 'R2');
    expect(sourceOf(file, '3', referenceChosen.get('hash'))).toEqual({
      sort: 'reference',
      reference: 'R2',
      locator: '3',
    });
    expect(referenceChosen.get('other')).toBeNull();
  });

  it('is the same source again by its name, its time and its place', () => {
    const nb = new Notebook();
    const twelve = nb.addSource({ sort: 'file', name: 'letter.pdf', locator: '12' });
    expect(nb.sources.get(twelve)).toMatchObject({ sort: 'file', locator: '12' });
    expect(nb.addSource({ sort: 'file', name: 'letter.pdf', locator: '12' })).toBe(twelve);
    expect(nb.addSource({ sort: 'file', name: 'letter.pdf', locator: '13' })).not.toBe(twelve);
    expect(nb.addSource({ sort: 'file', name: 'letter.pdf' })).not.toBe(twelve);
  });
});

describe('a part marked', () => {
  it('is a rectangle in the pixels of the canvas, from the size it is shown at', () => {
    const shown = { width: 400, height: 600 };
    const pixels = { width: 800, height: 1200 };
    expect(markedRect({ x: 10, y: 20 }, { x: 110, y: 70 }, shown, pixels)).toEqual({
      x: 20,
      y: 40,
      width: 200,
      height: 100,
    });
    // Drawn backwards, the same.
    expect(markedRect({ x: 110, y: 70 }, { x: 10, y: 20 }, shown, pixels)).toEqual({
      x: 20,
      y: 40,
      width: 200,
      height: 100,
    });
  });

  it('takes in every pixel it touches, and stays within the page', () => {
    const rect = markedRect(
      { x: 10.3, y: -50 },
      { x: 500, y: 20.6 },
      { width: 200, height: 300 },
      { width: 300, height: 450 },
    );
    expect(rect).toEqual({ x: 15, y: 0, width: 285, height: 31 });
    expect(
      markedRect({ x: 5, y: 5 }, { x: 5, y: 40 }, { width: 100, height: 100 }, pixels(100)),
    ).toBeNull();
    expect(markedRect({ x: 0, y: 0 }, { x: 5, y: 5 }, { width: 0, height: 0 }, pixels(100))).toBe(
      null,
    );
  });

  it('is named by the file and the place', () => {
    expect(pictureName('structure.pdf', '3')).toBe('structure 3.png');
    expect(pictureName('owl.jpg', null)).toBe('owl.png');
    expect(pictureName('a/b.pdf', '233–234')).toBe('a b 233–234.png');
  });
});

function pixels(n: number) {
  return { width: n, height: n };
}

const view = (hash: string, name: string): FileView => ({
  hash,
  path: `files/${hash}`,
  name,
  kind: 'picture',
  size: 10,
  exists: true,
  folder: null,
  origin: null,
  added: '2026-11-15T10:00:00Z',
  width: 640,
  height: 480,
  alt: '',
  madeFrom: null,
  bookmarks: [],
  references: [],
});

describe('what is sent is a new note', () => {
  beforeEach(() => {
    opened.notebook = new Notebook();
    api.notebookTakeImage.mockReset();
    toast.toasts.show.mockReset();
  });

  it('of the words, taken in as one passage with their source, in the first box', async () => {
    const nb = opened.notebook as InstanceType<typeof Notebook>;
    const id = await noteOfWords('First paragraph.\n\nSecond one.', {
      sort: 'reference',
      reference: 'R1',
      locator: '233–234',
    });
    const note = nb.note(id)!;
    expect(note.box).toBe(nb.list[0].box);
    expect(note.pieces).toHaveLength(1);
    expect(note.pieces[0].kind).toBe('passage');
    const passage = [...nb.passages.values()][0];
    expect(passage.text).toBe('First paragraph.\nSecond one.');
    expect(nb.sources.get(passage.source!)).toMatchObject({
      sort: 'reference',
      reference: 'R1',
      locator: '233–234',
    });
    const doc = yXmlFragmentToProseMirrorRootNode(nb.fragment(id)!, bodySchema);
    expect(doc.childCount).toBe(2);
    expect(doc.child(0).textContent).toBe('First paragraph.');
    expect(doc.child(1).textContent).toBe('Second one.');
    // The notebook holds no file for words.
    expect(nb.files.size).toBe(0);
    // What is sent from a file has not been looked at.
    expect(note.seen).toBe(false);
    // One step of undo.
    nb.undo();
    expect(nb.note(id)).toBeUndefined();
  });

  it('in the box that receives, where one is made that', async () => {
    const nb = opened.notebook as InstanceType<typeof Notebook>;
    const box = nb.addBox('From outside');
    nb.receiveIn(box);
    const id = await noteOfWords('Words.', { sort: 'reference', reference: 'R1', locator: '1' });
    expect(nb.note(id)!.box).toBe(box);
  });

  it('of the picture of a part, held with its source and shown as a figure', async () => {
    const nb = opened.notebook as InstanceType<typeof Notebook>;
    const part = view('e'.repeat(64), 'structure 3.png');
    const taken: NotebookFile = { file: part, shown: part, time: null, taken: null, place: null };
    api.notebookTakeImage.mockResolvedValue(taken);
    const id = await noteOfPicture('structure 3.png', new Uint8Array([1, 2, 3]), {
      sort: 'file',
      name: 'structure.pdf',
      locator: '3',
    });
    expect(api.notebookTakeImage).toHaveBeenCalledWith('structure 3.png', 'AQID');
    const note = nb.note(id)!;
    expect(note.pieces.map((p) => p.kind)).toEqual(['figure']);
    expect(note.picture?.hash).toBe(part.hash);
    // The picture of the part is held, and nothing else: not the file it was taken from.
    expect([...nb.files.keys()]).toEqual([part.hash]);
    expect(nb.sources.get(nb.files.get(part.hash)!.source!)).toMatchObject({
      sort: 'file',
      name: 'structure.pdf',
      locator: '3',
    });
  });

  it('said in a message with Show, which goes to the note', () => {
    sayAdded('N1');
    const shown = toast.toasts.show.mock.calls[0][0];
    expect(shown.message).toBe('Added to the notebook');
    expect(shown.action.label).toBe('Show');
    shown.action.run();
    expect(go).toHaveBeenCalledWith({ view: 'notebook', note: 'N1' });
  });
});
