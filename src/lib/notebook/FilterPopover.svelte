<script lang="ts">
  /**
   * The filters of the notebook's list, in a window at their button, as the
   * library has its own (`library/FilterPopover.svelte`): what a note holds,
   * when it was collected, where it came from, whether it has been looked
   * at, whether it has been used. What is chosen holds at once; Clear takes
   * it all away, Done closes the window.
   */
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import {
    activeFilters,
    CAME,
    daySpan,
    HELD,
    noFilters,
    parseDay,
    type Came,
    type Held,
    type NoteFilters,
    type Use,
  } from './filters';
  import type { NoteRecord } from './model/types';

  interface Props {
    open: boolean;
    anchor: HTMLElement | null | undefined;
    /** The notes the filters choose among: those in view, for the days offered. */
    notes: NoteRecord[];
    filters: NoteFilters;
    onclose: () => void;
  }

  let { open, anchor, notes, filters = $bindable(), onclose }: Props = $props();

  const active = $derived(activeFilters(filters));
  const span = $derived(daySpan(notes));

  const HELD_WORDS: Record<Held, string> = {
    pictures: 'notebook-filter-picture',
    files: 'notebook-filter-file',
    passages: 'notebook-filter-passage',
    links: 'notebook-filter-link',
  };
  const CAME_WORDS: Record<Came, string> = {
    web: 'notebook-filter-web',
    reference: 'notebook-filter-reference',
    file: 'notebook-filter-file-source',
    words: 'notebook-filter-other',
    none: 'notebook-filter-no-source',
  };

  const USES: readonly Use[] = ['all', 'used', 'unused'];
  const USE_WORDS: Record<Use, string> = {
    all: 'notebook-filter-use-all',
    used: 'notebook-filter-used',
    unused: 'notebook-filter-unused',
  };

  // The days as they are typed, so that half a day does not change the list.
  let fromText = $state('');
  let toText = $state('');
  $effect(() => {
    fromText = filters.from ?? '';
    toText = filters.to ?? '';
  });

  function setDays() {
    const from = fromText.trim() ? parseDay(fromText) : null;
    const to = toText.trim() ? parseDay(toText, true) : null;
    if (from !== filters.from || to !== filters.to) filters = { ...filters, from, to };
  }

  function toggle<T extends string>(list: T[], value: T, on: boolean): T[] {
    const rest = list.filter((v) => v !== value);
    return on ? [...rest, value] : rest;
  }
</script>

<Popover
  {open}
  {anchor}
  side="bottom"
  align="end"
  width={300}
  label={t('notebook-filters')}
  {onclose}
>
  <div class="filters" data-notebook-filters>
    <section>
      <div class="overline">{t('notebook-filter-holds')}</div>
      {#each HELD as held (held)}
        <label class="check">
          <input
            type="checkbox"
            data-holds={held}
            checked={filters.holds.includes(held)}
            onchange={(e) =>
              (filters = {
                ...filters,
                holds: toggle(filters.holds, held, e.currentTarget.checked),
              })}
          />
          <span class="truncate">{t(HELD_WORDS[held])}</span>
        </label>
      {/each}
    </section>

    <section>
      <div class="overline">{t('notebook-filter-collected')}</div>
      <div class="days">
        <TextField
          bind:value={fromText}
          onchange={setDays}
          onblur={setDays}
          size="sm"
          placeholder={span?.[0] ?? ''}
          label={t('notebook-filter-from')}
          data-day="from"
        />
        <TextField
          bind:value={toText}
          onchange={setDays}
          onblur={setDays}
          size="sm"
          placeholder={span?.[1] ?? ''}
          label={t('notebook-filter-to')}
          data-day="to"
        />
      </div>
    </section>

    <section>
      <div class="overline">{t('notebook-filter-came')}</div>
      {#each CAME as came (came)}
        <label class="check">
          <input
            type="checkbox"
            data-came={came}
            checked={filters.came.includes(came)}
            onchange={(e) =>
              (filters = { ...filters, came: toggle(filters.came, came, e.currentTarget.checked) })}
          />
          <span class="truncate">{t(CAME_WORDS[came])}</span>
        </label>
      {/each}
    </section>

    <section>
      <label class="check">
        <input
          type="checkbox"
          data-unseen
          checked={filters.unseen}
          onchange={(e) => (filters = { ...filters, unseen: e.currentTarget.checked })}
        />
        <span class="dot" aria-hidden="true"></span>
        <span class="truncate">{t('notebook-filter-unseen')}</span>
      </label>
    </section>

    <div class="group" role="radiogroup" aria-label={t('notebook-filter-use')}>
      {#each USES as use (use)}
        <label class="check">
          <input
            type="radio"
            name="notebook-filter-use"
            data-use={use}
            checked={filters.use === use}
            onchange={() => (filters = { ...filters, use })}
          />
          <span class="truncate">{t(USE_WORDS[use])}</span>
        </label>
      {/each}
    </div>

    <footer>
      <Button
        size="sm"
        variant="ghost"
        data-action="clear"
        disabled={!active}
        onclick={() => (filters = { ...noFilters })}
      >
        {t('notebook-filter-clear')}
      </Button>
      <Button size="sm" variant="primary" onclick={onclose}>{t('common-done')}</Button>
    </footer>
  </div>
</Popover>

<style>
  .filters {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 12px 14px 10px;
  }
  section,
  .group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .overline {
    margin-bottom: 4px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 26px;
    color: var(--ink-2);
    cursor: pointer;
  }
  .check input {
    accent-color: var(--accent);
    margin: 0;
  }
  .check .truncate {
    flex: 1;
    min-width: 0;
  }
  .dot {
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
  }
  .days {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  footer {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid var(--line);
  }
</style>
