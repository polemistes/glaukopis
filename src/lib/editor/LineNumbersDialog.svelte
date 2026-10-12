<script lang="ts">
  /**
   * How the paragraphs of a passage are numbered (ADR 0039 and 0040): not at
   * all, counted from the first number given, or only by the numbers given;
   * from which number, every how many and on which side, where the passage
   * says otherwise than the layout. And what is said by hand of the
   * paragraph the cursor is in: a number or a label of its own, whether it
   * is counted, and words in the margin.
   */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Numbering, Side } from '$lib/project/model/families';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { LineMarks, NumbersLayout, PassageNumbering } from './verse';

  interface Props {
    /** How the passage numbers its paragraphs now. */
    passage: PassageNumbering;
    /** What the layout says, where the passage does not. */
    layout: NumbersLayout;
    /**
     * The number the first counted paragraph of the passage has, from which
     * the count begins; `here` when that paragraph is the one the cursor is
     * in, whose own number is then the same thing. Nothing where no paragraph
     * of the passage is counted.
     */
    from: { number: string | null; here: boolean } | null;
    /** The paragraph the cursor is in: what is said of it, its words, to tell which it is, and whether its kind is counted. */
    line: (LineMarks & { kind: string; words: string; countable: boolean }) | null;
    onclose: () => void;
    /** `from` is undefined where the number the count begins from is not to be touched. */
    onset: (how: PassageNumbering, from: string | null | undefined, line: LineMarks | null) => void;
  }

  let { passage, layout, from, line, onclose, onset }: Props = $props();

  // What the passage had when the dialog opened: the form starts from it.
  let numbering = $state<Numbering>(untrack(() => passage.numbering));
  let begin = $state(untrack(() => from?.number ?? ''));
  let every = $state(untrack(() => (passage.every === null ? '' : String(passage.every))));
  let side = $state<Side | ''>(untrack(() => passage.side ?? ''));
  let number = $state(untrack(() => line?.number ?? ''));
  let counted = $state(untrack(() => line?.counted !== false));
  let margin = $state(untrack(() => line?.margin ?? ''));

  const everyGiven = $derived(!every.trim() || (/^\d+$/.test(every.trim()) && Number(every) >= 1));
  /** The number the count begins from is asked for here, unless the paragraph the cursor is in is where it begins. */
  const asksFrom = $derived(numbering === 'counted' && !!from && !from.here);

  const numberings: { value: Numbering; label: string }[] = [
    { value: 'none', label: t('editor-numbering-none') },
    { value: 'counted', label: t('editor-numbering-counted') },
    { value: 'given', label: t('editor-numbering-given') },
  ];
  const sides = $derived<{ value: Side | ''; label: string }[]>([
    { value: '', label: t('editor-side-layout', { side: t(`editor-side-${layout.side}`) }) },
    { value: 'left', label: t('editor-side-left') },
    { value: 'right', label: t('editor-side-right') },
  ]);

  function keep() {
    if (!everyGiven) return;
    onset(
      {
        numbering,
        every: every.trim() ? Number(every.trim()) : null,
        side: side || null,
      },
      asksFrom ? begin.trim() || null : undefined,
      line
        ? {
            number: line.countable ? number.trim() || null : line.number,
            counted: line.countable ? counted : line.counted,
            margin: margin.trim() || null,
          }
        : null,
    );
    onclose();
  }
</script>

<Dialog open title={t('editor-line-numbers')} width={420} {onclose}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="form" onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), keep())}>
    <Select bind:value={numbering} options={numberings} label={t('editor-numbering')} />
    {#if asksFrom}
      <TextField
        bind:value={begin}
        label={t('editor-line-numbers-from')}
        hint={t('editor-line-numbers-from-hint')}
        placeholder={t('editor-line-number-placeholder')}
        data-number-from
      />
    {/if}
    {#if numbering !== 'none'}
      <TextField
        bind:value={every}
        label={t('editor-line-numbers-every')}
        placeholder={t('editor-line-numbers-every-layout', { every: String(layout.every) })}
        error={!everyGiven ? t('editor-line-numbers-number') : null}
        inputmode="numeric"
      />
      <Select bind:value={side} options={sides} label={t('editor-line-numbers-side')} />
    {/if}
    <p class="hint">{t('editor-line-numbers-hint')}</p>
    {#if line}
      <section class="line" data-this-line>
        <h3>{t('editor-line-this')}</h3>
        {#if line.words.trim()}<p class="words">{line.words}</p>{/if}
        {#if line.countable}
          <TextField
            bind:value={number}
            label={t('editor-line-number')}
            placeholder={t('editor-line-number-placeholder')}
            hint={from?.here && numbering === 'counted'
              ? `${t('editor-line-number-hint')} ${t('editor-line-number-first-hint')}`
              : t('editor-line-number-hint')}
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
