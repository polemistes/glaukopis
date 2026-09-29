<script lang="ts">
  import { onMount } from 'svelte';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import {
    libraryDuplicates,
    libraryMerge,
    libraryMergePreview,
    type DuplicateGroup,
    type Summary,
  } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import { library } from '$lib/state/library.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { reasonWords } from './format';
  import TypeIcon from './TypeIcon.svelte';

  let { onclose }: { onclose: () => void } = $props();

  interface Group extends DuplicateGroup {
    entries: Summary[];
    /** The one that is kept when they are made one. */
    kept: string;
  }

  let groups = $state<Group[] | null>(null);
  let busy = $state<string | null>(null);
  let merged = $state(0);

  /** The one that says the most is kept, unless the user chooses another. */
  function fullest(entries: Summary[]): string {
    const weight = (e: Summary) => e.search.length + e.attachments * 40;
    return entries.reduce((best, e) => (weight(e) > weight(best) ? e : best), entries[0]).id;
  }

  async function find() {
    try {
      await library.reload();
      const found = await libraryDuplicates();
      groups = found
        .map((g) => {
          const entries = g.ids.map((id) => library.get(id)).filter((e): e is Summary => !!e);
          return { ...g, entries, kept: entries.length ? fullest(entries) : '' };
        })
        .filter((g) => g.entries.length > 1)
        .sort((a, b) => (a.certainty === b.certainty ? 0 : a.certainty === 'certain' ? -1 : 1));
    } catch (error) {
      groups = [];
      notifyError(t('library-duplicates-failed'), error);
    }
  }

  onMount(find);

  async function merge(group: Group) {
    if (busy) return;
    busy = group.kept;
    try {
      for (const entry of group.entries) {
        if (entry.id === group.kept) continue;
        const draft = await libraryMergePreview(group.kept, entry.id);
        library.put(await libraryMerge(group.kept, entry.id, draft));
        library.forget([entry.id]);
      }
      merged++;
      groups = (groups ?? []).filter((g) => g !== group);
      await library.reload();
    } catch (error) {
      notifyError(t('library-duplicates-merge-failed'), error);
      await find();
    } finally {
      busy = null;
    }
  }

  function apart(group: Group) {
    groups = (groups ?? []).filter((g) => g !== group);
  }
</script>

<Dialog
  open
  title={t('library-duplicates-title')}
  subtitle={groups?.length ? t('library-duplicates-count', { count: groups.length }) : undefined}
  width={680}
  tall={!!groups?.length}
  {onclose}
>
  {#if groups === null}
    <div class="waiting"><Spinner size={20} /></div>
  {:else if !groups.length}
    <EmptyState
      compact
      title={merged ? t('library-duplicates-no-more') : t('library-duplicates-none')}
      text={merged ? t('library-duplicates-no-more.text') : t('library-duplicates-none.text')}
    />
  {:else}
    <p class="how">{t('library-duplicates-how')}</p>
    <ul class="groups">
      {#each groups as group (group.ids.join())}
        <li class="group">
          <div class="why" class:certain={group.certainty === 'certain'}>
            {group.certainty === 'certain'
              ? t('library-duplicates-same')
              : t('library-duplicates-probably-same')} · {reasonWords(group.reasons)}
          </div>
          <div class="entries" role="radiogroup" aria-label={t('library-duplicates-keep-which')}>
            {#each group.entries as entry (entry.id)}
              <label class="entry" class:kept={group.kept === entry.id}>
                <input
                  type="radio"
                  name={group.ids.join()}
                  value={entry.id}
                  bind:group={group.kept}
                />
                <span class="icon"><TypeIcon type={entry.type} size={15} /></span>
                <span class="text">
                  <span class="first">
                    <span class="authors">{entry.authors || t('library-no-author')}</span>
                    {#if entry.year}<span class="year">{entry.year}</span>{/if}
                    {#if entry.attachments}<span class="files"
                        ><Paperclip size={11} />{entry.attachments}</span
                      >{/if}
                  </span>
                  <span class="title serif">{entry.title || t('library-no-title')}</span>
                  {#if entry.container}<span class="container">{entry.container}</span>{/if}
                  <span class="key">{entry.key}</span>
                </span>
                {#if group.kept === entry.id}<span class="keep">{t('library-duplicates-kept')}</span
                  >{/if}
              </label>
            {/each}
          </div>
          <div class="actions">
            <Button size="sm" variant="ghost" disabled={!!busy} onclick={() => apart(group)}
              >{t('library-duplicates-different')}</Button
            >
            <Button size="sm" variant="primary" disabled={!!busy} onclick={() => merge(group)}>
              {busy === group.kept
                ? t('library-duplicates-merging')
                : t('library-duplicates-merge')}
            </Button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>{t('common-close')}</Button>
  {/snippet}
</Dialog>

<style>
  .waiting {
    display: flex;
    justify-content: center;
    padding: 40px 0;
  }
  .how {
    margin-bottom: 16px;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.55;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .groups {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .group {
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
  }
  .why {
    margin-bottom: 8px;
    color: var(--warn);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .why.certain {
    color: var(--accent-strong);
  }
  .entries {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .entry {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    cursor: pointer;
  }
  .entry:hover {
    background: var(--paper-hover);
  }
  .entry.kept {
    border-color: var(--accent);
    background: var(--accent-softer);
  }
  .entry input {
    margin-top: 3px;
    accent-color: var(--accent);
  }
  .icon {
    display: inline-flex;
    margin-top: 2px;
    color: var(--ink-3);
  }
  .text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 1px;
  }
  .first {
    display: flex;
    gap: 8px;
    align-items: baseline;
    font-size: var(--text-sm);
  }
  .authors {
    font-weight: 600;
  }
  .year,
  .files,
  .container,
  .key {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .files {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  .title {
    font-size: var(--text-lg);
    line-height: 1.35;
  }
  .key {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }
  .keep {
    flex: none;
    margin-top: 2px;
    color: var(--accent-strong);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
  }
</style>
