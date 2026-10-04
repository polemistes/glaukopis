<script lang="ts" generics="T extends string">
  import type { Component } from 'svelte';
  import { tooltip } from './tooltip';

  interface Option {
    value: T;
    label: string;
    icon?: Component<{ size?: number | string }>;
    shortcut?: string;
    /** Show only the icon; the label becomes the tooltip. */
    iconOnly?: boolean;
    /** Cannot be chosen now. */
    disabled?: boolean;
  }

  interface Props {
    value: T;
    options: Option[];
    label: string;
    size?: 'sm' | 'md';
    onchange?: (value: T) => void;
  }

  let { value = $bindable(), options, label, size = 'md', onchange }: Props = $props();

  function choose(next: T) {
    if (next === value) return;
    value = next;
    onchange?.(next);
  }

  function onkeydown(event: KeyboardEvent) {
    const open = options.filter((o) => !o.disabled);
    if (!open.length) return;
    const i = open.findIndex((o) => o.value === value);
    if (event.key === 'ArrowRight') choose(open[(i + 1) % open.length].value);
    else if (event.key === 'ArrowLeft') choose(open[(i - 1 + open.length) % open.length].value);
    else return;
    event.preventDefault();
  }

  // When none of the options is the value, as when the ones it stands for differ,
  // the first that can be chosen takes the keyboard.
  const tabbable = $derived(
    options.some((o) => o.value === value) ? value : options.find((o) => !o.disabled)?.value,
  );
</script>

<div class="segmented {size}" role="radiogroup" aria-label={label} tabindex="-1" {onkeydown}>
  {#each options as option (option.value)}
    {@const Icon = option.icon}
    <button
      type="button"
      role="radio"
      aria-checked={option.value === value}
      aria-label={option.label}
      class:selected={option.value === value}
      disabled={option.disabled}
      tabindex={option.value === tabbable ? 0 : -1}
      use:tooltip={option.iconOnly || option.shortcut
        ? { text: option.label, shortcut: option.shortcut }
        : null}
      onclick={() => choose(option.value)}
    >
      {#if Icon}<Icon size={15} />{/if}
      {#if !option.iconOnly}<span>{option.label}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .segmented {
    display: inline-flex;
    padding: 2px;
    gap: 2px;
    background: var(--paper-sunken);
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 24px;
    padding: 0 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--ink-3);
    font-size: var(--text-sm);
    font-weight: 500;
    cursor: pointer;
    transition:
      background var(--fast) var(--ease),
      color var(--fast) var(--ease);
  }
  .sm button {
    height: 20px;
    padding: 0 8px;
  }
  button:hover {
    color: var(--ink);
  }
  button:disabled {
    color: var(--ink-4);
    cursor: default;
  }
  button.selected {
    background: var(--paper-raised);
    color: var(--ink);
    box-shadow: var(--shadow-1);
  }
</style>
