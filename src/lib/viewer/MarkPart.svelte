<script lang="ts">
  /**
   * A part of a page marked with the pointer, to go to the notebook (the
   * plan of the notebook, stage 3): laid over what holds the pages of a PDF,
   * or over the frame of an image, it shows a crosshair; a rectangle is
   * drawn by pressing on a page and dragging, kept within that page, the
   * rest of the page shaded faintly. Let go, the part is given as the
   * rectangle in the pixels of the page's canvas, as they are drawn. A press
   * beside every page, or a rectangle too small to see, is nothing. Escape
   * gives it up; so does the button that began it, by its owner.
   */
  import { onMount } from 'svelte';
  import { t } from '$lib/i18n';
  import { markedRect, type PixelRect, type Point } from '$lib/notebook/from-file';

  interface Props {
    /** A part marked: the canvas of its page, the rectangle in its pixels, and the page, counted from one. */
    onmarked: (part: { canvas: HTMLCanvasElement; rect: PixelRect; page: number }) => void;
    oncancel: () => void;
  }

  let { onmarked, oncancel }: Props = $props();

  /** The least a rectangle is drawn, in pixels of the screen, each way. */
  const LEAST = 4;

  let layer = $state<HTMLDivElement>();

  interface Drag {
    canvas: HTMLCanvasElement;
    page: number;
    /** Where the page's canvas lies, within the layer. */
    area: { left: number; top: number; width: number; height: number };
    /** Where the press began and where the pointer is, within the area. */
    from: Point;
    to: Point;
  }
  let drag = $state<Drag | null>(null);

  /** The canvas of the page under a point of the screen, and its page; none beside every page. */
  function canvasAt(x: number, y: number): { canvas: HTMLCanvasElement; page: number } | null {
    const host = layer?.parentElement;
    if (!host) return null;
    for (const canvas of host.querySelectorAll('canvas')) {
      const r = canvas.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        const page = Number(canvas.closest<HTMLElement>('[data-page]')?.dataset.page);
        return { canvas, page: Number.isInteger(page) && page > 0 ? page : 1 };
      }
    }
    return null;
  }

  /** A point of the screen within the area of the drag, kept within it. */
  function within(d: Drag, x: number, y: number): Point {
    const box = layer!.getBoundingClientRect();
    return {
      x: Math.min(Math.max(x - box.left - d.area.left, 0), d.area.width),
      y: Math.min(Math.max(y - box.top - d.area.top, 0), d.area.height),
    };
  }

  function onpointerdown(event: PointerEvent) {
    if (event.button !== 0 || !layer) return;
    // Neither a selection of the words under it, nor a drag of anything.
    event.preventDefault();
    const found = canvasAt(event.clientX, event.clientY);
    if (!found) return;
    const box = layer.getBoundingClientRect();
    const r = found.canvas.getBoundingClientRect();
    const area = {
      left: r.left - box.left,
      top: r.top - box.top,
      width: r.width,
      height: r.height,
    };
    const at = { x: event.clientX - r.left, y: event.clientY - r.top };
    drag = { ...found, area, from: at, to: at };
    layer.setPointerCapture(event.pointerId);
  }

  function onpointermove(event: PointerEvent) {
    if (drag) drag.to = within(drag, event.clientX, event.clientY);
  }

  function onpointerup(event: PointerEvent) {
    const d = drag;
    drag = null;
    if (!d) return;
    const to = within(d, event.clientX, event.clientY);
    if (Math.abs(to.x - d.from.x) < LEAST || Math.abs(to.y - d.from.y) < LEAST) return;
    const rect = markedRect(
      d.from,
      to,
      { width: d.area.width, height: d.area.height },
      { width: d.canvas.width, height: d.canvas.height },
    );
    if (rect) onmarked({ canvas: d.canvas, rect, page: d.page });
  }

  // Escape gives the marking up, before what the view does with it: the
  // reader of the files would go back to their list.
  onMount(() => {
    const onkey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (document.querySelector('dialog[open], .menu')) return;
      event.preventDefault();
      event.stopPropagation();
      drag = null;
      oncancel();
    };
    window.addEventListener('keydown', onkey, true);
    return () => window.removeEventListener('keydown', onkey, true);
  });

  /** The rectangle drawn, within its area. */
  const shown = $derived.by(() => {
    if (!drag) return null;
    const { from, to } = drag;
    return {
      left: Math.min(from.x, to.x),
      top: Math.min(from.y, to.y),
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y),
    };
  });
</script>

<div
  bind:this={layer}
  class="mark"
  role="application"
  aria-label={t('viewer-mark-part')}
  data-mark-part
  {onpointerdown}
  {onpointermove}
  {onpointerup}
  onpointercancel={() => (drag = null)}
>
  {#if drag && shown}
    <!-- The page marked on, the rest of it shaded around the rectangle. -->
    <div
      class="area"
      style:left="{drag.area.left}px"
      style:top="{drag.area.top}px"
      style:width="{drag.area.width}px"
      style:height="{drag.area.height}px"
    >
      <div
        class="part"
        data-mark-rect
        style:left="{shown.left}px"
        style:top="{shown.top}px"
        style:width="{shown.width}px"
        style:height="{shown.height}px"
      ></div>
    </div>
  {/if}
</div>

<style>
  .mark {
    position: absolute;
    inset: 0;
    z-index: 2;
    cursor: crosshair;
    touch-action: none;
    user-select: none;
  }
  .area {
    position: absolute;
    overflow: hidden;
    pointer-events: none;
  }
  /* The rest of the page shaded by the rectangle's own shadow, cut off at the page's edge. */
  .part {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid var(--accent);
    box-shadow: 0 0 0 100000px rgb(0 0 0 / 0.22);
  }
</style>
