/**
 * A tooltip as an action: `use:tooltip={'Text'}` or
 * `use:tooltip={{ text, shortcut, side }}`.
 *
 * One element is shared by the whole application. It appears after a short
 * delay, and at once when another tooltip was showing a moment ago.
 */

import { place, type Side } from './floating';
import { lower, raise } from './top';

export type TooltipOptions = string | { text: string; shortcut?: string; side?: Side } | null;

let bubble: HTMLDivElement | null = null;
let lastHidden = 0;

function ensureBubble(): HTMLDivElement {
  if (!bubble) {
    bubble = document.createElement('div');
    bubble.className = 'tooltip-bubble';
    bubble.setAttribute('role', 'tooltip');
    document.body.appendChild(bubble);
  }
  return bubble;
}

export function tooltip(node: HTMLElement | SVGElement, options: TooltipOptions) {
  let current = options;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let shown = false;

  function show() {
    if (!current) return;
    const opts = typeof current === 'string' ? { text: current } : current;
    if (!opts.text) return;
    const el = ensureBubble();
    el.replaceChildren();
    el.append(opts.text);
    if (opts.shortcut) {
      const k = document.createElement('span');
      k.className = 'tooltip-shortcut';
      k.textContent = opts.shortcut;
      el.append(k);
    }
    raise(el);
    el.dataset.show = 'true';
    place(el, node.getBoundingClientRect(), { side: opts.side ?? 'bottom', gap: 7 });
    shown = true;
  }

  function enter() {
    clearTimeout(timer);
    const delay = performance.now() - lastHidden < 400 ? 0 : 450;
    timer = setTimeout(show, delay);
  }

  function leave() {
    clearTimeout(timer);
    if (shown && bubble) {
      bubble.dataset.show = 'false';
      lower(bubble);
      lastHidden = performance.now();
      shown = false;
    }
  }

  node.addEventListener('pointerenter', enter);
  node.addEventListener('pointerleave', leave);
  node.addEventListener('pointerdown', leave);
  node.addEventListener('focusout', leave);

  return {
    update(next: TooltipOptions) {
      current = next;
      if (shown) show();
    },
    destroy() {
      leave();
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('pointerdown', leave);
      node.removeEventListener('focusout', leave);
    },
  };
}
