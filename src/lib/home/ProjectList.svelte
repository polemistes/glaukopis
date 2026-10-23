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
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Folder from '@lucide/svelte/icons/folder';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import Search from '@lucide/svelte/icons/search';
  import type { Folder as FolderInfo, ProjectInfo } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { Tree } from '$lib/project/model/tree';
  import { viewing, type ShownSide } from '$lib/project/ProjectView.svelte';
  import { router } from '$lib/state/router.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { PROJECT } from '$lib/project/model/types';
  import { projects } from '$lib/state/projects.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { dropTarget, startDrag, type DragPayload, type DropEvent } from '$lib/ui/drag.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { tick, untrack } from 'svelte';
  import { ancestors, folderOf, rows as makeRows, type Row } from './folders';
  import { moveThings, thingsOf, wouldMove } from './changes';
  import { closedTrees } from './closed.svelte';
  import { listUi } from './list.svelte';
  import { pressed, type ListRow, type ListSurface } from './list-keys';
  import { indent, outdent, shift as shiftElement } from '$lib/project/elements';
  import type { ProjectActions } from './project-actions.svelte';
  import ProjectBadge from './ProjectBadge.svelte';
  import { homeUndo } from './undo.svelte';

  interface Props {
    /** What opens a project, its menu, and the dialog that asks for a name: the place's own. */
    actions: ProjectActions;
    /**
     * The sides of the window and the projects they show (ADR 0063): each
     * is marked, the one with the focus most, and its tree stands under its
     * row, folded but along the way to the element in view there.
     */
    sides?: readonly ShownSide[];
    /** Enters an element of a project shown in a side. */
    onenter?: (project: string, id: string) => void;
    /**
     * Where the list chooses rather than opens, as the chooser of a project
     * to show beside the open one does: a click or Enter on a project, or on
     * an element of the tree unfolded under a project, calls it with the
     * project and the element, and nothing is opened or entered. The menus,
     * the dragging and the making of things are off; the field and the
     * folding stay.
     */
    choose?: (project: string, at?: string) => void;
    /** What cannot be chosen, where the list chooses: greyed, said to be open. */
    unavailable?: readonly string[];
    /**
     * Where the list opens at a place, as the dropdown of a path does (ADR
     * 0064): an element of a project, whose folders and tree are unfolded
     * along the way to it and which is marked and scrolled to; or a folder,
     * unfolded.
     */
    revealAt?: { project: string; element: string } | { folder: string };
    /** Whether the field that finds a project has the cursor when the list is shown. */
    focusField?: boolean;
  }

  let {
    actions,
    sides = [],
    onenter,
    choose,
    unavailable = [],
    revealAt,
    focusField = false,
  }: Props = $props();

  /** The projects shown in the sides, by id. */
  const shownIds = $derived(sides.map((side) => side.id));
  /** The project of the side that has the focus: the keys of the tree act in it. */
  const current = $derived(sides.find((side) => side.focused)?.id ?? sides[0]?.id ?? null);
  /** The element in view in the side that has the focus. */
  const at = $derived(sides.find((side) => side.id === current)?.at ?? null);

  let filter = $state('');
  let listEl = $state<HTMLDivElement>();

  const rows = $derived(
    makeRows(projects.folders, projects.list, { collapsed: listUi.collapsed, filter }),
  );
  /** How far each step deeper is drawn in. */
  const step = 14;
  /** Where the folders and projects at the top begin. */
  const left = 4;

  function open(p: ProjectInfo) {
    if (!choose) actions.open(p);
    else if (!unavailable.includes(p.id)) choose(p.id);
  }

  /** The element the list is opened at, where it is: of a project, which is then marked and its way unfolded. */
  const revealed = $derived(revealAt && 'project' in revealAt ? revealAt : null);

  // Opened at a place, the list unfolds the way to it, and scrolls to it once
  // it is drawn; the field has the cursor where it is to. It depends on the
  // place and on whether the projects are read; the tree of a project that
  // is not shown is read from disk.
  $effect(() => {
    const place = revealAt;
    if (!projects.loaded) return;
    untrack(() => {
      let key: string | null = null;
      if (place && 'folder' in place) {
        listUi.reveal([...ancestors(projects.folders, place.folder), place.folder]);
        key = `f:${place.folder}`;
      } else if (place) {
        const p = projects.list.find((x) => x.id === place.project);
        if (p) {
          reveal(folderOf(projects.folders, p));
          if (!shownIds.includes(p.id)) {
            closedUnfolded.add(p.id);
            closedTrees.want(p);
          }
        }
        key =
          place.element === PROJECT ? `p:${place.project}` : `e:${place.project}/${place.element}`;
      }
      void tick().then(() => {
        if (focusField) listEl?.querySelector<HTMLInputElement>('.tools input')?.focus();
        if (key) rowEl(key)?.scrollIntoView({ block: 'center' });
      });
    });
  });
  const toggle = (id: string) => listUi.toggle(id);
  const reveal = (id: string | null) => listUi.reveal(ancestors(projects.folders, id));

  // The projects that are shown are seen: the folders they lie in open, and
  // the row of the one with the focus scrolled to. It depends on which
  // projects are shown and which has the focus.
  $effect(() => {
    const ids = shownIds.join('\n');
    const id = current;
    if (!ids || !projects.loaded) return;
    untrack(() => {
      for (const shown of ids.split('\n')) {
        const p = projects.list.find((x) => x.id === shown);
        if (p) reveal(folderOf(projects.folders, p));
      }
      if (id)
        void tick().then(() =>
          listEl
            ?.querySelector(`[data-project="${CSS.escape(id)}"]`)
            ?.scrollIntoView({ block: 'nearest' }),
        );
    });
  });

  // A row asked for from elsewhere, as by Alt+Shift+Up at the top of a
  // project, is selected and takes the focus once it is drawn. It depends on
  // what is asked for and on whether the projects are read.
  $effect(() => {
    const key = listUi.focusRow;
    if (!key || !projects.loaded) return;
    untrack(() => {
      listUi.focusRow = null;
      const p = projectOf(key);
      if (p) reveal(folderOf(projects.folders, p));
      surface.select(key);
      void tick().then(() => surface.bringIntoView(key));
    });
  });

  /** The menu of a project in the list: the one menu of a project, with its tree folded or not where the list unfolds it. */
  function projectItems(p: ProjectInfo): MenuItem[] {
    return actions.items(p, {
      shown: shownIds,
      close: viewing.close ?? undefined,
      beside: shownIds.length ? (id) => viewing.beside?.(id) : undefined,
      // Where no project is shown, the project is opened, and its view opens the sharing window.
      share: (id) => {
        if (viewing.share) viewing.share(id);
        else {
          viewing.shareWanted = id;
          actions.open(p);
        }
      },
      fold: unfoldable(p)
        ? { folded: !closedUnfolded.has(p.id), toggle: () => toggleClosed(p) }
        : undefined,
    });
  }

  const folderItems = (f: FolderInfo) =>
    actions.folderItems(f, {
      fold: { folded: listUi.collapsed.has(f.id), toggle: () => toggle(f.id) },
    });

  /** Whether what is dragged may be dropped into a folder, or at the top. */
  function accepts(target: string | null) {
    return (payload: DragPayload) => {
      if (choose) return false;
      const things = thingsOf(payload);
      return !!things && wouldMove(things, target);
    };
  }

  function drop(event: DropEvent, target: string | null) {
    const things = thingsOf(event.payload);
    if (things) void moveThings(things, target);
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
    /** The element in view, marked; none in a project that is not shown. */
    at: string | null;
    enter: (id: string) => void;
    /** The project itself, where it is shown in a side, rather than read from disk: its elements move as in its map. */
    live: Project | null;
  }

  /** The trees of the projects shown in the sides, by project: live, as the sides show them. */
  const liveShown = $derived.by(() => {
    const out = new Map<string, Shown>();
    for (const side of sides) {
      const pr = side.project;
      if (!pr || out.has(side.id)) continue;
      // Where the list is opened at an element of this project, that one is marked and its way unfolded.
      const at = revealed?.project === side.id ? revealed.element : side.at;
      out.set(side.id, {
        project: side.id,
        tree: pr.tree(),
        name: (id) => pr.node(id)?.title || '',
        way: new Set(pr.pathTo(at)),
        at,
        enter: (id) => (choose ? choose(side.id, id) : onenter?.(side.id, id)),
        live: pr,
      });
    }
    return out;
  });

  const nowhere = new Set<string>();

  /** The elements from the top of a tree read from disk down to one, that one too. */
  function wayIn(tree: Tree, id: string): Set<string> {
    const way = new Set<string>();
    for (let at: string | null | undefined = id; at && !way.has(at); at = tree.parent.get(at))
      way.add(at);
    return way;
  }

  /** The tree of a project that is not open, as it was read from disk: folded but for its top-level trees. */
  function closedShown(p: ProjectInfo, read: Tree, names: Map<string, string>): Shown {
    const at = revealed?.project === p.id ? revealed.element : null;
    return {
      project: p.id,
      tree: read,
      name: (id) => names.get(id) || '',
      way: at ? wayIn(read, at) : nowhere,
      at,
      enter: (id) =>
        choose ? choose(p.id, id) : router.go({ view: 'project', project: p.id, at: id }),
      live: null,
    };
  }

  /** Whether the tree of a project that is not shown can be unfolded under its row: that of one shown always stands. */
  const unfoldable = (p: ProjectInfo) => !shownIds.includes(p.id);

  function toggleClosed(p: ProjectInfo) {
    if (closedUnfolded.has(p.id)) closedUnfolded.delete(p.id);
    else closedUnfolded.add(p.id);
  }

  // What is unfolded is read from disk, and again when the project has changed.
  $effect(() => {
    for (const p of projects.list) {
      if (!shownIds.includes(p.id) && closedUnfolded.has(p.id)) closedTrees.want(p);
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

  /** The menu of an element of a project that is not open: enter it, beside, fold it. */
  function elementItems(src: Shown, id: string): MenuItem[] {
    const holds = (src.tree.children.get(id)?.length ?? 0) > 0;
    return actions.elementItems({
      enter: () => src.enter(id),
      beside: shownIds.length ? () => viewing.beside?.(src.project, id) : undefined,
      fold: holds ? { folded: !isUnfolded(src, id), toggle: () => toggleFold(src, id) } : undefined,
    });
  }

  // Entering an element unfolds the way to it, whatever was folded by hand
  // before. It depends on the element in view in each side.
  $effect(() => {
    const ways = [...liveShown.values()].map((src) => ({ id: src.project, way: [...src.way] }));
    untrack(() => {
      for (const { id, way } of ways)
        for (const element of way) foldedByHand.delete(`${id}:${element}`);
    });
  });

  // ---- the keys of the tree, in the list (ADR 0062): see `list-keys` ----

  /** The row selected, by its key: `f:<folder>`, `p:<project>`, `e:<project>/<element>`. */
  let selected = $state<string | null>(null);
  const elementRow = (src: Shown, id: string) => `e:${src.project}/${id}`;
  const rowKey = (row: Row) =>
    row.kind === 'folder' ? `f:${row.folder.id}` : `p:${row.project.id}`;
  /** The row the Tab key comes to: the one selected, or the first. */
  const tabOf = (key: string) =>
    selected === key || (!selected && rows[0] && key === rowKey(rows[0])) ? 0 : -1;

  /** The rows as they stand, read from the page, top to bottom. */
  function rowsNow(): ListRow[] {
    return Array.from(listEl?.querySelectorAll<HTMLElement>('[data-row]') ?? []).map((el) => ({
      key: el.dataset.row!,
      kind: el.dataset.rowKind as ListRow['kind'],
      parent: el.dataset.rowParent ?? null,
      holds: el.dataset.rowHolds !== undefined,
      unfolded: el.dataset.rowOpen !== undefined,
      changeable: el.dataset.rowChangeable !== undefined,
      own: el.dataset.rowOwn !== undefined,
    }));
  }
  const rowEl = (key: string) =>
    listEl?.querySelector<HTMLElement>(`[data-row="${CSS.escape(key)}"]`) ?? null;
  const projectOf = (key: string) =>
    key.startsWith('p:') ? projects.list.find((p) => p.id === key.slice(2)) : undefined;
  const folderOfRow = (key: string) =>
    key.startsWith('f:') ? projects.folder(key.slice(2)) : undefined;
  /** An element's row: the tree it is shown in, and its id. */
  function elementOf(key: string): { src: Shown; id: string } | null {
    if (!key.startsWith('e:')) return null;
    const rest = key.slice(2);
    const cut = rest.indexOf('/');
    const owner = rest.slice(0, cut);
    const id = rest.slice(cut + 1);
    const live = liveShown.get(owner);
    if (live) return { src: live, id };
    const p = projects.list.find((x) => x.id === owner);
    const reading = closedTrees.get(owner);
    if (!p || reading?.state !== 'read') return null;
    return { src: closedShown(p, reading.tree.tree, reading.tree.names), id };
  }
  /** The folder before a row among those beside it, as the keys put a thing into it. */
  function folderBeforeRow(key: string): string | null {
    const all = rowsNow();
    const i = all.findIndex((r) => r.key === key);
    const parent = all[i]?.parent ?? null;
    for (let j = i - 1; j >= 0; j--) {
      if (all[j].parent !== parent) continue;
      if (all[j].kind === 'folder') return all[j].key.slice(2);
    }
    return null;
  }
  const thingOf = (key: string) => ({
    projects: key.startsWith('p:') ? [key.slice(2)] : [],
    folders: key.startsWith('f:') ? [key.slice(2)] : [],
  });
  /** The folder a project or a folder lies in, by id; none at the top. */
  function holderOf(key: string): string | null {
    const p = projectOf(key);
    if (p) return folderOf(projects.folders, p);
    const f = folderOfRow(key);
    return f?.parent && projects.folder(f.parent) ? f.parent : null;
  }

  const surface: ListSurface = {
    get rows() {
      return rowsNow();
    },
    get selected() {
      return selected;
    },
    select(key) {
      selected = key;
      void tick().then(() => rowEl(key)?.focus());
    },
    toggle(key) {
      const f = folderOfRow(key);
      const p = projectOf(key);
      const e = elementOf(key);
      if (f) toggle(f.id);
      else if (p && unfoldable(p)) toggleClosed(p);
      else if (e) toggleFold(e.src, e.id);
    },
    foldAll() {
      const anyOpen =
        projects.folders.some((f) => !listUi.collapsed.has(f.id)) || closedUnfolded.size > 0;
      if (anyOpen) {
        listUi.collapsed = new Set(projects.folders.map((f) => f.id));
        closedUnfolded.clear();
      } else listUi.collapsed = new Set();
    },
    make(kind) {
      const key = selected;
      const into = key ? (folderOfRow(key)?.id ?? holderOf(key)) : null;
      if (kind === 'project') actions.newProject(into);
      else actions.newFolder(into);
    },
    shift(key, by) {
      const e = elementOf(key);
      if (e?.src.live) shiftElement(e.src.live, e.src.tree, e.id, by);
    },
    deeper(key) {
      const e = elementOf(key);
      if (e) {
        if (e.src.live) indent(e.src.live, e.src.tree, e.id);
        return;
      }
      const into = folderBeforeRow(key);
      if (into) void moveThings(thingOf(key), into);
    },
    shallower(key) {
      const e = elementOf(key);
      if (e) {
        if (e.src.live) outdent(e.src.live, e.src.tree, e.id);
        return;
      }
      const holder = holderOf(key);
      if (holder) void moveThings(thingOf(key), projects.folder(holder)?.parent ?? null);
    },
    open(key) {
      const f = folderOfRow(key);
      const p = projectOf(key);
      const e = elementOf(key);
      // A folder is not entered: it is folded and unfolded.
      if (f) toggle(f.id);
      else if (p) open(p);
      else if (e) e.src.enter(e.id);
    },
    up() {
      // Over the element in view in the side that has the focus; from the
      // top of its project, to the project's row.
      const live = current ? liveShown.get(current) : undefined;
      if (!current || !at || !live) return;
      if (at === PROJECT) surface.select(`p:${current}`);
      else live.enter(live.tree.parent.get(at) ?? PROJECT);
    },
    rename(key) {
      const f = folderOfRow(key);
      const p = projectOf(key);
      if (f) actions.renameFolder(f);
      else if (p) actions.rename(p);
    },
    remove(key) {
      const f = folderOfRow(key);
      const p = projectOf(key);
      if (f) void actions.removeFolder(f);
      else if (p) void actions.remove(p);
    },
    menu(key) {
      const el = rowEl(key);
      const f = folderOfRow(key);
      const p = projectOf(key);
      const e = elementOf(key);
      const items = f
        ? folderItems(f)
        : p
          ? projectItems(p)
          : e && !e.src.live
            ? elementItems(e.src, e.id)
            : null;
      if (el && items) openMenu(el, items, { align: 'start' });
    },
    bringIntoView(key) {
      rowEl(key)?.scrollIntoView({ block: 'nearest' });
    },
  };

  /** The keys that go through, fold and choose, where the list chooses: no making, moving, renaming or deleting. */
  const choosing = (event: KeyboardEvent) =>
    !event.ctrlKey &&
    !event.metaKey &&
    (event.altKey
      ? event.shiftKey && event.key === 'ArrowDown'
      : ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(event.key) ||
        event.code === 'Tab');

  function onlistkey(event: KeyboardEvent) {
    // The field that finds a project keeps its keys.
    if ((event.target as HTMLElement).closest('input, textarea, [contenteditable="true"]')) return;
    // The changes of folders and projects are undone here, not those of the project beside.
    if (!choose && (event.ctrlKey || event.metaKey) && !event.altKey && event.code === 'KeyZ') {
      event.preventDefault();
      event.stopPropagation();
      void (event.shiftKey ? homeUndo.redo() : homeUndo.undo());
      return;
    }
    // Where the list chooses, it is gone through, folded and chosen from, and nothing is changed.
    if (choose && !choosing(event)) return;
    if (!selected) {
      const focused = (event.target as HTMLElement).closest<HTMLElement>('[data-row]');
      if (focused) selected = focused.dataset.row!;
    }
    if (pressed(event, surface)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="list"
  role="tree"
  tabindex="-1"
  aria-label={t('home-pane')}
  onkeydown={onlistkey}
  onfocusin={(e) => {
    // The row that takes the focus, by a click or Tab, is the one the keys act on.
    const focusedRow = (e.target as HTMLElement).closest<HTMLElement>('[data-row]');
    if (focusedRow) selected = focusedRow.dataset.row!;
  }}
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
    {#if !choose}
      <IconButton label={t('home-new-folder')} size="sm" onclick={() => actions.newFolder(null)}>
        <FolderPlus size={15} />
      </IconButton>
    {/if}
  </div>

  {#each rows as row (row.kind === 'folder' ? `f:${row.folder.id}` : `p:${row.project.id}`)}
    {#if row.kind === 'folder'}
      {@const f = row.folder}
      {@const fk = `f:${f.id}`}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="row folder"
        role="treeitem"
        tabindex={tabOf(fk)}
        aria-selected={selected === fk}
        aria-expanded={row.holds ? row.open : undefined}
        data-row={fk}
        data-row-kind="folder"
        data-row-parent={f.parent && projects.folder(f.parent) ? `f:${f.parent}` : undefined}
        data-row-holds={row.holds ? '' : undefined}
        data-row-open={row.open ? '' : undefined}
        data-row-changeable=""
        data-depth={row.depth}
        data-folder={f.id}
        style:padding-left="{left + row.depth * step}px"
        use:dropTarget={{ accepts: accepts(f.id), ondrop: (e) => drop(e, f.id) }}
        onclick={() => {
          selected = fk;
          toggle(f.id);
        }}
        oncontextmenu={choose ? undefined : (e) => openContextMenu(e, folderItems(f))}
        onpointerdown={choose
          ? undefined
          : (e) => startDrag(e, () => ({ kind: 'folder', data: f.id, label: f.name }))}
      >
        <span class="twisty" class:open={row.open} class:hidden={!row.holds}>
          <ChevronRight size={13} />
        </span>
        <Folder size={15} strokeWidth={1.6} />
        <span class="name truncate">{f.name}</span>
        <span class="count">{row.projects}</span>
        {#if !choose}
          <button
            type="button"
            class="row-menu"
            aria-label={t('home-more-for', { name: f.name })}
            onclick={(e) => {
              e.stopPropagation();
              openMenu(e.currentTarget, folderItems(f), { align: 'end' });
            }}
            onpointerdown={(e) => e.stopPropagation()}
          >
            <Ellipsis size={15} />
          </button>
        {/if}
      </div>
    {:else}
      {@const p = row.project}
      {@const pk = `p:${p.id}`}
      {@const pf = folderOf(projects.folders, p)}
      {@const isShown = shownIds.includes(p.id)}
      {@const live = liveShown.get(p.id)}
      {@const unfolded = unfoldable(p) && closedUnfolded.has(p.id)}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="row project"
        class:current={(p.id === current && !choose) ||
          (revealed?.project === p.id && revealed.element === PROJECT)}
        class:shown={isShown && p.id !== current && !choose}
        class:unavailable={!!choose && unavailable.includes(p.id)}
        aria-disabled={choose && unavailable.includes(p.id) ? true : undefined}
        role="treeitem"
        tabindex={tabOf(pk)}
        aria-selected={selected === pk}
        data-row={pk}
        data-row-kind="project"
        data-row-parent={pf ? `f:${pf}` : undefined}
        data-row-holds={unfoldable(p) || live ? '' : undefined}
        data-row-open={live || closedUnfolded.has(p.id) ? '' : undefined}
        data-row-changeable={!isShown && !choose ? '' : undefined}
        aria-current={p.id === current ? 'page' : undefined}
        data-depth={row.depth}
        data-project={p.id}
        data-current={p.id === current ? '' : undefined}
        data-shown={isShown ? '' : undefined}
        title={p.name}
        style:padding-left="{left + row.depth * step}px"
        onclick={() => {
          selected = pk;
          open(p);
        }}
        oncontextmenu={choose ? undefined : (e) => openContextMenu(e, projectItems(p))}
        onpointerdown={choose
          ? undefined
          : (e) => startDrag(e, () => ({ kind: 'project', data: p.id, label: p.name }))}
      >
        <button
          type="button"
          class="fold"
          class:open={unfolded}
          class:hidden={!unfoldable(p)}
          tabindex="-1"
          aria-label={unfolded ? t('home-fold') : t('home-unfold')}
          aria-expanded={unfoldable(p) ? unfolded : undefined}
          onclick={(e) => {
            e.stopPropagation();
            toggleClosed(p);
          }}
          onpointerdown={(e) => e.stopPropagation()}
        >
          <ChevronRight size={12} />
        </button>
        <ProjectBadge
          name={p.name}
          sharing={p.sharing ? { owner: p.sharing.owner } : null}
          size={14}
        />
        <span class="name serif truncate">{p.name}</span>
        {#if choose && unavailable.includes(p.id)}
          <span class="when">{t('home-open-now')}</span>
        {/if}
        {#if !choose}
          <button
            type="button"
            class="row-menu"
            aria-label={t('home-more-for', { name: p.name })}
            onclick={(e) => {
              e.stopPropagation();
              openMenu(e.currentTarget, projectItems(p), { align: 'end' });
            }}
            onpointerdown={(e) => e.stopPropagation()}
          >
            <Ellipsis size={15} />
          </button>
        {/if}
      </div>
      {#if live && (live.tree.children.get(PROJECT)?.length ?? 0) > 0}
        <div class="tree" data-project-tree={p.id}>
          {@render branch(
            live,
            live.tree.children.get(PROJECT) ?? [],
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
      role="treeitem"
      tabindex={tabOf(elementRow(src, id))}
      aria-selected={selected === elementRow(src, id)}
      aria-expanded={holds ? open : undefined}
      data-row={elementRow(src, id)}
      data-row-kind="element"
      data-row-parent={(src.tree.parent.get(id) ?? PROJECT) === PROJECT
        ? `p:${src.project}`
        : elementRow(src, src.tree.parent.get(id)!)}
      data-row-holds={holds ? '' : undefined}
      data-row-open={open ? '' : undefined}
      data-row-own={src.live ? '' : undefined}
      aria-current={id === src.at ? 'location' : undefined}
      data-element={id}
      data-current={id === src.at ? '' : undefined}
      title={name || undefined}
      style:padding-left="{indent + depth * step}px"
      onclick={() => {
        selected = elementRow(src, id);
        src.enter(id);
      }}
      oncontextmenu={src.live || choose
        ? undefined
        : (e) => openContextMenu(e, elementItems(src, id))}
    >
      <button
        type="button"
        class="fold"
        class:open
        class:hidden={!holds}
        tabindex="-1"
        aria-label={open ? t('home-fold') : t('home-unfold')}
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
  /* A narrow column: rows as the outline has them. */
  .list {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding-bottom: 12px;
  }
  .list:global([data-drop-over]) {
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 6px;
  }
  .tools :global(.field) {
    flex: 1;
    width: auto;
    min-width: 0;
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
  .row.folder:global([data-drop-over]) {
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }
  .row .name {
    font-size: var(--text-sm);
  }
  .row.folder .name {
    font-weight: 500;
  }
  .row.project .name {
    color: var(--ink);
    font-size: var(--text-md);
  }
  /* The project that is open, where the list chooses one to show beside it. */
  .row.project.unavailable {
    cursor: default;
  }
  .row.project.unavailable:hover {
    background: none;
  }
  .row.project.unavailable .name {
    color: var(--ink-4);
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
  .when {
    flex: none;
    font-size: var(--text-xs);
    color: var(--ink-4);
    font-variant-numeric: tabular-nums;
  }
  .row-menu {
    display: inline-flex;
    padding: 3px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--fast) var(--ease);
  }
  .row:hover .row-menu,
  .row:focus-within .row-menu {
    opacity: 1;
  }
  .row-menu:hover {
    background: var(--paper-raised);
    color: var(--ink);
  }
  .none {
    padding: 14px 6px;
    color: var(--ink-4);
    font-size: var(--text-sm);
    text-align: center;
  }
  /* The project of the side that has the focus, as the outline marks the element in view. */
  .row.project.current {
    background: var(--accent-soft);
  }
  .row.project.current .name {
    color: var(--accent-strong);
    font-weight: 550;
  }
  /* The project of the other side: marked, quietly. */
  .row.project.shown {
    box-shadow: inset 2px 0 0 var(--accent);
  }
  .row.project.shown .name {
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
    min-height: 24px;
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
</style>
