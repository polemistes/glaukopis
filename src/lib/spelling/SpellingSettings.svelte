<script lang="ts">
  /**
   * Spelling, under the languages of the settings: whether it is checked,
   * the dictionaries there are, of the system or imported, the importing of
   * more, and the words added to them.
   */
  import { onMount } from 'svelte';
  import { languagesRemove } from '$lib/api/languages';
  import { spellingLanguages, type Dictionary } from '$lib/api/spelling';
  import { languageName, languages, t } from '$lib/i18n';
  import LanguagePackages from '$lib/languages/LanguagePackages.svelte';
  import LanguageRows, { type LanguageRow } from '$lib/languages/LanguageRows.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import OwnWordsDialog from './OwnWordsDialog.svelte';
  import { spelling } from './spelling.svelte';

  let dictionaries = $state.raw<Dictionary[] | null>(null);
  let busy = $state(false);
  let managing = $state(false);

  async function load() {
    try {
      dictionaries = await spellingLanguages();
    } catch (error) {
      notifyError(t('spelling-settings-failed'), error);
    }
  }

  onMount(load);

  function turn(on: 'on' | 'off') {
    settings.set('spelling', on === 'on');
    spelling.anew();
  }

  /** Where a dictionary was found, in words. */
  function source(d: Dictionary): string {
    if (d.source === 'imported') return t('spelling-source-imported');
    if (d.source === 'application') return t('spelling-source-application');
    if (d.source === 'system') return t('spelling-source-system');
    return t('spelling-source-own');
  }

  const rows = $derived<LanguageRow[]>(
    (dictionaries ?? [])
      .map((d) => ({
        id: d.name,
        name: languageName(d.tag),
        source: source(d),
        imported: d.source === 'imported',
      }))
      .sort((a, b) => a.name.localeCompare(b.name, languages.current)),
  );

  async function remove(row: LanguageRow) {
    busy = true;
    try {
      await languagesRemove('spelling', row.id);
      await load();
      spelling.anew();
    } catch (error) {
      notifyError(t('packages-remove-failed', { name: row.name }), error);
    } finally {
      busy = false;
    }
  }
</script>

<div class="part" data-spelling-settings>
  <h3>{t('spelling-settings')}</h3>
  <p class="about">{t('spelling-settings-about')}</p>
  <div class="row">
    <div class="what">
      <div class="label">{t('spelling-check')}</div>
    </div>
    <Segmented
      value={settings.value.spelling === false ? 'off' : 'on'}
      label={t('spelling-check')}
      options={[
        { value: 'on', label: t('spelling-on') },
        { value: 'off', label: t('spelling-off-short') },
      ]}
      onchange={turn}
    />
  </div>

  <div data-dictionaries>
    <div class="label">{t('spelling-dictionaries')}</div>
    {#if dictionaries}
      <LanguageRows {rows} {busy} onremove={remove} />
    {/if}
  </div>

  <LanguagePackages
    kind="spelling"
    onchanged={() => {
      load();
      spelling.anew();
    }}
  />

  <div>
    <Button size="sm" onclick={() => (managing = true)} data-manage-words>
      {t('spelling-manage-words')}
    </Button>
  </div>
</div>

{#if managing}
  <OwnWordsDialog onclose={() => (managing = false)} />
{/if}

<style>
  .part {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  h3 {
    font-family: var(--font-text);
    font-size: var(--text-lg);
    font-weight: 600;
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
  .what {
    flex: 1;
    min-width: 0;
  }
  .label {
    font-weight: 550;
  }
</style>
