import { describe, expect, it } from 'vitest';
import type { Template } from '$lib/api/templates';
import { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import { checklist } from './checklist';

function project(): Project {
  const p = new Project(null);
  p.begin('Wrath');
  return p;
}

function template(more: Partial<Template> = {}): Template {
  return {
    id: 'journal-article',
    name: 'Journal article',
    group: 'article',
    description: '',
    contents: [{ part: 'title-page' }, { kind: 'abstract' }, { part: 'body' }],
    kinds: ['abstract'],
    passageKinds: [],
    requirements: { words: null, abstractWords: null, keywords: null, anonymous: false, note: '' },
    outputs: [{ id: 'document', targets: ['pdf'] }],
    ...more,
  };
}

describe('the checklist of a document', () => {
  it('says nothing of a document that keeps to its template', () => {
    const p = project();
    const article = p.addChild(PROJECT, { title: 'Article', body: 'One two three.' })!;
    const abstract = p.addChild(article, { title: 'Abstract', body: 'In short.' })!;
    p.setKind([abstract], 'abstract');
    p.setDocument(article, { keywords: ['Homer', 'wrath'] });
    const t = template({
      requirements: { words: 10, abstractWords: 5, keywords: 2, anonymous: false, note: '' },
    });
    expect(checklist(p, article, t)).toEqual([]);
    expect(checklist(p, article, null)).toEqual([]);
    expect(checklist(p, 'nobody', t)).toEqual([]);
  });

  it('counts the words of the document, of the abstract, and the keywords against the requirements', () => {
    const p = project();
    const article = p.addChild(PROJECT, { title: 'Article', body: 'One two three four.' })!;
    const abstract = p.addChild(article, { title: 'Abstract', body: 'In short, too long.' })!;
    p.setKind([abstract], 'abstract');
    p.setDocument(article, { keywords: ['Homer', 'wrath', 'epic'] });
    const t = template({
      requirements: { words: 5, abstractWords: 3, keywords: 2, anonymous: false, note: '' },
    });
    const remarks = checklist(p, article, t);
    expect(remarks.map((r) => r.kind)).toEqual(['words', 'abstract-words', 'keywords']);
    // The words of the document are those of the whole, the abstract among them.
    expect(remarks[0].text).toContain('8');
    expect(remarks[0].text).toContain('5');
    expect(remarks[1].elements).toEqual([abstract]);
    expect(remarks[1].text).toContain('4');
    expect(remarks[2].text).toContain('3');
    for (const r of remarks) expect(r.text).not.toMatch(/^checklist-/);
  });

  it('lists every element of a kind the document has one of but the first, by its siblings', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    const first = p.addChild(book, { title: 'Abstract' })!;
    const second = p.addChild(book, { title: 'Again' })!;
    const third = p.addChild(book, { title: 'And again' })!;
    const chapter = p.addChild(book, { title: 'Chapter' })!;
    const ofChapter = p.addChild(chapter, { title: 'Of the chapter' })!;
    const ofChapterAgain = p.addChild(chapter, { title: 'Of the chapter, again' })!;
    const appendixA = p.addChild(book, { title: 'A' })!;
    const appendixB = p.addChild(book, { title: 'B' })!;
    p.setKind([first, second, third, ofChapter, ofChapterAgain], 'abstract');
    p.setKind([appendixA, appendixB], 'appendix');
    const remarks = checklist(p, book, template());
    expect(remarks.map((r) => r.kind)).toEqual(['doubled', 'doubled']);
    expect(remarks[0].elements).toEqual([second, third]);
    expect(remarks[0].text).toContain('2');
    expect(remarks[0].text).toContain('Abstract');
    expect(remarks[1].elements).toEqual([ofChapterAgain]);
    // Without a template too, since the tree says it.
    expect(checklist(p, book, null)).toHaveLength(2);
    // Of the chapter alone, its own.
    expect(checklist(p, chapter, null)[0].elements).toEqual([ofChapterAgain]);
  });

  it('names the parts of a cover kind where the template makes no cover', () => {
    const p = project();
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    const cover = p.addChild(book, { title: 'Cover' })!;
    const blurb = p.addChild(book, { title: 'Blurb' })!;
    const chapter = p.addChild(book, { title: 'Chapter' })!;
    p.setKind([cover], 'cover');
    p.setKind([blurb], 'blurb');
    void chapter;
    const remarks = checklist(p, book, template());
    expect(remarks.map((r) => r.kind)).toEqual(['unplaced']);
    expect(remarks[0].elements).toEqual([cover, blurb]);
    expect(remarks[0].text).toContain('2');
    const withCover = template({
      outputs: [
        { id: 'document', targets: ['pdf'] },
        { id: 'cover', name: 'Cover', targets: ['pdf'], places: ['cover'] },
      ],
    });
    expect(checklist(p, book, withCover)).toEqual([]);
    expect(checklist(p, book, null)).toEqual([]);
  });
});
