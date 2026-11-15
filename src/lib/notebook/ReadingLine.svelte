<script lang="ts">
  /**
   * The line at the foot of the window while the images of notes are read
   * (`reading.svelte.ts`): what is being read, and Stop; as the library
   * says its long work (`library/ReferenceHost.svelte`).
   */
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { imageReading } from './reading.svelte';
</script>

{#if imageReading.now}
  {@const now = imageReading.now}
  <div class="working" role="status" data-notebook-reading>
    <Spinner size={14} />
    <span class="doing"
      >{t('notebook-reading', { name: now.name, done: now.done + 1, count: now.count })}</span
    >
    <Button variant="ghost" size="sm" data-reading-stop onclick={() => imageReading.stop()}
      >{t('notebook-reading-stop')}</Button
    >
  </div>
{/if}

<style>
  .working {
    position: fixed;
    left: 50%;
    bottom: 28px;
    z-index: 900;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: calc(100vw - 32px);
    padding: 10px 16px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    box-shadow: var(--shadow-2);
    transform: translateX(-50%);
  }
  .doing {
    max-width: 60ch;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
