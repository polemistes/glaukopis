<script lang="ts">
  /**
   * A reference of the library chosen by searching, as when citing: for a
   * file to be assigned to, a picture to be attached to, and whatever else
   * needs one work. A new reference can be made from here as well, and is
   * then the one chosen.
   */
  import { tick } from 'svelte';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import { t } from '$lib/i18n';
  import ReferenceRow from '$lib/library/ReferenceRow.svelte';
  import { newReference } from '$lib/library/references.svelte';
  import { library, search, sortEntries } from '$lib/state/library.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';

  interface Props {
    title?: string;
    onpick: (id: string) => void;
    onclose: () => void;
  }

  let { title, onpick, onclose }: Props = $props();

  /** The most rows shown: what is sought is found by searching, not by scrolling. */
  const MOST = 50;

  let query = $state('');
  let at = $state(0);
  /** The form of a new reference is open, over which this one is not shown. */
  let making = $state(false);
  let list = $state<HTMLDivElement>();

  $effect(() => void library.load());

  // Sorted when the library changes; what is searched for is filtered out
  // of that, in the same order, with every letter typed.
  const ordered = $derived(sortEntries(library.entries, 'authors', false));
  const found = $derived(search(ordered, query));
  const shown = $derived(found.slice(0, MOST));

  // The first is the one Enter picks, whenever the search changes.
  $effect(() => {
    void query;
    at = 0;
  });

  function pick(id: string) {
    onpick(id);
    onclose();
  }

  async function make() {
    making = true;
    const added = await newReference({ lookup: query.trim() || undefined });
    if (added) pick(added.id);
    else making = false;
  }

  async function reveal() {
    await tick();
    list?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') at = Math.min(shown.length - 1, at + 1);
    else if (event.key === 'ArrowUp') at = Math.max(0, at - 1);
    else if (event.key === 'Enter') {
      if (shown[at]) pick(shown[at].id);
    } else return;
    event.preventDefault();
    void reveal();
  }
</script>

{#if !making}
  <Dialog open title={title ?? t('files-choose-reference')} width={560} tall {onclose}>
    <div class="chooser">
      <div class="search">
        <Search size={15} />
        <input
          bind:value={query}
          type="search"
          placeholder={t('files-choose-search')}
          aria-label={t('common-search')}
          spellcheck="false"
          data-autofocus
          {onkeydown}
        />
      </div>
      <div
        bind:this={list}
        class="list"
        role="listbox"
        aria-label={t('files-choose-references')}
        data-chooser
      >
        {#each shown as entry, i (entry.id)}
          <div
            class="item"
            role="option"
            tabindex="-1"
            aria-selected={i === at}
            data-id={entry.id}
            onclick={() => pick(entry.id)}
            onkeydown={(e) => e.key === 'Enter' && pick(entry.id)}
            onpointermove={() => (at = i)}
          >
            <ReferenceRow {entry} selected={i === at} />
          </div>
        {:else}
          <p class="none">
            {library.entries.length ? t('files-choose-none') : t('files-choose-empty')}
          </p>
        {/each}
        {#if found.length > MOST}
          <p class="more">{t('files-choose-more', { count: found.length - MOST })}</p>
        {/if}
      </div>
    </div>

    {#snippet footer()}
      <Button variant="ghost" onclick={make} data-new-reference>
        {#snippet icon()}<Plus size={14} />{/snippet}
        {t('files-choose-new')}
      </Button>
      <span class="spring"></span>
      <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
      <Button
        variant="primary"
        disabled={!shown[at]}
        onclick={() => shown[at] && pick(shown[at].id)}
      >
        {t('files-choose')}
      </Button>
    {/snippet}
  </Dialog>
{/if}

<style>
  .chooser {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: 100%;
    min-height: 0;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--control-h);
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink-3);
  }
  .search:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    color: var(--ink);
  }
  .search input::-webkit-search-cancel-button {
    display: none;
  }
  .list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
  }
  .item {
    cursor: pointer;
  }
  .none,
  .more {
    margin: 0;
    padding: 14px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .spring {
    flex: 1;
  }
</style>
