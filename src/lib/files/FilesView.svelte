<script lang="ts">
  /**
   * The files of the library, in the library's place: the folders at the
   * left, the files of the folder in view in the middle, the file selected
   * at the right. Files are taken in from the head, or dropped here; any
   * kind is taken, and what can be done with one depends on its kind.
   */
  import { open } from '@tauri-apps/plugin-dialog';
  import { onMount, untrack } from 'svelte';
  import ArrowDownUp from '@lucide/svelte/icons/arrow-down-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import FileStack from '@lucide/svelte/icons/file-stack';
  import FolderOutput from '@lucide/svelte/icons/folder-output';
  import FilePlus from '@lucide/svelte/icons/file-plus';
  import Folder from '@lucide/svelte/icons/folder';
  import FolderInput from '@lucide/svelte/icons/folder-input';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import FolderUp from '@lucide/svelte/icons/folder-up';
  import Images from '@lucide/svelte/icons/images';
  import Link from '@lucide/svelte/icons/link';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import ListFilter from '@lucide/svelte/icons/list-filter';
  import Search from '@lucide/svelte/icons/search';
  import SearchX from '@lucide/svelte/icons/search-x';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import type { FileKind, FileView } from '$lib/api/files';
  import { attachmentOpen } from '$lib/api/library';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import { folderTree } from '$lib/home/folders';
  import { t } from '$lib/i18n';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { library } from '$lib/state/library.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notify, notifyError } from '$lib/ui/toast.svelte';
  import FileList from './FileList.svelte';
  import FilePane from './FilePane.svelte';
  import FolderTree from './FolderTree.svelte';
  import LibrarySwitch from './LibrarySwitch.svelte';
  import ReferenceChooser from './ReferenceChooser.svelte';
  import GoThroughDialog from './GoThroughDialog.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import {
    assign,
    exportFiles,
    fileMatches,
    files,
    filesUi,
    goThrough,
    moveFiles,
    removeFiles,
    referenceWords,
    takeIn,
    toPictures,
    unassignedIn,
  } from './store.svelte';

  type SortKey = 'name' | 'added' | 'size' | 'reference';

  let query = $state('');
  let kind = $state<FileKind | 'all'>('all');
  let unassignedOnly = $state(false);
  /** The files of the folders under the one in view are shown with its own. */
  let below = $state(true);
  /** The search goes over all the files, not only those of the folder in view. */
  let searchAll = $state(false);
  let sortKey = $state<SortKey>('name');
  let descending = $state(false);
  let selection = $state<string[]>([]);
  let searchField = $state<HTMLInputElement>();
  let list = $state<ReturnType<typeof FileList>>();
  let tree = $state<ReturnType<typeof FolderTree>>();
  /** The files a reference is being chosen for (`ReferenceChooser.svelte`). */
  let choosing = $state<FileView[] | null>(null);

  const route = $derived(router.route.view === 'files' ? router.route : { view: 'files' as const });
  const folderId = $derived(route.folder && files.folder(route.folder) ? route.folder : null);
  const folder = $derived(files.folder(folderId));

  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

  const scoped = $derived(
    query.trim() && searchAll ? files.files : files.inFolder(folderId, below),
  );
  const filters = $derived((kind !== 'all' ? 1 : 0) + (unassignedOnly ? 1 : 0));
  const shown = $derived.by(() => {
    const passing = scoped.filter(
      (f) =>
        (kind === 'all' || f.kind === kind) &&
        (!unassignedOnly || !f.references.length) &&
        fileMatches(f, query),
    );
    const byName = (a: FileView, b: FileView) => collator.compare(a.name, b.name);
    const compare: Record<SortKey, (a: FileView, b: FileView) => number> = {
      name: byName,
      added: (a, b) => a.added.localeCompare(b.added) || byName(a, b),
      size: (a, b) => a.size - b.size || byName(a, b),
      // Those with no reference go last, whatever the direction.
      reference: (a, b) => {
        const x = a.references[0];
        const y = b.references[0];
        if (!x || !y) return (x ? -1 : 0) + (y ? 1 : 0) || byName(a, b);
        const said = collator.compare(referenceWords(x), referenceWords(y)) || byName(a, b);
        return descending ? -said : said;
      },
    };
    const sorted = passing.slice().sort(compare[sortKey]);
    return descending && sortKey !== 'reference' ? sorted.reverse() : sorted;
  });
  const single = $derived(selection.length === 1 ? selection[0] : null);

  onMount(() => {
    void files.reload();
    void library.load();
  });

  // The file the route names is selected, once it is known; what is selected
  // here is named by the route in its turn, without a step in the history.
  let applied: string | undefined;
  /** The file this view last had the route name: the route is changed when the selection changes, not when the route does. */
  let named: string | undefined;
  $effect(() => {
    const wanted = route.file;
    if (!files.loaded || wanted === applied) return;
    applied = wanted;
    if (wanted && files.get(wanted)) {
      named = wanted;
      selection = [wanted];
      queueMicrotask(() => list?.scrollTo(wanted));
    }
  });
  $effect(() => {
    const file = single ?? undefined;
    if (!files.loaded || file === named || (!file && selection.length)) return;
    named = file;
    applied = file;
    untrack(() => {
      if (file !== route.file)
        router.replace({ view: 'files', folder: folderId ?? undefined, file });
    });
  });

  // What is selected must exist.
  $effect(() => {
    if (!files.loaded) return;
    const present = selection.filter((h) => files.get(h));
    if (present.length !== selection.length) selection = present;
  });

  function selectFolder(id: string | null) {
    // The route of the folder names no file; it comes when the window says the place has changed.
    named = undefined;
    applied = undefined;
    selection = [];
    router.go({ view: 'files', folder: id ?? undefined });
  }

  async function addFiles() {
    const chosen = await open({ title: t('files-add-title'), multiple: true });
    if (!chosen) return;
    taken(await takeIn(Array.isArray(chosen) ? chosen : [chosen], folderId, false));
  }

  async function addFolder() {
    const chosen = await open({ title: t('files-add-folder-title'), directory: true });
    if (!chosen) return;
    taken(await takeIn(Array.isArray(chosen) ? chosen : [chosen], folderId, true));
  }

  /** What was taken in is selected, as far as it is in view. */
  function taken(result: Awaited<ReturnType<typeof takeIn>>) {
    if (!result) return;
    const fresh = result.files.map((f) => f.hash).filter((h) => shown.some((f) => f.hash === h));
    if (fresh.length) {
      selection = fresh;
      queueMicrotask(() => list?.scrollTo(fresh[0]));
    }
  }

  /** The folders a file can be put in: the top, and every folder in its tree. */
  function folderItems(hashes: string[]): MenuItem[] {
    const here = (f: string | null) => hashes.every((h) => files.folderOf(files.get(h)!) === f);
    return [
      {
        label: t('files-at-top'),
        icon: FileStack,
        disabled: here(null),
        action: () => void moveFiles(hashes, null),
      },
      ...(files.folders.length ? [{ kind: 'separator' } as MenuItem] : []),
      ...folderTree(files.folders).map(
        ({ folder: f, depth }) =>
          ({
            label: ' '.repeat(depth) + f.name,
            icon: depth ? undefined : Folder,
            disabled: here(f.id),
            action: () => void moveFiles(hashes, f.id),
          }) as MenuItem,
      ),
    ];
  }

  /**
   * What can be done with the files chosen in the list, in its menu.
   */
  function fileItems(chosen: FileView[]): MenuItem[] {
    const one = chosen.length === 1 ? chosen[0] : null;
    const hashes = chosen.map((f) => f.hash);
    return [
      ...(one && one.exists
        ? [
            {
              label: t('files-open'),
              icon: ExternalLink,
              action: () =>
                attachmentOpen(one.path).catch((e) =>
                  notifyError(t('library-file-open-failed'), e),
                ),
            } as MenuItem,
            { kind: 'separator' } as MenuItem,
          ]
        : []),
      {
        label: t('files-assign'),
        icon: Link,
        disabled: !library.entries.length,
        action: () => (choosing = chosen),
      },
      {
        kind: 'submenu',
        label: t('files-move-to'),
        icon: FolderInput,
        items: folderItems(hashes),
      },
      {
        label: t('files-go-through-chosen', { count: chosen.length }),
        icon: ListChecks,
        disabled: !library.entries.length,
        action: () => goThrough(hashes),
      },
      ...(one?.kind === 'picture' && one.exists
        ? [
            {
              label: t('files-to-pictures'),
              icon: Images,
              action: () => void toPictures(one),
            } as MenuItem,
          ]
        : []),
      {
        label: one ? t('files-export') : t('files-export-chosen', { count: chosen.length }),
        icon: FolderOutput,
        action: () => void exportFiles({ kind: 'files', hashes }, hashes.length),
      },
      { kind: 'separator' },
      {
        label: t('files-remove'),
        icon: Trash2,
        danger: true,
        shortcut: 'Del',
        action: () => void removeFiles(chosen),
      },
    ];
  }

  /**
   * The going-through from the head: of the files selected, else of those of
   * the folder in view and under it that have no reference, else of all
   * that have none.
   */
  function goThroughHere() {
    const hashes = selection.length
      ? selection
      : unassignedIn(folderId).length
        ? unassignedIn(folderId)
        : unassignedIn(null);
    if (hashes.length) goThrough(hashes);
    else notify(t('files-go-through-nothing'));
  }

  /** What is done from the head, in the menu beside Add files. */
  function headItems(): MenuItem[] {
    return [
      { label: t('files-add'), icon: FilePlus, action: () => void addFiles() },
      {
        label: t('files-add-folder'),
        hint: t('files-add-folder-hint'),
        icon: FolderUp,
        action: () => void addFolder(),
      },
      { kind: 'separator' },
      {
        label: folder ? t('files-folder-new-in', { name: folder.name }) : t('files-folder-new'),
        icon: FolderPlus,
        action: () => tree?.begin(folderId),
      },
      { kind: 'separator' },
      {
        label: t('files-export-all'),
        icon: FolderOutput,
        disabled: !files.files.length,
        action: () => void exportFiles({ kind: 'all' }, files.files.length),
      },
    ];
  }

  function filterMenu(event: MouseEvent) {
    const option = (value: FileKind | 'all', label: string): MenuItem => ({
      label,
      checked: kind === value,
      action: () => (kind = value),
    });
    openMenu(
      event.currentTarget as HTMLElement,
      [
        { kind: 'heading', label: t('files-filter-kind') },
        option('all', t('files-filter-all')),
        option('pdf', t('files-filter-pdf')),
        option('picture', t('files-filter-picture')),
        option('document', t('files-filter-document')),
        option('other', t('files-filter-other')),
        { kind: 'separator' },
        {
          label: t('files-filter-unassigned'),
          checked: unassignedOnly,
          action: () => (unassignedOnly = !unassignedOnly),
        },
        { kind: 'separator' },
        {
          label: t('files-filter-below'),
          checked: below,
          action: () => (below = !below),
        },
        {
          label: t('files-filter-search-all'),
          checked: searchAll,
          action: () => (searchAll = !searchAll),
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
          descending = key === 'added' || key === 'size';
        }
      },
    });
    openMenu(
      event.currentTarget as HTMLElement,
      [
        option('name', t('files-sort-name')),
        option('reference', t('files-sort-reference')),
        option('added', t('files-sort-added')),
        option('size', t('files-sort-size')),
        { kind: 'separator' },
        {
          label: t('files-sort-descending'),
          checked: descending,
          action: () => (descending = !descending),
        },
      ],
      { align: 'end' },
    );
  }

  function clearFilters() {
    kind = 'all';
    unassignedOnly = false;
  }

  // The keys of the files, while they are shown: see `shell/keys`.
  onMount(() =>
    shortcuts.bind({
      'files-find': () => {
        searchField?.focus();
        searchField?.select();
      },
    }),
  );
</script>

<div
  class="files-view"
  use:dropTarget={{
    accepts: ['files'],
    ondrop: (e) => void takeIn(e.payload.data as string[], folderId, true).then(taken),
  }}
>
  <nav class="side" aria-label={t('files-folders')}>
    <FolderTree bind:this={tree} selected={folderId} onselect={selectFolder} />
  </nav>

  <section class="middle" aria-label={t('files-title')}>
    <header>
      <LibrarySwitch current="files" />
      <div class="search">
        <Search size={15} />
        <input
          bind:this={searchField}
          bind:value={query}
          type="search"
          placeholder={folder && !searchAll
            ? t('files-search-in', { name: folder.name })
            : t('files-search')}
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
            aria-label={t('files-search-clear')}
            onclick={() => (query = '')}
          >
            <X size={13} />
          </button>
        {/if}
      </div>
      <span class="filter">
        <IconButton
          label={filters ? t('files-filters-on', { count: filters }) : t('files-filters')}
          active={filters > 0}
          onclick={filterMenu}
          data-files-filter
        >
          <ListFilter size={15} />
        </IconButton>
        {#if filters}<span class="badge" aria-hidden="true">{filters}</span>{/if}
      </span>
      <IconButton label={t('files-sort')} onclick={sortMenu}><ArrowDownUp size={15} /></IconButton>
      <!-- An icon only: the search keeps its room in a narrow head. -->
      <IconButton
        label={t('files-go-through-head')}
        onclick={goThroughHere}
        disabled={!files.files.length}
        data-go-through
      >
        <ListChecks size={15} />
      </IconButton>
      <div class="split">
        <Button variant="primary" onclick={() => void addFiles()}>
          {#snippet icon()}<FilePlus size={15} />{/snippet}
          {t('files-add')}
        </Button>
        <button
          type="button"
          class="split-more"
          aria-label={t('files-more')}
          data-files-more
          onclick={(e) => openMenu(e.currentTarget as HTMLElement, headItems(), { align: 'end' })}
        >
          <ChevronDown size={14} />
        </button>
      </div>
    </header>

    <div class="body">
      {#if !files.loaded}
        <div class="centre"><Spinner size={22} /></div>
      {:else if !files.files.length}
        <EmptyState icon={FileStack} title={t('files-empty')} text={t('files-empty-text')}>
          <Button variant="primary" onclick={() => void addFiles()}>{t('files-add')}</Button>
          <Button onclick={() => void addFolder()}>{t('files-add-folder')}</Button>
        </EmptyState>
      {:else if !scoped.length}
        <EmptyState
          icon={Folder}
          title={t('files-folder-empty')}
          text={t('files-folder-empty-text')}
        >
          <Button onclick={() => void addFiles()}>{t('files-add')}</Button>
        </EmptyState>
      {:else if !shown.length}
        <EmptyState
          icon={filters ? ListFilter : SearchX}
          title={t('files-nothing-found')}
          text={filters ? t('files-nothing-passes') : t('files-nothing-found-text')}
        >
          {#if query}
            <Button onclick={() => (query = '')}>{t('files-search-clear')}</Button>
          {/if}
          {#if filters}
            <Button onclick={clearFilters}>{t('files-filter-clear')}</Button>
          {/if}
        </EmptyState>
      {:else}
        <FileList
          bind:this={list}
          files={shown}
          bind:selection
          onopen={(f) =>
            f.exists &&
            attachmentOpen(f.path).catch((e) => notifyError(t('library-file-open-failed'), e))}
          oncontext={(event, chosen) => openContextMenu(event, fileItems(chosen))}
          ondelete={(chosen) => void removeFiles(chosen)}
          label={folder?.name ?? t('files-all')}
        />
      {/if}
    </div>

    {#if files.loaded && files.files.length}
      <footer data-files-count>
        {#if selection.length > 1}
          {t('files-selected-of', { selected: selection.length, count: shown.length })}
        {:else if shown.length !== files.files.length}
          {t('files-shown-of', { shown: shown.length, count: files.files.length })}
        {:else}
          {t('files-count', { count: files.files.length })}
        {/if}
      </footer>
    {/if}
  </section>

  <aside class="detail" aria-label={t('files-file')}>
    {#if single && files.get(single)}
      {#key single}
        <FilePane
          hash={single}
          onmove={(anchor, f) => openMenu(anchor, folderItems([f.hash]), { align: 'start' })}
          onremoved={() => (selection = [])}
          onreplaced={(hash) => (selection = [hash])}
        />
      {/key}
    {:else if selection.length > 1}
      {@const chosen = files.files.filter((f) => selection.includes(f.hash))}
      <EmptyState title={t('files-selected', { count: selection.length })} compact>
        <Button onclick={() => (choosing = chosen)} disabled={!library.entries.length}>
          {t('files-assign')}
        </Button>
        <Button
          onclick={(e) =>
            openMenu(e.currentTarget as HTMLElement, folderItems(selection), { align: 'start' })}
        >
          {t('files-move')}
        </Button>
        <Button variant="danger" onclick={() => void removeFiles(chosen)}>
          {t('files-remove')}
        </Button>
      </EmptyState>
    {:else if files.loaded && files.files.length}
      {@const here = files.inFolder(folderId, below)}
      <div class="unselected" data-unselected>
        <EmptyState
          icon={FileStack}
          title={t('files-none-selected')}
          text={t('files-none-selected-text')}
          compact
        >
          <p class="tally">
            {t('files-tally', {
              name: folder?.name ?? t('files-all'),
              count: here.length,
              unassigned: here.filter((f) => !f.references.length).length,
            })}
          </p>
        </EmptyState>
      </div>
    {/if}
  </aside>
</div>

{#if choosing}
  {@const chosen = choosing}
  <ReferenceChooser
    title={chosen.length === 1
      ? t('files-assign-title', { name: chosen[0].name })
      : t('files-assign-many-title', { count: chosen.length })}
    onpick={async (id) => {
      for (const f of chosen) await assign(f, id);
    }}
    onclose={() => (choosing = null)}
  />
{/if}

{#if filesUi.going}
  {#key filesUi.going}
    <GoThroughDialog hashes={filesUi.going} onclose={() => (filesUi.going = null)} />
  {/key}
{/if}

{#if filesUi.exporting}
  {#key filesUi.exporting}
    <ExportDialog request={filesUi.exporting} onclose={() => (filesUi.exporting = null)} />
  {/key}
{/if}

<!-- A document among the files is brought in as elements from here. -->
<DocumentHost />

<style>
  .files-view {
    display: grid;
    grid-template-columns: 224px minmax(320px, 1fr) minmax(360px, 440px);
    height: 100%;
    min-height: 0;
  }
  .files-view:global([data-drop-over]) .middle {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .side {
    background: var(--paper-sunken);
    border-right: 1px solid var(--line);
    overflow-y: auto;
  }
  @media (max-width: 1060px) {
    .files-view {
      grid-template-columns: 180px minmax(0, 1fr) minmax(0, 360px);
    }
  }
  @media (max-width: 760px) {
    .files-view {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
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
    min-width: 0;
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
    flex: none;
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
  .unselected {
    height: 100%;
  }
  .tally {
    margin: 0;
    text-align: center;
    color: var(--ink-4);
    font-size: var(--text-sm);
  }
  .detail {
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    background: var(--paper-raised);
    border-left: 1px solid var(--line);
  }
</style>
