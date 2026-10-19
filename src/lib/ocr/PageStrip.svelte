<script lang="ts">
  /**
   * The pages of a PDF as a strip of small pictures, scrolling sideways, to
   * be looked over and a page chosen from: each page with its number under
   * it, drawn a batch at a time as it comes into sight, never the whole file
   * at once, which for a long book would take minutes. A label may stand in
   * a page's corner (`marks`): where a stretch of pages begins. The strip is
   * of one file: where the file can change, it is made anew for the other.
   */
  import { onDestroy } from 'svelte';
  import { isBackendError } from '$lib/api/backend';
  import { ocrPages, ocrStop, type PagePicture } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { WIDTH, batchAt, firstWanted, moved, type Batch } from './strip';

  interface Props {
    path: string;
    /** Whether the path is one of the library, in the store. */
    stored: boolean;
    /** How many pages the PDF has. */
    pages: number;
    /** A short label to stand in a page's corner, by the page's number, counted from one. */
    marks?: Map<number, string>;
    /** The page chosen, counted from one. */
    selected: number | null;
    onselect: (page: number) => void;
    /** Where it is given, the page chosen offers to begin a stretch of pages there. */
    onbegin?: (page: number) => void;
  }

  let { path, stored, pages, marks = new Map(), selected, onselect, onbegin }: Props = $props();

  const ticket = newId();
  /** What the pages' places in the strip are known by, for the reader of the screen. */
  const id = `strip-${ticket}`;
  const numbers = $derived(Array.from({ length: Math.max(0, pages) }, (_, i) => i + 1));

  /** What was drawn of each page, by its number. */
  let drawn = $state.raw(new Map<number, PagePicture>());
  /** The pages, counted from nought, that are drawn or being drawn. */
  const asked = new Set<number>();
  /** The pages, counted from nought, that are in sight or nearly. */
  const near = new Set<number>();
  /** The pages being drawn. */
  let drawing = $state.raw<Batch | null>(null);
  /** The pages that could not be drawn together, and why: said in the strip, to be tried again. */
  let failure = $state.raw<{ batch: Batch; reason: string } | null>(null);
  let row = $state<HTMLDivElement>();
  let gone = false;

  onDestroy(() => {
    gone = true;
    if (drawing)
      ocrStop(ticket).catch((error) =>
        console.error('the drawing of the pages could not be stopped', error),
      );
  });

  function unask(batch: Batch) {
    for (let i = batch.from; i < batch.from + batch.count; i++) asked.delete(i);
  }

  /** Draws the pages in sight that are not drawn, a batch at a time, until none are left. */
  async function more() {
    if (gone || drawing || failure) return;
    const first = firstWanted(near, (i) => asked.has(i));
    const batch = first === null ? null : batchAt(first, pages, (i) => asked.has(i));
    if (!batch) return;
    for (let i = batch.from; i < batch.from + batch.count; i++) asked.add(i);
    drawing = batch;
    try {
      const got = await ocrPages(path, stored, batch.from, batch.count, WIDTH, ticket);
      if (gone) return;
      const next = new Map(drawn);
      for (const page of got) next.set(page.number, page);
      // A page asked for and not given: the file has fewer than were counted.
      for (let n = batch.from + 1; n <= batch.from + batch.count; n++)
        if (!next.has(n)) next.set(n, { number: n, picture: null, failed: '' });
      drawn = next;
    } catch (error) {
      if (gone) return;
      unask(batch);
      if (isBackendError(error) && error.kind === 'stopped') return;
      failure = { batch, reason: describeError(error) ?? '' };
      console.error(`the pages of ${path} could not be drawn from page ${batch.from + 1}`, error);
      return;
    } finally {
      drawing = null;
    }
    void more();
  }

  function again() {
    failure = null;
    void more();
  }

  // The pages are drawn as they come within reach of the scroll.
  $effect(() => {
    if (!row || !numbers.length) return;
    const watch = new IntersectionObserver(
      (seen) => {
        for (const entry of seen) {
          const index = Number((entry.target as HTMLElement).dataset.stripPage) - 1;
          if (entry.isIntersecting) near.add(index);
          else near.delete(index);
        }
        void more();
      },
      { root: row, rootMargin: '0px 600px' },
    );
    for (const page of row.querySelectorAll('[data-strip-page]')) watch.observe(page);
    return () => {
      watch.disconnect();
      near.clear();
    };
  });

  // The wheel scrolls the strip sideways, and the page beyond it at its ends.
  $effect(() => {
    if (!row) return;
    const strip = row;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const end = strip.scrollWidth - strip.clientWidth;
      if (
        (event.deltaY < 0 && strip.scrollLeft <= 0) ||
        (event.deltaY > 0 && strip.scrollLeft >= end - 1)
      )
        return;
      strip.scrollLeft += event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      event.preventDefault();
    };
    strip.addEventListener('wheel', wheel, { passive: false });
    return () => strip.removeEventListener('wheel', wheel);
  });

  /** Scrolls the strip, and only the strip, so that a page is in sight. */
  function reveal(page: number) {
    const place = row?.querySelector(`[data-strip-page="${page}"]`)?.parentElement;
    if (!row || !place) return;
    const box = row.getBoundingClientRect();
    const it = place.getBoundingClientRect();
    if (it.left < box.left) row.scrollLeft -= box.left - it.left + 8;
    else if (it.right > box.right) row.scrollLeft += it.right - box.right + 8;
  }

  // The page chosen, by the keys or from outside, is brought into sight.
  $effect(() => {
    if (selected !== null) reveal(selected);
  });

  function choose(page: number) {
    if (page !== selected) onselect(page);
    row?.focus({ preventScroll: true });
  }

  function key(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const next = moved(selected, event.key, pages);
    if (next === null) return;
    event.preventDefault();
    if (next !== selected) onselect(next);
    else reveal(next);
  }

  const inBatch = (n: number) => !!drawing && n > drawing.from && n <= drawing.from + drawing.count;
</script>

<div class="strip" data-page-strip>
  {#if failure}
    <p class="failed" data-strip-failed role="alert">
      <span class="said">
        {t('ocr-strip-failed', {
          from: String(failure.batch.from + 1),
          to: String(failure.batch.from + failure.batch.count),
        })}
        {#if failure.reason}<span class="reason" title={failure.reason}>{failure.reason}</span>{/if}
      </span>
      <Button size="sm" onclick={again} data-strip-retry>{t('common-try-again')}</Button>
    </p>
  {/if}
  <div
    bind:this={row}
    class="row"
    role="listbox"
    aria-label={t('ocr-strip')}
    aria-orientation="horizontal"
    aria-activedescendant={selected !== null ? `${id}-${selected}` : undefined}
    aria-busy={drawing !== null}
    tabindex="0"
    onkeydown={key}
  >
    {#each numbers as n (n)}
      {@const page = drawn.get(n)}
      {@const mark = marks.get(n)}
      {@const state = page ? (page.picture ? 'drawn' : 'failed') : 'waiting'}
      <div class="place" role="none">
        <!-- svelte-ignore a11y_click_events_have_key_events: the strip as a whole is moved through by the keys -->
        <div
          id="{id}-{n}"
          class="page"
          role="option"
          tabindex="-1"
          aria-selected={selected === n}
          aria-label={mark
            ? `${t('ocr-strip-page', { number: String(n) })}: ${mark}`
            : t('ocr-strip-page', { number: String(n) })}
          data-strip-page={n}
          data-state={state}
          onclick={() => choose(n)}
        >
          <div class="sheet">
            {#if page?.picture}
              <img src={page.picture} alt="" draggable="false" data-strip-picture />
            {:else if page}
              <span class="paper why" title={page.failed || undefined} data-strip-page-failed
                >{page.failed || t('ocr-strip-page-failed')}</span
              >
            {:else}
              <span class="paper blank" class:drawing={inBatch(n)} aria-hidden="true"></span>
            {/if}
            {#if mark}<span class="mark" data-strip-mark={n}>{mark}</span>{/if}
          </div>
          <span class="number">{n}</span>
        </div>
        {#if onbegin && selected === n}
          <button type="button" class="begin" data-ocr-begin-stretch onclick={() => onbegin(n)}
            >{t('ocr-strip-begin')}</button
          >
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  /* A page is shown 84 pixels wide, drawn at 120 dots; with its number and
     the scrollbar the strip stays under 200 pixels high. */
  .strip {
    --sheet-w: 84px;
    --sheet-h: 119px;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
    max-height: 200px;
  }
  .failed {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    padding: 4px 4px 4px 10px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    font-size: var(--text-sm);
  }
  .said {
    display: flex;
    flex: 1;
    gap: 6px;
    min-width: 0;
    white-space: nowrap;
  }
  .reason {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--ink-3);
  }
  .row {
    display: flex;
    gap: 6px;
    min-width: 0;
    padding: 6px;
    overflow-x: auto;
    overflow-y: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    outline: none;
  }
  .row:focus-visible {
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .place {
    position: relative;
    flex: none;
  }
  .page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 3px;
    border-radius: var(--radius-s);
    cursor: default;
  }
  .page:hover {
    background: var(--paper-hover);
  }
  .sheet {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--sheet-w);
    height: var(--sheet-h);
  }
  .sheet img,
  .paper {
    box-sizing: border-box;
    border: 1px solid var(--line-strong);
    border-radius: 2px;
  }
  .sheet img {
    display: block;
    max-width: 100%;
    max-height: 100%;
    background: #fff;
    user-select: none;
  }
  /* A page not drawn yet: a sheet of its shape. */
  .paper {
    width: 100%;
    height: 100%;
    background: var(--paper-raised);
  }
  .blank.drawing {
    animation: waiting 1.2s var(--ease) infinite alternate;
  }
  @keyframes waiting {
    to {
      opacity: 0.45;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .blank.drawing {
      animation: none;
    }
  }
  .why {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    overflow: hidden;
    border-style: dashed;
    color: var(--danger);
    font-size: var(--text-xs);
    line-height: 1.3;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .page[aria-selected='true'] :is(img, .paper) {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .row:focus-visible .page[aria-selected='true'] :is(img, .paper) {
    box-shadow: 0 0 0 5px var(--focus-ring);
  }
  .mark {
    position: absolute;
    top: 3px;
    left: 3px;
    max-width: calc(100% - 6px);
    padding: 0 4px;
    border-radius: var(--radius-s);
    background: var(--accent);
    color: var(--accent-ink);
    font-size: var(--text-xs);
    line-height: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .number {
    font-size: var(--text-xs);
    line-height: 14px;
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }
  .page[aria-selected='true'] .number {
    color: var(--accent);
    font-weight: 600;
  }
  .begin {
    position: absolute;
    right: 6px;
    bottom: 24px;
    left: 6px;
    padding: 3px 4px;
    border: none;
    border-radius: var(--radius-s);
    background: var(--accent);
    color: var(--accent-ink);
    font: inherit;
    font-size: var(--text-xs);
    line-height: 1.2;
    box-shadow: var(--shadow-1);
    cursor: pointer;
  }
  .begin:hover {
    background: var(--accent-strong);
  }
  .begin:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 1px;
  }
</style>
