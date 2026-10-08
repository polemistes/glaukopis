<script lang="ts">
  /**
   * In the settings of languages: the words of a language made into a
   * project, to be read through and mended in Glaukopis (ADR 0034); and the
   * languages that have own words in use, which can be taken away (ADR 0035).
   */
  import { languageName, languages, localeTags, t } from '$lib/i18n';
  import { settingsUi } from '$lib/settings/settings-ui.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Select from '$lib/ui/Select.svelte';
  import { notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { removeOwnWords } from './own';
  import { makeWordsProject } from './words.svelte';

  const tags = localeTags();
  let tag = $state(tags.includes(languages.current) ? languages.current : 'nb');
  let making = $state(false);

  const options = $derived(
    tags
      .map((value) => ({ value, label: languageName(value) }))
      .sort((a, b) => a.label.localeCompare(b.label, languages.current)),
  );

  /** The names of the languages that have own words, in the order of the alphabet. */
  const own = $derived(
    languages.own
      .map(languageName)
      .sort((a, b) => a.localeCompare(b, languages.current))
      .join(', '),
  );
  let removing = $state(false);

  async function remove() {
    const sure = await confirm({
      title: t('words-own-remove-title'),
      message: t('words-own-remove-message', { languages: own }),
      confirm: t('words-own-remove'),
      danger: true,
    });
    if (!sure) return;
    removing = true;
    try {
      await removeOwnWords();
      notifyOk(t('words-own-removed'));
    } catch (error) {
      notifyError(t('words-own-remove-failed'), error);
    } finally {
      removing = false;
    }
  }

  async function make() {
    making = true;
    try {
      await makeWordsProject(tag);
      settingsUi.open = false;
    } catch (error) {
      notifyError(t('words-make-failed'), error);
    } finally {
      making = false;
    }
  }
</script>

<div class="words" data-words-settings>
  <div class="label">{t('words-title')}</div>
  <div class="hint">{t('words-hint')}</div>
  <div class="row">
    <Select value={tag} label={t('words-language')} {options} onchange={(v) => (tag = v)} />
    <Button size="sm" disabled={making} onclick={make}>
      {making ? t('words-making') : t('words-make')}
    </Button>
  </div>
  {#if languages.own.length}
    <div class="row own" data-words-own>
      <span class="said">{t('words-own-in-use', { languages: own })}</span>
      <Button size="sm" disabled={removing} onclick={remove}>{t('words-own-remove')}</Button>
    </div>
  {/if}
</div>

<style>
  .words {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
  }
  .label {
    font-weight: 550;
  }
  .hint {
    color: var(--ink-3);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .row {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    margin-top: 4px;
  }
  .own {
    align-items: center;
  }
  .said {
    flex: 1;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
</style>
