import { describe, expect, it, vi } from 'vitest';

// The button is mounted and pressed, so with the browser's Svelte.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);

const { flushSync, mount, unmount } = await import('svelte');
const { default: SideBySideButton } = await import('./SideBySideButton.svelte');

function setUp(join: boolean) {
  const target = document.createElement('div');
  document.body.append(target);
  const opened: HTMLElement[] = [];
  const button = mount(SideBySideButton, {
    target,
    props: { join, onopen: (at: HTMLElement) => opened.push(at) },
  });
  flushSync();
  const done = () => {
    unmount(button);
    target.remove();
  };
  return { target, opened, done };
}

describe('the button of Split view', () => {
  it('is one icon button with no word, opening its menu at itself', () => {
    const { target, opened, done } = setUp(false);
    const buttons = target.querySelectorAll<HTMLButtonElement>('button[data-side-by-side]');
    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent?.trim()).toBe('');
    expect(buttons[0].getAttribute('aria-haspopup')).toBe('menu');
    expect(buttons[0].classList.contains('round')).toBe(false);
    buttons[0].click();
    expect(opened).toEqual([buttons[0]]);
    done();
  });

  it('is round on the join of two cells, and never lit', () => {
    const { target, opened, done } = setUp(true);
    const button = target.querySelector<HTMLButtonElement>('button[data-side-by-side]')!;
    expect(button.classList.contains('round')).toBe(true);
    expect(button.classList.contains('on') || button.classList.contains('active')).toBe(false);
    expect(button.hasAttribute('aria-pressed')).toBe(false);
    button.click();
    expect(opened).toEqual([button]);
    done();
  });
});
