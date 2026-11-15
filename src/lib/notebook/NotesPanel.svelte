<script lang="ts">
  /**
   * The notes of the notebook in the document pane of a project (record
   * 0101): found, looked at, and dragged into the text. Not built yet: the
   * tab it stands under is.
   */
  import X from '@lucide/svelte/icons/x';
  import type { Snippet } from 'svelte';
  import { t } from '$lib/i18n';
  import IconButton from '$lib/ui/IconButton.svelte';

  interface Props {
    onclose: () => void;
    /** What stands at the head of the panel in place of its name: the tabs of the document pane. */
    head?: Snippet;
  }

  let { onclose, head }: Props = $props();
</script>

<aside class="panel" aria-label={t('notebook-notes')} data-beside-text>
  <header>
    {#if head}{@render head()}{:else}<h2>{t('notebook-notes')}</h2>{/if}
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>
</aside>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
  }
</style>
