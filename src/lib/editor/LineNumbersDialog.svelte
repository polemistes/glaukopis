<script lang="ts">
  /** How the lines of a verse are numbered: from which line, and every how many. */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import TextField from '$lib/ui/TextField.svelte';

  interface Props {
    start: number | null;
    by: number;
    onclose: () => void;
    onset: (start: number | null, by: number) => void;
  }

  let { start, by, onclose, onset }: Props = $props();

  // What the verse had when the dialog opened: the form starts from it.
  let from = $state(untrack(() => (start === null ? '' : String(start))));
  let every = $state(untrack(() => String(by)));
  let field = $state<HTMLInputElement>();

  $effect(() => {
    field?.focus();
  });

  const startGiven = $derived(/^-?\d+$/.test(from.trim()));
  const everyGiven = $derived(/^\d+$/.test(every.trim()) && Number(every) >= 1);

  function keep() {
    if (from.trim() && !startGiven) return;
    onset(from.trim() ? Number(from.trim()) : null, everyGiven ? Number(every) : by);
    onclose();
  }
</script>

<Dialog open title={t('editor-line-numbers')} width={380} {onclose}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="form" onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), keep())}>
    <TextField
      bind:value={from}
      bind:el={field}
      label={t('editor-line-numbers-from')}
      placeholder={t('editor-line-numbers-none')}
      error={from.trim() && !startGiven ? t('editor-line-numbers-number') : null}
      inputmode="numeric"
    />
    <TextField
      bind:value={every}
      label={t('editor-line-numbers-every')}
      error={!everyGiven ? t('editor-line-numbers-number') : null}
      inputmode="numeric"
    />
    <p class="hint">{t('editor-line-numbers-hint')}</p>
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" onclick={keep}>{t('common-apply')}</Button>
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
</style>
