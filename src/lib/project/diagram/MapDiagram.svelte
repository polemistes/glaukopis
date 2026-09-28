<script lang="ts">
  import { untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import Maximize from '@lucide/svelte/icons/maximize';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import { widthFor } from '$lib/editor/commands';
  import type { KeyAction } from '$lib/editor/plugins';
  import { pictures, PICTURES_DRAGGED } from '$lib/figures/pictures.svelte';
  import { plural } from '$lib/library/format';
  import { drag, dropTarget, startDrag, type DropEvent } from '$lib/ui/drag.svelte';
  import type { RectLike } from '$lib/ui/floating';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import ElementBox from '../ElementBox.svelte';
  import {
    elementMenu,
    removeElements,
    type ElementActions,
    type ElementsPayload,
  } from '../elements';
  import ElementTooltip from '../ElementTooltip.svelte';
  import type { Project } from '../model/project.svelte';
  import { isAncestor, subtree } from '../model/tree';
  import type { Position } from '../model/types';
  import DiagramNode from './DiagramNode.svelte';
  import {
    associationCurve,
    edgePoint,
    hierarchyLine,
    layout,
    neighbour,
    type Placed,
    type Size,
  } from './layout';

  /** The view of a map: the point of the canvas in the middle of the window, and the scale. */
  export interface Camera {
    cx: number;
    cy: number;
    k: number;
  }

  interface Props {
    project: Project;
    mapId: string;
    /** Where the view was when the map was last shown. */
    camera?: Camera | null;
    oncamera?: (camera: Camera) => void;
    /** Called with the id of every reference that comes into use. */
    onkeep: (id: string) => void;
    onopenmap: (id: string) => void;
    /** An element to select and bring into view when the map appears. */
    reveal?: string | null;
  }

  let {
    project,
    mapId,
    camera = null,
    oncamera,
    onkeep,
    onopenmap,
    reveal = null,
  }: Props = $props();

  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 2.5;

  let viewport = $state<HTMLDivElement>();
  let width = $state(0);
  let height = $state(0);
  /** Where the origin of the canvas is in the window, and the scale. */
  let cam = $state({ x: 0, y: 0, k: 1 });
  let placedCamera = false;

  const sizes = new SvelteMap<string, Size>();
  let selection = $state<string[]>([]);
  let selectedLink = $state<string | null>(null);
  let renaming = $state<string | null>(null);
  /** Elements made a moment ago, which go again if left without a name. */
  const fresh = new Set<string>();
  let editing = $state<{ id: string; anchor: RectLike; begin: 'title' | 'body' } | null>(null);
  let hovered = $state<{ id: string; anchor: RectLike } | null>(null);
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  /** An association being drawn: from an element to where the pointer is. */
  let linking = $state<{ from: string; x: number; y: number; over: string | null } | null>(null);
  /** An association begun from the menu: the next element clicked ends it. */
  let linkFrom = $state<string | null>(null);
  let labelling = $state<{ id: string; value: string } | null>(null);
  let band = $state<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  let panning = $state(false);

  const tree = $derived(project.tree(mapId));
  const selected = $derived(new Set(selection));

  // ---- what is being dragged, when it is from this map ----

  const dragged = $derived.by(() => {
    const p = drag.payload;
    if (p?.kind !== 'elements') return null;
    const data = p.data as ElementsPayload;
    return data.project === project && data.map === mapId ? data : null;
  });

  const overThis = $derived(!!dragged && drag.welcome && drag.quiet);

  const held = $derived.by(() => {
    const out = new Map<string, Position>();
    if (!dragged || !overThis) return out;
    const world = toWorld(drag.x, drag.y);
    dragged.ids.forEach((id, i) => {
      out.set(id, { x: world.x - dragged.grab.x, y: world.y - dragged.grab.y + i * 52 });
    });
    return out;
  });

  const lifted = $derived.by(() => {
    const out = new Set<string>();
    if (dragged) for (const id of dragged.ids) for (const d of subtree(tree, id)) out.add(d);
    return out;
  });

  const lay = $derived(layout(tree, project.nodes, sizes, held));

  /** The element something dragged would go under, if dropped now. */
  const dropOn = $derived.by(() => {
    const p = drag.payload;
    if (!p || !drag.welcome || drag.copy === undefined) return null;
    if (p.kind !== 'elements' && p.kind !== 'references' && p.kind !== PICTURES_DRAGGED)
      return null;
    if (!pointerInside(drag.x, drag.y)) return null;
    const world = toWorld(drag.x, drag.y);
    return hit(world, p.kind === 'elements' ? lifted : new Set());
  });

  // ---- coordinates ----

  function toWorld(clientX: number, clientY: number): Position {
    const rect = viewport?.getBoundingClientRect();
    const left = rect?.left ?? 0;
    const top = rect?.top ?? 0;
    return { x: (clientX - left - cam.x) / cam.k, y: (clientY - top - cam.y) / cam.k };
  }

  function pointerInside(clientX: number, clientY: number): boolean {
    const rect = viewport?.getBoundingClientRect();
    return (
      !!rect &&
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  function screenRect(p: Placed): RectLike {
    const rect = viewport?.getBoundingClientRect();
    const left = (rect?.left ?? 0) + cam.x + (p.x - p.w / 2) * cam.k;
    const top = (rect?.top ?? 0) + cam.y + (p.y - p.h / 2) * cam.k;
    return {
      left,
      top,
      right: left + p.w * cam.k,
      bottom: top + p.h * cam.k,
      width: p.w * cam.k,
      height: p.h * cam.k,
    };
  }

  /** The element at a point of the canvas, the topmost first. */
  function hit(world: Position, except: Set<string> = new Set()): string | null {
    for (let i = lay.order.length - 1; i >= 0; i--) {
      const p = lay.placed.get(lay.order[i])!;
      if (except.has(p.id)) continue;
      if (Math.abs(world.x - p.x) <= p.w / 2 + 3 && Math.abs(world.y - p.y) <= p.h / 2 + 3)
        return p.id;
    }
    return null;
  }

  // ---- the camera ----

  $effect(() => {
    if (!viewport) return;
    const el = viewport;
    const resized = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === width && h === height) return;
      untrack(() => {
        if (placedCamera && width && height) {
          // What was in the middle stays in the middle.
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

  // The first time the size is known, the view is put where it was left; or
  // else the centre of the map goes to the middle.
  $effect(() => {
    if (placedCamera || !width || !height) return;
    placedCamera = true;
    untrack(() => {
      const root = tree.root ? lay.placed.get(tree.root) : null;
      const k = camera?.k ?? 1;
      const cx = camera?.cx ?? root?.x ?? 0;
      const cy = camera?.cy ?? root?.y ?? 0;
      cam = { x: width / 2 - cx * k, y: height / 2 - cy * k, k };
    });
  });

  let cameraTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    if (!placedCamera || !width) return;
    const snapshot: Camera = {
      cx: Math.round((width / 2 - cam.x) / cam.k),
      cy: Math.round((height / 2 - cam.y) / cam.k),
      k: Math.round(cam.k * 1000) / 1000,
    };
    clearTimeout(cameraTimer);
    cameraTimer = setTimeout(() => oncamera?.(snapshot), 400);
  });

  function zoomAt(clientX: number, clientY: number, k: number) {
    const rect = viewport?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, k));
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const wx = (px - cam.x) / cam.k;
    const wy = (py - cam.y) / cam.k;
    cam = { x: px - wx * next, y: py - wy * next, k: next };
  }

  function zoomBy(factor: number) {
    const rect = viewport?.getBoundingClientRect();
    if (rect) zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, cam.k * factor);
  }

  export function fit() {
    const b = lay.bounds;
    const w = b.right - b.left;
    const h = b.bottom - b.top;
    if (!width || !height) return;
    const k = Math.max(
      MIN_ZOOM,
      Math.min(1, (width - 120) / Math.max(w, 1), (height - 120) / Math.max(h, 1)),
    );
    cam = {
      x: width / 2 - ((b.left + b.right) / 2) * k,
      y: height / 2 - ((b.top + b.bottom) / 2) * k,
      k,
    };
  }

  /** Moves the view, if need be, so that an element is in it. */
  function bringIntoView(id: string) {
    const p = lay.placed.get(id);
    if (!p || !width) return;
    const margin = 60;
    const left = cam.x + (p.x - p.w / 2) * cam.k;
    const right = cam.x + (p.x + p.w / 2) * cam.k;
    const top = cam.y + (p.y - p.h / 2) * cam.k;
    const bottom = cam.y + (p.y + p.h / 2) * cam.k;
    let dx = 0;
    let dy = 0;
    if (left < margin) dx = margin - left;
    else if (right > width - margin) dx = width - margin - right;
    if (top < margin) dy = margin - top;
    else if (bottom > height - margin) dy = height - margin - bottom;
    if (dx || dy) cam = { ...cam, x: cam.x + dx, y: cam.y + dy };
  }

  $effect(() => {
    if (!viewport) return;
    const el = viewport;
    const onwheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest('.rename')) return;
      event.preventDefault();
      hovered = null;
      if (event.ctrlKey || event.metaKey) {
        zoomAt(event.clientX, event.clientY, cam.k * Math.exp(-event.deltaY * 0.0022));
      } else {
        const scale = event.deltaMode === 1 ? 32 : 1;
        cam = { ...cam, x: cam.x - event.deltaX * scale, y: cam.y - event.deltaY * scale };
      }
    };
    el.addEventListener('wheel', onwheel, { passive: false });
    return () => el.removeEventListener('wheel', onwheel);
  });

  // ---- selection ----

  function select(ids: string[]) {
    selection = ids;
    selectedLink = null;
  }

  // The others are told which element this user is at.
  $effect(() => {
    project.at(selection.length === 1 ? selection[0] : null);
  });

  $effect(() => {
    // What is selected must be there, and visible.
    const present = selection.filter((id) => lay.placed.has(id));
    if (present.length !== selection.length) selection = present;
  });

  $effect(() => {
    const id = reveal;
    if (!id) return;
    untrack(() => {
      if (!project.node(id) || project.node(id)?.map !== mapId) return;
      // Open what it is folded under.
      let at = tree.parent.get(id) ?? null;
      while (at) {
        if (project.node(at)?.collapsed) project.setCollapsed(at, false);
        at = tree.parent.get(at) ?? null;
      }
      select([id]);
      queueMicrotask(() => bringIntoView(id));
    });
  });

  // ---- the pointer on elements ----

  function nodePointerDown(event: PointerEvent, id: string) {
    if (event.button !== 0 || renaming === id) return;
    event.stopPropagation();
    viewport?.focus({ preventScroll: true });
    hovered = null;
    clearTimeout(hoverTimer);

    if (linkFrom) {
      if (linkFrom !== id) project.addLink(linkFrom, id);
      linkFrom = null;
      return;
    }

    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    const was = selected.has(id);
    if (additive) {
      select(was ? selection.filter((s) => s !== id) : [...selection, id]);
    } else if (!was) {
      select([id]);
    }
    if (renaming) finishRename(renaming, 'blur');

    const start = toWorld(event.clientX, event.clientY);
    const p = lay.placed.get(id);
    let moved = false;
    startDrag(event, () => {
      if (additive && was) return null;
      moved = true;
      const ids = (selected.has(id) ? selection : [id]).filter((s) => lay.placed.has(s));
      // The one under the pointer leads.
      const ordered = [id, ...ids.filter((s) => s !== id)].filter(
        (s) => !ids.some((o) => o !== s && isAncestor(tree, o, s)),
      );
      const data: ElementsPayload = {
        project,
        map: mapId,
        ids: ordered,
        grab: { x: start.x - (p?.x ?? start.x), y: start.y - (p?.y ?? start.y) },
      };
      const name = project.node(id)?.title || 'Untitled';
      return {
        kind: 'elements',
        data,
        label: ordered.length === 1 ? name : plural(ordered.length, 'element'),
      };
    });
    if (!additive && was) {
      window.addEventListener(
        'pointerup',
        () => {
          if (!moved) select([id]);
        },
        { once: true },
      );
    }
  }

  function nodeEnter(id: string) {
    if (drag.payload || renaming || editing || linking || panning) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      const p = lay.placed.get(id);
      if (p && !drag.payload && !editing) hovered = { id, anchor: screenRect(p) };
    }, 480);
  }

  function nodeLeave() {
    clearTimeout(hoverTimer);
    hovered = null;
  }

  function open(id: string, begin: 'title' | 'body' = 'body') {
    const p = lay.placed.get(id);
    if (!p) return;
    hovered = null;
    clearTimeout(hoverTimer);
    if (renaming) finishRename(renaming, 'blur');
    select([id]);
    editing = { id, anchor: screenRect(p), begin };
  }

  function closeBox() {
    editing = null;
    viewport?.focus({ preventScroll: true });
  }

  // ---- naming ----

  function rename(id: string) {
    hovered = null;
    project.checkpoint();
    renaming = id;
    queueMicrotask(() => bringIntoView(id));
  }

  function finishRename(id: string, action: KeyAction | 'blur') {
    if (renaming !== id) return;
    renaming = null;
    project.checkpoint();
    const node = project.node(id);
    const wasFresh = fresh.delete(id);
    const abandoned =
      wasFresh && node && !node.title && node.empty && !(tree.children.get(id)?.length ?? 0);
    if (abandoned && (action === 'escape' || action === 'blur')) {
      const parent = tree.parent.get(id) ?? null;
      project.remove([id]);
      select(parent ? [parent] : []);
    } else if (action === 'tab') {
      add('child', id);
      return;
    }
    if (action !== 'blur') viewport?.focus({ preventScroll: true });
  }

  function add(kind: 'child' | 'sibling', at: string) {
    project.checkpoint();
    const id = kind === 'child' ? project.addChild(at) : project.addSibling(at);
    if (!id) return;
    fresh.add(id);
    select([id]);
    // The new element is measured before it is named, so that it appears in its place.
    requestAnimationFrame(() => rename(id));
  }

  // ---- drops ----

  function placeAt(id: string, world: Position) {
    const parent = tree.parent.get(id) ?? null;
    if (parent === null) {
      project.setPosition(id, world);
      return;
    }
    const pp = lay.placed.get(parent);
    if (!pp) return;
    const rel = { x: world.x - pp.x, y: world.y - pp.y };
    const side = rel.x < 0 ? 'left' : 'right';
    // Its place among its siblings follows from where it stands: on its side, from the top down.
    const siblings = (tree.children.get(parent) ?? []).filter((s) => s !== id);
    const same = siblings.filter((s) => lay.placed.get(s)?.side === side);
    const below = same.find((s) => (lay.placed.get(s)?.y ?? 0) > world.y);
    let index: number;
    if (below) index = siblings.indexOf(below);
    else if (same.length) index = siblings.indexOf(same[same.length - 1]) + 1;
    else index = side === 'right' ? 0 : siblings.length;
    // `move` counts places in the list as it is, with the element in it.
    const full = tree.children.get(parent) ?? [];
    const before = siblings[index];
    const at = before ? full.indexOf(before) : full.length;
    project.move([id], parent, at, { pos: rel });
  }

  function ondrop(event: DropEvent) {
    const { payload } = event;
    const world = toWorld(event.x, event.y);

    if (payload.kind === 'references') {
      const target = hit(world);
      if (!target) return;
      // A reference dropped on an element is cited at the end of its text.
      const refs = payload.data as string[];
      project.checkpoint();
      project.cite(target, refs);
      project.checkpoint();
      for (const ref of refs) onkeep(ref);
      select([target]);
      return;
    }

    if (payload.kind === PICTURES_DRAGGED) {
      const target = hit(world);
      if (!target) return;
      // A picture dropped on an element is a figure at the end of its text.
      project.checkpoint();
      for (const hash of payload.data as string[]) {
        const picture = pictures.get(hash);
        if (picture) project.addFigure(target, picture, widthFor(picture));
      }
      project.checkpoint();
      select([target]);
      return;
    }

    if (payload.kind !== 'elements') return;
    const data = payload.data as ElementsPayload;
    if (data.project !== project) return;
    const local = data.map === mapId;
    const except = new Set<string>();
    if (local) for (const id of data.ids) for (const d of subtree(tree, id)) except.add(d);
    const target = hit(world, except);

    project.checkpoint();
    let result: string[] = [];
    if (target) {
      result = event.copy
        ? project.copy(data.ids, target)
        : project.move(data.ids, target, undefined, { pos: null });
    } else if (local && !event.copy) {
      data.ids.forEach((id, i) => {
        placeAt(id, { x: world.x - data.grab.x, y: world.y - data.grab.y + i * 52 });
      });
      result = data.ids;
    } else {
      // From another map, or a copy: loose, where it was dropped.
      const options = { pos: world, map: mapId };
      result = event.copy
        ? project.copy(data.ids, null, undefined, options)
        : project.move(data.ids, null, undefined, options);
    }
    project.checkpoint();
    if (result.length) {
      select(result);
      viewport?.focus({ preventScroll: true });
    }
  }

  // ---- the background: panning, the rubber band ----

  function backgroundPointerDown(event: PointerEvent) {
    if (event.button !== 0 && event.button !== 1) return;
    if ((event.target as HTMLElement).closest('.node, .controls, .link-label')) return;
    viewport?.focus({ preventScroll: true });
    hovered = null;
    if (renaming) finishRename(renaming, 'blur');
    if (linkFrom) {
      linkFrom = null;
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const origin = { x: cam.x, y: cam.y };
    const banding = event.shiftKey && event.button === 0;
    let moved = false;
    const base = banding ? selection.slice() : [];

    const move = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      if (banding) {
        const a = toWorld(startX, startY);
        const b = toWorld(e.clientX, e.clientY);
        band = {
          x0: Math.min(a.x, b.x),
          y0: Math.min(a.y, b.y),
          x1: Math.max(a.x, b.x),
          y1: Math.max(a.y, b.y),
        };
        const inside = lay.order.filter((id) => {
          const p = lay.placed.get(id)!;
          return (
            p.x + p.w / 2 >= band!.x0 &&
            p.x - p.w / 2 <= band!.x1 &&
            p.y + p.h / 2 >= band!.y0 &&
            p.y - p.h / 2 <= band!.y1
          );
        });
        selection = [...new Set([...base, ...inside])];
      } else {
        panning = true;
        cam = { ...cam, x: origin.x + dx, y: origin.y + dy };
      }
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      panning = false;
      band = null;
      if (!moved) select([]);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function backgroundDoubleClick(event: MouseEvent) {
    if ((event.target as HTMLElement).closest('.node, .controls, .link-hit, .link-label')) return;
    // A thought that has no place yet.
    const world = toWorld(event.clientX, event.clientY);
    project.checkpoint();
    const id = project.addLoose(mapId, world);
    if (!id) return;
    fresh.add(id);
    select([id]);
    requestAnimationFrame(() => rename(id));
  }

  // ---- associations ----

  function linkStart(from: string, event: PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    hovered = null;
    const world = toWorld(event.clientX, event.clientY);
    linking = { from, x: world.x, y: world.y, over: null };
    const move = (e: PointerEvent) => {
      const w = toWorld(e.clientX, e.clientY);
      const over = hit(w, new Set([from]));
      linking = { from, x: w.x, y: w.y, over };
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const l = linking;
      linking = null;
      if (l?.over) {
        project.checkpoint();
        const id = project.addLink(from, l.over);
        project.checkpoint();
        if (id) {
          selection = [];
          selectedLink = id;
        }
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  /** The end of an association: the element itself, or what it is folded under. */
  function visibleEnd(id: string): Placed | null {
    let at: string | null = id;
    while (at) {
      const p = lay.placed.get(at);
      if (p) return p;
      at = tree.parent.get(at) ?? null;
    }
    return null;
  }

  const curves = $derived.by(() => {
    const out: { id: string; path: string; middle: Position; label: string; faint: boolean }[] = [];
    for (const link of project.linksOf(mapId)) {
      const a = visibleEnd(link.from);
      const b = visibleEnd(link.to);
      if (!a || !b || a.id === b.id) continue;
      const c = associationCurve(a, b);
      out.push({
        id: link.id,
        path: c.path,
        middle: c.middle,
        label: link.label,
        faint: a.id !== link.from || b.id !== link.to,
      });
    }
    return out;
  });

  const lines = $derived.by(() => {
    const out: { id: string; x1: number; y1: number; x2: number; y2: number; faint: boolean }[] =
      [];
    for (const p of lay.placed.values()) {
      if (!p.parent) continue;
      const parent = lay.placed.get(p.parent);
      if (!parent) continue;
      const [a, b] = hierarchyLine(parent, p);
      out.push({ id: p.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y, faint: lifted.has(p.id) });
    }
    return out;
  });

  const pendingCurve = $derived.by(() => {
    if (!linking) return null;
    const from = lay.placed.get(linking.from);
    if (!from) return null;
    const over = linking.over ? lay.placed.get(linking.over) : null;
    if (over) return associationCurve(from, over).path;
    const start = edgePoint(from, linking);
    return `M ${start.x} ${start.y} L ${linking.x} ${linking.y}`;
  });

  function commitLabel() {
    if (!labelling) return;
    project.setLinkLabel(labelling.id, labelling.value);
    labelling = null;
    viewport?.focus({ preventScroll: true });
  }

  // ---- keys ----

  const actions: ElementActions = {
    rename,
    edit: (id) => open(id),
    select,
    link: (id) => (linkFrom = id),
    openMap: (id) => onopenmap(id),
  };

  function onkeydown(event: KeyboardEvent) {
    if (event.target !== viewport) return;
    const mod = event.ctrlKey || event.metaKey;
    const one = selection.length === 1 ? selection[0] : null;
    const last = selection[selection.length - 1] ?? null;

    if (mod && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) project.undo();
      else if (key === 'y' || (key === 'z' && event.shiftKey)) project.redo();
      else if (key === 'a') select(lay.order.slice());
      else if (key === '0') fit();
      else if (key === '=' || key === '+') zoomBy(1.2);
      else if (key === '-') zoomBy(1 / 1.2);
      else return;
      event.preventDefault();
      return;
    }

    switch (event.key) {
      case 'Tab':
        if (one) add('child', one);
        else if (!selection.length && tree.root) add('child', tree.root);
        break;
      case 'Enter':
        if (one && event.altKey) open(one);
        else if (one) add('sibling', one);
        else if (!selection.length && tree.root) select([tree.root]);
        break;
      case 'F2':
        if (one) rename(one);
        break;
      case ' ':
        if (one && (tree.children.get(one)?.length ?? 0)) {
          project.setCollapsed(one, !project.node(one)?.collapsed);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedLink) {
          project.removeLink(selectedLink);
          selectedLink = null;
        } else if (selection.length) {
          const parent = one ? (tree.parent.get(one) ?? null) : null;
          if (removeElements(project, selection) && parent) select([parent]);
        }
        break;
      case 'Escape':
        if (linkFrom) linkFrom = null;
        else select([]);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown': {
        const from = last ?? tree.root;
        if (!from) break;
        if (!last) {
          select([from]);
          break;
        }
        const direction = event.key.slice(5).toLowerCase() as 'left' | 'right' | 'up' | 'down';
        const next = neighbour(lay, from, direction);
        if (next) {
          select(event.shiftKey ? [...selection.filter((s) => s !== next), next] : [next]);
          bringIntoView(next);
        }
        break;
      }
      default:
        // A letter begins a new name for what is selected.
        if (one && event.key.length === 1 && !event.altKey && /\S/.test(event.key)) {
          project.checkpoint();
          project.setTitle(one, '');
          renaming = one;
          // The key itself goes to the editor once it is there.
          const typed = event.key;
          setTimeout(() => {
            const field = viewport?.querySelector<HTMLElement>(`[data-node="${one}"] .prose`);
            field?.focus();
            document.execCommand('insertText', false, typed);
          }, 40);
          break;
        }
        return;
    }
    event.preventDefault();
  }

  function oncontextmenu(event: MouseEvent) {
    const el = (event.target as HTMLElement).closest<HTMLElement>('[data-node]');
    event.preventDefault();
    hovered = null;
    clearTimeout(hoverTimer);
    if (!el) {
      const world = toWorld(event.clientX, event.clientY);
      openContextMenu(event, [
        {
          label: 'New loose element here',
          hint: 'A thought that has no place yet',
          action: () => {
            project.checkpoint();
            const id = project.addLoose(mapId, world);
            if (id) {
              fresh.add(id);
              select([id]);
              requestAnimationFrame(() => rename(id));
            }
          },
        },
        { kind: 'separator' },
        { label: 'Show the whole map', shortcut: 'Ctrl+0', action: fit },
        {
          label: 'Tidy the whole map',
          hint: 'Every element goes back to its automatic place',
          action: () => {
            project.checkpoint();
            project.tidy(tree.sequence);
            project.checkpoint();
            requestAnimationFrame(fit);
          },
        },
      ]);
      return;
    }
    const id = el.dataset.node!;
    if (!selected.has(id)) select([id]);
    openContextMenu(event, elementMenu(project, selected.has(id) ? selection : [id], actions, el));
  }

  const empty = $derived(tree.sequence.length <= 1);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  bind:this={viewport}
  class="diagram"
  class:panning
  class:linking={!!linking || !!linkFrom}
  role="application"
  aria-label="Map"
  tabindex="0"
  use:dropTarget={{
    accepts: (p) =>
      (p.kind === 'elements' && (p.data as ElementsPayload).project === project) ||
      p.kind === 'references' ||
      p.kind === PICTURES_DRAGGED,
    ondrop,
    quiet: (p) => p.kind === 'elements' && (p.data as ElementsPayload).map === mapId,
  }}
  onpointerdown={backgroundPointerDown}
  ondblclick={backgroundDoubleClick}
  {onkeydown}
  {oncontextmenu}
>
  <div class="world" style:transform="translate({cam.x}px, {cam.y}px) scale({cam.k})">
    <svg class="lines" aria-hidden="true">
      {#each lines as l (l.id)}
        <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} class="branch" class:faint={l.faint} />
      {/each}
      {#each curves as c (c.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <g
          class="association"
          class:selected={selectedLink === c.id}
          class:faint={c.faint}
          onpointerdown={(e) => {
            e.stopPropagation();
            viewport?.focus({ preventScroll: true });
            selection = [];
            selectedLink = c.id;
          }}
          ondblclick={(e) => {
            e.stopPropagation();
            labelling = { id: c.id, value: c.label };
          }}
        >
          <path d={c.path} class="link-hit" />
          <path d={c.path} class="curve" />
        </g>
      {/each}
      {#if pendingCurve}
        <path d={pendingCurve} class="curve pending" />
      {/if}
      {#if band}
        <rect
          class="band"
          x={band.x0}
          y={band.y0}
          width={band.x1 - band.x0}
          height={band.y1 - band.y0}
        />
      {/if}
    </svg>

    {#each curves as c (c.id)}
      {#if labelling?.id === c.id}
        <input
          class="link-label editing"
          style:transform="translate(-50%, -50%) translate({c.middle.x}px, {c.middle.y}px)"
          bind:value={labelling.value}
          placeholder="How they are related"
          aria-label="Label of the association"
          onblur={commitLabel}
          onkeydown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commitLabel();
            else if (e.key === 'Escape') {
              labelling = null;
              viewport?.focus({ preventScroll: true });
            }
          }}
          {@attach (el: HTMLInputElement) => el.focus()}
        />
      {:else if c.label}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
          class="link-label"
          class:selected={selectedLink === c.id}
          style:transform="translate(-50%, -50%) translate({c.middle.x}px, {c.middle.y}px)"
          onpointerdown={(e) => {
            e.stopPropagation();
            selection = [];
            selectedLink = c.id;
          }}
          ondblclick={(e) => {
            e.stopPropagation();
            labelling = { id: c.id, value: c.label };
          }}>{c.label}</span
        >
      {/if}
    {/each}

    {#each lay.order as id (id)}
      {@const node = project.nodes.get(id)}
      {@const p = lay.placed.get(id)}
      {#if node && p}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="hold"
          onpointerdown={(e) => nodePointerDown(e, id)}
          ondblclick={(e) => {
            e.stopPropagation();
            if (renaming !== id) open(id);
          }}
          onpointerenter={() => nodeEnter(id)}
          onpointerleave={nodeLeave}
        >
          <DiagramNode
            {project}
            {node}
            placed={p}
            selected={selected.has(id)}
            target={dropOn === id || linking?.over === id}
            lifted={lifted.has(id) && overThis}
            renaming={renaming === id}
            hasChildren={(tree.children.get(id)?.length ?? 0) > 0}
            excluded={node.excluded}
            others={project.othersAt(id)}
            onsize={(nodeId, size) => {
              if (!size) sizes.delete(nodeId);
              else {
                const old = sizes.get(nodeId);
                if (!old || old.w !== size.w || old.h !== size.h) sizes.set(nodeId, size);
              }
            }}
            onrenamed={finishRename}
            ontoggle={(nodeId) => project.setCollapsed(nodeId, !project.node(nodeId)?.collapsed)}
            onlinkstart={linkStart}
          />
        </div>
      {/if}
    {/each}
  </div>

  {#if empty && !renaming}
    <div class="hint">
      <kbd>Tab</kbd> adds an idea under the one selected · <kbd>Enter</kbd> adds one beside it · double-click
      to write
    </div>
  {/if}
  {#if linkFrom}
    <div class="hint strong">Click the element to associate with · <kbd>Esc</kbd> to leave it</div>
  {/if}

  <div class="controls" role="group" aria-label="View">
    <button
      type="button"
      aria-label="Zoom out"
      use:tooltip={{ text: 'Zoom out', shortcut: 'Ctrl+−', side: 'top' }}
      onclick={() => zoomBy(1 / 1.25)}
    >
      <Minus size={14} />
    </button>
    <button
      type="button"
      class="level"
      aria-label="Actual size"
      use:tooltip={{ text: 'Actual size', side: 'top' }}
      onclick={() => zoomBy(1 / cam.k)}
    >
      {Math.round(cam.k * 100)}%
    </button>
    <button
      type="button"
      aria-label="Zoom in"
      use:tooltip={{ text: 'Zoom in', shortcut: 'Ctrl+=', side: 'top' }}
      onclick={() => zoomBy(1.25)}
    >
      <Plus size={14} />
    </button>
    <span class="rule"></span>
    <button
      type="button"
      aria-label="Show the whole map"
      use:tooltip={{ text: 'Show the whole map', shortcut: 'Ctrl+0', side: 'top' }}
      onclick={fit}
    >
      <Maximize size={14} />
    </button>
  </div>
</div>

{#if hovered && !editing && !renaming && !drag.payload}
  {#key hovered.id}
    <ElementTooltip {project} id={hovered.id} anchor={hovered.anchor} />
  {/key}
{/if}

{#if editing}
  {#key editing.id}
    <ElementBox
      {project}
      id={editing.id}
      anchor={editing.anchor}
      begin={editing.begin}
      {onkeep}
      onclose={closeBox}
    />
  {/key}
{/if}

<style>
  .diagram {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--canvas);
    background-image: radial-gradient(
      circle,
      color-mix(in srgb, var(--ink-4) 28%, transparent) 1px,
      transparent 1px
    );
    background-size: 26px 26px;
    outline: none;
    cursor: grab;
    touch-action: none;
  }
  .diagram.panning {
    cursor: grabbing;
  }
  .diagram.linking,
  .diagram.linking :global(.node) {
    cursor: crosshair;
  }
  .world {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    transform-origin: 0 0;
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
  .branch {
    stroke: var(--ink-4);
    stroke-width: 1.4;
    stroke-linecap: round;
  }
  .branch.faint {
    opacity: 0.35;
  }
  .association {
    pointer-events: stroke;
    cursor: pointer;
  }
  .curve {
    fill: none;
    stroke: var(--gold);
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
    stroke-linecap: round;
  }
  .association.faint .curve {
    opacity: 0.45;
  }
  .association:hover .curve,
  .association.selected .curve {
    stroke-width: 2.4;
  }
  .association.selected .curve {
    stroke-dasharray: none;
  }
  .link-hit {
    fill: none;
    stroke: transparent;
    stroke-width: 14;
  }
  .curve.pending {
    opacity: 0.8;
    pointer-events: none;
  }
  .band {
    fill: var(--selection);
    stroke: var(--accent);
    stroke-width: 1;
  }
  .link-label {
    position: absolute;
    left: 0;
    top: 0;
    padding: 1px 7px;
    border-radius: 9px;
    background: var(--canvas);
    color: var(--gold);
    font-size: 12px;
    font-style: italic;
    font-family: var(--font-text);
    white-space: nowrap;
    cursor: pointer;
  }
  .link-label.selected {
    box-shadow: 0 0 0 1px var(--gold);
  }
  input.link-label {
    width: 180px;
    border: 1px solid var(--gold);
    background: var(--paper-raised);
    color: var(--ink);
    outline: none;
    cursor: text;
    font-style: normal;
    padding: 2px 8px;
  }
  .hold {
    display: contents;
  }
  .hint {
    position: absolute;
    left: 50%;
    bottom: 22px;
    transform: translateX(-50%);
    padding: 6px 14px;
    border-radius: 20px;
    background: color-mix(in srgb, var(--paper-raised) 85%, transparent);
    border: 1px solid var(--line);
    color: var(--ink-3);
    font-size: var(--text-sm);
    white-space: nowrap;
    pointer-events: none;
    backdrop-filter: blur(6px);
    /* Clear of the controls in the corner, however narrow the map is shown. */
    max-width: calc(100% - 340px);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hint.strong {
    top: 16px;
    bottom: auto;
    max-width: calc(100% - 40px);
    border-color: var(--gold);
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
