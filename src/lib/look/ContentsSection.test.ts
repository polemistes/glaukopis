import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Template } from '$lib/api/templates';
import articleFile from '../../../resources/templates/article.json';

// The section is mounted and pressed, so with the browser's Svelte: the
// tests otherwise run with the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);
vi.mock(
  'svelte/reactivity',
  // @ts-expect-error: the same.
  () => import('../../../node_modules/svelte/src/reactivity/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
const { documents } = await import('$lib/preview/documents.svelte');
const { Project } = await import('$lib/project/model/project.svelte');
const { PROJECT } = await import('$lib/project/model/types');
const { default: ContentsSection } = await import('./ContentsSection.svelte');

type P = InstanceType<typeof Project>;

/** A book that is a template of the writer's own, made from the journal article, which the project carries; and a chapter of it. */
function aBook() {
  const p = new Project(null);
  p.begin('Wrath');
  const template: Template = {
    ...(JSON.parse(JSON.stringify(articleFile)) as Template),
    id: 'my-article',
    name: 'My article',
    group: 'own',
    basedOn: 'article',
  };
  template.requirements = {
    words: 8000,
    abstractWords: 250,
    keywords: null,
    anonymous: false,
    note: 'Notes included',
  };
  p.keepTemplate(template);
  const book = p.addChild(PROJECT, { title: 'Book' })!;
  const chapter = p.addChild(book, { title: 'Chapter' })!;
  p.setDocument(book, { template: 'my-article' });
  return { p, book, chapter };
}

let done: (() => void) | null = null;
let loaded = false;

beforeEach(() => {
  // Nothing is to be loaded from the application in a test.
  loaded = documents.loaded;
  documents.loaded = true;
});

afterEach(() => {
  done?.();
  done = null;
  documents.loaded = loaded;
});

/** The section for an element, mounted inside a form of settings as Look has it. */
function shown(p: P, at: string, ongo = vi.fn()) {
  const target = document.createElement('div');
  target.className = 'settings';
  document.body.append(target);
  const section = mount(ContentsSection, { target, props: { project: p, at, ongo } });
  flushSync();
  done = () => {
    unmount(section);
    target.remove();
  };
  const find = <T extends Element = HTMLElement>(selector: string) =>
    target.querySelector<T>(selector);
  return {
    target,
    ongo,
    find,
    field: (key: string) => find<HTMLInputElement>(`[data-requirement="${key}"]`)!,
    /** The lines that say where a value comes from, in order. */
    froms: () => [...target.querySelectorAll('[data-from]')].map((l) => l.textContent?.trim()),
  };
}

function press(element: HTMLElement | null) {
  element!.click();
  flushSync();
}

function type(field: HTMLInputElement, value: string) {
  field.value = value;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

describe('the parts of a document, in Look', () => {
  /** The kinds listed, in their order. */
  const kinds = (target: HTMLElement) =>
    [...target.querySelectorAll('.place')].map((e) => e.getAttribute('data-kind'));

  it('lists what the type suggests in its usual order, what Glaukopis makes among it, and turns nothing on', () => {
    const { p, book } = aBook();
    const view = shown(p, book);
    // The article: the title page, the abstract, the keywords, the appendices, the acknowledgements,
    // the bibliography. The text and the notes are of no kind.
    expect(kinds(view.target)).toEqual([
      'title-page',
      'abstract',
      'keywords',
      'appendix',
      'acknowledgements',
      'bibliography',
    ]);
    expect(view.target.querySelector('input[type="checkbox"][data-part-switch]')).toBeNull();
    expect(view.target.querySelector('[data-element]')).toBeNull();
    // What a document once turned on and off is read by nothing.
    p.setDocument(book, { composition: { parts: { contents: true, 'title-page': false } } });
    flushSync();
    expect(kinds(view.target)).toContain('title-page');
    expect(kinds(view.target)).not.toContain('contents');
  });

  it('adds an element of a kind last under the document, shows it, and goes to it', () => {
    const { p, book, chapter } = aBook();
    const view = shown(p, book);
    const place = (kind: string) => view.find(`.place[data-kind="${kind}"]`)!;
    press(place('abstract').querySelector<HTMLButtonElement>('[data-make]'));
    // Last: it is printed where it stands, and the writer moves it.
    const [first, made] = p.tree().children.get(book)!;
    expect(first).toBe(chapter);
    expect(p.node(made)!.kind).toBe('abstract');
    expect(p.node(made)!.title).toBe('Abstract');
    press(place('abstract').querySelector<HTMLButtonElement>(`[data-element="${made}"]`));
    expect(view.ongo).toHaveBeenCalledWith(made);
    // Of a kind a document has one of, no second is offered.
    expect(place('abstract').querySelector('[data-make]')).toBeNull();
    // Of one it may have many, another is.
    press(place('appendix').querySelector<HTMLButtonElement>('[data-make]'));
    press(place('appendix').querySelector<HTMLButtonElement>('[data-make]'));
    expect(place('appendix').querySelectorAll('[data-element]')).toHaveLength(2);
    // A second of a kind it has one of, made otherwise: only the first is used.
    const second = p.addChild(book, { title: 'In short' })!;
    p.setKind([second], 'abstract');
    flushSync();
    expect(place('abstract').querySelector('.doubled')?.textContent).toBe('Only the first is used');
  });

  it('names what is printed over a list as the document would have, in its language', () => {
    const { p, book } = aBook();
    p.setDocument(book, { language: 'nb' });
    const view = shown(p, book);
    press(view.find('.place[data-kind="title-page"] [data-make]'));
    const title = p.tree().children.get(book)!.at(-1)!;
    expect(p.node(title)!.kind).toBe('title-page');
    expect(p.node(title)!.title).toBe('Title page');
    // The type suggests no table of contents: it is under Another part, and listed once it is there.
    expect(kinds(view.target)).not.toContain('contents');
    const contents = p.addChild(book, { title: 'Innhold' })!;
    p.setKind([contents], 'contents');
    flushSync();
    expect(kinds(view.target).at(-1)).toBe('contents');
    expect(view.find('[data-make-another]')).not.toBeNull();
  });

  it('sets what is required as the element’s own, and takes it away where it comes back to the template’s', () => {
    const { p, book } = aBook();
    const view = shown(p, book);
    expect(view.field('words').value).toBe('8000');
    expect(view.field('abstractWords').value).toBe('250');
    expect(view.field('keywords').value).toBe('');
    expect(view.field('anonymous').checked).toBe(false);
    expect(view.find('.note')?.textContent?.trim()).toBe('What the limits count: Notes included');

    type(view.field('words'), '10000');
    type(view.field('keywords'), '6');
    expect(p.node(book)!.document.composition).toEqual({
      requirements: { words: 10000, keywords: 6 },
    });
    expect(view.froms()).toEqual([
      'Changed in this document · Reset',
      'Changed in this document · Reset',
    ]);
    // An empty field is no limit, otherwise than the template.
    type(view.field('words'), '');
    expect(p.node(book)!.document.composition?.requirements).toEqual({ words: null, keywords: 6 });
    expect(view.field('words').value).toBe('');
    // Back to what the template asks, the change goes.
    type(view.field('words'), '8000');
    expect(p.node(book)!.document.composition).toEqual({ requirements: { keywords: 6 } });
    // What cannot be a limit is not written, and the field shows what is.
    type(view.field('keywords'), '-4');
    expect(p.node(book)!.document.composition).toEqual({ requirements: { keywords: 6 } });
    expect(view.field('keywords').value).toBe('6');
    // A limit is a whole number, and shown as it is written.
    type(view.field('abstractWords'), '300.4');
    expect(p.node(book)!.document.composition?.requirements?.abstractWords).toBe(300);
    expect(view.field('abstractWords').value).toBe('300');
    type(view.field('abstractWords'), '250');
    expect(p.node(book)!.document.composition).toEqual({ requirements: { keywords: 6 } });

    press(view.field('anonymous'));
    expect(p.node(book)!.document.composition?.requirements?.anonymous).toBe(true);
    press(view.field('anonymous'));
    type(view.field('keywords'), '0');
    expect(p.yNodes.get(book)!.get('document')).toEqual({ template: 'my-article' });
  });

  it('lists nothing where the type suggests nothing and the document has no part', () => {
    const { p, book } = aBook();
    p.keepTemplate({ ...p.templateCopy('my-article')!, contents: [{ part: 'body' }], kinds: [] });
    const view = shown(p, book);
    expect(view.find('.place')).toBeNull();
    expect(view.find('[data-make-another]')).not.toBeNull();
  });
});
