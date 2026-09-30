<script lang="ts">
  /**
   * The store of pictures: all the pictures of the application, as the
   * library is all its references. Every project that uses a picture uses
   * the one that is here.
   */
  import { onMount, tick } from 'svelte';
  import Images from '@lucide/svelte/icons/images';
  import NotebookPen from '@lucide/svelte/icons/notebook-pen';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import SearchX from '@lucide/svelte/icons/search-x';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import {
    isPicturePath,
    pictureMatches,
    pictures,
    type Picture,
  } from '$lib/figures/pictures.svelte';
  import { t } from '$lib/i18n';
  import { importDropped } from '$lib/library/references.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { dropTarget, type DropEvent } from '$lib/ui/drag.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import PicturePane from './PicturePane.svelte';
  import { addPictures, removePicture, takeIn } from './store.svelte';
  import Thumb from './Thumb.svelte';

  let query = $state('');
  let selected = $state<string | null>(null);
  let searchField = $state<HTMLInputElement>();
  let grid = $state<HTMLDivElement>();

  const route = $derived(
    router.route.view === 'pictures' ? router.route : { view: 'pictures' as const },
  );
  const all = $derived(pictures.all);
  const shown = $derived(all.filter((p) => pictureMatches(p, query)));

  onMount(() => {
    void pictures.load();
    void projects.load();
  });

  // Open the picture the route names.
  $effect(() => {
    const wanted = route.picture;
    if (wanted && pictures.loaded && pictures.get(wanted)) {
      selected = wanted;
      void tick().then(() => reveal(wanted));
    }
  });

  /** Where the picture that is selected stands among those that are shown. */
  let stood = 0;
  $effect(() => {
    const at = shown.findIndex((p) => p.hash === selected);
    if (at >= 0) stood = at;
  });

  // What is selected must exist. When it has been removed, the one that
  // stood beside it is selected in its place.
  $effect(() => {
    if (!selected || !pictures.loaded || pictures.get(selected)) return;
    selected = shown[Math.min(stood, shown.length - 1)]?.hash ?? null;
  });

  function reveal(hash: string) {
    grid?.querySelector(`[data-hash="${hash}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  function select(picture: Picture) {
    selected = picture.hash;
    grid?.focus({ preventScroll: true });
  }

  async function took(taken: Picture[]) {
    if (!taken.length) return;
    query = '';
    selected = taken[taken.length - 1].hash;
    await tick();
    reveal(selected);
  }

  async function add() {
    await took(await addPictures());
  }

  /** Files from the desktop: the pictures among them are taken in, the others go where they went before. */
  async function dropped(event: DropEvent) {
    const paths = event.payload.data as string[];
    const others = paths.filter((path) => !isPicturePath(path));
    await took(await takeIn(paths));
    if (others.length) void importDropped(others);
  }

  function context(event: MouseEvent, picture: Picture) {
    selected = picture.hash;
    openContextMenu(event, [
      {
        label: t('common-remove'),
        icon: Trash2,
        danger: true,
        shortcut: 'Del',
        action: () => void removePicture(picture),
      },
    ]);
  }

  /** How many pictures stand in a row, as the grid is laid out now. */
  function across(): number {
    if (!grid) return 1;
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
    return Math.max(1, columns);
  }

  function gridKey(event: KeyboardEvent) {
    if (!shown.length || event.ctrlKey || event.metaKey || event.altKey) return;
    const current = shown.findIndex((p) => p.hash === selected);
    let next = current;
    switch (event.key) {
      case 'ArrowRight':
        next = Math.min(shown.length - 1, current + 1);
        break;
      case 'ArrowLeft':
        next = current < 0 ? 0 : Math.max(0, current - 1);
        break;
      case 'ArrowDown':
        next = current < 0 ? 0 : current + across();
        if (next > shown.length - 1) next = current;
        break;
      case 'ArrowUp':
        next = current < 0 ? 0 : current - across();
        if (next < 0) next = current;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = shown.length - 1;
        break;
      case 'Delete':
        if (current >= 0) void removePicture(shown[current]);
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next < 0) return;
    selected = shown[next].hash;
    reveal(selected);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key === 'f') {
      event.preventDefault();
      searchField?.focus();
      searchField?.select();
    }
  }
</script>

<svelte:window {onkeydown} />

<div
  class="pictures"
  use:dropTarget={{
    accepts: (p) => p.kind === 'files' && (p.data as string[]).some(isPicturePath),
    ondrop: (e) => void dropped(e),
  }}
>
  <section class="middle" aria-label={t('pictures-title')}>
    <header>
      <div class="search">
        <Search size={15} />
        <input
          bind:this={searchField}
          bind:value={query}
          type="search"
          placeholder={t('pictures-search-placeholder')}
          aria-label={t('common-search')}
          spellcheck="false"
          onkeydown={(e) => {
            if (e.key === 'Escape' && query) {
              query = '';
              e.stopPropagation();
            }
          }}
        />
        {#if query}
          <button
            type="button"
            class="clear"
            aria-label={t('pictures-clear-search')}
            onclick={() => (query = '')}
          >
            <X size={13} />
          </button>
        {/if}
      </div>
      {#if pictures.loaded && all.length}
        <span class="count">
          {#if query}
            {t('pictures-shown', { shown: shown.length, count: all.length })}
          {:else}
            {t('pictures-count', { count: all.length })}
          {/if}
        </span>
      {/if}
      <Button variant="primary" onclick={add}>
        {#snippet icon()}<Plus size={15} />{/snippet}
        {t('pictures-add')}
      </Button>
    </header>

    <div class="body">
      {#if !pictures.loaded}
        <div class="centre"><Spinner size={22} /></div>
      {:else if !all.length}
        <EmptyState icon={Images} title={t('pictures-empty')} text={t('pictures-empty-text')}>
          <Button variant="primary" onclick={add}>{t('pictures-add')}</Button>
        </EmptyState>
      {:else if !shown.length}
        <EmptyState
          icon={SearchX}
          title={t('pictures-nothing-found')}
          text={t('pictures-nothing-found-text')}
        >
          <Button onclick={() => (query = '')}>{t('pictures-clear-search')}</Button>
        </EmptyState>
      {:else}
        <div
          bind:this={grid}
          class="grid"
          role="listbox"
          aria-label={t('pictures-all')}
          tabindex="0"
          onkeydown={gridKey}
        >
          {#each shown as picture (picture.hash)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              class="tile"
              role="option"
              tabindex="-1"
              aria-selected={selected === picture.hash}
              data-hash={picture.hash}
              onpointerdown={(e) => e.button === 0 && select(picture)}
              oncontextmenu={(e) => context(e, picture)}
            >
              <div class="frame">
                <Thumb hash={picture.hash} extension={picture.extension} small alt={picture.alt} />
              </div>
              <div class="under">
                <span class="name truncate">{picture.name || t('pictures-unnamed')}</span>
                {#if picture.note.trim()}
                  <span class="noted" aria-label={t('pictures-with-notes')}
                    ><NotebookPen size={12} /></span
                  >
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </section>

  <aside class="detail" aria-label={t('pictures-picture')}>
    {#if selected}
      {#key selected}
        <PicturePane hash={selected} />
      {/key}
    {/if}
  </aside>
</div>

<style>
  .pictures {
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(360px, 440px);
    height: 100%;
    min-height: 0;
  }
  .pictures:global([data-drop-over]) .middle {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .middle {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    height: var(--bar-h);
    flex: none;
    padding: 0 12px 0 14px;
    border-bottom: 1px solid var(--line);
  }
  .search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--control-h);
    padding: 0 8px 0 10px;
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
    border: 1px solid transparent;
    color: var(--ink-3);
    transition:
      border-color var(--fast) var(--ease),
      background var(--fast) var(--ease);
  }
  .search:focus-within {
    background: var(--paper-raised);
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
  .search input::placeholder {
    color: var(--ink-4);
  }
  .clear {
    display: inline-flex;
    padding: 3px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .clear:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .count {
    flex: none;
    font-size: var(--text-sm);
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }
  .body {
    flex: 1;
    min-height: 0;
  }
  .centre {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
    align-content: start;
    gap: 6px;
    height: 100%;
    padding: 14px;
    overflow-y: auto;
    outline: none;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 8px 8px 7px;
    border-radius: var(--radius-m);
    cursor: default;
    transition: background var(--fast) var(--ease);
  }
  .tile:hover {
    background: var(--paper-hover);
  }
  .tile[aria-selected='true'] {
    background: var(--accent-soft);
  }
  .grid:focus-visible .tile[aria-selected='true'] {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .frame {
    height: 112px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    overflow: hidden;
  }
  .frame :global(.thumb) {
    border-radius: 0;
    padding: 4px;
  }
  .under {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    padding: 0 2px;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .tile[aria-selected='true'] .name {
    color: var(--ink);
  }
  .noted {
    display: inline-flex;
    flex: none;
    color: var(--gold);
  }
  .detail {
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    background: var(--paper-raised);
    border-left: 1px solid var(--line);
  }
</style>
