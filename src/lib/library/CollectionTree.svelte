<script lang="ts">
  import { tick } from 'svelte';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Folder from '@lucide/svelte/icons/folder';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import LibraryBig from '@lucide/svelte/icons/library-big';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import {
    collectionAdd,
    collectionCreate,
    collectionDelete,
    collectionList,
    collectionMove,
    collectionRename,
    type Collection,
  } from '$lib/api/library';
  import { library } from '$lib/state/library.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { dropTarget, startDrag, type DropEvent } from '$lib/ui/drag.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { plural } from './format';

  interface Props {
    /** The collection shown, or null for the whole library. */
    selected: string | null;
    onselect: (id: string | null) => void;
  }

  let { selected, onselect }: Props = $props();

  let collapsed = $state(new Set<string>());
  /** The collection being named: its id, or 'new' with the parent it will lie in. */
  let naming = $state<{ id: string | 'new'; parent: string | null; value: string } | null>(null);
  let input = $state<HTMLInputElement>();

  interface Node {
    collection: Collection;
    depth: number;
    count: number;
    children: number;
  }

  const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

  const nodes = $derived.by(() => {
    const out: Node[] = [];
    const walk = (parent: string | null, depth: number) => {
      const children = library.collections
        .filter((c) => (c.parent ?? null) === parent)
        .sort((a, b) => collator.compare(a.name, b.name));
      for (const c of children) {
        const kids = library.collections.filter((x) => x.parent === c.id).length;
        out.push({ collection: c, depth, count: library.idsIn(c.id).size, children: kids });
        if (!collapsed.has(c.id)) walk(c.id, depth + 1);
      }
    };
    walk(null, 0);
    return out;
  });

  async function refresh() {
    library.setCollections(await collectionList());
  }

  async function begin(parent: string | null) {
    if (parent) {
      collapsed.delete(parent);
      collapsed = new Set(collapsed);
    }
    naming = { id: 'new', parent, value: '' };
    await tick();
    input?.focus();
  }

  async function rename(c: Collection) {
    naming = { id: c.id, parent: c.parent, value: c.name };
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
        const created = await collectionCreate(name, n.parent);
        await refresh();
        onselect(created.id);
      } else if (library.collection(n.id)?.name !== name) {
        await collectionRename(n.id, name);
        await refresh();
      }
    } catch (error) {
      notifyError('The collection could not be named', error);
    }
  }

  async function remove(c: Collection) {
    const inside = library.collections.filter((x) => x.parent === c.id).length;
    const ok = await confirm({
      title: `Delete the collection “${c.name}”?`,
      message:
        (inside ? 'The collections inside it are deleted as well. ' : '') +
        'The references stay in your library.',
      confirm: 'Delete collection',
      danger: true,
    });
    if (!ok) return;
    try {
      await collectionDelete(c.id);
      if (selected && (selected === c.id || !library.collections.some((x) => x.id === selected))) {
        onselect(null);
      }
      await refresh();
      if (selected && !library.collection(selected)) onselect(null);
    } catch (error) {
      notifyError('The collection could not be deleted', error);
    }
  }

  function context(event: MouseEvent, c: Collection) {
    openContextMenu(event, [
      { label: 'New collection inside', icon: FolderPlus, action: () => begin(c.id) },
      { label: 'Rename', icon: Pencil, shortcut: 'F2', action: () => rename(c) },
      ...(c.parent
        ? [{ label: 'Move to the top level', action: () => move(c.id, null) } as const]
        : []),
      { kind: 'separator' },
      { label: 'Delete collection', icon: Trash2, danger: true, action: () => remove(c) },
    ]);
  }

  async function move(id: string, parent: string | null) {
    try {
      await collectionMove(id, parent);
      await refresh();
    } catch (error) {
      notifyError('The collection could not be moved', error);
    }
  }

  async function drop(event: DropEvent, target: Collection | null) {
    const { payload } = event;
    try {
      if (payload.kind === 'references' && target) {
        const ids = payload.data as string[];
        const added = await collectionAdd(target.id, ids);
        await refresh();
        if (added === 0) notifyOk(`Already in “${target.name}”`);
        else notifyOk(`${plural(added, 'reference')} added to “${target.name}”`);
      } else if (payload.kind === 'collection') {
        const id = payload.data as string;
        if (id !== target?.id) await move(id, target?.id ?? null);
      }
    } catch (error) {
      notifyError('That could not be done', error);
    }
  }

  function toggle(id: string) {
    if (collapsed.has(id)) collapsed.delete(id);
    else collapsed.add(id);
    collapsed = new Set(collapsed);
  }

  function onkeydown(event: KeyboardEvent, c: Collection) {
    if (event.key === 'F2') {
      event.preventDefault();
      rename(c);
    } else if (event.key === 'Delete') {
      event.preventDefault();
      remove(c);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onselect(c.id);
    }
  }
</script>

{#snippet nameInput(depth: number)}
  <div class="item naming" style:padding-left="{10 + depth * 14 + 16}px">
    <Folder size={15} strokeWidth={1.6} />
    <input
      bind:this={input}
      bind:value={naming!.value}
      placeholder="Name of the collection"
      aria-label="Name of the collection"
      onblur={commit}
      onkeydown={(e) => {
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') naming = null;
        e.stopPropagation();
      }}
    />
  </div>
{/snippet}

<div class="tree">
  <button
    type="button"
    class="item all"
    class:selected={selected === null}
    use:dropTarget={{ accepts: ['collection'], ondrop: (e) => drop(e, null) }}
    onclick={() => onselect(null)}
  >
    <LibraryBig size={15} strokeWidth={1.6} />
    <span class="name truncate">All references</span>
    <span class="count">{library.entries.length.toLocaleString()}</span>
  </button>

  <div class="heading">
    <span class="overline">Collections</span>
    <IconButton label="New collection" size="sm" onclick={() => begin(null)}
      ><Plus size={14} /></IconButton
    >
  </div>

  {#if naming?.id === 'new' && naming.parent === null}
    {@render nameInput(0)}
  {/if}

  {#each nodes as node (node.collection.id)}
    {@const c = node.collection}
    {#if naming?.id === c.id}
      {@render nameInput(node.depth)}
    {:else}
      <div
        class="item"
        class:selected={selected === c.id}
        role="button"
        tabindex="0"
        style:padding-left="{10 + node.depth * 14}px"
        use:dropTarget={{
          accepts: (p) => p.kind === 'references' || (p.kind === 'collection' && p.data !== c.id),
          ondrop: (e) => drop(e, c),
        }}
        onclick={() => onselect(c.id)}
        ondblclick={() => rename(c)}
        oncontextmenu={(e) => context(e, c)}
        onkeydown={(e) => onkeydown(e, c)}
        onpointerdown={(e) =>
          startDrag(e, () => ({ kind: 'collection', data: c.id, label: c.name }))}
      >
        <button
          type="button"
          class="twisty"
          class:open={!collapsed.has(c.id)}
          class:hidden={node.children === 0}
          aria-label={collapsed.has(c.id) ? 'Expand' : 'Collapse'}
          tabindex="-1"
          onclick={(e) => {
            e.stopPropagation();
            toggle(c.id);
          }}
        >
          <ChevronRight size={13} />
        </button>
        <Folder size={15} strokeWidth={1.6} />
        <span class="name truncate">{c.name}</span>
        <span class="count">{node.count.toLocaleString()}</span>
      </div>
    {/if}
    {#if naming?.id === 'new' && naming.parent === c.id}
      {@render nameInput(node.depth + 1)}
    {/if}
  {/each}

  {#if !nodes.length && !naming}
    <p class="none">
      Collections gather references for a subject or a piece of work. A reference can be in any
      number of them.
    </p>
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
