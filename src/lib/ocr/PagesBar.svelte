<script lang="ts">
  /**
   * The line over the strip of pages in the workbench of a reading: what
   * will happen, in a sentence (*412 pages take the text the PDF has; 147
   * are read with Tesseract.*), the warning of scans of too few dots to the
   * inch, and the three actions on the pages selected, or on every page
   * where none are: the PDF's text, a reading by Tesseract, or each page
   * decided by the quality of the text it has. What the actions hold for is
   * said beside them, with a way back to every page where some are selected.
   * Of a picture, the sentence alone.
   */
  import Eye from '@lucide/svelte/icons/eye';
  import FileText from '@lucide/svelte/icons/file-text';
  import Scale from '@lucide/svelte/icons/scale';
  import type { Looked } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import { newId } from '$lib/util/id';
  import { lowResolution } from './how';
  import { pagesSaid, type PagePlan, type Source } from './plan';
  import { selectionSaid } from './select';

  interface Props {
    looked: Looked;
    /** What each page gets, in the order of the pages; empty for a picture. */
    plan: PagePlan[];
    /** The pages selected, counted from one; empty for every page. */
    selection: number[];
    /** Whether Tesseract is installed, to read what is to be read. */
    canRead: boolean;
    /** The pages selected (every page, where none are) given a source. */
    onsource: (source: Source) => void;
    /** The pages selected decided by the quality of their text. */
    ondecide: () => void;
    /** Every page selected: the selection of none. */
    onall: () => void;
  }

  let { looked, plan, selection, canRead, onsource, ondecide, onall }: Props = $props();

  const id = `pages-${newId()}`;
  const pages = $derived(plan.length);

  const said = $derived(pagesSaid(looked, plan, canRead, t));

  /** The selection in words, nothing where it is every page. */
  const scoped = $derived(selectionSaid(selection, pages, t));
  const scope = $derived(
    scoped ? t('ocr-pages-scope', { pages: scoped }) : t('ocr-pages-scope-all', { pages }),
  );
  const hasText = (page: number) => {
    const verdict = looked.verdicts[page - 1];
    return verdict === 'sound' || verdict === 'poor';
  };
  /** Whether the file has text on any page, to be decided by. */
  const anyText = $derived(looked.verdicts.some((v) => v === 'sound' || v === 'poor'));
  /** Whether any of the pages the actions hold for has text to take. */
  const textHere = $derived(scoped ? selection.some(hasText) : anyText);
</script>

<div class="bar" data-pages-bar>
  <div class="line">
    <p class="said" data-pages-said>{said}</p>
    {#if !looked.picture && pages > 0}
      <div class="actions" role="group" aria-labelledby="{id}-scope">
        <span class="scope" id="{id}-scope" data-pages-scope>{scope}</span>
        {#if scoped}
          <button type="button" class="link" data-pages-all onclick={onall}
            >{t('ocr-pages-all')}</button
          >
        {/if}
        <Button
          size="sm"
          disabled={!textHere}
          title={t('ocr-pages-pdf-hint')}
          onclick={() => onsource('pdf')}
          data-pages-pdf
        >
          {#snippet icon()}<FileText size={13} />{/snippet}
          {t('ocr-pages-pdf')}
        </Button>
        <Button
          size="sm"
          disabled={!canRead}
          title={t('ocr-pages-read-hint')}
          onclick={() => onsource('read')}
          data-pages-read
        >
          {#snippet icon()}<Eye size={13} />{/snippet}
          {t('ocr-pages-read')}
        </Button>
        <Button
          size="sm"
          disabled={!anyText || !canRead}
          title={t('ocr-pages-decide-hint')}
          onclick={ondecide}
          data-pages-decide
        >
          {#snippet icon()}<Scale size={13} />{/snippet}
          {t('ocr-pages-decide')}
        </Button>
      </div>
    {/if}
  </div>
  {#if lowResolution(looked)}
    <p class="warn" data-ocr-low-resolution={looked.resolution}>
      {t('ocr-low-resolution', { dpi: looked.resolution ?? 0 })}
      {#if looked.withText > 0}{t('ocr-low-resolution-text')}{/if}
    </p>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }
  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    min-width: 0;
  }
  .said {
    flex: 1 1 320px;
    min-width: 0;
    margin: 0;
    color: var(--ink);
    line-height: 1.45;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .scope {
    color: var(--ink-2);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }
  .link {
    margin: 0 4px 0 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
  }
  .warn {
    margin: 0;
    padding: 8px 10px;
    border-radius: var(--radius-m);
    background: var(--gold-soft);
    color: var(--ink);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
</style>
