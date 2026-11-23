<script lang="ts" module>
  /** What is searched for, kept while the page lives: a note opened and left finds the list as it was. */
  const finding = $state({ query: '' });
</script>

<script lang="ts">
  /**
   * The notes, the phone's first place: at the top a row with the field
   * that finds, the filter's button and the settings' button; under it the
   * line, where something waits or is wrong; then the notes, newest first,
   * in the box in view and with the tags that are on; and *New note*, a
   * round button at the foot, over the list.
   */
  import ListFilter from '@lucide/svelte/icons/list-filter';
  import NotebookPen from '@lucide/svelte/icons/notebook-pen';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import SearchX from '@lucide/svelte/icons/search-x';
  import Settings from '@lucide/svelte/icons/settings';
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import type { Notebook } from '$lib/notebook/model/notebook.svelte';
  import { theNotebook } from '$lib/notebook/open.svelte';
  import { boxInView, tagsInView } from '$lib/notebook/page.svelte';
  import { pageView } from '$lib/notebook/page-view.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import FilterSheet from './FilterSheet.svelte';
  import Line from './Line.svelte';
  import NoteRows from './NoteRows.svelte';
  import { places } from './places.svelte';
  import TopBar from './TopBar.svelte';

  let { notebook }: { notebook: Notebook | null } = $props();

  let filtering = $state(false);

  /** The box in view; none for all notes. */
  const inView = $derived(notebook ? boxInView(pageView.box, notebook.boxes) : null);
  const tagsOn = $derived(notebook ? tagsInView(pageView.tags, notebook.tags) : []);
  const found = $derived(
    notebook ? notebook.find(finding.query, { box: inView, tags: tagsOn }) : [],
  );
  /** How many of the filters are on: a box in view, and each tag. */
  const on = $derived((inView === null ? 0 : 1) + tagsOn.length);

  /** A note in the box in view, or where all notes are shown in the box that receives, with the tags that are on; then to it. */
  function newNote() {
    const nb = notebook;
    if (!nb) return;
    nb.checkpoint();
    const id = nb.addNote({ box: inView ?? nb.receiving, tags: tagsOn });
    nb.checkpoint();
    finding.query = '';
    places.go({ at: 'note', note: id, fresh: true });
  }

  /** Enter in the field: the keyboard goes down, and the notes found are seen whole. */
  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') (event.currentTarget as HTMLInputElement).blur();
  }
</script>

<section class="place" data-phone-notes>
  <TopBar>
    <div class="find">
      <TextField
        bind:value={finding.query}
        type="search"
        inputmode="search"
        enterkeyhint="search"
        placeholder={t('notebook-search')}
        aria-label={t('notebook-search')}
        data-phone-find
        {onkeydown}
      >
        {#snippet leading()}<Search size={18} />{/snippet}
        {#snippet trailing()}
          {#if finding.query}
            <IconButton
              label={t('notebook-search-clear')}
              data-phone-find-clear
              onclick={() => (finding.query = '')}
            >
              <X size={18} />
            </IconButton>
          {/if}
        {/snippet}
      </TextField>
    </div>
    <IconButton
      label={on ? t('notebook-filters-on', { count: on }) : t('notebook-filters')}
      active={on > 0}
      aria-expanded={filtering}
      data-phone-filter
      data-on={on > 0 ? '' : undefined}
      disabled={!notebook}
      onclick={() => (filtering = true)}
    >
      <ListFilter size={22} />
    </IconButton>
    <IconButton
      label={t('settings-title')}
      data-phone-to-settings
      onclick={() => places.go({ at: 'settings' })}
    >
      <Settings size={22} />
    </IconButton>
  </TopBar>

  <Line />

  {#if !notebook}
    <div class="centre" data-phone-empty={theNotebook.failure ? 'unreadable' : 'reading'}>
      {#if theNotebook.failure}
        <EmptyState
          icon={NotebookPen}
          title={t('notebook-unreadable')}
          text={theNotebook.failure}
        />
      {:else}
        <Spinner size={22} />
      {/if}
    </div>
  {:else if !notebook.notes.size}
    <div class="centre" data-phone-empty="empty">
      <EmptyState icon={NotebookPen} title={t('notebook-empty')} text={t('notebook-empty.text')} />
    </div>
  {:else if !found.length}
    <div class="centre" data-phone-empty="nothing-found">
      <EmptyState icon={SearchX} title={t('notebook-nothing-found')} />
    </div>
  {:else}
    <NoteRows {notebook} notes={found} />
  {/if}

  {#if notebook}
    <button
      type="button"
      class="new"
      aria-label={t('notebook-new-note')}
      data-phone-new
      onclick={newNote}
    >
      <Plus size={26} />
    </button>
    <FilterSheet {notebook} open={filtering} onclose={() => (filtering = false)} />
  {/if}
</section>

<style>
  .place {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }
  .find {
    flex: 1;
    min-width: 0;
  }
  /* The × within the field: as high as the field, at its right edge. */
  .find :global(.adornment .icon-button) {
    margin-right: -9px;
    height: calc(var(--control-h) - 2px);
  }
  .find :global(input::-webkit-search-cancel-button) {
    display: none;
  }
  .centre {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    padding: 0 var(--phone-gutter, 16px);
  }
  .new {
    position: absolute;
    right: var(--phone-gutter, 16px);
    bottom: var(--phone-gutter, 16px);
    z-index: 10;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--accent);
    color: var(--accent-ink);
    box-shadow: var(--shadow-2);
    cursor: pointer;
  }
  .new:active {
    background: var(--accent-strong);
  }
</style>
