<script lang="ts">
  /**
   * A PDF or a picture read to become a map, in the dialog of documents
   * brought in (`documents/DocumentDialog.svelte`): the file is looked at,
   * and the workbench of a reading (`Workbench.svelte`) shows its pages, what
   * each takes, and the page in view, to be tried; the dialog's button reads
   * it (`action`). The pages are shown as they are read. What is read is
   * handed to the dialog, which makes the map. Also for a PDF of the library
   * (`PdfMapDialog.svelte`), by its path in the store.
   *
   * The workbench stays while the pages are read, so that a reading stopped
   * or failed comes back to it as it was, with its trials and its marks.
   * Leaving the dialog stops the reading.
   */
  import { onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import { isBackendError } from '$lib/api/backend';
  import type { Imported } from '$lib/api/imported';
  import { ocrLook, ocrRead, ocrStop, onProgress, type Looked, type Progress } from '$lib/api/ocr';
  import { languages, newTextLanguage, t } from '$lib/i18n';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { reader } from './reader.svelte';
  import Workbench, { type WorkbenchState } from './Workbench.svelte';

  interface Props {
    path: string;
    /** Whether the path is one of the library, in the store. */
    stored?: boolean;
    /** What the file is called, where its path does not say. */
    name?: string;
    /**
     * What was read; for a PDF, the token of the reading kept, by which what
     * is made of it is made anew (`MadeOf.svelte`), and how many pages it has.
     */
    onread: (imported: Imported, kept?: string | null, pages?: number) => void;
    /** Whether the workbench is shown, its summary or its pages. */
    showing?: boolean;
    /** Whether its pages are open, to be looked at and tried: the dialog is wide and tall for them. */
    pages?: boolean;
    /** What the dialog's main button does while the workbench is shown: nothing otherwise. */
    action?: { label: string; enabled: boolean; run: () => void } | null;
  }

  let {
    path,
    stored = false,
    name,
    onread,
    showing = $bindable(false),
    pages = $bindable(false),
    action = $bindable(null),
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  const file = name ?? path.split(/[\\/]/).pop() ?? path;
  const ticket = newId();

  let phase = $state<'looking' | 'asking' | 'reading' | 'failed'>('looking');
  let looked = $state.raw<Looked | null>(null);
  /** The languages read with at first. */
  let first = $state<string[]>([]);
  let status = $state.raw<WorkbenchState | undefined>(undefined);
  let view = $state<'summary' | 'pages'>('summary');
  let progress = $state.raw<Progress | null>(null);
  /** Why the file could not be looked at: the end of the dialog's work. */
  let failure = $state<string | null>(null);
  /** Why the last reading failed, said over the workbench, which stays to read again. */
  let readFailure = $state<string | null>(null);
  /** The dialog was left: what comes back is not wanted. */
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
    return isBackendError(error) && error.kind === 'missing-program'
      ? t('ocr-no-tesseract')
      : (describeError(error) ?? t('ocr-failed'));
  }

  async function look() {
    try {
      const [found] = await Promise.all([ocrLook(path, stored), reader.load()]);
      if (gone) return;
      looked = found;
      first = reader.first(newTextLanguage(), languages.current);
      phase = 'asking';
    } catch (error) {
      if (gone) return;
      phase = 'failed';
      failure = said(error);
    }
  }

  async function read() {
    if (phase !== 'asking' || !status?.ready) return;
    const asked = $state.snapshot(status.asked);
    phase = 'reading';
    progress = null;
    readFailure = null;
    const stopListening = await onProgress(ticket, (told) => (progress = told));
    try {
      const done = await ocrRead(path, asked, ticket, stored);
      if (!gone) onread(done.imported, done.kept, looked?.pages ?? 0);
    } catch (error) {
      if (gone) return;
      phase = 'asking';
      if (!(isBackendError(error) && error.kind === 'stopped')) readFailure = said(error);
    } finally {
      stopListening();
    }
  }

  $effect(() => {
    showing = phase === 'asking' && !!looked;
    pages = showing && view === 'pages';
  });
  $effect(() => {
    action =
      phase === 'asking' && status
        ? { label: status.label, enabled: status.ready, run: () => void read() }
        : null;
  });
</script>

<div class="step" class:bench={!!looked && phase !== 'failed'} data-ocr={phase}>
  {#if phase === 'looking'}
    <div class="working" aria-live="polite">
      <Spinner size={18} />
      <div class="doing">{t('ocr-looking', { file })}</div>
    </div>
  {:else if phase === 'failed'}
    <p class="failure selectable" role="alert">
      <CircleAlert size={15} /> <span>{failure}</span>
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
            {t('ocr-reading', { file })}
          {/if}
        </div>
      </div>
      {#if progress && progress.total > 1}
        <progress class="bar" max={progress.total} value={progress.done}></progress>
      {/if}
      <p class="hint">{t('ocr-reading-hint')}</p>
    </div>
  {/if}
  {#if looked && phase !== 'failed' && phase !== 'looking'}
    {#if readFailure && phase === 'asking'}
      <p class="failure selectable read-failed" role="alert" data-ocr-read-failed>
        <CircleAlert size={15} /> <span>{readFailure}</span>
      </p>
    {/if}
    <div class="holder" hidden={phase !== 'asking'}>
      <Workbench {path} {stored} {looked} mode="tree" {first} bind:status bind:view />
    </div>
  {/if}
</div>

<style>
  .step {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 96px;
  }
  .step.bench {
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
  .read-failed {
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
