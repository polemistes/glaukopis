import { describe, expect, it } from 'vitest';
import { buildDocument, countWords, documentMark, leanDocument } from './document';
import { Project } from './project.svelte';
import { fillBody, inlineText } from './text';
import { PROJECT } from './types';

function project(): Project {
  const p = new Project(null);
  p.begin('Wrath');
  return p;
}

function outline(p: Project, id: string): string[] {
  return buildDocument(p, id).sections.map(
    (s) =>
      `${s.level} ${s.heading ? inlineText(s.heading) : '—'}${s.blocks.length ? ' +text' : ''}`,
  );
}

describe('an element as a document', () => {
  it('follows the hierarchy, and leaves out what is excluded', () => {
    const p = project();
    p.transact(() => fillBody(p.fragment(PROJECT, 'body')!, 'The preamble.'));
    const a = p.addChild(PROJECT, { title: 'A', body: 'Text of A.' })!;
    const a1 = p.addChild(a, { title: 'A1', body: 'Text of A1.' })!;
    p.addChild(a1, { title: 'A1a' });
    const b = p.addChild(PROJECT, { title: 'B', body: 'Left out.' })!;
    p.addChild(b, { title: 'B1', body: 'Left out with it.' });
    p.setExcluded(b, true);
    p.addChild(PROJECT, { title: 'C' });

    expect(inlineText(buildDocument(p, PROJECT).title)).toBe('Wrath');
    expect(outline(p, PROJECT)).toEqual(['0 — +text', '1 A +text', '2 A1 +text', '3 A1a', '1 C']);
    // Any element is a document: its name the title, its text before the first section.
    expect(inlineText(buildDocument(p, a).title)).toBe('A');
    expect(outline(p, a)).toEqual(['0 — +text', '1 A1 +text', '2 A1a']);
    expect(outline(p, 'nobody')).toEqual([]);
  });

  it('an element whose name is not printed gives its text and does not deepen', () => {
    const p = project();
    const a = p.addChild(PROJECT, { title: 'A' })!;
    const idea = p.addChild(a, { title: 'an idea of mine', body: 'A paragraph.' })!;
    p.setHeading(idea, false);
    p.addChild(idea, { title: 'Under the idea', body: 'More.' });
    p.addChild(a, { title: 'A2' });
    expect(outline(p, PROJECT)).toEqual(['1 A', '2 — +text', '2 Under the idea +text', '2 A2']);
  });

  it('the title and the particulars of the document', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'Wrath' })!;
    p.addChild(book, { title: 'A' });
    // The name is the title until one is written.
    expect(inlineText(buildDocument(p, book).title)).toBe('Wrath');
    p.setDocument(book, { title: 'Wrath and the hero' });
    expect(inlineText(buildDocument(p, book).title)).toBe('Wrath and the hero');
    p.setDocument(book, {
      title: 'Another title',
      authors: [{ name: 'A. Scholar' }, { name: ' ' }],
      keywords: ['Homer'],
    });
    const d = buildDocument(p, book);
    expect(inlineText(d.title)).toBe('Another title');
    expect(d.authors).toEqual([{ name: 'A. Scholar' }]);
    expect(d.keywords).toEqual(['Homer']);
    // Written away, the name is the title again.
    p.setDocument(book, { title: '' });
    expect(p.node(book)!.document.title).toBeUndefined();
    expect(inlineText(buildDocument(p, book).title)).toBe('Wrath');
  });

  it('a child printed alone takes authors, style and language from the project element, but not its title', () => {
    const p = project();
    p.setDocument(PROJECT, {
      title: 'The wrath of Achilles',
      subtitle: 'A reading',
      authors: [{ name: 'A. Scholar' }],
      keywords: ['Homer'],
      style: 'chicago',
      template: 'journal-article',
      language: 'de',
      identifiers: { doi: '10.1/x' },
    });
    const chapter = p.addChild(PROJECT, { title: 'Chapter one' })!;
    const section = p.addChild(chapter, { title: 'First section' })!;

    const d = buildDocument(p, chapter);
    expect(inlineText(d.title)).toBe('Chapter one');
    expect(d.subtitle).toBeUndefined();
    expect(d.authors).toEqual([{ name: 'A. Scholar' }]);
    expect(d.keywords).toEqual(['Homer']);
    expect(d.language).toBe('de');
    expect(d.identifiers).toEqual({ doi: '10.1/x' });
    expect(d.parts).toEqual([]);
    const { settings, from } = p.documentOf(section);
    expect(settings).toEqual({
      authors: [{ name: 'A. Scholar' }],
      keywords: ['Homer'],
      style: 'chicago',
      template: 'journal-article',
      language: 'de',
      identifiers: { doi: '10.1/x' },
    });
    expect(from.get('style')).toBe(PROJECT);
    expect(from.has('title')).toBe(false);

    // What an element says itself comes first, and it is told where each setting is from.
    p.setDocument(chapter, { language: 'el', title: 'Das erste Kapitel' });
    expect(p.documentOf(section).settings.language).toBe('el');
    expect(p.documentOf(section).from.get('language')).toBe(chapter);
    expect(p.documentOf(section).settings.title).toBeUndefined();
    expect(inlineText(buildDocument(p, chapter).title)).toBe('Das erste Kapitel');
    // The project prints with its own.
    expect(inlineText(buildDocument(p, PROJECT).title)).toBe('The wrath of Achilles');
    expect(buildDocument(p, PROJECT).subtitle).toBe('A reading');
  });

  it('an element that is included stands in the place of the element that includes it', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'The book' })!;
    const chapter = p.addChild(PROJECT, { title: 'Chapter one' })!;
    p.addChild(chapter, { title: 'First section', body: 'Text.' });
    const second = p.addChild(chapter, { title: 'Second section' })!;
    p.addChild(second, { title: 'Below' });

    p.addChild(book, { title: 'Preface', body: 'Before.' });
    const holder = p.addChild(book, { title: 'The first chapter' })!;
    expect(p.setInclude(holder, chapter)).toBe(true);
    p.addChild(book, { title: 'Afterword' });

    expect(outline(p, book)).toEqual([
      '1 Preface +text',
      '1 The first chapter',
      '2 First section +text',
      '2 Second section',
      '3 Below',
      '1 Afterword',
    ]);
    // The chapter alone is a document too.
    expect(outline(p, chapter)).toEqual(['1 First section +text', '1 Second section', '2 Below']);
    // The whole project holds both, the chapter twice.
    expect(outline(p, PROJECT)).toEqual([
      '1 The book',
      '2 Preface +text',
      '2 The first chapter',
      '3 First section +text',
      '3 Second section',
      '4 Below',
      '2 Afterword',
      '1 Chapter one',
      '2 First section +text',
      '2 Second section',
      '3 Below',
    ]);
  });

  it('carries the references that are cited, and counts words', () => {
    const p = project();
    const a = p.addChild(PROJECT, { title: 'A', body: 'One two three four.' })!;
    const out = p.addChild(PROJECT, { title: 'B', body: 'Five six.' })!;
    p.setExcluded(out, true);
    expect(countWords(p, PROJECT)).toEqual({ text: 4, withNotes: 4 });
    expect(countWords(p, a)).toEqual({ text: 4, withNotes: 4 });
    expect(buildDocument(p, PROJECT).references).toEqual([]);
  });
});

describe('the kinds of elements that make a document', () => {
  /** The outline of a document with the kinds of its sections. */
  function kinded(p: Project, id: string): string[] {
    return buildDocument(p, id).sections.map(
      (s) => `${s.level} ${s.heading ? inlineText(s.heading) : '—'}${s.kind ? ` [${s.kind}]` : ''}`,
    );
  }

  it('orders the children of every element as front matter, the rest, back matter', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    const chapter = p.addChild(book, { title: 'Chapter' })!;
    const appendix = p.addChild(chapter, { title: 'Tables', body: 'Of the chapter.' })!;
    const text = p.addChild(chapter, { title: 'Text' })!;
    const abstract = p.addChild(chapter, { title: 'Abstract', body: 'In short.' })!;
    const note = p.createKind({ name: "Author's note", colour: 'teal', template: '' })!;
    p.updateKind(note, { basedOn: 'front-section' });
    const authors = p.addChild(chapter, { title: 'A word first' })!;
    const character = p.createKind({ name: 'Character', colour: 'rose', template: '' })!;
    const achilles = p.addChild(chapter, { title: 'Achilles' })!;
    p.setKind([appendix], 'appendix');
    p.setKind([abstract], 'abstract');
    p.setKind([authors], note);
    p.setKind([achilles], character);
    void text;
    // Deeper down, a kind-element is a section with its kind; a kind of the
    // writer's own based on one of the catalogue is that.
    expect(kinded(p, PROJECT)).toEqual([
      '1 Book',
      '2 Chapter',
      '3 Abstract [abstract]',
      '3 A word first [front-section]',
      '3 Text',
      '3 Achilles',
      '3 Tables [appendix]',
    ]);
    // Printed itself, the chapter's matter is its parts, and not among its sections.
    const d = buildDocument(p, chapter);
    expect(d.parts.map((part) => `${part.kind} ${inlineText(part.title)}`)).toEqual([
      'abstract Abstract',
      'front-section A word first',
      'appendix Tables',
    ]);
    expect(kinded(p, chapter)).toEqual(['1 Text', '1 Achilles']);
    expect(d.parts[0].sections).toEqual([
      { level: 0, heading: null, blocks: p.blocksOf(abstract), element: abstract },
    ]);
    expect(d.parts[1].sections).toEqual([]);
  });

  it('a part is a branch of its own: its text at level 0, its children from level 1', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'Book', body: 'Preamble.' })!;
    const appendix = p.addChild(book, { title: 'Appendix', body: 'What the appendix says.' })!;
    const a1 = p.addChild(appendix, { title: 'A.1', body: 'First.' })!;
    p.addChild(a1, { title: 'A.1.1' });
    p.addChild(appendix, { title: 'A.2' });
    const chapter = p.addChild(book, { title: 'Chapter', body: 'Text.' })!;
    p.setKind([appendix], 'appendix');
    const d = buildDocument(p, book);
    expect(outline(p, book)).toEqual(['0 — +text', '1 Chapter +text']);
    expect(d.parts).toHaveLength(1);
    expect(
      d.parts[0].sections.map(
        (s) =>
          `${s.level} ${s.heading ? inlineText(s.heading) : '—'}${s.blocks.length ? ' +text' : ''}`,
      ),
    ).toEqual(['0 — +text', '1 A.1 +text', '2 A.1.1', '1 A.2']);
    expect(d.parts[0].element).toBe(appendix);
    expect(d.parts[0].sections[1].element).toBe(a1);
    void chapter;
  });

  it('of a kind a document has one of, the first among siblings is sent and the rest are left out', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    const chapter = p.addChild(book, { title: 'Chapter' })!;
    const first = p.addChild(book, { title: 'Abstract', body: 'One.' })!;
    const second = p.addChild(book, { title: 'Abstract again', body: 'Two.' })!;
    const deeper = p.addChild(chapter, { title: 'Abstract of the chapter' })!;
    const deeperAgain = p.addChild(chapter, { title: 'Another' })!;
    p.setKind([first, second, deeper, deeperAgain], 'abstract');
    const d = buildDocument(p, book);
    expect(d.parts.map((part) => part.element)).toEqual([first]);
    expect(kinded(p, book)).toEqual(['1 Chapter', '2 Abstract of the chapter [abstract]']);
    // Appendices are many.
    p.setKind([first, second], 'appendix');
    expect(buildDocument(p, book).parts.map((part) => part.element)).toEqual([first, second]);
    // The first, left out of the document, gives way to the second.
    p.setKind([first, second], 'abstract');
    p.setExcluded(first, true);
    expect(buildDocument(p, book).parts.map((part) => part.element)).toEqual([second]);
  });

  it('what a cover output alone prints is a part at the top, and nowhere deeper down', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    const cover = p.addChild(book, { title: 'Cover' })!;
    const blurb = p.addChild(book, { title: 'Blurb', body: 'Buy it.' })!;
    const chapter = p.addChild(book, { title: 'Chapter' })!;
    const inner = p.addChild(chapter, { title: 'Cover of the chapter' })!;
    p.setKind([cover, inner], 'cover');
    p.setKind([blurb], 'blurb');
    const d = buildDocument(p, book);
    expect(d.parts.map((part) => `${part.kind} ${part.element}`)).toEqual([
      `cover ${cover}`,
      `blurb ${blurb}`,
    ]);
    expect(kinded(p, book)).toEqual(['1 Chapter']);
    expect(kinded(p, PROJECT)).toEqual(['1 Book', '2 Chapter']);
  });

  it('the parts of an element that is included belong to it', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    const article = p.addChild(PROJECT, { title: 'Article' })!;
    const abstract = p.addChild(article, { title: 'Abstract', body: 'In short.' })!;
    p.addChild(article, { title: 'Argument', body: 'At length.' });
    p.setKind([abstract], 'abstract');
    const holder = p.addChild(book, { title: 'The article as a chapter' })!;
    expect(p.setInclude(holder, article)).toBe(true);
    const bookAbstract = p.addChild(book, { title: 'Of the book' })!;
    p.setKind([bookAbstract], 'abstract');

    // Printed alone, the article's abstract is its part.
    const alone = buildDocument(p, article);
    expect(alone.parts.map((part) => part.element)).toEqual([abstract]);
    expect(kinded(p, article)).toEqual(['1 Argument']);
    // Within the book, it is a section at the head of the chapter that stands for the article.
    const within = buildDocument(p, book);
    expect(within.parts.map((part) => part.element)).toEqual([bookAbstract]);
    expect(kinded(p, book)).toEqual([
      '1 The article as a chapter',
      '2 Abstract [abstract]',
      '2 Argument',
    ]);
  });

  it('goes with the lean document and its mark, and the words are counted as before', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    const abstract = p.addChild(book, { title: 'Abstract', body: 'One two.' })!;
    p.addChild(book, { title: 'Chapter', body: 'Three four five.' });
    const before = documentMark(leanDocument(p, book));
    p.setKind([abstract], 'abstract');
    const lean = leanDocument(p, book);
    expect(lean.parts).toHaveLength(1);
    expect(lean.sections).toHaveLength(1);
    expect(documentMark(lean)).not.toBe(before);
    expect(countWords(p, book)).toEqual({ text: 5, withNotes: 5 });
  });
});

describe('the kinds of the writer`s own', () => {
  it('go with the document, and change what the document is made of', () => {
    const p = project();
    p.addChild(PROJECT, { title: 'A', body: 'Text.' });
    expect(buildDocument(p, PROJECT).kinds).toEqual([]);
    const before = documentMark(leanDocument(p, PROJECT));
    const id = p.createPassageKind({
      name: 'Letter',
      family: 'paragraph',
      basedOn: 'epigraph',
      look: { italic: true },
    })!;
    expect(buildDocument(p, PROJECT).kinds).toEqual([
      { id, name: 'Letter', family: 'paragraph', basedOn: 'epigraph', look: { italic: true } },
    ]);
    const made = documentMark(leanDocument(p, PROJECT));
    expect(made).not.toBe(before);
    p.updatePassageKind(id, { look: { italic: true, bold: true } });
    expect(documentMark(leanDocument(p, PROJECT))).not.toBe(made);
  });
});
