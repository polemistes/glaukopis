<script lang="ts">
  import { onMount } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import Search from '@lucide/svelte/icons/search';
  import type { Draft } from '$lib/api/library';
  import { lookupFind, type Found, type Hit, type Scope } from '$lib/api/sources';
  import { t } from '$lib/i18n';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import TypeIcon from './TypeIcon.svelte';

  let { onpick, initial = '' }: { onpick: (draft: Draft) => void; initial?: string } = $props();

  // What was being searched for where the form was opened from: looked up at
  // once where it is a number that names one work, and otherwise left to be.
  // svelte-ignore state_referenced_locally
  let words = $state(initial.trim());
  onMount(() => {
    if (isNumber(words)) void find();
  });
  let scope = $state<Scope>('any');
  let found = $state.raw<Found | null>(null);
  let searching = $state(false);
  let problem = $state<string | null>(null);
  /** The hit the form was filled from. */
  let taken = $state.raw<Hit | null>(null);
  /** Whether the other hits are shown after one was taken. */
  let showing = $state(true);
  let round = 0;

  async function find() {
    const asked = words.trim();
    if (!asked || searching) return;
    const mine = ++round;
    searching = true;
    problem = null;
    taken = null;
    showing = true;
    try {
      const result = await lookupFind(asked, scope);
      if (mine !== round) return;
      found = result;
      // Asked for by its number, there is nothing to choose between.
      if (result.query.kind !== 'text' && result.hits.length === 1) take(result.hits[0]);
    } catch (error) {
      if (mine !== round) return;
      found = null;
      problem = describeError(error) ?? t('library-lookup-failed');
    } finally {
      if (mine === round) searching = false;
    }
  }

  function take(hit: Hit) {
    taken = hit;
    showing = false;
    onpick({ ...hit.draft, key: '' });
  }

  /** Whether a text is a DOI or an ISBN, which names one work. */
  function isNumber(text: string): boolean {
    return (
      /^(https?:\/\/(dx\.)?doi\.org\/|doi:\s*)?10\.\d{4,9}\/\S+$/i.test(text) ||
      /^(isbn[:\s-]*)?[\d\sXx-]{10,17}$/i.test(text)
    );
  }

  /** A number that is pasted is looked up at once. */
  function onpaste(event: ClipboardEvent) {
    const text = (event.clipboardData?.getData('text/plain') ?? '').trim();
    if (!isNumber(text)) return;
    event.preventDefault();
    words = text;
    void find();
  }
</script>

<div class="lookup">
  <div class="field" class:busy={searching}>
    <span class="lens"
      >{#if searching}<Spinner size={14} />{:else}<Search size={15} />{/if}</span
    >
    <input
      type="text"
      bind:value={words}
      placeholder={t('library-lookup-placeholder')}
      aria-label={t('library-lookup-label')}
      spellcheck="false"
      data-autofocus
      {onpaste}
      onkeydown={(e) => {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          find();
        }
      }}
    />
  </div>

  {#if problem}<p class="problem selectable" role="alert">{problem}</p>{/if}

  {#if found}
    {#if taken && !showing}
      <p class="from">
        <Check size={13} />
        <span>
          {t('library-lookup-filled', { source: taken.source })}
          {#each taken.remarks as remark}{' '}{remark}{/each}
          {#if found.hits.length > 1}
            <button type="button" class="link" onclick={() => (showing = true)}>
              {t('library-lookup-others', { count: found.hits.length - 1 })}
            </button>
          {/if}
        </span>
      </p>
    {:else}
      {#if found.query.kind === 'text' && (found.hits.length || scope !== 'any')}
        <div class="scope">
          <Segmented
            bind:value={scope}
            label={t('library-lookup-scope')}
            size="sm"
            options={[
              { value: 'any', label: t('library-lookup-any') },
              { value: 'books', label: t('library-lookup-books') },
              { value: 'articles', label: t('library-lookup-articles') },
            ]}
            onchange={find}
          />
        </div>
      {/if}
      {#if !found.hits.length}
        <p class="none">
          {#if found.query.kind === 'text'}
            {t('library-lookup-none')}
          {:else}
            {t('library-lookup-unknown', { kind: found.query.kind })}
          {/if}
        </p>
      {:else}
        <ul class="hits">
          {#each found.hits as hit, i (i)}
            <li>
              <button
                type="button"
                class="hit"
                class:taken={hit === taken}
                onclick={() => take(hit)}
              >
                <span class="icon"><TypeIcon type={hit.summary.type} /></span>
                <span class="text">
                  <span class="first">
                    <span class="authors">{hit.summary.authors || '—'}</span>
                    {#if hit.summary.year}<span class="year">{hit.summary.year}</span>{/if}
                    {#if hit.known}<span class="known">{t('library-in-library')}</span>{/if}
                  </span>
                  <span class="title serif">{hit.summary.title || t('library-untitled')}</span>
                  {#if hit.summary.container}<span class="container">{hit.summary.container}</span
                    >{/if}
                  <span class="source">
                    {hit.source}{#each hit.remarks as remark}{' · '}{remark}{/each}
                  </span>
                </span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
    {#each found.failures as failure}
      <p class="failure">{failure}</p>
    {/each}
  {/if}
</div>

<style>
  .lookup {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 14px;
    margin-bottom: 2px;
    border-bottom: 1px solid var(--line);
  }
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .field:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .lens {
    display: inline-flex;
    flex: none;
    color: var(--ink-3);
  }
  input {
    flex: 1;
    min-width: 0;
    border: none;
    background: none;
    outline: none;
    font: inherit;
    color: inherit;
  }
  input::placeholder {
    color: var(--ink-4);
  }
  .problem,
  .none,
  .failure {
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .problem {
    color: var(--danger);
  }
  .failure {
    color: var(--ink-3);
  }
  .from {
    display: flex;
    gap: 7px;
    align-items: flex-start;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.5;
  }
  .from :global(svg) {
    flex: none;
    margin-top: 3px;
    color: var(--ok);
  }
  .link {
    padding: 0;
    border: none;
    background: none;
    color: var(--accent-strong);
    font: inherit;
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
  }
  .scope {
    display: flex;
  }
  .hits {
    margin: 0;
    padding: 0;
    list-style: none;
    max-height: 264px;
    overflow-y: auto;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
  }
  .hits li + li {
    border-top: 1px solid var(--line);
  }
  .hit {
    display: flex;
    gap: 9px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .hit:hover {
    background: var(--paper-hover);
  }
  .hit.taken {
    background: var(--accent-softer);
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
  .container,
  .source {
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .known {
    color: var(--accent-strong);
    font-size: var(--text-xs);
    font-weight: 600;
  }
  .title {
    font-size: var(--text-lg);
    line-height: 1.35;
  }
  .source {
    font-size: var(--text-xs);
  }
</style>
