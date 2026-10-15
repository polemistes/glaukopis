<script module lang="ts">
  /** A language of the list. */
  export interface LanguageRow {
    /** The name of its files: `nb_NO`, `nor`. */
    id: string;
    name: string;
    /** Where it comes from, in words. */
    source: string;
    /** Imported, and so to be taken away here. */
    imported: boolean;
  }
</script>

<script lang="ts">
  /**
   * The languages there are of a kind, in the settings of spelling and of
   * OCR: each with where it comes from, the system or an import, and a
   * cross that takes away one that was imported.
   */
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';

  interface Props {
    rows: LanguageRow[];
    /** Something is being imported or taken away: the crosses wait. */
    busy?: boolean;
    onremove: (row: LanguageRow) => void;
  }

  let { rows, busy = false, onremove }: Props = $props();
</script>

<ul class="rows" data-language-rows>
  {#each rows as row (row.id)}
    <li data-language={row.id} data-source={row.imported ? 'imported' : 'other'}>
      <span class="name">{row.name}</span>
      <span class="source">{row.source}</span>
      {#if row.imported}
        <button
          type="button"
          aria-label={t('packages-remove', { name: row.name })}
          title={t('packages-remove', { name: row.name })}
          disabled={busy}
          onclick={() => onremove(row)}
        >
          <X size={12} />
        </button>
      {:else}
        <span class="room"></span>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .rows {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 34px;
    padding: 2px 6px 2px 12px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
  }
  .name {
    flex: 1;
    min-width: 0;
  }
  .source {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  button,
  .room {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 22px;
    height: 22px;
  }
  button {
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    background: var(--paper-hover);
    color: var(--danger);
  }
</style>
