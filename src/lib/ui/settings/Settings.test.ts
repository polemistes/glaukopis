import { describe, expect, it, vi } from 'vitest';

// Mounted, so with the browser's Svelte, as the other tests of components.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../../node_modules/svelte/src/index-client.js'),
);

const { mount, unmount } = await import('svelte');
const { default: Settings } = await import('./Settings.svelte');

describe('a form of settings', () => {
  it('names a heading within it, so that it can be found and brought into view', () => {
    const host = document.createElement('div');
    const form = mount(Settings, {
      target: host,
      props: {
        target: {},
        rows: [{ subheading: 'Page numbers', at: 'page-numbers' }, { subheading: 'Margins' }],
      },
    });
    const headings = Array.from(host.querySelectorAll('h4'));
    expect(headings.map((h) => [h.textContent, h.dataset.at ?? null])).toEqual([
      ['Page numbers', 'page-numbers'],
      ['Margins', null],
    ]);
    unmount(form);
  });
});
