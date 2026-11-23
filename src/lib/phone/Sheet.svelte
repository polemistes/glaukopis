<script lang="ts">
  /**
   * A sheet from the bottom of the screen, over the place: as wide as the
   * window and no higher than four fifths of it, what it holds scrolled
   * within it; a dimmed ground over the rest, which closes it when pressed;
   * its title at its head with ×. While it is open it is a step of the
   * place's, so that Android's Back closes it and leaves the place as it is.
   */
  import type { Snippet } from 'svelte';
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { places } from './places.svelte';

  let {
    open,
    title,
    onclose,
    children,
  }: { open: boolean; title?: string; onclose: () => void; children: Snippet } = $props();

  let sheet = $state<HTMLElement>();

  // A step while it is open: Back closes it; closed otherwise, its step goes.
  $effect(() => {
    if (!open) return;
    return places.step(() => onclose());
  });

  // The keys' focus goes into it, and Escape closes it, where there are keys.
  $effect(() => {
    if (open && sheet) sheet.focus({ preventScroll: true });
  });

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    onclose();
  }
</script>

{#if open}
  <button
    type="button"
    class="ground"
    tabindex="-1"
    aria-label={t('common-close')}
    data-phone-sheet-ground
    onclick={() => onclose()}
  ></button>
  <div
    bind:this={sheet}
    class="sheet"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
    data-phone-sheet
    {onkeydown}
  >
    <header>
      {#if title}<h2 class="truncate">{title}</h2>{/if}
      <IconButton label={t('common-close')} data-phone-sheet-close onclick={() => onclose()}>
        <X size={20} />
      </IconButton>
    </header>
    <div class="body">
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .ground {
    position: fixed;
    inset: 0;
    z-index: 900;
    padding: 0;
    border: none;
    background: var(--scrim);
    animation: fade var(--slow) var(--ease);
  }
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 901;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    max-height: 80dvh;
    border-top-left-radius: var(--radius-xl);
    border-top-right-radius: var(--radius-xl);
    background: var(--paper-raised);
    color: var(--ink);
    box-shadow: var(--shadow-3);
    outline: none;
    animation: rise var(--slow) var(--ease);
  }
  header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: none;
    min-height: var(--phone-row, 56px);
    padding: var(--space-1) var(--space-2) var(--space-1) var(--phone-gutter, 16px);
  }
  h2 {
    flex: 1;
    min-width: 0;
    font-size: var(--text-lg);
    font-weight: 600;
  }
  header :global(.icon-button) {
    margin-left: auto;
  }
  .body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-bottom: var(--space-3);
  }
  @keyframes rise {
    from {
      transform: translateY(24px);
      opacity: 0;
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
