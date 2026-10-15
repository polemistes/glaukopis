<script lang="ts">
  /**
   * OCR, under the languages of the settings: the languages text is read in
   * at first, those Tesseract has, of the system or imported, the importing
   * of more, and how text is read at first (`how.ts`). Where Tesseract is,
   * is said among the programs (`OcrSettings.svelte`).
   */
  import { onMount } from 'svelte';
  import { toolsInfo, type ToolsInfo } from '$lib/api/documents';
  import { languagesInstalled, languagesRemove } from '$lib/api/languages';
  import { languages, t } from '$lib/i18n';
  import LanguagePackages from '$lib/languages/LanguagePackages.svelte';
  import LanguageRows, { type LanguageRow } from '$lib/languages/LanguageRows.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { howFromSettings } from './how';
  import HowControls from './HowControls.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import { byName, ocrLanguageName } from './languages';

  interface Props {
    /** What the settings found of the programs; nothing while they look. */
    tools: ToolsInfo | null;
    /** Tells the settings what was found when Tesseract was looked for anew. */
    onlooked: (tools: ToolsInfo) => void;
  }

  let { tools, onlooked }: Props = $props();

  /** Tesseract's names of the languages that are imported. */
  let imported = $state.raw<string[]>([]);
  let busy = $state(false);

  async function loadImported() {
    try {
      imported = (await languagesInstalled()).filter((l) => l.kind === 'ocr').map((l) => l.name);
    } catch (error) {
      notifyError(t('packages-list-failed'), error);
    }
  }

  onMount(loadImported);

  async function lookAgain() {
    await loadImported();
    try {
      onlooked(await toolsInfo(true));
    } catch (error) {
      notifyError(t('ocr-settings-look-failed'), error);
    }
  }

  const found = $derived(tools?.tesseract ?? null);
  const how = $derived(howFromSettings());
  const installed = $derived(byName(tools?.ocrLanguages ?? []));
  const first = $derived((settings.value.ocrLanguages ?? []).filter((c) => installed.includes(c)));

  const rows = $derived<LanguageRow[]>(
    [...new Set([...installed, ...imported])]
      .map((code) => ({
        id: code,
        name: ocrLanguageName(code),
        source: imported.includes(code) ? t('ocr-source-imported') : t('ocr-source-system'),
        imported: imported.includes(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, languages.current)),
  );

  async function remove(row: LanguageRow) {
    busy = true;
    try {
      await languagesRemove('ocr', row.id);
      await lookAgain();
    } catch (error) {
      notifyError(t('packages-remove-failed', { name: row.name }), error);
    } finally {
      busy = false;
    }
  }
</script>

<div class="part" data-ocr-settings>
  <h3>{t('ocr-settings-title')}</h3>
  {#if tools && !found}
    <p class="about">{t('ocr-settings-not-found')}</p>
  {:else if found}
    {#if installed.length}
      <LanguagePicker
        value={first}
        {installed}
        label={t('ocr-settings-first')}
        onchange={(value) => settings.set('ocrLanguages', value)}
      />
    {/if}
    <div data-ocr-languages>
      <div class="label">{t('ocr-settings-languages')}</div>
      <div class="hint">{t('ocr-settings-languages-hint')}</div>
      {#if rows.length}
        <LanguageRows {rows} {busy} onremove={remove} />
      {:else}
        <p class="hint">{t('ocr-settings-has-none')}</p>
      {/if}
    </div>
    <LanguagePackages kind="ocr" onchanged={lookAgain} />
    <div class="how" data-ocr-settings-how>
      <div class="label">{t('ocr-settings-how')}</div>
      <HowControls
        value={how}
        hint
        onchange={(value) => {
          settings.set('ocrDpi', value.dpi);
          settings.set('ocrLayout', value.layout);
          settings.set('ocrContrast', value.contrast);
        }}
      />
    </div>
  {/if}
</div>

<style>
  .part {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  h3 {
    font-family: var(--font-text);
    font-size: var(--text-lg);
    font-weight: 600;
  }
  .about {
    margin-top: -8px;
    color: var(--ink-2);
    line-height: 1.5;
  }
  .label {
    font-weight: 550;
  }
  .hint {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .how {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
</style>
