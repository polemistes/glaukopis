<script lang="ts">
  /**
   * The page of the notebook (records 0101 and stage 2), shaped as the
   * library is: at the left the boxes and the tags (`BoxColumn`); in the
   * middle the notes of what is chosen there, found by words, with New
   * note and Add files over them, a box shown as its surface or as a list;
   * at the right the note: in the list whenever one is chosen, beside the
   * surface when one is opened, until it is closed. Files dropped anywhere
   * on the page are a note each, and a paste while no text and no field
   * has the focus is a new note, in the box in view. The note chosen is
   * named by the route, so that the window comes back to it; how the page
   * is looked at is kept on this computer (`page-view.svelte.ts`).
   */
  import { open as openDialog } from '@tauri-apps/plugin-dialog';
  import { onMount, tick, untrack } from 'svelte';
  import Box from '@lucide/svelte/icons/box';
  import Combine from '@lucide/svelte/icons/combine';
  import FilePlus from '@lucide/svelte/icons/file-plus';
  import Inbox from '@lucide/svelte/icons/inbox';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import List from '@lucide/svelte/icons/list';
  import NotebookPen from '@lucide/svelte/icons/notebook-pen';
  import PanelRightOpen from '@lucide/svelte/icons/panel-right-open';
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
  import { openContextMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { toasts } from '$lib/ui/toast.svelte';
  import BoxColumn from './BoxColumn.svelte';
  import { holderOfNotebook } from './holder';
  import { FIRST_BOX } from './model/boxes';
  import type { Notebook } from './model/notebook.svelte';
  import NoteEditor from './NoteEditor.svelte';
  import NoteList from './NoteList.svelte';
  import { theNotebook } from './open.svelte';
  import {
    boxInView,
    boxName,
    inListOrder,
    neighbourOf,
    NoteSelection,
    readingOrder,
    tagsInView,
  } from './page.svelte';
  import { pageView, type BoxMode } from './page-view.svelte';
  import Surface from './surface/Surface.svelte';
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
  /** The note opened beside the surface; none where none is. */
  let opened = $state<string | null>(null);

  /** The box in view; none for all notes, which are shown as a list only. */
  const inView = $derived(notebook ? boxInView(pageView.box, notebook.boxes) : null);
  const tagsOn = $derived(notebook ? tagsInView(pageView.tags, notebook.tags) : []);
  const mode = $derived<BoxMode>(inView === null ? 'list' : pageView.modeOf(inView));

  const all = $derived(notebook?.list ?? []);
  const shown = $derived(notebook ? notebook.find(query, { box: inView, tags: tagsOn }) : []);
  const chosen = $derived(
    selection.single && notebook?.note(selection.single) ? selection.single : null,
  );
  /** The note at the right: the one chosen in the list; beside the surface, the one opened. */
  const inEditor = $derived(mode === 'list' ? chosen : opened);
  /** The box new notes go into: the one in view, else the first. */
  const intoBox = $derived(inView ?? FIRST_BOX);

  const route = $derived(router.route.view === 'notebook' ? router.route : null);

  onMount(() => {
    void theNotebook.open().catch(() => {});
    if (!library.loaded) void library.load();
    if (!projects.loaded) void projects.load();
  });

  // The note the route names is chosen, once the notebook is read, and when
  // the route names another; its box comes into view, and beside a surface
  // it is opened. What is chosen here is named by the route in its turn,
  // without a step in the history, as the library does.
  let applied: string | undefined;
  let named: string | undefined;
  $effect(() => {
    const wanted = route?.note;
    if (!notebook || wanted === applied) return;
    applied = wanted;
    if (!wanted) return;
    untrack(() => {
      if (!notebook.note(wanted)) return;
      named = wanted;
      choose(wanted);
    });
  });
  $effect(() => {
    // In the list the place names the note chosen; beside a surface the note
    // that is open, so that a card only selected does not come back opened.
    const note = inEditor ?? undefined;
    if (!notebook || note === named || (mode === 'list' && !note && selection.ids.length)) return;
    named = note;
    applied = note;
    untrack(() => {
      if (note !== route?.note) router.replace({ view: 'notebook', note });
    });
  });

  // A note just made takes the cursor once: chosen again later, the focus stays where it is.
  $effect(() => {
    if (fresh && inEditor !== fresh) fresh = null;
  });

  // What is selected must be there: deleted here, or in another window.
  $effect(() => {
    if (!notebook) return;
    const notes = notebook.notes;
    selection.keep((id) => notes.has(id));
  });

  // The note opened beside the surface must be there, in the box in view.
  $effect(() => {
    if (!opened || !notebook) return;
    const note = notebook.note(opened);
    if (!note || (inView !== null && note.box !== inView)) opened = null;
  });

  /** Shows a box, or all notes: what is selected outside it is let go. */
  function showBox(box: string | null) {
    pageView.setBox(box);
    const nb = notebook;
    if (box !== null && nb) selection.keep((id) => nb.note(id)?.box === box);
  }

  /** Shows the box in view as its surface or as a list. */
  function showAs(next: BoxMode) {
    if (inView === null) return;
    pageView.setMode(inView, next);
    if (next === 'surface') opened = null;
    else void tick().then(() => chosen && list?.scrollTo(chosen));
  }

  /**
   * Chooses a note and brings it into view: its box, where a box is in
   * view; the tags and the words searched for are let go where they would
   * hide it. Beside a surface, the note is opened.
   */
  function choose(id: string, options: { fresh?: boolean } = {}) {
    const nb = notebook;
    const note = nb?.note(id);
    if (!nb || !note) return;
    if (inView !== null && note.box !== inView) showBox(note.box);
    if (tagsOn.some((tag) => !note.tags.includes(tag))) pageView.setTags([]);
    if (query && !nb.find(query).some((n) => n.id === id)) query = '';
    fresh = options.fresh ? id : null;
    selection.only(id);
    if (mode === 'surface') opened = id;
    void tick().then(() => list?.scrollTo(id));
  }

  function newNote() {
    const nb = notebook;
    if (!nb) return;
    nb.checkpoint();
    // Made while tags are on, it has them: it is made where they are looked at.
    const id = nb.addNote({ box: intoBox, tags: tagsOn });
    nb.checkpoint();
    query = '';
    choose(id, { fresh: true });
  }

  async function takeIn(paths: string[]): Promise<string[]> {
    const nb = notebook ?? (await theNotebook.open().catch(() => null));
    if (!nb || !paths.length) return [];
    nb.checkpoint();
    const ids = await takeFiles(nb, paths, intoBox);
    nb.checkpoint();
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
    const next =
      mode === 'list'
        ? neighbourOf(
            shown.map((n) => n.id),
            ids,
          )
        : null;
    nb.checkpoint();
    nb.deleteNotes(ids);
    nb.checkpoint();
    selection.only(next);
    if (mode === 'list') list?.focus();
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

  /** Moves notes to a box: those that leave the box in view are let go. */
  function moveTo(ids: string[], box: string) {
    const nb = notebook;
    if (!nb || !ids.length) return;
    nb.checkpoint();
    nb.moveToBox(ids, box);
    nb.checkpoint();
    if (inView !== null && box !== inView) {
      const gone = new Set(ids);
      selection.keep((id) => !gone.has(id));
    }
  }

  /** The notes in the order they are joined in: on a surface as they are read, in a list as it has them. */
  function joinOrder(ids: string[], on: BoxMode): string[] {
    if (on === 'list')
      return inListOrder(
        shown.map((n) => n.id),
        ids,
      );
    // The surface shows every note of its box, whatever is searched for: read among them all.
    const wanted = new Set(ids);
    return readingOrder(all.filter((n) => wanted.has(n.id)));
  }

  /** Joins notes into one, which is chosen; said with Undo. */
  function joinNotes(ids: string[], on: BoxMode) {
    const nb = notebook;
    if (!nb || ids.length < 2) return;
    const order = joinOrder(ids, on);
    const kept = nb.join(order);
    if (!kept) return;
    selection.only(kept);
    if (on === 'surface') opened = kept;
    void tick().then(() => list?.scrollTo(kept));
    toasts.show(
      {
        kind: 'info',
        message: t('notebook-joined', { count: order.length }),
        action: {
          label: t('common-undo'),
          run: () => {
            nb.undo();
            const back = order.filter((id) => nb.note(id));
            if (back.length > 1) {
              selection.set(back);
              if (opened === kept) opened = null;
            }
          },
        },
      },
      7000,
    );
  }

  /** A note divided: the new note is chosen in the list, or opened beside the surface. */
  function divided(id: string) {
    selection.only(id);
    if (mode === 'surface') opened = id;
    void tick().then(() => list?.scrollTo(id));
  }

  /** Opens a note: in the list, its text; beside the surface, the note itself. */
  function openNote(id: string) {
    if (mode === 'surface') {
      selection.only(id);
      opened = id;
      return;
    }
    choose(id);
    void tick().then(() => editor?.focusText());
  }

  function closeNote() {
    opened = null;
  }

  /** The menu of the right button on notes, in the list or on the surface. */
  function context(event: MouseEvent, ids: string[], on: BoxMode) {
    const nb = notebook;
    if (!nb || !ids.length) return;
    const items: MenuItem[] = [];
    if (ids.length === 1)
      items.push({ label: t('common-open'), icon: PanelRightOpen, action: () => openNote(ids[0]) });
    else
      items.push({
        label: t('notebook-join'),
        icon: Combine,
        shortcut: keysFor('notebook-join'),
        action: () => joinNotes(ids, on),
      });
    items.push(
      {
        kind: 'submenu',
        label: t('notebook-move-to'),
        icon: Box,
        items: nb.boxes.map((b) => ({
          label: boxName(b),
          icon: b.id === FIRST_BOX ? Inbox : Box,
          disabled: ids.every((id) => nb.note(id)?.box === b.id),
          action: () => moveTo(ids, b.id),
        })),
      },
      { kind: 'separator' },
      {
        label: t('common-delete'),
        icon: Trash2,
        danger: true,
        shortcut: 'Del',
        action: () => remove(ids),
      },
    );
    openContextMenu(event, items);
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
      nb.checkpoint();
      void takePasted(nb, data, intoBox).then((id) => {
        nb.checkpoint();
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
      'notebook-join': {
        run: () => joinNotes([...selection.ids], mode),
        when: () => selection.ids.length > 1,
      },
      'notebook-divide': {
        run: () => editor?.divide(),
        when: () => !!editor?.canDivide(),
      },
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

{#snippet noteAt(nb: Notebook, id: string, onclose?: () => void)}
  {#key id}
    <NoteEditor
      bind:this={editor}
      notebook={nb}
      holder={holder!}
      {id}
      fresh={fresh === id}
      {onclose}
      ondivided={divided}
    />
  {/key}
{/snippet}

<div
  class="notebook"
  class:surface={mode === 'surface'}
  class:beside={mode === 'surface' && !!inEditor}
  class:empty={!!notebook && !all.length}
  style:--column="{pageView.column}px"
  style:--list="{pageView.list}px"
  style:--note="{pageView.note}px"
  data-notebook
  data-shown-as={mode}
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
  {:else}
    <nav class="boxes" aria-label={t('notebook-boxes')}>
      <BoxColumn
        {notebook}
        box={inView}
        tags={tagsOn}
        onchoose={showBox}
        ontags={(tags) => pageView.setTags(tags)}
        onmoveto={moveTo}
        ondeleted={(box) => pageView.forget(box)}
      />
    </nav>
    <Divider
      label={t('notebook-resize-column')}
      onmove={(dx) => pageView.moveColumn(dx)}
      onreset={() => pageView.resetColumn()}
    />

    <section class="middle" aria-label={t('notebook-notes')}>
      {#if !all.length}
        <div class="centre" data-notebook-empty>
          <EmptyState
            icon={NotebookPen}
            title={t('notebook-empty')}
            text={t('notebook-empty.text')}
          >
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
                } else if (e.key === 'ArrowDown' && shown.length && mode === 'list') {
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
          {#if inView !== null}
            <span class="shown-as" data-shown-as-choice>
              <Segmented
                value={mode}
                label={t('notebook-shown-as')}
                size="sm"
                options={[
                  {
                    value: 'surface',
                    label: t('notebook-surface'),
                    icon: LayoutDashboard,
                    iconOnly: true,
                  },
                  { value: 'list', label: t('notebook-list'), icon: List, iconOnly: true },
                ]}
                onchange={showAs}
              />
            </span>
          {/if}
        </header>
        <div class="body">
          {#if mode === 'surface' && inView !== null}
            {#key inView}
              {@const box = inView}
              <Surface
                {notebook}
                {box}
                bind:selection={selection.ids}
                camera={pageView.cameraOf(box)}
                oncamera={(camera) => pageView.setCamera(box, camera)}
                onopen={openNote}
                ondelete={remove}
                oncontext={(event, ids) => context(event, ids, 'surface')}
              />
            {/key}
          {:else if shown.length}
            <NoteList
              bind:this={list}
              notes={shown}
              {selection}
              onopen={() => editor?.focusText()}
              ondelete={remove}
              oncontext={(event, ids) => context(event, ids, 'list')}
            />
          {:else if query || tagsOn.length}
            <EmptyState compact icon={SearchX} title={t('notebook-nothing-found')}>
              {#if query}
                <Button onclick={() => (query = '')}>{t('notebook-search-clear')}</Button>
              {/if}
              {#if tagsOn.length}
                <Button onclick={() => pageView.setTags([])}>{t('notebook-tags-off')}</Button>
              {/if}
            </EmptyState>
          {:else}
            <EmptyState compact icon={Inbox} title={t('notebook-box-empty')}>
              <Button onclick={newNote}>
                {#snippet icon()}<Plus size={15} />{/snippet}
                {t('notebook-new-note')}
              </Button>
            </EmptyState>
          {/if}
        </div>
      {/if}
    </section>

    {#if all.length && mode === 'list'}
      <Divider
        label={t('notebook-resize-list')}
        onmove={(dx) => pageView.moveList(dx)}
        onreset={() => pageView.resetList()}
      />
      <section class="chosen" aria-label={t('notebook-note')}>
        {#if inEditor && holder}
          {@render noteAt(notebook, inEditor)}
        {:else}
          <p class="none" data-notebook-none>
            {selection.ids.length > 1
              ? t('notebook-selected', { count: selection.ids.length })
              : t('notebook-choose')}
          </p>
        {/if}
      </section>
    {:else if all.length && inEditor && holder}
      <Divider
        label={t('notebook-resize-note')}
        onmove={(dx) => pageView.moveNote(dx)}
        onreset={() => pageView.resetNote()}
      />
      <section class="chosen" aria-label={t('notebook-note')} data-note-beside>
        {@render noteAt(notebook, inEditor, closeNote)}
      </section>
    {/if}
  {/if}
</div>

<!-- The pickers the editor asks for: a reference to cite, a citation's place. -->
<EditorHost project={null} />

<style>
  /* The boxes, the notes and the note, as the library has its collections,
     its list and its pane: the list as wide as it was dragged to be, the
     note taking the rest; beside a surface, the surface takes the rest. */
  .notebook {
    display: grid;
    grid-template-columns:
      minmax(0, var(--column)) auto minmax(0, var(--list)) auto
      minmax(0, 1fr);
    flex: 1;
    height: 100%;
    min-height: 0;
  }
  .notebook.surface,
  .notebook.empty {
    grid-template-columns: minmax(0, var(--column)) auto minmax(0, 1fr);
  }
  .notebook.surface.beside {
    grid-template-columns:
      minmax(0, var(--column)) auto minmax(0, 1fr) auto
      minmax(0, var(--note));
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
  .boxes {
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    background: var(--paper-sunken);
  }
  .middle {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    background: var(--paper-raised);
  }
  .surface .middle {
    background: var(--paper);
  }
  header {
    display: flex;
    align-items: center;
    gap: 4px;
    height: var(--bar-h);
    flex: none;
    padding: 0 8px 0 12px;
    border-bottom: 1px solid var(--line);
    background: var(--paper-raised);
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
  .shown-as {
    display: inline-flex;
    flex: none;
    margin-left: 4px;
  }
  .body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .body > :global(*) {
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
  /* In a narrow window the boxes stand over the notes as a strip, and the
     notes over the note. */
  @media (max-width: 640px) {
    .notebook,
    .notebook.surface,
    .notebook.empty,
    .notebook.surface.beside {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 40%) minmax(0, 1fr);
    }
    .notebook.empty,
    .notebook.surface:not(.beside) {
      grid-template-rows: auto minmax(0, 1fr);
    }
    .notebook > :global(.divider) {
      display: none;
    }
    .boxes {
      max-height: 28vh;
      border-bottom: 1px solid var(--line);
    }
    .middle {
      border-bottom: 1px solid var(--line);
    }
  }
</style>
