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
const { GENERATED_PARTS } = await import('$lib/document/parts-order');
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
    part: (id: string) => find<HTMLInputElement>(`[data-part-switch="${id}"]`)!,
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

describe('what the document contains, in Look', () => {
  it('shows the parts as the template has them, and a part turned on as the element’s own change', () => {
    const { p, chapter } = aBook();
    const view = shown(p, chapter);
    const switches = [...view.target.querySelectorAll('[data-part-switch]')];
    expect(switches.map((s) => s.getAttribute('data-part-switch'))).toEqual([...GENERATED_PARTS]);
    expect(view.part('title-page').checked).toBe(true);
    expect(view.part('contents').checked).toBe(false);
    // The text, the notes and the bibliography are always made: shown on, and not turned.
    for (const always of ['body', 'notes', 'bibliography']) {
      expect(view.part(always).checked).toBe(true);
      expect(view.part(always).disabled).toBe(true);
    }
    expect(view.part('contents').disabled).toBe(false);
    expect(view.froms()).toEqual([]);

    press(view.part('contents'));
    expect(p.node(chapter)!.document.composition).toEqual({ parts: { contents: true } });
    expect(view.part('contents').checked).toBe(true);
    expect(view.froms()).toEqual(['Changed here · take My article’s again']);

    // Turned off again, nothing is left of it; and the turning was one step of undo.
    press(view.part('contents'));
    expect(p.yNodes.get(chapter)!.has('document')).toBe(false);
    expect(view.froms()).toEqual([]);
    p.undo();
    flushSync();
    expect(view.part('contents').checked).toBe(true);
    p.undo();
    flushSync();
    expect(view.part('contents').checked).toBe(false);
    expect(p.yNodes.get(chapter)!.has('document')).toBe(false);
  });

  it('tells a change made over the element, lets it say otherwise, and takes each change away again', () => {
    const { p, book, chapter } = aBook();
    p.setDocument(book, { composition: { parts: { 'title-page': false } } });
    const view = shown(p, chapter);
    expect(view.part('title-page').checked).toBe(false);
    expect(view.froms()).toEqual(['Changed in “Book” · take My article’s again']);

    // The chapter turns it on for itself.
    press(view.part('title-page'));
    expect(p.node(chapter)!.document.composition).toEqual({ parts: { 'title-page': true } });
    expect(view.part('title-page').checked).toBe(true);
    expect(view.froms()).toEqual(['Changed here · take My article’s again']);

    // Its own taken away, the book's holds again; the book's taken away, the template's.
    press(view.find('[data-from] .again'));
    expect(p.node(chapter)!.document.composition).toBeUndefined();
    expect(view.part('title-page').checked).toBe(false);
    expect(view.froms()).toEqual(['Changed in “Book” · take My article’s again']);
    press(view.find('[data-from] .again'));
    expect(p.node(book)!.document.composition).toBeUndefined();
    expect(view.part('title-page').checked).toBe(true);
    expect(view.froms()).toEqual([]);
  });

  it('lists the kinds the template gives a place to, shows the elements that fill them, and makes one', () => {
    const { p, book } = aBook();
    const view = shown(p, book);
    // As the article's contents have them, then what it puts in hand besides.
    const places = [...view.target.querySelectorAll('.place')].map((e) =>
      e.getAttribute('data-kind'),
    );
    expect(places).toEqual(['abstract', 'appendix', 'acknowledgements']);
    const abstract = () => view.find('.place[data-kind="abstract"]')!;
    expect(abstract().querySelector('.where')?.textContent).toBe('printed at the front');
    expect(abstract().querySelector('.none')?.textContent).toBe('None yet');

    // Made first among the book's elements, as the front matter stands, named as its kind.
    press(abstract().querySelector<HTMLButtonElement>('[data-make]'));
    const made = p.tree().children.get(book)![0];
    expect(p.node(made)!.kind).toBe('abstract');
    expect(p.node(made)!.title).toBe('Abstract');
    expect(abstract().querySelector('.none')).toBeNull();
    press(abstract().querySelector<HTMLButtonElement>(`[data-element="${made}"]`));
    expect(view.ongo).toHaveBeenCalledWith(made);

    // A second of a kind the document has one of: only the first is used.
    press(abstract().querySelector<HTMLButtonElement>('[data-make]'));
    expect(abstract().querySelectorAll('[data-element]')).toHaveLength(2);
    expect(abstract().querySelector('.doubled')?.textContent).toBe('Only the first is used');
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
      'Changed here · take My article’s again',
      'Changed here · take My article’s again',
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

  it('says so where the template gives no kind of element a place', () => {
    const { p, book } = aBook();
    p.keepTemplate({ ...p.templateCopy('my-article')!, contents: [{ part: 'body' }], kinds: [] });
    const view = shown(p, book);
    expect(view.find('.place')).toBeNull();
    expect(view.target.textContent).toContain(
      '“My article” gives no kind of element a place of its own.',
    );
  });
});
