<script lang="ts" module>
  import type { Asked } from '$lib/api/ocr';

  /** What the dialog around the workbench needs for its footer: what to ask, whether it can, and what the button says. */
  export interface WorkbenchState {
    asked: Asked;
    ready: boolean;
    label: string;
  }
</script>

<script lang="ts">
  /**
   * The workbench of a reading (ADR 0061), wherever a PDF or a picture is
   * read: the pages at the top as a strip, each marked with what it gets,
   * the PDF's text or a reading by Tesseract; the page in view in panes, its
   * picture, the text the PDF has and what Tesseract read; and the settings
   * beside them, holding for the pages selected. Each page has its plan, a
   * source and settings (`plan.ts`), from which the reading is asked; the
   * dialog around it reads `status` for the button at its foot.
   *
   * A page is tried with the settings that hold for it; its trials are kept
   * while the dialog is open. The text and the picture of the page in view
   * are fetched as it comes into view, and a few are kept.
   */
  import { onDestroy } from 'svelte';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import Button from '$lib/ui/Button.svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { isBackendError } from '$lib/api/backend';
  import {
    ocrPages,
    ocrStop,
    ocrText,
    ocrTry,
    type Looked,
    type PageTextView,
    type Scheme,
  } from '$lib/api/ocr';
  import { listed, t, worded } from '$lib/i18n';
  import { describeError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import { firstSource, howFromSettings } from './how';
  import { ocrLanguageName } from './languages';
  import PagePanes from './PagePanes.svelte';
  import PagesBar from './PagesBar.svelte';
  import ReadSummary from './ReadSummary.svelte';
  import PageStrip from './PageStrip.svelte';
  import {
    askedOf,
    counted,
    decided,
    firstPlan,
    sameAcross,
    settingsAt,
    runsOf,
    wholeOf,
    withSettings,
    withSource,
    withWhole,
    type PagePlan,
    type Whole,
    type PageSettings,
    type Source,
  } from './plan';
  import ReadSettings from './ReadSettings.svelte';
  import { reader } from './reader.svelte';
  import { selectionSaid } from './select';
  import { remembered, unsureOf, type Trial } from './trials';

  interface Props {
    path: string;
    /** Whether the path is one of the library, in the store. */
    stored: boolean;
    looked: Looked;
    /** Read into elements, or made searchable. */
    mode: 'tree' | 'searchable';
    /** The languages to read with at first, the likeliest first. */
    first: string[];
    /** What the dialog's button asks, whether it can, and what it says. */
    status?: WorkbenchState;
    /**
     * The summary, as the dialog opens: what the file is, what its pages take
     * and how they are read; or the pages, to be looked at and tried, opened
     * on demand. What is done in either holds in both.
     */
    view?: 'summary' | 'pages';
  }

  let {
    path,
    stored,
    looked,
    mode,
    first,
    status = $bindable(),
    view = $bindable('summary'),
  }: Props = $props();

  const nameOf = (code: string) => ocrLanguageName(code);
  /** How many pages there are: a picture is one. */
  // svelte-ignore state_referenced_locally
  const pages = looked.picture ? 1 : looked.pages;
  // svelte-ignore state_referenced_locally
  const startSettings: PageSettings = { ...howFromSettings(), languages: [...first] };

  /** The plan of the pages: what each gets and what it is read with. Empty for a picture. */
  let plan = $state.raw<PagePlan[]>(
    // svelte-ignore state_referenced_locally
    looked.picture
      ? []
      : firstPlan(looked.verdicts, startSettings, firstSource(looked, reader.installed)),
  );
  /** The choice for the whole PDF made last, which is said where two choices come to the same. */
  // svelte-ignore state_referenced_locally
  let preferred = $state<Whole | null>(
    looked.picture ? null : firstSource(looked, reader.installed),
  );
  /** What a picture is read with. */
  let pictureSettings = $state.raw<PageSettings>(startSettings);
  /** The pages selected, counted from one; none is every page. */
  let selection = $state.raw<number[]>([]);
  /** The page in view. */
  let inView = $state(
    // svelte-ignore state_referenced_locally
    Math.max(1, plan.findIndex((p) => p.source === 'read') + 1),
  );
  // svelte-ignore state_referenced_locally
  selection = looked.picture ? [] : [inView];
  /** Whether the text the PDF has is taken as translated by what its fonts say. */
  // svelte-ignore state_referenced_locally
  let translated = $state(looked.schemes.length > 0);

  // ---- the text and the picture of the page in view ----

  /** How many pages' text and pictures are kept. */
  const TEXTS = 40;
  const PICTURES = 10;
  const texts = new SvelteMap<number, PageTextView>();
  const textFailed = new SvelteMap<number, string>();
  const pictures = new SvelteMap<number, { url: string; width: number; height: number }>();
  const pictureFailed = new SvelteMap<number, string>();
  let gone = false;
  let pictureTicket: string | null = null;

  function keepFew<T>(map: SvelteMap<number, T>, most: number) {
    while (map.size > most) {
      const oldest = map.keys().next().value;
      if (oldest === undefined) break;
      map.delete(oldest);
    }
  }

  async function fetchText(page: number) {
    if (texts.has(page) || textFailed.has(page)) return;
    try {
      const [got] = await ocrText(path, stored, page - 1, 1);
      if (gone) return;
      if (got) {
        texts.set(page, got);
        keepFew(texts, TEXTS);
      } else textFailed.set(page, t('ocr-text-rest-failed'));
    } catch (error) {
      if (gone) return;
      textFailed.set(page, describeError(error) ?? t('ocr-failed'));
      console.error(`the text of page ${page} of ${path} could not be read`, error);
    }
  }

  /** The size of a picture given as a data URL. */
  function sizeOf(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => resolve({ width: 0, height: 0 });
      image.src = url;
    });
  }

  async function fetchPicture(page: number) {
    if (pictures.has(page) || pictureFailed.has(page)) return;
    if (pictureTicket)
      ocrStop(pictureTicket).catch((error) =>
        console.error('the drawing of a page could not be stopped', error),
      );
    const mine = newId();
    pictureTicket = mine;
    try {
      const [got] = await ocrPages(path, stored, page - 1, 1, 800, mine);
      if (gone || pictureTicket !== mine) return;
      if (got?.picture) {
        const size = await sizeOf(got.picture);
        pictures.set(page, { url: got.picture, ...size });
        keepFew(pictures, PICTURES);
      } else pictureFailed.set(page, got?.failed || t('ocr-strip-page-failed'));
    } catch (error) {
      if (gone || pictureTicket !== mine) return;
      if (isBackendError(error) && error.kind === 'stopped') return;
      pictureFailed.set(page, describeError(error) ?? t('ocr-failed'));
      console.error(`page ${page} of ${path} could not be drawn`, error);
    } finally {
      if (pictureTicket === mine) pictureTicket = null;
    }
  }

  // The page in view is fetched once it has stayed in view a moment, so that
  // going through the pages by the keys does not draw every one passed.
  $effect(() => {
    if (looked.picture || view !== 'pages') return;
    const page = inView;
    const wait = setTimeout(() => {
      if (looked.withText > 0) void fetchText(page);
      if (!shownOf(page)) void fetchPicture(page);
    }, 120);
    return () => clearTimeout(wait);
  });

  // ---- trials ----

  /** Each page's trials, the newest first, and the one shown. */
  const trials = new SvelteMap<number, Trial[]>();
  const shownAt = new SvelteMap<number, number>();
  const tryFailed = new SvelteMap<number, string>();
  /** The page being tried, and the ticket of its trial. */
  let trying = $state<number | null>(null);
  let trialTicket: string | null = null;

  function shownOf(page: number): Trial | null {
    const list = trials.get(page) ?? [];
    const at = shownAt.get(page);
    return list.find((trial) => trial.at === at) ?? list[0] ?? null;
  }

  function stopTrial() {
    if (trialTicket)
      ocrStop(trialTicket).catch((error) =>
        console.error('the trial of a page could not be stopped', error),
      );
    trialTicket = null;
  }

  /** The settings that hold for a page now. */
  const settingsOf = (page: number): PageSettings =>
    looked.picture ? pictureSettings : settingsAt(plan, page);

  async function attempt() {
    stopTrial();
    const mine = newId();
    trialTicket = mine;
    const page = inView;
    const settings = settingsOf(page);
    const asked = $state.snapshot(askedNow);
    trying = page;
    tryFailed.delete(page);
    try {
      const tried = await ocrTry(path, stored, page, asked, mine);
      if (gone || trialTicket !== mine) return;
      const trial: Trial = { settings, tried, at: Date.now() };
      trials.set(page, remembered(trials.get(page) ?? [], trial));
      shownAt.set(page, trial.at);
    } catch (error) {
      if (gone || trialTicket !== mine) return;
      if (isBackendError(error) && error.kind === 'stopped') return;
      tryFailed.set(page, describeError(error) ?? t('ocr-failed'));
      console.error(`page ${page} of ${path} could not be tried`, error);
    } finally {
      if (trialTicket === mine) {
        trialTicket = null;
        trying = null;
      }
    }
  }

  // A picture is one page, and nothing of it is shown until it is read: it is
  // tried as soon as it is opened to be looked at, once.
  let pictureTried = false;
  $effect(() => {
    if (view !== 'pages' || !looked.picture || !reader.installed || pictureTried) return;
    pictureTried = true;
    void attempt();
  });

  onDestroy(() => {
    gone = true;
    stopTrial();
    if (pictureTicket)
      ocrStop(pictureTicket).catch((error) =>
        console.error('the drawing of a page could not be stopped', error),
      );
  });

  // ---- what the pages get, and what they are read with ----

  /** The pages acted on: those selected; none is every page. */
  const acted = $derived(selection);

  function setSource(source: Source) {
    plan = withSource(plan, acted, source, looked.verdicts);
    if (!acted.length) preferred = source;
  }

  function decide() {
    plan = decided(plan, acted, looked.verdicts);
    if (!acted.length) preferred = 'decide';
  }

  /** What every page takes, chosen in the summary. */
  function setWhole(choice: Whole) {
    plan = withWhole(plan, choice, looked.verdicts);
    preferred = choice;
  }

  /** A setting changed in the summary: only what changed is laid on every page. */
  function changeAll(next: PageSettings) {
    if (looked.picture) {
      pictureSettings = next;
      return;
    }
    plan = withSettings(plan, [], changeOf(settingsOf(1), next));
  }

  /** What differs between two settings, to be laid on pages that may differ in the rest. */
  function changeOf(was: PageSettings, next: PageSettings): Partial<PageSettings> {
    const change: Partial<PageSettings> = {};
    if (JSON.stringify(next.languages) !== JSON.stringify(was.languages))
      change.languages = [...next.languages];
    if (next.dpi !== was.dpi) change.dpi = next.dpi;
    if (next.layout !== was.layout) change.layout = next.layout;
    if (next.contrast !== was.contrast) change.contrast = next.contrast;
    return change;
  }

  /** The settings changed: only what differs from what was shown is laid on the pages selected. */
  function changeSettings(next: PageSettings) {
    if (looked.picture) {
      pictureSettings = next;
      return;
    }
    plan = withSettings(plan, acted, changeOf(settingsOf(inView), next));
  }

  function useSettings(settings: PageSettings) {
    if (looked.picture) pictureSettings = settings;
    else plan = withSettings(plan, acted, settings);
  }

  // ---- what is said ----

  /** The line over the settings: which pages they hold for. */
  const settingsScope = $derived.by(() => {
    if (looked.picture) return '';
    const said = selection.length ? selectionSaid(selection, pages, t) : '';
    const line = said ? t('ocr-pages-scope', { pages: said }) : t('ocr-pages-scope-all', { pages });
    return sameAcross(plan, acted) ? line : `${line} ${t('ocr-settings-scope-differ')}`;
  });

  const schemeWords: Record<Scheme, string> = {
    'greek-names': 'ocr-text-scheme-greek-names',
    'expert-names': 'ocr-text-scheme-expert-names',
    'beta-code': 'ocr-text-scheme-beta-code',
  };
  /** What the fonts were found to say of their letters, in words: the tooltip of the translation. */
  const schemeSaid = $derived(
    looked.schemes
      .map((found) =>
        t(schemeWords[found.scheme], { fonts: listed(found.fonts), pages: found.pages }),
      )
      .join(t('ui-words-between')),
  );

  // ---- what is asked ----

  const textChoice = $derived(translated ? ('translate' as const) : ('keep' as const));
  const askedNow = $derived(
    looked.picture
      ? askedOf([], 'keep', false, pictureSettings)
      : askedOf(plan, textChoice, mode === 'tree'),
  );
  const toRead = $derived(looked.picture ? 1 : counted(plan).read);

  $effect(() => {
    const ready =
      mode === 'searchable'
        ? looked.searchable &&
          (toRead > 0 ? reader.installed : translated && looked.schemes.length > 0)
        : toRead > 0
          ? reader.installed || (!looked.picture && looked.withText > 0)
          : looked.withText > 0;
    const label =
      mode === 'searchable'
        ? toRead === 0 && translated
          ? t('ocr-searchable-make-readable')
          : t('ocr-searchable-make')
        : looked.picture
          ? t('ocr-read')
          : toRead === 0
            ? t('ocr-take-text')
            : reader.installed
              ? t('ocr-read-pages', { count: toRead })
              : t('ocr-read-text-pages');
    status = { asked: askedNow, ready, label };
  });

  // ---- the panes ----

  const shown = $derived(shownOf(inView));
  const drawn = $derived(pictures.get(inView) ?? null);
  const verdict = $derived(looked.verdicts[inView - 1] ?? 'none');
  const hasPdfText = $derived(!looked.picture && looked.withText > 0);
  /** What every page takes, as the summary says it; nothing where pages were marked one by one. */
  const whole = $derived(looked.picture ? null : wholeOf(plan, looked.verdicts, preferred));
  /** Whether the pages are read in more than one way. */
  const mixed = $derived(!looked.picture && runsOf(plan).length > 1);
</script>

{#if view === 'summary'}
  <div class="workbench summary" data-workbench={mode} data-view="summary">
    <ReadSummary
      {looked}
      {plan}
      {whole}
      {mixed}
      settings={settingsOf(1)}
      {translated}
      {toRead}
      canRead={reader.installed}
      installed={reader.languages}
      onwhole={setWhole}
      ontranslated={(on) => (translated = on)}
      onsettings={changeAll}
      onpages={() => (view = 'pages')}
    />
  </div>
{:else}
  <div class="workbench" class:picture={looked.picture} data-workbench={mode} data-view="pages">
    <div class="top">
      <div class="bar-row">
        <Button variant="ghost" size="sm" onclick={() => (view = 'summary')} data-close-pages>
          {#snippet icon()}<ChevronLeft size={14} />{/snippet}
          {t('ocr-summary-back')}
        </Button>
        {#if !looked.picture}
          <div class="bar">
            <PagesBar
              {looked}
              {plan}
              {selection}
              canRead={reader.installed}
              onsource={setSource}
              ondecide={decide}
              onall={() => (selection = [])}
            />
          </div>
        {/if}
      </div>
      {#if !looked.picture}
        <PageStrip
          {path}
          {stored}
          pages={looked.pages}
          {plan}
          verdicts={looked.verdicts}
          outline={looked.outline}
          {selection}
          {inView}
          onview={(page) => (inView = page)}
          onselect={(next) => (selection = next)}
          {nameOf}
        />
      {/if}
    </div>
    <div class="row">
      <PagePanes
        {hasPdfText}
        picture={{
          picture: shown ? `data:image/png;base64,${shown.tried.png}` : (drawn?.url ?? null),
          width: shown ? shown.tried.width : (drawn?.width ?? 0),
          height: shown ? shown.tried.height : (drawn?.height ?? 0),
          label: shown?.tried.label ?? texts.get(inView)?.label ?? String(inView),
          blocks: shown?.tried.blocks ?? [],
          unsure: shown ? unsureOf(shown.tried) : [],
          loading: !shown && !drawn && !pictureFailed.has(inView) && !looked.picture,
          failure: shown ? null : (pictureFailed.get(inView) ?? null),
        }}
        pdf={hasPdfText
          ? {
              page: texts.get(inView) ?? null,
              loading: !texts.has(inView) && !textFailed.has(inView),
              failure: textFailed.get(inView) ?? null,
              verdict,
              translated,
              canTranslate: looked.schemes.length > 0,
              ontranslated: (on: boolean) => (translated = on),
              scheme: schemeSaid,
            }
          : null}
        tesseract={{
          page: inView,
          shown,
          trials: trials.get(inView) ?? [],
          trying: trying === inView,
          failure: tryFailed.get(inView) ?? null,
          nameOf,
          onshow: (trial: Trial) => shownAt.set(inView, trial.at),
          onsettings: useSettings,
        }}
      />
      <ReadSettings
        value={settingsOf(inView)}
        scope={settingsScope}
        installed={reader.languages}
        page={inView}
        trying={trying !== null}
        canTry={reader.installed && trying === null}
        missing={!reader.installed}
        onchange={changeSettings}
        ontry={attempt}
      />
    </div>
  </div>
{/if}

<style>
  .workbench {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: 100%;
    min-height: 0;
    min-width: 0;
    padding: var(--space-3) var(--space-4) var(--space-4);
    box-sizing: border-box;
  }
  .workbench.summary {
    height: auto;
    padding: 0;
  }
  .top {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: none;
    min-width: 0;
  }
  /* The way back to the summary, and the line of what the pages take, in one row. */
  .bar-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }
  .bar {
    flex: 1 1 auto;
    min-width: 0;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: var(--space-3);
    flex: 1 1 auto;
    min-height: 260px;
    min-width: 0;
  }
  @media (max-width: 860px) {
    .row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
