<script module lang="ts">
  import { SvelteSet } from 'svelte/reactivity';

  /** The folders unfolded by hand in the tree, kept while the application runs; the tree itself among them. */
  const unfolded = new SvelteSet<string>();
</script>

<script lang="ts">
  /**
   * Under the tree of all projects, which the chevron over a side opens
   * (ADR 0069, 0070): the files of the library that can be shown, PDFs and
   * images, in their folders, as a tree folded until it is opened. A file
   * chosen is shown in that side, in the place of what it showed.
   */
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import FileText from '@lucide/svelte/icons/file-text';
  import Folder from '@lucide/svelte/icons/folder';
  import type { FileFolder, FileView } from '$lib/api/files';
  import { files, KIND_ICONS } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';

  interface Props {
    /** The file this side shows, marked in the trees. */
    current?: string | null;
    /** Shows a file of the library in this side. */
    onfile: (hash: string) => void;
  }

  let { current = null, onfile }: Props = $props();

  $effect(() => {
    if (!files.loaded) void files.load();
  });

  const FILES = 'files';
  const step = 14;
  const left = 4;

  /** A row of the tree: its head, a folder, or a file that can be shown. */
  interface Row {
    key: string;
    kind: 'tree' | 'folder' | 'file';
    name: string;
    depth: number;
    /** Whether it holds rows, and whether they are shown. */
    holds: boolean;
    open: boolean;
    /** The hash of a file. */
    hash?: string;
    icon: typeof FileText;
  }

  const byOrder = (a: FileFolder, b: FileFolder) => a.order.localeCompare(b.order);
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  /** The files that can be shown: PDFs and images that are there. */
  const showable = (f: FileView) => f.exists && (f.kind === 'pdf' || f.kind === 'picture');

  /** The folders of the library and their files, from a folder down, as the rows of a tree. */
  function filesUnder(parent: string | null, depth: number, out: Row[]) {
    const folders = files.folders.filter((f) => (f.parent ?? null) === parent).sort(byOrder);
    for (const f of folders) {
      const key = `folder:${f.id}`;
      const open = unfolded.has(key);
      out.push({ key, kind: 'folder', name: f.name, depth, holds: true, open, icon: Folder });
      if (open) filesUnder(f.id, depth + 1, out);
    }
    for (const f of files.inFolder(parent, false).filter(showable).sort(byName)) {
      out.push({
        key: `file:${f.hash}`,
        kind: 'file',
        name: f.name,
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
    const filesOpen = unfolded.has(FILES);
    out.push({
      key: FILES,
      kind: 'tree',
      name: t('viewer-tree-files'),
      depth: 0,
      holds: true,
      open: filesOpen,
      icon: FileText,
    });
    if (filesOpen) filesUnder(null, 1, out);
    return out;
  });

  /** Whether a tree opened holds nothing: said under its head. */
  const emptyAfter = $derived(
    new Set(
      rows
        .filter((r, i) => r.kind === 'tree' && r.open && (rows[i + 1]?.depth ?? 0) === 0)
        .map((r) => r.key),
    ),
  );

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
  }
</script>

<div class="trees" role="tree" aria-label={t('viewer-tree-files')} data-library-trees>
  <div class="rule" role="separator"></div>
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
      title={row.name}
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
    {#if emptyAfter.has(row.key)}
      <p class="none" style:padding-left="{left + step + 22}px">{t('viewer-tree-empty')}</p>
    {/if}
  {/each}
</div>

<style>
  .trees {
    padding-bottom: 8px;
  }
  .rule {
    height: 1px;
    margin: 8px 6px;
    background: var(--line);
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
  .row.tree .name,
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
    padding: 4px 0 6px;
    color: var(--ink-4);
    font-size: var(--text-sm);
  }
</style>
