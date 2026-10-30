<script lang="ts">
  /**
   * An image of the library's files in a side
   * (ADR 0069): as one page in the middle of the side, fitted to it, the
   * whole of it seen, or at a factor of its size; zoomed with the typesetting pane's keys and Ctrl
   * and the wheel, about the pointer, which stays over the same place of
   * the image. While the wheel turns, the image is shown scaled as it is, a
   * transform and nothing laid out anew; once the zoom rests it is laid out
   * at the new size (addendum of 2026-10-31). Its pixels are held in a
   * canvas, a drawing (SVG) alone shown as an image, so that it stays sharp.
   * While it is edited (ADR 0071), it is shown turned, flipped
   * and coloured as the edit says, from a lighter copy, with what is drawn
   * over it (the crop) the size of the frame that shows.
   */
  import { flushSync, onDestroy, onMount, type Snippet } from 'svelte';
  import type { Edit } from '$lib/api/files';
  import { fileRead } from '$lib/api/system';
  import { t } from '$lib/i18n';
  import { clampZoom, FILE, rung, wheeled } from '$lib/preview/zoom';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { cssFilter, cssTransform, shownSize } from './editing';
  import { AROUND, boxTransform, REST, STILL, turned, under, type Gesture } from './pages';
  import { picture } from './picture';
  import type { ImageSource } from './viewers.svelte';

  interface Props {
    /** Where the image is read from: the path of its file in the library. */
    source: ImageSource;
    /** Its size, in its pixels. */
    size: [number, number];
    name: string;
    zoom: number | null;
    onzoom: (zoom: number | null) => void;
    /** The edit shown over the image, while it is edited. */
    edit?: Edit | null;
    /** What is shown in place of the file while it is edited: a lighter copy, upright. */
    previewUrl?: string | null;
    /** Drawn over the image, the size of the frame that shows. */
    children?: Snippet;
  }

  let {
    source,
    size,
    name,
    zoom,
    onzoom,
    edit = null,
    previewUrl = null,
    children,
  }: Props = $props();

  let url = $state<string | null>(null);
  let failed = $state<string | null>(null);
  let scroller = $state<HTMLDivElement>();
  let roomWidth = $state(0);
  let roomHeight = $state(0);
  let pointerIn = $state(false);

  $effect(() => {
    const from = source;
    let made: string | null = null;
    let gone = false;
    // A drawing is shown only where it is said to be one; other images are known by what they hold.
    const type = from.path.toLowerCase().endsWith('.svg') ? { type: 'image/svg+xml' } : {};
    fileRead(from.path)
      .then((b) => {
        if (gone) return;
        made = URL.createObjectURL(new Blob([b as BlobPart], type));
        url = made;
      })
      .catch((e) => (failed = (e as { message?: string })?.message ?? String(e)));
    return () => {
      gone = true;
      if (made) URL.revokeObjectURL(made);
    };
  });

  const [w, h] = $derived(size);
  /** The frame that shows: the image's size, turned as the edit says. */
  const [fw, fh] = $derived(edit ? shownSize(edit, w, h) : [w, h]);
  const shown = $derived(previewUrl ?? url);
  /** A drawing is shown as an image, which stays sharp at any zoom; an image with pixels in a canvas. */
  const drawing = $derived(source.path.toLowerCase().endsWith('.svg'));
  /** The factor at which the whole image is seen, no larger than itself: as small as a large image needs. */
  const fit = $derived(
    Math.max(
      0.001,
      Math.min(
        1,
        (roomWidth - 2 * AROUND.side) / Math.max(fw, 1),
        (roomHeight - 2 * AROUND.top) / Math.max(fh, 1),
      ),
    ),
  );
  /** The range of a file, reaching down to the fit where that is smaller. */
  const range = $derived({ ...FILE, least: Math.min(FILE.least, fit) });
  const factor = $derived(zoom ?? fit);
  const factorOf = (z: number | null) => z ?? fit;

  /**
   * The zoom in progress, while the wheel turns or the keys are pressed: the
   * transform of the view, the point it was last turned about, and the zoom
   * reached, which the image is laid out at once it rests.
   */
  let gesture = $state<(Gesture & { at: [number, number]; zoom: number | null }) | null>(null);
  let commitTimer: ReturnType<typeof setTimeout> | undefined;
  /** The frame as laid out: its corner in the view, for the transform of a zoom in progress. */
  let boxAt = $state<[number, number]>([0, 0]);
  let box = $state<HTMLDivElement>();
  const reached = () => (gesture ? gesture.zoom : zoom);

  /** Zooms by rungs of the ladder, about the middle of the view. */
  const zoomBy = (steps: number) => zoomAt(rung(factorOf(reached()), steps, range));

  /**
   * Zooms to a factor, or with none to the fit, about a point of the view,
   * which stays over the same place of the image: the pointer under the
   * wheel, or the middle of the view from the keys, the menu and the field.
   * Nothing is laid out anew at once: the image is shown scaled by a
   * transform, and laid out anew once the zoom has rested a quarter of a
   * second (`commit`), or at once where asked.
   */
  function zoomAt(next: number | null, px?: number, py?: number, atOnce = false) {
    const el = scroller;
    if (!el) return;
    const to = next === null ? null : clampZoom(next, range);
    const current = reached();
    if (to === current) return;
    const q: [number, number] = [px ?? el.clientWidth / 2, py ?? el.clientHeight / 2];
    if (!gesture && box) boxAt = [box.offsetLeft - el.scrollLeft, box.offsetTop - el.scrollTop];
    const ratio = factorOf(to) / factorOf(current);
    gesture = { ...turned(gesture ?? STILL, ratio, q), at: q, zoom: to };
    clearTimeout(commitTimer);
    if (atOnce) commit();
    else commitTimer = setTimeout(commit, REST);
  }

  /**
   * Ends the zoom in progress: the image is laid out at the zoom it reached,
   * and the view scrolled so that what lay under the pointer stays there, in
   * one drawing, with the transform taken off.
   */
  function commit() {
    clearTimeout(commitTimer);
    const g = gesture;
    const el = scroller;
    if (!g || !el) return;
    const q = g.at;
    const p = under(g, q);
    const frame = box;
    const fx = frame
      ? (el.scrollLeft + p[0] - frame.offsetLeft) / Math.max(1, frame.offsetWidth)
      : 0.5;
    const fy = frame
      ? (el.scrollTop + p[1] - frame.offsetTop) / Math.max(1, frame.offsetHeight)
      : 0.5;
    gesture = null;
    onzoom(g.zoom);
    flushSync();
    if (!frame) return;
    el.scrollLeft = frame.offsetLeft + fx * frame.offsetWidth - q[0];
    el.scrollTop = frame.offsetTop + fy * frame.offsetHeight - q[1];
  }

  onDestroy(() => {
    clearTimeout(commitTimer);
    // A zoom in progress is kept as its zoom.
    if (gesture) onzoom(gesture.zoom);
  });

  onMount(() => {
    const el = scroller;
    if (!el) return;
    const measure = () => {
      roomWidth = el.clientWidth;
      roomHeight = el.clientHeight;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    const onwheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.deltaY) return;
      event.preventDefault();
      const box = el.getBoundingClientRect();
      // From the zoom reached so far, so that each turn of a burst counts.
      zoomAt(
        wheeled(factorOf(reached()), event.deltaY, event.deltaMode, range),
        event.clientX - box.left,
        event.clientY - box.top,
      );
    };
    el.addEventListener('wheel', onwheel, { passive: false });
    const here = () => pointerIn || el.contains(document.activeElement);
    const unbind = shortcuts.bind({
      'preview-zoom-in': { run: () => zoomBy(1), when: here },
      'preview-zoom-in-equal': { run: () => zoomBy(1), when: here },
      'preview-zoom-out': { run: () => zoomBy(-1), when: here },
      'preview-zoom-fit': { run: () => zoomAt(null, undefined, undefined, true), when: here },
    });
    return () => {
      observer.disconnect();
      el.removeEventListener('wheel', onwheel);
      unbind();
    };
  });

  /** For the bar: zoom to a factor or to the fit, about the middle of the view, at once. */
  export function zoomed(next: number | null) {
    zoomAt(next, undefined, undefined, true);
  }
  export function percent(): number {
    return Math.round((gesture ? factorOf(gesture.zoom) : factor) * 100);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="scroller"
  bind:this={scroller}
  tabindex="0"
  role="img"
  aria-label={name}
  onpointerenter={() => (pointerIn = true)}
  onpointerleave={() => (pointerIn = false)}
  onscroll={() => gesture && commit()}
  data-viewer-image
  data-viewer-editing={edit ? '' : undefined}
>
  {#if shown}
    <!-- While a zoom is in progress, the frame is shown where the gesture shows it, about its own corner, as a layer of its own. -->
    <div
      class="box"
      class:zooming={!!gesture}
      bind:this={box}
      style:width="{fw * factor}px"
      style:height="{fh * factor}px"
      style:transform={gesture ? boxTransform(gesture, boxAt) : undefined}
    >
      {#if drawing}
        <img
          src={shown}
          alt={name}
          style:width="{w * factor}px"
          style:height="{h * factor}px"
          style:transform={edit ? cssTransform(edit) || null : null}
          style:filter={edit ? cssFilter(edit) || null : null}
          draggable="false"
        />
      {:else}
        <canvas
          use:picture={shown}
          aria-label={name}
          style:width="{w * factor}px"
          style:height="{h * factor}px"
          style:transform={edit ? cssTransform(edit) || null : null}
          style:filter={edit ? cssFilter(edit) || null : null}
        ></canvas>
      {/if}
      {@render children?.()}
    </div>
  {:else if failed}
    <p class="failed">{t('viewer-not-drawn', { why: failed })}</p>
  {/if}
</div>

<style>
  /* The image in the middle of the view while it is smaller, scrolled from its top left corner once larger. */
  .scroller {
    position: relative;
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: auto;
    overflow-anchor: none;
    padding: 16px 18px;
    background: var(--canvas);
    outline: none;
  }
  /* The frame that shows, in the middle; the image turned about its middle within it. */
  .box {
    position: relative;
    flex: none;
    margin: auto;
    background: #fff;
    /* A line and a drop without blur: a blurred shadow is painted anew at
       every step of the scrolling, which made it lag (ADR 0072). */
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.08),
      0 2px 0 rgba(0, 0, 0, 0.05);
  }
  .box.zooming {
    transform-origin: 0 0;
    will-change: transform;
  }
  img,
  canvas {
    position: absolute;
    left: 50%;
    top: 50%;
    display: block;
    max-width: none;
    translate: -50% -50%;
    transform-origin: center;
    user-select: none;
  }
  .failed {
    margin: auto;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
