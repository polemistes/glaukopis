<script lang="ts">
  /**
   * The reading settings of the workbench of a reading, in one column beside
   * the panes, always in sight: the languages, the resolution, the layout
   * and black and white, which hold for the pages selected, as the line over
   * them says, and *Try page n*, which reads the page in view with them.
   * It shows the settings of the page in view; a change goes to `onchange`,
   * and the workbench lays it on the pages selected.
   *
   * Where Tesseract is not installed, the controls are shown, disabled,
   * under the line that says so.
   */
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import ScanSearch from '@lucide/svelte/icons/scan-search';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { scriptsAlike } from './how';
  import HowControls from './HowControls.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import type { PageSettings } from './plan';

  interface Props {
    /** The settings of the page in view. */
    value: PageSettings;
    /** What the settings hold for, in words: *For all 559 pages*, *For pages 39–120*, *Settings differ*. */
    scope: string;
    /** The languages Tesseract has. */
    installed: string[];
    /** The page in view, counted from one: the page *Try* reads. */
    page: number;
    /** Whether the page in view is being tried. */
    trying: boolean;
    /** Whether the page in view can be tried now. */
    canTry: boolean;
    /** Whether Tesseract is not installed. */
    missing: boolean;
    onchange: (settings: PageSettings) => void;
    ontry: () => void;
  }

  let { value, scope, installed, page, trying, canTry, missing, onchange, ontry }: Props = $props();

  /** Scripts whose letters look alike among the languages chosen, whose letters are read as each other's. */
  const alike = $derived(missing ? [] : scriptsAlike(value.languages));
  const how = $derived({ dpi: value.dpi, layout: value.layout, contrast: value.contrast });
</script>

<aside class="settings" data-read-settings>
  <div class="controls">
    <div class="top">
      <h3>{t('ocr-settings-heading')}</h3>
      <p class="scope" data-settings-scope>{scope}</p>
    </div>
    {#if missing}
      <p class="failure selectable" role="alert" data-ocr-missing>
        <CircleAlert size={15} /> <span>{t('ocr-no-tesseract')}</span>
      </p>
    {/if}
    <LanguagePicker
      value={value.languages}
      {installed}
      label={t('ocr-languages')}
      hint={t('ocr-languages-hint')}
      disabled={missing}
      onchange={(languages) => onchange({ ...value, languages })}
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
    <!-- A fieldset that is disabled disables every control in it, those of HowControls with them. -->
    <fieldset class="how" disabled={missing}>
      <HowControls value={how} onchange={(next) => onchange({ ...value, ...next })} />
    </fieldset>
  </div>
  <div class="try">
    <Button
      variant="primary"
      size="sm"
      onclick={() => ontry()}
      disabled={missing || !canTry || trying}
      aria-busy={trying}
      data-ocr-try
    >
      {#snippet icon()}
        {#if trying}<Spinner size={13} />{:else}<ScanSearch size={14} />{/if}
      {/snippet}
      {t('ocr-settings-try', { page })}
    </Button>
  </div>
</aside>

<style>
  .settings {
    display: flex;
    flex-direction: column;
    width: 260px;
    min-width: 0;
    min-height: 0;
    max-height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: 2px 2px var(--space-3);
  }
  .top {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  h3 {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-2);
  }
  .scope {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--accent-strong);
    font-weight: 550;
    overflow-wrap: anywhere;
  }
  .how {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }
  .how:disabled {
    opacity: 0.55;
  }
  /* The button follows the controls, and stays in sight at the foot of the column where it scrolls. */
  .try {
    position: sticky;
    bottom: 0;
    padding: var(--space-2) 2px 2px;
    background: var(--paper-raised);
    border-top: 1px solid var(--line);
  }
  .try :global(.button) {
    width: 100%;
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
  .failure {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    font-size: var(--text-sm);
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
