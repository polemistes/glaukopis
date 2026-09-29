<script lang="ts">
  /**
   * One work of a citation: the reference, the place in the work, the words
   * before and after. Where a citation is changed, and where one is made of
   * text that was found, it is the same.
   */
  import type { Snippet } from 'svelte';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { t } from '$lib/i18n';
  import { truncate } from '$lib/library/format';
  import NoteButton from '$lib/library/NoteButton.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { lookup } from './references.svelte';
  import { LOCATOR_LABELS, type CiteMode } from './schema';

  /** What is said of the place in the work, and around it. */
  interface Said {
    locator?: string;
    label?: string;
    prefix?: string;
    suffix?: string;
    suppressAuthor?: boolean;
  }

  interface Props {
    /** The id of the reference. Nothing, where the work has none yet. */
    reference: string | null;
    said: Said;
    mode: CiteMode;
    /** Its place among the works of the citation. */
    index: number;
    onchange?: () => void;
    onremove: () => void;
    /** The reference is to be changed in the library. */
    onedit?: (id: string) => void;
    /** Shown where the work has no reference yet. */
    unknown?: Snippet;
    /** Shown under the work: what more there is to say or do about it. */
    more?: Snippet;
  }

  let {
    reference,
    said = $bindable(),
    mode,
    index,
    onchange,
    onremove,
    onedit,
    unknown,
    more,
  }: Props = $props();

  const ref = $derived(reference ? lookup(reference) : null);
</script>

<div class="item" data-item={index}>
  <div class="work">
    <div class="what">
      {#if ref}
        <span class="authors">{ref.authors || '—'}</span>
        <span class="year">{ref.year}</span>
        <span class="title serif">{truncate(ref.title, 70)}</span>
      {:else if reference || !unknown}
        <span class="gone">{t('editor-citation-not-in-library')}</span>
      {:else}
        {@render unknown()}
      {/if}
    </div>
    {#if reference}
      <NoteButton id={reference} always />
      {#if ref?.inLibrary && onedit}
        <IconButton
          label={t('editor-citation-edit-reference')}
          size="sm"
          onclick={() => onedit(reference)}
        >
          <Pencil size={13} />
        </IconButton>
      {/if}
    {/if}
  </div>

  {#if more}{@render more()}{/if}

  <div class="fields">
    <label class="prefix">
      <span>{t('editor-citation-before')}</span>
      <input
        bind:value={said.prefix}
        placeholder={t('editor-citation-before-placeholder')}
        oninput={onchange}
      />
    </label>
    <label class="locator">
      <select
        aria-label={t('editor-citation-locator-kind')}
        value={said.label ?? 'page'}
        onchange={(e) => {
          said.label = e.currentTarget.value;
          onchange?.();
        }}
      >
        {#each LOCATOR_LABELS as [value] (value)}
          <option {value}>{t(`editor-locator-${value}`)}</option>
        {/each}
      </select>
      <input bind:value={said.locator} placeholder="45–67" oninput={onchange} />
    </label>
    <label class="suffix">
      <span>{t('editor-citation-after')}</span>
      <input
        bind:value={said.suffix}
        placeholder={t('editor-citation-after-placeholder')}
        oninput={onchange}
      />
    </label>
  </div>

  <!-- What takes the work out stands last, and is no cross in the corner, which reads as closing. -->
  <div class="last">
    {#if mode === 'normal'}
      <label class="check">
        <input type="checkbox" bind:checked={said.suppressAuthor} {onchange} />
        {t('editor-citation-suppress-author')}
      </label>
    {/if}
    <button type="button" class="out" data-remove onclick={onremove}>
      <Trash2 size={13} />
      {t('editor-citation-remove-work')}
    </button>
  </div>
</div>

<style>
  .item {
    padding: 12px 14px;
    border-bottom: 1px solid var(--line);
  }
  .work {
    display: flex;
    align-items: flex-start;
    gap: 2px;
  }
  .what {
    flex: 1;
    min-width: 0;
    line-height: 1.4;
  }
  .authors {
    font-weight: 550;
  }
  .year {
    color: var(--ink-2);
    margin: 0 4px;
  }
  .title {
    color: var(--ink-2);
  }
  .gone {
    color: var(--danger);
  }
  .fields {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 6px;
    margin-top: 8px;
    align-items: end;
  }
  .fields label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .fields span {
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .fields select {
    appearance: none;
    -webkit-appearance: none;
    height: 17px;
    padding: 0;
    border: none;
    background: transparent;
    font-size: var(--text-xs);
    color: var(--accent-strong);
    font-weight: 500;
    cursor: pointer;
    outline: none;
  }
  .fields input {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    outline: none;
  }
  .fields input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .fields input::placeholder {
    color: var(--ink-4);
  }
  .last {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-sm);
    color: var(--ink-2);
    cursor: pointer;
  }
  .out {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: auto;
    padding: 3px 7px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--text-sm);
    white-space: nowrap;
    cursor: pointer;
  }
  .out:hover {
    background: var(--danger-soft);
    color: var(--danger);
  }
  .check input {
    accent-color: var(--accent);
    margin: 0;
  }
</style>
