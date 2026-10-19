<script lang="ts">
  /**
   * What is made of a PDF that was read, asked after the reading, when the
   * book's headings are known: the shape of the pages kept or plain
   * paragraphs, a tree by its headings or a part for each page, and marks
   * where the pages begin. Each change makes the tree anew from the reading
   * kept (`ocrAssemble`); the pages are not read again.
   */
  import type { Imported } from '$lib/api/imported';
  import { ocrAssemble, type Making } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';

  interface Props {
    /** The token of the reading kept. */
    kept: string;
    /** How many pages the file has. */
    pages: number;
    /** What was made of the reading: the tree shown now. */
    imported: Imported;
    making?: Making;
    disabled?: boolean;
    /** The tree made anew, with the choices it was made with. */
    onmade: (imported: Imported, making: Making) => void;
  }

  let {
    kept,
    pages,
    imported,
    making = $bindable({ shape: true, structure: 'headings', pageMarks: true }),
    disabled = false,
    onmade,
  }: Props = $props();

  let working = $state(false);

  /**
   * The headings found, counted while the tree is by them: kept when the
   * tree is made otherwise, so that the choice can say how many there are.
   * Where a tree by them was asked for and none were found, the tree is by
   * the pages, and the choice says so.
   */
  let headings = $state<number | null>(null);
  $effect(() => {
    if (!making.shape || making.structure !== 'headings') return;
    if (imported.structured) headings = imported.sections.filter((s) => s.level > 0).length;
    else {
      headings = 0;
      making = { ...making, structure: 'pages' };
    }
  });

  async function change(next: Making) {
    if (working) return;
    const before = making;
    making = next;
    working = true;
    try {
      const made = await ocrAssemble(kept, next);
      onmade(made, next);
    } catch (error) {
      making = before;
      notifyError(t('ocr-made-failed'), error);
    } finally {
      working = false;
    }
  }

  const byHeadings = $derived(
    headings === null ? t('ocr-structure-headings') : t('ocr-made-headings', { count: headings }),
  );
</script>

<fieldset class="made" data-made-of aria-busy={working} disabled={disabled || working}>
  <legend class="overline">
    {t('ocr-made-title')}
    {#if working}<Spinner size={12} />{/if}
  </legend>
  <label class="option">
    <input
      type="checkbox"
      data-made-shape
      checked={making.shape}
      onchange={(e) => change({ ...making, shape: e.currentTarget.checked })}
    />
    <span>
      {t('ocr-shape')}
      <small>{t('ocr-shape-hint')}</small>
    </span>
  </label>
  {#if making.shape}
    <div class="under">
      <div data-made-structure={making.structure}>
        <Segmented
          value={making.structure}
          label={t('ocr-structure')}
          size="sm"
          options={[
            { value: 'headings', label: byHeadings, disabled: headings === 0 },
            { value: 'pages', label: t('ocr-made-pages', { count: pages }) },
          ]}
          onchange={(v: 'headings' | 'pages') => change({ ...making, structure: v })}
        />
      </div>
      <label class="option" class:off={making.structure !== 'headings'}>
        <input
          type="checkbox"
          data-made-page-marks
          checked={making.structure === 'headings' && making.pageMarks}
          disabled={making.structure !== 'headings'}
          onchange={(e) => change({ ...making, pageMarks: e.currentTarget.checked })}
        />
        <span>
          {t('ocr-page-marks')}
          <small>{t('ocr-page-marks-hint')}</small>
        </span>
      </label>
    </div>
  {/if}
</fieldset>

<style>
  .made {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: var(--space-4) 0 var(--space-3);
    padding: 0;
    border: 0;
    min-width: 0;
  }
  legend {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    margin-bottom: 6px;
  }
  .option {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--ink-2);
    cursor: pointer;
  }
  .option.off {
    cursor: default;
    opacity: 0.6;
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
    line-height: 1.45;
  }
  .under {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 24px;
  }
</style>
