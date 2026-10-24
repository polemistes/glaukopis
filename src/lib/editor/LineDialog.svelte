<script lang="ts">
  /**
   * Numbering of this line (ADR 0067): what is said by hand of the line the
   * cursor is in: a number or a label of its own, whether it is counted,
   * whether its number is shown as the others are, always or never, and
   * its annotation, named by the margin it goes to. In a paragraph whose
   * lines are not counted, as a speaker's, only the annotation is asked.
   */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { LineAsked, LineMarks } from './numbers';

  interface Props {
    line: LineAsked;
    onclose: () => void;
    onset: (marks: LineMarks) => void;
  }

  let { line, onclose, onset }: Props = $props();

  type Showing = 'others' | 'always' | 'never';

  // What the line had when the window opened: the form starts from it.
  let number = $state(untrack(() => line.marks.number ?? ''));
  let counted = $state(untrack(() => line.marks.counted));
  let showing = $state<Showing>(
    untrack(() => (line.marks.hidden ? 'never' : line.marks.shown ? 'always' : 'others')),
  );
  let margin = $state(untrack(() => line.marks.margin ?? ''));

  const showings: { value: Showing; label: string }[] = [
    { value: 'others', label: t('editor-line-shown-others') },
    { value: 'always', label: t('editor-line-shown-always') },
    { value: 'never', label: t('editor-line-shown-never') },
  ];

  function keep() {
    const said = margin.trim() || null;
    onset(
      line.countable
        ? {
            number: number.trim() || null,
            counted,
            hidden: counted && showing === 'never',
            shown: counted && showing === 'always',
            margin: said,
          }
        : { ...line.marks, margin: said },
    );
    onclose();
  }
</script>

<Dialog open title={t('editor-numbering-of-line')} width={420} {onclose}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="form" onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), keep())}>
    {#if line.words.trim()}<p class="words">{line.words}</p>{/if}
    {#if line.countable}
      <TextField
        bind:value={number}
        label={t('editor-line-number')}
        placeholder={t('editor-line-number-placeholder')}
        data-line-number
      />
      <label class="check">
        <input type="checkbox" data-counted bind:checked={counted} />
        <span>{t('editor-line-counted')}</span>
      </label>
      {#if counted}
        <div data-shown>
          <Select bind:value={showing} options={showings} label={t('editor-line-shown')} />
        </div>
      {/if}
    {/if}
    <TextField
      bind:value={margin}
      label={t(
        line.annotations === 'left'
          ? 'editor-line-annotation-left'
          : 'editor-line-annotation-right',
      )}
      placeholder={t('editor-line-annotation-placeholder')}
      data-annotation
    />
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
