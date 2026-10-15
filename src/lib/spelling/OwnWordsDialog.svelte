<script lang="ts">
  /**
   * The words added to the dictionaries, a language at a time: each can be
   * taken away, and words can be added here as from the menu of a word.
   */
  import { onMount } from 'svelte';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import { spellingWords } from '$lib/api/spelling';
  import { languageName, languages, t, TEXT_LANGUAGES } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { languageKey, spelling } from './spelling.svelte';

  let { onclose }: { onclose: () => void } = $props();

  /** The words added, by the language as maps have it: `en`, `nb`. */
  let words = $state.raw<Record<string, string[]>>({});
  let language = $state('');
  let adding = $state('');
  let busy = $state(false);

  const collator = $derived(new Intl.Collator(languages.current, { sensitivity: 'base' }));

  async function load() {
    try {
      words = await spellingWords();
    } catch (error) {
      notifyError(t('spelling-settings-failed'), error);
    }
  }

  onMount(async () => {
    await load();
    // At first, the first language with words, else that of new texts.
    const have = Object.keys(words).filter((k) => words[k].length);
    language = have[0] ?? languageKey(languages.textDefault);
  });

  /** The languages to choose among: those with words, and those texts are written in. */
  const options = $derived(
    [...new Set([...Object.keys(words), ...TEXT_LANGUAGES.map(languageKey), language])]
      .filter(Boolean)
      .map((value) => ({
        value,
        label: words[value]?.length
          ? t('spelling-words-language', {
              language: languageName(value),
              count: words[value].length,
            })
          : languageName(value),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, languages.current)),
  );

  const list = $derived([...(words[language] ?? [])].sort(collator.compare));

  async function add() {
    const word = adding.trim();
    if (!word || !language) return;
    busy = true;
    try {
      await spelling.addWord(language, word);
      adding = '';
      await load();
    } catch (error) {
      notifyError(t('spelling-add-failed'), error);
    } finally {
      busy = false;
    }
  }

  async function remove(word: string) {
    busy = true;
    try {
      await spelling.removeWord(language, word);
      await load();
    } catch (error) {
      notifyError(t('spelling-remove-failed'), error);
    } finally {
      busy = false;
    }
  }
</script>

<Dialog open title={t('spelling-manage-words-title')} width={480} tall {onclose}>
  <div class="manage" data-own-words>
    <Select
      value={language}
      label={t('spelling-words-language-label')}
      {options}
      onchange={(v) => (language = v)}
    />
    <form
      class="add"
      onsubmit={(e) => {
        e.preventDefault();
        void add();
      }}
    >
      <TextField
        bind:value={adding}
        size="sm"
        placeholder={t('spelling-word-to-add')}
        aria-label={t('spelling-word-to-add')}
        spellcheck="false"
        data-add-word
      />
      <Button size="sm" type="submit" disabled={busy || !adding.trim()}>
        {#snippet icon()}<Plus size={13} />{/snippet}
        {t('spelling-add-word-here')}
      </Button>
    </form>
    <ul class="words" data-words={language}>
      {#each list as word (word)}
        <li>
          <span>{word}</span>
          <button
            type="button"
            aria-label={t('spelling-remove-word', { word })}
            title={t('spelling-remove-word', { word })}
            disabled={busy}
            onclick={() => remove(word)}
          >
            <X size={12} />
          </button>
        </li>
      {:else}
        <p class="none">{t('spelling-own-words-none')}</p>
      {/each}
    </ul>
  </div>

  {#snippet footer()}
    <span class="spring"></span>
    <Button variant="primary" onclick={onclose} data-close-words>{t('common-close')}</Button>
  {/snippet}
</Dialog>

<style>
  .manage {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: 100%;
    min-height: 0;
  }
  .add {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
    align-items: center;
  }
  .words {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: 4px;
    list-style: none;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 6px 4px 10px;
    border-radius: var(--radius-s);
  }
  li:hover {
    background: var(--paper-hover);
  }
  li button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  li button:hover:not(:disabled) {
    color: var(--danger);
  }
  .none {
    margin: 0;
    padding: 10px;
    color: var(--ink-3);
    font-style: italic;
  }
  .spring {
    flex: 1;
  }
</style>
