<script lang="ts">
  import FileUp from '@lucide/svelte/icons/file-up';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import type { Summary } from '$lib/api/library';
  import { importFile, newReference } from '$lib/library/references.svelte';
  import TypeIcon from '$lib/library/TypeIcon.svelte';
  import { library, search, sortEntries } from '$lib/state/library.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import type { PickRequest } from './ui.svelte';

  interface Props {
    request: PickRequest;
    /** Ids of references the project uses already: offered first. */
    used: string[];
    onclose: (cancelled: boolean) => void;
  }

  let { request, used, onclose }: Props = $props();

  let query = $state('');
  let active = $state(0);
  let input = $state<HTMLInputElement>();
  let list = $state<HTMLDivElement>();
  /** While the form for a new reference is open, the picker waits behind it. */
  let waiting = $state(false);

  const LIMIT = 60;

  const results = $derived.by(() => {
    const exclude = new Set(request.exclude ?? []);
    const pool = library.entries.filter((e) => !exclude.has(e.id));
    if (query.trim()) {
      return {
        entries: sortEntries(search(pool, query), 'authors', false).slice(0, LIMIT),
        heading: '',
      };
    }
    const mine = new Set(used);
    const inProject = pool.filter((e) => mine.has(e.id));
    if (inProject.length) {
      return {
        entries: sortEntries(inProject, 'authors', false).slice(0, LIMIT),
        heading: 'In this project',
      };
    }
    return {
      entries: sortEntries(pool, 'added', true).slice(0, 12),
      heading: pool.length ? 'Recently added' : '',
    };
  });

  $effect(() => {
    library.load();
    input?.focus();
  });

  $effect(() => {
    void query;
    active = 0;
  });

  $effect(() => {
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    row?.scrollIntoView({ block: 'nearest' });
  });

  function choose(entry: Summary | undefined) {
    if (entry) request.onpick(entry.id);
  }

  async function create() {
    waiting = true;
    const made = await newReference();
    waiting = false;
    if (made) request.onpick(made.id);
    else input?.focus();
  }

  async function bringIn() {
    waiting = true;
    const before = new Set(library.entries.map((e) => e.id));
    const outcome = await importFile();
    waiting = false;
    // One reference imported is the one that was wanted.
    const fresh = outcome?.added.filter((id) => !before.has(id)) ?? [];
    if (fresh.length === 1) request.onpick(fresh[0]);
    else input?.focus();
  }

  function onkeydown(event: KeyboardEvent) {
    const n = results.entries.length;
    switch (event.key) {
      case 'ArrowDown':
        active = n ? (active + 1) % n : 0;
        break;
      case 'ArrowUp':
        active = n ? (active - 1 + n) % n : 0;
        break;
      case 'Enter':
        if (n) choose(results.entries[active]);
        else if (query.trim()) create();
        break;
      case 'Backspace':
        // Backspace in the empty field takes the sign back.
        if (query) return;
        onclose(false);
        break;
      default:
        return;
    }
    event.preventDefault();
  }
</script>

<Popover
  open={!waiting}
  anchor={request.anchor}
  side="bottom"
  align="start"
  gap={8}
  width={460}
  label="Choose a reference"
  onclose={() => onclose(true)}
>
  <div class="picker">
    <div class="field">
      <Search size={15} />
      <input
        bind:this={input}
        bind:value={query}
        placeholder={request.purpose ?? 'Cite: author, title, year'}
        aria-label="Search references"
        spellcheck="false"
        autocomplete="off"
        {onkeydown}
      />
    </div>

    <div class="results" bind:this={list} role="listbox" aria-label="References">
      {#if results.heading}<div class="heading">{results.heading}</div>{/if}
      {#each results.entries as entry, i (entry.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="row"
          class:active={i === active}
          role="option"
          tabindex="-1"
          aria-selected={i === active}
          data-index={i}
          onpointerenter={() => (active = i)}
          onclick={() => choose(entry)}
        >
          <TypeIcon type={entry.type} size={14} />
          <div class="text">
            <div class="first">
              <span class="authors truncate">{entry.authors || '—'}</span>
              <span class="year">{entry.year}</span>
            </div>
            <div class="title truncate">{entry.title}</div>
          </div>
        </div>
      {:else}
        <p class="none">
          {#if !library.entries.length}
            Your library is empty.
          {:else if query.trim()}
            Nothing in your library holds these words.
          {:else}
            Type to search your library.
          {/if}
        </p>
      {/each}
    </div>

    <div class="actions">
      <button type="button" onclick={create}><Plus size={14} /> New reference…</button>
      <button type="button" onclick={bringIn}><FileUp size={14} /> Import…</button>
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
    gap: 9px;
    padding: 6px 10px;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .row :global(.type-icon) {
    margin-top: 3px;
  }
  .row.active {
    background: var(--accent-soft);
  }
  .text {
    flex: 1;
    min-width: 0;
  }
  .first {
    display: flex;
    gap: 7px;
  }
  .authors {
    font-weight: 550;
  }
  .year {
    color: var(--ink-2);
    flex: none;
  }
  .title {
    font-family: var(--font-text);
    color: var(--ink-2);
  }
  .none {
    padding: 18px 12px;
    color: var(--ink-3);
    text-align: center;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 5px 6px;
    flex: none;
    border-top: 1px solid var(--line);
    background: var(--paper);
  }
  .actions button {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 9px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .actions button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .keys {
    margin-left: auto;
    padding-right: 6px;
    display: inline-flex;
    gap: 3px;
    opacity: 0.8;
  }
</style>
