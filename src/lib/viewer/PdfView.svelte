<script lang="ts">
  /**
   * The pages of a PDF of the library in a side (ADR 0069), one under
   * another, scrolled. Each is drawn by the core at the width it is shown,
   * those in view and beside them first, and kept as the typesetting pane
   * keeps its pages. The page in view is the one at the middle of the side.
   * Turned with PageDown, PageUp, Home and End; zoomed with the typesetting
   * pane's keys, and Ctrl and the wheel.
   */
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { ocrStop } from '$lib/api/ocr';
  import { filePages, type FileFacts } from '$lib/api/viewer';
  import { t } from '$lib/i18n';
  import { clampZoom, PX_PER_PT, stepped } from '$lib/preview/zoom';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { newId } from '$lib/util/id';
  import { AROUND, pageAt, pagesSeen, placePages, toLetGo, widthWanted } from './pages';
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
  /** The widest page, for the width of the column. */
  const columnWidth = $derived(Math.max(0, ...placed.widths) + 2 * AROUND.side);

  /** The pages drawn, by their numbers: the picture and the width it was drawn at. */
  const drawn = new SvelteMap<
    number,
    { png: string | null; failed: string | null; width: number }
  >();
  /** The pages asked for and not yet come. */
  const asked = new Set<number>();
  let ticket = '';

  const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;

  // The pages in view, and beside them, are fetched where they are not drawn
  // wide enough. It depends on where the side is scrolled and how large the
  // pages are shown.
  $effect(() => {
    const seen = pagesSeen(placed, scrolled, scrolled + roomHeight);
    const lacking = seen.filter((n) => {
      const want = widthWanted(placed.widths[n - 1], ratio);
      const has = drawn.get(n);
      return !asked.has(n) && (!has || (has.png && has.width < want));
    });
    if (!lacking.length || !roomWidth) return;
    untrack(() => void fetch(lacking));
  });

  async function fetch(pages: number[]) {
    // One width for the batch: the widest wanted among them.
    const width = Math.max(...pages.map((n) => widthWanted(placed.widths[n - 1], ratio)));
    for (const n of pages) asked.add(n);
    const mine = (ticket = newId());
    try {
      const got = await filePages(file, pages, width, mine);
      for (const p of got) drawn.set(p.number, { png: p.png, failed: p.failed, width });
    } catch (e) {
      const why = e instanceof Error ? e.message : ((e as { message?: string })?.message ?? '');
      for (const n of pages) if (!drawn.has(n)) drawn.set(n, { png: null, failed: why, width });
    } finally {
      for (const n of pages) asked.delete(n);
    }
    for (const n of toLetGo([...drawn.keys()], page)) drawn.delete(n);
  }

  onDestroy(() => {
    if (ticket) void ocrStop(ticket).catch(() => {});
  });

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
    const measure = () => {
      roomWidth = el.clientWidth;
      roomHeight = el.clientHeight;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    measure();
    // The page the side was left at, once the pages are placed.
    void tick().then(() => goTo(page));
    let last = 0;
    const onwheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !event.deltaY) return;
      event.preventDefault();
      if (event.timeStamp - last < 60) return;
      last = event.timeStamp;
      zoomBy(event.deltaY < 0 ? 1 : -1);
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

  /** Zooms by steps, keeping the page in view where it was. */
  function zoomBy(steps: number) {
    zoomTo(stepped(factor, steps));
  }

  function zoomTo(next: number | null) {
    const at = page;
    const within = scroller
      ? (scroller.scrollTop - placed.tops[at - 1]) / Math.max(1, placed.heights[at - 1])
      : 0;
    onzoom(next === null ? null : clampZoom(next));
    void tick().then(() => {
      if (scroller) scroller.scrollTop = placed.tops[at - 1] + within * placed.heights[at - 1];
    });
  }

  const here = () => pointerIn || !!scroller?.contains(document.activeElement);

  onMount(() =>
    shortcuts.bind({
      'preview-zoom-in': { run: () => zoomBy(1), when: here },
      'preview-zoom-in-equal': { run: () => zoomBy(1), when: here },
      'preview-zoom-out': { run: () => zoomBy(-1), when: here },
      'preview-zoom-fit': { run: () => zoomTo(null), when: here },
      'viewer-next': { run: () => goTo(page + 1), when: here },
      'viewer-previous': { run: () => goTo(page - 1), when: here },
      'viewer-first': { run: () => goTo(1), when: here },
      'viewer-last': { run: () => goTo(facts.pages), when: here },
    }),
  );

  /** For the bar: zoom to a factor or to the width, and go to a page. */
  export function zoomed(next: number | null) {
    zoomTo(next);
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
  <div class="column" style:height="{placed.total}px" style:width="{columnWidth}px">
    {#each facts.sizes as _, i (i)}
      {@const n = i + 1}
      {@const d = drawn.get(n)}
      {#if Math.abs(n - page) <= 6 || d}
        <div
          class="page"
          data-page={n}
          style:top="{placed.tops[i]}px"
          style:width="{placed.widths[i]}px"
          style:height="{placed.heights[i]}px"
        >
          {#if d?.png}
            <img src={d.png} alt="" draggable="false" />
            <PageText {file} page={n} width={placed.widths[i]} />
          {:else if d?.failed}
            <p class="failed">{t('viewer-not-drawn', { why: d.failed })}</p>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .scroller {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: auto;
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
    box-shadow: var(--shadow-1);
    container-type: inline-size;
  }
  .page img {
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
</style>
