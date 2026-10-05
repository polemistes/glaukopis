<script lang="ts">
  /**
   * Tesseract among the programs of the settings: where it is, the languages
   * it has data for, those text is read in at first, and how it is read at
   * first (`how.ts`). What to install is said where it is not found.
   */
  import { onMount } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { open as chooseFile } from '@tauri-apps/plugin-dialog';
  import { toolsInfo, type ToolsInfo } from '$lib/api/documents';
  import { languages, t } from '$lib/i18n';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { howFromSettings } from './how';
  import HowControls from './HowControls.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import { byName, ocrLanguageName } from './languages';
  import { reader } from './reader.svelte';

  interface Props {
    /** What the settings found of the programs; nothing while they look. */
    tools: ToolsInfo | null;
    /** Tells the settings what was found when Tesseract was looked for anew. */
    onlooked: (tools: ToolsInfo) => void;
  }

  let { tools, onlooked }: Props = $props();

  let path = $state('');
  let looking = $state(false);

  onMount(async () => {
    while (!settings.loaded) await new Promise((r) => setTimeout(r, 60));
    path = settings.value.tesseractPath ?? '';
  });

  // What the settings found is what there is to read with.
  $effect(() => {
    if (tools) reader.set(tools);
  });

  /** Keeps the path that was written, and says whether it changed. */
  function keep(): boolean {
    const clean = path.trim() || null;
    if ((settings.value.tesseractPath ?? null) === clean) return false;
    settings.set('tesseractPath', clean);
    return true;
  }

  async function lookAgain() {
    looking = true;
    try {
      keep();
      await settings.saveNow();
      onlooked(await toolsInfo(true));
    } catch (error) {
      notifyError(t('ocr-settings-look-failed'), error);
    } finally {
      looking = false;
    }
  }

  async function choose() {
    const chosen = await chooseFile({ title: t('ocr-settings-where'), multiple: false });
    if (typeof chosen !== 'string') return;
    path = chosen;
    await lookAgain();
  }

  const found = $derived(tools?.tesseract ?? null);
  const how = $derived(howFromSettings());
  const installed = $derived(byName(tools?.ocrLanguages ?? []));
  const first = $derived((settings.value.ocrLanguages ?? []).filter((c) => installed.includes(c)));
  /** The languages it reads, in a sentence: "Danish, English and Latin". */
  const listed = $derived(
    new Intl.ListFormat(languages.current, { type: 'conjunction' }).format(
      installed.map((code) => ocrLanguageName(code, true)),
    ),
  );
</script>

<div class="program" data-program="tesseract">
  <div class="state">
    {#if !tools}
      <span class="mark"></span>
    {:else if found}
      <span class="mark ok"><Check size={13} /></span>
    {:else}
      <span class="mark"><TriangleAlert size={13} /></span>
    {/if}
    <div>
      <div class="label">
        Tesseract
        {#if found}<span class="version">{found.version}</span>{/if}
      </div>
      <div class="hint">
        {#if !tools}
          {t('ocr-settings-looking')}
        {:else if found}
          {found.path}
        {:else}
          {t('ocr-settings-missing')}
        {/if}
      </div>
    </div>
  </div>
  <div class="path">
    <TextField
      bind:value={path}
      size="sm"
      placeholder={t('ocr-settings-by-itself')}
      aria-label={t('ocr-settings-where')}
      spellcheck="false"
      disabled={looking}
      onblur={() => keep() && lookAgain()}
    />
    <Button size="sm" disabled={looking} onclick={choose}>{t('common-choose')}</Button>
  </div>
  {#if found}
    <div class="languages">
      <p class="hint">
        {installed.length
          ? t('ocr-settings-has', { languages: listed })
          : t('ocr-settings-has-none')}
      </p>
      {#if installed.length}
        <LanguagePicker
          value={first}
          {installed}
          label={t('ocr-settings-first')}
          hint={t('ocr-settings-first-hint')}
          onchange={(value) => settings.set('ocrLanguages', value)}
        />
      {/if}
    </div>
    <div class="languages" data-ocr-settings-how>
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
  .program {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
  }
  .state {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 20px;
    height: 20px;
    margin-top: 1px;
    border-radius: 50%;
    background: var(--gold-soft);
    color: var(--warn);
  }
  .mark.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .label {
    font-weight: 550;
  }
  .version {
    margin-left: 6px;
    color: var(--ink-3);
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }
  .hint {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .path {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    padding-left: 30px;
  }
  .languages {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-left: 30px;
  }
</style>
