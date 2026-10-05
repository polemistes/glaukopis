<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Folder from '@lucide/svelte/icons/folder';
  import FolderInput from '@lucide/svelte/icons/folder-input';
  import FolderOutput from '@lucide/svelte/icons/folder-output';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Search from '@lucide/svelte/icons/search';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Users from '@lucide/svelte/icons/users';
  import type { Folder as FolderInfo, ProjectInfo } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import { projects } from '$lib/state/projects.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { dropTarget, startDrag, type DragPayload, type DropEvent } from '$lib/ui/drag.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { ago } from '$lib/util/time';
  import { descendants, folderOf, folderTree, foldersOpenTo, rows as makeRows } from './folders';

  interface Props {
    open: (p: ProjectInfo) => void;
    /** The menu of a project, as the cards have it; what folders add comes after. */
    items: (p: ProjectInfo) => MenuItem[];
    onnewfolder: (parent: string | null) => void;
    onrenamefolder: (folder: FolderInfo) => void;
  }

  let { open, items, onnewfolder, onrenamefolder }: Props = $props();

  let collapsed = $state(new Set<string>());
  let filter = $state('');

  const rows = $derived(makeRows(projects.folders, projects.list, { collapsed, filter }));

  function toggle(id: string) {
    if (collapsed.has(id)) collapsed.delete(id);
    else collapsed.add(id);
    collapsed = new Set(collapsed);
  }

  function reveal(id: string | null) {
    if (id && collapsed.has(id)) {
      collapsed.delete(id);
      collapsed = new Set(collapsed);
    }
  }

  async function moveProject(p: ProjectInfo, folder: string | null) {
    if (folderOf(projects.folders, p) === folder) return;
    try {
      await projects.moveToFolder(p.id, folder);
      reveal(folder);
      const name = projects.folder(folder)?.name;
      notifyOk(
        folder && name
          ? t('home-moved-to', { name: p.name, folder: name })
          : t('home-moved-out', { name: p.name }),
      );
    } catch (error) {
      notifyError(t('home-move-failed'), error);
    }
  }

  async function moveFolder(id: string, parent: string | null) {
    if (id === parent || (parent && descendants(projects.folders, id).has(parent))) return;
    try {
      await projects.moveFolder(id, parent);
      reveal(parent);
    } catch (error) {
      notifyError(t('home-folder-failed'), error);
    }
  }

  async function removeFolder(f: FolderInfo) {
    const ok = await confirm({
      title: t('home-folder-delete-title', { name: f.name }),
      message: t('home-folder-delete-message'),
      confirm: t('home-folder-delete-confirm'),
      danger: true,
    });
    if (!ok) return;
    try {
      await projects.deleteFolder(f.id);
    } catch (error) {
      notifyError(t('home-folder-failed'), error);
    }
  }

  /** The folders something may be moved into, as a menu: each under the one it lies in. */
  function intoFolders(
    open: FolderInfo[],
    current: string | null,
    move: (folder: string) => void,
  ): MenuItem[] {
    const ids = new Set(open.map((f) => f.id));
    return folderTree(projects.folders)
      .filter((x) => ids.has(x.folder.id))
      .map((x) => ({
        label: ' '.repeat(x.depth) + x.folder.name,
        checked: x.folder.id === current,
        disabled: x.folder.id === current,
        action: () => move(x.folder.id),
      }));
  }

  function projectItems(p: ProjectInfo): MenuItem[] {
    const current = folderOf(projects.folders, p);
    const into = intoFolders(projects.folders, current, (folder) => moveProject(p, folder));
    const base = items(p);
    // Before the last part of the menu, which deletes.
    const cut = base.findIndex((item, i) => item.kind === 'separator' && i === base.length - 2);
    const moving: MenuItem[] = [
      { kind: 'separator' },
      {
        kind: 'submenu',
        label: t('home-menu-move'),
        icon: FolderInput,
        items: into,
        disabled: !into.length,
      },
      ...(current
        ? [
            {
              label: t('home-menu-out'),
              icon: FolderOutput,
              action: () => moveProject(p, null),
            } as MenuItem,
          ]
        : []),
    ];
    return cut < 0 ? [...base, ...moving] : [...base.slice(0, cut), ...moving, ...base.slice(cut)];
  }

  function folderItems(f: FolderInfo): MenuItem[] {
    const parent = f.parent ?? null;
    const into = intoFolders(foldersOpenTo(projects.folders, f.id), parent, (folder) =>
      moveFolder(f.id, folder),
    );
    return [
      { label: t('home-folder-new-inside'), icon: FolderPlus, action: () => onnewfolder(f.id) },
      { label: t('common-rename'), icon: Pencil, shortcut: 'F2', action: () => onrenamefolder(f) },
      { kind: 'separator' },
      {
        kind: 'submenu',
        label: t('home-menu-move'),
        icon: FolderInput,
        items: into,
        disabled: !into.length,
      },
      ...(parent
        ? [
            {
              label: t('home-menu-out'),
              icon: FolderOutput,
              action: () => moveFolder(f.id, null),
            } as MenuItem,
          ]
        : []),
      { kind: 'separator' },
      {
        label: t('home-folder-delete-confirm'),
        icon: Trash2,
        danger: true,
        action: () => removeFolder(f),
      },
    ];
  }

  /** Whether what is dragged may be dropped into a folder, or at the top. */
  function accepts(target: string | null) {
    return (payload: DragPayload) => {
      if (payload.kind === 'project') {
        const p = projects.list.find((x) => x.id === payload.data);
        return !!p && folderOf(projects.folders, p) !== target;
      }
      if (payload.kind === 'folder') {
        const id = payload.data as string;
        const f = projects.folder(id);
        return (
          !!f &&
          id !== target &&
          (f.parent ?? null) !== target &&
          !(target && descendants(projects.folders, id).has(target))
        );
      }
      return false;
    };
  }

  function drop(event: DropEvent, target: string | null) {
    const { payload } = event;
    if (payload.kind === 'project') {
      const p = projects.list.find((x) => x.id === payload.data);
      if (p) moveProject(p, target);
    } else if (payload.kind === 'folder') {
      moveFolder(payload.data as string, target);
    }
  }

  function facts(p: ProjectInfo): string {
    const parts: string[] = [];
    if (p.maps.length > 1) parts.push(t('home-maps', { count: p.maps.length }));
    if (p.words) parts.push(t('home-words', { count: p.words }));
    return parts.join(' · ');
  }

  function onfolderkey(event: KeyboardEvent, f: FolderInfo) {
    if (event.key === 'F2') onrenamefolder(f);
    else if (event.key === 'Delete') removeFolder(f);
    else if (event.key === 'Enter' || event.key === ' ') toggle(f.id);
    else return;
    event.preventDefault();
  }
</script>

<div class="list" use:dropTarget={{ accepts: accepts(null), ondrop: (e) => drop(e, null) }}>
  <div class="tools">
    <TextField
      bind:value={filter}
      size="sm"
      placeholder={t('home-search')}
      aria-label={t('home-search')}
    >
      {#snippet leading()}<Search size={14} />{/snippet}
    </TextField>
    <Button size="sm" onclick={() => onnewfolder(null)}>
      {#snippet icon()}<FolderPlus size={14} />{/snippet}
      {t('home-new-folder')}
    </Button>
  </div>

  {#each rows as row (row.kind === 'folder' ? `f:${row.folder.id}` : `p:${row.project.id}`)}
    {#if row.kind === 'folder'}
      {@const f = row.folder}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="row folder"
        role="button"
        tabindex="0"
        data-depth={row.depth}
        data-folder={f.id}
        style:padding-left="{8 + row.depth * 20}px"
        use:dropTarget={{ accepts: accepts(f.id), ondrop: (e) => drop(e, f.id) }}
        onclick={() => toggle(f.id)}
        oncontextmenu={(e) => openContextMenu(e, folderItems(f))}
        onkeydown={(e) => onfolderkey(e, f)}
        onpointerdown={(e) => startDrag(e, () => ({ kind: 'folder', data: f.id, label: f.name }))}
      >
        <span class="twisty" class:open={row.open} class:hidden={!row.holds}>
          <ChevronRight size={13} />
        </span>
        <Folder size={15} strokeWidth={1.6} />
        <span class="name truncate">{f.name}</span>
        <span class="count">{t('home-folder-projects', { count: row.projects })}</span>
        <button
          type="button"
          class="menu"
          aria-label={t('home-more-for', { name: f.name })}
          onclick={(e) => {
            e.stopPropagation();
            openMenu(e.currentTarget, folderItems(f), { align: 'end' });
          }}
          onpointerdown={(e) => e.stopPropagation()}
        >
          <Ellipsis size={15} />
        </button>
      </div>
    {:else}
      {@const p = row.project}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="row project"
        role="button"
        tabindex="0"
        data-depth={row.depth}
        data-project={p.id}
        style:padding-left="{8 + row.depth * 20 + 22}px"
        onclick={() => open(p)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open(p);
          }
        }}
        oncontextmenu={(e) => openContextMenu(e, projectItems(p))}
        onpointerdown={(e) => startDrag(e, () => ({ kind: 'project', data: p.id, label: p.name }))}
      >
        <span class="name serif truncate">{p.name}</span>
        {#if p.sharing}<span class="shared" title={t('home-shared')}><Users size={12} /></span>{/if}
        <span class="facts truncate">{facts(p)}</span>
        <span class="when">{t('home-changed', { ago: ago(p.modified) })}</span>
        <button
          type="button"
          class="menu"
          aria-label={t('home-more-for', { name: p.name })}
          onclick={(e) => {
            e.stopPropagation();
            openMenu(e.currentTarget, projectItems(p), { align: 'end' });
          }}
          onpointerdown={(e) => e.stopPropagation()}
        >
          <Ellipsis size={15} />
        </button>
      </div>
    {/if}
  {/each}

  {#if !rows.length}
    <p class="none">{filter.trim() ? t('home-search-none') : t('home-list-none')}</p>
  {/if}
</div>

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-bottom: 12px;
    border-radius: var(--radius-m);
  }
  .list:global([data-drop-over]) {
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }
  .tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }
  .tools :global(.field) {
    width: 280px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding-right: 6px;
    border-radius: var(--radius-s);
    color: var(--ink-2);
    cursor: pointer;
    user-select: none;
  }
  .row:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .row:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .row.folder:global([data-drop-over]) {
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }
  .row.folder .name {
    font-weight: 500;
  }
  .row.project .name {
    color: var(--ink);
    font-size: 15px;
  }
  .name {
    flex: 1;
    min-width: 0;
  }
  .twisty {
    display: inline-flex;
    width: 16px;
    height: 16px;
    margin-right: -3px;
    align-items: center;
    justify-content: center;
    color: var(--ink-4);
    transition: transform var(--fast) var(--ease);
  }
  .twisty.open {
    transform: rotate(90deg);
  }
  .twisty.hidden {
    visibility: hidden;
  }
  .count,
  .facts,
  .when {
    flex: none;
    font-size: var(--text-sm);
    color: var(--ink-4);
    font-variant-numeric: tabular-nums;
  }
  .facts {
    max-width: 220px;
    color: var(--ink-3);
  }
  .when {
    width: 150px;
    text-align: right;
  }
  .shared {
    display: inline-flex;
    color: var(--accent-strong);
  }
  .menu {
    display: inline-flex;
    padding: 5px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--fast) var(--ease);
  }
  .row:hover .menu,
  .row:focus-within .menu {
    opacity: 1;
  }
  .menu:hover {
    background: var(--paper-raised);
    color: var(--ink);
  }
  .none {
    padding: 20px 8px;
    color: var(--ink-4);
    text-align: center;
  }
</style>
