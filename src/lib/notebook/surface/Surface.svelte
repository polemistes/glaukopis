<script lang="ts">
  /**
   * The surface of a box (`docs/plans/the-notebook.md`, stage 2): its notes
   * as cards where they were put, on a ground that is panned and zoomed as
   * the map of a project is (`ui/pan-zoom.svelte.ts`); cards moved, made
   * wider, selected, linked; the strip of the notes not yet put. Only the
   * cards the view shows, and a little round it, are drawn; their heights
   * are measured as they are and kept for the links and the band. What
   * the page gives it and asks of it is in `Props`.
   */
  import Plus from '@lucide/svelte/icons/plus';
  import { untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { t } from '$lib/i18n';
  import { associationMenu } from '$lib/project/associations';
  import AssociationCurves from '$lib/project/diagram/AssociationCurves.svelte';
  import AssociationLabels from '$lib/project/diagram/AssociationLabels.svelte';
  import { keyOf, keysFor } from '$lib/shell/keys.svelte';
  import { centred, type Bounds, type Camera } from '$lib/ui/camera';
  import { dropTarget, type DropEvent } from '$lib/ui/drag.svelte';
  import { openContextMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { followPointer, PanZoom } from '$lib/ui/pan-zoom.svelte';
  import ZoomControls from '$lib/ui/ZoomControls.svelte';
  import type { Notebook } from '../model/notebook.svelte';
  import { CARD_WIDTH, cardWidth } from '../model/places';
  import type { NoteRecord, Point } from '../model/types';
  import { takeFiles } from '../taking';
  import {
    bandOf,
    boundsOf,
    cardAt,
    cardBox,
    cardsInView,
    letGoAt,
    nearest,
    nearestTo,
    stacked,
    touching,
    type CardBox,
    type Direction,
  } from './geometry';
  import { linkBeingDrawn, linksDrawn, notebookLinkHolder } from './links';
  import Strip from './Strip.svelte';
  import { partNotes, unplacedOf } from './strip';
  import SurfaceCard from './SurfaceCard.svelte';

  interface Props {
    notebook: Notebook;
    /** The box whose surface this is. */
    box: string;
    /** The notes selected, by id: the page's and the surface's alike. */
    selection: string[];
    /** Where the surface was looked at when it was left; none: it shows all. */
    camera?: Camera | null;
    oncamera?: (camera: Camera) => void;
    /** A note is to be opened beside the surface, to be written. */
    onopen: (id: string) => void;
    /** The notes are to be deleted: the page deletes, and says so with Undo. */
    ondelete: (ids: string[]) => void;
    /** The menu of the right button on notes: the page builds it. */
    oncontext: (event: MouseEvent, ids: string[]) => void;
  }

  let {
    notebook,
    box,
    selection = $bindable(),
    camera = null,
    oncamera,
    onopen,
    ondelete,
    oncontext,
  }: Props = $props();

  let viewport = $state<HTMLDivElement>();
  let strip = $state<HTMLElement>();
  /** Tells apart the elements of this surface in the page from those of another. */
  const domPrefix = `surface-${Math.random().toString(36).slice(2, 8)}-`;

  const panZoom = new PanZoom({
    viewport: () => viewport,
    camera: () => camera,
    oncamera: (kept) => oncamera?.(kept),
    // The strip scrolls itself, and the words of a link being written keep the wheel.
    wheel: (event) => !(event.target as HTMLElement).closest('.strip, .link-field'),
  });
  panZoom.follow();

  /** The heights of the cards as last measured, kept while a card is not drawn. */
  const heights = new SvelteMap<string, number>();
  /** Cards being moved, and by how much, in pixels of the surface; not kept until they are let go. */
  let moving = $state<{ ids: string[]; dx: number; dy: number; overStrip: boolean } | null>(null);
  /** A card being made wider or narrower, and its width now. */
  let widening = $state<{ id: string; width: number } | null>(null);
  /** A link being drawn: from a card to where the pointer is, and the card it is over. */
  let linking = $state<{ from: string; x: number; y: number; over: string | null } | null>(null);
  let band = $state<Bounds | null>(null);
  let selectedLink = $state<string | null>(null);
  /** The link whose words are being written. */
  let labelling = $state<string | null>(null);

  const parted = $derived(partNotes(notebook.list, box));
  const placed = $derived(parted.placed);
  const unplaced = $derived(parted.unplaced);
  const selected = $derived(new Set(selection));
  const movingIds = $derived(new Set(moving?.ids ?? []));

  /** Where a card is shown: where it lies, or where it is being moved to. */
  function shownAt(note: NoteRecord): Point {
    const at = note.at ?? { x: 0, y: 0 };
    return moving && movingIds.has(note.id) ? { x: at.x + moving.dx, y: at.y + moving.dy } : at;
  }

  function shownWidth(note: NoteRecord): number {
    return widening?.id === note.id ? widening.width : (note.width ?? CARD_WIDTH);
  }

  const boxes = $derived<CardBox[]>(
    placed.map((n) => cardBox(n.id, shownAt(n), shownWidth(n), heights.get(n.id))),
  );
  const boxOf = $derived(new Map(boxes.map((b) => [b.id, b])));
  /** The cards drawn: those the view shows and a little round it, and those being moved. */
  const drawn = $derived.by(() => {
    if (!panZoom.width) return new Set<string>();
    const shown = new Set(cardsInView(boxes, panZoom.view, panZoom.width, panZoom.height));
    for (const id of movingIds) shown.add(id);
    return shown;
  });
  const curves = $derived(linksDrawn(notebook.links, boxOf));
  const pending = $derived.by(() => {
    if (!linking) return null;
    const from = boxOf.get(linking.from);
    if (!from) return null;
    return linkBeingDrawn(
      from,
      { x: linking.x, y: linking.y },
      linking.over ? (boxOf.get(linking.over) ?? null) : null,
    );
  });
  const stripShown = $derived(unplaced.length > 0 || !!moving);

  // ---- the view ----

  /** Shows all the cards; where there are none, the middle of the surface. */
  function fit() {
    panZoom.fit(boundsOf(boxes) ?? { left: 0, top: 0, right: 0, bottom: 0 });
  }

  // Where no camera was kept, all is shown the first time the view's size is known.
  let fitted = false;
  $effect(() => {
    if (fitted || !panZoom.width || !panZoom.height) return;
    fitted = true;
    untrack(() => {
      if (!camera) fit();
    });
  });

  // Another box shown on the same surface: where it was left, or all of it.
  let shownBox: string | null = null;
  $effect(() => {
    const now = box;
    untrack(() => {
      if (shownBox === null || shownBox === now) {
        shownBox = now;
        return;
      }
      shownBox = now;
      selectedLink = null;
      labelling = null;
      if (camera && panZoom.width) panZoom.view = centred(camera, panZoom.width, panZoom.height);
      else fit();
    });
  });

  function focus() {
    viewport?.focus({ preventScroll: true });
  }

  function select(ids: string[]) {
    selection = ids;
    if (ids.length) selectedLink = null;
  }

  function clear() {
    selection = [];
    selectedLink = null;
  }

  function overStrip(clientX: number, clientY: number): boolean {
    const r = strip?.getBoundingClientRect();
    return (
      !!r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
    );
  }

  // ---- cards ----

  /** A press on a card: it is selected, and moved with what else is selected. */
  function cardPress(event: PointerEvent, id: string) {
    if (event.button !== 0) return;
    event.stopPropagation();
    focus();
    selectedLink = null;
    const toggled = event.ctrlKey || event.metaKey;
    if (toggled) {
      if (selected.has(id)) {
        select(selection.filter((s) => s !== id));
        return;
      }
      select([...selection, id]);
    } else if (!selected.has(id)) {
      select([id]);
    }
    const ids = placed.filter((n) => n.id === id || selection.includes(n.id)).map((n) => n.id);
    const start = { x: event.clientX, y: event.clientY };
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture?.(event.pointerId);
    let moved = false;
    const onmove = (e: PointerEvent) => {
      const dx = (e.clientX - start.x) / panZoom.view.k;
      const dy = (e.clientY - start.y) / panZoom.view.k;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      moving = { ids, dx, dy, overStrip: overStrip(e.clientX, e.clientY) };
    };
    const onup = () => {
      el.removeEventListener('pointermove', onmove);
      el.removeEventListener('pointerup', onup);
      el.removeEventListener('pointercancel', onup);
      const m = moving;
      moving = null;
      if (!moved || !m) {
        if (!toggled) select([id]);
        return;
      }
      notebook.checkpoint();
      if (m.overStrip) notebook.unplace(m.ids);
      else
        notebook.place(
          m.ids.flatMap((n) => {
            const at = notebook.note(n)?.at;
            return at ? [{ id: n, at: { x: at.x + m.dx, y: at.y + m.dy } }] : [];
          }),
        );
      notebook.checkpoint();
    };
    el.addEventListener('pointermove', onmove);
    el.addEventListener('pointerup', onup);
    el.addEventListener('pointercancel', onup);
  }

  /** The right edge of a card dragged: it is made wider or narrower, and kept when let go. */
  function widen(event: PointerEvent, id: string) {
    if (event.button !== 0) return;
    event.preventDefault();
    focus();
    const note = notebook.note(id);
    if (!note) return;
    const from = shownWidth(note);
    const start = event.clientX;
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture?.(event.pointerId);
    const onmove = (e: PointerEvent) => {
      widening = { id, width: cardWidth(from + (e.clientX - start) / panZoom.view.k) };
    };
    const onup = () => {
      el.removeEventListener('pointermove', onmove);
      el.removeEventListener('pointerup', onup);
      el.removeEventListener('pointercancel', onup);
      const w = widening;
      widening = null;
      if (!w || w.width === from) return;
      notebook.checkpoint();
      notebook.setWidth(id, w.width);
      notebook.checkpoint();
    };
    el.addEventListener('pointermove', onmove);
    el.addEventListener('pointerup', onup);
    el.addEventListener('pointercancel', onup);
  }

  // ---- links ----

  /** The handle of a card dragged: a link is drawn to the card it is let go over. */
  function linkStart(event: PointerEvent, from: string) {
    if (event.button !== 0) return;
    event.preventDefault();
    focus();
    const w = panZoom.toWorld(event.clientX, event.clientY);
    linking = { from, x: w.x, y: w.y, over: null };
    const move = (e: PointerEvent) => {
      const p = panZoom.toWorld(e.clientX, e.clientY);
      linking = { from, x: p.x, y: p.y, over: cardAt(p, boxes, from) };
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      const l = linking;
      linking = null;
      if (!l?.over) return;
      notebook.checkpoint();
      const id = notebook.addLink(from, l.over);
      notebook.checkpoint();
      if (id) {
        selection = [];
        selectedLink = id;
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function selectLink(id: string) {
    focus();
    selection = [];
    selectedLink = id;
  }

  function writeLink(id: string) {
    selectedLink = id;
    labelling = id;
  }

  function linkWritten(value: string) {
    if (!labelling) return;
    notebook.checkpoint();
    notebook.setLinkLabel(labelling, value);
    notebook.checkpoint();
    labelling = null;
    focus();
  }

  function linkMenu(id: string): MenuItem[] {
    const link = notebook.links.find((l) => l.id === id);
    if (!link) return [];
    selectLink(id);
    return associationMenu(notebookLinkHolder(notebook), link, { write: () => writeLink(id) });
  }

  // ---- the ground ----

  function groundPress(event: PointerEvent) {
    if (event.button !== 0 && event.button !== 1) return;
    if (
      (event.target as Element).closest(
        '.card, .strip, .controls, .link-label, .link-field, g.association',
      )
    )
      return;
    focus();
    // With Shift, a band selects what it touches; else the ground is
    // dragged. A press that does not move selects nothing.
    if (event.shiftKey && event.button === 0) drawBand(event);
    else panZoom.pan(event, (moved) => !moved && clear());
  }

  function drawBand(event: PointerEvent) {
    const start = panZoom.toWorld(event.clientX, event.clientY);
    const base = selection.slice();
    followPointer(
      event,
      (e) => {
        band = bandOf(start, panZoom.toWorld(e.clientX, e.clientY));
        select([...new Set([...base, ...touching(band, boxes)])]);
      },
      (moved) => {
        band = null;
        if (!moved) clear();
      },
    );
  }

  /** A new note of this box, put at a point of the surface, opened to be written. */
  function newNoteAt(at: Point) {
    notebook.checkpoint();
    const id = notebook.addNote({ box, at });
    notebook.checkpoint();
    select([id]);
    onopen(id);
  }

  function oncontextmenu(event: MouseEvent) {
    event.preventDefault();
    const target = event.target as Element;
    const link = target.closest<HTMLElement | SVGElement>('[data-link]');
    if (link?.dataset.link) {
      openContextMenu(event, linkMenu(link.dataset.link));
      return;
    }
    const card = target.closest<HTMLElement>('[data-card], [data-unplaced]');
    const id = card?.dataset.card ?? card?.dataset.unplaced;
    if (id) {
      const ids = selected.has(id) ? selection : [id];
      select(ids);
      oncontext(event, ids);
      return;
    }
    if (target.closest('.strip, .controls, .link-field')) return;
    const at = panZoom.toWorld(event.clientX, event.clientY);
    openContextMenu(event, [
      { label: t('notebook-surface-new-note-here'), icon: Plus, action: () => newNoteAt(at) },
      { kind: 'separator' },
      { label: t('notebook-surface-show-all'), shortcut: keysFor('diagram-whole'), action: fit },
    ]);
  }

  // ---- what is dropped ----

  async function filesDropped(paths: string[], at: Point) {
    notebook.checkpoint();
    const ids = await takeFiles(notebook, paths, box);
    if (!ids.length) return;
    const places = stacked(at, ids.length);
    notebook.place(ids.map((id, i) => ({ id, at: places[i] })));
    notebook.checkpoint();
    select(ids);
  }

  function ondrop(event: DropEvent) {
    const at = panZoom.toWorld(event.x, event.y);
    if (event.payload.kind === 'files') {
      void filesDropped(event.payload.data as string[], at);
      return;
    }
    const id = unplacedOf(event.payload, notebook);
    if (!id || overStrip(event.x, event.y)) return;
    notebook.checkpoint();
    notebook.place([{ id, at: letGoAt(at) }]);
    notebook.checkpoint();
    select([id]);
    focus();
  }

  // ---- keys ----

  const ARROWS: Record<string, Direction> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
  };

  /** The card the selection goes to with an arrow: the nearest that way, or the nearest the middle of the view. */
  function arrowed(direction: Direction): string | null {
    const last = [...selection].reverse().find((id) => boxOf.has(id));
    const from = last ? boxOf.get(last) : undefined;
    if (from) return nearest(boxes, from, direction);
    const middle = panZoom.toWorld(
      (viewport?.getBoundingClientRect().left ?? 0) + panZoom.width / 2,
      (viewport?.getBoundingClientRect().top ?? 0) + panZoom.height / 2,
    );
    return nearestTo(middle, boxes);
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.target !== viewport) return;
    const mod = event.ctrlKey || event.metaKey;
    if (mod && !event.altKey) {
      const key = keyOf(event);
      if (key === 'a') select(placed.map((n) => n.id));
      else if (key === '0') fit();
      else if (key === '=' || key === '+') panZoom.zoomBy(1.2);
      else if (key === '-') panZoom.zoomBy(1 / 1.2);
      else return;
      event.preventDefault();
      return;
    }
    if (mod || event.altKey) return;
    if (event.key in ARROWS && !event.shiftKey) {
      const next = arrowed(ARROWS[event.key]);
      if (next) {
        select([next]);
        const b = boxOf.get(next);
        if (b) panZoom.bring(b);
      }
    } else if (event.key === 'Enter') {
      if (selectedLink && !selection.length) writeLink(selectedLink);
      else {
        const last = selection[selection.length - 1];
        if (!last) return;
        onopen(last);
      }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selectedLink) {
        const id = selectedLink;
        selectedLink = null;
        notebookLinkHolder(notebook).change(() => notebook.removeLink(id));
      } else if (selection.length) ondelete(selection.slice());
      else return;
    } else if (event.key === 'Escape') {
      if (!selection.length && !selectedLink) return;
      clear();
    } else return;
    event.preventDefault();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  bind:this={viewport}
  class="surface"
  class:panning={panZoom.panning}
  class:linking={!!linking}
  role="listbox"
  aria-multiselectable="true"
  aria-label={t('notebook-surface')}
  aria-activedescendant={selection.length ? domPrefix + selection[selection.length - 1] : undefined}
  tabindex="0"
  data-surface
  data-box={box}
  use:dropTarget={{
    accepts: (p) => p.kind === 'files' || unplacedOf(p, notebook) !== null,
    ondrop,
  }}
  onpointerdown={groundPress}
  {onkeydown}
  {oncontextmenu}
>
  <div class="world" style:transform={panZoom.transform}>
    <svg class="lines" aria-hidden="true">
      <AssociationCurves
        associations={curves}
        selected={selectedLink}
        {pending}
        onselect={selectLink}
        onwrite={writeLink}
      />
      {#if band}
        <rect
          class="band"
          x={band.left}
          y={band.top}
          width={band.right - band.left}
          height={band.bottom - band.top}
        />
      {/if}
    </svg>

    <AssociationLabels
      associations={curves}
      selected={selectedLink}
      writing={labelling}
      onselect={selectLink}
      onwrite={writeLink}
      ondone={linkWritten}
      oncancel={() => {
        labelling = null;
        focus();
      }}
    />

    {#each placed as note (note.id)}
      {#if drawn.has(note.id)}
        <SurfaceCard
          {notebook}
          {note}
          at={shownAt(note)}
          width={shownWidth(note)}
          selected={selected.has(note.id)}
          target={linking?.over === note.id}
          moving={movingIds.has(note.id)}
          domId={domPrefix + note.id}
          onsize={(id, h) => {
            if (heights.get(id) !== h) heights.set(id, h);
          }}
          onpress={cardPress}
          {onopen}
          onwiden={widen}
          onlinkstart={linkStart}
        />
      {/if}
    {/each}
  </div>

  {#if stripShown}
    <Strip
      bind:element={strip}
      {notebook}
      notes={unplaced}
      {selection}
      taking={!!moving?.overStrip}
      {domPrefix}
      onpress={(event, id) => {
        focus();
        selectedLink = null;
        if (event.ctrlKey || event.metaKey)
          select(selected.has(id) ? selection.filter((s) => s !== id) : [...selection, id]);
        else select([id]);
      }}
      {onopen}
    />
  {/if}

  <ZoomControls view={panZoom} onfit={fit} fitLabel={t('notebook-surface-show-all')} />
</div>

<style>
  .surface {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 0;
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
  .surface.panning {
    cursor: grabbing;
  }
  .surface.linking,
  .surface.linking :global(.card) {
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
  .band {
    fill: var(--selection);
    stroke: var(--accent);
    stroke-width: 1;
  }
</style>
