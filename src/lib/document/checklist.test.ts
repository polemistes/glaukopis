import { describe, expect, it, vi } from 'vitest';
import type { DocumentFormat } from '$lib/api/documents';
import type { Template } from '$lib/api/templates';
import { Project } from '$lib/project/model/project.svelte';
import type { Block } from '$lib/project/model/text';
import { PROJECT } from '$lib/project/model/types';
import { checklist, lettersALine, quotationsIn } from './checklist';
import manuscriptFile from '../../../resources/formats/manuscript.json';

/** The general manuscript layout, as the document uses it, with what is said of quotations. */
function layout(
  quote: { fromWords?: number | null; fromLines?: number | null } = {},
): DocumentFormat {
  const f = JSON.parse(JSON.stringify(manuscriptFile)) as DocumentFormat;
  f.quote = { ...f.quote, fromWords: null, fromLines: null, ...quote };
  return f;
}

/** A paragraph of a kind, of these words. */
const paragraph = (name: string, text: string): Block => ({
  kind: 'paragraph',
  name,
  indent: 0,
  content: [{ kind: 'text', text, marks: {} }],
});

/** So many words, one after another. */
const words = (count: number) => Array.from({ length: count }, (_, i) => `w${i % 10}`).join(' ');

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

  it('says where the document type asks for an anonymous document and the front page names the authors', () => {
    const p = project();
    const article = p.addChild(PROJECT, { title: 'Article', body: 'One two three.' })!;
    const anonymous = template({
      requirements: { words: null, abstractWords: null, keywords: null, anonymous: true, note: '' },
    });
    const named = layout();
    named.title.anonymous = false;
    const remarks = checklist(p, article, anonymous, named);
    expect(remarks.map((r) => r.kind)).toEqual(['anonymous']);
    expect(remarks[0].text).toContain('Anonymize the front page');
    named.title.anonymous = true;
    expect(checklist(p, article, anonymous, named)).toEqual([]);
    named.title.anonymous = false;
    expect(checklist(p, article, template(), named)).toEqual([]);
  });

  it('finds a quotation in the text as long as the layout sets quotations off from, by its words', () => {
    const p = project();
    const article = p.addChild(PROJECT, { title: 'Article' })!;
    const chapter = p.addChild(article, { title: 'Chapter' })!;
    const blocks: Record<string, Block[]> = {
      [chapter]: [
        paragraph('text', `As he says, “${words(41)}”, and so on.`),
        paragraph('text', `A short one: “${words(39)}”.`),
        // The kind Quotation is set off already, and one based on it too.
        paragraph('quote', `“${words(60)}”`),
        paragraph('epigraph', `“${words(60)}”`),
      ],
    };
    vi.spyOn(p, 'blocksOf').mockImplementation((id) => blocks[id] ?? []);
    const remarks = checklist(p, article, template(), layout({ fromWords: 40 }));
    expect(remarks.map((r) => r.kind)).toEqual(['quotation']);
    expect(remarks[0].elements).toEqual([chapter]);
    expect(remarks[0].text).toContain('“Chapter”');
    expect(remarks[0].text).toContain('41 words');
    expect(remarks[0].text).toContain('from 40 words');
    expect(remarks[0].text).toMatch(/about \d+ lines?/);
    // Nothing is said where the layout says nothing of quotations.
    expect(checklist(p, article, template(), layout())).toEqual([]);
    expect(checklist(p, article, template(), null)).toEqual([]);
  });

  it('estimates the lines of a quotation from the measure and the type of the layout', () => {
    const p = project();
    const article = p.addChild(PROJECT, { title: 'Article' })!;
    // 300 letters between the marks.
    const quoted = `«${'x'.repeat(299)} »`;
    vi.spyOn(p, 'blocksOf').mockImplementation((id) =>
      id === article ? [paragraph('text', `Han sier ${quoted}, og det er alt.`)] : [],
    );
    const wide = layout({ fromLines: 3 });
    wide.page.size = 'a4';
    wide.page.marginLeft = wide.page.marginRight = '2.5cm';
    wide.font.size = 12;
    // An A4 page with margins of 2.5cm holds about 74 letters a line at 12 pt: some four lines.
    expect(lettersALine(wide)).toBeCloseTo((595 - 2 * 70.87) / 6, 0);
    expect(checklist(p, article, template(), wide).map((r) => r.kind)).toEqual(['quotation']);
    expect(checklist(p, article, template(), wide)[0].text).toContain('from 3 lines');
    // A page wide enough for 300 letters in under three lines says nothing.
    const roomy = layout({ fromLines: 3 });
    roomy.page.size = 'custom';
    roomy.page.width = '60cm';
    roomy.page.marginLeft = roomy.page.marginRight = '1cm';
    roomy.font.size = 10;
    expect(checklist(p, article, template(), roomy)).toEqual([]);
    // Two columns halve the measure.
    const columns = layout();
    columns.page.columns = 2;
    expect(lettersALine(columns)).toBeLessThan(lettersALine(layout()) / 2);
  });

  it('reads the quotation marks of each language, and not the space between two quotations', () => {
    expect(quotationsIn('He said “one two” and “three”.')).toEqual(['one two', 'three']);
    expect(quotationsIn('Er sagte „eins zwei“.')).toEqual(['eins zwei']);
    expect(quotationsIn('Han sa «en to» og «tre».')).toEqual(['en to', 'tre']);
    expect(quotationsIn('Han sagde »en to« og »tre«.')).toEqual(['en to', 'tre']);
    expect(quotationsIn('Han sa ”en två” och ”tre”.')).toEqual(['en två', 'tre']);
    expect(quotationsIn('He said "one two".')).toEqual(['one two']);
    expect(quotationsIn('No quotation at all.')).toEqual([]);
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
