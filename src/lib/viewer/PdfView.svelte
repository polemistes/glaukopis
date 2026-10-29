<script lang="ts">
  /**
   * The pages of a PDF of the library in a side (ADR 0069), one under
   * another, scrolled. Each is drawn by the core at exactly the width it is
   * shown and comes as the bytes of a PNG, one page to a call, the nearest
   * to the view first, a few at a time (ADR 0072); the pictures of forty are
   * kept, and only those in view and beside them stand in the document. The
   * page in view is the one at the middle of the side.
   * Turned with PageDown, PageUp, Home and End; zoomed with the typesetting
   * pane's keys, and Ctrl and the wheel, about the pointer, which stays over
   * the same place of the same page.
   */
  import { flushSync, onDestroy, onMount, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { isNotFound } from '$lib/api/backend';
  import { ocrStop } from '$lib/api/ocr';
  import { filePage, type FileFacts } from '$lib/api/viewer';
  import { t } from '$lib/i18n';
  import { clampZoom, FILE, PX_PER_PT, rung, wheeled } from '$lib/preview/zoom';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { newId } from '$lib/util/id';
  import {
    AROUND,
    columnWidth,
    heightOf,
    IN_FLIGHT,
    lacking,
    pageAt,
    pageLeft,
    pagesSeen,
    placeAt,
    placePages,
    toLetGo,
    wanted,
    widthWanted,
    type Place,
  } from './pages';
  import PageText from './PageText.svelte';

  interface Props {
    file: string;
    facts: FileFacts;
    /** The page in view, counted from one. */
    page: number;
    /** A factor of the size on paper, or none for the width of the side. */
    zoom: number | null;
    onpage: (page: number) => void;
    onzoom: (zoom: number | null) => void;
  }

  let { file, facts, page, zoom, onpage, onzoom }: Props = $props();

  let scroller = $state<HTMLDivElement>();
  let roomWidth = $state(0);
  let roomHeight = $state(0);
  let scrolled = $state(0);
  /** Whether the pointer is over the pages: the keys of zoom are theirs then. */
  let pointerIn = $state(false);

  /** How wide a page is shown: at the zoom, or fitted to the side, never wider than the room allows at fit. */
  const placed = $derived(
    placePages(facts.sizes, (w) =>
      zoom === null ? Math.max(120, roomWidth - 2 * AROUND.side) : Math.round(w * PX_PER_PT * zoom),
    ),
  );
  /** The width of the column, that of the widest page. */
  const column = $derived(columnWidth(placed));
  /** Whether the zoom has rested: the pages are drawn anew only then, not at each turn of the wheel. */
  let resting = $state(true);
  let rest: ReturnType<typeof setTimeout> | undefined;

  /**
   * The pages drawn, by their numbers: the picture as a URL of its own, or
   * why it could not be drawn, and the width it was asked at.
   */
  const drawn = new SvelteMap<
    number,
    { url: string | null; failed: string | null; width: number }
  >();
  /** The pages asked for and not yet come. */
  const asked = new Set<number>();
  /** One ticket for all the view asks, so that all of it stops when the view goes. */
  const ticket = newId();
  let gone = false;

  const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;

  /** The pages in view and beside them: those that stand in the document. */
  const seen = $derived(pagesSeen(placed, scrolled, scrolled + roomHeight));

  // The pages in view, and beside them, are fetched where they are not drawn
  // at the width they are shown, once the zoom has rested: the nearest to the
  // middle first, a few at a time. It depends on where the side is scrolled,
  // how large the pages are shown, and what has come.
  $effect(() => {
    if (!resting || !roomWidth || !roomHeight) return;
    const middle = pageAt(placed, scrolled + roomHeight / 2);
    const want = (n: number) => widthWanted(placed.widths[n - 1], ratio);
    const lack = (n: number) => {
      const has = drawn.get(n);
      return !asked.has(n) && lacking(has && { width: has.width, pictured: !!has.url }, want(n));
    };
    const next = wanted(seen, middle, lack);
    untrack(() => {
      for (const n of next.slice(0, Math.max(0, IN_FLIGHT - asked.size))) void fetchOne(n, want(n));
    });
  });

  async function fetchOne(n: number, width: number) {
    asked.add(n);
    let url: string | null = null;
    let failed: string | null = null;
    try {
      const bytes = await filePage(file, n, width, ticket);
      url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
      // A page drawn before is swapped only once the new picture is decoded, so that it never goes blank.
      if (drawn.get(n)?.url) {
        const picture = new Image();
        picture.src = url;
        await picture.decode().catch(() => {});
      }
    } catch (e) {
      // A file gone from the library is said by the side.
      if (isNotFound(e)) failed = '';
      else failed = e instanceof Error ? e.message : ((e as { message?: string })?.message ?? '');
    } finally {
      asked.delete(n);
    }
    if (gone) {
      if (url) URL.revokeObjectURL(url);
      return;
    }
    const old = drawn.get(n);
    if (url) {
      drawn.set(n, { url, failed: null, width });
      if (old?.url) letGoLater(old.url);
    } else {
      // A page that had a picture keeps it; one that had none says why.
      drawn.set(n, { url: old?.url ?? null, failed: old?.url ? null : failed, width });
    }
    for (const far of toLetGo([...drawn.keys()], page)) {
      const url = drawn.get(far)?.url;
      if (url) URL.revokeObjectURL(url);
      drawn.delete(far);
    }
  }

  /** A picture replaced is let go a moment later, once the page shows the new one. */
  function letGoLater(url: string) {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  onDestroy(() => {
    gone = true;
    clearTimeout(rest);
    void ocrStop(ticket).catch(() => {});
    for (const d of drawn.values()) if (d.url) URL.revokeObjectURL(d.url);
  });

  /** The pages are not drawn anew until the zoom, or the width of the side, has rested a quarter of a second. */
  function unrest() {
    resting = false;
    clearTimeout(rest);
    rest = setTimeout(() => (resting = true), 250);
  }

  // ---- the page in view ----

  /** The page last said to be in view: one given from outside, by the field, is scrolled to. */
  let told = 0;

  function onscroll() {
    if (!scroller) return;
    scrolled = scroller.scrollTop;
    const middle = pageAt(placed, scrolled + roomHeight / 2);
    if (middle !== told) {
      told = middle;
      onpage(middle);
    }
  }

  /** The place at the top edge of the view: the page there, and how far down it. */
  const topPlace = (): Place => placeAt(placed, (scroller?.scrollTop ?? 0) + AROUND.top);

  /** Scrolls to a place, at the top edge of the view. */
  function toPlace(place: Place) {
    if (scroller) scroller.scrollTop = Math.max(0, heightOf(placed, place) - AROUND.top);
  }

  /** Scrolls to a page, its top at the top of the side. */
  function goTo(n: number) {
    const to = Math.min(Math.max(1, n), facts.pages);
    told = to;
    if (to !== page) onpage(to);
    if (scroller) scroller.scrollTop = Math.max(0, placed.tops[to - 1] - AROUND.top);
  }

  // A page asked for from outside (the field, the place) is gone to. It depends on the page alone.
  $effect(() => {
    const n = page;
    untrack(() => {
      if (n !== told && roomHeight) goTo(n);
    });
  });

  // ---- the room, and zooming ----

  onMount(() => {
    const el = scroller;
    if (!el) return;
    // The page the side was left at is gone to once the side has its size;
    // a side made wider or narrower keeps the place at its top, and has its
    // pages drawn anew once it rests, as a zoom has.
    let started = false;
    const measure = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (!width || !height) return;
      const kept = started ? topPlace() : null;
      if (roomWidth && width !== roomWidth) unrest();
      roomWidth = width;
      roomHeight = height;
      flushSync();
      if (!started) {
        started = true;
        goTo(page);
      } else if (kept) {
        toPlace(kept);
        onscroll();
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    const onwheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.deltaY) return;
      event.preventDefault();
      const box = el.getBoundingClientRect();
      zoomAt(
        wheeled(factor, event.deltaY, event.deltaMode),
        event.clientX - box.left,
        event.clientY - box.top,
      );
    };
    el.addEventListener('wheel', onwheel, { passive: false });
    return () => {
      observer.disconnect();
      el.removeEventListener('wheel', onwheel);
    };
  });

  /** The factor the pages are shown at now: at fit, what the width of the side makes it. */
  const factor = $derived(
    zoom ?? (placed.widths[page - 1] ?? 1) / ((facts.sizes[page - 1]?.[0] ?? 1) * PX_PER_PT),
  );

  /** Zooms by rungs of the ladder, about the middle of the view. */
  const zoomBy = (steps: number) => zoomAt(rung(factor, steps));

  /**
   * Zooms to a factor, or with none to the width of the side, about a point
   * of the view, which stays over the same place of the same page: the
   * pointer under the wheel, or the middle of the view from the keys, the
   * menu and the field. The pages are drawn anew once the zoom has rested.
   */
  function zoomAt(next: number | null, px?: number, py?: number) {
    const el = scroller;
    const to = next === null ? null : clampZoom(next, FILE);
    if (!el || to === zoom) return;
    const x = px ?? el.clientWidth / 2;
    const y = py ?? el.clientHeight / 2;
    const before = placed;
    const i = pageAt(before, el.scrollTop + y) - 1;
    const fx = (el.scrollLeft + x - pageLeft(before, i, el.clientWidth)) / before.widths[i];
    const fy = (el.scrollTop + y - before.tops[i]) / before.heights[i];
    unrest();
    onzoom(to);
    // Drawn at once, before the next turn of the wheel can read a half-moved view.
    flushSync();
    const after = placed;
    el.scrollLeft = pageLeft(after, i, el.clientWidth) + fx * after.widths[i] - x;
    el.scrollTop = after.tops[i] + fy * after.heights[i] - y;
    onscroll();
  }

  const here = () => pointerIn || !!scroller?.contains(document.activeElement);

  onMount(() =>
    shortcuts.bind({
      'preview-zoom-in': { run: () => zoomBy(1), when: here },
      'preview-zoom-in-equal': { run: () => zoomBy(1), when: here },
      'preview-zoom-out': { run: () => zoomBy(-1), when: here },
      'preview-zoom-fit': { run: () => zoomAt(null), when: here },
      'viewer-next': { run: () => goTo(page + 1), when: here },
      'viewer-previous': { run: () => goTo(page - 1), when: here },
      'viewer-first': { run: () => goTo(1), when: here },
      'viewer-last': { run: () => goTo(facts.pages), when: here },
    }),
  );

  /** For the bar: zoom to a factor or to the width, about the middle of the view. */
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
  {onscroll}
  onpointerenter={() => (pointerIn = true)}
  onpointerleave={() => (pointerIn = false)}
  tabindex="0"
  role="document"
  aria-label={facts.name}
  data-viewer-pages
>
  <div class="column" style:height="{placed.total}px" style:width="{column}px">
    {#each seen as n (n)}
      {@const i = n - 1}
      {@const d = drawn.get(n)}
      <div
        class="page"
        data-page={n}
        style:top="{placed.tops[i]}px"
        style:width="{placed.widths[i]}px"
        style:height="{placed.heights[i]}px"
      >
        {#if d?.url}
          <img src={d.url} alt="" draggable="false" decoding="async" />
          <PageText {file} page={n} width={placed.widths[i]} />
        {:else if d?.failed}
          <p class="failed">{t('viewer-not-drawn', { why: d.failed })}</p>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .scroller {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: auto;
    overflow-anchor: none;
    background: var(--canvas);
    outline: none;
  }
  .column {
    position: relative;
    margin: 0 auto;
  }
  .page {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    /* A line and a drop without blur: a blurred shadow is painted anew at
       every step of the scrolling, which made it lag (ADR 0072). */
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.08),
      0 2px 0 rgba(0, 0, 0, 0.05);
    container-type: inline-size;
  }
  /* As wide as the page and as high as the picture makes it: drawn as wide as it is shown, it is painted dot for dot. */
  .page img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: auto;
    user-select: none;
    pointer-events: none;
  }
  .failed {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 24px;
    color: var(--ink-3);
    font-size: var(--text-sm);
    text-align: center;
  }
</style>
