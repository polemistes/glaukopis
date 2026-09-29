<script lang="ts">
  /**
   * The languages a text is read in, the likeliest first: each chosen one
   * can be taken away, and another added from those Tesseract has.
   */
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import { ocrLanguageName } from './languages';

  interface Props {
    /** Tesseract's names of the languages chosen, in order. */
    value: string[];
    /** Those Tesseract has, in the order they are offered. */
    installed: string[];
    label?: string;
    hint?: string;
    disabled?: boolean;
    onchange: (value: string[]) => void;
  }

  let { value, installed, label, hint, disabled = false, onchange }: Props = $props();

  const uid = $props.id();
  const others = $derived(installed.filter((code) => !value.includes(code)));
</script>

<div class="picker" data-languages>
  {#if label}<label class="label" for="add-{uid}">{label}</label>{/if}
  <div class="chosen">
    {#each value as code (code)}
      <span class="chip" data-language={code}>
        {ocrLanguageName(code)}
        <button
          type="button"
          aria-label={t('ocr-language-remove', { language: ocrLanguageName(code) })}
          {disabled}
          onclick={() => onchange(value.filter((c) => c !== code))}
        >
          <X size={11} />
        </button>
      </span>
    {/each}
    {#if others.length}
      <select
        id="add-{uid}"
        class="add"
        {disabled}
        aria-label={t('ocr-language-add')}
        value=""
        onchange={(e) => {
          const code = e.currentTarget.value;
          e.currentTarget.value = '';
          if (code) onchange([...value, code]);
        }}
      >
        <option value="" disabled>{t('ocr-language-add')}</option>
        {#each others as code (code)}
          <option value={code}>{ocrLanguageName(code)}</option>
        {/each}
      </select>
    {/if}
  </div>
  {#if hint}<p class="hint">{hint}</p>{/if}
</div>

<style>
  .picker {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--ink-2);
  }
  .chosen {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 24px;
    padding: 0 4px 0 9px;
    border-radius: 12px;
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-size: var(--text-sm);
  }
  .chip button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: inherit;
    cursor: pointer;
  }
  .chip button:hover:not(:disabled) {
    background: var(--paper-raised);
  }
  .add {
    height: 26px;
    max-width: 220px;
    padding: 0 6px;
    border: 1px dashed var(--line-strong);
    border-radius: 12px;
    background: transparent;
    color: var(--ink-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .add:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .hint {
    margin: 0;
    color: var(--ink-3);
    font-size: var(--text-xs);
    line-height: 1.45;
  }
</style>
