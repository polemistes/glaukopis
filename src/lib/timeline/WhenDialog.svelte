<script lang="ts">
  /**
   * When an element is: at a point or over a span, each end a time written
   * in words, or after, before or during another element. See
   * `timeline/solve.ts` for what is read from it.
   */
  import { untrack } from 'svelte';
  import { t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Select from '$lib/ui/Select.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { Bound, When } from './solve';
  import { isTime, type Axis } from './time';

  interface Props {
    project: Project;
    /** The element that says when it is. */
    id: string;
    onclose: () => void;
  }

  let { project, id, onclose }: Props = $props();

  const node = $derived(project.node(id));
  const axis = $derived<Axis>(project.map(node?.map)?.timeline.axis ?? 'dates');

  /** How an end is said. */
  type How = 'at' | 'after' | 'before' | 'between' | 'during';
  interface End {
    how: How;
    at: string;
    after: string;
    before: string;
    during: string;
    approx: boolean;
  }
  const howOf = (b: Bound | undefined): How =>
    !b
      ? 'at'
      : b.at
        ? 'at'
        : b.during
          ? 'during'
          : b.after && b.before
            ? 'between'
            : b.before
              ? 'before'
              : 'after';
  const endOf = (b: Bound | undefined): End => ({
    how: howOf(b),
    at: b?.at ?? '',
    after: b?.after ?? '',
    before: b?.before ?? '',
    during: b?.during ?? '',
    approx: !!b?.approx,
  });

  const given = untrack(() => project.node(id)?.when ?? null);
  let kind = $state<'point' | 'span'>(given?.end ? 'span' : 'point');
  const span = $derived(kind === 'span');
  let start = $state<End>(endOf(given?.start));
  let end = $state<End>(endOf(given?.end));

  /** The other elements of the map, by name, for the ends that refer to one. */
  const others = $derived.by(() => {
    const map = node?.map;
    if (!map) return [];
    return project
      .tree(map)
      .sequence.filter((other) => other !== id)
      .map((other) => ({
        value: other,
        label: project.node(other)?.title || t('project-untitled'),
      }));
  });
  const otherOptions = $derived([{ value: '', label: t('when-choose') }, ...others]);

  function boundOf(e: End): Bound | null {
    const out: Bound = {};
    if (e.how === 'at') {
      if (!e.at.trim()) return null;
      out.at = e.at.trim();
    } else {
      if ((e.how === 'after' || e.how === 'between') && e.after) out.after = e.after;
      if ((e.how === 'before' || e.how === 'between') && e.before) out.before = e.before;
      if (e.how === 'during' && e.during) out.during = e.during;
      if (!out.after && !out.before && !out.during) return null;
    }
    if (e.approx) out.approx = true;
    return out;
  }

  const startBound = $derived(boundOf(start));
  const endBound = $derived(span ? boundOf(end) : null);
  const complete = $derived(!!startBound && (!span || !!endBound));
  const unread = (e: End) => e.how === 'at' && !!e.at.trim() && !isTime(e.at, axis);

  function keep() {
    if (!startBound) return;
    const when: When =
      span && endBound ? { start: startBound, end: endBound } : { start: startBound };
    project.checkpoint();
    project.setWhen(id, when);
    project.checkpoint();
    onclose();
  }

  function clear() {
    project.checkpoint();
    project.setWhen(id, null);
    project.checkpoint();
    onclose();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      keep();
    }
  }

  const hows = $derived([
    { value: 'at' as const, label: t('when-at') },
    { value: 'after' as const, label: t('when-after') },
    { value: 'before' as const, label: t('when-before') },
    { value: 'between' as const, label: t('when-between') },
    { value: 'during' as const, label: t('when-during') },
  ]);
</script>

{#snippet endForm(e: End, which: 'start' | 'end')}
  {@const set = (patch: Partial<End>) => {
    if (which === 'start') start = { ...start, ...patch };
    else end = { ...end, ...patch };
  }}
  <div class="end">
    <Select
      value={e.how}
      label={span ? t(`when-${which}`) : t('when-when')}
      size="sm"
      options={hows}
      onchange={(how) => set({ how })}
    />
    {#if e.how === 'at'}
      <TextField
        value={e.at}
        label={t('when-time')}
        placeholder={axis === 'dates' ? t('when-time-placeholder') : t('when-unit-placeholder')}
        error={unread(e) ? t('when-unread') : null}
        size="sm"
        spellcheck="false"
        oninput={(ev) => set({ at: (ev.currentTarget as HTMLInputElement).value })}
      />
    {/if}
    {#if e.how === 'after' || e.how === 'between'}
      <Select
        value={e.after}
        label={t('when-after-what')}
        size="sm"
        options={otherOptions}
        onchange={(after) => set({ after })}
      />
    {/if}
    {#if e.how === 'before' || e.how === 'between'}
      <Select
        value={e.before}
        label={t('when-before-what')}
        size="sm"
        options={otherOptions}
        onchange={(before) => set({ before })}
      />
    {/if}
    {#if e.how === 'during'}
      <Select
        value={e.during}
        label={t('when-during-what')}
        size="sm"
        options={otherOptions}
        onchange={(during) => set({ during })}
      />
    {/if}
    <label class="approx">
      <input
        type="checkbox"
        checked={e.approx}
        onchange={(ev) => set({ approx: ev.currentTarget.checked })}
      />
      {t('when-approx')}
    </label>
  </div>
{/snippet}

<Dialog
  open
  title={t('when-title')}
  subtitle={node?.title || t('project-untitled')}
  width={460}
  {onclose}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="form" {onkeydown}>
    <Segmented
      bind:value={kind}
      label={t('when-kind')}
      size="sm"
      options={[
        { value: 'point', label: t('when-point') },
        { value: 'span', label: t('when-span') },
      ]}
    />
    {@render endForm(start, 'start')}
    {#if span}
      {@render endForm(end, 'end')}
    {/if}
    <p class="hint">
      {axis === 'dates' ? t('when-hint-dates') : t('when-hint-units')}
    </p>
  </div>

  {#snippet footer()}
    {#if given}
      <Button variant="ghost" onclick={clear}>{t('when-clear')}</Button>
      <span class="gap"></span>
    {/if}
    <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={!complete} onclick={keep}>{t('common-save')}</Button>
  {/snippet}
</Dialog>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .end {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
  }
  .approx {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-sm);
    color: var(--ink-2);
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
