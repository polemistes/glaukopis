import { describe, expect, it } from 'vitest';
import { buildDocument, countWords, documentMark, leanDocument } from './document';
import { Project } from './project.svelte';
import { inlineText } from './text';

function outline(p: Project, map: string): string[] {
  return buildDocument(p, map).sections.map(
    (s) =>
      `${s.level} ${s.heading ? inlineText(s.heading) : '—'}${s.blocks.length ? ' +text' : ''}`,
  );
}

describe('a map as a document', () => {
  it('follows the hierarchy, and leaves out what is excluded or loose', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const root = p.map(map)!.root;
    p.fragment(root, 'body');
    const a = p.addChild(root, { title: 'A', body: 'Text of A.' })!;
    const a1 = p.addChild(a, { title: 'A1', body: 'Text of A1.' })!;
    p.addChild(a1, { title: 'A1a' });
    const b = p.addChild(root, { title: 'B', body: 'Left out.' })!;
    p.addChild(b, { title: 'B1', body: 'Left out with it.' });
    p.setExcluded(b, true);
    p.addChild(root, { title: 'C' });
    p.addLoose(map, { x: 0, y: 0 }, 'A thought');

    expect(inlineText(buildDocument(p, map).title)).toBe('Wrath');
    expect(outline(p, map)).toEqual(['1 A +text', '2 A1 +text', '3 A1a', '1 C']);
  });

  it('an element whose name is not printed gives its text and does not deepen', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const root = p.map(map)!.root;
    const a = p.addChild(root, { title: 'A' })!;
    const idea = p.addChild(a, { title: 'an idea of mine', body: 'A paragraph.' })!;
    p.setHeading(idea, false);
    p.addChild(idea, { title: 'Under the idea', body: 'More.' });
    p.addChild(a, { title: 'A2' });
    expect(outline(p, map)).toEqual(['1 A', '2 — +text', '2 Under the idea +text', '2 A2']);
  });

  it('the title and the particulars of the document', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath', { title: 'Wrath and the hero' });
    const root = p.map(map)!.root;
    p.addChild(root, { title: 'A' });
    expect(inlineText(buildDocument(p, map).title)).toBe('Wrath and the hero');
    p.setDocument(map, {
      title: 'Another title',
      authors: [{ name: 'A. Scholar' }, { name: ' ' }],
      keywords: ['Homer'],
    });
    const d = buildDocument(p, map);
    expect(inlineText(d.title)).toBe('Another title');
    expect(d.authors).toEqual([{ name: 'A. Scholar' }]);
    expect(d.keywords).toEqual(['Homer']);
  });

  it('a map that is included stands in the place of the element that includes it', () => {
    const p = new Project(null);
    const book = p.createMap('The book');
    const chapter = p.createMap('Chapter one');
    const croot = p.map(chapter)!.root;
    p.addChild(croot, { title: 'First section', body: 'Text.' });
    const second = p.addChild(croot, { title: 'Second section' })!;
    p.addChild(second, { title: 'Below' });

    const broot = p.map(book)!.root;
    p.addChild(broot, { title: 'Preface', body: 'Before.' });
    const holder = p.addChild(broot, { title: 'The first chapter' })!;
    expect(p.setInclude(holder, chapter)).toBe(true);
    p.addChild(broot, { title: 'Afterword' });

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
  });

  it('carries the references that are cited, and counts words', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const root = p.map(map)!.root;
    p.addChild(root, { title: 'A', body: 'One two three four.' });
    const out = p.addChild(root, { title: 'B', body: 'Five six.' })!;
    p.setExcluded(out, true);
    expect(countWords(p, map)).toEqual({ text: 4, withNotes: 4 });
    expect(buildDocument(p, map).references).toEqual([]);
  });
});

describe('the kinds of the writer`s own', () => {
  it('go with the document, and change what the document is made of', () => {
    const p = new Project(null);
    const map = p.createMap('Wrath');
    const root = p.map(map)!.root;
    p.addChild(root, { title: 'A', body: 'Text.' });
    expect(buildDocument(p, map).kinds).toEqual([]);
    const before = documentMark(leanDocument(p, map));
    const id = p.createPassageKind({
      name: 'Letter',
      family: 'paragraph',
      basedOn: 'epigraph',
      look: { italic: true },
    })!;
    expect(buildDocument(p, map).kinds).toEqual([
      { id, name: 'Letter', family: 'paragraph', basedOn: 'epigraph', look: { italic: true } },
    ]);
    const made = documentMark(leanDocument(p, map));
    expect(made).not.toBe(before);
    p.updatePassageKind(id, { look: { italic: true, bold: true } });
    expect(documentMark(leanDocument(p, map))).not.toBe(made);
  });
});
