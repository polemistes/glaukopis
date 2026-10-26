<script lang="ts">
  /**
   * Files of the library chosen by name, several at once, for one reference
   * to have: the parts of one work, a book scanned chapter by chapter, a
   * work and its supplement. The files that belong to no reference come
   * first. What is chosen stays chosen while the search changes, and the
   * button says how many are added.
   */
  import { tick } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import Search from '@lucide/svelte/icons/search';
  import type { FileView } from '$lib/api/files';
  import { t } from '$lib/i18n';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { forChoosing } from './order';
  import { KIND_ICONS, fileMatches, files, referenceWords } from './store.svelte';

  interface Props {
    title: string;
    /** The files the reference has already, left out of the list. */
    except?: string[];
    /** One file is chosen, of these kinds, and taken at once: to be shown in a side (ADR 0069). */
    single?: FileView['kind'][];
    onpick: (hashes: string[]) => void;
    onclose: () => void;
  }

  let { title, except = [], single, onpick, onclose }: Props = $props();

  /** The most rows shown: what is sought is found by searching, not by scrolling. */
  const MOST = 50;

  let query = $state('');
  let at = $state(0);
  let chosen = $state<string[]>([]);
  let list = $state<HTMLDivElement>();

  $effect(() => void files.load());

  // Sorted when the files change; what is searched for is filtered out of
  // that, in the same order, with every letter typed.
  const ordered = $derived(forChoosing(files.files));
  const found = $derived(
    ordered.filter(
      (f) =>
        !except.includes(f.hash) &&
        (!single || (f.exists && single.includes(f.kind))) &&
        fileMatches(f, query),
    ),
  );
  const shown = $derived(found.slice(0, MOST));

  $effect(() => {
    void query;
    at = 0;
  });

  function toggle(file: FileView) {
    if (single) {
      onpick([file.hash]);
      onclose();
      return;
    }
    chosen = chosen.includes(file.hash)
      ? chosen.filter((h) => h !== file.hash)
      : [...chosen, file.hash];
  }

  function add() {
    if (!chosen.length) return;
    onpick(chosen);
    onclose();
  }

  async function reveal() {
    await tick();
    list?.querySelector('[data-at]')?.scrollIntoView({ block: 'nearest' });
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') at = Math.min(shown.length - 1, at + 1);
    else if (event.key === 'ArrowUp') at = Math.max(0, at - 1);
    else if (event.key === ' ' && shown[at] && event.target !== list?.ownerDocument.activeElement)
      toggle(shown[at]);
    else if (event.key === 'Enter') {
      if (chosen.length) add();
      else if (shown[at]) toggle(shown[at]);
    } else return;
    event.preventDefault();
    void reveal();
  }

  function folderName(file: FileView): string {
    return file.folder ? (files.folder(file.folder)?.name ?? '') : '';
  }
</script>

<Dialog open {title} width={560} tall {onclose}>
  <div class="chooser">
    <div class="search">
      <Search size={15} />
      <input
        bind:value={query}
        type="search"
        placeholder={t('files-choose-files-search')}
        aria-label={t('common-search')}
        spellcheck="false"
        data-autofocus
        {onkeydown}
      />
    </div>
    <div
      bind:this={list}
      class="list"
      role="listbox"
      aria-multiselectable={!single}
      aria-label={t('files-choose-files')}
      data-file-chooser
    >
      {#each shown as file, i (file.hash)}
        {@const Icon = KIND_ICONS[file.kind] ?? KIND_ICONS.other}
        {@const on = chosen.includes(file.hash)}
        <div
          class="item"
          class:at={i === at}
          role="option"
          tabindex="-1"
          aria-selected={on}
          aria-checked={on}
          data-at={i === at ? '' : undefined}
          data-choose-file={file.name}
          onclick={() => toggle(file)}
          onkeydown={(e) => (e.key === ' ' || e.key === 'Enter') && toggle(file)}
          onpointermove={() => (at = i)}
        >
          {#if !single}
            <span class="box" class:on
              >{#if on}<Check size={12} strokeWidth={2.5} />{/if}</span
            >
          {/if}
          <span class="icon"><Icon size={15} strokeWidth={1.6} /></span>
          <span class="text">
            <span class="name truncate">{file.name}</span>
            <span class="about truncate">
              {[folderName(file), file.references.map(referenceWords).join('; ')]
                .filter(Boolean)
                .join(' · ') || t('files-no-reference')}
            </span>
          </span>
        </div>
      {:else}
        <p class="none">{t('files-choose-files-none')}</p>
      {/each}
      {#if found.length > MOST}
        <p class="more">{t('files-choose-more', { count: found.length - MOST })}</p>
      {/if}
    </div>
  </div>

  {#snippet footer()}
    <span class="spring"></span>
    <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
    {#if !single}
      <Button variant="primary" disabled={!chosen.length} onclick={add} data-choose-add>
        {t('files-choose-add', { count: chosen.length })}
      </Button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .chooser {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    height: 100%;
    min-height: 0;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: var(--control-h);
    padding: 0 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink-3);
  }
  .search:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .search input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    color: var(--ink);
  }
  .search input::-webkit-search-cancel-button {
    display: none;
  }
  .list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
  }
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    cursor: pointer;
  }
  .item.at {
    background: var(--paper-hover);
  }
  .box {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 16px;
    height: 16px;
    border: 1px solid var(--line-strong);
    border-radius: 4px;
    color: var(--paper);
  }
  .box.on {
    border-color: var(--accent);
    background: var(--accent);
  }
  .icon {
    display: flex;
    flex: none;
    color: var(--ink-3);
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .about {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .none,
  .more {
    margin: 0;
    padding: 14px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .spring {
    flex: 1;
  }
</style>
