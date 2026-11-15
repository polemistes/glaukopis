import { afterEach, describe, expect, it, vi } from 'vitest';

// Mounted, so with the browser's Svelte.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
const { default: ZoomControls } = await import('./ZoomControls.svelte');
type View = import('./pan-zoom.svelte').PanZoom;

let done = () => {};
afterEach(() => {
  done();
  done = () => {};
});

function shown(props: Record<string, unknown>) {
  const target = document.body.appendChild(document.createElement('div'));
  const fits: number[] = [];
  const view = { view: { x: 0, y: 0, k: 1.5 }, zoomBy() {}, zoomTo() {} } as unknown as View;
  const c = mount(ZoomControls, { target, props: { view, onfit: () => fits.push(1), ...props } });
  flushSync();
  done = () => {
    unmount(c);
    target.remove();
  };
  const buttons = Array.from(target.querySelectorAll('button'));
  return { buttons, fits };
}

describe('the buttons of zoom', () => {
  it('show the scale, and show the whole map where the view gives no other words for it', () => {
    const { buttons, fits } = shown({});
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Zoom out',
      'Actual size',
      'Zoom in',
      'Show the whole map',
    ]);
    expect(buttons[1].textContent?.trim()).toBe('150%');
    buttons[3].click();
    expect(fits).toEqual([1]);
  });

  it('call showing all what the view calls it', () => {
    const { buttons } = shown({ fitLabel: 'Show all' });
    expect(buttons[3].getAttribute('aria-label')).toBe('Show all');
  });
});
