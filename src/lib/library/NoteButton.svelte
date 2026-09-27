<script lang="ts">
  /**
   * Opens what is written about a work. It is in view where something is
   * written; where nothing is, it appears when the pointer is near, to write.
   */
  import NotebookPen from '@lucide/svelte/icons/notebook-pen';
  import { tooltip } from '$lib/ui/tooltip';
  import { hasNotes, openNotes } from './notes.svelte';

  interface Props {
    id: string;
    size?: number;
    /** Shown though there is nothing written, and the pointer elsewhere. */
    always?: boolean;
  }

  let { id, size = 13, always = false }: Props = $props();

  const has = $derived(hasNotes(id));
</script>

<button
  type="button"
  class="note-button"
  class:has
  class:always
  aria-label={has ? 'Read your notes' : 'Write a note'}
  use:tooltip={has ? 'Your notes on this work' : 'Write a note on this work'}
  onpointerdown={(e) => e.stopPropagation()}
  onmousedown={(e) => e.preventDefault()}
  ondblclick={(e) => e.stopPropagation()}
  onclick={(e) => {
    e.stopPropagation();
    openNotes(id, e.currentTarget);
  }}
>
  <NotebookPen {size} />
</button>

<style>
  .note-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    opacity: 0;
    transition:
      opacity var(--fast) var(--ease),
      background var(--fast) var(--ease),
      color var(--fast) var(--ease);
  }
  .note-button.has,
  .note-button.always,
  .note-button:focus-visible,
  :global(:is(.row, .item, .work):hover) > .note-button,
  :global(:is(.row, .item, .work):hover) .note-button {
    opacity: 1;
  }
  .note-button.has {
    color: var(--gold);
  }
  .note-button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
</style>
