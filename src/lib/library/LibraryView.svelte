<script lang="ts">
  import { save } from '@tauri-apps/plugin-dialog';
  import { onMount, untrack } from 'svelte';
  import { shortcuts } from '$lib/shell/keys.svelte';
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
  import ListFilter from '@lucide/svelte/icons/list-filter';
  import Network from '@lucide/svelte/icons/network';
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
    type Collection,
    type Summary,
  } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import LibrarySwitch from '$lib/files/LibrarySwitch.svelte';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import { files as filesState } from '$lib/files/store.svelte';
  import { library, search, sortEntries, type SortKey } from '$lib/state/library.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { ask } from '$lib/ui/confirm.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { copyOut } from './copying';
  import { safeFileName } from '$lib/util/file-name';
  import { citing } from './citing.svelte';
  import CollectionTree from './CollectionTree.svelte';
  import { columns } from './columns.svelte';
  import Divider from '$lib/ui/Divider.svelte';
  import FilterPopover from './FilterPopover.svelte';
  import { activeFilters, applyFilters, noFilters, type Filters } from './filters';
  import MapDialog from './MapDialog.svelte';
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
  /** A map is being made of the library, or of a collection. */
  let mapping = $state<{ collection: Collection | null } | null>(null);
  let query = $state('');
  let filters = $state<Filters>({ ...noFilters });
  let filtering = $state(false);
  let filterButton = $state<HTMLElement>();
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
  const active = $derived(activeFilters(filters));
  const shown = $derived(
    sortEntries(applyFilters(search(scoped, query), filters), sortKey, descending),
  );
  const single = $derived(selection.length === 1 ? selection[0] : null);

  onMount(() => {
    if (library.loaded) void library.checkForChanges();
    else void library.load();
  });

  // The entry the route names is selected, once the library is loaded, and
  // once only: the effect also reads the entries, which change with every
  // save, import or change from outside, and without the guard each of them
  // took the selection back to the entry of the route while another was
  // being written in. What is selected here is named by the route in its
  // turn, without a step in the history, as the view of the files does.
  let applied: string | undefined;
  /** The entry this view last had the route name: the route is changed when the selection changes, not when the route does. */
  let named: string | undefined;
  $effect(() => {
    const wanted = route.entry;
    if (!library.loaded || wanted === applied) return;
    applied = wanted;
    if (wanted && untrack(() => library.get(wanted))) {
      named = wanted;
      selection = [wanted];
      queueMicrotask(() => list?.scrollTo(wanted));
    }
  });
  $effect(() => {
    const entry = single ?? undefined;
    if (!library.loaded || entry === named || (!entry && selection.length)) return;
    named = entry;
    applied = entry;
    untrack(() => {
      if (entry !== route.entry)
        router.replace({ view: 'library', collection: collectionId ?? undefined, entry });
    });
  });

  // What is selected must exist.
  $effect(() => {
    const present = selection.filter((id) => library.get(id));
    if (present.length !== selection.length) selection = present;
  });

  function selectCollection(id: string | null) {
    // The route of the collection names no entry.
    named = undefined;
    applied = undefined;
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
    const projects = citing.count(entries.map((e) => e.id));
    const message = one
      ? t('library-delete-one-message', { projects })
      : t('library-delete-many-message', { projects });
    // The files stay among the files of the library, unless they are asked to go too.
    const answer = await ask({
      title: one
        ? t('library-delete-one-title', { name: one.title || one.key })
        : t('library-delete-many-title', { count: entries.length }),
      message: files ? `${message}\n\n${t('library-delete-files', { files })}` : message,
      confirm: files ? t('library-delete-keep-files') : t('common-delete'),
      alternative: files ? t('files-remove-with-files') : undefined,
      // Where there are files, what Enter chooses keeps them, and is not marked as what loses most.
      danger: !files,
    });
    if (answer === 'cancel') return;
    try {
      const ids = entries.map((e) => e.id);
      await libraryRemove(ids, answer === 'alternative');
      library.forget(ids);
      selection = [];
      // The files that were theirs are unassigned now, or gone.
      if (files) void filesState.reload();
    } catch (error) {
      notifyError(t('library-delete-failed'), error);
    }
  }

  async function addTo(collection: string, ids: string[]) {
    try {
      const n = await collectionAdd(collection, ids);
      library.setCollections(await collectionList());
      const name = library.collection(collection)?.name ?? '';
      notifyOk(
        n
          ? t('library-collection-added', { count: n, name })
          : t('library-collection-already', { name }),
      );
    } catch (error) {
      notifyError(t('library-not-done'), error);
    }
  }

  async function removeFrom(collection: string, ids: string[]) {
    try {
      await collectionRemove(collection, ids);
      library.setCollections(await collectionList());
      selection = [];
    } catch (error) {
      notifyError(t('library-not-done'), error);
    }
  }

  async function exportEntries(ids: string[] | null, name: string) {
    const path = await save({
      title: t('library-export-title'),
      defaultPath: `${safeFileName(name, t('library-export-file-library'))}.bib`,
      filters: [{ name: 'BibLaTeX', extensions: ['bib'] }],
    });
    if (!path) return;
    try {
      const n = await libraryExport(path, ids);
      notifyOk(t('library-exported', { count: n }));
    } catch (error) {
      notifyError(t('library-export-failed'), error);
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
              label: t('library-open-file'),
              icon: Paperclip,
              action: async () => {
                try {
                  const full = await libraryGet(one.id);
                  const file = full.files.find((f) => f.exists);
                  if (file) await attachmentOpen(file.path);
                } catch (error) {
                  notifyError(t('library-file-open-failed'), error);
                }
              },
            } as MenuItem,
            { kind: 'separator' } as MenuItem,
          ]
        : []),
      {
        kind: 'submenu',
        label: t('library-add-to-collection'),
        icon: FolderPlus,
        disabled: !collections.length,
        items: collections,
      },
      ...(collection
        ? [
            {
              label: t('library-remove-from', { name: collection.name }),
              icon: FolderMinus,
              action: () => removeFrom(collection.id, ids),
            } as MenuItem,
          ]
        : []),
      { kind: 'separator' },
      ...(one
        ? [
            {
              label: t('library-copy-key'),
              icon: Copy,
              action: () => copyOut(() => one.key, t('library-copied-key', { key: one.key })),
            } as MenuItem,
          ]
        : []),
      {
        label: t('library-copy-biblatex'),
        action: () =>
          copyOut(
            async () => (await Promise.all(ids.map((id) => librarySource(id)))).join('\n'),
            t('library-copied'),
          ),
      },
      {
        label: one ? t('library-export-one') : t('library-export-many', { count: entries.length }),
        icon: FileDown,
        action: () => exportEntries(ids, one ? one.key : t('library-export-file-references')),
      },
      { kind: 'separator' },
      {
        label: t('common-delete'),
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
          label: t('library-import-file'),
          hint: t('library-import-file.hint'),
          icon: FileUp,
          action: () => importFile(collectionId),
        },
        {
          label: t('library-paste'),
          icon: ClipboardPaste,
          action: () => importPasted(collectionId),
        },
        {
          label: t('library-add-pdfs'),
          hint: t('library-add-pdfs.hint'),
          icon: FileText,
          action: () => importPdfFiles(undefined, collectionId),
        },
        {
          label: t('library-import-zotero'),
          icon: LibraryBig,
          action: () => importFromZotero(collectionId),
        },
        { kind: 'separator' },
        {
          label: t('library-find-duplicates'),
          icon: CopyCheck,
          disabled: library.entries.length < 2,
          action: () => (findingDuplicates = true),
        },
        {
          label: collection
            ? t('library-map-collection', { name: collection.name })
            : t('library-map-library'),
          icon: Network,
          disabled: !scoped.length,
          action: () => (mapping = { collection: collection ?? null }),
        },
        {
          label: collection
            ? t('library-export-collection', { name: collection.name })
            : t('library-export-library'),
          icon: FileDown,
          disabled: !scoped.length,
          action: () =>
            exportEntries(
              collection ? scoped.map((e) => e.id) : null,
              collection?.name ?? t('library-export-file-library'),
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
        option('authors', t('library-sort-author')),
        option('year', t('library-sort-year')),
        option('title', t('library-sort-title')),
        option('added', t('library-sort-added')),
        option('modified', t('library-sort-modified')),
        { kind: 'separator' },
        {
          label: t('library-sort-descending'),
          checked: descending,
          action: () => (descending = !descending),
        },
      ],
      { align: 'end' },
    );
  }

  // The keys of the library, while it is shown: see `shell/keys`.
  onMount(() =>
    shortcuts.bind({
      'library-find': () => {
        searchField?.focus();
        searchField?.select();
      },
      'library-new': () => void add(),
    }),
  );
</script>

<div
  class="library"
  style:--side="{columns.side}px"
  style:--detail="{columns.detail}px"
  use:dropTarget={{
    accepts: ['files'],
    ondrop: (e) => void importDropped(e.payload.data as string[], collectionId),
  }}
>
  <nav class="side" aria-label={t('library-collections')}>
    <CollectionTree selected={collectionId} onselect={selectCollection} />
  </nav>
  <Divider
    label={t('library-resize-side')}
    onmove={(dx) => columns.moveSide(dx)}
    onreset={() => columns.resetSide()}
  />

  <section class="middle" aria-label={t('library-references')}>
    <header>
      <LibrarySwitch current="references" />
      <div class="search">
        <Search size={15} />
        <input
          bind:this={searchField}
          bind:value={query}
          type="search"
          placeholder={collection
            ? t('library-search-in', { name: collection.name })
            : t('library-search')}
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
            aria-label={t('library-search-clear')}
            onclick={() => (query = '')}
          >
            <X size={13} />
          </button>
        {/if}
      </div>
      <span class="filter" bind:this={filterButton}>
        <IconButton
          label={active ? t('library-filters-on', { count: active }) : t('library-filters')}
          active={active > 0 || filtering}
          aria-expanded={filtering}
          onclick={() => (filtering = !filtering)}
        >
          <ListFilter size={15} />
        </IconButton>
        {#if active}<span class="badge" aria-hidden="true">{active}</span>{/if}
      </span>
      <IconButton label={t('library-sort')} onclick={sortMenu}><ArrowDownUp size={15} /></IconButton
      >
      <div class="split">
        <Button variant="primary" onclick={add}>
          {#snippet icon()}<Plus size={15} />{/snippet}
          {t('library-new-reference')}
        </Button>
        <button
          type="button"
          class="split-more"
          aria-label={t('library-import-export')}
          onclick={addMenu}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </header>

    <div class="body">
      {#if !library.loaded}
        <div class="centre"><Spinner size={22} /></div>
      {:else if !library.entries.length}
        <EmptyState icon={LibraryBig} title={t('library-empty')} text={t('library-empty.text')}>
          <Button variant="primary" onclick={add}>{t('library-new-reference')}</Button>
          <Button onclick={() => importFile(collectionId)}>{t('library-import-file')}</Button>
        </EmptyState>
      {:else if !scoped.length}
        <EmptyState
          icon={FolderPlus}
          title={t('library-collection-empty')}
          text={t('library-collection-empty.text')}
        >
          <Button variant="primary" onclick={add}>{t('library-new-reference')}</Button>
        </EmptyState>
      {:else if !shown.length}
        <EmptyState
          icon={active ? ListFilter : SearchX}
          title={t('library-nothing-found')}
          text={active ? t('library-nothing-passes') : t('library-nothing-found.text')}
        >
          {#if query}
            <Button onclick={() => (query = '')}>{t('library-search-clear')}</Button>
          {/if}
          {#if active}
            <Button onclick={() => (filters = { ...noFilters })}>{t('library-filter-clear')}</Button
            >
          {/if}
        </EmptyState>
      {:else}
        <ReferenceList
          bind:this={list}
          entries={shown}
          bind:selection
          oncontext={context}
          ondelete={remove}
          label={collection?.name ?? t('library-all-references')}
        />
      {/if}
    </div>

    {#if library.loaded && library.entries.length}
      <footer>
        {#if selection.length > 1}
          {t('library-selected-of', { selected: selection.length, count: shown.length })}
        {:else if query || collection || active}
          {t('library-count', { count: shown.length })}
        {:else}
          {t('library-count', { count: library.entries.length })}
        {/if}
      </footer>
    {/if}
  </section>

  <Divider
    label={t('library-resize-detail')}
    onmove={(dx) => columns.moveDetail(dx)}
    onreset={() => columns.resetDetail()}
  />
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
        <EmptyState title={t('library-selected', { count: selection.length })} compact>
          <Button
            onclick={(e) =>
              openMenu(e.currentTarget as HTMLElement, collectionItems(selection), {
                align: 'start',
              })}
          >
            {t('library-add-to-collection')}
          </Button>
          <Button
            variant="danger"
            onclick={() => remove(library.entries.filter((e) => selection.includes(e.id)))}
          >
            {t('common-delete')}
          </Button>
        </EmptyState>
      </div>
    {:else}
      <div class="several"></div>
    {/if}
  </div>
</div>

<!-- A document among the files of a reference is brought in as elements from here. -->
<DocumentHost />

{#if findingDuplicates}
  <DuplicatesDialog onclose={() => (findingDuplicates = false)} />
{/if}

{#if mapping}
  <MapDialog
    collection={mapping.collection}
    sort={{ key: sortKey, descending }}
    onclose={() => (mapping = null)}
  />
{/if}

<FilterPopover
  open={filtering}
  anchor={filterButton}
  entries={scoped}
  bind:filters
  onclose={() => (filtering = false)}
/>

<style>
  /* The columns at the sides are as wide as they were dragged to be; in a
     narrow window they give way before the references do. */
  .library {
    display: grid;
    grid-template-columns:
      minmax(0, var(--side)) auto minmax(360px, 1fr) auto
      minmax(0, var(--detail));
    height: 100%;
    min-height: 0;
  }
  .side {
    background: var(--paper-sunken);
    overflow-y: auto;
  }
  /* Narrower still, the collections lie over the references as a strip. */
  @media (max-width: 760px) {
    .library {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }
    .library > :global(.divider) {
      display: none;
    }
    .side {
      grid-column: 1 / -1;
      max-height: 28vh;
      border-right: none;
      border-bottom: 1px solid var(--line);
    }
    .middle header {
      flex-wrap: wrap;
      height: auto;
      min-height: var(--bar-h);
      padding-block: 6px;
    }
  }
  .middle {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    container-type: inline-size;
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
    min-width: 0;
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
  .filter {
    position: relative;
    display: inline-flex;
  }
  .badge {
    position: absolute;
    top: -3px;
    right: -3px;
    min-width: 15px;
    height: 15px;
    padding: 0 4px;
    border-radius: 8px;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 10px;
    font-weight: 600;
    line-height: 15px;
    text-align: center;
    pointer-events: none;
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
  /* Where the columns beside it have been dragged wide, the head takes two
     lines: the search below the buttons, as wide as the column. */
  @container (max-width: 620px) {
    header {
      flex-wrap: wrap;
      height: auto;
      min-height: var(--bar-h);
      padding-block: 6px;
    }
    .search {
      order: 10;
      flex: 1 0 100%;
    }
  }
</style>
