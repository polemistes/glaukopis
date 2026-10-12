<script lang="ts">
  /**
   * The language of a passage, by its tag, where it is none of those the
   * menu offers: an old language, say, that a scholar quotes. The tags of
   * some such languages are offered beside the field, by name.
   */
  import { untrack } from 'svelte';
  import { languageName, t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import TextField from '$lib/ui/TextField.svelte';

  interface Props {
    /** The language the passage has, if any. */
    tag: string | null;
    onclose: () => void;
    onset: (tag: string) => void;
  }

  let { tag, onclose, onset }: Props = $props();

  /** Languages a scholar may quote, which the menu does not offer. */
  const SUGGESTED = [
    'grc',
    'la',
    'hbo',
    'he',
    'arc',
    'syc',
    'cop',
    'sa',
    'ar',
    'non',
    'ang',
    'enm',
    'got',
    'goh',
    'gmh',
    'fro',
    'sga',
    'cu',
    'akk',
    'egy',
  ];

  let written = $state(untrack(() => tag ?? ''));
  let field = $state<HTMLInputElement>();

  $effect(() => {
    field?.focus();
  });

  /** The tag written, as it is properly written, or nothing where it is no tag. */
  const proper = $derived.by(() => {
    const given = written.trim();
    if (!given) return null;
    try {
      return Intl.getCanonicalLocales(given)[0] ?? null;
    } catch {
      return null;
    }
  });
  /** The name of the language, where the system or the application knows it. */
  const named = $derived(proper && languageName(proper) !== proper ? languageName(proper) : null);

  function keep() {
    if (!proper) return;
    onset(proper);
    onclose();
  }
</script>

<Dialog open title={t('editor-language-other-title')} width={440} {onclose}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="form" onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), keep())}>
    <TextField
      bind:value={written}
      bind:el={field}
      label={t('editor-language-tag')}
      placeholder="grc"
      data-language-tag
      error={written.trim() && !proper ? t('editor-language-no-tag') : null}
      hint={proper ? (named ?? t('editor-language-unnamed')) : undefined}
    />
    <div class="suggested" role="group" aria-label={t('editor-language-suggested')}>
      {#each SUGGESTED as s (s)}
        <button
          type="button"
          class:on={proper === s}
          data-suggested={s}
          onclick={() => (written = s)}
          ondblclick={() => ((written = s), keep())}
        >
          {languageName(s)} <span class="tag">{s}</span>
        </button>
      {/each}
    </div>
    <p class="hint">{t('editor-language-other-hint')}</p>
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
    <Button variant="primary" disabled={!proper} onclick={keep}>{t('common-apply')}</Button>
  {/snippet}
</Dialog>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .suggested {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .suggested button {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    padding: 3px 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .suggested button:hover {
    background: var(--paper-hover);
  }
  .suggested button.on {
    border-color: var(--accent);
    background: var(--accent-softer);
    color: var(--ink);
  }
  .tag {
    color: var(--ink-4);
    font-size: var(--text-xs);
  }
  .hint {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-4);
    line-height: 1.5;
  }
</style>
