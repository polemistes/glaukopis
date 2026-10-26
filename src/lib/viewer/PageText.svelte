<script lang="ts">
  /**
   * The text a page of a PDF has, laid over its picture (ADR 0069): each line
   * where it stands, as high as it is and stretched to its width, unseen, so
   * that what is selected lies over the words printed and what is copied is
   * letters, a line to each line. A page without text has none.
   */
  import { untrack } from 'svelte';
  import { filePageLines, type PageLines } from '$lib/api/viewer';

  interface Props {
    file: string;
    /** Counted from one. */
    page: number;
    /** How wide the page is shown, in pixels: the lines are measured again when it changes. */
    width: number;
  }

  let { file, page, width }: Props = $props();

  let lines = $state.raw<PageLines | null>(null);
  let layer = $state<HTMLDivElement>();

  // Fetched once a page is drawn. It depends on the file and the page alone.
  $effect(() => {
    const f = file;
    const n = page;
    untrack(() => {
      filePageLines(f, n)
        .then((got) => {
          if (f === file && n === page) lines = got;
        })
        .catch(() => (lines = null));
    });
  });

  const pct = (v: number, of: number) => `${(v / Math.max(of, 1)) * 100}%`;

  // Each line is stretched to the width it has on the page, once it is drawn
  // and whenever the page is shown at another width.
  $effect(() => {
    void width;
    const el = layer;
    if (!el || !lines?.lines.length) return;
    const frame = requestAnimationFrame(() => {
      for (const line of Array.from(el.querySelectorAll<HTMLElement>('.line'))) {
        const span = line.firstElementChild as HTMLElement | null;
        if (!span) continue;
        span.style.transform = '';
        const natural = span.getBoundingClientRect().width;
        const wanted = line.getBoundingClientRect().width;
        if (natural > 0 && wanted > 0) span.style.transform = `scaleX(${wanted / natural})`;
      }
    });
    return () => cancelAnimationFrame(frame);
  });
</script>

{#if lines?.lines.length}
  <div class="text" bind:this={layer} data-page-text={page}>
    {#each lines.lines as line, i (i)}
      {@const h = Math.max(line.bottom - line.top, 1)}
      <div
        class="line"
        style:left={pct(line.left, lines.width)}
        style:top={pct(line.top, lines.height)}
        style:width={pct(Math.max(line.right - line.left, 1), lines.width)}
        style:height={pct(h, lines.height)}
        style:font-size="{(h / lines.width) * 100 * 0.88}cqw"
      >
        <span>{line.text}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .text {
    position: absolute;
    inset: 0;
    line-height: 1;
    font-family: var(--font-text);
    color: transparent;
    user-select: text;
    cursor: text;
  }
  .line {
    position: absolute;
    white-space: pre;
    overflow: visible;
  }
  .line span {
    display: inline-block;
    transform-origin: 0 0;
  }
  .text ::selection {
    background: color-mix(in srgb, var(--accent) 35%, transparent);
    color: transparent;
  }
</style>
