<script lang="ts">
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import type { Summary } from '$lib/api/library';
  import NoteButton from './NoteButton.svelte';
  import TypeIcon from './TypeIcon.svelte';

  interface Props {
    entry: Summary;
    selected?: boolean;
    /** Narrow places show less. */
    compact?: boolean;
  }

  let { entry, selected = false, compact = false }: Props = $props();
</script>

<div class="row" class:selected class:compact>
  <TypeIcon type={entry.type} />
  <div class="text">
    <div class="first">
      <span class="authors truncate">{entry.authors || '—'}</span>
      {#if entry.year}<span class="year">{entry.year}</span>{/if}
      <span class="marks">
        <NoteButton id={entry.id} />
        {#if entry.attachments > 0}
          <span class="clip"><Paperclip size={12} /></span>
        {/if}
      </span>
    </div>
    <div class="second truncate">
      <span class="title">{entry.title || 'Untitled'}</span>{#if entry.container && !compact}<span
          class="container">{entry.container}</span
        >{/if}
    </div>
  </div>
</div>

<style>
  .row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    height: 100%;
    padding: 8px 14px 0 14px;
    border-bottom: 1px solid var(--line);
    cursor: default;
  }
  .row :global(.type-icon) {
    margin-top: 2px;
  }
  .row.selected {
    background: var(--accent-soft);
    border-bottom-color: transparent;
  }
  .text {
    flex: 1;
    min-width: 0;
  }
  .first {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .authors {
    font-weight: 550;
    color: var(--ink);
  }
  .year {
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
    flex: none;
  }
  .marks {
    display: inline-flex;
    align-items: center;
    align-self: center;
    gap: 4px;
    height: 18px;
    margin-left: auto;
  }
  .clip {
    display: inline-flex;
    color: var(--ink-4);
  }
  .second {
    margin-top: 1px;
    color: var(--ink-2);
  }
  .title {
    font-family: var(--font-text);
    font-size: 14px;
  }
  .container {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .container::before {
    content: '·';
    margin: 0 6px;
  }
</style>
