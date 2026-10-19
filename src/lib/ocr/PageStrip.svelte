<script lang="ts">
  /**
   * The pages of a PDF as a strip of small pictures, scrolling sideways: the
   * way through the file in the workbench of a reading. Each page has its
   * number under it and a mark in its corner saying what it gets, the text
   * the PDF has or Tesseract, tinted where the text it has does not read as
   * text. Over the pages, where they are not all read alike, a band stands
   * over each run of pages read alike; under them, a tick where each part of
   * the file's outline begins.
   *
   * A click shows a page and selects it alone; Shift-click selects the pages
   * from the page clicked last without Shift; Ctrl-click (Cmd-click) adds a
   * page or takes it away, the page in view staying. A band or a tick
   * selects its pages. The arrow keys, Home and End move the page in view and
   * the selection with it, or with Shift extend the selection; Ctrl+A
   * selects every page, which is the empty selection.
   *
   * The pages are drawn a batch at a time as they come into sight, never the
   * whole file at once, which for a long book would take minutes. The strip
   * is of one file: where the file can change, it is made anew for the other.
   */
  import { onDestroy } from 'svelte';
  import Eye from '@lucide/svelte/icons/eye';
  import FileText from '@lucide/svelte/icons/file-text';
  import { isBackendError } from '$lib/api/backend';
  import {
    ocrPages,
    ocrStop,
    type OutlinePart,
    type PagePicture,
    type Verdict,
  } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { runsOf, type PagePlan } from './plan';
  import { pagesOfPart, pagesOfRun, rangeBetween, toggled } from './select';
  import { WIDTH, batchAt, firstWanted, moved, runSaid, ticksOf, type Batch } from './strip';

  interface Props {
    path: string;
    /** Whether the path is one of the library, in the store. */
    stored: boolean;
    /** How many pages the PDF has. */
    pages: number;
    /** What each page gets, and what it is read with, in the order of the pages. */
    plan: PagePlan[];
    /** What the text each page has is like, in the order of the pages. */
    verdicts: Verdict[];
    /** The top of the file's outline, with the pages its parts begin at. */
    outline: OutlinePart[];
    /** The pages selected, counted from one; empty for every page. */
    selection: number[];
    /** The page in view, counted from one. */
    inView: number;
    onview: (page: number) => void;
    onselect: (selection: number[]) => void;
    /** The name of a language, for the bands of the stretches. */
    nameOf: (code: string) => string;
  }

  let {
    path,
    stored,
    pages,
    plan,
    verdicts,
    outline,
    selection,
    inView,
    onview,
    onselect,
    nameOf,
  }: Props = $props();

  const ticket = newId();
  /** What the pages' places in the strip are known by, for the reader of the screen. */
  const id = `strip-${ticket}`;
  const numbers = $derived(Array.from({ length: Math.max(0, pages) }, (_, i) => i + 1));
  const chosen = $derived(new Set(selection));
  /** The runs of pages read alike, banded where there is more than one. */
  const bands = $derived.by(() => {
    const runs = runsOf(plan).filter((run) => run.from <= pages);
    return runs.length > 1 ? runs : [];
  });
  const ticks = $derived(ticksOf(outline, pages));
  /** The words of the marks, said once for every page. */
  const words = $derived({
    pdf: t('ocr-strip-source-pdf'),
    read: t('ocr-strip-source-read'),
    pdfHint: t('ocr-strip-source-pdf-hint'),
    readHint: t('ocr-strip-source-read-hint'),
    poor: t('ocr-strip-poor'),
  });

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
  /** What scrolls: the pages, the bands over them and the ticks under them. */
  let row = $state<HTMLDivElement>();
  /** The pages themselves, which the keys move through. */
  let list = $state<HTMLDivElement>();
  /** The page clicked last without Shift, from which Shift selects. */
  let anchor: number | null = null;
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
    const place = row?.querySelector(`[data-strip-page="${page}"]`);
    if (!row || !place) return;
    const box = row.getBoundingClientRect();
    const it = place.getBoundingClientRect();
    if (it.left < box.left) row.scrollLeft -= box.left - it.left + 8;
    else if (it.right > box.right) row.scrollLeft += it.right - box.right + 8;
  }

  // The page in view, by the keys or from outside, is brought into sight.
  $effect(() => {
    reveal(inView);
  });

  /** Selects pages, unless they are selected already. */
  function select(next: number[]) {
    if (next.length === selection.length && next.every((page, i) => page === selection[i])) return;
    onselect(next);
  }

  function view(page: number) {
    if (page !== inView) onview(page);
    else reveal(page);
  }

  function click(event: MouseEvent, page: number) {
    list?.focus({ preventScroll: true });
    if (event.ctrlKey || event.metaKey) {
      anchor = page;
      onselect(toggled(selection, page));
    } else if (event.shiftKey) {
      anchor ??= inView;
      select(rangeBetween(anchor, page));
      view(page);
    } else {
      anchor = page;
      select([page]);
      view(page);
    }
  }

  /** The pages of a band or a tick selected; the first of them shown, where the page in view is not among them. */
  function selectAll(them: number[]) {
    list?.focus({ preventScroll: true });
    if (!them.length) return;
    anchor = them[0];
    select(them);
    if (!them.includes(inView)) view(them[0]);
  }

  function key(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      select([]);
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const next = moved(inView, event.key, pages);
    if (next === null) return;
    event.preventDefault();
    if (event.shiftKey) {
      anchor ??= inView;
      select(rangeBetween(anchor, next));
    } else {
      anchor = next;
      select([next]);
    }
    view(next);
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
  <div bind:this={row} class="row" style:--pages={Math.max(1, pages)}>
    {#if bands.length}
      <div class="bands">
        {#each bands as run, i (run.from)}
          {@const said = runSaid(run.settings, nameOf, t)}
          {@const count = Math.min(run.to, pages) - run.from + 1}
          <button
            type="button"
            tabindex="-1"
            class="band"
            class:other={i % 2 === 1}
            style:--from={run.from - 1}
            style:--count={count}
            title={t('ocr-strip-band-hint', {
              count,
              from: String(run.from),
              to: String(run.from + count - 1),
              said,
            })}
            data-strip-stretch={run.from}
            onclick={() => selectAll(pagesOfRun({ from: run.from, to: run.from + count - 1 }))}
            ><span>{said}</span></button
          >
        {/each}
      </div>
    {/if}
    <div
      bind:this={list}
      class="pages"
      role="listbox"
      aria-label={t('ocr-strip')}
      aria-orientation="horizontal"
      aria-multiselectable="true"
      aria-activedescendant={inView >= 1 && inView <= pages ? `${id}-${inView}` : undefined}
      aria-busy={drawing !== null}
      tabindex="0"
      onkeydown={key}
    >
      {#each numbers as n (n)}
        {@const page = drawn.get(n)}
        {@const source = plan[n - 1]?.source}
        {@const verdict = verdicts[n - 1]}
        {@const state = page ? (page.picture ? 'drawn' : 'failed') : 'waiting'}
        {@const hint = source
          ? `${source === 'pdf' ? words.pdfHint : words.readHint}${verdict === 'poor' ? ` ${words.poor}` : ''}`
          : ''}
        <!-- svelte-ignore a11y_click_events_have_key_events: the strip as a whole is moved through by the keys -->
        <div
          id="{id}-{n}"
          class="page"
          role="option"
          tabindex="-1"
          aria-selected={chosen.has(n)}
          aria-label="{t('ocr-strip-page', { number: String(n) })}{hint ? `. ${hint}` : ''}"
          data-strip-page={n}
          data-strip-view={n === inView ? 'true' : undefined}
          data-state={state}
          onclick={(event) => click(event, n)}
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
            {#if source}
              <span
                class="source"
                class:read={source === 'read'}
                class:poor={verdict === 'poor'}
                title={hint}
                data-strip-source={source}
                data-strip-verdict={verdict}
              >
                {#if source === 'pdf'}<FileText size={10} aria-hidden="true" />{:else}<Eye
                    size={10}
                    aria-hidden="true"
                  />{/if}
                <span class="word">{source === 'pdf' ? words.pdf : words.read}</span>
              </span>
            {/if}
          </div>
          <span class="number">{n}</span>
        </div>
      {/each}
    </div>
    {#if ticks.length}
      <div class="parts">
        {#each ticks as tick (tick.page)}
          {@const title = tick.titles.join(' · ')}
          <button
            type="button"
            tabindex="-1"
            class="part"
            style:--from={tick.page - 1}
            style:--count={tick.span}
            {title}
            data-strip-part={tick.page}
            onclick={() => selectAll(pagesOfPart(outline, tick.index, pages))}
            ><span>{title}</span></button
          >
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  /* A page is shown 64 pixels wide, drawn at 120 dots so that it is sharp on
     a fine screen; with its number, the bands over the pages, the ticks
     under them and the scrollbar, the strip stays under 170 pixels high.
     Every page takes the same room (--pitch), by which the bands and the
     ticks are placed over and under their pages. */
  .strip {
    --sheet-w: 64px;
    --sheet-h: 90px;
    --gap: 4px;
    --place-w: calc(var(--sheet-w) + 4px);
    --pitch: calc(var(--place-w) + var(--gap));
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
    user-select: none;
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
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
    padding: 4px 6px;
    overflow-x: auto;
    overflow-y: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
  }
  .row:has(.pages:focus-visible) {
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .bands,
  .parts {
    position: relative;
    flex: none;
    width: calc(var(--pages) * var(--pitch) - var(--gap));
  }
  .bands {
    height: 16px;
  }
  .parts {
    height: 14px;
  }
  .band,
  .part {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--from) * var(--pitch));
    display: flex;
    align-items: center;
    min-width: 0;
    margin: 0;
    padding: 0 6px;
    border: none;
    font: inherit;
    font-size: var(--text-xs);
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
  }
  .band span,
  .part span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* A stretch of pages read alike, over its pages; the next in another tint. */
  .band {
    width: calc(var(--count) * var(--pitch) - var(--gap));
    border-radius: var(--radius-s);
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .band.other {
    background: var(--paper-hover);
    color: var(--ink-2);
    box-shadow: inset 0 0 0 1px var(--line-strong);
  }
  .band:hover {
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  /* A part of the outline, from its page to the next: a tick and its title. */
  .part {
    max-width: calc(var(--count) * var(--pitch) - var(--gap));
    padding: 0 4px 0 6px;
    border-left: 2px solid var(--ink-4);
    background: transparent;
    color: var(--ink-3);
  }
  .part:hover {
    border-left-color: var(--accent);
    color: var(--ink);
  }
  .pages {
    display: flex;
    flex: none;
    gap: var(--gap);
    outline: none;
  }
  .page {
    box-sizing: border-box;
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    width: var(--place-w);
    padding: 2px;
    border-radius: var(--radius-s);
    cursor: default;
  }
  .page:hover {
    background: var(--paper-hover);
  }
  .page[aria-selected='true'] {
    background: var(--accent-soft);
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
    padding: 4px;
    overflow: hidden;
    border-style: dashed;
    color: var(--danger);
    font-size: var(--text-xs);
    line-height: 1.25;
    text-align: center;
    overflow-wrap: anywhere;
  }
  /* The page in view. */
  .page[data-strip-view='true'] :is(img, .paper) {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
  }
  .row:has(.pages:focus-visible) .page[data-strip-view='true'] :is(img, .paper) {
    box-shadow: 0 0 0 5px var(--focus-ring);
  }
  /* What the page gets: the PDF's text, or a reading; tinted where the text it has does not read as text. */
  .source {
    position: absolute;
    top: 3px;
    left: 3px;
    display: flex;
    align-items: center;
    gap: 2px;
    box-sizing: border-box;
    max-width: calc(100% - 6px);
    height: 15px;
    padding: 0 4px 0 3px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink-2);
    font-size: 10px;
    line-height: 13px;
    white-space: nowrap;
    box-shadow: var(--shadow-1);
  }
  .source :global(svg) {
    flex: none;
  }
  .source.read {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-ink);
  }
  .source.poor {
    border-color: var(--gold);
    background: var(--gold-soft);
    color: var(--ink);
  }
  .word {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .number {
    font-size: var(--text-xs);
    line-height: 13px;
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }
  .page[aria-selected='true'] .number,
  .page[data-strip-view='true'] .number {
    color: var(--accent);
    font-weight: 600;
  }
</style>
