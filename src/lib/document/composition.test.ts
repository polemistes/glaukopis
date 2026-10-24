import { describe, expect, it } from 'vitest';
import type { GeneratedPart, Template } from '$lib/api/templates';
import {
  composed,
  compositionPaths,
  hasPart,
  printOrder,
  type Printed,
  withCompositionPath,
  withoutCompositionPath,
} from './composition';
import { documents, templateUsed, templateUsedCached } from '$lib/preview/documents.svelte';
import { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import articleFile from '../../../resources/templates/article.json';
import plainFile from '../../../resources/templates/plain.json';

const article = () => JSON.parse(JSON.stringify(articleFile)) as Template;
const plain = () => JSON.parse(JSON.stringify(plainFile)) as Template;

/** The items of the contents, a part by its id and a kind as `kind:` and its id. */
const order = (template: Template) =>
  template.contents.map((item) => ('part' in item ? item.part : `kind:${item.kind}`));

/** The things of a print order, a part by its id, with a minus where it is off, and a kind as `kind:` and its id. */
const printed = (list: Printed[]) =>
  list.map((p) => ('part' in p ? `${p.on ? '' : '-'}${p.part}` : `kind:${p.kind}`));

describe('the order a document type prints its parts in', () => {
  const places: Record<string, 'front' | 'back' | 'here' | 'cover' | 'none'> = {
    abstract: 'front',
    preface: 'front',
    dedication: 'front',
    appendix: 'back',
    acknowledgements: 'back',
    blurb: 'cover',
  };
  const placeOf = (kind: string) => places[kind];

  it('is the contents as they stand, each part that is off where it would stand turned on', () => {
    expect(printed(printOrder(article(), placeOf))).toEqual([
      '-half-title',
      'title-page',
      'kind:abstract',
      'keywords',
      '-contents',
      '-list-of-figures',
      '-list-of-tables',
      'body',
      'kind:appendix',
      'kind:acknowledgements',
      'notes',
      'bibliography',
    ]);
  });

  it('keeps the type’s own order of the kinds, acknowledgements in the front among them', () => {
    const book: Template = {
      ...article(),
      contents: [
        { part: 'title-page' },
        { kind: 'preface' },
        { kind: 'acknowledgements' },
        { part: 'contents' },
        { part: 'body' },
        { part: 'bibliography' },
      ],
      kinds: ['preface', 'acknowledgements', 'dedication', 'appendix', 'blurb'],
    };
    expect(printed(printOrder(book, placeOf))).toEqual([
      '-half-title',
      'title-page',
      'kind:preface',
      'kind:acknowledgements',
      '-keywords',
      'contents',
      '-list-of-figures',
      '-list-of-tables',
      // A kind of the front that the type does not place comes before the text, as the core prints it.
      'kind:dedication',
      'body',
      'notes',
      'bibliography',
      // One of the back after everything; the cover's last.
      'kind:appendix',
      'kind:blurb',
    ]);
  });

  it('has the text where the type does not list it, and each thing once', () => {
    const bare: Template = {
      ...article(),
      contents: [
        { part: 'title-page' },
        { kind: 'abstract' },
        { kind: 'abstract' },
        { part: 'title-page' },
      ],
      kinds: ['abstract', 'abstract'],
    };
    const list = printed(printOrder(bare, placeOf));
    expect(list.filter((p) => p === 'kind:abstract')).toHaveLength(1);
    expect(list.filter((p) => p === 'title-page')).toHaveLength(1);
    expect(list).toContain('body');
    expect(list.indexOf('kind:abstract')).toBeLessThan(list.indexOf('body'));
  });
});

describe('what a document sets otherwise than its template', () => {
  it('puts a part turned on in its place among the parts, passing over the kinds', () => {
    // The article: title page, abstract, keywords, the text, appendices, acknowledgements, notes, bibliography.
    const used = composed(article(), { parts: { contents: true, 'list-of-figures': true } });
    expect(order(used)).toEqual([
      'title-page',
      'kind:abstract',
      'keywords',
      'contents',
      'list-of-figures',
      'body',
      'kind:appendix',
      'kind:acknowledgements',
      'notes',
      'bibliography',
    ]);
    // A half title comes before everything, keywords after the title page.
    expect(order(composed(plain(), { parts: { 'half-title': true, keywords: true } }))).toEqual([
      'half-title',
      'title-page',
      'keywords',
      'body',
      'notes',
      'bibliography',
    ]);
  });

  it('puts a part that comes after every part the template has at the end', () => {
    const template = { ...plain(), contents: [{ part: 'title-page' }, { kind: 'appendix' }] };
    expect(order(composed(template as Template, { parts: { 'list-of-tables': true } }))).toEqual([
      'title-page',
      'kind:appendix',
      'list-of-tables',
    ]);
  });

  it('takes out a part turned off, and never the text, its notes or its bibliography', () => {
    const used = composed(article(), {
      parts: {
        'title-page': false,
        keywords: false,
        body: false,
        notes: false,
        bibliography: false,
      },
    });
    expect(order(used)).toEqual([
      'kind:abstract',
      'body',
      'kind:appendix',
      'kind:acknowledgements',
      'notes',
      'bibliography',
    ]);
  });

  it('leaves a part that is turned on and there already where it stands, and the template untouched', () => {
    const template = article();
    const used = composed(template, { parts: { keywords: true, 'title-page': true } });
    expect(order(used)).toEqual(order(article()));
    expect(composed(template, undefined)).toEqual(article());
    composed(template, { parts: { contents: true }, requirements: { words: 9000 } });
    expect(template).toEqual(article());
  });

  it('says whether the template as used has a part', () => {
    const used = composed(article(), { parts: { contents: true, keywords: false } });
    expect(hasPart(used, 'contents')).toBe(true);
    expect(hasPart(used, 'keywords')).toBe(false);
    expect(hasPart(article(), 'contents')).toBe(false);
  });

  it('sets what is required, null and nought taking a limit away', () => {
    const template = article();
    template.requirements = {
      words: 8000,
      abstractWords: 250,
      keywords: 6,
      anonymous: true,
      note: 'Notes included',
    };
    const used = composed(template, {
      requirements: { words: 10000, abstractWords: null, keywords: 0, anonymous: false },
    });
    expect(used.requirements).toEqual({
      words: 10000,
      abstractWords: null,
      keywords: null,
      anonymous: false,
      note: 'Notes included',
    });
    // Null takes the anonymity away as well; what is not said stays as the template has it.
    expect(composed(template, { requirements: { anonymous: null } }).requirements).toEqual({
      ...template.requirements,
      anonymous: false,
    });
    expect(composed(article(), { requirements: { anonymous: true } }).requirements.anonymous).toBe(
      true,
    );
  });

  it('passes over what is not of its shape, as a file written by hand may hold', () => {
    const odd = {
      parts: { contents: 'yes', 'no-such-part': true, keywords: null },
      requirements: { words: -3, abstractWords: 'many', keywords: Infinity, anonymous: 'no' },
      more: true,
    } as unknown as Parameters<typeof composed>[1];
    expect(composed(article(), odd)).toEqual(article());
    expect(composed(article(), { parts: [] as never, requirements: 7 as never })).toEqual(
      article(),
    );
  });

  it('gives every path that is set, and takes one away with what it leaves empty', () => {
    const changes = {
      parts: { contents: true, 'title-page': false } as Partial<Record<GeneratedPart, boolean>>,
      requirements: { words: null },
    };
    expect(compositionPaths(changes)).toEqual([
      'parts.contents',
      'parts.title-page',
      'requirements.words',
    ]);
    expect(compositionPaths(undefined)).toEqual([]);
    expect(compositionPaths({})).toEqual([]);
    expect(withoutCompositionPath(changes, 'parts.contents')).toEqual({
      parts: { 'title-page': false },
      requirements: { words: null },
    });
    expect(withoutCompositionPath(changes, 'requirements.words')).toEqual({
      parts: { contents: true, 'title-page': false },
    });
    const left = withoutCompositionPath(
      withoutCompositionPath(withoutCompositionPath(changes, 'parts.contents'), 'parts.title-page'),
      'requirements.words',
    );
    expect(left).toEqual({});
    expect(withoutCompositionPath(undefined, 'parts.contents')).toEqual({});
    // The changes given are not touched.
    expect(changes.parts).toEqual({ contents: true, 'title-page': false });
  });

  it('sets a value at a path, with the objects on the way, the changes given untouched', () => {
    const changes = { parts: { contents: true } as Partial<Record<GeneratedPart, boolean>> };
    expect(withCompositionPath(changes, 'requirements.words', 5000)).toEqual({
      parts: { contents: true },
      requirements: { words: 5000 },
    });
    expect(withCompositionPath(changes, 'parts.contents', false)).toEqual({
      parts: { contents: false },
    });
    expect(withCompositionPath(undefined, 'parts.keywords', true)).toEqual({
      parts: { keywords: true },
    });
    expect(changes).toEqual({ parts: { contents: true } });
  });
});

describe('the template a document is made with', () => {
  /** A book that chooses a template of the writer's own, which the project carries, and a chapter of it. */
  function aBook() {
    const p = new Project(null);
    p.begin('Wrath');
    p.keepTemplate({
      ...article(),
      id: 'my-article',
      name: 'My article',
      group: 'own',
      basedOn: 'article',
    });
    const book = p.addChild(PROJECT, { title: 'Book' })!;
    const chapter = p.addChild(book, { title: 'Chapter' })!;
    p.setDocument(book, { template: 'my-article', composition: { parts: { contents: true } } });
    p.setDocument(chapter, {
      composition: { parts: { keywords: false }, requirements: { words: 5000 } },
    });
    return { p, book, chapter };
  }

  it('is the template with the changes of the element and of those over it laid over it', async () => {
    const { p, book, chapter } = aBook();
    // Nothing is to be loaded from the application in a test.
    const loaded = documents.loaded;
    documents.loaded = true;
    try {
      const used = await templateUsed(p, chapter);
      expect(used.id).toBe('my-article');
      expect(hasPart(used, 'contents')).toBe(true);
      expect(hasPart(used, 'keywords')).toBe(false);
      expect(used.requirements.words).toBe(5000);
      const forBook = await templateUsed(p, book);
      expect(hasPart(forBook, 'contents')).toBe(true);
      expect(hasPart(forBook, 'keywords')).toBe(true);
      expect(forBook.requirements.words).toBeNull();
      // The project's copy is not touched.
      expect(hasPart(p.templateCopy('my-article')!, 'contents')).toBe(false);
    } finally {
      documents.loaded = loaded;
    }
  });

  it('is had at once where it has been read, the same object while nothing changes', () => {
    const { p, book, chapter } = aBook();
    const used = templateUsedCached(p, chapter)!;
    expect(order(used)).toEqual([
      'title-page',
      'kind:abstract',
      'contents',
      'body',
      'kind:appendix',
      'kind:acknowledgements',
      'notes',
      'bibliography',
    ]);
    expect(templateUsedCached(p, chapter)).toBe(used);
    // With other changes in place of the element's: here, what it has from the book.
    const fromAbove = templateUsedCached(p, chapter, p.compositionOf(book).changes)!;
    expect(hasPart(fromAbove, 'contents')).toBe(true);
    expect(hasPart(fromAbove, 'keywords')).toBe(true);
    // A change is laid over as soon as it is made.
    p.setDocument(chapter, { composition: { parts: { 'title-page': false } } });
    const now = templateUsedCached(p, chapter)!;
    expect(now).not.toBe(used);
    expect(hasPart(now, 'title-page')).toBe(false);
    expect(hasPart(now, 'keywords')).toBe(true);
    // Nothing where the template is not to be had.
    p.setDocument(book, { template: 'no-such-template' });
    expect(templateUsedCached(p, chapter)).toBeUndefined();
  });
});
