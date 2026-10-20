<script lang="ts">
  /**
   * A PDF attached to a reference made searchable: the pages marked to be
   * read are read, and the text is laid unseen over them, in a file that
   * takes the place of the one that was stored (ADR 0018). The file is
   * looked at first, and the workbench of a reading (`Workbench.svelte`)
   * shows its pages, what each gets, and the page in view, to be tried; a
   * page that is read loses the unseen text it had, and the others keep
   * theirs. Where the text keeps its letters in a way that can be
   * translated, the PDF's own tables are put right. Cancel stops the
   * reading, and the stored file is then left as it was.
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
  import { stretchesOf } from './how';
  import { reader } from './reader.svelte';
  import Workbench, { type WorkbenchState } from './Workbench.svelte';

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
  /** The languages read with at first. */
  let first = $state<string[]>([]);
  let status = $state.raw<WorkbenchState | undefined>(undefined);
  /** The summary, or the pages, opened to be looked at and tried. */
  let view = $state<'summary' | 'pages'>('summary');
  let progress = $state.raw<Progress | null>(null);
  let failure = $state<string | null>(null);
  /** Why the last attempt failed, said over the workbench, which stays to try again. */
  let madeFailure = $state<string | null>(null);
  let gone = false;

  onMount(() => {
    void look();
    return () => {
      gone = true;
      if (phase === 'reading')
        ocrStop(ticket).catch((error) => console.error('the reading could not be stopped', error));
    };
  });

  function said(error: unknown): string {
    return isBackendError(error)
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
      const language = reference?.fields.langid ?? reference?.fields.language ?? null;
      first = reader.first(language, languages.current);
      phase = 'asking';
    } catch (error) {
      if (gone) return;
      phase = 'failed';
      failure = said(error);
    }
  }

  async function make() {
    if (phase !== 'asking' || !status?.ready) return;
    const asked = $state.snapshot(status.asked);
    phase = 'reading';
    progress = null;
    madeFailure = null;
    const stopListening = await onProgress(ticket, (told) => (progress = told));
    try {
      const made = await ocrSearchable(reference?.id ?? null, file.path, asked, ticket);
      if (gone) return;
      const told = [
        made.failed.length ? t('ocr-searchable-failed', { count: made.failed.length }) : '',
        made.poorly.length
          ? t('ocr-searchable-poorly', {
              count: made.poorly.length,
              pages: stretchesOf(made.poorly),
            })
          : '',
      ].filter(Boolean);
      const detail = told.length ? told.join(' ') : undefined;
      if (made.remapped > 0 && made.read === 0) {
        notifyOk(t('ocr-searchable-readable-done', { count: made.remapped }), detail);
      } else {
        notifyOk(t('ocr-searchable-done', { count: made.read }), detail);
      }
      ondone(made.file, made.reference);
      onclose();
    } catch (error) {
      if (gone) return;
      phase = 'asking';
      if (!(isBackendError(error) && error.kind === 'stopped')) madeFailure = said(error);
    } finally {
      stopListening();
    }
  }

  function cancel() {
    if (phase === 'reading')
      ocrStop(ticket).catch((error) => console.error('the reading could not be stopped', error));
    onclose();
  }

  /** Whether the workbench is shown: the dialog is wide and tall for it. */
  const bench = $derived(phase === 'asking' && !!looked?.searchable);
  const pagesOpen = $derived(bench && view === 'pages');
</script>

<Dialog
  open
  title={t('ocr-searchable-title')}
  subtitle={file.name}
  width={bench ? (pagesOpen ? 1240 : 640) : 520}
  tall={pagesOpen}
  inline={pagesOpen}
  padded={!bench}
  onclose={cancel}
>
  <div class="body" class:bench={!!looked?.searchable && phase !== 'failed'} data-ocr={phase}>
    {#if phase === 'looking'}
      <div class="working" aria-live="polite">
        <Spinner size={18} />
        <div class="doing">{t('ocr-looking', { file: file.name })}</div>
      </div>
    {:else if phase === 'failed'}
      <p class="failure selectable" role="alert">
        <CircleAlert size={15} /> <span>{failure}</span>
      </p>
    {:else if looked && !looked.searchable}
      <p class="failure selectable" role="alert">
        <CircleAlert size={15} />
        <span>{looked.locked ? t('ocr-searchable-locked') : t('ocr-searchable-damaged')}</span>
      </p>
    {/if}
    {#if phase === 'reading'}
      <div class="reading">
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
      </div>
    {/if}
    {#if looked?.searchable && (phase === 'asking' || phase === 'reading')}
      {#if madeFailure && phase === 'asking'}
        <p class="failure selectable made-failed" role="alert" data-ocr-made-failed>
          <CircleAlert size={15} /> <span>{madeFailure}</span>
        </p>
      {/if}
      <div class="holder" hidden={phase !== 'asking'}>
        <Workbench
          path={file.path}
          stored
          {looked}
          mode="searchable"
          {first}
          bind:status
          bind:view
        />
      </div>
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={cancel}>{t('common-cancel')}</Button>
    {#if looked?.searchable && phase !== 'failed'}
      <Button
        variant="primary"
        disabled={phase !== 'asking' || !status?.ready}
        onclick={make}
        data-ocr-make
      >
        {status?.label ?? t('ocr-searchable-make')}
      </Button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 90px;
  }
  .body.bench {
    height: 100%;
    min-height: 0;
    gap: 0;
  }
  .holder {
    flex: 1 1 auto;
    min-height: 0;
  }
  .holder[hidden] {
    display: none;
  }
  .reading {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
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
  .made-failed {
    margin: var(--space-3) var(--space-4) 0;
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
