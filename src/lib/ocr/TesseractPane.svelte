<script lang="ts">
  /**
   * What Tesseract read of the page in view, in the workbench of a reading:
   * the trial shown, with how sure Tesseract was of the page and how many of
   * its words it was unsure of, those words underlined in the text; under
   * it, the page's trials (`Trials.svelte`); and in the header the button
   * that has the pages selected read by Tesseract.
   */
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import Pane from './Pane.svelte';
  import type { PageSettings } from './plan';
  import { pieces, type Trial } from './trials';
  import Trials from './Trials.svelte';

  interface Props {
    /** The page in view, counted from one: the page tried, or to be. */
    page: number;
    /** The trial shown; nothing where the page was not tried. */
    shown: Trial | null;
    /** The page's trials, the newest first. */
    trials: Trial[];
    /** Whether the page is being tried. */
    trying: boolean;
    /** Why the trial failed, where it did. */
    failure: string | null;
    /** The settings that hold for the page now. */
    current: PageSettings;
    /** The name of a language, from Tesseract's name of it. */
    nameOf: (code: string) => string;
    /** Whether the pages selected can be read by Tesseract: it is installed. */
    canUse: boolean;
    onuse: () => void;
    onshow: (trial: Trial) => void;
    onsettings: (settings: PageSettings) => void;
    /** The pages the button has read, in words: *this page*, *pages 3–5*, *all pages*. */
    scope: string;
  }

  let {
    page,
    shown,
    trials,
    trying,
    failure,
    current,
    nameOf,
    canUse,
    onuse,
    onshow,
    onsettings,
    scope,
  }: Props = $props();

  const tried = $derived(trying || failure ? null : (shown?.tried ?? null));
  const confidence = $derived(tried?.confidence == null ? null : Math.round(tried.confidence));
  const round = (n: number | null) => Math.round(n ?? 0);
</script>

{#snippet kept()}
  <Trials {trials} {shown} {current} {nameOf} {onshow} {onsettings} />
{/snippet}

<Pane
  title={t('ocr-pane-tesseract')}
  padded
  foot={trials.length ? kept : undefined}
  data-pane-tesseract
>
  {#snippet actions()}
    <Button size="sm" disabled={!canUse} onclick={() => onuse()} data-pane-use-read>
      {t('ocr-pane-use', { scope })}
    </Button>
  {/snippet}
  {#snippet bar()}
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
      </p>
      {#if tried.words > 0}
        <p class="count" data-unsure={tried.unsure}>
          {t('ocr-pane-unsure', { unsure: tried.unsure, words: tried.words })}
        </p>
      {/if}
    {/if}
  {/snippet}
  {#if trying}
    <div class="working" aria-live="polite">
      <Spinner size={16} />
      <span>{t('ocr-trying', { page })}</span>
    </div>
  {:else if failure}
    <p class="failure selectable" role="alert" data-ocr-try-failed>
      <CircleAlert size={15} /> <span>{failure}</span>
    </p>
  {:else if !tried}
    <p class="hint" data-ocr-try-hint>{t('ocr-pane-try-hint', { page })}</p>
  {:else}
    <div class="text selectable" data-ocr-tried-text>
      {#each tried.paragraphs as paragraph, i (i)}
        <!-- One line, so that no space comes between a word and what follows it. -->
        <!-- prettier-ignore -->
        <p>{#each pieces(paragraph) as piece, j (j)}{#if piece.unsure}<mark data-unsure-word={round(piece.unsure.confidence)} use:tooltip={t('ocr-pane-unsure-word', { confidence: round(piece.unsure.confidence) })}>{piece.text}</mark>{:else}{piece.text}{/if}{/each}</p>
      {/each}
    </div>
  {/if}
</Pane>

<style>
  .verdict,
  .count {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.4;
    color: var(--ink-2);
  }
  .verdict.poorly {
    padding: 6px 9px;
    border-radius: var(--radius-s);
    background: var(--gold-soft);
    color: var(--ink);
  }
  .count {
    color: var(--ink-3);
  }
  .working {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ink-2);
    font-size: var(--text-sm);
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
  .text {
    font-family: var(--font-text, serif);
    font-size: var(--text-sm);
    line-height: 1.6;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  .text p {
    margin: 0 0 8px;
  }
  /* A word Tesseract was unsure of: to be checked, quietly. */
  mark {
    padding: 0 1px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--gold) 13%, transparent);
    color: inherit;
    text-decoration-line: underline;
    text-decoration-style: dotted;
    text-decoration-color: var(--warn);
    text-decoration-thickness: 1.5px;
    text-underline-offset: 0.22em;
    text-decoration-skip-ink: none;
  }
  .failure {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    font-size: var(--text-sm);
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
</style>
