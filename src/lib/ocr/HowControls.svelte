<script lang="ts">
  /**
   * The three choices of how text is read (`how.ts`): the resolution, the
   * layout of the page, and black and white. In the settings, for how it is
   * read at first; in the dialogs that read, under a disclosure, for one
   * reading. The hint says what to try when a reading goes badly.
   */
  import type { How, Layout } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Select from '$lib/ui/Select.svelte';
  import { DPIS, shownDpi } from './how';

  interface Props {
    value: How;
    onchange: (how: How) => void;
    /** Whether what to try when a reading goes badly is said. */
    hint?: boolean;
  }

  let { value, onchange, hint = false }: Props = $props();

  const layouts: { value: Layout; label: string }[] = $derived([
    { value: '', label: t('ocr-how-layout-auto') },
    { value: 'column', label: t('ocr-how-layout-column') },
    { value: 'block', label: t('ocr-how-layout-block') },
    { value: 'sparse', label: t('ocr-how-layout-sparse') },
  ]);
</script>

<div class="how">
  <div class="field" data-ocr-dpi>
    <span class="label">{t('ocr-how-dpi')}</span>
    <Segmented
      value={String(shownDpi(value.dpi))}
      label={t('ocr-how-dpi')}
      size="sm"
      options={DPIS.map((dpi) => ({ value: String(dpi), label: String(dpi) }))}
      onchange={(dpi) => onchange({ ...value, dpi: Number(dpi) })}
    />
  </div>
  <div data-ocr-layout>
    <Select
      value={value.layout}
      label={t('ocr-how-layout')}
      size="sm"
      options={layouts}
      onchange={(layout) => onchange({ ...value, layout })}
    />
  </div>
  <label class="check">
    <input
      type="checkbox"
      data-choice="contrast"
      checked={value.contrast}
      onchange={(e) => onchange({ ...value, contrast: e.currentTarget.checked })}
    />
    {t('ocr-how-contrast')}
  </label>
  {#if hint}<p class="hint">{t('ocr-how-hint')}</p>{/if}
</div>

<style>
  .how {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
  .label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--ink-2);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--ink-2);
    cursor: pointer;
  }
  .check input {
    accent-color: var(--accent);
    margin: 0;
  }
  .hint {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
    line-height: 1.5;
  }
</style>
