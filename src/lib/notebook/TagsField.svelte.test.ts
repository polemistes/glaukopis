import { afterEach, describe, expect, it, vi } from 'vitest';

// The field is mounted and typed in, so with the browser's Svelte: the tests
// otherwise run with the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
const { default: TagsField } = await import('./TagsField.svelte');

let done = () => {};

afterEach(() => {
  done();
  done = () => {};
});

const ALL = ['Athena', 'athletes', 'Homer', 'owls'].map((tag) => ({ tag, count: 1 }));

function setUp(given: string[] = []) {
  const target = document.createElement('div');
  document.body.append(target);
  const note = $state({ tags: [...given] });
  const field = mount(TagsField, {
    target,
    props: {
      get tags() {
        return note.tags;
      },
      all: ALL,
      onadd: (tag: string) => {
        if (!note.tags.includes(tag.trim())) note.tags = [...note.tags, tag.trim()];
      },
      onremove: (tag: string) => {
        note.tags = note.tags.filter((t) => t !== tag);
      },
    },
  });
  flushSync();
  done = () => {
    unmount(field);
    target.remove();
  };
  const input = target.querySelector<HTMLInputElement>('[data-tag-field]')!;
  input.focus();
  input.dispatchEvent(new FocusEvent('focus'));
  flushSync();
  const type = (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  };
  const key = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    flushSync();
    return event.defaultPrevented;
  };
  /** The tags offered, the one marked in capitals. */
  const offered = () =>
    Array.from(document.querySelectorAll<HTMLElement>('[data-offered]')).map((o) =>
      o.classList.contains('marked') ? o.dataset.offered!.toUpperCase() : o.dataset.offered!,
    );
  const chips = () =>
    Array.from(target.querySelectorAll<HTMLElement>('[data-tag]')).map((c) => c.dataset.tag);
  return { target, note, input, type, key, offered, chips };
}

describe('the field of the tags of a note', () => {
  it('shows the tags the note has, each with an × that takes it away', () => {
    const { chips, target, note } = setUp(['owls', 'Homer']);
    expect(chips()).toEqual(['owls', 'Homer']);
    target.querySelector<HTMLButtonElement>('[data-tag="owls"] button')!.click();
    flushSync();
    expect(note.tags).toEqual(['Homer']);
  });

  it('offers the tags that begin with what is typed or hold it, marks one by the arrows, and takes it by Enter', () => {
    const { type, key, offered, note, input } = setUp(['Homer']);
    type('ath');
    expect(offered()).toEqual(['Athena', 'athletes']);
    key('ArrowDown');
    key('ArrowDown');
    expect(offered()).toEqual(['Athena', 'ATHLETES']);
    key('ArrowUp');
    expect(offered()).toEqual(['ATHENA', 'athletes']);
    expect(key('Enter')).toBe(true);
    expect(note.tags).toEqual(['Homer', 'Athena']);
    expect(input.value).toBe('');
    expect(offered()).toEqual([]);
  });

  it('adds what was typed as a new tag by Enter or a comma where none is marked', () => {
    const { type, key, note } = setUp();
    type('ath');
    key('Enter');
    expect(note.tags).toEqual(['ath']);
    type('Pallas');
    key(',');
    expect(note.tags).toEqual(['ath', 'Pallas']);
  });

  it('adds what was typed by a comma that comes in the words, as from a phone, which sends no key for it', () => {
    const { type, note, input } = setUp(['owls']);
    type('Pallas,');
    expect(note.tags).toEqual(['owls', 'Pallas']);
    expect(input.value).toBe('');
    type('Homer, Hes');
    expect(note.tags).toEqual(['owls', 'Pallas', 'Homer']);
    expect(input.value).toBe(' Hes');
    type(',');
    expect(note.tags).toEqual(['owls', 'Pallas', 'Homer']);
    expect(input.value).toBe('');
  });

  it('takes the last tag away by Backspace in the empty field, and closes the list by Escape', () => {
    const { type, key, note, offered } = setUp(['owls', 'Homer']);
    key('Backspace');
    expect(note.tags).toEqual(['owls']);
    type('h');
    expect(offered()).toEqual(['Homer', 'Athena', 'athletes']);
    expect(key('Escape')).toBe(true);
    expect(offered()).toEqual([]);
    expect(key('Escape')).toBe(false);
    type('ho');
    expect(offered()).toEqual(['Homer']);
  });

  it('takes a tag offered by a press, the field keeping the cursor', () => {
    const { type, note, input } = setUp();
    type('ow');
    const option = document.querySelector<HTMLElement>('[data-offered="owls"]')!;
    const press = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
    option.dispatchEvent(press);
    flushSync();
    expect(press.defaultPrevented).toBe(true);
    expect(note.tags).toEqual(['owls']);
    expect(input.value).toBe('');
  });
});
