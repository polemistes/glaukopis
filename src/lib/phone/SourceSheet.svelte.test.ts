import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Summary } from '$lib/api/library';

// The sheet is mounted and filled in, so with the browser's Svelte: the
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
const { Notebook } = await import('$lib/notebook/model/notebook.svelte');
const { library, fold } = await import('$lib/state/library.svelte');
const { default: SourceSheet } = await import('./SourceSheet.svelte');

let done = () => {};
afterEach(() => {
  done();
  done = () => {};
  library.entries = [];
});

/** A reference of the library, as its list sums it up. */
function summary(id: string, authors: string, year: string, title: string): Summary {
  return {
    id,
    key: id,
    type: 'book',
    authors,
    authorsSort: authors,
    translators: '',
    year,
    yearNumber: Number(year),
    title,
    container: '',
    publisher: '',
    attachments: 0,
    hasNote: false,
    added: '',
    modified: '',
    search: fold(`${authors} ${year} ${title}`),
  };
}

/** A note holding words taken in with no source, and the sheet of that no source. */
function setUp() {
  const notebook = new Notebook();
  const note = notebook.addNote();
  const passage = notebook.addPassage(null, 'Found words');
  notebook.addText(note, 'Found words', passage);
  const target = document.createElement('div');
  document.body.append(target);
  const closed = { count: 0 };
  const sheet = mount(SourceSheet, {
    target,
    props: { notebook, note, source: null, onclose: () => closed.count++ },
  });
  flushSync();
  done = () => {
    unmount(sheet);
    target.remove();
  };
  const find = <T extends HTMLElement = HTMLElement>(selector: string) =>
    target.querySelector<T>(selector);
  const typeIn = (selector: string, value: string) => {
    const input = find<HTMLInputElement>(selector)!;
    expect(input, selector).toBeTruthy();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  };
  const press = (selector: string) => {
    const button = find<HTMLButtonElement>(selector)!;
    expect(button, selector).toBeTruthy();
    button.click();
    flushSync();
  };
  const sources = () => notebook.note(note)!.sources;
  return { notebook, note, passage, target, closed, find, typeIn, press, sources };
}

describe('the sheet of a source on the phone', () => {
  it('gives a page to what had no source, and closes', () => {
    const { notebook, passage, closed, find, typeIn, press, sources } = setUp();
    expect(sources()).toEqual([null]);
    const apply = find<HTMLButtonElement>('[data-phone-source-apply]')!;
    expect(apply.disabled).toBe(true);
    typeIn('[data-phone-source-url]', 'https://example.org/owls');
    typeIn('[data-phone-source-title]', 'On owls');
    expect(apply.disabled).toBe(false);
    press('[data-phone-source-apply]');
    const id = notebook.passages.get(passage)!.source!;
    expect(notebook.sources.get(id)).toMatchObject({
      sort: 'web',
      url: 'https://example.org/owls',
      title: 'On owls',
    });
    expect(sources()).toEqual([id]);
    expect(closed.count).toBe(1);
  });

  it('chooses a reference found by its words, with its place', () => {
    library.entries = [
      summary('homer', 'Homer', '1990', 'The Odyssey'),
      summary('hesiod', 'Hesiod', '2006', 'Theogony'),
      summary('plato', 'Plato', '1997', 'Complete Works'),
    ];
    const { notebook, passage, target, find, typeIn, press } = setUp();
    const reference = [...target.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find(
      (b) => b.textContent!.trim() === 'Reference',
    )!;
    reference.click();
    flushSync();
    const rows = () =>
      [...target.querySelectorAll<HTMLElement>('[data-phone-reference]')].map(
        (r) => r.dataset.phoneReference,
      );
    expect(rows()).toEqual(['hesiod', 'homer', 'plato']);
    expect(find('[data-phone-reference="homer"]')!.textContent).toContain('Homer, 1990');
    expect(find('[data-phone-reference="homer"]')!.textContent).toContain('The Odyssey');
    typeIn('[data-phone-source-find]', 'odys');
    expect(rows()).toEqual(['homer']);
    press('[data-phone-reference="homer"]');
    expect(find('[data-phone-reference="homer"]')!.getAttribute('aria-pressed')).toBe('true');
    const label = find<HTMLSelectElement>('[data-phone-source-label]')!;
    label.value = 'line';
    label.dispatchEvent(new Event('change', { bubbles: true }));
    typeIn('[data-phone-source-locator]', '45–67');
    press('[data-phone-source-apply]');
    const id = notebook.passages.get(passage)!.source!;
    expect(notebook.sources.get(id)).toMatchObject({
      sort: 'reference',
      reference: 'homer',
      locator: '45–67',
      label: 'line',
    });
  });

  it('takes the chip away by My own words, and closes with nothing left to say', () => {
    const { closed, find, press, sources } = setUp();
    expect(find('[data-phone-passage]')!.textContent).toContain('Found words');
    press('[data-phone-own-words]');
    expect(sources()).toEqual([]);
    expect(closed.count).toBe(1);
  });
});
