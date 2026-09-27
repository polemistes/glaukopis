<script lang="ts">
  import { save } from '@tauri-apps/plugin-dialog';
  import { onMount } from 'svelte';
  import ArrowDownUp from '@lucide/svelte/icons/arrow-down-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ClipboardPaste from '@lucide/svelte/icons/clipboard-paste';
  import CopyCheck from '@lucide/svelte/icons/copy-check';
  import FileText from '@lucide/svelte/icons/file-text';
  import DuplicatesDialog from './DuplicatesDialog.svelte';
  import Copy from '@lucide/svelte/icons/copy';
  import FileDown from '@lucide/svelte/icons/file-down';
  import FileUp from '@lucide/svelte/icons/file-up';
  import FolderMinus from '@lucide/svelte/icons/folder-minus';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import SearchX from '@lucide/svelte/icons/search-x';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import {
    attachmentOpen,
    collectionAdd,
    collectionList,
    collectionRemove,
    libraryExport,
    libraryGet,
    libraryRemove,
    librarySource,
    type Summary,
  } from '$lib/api/library';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import { library, search, sortEntries, type SortKey } from '$lib/state/library.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import CollectionTree from './CollectionTree.svelte';
  import { plural } from './format';
  import ReferenceList from './ReferenceList.svelte';
  import ReferencePane from './ReferencePane.svelte';
  import {
    importDropped,
    importFile,
    importFromZotero,
    importPasted,
    importPdfFiles,
    newReference,
  } from './references.svelte';

  let findingDuplicates = $state(false);
  let query = $state('');
  let sortKey = $state<SortKey>('authors');
  let descending = $state(false);
  let selection = $state<string[]>([]);
  let searchField = $state<HTMLInputElement>();
  let list = $state<ReturnType<typeof ReferenceList>>();

  const route = $derived(
    router.route.view === 'library' ? router.route : { view: 'library' as const },
  );
  const collectionId = $derived(
    route.collection && library.collection(route.collection) ? route.collection : null,
  );
  const collection = $derived(library.collection(collectionId));

  const scoped = $derived.by(() => {
    if (!collectionId) return library.entries;
    const ids = library.idsIn(collectionId);
    return library.entries.filter((e) => ids.has(e.id));
  });
  const shown = $derived(sortEntries(search(scoped, query), sortKey, descending));
  const single = $derived(selection.length === 1 ? selection[0] : null);

  onMount(() => {
    library.load();
    const onfocus = () => library.checkForChanges();
    window.addEventListener('focus', onfocus);
    return () => window.removeEventListener('focus', onfocus);
  });

  // Open the entry the route names.
  $effect(() => {
    const wanted = route.entry;
    if (wanted && library.loaded && library.get(wanted)) {
      selection = [wanted];
      queueMicrotask(() => list?.scrollTo(wanted));
    }
  });

  // What is selected must exist.
  $effect(() => {
    const present = selection.filter((id) => library.get(id));
    if (present.length !== selection.length) selection = present;
  });

  function selectCollection(id: string | null) {
    selection = [];
    router.go({ view: 'library', collection: id ?? undefined });
  }

  async function add() {
    const added = await newReference({ collection: collectionId });
    if (added) {
      query = '';
      selection = [added.id];
      queueMicrotask(() => list?.scrollTo(added.id));
    }
  }

  async function remove(entries: Summary[]) {
    if (!entries.length) return;
    const one = entries.length === 1 ? entries[0] : null;
    const files = entries.reduce((n, e) => n + e.attachments, 0);
    const ok = await confirm({
      title: one
        ? `Delete “${one.title || one.key}”?`
        : `Delete ${plural(entries.length, 'reference')}?`,
      message:
        'This removes ' +
        (one ? 'the reference' : 'them') +
        ' from your library, from every collection' +
        (files ? `, together with ${plural(files, 'attached file')}` : '') +
        '. Citations of ' +
        (one ? 'it' : 'them') +
        ' in your projects will no longer resolve.',
      confirm: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      const ids = entries.map((e) => e.id);
      await libraryRemove(ids);
      library.forget(ids);
      selection = [];
    } catch (error) {
      notifyError('The references could not be deleted', error);
    }
  }

  async function addTo(collection: string, ids: string[]) {
    try {
      const n = await collectionAdd(collection, ids);
      library.setCollections(await collectionList());
      const name = library.collection(collection)?.name ?? '';
      notifyOk(n ? `${plural(n, 'reference')} added to “${name}”` : `Already in “${name}”`);
    } catch (error) {
      notifyError('That could not be done', error);
    }
  }

  async function removeFrom(collection: string, ids: string[]) {
    try {
      await collectionRemove(collection, ids);
      library.setCollections(await collectionList());
      selection = [];
    } catch (error) {
      notifyError('That could not be done', error);
    }
  }

  async function exportEntries(ids: string[] | null, name: string) {
    const path = await save({
      title: 'Export references',
      defaultPath: `${name}.bib`,
      filters: [{ name: 'BibLaTeX', extensions: ['bib'] }],
    });
    if (!path) return;
    try {
      const n = await libraryExport(path, ids);
      notifyOk(`${plural(n, 'reference')} exported`);
    } catch (error) {
      notifyError('The export failed', error);
    }
  }

  function collectionItems(ids: string[]): MenuItem[] {
    const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
    const walk = (parent: string | null, depth: number): MenuItem[] =>
      library.collections
        .filter((c) => (c.parent ?? null) === parent)
        .sort((a, b) => collator.compare(a.name, b.name))
        .flatMap((c) => [
          {
            label: ' '.repeat(depth) + c.name,
            action: () => addTo(c.id, ids),
          } as MenuItem,
          ...walk(c.id, depth + 1),
        ]);
    return walk(null, 0);
  }

  function context(event: MouseEvent, entries: Summary[]) {
    const ids = entries.map((e) => e.id);
    const one = entries.length === 1 ? entries[0] : null;
    const collections = collectionItems(ids);
    openContextMenu(event, [
      ...(one && one.attachments
        ? [
            {
              label: 'Open the file',
              icon: Paperclip,
              action: async () => {
                try {
                  const full = await libraryGet(one.id);
                  const file = full.files.find((f) => f.exists);
                  if (file) await attachmentOpen(file.path);
                } catch (error) {
                  notifyError('The file could not be opened', error);
                }
              },
            } as MenuItem,
            { kind: 'separator' } as MenuItem,
          ]
        : []),
      {
        kind: 'submenu',
        label: 'Add to collection',
        icon: FolderPlus,
        disabled: !collections.length,
        items: collections,
      },
      ...(collection
        ? [
            {
              label: `Remove from “${collection.name}”`,
              icon: FolderMinus,
              action: () => removeFrom(collection.id, ids),
            } as MenuItem,
          ]
        : []),
      { kind: 'separator' },
      ...(one
        ? [
            {
              label: 'Copy citation key',
              icon: Copy,
              action: () => {
                navigator.clipboard.writeText(one.key);
                notifyOk(`Copied “${one.key}”`);
              },
            } as MenuItem,
          ]
        : []),
      {
        label: 'Copy as BibLaTeX',
        action: async () => {
          const sources = await Promise.all(ids.map((id) => librarySource(id)));
          navigator.clipboard.writeText(sources.join('\n'));
          notifyOk('Copied');
        },
      },
      {
        label: one ? 'Export…' : `Export ${entries.length} references…`,
        icon: FileDown,
        action: () => exportEntries(ids, one ? one.key : 'references'),
      },
      { kind: 'separator' },
      {
        label: 'Delete',
        icon: Trash2,
        danger: true,
        shortcut: 'Del',
        action: () => remove(entries),
      },
    ]);
  }

  function addMenu(event: MouseEvent) {
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: 'Import a file…',
          hint: 'BibLaTeX or BibTeX',
          icon: FileUp,
          action: () => importFile(collectionId),
        },
        {
          label: 'Paste references…',
          icon: ClipboardPaste,
          action: () => importPasted(collectionId),
        },
        {
          label: 'Add PDF files…',
          hint: 'Each is looked up, and kept',
          icon: FileText,
          action: () => importPdfFiles(undefined, collectionId),
        },
        {
          label: 'Import from Zotero…',
          icon: LibraryBig,
          action: () => importFromZotero(collectionId),
        },
        { kind: 'separator' },
        {
          label: 'Find duplicates…',
          icon: CopyCheck,
          disabled: library.entries.length < 2,
          action: () => (findingDuplicates = true),
        },
        {
          label: collection ? `Export “${collection.name}”…` : 'Export the library…',
          icon: FileDown,
          disabled: !scoped.length,
          action: () =>
            exportEntries(
              collection ? scoped.map((e) => e.id) : null,
              collection?.name ?? 'library',
            ),
        },
      ],
      { align: 'end' },
    );
  }

  function sortMenu(event: MouseEvent) {
    const option = (key: SortKey, label: string): MenuItem => ({
      label,
      checked: sortKey === key,
      action: () => {
        if (sortKey === key) descending = !descending;
        else {
          sortKey = key;
          descending = key === 'added' || key === 'modified';
        }
      },
    });
    openMenu(
      event.currentTarget as HTMLElement,
      [
        option('authors', 'Author'),
        option('year', 'Year'),
        option('title', 'Title'),
        option('added', 'Date added'),
        option('modified', 'Date changed'),
        { kind: 'separator' },
        { label: 'Descending', checked: descending, action: () => (descending = !descending) },
      ],
      { align: 'end' },
    );
  }

  function onkeydown(event: KeyboardEvent) {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key === 'f') {
      event.preventDefault();
      searchField?.focus();
      searchField?.select();
    } else if (mod && event.key === 'n') {
      event.preventDefault();
      add();
    }
  }
</script>

<svelte:window {onkeydown} />

<div
  class="library"
  use:dropTarget={{
    accepts: ['files'],
    ondrop: (e) => void importDropped(e.payload.data as string[], collectionId),
  }}
>
  <nav class="side" aria-label="Collections">
    <CollectionTree selected={collectionId} onselect={selectCollection} />
  </nav>

  <section class="middle" aria-label="References">
    <header>
      <div class="search">
        <Search size={15} />
        <input
          bind:this={searchField}
          bind:value={query}
          type="search"
          placeholder={collection ? `Search in ${collection.name}` : 'Search the library'}
          aria-label="Search"
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
            aria-label="Clear the search"
            onclick={() => (query = '')}
          >
            <X size={13} />
          </button>
        {/if}
      </div>
      <IconButton label="Sort" onclick={sortMenu}><ArrowDownUp size={15} /></IconButton>
      <div class="split">
        <Button variant="primary" onclick={add}>
          {#snippet icon()}<Plus size={15} />{/snippet}
          New reference
        </Button>
        <button type="button" class="split-more" aria-label="Import and export" onclick={addMenu}>
          <ChevronDown size={14} />
        </button>
      </div>
    </header>

    <div class="body">
      {#if !library.loaded}
        <div class="centre"><Spinner size={22} /></div>
      {:else if !library.entries.length}
        <EmptyState
          icon={LibraryBig}
          title="Your library is empty"
          text="References you add here are available in all your projects. Begin with one, or bring in those you already have."
        >
          <Button variant="primary" onclick={add}>New reference</Button>
          <Button onclick={() => importFile(collectionId)}>Import a file…</Button>
        </EmptyState>
      {:else if !scoped.length}
        <EmptyState
          icon={FolderPlus}
          title="Nothing in this collection yet"
          text="Drag references here from the library, or add a new one."
        >
          <Button variant="primary" onclick={add}>New reference</Button>
        </EmptyState>
      {:else if !shown.length}
        <EmptyState
          icon={SearchX}
          title="Nothing found"
          text="No reference holds all of these words."
        >
          <Button onclick={() => (query = '')}>Clear the search</Button>
        </EmptyState>
      {:else}
        <ReferenceList
          bind:this={list}
          entries={shown}
          bind:selection
          oncontext={context}
          ondelete={remove}
          label={collection?.name ?? 'All references'}
        />
      {/if}
    </div>

    {#if library.loaded && library.entries.length}
      <footer>
        {#if selection.length > 1}
          {selection.length} of {plural(shown.length, 'reference')} selected
        {:else if query || collection}
          {plural(shown.length, 'reference')}
        {:else}
          {plural(library.entries.length, 'reference')}
        {/if}
      </footer>
    {/if}
  </section>

  <div class="detail">
    {#if single}
      <ReferencePane
        id={single}
        ondelete={(id) => {
          const entry = library.get(id);
          if (entry) remove([entry]);
        }}
        onduplicate={async (draft) => {
          const added = await newReference({ draft, collection: collectionId });
          if (added) selection = [added.id];
        }}
      />
    {:else if selection.length > 1}
      <div class="several">
        <EmptyState title="{selection.length} references selected" compact>
          <Button
            onclick={(e) =>
              openMenu(e.currentTarget as HTMLElement, collectionItems(selection), {
                align: 'start',
              })}
          >
            Add to collection
          </Button>
          <Button
            variant="danger"
            onclick={() => remove(library.entries.filter((e) => selection.includes(e.id)))}
          >
            Delete
          </Button>
        </EmptyState>
      </div>
    {:else}
      <div class="several"></div>
    {/if}
  </div>
</div>

{#if findingDuplicates}
  <DuplicatesDialog onclose={() => (findingDuplicates = false)} />
{/if}

<style>
  .library {
    display: grid;
    grid-template-columns: 224px minmax(320px, 1fr) minmax(360px, 440px);
    height: 100%;
    min-height: 0;
  }
  .side {
    background: var(--paper-sunken);
    border-right: 1px solid var(--line);
    overflow-y: auto;
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
    gap: 8px;
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
  .split {
    display: flex;
  }
  .split :global(.button) {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .split-more {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: var(--control-h);
    padding: 0;
    border: none;
    border-left: 1px solid color-mix(in srgb, var(--accent-ink) 25%, transparent);
    border-radius: 0 var(--radius-s) var(--radius-s) 0;
    background: var(--accent);
    color: var(--accent-ink);
    cursor: pointer;
  }
  .split-more:hover {
    background: var(--accent-strong);
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
  footer {
    flex: none;
    padding: 5px 14px;
    border-top: 1px solid var(--line);
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .detail {
    min-width: 0;
    min-height: 0;
  }
  .several {
    height: 100%;
    background: var(--paper-raised);
    border-left: 1px solid var(--line);
  }
</style>
