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
    type TextChoice,
  } from '$lib/api/ocr';
  import { languages, t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyOk } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { firstTextChoice, howFromSettings, latinWithGreek } from './how';
  import { ocrLanguageName } from './languages';
  import HowDisclosure from './HowDisclosure.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import { reader } from './reader.svelte';
  import TextPart from './TextPart.svelte';
  import TextPreview from './TextPreview.svelte';

  interface Props {
    /** The reference the file is made searchable from, where it is: its language is the first guess. */
    reference?: Reference | null;
    file: StoredFile;
    /** The file as it is when it has been replaced, and the reference with it, where one was given. */
    ondone: (file: StoredFile, reference: Reference | null) => void;
    onclose: () => void;
  }

  let { reference = null, file, ondone, onclose }: Props = $props();

  const ticket = newId();
  let phase = $state<'looking' | 'asking' | 'reading' | 'failed'>('looking');
  let looked = $state.raw<Looked | null>(null);
  let chosen = $state<string[]>([]);
  /** What becomes of the text the PDF has. */
  let text = $state<TextChoice>('keep');
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
      text = firstTextChoice(found);
      // The language of the work, where the reference says it.
      const language = reference?.fields.langid ?? reference?.fields.language ?? null;
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
        reference?.id ?? null,
        file.path,
        {
          languages: $state.snapshot(chosen),
          text,
          shape: false,
          ...$state.snapshot(how),
        },
        ticket,
      );
      if (gone) return;
      const failed = made.failed.length
        ? t('ocr-searchable-failed', { count: made.failed.length })
        : undefined;
      if (made.remapped > 0 && made.read === 0) {
        notifyOk(t('ocr-searchable-readable-done', { count: made.remapped }), failed);
      } else {
        notifyOk(t('ocr-searchable-done', { count: made.read }), failed);
      }
      ondone(made.file, made.reference);
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
    if (text === 'anew') return t('ocr-searchable-anew', { pages: looked.pages });
    if (text === 'translate') return t('ocr-searchable-translate', { without });
    if (without === 0) return t('ocr-searchable-has-text', { pages: looked.pages });
    return t('ocr-searchable-about', { pages: looked.pages, without });
  });
  /** Whether Tesseract is to read pages: those without text, or all where all are to be read anew. */
  const scanning = $derived(!!looked && (without > 0 || text === 'anew'));
  const ready = $derived(
    phase === 'asking' &&
      !!looked?.searchable &&
      (text === 'translate' || scanning) &&
      (!scanning || (reader.installed && chosen.length > 0)),
  );
  const latin = $derived(scanning ? latinWithGreek(chosen) : []);
  /** Room for the preview of the text the PDF has. */
  const wide = $derived(!!looked?.searchable && looked.withText > 0);
</script>

<Dialog
  open
  title={t('ocr-searchable-title')}
  subtitle={file.name}
  width={wide && phase === 'asking' ? 960 : 520}
  onclose={cancel}
>
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
        <div class="asking" class:split={wide}>
          <div class="side">
            <p class="about">{about}</p>
            {#if looked.withText > 0}
              <TextPart {looked} bind:choice={text} searchable canRead={reader.installed} />
            {/if}
            {#if scanning && reader.installed}
              <LanguagePicker
                value={chosen}
                installed={reader.languages}
                label={t('ocr-languages')}
                hint={t('ocr-languages-hint')}
                onchange={(value) => (chosen = value)}
              />
              {#if latin.length}
                <p class="warn" data-greek-with-latin>
                  {t('ocr-languages-greek-with-latin', {
                    languages: latin.map((l) => ocrLanguageName(l, true)).join(', '),
                  })}
                </p>
              {/if}
              <HowDisclosure bind:value={how} />
            {:else if scanning}
              <p class="failure selectable" role="alert">
                <CircleAlert size={15} /> <span>{t('ocr-no-tesseract')}</span>
              </p>
            {/if}
          </div>
          {#if wide}
            <TextPreview
              path={file.path}
              stored
              pages={looked.pages}
              translated={text === 'translate'}
            />
          {/if}
        </div>
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
      {text === 'translate' && !scanning
        ? t('ocr-searchable-make-readable')
        : t('ocr-searchable-make')}
    </Button>
  {/snippet}
</Dialog>

<style>
  .asking,
  .side {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 0;
  }
  /* The choices at the left, the text the PDF has beside them. */
  .asking.split {
    display: grid;
    grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
    align-items: start;
    gap: var(--space-4, 20px);
  }
  @media (max-width: 760px) {
    .asking.split {
      grid-template-columns: minmax(0, 1fr);
    }
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
