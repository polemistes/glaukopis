<script lang="ts">
  /**
   * How the lines of a verse are numbered: from which line, and every how
   * many; and what is said by hand of the line the cursor is in: a number or
   * a label of its own, whether it is counted, and words in the margin.
   */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { LineMarks } from './verse';

  interface Props {
    start: number | null;
    by: number;
    /** The line the cursor is in: what is said of it, and its words, to tell which it is. */
    line: (LineMarks & { kind: string; words: string }) | null;
    onclose: () => void;
    onset: (start: number | null, by: number, line: LineMarks | null) => void;
  }

  let { start, by, line, onclose, onset }: Props = $props();

  // What the verse had when the dialog opened: the form starts from it.
  let from = $state(untrack(() => (start === null ? '' : String(start))));
  let every = $state(untrack(() => String(by)));
  let number = $state(untrack(() => line?.number ?? ''));
  let counted = $state(untrack(() => line?.counted !== false));
  let margin = $state(untrack(() => line?.margin ?? ''));
  let field = $state<HTMLInputElement>();

  $effect(() => {
    field?.focus();
  });

  const startGiven = $derived(/^-?\d+$/.test(from.trim()));
  const everyGiven = $derived(/^\d+$/.test(every.trim()) && Number(every) >= 1);
  /** Only a line that is a line is counted; any line may have words in the margin. */
  const isLine = $derived(line?.kind === 'line');

  function keep() {
    if (from.trim() && !startGiven) return;
    onset(
      from.trim() ? Number(from.trim()) : null,
      everyGiven ? Number(every) : by,
      line
        ? {
            number: isLine ? number.trim() || null : line.number,
            counted: isLine ? counted : line.counted,
            margin: margin.trim() || null,
          }
        : null,
    );
    onclose();
  }
</script>

<Dialog open title={t('editor-line-numbers')} width={400} {onclose}>
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
    {#if line}
      <section class="line" data-this-line>
        <h3>{t('editor-line-this')}</h3>
        {#if line.words.trim()}<p class="words">{line.words}</p>{/if}
        {#if isLine}
          <TextField
            bind:value={number}
            label={t('editor-line-number')}
            placeholder={t('editor-line-number-placeholder')}
            hint={t('editor-line-number-hint')}
          />
          <label class="check">
            <input
              type="checkbox"
              data-uncounted
              checked={!counted}
              onchange={(e) => (counted = !e.currentTarget.checked)}
            />
            <span>
              {t('editor-line-uncounted')}
              <small>{t('editor-line-uncounted-hint')}</small>
            </span>
          </label>
        {/if}
        <TextField
          bind:value={margin}
          label={t('editor-line-margin')}
          placeholder={t('editor-line-margin-placeholder')}
          hint={t('editor-line-margin-hint')}
        />
      </section>
    {/if}
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
  .line {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  h3 {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-2);
  }
  .check {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    cursor: pointer;
  }
  .check input {
    accent-color: var(--accent);
    margin: 0;
  }
  .check small {
    display: block;
    font-size: var(--text-xs);
    color: var(--ink-4);
    line-height: 1.5;
  }
  .words {
    margin: 0;
    font-family: var(--font-text);
    font-style: italic;
    color: var(--ink-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
