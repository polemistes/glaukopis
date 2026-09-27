<script lang="ts">
  import { onMount } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Monitor from '@lucide/svelte/icons/monitor';
  import Moon from '@lucide/svelte/icons/moon';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import Sun from '@lucide/svelte/icons/sun';
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
  import { systemInfo, type Settings, type SystemInfo, type Theme } from '$lib/api/system';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Select from '$lib/ui/Select.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import Mark from '$lib/shell/Mark.svelte';

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
  let typst = $state('');

  const contactProblem = $derived(
    contact.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())
      ? 'That does not look like an address.'
      : null,
  );

  onMount(async () => {
    const wait = () =>
      settings.loaded ? Promise.resolve() : new Promise((r) => setTimeout(r, 60));
    while (!settings.loaded) await wait();
    name = settings.value.displayName ?? '';
    contact = settings.value.contactEmail ?? '';
    pandoc = settings.value.pandocPath ?? '';
    typst = settings.value.typstPath ?? '';
    try {
      [system, tools, styles, formats] = await Promise.all([
        systemInfo(),
        toolsInfo(),
        stylesList(),
        formatsList(),
      ]);
      thanks = await lookupAcknowledgements();
    } catch (error) {
      notifyError('Something about the application could not be read', error);
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
      keep('typstPath', typst);
      await settings.saveNow();
      tools = await toolsInfo(true);
    } catch (error) {
      notifyError('The programs could not be looked for', error);
    } finally {
      looking = false;
    }
  }

  async function choose(which: 'pandoc' | 'typst') {
    const chosen = await chooseFile({
      title: `Where ${which === 'pandoc' ? 'Pandoc' : 'Typst'} is`,
      multiple: false,
    });
    if (typeof chosen !== 'string') return;
    if (which === 'pandoc') pandoc = chosen;
    else typst = chosen;
    await lookAgain();
  }

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
</script>

<div class="settings">
  <div class="inner">
    <h1>Settings</h1>

    <section>
      <h2>Appearance</h2>
      <div class="row">
        <div class="what">
          <div class="label">Light or dark</div>
        </div>
        <Segmented
          value={settings.value.theme}
          label="Light or dark"
          options={[
            { value: 'system', label: 'As the system', icon: Monitor },
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
          ]}
          onchange={(theme: Theme) => settings.set('theme', theme)}
        />
      </div>
      <div class="row top">
        <div class="what">
          <label class="label" for="text-size">Size of your text</label>
          <div class="hint">
            In the maps and the text view. What is exported follows the document format.
          </div>
        </div>
        <div class="size">
          <input
            id="text-size"
            type="range"
            min="14"
            max="22"
            step="1"
            value={settings.value.textSize}
            oninput={(e) => settings.set('textSize', Number(e.currentTarget.value))}
          />
          <span class="number">{settings.value.textSize}</span>
        </div>
      </div>
      <p class="sample serif" style:font-size="{settings.value.textSize}px">
        Sing, goddess, the wrath of Achilles, son of Peleus — <span lang="grc">μῆνιν ἄειδε θεά</span
        >.
      </p>
    </section>

    <section>
      <h2>New documents</h2>
      <p class="about">What a map begins with. Each map can be given another, in the preview.</p>
      <div class="pair">
        {#if styleOptions.length}
          <Select
            value={settings.value.defaultStyle}
            label="Reference style"
            options={styleOptions}
            onchange={(id) => settings.set('defaultStyle', id)}
          />
        {/if}
        {#if formatOptions.length}
          <Select
            value={settings.value.defaultFormat}
            label="Document format"
            options={formatOptions}
            onchange={(id) => settings.set('defaultFormat', id)}
          />
        {/if}
      </div>
    </section>

    <section>
      <h2>You</h2>
      <div class="fields">
        <TextField
          bind:value={name}
          label="Name"
          hint="Shown to those you share projects with. Not used otherwise."
          onblur={() => keep('displayName', name)}
        />
        <TextField
          bind:value={contact}
          type="email"
          label="Address for bibliographic services"
          hint="Services such as Crossref answer more readily to those who say how they can be reached. If you enter an address, it is sent to them with each lookup, and to no one else. Leave it empty to send none."
          error={contactProblem}
          spellcheck="false"
          onblur={() => !contactProblem && keep('contactEmail', contact)}
        />
      </div>
    </section>

    <section>
      <h2>Programs</h2>
      <p class="about">
        Glaukopis makes documents with Pandoc, and pages to preview and print with Typst. They are
        found by themselves where they are installed in the usual way.
      </p>
      {#each [{ id: 'pandoc', name: 'Pandoc', found: tools?.pandoc, need: 'Needed for the preview and for every export.' }, { id: 'typst', name: 'Typst', found: tools?.typst, need: 'Needed for the preview of pages, and for PDF.' }] as const as program (program.id)}
        <div class="program">
          <div class="state" class:missing={tools && !program.found}>
            {#if !tools}
              <span class="mark"></span>
            {:else if program.found}
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
                  Looking…
                {:else if program.found}
                  {program.found.path}
                {:else}
                  Not found. {program.need} Install it with the package manager of your system, or say
                  below where it is.
                {/if}
              </div>
            </div>
          </div>
          <div class="path">
            {#if program.id === 'pandoc'}
              <TextField
                bind:value={pandoc}
                size="sm"
                placeholder="Found by itself"
                aria-label="Where Pandoc is"
                spellcheck="false"
                onblur={() => keep('pandocPath', pandoc) && lookAgain()}
              />
            {:else}
              <TextField
                bind:value={typst}
                size="sm"
                placeholder="Found by itself"
                aria-label="Where Typst is"
                spellcheck="false"
                onblur={() => keep('typstPath', typst) && lookAgain()}
              />
            {/if}
            <Button size="sm" onclick={() => choose(program.id)}>Choose…</Button>
          </div>
        </div>
      {/each}
      {#if tools && tools.pandoc && !tools.latex.length}
        <p class="hint note">
          No LaTeX was found. It is not needed: LaTeX source can be exported without it, and PDF is
          made with Typst.
        </p>
      {/if}
      <div>
        <Button size="sm" disabled={looking} onclick={lookAgain}>
          {#snippet icon()}<RefreshCw size={13} />{/snippet}
          Look again
        </Button>
      </div>
    </section>

    <section class="last">
      <h2>About</h2>
      <div class="aboutus">
        <Mark size={44} />
        <div>
          <div class="label">Glaukopis {system?.version ?? ''}</div>
          <div class="hint">
            Free software under the GNU General Public License, version 3 or later. It comes without
            warranty.
          </div>
        </div>
      </div>
      <div class="row top">
        <div class="what">
          <div class="label">Where everything is kept</div>
          <div class="hint path-text">{system?.dataDir ?? ''}</div>
          <div class="hint">
            Your references are in <code>library/library.bib</code>, which any BibLaTeX tool can
            read. To keep a copy of your work, copy this folder.
          </div>
        </div>
        <Button size="sm" disabled={!system} onclick={() => system && openPath(system.dataDir)}>
          {#snippet icon()}<FolderOpen size={13} />{/snippet}
          Open
        </Button>
      </div>
      <div>
        <div class="label">Where references are looked up</div>
        <div class="hint">
          DOIs at doi.org, Crossref and DataCite; books in the catalogues K10plus, of the Norwegian
          academic libraries, of the Deutsche Nationalbibliothek and of the Library of Congress;
          preprints at arXiv; medical literature at PubMed. Only what you type into the lookup is
          sent to them.
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
    height: 100%;
    overflow-y: auto;
  }
  .inner {
    max-width: 660px;
    margin: 0 auto;
    padding: 44px 40px 80px;
  }
  h1 {
    margin-bottom: 8px;
    font-family: var(--font-text);
    font-size: var(--text-3xl);
    font-weight: 500;
    letter-spacing: -0.015em;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 26px 0;
    border-bottom: 1px solid var(--line);
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
  .size input {
    width: 170px;
    accent-color: var(--accent);
  }
  .number {
    width: 2ch;
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
</style>
