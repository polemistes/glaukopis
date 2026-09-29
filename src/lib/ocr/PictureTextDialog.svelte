<script lang="ts">
  /**
   * The text of a picture of the store, read by Tesseract (ADR 0018): shown,
   * to be copied, or, where the picture is looked at in a project, made a map
   * of in that project, its name the centre and the text the centre's text.
   */
  import { onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import Copy from '@lucide/svelte/icons/copy';
  import Network from '@lucide/svelte/icons/network';
  import { isBackendError } from '$lib/api/backend';
  import type { Imported } from '$lib/api/imported';
  import { ocrPicture, ocrStop } from '$lib/api/ocr';
  import { languages, newTextLanguage, t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import { makeMap } from '$lib/project/model/import';
  import { inlineText } from '$lib/project/model/text';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyOk } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import LanguagePicker from './LanguagePicker.svelte';
  import { reader } from './reader.svelte';

  interface Props {
    hash: string;
    /** What the picture is called. */
    name: string;
    /** The project the picture is looked at in, where it is. */
    project?: Project | null;
    /** Asks for the map that was made to be shown. */
    onopenmap?: (map: string) => void;
    onclose: () => void;
  }

  let { hash, name, project = null, onopenmap, onclose }: Props = $props();

  const ticket = newId();
  let phase = $state<'asking' | 'reading' | 'shown' | 'failed'>('asking');
  let chosen = $state<string[]>([]);
  let read = $state.raw<Imported | null>(null);
  let failure = $state<string | null>(null);
  let gone = false;

  onMount(() => {
    // The language the project's texts are written in, as far as its maps say.
    const written = project?.maps.map((m) => m.document.language).find(Boolean);
    void reader.load().then(() => {
      if (!gone) chosen = reader.first(written ?? newTextLanguage(), languages.current);
    });
    return () => {
      gone = true;
      if (phase === 'reading') ocrStop(ticket).catch(() => {});
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
    if (phase === 'reading') return;
    phase = 'reading';
    try {
      const imported = await ocrPicture(
        hash,
        { languages: $state.snapshot(chosen), all: false },
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
    await navigator.clipboard.writeText(text);
    notifyOk(t('ocr-picture-copied'));
  }

  function mapOf() {
    if (!project || !read) return;
    const made = makeMap(project, read, name);
    onclose();
    onopenmap?.(made.map);
  }

  function cancel() {
    if (phase === 'reading') ocrStop(ticket).catch(() => {});
    onclose();
  }
</script>

<Dialog open title={t('ocr-picture-title')} subtitle={name} width={560} onclose={cancel}>
  <div class="body" data-ocr={phase}>
    {#if phase === 'asking'}
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
        <Button onclick={mapOf} data-ocr-map>
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
