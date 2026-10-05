<script lang="ts">
  import type { Summary } from '$lib/api/library';
  import { languages, t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import {
    activeFilters,
    kindsOf,
    noFilters,
    parseYear,
    publishersOf,
    yearSpan,
    type Filters,
  } from './filters';
  import { typeLabel } from './schema';
  import TypeIcon from './TypeIcon.svelte';

  interface Props {
    open: boolean;
    anchor: HTMLElement | null | undefined;
    /** The references the filters choose among: those of the collection in view. */
    entries: Summary[];
    filters: Filters;
    onclose: () => void;
  }

  let { open, anchor, entries, filters = $bindable(), onclose }: Props = $props();

  /** Up to this many publishers are offered as a list; beyond it, they are typed. */
  const LISTED = 40;

  const kinds = $derived(kindsOf(entries));
  const publishers = $derived(publishersOf(entries));
  const listed = $derived(publishers.length <= LISTED);
  const span = $derived(yearSpan(entries));
  const active = $derived(activeFilters(filters));

  // The years as they are typed, so that half a number does not change the list.
  let fromText = $state('');
  let toText = $state('');
  $effect(() => {
    fromText = filters.from == null ? '' : String(filters.from);
    toText = filters.to == null ? '' : String(filters.to);
  });

  function toggleKind(kind: string, on: boolean) {
    const rest = filters.kinds.filter((k) => k !== kind);
    filters = { ...filters, kinds: on ? [...rest, kind] : rest };
  }

  function setYears() {
    const from = parseYear(fromText);
    const to = parseYear(toText);
    if (from !== filters.from || to !== filters.to) filters = { ...filters, from, to };
  }

  const n = (count: number) => count.toLocaleString(languages.current);
</script>

<Popover
  {open}
  {anchor}
  side="bottom"
  align="end"
  width={320}
  label={t('library-filters')}
  {onclose}
>
  <div class="filters">
    <section>
      <div class="overline">{t('library-filter-kind')}</div>
      {#if kinds.length}
        <ul class="kinds">
          {#each kinds as kind (kind.value)}
            <li>
              <label class="check">
                <input
                  type="checkbox"
                  data-kind={kind.value}
                  checked={filters.kinds.includes(kind.value)}
                  onchange={(e) => toggleKind(kind.value, e.currentTarget.checked)}
                />
                <TypeIcon type={kind.value} size={14} />
                <span class="truncate">{typeLabel(kind.value)}</span>
                <span class="count">{n(kind.count)}</span>
              </label>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="none">{t('library-filter-nothing-here')}</p>
      {/if}
    </section>

    <section>
      <div class="overline">{t('library-filter-publisher')}</div>
      {#if listed && publishers.length}
        <select
          class="publishers"
          aria-label={t('library-filter-publisher')}
          value={publishers.some((p) => p.value === filters.publisher) ? filters.publisher : ''}
          onchange={(e) => (filters = { ...filters, publisher: e.currentTarget.value })}
        >
          <option value="">{t('library-filter-any-publisher')}</option>
          {#each publishers as p (p.value)}
            <option value={p.value}>{p.value} ({n(p.count)})</option>
          {/each}
        </select>
      {:else}
        <TextField
          value={filters.publisher}
          oninput={(e) => (filters = { ...filters, publisher: e.currentTarget.value })}
          size="sm"
          type="search"
          placeholder={t('library-filter-publisher-hint')}
          aria-label={t('library-filter-publisher')}
        />
      {/if}
    </section>

    <section>
      <div class="overline">{t('library-filter-year')}</div>
      <div class="years">
        <TextField
          bind:value={fromText}
          onchange={setYears}
          onblur={setYears}
          size="sm"
          inputmode="numeric"
          placeholder={span ? String(span[0]) : ''}
          label={t('library-filter-from')}
          data-year="from"
        />
        <TextField
          bind:value={toText}
          onchange={setYears}
          onblur={setYears}
          size="sm"
          inputmode="numeric"
          placeholder={span ? String(span[1]) : ''}
          label={t('library-filter-to')}
          data-year="to"
        />
      </div>
    </section>

    <footer>
      <Button
        size="sm"
        variant="ghost"
        data-action="clear"
        disabled={!active}
        onclick={() => (filters = { ...noFilters })}
      >
        {t('library-filter-clear')}
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
  section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .kinds {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 200px;
    overflow-y: auto;
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
  .count {
    font-size: var(--text-xs);
    color: var(--ink-4);
    font-variant-numeric: tabular-nums;
  }
  .publishers {
    width: 100%;
    height: var(--control-h);
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
    color: var(--ink);
  }
  .years {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .none {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-4);
  }
  footer {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid var(--line);
  }
</style>
