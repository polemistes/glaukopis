<script lang="ts">
  /**
   * The settings of the phone (stage 2 of `docs/plans/an-app-for-android.md`,
   * part E): the row at the top, with Back, and under it, one under another,
   * the synchronization (the one section of the computers, told that this
   * device takes the notes), the language, the colours, and what this is.
   * Only what a phone can choose is here: the language, and the colours of
   * the system, light or dark; not *Mellow*, nor *Your own*.
   */
  import { onMount } from 'svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { systemInfo, type Theme } from '$lib/api/system';
  import { languages, t } from '$lib/i18n';
  import { settings } from '$lib/state/settings.svelte';
  import SyncSettings from '$lib/sync/SyncSettings.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import TopBar from './TopBar.svelte';

  /** The version of the program, once the shell has said it. */
  let version = $state('');
  onMount(() => {
    systemInfo()
      .then((info) => (version = info.version))
      .catch((error) => console.warn('The version could not be asked', error));
  });

  /** The language of the interface chosen, or `system`: one no longer offered is shown as the system's. */
  const chosen = $derived(
    languages.interface.some((l) => l.tag === settings.value.language)
      ? settings.value.language
      : 'system',
  );
  const options = $derived([
    {
      value: 'system',
      label: t('settings-language-system', {
        language:
          languages.interface.find((l) => l.tag === languages.interfaceDefault)?.name ??
          languages.interfaceDefault,
      }),
    },
    // In the order of their names, as the application's settings have them.
    ...[...languages.interface]
      .sort((a, b) => new Intl.Collator(languages.current).compare(a.name, b.name))
      .map((l) => ({ value: l.tag, label: l.name })),
  ]);
</script>

<section class="place" data-phone-settings>
  <TopBar title={t('settings-title')} back />
  <div class="body">
    <SyncSettings takes="notes" />

    <section class="block">
      <h2>{t('settings-language')}</h2>
      <!-- The system's own chooser of one of a list. -->
      <div class="choose">
        <select
          value={chosen}
          aria-label={t('settings-language')}
          data-phone-language
          onchange={(e) => settings.set('language', e.currentTarget.value)}
        >
          {#each options as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
        <span class="chevron"><ChevronDown size={14} /></span>
      </div>
    </section>

    <section class="block">
      <h2>{t('settings-theme')}</h2>
      <!-- Where the file says Mellow or one's own, none of the three is shown as chosen. -->
      <div class="colours" data-phone-theme={settings.value.theme}>
        <Segmented
          value={settings.value.theme}
          label={t('settings-theme')}
          options={[
            { value: 'system', label: t('settings-theme-system') },
            { value: 'light', label: t('settings-theme-light') },
            { value: 'dark', label: t('settings-theme-dark') },
          ]}
          onchange={(theme: Theme) => settings.set('theme', theme)}
        />
      </div>
    </section>

    <section class="block last" data-phone-about>
      <h2>{t('settings-about')}</h2>
      <div>
        <div class="name">Glaukopis{version ? ` ${version}` : ''}</div>
        <p class="hint">{t('settings-licence')}</p>
      </div>
    </section>
  </div>
</section>

<style>
  .place {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
  }
  .body {
    flex: 1;
    min-height: 0;
    padding-inline: 16px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  /* A section, as those of the settings of a computer are drawn. */
  .block {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 26px 0;
    border-bottom: 1px solid var(--line);
  }
  .block.last {
    border-bottom: none;
  }
  h2 {
    margin: 0;
    font-family: var(--font-text);
    font-size: var(--text-xl);
    font-weight: 600;
    letter-spacing: -0.005em;
  }
  .choose {
    position: relative;
    display: flex;
    align-items: center;
  }
  select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    min-height: 44px;
    /* WebKit lays out the options as wide as the longest is, past the
       chooser: they would widen what it stands in, and have it scroll. */
    overflow-x: clip;
    padding: 0 32px 0 12px;
    background: var(--paper-raised);
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    text-overflow: ellipsis;
  }
  select:focus-visible {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .chevron {
    position: absolute;
    right: 12px;
    display: inline-flex;
    color: var(--ink-3);
    pointer-events: none;
  }
  /* The three choices share the width there is, and what they say may take
     a line more where the system sets the letters large: nothing is cut
     or lies outside the window. */
  .colours {
    min-width: 0;
  }
  .colours :global(.segmented) {
    display: flex;
    width: 100%;
  }
  .colours :global(.segmented button) {
    flex: 1 1 0;
    justify-content: center;
    height: auto;
    min-width: 0;
    min-height: 44px;
    overflow-wrap: anywhere;
  }
  .name {
    font-weight: 550;
  }
  .hint {
    margin: 2px 0 0;
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
</style>
