<script lang="ts">
  /**
   * A PDF or a picture read to become a map, in the dialog of documents
   * brought in (`documents/DocumentDialog.svelte`): the file is looked at,
   * the languages are asked for where there are pages without text, and the
   * pages are shown as they are read. Where every page has text, it is read
   * at once. What is read is handed to the dialog, which makes the map.
   * Also for a PDF of the library (`PdfMapDialog.svelte`), by its path in the
   * store.
   *
   * Leaving the dialog stops the reading.
   */
  import { onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import ScanText from '@lucide/svelte/icons/scan-text';
  import { isBackendError } from '$lib/api/backend';
  import type { Imported } from '$lib/api/imported';
  import {
    ocrLook,
    ocrRead,
    ocrStop,
    onProgress,
    type Asked,
    type Looked,
    type Stretch,
    type Progress,
    type TextChoice,
  } from '$lib/api/ocr';
  import { languages, newTextLanguage, t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import {
    firstPageToTry,
    firstTextChoice,
    howFromSettings,
    lowResolution,
    scriptsAlike,
  } from './how';
  import HowDisclosure from './HowDisclosure.svelte';
  import { ocrLanguageName } from './languages';
  import LanguagePicker from './LanguagePicker.svelte';
  import { reader } from './reader.svelte';
  import TextPart from './TextPart.svelte';
  import TextPreview from './TextPreview.svelte';
  import PageStrip from './PageStrip.svelte';
  import { firstPlan } from './plan';
  import Stretches from './Stretches.svelte';
  import {
    askedOf,
    firstStretch,
    removeStretch,
    stretchesAtOutline,
    stretchOf,
    withCurrent,
  } from './stretches';
  import TryPane from './TryPane.svelte';

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
    /** Whether the step wants room for the preview of the text the PDF has: the dialog widens. */
    wide?: boolean;
  }

  let { path, stored = false, name, onread, wide = $bindable(false) }: Props = $props();

  // svelte-ignore state_referenced_locally
  const file = name ?? path.split(/[\\/]/).pop() ?? path;
  const ticket = newId();

  let phase = $state<'looking' | 'asking' | 'reading' | 'failed'>('looking');
  let looked = $state.raw<Looked | null>(null);
  let chosen = $state<string[]>([]);
  /** What becomes of the text the PDF has. */
  let text = $state<TextChoice>('keep');
  /** Whether the shape of a PDF's pages is kept: headings, lines kept as lines, numbers in the margin. */
  let shape = $state(true);
  /** With the shape kept: the document's tree by its headings, or an element for each page (ADR 0047). */
  let structure = $state<'headings' | 'pages'>('headings');
  /** By its headings: a mark with the page's number where each page begins. */
  let pageMarks = $state(true);
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

  function fail(error: unknown) {
    phase = 'failed';
    failure =
      isBackendError(error) && error.kind === 'missing-program'
        ? t('ocr-no-tesseract')
        : (describeError(error) ?? t('ocr-failed'));
  }

  async function look() {
    try {
      const [found] = await Promise.all([ocrLook(path, stored), reader.load()]);
      if (gone) return;
      looked = found;
      text = firstTextChoice(found);
      tryPage = firstPageToTry(found, text);
      chosen = reader.first(newTextLanguage(), languages.current);
      stretches = firstStretch({ languages: chosen, layout: how.layout });
      current = 0;
      phase = 'asking';
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
      const done = await ocrRead(
        path,
        {
          text,
          // A picture is one page: there is no shape across pages to keep.
          shape: !looked?.picture && shape,
          ...$state.snapshot(how),
          ...askedOf(listed),
        },
        ticket,
        stored,
      );
      if (!gone) onread(done.imported, done.kept, looked?.pages ?? 0);
    } catch (error) {
      if (gone) return;
      if (isBackendError(error) && error.kind === 'stopped') phase = 'asking';
      else fail(error);
    } finally {
      stopListening();
    }
  }

  const without = $derived(looked ? looked.pages - looked.withText : 0);
  /** Whether Tesseract is to read pages: those without text, or all where all are asked for. */
  const scanning = $derived(!!looked && (looked.picture || without > 0 || text === 'anew'));
  /**
   * Whether anything can be done: pages read by Tesseract, or the text taken
   * as the file has it, where Tesseract is not there, from the pages that have it.
   */
  const readable = $derived(
    !!looked &&
      (!scanning ||
        (reader.installed
          ? chosen.length > 0
          : !looked.picture && looked.withText > 0 && text !== 'anew')),
  );
  const about = $derived.by(() => {
    if (!looked) return '';
    if (looked.picture) return t('ocr-about-picture');
    if (looked.withText === 0) return t('ocr-about-scan', { pages: looked.pages });
    if (text === 'anew') return t('ocr-about-anew', { pages: looked.pages });
    if (text === 'translate') return t('ocr-about-translate', { without });
    if (without === 0) return t('ocr-about-text', { pages: looked.pages });
    return t('ocr-about-some', { pages: looked.pages, without });
  });
  /** Scripts whose letters look alike among the languages chosen, whose letters are read as each other's. */
  const alike = $derived(scanning ? scriptsAlike(chosen) : []);
  /** Whether a page can be tried: a PDF with pages to be read by Tesseract, which is there. */
  const tryable = $derived(!!looked && !looked.picture && scanning && reader.installed);
  /** What a page is tried with, as the reading would be asked. */
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

  function removeAt(index: number) {
    const list = removeStretch(listed, index);
    editStretch(current === index ? index - 1 : current > index ? current - 1 : current, list);
  }

  /**
   * What the strip shows of each page, until the workbench keeps a plan of
   * its own: all one way, as the choice of text says, read as chosen.
   */
  const stripPlan = $derived(
    looked
      ? firstPlan(looked.verdicts, { ...how, languages: chosen }, text === 'anew' ? 'read' : 'pdf')
      : [],
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
  // The dialog widens for what stands beside the choices: the text the PDF has, or a page tried.
  $effect(() => {
    wide = !!looked && !looked.picture && (looked.withText > 0 || tryable);
  });
  const go = $derived(
    !scanning ? t('ocr-take-text') : reader.installed ? t('ocr-read') : t('ocr-read-text-pages'),
  );
</script>

<div class="step" data-ocr={phase}>
  {#if phase === 'looking'}
    <div class="working" aria-live="polite">
      <Spinner size={18} />
      <div class="doing">{t('ocr-looking', { file })}</div>
    </div>
  {:else if phase === 'asking' && looked}
    <div class="asking" class:split={wide}>
      <div class="side">
        <p class="about">{about}</p>
        {#if lowResolution(looked)}
          <p class="warn" data-ocr-low-resolution={looked.resolution}>
            {t('ocr-low-resolution', { dpi: looked.resolution ?? 0 })}
            {#if looked.withText > 0}{t('ocr-low-resolution-text')}{/if}
          </p>
        {/if}
        {#if !looked.picture && looked.withText > 0}
          <TextPart {looked} bind:choice={text} canRead={reader.installed} />
        {/if}
        {#if !looked.picture}
          <label class="option">
            <input type="checkbox" data-choice="shape" bind:checked={shape} />
            <span>
              {t('ocr-shape')}
              <small>{t('ocr-shape-hint')}</small>
            </span>
          </label>
          {#if shape}
            <div class="structure">
              <div data-choice="structure">
                <Segmented
                  value={structure}
                  label={t('ocr-structure')}
                  size="sm"
                  options={[
                    { value: 'headings', label: t('ocr-structure-headings') },
                    { value: 'pages', label: t('ocr-structure-pages') },
                  ]}
                  onchange={(v: 'headings' | 'pages') => (structure = v)}
                />
              </div>
              <label class="option">
                <input
                  type="checkbox"
                  data-choice="page-marks"
                  checked={structure === 'headings' && pageMarks}
                  disabled={structure !== 'headings'}
                  onchange={(e) => (pageMarks = e.currentTarget.checked)}
                />
                <span>
                  {t('ocr-page-marks')}
                  <small>{t('ocr-page-marks-hint')}</small>
                </span>
              </label>
            </div>
          {/if}
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
        {:else if scanning}
          <p class="failure selectable" role="alert">
            <CircleAlert size={15} /> <span>{t('ocr-no-tesseract')}</span>
          </p>
        {/if}
        {#if scanning && reader.installed}
          <HowDisclosure bind:value={how} />
        {/if}
        <div class="go">
          <Button variant="primary" disabled={!readable} onclick={read} data-ocr-read>
            {#snippet icon()}<ScanText size={14} />{/snippet}
            {go}
          </Button>
        </div>
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
              <TryPane {path} {stored} pages={looked.pages} bind:page={tryPage} {asked} />
            </div>
          {/if}
          {#if looked.withText > 0}
            <div hidden={tryable && view === 'try'}>
              <TextPreview {path} {stored} pages={looked.pages} translated={text === 'translate'} />
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
            {path}
            {stored}
            pages={looked.pages}
            plan={stripPlan}
            verdicts={looked.verdicts}
            outline={looked.outline}
            selection={[]}
            inView={tryPage}
            onview={choosePage}
            onselect={() => {}}
            nameOf={(code) => ocrLanguageName(code)}
          />
        </div>
      {/if}
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
  .option {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: var(--ink-2);
    cursor: pointer;
  }
  .option input {
    accent-color: var(--accent);
    margin: 3px 0 0;
  }
  .option span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .structure {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 24px;
  }
  .option small {
    font-size: var(--text-sm);
    color: var(--ink-3);
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
