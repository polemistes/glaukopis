<script lang="ts">
  /**
   * The line over the notes, there only where something waits for a server
   * that is not reached, or the synchronization says something is wrong
   * (`line.ts`). It is a button over the whole width, which goes to the
   * settings, where the section of the synchronization says the rest.
   */
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CloudOff from '@lucide/svelte/icons/cloud-off';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { t } from '$lib/i18n';
  import { sync } from '$lib/sync/sync.svelte';
  import { lineOf } from './line';
  import { places } from './places.svelte';

  const words = $derived(lineOf(sync.status));
</script>

{#if words}
  <button
    type="button"
    class="line"
    class:wrong={words !== 'phone-waiting'}
    data-phone-line={words}
    onclick={() => places.go({ at: 'settings' })}
  >
    {#if words === 'phone-waiting'}
      <CloudOff size={18} />
    {:else}
      <TriangleAlert size={18} />
    {/if}
    <span class="words">{t(words)}</span>
    <ChevronRight size={18} />
  </button>
{/if}

<style>
  .line {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: none;
    width: 100%;
    min-height: 44px;
    padding: var(--space-2) var(--space-3) var(--space-2) var(--phone-gutter, 16px);
    border: none;
    border-bottom: 1px solid var(--line);
    background: var(--paper-sunken);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    text-align: left;
    cursor: pointer;
  }
  .line.wrong {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .words {
    flex: 1;
    min-width: 0;
  }
  .line > :global(svg) {
    flex: none;
  }
</style>
