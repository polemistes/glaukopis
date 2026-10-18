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
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import IndentIncrease from '@lucide/svelte/icons/list-indent-increase';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import Network from '@lucide/svelte/icons/network';
  import FileText from '@lucide/svelte/icons/file-text';
  import { judge, STARTS } from '$lib/theme/own';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { open as chooseFile } from '@tauri-apps/plugin-dialog';
  import {
    fontsList,
    formatsList,
    openPath,
    stylesList,
    toolsInfo,
    type FormatSummary,
    type StyleSummary,
    type ToolsInfo,
  } from '$lib/api/documents';
  import { templatesList, type TemplateSummary } from '$lib/api/templates';
  import { templateGroupWords, TEMPLATE_GROUPS } from '$lib/document/templates';
  import { languageName, languages, t, TEXT_LANGUAGES } from '$lib/i18n';
  import { apart, PLACE } from '$lib/util/words';
  import {
    systemInfo,
    type Settings,
    type SystemInfo,
    type TextDepth,
    type Theme,
  } from '$lib/api/system';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Select from '$lib/ui/Select.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import Mark from '$lib/shell/Mark.svelte';
  import OcrLanguageSettings from '$lib/ocr/OcrLanguageSettings.svelte';
  import OcrSettings from '$lib/ocr/OcrSettings.svelte';
  import CreditsDialog from './CreditsDialog.svelte';
  import StructureSample from './StructureSample.svelte';
  import SpellingSettings from '$lib/spelling/SpellingSettings.svelte';
  import WordsSettings from '$lib/words/WordsSettings.svelte';

  let system = $state<SystemInfo | null>(null);
  let tools = $state<ToolsInfo | null>(null);
  let styles = $state.raw<StyleSummary[]>([]);
  let formats = $state.raw<FormatSummary[]>([]);
  let templates = $state.raw<TemplateSummary[]>([]);
  let looking = $state(false);
  let fonts = $state.raw<string[]>([]);
  /** The window of credits and licences is open. */
  let crediting = $state(false);

  // Fields that are written as they are typed, and kept when they are left.
  let firstName = $state('');
  let lastName = $state('');
  let organization = $state('');
  let position = $state('');
  let address = $state('');
  let phone = $state('');
  let contact = $state('');
  let orcid = $state('');
  let pandoc = $state('');

  const contactProblem = $derived(
    contact.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
      ? t('settings-contact-problem')
      : null,
  );

  /** An ORCID iD, alone or as its address: 0000-0002-1825-0097. */
  const ORCID = /^(https?:\/\/orcid\.org\/)?\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i;

  const orcidProblem = $derived(
    orcid.trim() && !ORCID.test(orcid.trim()) ? t('settings-orcid-problem') : null,
  );

  onMount(async () => {
    const wait = () =>
      settings.loaded ? Promise.resolve() : new Promise((r) => setTimeout(r, 60));
    while (!settings.loaded) await wait();
    const v = settings.value;
    // A name given before the first and the last were asked for: its last word is the last name.
    if (v.firstName == null && v.lastName == null && v.displayName?.trim()) {
      const words = v.displayName.trim().split(/\s+/);
      lastName = words.length > 1 ? words.pop()! : '';
      firstName = words.join(' ');
    } else {
      firstName = v.firstName ?? '';
      lastName = v.lastName ?? '';
    }
    organization = v.organization ?? '';
    position = v.position ?? '';
    address = v.address ?? '';
    phone = v.phone ?? '';
    contact = v.contactEmail ?? '';
    orcid = v.orcid ?? '';
    pandoc = v.pandocPath ?? '';
    fontsList()
      .then((list) => (fonts = list))
      .catch(() => {});
    try {
      [system, tools, styles, formats, templates] = await Promise.all([
        systemInfo(),
        toolsInfo(),
        stylesList(),
        formatsList(),
        // Nothing, where the core has no templates to list.
        templatesList().catch(() => []),
      ]);
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

  /** The first and the last name kept, and the name shown to collaborators made of them. */
  function keepName() {
    keep('firstName', firstName);
    keep('lastName', lastName);
    const whole = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (whole) keep('displayName', whole);
  }

  /** The fonts the editor may set the text in: that of the interface first. */
  const fontOptions = $derived([
    { value: '', label: t('settings-editor-font-default') },
    ...[...fonts]
      .sort((a, b) => a.localeCompare(b, languages.current))
      .map((f) => ({ value: f, label: f })),
  ]);

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
  /** The templates in their groups, as the chooser of the document settings has them. */
  const templateOptions = $derived(
    TEMPLATE_GROUPS.flatMap((group) =>
      templates
        .filter((s) => s.group === group)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({ value: s.id, label: s.name, group: templateGroupWords(group) })),
    ),
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
      <div class="row top">
        <div class="what">
          <div class="label">{t('settings-editor-font')}</div>
          <div class="hint">{t('settings-editor-font-hint')}</div>
        </div>
        <div class="font" data-editor-font>
          <Select
            value={settings.value.editorFont ?? ''}
            ariaLabel={t('settings-editor-font')}
            options={fontOptions}
            onchange={(font) => settings.set('editorFont', font || null)}
          />
        </div>
      </div>
      <div class="row top">
        <div class="what">
          <div class="label">{t('settings-text-depth')}</div>
          <div class="hint">{t('settings-text-depth-hint')}</div>
        </div>
        <Segmented
          value={settings.value.textDepth ?? 'numbers'}
          label={t('settings-text-depth')}
          options={[
            { value: 'numbers', label: t('settings-text-depth-numbers'), icon: ListOrdered },
            { value: 'dots', label: t('settings-text-depth-dots'), icon: Ellipsis },
            { value: 'indent', label: t('settings-text-depth-indent'), icon: IndentIncrease },
          ]}
          onchange={(depth: TextDepth) => settings.set('textDepth', depth)}
        />
      </div>
      <StructureSample
        depth={settings.value.textDepth ?? 'numbers'}
        size={settings.value.textSize}
      />
    </section>

    <section>
      <h2>{t('settings-new-documents')}</h2>
      <div class="row top" data-new-project-view>
        <div class="what">
          <div class="label">{t('settings-new-project-view')}</div>
          <div class="hint">{t('settings-new-project-view-hint')}</div>
        </div>
        <Segmented
          value={settings.value.newProjectView ?? 'diagram'}
          label={t('settings-new-project-view')}
          options={[
            { value: 'diagram', label: t('project-diagram'), icon: Network },
            { value: 'text', label: t('project-text'), icon: FileText },
          ]}
          onchange={(view: 'diagram' | 'text') => settings.set('newProjectView', view)}
        />
      </div>
      <div class="pair three">
        {#if templateOptions.length}
          <Select
            value={settings.value.defaultTemplate}
            label={t('settings-template')}
            options={templateOptions}
            onchange={(id) => settings.set('defaultTemplate', id)}
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
        {#if styleOptions.length}
          <Select
            value={settings.value.defaultStyle}
            label={t('settings-reference-style')}
            options={styleOptions}
            onchange={(id) => settings.set('defaultStyle', id)}
          />
        {/if}
      </div>
    </section>

    <section>
      <h2>{t('settings-language')}</h2>
      <div class="pair">
        <!-- A language chosen once and no longer offered shows as the system's, which the interface then has. -->
        <Select
          value={languages.interface.some((l) => l.tag === settings.value.language)
            ? settings.value.language
            : 'system'}
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
      <div class="sub">
        <SpellingSettings />
      </div>
      <div class="sub">
        <OcrLanguageSettings {tools} onlooked={(found) => (tools = found)} />
      </div>
    </section>

    <section data-your-details>
      <h2>{t('settings-you')}</h2>
      <div class="fields two">
        <TextField
          bind:value={firstName}
          label={t('settings-first-name')}
          autocomplete="given-name"
          onblur={keepName}
        />
        <TextField
          bind:value={lastName}
          label={t('settings-last-name')}
          autocomplete="family-name"
          onblur={keepName}
        />
        <TextField
          bind:value={organization}
          label={t('settings-organization')}
          autocomplete="organization"
          onblur={() => keep('organization', organization)}
        />
        <TextField
          bind:value={position}
          label={t('settings-position')}
          autocomplete="organization-title"
          onblur={() => keep('position', position)}
        />
        <div class="wide">
          <TextField
            bind:value={address}
            label={t('settings-address')}
            autocomplete="street-address"
            onblur={() => keep('address', address)}
          />
        </div>
        <TextField
          bind:value={phone}
          type="tel"
          label={t('settings-phone')}
          autocomplete="tel"
          spellcheck="false"
          onblur={() => keep('phone', phone)}
        />
        <TextField
          bind:value={contact}
          type="email"
          label={t('settings-email')}
          error={contactProblem}
          autocomplete="email"
          spellcheck="false"
          onblur={() => !contactProblem && keep('contactEmail', contact)}
        />
        <TextField
          bind:value={orcid}
          label={t('settings-orcid')}
          placeholder="0000-0000-0000-0000"
          error={orcidProblem}
          spellcheck="false"
          onblur={() => !orcidProblem && keep('orcid', orcid)}
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

    <section data-translation-project>
      <h2>{t('words-title')}</h2>
      <p class="about">{t('words-hint')}</p>
      <WordsSettings />
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
          <div class="credits">
            <Button size="sm" onclick={() => (crediting = true)} data-credits-button>
              {t('credits-button')}
            </Button>
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
      <div class="row top">
        <div class="what">
          <div class="label">{t('settings-logs')}</div>
          <div class="hint">{t('settings-logs-hint', { count: 10 })}</div>
        </div>
        <Button
          size="sm"
          disabled={!system}
          onclick={() => system && openPath(system.logs)}
          data-open-logs
        >
          {#snippet icon()}<FolderOpen size={13} />{/snippet}
          {t('common-open')}
        </Button>
      </div>
    </section>
  </div>
</div>

{#if crediting}
  <CreditsDialog onclose={() => (crediting = false)} />
{/if}

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
  .credits {
    margin-top: 8px;
  }
  .sub {
    padding-top: 12px;
  }
  .font {
    flex: none;
    width: 240px;
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
  .pair.three {
    grid-template-columns: 1fr 1fr 1fr;
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
  .fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .fields.two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .fields .wide {
    grid-column: 1 / -1;
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
