<script lang="ts">
  /**
   * The stretches of a PDF's pages read with languages and a layout of
   * their own (`stretches.ts`), as chips over the strip of pages: the one
   * chosen is what the language picker and the layout edit. A stretch can be
   * taken away, its pages falling to the one before; the first, the whole
   * file's, cannot. Where the file has an outline, stretches can be begun at
   * its parts, for the writer to set part by part.
   */
  import X from '@lucide/svelte/icons/x';
  import type { OutlinePart, Stretch } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import { ocrLanguageName } from './languages';
  import { pagesOf } from './stretches';

  interface Props {
    list: Stretch[];
    /** The stretch the picker and the layout edit. */
    current: number;
    pages: number;
    outline: OutlinePart[];
    onselect: (index: number) => void;
    onremove: (index: number) => void;
    /** Stretches begun at the parts of the outline. */
    onoutline: () => void;
  }

  let { list, current, pages, outline, onselect, onremove, onoutline }: Props = $props();

  function said(stretch: Stretch): string {
    const languages = stretch.languages.map((code) => ocrLanguageName(code)).join(', ');
    return stretch.layout
      ? t('ocr-stretch-with-layout', { languages, layout: t(`ocr-how-layout-${stretch.layout}`) })
      : languages || t('ocr-stretch-no-language');
  }
</script>

<div class="stretches" data-ocr-stretches={list.length}>
  {#if list.length > 1}
    <div class="chips" role="listbox" aria-label={t('ocr-stretches')}>
      {#each list as stretch, i (stretch.from)}
        {@const range = pagesOf(list, i, pages)}
        <div class="chip" class:current={i === current}>
          <button
            type="button"
            role="option"
            aria-selected={i === current}
            data-ocr-stretch={stretch.from}
            onclick={() => onselect(i)}
          >
            <span class="pages">
              {range.from === range.to
                ? t('ocr-stretch-page', { page: range.from })
                : t('ocr-stretch-pages', { from: range.from, to: range.to })}
            </span>
            <span class="with">{said(stretch)}</span>
          </button>
          {#if i > 0}
            <button
              type="button"
              class="remove"
              aria-label={t('ocr-stretch-remove', { page: stretch.from })}
              title={t('ocr-stretch-remove', { page: stretch.from })}
              data-ocr-stretch-remove={stretch.from}
              onclick={() => onremove(i)}
            >
              <X size={12} />
            </button>
          {/if}
        </div>
      {/each}
    </div>
    <p class="hint">{t('ocr-stretches-editing')}</p>
  {:else}
    <p class="hint">{t('ocr-stretches-hint')}</p>
  {/if}
  {#if outline.length > 1 && list.length === 1}
    <button type="button" class="link" data-ocr-stretches-outline onclick={onoutline}>
      {t('ocr-stretches-outline', { count: outline.length })}
    </button>
  {/if}
</div>

<style>
  .stretches {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: stretch;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper);
    overflow: hidden;
  }
  .chip.current {
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }
  .chip button {
    margin: 0;
    border: 0;
    background: none;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .chip button:first-child {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    padding: 4px 10px;
    text-align: left;
  }
  .chip.current button:first-child {
    color: var(--ink);
  }
  .pages {
    font-weight: 550;
  }
  .with {
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .remove {
    display: flex;
    align-items: center;
    padding: 0 6px;
    border-left: 1px solid var(--line) !important;
  }
  .remove:hover {
    color: var(--danger);
  }
  .hint {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .link {
    align-self: flex-start;
    margin: 0;
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
</style>
