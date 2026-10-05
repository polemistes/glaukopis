<script lang="ts">
  /**
   * "How it is read", closed at first, in the dialogs that read: opened by a
   * small button, it shows the three choices (`HowControls.svelte`), which
   * begin as the settings say and hold for this reading alone.
   */
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import type { How } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import HowControls from './HowControls.svelte';

  interface Props {
    value: How;
  }

  let { value = $bindable() }: Props = $props();

  let open = $state(false);
</script>

<div class="disclosure">
  <button
    type="button"
    class="toggle"
    aria-expanded={open}
    data-ocr-how
    onclick={() => (open = !open)}
  >
    <span class="twisty" class:open><ChevronRight size={13} /></span>
    <span>{t('ocr-how')}</span>
  </button>
  {#if open}
    <div class="controls">
      <HowControls {value} hint onchange={(how) => (value = how)} />
    </div>
  {/if}
</div>

<style>
  .disclosure {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    align-self: flex-start;
    margin: 0;
    padding: 2px 0;
    border: 0;
    background: none;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .toggle:hover {
    color: var(--ink-2);
  }
  .toggle:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
    border-radius: 3px;
  }
  .twisty {
    display: inline-flex;
    transition: transform 0.12s ease;
  }
  .twisty.open {
    transform: rotate(90deg);
  }
  .controls {
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
  }
</style>
