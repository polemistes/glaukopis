<script module lang="ts">
  import { SvelteSet } from 'svelte/reactivity';

  /**
   * How the tree of the open project is folded in the pane, kept while the
   * application runs: the elements unfolded by hand, and those folded by
   * hand though they lie on the way to the element in view. Keyed by
   * project and element.
   */
  const unfoldedByHand = new SvelteSet<string>();
  const foldedByHand = new SvelteSet<string>();
  /** The projects that are not open whose trees are shown under their rows in the pane, by id. */
  const closedUnfolded = new SvelteSet<string>();
</script>

<script lang="ts">
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import Minimize2 from '@lucide/svelte/icons/minimize-2';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Folder from '@lucide/svelte/icons/folder';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import Search from '@lucide/svelte/icons/search';
  import type { Folder as FolderInfo, ProjectInfo } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { Tree } from '$lib/project/model/tree';
  import { viewing } from '$lib/project/ProjectView.svelte';
  import { router } from '$lib/state/router.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { PROJECT } from '$lib/project/model/types';
  import { projects } from '$lib/state/projects.svelte';
  import Button from '$lib/ui/Button.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { dropTarget, startDrag, type DragPayload, type DropEvent } from '$lib/ui/drag.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { tick, untrack } from 'svelte';
  import { ago } from '$lib/util/time';
  import { ancestors, folderOf, rows as makeRows } from './folders';
  import { moveThings, thingsOf, wouldMove } from './changes';
  import { closedTrees } from './closed.svelte';
  import { listUi } from './list.svelte';
  import type { ProjectActions } from './project-actions.svelte';
  import ProjectBadge from './ProjectBadge.svelte';
  import Mark from '$lib/shell/Mark.svelte';

  interface Props {
    /** What opens a project, its menu, and the dialog that asks for a name: the place's own. */
    actions: ProjectActions;
    /** A narrow column, as in the pane of projects: the names only. */
    compact?: boolean;
    /** The project that is open, marked in the list and scrolled into view. */
    current?: string | null;
    /**
     * The open project itself, where the view gives it: its tree stands
     * under its row, folded but along the way to the element in view, which
     * is marked (ADR 0037).
     */
    project?: Project | null;
    /** The element in view in the open project. */
    at?: string | null;
    /** Enters an element of the open project. */
    onenter?: (id: string) => void;
    /**
     * Where the owl map is in view: null at the owl, whose row at the top
     * is marked, or a folder's id where one is entered, whose row is marked.
     */
    owlAt?: string | null;
  }

  let {
    actions,
    compact = false,
    current = null,
    project = null,
    at = null,
    onenter,
    owlAt = undefined,
  }: Props = $props();
  const owlHere = $derived(owlAt === null);

  let filter = $state('');
  let listEl = $state<HTMLDivElement>();

  const rows = $derived(
    makeRows(projects.folders, projects.list, { collapsed: listUi.collapsed, filter }),
  );
  /** How far each step deeper is drawn in. */
  const step = $derived(compact ? 14 : 20);
  /** Where the folders and projects begin: a step in from the owl, which holds them all. */
  const left = $derived((compact ? 4 : 8) + step);

  const open = (p: ProjectInfo) => actions.open(p);
  const toggle = (id: string) => listUi.toggle(id);
  const reveal = (id: string | null) => listUi.reveal(ancestors(projects.folders, id));

  // The project that is open is shown: the folders it lies in open, and its row scrolled to.
  $effect(() => {
    const id = current;
    if (!id || !projects.loaded) return;
    untrack(() => {
      const p = projects.list.find((x) => x.id === id);
      if (p) reveal(folderOf(projects.folders, p));
      void tick().then(() =>
        listEl
          ?.querySelector(`[data-project="${CSS.escape(id)}"]`)
          ?.scrollIntoView({ block: 'nearest' }),
      );
    });
  });

  /** The menu of a project in the list: with Open beside while another is open, and the moves. */
  function projectItems(p: ProjectInfo): MenuItem[] {
    const beside: MenuItem[] =
      current && p.id !== current
        ? [{ label: t('home-open-beside'), icon: Columns2, action: () => viewing.beside?.(p.id) }]
        : [];
    return actions.itemsWithMoves(p, { here: p.id === current, afterOpen: beside });
  }

  const openAsMap = (f: FolderInfo) => router.go({ view: 'owl', at: f.id });
  const folderItems = (f: FolderInfo) =>
    actions.folderItems(f, [
      {
        label: t('home-owl-enter'),
        icon: Minimize2,
        disabled: owlAt === f.id,
        action: () => openAsMap(f),
      },
    ]);

  // The folder in view on the owl map is shown: the folders it lies in open.
  $effect(() => {
    const id = owlAt;
    if (id) untrack(() => listUi.reveal(ancestors(projects.folders, id).slice(1)));
  });
  const removeFolder = (f: FolderInfo) => void actions.removeFolder(f);

  /** Whether what is dragged may be dropped into a folder, or at the top. */
  function accepts(target: string | null) {
    return (payload: DragPayload) => {
      const things = thingsOf(payload);
      return !!things && wouldMove(things, target);
    };
  }

  function drop(event: DropEvent, target: string | null) {
    const things = thingsOf(event.payload);
    if (things) void moveThings(things, target);
  }

  function facts(p: ProjectInfo): string {
    const parts: string[] = [];
    if (p.maps.length > 1) parts.push(t('home-maps', { count: p.maps.length }));
    if (p.words) parts.push(t('home-words', { count: p.words }));
    return parts.join(' · ');
  }

  // ---- the trees of the projects: the open one, and those unfolded in the pane ----

  /** A tree shown under the row of its project. */
  interface Shown {
    /** The project, by id. */
    project: string;
    tree: Tree;
    name: (id: string) => string;
    /** The way down to the element in view: unfolded, unless folded by hand. */
    way: Set<string>;
    /** The element in view, marked; none in a project that is not open. */
    at: string | null;
    enter: (id: string) => void;
    /** Whether it is the project that is open, rather than one read from disk. */
    own: boolean;
  }

  const tree = $derived(project ? project.tree() : null);
  /** The way from the project down to the element in view: unfolded, unless folded by hand. */
  const way = $derived(new Set(project && at ? project.pathTo(at) : []));

  const ownShown = $derived.by((): Shown | null => {
    const pr = project;
    if (!pr || !tree || !current) return null;
    return {
      project: current,
      tree,
      name: (id) => pr.node(id)?.title || '',
      way,
      at,
      enter: (id) => onenter?.(id),
      own: true,
    };
  });

  const nowhere = new Set<string>();

  /** The tree of a project that is not open, as it was read from disk: folded but for its top-level trees. */
  function closedShown(p: ProjectInfo, read: Tree, names: Map<string, string>): Shown {
    return {
      project: p.id,
      tree: read,
      name: (id) => names.get(id) || '',
      way: nowhere,
      at: null,
      enter: (id) => router.go({ view: 'project', project: p.id, at: id }),
      own: false,
    };
  }

  /** Whether the tree of a project that is not open can be unfolded under its row: in the pane. */
  const unfoldable = (p: ProjectInfo) => compact && p.id !== current;

  function toggleClosed(p: ProjectInfo) {
    if (closedUnfolded.has(p.id)) closedUnfolded.delete(p.id);
    else closedUnfolded.add(p.id);
  }

  // What is unfolded is read from disk, and again when the project has changed.
  $effect(() => {
    if (!compact) return;
    for (const p of projects.list) {
      if (p.id !== current && closedUnfolded.has(p.id)) closedTrees.want(p);
    }
  });

  const foldKey = (src: Shown, id: string) => `${src.project}:${id}`;

  function isUnfolded(src: Shown, id: string): boolean {
    const key = foldKey(src, id);
    if (foldedByHand.has(key)) return false;
    return unfoldedByHand.has(key) || src.way.has(id);
  }

  function toggleFold(src: Shown, id: string) {
    const key = foldKey(src, id);
    if (isUnfolded(src, id)) {
      unfoldedByHand.delete(key);
      foldedByHand.add(key);
    } else {
      foldedByHand.delete(key);
      unfoldedByHand.add(key);
    }
  }

  /** The menu of an element of a project that is not open: open it there, or beside. */
  function elementItems(src: Shown, id: string): MenuItem[] {
    return [
      { label: t('common-open'), action: () => src.enter(id) },
      ...(current
        ? [
            {
              label: t('home-open-beside'),
              icon: Columns2,
              action: () => viewing.beside?.(src.project, id),
            } as MenuItem,
          ]
        : []),
    ];
  }

  // Entering an element unfolds the way to it, whatever was folded by hand before.
  $effect(() => {
    if (!project || !at) return;
    const ids = project.pathTo(at);
    const id = current;
    untrack(() => {
      for (const element of ids) foldedByHand.delete(`${id}:${element}`);
    });
  });

  function onelementkey(event: KeyboardEvent, src: Shown, id: string, holds: boolean) {
    if (event.key === 'Enter' || event.key === ' ') src.enter(id);
    else if (event.key === 'ArrowRight' && holds && !isUnfolded(src, id)) toggleFold(src, id);
    else if (event.key === 'ArrowLeft' && holds && isUnfolded(src, id)) toggleFold(src, id);
    else return;
    event.preventDefault();
  }

  function onprojectkey(event: KeyboardEvent, p: ProjectInfo) {
    if (event.key === 'Enter' || event.key === ' ') open(p);
    else if (event.key === 'ArrowRight' && unfoldable(p) && !closedUnfolded.has(p.id))
      toggleClosed(p);
    else if (event.key === 'ArrowLeft' && unfoldable(p) && closedUnfolded.has(p.id))
      toggleClosed(p);
    else return;
    event.preventDefault();
  }

  function onfolderkey(event: KeyboardEvent, f: FolderInfo) {
    if (event.key === 'F2') actions.renameFolder(f);
    else if (event.key === 'Delete') removeFolder(f);
    else if (event.key === 'Enter' || event.key === ' ') toggle(f.id);
    else return;
    event.preventDefault();
  }
</script>

<div
  class="list"
  class:compact
  bind:this={listEl}
  use:dropTarget={{ accepts: accepts(null), ondrop: (e) => drop(e, null) }}
>
  <div class="tools">
    <TextField
      bind:value={filter}
      size="sm"
      placeholder={t('home-search')}
      aria-label={t('home-search')}
    >
      {#snippet leading()}<Search size={14} />{/snippet}
    </TextField>
    {#if compact}
      <IconButton label={t('home-new-folder')} size="sm" onclick={() => actions.newFolder(null)}>
        <FolderPlus size={15} />
      </IconButton>
    {:else}
      <Button size="sm" onclick={() => actions.newFolder(null)}>
        {#snippet icon()}<FolderPlus size={14} />{/snippet}
        {t('home-new-folder')}
      </Button>
    {/if}
  </div>

  <!-- The owl map, at the top: all the projects, as one map. -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="row owl"
    class:current={owlHere}
    role="button"
    tabindex="0"
    aria-current={owlHere ? 'page' : undefined}
    data-owl
    data-current={owlHere ? '' : undefined}
    style:padding-left="{compact ? 4 : 8}px"
    onclick={() => router.go({ view: 'owl' })}
    onkeydown={(e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      router.go({ view: 'owl' });
    }}
  >
    <Mark size={compact ? 15 : 17} />
    <span class="name serif truncate">{t('project-all-projects')}</span>
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
        class:current={owlAt === f.id}
        aria-current={owlAt === f.id ? 'page' : undefined}
        data-current={owlAt === f.id ? '' : undefined}
        style:padding-left="{left + row.depth * step}px"
        use:dropTarget={{ accepts: accepts(f.id), ondrop: (e) => drop(e, f.id) }}
        onclick={() => toggle(f.id)}
        ondblclick={() => openAsMap(f)}
        oncontextmenu={(e) => openContextMenu(e, folderItems(f))}
        onkeydown={(e) => onfolderkey(e, f)}
        onpointerdown={(e) => startDrag(e, () => ({ kind: 'folder', data: f.id, label: f.name }))}
      >
        <span class="twisty" class:open={row.open} class:hidden={!row.holds}>
          <ChevronRight size={13} />
        </span>
        <Folder size={15} strokeWidth={1.6} />
        <span class="name truncate">{f.name}</span>
        {#if compact}
          <span class="count">{row.projects}</span>
        {:else}
          <span class="count">{t('home-folder-projects', { count: row.projects })}</span>
        {/if}
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
        class:current={p.id === current}
        role="button"
        tabindex="0"
        aria-current={p.id === current ? 'page' : undefined}
        data-depth={row.depth}
        data-project={p.id}
        data-current={p.id === current ? '' : undefined}
        title={compact ? p.name : undefined}
        style:padding-left="{left + row.depth * step + (compact ? 0 : 22)}px"
        onclick={() => open(p)}
        onkeydown={(e) => onprojectkey(e, p)}
        oncontextmenu={(e) => openContextMenu(e, projectItems(p))}
        onpointerdown={(e) => startDrag(e, () => ({ kind: 'project', data: p.id, label: p.name }))}
      >
        {#if compact}
          {@const unfolded = unfoldable(p) && closedUnfolded.has(p.id)}
          <button
            type="button"
            class="fold"
            class:open={unfolded}
            class:hidden={!unfoldable(p)}
            tabindex="-1"
            aria-label={unfolded ? t('home-tree-fold') : t('home-tree-unfold')}
            aria-expanded={unfoldable(p) ? unfolded : undefined}
            onclick={(e) => {
              e.stopPropagation();
              toggleClosed(p);
            }}
            onpointerdown={(e) => e.stopPropagation()}
          >
            <ChevronRight size={12} />
          </button>
        {/if}
        <ProjectBadge
          name={p.name}
          sharing={p.sharing ? { owner: p.sharing.owner } : null}
          size={compact ? 14 : 16}
        />
        <span class="name serif truncate">{p.name}</span>
        {#if !compact}
          <span class="facts truncate">{facts(p)}</span>
          <span class="when">{t('home-changed', { ago: ago(p.modified) })}</span>
        {/if}
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
      {#if p.id === current && ownShown && (ownShown.tree.children.get(PROJECT)?.length ?? 0) > 0}
        <div class="tree" data-project-tree={p.id}>
          {@render branch(
            ownShown,
            ownShown.tree.children.get(PROJECT) ?? [],
            0,
            left + row.depth * step + 22,
          )}
        </div>
      {:else if unfoldable(p) && closedUnfolded.has(p.id)}
        {@const reading = closedTrees.get(p.id)}
        {@const indent = left + row.depth * step + 22}
        <div class="tree closed" data-closed-tree={p.id}>
          {#if reading?.state === 'read'}
            {@const top = reading.tree.tree.children.get(PROJECT) ?? []}
            {#if top.length}
              {@render branch(
                closedShown(p, reading.tree.tree, reading.tree.names),
                top,
                0,
                indent,
              )}
            {:else}
              <p class="say" style:padding-left="{indent + 18}px">{t('home-tree-empty')}</p>
            {/if}
          {:else if reading?.state === 'failed'}
            <p class="say" style:padding-left="{indent + 18}px">{t('home-tree-unreadable')}</p>
          {:else}
            <p class="say" style:padding-left="{indent + 18}px"><Spinner size={12} /></p>
          {/if}
        </div>
      {/if}
    {/if}
  {/each}

  {#if !rows.length}
    <p class="none">{filter.trim() ? t('home-search-none') : t('home-list-none')}</p>
  {/if}
</div>

<!-- The elements of the open project, each a line, those under an unfolded one drawn in a step further. -->
{#snippet branch(src: Shown, ids: string[], depth: number, indent: number)}
  {#each ids as id (id)}
    {@const name = src.name(id)}
    {@const holds = (src.tree.children.get(id)?.length ?? 0) > 0}
    {@const open = holds && isUnfolded(src, id)}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="row element"
      class:current={id === src.at}
      role="button"
      tabindex="0"
      aria-current={id === src.at ? 'location' : undefined}
      data-element={id}
      data-current={id === src.at ? '' : undefined}
      title={compact ? name || undefined : undefined}
      style:padding-left="{indent + depth * step}px"
      onclick={() => src.enter(id)}
      onkeydown={(e) => onelementkey(e, src, id, holds)}
      oncontextmenu={src.own ? undefined : (e) => openContextMenu(e, elementItems(src, id))}
    >
      <button
        type="button"
        class="fold"
        class:open
        class:hidden={!holds}
        tabindex="-1"
        aria-label={open ? t('home-tree-fold') : t('home-tree-unfold')}
        aria-expanded={holds ? open : undefined}
        onclick={(e) => {
          e.stopPropagation();
          toggleFold(src, id);
        }}
        onpointerdown={(e) => e.stopPropagation()}
      >
        <ChevronRight size={12} />
      </button>
      <span class="name serif truncate">{name || t('project-untitled')}</span>
    </div>
    {#if open}
      {@render branch(src, src.tree.children.get(id) ?? [], depth + 1, indent)}
    {/if}
  {/each}
{/snippet}

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
  /* The project that is open, as the outline marks the element in view. */
  .row.owl .name {
    color: var(--ink);
    font-size: 15px;
    font-weight: 500;
  }
  .row.owl.current,
  .row.folder.current,
  .row.project.current {
    background: var(--accent-soft);
  }
  /* The folder in view on the map of the projects. */
  .row.folder.current .name {
    color: var(--accent-strong);
    font-weight: 550;
  }
  .row.owl.current .name {
    color: var(--accent-strong);
    font-weight: 550;
  }
  .row.project.current .name {
    color: var(--accent-strong);
    font-weight: 550;
  }

  /* The tree of the open project: lighter than the projects, and no bigger. */
  .tree {
    display: flex;
    flex-direction: column;
  }
  /* What is said under a project that is not open, while it is read or when it cannot be. */
  .say {
    display: flex;
    align-items: center;
    min-height: 24px;
    margin: 0;
    color: var(--ink-4);
    font-size: var(--text-sm);
    font-style: italic;
  }
  .row.element {
    gap: 2px;
    min-height: 26px;
    color: var(--ink-3);
  }
  .row.element .name {
    font-size: var(--text-sm);
  }
  .row.element:hover .name {
    color: var(--ink);
  }
  .row.element.current {
    background: var(--accent-soft);
  }
  .row.element.current .name {
    color: var(--accent-strong);
    font-weight: 550;
  }
  .fold {
    display: inline-flex;
    flex: none;
    width: 16px;
    height: 16px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    transition: transform var(--fast) var(--ease);
  }
  .fold:hover {
    background: var(--paper-raised);
    color: var(--ink);
  }
  .fold.open {
    transform: rotate(90deg);
  }
  .fold.hidden {
    visibility: hidden;
  }

  /* A narrow column, as in the pane of projects: rows as the outline has them. */
  .compact {
    gap: 0;
    border-radius: 0;
  }
  .compact .tools {
    gap: 4px;
    margin-bottom: 6px;
  }
  .compact .tools :global(.field) {
    flex: 1;
    width: auto;
    min-width: 0;
  }
  .compact .row {
    gap: 6px;
    min-height: 28px;
    padding-right: 2px;
  }
  .compact .row .name {
    font-size: var(--text-sm);
  }
  .compact .row.project .name {
    font-size: var(--text-md);
  }
  .compact .row.element {
    min-height: 24px;
  }
  .compact .menu {
    padding: 3px;
  }
  .compact .none {
    padding: 14px 6px;
    font-size: var(--text-sm);
  }
</style>
