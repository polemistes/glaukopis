import { afterEach, describe, expect, it, vi } from 'vitest';

// The row is mounted and the place changed under it, so with the browser's
// Svelte: the tests otherwise run with the server's, in which nothing is followed.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
const { router } = await import('$lib/state/router.svelte');
const { listPane } = await import('$lib/home/list.svelte');
const { default: TopRow } = await import('./TopRow.svelte');

let done = () => {};

function setUp(props: { start?: boolean } = {}) {
  const target = document.createElement('div');
  document.body.append(target);
  const row = mount(TopRow, { target, props });
  flushSync();
  done = () => {
    unmount(row);
    target.remove();
  };
  const places = () =>
    Array.from(target.querySelectorAll<HTMLElement>('.place')).map((p) => ({
      place: p.dataset.place,
      lit: p.classList.contains('current'),
      disabled: p instanceof HTMLButtonElement && p.disabled,
    }));
  return { target, places };
}

afterEach(() => {
  done();
  done = () => {};
  listPane.shown = true;
});

describe('the row at the top of the window', () => {
  it('has the six places of the window in their order: the house, the library and the list at its start, the rest at its end', () => {
    router.replace({ view: 'library' });
    const { target, places } = setUp();
    expect(places().map((p) => p.place)).toEqual([
      'projects',
      'library',
      'list',
      'search',
      'keys',
      'settings',
    ]);
    expect(target.querySelector('[data-row-start] [data-projects-button]')).not.toBeNull();
    expect(target.querySelectorAll('[data-row-end] .place')).toHaveLength(3);
  });

  it('shows the list button disabled where there is no list, and lights the place one is at', () => {
    router.replace({ view: 'library' });
    const { places } = setUp();
    const shown = places();
    expect(shown.find((p) => p.place === 'list')?.disabled).toBe(true);
    expect(shown.filter((p) => p.lit).map((p) => p.place)).toEqual(['library']);
  });

  it('lights the list button beside the start screen while the list is shown, and not once it is hidden', () => {
    router.replace({ view: 'home' });
    const { places } = setUp();
    let shown = places();
    expect(shown.find((p) => p.place === 'list')?.disabled).toBe(false);
    expect(shown.filter((p) => p.lit).map((p) => p.place)).toEqual(['projects', 'list']);
    listPane.shown = false;
    flushSync();
    shown = places();
    expect(shown.filter((p) => p.lit).map((p) => p.place)).toEqual(['projects']);
  });

  it('leaves the start of the row out where the list beside has it in its head', () => {
    router.replace({ view: 'home' });
    const { target, places } = setUp({ start: false });
    expect(target.querySelector('[data-row-start]')).toBeNull();
    expect(places().map((p) => p.place)).toEqual(['search', 'keys', 'settings']);
  });
});
