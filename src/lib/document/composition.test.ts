import { describe, expect, it } from 'vitest';
import type { GeneratedPart, Template } from '$lib/api/templates';
import {
  composed,
  compositionPaths,
  hasPart,
  withCompositionPath,
  withoutCompositionPath,
} from './composition';
import articleFile from '../../../resources/templates/article.json';
import plainFile from '../../../resources/templates/plain.json';

const article = () => JSON.parse(JSON.stringify(articleFile)) as Template;
const plain = () => JSON.parse(JSON.stringify(plainFile)) as Template;

/** The items of the contents, a part by its id and a kind as `kind:` and its id. */
const order = (template: Template) =>
  template.contents.map((item) => ('part' in item ? item.part : `kind:${item.kind}`));

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
