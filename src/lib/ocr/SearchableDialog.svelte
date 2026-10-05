<script lang="ts">
  /**
   * A PDF attached to a reference made searchable: its pages without text
   * are read, and the text is laid unseen over them, in a file that takes
   * the place of the one that was stored (ADR 0018). The file is looked at
   * first, the languages asked for, and the pages shown as they are read;
   * Cancel stops the reading, and the stored file is then left as it was.
   * Where all pages are read, the text they have can be taken away, so that
   * only what is read stays.
   */
  import { onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import { isBackendError } from '$lib/api/backend';
  import type { Reference, StoredFile } from '$lib/api/library';
  import {
    ocrLook,
    ocrSearchable,
    ocrStop,
    onProgress,
    type Looked,
    type Progress,
  } from '$lib/api/ocr';
  import { languages, t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyOk } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { howFromSettings } from './how';
  import HowDisclosure from './HowDisclosure.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import { reader } from './reader.svelte';

  interface Props {
    reference: Reference;
    file: StoredFile;
    /** The reference as it is when the file has been replaced. */
    ondone: (reference: Reference) => void;
    onclose: () => void;
  }

  let { reference, file, ondone, onclose }: Props = $props();

  const ticket = newId();
  let phase = $state<'looking' | 'asking' | 'reading' | 'failed'>('looking');
  let looked = $state.raw<Looked | null>(null);
  let chosen = $state<string[]>([]);
  let all = $state(false);
  /** With all pages read: the text they have is taken away, and only what is read stays. */
  let strip = $state(false);
  /** How the pages are read, as the settings say until this reading says otherwise. */
  let how = $state(howFromSettings());
  let progress = $state.raw<Progress | null>(null);
  let failure = $state<string | null>(null);
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
    failure = isBackendError(error)
      ? error.kind === 'missing-program'
        ? t('ocr-no-tesseract')
        : error.message
      : (describeError(error) ?? t('ocr-failed'));
  }

  async function look() {
    try {
      const [found] = await Promise.all([ocrLook(file.path, true), reader.load()]);
      if (gone) return;
      looked = found;
      // The language of the work, where the reference says it.
      const language = reference.fields.langid ?? reference.fields.language ?? null;
      chosen = reader.first(language, languages.current);
      phase = 'asking';
    } catch (error) {
      if (!gone) fail(error);
    }
  }

  async function make() {
    if (phase !== 'asking' || !looked) return;
    phase = 'reading';
    progress = null;
    const stopListening = await onProgress(ticket, (told) => (progress = told));
    try {
      const made = await ocrSearchable(
        reference.id,
        file.path,
        {
          languages: $state.snapshot(chosen),
          all,
          strip: all && strip,
          ...$state.snapshot(how),
        },
        ticket,
      );
      if (gone) return;
      const failed = made.failed.length
        ? t('ocr-searchable-failed', { count: made.failed.length })
        : undefined;
      notifyOk(t('ocr-searchable-done', { count: made.read }), failed);
      ondone(made.reference);
      onclose();
    } catch (error) {
      if (gone) return;
      if (isBackendError(error) && error.kind === 'stopped') phase = 'asking';
      else fail(error);
    } finally {
      stopListening();
    }
  }

  function cancel() {
    if (phase === 'reading') ocrStop(ticket).catch(() => {});
    onclose();
  }

  const without = $derived(looked ? looked.pages - looked.withText : 0);
  const about = $derived.by(() => {
    if (!looked) return '';
    if (without === 0) return t('ocr-searchable-has-text', { pages: looked.pages });
    return t('ocr-searchable-about', { pages: looked.pages, without });
  });
  const ready = $derived(
    phase === 'asking' &&
      !!looked?.searchable &&
      reader.installed &&
      chosen.length > 0 &&
      (without > 0 || all),
  );
</script>

<Dialog open title={t('ocr-searchable-title')} subtitle={file.name} width={520} onclose={cancel}>
  <div class="body" data-ocr={phase}>
    {#if phase === 'looking'}
      <div class="working" aria-live="polite">
        <Spinner size={18} />
        <div class="doing">{t('ocr-looking', { file: file.name })}</div>
      </div>
    {:else if phase === 'asking' && looked}
      {#if !looked.searchable}
        <p class="failure selectable" role="alert">
          <CircleAlert size={15} />
          <span>{looked.locked ? t('ocr-searchable-locked') : t('ocr-searchable-damaged')}</span>
        </p>
      {:else}
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
        {#if looked.withText > 0 && reader.installed}
          <label class="check">
            <input type="checkbox" data-choice="all" bind:checked={all} />
            {t('ocr-read-all')}
          </label>
          {#if all}
            {#if !strip}<p class="hint">{t('ocr-read-all-hint')}</p>{/if}
            <label class="check">
              <input type="checkbox" data-choice="strip" bind:checked={strip} />
              {t('ocr-strip')}
            </label>
            {#if strip}<p class="hint">{t('ocr-strip-hint')}</p>{/if}
          {/if}
        {/if}
        {#if reader.installed}
          <HowDisclosure bind:value={how} />
        {/if}
      {/if}
    {:else if phase === 'reading'}
      <div class="working" aria-live="polite">
        <Spinner size={18} />
        <div class="doing">
          {#if progress}
            {t('ocr-reading-pages', { done: progress.done, total: progress.total })}
          {:else}
            {t('ocr-reading', { file: file.name })}
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

  {#snippet footer()}
    <Button variant="ghost" onclick={cancel}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={!ready} onclick={make} data-ocr-make>
      {t('ocr-searchable-make')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 90px;
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
    line-height: 1.45;
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
