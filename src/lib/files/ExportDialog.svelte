<script lang="ts">
  /**
   * What an export writes, and whether a references.bib of the works goes
   * with the files; the folder they are written into is asked for after.
   */
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { withBibAtFirst, type ExportRequest } from './store.svelte';

  let { request, onclose }: { request: ExportRequest; onclose: () => void } = $props();

  let withBib = $state(withBibAtFirst());

  function answer(value: boolean | null) {
    request.resolve(value);
    onclose();
  }

  const what = $derived(
    request.selection.kind === 'all'
      ? t('files-export-all-what', { count: request.count })
      : request.selection.kind === 'folder'
        ? t('files-export-folder-what', { count: request.count })
        : t('files-export-files-what', { count: request.count }),
  );
</script>

<Dialog
  open
  title={t('files-export-title', { count: request.count })}
  width={520}
  onclose={() => answer(null)}
>
  <div class="body" data-export>
    <p class="what">{what}</p>
    <label class="check">
      <input type="checkbox" bind:checked={withBib} data-with-bib />
      <span>
        {t('files-export-bib')}
        <span class="hint">{t('files-export-bib-hint')}</span>
      </span>
    </label>
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={() => answer(null)}>{t('common-cancel')}</Button>
    <Button variant="primary" onclick={() => answer(withBib)} data-export-go>
      {t('files-export-go')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .what {
    margin: 0;
    color: var(--ink-2);
    line-height: 1.5;
  }
  .check {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    cursor: pointer;
  }
  .check input {
    margin: 3px 0 0;
    accent-color: var(--accent);
  }
  .hint {
    display: block;
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
</style>
