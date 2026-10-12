<script lang="ts">
  /** The label of a reference mark: of a new one, or of one in the text, which can be taken away. */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { RefMarkRequest } from './ui.svelte';

  interface Props {
    request: RefMarkRequest;
    onclose: (cancelled: boolean) => void;
  }

  let { request, onclose }: Props = $props();

  let label = $state(untrack(() => request.label));
  let field = $state<HTMLInputElement>();

  $effect(() => {
    field?.select();
  });

  function keep() {
    if (!label.trim() && !request.editing) return;
    request.onset(label.trim());
    onclose(false);
  }

  function remove() {
    request.onset('');
    onclose(false);
  }
</script>

<Dialog open title={t('editor-refmark-title')} width={360} onclose={() => onclose(true)}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="form"
    data-refmark-dialog
    onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), keep())}
  >
    <TextField
      bind:value={label}
      bind:el={field}
      label={t('editor-refmark-label')}
      placeholder={t('editor-refmark-placeholder')}
    />
    <p class="hint">{t('editor-refmark-dialog-hint')}</p>
  </div>
  {#snippet footer()}
    {#if request.editing}
      <Button variant="ghost" onclick={remove}>{t('common-remove')}</Button>
      <span class="gap"></span>
    {/if}
    <Button variant="ghost" onclick={() => onclose(true)}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={!label.trim() && !request.editing} onclick={keep}>
      {t('common-apply')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .hint {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-4);
    line-height: 1.5;
  }
  .gap {
    flex: 1;
  }
</style>
