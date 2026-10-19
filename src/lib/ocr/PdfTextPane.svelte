<script lang="ts">
  /**
   * The text the PDF has for the page in view, in the workbench of a
   * reading: its lines as the PDF has them, or as translated by what its
   * fonts say of their glyphs where the switch is on and the page has a
   * translation; whether it reads as text; and the button that gives this
   * text to the pages selected.
   */
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import type { PageTextView, Verdict } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import Pane from './Pane.svelte';

  interface Props {
    /** The text of the page in view; nothing while it is fetched, or where it could not be. */
    page: PageTextView | null;
    loading: boolean;
    failure: string | null;
    /** What the page's text is like, as the look at the file judged it. */
    verdict: Verdict;
    /** Whether the text is shown, and taken, as translated. */
    translated: boolean;
    /** Whether a scheme applies in the file, by which its text can be translated. */
    canTranslate: boolean;
    ontranslated: (on: boolean) => void;
    /** Whether the pages selected can be given this text: some of them have text. */
    canUse: boolean;
    onuse: () => void;
    /** The pages the button gives the text to, in words: *this page*, *pages 3–5*, *all pages*. */
    scope: string;
  }

  let {
    page,
    loading,
    failure,
    verdict,
    translated,
    canTranslate,
    ontranslated,
    canUse,
    onuse,
    scope,
  }: Props = $props();

  const lines = $derived(
    page ? (translated && page.translated ? page.translated : page.lines) : [],
  );
</script>

<Pane title={t('ocr-text-title')} padded data-pane-pdf>
  {#snippet actions()}
    <Button size="sm" disabled={!canUse} onclick={() => onuse()} data-pane-use-pdf>
      {t('ocr-pane-use', { scope })}
    </Button>
  {/snippet}
  {#snippet bar()}
    {#if canTranslate}
      <label class="check">
        <input
          type="checkbox"
          checked={translated}
          onchange={(e) => ontranslated(e.currentTarget.checked)}
          data-text-translated
        />
        <span>{t('ocr-pane-translated')}</span>
      </label>
    {/if}
    {#if page?.hasText && verdict !== 'none'}
      <p class="verdict" class:poor={verdict === 'poor'} data-text-verdict={verdict}>
        {verdict === 'poor' ? t('ocr-pane-poor') : t('ocr-pane-sound')}
      </p>
    {/if}
  {/snippet}
  {#if failure}
    <p class="failure selectable" role="alert" data-text-failed>
      <CircleAlert size={15} /> <span>{failure}</span>
    </p>
  {:else if loading && !page}
    <div class="loading" aria-live="polite"><Spinner size={16} /></div>
  {:else if page}
    {#if page.hasText}
      <div
        class="lines selectable"
        class:stale={loading}
        data-text-page={page.label}
        data-translated={translated && !!page.translated}
      >
        {#each lines as line, i (i)}
          <div>{line}</div>
        {/each}
      </div>
    {:else}
      <p class="none" data-text-page={page.label} data-text-none>{t('ocr-text-page-none')}</p>
    {/if}
  {/if}
</Pane>

<style>
  .check {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.35;
    cursor: pointer;
  }
  .check input {
    accent-color: var(--accent);
    margin: 1px 0 0;
    flex: none;
  }
  .verdict {
    margin: 0;
    font-size: var(--text-sm);
    line-height: 1.4;
    color: var(--ink-3);
  }
  .verdict.poor {
    padding: 6px 9px;
    border-radius: var(--radius-s);
    background: var(--gold-soft);
    color: var(--ink);
  }
  .lines {
    font-family: var(--font-text, serif);
    font-size: var(--text-sm);
    line-height: 1.55;
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  /* The page before, while the next is fetched. */
  .lines.stale {
    opacity: 0.5;
  }
  .none {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
    font-style: italic;
  }
  .loading {
    display: flex;
    justify-content: center;
    padding: 16px 0;
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
