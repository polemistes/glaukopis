<script lang="ts">
  /**
   * The whole text a PDF has, to be looked through before it is decided what
   * becomes of it (ADR 0044): page by page under the numbers they have in
   * print, as it is or as translated, loaded as the scroll comes near the end.
   */
  import { onDestroy } from 'svelte';
  import { ocrText, type PageTextView } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';

  interface Props {
    path: string;
    stored: boolean;
    /** How many pages the PDF has. */
    pages: number;
    /** Whether the text is shown as translated, where a page has a translation. */
    translated: boolean;
  }

  let { path, stored, pages, translated }: Props = $props();

  /** How many pages are asked for at a time. */
  const BATCH = 20;

  let shown = $state.raw<PageTextView[]>([]);
  let loading = $state(false);
  /** Why the rest could not be read, where it could not: said under the last page shown. */
  let failed = $state<string | null>(null);
  let box = $state<HTMLDivElement>();
  let end = $state<HTMLDivElement>();
  let gone = false;
  onDestroy(() => (gone = true));

  async function more() {
    if (loading || failed !== null || shown.length >= pages) return;
    loading = true;
    const from = shown.length;
    try {
      const next = await ocrText(path, stored, from, BATCH);
      if (gone) return;
      shown = [...shown, ...next];
      // Fewer pages than the PDF has, and none of them given: the core read
      // no further, which is not the end of the text.
      if (!next.length) {
        failed = '';
        console.error(`the text of ${path} gave no pages from page ${from + 1} of ${pages}`);
      }
    } catch (error) {
      if (gone) return;
      failed = describeError(error) ?? '';
      console.error(`the text of ${path} could not be read from page ${from + 1}`, error);
    } finally {
      loading = false;
    }
  }

  // More pages as the end comes within reach of the scroll.
  $effect(() => {
    if (!box || !end) return;
    const watch = new IntersectionObserver(
      (seen) => {
        if (seen.some((e) => e.isIntersecting)) void more();
      },
      { root: box, rootMargin: '0px 0px 400px 0px' },
    );
    watch.observe(end);
    return () => watch.disconnect();
  });
</script>

<div class="preview" bind:this={box} data-text-preview data-translated={translated}>
  {#each shown as page (page.number)}
    <section class="page" data-text-page={page.label}>
      <h4>{t('ocr-text-page', { label: page.label })}</h4>
      {#if page.hasText}
        <div class="lines selectable">
          {#each translated && page.translated ? page.translated : page.lines as line, i (i)}
            <div>{line}</div>
          {/each}
        </div>
      {:else}
        <p class="none">{t('ocr-text-page-none')}</p>
      {/if}
    </section>
  {/each}
  <div class="end" bind:this={end}>
    {#if loading}<Spinner size={14} />{/if}
    {#if failed !== null}
      <p class="failed" data-text-failed>
        {t('ocr-text-rest-failed')}
        {#if failed}<span class="reason">{failed}</span>{/if}
      </p>
    {/if}
  </div>
</div>

<style>
  .preview {
    min-height: 320px;
    max-height: min(62vh, 640px);
    overflow-y: auto;
    padding: 10px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
  }
  .page + .page {
    margin-top: 14px;
    padding-top: 10px;
    border-top: 1px dashed var(--line-strong);
  }
  h4 {
    margin: 0 0 6px;
    font-size: var(--text-xs);
    font-weight: 550;
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .lines {
    font-family: var(--font-text, serif);
    font-size: var(--text-sm);
    line-height: 1.5;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .none {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
    font-style: italic;
  }
  .end {
    display: flex;
    justify-content: center;
    min-height: 8px;
    padding-top: 6px;
  }
  .failed {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--danger);
    overflow-wrap: anywhere;
  }
  .reason {
    display: block;
    color: var(--ink-3);
  }
</style>
