<script lang="ts">
  /**
   * The row at the top of a place on the phone: Back where the place has
   * one, its title, and at its right end what the place gives it (where it
   * has no title, that takes the whole row, as the notes' field that finds
   * does). As high as its words and buttons need, never less than a row.
   */
  import type { Snippet } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import { t } from '$lib/i18n';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { places } from './places.svelte';

  let {
    title,
    back = false,
    children,
  }: { title?: string; back?: boolean; children?: Snippet } = $props();
</script>

<header class="bar" class:back data-phone-bar>
  {#if back}
    <IconButton label={t('phone-back')} data-phone-back onclick={() => places.back()}>
      <ArrowLeft size={22} />
    </IconButton>
  {/if}
  {#if title}<h1 class="truncate">{title}</h1>{/if}
  {#if children}
    <div class="end" class:fill={!title}>{@render children()}</div>
  {/if}
</header>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex: none;
    min-height: var(--phone-row, 56px);
    padding: var(--space-1) var(--space-2) var(--space-1) var(--phone-gutter, 16px);
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .bar.back {
    padding-left: var(--space-1);
  }
  h1 {
    flex: 1;
    min-width: 0;
    margin: 0 var(--space-2);
    font-size: var(--text-lg);
    font-weight: 600;
  }
  .end {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    margin-left: auto;
    min-width: 0;
  }
  .end.fill {
    flex: 1;
    margin-left: 0;
  }
</style>
