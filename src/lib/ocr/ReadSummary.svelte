<script lang="ts">
  /**
   * The dialog of a reading as it opens: what the file is, in a line or two;
   * what its pages take, chosen for the whole PDF (its own text, a reading by
   * Tesseract, or each page by the quality of its text); the translation
   * where the fonts tell their letters; and how Tesseract reads, for every
   * page. Most readings need nothing more. The pages themselves, to be looked
   * at, tried and marked one by one, are opened on demand (`onpages`), in the
   * workbench that holds this summary, which keeps what was done there.
   *
   * Where the pages were marked one by one, or are read in different ways,
   * this says so; a choice made here holds for every page again.
   */
  import Eye from '@lucide/svelte/icons/eye';
  import FileText from '@lucide/svelte/icons/file-text';
  import PanelsTopLeft from '@lucide/svelte/icons/panels-top-left';
  import Scale from '@lucide/svelte/icons/scale';
  import type { Looked, Scheme } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import { lowResolution } from './how';
  import { pagesSaid, type PagePlan, type PageSettings, type Whole } from './plan';
  import ReadSettings from './ReadSettings.svelte';

  interface Props {
    looked: Looked;
    plan: PagePlan[];
    /** The choice for the whole PDF the pages are marked as; nothing where they were marked one by one. */
    whole: Whole | null;
    /** Whether the pages are read in more than one way. */
    mixed: boolean;
    /** The settings shown: those of the first page, or of the picture. */
    settings: PageSettings;
    /** Whether the text the PDF has is taken as translated by what its fonts say. */
    translated: boolean;
    /** How many pages are to be read by Tesseract. */
    toRead: number;
    /** Whether Tesseract is installed. */
    canRead: boolean;
    /** The languages Tesseract has. */
    installed: string[];
    onwhole: (whole: Whole) => void;
    ontranslated: (on: boolean) => void;
    /** A setting changed: it holds for every page. */
    onsettings: (settings: PageSettings) => void;
    /** The pages opened, to be looked at and tried. */
    onpages: () => void;
  }

  let {
    looked,
    plan,
    whole,
    mixed,
    settings,
    translated,
    toRead,
    canRead,
    installed,
    onwhole,
    ontranslated,
    onsettings,
    onpages,
  }: Props = $props();

  /** What the file is, in a sentence of parts. */
  const facts = $derived.by(() => {
    if (looked.picture) return t('ocr-about-picture');
    const pages = looked.pages;
    const parts = [t('ocr-summary-pages', { pages })];
    if (looked.resolution) parts.push(t('ocr-summary-scanned', { dpi: looked.resolution }));
    if (looked.withText === 0) parts.push(t('ocr-summary-no-text', { pages }));
    else {
      parts.push(
        looked.withText === pages
          ? t('ocr-summary-text-all', { pages })
          : t('ocr-summary-text-some', { with: looked.withText }),
      );
      if (looked.poor > 0)
        parts.push(
          looked.poor === looked.withText
            ? t('ocr-summary-poor-all', { poor: looked.poor })
            : t('ocr-summary-poor', { poor: looked.poor }),
        );
    }
    return `${parts.join(', ')}.`;
  });

  const schemeWords: Record<Scheme, string> = {
    'greek-names': 'ocr-text-scheme-greek-names',
    'expert-names': 'ocr-text-scheme-expert-names',
    'beta-code': 'ocr-text-scheme-beta-code',
  };

  /** Whether any page has text of its own to take. */
  const hasText = $derived(looked.verdicts.some((v) => v === 'sound' || v === 'poor'));
  const said = $derived(pagesSaid(looked, plan, canRead, t));
  const scope = $derived.by(() => {
    const all = t('ocr-pages-scope-all', { pages: looked.picture ? 1 : looked.pages });
    return mixed ? `${all} ${t('ocr-settings-scope-differ')}` : all;
  });
</script>

<div class="summary" data-read-summary>
  <section class="facts">
    <p class="about" data-summary-facts>{facts}</p>
    {#if lowResolution(looked)}
      <p class="warn" data-ocr-low-resolution={looked.resolution}>
        {t('ocr-low-resolution', { dpi: looked.resolution ?? 0 })}
        {#if looked.withText > 0}{t('ocr-low-resolution-text')}{/if}
      </p>
    {/if}
    {#each looked.schemes as found (found.scheme)}
      <p class="scheme" data-text-scheme={found.scheme}>
        {t(schemeWords[found.scheme], { fonts: found.fonts.join(', '), pages: found.pages })}
      </p>
    {/each}
  </section>

  {#if !looked.picture}
    <section class="whole" data-summary-whole={whole ?? 'pages'}>
      <h3>{t('ocr-summary-whole')}</h3>
      {#if hasText}
        <Segmented
          value={whole ?? ''}
          label={t('ocr-summary-whole')}
          size="sm"
          options={[
            { value: 'pdf', label: t('ocr-pages-pdf'), icon: FileText },
            { value: 'read', label: t('ocr-pages-read'), icon: Eye, disabled: !canRead },
            { value: 'decide', label: t('ocr-pages-decide'), icon: Scale, disabled: !canRead },
          ]}
          onchange={(next: string) => onwhole(next as Whole)}
        />
      {/if}
      <p class="said" data-pages-said>{said}</p>
      {#if whole === null}
        <p class="hint" data-summary-mixed>{t('ocr-summary-mixed')}</p>
      {/if}
      {#if looked.schemes.length && hasText}
        <label class="check">
          <input
            type="checkbox"
            checked={translated}
            onchange={(e) => ontranslated(e.currentTarget.checked)}
            data-text-translated
          />
          <span>{t('ocr-pane-translated')}</span>
        </label>
      {/if}
    </section>
  {/if}

  <section class="how">
    <ReadSettings
      value={settings}
      {scope}
      {installed}
      page={1}
      trying={false}
      canTry={false}
      missing={!canRead}
      idle={toRead === 0}
      onchange={onsettings}
    />
  </section>

  <div class="open">
    <Button onclick={onpages} data-open-pages>
      {#snippet icon()}<PanelsTopLeft size={14} />{/snippet}
      {looked.picture ? t('ocr-summary-picture-open') : t('ocr-summary-pages-open')}
    </Button>
  </div>
</div>

<style>
  .summary {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-2) var(--space-5) var(--space-4);
  }
  section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    min-width: 0;
  }
  h3 {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-2);
  }
  .about {
    margin: 0;
    color: var(--ink-2);
    line-height: 1.5;
  }
  .warn,
  .scheme {
    margin: 0;
    padding: 6px 10px;
    border-radius: var(--radius-m);
    font-size: var(--text-sm);
    line-height: 1.45;
    color: var(--ink);
  }
  .warn {
    background: var(--gold-soft);
  }
  .scheme {
    background: var(--accent-softer);
  }
  .said {
    margin: 0;
    color: var(--ink);
  }
  .hint {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
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
  .how {
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
  }
  .open {
    display: flex;
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
  }
</style>
