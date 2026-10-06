<script lang="ts">
  import { onMount } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Monitor from '@lucide/svelte/icons/monitor';
  import Moon from '@lucide/svelte/icons/moon';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import Sun from '@lucide/svelte/icons/sun';
  import Flower2 from '@lucide/svelte/icons/flower-2';
  import Palette from '@lucide/svelte/icons/palette';
  import { judge, STARTS } from '$lib/theme/own';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { open as chooseFile } from '@tauri-apps/plugin-dialog';
  import {
    formatsList,
    openPath,
    stylesList,
    toolsInfo,
    type FormatSummary,
    type StyleSummary,
    type ToolsInfo,
  } from '$lib/api/documents';
  import { lookupAcknowledgements } from '$lib/api/sources';
  import { languageName, languages, t, TEXT_LANGUAGES } from '$lib/i18n';
  import { apart, PLACE } from '$lib/util/words';
  import { systemInfo, type Settings, type SystemInfo, type Theme } from '$lib/api/system';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Select from '$lib/ui/Select.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import Mark from '$lib/shell/Mark.svelte';
  import OcrSettings from '$lib/ocr/OcrSettings.svelte';
  import SpellingSettings from '$lib/spelling/SpellingSettings.svelte';

  let system = $state<SystemInfo | null>(null);
  let tools = $state<ToolsInfo | null>(null);
  let styles = $state.raw<StyleSummary[]>([]);
  let formats = $state.raw<FormatSummary[]>([]);
  let looking = $state(false);
  let thanks = $state.raw<{ service: string; words: string }[]>([]);

  // Fields that are written as they are typed, and kept when they are left.
  let name = $state('');
  let contact = $state('');
  let pandoc = $state('');

  const contactProblem = $derived(
    contact.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
      ? t('settings-contact-problem')
      : null,
  );

  onMount(async () => {
    const wait = () =>
      settings.loaded ? Promise.resolve() : new Promise((r) => setTimeout(r, 60));
    while (!settings.loaded) await wait();
    name = settings.value.displayName ?? '';
    contact = settings.value.contactEmail ?? '';
    pandoc = settings.value.pandocPath ?? '';
    try {
      [system, tools, styles, formats] = await Promise.all([
        systemInfo(),
        toolsInfo(),
        stylesList(),
        formatsList(),
      ]);
      thanks = await lookupAcknowledgements();
    } catch (error) {
      notifyError(t('settings-error-system'), error);
    }
  });

  function keep<K extends keyof Settings>(key: K, value: string) {
    const clean = value.trim() || null;
    if ((settings.value[key] ?? null) === clean) return false;
    settings.set(key, clean as Settings[K]);
    return true;
  }

  async function lookAgain() {
    looking = true;
    try {
      keep('pandocPath', pandoc);
      await settings.saveNow();
      tools = await toolsInfo(true);
    } catch (error) {
      notifyError(t('settings-error-programs'), error);
    } finally {
      looking = false;
    }
  }

  async function choose() {
    const chosen = await chooseFile({
      title: t('settings-program-where', { program: 'Pandoc' }),
      multiple: false,
    });
    if (typeof chosen !== 'string') return;
    pandoc = chosen;
    await lookAgain();
  }

  const interfaceOptions = $derived([
    {
      value: 'system',
      label: t('settings-language-system', {
        language:
          languages.interface.find((l) => l.tag === languages.interfaceDefault)?.name ??
          languages.interfaceDefault,
      }),
    },
    // In the order of their names, as the alphabets go: Latin, Greek, Cyrillic, and so on.
    ...[...languages.interface]
      .sort((a, b) => new Intl.Collator(languages.current).compare(a.name, b.name))
      .map((l) => ({ value: l.tag, label: l.name })),
  ]);
  const textOptions = $derived([
    {
      value: 'system',
      label: t('settings-language-system', { language: languageName(languages.textDefault) }),
    },
    ...TEXT_LANGUAGES.map((tag) => ({ value: tag, label: languageName(tag) })),
  ]);

  const styleOptions = $derived(
    [...styles]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((s) => ({ value: s.id, label: s.title })),
  );
  const formatOptions = $derived(
    [...formats]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({ value: f.id, label: f.name })),
  );

  // The name of the file of the library is shown as code, where the language puts it.
  const [beforeFile, afterFile] = $derived(apart(t('settings-data-hint', { file: PLACE })));

  /** How far along a slider a value lies, from 0 to 1. */
  const along = (value: number, min: number, max: number) =>
    Math.min(1, Math.max(0, (value - min) / (max - min)));
  // The size of the interface is kept when the knob is let go, as the window
  // is zoomed by it; while it is dragged, the fill and the number follow the knob.
  let interfaceSlid = $state<number | null>(null);
  const interfaceShown = $derived(interfaceSlid ?? settings.value.interfaceSize);

  /** The four colours of a colouring of one's own, in the order they are shown. */
  const OWN_COLOURS = ['paper', 'ink', 'accent', 'gold'] as const;
  /** How the colours of one's own read together. */
  const judged = $derived(judge(settings.value.ownTheme));
</script>

<!-- The title is the dialog's; the focus is taken here, so that a key does not change a setting by chance. -->
<div class="settings" tabindex="-1" data-autofocus>
  <div class="inner">
    <section>
      <h2>{t('settings-appearance')}</h2>
      <div class="row">
        <div class="what">
          <div class="label">{t('settings-theme')}</div>
        </div>
        <Segmented
          value={settings.value.theme}
          label={t('settings-theme')}
          options={[
            { value: 'system', label: t('settings-theme-system'), icon: Monitor },
            { value: 'light', label: t('settings-theme-light'), icon: Sun },
            { value: 'dark', label: t('settings-theme-dark'), icon: Moon },
            { value: 'mellow', label: t('settings-theme-mellow'), icon: Flower2 },
            { value: 'own', label: t('settings-theme-own'), icon: Palette },
          ]}
          onchange={(theme: Theme) => settings.set('theme', theme)}
        />
      </div>
      {#if settings.value.theme === 'own'}
        <div class="row top" data-own-theme>
          <div class="what">
            <div class="label">{t('settings-own')}</div>
            <div class="hint">{t('settings-own-hint')}</div>
          </div>
          <div class="own">
            <div class="swatches">
              {#each OWN_COLOURS as which (which)}
                <label class="swatch">
                  <input
                    type="color"
                    value={settings.value.ownTheme[which]}
                    oninput={(e) =>
                      settings.set('ownTheme', {
                        ...settings.value.ownTheme,
                        [which]: e.currentTarget.value,
                      })}
                  />
                  <span>{t(`settings-own-${which}`)}</span>
                </label>
              {/each}
            </div>
            <div class="begin">
              <span class="hint">{t('settings-own-begin')}</span>
              {#each ['light', 'dark', 'mellow'] as const as start (start)}
                <Button
                  size="sm"
                  variant="ghost"
                  onclick={() => settings.set('ownTheme', { ...STARTS[start] })}
                >
                  {t(`settings-theme-${start}`)}
                </Button>
              {/each}
            </div>
            {#if !judged.fine}
              <p class="hint warn">
                <TriangleAlert size={13} />
                {t('settings-own-weak', {
                  ink: judged.ink.toFixed(1),
                  accent: judged.accent.toFixed(1),
                })}
              </p>
            {/if}
          </div>
        </div>
      {/if}
      <div class="row top">
        <div class="what">
          <label class="label" for="interface-size">{t('settings-interface-size')}</label>
          <div class="hint">{t('settings-interface-size-hint')}</div>
        </div>
        <div class="size">
          <span class="slider" style:--fill={along(interfaceShown, 0.9, 1.5)}>
            <input
              id="interface-size"
              type="range"
              min="0.9"
              max="1.5"
              step="0.05"
              value={settings.value.interfaceSize}
              oninput={(e) => (interfaceSlid = Number(e.currentTarget.value))}
              onchange={(e) => {
                settings.set('interfaceSize', Number(e.currentTarget.value));
                interfaceSlid = null;
              }}
            />
          </span>
          <span class="number">{Math.round(interfaceShown * 100)} %</span>
        </div>
      </div>
      <div class="row top">
        <div class="what">
          <label class="label" for="text-size">{t('settings-text-size')}</label>
          <div class="hint">
            {t('settings-text-size-hint')}
          </div>
        </div>
        <div class="size">
          <span class="slider" style:--fill={along(settings.value.textSize, 14, 22)}>
            <input
              id="text-size"
              type="range"
              min="14"
              max="22"
              step="1"
              value={settings.value.textSize}
              oninput={(e) => settings.set('textSize', Number(e.currentTarget.value))}
            />
          </span>
          <span class="number">{settings.value.textSize}</span>
        </div>
      </div>
      <p class="sample serif" style:font-size="{settings.value.textSize}px">
        {t('settings-sample')} — <span lang="grc">μῆνιν ἄειδε θεά</span>.
      </p>
    </section>

    <section>
      <h2>{t('settings-language')}</h2>
      <p class="about">
        {t('settings-language-interface-hint')}
        {t('settings-language-texts-hint')}
      </p>
      <div class="pair">
        <Select
          value={settings.value.language}
          label={t('settings-language-interface')}
          options={interfaceOptions}
          onchange={(tag) => settings.set('language', tag)}
        />
        <Select
          value={settings.value.textLanguage}
          label={t('settings-language-texts')}
          options={textOptions}
          onchange={(tag) => settings.set('textLanguage', tag)}
        />
      </div>
    </section>

    <SpellingSettings />

    <section>
      <h2>{t('settings-new-documents')}</h2>
      <p class="about">{t('settings-new-documents-hint')}</p>
      <div class="pair">
        {#if styleOptions.length}
          <Select
            value={settings.value.defaultStyle}
            label={t('settings-reference-style')}
            options={styleOptions}
            onchange={(id) => settings.set('defaultStyle', id)}
          />
        {/if}
        {#if formatOptions.length}
          <Select
            value={settings.value.defaultFormat}
            label={t('settings-document-format')}
            options={formatOptions}
            onchange={(id) => settings.set('defaultFormat', id)}
          />
        {/if}
      </div>
    </section>

    <section>
      <h2>{t('settings-you')}</h2>
      <div class="fields">
        <TextField
          bind:value={name}
          label={t('settings-name')}
          hint={t('settings-name-hint')}
          onblur={() => keep('displayName', name)}
        />
        <TextField
          bind:value={contact}
          type="email"
          label={t('settings-contact')}
          hint={t('settings-contact-hint')}
          error={contactProblem}
          spellcheck="false"
          onblur={() => !contactProblem && keep('contactEmail', contact)}
        />
      </div>
    </section>

    <section>
      <h2>{t('settings-programs')}</h2>
      <p class="about">
        {t('settings-programs-about')}
      </p>
      {#each [{ id: 'pandoc', name: 'Pandoc', found: tools?.pandoc, need: t('settings-pandoc-need') }] as const as program (program.id)}
        <div class="program">
          <div class="state" class:missing={tools && (!program.found || !!program.found.least)}>
            {#if !tools}
              <span class="mark"></span>
            {:else if program.found && !program.found.least}
              <span class="mark ok"><Check size={13} /></span>
            {:else}
              <span class="mark"><TriangleAlert size={13} /></span>
            {/if}
            <div>
              <div class="label">
                {program.name}
                {#if program.found}<span class="version">{program.found.version}</span>{/if}
              </div>
              <div class="hint">
                {#if !tools}
                  {t('settings-looking')}
                {:else if program.found?.least}
                  {t('settings-program-old', { least: program.found.least })}
                {:else if program.found}
                  {program.found.path}
                {:else}
                  {t('settings-program-missing', { need: program.need })}
                {/if}
              </div>
            </div>
          </div>
          <div class="path">
            <TextField
              bind:value={pandoc}
              size="sm"
              placeholder={t('settings-program-found-by-itself')}
              aria-label={t('settings-program-where', { program: 'Pandoc' })}
              spellcheck="false"
              onblur={() => keep('pandocPath', pandoc) && lookAgain()}
            />
            <Button size="sm" onclick={choose}>{t('common-choose')}</Button>
          </div>
        </div>
      {/each}
      <OcrSettings {tools} onlooked={(found) => (tools = found)} />
      {#if tools && tools.pandoc && !tools.latex.length}
        <p class="hint note">
          {t('settings-no-latex')}
        </p>
      {/if}
      <div>
        <Button size="sm" disabled={looking} onclick={lookAgain}>
          {#snippet icon()}<RefreshCw size={13} />{/snippet}
          {t('settings-look-again')}
        </Button>
      </div>
    </section>

    <section class="last">
      <h2>{t('settings-about')}</h2>
      <div class="aboutus">
        <Mark size={44} />
        <div>
          <div class="label">Glaukopis {system?.version ?? ''}</div>
          <div class="hint">
            {t('settings-licence')}
          </div>
          <div class="hint credit">
            {t('settings-owl')}
          </div>
        </div>
      </div>
      <div class="row top">
        <div class="what">
          <div class="label">{t('settings-data')}</div>
          <div class="hint path-text">{system?.dataDir ?? ''}</div>
          <div class="hint">
            {beforeFile}<code>library/library.bib</code>{afterFile}
          </div>
        </div>
        <Button size="sm" disabled={!system} onclick={() => system && openPath(system.dataDir)}>
          {#snippet icon()}<FolderOpen size={13} />{/snippet}
          {t('common-open')}
        </Button>
      </div>
      <div>
        <div class="label">{t('settings-lookup')}</div>
        <div class="hint">
          {t('settings-lookup-about')}
        </div>
        {#each thanks as t (t.service)}
          <div class="hint">{t.words}</div>
        {/each}
      </div>
    </section>
  </div>
</div>

<style>
  .settings {
    outline: none;
  }
  .inner {
    padding: 0 0 8px;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 26px 0;
    border-bottom: 1px solid var(--line);
  }
  section:first-child {
    padding-top: 6px;
  }
  section.last {
    border-bottom: none;
  }
  h2 {
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .about {
    margin-top: -8px;
    color: var(--ink-2);
    line-height: 1.5;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .row.top {
    align-items: flex-start;
  }
  .what {
    flex: 1;
    min-width: 0;
  }
  .label {
    font-weight: 550;
  }
  .hint {
    margin-top: 2px;
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .hint.credit {
    margin-top: 4px;
  }
  .hint code {
    font-family: var(--font-mono);
    font-size: 0.95em;
  }
  .path-text {
    font-family: var(--font-mono);
    color: var(--ink-2);
    overflow-wrap: anywhere;
    user-select: all;
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .size {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: none;
  }
  /* A slider drawn by us: the knob's centre travels over the track less the
     knob's width, so the filled part of the line is measured the same way,
     and ends under the knob wherever it is. The fill is a part of the
     wrapper, so that its width can be read. */
  .slider {
    --thumb: 16px;
    --track: 4px;
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 170px;
    height: 20px;
  }
  .slider::before,
  .slider::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    height: var(--track);
    margin-top: calc(var(--track) / -2);
    border-radius: calc(var(--track) / 2);
    pointer-events: none;
  }
  .slider::before {
    right: 0;
    background: var(--line-strong);
  }
  .slider::after {
    width: calc(var(--fill, 0) * (100% - var(--thumb)) + var(--thumb) / 2);
    background: var(--accent);
  }
  .slider input {
    position: relative;
    width: 100%;
    height: 20px;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }
  .slider input:focus-visible {
    outline: none;
  }
  .slider input::-webkit-slider-runnable-track {
    height: var(--track);
    background: transparent;
    border: none;
  }
  .slider input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--thumb);
    height: var(--thumb);
    margin-top: calc((var(--track) - var(--thumb)) / 2);
    border: 2px solid var(--paper-raised);
    border-radius: 50%;
    background: var(--accent);
    box-shadow: var(--shadow-1);
  }
  .slider input:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .number {
    /* As wide as "150 %", so that the sliders stand under one another. */
    min-width: 5.5ch;
    text-align: right;
    white-space: nowrap;
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .sample {
    padding: 14px 18px;
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    border: 1px solid var(--line);
    line-height: 1.6;
  }
  .fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .program {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
  }
  .state {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 20px;
    height: 20px;
    margin-top: 1px;
    border-radius: 50%;
    background: var(--gold-soft);
    color: var(--warn);
  }
  .mark.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .version {
    margin-left: 6px;
    color: var(--ink-3);
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }
  .path {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
    padding-left: 30px;
  }
  .note {
    margin-top: -4px;
  }
  .aboutus {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .own {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }
  .swatch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    cursor: pointer;
  }
  .swatch input {
    width: 34px;
    height: 26px;
    padding: 0;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: none;
    cursor: pointer;
  }
  .begin {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .hint.warn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--warn);
  }
</style>
