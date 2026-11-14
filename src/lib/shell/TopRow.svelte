<script lang="ts">
  /**
   * The row at the top of a view that has none of its own (ADR 0096): the
   * library and its files, the start screen. The start of the
   * row, what the view puts between, the end of the row; as high as the
   * project's top row and the head of the list of projects, so that their
   * lines meet. The start is left out where the list of projects beside has
   * it in its head.
   */
  import type { Snippet } from 'svelte';
  import RowEnd from './RowEnd.svelte';
  import RowStart from './RowStart.svelte';

  interface Props {
    /** Whether the start of the row stands in it. */
    start?: boolean;
    /** What the view puts between the start and the end. */
    children?: Snippet;
  }

  let { start = true, children }: Props = $props();
</script>

<div class="top-row" class:without-start={!start} data-top-row>
  {#if start}<RowStart />{/if}
  <div class="between">{@render children?.()}</div>
  <RowEnd />
</div>

<style>
  .top-row {
    display: flex;
    align-items: center;
    height: var(--bar-h);
    flex: none;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .between {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 8px;
    padding: 0 8px;
  }
  .without-start .between {
    padding-left: 14px;
  }
</style>
