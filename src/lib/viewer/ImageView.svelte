<script lang="ts">
  /**
   * An image of the library's files in a side
   * (ADR 0069): as one page in the middle of the side, fitted to it, the
   * whole of it seen, or at a factor of its size; zoomed with the typesetting pane's keys and Ctrl
   * and the wheel, about the pointer, which stays over the same place of
   * the image.
   */
  import { flushSync, onMount } from 'svelte';
  import { fileRead } from '$lib/api/system';
  import { t } from '$lib/i18n';
  import { clampZoom, FILE, rung, wheeled } from '$lib/preview/zoom';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { AROUND } from './pages';
  import type { ImageSource } from './viewers.svelte';

  interface Props {
    /** Where the image is read from: the path of its file in the library. */
    source: ImageSource;
    /** Its size, in its pixels. */
    size: [number, number];
    name: string;
    zoom: number | null;
    onzoom: (zoom: number | null) => void;
  }

  let { source, size, name, zoom, onzoom }: Props = $props();

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
  /** The factor at which the whole image is seen, no larger than itself: as small as a large image needs. */
  const fit = $derived(
    Math.max(
      0.001,
      Math.min(
        1,
        (roomWidth - 2 * AROUND.side) / Math.max(w, 1),
        (roomHeight - 2 * AROUND.top) / Math.max(h, 1),
      ),
    ),
  );
  /** The range of a file, reaching down to the fit where that is smaller. */
  const range = $derived({ ...FILE, least: Math.min(FILE.least, fit) });
  const factor = $derived(zoom ?? fit);

  /** Zooms by rungs of the ladder, about the middle of the view. */
  const zoomBy = (steps: number) => zoomAt(rung(factor, steps, range));

  /**
   * Zooms to a factor, or with none to the fit, about a point of the view,
   * which stays over the same place of the image: the pointer under the
   * wheel, or the middle of the view from the keys, the menu and the field.
   */
  function zoomAt(next: number | null, px?: number, py?: number) {
    const el = scroller;
    const to = next === null ? null : clampZoom(next, range);
    if (!el || to === zoom) return;
    const img = el.querySelector('img');
    const x = px ?? el.clientWidth / 2;
    const y = py ?? el.clientHeight / 2;
    const fx = img ? (el.scrollLeft + x - img.offsetLeft) / Math.max(1, img.offsetWidth) : 0.5;
    const fy = img ? (el.scrollTop + y - img.offsetTop) / Math.max(1, img.offsetHeight) : 0.5;
    onzoom(to);
    // Drawn at once, before the next turn of the wheel can read a half-moved view.
    flushSync();
    if (!img) return;
    el.scrollLeft = img.offsetLeft + fx * img.offsetWidth - x;
    el.scrollTop = img.offsetTop + fy * img.offsetHeight - y;
  }

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
      zoomAt(
        wheeled(factor, event.deltaY, event.deltaMode, range),
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
      'preview-zoom-fit': { run: () => zoomAt(null), when: here },
    });
    return () => {
      observer.disconnect();
      el.removeEventListener('wheel', onwheel);
      unbind();
    };
  });

  /** For the bar: zoom to a factor or to the fit, about the middle of the view. */
  export function zoomed(next: number | null) {
    zoomAt(next);
  }
  export function percent(): number {
    return Math.round(factor * 100);
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
  data-viewer-image
>
  {#if url}
    <img src={url} alt={name} style:width="{w * factor}px" style:height="{h * factor}px" />
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
  img {
    display: block;
    flex: none;
    margin: auto;
    max-width: none;
    background: #fff;
    box-shadow: var(--shadow-1);
  }
  .failed {
    margin: auto;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
