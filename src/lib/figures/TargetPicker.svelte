<script lang="ts">
  /**
   * Where what the text is to point to is chosen: a figure, an equation, or
   * a part of the document of the map.
   */
  import Heading from '@lucide/svelte/icons/heading';
  import Image from '@lucide/svelte/icons/image';
  import Search from '@lucide/svelte/icons/search';
  import Sigma from '@lucide/svelte/icons/sigma';
  import Table from '@lucide/svelte/icons/table';
  import type { TargetRequest } from '$lib/editor/ui.svelte';
  import { t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import { numbering, pointerText, type Pointed } from './numbering.svelte';
  import { pictures } from './pictures.svelte';

  interface Props {
    project: Project;
    request: TargetRequest;
    onclose: (cancelled: boolean) => void;
  }

  let { project, request, onclose }: Props = $props();

  let query = $state('');
  let active = $state(0);
  let input = $state<HTMLInputElement>();
  let list = $state<HTMLDivElement>();

  const counting = $derived(numbering.countingOf(project, request.map));
  const numbers = $derived(numbering.of(project, request.map));

  const GROUPS = $derived<{ kind: Pointed['kind']; heading: string }[]>([
    { kind: 'figure', heading: t('figures-targets-figures') },
    { kind: 'table', heading: t('figures-targets-tables') },
    { kind: 'equation', heading: t('figures-targets-equations') },
    { kind: 'part', heading: t('figures-targets-parts') },
  ]);

  /** What is called what: "Figure 2", "(1)", "2.1". */
  const called = (p: Pointed) =>
    p.kind === 'part' ? (p.number ?? '') : pointerText(p, 'full', counting);

  const rows = $derived.by(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const seen = new Set<string>();
    const found = numbers.all.filter((p) => {
      // What has nothing to be pointed by, or stands in the document twice, is offered once or not at all.
      if (!p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      if (p.kind === 'equation' && p.number === null) return false;
      const hay = `${called(p)} ${p.words}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    return GROUPS.flatMap((g) => found.filter((p) => p.kind === g.kind));
  });

  $effect(() => {
    input?.focus();
  });
  $effect(() => {
    void query;
    active = 0;
  });
  $effect(() => {
    list
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  });

  function onkeydown(event: KeyboardEvent) {
    const n = rows.length;
    switch (event.key) {
      case 'ArrowDown':
        active = n ? (active + 1) % n : 0;
        break;
      case 'ArrowUp':
        active = n ? (active - 1 + n) % n : 0;
        break;
      case 'Enter':
        if (rows[active]) request.onpick(rows[active]);
        break;
      default:
        return;
    }
    event.preventDefault();
  }
</script>

<Popover
  open
  anchor={request.anchor}
  side="bottom"
  align="start"
  gap={8}
  width={440}
  label={t('figures-targets')}
  onclose={() => onclose(true)}
>
  <div class="picker targets">
    <div class="field">
      <Search size={15} />
      <input
        bind:this={input}
        bind:value={query}
        placeholder={t('figures-targets-placeholder')}
        aria-label={t('figures-targets-search')}
        spellcheck="false"
        autocomplete="off"
        {onkeydown}
      />
    </div>

    <div class="results" bind:this={list} role="listbox" aria-label={t('figures-targets-results')}>
      {#each rows as row, i (row.id)}
        {#if i === 0 || rows[i - 1].kind !== row.kind}
          <div class="heading">{GROUPS.find((g) => g.kind === row.kind)?.heading}</div>
        {/if}
        {@const shown =
          row.kind === 'figure' && row.file
            ? pictures.of(row.file, row.extension ?? '', true)
            : null}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="row"
          class:active={i === active}
          role="option"
          tabindex="-1"
          aria-selected={i === active}
          data-index={i}
          data-kind={row.kind}
          onpointerenter={() => (active = i)}
          onclick={() => request.onpick(row)}
        >
          <span class="mark">
            {#if shown?.url}
              <img src={shown.url} alt="" draggable="false" />
            {:else if row.kind === 'figure'}
              <Image size={15} />
            {:else if row.kind === 'table'}
              <Table size={15} />
            {:else if row.kind === 'equation'}
              <Sigma size={15} />
            {:else}
              <Heading size={15} />
            {/if}
          </span>
          <span class="called">{called(row)}</span>
          <span class="words truncate" class:formula={row.kind === 'equation'}>
            {row.words ||
              (row.kind === 'figure'
                ? t('figures-targets-figure-unsaid')
                : row.kind === 'table'
                  ? t('figures-targets-table-unsaid')
                  : '')}
          </span>
        </div>
      {:else}
        <p class="none">
          {#if query.trim()}
            {t('figures-targets-no-match')}
          {:else}
            {t('figures-targets-none')}
          {/if}
        </p>
      {/each}
    </div>

    <div class="actions">
      <span class="hint">{t('figures-targets-hint')}</span>
      <span class="keys"><kbd>↑</kbd><kbd>↓</kbd> <kbd>Enter</kbd></span>
    </div>
  </div>
</Popover>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    max-height: min(440px, calc(100vh - 40px));
  }
  .field {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 14px;
    height: 44px;
    flex: none;
    border-bottom: 1px solid var(--line);
    color: var(--ink-3);
  }
  input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    font-size: var(--text-lg);
    color: var(--ink);
  }
  input::placeholder {
    color: var(--ink-4);
  }
  .results {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px;
  }
  .heading {
    padding: 8px 10px 4px;
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: 34px;
    padding: 4px 10px;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .row.active {
    background: var(--accent-soft);
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 34px;
    height: 26px;
    color: var(--ink-3);
  }
  .mark img {
    max-width: 34px;
    max-height: 26px;
    border-radius: 3px;
    object-fit: contain;
  }
  .called {
    flex: none;
    min-width: 2.2em;
    font-weight: 550;
    font-variant-numeric: lining-nums;
  }
  .words {
    flex: 1;
    min-width: 0;
    font-family: var(--font-text);
    color: var(--ink-2);
  }
  .words.formula {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
  }
  .none {
    padding: 18px 12px;
    color: var(--ink-3);
    text-align: center;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    flex: none;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .hint {
    flex: 1;
    color: var(--ink-4);
    font-size: var(--text-xs);
    line-height: 1.4;
  }
  .keys {
    display: inline-flex;
    gap: 3px;
    opacity: 0.8;
  }
</style>
