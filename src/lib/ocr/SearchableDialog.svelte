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
    type Asked,
    type Looked,
    type Stretch,
    type Progress,
    type TextChoice,
  } from '$lib/api/ocr';
  import { languages, t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyOk } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import {
    firstPageToTry,
    firstTextChoice,
    howFromSettings,
    lowResolution,
    scriptsAlike,
    stretchesOf,
  } from './how';
  import HowDisclosure from './HowDisclosure.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import { reader } from './reader.svelte';
  import TextPart from './TextPart.svelte';
  import TextPreview from './TextPreview.svelte';
  import PageStrip from './PageStrip.svelte';
  import Stretches from './Stretches.svelte';
  import {
    askedOf,
    beginStretch,
    firstStretch,
    removeStretch,
    stretchesAtOutline,
    stretchOf,
    withCurrent,
  } from './stretches';
  import TryPane from './TryPane.svelte';

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
  /**
   * The stretches of pages read otherwise, the first the whole file's; the
   * picker (`chosen`) and the layout (`how.layout`) hold what the current one
   * is read with until another is chosen.
   */
  let stretches = $state.raw<Stretch[]>([]);
  let current = $state(0);
  /** Beside the choices, where the PDF has text: that text, or a page tried. */
  let view = $state<'text' | 'try'>('text');
  /** The page tried, counted from one. */
  let tryPage = $state(1);
  let progress = $state.raw<Progress | null>(null);
  let failure = $state<string | null>(null);
  let gone = false;

  onMount(() => {
    void look();
    return () => {
      gone = true;
      if (phase === 'reading')
        ocrStop(ticket).catch((error) => console.error('the reading could not be stopped', error));
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
      tryPage = firstPageToTry(found, text);
      // The language of the work, where the reference says it.
      const language = reference?.fields.langid ?? reference?.fields.language ?? null;
      chosen = reader.first(language, languages.current);
      stretches = firstStretch({ languages: chosen, layout: how.layout });
      current = 0;
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
          text,
          shape: false,
          ...$state.snapshot(how),
          ...askedOf(listed),
        },
        ticket,
      );
      if (gone) return;
      const said = [
        made.failed.length ? t('ocr-searchable-failed', { count: made.failed.length }) : '',
        made.poorly.length
          ? t('ocr-searchable-poorly', {
              count: made.poorly.length,
              pages: stretchesOf(made.poorly),
            })
          : '',
      ].filter(Boolean);
      const detail = said.length ? said.join(' ') : undefined;
      if (made.remapped > 0 && made.read === 0) {
        notifyOk(t('ocr-searchable-readable-done', { count: made.remapped }), detail);
      } else {
        notifyOk(t('ocr-searchable-done', { count: made.read }), detail);
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
    if (phase === 'reading')
      ocrStop(ticket).catch((error) => console.error('the reading could not be stopped', error));
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
  /** Scripts whose letters look alike among the languages chosen, whose letters are read as each other's. */
  const alike = $derived(scanning ? scriptsAlike(chosen) : []);
  /** Whether a page can be tried: there are pages to be read, and Tesseract to read them. */
  const tryable = $derived(!!looked?.searchable && scanning && reader.installed);
  /** What a page is tried with, as the file would be made searchable. */
  /** The stretches, the current one with what the picker and the layout hold. */
  const listed = $derived(
    withCurrent(stretches, current, { languages: chosen, layout: how.layout }),
  );
  const asked = $derived<Asked>({ ...how, text, shape: false, ...askedOf(listed) });

  /** Makes a stretch the one the picker and the layout edit. */
  function editStretch(index: number, list: Stretch[] = listed) {
    stretches = list;
    current = Math.min(Math.max(0, index), list.length - 1);
    const stretch = list[current];
    chosen = [...stretch.languages];
    how = { ...how, layout: stretch.layout };
  }

  /** A stretch begun at a page, with the languages and layout as they stand. */
  function beginAt(page: number) {
    const begun = beginStretch(listed, page, { languages: chosen, layout: how.layout });
    editStretch(begun.index, begun.list);
  }

  function removeAt(index: number) {
    const list = removeStretch(listed, index);
    editStretch(current === index ? index - 1 : current > index ? current - 1 : current, list);
  }

  /** Where each stretch begins, marked in the strip with the languages it is read with. */
  const marks = $derived(
    new Map(
      listed.length > 1
        ? listed.map((stretch) => [stretch.from, stretch.languages.join('+') || 'eng'] as const)
        : [],
    ),
  );

  /** A page of the strip chosen: it is the page tried, and its stretch is the one edited. */
  function choosePage(page: number) {
    tryPage = page;
    view = 'try';
    editStretch(stretchOf(listed, page));
  }

  function beginAtOutline() {
    if (!looked) return;
    const list = stretchesAtOutline(listed, looked.outline, looked.pages, {
      languages: chosen,
      layout: how.layout,
    });
    editStretch(current, list);
  }
  /** Room for what stands beside the choices: the text the PDF has, or a page tried. */
  const wide = $derived(!!looked?.searchable && (looked.withText > 0 || tryable));
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
            {#if lowResolution(looked)}
              <p class="warn" data-ocr-low-resolution={looked.resolution}>
                {t('ocr-low-resolution', { dpi: looked.resolution ?? 0 })}
                {#if looked.withText > 0}{t('ocr-low-resolution-text')}{/if}
              </p>
            {/if}
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
              {#each alike as pair (pair.a + pair.b)}
                <p class="warn" data-scripts-alike="{pair.a} {pair.b}">
                  {t('ocr-languages-scripts-alike', {
                    a: t('ocr-script', { script: pair.a }),
                    b: t('ocr-script', { script: pair.b }),
                    alike: pair.alike,
                  })}
                </p>
              {/each}
              <HowDisclosure bind:value={how} />
            {:else if scanning}
              <p class="failure selectable" role="alert">
                <CircleAlert size={15} /> <span>{t('ocr-no-tesseract')}</span>
              </p>
            {/if}
          </div>
          {#if wide}
            <div class="beside">
              {#if looked.withText > 0 && tryable}
                <div data-ocr-view={view}>
                  <Segmented
                    value={view}
                    label={t('ocr-view-try')}
                    size="sm"
                    options={[
                      { value: 'text', label: t('ocr-view-text') },
                      { value: 'try', label: t('ocr-view-try') },
                    ]}
                    onchange={(v: 'text' | 'try') => (view = v)}
                  />
                </div>
              {/if}
              {#if tryable}
                <div hidden={looked.withText > 0 && view !== 'try'}>
                  <TryPane
                    path={file.path}
                    stored
                    pages={looked.pages}
                    bind:page={tryPage}
                    {asked}
                  />
                </div>
              {/if}
              {#if looked.withText > 0}
                <div hidden={tryable && view === 'try'}>
                  <TextPreview
                    path={file.path}
                    stored
                    pages={looked.pages}
                    translated={text === 'translate'}
                  />
                </div>
              {/if}
            </div>
          {/if}
          {#if tryable && looked.pages > 1}
            <div class="pages">
              <Stretches
                list={listed}
                {current}
                pages={looked.pages}
                outline={looked.outline}
                onselect={(i) => editStretch(i)}
                onremove={removeAt}
                onoutline={beginAtOutline}
              />
              <PageStrip
                path={file.path}
                stored
                pages={looked.pages}
                {marks}
                selected={tryPage}
                onselect={choosePage}
                onbegin={beginAt}
              />
            </div>
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
  .pages {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .beside {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 10px);
    min-width: 0;
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
