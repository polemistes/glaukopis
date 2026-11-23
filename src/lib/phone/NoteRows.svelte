<script lang="ts" module>
  /** Where the list was scrolled to, kept while the page lives: a note opened and left finds the list where it was. */
  let kept = 0;
</script>

<script lang="ts">
  /**
   * The notes on the phone, newest first, one row each: the dot of a note
   * not looked at; its name or how it begins; under it the day and the
   * source of what it took in; under that its tags, in one line that is
   * cut; at the right its first picture, small. A row pressed opens its
   * note. Only the rows in view are drawn, as on a computer, so that
   * thousands stay quick; the one height of a row is measured from a row
   * that is drawn, since the letters are as large as the system makes them.
   */
  import Thumb from '$lib/files/Thumb.svelte';
  import { t } from '$lib/i18n';
  import type { Notebook } from '$lib/notebook/model/notebook.svelte';
  import type { NoteRecord } from '$lib/notebook/model/types';
  import { places } from './places.svelte';
  import { phoneRowOf } from './rows';

  let { notebook, notes }: { notebook: Notebook; notes: NoteRecord[] } = $props();

  /** How many rows are drawn beyond those in view, on either side. */
  const OVERSCAN = 6;
  /** How many rows are drawn before one has been measured. */
  const FIRST = 16;

  let viewport = $state<HTMLDivElement>();
  let scrollTop = $state(kept);
  let height = $state(0);
  /** The height of a row, as one that is drawn has it; none until one is. */
  let row = $state(0);

  const first = $derived(row ? Math.max(0, Math.floor(scrollTop / row) - OVERSCAN) : 0);
  const last = $derived(
    row
      ? Math.min(notes.length, Math.ceil((scrollTop + height) / row) + OVERSCAN)
      : Math.min(notes.length, FIRST),
  );
  const visible = $derived(notes.slice(first, last));

  $effect(() => {
    if (!viewport) return;
    const observer = new ResizeObserver(() => (height = viewport!.clientHeight));
    observer.observe(viewport);
    return () => observer.disconnect();
  });

  // Back where it was, once the rows have their height.
  let restored = false;
  $effect(() => {
    if (restored || !row || !viewport) return;
    restored = true;
    viewport.scrollTop = kept;
  });

  /** Measures each row drawn: they are all of one height, which the letters decide. */
  function measured(node: HTMLElement) {
    const observer = new ResizeObserver(([entry]) => {
      const h = entry.borderBoxSize?.[0]?.blockSize ?? node.getBoundingClientRect().height;
      if (h > 0 && Math.abs(h - row) > 0.5) row = h;
    });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }

  function onscroll() {
    scrollTop = viewport!.scrollTop;
    kept = scrollTop;
  }
</script>

<div bind:this={viewport} class="list" data-phone-rows {onscroll}>
  <div class="sizer" style:height={row ? `${notes.length * row}px` : undefined}>
    <div class="window" style:transform={row ? `translateY(${first * row}px)` : undefined}>
      {#each visible as note (note.id)}
        {@const shown = phoneRowOf(notebook, note)}
        <button
          type="button"
          class="row"
          data-phone-row={note.id}
          data-unseen={note.seen ? undefined : ''}
          use:measured
          onclick={() => places.go({ at: 'note', note: note.id })}
        >
          {#if !note.seen}
            <span class="unseen" role="img" aria-label={t('notebook-unseen')}></span>
          {/if}
          <span class="text">
            <span class="title truncate" class:empty={shown.empty} data-phone-row-title
              >{shown.empty ? t('notebook-empty-note') : shown.title}</span
            >
            <span class="under truncate" data-phone-row-under>
              <span class="day" data-phone-row-day>{shown.day}</span
              >{#if shown.source !== null}<span class="source" data-phone-row-source
                  >{shown.source}</span
                >{/if}
            </span>
            <span class="tags truncate" data-phone-row-tags
              >{#each shown.tags as tag (tag)}<span class="tag">{tag}</span>{/each}</span
            >
          </span>
          {#if shown.picture}
            <span class="thumb">
              <Thumb hash={shown.picture.hash} extension={shown.picture.extension} small />
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .list {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    /* Room under the last row for the round button that makes a note. */
    padding-bottom: calc(var(--control-h) + var(--space-7));
  }
  .sizer {
    position: relative;
  }
  .window {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
  }
  .row {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-2) var(--space-3) var(--space-2) var(--phone-gutter, 16px);
    border: none;
    border-bottom: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .row:active {
    background: var(--paper-hover);
  }
  /* A note taken in and not yet looked at: a dot before its name. */
  .unseen {
    position: absolute;
    left: 5px;
    top: 50%;
    width: 8px;
    height: 8px;
    margin-top: -4px;
    border-radius: 50%;
    background: var(--accent);
  }
  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .title,
  .under,
  .tags {
    display: block;
    line-height: 1.35;
  }
  .title {
    font-weight: 600;
  }
  .title.empty {
    font-weight: 400;
    font-style: italic;
    color: var(--ink-4);
  }
  .under {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .day {
    font-variant-numeric: tabular-nums;
  }
  .source::before {
    content: ' · ';
  }
  /* Always a line, with tags or without: every row is of one height. */
  .tags {
    min-height: 1.35em;
    font-size: var(--text-sm);
    color: var(--accent-strong);
  }
  .tag + .tag {
    margin-left: var(--space-2);
  }
  .thumb {
    flex: none;
    width: 48px;
    height: 48px;
  }
</style>
