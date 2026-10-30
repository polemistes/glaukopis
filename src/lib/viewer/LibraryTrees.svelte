<script module lang="ts">
  import { SvelteSet } from 'svelte/reactivity';

  /** The folders unfolded by hand in the tree, kept while the application runs. */
  const unfolded = new SvelteSet<string>();
</script>

<script lang="ts">
  /**
   * The files of the library that can be shown in a side, PDFs and images,
   * in their folders, as a tree under the field of the menu of files over a
   * side (ADR 0069): the folders folded until opened. With something written
   * in the field, the files that answer to it alone, in the folders that hold
   * them, unfolded. A file chosen is shown in that side, in the place of what
   * it showed; the one it shows is marked.
   */
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import FileText from '@lucide/svelte/icons/file-text';
  import Folder from '@lucide/svelte/icons/folder';
  import type { FileFolder, FileView } from '$lib/api/files';
  import { fileLabel, fileMatches, files, KIND_ICONS } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';

  interface Props {
    /** The file this side shows, marked in the tree. */
    current?: string | null;
    /** What was written in the field: the files that answer to it alone are listed. */
    filter?: string;
    /** Shows a file of the library in this side. */
    onfile: (hash: string) => void;
    /** The key up from the first row: the field over the tree takes the cursor. */
    onup?: () => void;
  }

  let { current = null, filter = '', onfile, onup }: Props = $props();

  $effect(() => {
    if (!files.loaded) void files.load();
  });

  const step = 14;
  const left = 4;

  /** A row of the tree: a folder, or a file that can be shown. */
  interface Row {
    key: string;
    kind: 'folder' | 'file';
    name: string;
    depth: number;
    /** Whether it holds rows, and whether they are shown. */
    holds: boolean;
    open: boolean;
    /** The hash of a file. */
    hash?: string;
    /** What the pointer is told: of a file named by its reference, its title and its name (ADR 0073). */
    title?: string;
    icon: typeof FileText;
  }

  const byOrder = (a: FileFolder, b: FileFolder) => a.order.localeCompare(b.order);
  /** The files that can be shown: PDFs and images that are there. */
  const showable = (f: FileView) => f.exists && (f.kind === 'pdf' || f.kind === 'picture');

  const sought = $derived(filter.trim());

  /**
   * The folders of the library and their files, from a folder down, as the
   * rows of a tree. While something is sought, every folder is open, and one
   * that holds nothing sought is left out.
   */
  function filesUnder(parent: string | null, depth: number, out: Row[]) {
    const folders = files.folders.filter((f) => (f.parent ?? null) === parent).sort(byOrder);
    for (const f of folders) {
      const key = `folder:${f.id}`;
      const open = sought ? true : unfolded.has(key);
      const within: Row[] = [];
      if (open) filesUnder(f.id, depth + 1, within);
      if (sought && !within.length) continue;
      out.push(
        { key, kind: 'folder', name: f.name, depth, holds: true, open, icon: Folder },
        ...within,
      );
    }
    const shown = files
      .inFolder(parent, false)
      .filter(showable)
      .filter((f) => fileMatches(f, sought))
      .map((f) => ({ f, label: fileLabel(f) }))
      .sort((a, b) => a.label.name.localeCompare(b.label.name));
    for (const { f, label } of shown) {
      out.push({
        key: `file:${f.hash}`,
        kind: 'file',
        name: label.name,
        title: label.title,
        depth,
        holds: false,
        open: false,
        hash: f.hash,
        icon: KIND_ICONS[f.kind] ?? FileText,
      });
    }
  }

  const rows = $derived.by(() => {
    const out: Row[] = [];
    filesUnder(null, 0, out);
    return out;
  });
  /** Whether the library has any file that can be shown. */
  const any = $derived(files.files.some(showable));

  let root = $state<HTMLDivElement>();

  function act(row: Row) {
    if (row.holds) {
      if (row.open) unfolded.delete(row.key);
      else unfolded.add(row.key);
    } else if (row.hash) onfile(row.hash);
  }

  function onkeydown(event: KeyboardEvent, row: Row) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      act(row);
    } else if (event.key === 'ArrowRight' && row.holds && !row.open) unfolded.add(row.key);
    else if (event.key === 'ArrowLeft' && row.holds && row.open) unfolded.delete(row.key);
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      // Up and down walk the rows; up from the first leaves the tree.
      event.preventDefault();
      const all = Array.from(root?.querySelectorAll<HTMLElement>('[data-tree-row]') ?? []);
      const at = all.indexOf(event.currentTarget as HTMLElement);
      const next = all[at + (event.key === 'ArrowDown' ? 1 : -1)];
      if (next) next.focus();
      else if (event.key === 'ArrowUp') onup?.();
    }
  }
</script>

<div
  bind:this={root}
  class="trees"
  role="tree"
  aria-label={t('viewer-files-menu')}
  data-library-trees
>
  {#each rows as row (row.key)}
    {@const Icon = row.icon}
    <div
      class="row {row.kind}"
      class:current={!!row.hash && row.hash === current}
      role="treeitem"
      tabindex="0"
      aria-expanded={row.holds ? row.open : undefined}
      aria-selected={!!row.hash && row.hash === current}
      aria-current={row.hash && row.hash === current ? 'page' : undefined}
      data-tree-row={row.key}
      data-tree-kind={row.kind}
      title={row.title ?? row.name}
      style:padding-left="{left + row.depth * step}px"
      onclick={() => act(row)}
      onkeydown={(e) => onkeydown(e, row)}
    >
      <span class="twisty" class:open={row.open} class:hidden={!row.holds}>
        <ChevronRight size={13} />
      </span>
      <Icon size={15} strokeWidth={1.6} />
      <span class="name truncate">{row.name}</span>
    </div>
  {:else}
    {#if files.loaded}
      <p class="none" data-tree-none>
        {any ? t('files-choose-files-none') : t('viewer-tree-empty')}
      </p>
    {/if}
  {/each}
</div>

<style>
  .trees {
    padding: 4px 0 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    padding-right: 2px;
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
  .row.current {
    background: var(--accent-soft);
    color: var(--ink);
  }
  .row .name {
    flex: 1;
    min-width: 0;
    font-size: var(--text-sm);
  }
  .row.folder .name {
    font-weight: 500;
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
  .none {
    margin: 0;
    padding: 8px 6px 6px;
    color: var(--ink-4);
    font-size: var(--text-sm);
  }
</style>
