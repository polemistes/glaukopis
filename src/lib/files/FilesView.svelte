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
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import X from '@lucide/svelte/icons/x';
  import type { FileKind, FileView } from '$lib/api/files';
  import { attachmentOpen } from '$lib/api/library';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import { t } from '$lib/i18n';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { library } from '$lib/state/library.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { treeMenu } from '$lib/ui/tree-menu';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notify, notifyError } from '$lib/ui/toast.svelte';
  import FileList from './FileList.svelte';
  import FilePane from './FilePane.svelte';
  import FolderTree from './FolderTree.svelte';
  import LibrarySwitch from './LibrarySwitch.svelte';
  import ReferenceChooser from './ReferenceChooser.svelte';
  import UnassignedBar from './UnassignedBar.svelte';
  import GoThroughDialog from './GoThroughDialog.svelte';
  import { columns } from '$lib/library/columns.svelte';
  import Divider from '$lib/ui/Divider.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import { sortFiles, type FileSortKey } from './order';
  import Eye from '@lucide/svelte/icons/eye';
  import { showFile } from '$lib/viewer/show';
  import {
    assign,
    exportFiles,
    fileMatches,
    files,
    filesUi,
    goThrough,
    moveFiles,
    removeFiles,
    takeIn,
    toPictures,
    unassignedIn,
    undoLast,
  } from './store.svelte';

  type SortKey = FileSortKey;

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
  /**
   * The one file a reference is being chosen for (`ReferenceChooser.svelte`).
   * Several are never given to one reference in a step: they are gone through.
   */
  let choosing = $state<FileView | null>(null);

  const route = $derived(router.route.view === 'files' ? router.route : { view: 'files' as const });
  const folderId = $derived(route.folder && files.folder(route.folder) ? route.folder : null);
  const folder = $derived(files.folder(folderId));
  /** The files of the folder in view and under it, or of all, that belong to no reference. */
  const unassignedHere = $derived(unassignedIn(folderId));

  // Whether the search goes over all the files: a word typed changes what is
  // shown, not the files it is chosen from.
  const searchingAll = $derived(!!query.trim() && searchAll);
  const scoped = $derived(searchingAll ? files.files : files.inFolder(folderId, below));
  const filters = $derived((kind !== 'all' ? 1 : 0) + (unassignedOnly ? 1 : 0));
  // Sorted when the files or the order change; what is searched for is
  // filtered out of that, in the same order, with every letter typed.
  const sorted = $derived(sortFiles(scoped, sortKey, descending));
  const shown = $derived(
    sorted.filter(
      (f) =>
        (kind === 'all' || f.kind === kind) &&
        (!unassignedOnly || !f.references.length) &&
        fileMatches(f, query),
    ),
  );
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
      ...treeMenu(
        files.folders,
        (f) => ({ disabled: here(f.id), action: () => void moveFiles(hashes, f.id) }),
        { icon: Folder },
      ),
    ];
  }

  /**
   * What can be done with the files chosen in the list, in its menu.
   */
  function fileItems(chosen: FileView[]): MenuItem[] {
    const one = chosen.length === 1 ? chosen[0] : null;
    const hashes = chosen.map((f) => f.hash);
    const goingThrough: MenuItem = {
      label: t('files-go-through-chosen', { count: chosen.length }),
      icon: ListChecks,
      action: () => goThrough(hashes),
    };
    const moving: MenuItem = {
      kind: 'submenu',
      label: t('files-move-to'),
      icon: FolderInput,
      items: folderItems(hashes),
    };
    const exporting: MenuItem = {
      label: one ? t('files-export') : t('files-export-chosen', { count: chosen.length }),
      icon: FolderOutput,
      action: () => void exportFiles({ kind: 'files', hashes }, hashes.length),
    };
    const removing: MenuItem[] = [
      { kind: 'separator' },
      {
        label: t('files-remove'),
        icon: Trash2,
        danger: true,
        shortcut: 'Del',
        action: () => void removeFiles(chosen),
      },
    ];
    // Several files are gone through, each to its own reference: none is
    // given to one reference with the others in one step.
    if (!one) return [goingThrough, moving, exporting, ...removing];
    return [
      ...(one.exists
        ? [
            ...(one.kind === 'pdf' || one.kind === 'picture'
              ? [
                  {
                    label: t('files-show'),
                    icon: Eye,
                    action: () => showFile(one.hash),
                  } as MenuItem,
                ]
              : []),
            {
              label: t('files-open-elsewhere'),
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
        action: () => (choosing = one),
      },
      moving,
      goingThrough,
      ...(one.kind === 'picture' && one.exists
        ? [
            {
              label: t('files-to-pictures'),
              icon: Images,
              action: () => void toPictures(one),
            } as MenuItem,
          ]
        : []),
      exporting,
      ...removing,
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
      ...(filesUi.lastDone
        ? [
            {
              label: t('files-undo-last', { count: filesUi.lastDone.assigned.length }),
              icon: Undo2,
              action: () => void undoLast(),
            } as MenuItem,
          ]
        : []),
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
  style:--side="{columns.side}px"
  style:--detail="{columns.detail}px"
  use:dropTarget={{
    accepts: ['files'],
    ondrop: (e) => void takeIn(e.payload.data as string[], folderId, true).then(taken),
  }}
>
  <nav class="side" aria-label={t('files-folders')}>
    <FolderTree bind:this={tree} selected={folderId} onselect={selectFolder} />
  </nav>
  <Divider
    label={t('library-resize-side')}
    onmove={(dx) => columns.moveSide(dx)}
    onreset={() => columns.resetSide()}
  />

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

    {#if files.loaded && unassignedHere.length && !filesUi.barHidden.has(folderId)}
      <UnassignedBar
        count={unassignedHere.length}
        ongo={() => goThrough(unassignedHere)}
        onhide={() => filesUi.barHidden.add(folderId)}
      />
    {/if}

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
          onopen={(f) => {
            if (!f.exists) return;
            // A PDF or an image is shown in the window; another kind is opened in its own program.
            if (f.kind === 'pdf' || f.kind === 'picture') showFile(f.hash);
            else attachmentOpen(f.path).catch((e) => notifyError(t('library-file-open-failed'), e));
          }}
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

  <Divider
    label={t('library-resize-detail')}
    onmove={(dx) => columns.moveDetail(dx)}
    onreset={() => columns.resetDetail()}
  />
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
        <Button
          variant="primary"
          onclick={() => goThrough(chosen.map((f) => f.hash))}
          data-go-through-chosen
        >
          {t('files-go-through-chosen', { count: chosen.length })}
        </Button>
        <Button
          onclick={(e) =>
            openMenu(e.currentTarget as HTMLElement, folderItems(selection), { align: 'start' })}
        >
          {t('files-move')}
        </Button>
        <Button
          onclick={() =>
            void exportFiles({ kind: 'files', hashes: chosen.map((f) => f.hash) }, chosen.length)}
        >
          {t('files-export-chosen', { count: chosen.length })}
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
    title={t('files-assign-title', { name: chosen.name })}
    onpick={(id) => void assign(chosen, id)}
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
  /* The columns at the sides are as wide as they were dragged to be, the
     same as for the references; in a narrow window they give way first. */
  .files-view {
    display: grid;
    grid-template-columns:
      minmax(0, var(--side)) auto minmax(360px, 1fr) auto
      minmax(0, var(--detail));
    height: 100%;
    min-height: 0;
  }
  .files-view:global([data-drop-over]) .middle {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .side {
    background: var(--paper-sunken);
    overflow-y: auto;
  }
  @media (max-width: 760px) {
    .files-view {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
    }
    .files-view > :global(.divider) {
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
