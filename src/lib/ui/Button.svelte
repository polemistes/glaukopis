<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  type Props = HTMLButtonAttributes & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: Snippet;
    children?: Snippet;
    el?: HTMLButtonElement;
  };

  let {
    variant = 'secondary',
    size = 'md',
    icon,
    children,
    type = 'button',
    el = $bindable(),
    ...rest
  }: Props = $props();
</script>

<button bind:this={el} class="button {variant} {size}" {type} {...rest}>
  {#if icon}<span class="icon">{@render icon()}</span>{/if}
  {#if children}<span class="text">{@render children()}</span>{/if}
</button>

<style>
  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: var(--control-h);
    padding: 0 12px;
    border-radius: var(--radius-s);
    border: 1px solid transparent;
    font-size: var(--text-md);
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition:
      background var(--fast) var(--ease),
      border-color var(--fast) var(--ease),
      color var(--fast) var(--ease);
  }
  .sm {
    height: 26px;
    padding: 0 9px;
    font-size: var(--text-sm);
  }
  .lg {
    height: 36px;
    padding: 0 16px;
    font-size: var(--text-lg);
  }
  .icon {
    display: inline-flex;
    margin-left: -2px;
  }
  .primary {
    background: var(--accent);
    color: var(--accent-ink);
  }
  .primary:hover:not(:disabled) {
    background: var(--accent-strong);
  }
  .secondary {
    background: var(--paper-raised);
    border-color: var(--line-strong);
    color: var(--ink);
  }
  .secondary:hover:not(:disabled) {
    background: var(--paper-hover);
  }
  .ghost {
    background: transparent;
    color: var(--ink-2);
  }
  .ghost:hover:not(:disabled) {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .danger {
    background: transparent;
    border-color: var(--line-strong);
    color: var(--danger);
  }
  .danger:hover:not(:disabled) {
    background: var(--danger-soft);
    border-color: var(--danger);
  }
  .button:disabled {
    opacity: 0.45;
    cursor: default;
  }
</style>
