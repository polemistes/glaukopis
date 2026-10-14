<script lang="ts">
  /**
   * What becomes of the text a PDF has, where it has any: kept, with only the
   * pages without text read; or disregarded, every page read anew in its
   * place. The same choice wherever a PDF is read (ADR 0018, addendum of
   * 2026-10-15). What the text says is shown first, and where it does not
   * read as text, that is said, and reading anew is chosen at first.
   */
  import type { Looked } from '$lib/api/ocr';
  import { t } from '$lib/i18n';

  interface Props {
    looked: Looked;
    /** Whether every page is read anew, in place of the text the PDF has. */
    anew: boolean;
    /** For a PDF made searchable, where reading anew takes away the unseen text. */
    searchable?: boolean;
  }

  let { looked, anew = $bindable(), searchable = false }: Props = $props();

  const name = `ocr-text-${Math.random().toString(36).slice(2)}`;
</script>

<fieldset class="choice" data-text-choice>
  <legend>{t('ocr-text-title')}</legend>
  {#if looked.poor > 0}
    <p class="poor" data-text-poor>
      {t(looked.poor >= looked.withText ? 'ocr-text-poor-all' : 'ocr-text-poor', {
        poor: looked.poor,
        pages: looked.withText,
      })}
    </p>
  {/if}
  {#if looked.sample}
    <figure class="sample">
      <figcaption>{t('ocr-text-sample', { page: looked.sample.page })}</figcaption>
      <blockquote class="selectable" data-text-sample>
        {#each looked.sample.lines as line, i (i)}<span>{line}</span>{/each}
      </blockquote>
    </figure>
  {/if}
  <label class="option">
    <input type="radio" {name} data-choice="keep" checked={!anew} onchange={() => (anew = false)} />
    <span>
      {t('ocr-text-keep')}
      <small>{t(searchable ? 'ocr-text-keep-searchable-hint' : 'ocr-text-keep-hint')}</small>
    </span>
  </label>
  <label class="option">
    <input type="radio" {name} data-choice="anew" checked={anew} onchange={() => (anew = true)} />
    <span>
      {t('ocr-text-anew')}
      <small>{t(searchable ? 'ocr-text-anew-searchable-hint' : 'ocr-text-anew-hint')}</small>
    </span>
  </label>
</fieldset>

<style>
  .choice {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  legend {
    padding: 0;
    margin-bottom: var(--space-2);
    font-weight: 550;
    color: var(--ink);
  }
  .poor {
    margin: 0;
    padding: 8px 10px;
    border-radius: var(--radius-m);
    background: var(--gold-soft);
    color: var(--ink);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .sample {
    margin: 0;
  }
  figcaption {
    font-size: var(--text-sm);
    color: var(--ink-3);
    margin-bottom: 4px;
  }
  blockquote {
    margin: 0;
    padding: 6px 10px;
    border-left: 2px solid var(--line-strong, var(--line));
    background: var(--paper-sunken);
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.45;
    display: flex;
    flex-direction: column;
    overflow-wrap: anywhere;
  }
  .option {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--ink-2);
    cursor: pointer;
  }
  .option input {
    accent-color: var(--accent);
    margin: 3px 0 0;
  }
  .option span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  small {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
</style>
