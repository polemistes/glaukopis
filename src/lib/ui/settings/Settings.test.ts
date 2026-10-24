import { describe, expect, it, vi } from 'vitest';

// Mounted, so with the browser's Svelte, as the other tests of components.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../../node_modules/svelte/src/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
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

  it('shows a length in centimetres, whatever its unit, and writes it in them', () => {
    const host = document.createElement('div');
    const target = { margin: '0.5in', indent: '' };
    const form = mount(Settings, {
      target: host,
      props: {
        target,
        rows: [
          { kind: 'length', label: 'Margin', at: 'margin' },
          { kind: 'length', label: 'Indent', at: 'indent', blank: '1.27' },
        ] as never,
      },
    });
    const [margin, indent] = Array.from(host.querySelectorAll('input'));
    expect(margin.value).toBe('1.27');
    expect(margin.nextElementSibling?.textContent).toBe('cm');
    const type = (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      flushSync();
    };
    type(margin, '2.5');
    expect(target.margin).toBe('2.5cm');
    // Emptied, a length that must be said keeps what it was.
    type(margin, '');
    expect(target.margin).toBe('2.5cm');
    // One that may be unsaid shows the base, and is said by typing and unsaid by emptying.
    expect(indent.value).toBe('');
    expect(indent.placeholder).toBe('1.27');
    type(indent, '1');
    expect(target.indent).toBe('1cm');
    type(indent, '');
    expect(target.indent).toBe('');
    unmount(form);
  });
});
