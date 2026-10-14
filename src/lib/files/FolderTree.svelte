<script lang="ts">
  /**
   * The folders of the files of the library, at the left of the files view,
   * as the collections stand at the left of the references: all the files
   * at the top, then the folders, each with how many files are in it and
   * under it. Files and folders are dragged onto them, and files and
   * folders from the desktop are taken into them.
   */
  import { tick } from 'svelte';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Files from '@lucide/svelte/icons/files';
  import Folder from '@lucide/svelte/icons/folder';
  import FolderInput from '@lucide/svelte/icons/folder-input';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import ListChecks from '@lucide/svelte/icons/list-checks';
  import FolderOutput from '@lucide/svelte/icons/folder-output';
  import {
    filesFolderCreate,
    filesFolderDelete,
    filesFolderMove,
    filesFolderRename,
    filesList,
    type FileFolder,
  } from '$lib/api/files';
  import { ancestors, byName, parentOf, pathOf } from '$lib/home/folders';
  import { languages, t } from '$lib/i18n';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { dropTarget, startDrag, type DropEvent } from '$lib/ui/drag.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import {
    FILES_DRAGGED,
    exportFiles,
    files,
    goThrough,
    moveFiles,
    takeIn,
    unassignedIn,
  } from './store.svelte';

  interface Props {
    /** The folder in view, or null for all the files. */
    selected: string | null;
    onselect: (id: string | null) => void;
  }

  let { selected, onselect }: Props = $props();

  /** What a folder dragged in the tree is. */
  const FOLDER_DRAGGED = 'file-folder';

  let collapsed = $state(new Set<string>());
  /** The folder being named: its id, or 'new' with the parent it will lie in. */
  let naming = $state<{ id: string | 'new'; parent: string | null; value: string } | null>(null);
  let input = $state<HTMLInputElement>();

  interface Node {
    folder: FileFolder;
    depth: number;
    count: number;
    children: number;
  }

  const nodes = $derived.by(() => {
    const folders = files.folders;
    const out: Node[] = [];
    // How many files each folder holds, with those of the folders under it.
    const direct = new Map<string, number>();
    for (const f of files.files) {
      const at = files.folderOf(f);
      if (at) direct.set(at, (direct.get(at) ?? 0) + 1);
    }
    const counts = new Map<string, number>();
    const count = (id: string): number => {
      const known = counts.get(id);
      if (known !== undefined) return known;
      let n = direct.get(id) ?? 0;
      for (const f of folders) if (parentOf(folders, f) === id) n += count(f.id);
      counts.set(id, n);
      return n;
    };
    const walk = (parent: string | null, depth: number) => {
      const children = folders.filter((f) => parentOf(folders, f) === parent).sort(byName);
      for (const f of children) {
        const kids = folders.filter((x) => parentOf(folders, x) === f.id).length;
        out.push({ folder: f, depth, count: count(f.id), children: kids });
        if (!collapsed.has(f.id)) walk(f.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  });

  // The folder in view is open to be seen, and so is every folder it lies in.
  $effect(() => {
    const up = ancestors(files.folders, selected).slice(1);
    if (up.some((id) => collapsed.has(id))) {
      for (const id of up) collapsed.delete(id);
      collapsed = new Set(collapsed);
    }
  });

  async function refresh() {
    files.setFolders((await filesList()).folders);
  }

  /** Begins naming a new folder, in `parent` or at the top. */
  export async function begin(parent: string | null) {
    if (parent) {
      collapsed.delete(parent);
      collapsed = new Set(collapsed);
    }
    naming = { id: 'new', parent, value: '' };
    await tick();
    input?.focus();
  }

  async function rename(f: FileFolder) {
    naming = { id: f.id, parent: f.parent ?? null, value: f.name };
    await tick();
    input?.select();
  }

  async function commit() {
    const n = naming;
    if (!n) return;
    naming = null;
    const name = n.value.trim();
    if (!name) return;
    try {
      if (n.id === 'new') {
        const created = await filesFolderCreate(name, n.parent);
        await refresh();
        onselect(created.id);
      } else if (files.folder(n.id)?.name !== name) {
        await filesFolderRename(n.id, name);
        await refresh();
      }
    } catch (error) {
      notifyError(t('files-folder-name-failed'), error);
    }
  }

  async function remove(f: FileFolder) {
    const inside = files.inFolder(f.id).length;
    const ok = await confirm({
      title: t('files-folder-delete-title', { name: f.name }),
      message: t('files-folder-delete-message', { count: inside }),
      confirm: t('files-folder-delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      await filesFolderDelete(f.id);
      // What was in it is where the folder was.
      if (selected && files.descendants(f.id).has(selected)) onselect(f.parent ?? null);
      await files.reload();
    } catch (error) {
      notifyError(t('files-folder-delete-failed'), error);
    }
  }

  async function move(id: string, parent: string | null) {
    try {
      await filesFolderMove(id, parent);
      await refresh();
    } catch (error) {
      notifyError(t('files-folder-move-failed'), error);
    }
  }

  /** The places a folder can be moved to: the top, and every folder but itself and those under it. */
  function moveItems(f: FileFolder): MenuItem[] {
    const under = files.descendants(f.id);
    const walk = (parent: string | null, depth: number): MenuItem[] =>
      files.folders
        .filter((x) => parentOf(files.folders, x) === parent && !under.has(x.id))
        .sort(byName)
        .flatMap((x) => [
          {
            label: ' '.repeat(depth) + x.name,
            icon: depth ? undefined : Folder,
            disabled: x.id === f.parent,
            action: () => move(f.id, x.id),
          } as MenuItem,
          ...walk(x.id, depth + 1),
        ]);
    return [
      {
        label: t('files-folder-to-top'),
        icon: Files,
        disabled: !f.parent,
        action: () => move(f.id, null),
      },
      { kind: 'separator' },
      ...walk(null, 0),
    ];
  }

  /** What can be done with a folder, in its menu. */
  function folderItems(f: FileFolder): MenuItem[] {
    return [
      { label: t('files-folder-new-inside'), icon: FolderPlus, action: () => begin(f.id) },
      { label: t('common-rename'), icon: Pencil, shortcut: 'F2', action: () => rename(f) },
      {
        kind: 'submenu',
        label: t('files-folder-move-to'),
        icon: FolderInput,
        disabled: !f.parent && files.folders.length < 2,
        items: moveItems(f),
      },
      { kind: 'separator' },
      {
        label: t('files-folder-go-through'),
        icon: ListChecks,
        disabled: !unassignedIn(f.id).length,
        action: () => goThrough(unassignedIn(f.id)),
      },
      {
        label: t('files-export'),
        icon: FolderOutput,
        disabled: !files.inFolder(f.id).length,
        action: () => void exportFiles({ kind: 'folder', id: f.id }, files.inFolder(f.id).length),
      },
      { kind: 'separator' },
      { label: t('files-folder-delete'), icon: Trash2, danger: true, action: () => remove(f) },
    ];
  }

  async function drop(event: DropEvent, target: FileFolder | null) {
    const { payload } = event;
    if (payload.kind === FILES_DRAGGED) {
      await moveFiles(payload.data as string[], target?.id ?? null);
    } else if (payload.kind === FOLDER_DRAGGED) {
      const id = payload.data as string;
      if (id !== target?.id) await move(id, target?.id ?? null);
    } else if (payload.kind === 'files') {
      // From the desktop: taken in, a folder with its folders.
      await takeIn(payload.data as string[], target?.id ?? null, true);
    }
  }

  function accepts(target: FileFolder | null) {
    return (p: { kind: string; data: unknown }) =>
      p.kind === FILES_DRAGGED ||
      p.kind === 'files' ||
      (p.kind === FOLDER_DRAGGED &&
        (!target || (p.data !== target.id && !files.descendants(p.data as string).has(target.id))));
  }

  function toggle(id: string) {
    if (collapsed.has(id)) collapsed.delete(id);
    else collapsed.add(id);
    collapsed = new Set(collapsed);
  }

  function onkeydown(event: KeyboardEvent, f: FileFolder) {
    if (event.key === 'F2') {
      event.preventDefault();
      rename(f);
    } else if (event.key === 'Delete') {
      event.preventDefault();
      remove(f);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onselect(f.id);
    }
  }
</script>

{#snippet nameInput(depth: number)}
  <div class="item naming" style:padding-left="{10 + depth * 14 + 16}px">
    <Folder size={15} strokeWidth={1.6} />
    <input
      bind:this={input}
      bind:value={naming!.value}
      placeholder={t('files-folder-name')}
      aria-label={t('files-folder-name')}
      onblur={commit}
      onkeydown={(e) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') naming = null;
        e.stopPropagation();
      }}
    />
  </div>
{/snippet}

<div class="tree" data-file-folders>
  <button
    type="button"
    class="item all"
    class:selected={selected === null}
    data-folder=""
    use:dropTarget={{ accepts: accepts(null), ondrop: (e) => void drop(e, null) }}
    onclick={() => onselect(null)}
  >
    <Files size={15} strokeWidth={1.6} />
    <span class="name truncate">{t('files-all')}</span>
    <span class="count">{files.files.length.toLocaleString(languages.current)}</span>
  </button>

  <div class="heading">
    <span class="overline">{t('files-folders')}</span>
    <IconButton label={t('files-folder-new')} size="sm" onclick={() => begin(null)}
      ><Plus size={14} /></IconButton
    >
  </div>

  {#if naming?.id === 'new' && naming.parent === null}
    {@render nameInput(0)}
  {/if}

  {#each nodes as node (node.folder.id)}
    {@const f = node.folder}
    {#if naming?.id === f.id}
      {@render nameInput(node.depth)}
    {:else}
      <div
        class="item"
        class:selected={selected === f.id}
        role="button"
        tabindex="0"
        data-folder={f.id}
        title={pathOf(files.folders, f.id)}
        style:padding-left="{10 + node.depth * 14}px"
        use:dropTarget={{ accepts: accepts(f), ondrop: (e) => void drop(e, f) }}
        onclick={() => onselect(f.id)}
        ondblclick={() => rename(f)}
        oncontextmenu={(e) => openContextMenu(e, folderItems(f))}
        onkeydown={(e) => onkeydown(e, f)}
        onpointerdown={(e) =>
          startDrag(e, () => ({ kind: FOLDER_DRAGGED, data: f.id, label: f.name }))}
      >
        <button
          type="button"
          class="twisty"
          class:open={!collapsed.has(f.id)}
          class:hidden={node.children === 0}
          aria-label={collapsed.has(f.id) ? t('files-folder-expand') : t('files-folder-collapse')}
          tabindex="-1"
          onclick={(e) => {
            e.stopPropagation();
            toggle(f.id);
          }}
        >
          <ChevronRight size={13} />
        </button>
        <Folder size={15} strokeWidth={1.6} />
        <span class="name truncate">{f.name}</span>
        <span class="count">{node.count.toLocaleString(languages.current)}</span>
      </div>
    {/if}
    {#if naming?.id === 'new' && naming.parent === f.id}
      {@render nameInput(node.depth + 1)}
    {/if}
  {/each}

  {#if !nodes.length && !naming}
    <p class="none">{t('files-folders-hint')}</p>
  {/if}
</div>

<style>
  .tree {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 10px 8px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    height: 30px;
    padding: 0 8px 0 10px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    text-align: left;
    cursor: pointer;
  }
  .item.all {
    padding-left: 12px;
  }
  .item:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .item.selected {
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-weight: 500;
  }
  .item:global([data-drop-over]) {
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }
  .name {
    flex: 1;
    min-width: 0;
  }
  .count {
    font-size: var(--text-xs);
    color: var(--ink-4);
    font-variant-numeric: tabular-nums;
  }
  .selected .count {
    color: var(--accent);
  }
  .twisty {
    display: inline-flex;
    width: 16px;
    height: 16px;
    margin-right: -3px;
    padding: 0;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    transition: transform var(--fast) var(--ease);
  }
  .twisty.open {
    transform: rotate(90deg);
  }
  .twisty.hidden {
    visibility: hidden;
  }
  .twisty:hover {
    color: var(--ink);
  }
  .heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 4px 2px 12px;
  }
  .naming {
    cursor: text;
    background: var(--paper-raised);
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }
  .naming input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
  }
  .none {
    padding: 6px 12px;
    font-size: var(--text-sm);
    color: var(--ink-4);
    line-height: 1.5;
  }
</style>
