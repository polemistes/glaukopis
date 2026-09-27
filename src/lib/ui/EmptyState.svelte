<script lang="ts">
  import type { Component, Snippet } from 'svelte';

  interface Props {
    icon?: Component<{ size?: number | string; strokeWidth?: number | string }>;
    title: string;
    text?: string;
    children?: Snippet;
    compact?: boolean;
  }

  let { icon: Icon, title, text, children, compact = false }: Props = $props();
</script>

<div class="empty" class:compact>
  {#if Icon}<div class="icon"><Icon size={compact ? 22 : 30} strokeWidth={1.4} /></div>{/if}
  <h3>{title}</h3>
  {#if text}<p>{text}</p>{/if}
  {#if children}<div class="actions">{@render children()}</div>{/if}
</div>

<style>
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: var(--space-7) var(--space-5);
    text-align: center;
    height: 100%;
  }
  .compact {
    padding: var(--space-5) var(--space-4);
  }
  .icon {
    color: var(--ink-4);
    margin-bottom: 6px;
  }
  h3 {
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 500;
    color: var(--ink-2);
  }
  .compact h3 {
    font-size: var(--text-lg);
  }
  p {
    max-width: 42ch;
    color: var(--ink-3);
    line-height: 1.55;
  }
  .actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }
</style>
