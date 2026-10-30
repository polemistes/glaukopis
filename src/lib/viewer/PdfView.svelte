<script lang="ts">
  /**
   * The pages of a PDF of the library in a side (ADR 0069), one under
   * another, scrolled. Each is drawn by the core at exactly the width it is
   * shown and comes as the bytes of a PNG, one page to a call, the nearest
   * to the view first, a few at a time (ADR 0072); the pictures of forty are
   * kept, and only those in view and beside them stand in the document. A
   * page asked for and not yet come shows that it is coming, a moment after
   * it is asked for. The view says now and then that it still shows the
   * file, so that the process that keeps the file open is not ended as idle
   * while a page is read at length. The
   * page in view is the one at the middle of the side; the place is the page
   * at its top edge and how far down it, told a moment after the scrolling
   * rests and when the view goes, so that a tab comes back where it was.
   * Turned with PageDown, PageUp, Home and End; zoomed with the typesetting
   * pane's keys, and Ctrl and the wheel, about the pointer, which stays over
   * the same place of the same page. While the wheel turns, the pages are
   * shown scaled as they are, a transform and nothing laid out anew; once
   * the zoom rests they are laid out at the new size and drawn anew, into
   * canvases that hold their pixels (addendum of 2026-10-31).
   */
  import { flushSync, onDestroy, onMount, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { isNotFound } from '$lib/api/backend';
  import { ocrStop } from '$lib/api/ocr';
  import { fileKeep, filePage, type FileFacts } from '$lib/api/viewer';
  import { t } from '$lib/i18n';
  import { clampZoom, FILE, PX_PER_PT, rung, wheeled } from '$lib/preview/zoom';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { newId } from '$lib/util/id';
  import {
    AROUND,
    boxTransform,
    columnWidth,
    heightOf,
    IN_FLIGHT,
    KEEP_EVERY,
    lacking,
    pageAt,
    pageLeft,
    pagesSeen,
    placeAt,
    placePages,
    REST,
    STILL,
    toLetGo,
    turned,
    under,
    wanted,
    widthWanted,
    type Gesture,
    type Place,
  } from './pages';
  import PageText from './PageText.svelte';
  import { picture } from './picture';

  interface Props {
    file: string;
    facts: FileFacts;
    /** Where the view begins: the page at its top edge, and how far down it. */
    place: Place;
    /** A factor of the size on paper, or none for the width of the side. */
    zoom: number | null;
    /** The tab the view is made for: what it tells of its place is of this tab, even as it goes. */
    tab: string;
    /** Where the view was left, a moment after the scrolling rests, and when it goes. */
    onplace: (tab: string, place: Place) => void;
    /** The page at the middle of the view, as it changes. */
    onmiddle: (page: number) => void;
    onzoom: (zoom: number | null) => void;
  }

  let { file, facts, tab, place, zoom, onplace, onmiddle, onzoom }: Props = $props();
  // What the view tells of its place is of the tab it was made for, even as it goes:
  // the tab is taken once, as the view is made.
  // svelte-ignore state_referenced_locally
  const mine = tab;
  // svelte-ignore state_referenced_locally
  const tellPlace = onplace;
  // svelte-ignore state_referenced_locally
  const startAt: Place = { ...place };
  /** The page at the middle of the view, counted from one. */
  let page = $state(1);

  let scroller = $state<HTMLDivElement>();
  let roomWidth = $state(0);
  let roomHeight = $state(0);
  let scrolled = $state(0);
  /** How far the side is scrolled sideways, for the transform of a zoom in progress. */
  let scrolledX = $state(0);
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
  /** Whether the width of the side has rested: the pages are drawn anew only then, not while it is dragged. */
  let resting = $state(true);
  let rest: ReturnType<typeof setTimeout> | undefined;
  /**
   * The zoom in progress, while the wheel turns or the keys are pressed: the
   * transform of the view, the point of the view it was last turned about,
   * and the zoom it has reached, which the pages are laid out at once it rests.
   */
  let gesture = $state<(Gesture & { at: [number, number]; zoom: number | null }) | null>(null);
  let commitTimer: ReturnType<typeof setTimeout> | undefined;

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

  /** A picture replaced is let go a while later, once its canvas has decoded and drawn the new one. */
  function letGoLater(url: string) {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // The file is kept open while the view shows it: said every so often, since
  // the process that draws the pages is ended after a while without a request.
  onMount(() => {
    const keeping = setInterval(() => void fileKeep(file).catch(() => {}), KEEP_EVERY);
    return () => clearInterval(keeping);
  });

  onDestroy(() => {
    // Where it was left is told as it goes: a tab switched away from keeps its place; a zoom in progress is kept as its zoom.
    if (placeTimer !== undefined) tellNow();
    clearTimeout(commitTimer);
    if (gesture) onzoom(gesture.zoom);
    gone = true;
    clearTimeout(rest);
    void ocrStop(ticket).catch(() => {});
    for (const d of drawn.values()) if (d.url) URL.revokeObjectURL(d.url);
  });

  /** The pages are not drawn anew until the width of the side has rested a quarter of a second. */
  function unrest() {
    resting = false;
    clearTimeout(rest);
    rest = setTimeout(() => (resting = true), REST);
  }

  // ---- the page in view ----

  let placeTimer: ReturnType<typeof setTimeout> | undefined;
  /** The place at the top edge, as the view was last scrolled. */
  let lastPlace: Place | null = null;
  /** Whether the view has its size and stands at its place: before that, nothing is told. */
  let started = false;

  /** The page last gone to by the bar, the keys or a bookmark: said while it is in view. */
  let askedPage = 0;

  function onscroll() {
    if (!scroller || !started) return;
    // A scroll while a zoom is in progress ends it first: the pages are laid out as the zoom reached.
    if (gesture) {
      commit();
      return;
    }
    scrolled = scroller.scrollTop;
    scrolledX = scroller.scrollLeft;
    lastPlace = placeAt(placed, scrolled + AROUND.top);
    const bottom = scrolled + roomHeight;
    const inView = (n: number) =>
      n > 0 && placed.tops[n - 1] < bottom && placed.tops[n - 1] + placed.heights[n - 1] > scrolled;
    // The page at the middle; at the end of the file, the last in view.
    let middle = pageAt(placed, scrolled + roomHeight / 2);
    if (scrolled + scroller.clientHeight >= scroller.scrollHeight - 2)
      middle = pageAt(placed, bottom - 1);
    if (askedPage && inView(askedPage)) middle = askedPage;
    else askedPage = 0;
    if (middle !== page) {
      page = middle;
      onmiddle(middle);
    }
    clearTimeout(placeTimer);
    placeTimer = setTimeout(tellNow, 150);
  }

  /** Tells where the view stands. */
  function tellNow() {
    clearTimeout(placeTimer);
    placeTimer = undefined;
    if (!lastPlace) return;
    tellPlace(mine, { page: lastPlace.page, at: Math.round(lastPlace.at * 10000) / 10000 });
  }

  /** The place at the top edge of the view: the page there, and how far down it. */
  const topPlace = (): Place => placeAt(placed, (scroller?.scrollTop ?? 0) + AROUND.top);

  /** Scrolls to a place, at the top edge of the view. */
  function toPlace(place: Place) {
    if (scroller) scroller.scrollTop = Math.max(0, heightOf(placed, place) - AROUND.top);
  }

  /** Scrolls to a page, its top at the top of the side. */
  function goTo(n: number) {
    goToPlace({ page: Math.min(Math.max(1, n), facts.pages), at: 0 });
  }

  // ---- the room, and zooming ----

  onMount(() => {
    const el = scroller;
    if (!el) return;
    // The page the side was left at is gone to once the side has its size;
    // a side made wider or narrower keeps the place at its top, and has its
    // pages drawn anew once it rests, as a zoom has.
    const measure = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (!width || !height) return;
      if (gesture) commit();
      const kept = started ? topPlace() : null;
      if (roomWidth && width !== roomWidth) unrest();
      roomWidth = width;
      roomHeight = height;
      flushSync();
      if (!started) {
        started = true;
        toPlace(startAt);
        onscroll();
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
      // From the zoom reached so far, so that each turn of a burst counts.
      zoomAt(
        wheeled(factorOf(reached()), event.deltaY, event.deltaMode),
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

  /** The factor the pages are shown at now, as laid out: at fit, what the width of the side makes it. */
  const factor = $derived(
    zoom ?? (placed.widths[page - 1] ?? 1) / ((facts.sizes[page - 1]?.[0] ?? 1) * PX_PER_PT),
  );
  /** The factor the page in view would have fitted to the width of the side. */
  const fitFactor = $derived(
    Math.max(120, roomWidth - 2 * AROUND.side) / ((facts.sizes[page - 1]?.[0] ?? 1) * PX_PER_PT),
  );
  /** The factor a zoom means: the fit, for none. */
  const factorOf = (z: number | null) => z ?? fitFactor;
  /** The zoom reached: that of the zoom in progress, else the one the pages are laid out at. */
  const reached = () => (gesture ? gesture.zoom : zoom);

  /** Zooms by rungs of the ladder, about the middle of the view. */
  const zoomBy = (steps: number) => zoomAt(rung(factorOf(reached()), steps));

  /**
   * Zooms to a factor, or with none to the width of the side, about a point
   * of the view, which stays over the same place of the same page: the
   * pointer under the wheel, or the middle of the view from the keys, the
   * menu and the field. Nothing is laid out anew at once: the pages are
   * shown scaled by a transform, and laid out and drawn anew once the zoom
   * has rested a quarter of a second (`commit`), or at once where asked.
   */
  function zoomAt(next: number | null, px?: number, py?: number, atOnce = false) {
    const el = scroller;
    if (!el) return;
    const to = next === null ? null : clampZoom(next, FILE);
    const current = reached();
    if (to === current) return;
    const q: [number, number] = [px ?? el.clientWidth / 2, py ?? el.clientHeight / 2];
    const ratio = factorOf(to) / factorOf(current);
    gesture = { ...turned(gesture ?? STILL, ratio, q), at: q, zoom: to };
    clearTimeout(commitTimer);
    if (atOnce) commit();
    else commitTimer = setTimeout(commit, REST);
  }

  /**
   * Ends the zoom in progress: the pages are laid out at the zoom it reached,
   * and the side scrolled so that what lay under the pointer stays there,
   * in one drawing, with the transform taken off.
   */
  function commit() {
    clearTimeout(commitTimer);
    const g = gesture;
    const el = scroller;
    if (!g || !el) return;
    const q = g.at;
    const p = under(g, q);
    const before = placed;
    const i = Math.min(
      before.tops.length - 1,
      Math.max(0, pageAt(before, el.scrollTop + p[1]) - 1),
    );
    const fx = (el.scrollLeft + p[0] - pageLeft(before, i, el.clientWidth)) / before.widths[i];
    const fy = (el.scrollTop + p[1] - before.tops[i]) / before.heights[i];
    gesture = null;
    onzoom(g.zoom);
    const after = placed;
    const left = pageLeft(after, i, el.clientWidth) + fx * after.widths[i] - q[0];
    const top = after.tops[i] + fy * after.heights[i] - q[1];
    // The pages in view are those at the new place: told before the drawing, so that none leaves the document and comes back within it.
    scrolled = Math.max(0, Math.min(top, after.total - el.clientHeight));
    scrolledX = Math.max(0, left);
    flushSync();
    el.scrollLeft = left;
    el.scrollTop = top;
    onscroll();
  }

  const here = () => pointerIn || !!scroller?.contains(document.activeElement);

  onMount(() =>
    shortcuts.bind({
      'preview-zoom-in': { run: () => zoomBy(1), when: here },
      'preview-zoom-in-equal': { run: () => zoomBy(1), when: here },
      'preview-zoom-out': { run: () => zoomBy(-1), when: here },
      'preview-zoom-fit': { run: () => zoomAt(null, undefined, undefined, true), when: here },
      'viewer-next': { run: () => goTo(page + 1), when: here },
      'viewer-previous': { run: () => goTo(page - 1), when: here },
      'viewer-first': { run: () => goTo(1), when: here },
      'viewer-last': { run: () => goTo(facts.pages), when: here },
    }),
  );

  /** For the bar: zoom to a factor or to the width, about the middle of the view, at once. */
  export function zoomed(next: number | null) {
    zoomAt(next, undefined, undefined, true);
  }
  /** For the bar, the bookmarks and the contents: goes to a place, at the top edge of the view. */
  export function goToPlace(to: Place) {
    if (!started) return;
    askedPage = Math.min(Math.max(1, to.page), facts.pages);
    toPlace({ page: askedPage, at: to.at });
    onscroll();
    tellNow();
  }
  /** Where the view stands: the page at its top edge, and how far down it. */
  export function placeNow(): Place {
    return lastPlace ?? { ...startAt };
  }
  /**
   * The place a bookmark marks: the page the bar says, and how far down it
   * the view begins, from its top where the view begins above it.
   */
  export function markPlace(): Place {
    const i = page - 1;
    const top = (scroller?.scrollTop ?? 0) + AROUND.top;
    const at = (top - (placed.tops[i] ?? 0)) / Math.max(placed.heights[i] ?? 1, 1);
    return { page, at: Math.round(Math.min(1, Math.max(0, at)) * 10000) / 10000 };
  }
  export function percent(): number {
    return Math.round((gesture ? factorOf(gesture.zoom) : factor) * 100);
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
      <!-- While a zoom is in progress, each page is shown where the gesture shows it, about its own corner, as a layer of its own. -->
      <div
        class="page"
        class:zooming={!!gesture}
        data-page={n}
        style:top="{placed.tops[i]}px"
        style:width="{placed.widths[i]}px"
        style:height="{placed.heights[i]}px"
        style:transform={gesture
          ? `${boxTransform(gesture, [Math.max(column, roomWidth) / 2 - scrolledX, placed.tops[i] - scrolled])} translateX(-50%)`
          : undefined}
      >
        {#if d?.url}
          <canvas use:picture={d.url} aria-hidden="true"></canvas>
          <PageText {file} page={n} width={placed.widths[i]} />
        {:else if d?.failed}
          <p class="failed">{t('viewer-not-drawn', { why: d.failed })}</p>
        {:else}
          <div class="coming" data-page-coming><Spinner size={24} /></div>
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
  .page.zooming {
    transform-origin: 0 0;
    will-change: transform;
  }
  /* The picture fills the page: drawn as wide as the page is shown, it is painted dot for dot once the zoom rests. */
  .page canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
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
  /* A page not yet come says so in its middle, from a moment after it is
     asked for: one that comes at once never blinks. */
  .coming {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    animation: coming 200ms ease-out 400ms forwards;
  }
  @keyframes coming {
    to {
      opacity: 1;
    }
  }
</style>
