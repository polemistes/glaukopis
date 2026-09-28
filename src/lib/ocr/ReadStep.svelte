<script lang="ts">
  /**
   * A PDF or a picture read to become a map, in the dialog of documents
   * brought in (`documents/DocumentDialog.svelte`): the file is looked at,
   * the languages are asked for where there are pages without text, and the
   * pages are shown as they are read. Where every page has text, it is read
   * at once. What is read is handed to the dialog, which makes the map.
   *
   * Leaving the dialog stops the reading.
   */
  import { onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import ScanText from '@lucide/svelte/icons/scan-text';
  import { isBackendError } from '$lib/api/backend';
  import type { Imported } from '$lib/api/imported';
  import { ocrLook, ocrRead, ocrStop, onProgress, type Looked, type Progress } from '$lib/api/ocr';
  import { languages, newTextLanguage, t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import LanguagePicker from './LanguagePicker.svelte';
  import { reader } from './reader.svelte';

  interface Props {
    path: string;
    /** What was read. */
    onread: (imported: Imported) => void;
  }

  let { path, onread }: Props = $props();

  // svelte-ignore state_referenced_locally
  const file = path.split(/[\\/]/).pop() ?? path;
  const ticket = newId();

  let phase = $state<'looking' | 'asking' | 'reading' | 'failed'>('looking');
  let looked = $state.raw<Looked | null>(null);
  let chosen = $state<string[]>([]);
  let all = $state(false);
  let progress = $state.raw<Progress | null>(null);
  let failure = $state<string | null>(null);
  /** The dialog was left: what comes back is not wanted. */
  let gone = false;

  onMount(() => {
    void look();
    return () => {
      gone = true;
      if (phase === 'reading') ocrStop(ticket).catch(() => {});
    };
  });

  function fail(error: unknown) {
    phase = 'failed';
    failure =
      isBackendError(error) && error.kind === 'missing-program'
        ? t('ocr-no-tesseract')
        : (describeError(error) ?? t('ocr-failed'));
  }

  async function look() {
    try {
      const [found] = await Promise.all([ocrLook(path), reader.load()]);
      if (gone) return;
      looked = found;
      chosen = reader.first(newTextLanguage(), languages.current);
      // Where every page has text, nothing is asked.
      if (!found.picture && found.withText === found.pages) void read();
      else phase = 'asking';
    } catch (error) {
      if (!gone) fail(error);
    }
  }

  async function read() {
    if (phase === 'reading') return;
    phase = 'reading';
    progress = null;
    const stopListening = await onProgress(ticket, (told) => (progress = told));
    try {
      const imported = await ocrRead(path, { languages: $state.snapshot(chosen), all }, ticket);
      if (!gone) onread(imported);
    } catch (error) {
      if (gone) return;
      if (isBackendError(error) && error.kind === 'stopped') phase = 'asking';
      else fail(error);
    } finally {
      stopListening();
    }
  }

  const without = $derived(looked ? looked.pages - looked.withText : 0);
  /** Whether anything can be read: Tesseract is there, or some pages have text. */
  const readable = $derived(
    !!looked &&
      (reader.installed ? chosen.length > 0 : !looked.picture && looked.withText > 0 && !all),
  );
  const about = $derived.by(() => {
    if (!looked) return '';
    if (looked.picture) return t('ocr-about-picture');
    if (looked.withText === 0) return t('ocr-about-scan', { pages: looked.pages });
    return t('ocr-about-some', { pages: looked.pages, without });
  });
</script>

<div class="step" data-ocr={phase}>
  {#if phase === 'looking'}
    <div class="working" aria-live="polite">
      <Spinner size={18} />
      <div class="doing">{t('ocr-looking', { file })}</div>
    </div>
  {:else if phase === 'asking' && looked}
    <p class="about">{about}</p>
    {#if reader.installed}
      <LanguagePicker
        value={chosen}
        installed={reader.languages}
        label={t('ocr-languages')}
        hint={t('ocr-languages-hint')}
        onchange={(value) => (chosen = value)}
      />
    {:else}
      <p class="failure selectable" role="alert">
        <CircleAlert size={15} /> <span>{t('ocr-no-tesseract')}</span>
      </p>
    {/if}
    {#if looked.withText > 0 && without > 0 && reader.installed}
      <label class="check">
        <input type="checkbox" data-choice="all" bind:checked={all} />
        {t('ocr-read-all')}
      </label>
    {/if}
    <div class="go">
      <Button variant="primary" disabled={!readable} onclick={read} data-ocr-read>
        {#snippet icon()}<ScanText size={14} />{/snippet}
        {reader.installed ? t('ocr-read') : t('ocr-read-text-pages')}
      </Button>
    </div>
  {:else if phase === 'reading'}
    <div class="working" aria-live="polite">
      <Spinner size={18} />
      <div class="doing">
        {#if progress}
          {t('ocr-reading-pages', { done: progress.done, total: progress.total })}
        {:else}
          {t('ocr-reading', { file })}
        {/if}
      </div>
    </div>
    {#if progress && progress.total > 1}
      <progress class="bar" max={progress.total} value={progress.done}></progress>
    {/if}
    <p class="hint">{t('ocr-reading-hint')}</p>
  {:else if phase === 'failed'}
    <p class="failure selectable" role="alert">
      <CircleAlert size={15} /> <span>{failure}</span>
    </p>
  {/if}
</div>

<style>
  .step {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 96px;
  }
  .working {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 40px;
  }
  .doing {
    font-weight: 550;
  }
  .about {
    margin: 0;
    color: var(--ink-2);
    line-height: 1.5;
  }
  .hint {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .bar {
    width: 100%;
    height: 6px;
    accent-color: var(--accent);
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
  .go {
    display: flex;
  }
  .failure {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
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
