<script lang="ts">
  /**
   * The notes of the notebook in the document pane of a project (record
   * 0101): found by their words, looked at as they are, and dragged into
   * the text, a whole note by its head or a piece of it by itself. Many
   * notes are drawn as the list is scrolled to them, never all at once.
   */
  import { onMount, untrack, type Snippet } from 'svelte';
  import type { EditorView } from 'prosemirror-view';
  import NotebookIcon from '@lucide/svelte/icons/notebook';
  import FileInput from '@lucide/svelte/icons/file-input';
  import Search from '@lucide/svelte/icons/search';
  import X from '@lucide/svelte/icons/x';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import { openProjects } from '$lib/project/open-projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import NoteCard from './NoteCard.svelte';
  import { theNotebook } from './open.svelte';
  import { elementOf, piecesIntoText } from './out';

  interface Props {
    project: Project;
    onclose: () => void;
    /** What stands at the head of the panel in place of its name: the tabs of the document pane. */
    head?: Snippet;
  }

  let { project, onclose, head }: Props = $props();

  /** How many cards are drawn at a time, and more as the list is scrolled to its end. */
  const BATCH = 30;

  let query = $state('');
  let drawn = $state(BATCH);
  let list = $state<HTMLDivElement>();
  let end = $state<HTMLDivElement>();
  /** The text of the project that had the cursor last: where a note is put when that is asked for. */
  let written: EditorView | null = null;

  onMount(() => {
    // Said in the panel where it cannot be read.
    theNotebook.open().catch(() => {});
  });

  const notebook = $derived(theNotebook.current);
  const found = $derived(notebook ? notebook.find(query) : []);
  const shown = $derived(found.slice(0, drawn));
  const projectId = $derived(openProjects.all().find((o) => o.project === project)?.id);

  // A new search begins at the top, with the first batch.
  $effect(() => {
    void query;
    untrack(() => {
      drawn = BATCH;
      list?.scrollTo({ top: 0 });
    });
  });

  // More cards are drawn when the end of those drawn comes into view.
  $effect(() => {
    if (!end || !list) return;
    const watch = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) drawn += BATCH;
      },
      { root: list, rootMargin: '400px 0px' },
    );
    watch.observe(end);
    return () => watch.disconnect();
  });

  $effect(() => {
    const s = editorUi.selection;
    if (s?.kind === 'body' && elementOf(project, s.view)) written = s.view;
  });

  /** The text of the project a note is put into when that is asked for: the one that has the cursor, or had it last. */
  function text(): EditorView | null {
    const s = editorUi.selection;
    if (s?.kind === 'body' && elementOf(project, s.view)) return s.view;
    return written && !written.isDestroyed && written.dom.isConnected ? written : null;
  }

  function open(note?: string) {
    router.go(note ? { view: 'notebook', note } : { view: 'notebook' });
  }

  function menu(event: MouseEvent, note: string) {
    const view = text();
    openContextMenu(event, [
      ...(view
        ? [
            {
              label: t('notebook-pane-put-into-text'),
              icon: FileInput,
              action: () => void piecesIntoText(project, view, null, { note, pieces: null }),
            },
          ]
        : []),
      { label: t('notebook-pane-open-note'), icon: NotebookIcon, action: () => open(note) },
    ]);
  }
</script>

<aside class="panel" aria-label={t('notebook-notes')} data-beside-text>
  <header>
    {#if head}{@render head()}{:else}<h2>{t('notebook-notes')}</h2>{/if}
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <div class="tools">
    <div class="search">
      <Search size={14} />
      <input
        bind:value={query}
        type="search"
        placeholder={t('common-search')}
        aria-label={t('notebook-pane-find')}
        spellcheck="false"
      />
    </div>
    <IconButton label={t('notebook-pane-open')} size="sm" onclick={() => open()}>
      <NotebookIcon size={15} />
    </IconButton>
  </div>

  <div class="body">
    {#if notebook}
      {#if shown.length}
        <div bind:this={list} class="list" role="list" aria-label={t('notebook-notes')}>
          {#each shown as note (note.id)}
            <div role="listitem">
              <NoteCard
                {notebook}
                {note}
                used={!!projectId && note.went.some((w) => w.project === projectId)}
                onopen={open}
                onmenu={menu}
              />
            </div>
          {/each}
          {#if shown.length < found.length}
            <div bind:this={end} class="end" aria-hidden="true"></div>
          {/if}
        </div>
      {:else if query.trim()}
        <EmptyState compact title={t('notebook-pane-nothing-found')} />
      {:else}
        <EmptyState compact icon={NotebookIcon} title={t('notebook-pane-empty')}>
          <Button size="sm" onclick={() => open()}>{t('notebook-pane-open')}</Button>
        </EmptyState>
      {/if}
    {:else if theNotebook.failure}
      <EmptyState compact title={t('notebook-pane-unread')} text={theNotebook.failure} />
    {/if}
  </div>

  {#if notebook && shown.length}
    <footer>{t('notebook-pane-drag')}</footer>
  {/if}
</aside>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    min-height: 0;
    background: var(--paper-raised);
  }
  header {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 40px;
    flex: none;
    padding: 0 8px 0 16px;
  }
  h2 {
    flex: 1;
    font-size: var(--text-md);
    font-weight: 600;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px 10px 12px;
    border-bottom: 1px solid var(--line);
  }
  .search {
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: 7px;
    height: 28px;
    padding: 0 9px;
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
    color: var(--ink-3);
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
  .body {
    flex: 1;
    min-height: 0;
  }
  .list {
    height: 100%;
    overflow-y: auto;
    padding-top: 10px;
  }
  .end {
    height: 1px;
  }
  footer {
    flex: none;
    padding: 8px 16px 10px;
    border-top: 1px solid var(--line);
    font-size: var(--text-xs);
    color: var(--ink-4);
    line-height: 1.5;
  }
</style>
