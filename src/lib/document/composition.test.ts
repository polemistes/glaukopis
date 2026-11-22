import { describe, expect, it } from 'vitest';
import type { GeneratedPart, Template } from '$lib/api/templates';
import {
  composed,
  compositionPaths,
  suggestedParts,
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

describe('the parts a document type suggests', () => {
  it('are what its contents list, in their order, what Glaukopis makes by its kind, and each once', () => {
    // The article: the title page, the abstract, the keywords, the text, the appendices,
    // the acknowledgements, the notes, the bibliography. The text and the notes are of no kind.
    expect(suggestedParts(article())).toEqual([
      'title-page',
      'abstract',
      'keywords',
      'appendix',
      'acknowledgements',
      'bibliography',
    ]);
    expect(suggestedParts(plain())).toEqual(['title-page', 'bibliography']);
  });

  it('then the kinds it names without listing them', () => {
    const book: Template = {
      ...article(),
      contents: [
        { part: 'title-page' },
        { kind: 'preface' },
        { part: 'body' },
        { kind: 'preface' },
      ],
      kinds: ['preface', 'dedication', 'blurb', 'dedication'],
    };
    expect(suggestedParts(book)).toEqual(['title-page', 'preface', 'dedication', 'blurb']);
  });
});

describe('what a document sets otherwise than its template', () => {
  it('leaves the contents of the type as they are: a part is an element, and turned on by none', () => {
    const template = article();
    const used = composed(template, {
      parts: { contents: true, 'title-page': false },
      requirements: { words: 9000 },
    });
    expect(used.contents).toEqual(article().contents);
    expect(used.requirements.words).toBe(9000);
    expect(composed(template, undefined)).toEqual(article());
    expect(template).toEqual(article());
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
    p.setDocument(book, { template: 'my-article', composition: { requirements: { keywords: 5 } } });
    p.setDocument(chapter, { composition: { requirements: { words: 5000 } } });
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
      expect(used.requirements.keywords).toBe(5);
      expect(used.requirements.words).toBe(5000);
      const forBook = await templateUsed(p, book);
      expect(forBook.requirements.keywords).toBe(5);
      expect(forBook.requirements.words).toBeNull();
      // The project's copy is not touched.
      expect(p.templateCopy('my-article')!.requirements.keywords).toBeNull();
    } finally {
      documents.loaded = loaded;
    }
  });

  it('is had at once where it has been read, the same object while nothing changes', () => {
    const { p, book, chapter } = aBook();
    const used = templateUsedCached(p, chapter)!;
    expect(used.requirements.words).toBe(5000);
    expect(templateUsedCached(p, chapter)).toBe(used);
    // With other changes in place of the element's: here, what it has from the book.
    const fromAbove = templateUsedCached(p, chapter, p.compositionOf(book).changes)!;
    expect(fromAbove.requirements.words).toBeNull();
    expect(fromAbove.requirements.keywords).toBe(5);
    // A change is laid over as soon as it is made.
    p.setDocument(chapter, { composition: { requirements: { words: 7000 } } });
    const now = templateUsedCached(p, chapter)!;
    expect(now).not.toBe(used);
    expect(now.requirements.words).toBe(7000);
    // Nothing where the template is not to be had.
    p.setDocument(book, { template: 'no-such-template' });
    expect(templateUsedCached(p, chapter)).toBeUndefined();
  });
});
