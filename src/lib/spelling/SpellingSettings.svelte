<script lang="ts">
  import { onMount } from 'svelte';
  import X from '@lucide/svelte/icons/x';
  import { spellingLanguages, spellingWords, type Dictionary } from '$lib/api/spelling';
  import { systemInfo } from '$lib/api/system';
  import { languageName, t } from '$lib/i18n';
  import { settings } from '$lib/state/settings.svelte';
  import LanguagePackages from '$lib/languages/LanguagePackages.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { spelling } from './spelling.svelte';

  /** The dictionaries there are, and the writer's own words, by language. */
  let dictionaries = $state.raw<Dictionary[] | null>(null);
  let words = $state.raw<[string, string[]][]>([]);
  let folder = $state('');

  const collator = $derived(new Intl.Collator(undefined, { sensitivity: 'base' }));

  async function load() {
    try {
      const [found, own, system] = await Promise.all([
        spellingLanguages(),
        spellingWords(),
        systemInfo(),
      ]);
      dictionaries = found;
      words = Object.entries(own).sort(([a], [b]) => a.localeCompare(b));
      folder = `${system.dataDir}/dictionaries`;
    } catch (error) {
      notifyError(t('spelling-settings-failed'), error);
    }
  }

  onMount(load);

  function turn(on: 'on' | 'off') {
    settings.set('spelling', on === 'on');
    spelling.anew();
  }

  async function remove(language: string, word: string) {
    try {
      await spelling.removeWord(language, word);
      const own = await spellingWords();
      words = Object.entries(own).sort(([a], [b]) => a.localeCompare(b));
    } catch (error) {
      notifyError(t('spelling-remove-failed'), error);
    }
  }

  /** Where a dictionary was found, in words. */
  function source(d: Dictionary): string {
    if (d.source === 'imported') return t('spelling-source-imported');
    if (d.source === 'application') return t('spelling-source-application');
    if (d.source === 'system') return t('spelling-source-system');
    return t('spelling-source-own');
  }
</script>

<section>
  <h2>{t('spelling-settings')}</h2>
  <p class="about">{t('spelling-settings-about')}</p>
  <!-- The Norwegian dictionaries ask that their source is named where they are used. -->
  <p class="about source">{t('spelling-norwegian-source')}</p>
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

  <div>
    <div class="label">{t('spelling-dictionaries')}</div>
    <div class="hint">{t('spelling-dictionaries-hint', { folder })}</div>
    {#if dictionaries}
      <ul class="dictionaries" data-dictionaries>
        {#each dictionaries as d (d.tag)}
          <li data-tag={d.tag}>
            <span class="name">{languageName(d.tag)}</span>
            <span class="source">{source(d)}</span>
          </li>
        {/each}
      </ul>
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
    <div class="label">{t('spelling-own-words')}</div>
    <div class="hint">{t('spelling-own-words-hint')}</div>
    {#if !words.length}
      <p class="none">{t('spelling-own-words-none')}</p>
    {/if}
    {#each words as [language, list] (language)}
      <div class="words" data-words={language}>
        <div class="language">{languageName(language)}</div>
        <ul>
          {#each [...list].sort(collator.compare) as word (word)}
            <li>
              <span>{word}</span>
              <button
                type="button"
                aria-label={t('spelling-remove-word', { word })}
                title={t('spelling-remove-word', { word })}
                onclick={() => remove(language, word)}
              >
                <X size={12} />
              </button>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 26px 0;
    border-bottom: 1px solid var(--line);
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
    overflow-wrap: anywhere;
  }
  .dictionaries {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 8px 0 0;
    padding: 0;
    list-style: none;
  }
  .dictionaries li {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
  }
  .source {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .none {
    margin-top: 6px;
    color: var(--ink-3);
    font-style: italic;
  }
  .words {
    margin-top: 10px;
  }
  .language {
    margin-bottom: 6px;
    color: var(--ink-2);
    font-size: var(--text-sm);
  }
  .words ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .words li {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 4px 0 10px;
    border: 1px solid var(--line);
    border-radius: 13px;
    background: var(--paper-raised);
  }
  .words button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .words button:hover {
    background: var(--paper-hover);
    color: var(--danger);
  }
</style>
