<script lang="ts">
  /**
   * The page of the notebook (record 0101): the notes in a column at the
   * left, newest first, found by words, with New note and Add files over
   * them; the note chosen at the right. Files dropped anywhere on the page
   * are a note each, and a paste while no text and no field has the focus
   * is a new note. The note chosen is named by the route, so that the window
   * comes back to it.
   */
  import { open as openDialog } from '@tauri-apps/plugin-dialog';
  import { onMount, tick, untrack } from 'svelte';
  import FilePlus from '@lucide/svelte/icons/file-plus';
  import NotebookPen from '@lucide/svelte/icons/notebook-pen';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import SearchX from '@lucide/svelte/icons/search-x';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import EditorHost from '$lib/editor/EditorHost.svelte';
  import { t } from '$lib/i18n';
  import { keysFor, shortcuts } from '$lib/shell/keys.svelte';
  import { testHook } from '$lib/shell/testing';
  import { library } from '$lib/state/library.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Divider from '$lib/ui/Divider.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { toasts } from '$lib/ui/toast.svelte';
  import { holderOfNotebook } from './holder';
  import { pageView } from './page-view.svelte';
  import type { Notebook } from './model/notebook.svelte';
  import NoteEditor from './NoteEditor.svelte';
  import NoteList from './NoteList.svelte';
  import { theNotebook } from './open.svelte';
  import { neighbourOf, NoteSelection } from './page.svelte';
  import { takeFiles, takePasted } from './taking';

  const notebook = $derived(theNotebook.current);
  const holder = $derived(notebook ? holderOfNotebook(notebook) : null);

  let query = $state('');
  const selection = new NoteSelection();
  let searchField = $state<HTMLInputElement>();
  let list = $state<ReturnType<typeof NoteList>>();
  let editor = $state<ReturnType<typeof NoteEditor>>();
  /** The note just made, whose text takes the cursor when it is shown. */
  let fresh = $state<string | null>(null);

  const all = $derived(notebook?.list ?? []);
  const shown = $derived(notebook ? notebook.find(query) : []);
  const chosen = $derived(
    selection.single && notebook?.note(selection.single) ? selection.single : null,
  );

  const route = $derived(router.route.view === 'notebook' ? router.route : null);

  onMount(() => {
    void theNotebook.open().catch(() => {});
    if (!library.loaded) void library.load();
    if (!projects.loaded) void projects.load();
  });

  // The note the route names is chosen, once the notebook is read, and when
  // the route names another; what is chosen here is named by the route in
  // its turn, without a step in the history, as the library does.
  let applied: string | undefined;
  let named: string | undefined;
  $effect(() => {
    const wanted = route?.note;
    if (!notebook || wanted === applied) return;
    applied = wanted;
    if (wanted && untrack(() => notebook.note(wanted))) {
      named = wanted;
      selection.only(wanted);
      void tick().then(() => list?.scrollTo(wanted));
    }
  });
  $effect(() => {
    const note = chosen ?? undefined;
    if (!notebook || note === named || (!note && selection.ids.length)) return;
    named = note;
    applied = note;
    untrack(() => {
      if (note !== route?.note) router.replace({ view: 'notebook', note });
    });
  });

  // A note just made takes the cursor once: chosen again later, the focus stays where it is.
  $effect(() => {
    if (fresh && chosen !== fresh) fresh = null;
  });

  // What is selected must be there: deleted here, or in another window.
  $effect(() => {
    if (!notebook) return;
    const notes = notebook.notes;
    selection.keep((id) => notes.has(id));
  });

  /** Chooses a note: what is searched for is cleared where it would hide it. */
  function choose(id: string, options: { fresh?: boolean } = {}) {
    if (query && !shown.some((n) => n.id === id)) query = '';
    fresh = options.fresh ? id : null;
    selection.only(id);
    void tick().then(() => list?.scrollTo(id));
  }

  function newNote() {
    const nb = notebook;
    if (!nb) return;
    nb.undoManager.stopCapturing();
    const id = nb.addNote();
    nb.undoManager.stopCapturing();
    query = '';
    choose(id, { fresh: true });
  }

  async function takeIn(paths: string[]): Promise<string[]> {
    const nb = notebook ?? (await theNotebook.open().catch(() => null));
    if (!nb || !paths.length) return [];
    nb.undoManager.stopCapturing();
    const ids = await takeFiles(nb, paths);
    nb.undoManager.stopCapturing();
    if (ids.length) choose(ids[0]);
    return ids;
  }

  async function addFiles() {
    const chosenPaths = await openDialog({ title: t('notebook-add-files-title'), multiple: true });
    if (!chosenPaths) return;
    await takeIn(Array.isArray(chosenPaths) ? chosenPaths : [chosenPaths]);
  }

  function remove(ids: string[]) {
    const nb = notebook;
    if (!nb || !ids.length) return;
    const next = neighbourOf(
      shown.map((n) => n.id),
      ids,
    );
    nb.undoManager.stopCapturing();
    nb.deleteNotes(ids);
    nb.undoManager.stopCapturing();
    selection.only(next);
    list?.focus();
    toasts.show(
      {
        kind: 'info',
        message: t('notebook-deleted', { count: ids.length }),
        action: {
          label: t('common-undo'),
          run: () => {
            nb.undo();
            const back = ids.filter((id) => nb.note(id));
            if (back.length) {
              selection.set(back);
              void tick().then(() => list?.scrollTo(back[0]));
            }
          },
        },
      },
      7000,
    );
  }

  function context(event: MouseEvent, ids: string[]) {
    openContextMenu(event, [
      {
        label: t('common-delete'),
        icon: Trash2,
        danger: true,
        shortcut: 'Del',
        action: () => remove(ids),
      },
    ]);
  }

  /** Whether something takes a paste itself: a field or a text, or what is in a dialog. */
  function takesPaste(node: unknown): boolean {
    if (!(node instanceof Element)) return false;
    if (node.closest('input, textarea, select, [contenteditable="true"], dialog')) return true;
    return node instanceof HTMLElement && node.isContentEditable;
  }

  /** Whether a paste is the page's: no text, no field and no dialog has the focus, nor is it aimed at one. */
  function pasteIsOurs(event: Event): boolean {
    if (event.defaultPrevented || document.querySelector('dialog[open]')) return false;
    return !takesPaste(document.activeElement) && !takesPaste(event.target);
  }

  // A paste while no text and no field has the focus is a new note. On
  // Linux it comes as an event the page makes, with what the Rust side read
  // (`util/paste.ts`), aimed where the focus was. WebKit pastes where
  // nothing can be written only where `beforepaste` was cancelled, which
  // says the page takes the paste itself.
  onMount(() => {
    const onbeforepaste = (event: Event) => {
      if (pasteIsOurs(event)) event.preventDefault();
    };
    const onpaste = (event: ClipboardEvent) => {
      if (!pasteIsOurs(event)) return;
      const data = event.clipboardData;
      const nb = notebook;
      if (!data || !nb) return;
      event.preventDefault();
      nb.undoManager.stopCapturing();
      void takePasted(nb, data).then((id) => {
        nb.undoManager.stopCapturing();
        if (id) choose(id);
      });
    };
    window.addEventListener('beforepaste', onbeforepaste);
    window.addEventListener('paste', onpaste);
    return () => {
      window.removeEventListener('beforepaste', onbeforepaste);
      window.removeEventListener('paste', onpaste);
    };
  });

  // The keys of the notebook, while it is shown: see `shell/keys`.
  onMount(() =>
    shortcuts.bind({
      'notebook-find': () => {
        searchField?.focus();
        searchField?.select();
      },
      'notebook-new': () => newNote(),
      'notebook-undo': () => notebook?.undo(),
      'notebook-redo': () => notebook?.redo(),
      'notebook-redo-y': () => notebook?.redo(),
    }),
  );

  // The scripts cannot answer the system's dialog of files: they hand its answer here.
  onMount(() => {
    testHook('__glaukopisNotebook', { addFiles: (paths: string[]) => takeIn(paths) });
    return () => testHook('__glaukopisNotebook', undefined);
  });
</script>

{#snippet adding(nb: Notebook | null)}
  <IconButton
    label={t('notebook-new-note')}
    shortcut={keysFor('notebook-new')}
    disabled={!nb}
    data-new-note
    onclick={newNote}
  >
    <Plus size={16} />
  </IconButton>
  <IconButton
    label={t('notebook-add-files')}
    disabled={!nb}
    data-add-files
    onclick={() => void addFiles()}
  >
    <FilePlus size={16} />
  </IconButton>
{/snippet}

<div
  class="notebook"
  style:--list="{pageView.list}px"
  data-notebook
  use:dropTarget={{
    accepts: (p) => p.kind === 'files',
    ondrop: (e) => void takeIn(e.payload.data as string[]),
  }}
>
  {#if !notebook}
    <div class="centre">
      {#if theNotebook.failure}
        <EmptyState icon={NotebookPen} title={t('notebook-unreadable')} text={theNotebook.failure}>
          <Button onclick={() => void theNotebook.open().catch(() => {})}
            >{t('common-try-again')}</Button
          >
        </EmptyState>
      {:else}
        <Spinner size={22} />
      {/if}
    </div>
  {:else if !all.length}
    <div class="centre" data-notebook-empty>
      <EmptyState icon={NotebookPen} title={t('notebook-empty')} text={t('notebook-empty.text')}>
        <Button variant="primary" onclick={newNote}>
          {#snippet icon()}<Plus size={15} />{/snippet}
          {t('notebook-new-note')}
        </Button>
        <Button onclick={() => void addFiles()}>
          {#snippet icon()}<FilePlus size={15} />{/snippet}
          {t('notebook-add-files')}
        </Button>
      </EmptyState>
    </div>
  {:else}
    <section class="side" aria-label={t('notebook-notes')}>
      <header>
        <div class="search">
          <Search size={14} />
          <input
            bind:this={searchField}
            bind:value={query}
            type="search"
            placeholder={t('notebook-search')}
            aria-label={t('notebook-search')}
            spellcheck="false"
            data-notebook-search
            onkeydown={(e) => {
              if (e.key === 'Escape' && query) {
                query = '';
                e.stopPropagation();
              } else if (e.key === 'ArrowDown' && shown.length) {
                e.preventDefault();
                if (!selection.ids.length) selection.only(shown[0].id);
                list?.focus();
              }
            }}
          />
          {#if query}
            <button
              type="button"
              class="clear"
              aria-label={t('notebook-search-clear')}
              onclick={() => (query = '')}
            >
              <X size={13} />
            </button>
          {/if}
        </div>
        {@render adding(notebook)}
      </header>
      <div class="body">
        {#if shown.length}
          <NoteList
            bind:this={list}
            notes={shown}
            {selection}
            onopen={() => editor?.focusText()}
            ondelete={remove}
            oncontext={context}
          />
        {:else}
          <EmptyState compact icon={SearchX} title={t('notebook-nothing-found')}>
            <Button onclick={() => (query = '')}>{t('notebook-search-clear')}</Button>
          </EmptyState>
        {/if}
      </div>
    </section>

    <Divider
      label={t('notebook-resize-list')}
      onmove={(dx) => pageView.moveList(dx)}
      onreset={() => pageView.resetList()}
    />

    <section class="chosen" aria-label={t('notebook-note')}>
      {#if chosen && holder}
        {#key chosen}
          <NoteEditor bind:this={editor} {notebook} {holder} id={chosen} fresh={fresh === chosen} />
        {/key}
      {:else}
        <p class="none" data-notebook-none>
          {selection.ids.length > 1
            ? t('notebook-selected', { count: selection.ids.length })
            : t('notebook-choose')}
        </p>
      {/if}
    </section>
  {/if}
</div>

<!-- The pickers the editor asks for: a reference to cite, a citation's place. -->
<EditorHost project={null} />

<style>
  .notebook {
    display: grid;
    grid-template-columns: minmax(0, var(--list)) auto minmax(0, 1fr);
    flex: 1;
    height: 100%;
    min-height: 0;
  }
  .notebook:global([data-drop-over]) {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .centre {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .side {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: var(--paper-raised);
  }
  header {
    display: flex;
    align-items: center;
    gap: 4px;
    height: var(--bar-h);
    flex: none;
    padding: 0 8px 0 12px;
    border-bottom: 1px solid var(--line);
  }
  .search {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    height: 28px;
    margin-right: 4px;
    padding: 0 8px 0 9px;
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
    border: 1px solid transparent;
    color: var(--ink-3);
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
  .body {
    flex: 1;
    min-height: 0;
  }
  .chosen {
    min-width: 0;
    min-height: 0;
    background: var(--paper);
  }
  .none {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    margin: 0;
    color: var(--ink-4);
  }
  /* In a narrow window the list stands over the note. */
  @media (max-width: 640px) {
    .notebook {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 40%) minmax(0, 1fr);
    }
    .notebook > :global(.divider) {
      display: none;
    }
    .side {
      border-bottom: 1px solid var(--line);
    }
  }
</style>
