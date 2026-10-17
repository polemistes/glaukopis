<script lang="ts">
  /**
   * The owl map (ADR 0037, 0050): the map above every project. The owl
   * stands at the centre as a picture, or a folder entered; under it the
   * folders, as plain labels, nesting as they do; and the projects, as
   * cards, in them or hanging from the owl. It is laid out as a map's centre
   * is, balanced to both sides, and panned and zoomed as the diagram is; but
   * it must not be taken for the map of a project, so nothing in it is a box
   * like an element. What is done in a diagram is done here, in its own
   * look: what is selected is ringed, the keys go about and change things
   * (`owl-keys.ts`), names are written in place, and folders and projects
   * are dragged into folders. Every change can be undone (`changes.ts`).
   */
  import { onMount, tick, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import FilePlus from '@lucide/svelte/icons/file-plus';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import Maximize2 from '@lucide/svelte/icons/maximize-2';
  import Minimize2 from '@lucide/svelte/icons/minimize-2';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import Scan from '@lucide/svelte/icons/scan';
  import type { Folder, ProjectInfo } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import { fitting, wheeled, zoomedAt, type View } from '$lib/project/diagram/camera';
  import { layout, type Size } from '$lib/project/diagram/layout';
  import { linesOf } from '$lib/project/diagram/lines';
  import { isAncestor, subtree } from '$lib/project/model/tree';
  import { PROJECT, type NodeRecord, type Position } from '$lib/project/model/types';
  import Mark from '$lib/shell/Mark.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { drag, dropTarget, startDrag, type DragPayload } from '$lib/ui/drag.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import {
    carryElements,
    deleteThings,
    moveElements,
    placeThings,
    type ElementPlace,
    makeFolder,
    makeProject,
    moveThings,
    renameFolder,
    renameProject,
    THINGS,
    thingsOf,
    wouldMove,
    type Things,
  } from './changes';
  import { closedTrees, type ClosedTree } from './closed.svelte';
  import { folderOf } from './folders';
  import { listUi } from './list.svelte';
  import NameField from './NameField.svelte';
  import {
    elementKey,
    folderAbove,
    folderBefore,
    folderKey,
    keyed,
    type ShownMap,
    OWL,
    owlTree,
    parentKey,
    projectKey,
    PROVISIONAL,
    whereNew,
    type Provisional,
  } from './owl';
  import { pressed, type OwlSurface } from './owl-keys';
  import type { ProjectActions } from './project-actions.svelte';
  import ProjectBadge from './ProjectBadge.svelte';
  import { homeUndo } from './undo.svelte';

  interface Props {
    /** The menus of a project, as the cards and the list have them. */
    actions: ProjectActions;
    /** What stands at the centre, by its key: the owl, or a folder entered. */
    at?: string;
    /** Opens a project at its top, or enters a folder: shows it at the centre. */
    onopen: (key: string) => void;
    /** Goes up from the folder at the centre, where one is. */
    onup?: () => void;
    /** The name of what holds the folder at the centre, for its corner. */
    above?: string;
  }

  let { actions, at = OWL, onopen, onup, above = '' }: Props = $props();

  /** What is selected, by key; the last is where the keys go from. */
  let selection = $state<string[]>([]);
  /** What has its name open for writing, and the letter that began a new one. */
  let renaming = $state<{ key: string; startingWith?: string } | null>(null);
  /** A folder or project being named, not yet made. */
  let provisional = $state<Provisional | null>(null);

  /** The maps shown under the cards of projects, as they are read from disk. */
  const maps = $derived.by(() => {
    const out = new Map<string, ShownMap>();
    for (const id of listUi.owlMaps) {
      const r = closedTrees.get(id);
      out.set(id, !r || r.state === 'reading' ? 'reading' : r.state === 'read' ? r.tree : 'failed');
    }
    return out;
  });

  // A map shown is read, and read again when its project has changed.
  $effect(() => {
    for (const id of listUi.owlMaps) {
      const info = projects.list.find((p) => p.id === id);
      if (info) closedTrees.want(info);
    }
  });

  const owl = $derived(
    owlTree(projects.folders, projects.list, listUi.owlFolds, {
      at,
      provisional,
      places: projects.places,
      maps,
      elementFolds: listUi.owlElementFolds,
    }),
  );
  const empty = $derived(!projects.folders.length && !projects.list.length && at === OWL);
  const selected = $derived(new Set(selection));
  const last = $derived(selection[selection.length - 1] ?? null);

  /** The size of each thing on the map, as it is drawn. */
  const sizes = new SvelteMap<string, Size>();
  /**
   * What is being dragged about on this map, from where on it the pointer
   * took hold of the first, as the diagram does; and what was dropped, held
   * where it was let go until the change is on the map.
   */
  let dragging = $state<{ keys: string[]; grab: Position } | null>(null);
  let settling = $state<{ at: Map<string, Position>; project?: string; reading?: unknown } | null>(
    null,
  );

  const held = $derived.by(() => {
    const out = new Map<string, Position>();
    if (settling) for (const [k, p] of settling.at) out.set(k, p);
    if (dragging && drag.payload && pointerInside(drag.x, drag.y)) {
      const world = toWorld(drag.x, drag.y);
      dragging.keys.forEach((k, i) =>
        out.set(k, { x: world.x - dragging!.grab.x, y: world.y - dragging!.grab.y + i * 52 }),
      );
    }
    return out;
  });
  /** What is dragged, with all under it: it is not where it is dropped. */
  const lifted = $derived.by(() => {
    const out = new Set<string>();
    if (dragging) for (const k of dragging.keys) for (const d of subtree(owl.tree, k)) out.add(d);
    return out;
  });

  const lay = $derived(
    layout(owl.tree, owl.nodes as unknown as ReadonlyMap<string, NodeRecord>, sizes, held),
  );
  /** The map as it is without what is dragged: where things were, and where the parents are. */
  const resting = $derived(
    layout(owl.tree, owl.nodes as unknown as ReadonlyMap<string, NodeRecord>, sizes),
  );
  const lines = $derived(linesOf(lay, new Set()));

  // Elements dropped stand where they were let go until their project's map is read anew.
  $effect(() => {
    const was = settling;
    if (!was?.project) return;
    if (closedTrees.get(was.project) !== was.reading) untrack(() => (settling = null));
  });

  // What was dropped stands where it was let go until the map shows it moved, or for a few seconds.
  $effect(() => {
    if (!settling) return;
    const was = settling;
    const timer = setTimeout(() => {
      if (settling === was) settling = null;
    }, 3000);
    return () => clearTimeout(timer);
  });

  let viewport = $state<HTMLDivElement>();
  let width = $state(0);
  let height = $state(0);
  let cam = $state<View>({ x: 0, y: 0, k: 1 });
  /** Whether the view has been fitted to the map, once all of it is measured. */
  let fitted = $state(false);
  let panning = $state(false);
  /**
   * A folder that was folded or unfolded, and where it stood on the screen:
   * it is kept there while what is under it comes and goes, until the view
   * is moved.
   */
  let anchor: { key: string; sx: number; sy: number } | null = null;
  /** Whether the pointer moved the view since it was pressed: the click that ends it is no click. */
  let dragged = false;

  /** Measures a thing on the map, as long as it is there. */
  function measured(node: HTMLElement, key: string) {
    let at = key;
    const report = () => {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      const old = sizes.get(at);
      if (!old || old.w !== w || old.h !== h) sizes.set(at, { w, h });
    };
    const observer = new ResizeObserver(report);
    observer.observe(node);
    report();
    return {
      update(next: string) {
        sizes.delete(at);
        at = next;
        report();
      },
      destroy() {
        observer.disconnect();
        sizes.delete(at);
      },
    };
  }

  $effect(() => {
    if (!viewport) return;
    const el = viewport;
    const resized = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === width && h === height) return;
      untrack(() => {
        // What was in the middle stays in the middle.
        if (fitted && width && height) {
          cam = { ...cam, x: cam.x + (w - width) / 2, y: cam.y + (h - height) / 2 };
        }
        width = w;
        height = h;
      });
    };
    const observer = new ResizeObserver(() => requestAnimationFrame(resized));
    observer.observe(el);
    resized();
    return () => observer.disconnect();
  });

  // A folder entered, or left, is a new map: it is fitted anew, and nothing of the last is selected.
  let shownAt: string | null = null;
  $effect(() => {
    const now = at;
    untrack(() => {
      if (shownAt !== null && shownAt !== now) {
        fitted = false;
        selection = [];
        renaming = null;
        provisional = null;
      }
      shownAt = now;
    });
  });

  // Fitted once what is shown is measured; or soon, whatever is not.
  $effect(() => {
    if (fitted || !width || !height) return;
    const all = lay.order.every((key) => sizes.has(key));
    const fit = () => {
      if (fitted) return;
      cam = fitting(lay.bounds, width, height);
      fitted = true;
    };
    if (all) {
      untrack(fit);
      return;
    }
    const timer = setTimeout(fit, 400);
    return () => clearTimeout(timer);
  });

  // A folder folded or unfolded stays where it stood on the screen.
  $effect(() => {
    const placed = lay.placed;
    untrack(() => {
      if (!anchor) return;
      const p = placed.get(anchor.key);
      if (p) cam = { ...cam, x: anchor.sx - p.x * cam.k, y: anchor.sy - p.y * cam.k };
    });
  });

  // What is selected is what is on the map: what went, or was folded away, is let go.
  $effect(() => {
    const placed = lay.placed;
    untrack(() => {
      const kept = selection.filter((k) => placed.has(k));
      if (kept.length !== selection.length) selection = kept;
    });
  });

  // What the map was asked to show when it came up: selected, and brought into view. Not
  // what stands at the centre: that is the folder being left, before the map has moved up.
  $effect(() => {
    const wanted = listUi.owlReveal;
    if (!wanted || !fitted || wanted === owl.tree.root || !lay.placed.has(wanted)) return;
    untrack(() => {
      listUi.owlReveal = null;
      selection = [wanted];
      bringIntoView(wanted);
    });
  });

  $effect(() => {
    if (!viewport) return;
    const el = viewport;
    const onwheel = (event: WheelEvent) => {
      event.preventDefault();
      anchor = null;
      const rect = el.getBoundingClientRect();
      cam = wheeled(cam, event, event.clientX - rect.left, event.clientY - rect.top);
    };
    el.addEventListener('wheel', onwheel, { passive: false });
    return () => el.removeEventListener('wheel', onwheel);
  });

  // The keys are the map's from the start, where nothing else has asked for them.
  onMount(() => {
    const active = document.activeElement;
    if (!active || active === document.body) viewport?.focus({ preventScroll: true });
  });

  function fit() {
    anchor = null;
    if (width && height) cam = fitting(lay.bounds, width, height);
  }

  function zoomBy(factor: number) {
    anchor = null;
    cam = zoomedAt(cam, width / 2, height / 2, cam.k * factor);
  }

  /** Brings a thing into the view where it lies outside it, or near its edge. */
  function bringIntoView(key: string) {
    const p = lay.placed.get(key);
    if (!p || !width || !height) return;
    const margin = 40;
    const left = cam.x + (p.x - p.w / 2) * cam.k;
    const right = cam.x + (p.x + p.w / 2) * cam.k;
    const top = cam.y + (p.y - p.h / 2) * cam.k;
    const bottom = cam.y + (p.y + p.h / 2) * cam.k;
    if (left >= margin && right <= width - margin && top >= margin && bottom <= height - margin)
      return;
    anchor = null;
    cam = { ...cam, x: width / 2 - p.x * cam.k, y: height / 2 - p.y * cam.k };
  }

  /** A point of the window as a point of the map. */
  function toWorld(clientX: number, clientY: number): Position {
    const rect = viewport?.getBoundingClientRect();
    return {
      x: (clientX - (rect?.left ?? 0) - cam.x) / cam.k,
      y: (clientY - (rect?.top ?? 0) - cam.y) / cam.k,
    };
  }

  function pointerInside(x: number, y: number): boolean {
    const rect = viewport?.getBoundingClientRect();
    return !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  // ---- the elements of the maps shown under the cards ----

  /** The map of a project as it is read, where it is shown. */
  const mapOf = (project: string): ClosedTree | null => {
    const m = maps.get(project);
    return m && typeof m === 'object' ? m : null;
  };

  /** Where an element stands in its project now: under which, before which, placed where. */
  function standing(map: ClosedTree, id: string): ElementPlace {
    const parent = map.tree.parent.get(id) ?? PROJECT;
    const list = map.tree.children.get(parent) ?? [];
    return {
      id,
      parent,
      before: list[list.indexOf(id) + 1] ?? null,
      pos: map.places.get(id)?.pos ?? null,
    };
  }

  /** The elements of one project among some keys, the topmost of them only, in the order given. */
  function elementsIn(keys: string[], project: string): string[] {
    const ids = keys.flatMap((k) => {
      const e = keyed(k);
      return e.kind === 'element' && e.project === project ? [e.id] : [];
    });
    const map = mapOf(project);
    if (!map) return [];
    return ids.filter((id) => !ids.some((o) => o !== id && isAncestor(map.tree, o, id)));
  }

  const projectName = (id: string) => projects.list.find((p) => p.id === id)?.name ?? '';

  /** Moves elements of one project as `to` says, held where `at` says until the map shows it. */
  function moveWithin(project: string, to: ElementPlace[], at?: Map<string, Position>) {
    const map = mapOf(project);
    if (!map || !to.length) return;
    const from = to.map((m) => standing(map, m.id));
    if (at?.size) settling = { at, project, reading: closedTrees.get(project) };
    void moveElements(
      project,
      to,
      from,
      t('home-owl-elements-moved', { count: to.length, project: projectName(project) }),
    );
  }

  /** One place up or down among those beside it: the last selected, as in the diagram. */
  function shiftElements(keys: string[], by: -1 | 1) {
    const k = keyed(keys[keys.length - 1] ?? '');
    if (k.kind !== 'element') return;
    const map = mapOf(k.project);
    if (!map) return;
    const here = standing(map, k.id);
    const list = map.tree.children.get(here.parent) ?? [];
    const i = list.indexOf(k.id);
    const j = i + by;
    if (j < 0 || j >= list.length) return;
    const before = by < 0 ? list[j] : (list[j + 1] ?? null);
    moveWithin(k.project, [{ ...here, before, pos: null }]);
  }

  /** Under the element before it, at the end; or out, after the element it was under. */
  function deeperElements(keys: string[], deeper: boolean) {
    const k = keyed(keys[keys.length - 1] ?? '');
    if (k.kind !== 'element') return;
    const map = mapOf(k.project);
    if (!map) return;
    const ids = elementsIn(keys, k.project);
    const here = standing(map, k.id);
    const list = map.tree.children.get(here.parent) ?? [];
    let parent: string;
    let before: string | null = null;
    if (deeper) {
      const prev = list.slice(0, list.indexOf(ids[0] ?? k.id)).filter((x) => !ids.includes(x));
      if (!prev.length) return;
      parent = prev[prev.length - 1];
    } else {
      if (here.parent === PROJECT) return;
      parent = map.tree.parent.get(here.parent) ?? PROJECT;
      const above = map.tree.children.get(parent) ?? [];
      before = above[above.indexOf(here.parent) + 1] ?? null;
    }
    moveWithin(
      k.project,
      ids.map((id) => ({ id, parent, before, pos: null })),
    );
    if (deeper) listUi.owlElementFold(elementKey(k.project, parent), false);
  }

  /** The element of its project a key stands for when elements are dropped on it: an element, or the top of a card's. */
  function underOf(key: string): { project: string; id: string } | null {
    const k = keyed(key);
    if (k.kind === 'element') return { project: k.project, id: k.id };
    if (k.kind === 'project') return { project: k.id, id: PROJECT };
    return null;
  }

  /** What is dragged from a map shown here: elements of one project. */
  interface Carried {
    project: string;
    ids: string[];
  }
  const ELEMENTS = 'owl-elements';

  /** Elements dropped on an element or on a card: under it, in its project or carried to it from another. */
  function dropUnder(key: string) {
    return {
      accepts: (payload: DragPayload) => {
        if (payload.kind !== ELEMENTS) return false;
        const target = underOf(key);
        const data = payload.data as Carried;
        return !!target && !(target.project === data.project && data.ids.includes(target.id));
      },
      ondrop: (e: { payload: DragPayload }) => {
        const target = underOf(key);
        const data = e.payload.data as Carried;
        if (!target) return;
        if (target.project === data.project) {
          moveWithin(
            data.project,
            data.ids.map((id) => ({ id, parent: target.id, before: null, pos: null })),
          );
        } else {
          const map = mapOf(data.project);
          if (!map || !data.ids.length) return;
          const first = standing(map, data.ids[0]);
          void carryElements(
            data.project,
            data.ids,
            target.project,
            target.id,
            { parent: first.parent, before: first.before },
            t('home-owl-elements-carried', {
              count: data.ids.length,
              to: projectName(target.project),
            }),
          );
        }
      },
    };
  }

  /** What is dropped on the ground of the map: put there, as in the diagram, under what holds it. */
  const ground = {
    accepts: (payload: DragPayload) =>
      !!dragging && (payload.kind === ELEMENTS || !!thingsOf(payload)),
    quiet: true,
    ondrop: (e: { payload: DragPayload; x: number; y: number }) => {
      const was = dragging;
      if (!was) return;
      const world = toWorld(e.x, e.y);
      const at = new Map<string, Position>();
      was.keys.forEach((k, i) =>
        at.set(k, { x: world.x - was.grab.x, y: world.y - was.grab.y + i * 52 }),
      );
      if (e.payload.kind === ELEMENTS) placeElements(e.payload.data as Carried, was.keys, at);
      else placeThingsAt(was.keys, at);
    },
  };

  /** Folders and projects put where they were dropped, each from what holds it. */
  function placeThingsAt(keys: string[], at: Map<string, Position>) {
    const places: Record<string, Position> = {};
    for (const key of keys) {
      const to = at.get(key);
      const parent = owl.tree.parent.get(key);
      const pp = parent ? resting.placed.get(parent) : undefined;
      if (!to || !pp || key === owl.tree.root) continue;
      places[key] = { x: to.x - pp.x, y: to.y - pp.y };
    }
    const n = Object.keys(places).length;
    if (!n) return;
    const one = keys.length === 1 ? (owl.items.get(keys[0]) ?? null) : null;
    const name =
      one?.kind === 'folder' ? one.folder.name : one?.kind === 'project' ? one.project.name : '';
    settling = { at };
    void placeThings(
      places,
      name ? t('home-owl-placed', { name }) : t('home-owl-placed-many', { count: n }),
    ).finally(() => {
      if (settling?.at === at) settling = null;
    });
  }

  /**
   * Elements put where they were dropped, under the parent they have, as the
   * diagram puts them: their place among those beside them follows from
   * where they stand, on their side, from the top down.
   */
  function placeElements(data: Carried, keys: string[], at: Map<string, Position>) {
    const map = mapOf(data.project);
    if (!map) return;
    const to: ElementPlace[] = [];
    for (const key of keys) {
      const k = keyed(key);
      const world = at.get(key);
      const parentKey = owl.tree.parent.get(key);
      const pp = parentKey ? resting.placed.get(parentKey) : undefined;
      if (k.kind !== 'element' || !world || !parentKey || !pp) continue;
      const rel = { x: world.x - pp.x, y: world.y - pp.y };
      const side = rel.x < 0 ? 'left' : 'right';
      const siblings = (owl.tree.children.get(parentKey) ?? []).filter((x) => !keys.includes(x));
      const same = siblings.filter((x) => resting.placed.get(x)?.side === side);
      const below = same.find((x) => (resting.placed.get(x)?.y ?? 0) > world.y);
      const after = below ?? (same.length ? undefined : side === 'right' ? siblings[0] : undefined);
      const nextKey =
        after ?? (same.length ? siblings[siblings.indexOf(same[same.length - 1]) + 1] : undefined);
      const next = nextKey ? keyed(nextKey) : null;
      to.push({
        id: k.id,
        parent: map.tree.parent.get(k.id) ?? PROJECT,
        before: next?.kind === 'element' ? next.id : null,
        pos: rel,
      });
    }
    moveWithin(data.project, to, at);
  }

  function focusMap() {
    viewport?.focus({ preventScroll: true });
  }

  function select(keys: string[]) {
    selection = keys;
  }

  // ---- what each key stands for ----

  const folderOfKey = (key: string): Folder | undefined => {
    const k = keyed(key);
    return k.kind === 'folder' ? projects.folder(k.id) : undefined;
  };
  const projectOfKey = (key: string): ProjectInfo | undefined => {
    const k = keyed(key);
    return k.kind === 'project' ? projects.list.find((p) => p.id === k.id) : undefined;
  };
  /** What can be moved, renamed and deleted: a folder or a project, not the centre. */
  const movable = (key: string) =>
    key !== owl.tree.root && !!(folderOfKey(key) || projectOfKey(key));

  /** The projects and folders of some keys. */
  function thingsIn(keys: string[]): Things {
    const out: Things = { projects: [], folders: [] };
    for (const key of keys) {
      const k = keyed(key);
      if (k.kind === 'project') out.projects.push(k.id);
      else if (k.kind === 'folder') out.folders.push(k.id);
    }
    return out;
  }

  // ---- the changes ----

  function make(kind: 'project' | 'folder') {
    if (provisional) return;
    const parent = whereNew(selection, owl.tree);
    if (parent) listUi.owlFold(parent, false);
    renaming = null;
    provisional = { of: kind, parent };
    selection = [PROVISIONAL];
  }

  async function made(name: string) {
    const was = provisional;
    if (!was) return;
    try {
      if (was.of === 'folder') {
        const f = await makeFolder(name, was.parent);
        selection = [folderKey(f.id)];
      } else {
        const p = await makeProject(name, was.parent);
        selection = [projectKey(p.id)];
      }
    } catch (error) {
      notifyError(t('home-failed'), error);
      selection = [];
    } finally {
      provisional = null;
      await tick();
      focusMap();
    }
  }

  function unmade() {
    const parent = provisional?.parent;
    provisional = null;
    selection = parent ? [folderKey(parent)] : [owl.tree.root];
    focusMap();
  }

  function rename(key: string, startingWith?: string) {
    if (!movable(key) && key !== owl.tree.root) return;
    if (!folderOfKey(key) && !projectOfKey(key)) return;
    provisional = null;
    selection = [key];
    renaming = { key, startingWith };
  }

  async function renamed(key: string, name: string) {
    renaming = null;
    try {
      const f = folderOfKey(key);
      const p = projectOfKey(key);
      if (f) await renameFolder(f, name);
      else if (p) await renameProject(p, name);
    } catch (error) {
      notifyError(t('home-failed'), error);
    }
    await tick();
    focusMap();
  }

  function unrenamed() {
    renaming = null;
    focusMap();
  }

  /** Moves things into a folder, or out of all at the top; the folder is opened to show them. */
  async function moveInto(keys: string[], into: string | null) {
    const things = thingsIn(keys.filter((k) => k !== (into ? folderKey(into) : OWL)));
    if (!(await moveThings(things, into))) return;
    if (into) listUi.owlFold(into, false);
    const kept = keys[keys.length - 1];
    if (kept) requestAnimationFrame(() => bringIntoView(kept));
  }

  function deeper(keys: string[]) {
    if (keyed(keys[keys.length - 1] ?? '').kind === 'element') return deeperElements(keys, true);
    const from = keys[keys.length - 1];
    const target = from ? folderBefore(from, owl.tree) : null;
    if (!target) return;
    const k = keyed(target);
    if (k.kind === 'folder') void moveInto(keys, k.id);
  }

  function shallower(keys: string[]) {
    if (keyed(keys[keys.length - 1] ?? '').kind === 'element') return deeperElements(keys, false);
    const from = keys[keys.length - 1];
    const target = from ? folderAbove(from, owl.tree) : null;
    if (!target) return;
    const k = keyed(target);
    void moveInto(keys, k.kind === 'folder' ? k.id : null);
  }

  async function remove(keys: string[]) {
    const things = thingsIn(keys.filter(movable));
    const from = keys[keys.length - 1];
    const parent = from ? parentKey(from, projects.folders, projects.list) : null;
    if (await deleteThings(things)) selection = parent && lay.placed.has(parent) ? [parent] : [];
    focusMap();
  }

  /** A folder folded or unfolded, a project's map shown or hidden, an element folded or unfolded: it stays where it stood. */
  function fold(key: string) {
    const item = owl.items.get(key);
    const p = lay.placed.get(key);
    const keep = () =>
      (anchor = p ? { key, sx: cam.x + p.x * cam.k, sy: cam.y + p.y * cam.k } : null);
    if (item?.kind === 'folder' && item.holds) {
      keep();
      listUi.owlFold(item.folder.id, !item.folded);
    } else if (item?.kind === 'project') {
      keep();
      listUi.owlMap(item.project.id, !item.map);
    } else if (item?.kind === 'element' && item.holds) {
      keep();
      listUi.owlElementFold(key, !item.folded);
    }
  }

  /** A project opened at its top, or at an element of its map; a folder entered. */
  function open(key: string) {
    if (key === owl.tree.root) return;
    const k = keyed(key);
    if (k.kind === 'folder' || k.kind === 'project' || k.kind === 'element') onopen(key);
  }

  // ---- menus ----

  function placeOf(key: string): HTMLElement | null {
    return viewport?.querySelector<HTMLElement>(`[data-owl-key="${CSS.escape(key)}"]`) ?? null;
  }

  /** The menu of the map itself: what is made here, and the view. */
  function mapItems(): MenuItem[] {
    return [
      {
        label: t('home-owl-new-project'),
        icon: FilePlus,
        shortcut: 'Enter',
        action: () => make('project'),
      },
      {
        label: t('home-owl-new-folder'),
        icon: FolderPlus,
        shortcut: 'Tab',
        action: () => make('folder'),
      },
      { kind: 'separator' },
      { label: t('home-owl-fit'), icon: Scan, shortcut: 'Ctrl+0', action: fit },
      {
        label: t('home-owl-tidy'),
        disabled: !placedByHand().length,
        action: () => {
          const keys = placedByHand();
          void placeThings(Object.fromEntries(keys.map((k) => [k, null])), t('home-owl-tidied'));
        },
      },
    ];
  }

  /** The folders and projects on the map that were put by hand. */
  const placedByHand = () => lay.order.filter((k) => !!projects.places[k]);

  function itemsOf(key: string): MenuItem[] {
    const f = folderOfKey(key);
    if (f) {
      // The folder at the centre is where one is: it is not entered again.
      const first: MenuItem[] =
        key === owl.tree.root
          ? []
          : [
              {
                label: t('home-owl-enter'),
                icon: Minimize2,
                shortcut: 'Alt+Shift+↓',
                action: () => open(key),
              },
            ];
      return actions.folderItems(f, first, (kind) => {
        selection = [key];
        make(kind);
      });
    }
    const p = projectOfKey(key);
    if (p) {
      const shown = !!listUi.owlMaps.has(p.id);
      return actions.itemsWithMoves(p, {
        afterOpen: [
          {
            label: shown ? t('home-owl-map-hide') : t('home-owl-map-show'),
            icon: ChevronRight,
            shortcut: 'Space',
            action: () => fold(key),
          },
        ],
      });
    }
    if (keyed(key).kind === 'element') {
      const item = owl.items.get(key);
      return [
        {
          label: t('home-owl-jump'),
          icon: Minimize2,
          shortcut: 'Alt+Shift+↓',
          action: () => open(key),
        },
        ...(item?.kind === 'element' && item.holds
          ? [
              {
                label: item.folded ? t('home-owl-unfold-element') : t('home-owl-fold-element'),
                shortcut: 'Space',
                action: () => fold(key),
              } as MenuItem,
            ]
          : []),
      ];
    }
    return mapItems();
  }

  function menuOf(key: string | null) {
    const el = key ? placeOf(key) : null;
    if (el) {
      openMenu(el, itemsOf(key!), { align: 'start' });
    } else if (viewport) {
      const r = viewport.getBoundingClientRect();
      openMenu(
        {
          left: r.left + r.width / 2,
          right: r.left + r.width / 2,
          top: r.top + r.height / 2,
          bottom: r.top + r.height / 2,
          width: 0,
          height: 0,
        },
        mapItems(),
      );
    }
  }

  function contextmenu(event: MouseEvent) {
    const el = (event.target as HTMLElement).closest<HTMLElement>('[data-owl-key]');
    const key = el?.dataset.owlKey ?? null;
    if (key && key !== PROVISIONAL) {
      if (!selected.has(key)) selection = [key];
      openContextMenu(event, itemsOf(key));
    } else {
      openContextMenu(event, mapItems());
    }
  }

  // ---- the keys ----

  const surface: OwlSurface = {
    get tree() {
      return owl.tree;
    },
    get lay() {
      return lay;
    },
    get selection() {
      return selection;
    },
    select,
    open,
    up: () => onup?.(),
    rename,
    make,
    deeper,
    shallower,
    shift: shiftElements,
    fold,
    remove: (keys) => void remove(keys),
    menu: menuOf,
    fit,
    zoomBy,
    bringIntoView,
    undo: () => void homeUndo.undo(),
    redo: () => void homeUndo.redo(),
  };

  function onkeydown(event: KeyboardEvent) {
    if (event.target !== viewport || renaming || provisional) return;
    if (pressed(event, surface)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // ---- the pointer ----

  /** The payload of what is dragged: the thing pressed, or the selection it is part of. */
  /**
   * The payload of what is dragged: the thing pressed, or the selection it
   * is part of. Elements go with the others of their project; folders and
   * projects with the others of theirs. It is remembered what is dragged,
   * and where the pointer took hold of the first, to draw it under the pointer.
   */
  function payloadFor(key: string, from: Position): DragPayload | null {
    const lead = lay.placed.get(key);
    const grab = { x: from.x - (lead?.x ?? from.x), y: from.y - (lead?.y ?? from.y) };
    const k = keyed(key);
    if (k.kind === 'element') {
      const pool = selected.has(key) ? selection : [key];
      const ids = [k.id, ...elementsIn(pool, k.project).filter((id) => id !== k.id)];
      const map = mapOf(k.project);
      const topmost = map
        ? ids.filter((id) => !ids.some((o) => o !== id && isAncestor(map.tree, o, id)))
        : [k.id];
      dragging = { keys: topmost.map((id) => elementKey(k.project, id)), grab };
      const item = owl.items.get(key);
      const name = item?.kind === 'element' ? item.name || t('project-untitled') : '';
      return {
        kind: ELEMENTS,
        data: { project: k.project, ids: topmost } satisfies Carried,
        label: topmost.length === 1 ? name : t('project-elements', { count: topmost.length }),
      };
    }
    if (!movable(key)) return null;
    const keys = selected.has(key)
      ? [key, ...selection.filter((x) => x !== key && movable(x))]
      : [key];
    dragging = { keys, grab };
    if (keys.length > 1) {
      return {
        kind: THINGS,
        data: thingsIn(keys),
        label: t('home-owl-dragged', { count: keys.length }),
      };
    }
    const f = folderOfKey(key);
    if (f) return { kind: 'folder', data: f.id, label: f.name };
    const p = projectOfKey(key);
    return p ? { kind: 'project', data: p.id, label: p.name } : null;
  }

  function pointerdown(event: PointerEvent) {
    if (event.button !== 0 && event.button !== 1) return;
    const target = event.target as HTMLElement;
    if (target.closest('.controls, [data-name-field]')) return;
    const item = target.closest<HTMLElement>('[data-owl-key]');
    const key = item?.dataset.owlKey;
    if (event.button === 0 && key && key !== PROVISIONAL) {
      pressItem(event, key);
      return;
    }
    // The view is moved by dragging the ground of the map.
    if (target.closest('button')) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { x: cam.x, y: cam.y };
    dragged = false;
    focusMap();
    event.preventDefault();
    const move = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragged && Math.hypot(dx, dy) < 4) return;
      dragged = true;
      panning = true;
      anchor = null;
      cam = { ...cam, x: origin.x + dx, y: origin.y + dy };
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      panning = false;
      // A press on the ground that did not move the view lets go of what was selected.
      if (!dragged && !renaming && !provisional) selection = [];
      // The click that ends a drag comes at once, or not at all.
      setTimeout(() => (dragged = false));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  /** A press on a folder or a project selects it, as in the diagram; moved, it drags. */
  function pressItem(event: PointerEvent, key: string) {
    if ((event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    focusMap();
    if (event.ctrlKey || event.metaKey) {
      selection = selected.has(key) ? selection.filter((k) => k !== key) : [...selection, key];
      return;
    }
    const was = selected.has(key);
    if (event.shiftKey) {
      if (!was) selection = [...selection, key];
    } else if (!was) {
      selection = [key];
    }
    let moved = false;
    const from = toWorld(event.clientX, event.clientY);
    startDrag(
      event,
      () => {
        moved = true;
        return payloadFor(key, from);
      },
      () => (dragging = null),
    );
    // A press on one of several selected, let go without moving, keeps that one only.
    const up = () => {
      window.removeEventListener('pointerup', up, true);
      if (!moved && was && !event.shiftKey && selection.length > 1) selection = [key];
    };
    window.addEventListener('pointerup', up, true);
  }

  function dblclick(event: MouseEvent) {
    const el = (event.target as HTMLElement).closest<HTMLElement>('[data-owl-key]');
    const key = el?.dataset.owlKey;
    if (!key || (event.target as HTMLElement).closest('button, [data-name-field]')) return;
    open(key);
  }

  /** A click that ended a drag of the view does nothing. */
  function clickcapture(event: MouseEvent) {
    if (!dragged) return;
    dragged = false;
    event.stopPropagation();
    event.preventDefault();
  }

  /** What a folder, the owl or a card takes when something is dropped on it: into which folder. */
  function dropInto(into: string | null) {
    return {
      accepts: (payload: DragPayload) => {
        const things = thingsOf(payload);
        return !!things && wouldMove(things, into);
      },
      ondrop: (e: { payload: DragPayload }) => {
        const things = thingsOf(e.payload);
        if (!things) return;
        void moveThings(things, into).then((moved) => {
          if (moved && into) listUi.owlFold(into, false);
        });
      },
    };
  }

  /** A card takes folders and projects into its folder, and elements under its project's top. */
  function dropOnCard(key: string) {
    const things = dropInto(intoOf(key));
    const elements = dropUnder(key);
    return {
      accepts: (payload: DragPayload) =>
        payload.kind === ELEMENTS ? elements.accepts(payload) : things.accepts(payload),
      ondrop: (e: { payload: DragPayload }) =>
        e.payload.kind === ELEMENTS ? elements.ondrop(e) : things.ondrop(e),
    };
  }

  /** The folder a key stands for when something is dropped on it: a folder itself, a card's folder, or the top. */
  function intoOf(key: string): string | null {
    const k = keyed(key);
    if (k.kind === 'folder') return k.id;
    const p = projectOfKey(key);
    return p ? folderOf(projects.folders, p) : null;
  }

  function trees(p: ProjectInfo): string {
    return p.maps.length ? t('home-maps', { count: p.maps.length }) : t('home-not-begun');
  }

  const domId = (key: string) => `owl-${key.replace(/[^\w-]/g, '_')}`;
</script>

{#if empty}
  <div class="alone">
    <Mark size={140} />
    <h2>{t('home-welcome')}</h2>
    <p>{t('home-welcome-text')}</p>
  </div>
{:else}
  <div
    bind:this={viewport}
    class="owl-map"
    class:panning
    data-owl-map
    role="tree"
    tabindex="0"
    aria-label={t('home-owl-label')}
    aria-multiselectable="true"
    aria-activedescendant={last ? domId(last) : undefined}
    onpointerdown={pointerdown}
    onclickcapture={clickcapture}
    ondblclick={dblclick}
    oncontextmenu={contextmenu}
    {onkeydown}
    use:dropTarget={ground}
  >
    <div
      class="world"
      class:hidden={!fitted}
      style:transform="translate({cam.x}px, {cam.y}px) scale({cam.k})"
    >
      <svg class="lines" aria-hidden="true">
        {#each lines as l (l.id)}
          <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
        {/each}
      </svg>

      {#each lay.order as key (key)}
        {@const item = owl.items.get(key)}
        {@const p = lay.placed.get(key)}
        {#if item && p}
          {@const centre = key === owl.tree.root}
          {@const parent = owl.tree.parent.get(key) ?? null}
          <div
            class="place"
            class:lifted={lifted.has(key)}
            style:transform="translate({Math.round(p.x - p.w / 2)}px, {Math.round(
              p.y - p.h / 2,
            )}px)"
          >
            {#if item.kind === 'owl'}
              <div
                class="owl"
                class:selected={selected.has(key)}
                id={domId(key)}
                role="treeitem"
                aria-level={1}
                aria-selected={selected.has(key)}
                data-owl-key={key}
                data-selected={selected.has(key) ? '' : undefined}
                use:measured={key}
                use:dropTarget={dropInto(null)}
                title={t('home-title')}
              >
                <Mark size={110} />
              </div>
            {:else if item.kind === 'folder'}
              {@const f = item.folder}
              <div
                class="folder"
                class:centre
                class:folded={item.folded}
                class:selected={selected.has(key)}
                id={domId(key)}
                role="treeitem"
                aria-level={p.depth + 1}
                aria-selected={selected.has(key)}
                aria-expanded={item.holds ? !item.folded : undefined}
                data-owl-key={key}
                data-owl-folder={f.id}
                data-owl-parent={parent ?? undefined}
                data-side={p.side}
                data-selected={selected.has(key) ? '' : undefined}
                use:measured={key}
                use:dropTarget={dropInto(f.id)}
              >
                {#if centre}
                  <FolderOpen size={20} strokeWidth={1.6} />
                {:else}
                  <!-- The folder's own sign folds it, and unfolds it. -->
                  <button
                    type="button"
                    class="fold"
                    tabindex="-1"
                    disabled={!item.holds}
                    aria-label={item.folded ? t('home-owl-unfold') : t('home-owl-fold')}
                    use:tooltip={item.holds
                      ? {
                          text: item.folded ? t('home-owl-unfold') : t('home-owl-fold'),
                          shortcut: 'Space',
                        }
                      : null}
                    onclick={(e) => {
                      e.stopPropagation();
                      fold(key);
                    }}
                    ondblclick={(e) => e.stopPropagation()}
                  >
                    {#if item.folded}
                      <FolderIcon size={15} strokeWidth={1.7} />
                    {:else}
                      <FolderOpen size={15} strokeWidth={1.7} />
                    {/if}
                  </button>
                {/if}
                {#if renaming?.key === key}
                  <NameField
                    value={f.name}
                    startingWith={renaming.startingWith}
                    oncommit={(name) => renamed(key, name)}
                    oncancel={unrenamed}
                  />
                {:else}
                  <span class="label">{f.name}</span>
                {/if}
                {#if item.folded && !centre}
                  <span class="count">{t('home-folder-projects', { count: item.projects })}</span>
                {/if}
                {#if centre && onup}
                  <button
                    type="button"
                    class="corner leave"
                    tabindex="-1"
                    aria-label={t('home-owl-leave', { name: above })}
                    use:tooltip={{
                      text: t('home-owl-leave', { name: above }),
                      shortcut: 'Alt+Shift+↑',
                    }}
                    onclick={(e) => {
                      e.stopPropagation();
                      onup();
                    }}
                    ondblclick={(e) => e.stopPropagation()}
                  >
                    <Maximize2 size={11} />
                  </button>
                {:else if !centre && renaming?.key !== key}
                  <button
                    type="button"
                    class="corner enter"
                    tabindex="-1"
                    aria-label={t('home-owl-enter')}
                    use:tooltip={{ text: t('home-owl-enter'), shortcut: 'Alt+Shift+↓' }}
                    onclick={(e) => {
                      e.stopPropagation();
                      open(key);
                    }}
                    ondblclick={(e) => e.stopPropagation()}
                  >
                    <Minimize2 size={11} />
                  </button>
                {/if}
              </div>
            {:else if item.kind === 'project'}
              {@const pr = item.project}
              <div
                class="card"
                class:selected={selected.has(key)}
                id={domId(key)}
                role="treeitem"
                aria-level={p.depth + 1}
                aria-selected={selected.has(key)}
                data-owl-key={key}
                data-owl-project={pr.id}
                data-owl-parent={parent ?? undefined}
                data-side={p.side}
                data-selected={selected.has(key) ? '' : undefined}
                use:measured={key}
                use:dropTarget={dropOnCard(key)}
              >
                <div class="head">
                  <ProjectBadge
                    name={pr.name}
                    sharing={pr.sharing ? { owner: pr.sharing.owner } : null}
                    size={18}
                  />
                  {#if renaming?.key === key}
                    <span class="name serif">
                      <NameField
                        value={pr.name}
                        startingWith={renaming.startingWith}
                        oncommit={(name) => renamed(key, name)}
                        oncancel={unrenamed}
                      />
                    </span>
                  {:else}
                    <span class="name serif">{pr.name}</span>
                  {/if}
                  <button
                    type="button"
                    class="more"
                    tabindex="-1"
                    aria-label={t('home-more-for', { name: pr.name })}
                    onclick={(e) => {
                      e.stopPropagation();
                      selection = [key];
                      openMenu(e.currentTarget, itemsOf(key), { align: 'end' });
                    }}
                    ondblclick={(e) => e.stopPropagation()}
                  >
                    <Ellipsis size={15} />
                  </button>
                </div>
                {#if pr.description}<p class="description">{pr.description}</p>{/if}
                <!-- The map of the project, shown under the card, or hidden. -->
                <button
                  type="button"
                  class="facts map-toggle"
                  class:shown={!!item.map}
                  tabindex="-1"
                  aria-expanded={!!item.map}
                  use:tooltip={{
                    text: item.map ? t('home-owl-map-hide') : t('home-owl-map-show'),
                    shortcut: 'Space',
                  }}
                  onclick={(e) => {
                    e.stopPropagation();
                    fold(key);
                  }}
                  ondblclick={(e) => e.stopPropagation()}
                >
                  <ChevronRight size={12} />
                  {#if item.map === 'reading'}
                    {t('home-owl-map-reading')}
                  {:else if item.map === 'failed'}
                    {t('home-tree-unreadable')}
                  {:else if item.map === 'read' && !item.elements}
                    {t('home-tree-empty')}
                  {:else}
                    {trees(pr)}
                  {/if}
                </button>
                {#if renaming?.key !== key}
                  <button
                    type="button"
                    class="corner enter"
                    tabindex="-1"
                    aria-label={t('home-owl-open')}
                    use:tooltip={{ text: t('home-owl-open'), shortcut: 'Alt+Shift+↓' }}
                    onclick={(e) => {
                      e.stopPropagation();
                      open(key);
                    }}
                    ondblclick={(e) => e.stopPropagation()}
                  >
                    <Minimize2 size={11} />
                  </button>
                {/if}
              </div>
            {:else if item.kind === 'element'}
              <!-- An element of a project's map: its name, as it stands in its project. -->
              <div
                class="element"
                class:selected={selected.has(key)}
                class:folded={item.folded}
                id={domId(key)}
                role="treeitem"
                aria-level={p.depth + 1}
                aria-selected={selected.has(key)}
                aria-expanded={item.holds ? !item.folded : undefined}
                data-owl-key={key}
                data-owl-element={item.id}
                data-owl-of={item.project}
                data-owl-parent={parent ?? undefined}
                data-side={p.side}
                data-selected={selected.has(key) ? '' : undefined}
                use:measured={key}
                use:dropTarget={dropUnder(key)}
              >
                <span class="label serif" class:untitled={!item.name}
                  >{item.name || t('project-untitled')}</span
                >
                {#if item.holds}
                  <button
                    type="button"
                    class="twig"
                    tabindex="-1"
                    aria-label={item.folded
                      ? t('home-owl-unfold-element')
                      : t('home-owl-fold-element')}
                    use:tooltip={{
                      text: item.folded ? t('home-owl-unfold-element') : t('home-owl-fold-element'),
                      shortcut: 'Space',
                    }}
                    onclick={(e) => {
                      e.stopPropagation();
                      fold(key);
                    }}
                    ondblclick={(e) => e.stopPropagation()}
                  >
                    {item.folded ? p.hidden : ''}
                  </button>
                {/if}
                <button
                  type="button"
                  class="corner enter"
                  tabindex="-1"
                  aria-label={t('home-owl-jump')}
                  use:tooltip={{ text: t('home-owl-jump'), shortcut: 'Alt+Shift+↓' }}
                  onclick={(e) => {
                    e.stopPropagation();
                    open(key);
                  }}
                  ondblclick={(e) => e.stopPropagation()}
                >
                  <Minimize2 size={11} />
                </button>
              </div>
            {:else if item.kind === 'provisional'}
              <!-- Not yet made: its name is being written. -->
              <div
                class={item.of === 'folder'
                  ? 'folder provisional selected'
                  : 'card provisional selected'}
                id={domId(key)}
                role="treeitem"
                aria-level={p.depth + 1}
                aria-selected="true"
                data-owl-key={key}
                data-owl-provisional={item.of}
                data-owl-parent={parent ?? undefined}
                use:measured={key}
              >
                {#if item.of === 'folder'}
                  <FolderOpen size={15} strokeWidth={1.7} />
                  <span class="label">
                    <NameField
                      value=""
                      placeholder={t('home-owl-name')}
                      oncommit={made}
                      oncancel={unmade}
                    />
                  </span>
                {:else}
                  <div class="head">
                    <ProjectBadge name="" sharing={null} size={18} />
                    <span class="name serif">
                      <NameField
                        value=""
                        placeholder={t('home-owl-name')}
                        oncommit={made}
                        oncancel={unmade}
                      />
                    </span>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>

    <div class="controls" role="group" aria-label={t('diagram-view')}>
      <button
        type="button"
        aria-label={t('diagram-zoom-out')}
        use:tooltip={{ text: t('diagram-zoom-out'), side: 'top' }}
        onclick={() => zoomBy(1 / 1.25)}
      >
        <Minus size={14} />
      </button>
      <button
        type="button"
        class="level"
        aria-label={t('diagram-actual-size')}
        use:tooltip={{ text: t('diagram-actual-size'), side: 'top' }}
        onclick={() => zoomBy(1 / cam.k)}
      >
        {t('diagram-zoom', { percent: Math.round(cam.k * 100) })}
      </button>
      <button
        type="button"
        aria-label={t('diagram-zoom-in')}
        use:tooltip={{ text: t('diagram-zoom-in'), side: 'top' }}
        onclick={() => zoomBy(1.25)}
      >
        <Plus size={14} />
      </button>
      <span class="rule"></span>
      <button
        type="button"
        aria-label={t('home-owl-fit')}
        use:tooltip={{ text: t('home-owl-fit'), side: 'top', shortcut: 'Ctrl+0' }}
        onclick={fit}
      >
        <Scan size={14} />
      </button>
    </div>
  </div>
{/if}

<style>
  .alone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 70px 0 40px;
    text-align: center;
  }
  .alone h2 {
    margin-top: 10px;
    font-family: var(--font-text);
    font-size: 28px;
    font-weight: 500;
  }
  .alone p {
    max-width: 46ch;
    color: var(--ink-2);
    font-family: var(--font-text);
    font-size: 16px;
    line-height: 1.6;
  }
  .owl-map {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--paper);
    cursor: grab;
    touch-action: none;
    user-select: none;
  }
  .owl-map.panning {
    cursor: grabbing;
  }
  .world {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    transform-origin: 0 0;
  }
  .world.hidden {
    visibility: hidden;
  }
  .lines {
    position: absolute;
    left: 0;
    top: 0;
    width: 1px;
    height: 1px;
    overflow: visible;
    pointer-events: none;
  }
  .lines line {
    stroke: var(--line-strong);
    stroke-width: 1.2;
    stroke-linecap: round;
  }
  .place {
    position: absolute;
    left: 0;
    top: 0;
  }

  /* The owl: a picture, not a box. */
  .owl {
    display: flex;
    padding: 6px;
  }

  /* A folder: a plain label, no box. */
  .folder {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 6px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font-size: var(--text-sm);
    font-weight: 600;
    font-variant: small-caps;
    letter-spacing: 0.04em;
    white-space: nowrap;
    cursor: pointer;
  }
  .folder:hover {
    color: var(--accent-strong);
  }
  /* The folder at the centre, where one is: its name larger, as the owl is. */
  .folder.centre {
    padding: 6px 10px;
    color: var(--ink);
    cursor: default;
  }
  .folder.centre .label {
    font-family: var(--font-text);
    font-size: 22px;
    font-variant: normal;
    letter-spacing: 0;
  }
  .folder .fold {
    display: inline-flex;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .folder .fold:disabled {
    cursor: inherit;
  }
  .folder .label {
    font-size: var(--text-md);
  }
  .folder .count {
    color: var(--ink-4);
    font-weight: 400;
    font-variant: normal;
    letter-spacing: 0;
  }

  /* A project: a card, as on the page of cards, smaller. */
  .card {
    display: flex;
    flex-direction: column;
    gap: 3px;
    width: 230px;
    padding: 10px 8px 9px 12px;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-1);
    cursor: pointer;
    transition:
      box-shadow var(--slow) var(--ease),
      border-color var(--slow) var(--ease);
  }
  .card:hover {
    box-shadow: var(--shadow-2);
    border-color: var(--line-strong);
  }
  .owl-map:focus {
    outline: none;
  }

  /* What is selected: a ring in the colour of the buttons, which keeps the shape of what it rings. */
  .owl,
  .folder,
  .card {
    position: relative;
  }
  .owl {
    border-radius: 50%;
  }
  .selected {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
  .owl-map:not(:focus-within) .selected {
    outline-color: var(--line-strong);
  }
  /* What would take what is dragged. */
  .owl:global([data-drop-over]),
  .folder:global([data-drop-over]),
  .card:global([data-drop-over]) {
    outline: 2px dashed var(--accent);
    outline-offset: 4px;
    background: var(--accent-soft);
  }
  .provisional {
    cursor: text;
  }
  .card.provisional {
    border-style: dashed;
  }

  /* The corners that enter and come up: the sign alone, seen on hover and on what is selected. */
  .corner {
    position: absolute;
    top: -9px;
    right: -9px;
    width: 18px;
    height: 18px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--accent-strong);
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--fast) var(--ease);
  }
  .folder .corner {
    right: -14px;
  }
  .folder:hover .corner,
  .card:hover .corner,
  .selected .corner {
    opacity: 1;
    pointer-events: auto;
  }
  .corner:hover {
    background: var(--accent-soft);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  /* The whole title, on as many lines as it takes. */
  .name {
    flex: 1;
    min-width: 0;
    color: var(--ink);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
  .head {
    align-items: flex-start;
  }
  .description {
    margin: 0;
    padding-right: 6px;
    overflow: hidden;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .facts {
    color: var(--ink-4);
    font-size: var(--text-xs);
  }
  .map-toggle {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    align-self: flex-start;
    margin-left: -3px;
    padding: 1px 4px 1px 1px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    cursor: pointer;
  }
  .map-toggle:hover {
    background: var(--paper-hover);
    color: var(--ink-2);
  }
  .map-toggle :global(svg) {
    transition: transform var(--fast) var(--ease);
  }
  .map-toggle.shown :global(svg) {
    transform: rotate(90deg);
  }

  /* An element of a project's map: its name as a line of text, not a box, as in an outline. */
  .element {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 260px;
    padding: 3px 6px;
    border-bottom: 1px solid var(--line-strong);
    border-radius: var(--radius-s) var(--radius-s) 0 0;
    color: var(--ink-2);
    font-size: 14px;
    line-height: 1.3;
    cursor: pointer;
  }
  .element .label {
    overflow-wrap: anywhere;
  }
  .element .untitled {
    color: var(--ink-4);
    font-style: italic;
  }
  .element:hover {
    color: var(--ink);
  }
  .twig {
    flex: none;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink-3);
    font-size: 10px;
    line-height: 14px;
    cursor: pointer;
  }
  .element.folded .twig {
    background: var(--paper-raised);
  }
  .element .corner {
    right: -14px;
  }
  .element:hover .corner {
    opacity: 1;
    pointer-events: auto;
  }
  .element:global([data-drop-over]) {
    outline: 2px dashed var(--accent);
    outline-offset: 3px;
    background: var(--accent-soft);
  }

  /* What is dragged: under the pointer, and not where it is dropped. */
  .lifted {
    pointer-events: none;
    opacity: 0.85;
  }
  .more {
    display: inline-flex;
    flex: none;
    padding: 3px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--fast) var(--ease);
  }
  .card:hover .more,
  .card.selected .more {
    opacity: 1;
  }
  .more:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }

  .controls {
    position: absolute;
    right: 14px;
    bottom: 14px;
    display: flex;
    align-items: center;
    padding: 2px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    box-shadow: var(--shadow-1);
    cursor: default;
  }
  .controls button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 26px;
    padding: 0 5px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .controls button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .controls .level {
    min-width: 46px;
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
  }
  .controls .rule {
    width: 1px;
    height: 14px;
    margin: 0 2px;
    background: var(--line);
  }
</style>
