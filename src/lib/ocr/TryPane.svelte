<script lang="ts">
  /**
   * A page tried before a PDF is read: the page is read with the languages
   * and settings as they are chosen when *Try* is pressed, and the picture
   * Tesseract read is shown beside the text it read, with how sure it was.
   * Another language or setting, and it is tried again; a page takes
   * seconds. This is how anyone finds what reads a book well without knowing
   * Tesseract.
   *
   * Leaving stops a trial that goes on, and so does a new one.
   */
  import { onDestroy } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import ScanSearch from '@lucide/svelte/icons/scan-search';
  import { isBackendError } from '$lib/api/backend';
  import { ocrStop, ocrTry, type Asked, type Tried } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';

  interface Props {
    path: string;
    /** Whether the path is one of the library, in the store. */
    stored: boolean;
    /** How many pages the PDF has. */
    pages: number;
    /** The page to try, counted from one. */
    page?: number;
    /** What the page is read with: the languages and settings as they stand. */
    asked: Asked;
  }

  let { path, stored, pages, page = $bindable(1), asked }: Props = $props();

  let trying = $state(false);
  let tried = $state.raw<Tried | null>(null);
  /** What the page shown was read with, to tell when the choices have changed since. */
  let triedWith = $state('');
  let failure = $state<string | null>(null);
  let ticket: string | null = null;
  let gone = false;

  function stop() {
    if (ticket) {
      const was = ticket;
      ocrStop(was).catch((error) =>
        console.error('the trial of a page could not be stopped', error),
      );
    }
    ticket = null;
  }

  onDestroy(() => {
    gone = true;
    stop();
  });

  const wanted = $derived(Math.min(Math.max(1, Math.round(Number(page) || 1)), Math.max(1, pages)));

  async function attempt() {
    stop();
    const mine = newId();
    ticket = mine;
    const with_ = $state.snapshot(asked);
    const number = wanted;
    page = number;
    trying = true;
    failure = null;
    try {
      const read = await ocrTry(path, stored, number, with_, mine);
      if (gone || ticket !== mine) return;
      tried = read;
      triedWith = JSON.stringify(with_);
    } catch (error) {
      if (gone || ticket !== mine) return;
      if (isBackendError(error) && error.kind === 'stopped') return;
      failure = describeError(error) ?? t('ocr-failed');
      console.error(`page ${number} of ${path} could not be tried`, error);
    } finally {
      if (ticket === mine) {
        ticket = null;
        trying = false;
      }
    }
  }

  /** Whether the languages or settings have changed since the page shown was read. */
  const changed = $derived(!!tried && triedWith !== JSON.stringify(asked));
  const confidence = $derived(tried?.confidence == null ? null : Math.round(tried.confidence));
  /** Whether the blocks Tesseract found are drawn over the picture. */
  let showBlocks = $state(true);
  /**
   * The size of the numbers of the blocks, in the dots of the picture: the
   * picture is shown a few hundred pixels wide, so a twentieth of its width
   * is a number of about twelve pixels.
   */
  const figure = $derived(tried ? tried.width / 20 : 0);
</script>

<div class="try" data-ocr-try-pane>
  <div class="ask">
    <label class="page">
      <span>{t('ocr-try-page')}</span>
      <input
        type="number"
        min="1"
        max={pages}
        bind:value={page}
        data-ocr-try-page
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void attempt();
          }
        }}
      />
      <span class="of">{t('ocr-try-of', { pages })}</span>
    </label>
    <Button size="sm" onclick={attempt} disabled={trying} data-ocr-try>
      {#snippet icon()}<ScanSearch size={14} />{/snippet}
      {t('ocr-try')}
    </Button>
  </div>

  {#if trying}
    <div class="working" aria-live="polite">
      <Spinner size={16} />
      <span>{t('ocr-trying', { page: wanted })}</span>
    </div>
  {:else if failure}
    <p class="failure selectable" role="alert" data-ocr-try-failed>
      <CircleAlert size={15} /> <span>{failure}</span>
    </p>
  {/if}

  {#if tried}
    <p
      class="verdict"
      class:poorly={tried.poorly}
      data-ocr-tried-confidence={confidence ?? ''}
      data-poorly={tried.poorly}
    >
      {#if confidence == null}
        {t('ocr-tried-nothing', { label: tried.label })}
      {:else}
        {t('ocr-tried-confidence', { label: tried.label, confidence })}
        {#if tried.poorly}{t('ocr-tried-poorly')}{/if}
      {/if}
      {#if changed}<span class="changed" data-ocr-tried-changed>{t('ocr-tried-changed')}</span>{/if}
    </p>
    {#if tried.blocks.length}
      <label class="check">
        <input type="checkbox" bind:checked={showBlocks} data-ocr-tried-show-blocks />
        <span>
          {t('ocr-tried-blocks', { count: tried.blocks.length })}
          <small>{t('ocr-tried-blocks-hint')}</small>
        </span>
      </label>
    {/if}
    <div class="result">
      <div class="picture">
        <div class="sheet">
          <img
            src="data:image/png;base64,{tried.png}"
            width={tried.width}
            height={tried.height}
            alt={t('ocr-tried-picture', { label: tried.label })}
            data-ocr-tried-picture
          />
          {#if showBlocks && tried.blocks.length}
            <!-- The blocks Tesseract found, numbered in the order it read them. -->
            <svg
              class="blocks"
              viewBox="0 0 {tried.width} {tried.height}"
              preserveAspectRatio="none"
              aria-hidden="true"
              data-ocr-tried-blocks={tried.blocks.length}
            >
              {#each tried.blocks as block, i (i)}
                <rect
                  x={block.left}
                  y={block.top}
                  width={block.width}
                  height={block.height}
                  vector-effect="non-scaling-stroke"
                />
                <text x={block.left + figure * 0.3} y={block.top + figure * 1.05} font-size={figure}
                  >{i + 1}</text
                >
              {/each}
            </svg>
          {/if}
        </div>
      </div>
      <div class="text selectable" data-ocr-tried-text>
        {#each tried.paragraphs as paragraph, i (i)}
          <p>{paragraph.map((word) => word.text).join(' ')}</p>
        {:else}
          <p class="none">{t('ocr-text-page-none')}</p>
        {/each}
      </div>
    </div>
  {:else if !trying && !failure}
    <p class="hint">{t('ocr-try-hint')}</p>
  {/if}
</div>

<style>
  .try {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 10px);
    min-height: 320px;
    min-width: 0;
  }
  .ask {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .page {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--ink-2);
  }
  .of {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  input[type='number'] {
    width: 68px;
    height: 28px;
    padding: 0 6px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
  }
  .working {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ink-2);
  }
  .hint {
    margin: 0;
    padding: 12px 14px;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-m);
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .verdict {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.45;
    color: var(--ink-2);
  }
  .verdict.poorly {
    padding: 8px 10px;
    border-radius: var(--radius-m);
    background: var(--gold-soft);
    color: var(--ink);
  }
  .changed {
    display: block;
    color: var(--ink-3);
    font-style: italic;
  }
  .result {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 10px;
    min-height: 0;
  }
  .picture,
  .text {
    max-height: min(56vh, 580px);
    overflow: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
  }
  .picture {
    position: relative;
  }
  .sheet {
    position: relative;
  }
  .picture img {
    display: block;
    width: 100%;
    height: auto;
  }
  .blocks {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .blocks rect {
    fill: color-mix(in srgb, var(--accent) 10%, transparent);
    stroke: var(--accent);
    stroke-width: 1.5;
  }
  .blocks text {
    fill: var(--accent);
    font-family: var(--font-ui, sans-serif);
    font-weight: 650;
    paint-order: stroke;
    stroke: var(--paper);
    stroke-width: 6px;
  }
  .check {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--ink-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .check input {
    accent-color: var(--accent);
    margin: 2px 0 0;
  }
  .check span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .check small {
    color: var(--ink-3);
  }
  .text {
    padding: 10px 14px;
    font-family: var(--font-text, serif);
    font-size: var(--text-sm);
    line-height: 1.5;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .text p {
    margin: 0 0 8px;
  }
  .none {
    color: var(--ink-3);
    font-style: italic;
  }
  .failure {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    line-height: 1.45;
  }
  .failure :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .failure span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  @media (max-width: 760px) {
    .result {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
