<script lang="ts">
  /**
   * Line numbering from here (ADR 0067): how the lines are numbered from
   * the paragraph the cursor is in, or the paragraphs selected: not at all,
   * counted from the first number given, or only by the numbers given; from
   * which number the count begins, every how many a number is shown, on
   * which side, and whether the lines of one kind only are counted. The
   * paragraphs before keep their numbering.
   */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Numbering, Side } from '$lib/project/model/families';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { NumbersLayout, StretchNumbering } from './numbers';

  interface Props {
    /** How the paragraphs from here are numbered now, or how they would be. */
    stretch: StretchNumbering;
    /** What the layout says, where the stretch does not. */
    layout: NumbersLayout;
    /** The number the first counted line from here has now. */
    from: string;
    /** The kinds whose lines may be counted, with their names. */
    kinds: { id: string; name: string }[];
    onclose: () => void;
    onset: (how: StretchNumbering) => void;
  }

  let { stretch, layout, from, kinds, onclose, onset }: Props = $props();

  // What the paragraphs had when the window opened: the form starts from it.
  let numbering = $state<Numbering>(untrack(() => stretch.numbering));
  let begin = $state(untrack(() => from));
  let every = $state(untrack(() => (stretch.every === null ? '' : String(stretch.every))));
  let side = $state<Side | ''>(untrack(() => stretch.side ?? ''));
  let only = $state(untrack(() => stretch.only ?? ''));

  const everyGiven = $derived(!every.trim() || (/^\d+$/.test(every.trim()) && Number(every) >= 1));

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
  const onlys = $derived<{ value: string; label: string }[]>([
    { value: '', label: t('editor-numbering-every-kind') },
    ...kinds.map((k) => ({ value: k.id, label: k.name })),
  ]);

  function keep() {
    if (!everyGiven) return;
    const counted = numbering === 'counted';
    onset({
      numbering,
      every: every.trim() ? Number(every.trim()) : null,
      side: side || null,
      only: counted ? only || null : null,
      from: counted ? begin.trim() || null : null,
    });
    onclose();
  }
</script>

<Dialog open title={t('editor-numbering-from-here')} width={420} {onclose}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="form" onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), keep())}>
    <div data-numbering>
      <Select bind:value={numbering} options={numberings} label={t('editor-numbering')} />
    </div>
    {#if numbering === 'counted'}
      <TextField
        bind:value={begin}
        label={t('editor-line-numbers-from')}
        placeholder="1"
        data-number-from
      />
      <TextField
        bind:value={every}
        label={t('editor-line-numbers-every')}
        placeholder={t('editor-line-numbers-every-layout', { every: String(layout.every) })}
        error={!everyGiven ? t('editor-line-numbers-number') : null}
        inputmode="numeric"
        data-every
      />
    {/if}
    {#if numbering !== 'none'}
      <div data-side>
        <Select bind:value={side} options={sides} label={t('editor-line-numbers-side')} />
      </div>
    {/if}
    {#if numbering === 'counted'}
      <div data-only>
        <Select bind:value={only} options={onlys} label={t('editor-numbering-only')} />
      </div>
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
</style>
