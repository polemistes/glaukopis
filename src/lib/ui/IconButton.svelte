<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { tooltip } from './tooltip';

  type Props = Omit<HTMLButtonAttributes, 'title'> & {
    /** What the button does. Shown as a tooltip and read by screen readers. */
    label: string;
    shortcut?: string;
    active?: boolean;
    size?: 'sm' | 'md';
    side?: 'top' | 'bottom' | 'left' | 'right';
    children: Snippet;
    el?: HTMLButtonElement;
  };

  let {
    label,
    shortcut,
    active = false,
    size = 'md',
    side = 'bottom',
    children,
    el = $bindable(),
    ...rest
  }: Props = $props();
</script>

<button
  bind:this={el}
  type="button"
  class="icon-button {size}"
  class:active
  aria-label={label}
  aria-pressed={active}
  use:tooltip={{ text: label, shortcut, side }}
  {...rest}
>
  {@render children()}
</button>

<style>
  .icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--control-h);
    height: var(--control-h);
    flex: none;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    cursor: pointer;
    transition:
      background var(--fast) var(--ease),
      color var(--fast) var(--ease);
  }
  .sm {
    width: 24px;
    height: 24px;
  }
  /* Only where there is a pointer that can be over a thing without pressing
     it. A finger cannot: a touch screen leaves the last thing tapped as if
     the pointer stayed over it, and a tool that was turned off again kept
     this ground and looked as if it were still on. */
  @media (hover: hover) {
    .icon-button:hover:not(:disabled) {
      background: var(--paper-hover);
      color: var(--ink);
    }
  }
  .active {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  @media (hover: hover) {
    .active:hover:not(:disabled) {
      background: var(--accent-soft);
      color: var(--accent-strong);
    }
  }
  .icon-button:disabled {
    opacity: 0.4;
    cursor: default;
  }
</style>
