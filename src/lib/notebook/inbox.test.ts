import { yXmlFragmentToProseMirrorRootNode } from 'y-prosemirror';
import { describe, expect, it, vi } from 'vitest';
import type { FileView } from '$lib/api/files';
import type { InboxItem, NotebookFile } from '$lib/api/notebook';
import { bodySchema } from '$lib/editor/schema';

vi.mock('$lib/api/notebook', () => ({ notebookTakeFiles: vi.fn(), notebookTakeImage: vi.fn() }));
vi.mock('$lib/ui/toast.svelte', () => ({ notifyError: vi.fn() }));

const { notesOfInbox, cleanHtml } = await import('./inbox');
const { Notebook } = await import('./model/notebook.svelte');

const PNG = 'e'.repeat(64);

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
  width: 320,
  height: 200,
  alt: '',
  madeFrom: null,
  bookmarks: [],
  references: [],
});

const picture: NotebookFile = {
  file: view(PNG, 'owl.png'),
  shown: view(PNG, 'owl.png'),
  time: null,
  taken: null,
  place: null,
};

const item = (over: Partial<InboxItem>): InboxItem => ({
  kind: 'selection',
  url: 'https://example.org/owls/athena',
  title: 'The owl of Athena',
  when: '2026-11-15T12:00:00.000Z',
  text: '',
  html: '',
  alt: '',
  image: null,
  ...over,
});

type Book = InstanceType<typeof Notebook>;

const docOf = (nb: Book, id: string) => {
  const node = yXmlFragmentToProseMirrorRootNode(nb.fragment(id)!, bodySchema);
  node.check();
  return node;
};

/** The passage the words of a note were taken in, where it is one. */
const passageOf = (nb: Book, id: string) => {
  const piece = nb.note(id)!.pieces.find((p) => p.kind === 'passage');
  return piece?.kind === 'passage' ? piece.passage : '';
};

/** Everything a text holds, as JSON, to look through for what must not be there. */
const json = (nb: Book, id: string) => JSON.stringify(docOf(nb, id).toJSON());

describe('things the plugin handed over, made notes', () => {
  it('a selection is a note without a name, its words and links taken in one passage from the page', () => {
    const nb = new Notebook();
    const [id] = notesOfInbox(nb, [
      item({
        text: 'The owl was hers. See more.',
        html: '<p>The <em>owl</em> was hers.</p><p>See <a href="/more">more</a>.</p>',
      }),
    ]);
    const note = nb.note(id)!;
    expect(note.name).toBe('');
    expect(note.made).toBe('2026-11-15T12:00:00.000Z');
    const doc = docOf(nb, id);
    expect(doc.childCount).toBe(2);
    expect(doc.textContent).toBe('The owl was hers.See more.');
    // Every word is taken, in the one passage.
    const passage = passageOf(nb, id);
    doc.descendants((node) => {
      if (node.isText)
        expect(node.marks.find((m) => m.type.name === 'taken')?.attrs.passage).toBe(passage);
    });
    expect(nb.passages.get(passage)!.text).toBe('The owl was hers.\nSee more.');
    expect(nb.changedSince(id, passage)).toBe(false);
    // Emphasis and links stay; a link is a whole address by its page.
    let link = '';
    let emphasis = '';
    doc.descendants((node) => {
      if (node.marks.some((m) => m.type.name === 'em')) emphasis = node.text!;
      const a = node.marks.find((m) => m.type.name === 'link');
      if (a) link = a.attrs.href;
    });
    expect(emphasis).toBe('owl');
    expect(link).toBe('https://example.org/more');
    expect(nb.sources.get(note.sources[0]!)).toMatchObject({
      sort: 'web',
      url: 'https://example.org/owls/athena',
      title: 'The owl of Athena',
      read: '2026-11-15T12:00:00.000Z',
    });
  });

  it('a page is a note named by its title, all its text one passage', () => {
    const nb = new Notebook();
    const [id] = notesOfInbox(nb, [
      item({
        kind: 'page',
        html: '<div id="readability-page-1"><h2>Owls</h2><ul><li>Little</li><li>Eagle</li></ul><blockquote><p>Wise.</p></blockquote></div>',
        text: 'Owls\nLittle\nEagle\nWise.',
      }),
    ]);
    const note = nb.note(id)!;
    expect(note.name).toBe('The owl of Athena');
    const doc = docOf(nb, id);
    expect(doc.content.content.map((p) => [p.attrs.kind, p.textContent])).toEqual([
      ['text', 'Owls'],
      ['item', 'Little'],
      ['item', 'Eagle'],
      ['quote', 'Wise.'],
    ]);
    expect(note.pieces.filter((p) => p.kind === 'passage').length).toBe(1);
    expect(nb.passages.get(passageOf(nb, id))!.text).toBe('Owls\nLittle\nEagle\nWise.');
  });

  it('where there is no HTML, the lines of the text are the paragraphs', () => {
    const nb = new Notebook();
    const [id] = notesOfInbox(nb, [item({ kind: 'page', text: ' First line \n\nSecond ' })]);
    expect(docOf(nb, id).content.content.map((p) => p.textContent)).toEqual([
      'First line',
      'Second',
    ]);
    expect(nb.changedSince(id, passageOf(nb, id))).toBe(false);
  });

  it('HTML that holds no words gives way to the text', () => {
    const nb = new Notebook();
    const [id] = notesOfInbox(nb, [
      item({ html: '<script>x()</script><img src="a.png">', text: 'words' }),
    ]);
    expect(docOf(nb, id).textContent).toBe('words');
  });

  it('an image is a note holding the picture as a figure, held with the page as its source', () => {
    const nb = new Notebook();
    const [id] = notesOfInbox(nb, [item({ kind: 'image', alt: 'A little owl', image: picture })]);
    const figure = docOf(nb, id).firstChild!;
    expect(figure.type.name).toBe('figure');
    expect(figure.attrs).toMatchObject({ file: PNG, alt: 'A little owl', name: 'owl.png' });
    const source = nb.files.get(PNG)!.source!;
    expect(nb.sources.get(source)).toMatchObject({
      sort: 'web',
      url: 'https://example.org/owls/athena',
    });
    expect(nb.note(id)!.sources).toEqual([source]);
    expect(nb.note(id)!.name).toBe('');
    // What the plugin hands over has not been looked at.
    expect(nb.note(id)!.seen).toBe(false);
  });

  it('a part of a page is the same, and an image that did not come makes no note', () => {
    const nb = new Notebook();
    const ids = notesOfInbox(nb, [
      item({ kind: 'region', image: picture }),
      item({ kind: 'image', image: null }),
    ]);
    expect(ids.length).toBe(1);
    expect(nb.note(ids[0])!.pieces).toEqual([
      expect.objectContaining({ kind: 'figure', hash: PNG }),
    ]);
  });

  it('things from one page share its source; all of them are one step of undo, the last on top', () => {
    const nb = new Notebook();
    const ids = notesOfInbox(nb, [
      item({ text: 'one', when: '2026-11-15T12:00:00.000Z' }),
      item({ text: 'two', when: '2026-11-15T12:00:01.000Z' }),
      item({ kind: 'region', image: picture, when: 'never' }),
    ]);
    expect(ids.length).toBe(3);
    expect(nb.sources.size).toBe(1);
    expect(nb.list.map((n) => n.id)).toEqual([ids[2], ids[1], ids[0]]);
    nb.undo();
    expect(nb.list).toEqual([]);
    expect(nb.sources.size).toBe(0);
  });
});

describe('HTML that tries to do harm', () => {
  const harm = `
    <p onclick="steal()">Read <a href="javascript:steal()">this</a> and <a href=" JaVaScRiPt:steal()">that</a>
      <img src="x" onerror="steal()"> and <a href="data:text/html,<script>steal()</script>">more</a>.</p>
    <script>steal()</script><style>p { color: red }</style>
    <iframe src="https://evil.example/"></iframe>
    <svg onload="steal()"><text>drawn</text></svg>
    <p><span class="taken" data-passage="other">forged</span>
      <span data-found='{"id":"x","items":[{"id":"ref"}]}'>found</span>
      <span class="citation" data-items='[{"id":"ref"}]'>cited</span></p>
    <figure data-file="${'f'.repeat(64)}"><img src="y"><figcaption>Caption</figcaption></figure>
    <p data-kind="heading" style="color: red">Plain</p>`;

  it('nothing of it survives: no script, no handler, no link that runs, nothing forged', () => {
    const steal = vi.fn();
    (globalThis as { steal?: unknown }).steal = steal;
    const nb = new Notebook();
    const [id] = notesOfInbox(nb, [item({ html: harm })]);
    const doc = docOf(nb, id);
    const all = json(nb, id);
    expect(all).not.toMatch(/steal|javascript|script|onerror|onclick|onload|evil|data:text/i);
    expect(all).not.toContain('"other"');
    expect(all).not.toContain('"ref"');
    expect(all).not.toContain('f'.repeat(64));
    expect(all).not.toMatch(/"type":"(figure|citation|file)"/);
    expect(all).not.toContain('found"');
    expect(doc.textContent).toContain('Read this and that and more.');
    expect(doc.textContent).toContain('forged');
    expect(doc.textContent).toContain('Caption');
    expect(doc.textContent).not.toContain('drawn');
    // Every paragraph is plain text: the kind the page gave is no kind of Glaukopis's.
    doc.forEach((p) => expect(p.attrs.kind).toBe('text'));
    // Every word is of the one passage of this taking.
    const passage = passageOf(nb, id);
    doc.descendants((node) => {
      if (node.isText)
        expect(
          node.marks.filter((m) => m.type.name === 'taken').map((m) => m.attrs.passage),
        ).toEqual([passage]);
    });
    expect(steal).not.toHaveBeenCalled();
    delete (globalThis as { steal?: unknown }).steal;
  });

  it('is read in a document of its own, never in the page', () => {
    const before = document.body.innerHTML;
    const clean = cleanHtml('<p>a<img src="x" onerror="steal()"></p>', 'https://example.org/');
    expect(clean.ownerDocument).not.toBe(document);
    expect(clean.innerHTML).toBe('<p>a</p>');
    expect(document.body.innerHTML).toBe(before);
  });

  it('keeps a link that may be followed, made whole, and no attribute but it', () => {
    const clean = cleanHtml(
      '<p class="x"><a href="../b" title="t" target="_blank">b</a> <a href="mailto:a@b.org">mail</a> <b style="font-weight: normal">c</b></p>',
      'https://example.org/a/page',
    );
    expect(clean.innerHTML).toBe(
      '<p><a href="https://example.org/b">b</a> <a href="mailto:a@b.org">mail</a> <b>c</b></p>',
    );
  });
});
