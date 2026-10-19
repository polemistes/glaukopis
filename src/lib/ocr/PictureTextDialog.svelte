<script lang="ts">
  /**
   * The text of a picture of the store, read by Tesseract (ADR 0018): shown,
   * to be copied, or, where the picture is looked at in a project, made an
   * element of under the element in view, named after the picture, with the
   * text as its text. Also of a picture that is a file of the library, which
   * is read from the library's store as a PDF of it is (`ReadStep.svelte`).
   */
  import { onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import Copy from '@lucide/svelte/icons/copy';
  import Network from '@lucide/svelte/icons/network';
  import { isBackendError } from '$lib/api/backend';
  import type { Imported } from '$lib/api/imported';
  import type { StoredFile } from '$lib/api/library';
  import { ocrPicture, ocrStop } from '$lib/api/ocr';
  import { languages, newTextLanguage, t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import { makeImported } from '$lib/project/model/import';
  import { PROJECT } from '$lib/project/model/types';
  import { inlineText } from '$lib/project/model/text';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { howFromSettings } from './how';
  import LanguagePicker from './LanguagePicker.svelte';
  import { reader } from './reader.svelte';
  import ReadStep from './ReadStep.svelte';

  interface Props {
    /** The picture of the store of pictures, by its hash. */
    hash?: string;
    /** What the picture is called. */
    name?: string;
    /** Or a picture that is a file of the library, read from its store. */
    file?: StoredFile;
    /** The project the picture is looked at in, where it is, and the element in view in it. */
    project?: Project | null;
    at?: string | null;
    /** Asks for the element that was made to be entered. */
    onenter?: (id: string) => void;
    onclose: () => void;
  }

  let { hash, name: called, file, project = null, at = null, onenter, onclose }: Props = $props();

  const name = $derived(called ?? file?.name ?? '');

  const ticket = newId();
  let phase = $state<'asking' | 'reading' | 'shown' | 'failed'>('asking');
  let chosen = $state<string[]>([]);
  let read = $state.raw<Imported | null>(null);
  let failure = $state<string | null>(null);
  let gone = false;
  /** Whether the reading step of a file of the library shows the workbench: the dialog is wide and tall for it. */
  let showing = $state(false);
  let action = $state<{ label: string; enabled: boolean; run: () => void } | null>(null);
  const bench = $derived(showing && phase === 'asking' && !!file);

  onMount(() => {
    // The language the text is written in where the picture is looked at, as far as the elements say.
    const written = project ? project.documentOf(at ?? PROJECT).settings.language : undefined;
    void reader.load().then(() => {
      if (!gone) chosen = reader.first(written ?? newTextLanguage(), languages.current);
    });
    return () => {
      gone = true;
      if (phase === 'reading')
        ocrStop(ticket).catch((error) => console.error('the reading could not be stopped', error));
    };
  });

  /** The text as it was read: paragraphs apart by an empty line. */
  const text = $derived(
    read?.sections
      .flatMap((s) => s.blocks)
      .map((b) => (b.kind === 'paragraph' ? inlineText(b.content) : ''))
      .filter(Boolean)
      .join('\n\n') ?? '',
  );

  async function readIt() {
    if (phase === 'reading' || !hash) return;
    phase = 'reading';
    try {
      const imported = await ocrPicture(
        hash,
        { languages: $state.snapshot(chosen), text: 'keep', shape: false, ...howFromSettings() },
        ticket,
      );
      if (gone) return;
      read = imported;
      phase = 'shown';
    } catch (error) {
      if (gone) return;
      if (isBackendError(error) && error.kind === 'stopped') {
        phase = 'asking';
        return;
      }
      phase = 'failed';
      failure =
        isBackendError(error) && error.kind === 'missing-program'
          ? t('ocr-no-tesseract')
          : (describeError(error) ?? t('ocr-failed'));
    }
  }

  async function copy() {
    // The clipboard may refuse, as WebKitGTK's can: then it is said, not
    // left for the writer to paste what was there before.
    try {
      await navigator.clipboard.writeText(text);
      notifyOk(t('ocr-picture-copied'));
    } catch (error) {
      notifyError(t('ocr-picture-copy-failed'), error);
    }
  }

  function elementOf() {
    if (!project || !read) return;
    try {
      const made = makeImported(project, at ?? PROJECT, read, name);
      if (!made) throw new Error(t('ocr-map-failed'));
      onclose();
      onenter?.(made.top);
    } catch (error) {
      notifyError(t('ocr-map-failed'), error);
    }
  }

  function cancel() {
    if (phase === 'reading')
      ocrStop(ticket).catch((error) => console.error('the reading could not be stopped', error));
    onclose();
  }
</script>

<Dialog
  open
  title={t('ocr-picture-title')}
  subtitle={name}
  width={bench ? 1240 : 560}
  tall={bench}
  padded={!bench}
  onclose={cancel}
>
  <div class="body" class:bench data-ocr={phase}>
    {#if phase === 'asking' && file}
      <!-- A file of the library is looked at and read by the step that reads the library's PDFs. -->
      <ReadStep
        path={file.path}
        stored
        name={file.name}
        onread={(imported) => {
          read = imported;
          phase = 'shown';
        }}
        bind:showing
        bind:action
      />
    {:else if phase === 'asking'}
      <p class="about">{t('ocr-about-picture')}</p>
      {#if reader.installed}
        <LanguagePicker
          value={chosen}
          installed={reader.languages}
          label={t('ocr-languages')}
          hint={t('ocr-languages-hint')}
          onchange={(value) => (chosen = value)}
        />
      {:else if reader.tools}
        <p class="failure selectable" role="alert">
          <CircleAlert size={15} /> <span>{t('ocr-no-tesseract')}</span>
        </p>
      {/if}
    {:else if phase === 'reading'}
      <div class="working" aria-live="polite">
        <Spinner size={18} />
        <div class="doing">{t('ocr-reading', { file: name })}</div>
      </div>
    {:else if phase === 'shown'}
      {#if text}
        <div class="text selectable serif" data-ocr-text>{text}</div>
      {:else}
        <p class="about">{t('ocr-picture-empty')}</p>
      {/if}
    {:else if phase === 'failed'}
      <p class="failure selectable" role="alert">
        <CircleAlert size={15} /> <span>{failure}</span>
      </p>
    {/if}
  </div>

  {#snippet footer()}
    {#if phase === 'shown'}
      {#if project && text}
        <Button onclick={elementOf} data-ocr-map>
          {#snippet icon()}<Network size={14} />{/snippet}
          {t('ocr-picture-map')}
        </Button>
      {/if}
      {#if text}
        <Button onclick={copy}>
          {#snippet icon()}<Copy size={14} />{/snippet}
          {t('ocr-picture-copy')}
        </Button>
      {/if}
      <Button variant="primary" onclick={onclose}>{t('common-close')}</Button>
    {:else if file}
      <Button variant="ghost" onclick={cancel}>{t('common-cancel')}</Button>
      {#if action}
        <Button variant="primary" disabled={!action.enabled} onclick={action.run} data-ocr-read>
          {action.label}
        </Button>
      {/if}
    {:else}
      <Button variant="ghost" onclick={cancel}>{t('common-cancel')}</Button>
      <Button
        variant="primary"
        disabled={phase !== 'asking' || !reader.installed || !chosen.length}
        onclick={readIt}
        data-ocr-read
      >
        {t('ocr-read')}
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
  .text {
    /* A long text scrolls within the dialog. */
    max-height: 55vh;
    overflow-y: auto;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    font-size: 15px;
    line-height: 1.55;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
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
