<script lang="ts">
  /**
   * The source of what a note holds, on the phone (stage 2 of
   * `docs/plans/an-app-for-android.md`, part D): what the window of a
   * source does on a computer (`notebook/SourceDialog.svelte`), in a sheet
   * from the bottom, with three things left out: making it a reference of
   * the library, reading the text of a picture, and the way into the
   * library. What it is, given or changed: a page of the web, a reference
   * of the library found by its words and chosen with a place in it, or
   * words of the writer's; a file says what it says of itself. Applied, it
   * is saved in one step of undo. The passages taken from it in the note
   * are shown as they read now, brought back where they have been changed,
   * or made the writer's own words, each a step of undo of its own.
   */
  import { untrack } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import { t } from '$lib/i18n';
  import { LOCATOR_LABELS } from '$lib/editor/schema';
  import type { Notebook } from '$lib/notebook/model/notebook.svelte';
  import type { Source } from '$lib/notebook/model/types';
  import {
    dayOf,
    givesAnything,
    saveSource,
    takenFrom,
    type GivenSource,
  } from '$lib/notebook/page.svelte';
  import { placeWords, sourceLabel } from '$lib/notebook/sources';
  import { library, search, sortEntries } from '$lib/state/library.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import Sheet from './Sheet.svelte';

  interface Props {
    notebook: Notebook;
    /** The note whose source it is. */
    note: string;
    /** The source; none, for what the note took in and has no source. */
    source: Source | null;
    onclose: () => void;
  }

  let { notebook, note, source, onclose }: Props = $props();

  type Sort = GivenSource['sort'];

  /** How many references are offered at the most. */
  const OFFERED = 60;

  const uid = $props.id();

  /** The source the sheet is for: none until what had none is given one. */
  let currentId = $state<string | null>(untrack(() => source?.id ?? null));
  const current = $derived(currentId ? (notebook.sources.get(currentId) ?? null) : null);
  const record = $derived(notebook.note(note));
  const isFile = $derived(current?.sort === 'file');

  const start = untrack(() => source);
  let sort = $state<Sort>(
    start?.sort === 'reference' || start?.sort === 'words' ? start.sort : 'web',
  );
  let url = $state(start?.sort === 'web' ? start.url : '');
  let title = $state(start?.sort === 'web' ? start.title : '');
  let reference = $state(start?.sort === 'reference' ? start.reference : '');
  let locator = $state(start?.sort === 'reference' ? (start.locator ?? '') : '');
  let label = $state(start?.sort === 'reference' ? (start.label ?? 'page') : 'page');
  let words = $state(start?.sort === 'words' ? start.words : '');
  /** What the references are found by. */
  let query = $state('');

  const given = $derived.by<GivenSource>(() => {
    switch (sort) {
      case 'web':
        return { sort, url, title };
      case 'reference':
        return { sort, reference, locator, label };
      case 'words':
        return { sort, words };
    }
  });
  const ready = $derived(givesAnything(given));

  /** The references offered: those that hold the words written, by their authors; the one chosen first where it is not among them. */
  const offered = $derived.by(() => {
    if (sort !== 'reference') return [];
    const found = sortEntries(search(library.entries, query), 'authors', false).slice(0, OFFERED);
    const chosen = reference ? library.get(reference) : undefined;
    return chosen && !found.some((e) => e.id === chosen.id) ? [chosen, ...found] : found;
  });

  /** What in the note came from this source, as it reads now. */
  const taken = $derived.by(() => {
    void notebook.revision;
    if (!record) return { passages: [], files: [] };
    const found = takenFrom(notebook, record, currentId);
    return {
      files: found.files,
      passages: found.passages.map((p) => ({
        id: p.id,
        then: p.text,
        now: notebook.readsNow(note, p.id),
        changed: notebook.changedSince(note, p.id),
      })),
    };
  });

  // Where all that came from it has become the writer's own, the sheet has nothing left to say.
  let held = false;
  $effect(() => {
    const some = taken.passages.length + taken.files.length > 0;
    if (some) held = true;
    else if (held) untrack(() => onclose());
  });

  function apply() {
    if (!record || isFile || !ready) return;
    currentId = saveSource(notebook, record, current, given);
    onclose();
  }

  /** Does something to the note as a step of undo of its own. */
  function step(change: () => void) {
    notebook.undoManager.stopCapturing();
    change();
    notebook.undoManager.stopCapturing();
  }
</script>

<Sheet open title={t('notebook-source')} {onclose}>
  <div class="form" data-phone-source>
    {#if current && current.sort === 'file'}
      <dl class="file">
        <dt>{t('notebook-source-file-name')}</dt>
        <dd>{current.name}</dd>
        {#if current.time}
          <dt>{t('notebook-source-file-changed')}</dt>
          <dd>{dayOf(current.time)}</dd>
        {/if}
        {#if current.taken}
          <dt>{t('notebook-source-file-taken')}</dt>
          <dd>{dayOf(current.taken)}</dd>
        {/if}
        {#if current.place}
          <dt>{t('notebook-source-file-where')}</dt>
          <dd>{placeWords(current.place)}</dd>
        {/if}
      </dl>
    {:else}
      <div class="sorts">
        <Segmented
          bind:value={sort}
          label={t('notebook-source-sort')}
          options={[
            { value: 'web', label: t('notebook-source-web') },
            { value: 'reference', label: t('notebook-source-reference') },
            { value: 'words', label: t('notebook-source-other') },
          ]}
        />
      </div>
      {#if sort === 'web'}
        <TextField
          bind:value={url}
          label={t('notebook-source-url')}
          type="url"
          inputmode="url"
          data-phone-source-url
        />
        <TextField
          bind:value={title}
          label={t('notebook-source-page-title')}
          data-phone-source-title
        />
      {:else if sort === 'reference'}
        <TextField
          bind:value={query}
          label={t('common-search')}
          type="search"
          enterkeyhint="search"
          data-phone-source-find
        />
        <ul class="references" aria-label={t('notebook-source-reference')}>
          {#each offered as entry (entry.id)}
            <li>
              <button
                type="button"
                class="reference"
                class:chosen={entry.id === reference}
                aria-pressed={entry.id === reference}
                data-phone-reference={entry.id}
                onclick={() => (reference = entry.id)}
              >
                <span class="said">
                  <span class="who">{[entry.authors, entry.year].filter(Boolean).join(', ')}</span>
                  <span class="what">{entry.title}</span>
                </span>
                {#if entry.id === reference}<Check size={18} />{/if}
              </button>
            </li>
          {/each}
        </ul>
        <div class="field">
          <span class="label" id="place-{uid}">{t('notebook-source-place')}</span>
          <span class="place">
            <select
              aria-label={t('editor-citation-locator-kind')}
              bind:value={label}
              data-phone-source-label
            >
              {#each LOCATOR_LABELS as [value] (value)}
                <option {value}>{t(`editor-locator-${value}`)}</option>
              {/each}
            </select>
            <input
              bind:value={locator}
              aria-labelledby="place-{uid}"
              placeholder="45–67"
              inputmode="text"
              data-phone-source-locator
            />
          </span>
        </div>
      {:else}
        <TextField bind:value={words} label={t('notebook-source-words')} data-phone-source-words />
      {/if}
      <div class="apply">
        <Button variant="primary" disabled={!ready} data-phone-source-apply onclick={apply}>
          {t('common-apply')}
        </Button>
      </div>
    {/if}

    {#if taken.passages.length}
      <section class="passages" aria-label={t('notebook-source-passages')}>
        <h3 class="overline">{t('notebook-source-passages')}</h3>
        {#each taken.passages as p (p.id)}
          <div class="passage" data-phone-passage={p.id}>
            <p class="now">{p.now}</p>
            {#if p.changed}
              <p class="changed">{t('notebook-source-changed')}</p>
              <p class="then">{p.then}</p>
            {/if}
            <div class="actions">
              {#if p.changed}
                <Button
                  variant="ghost"
                  data-phone-bring-back
                  onclick={() => step(() => notebook.bringBack(note, p.id))}
                >
                  {t('notebook-source-bring-back')}
                </Button>
              {/if}
              <Button
                variant="ghost"
                data-phone-own-words
                onclick={() => step(() => notebook.ownWords(note, p.id))}
              >
                {t('notebook-source-own-words')}
              </Button>
            </div>
          </div>
        {/each}
      </section>
    {/if}
  </div>
</Sheet>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 16px 16px;
  }
  .sorts {
    display: flex;
    min-width: 0;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--ink-2);
  }
  .references {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
  }
  .references:empty {
    display: none;
  }
  .references li + li {
    border-top: 1px solid var(--line);
  }
  .reference {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 48px;
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .reference:active {
    background: var(--paper-hover);
  }
  .reference.chosen {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .said {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .who {
    font-size: var(--text-sm);
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .what {
    font-family: var(--font-text);
    overflow-wrap: anywhere;
  }
  .place {
    display: flex;
    gap: 6px;
    min-width: 0;
  }
  .place select,
  .place input {
    min-height: var(--control-h);
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink);
    font: inherit;
    outline: none;
  }
  .place select {
    flex: none;
    max-width: 50%;
  }
  .place input {
    flex: 1;
    min-width: 0;
  }
  .place select:focus,
  .place input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .apply {
    display: flex;
    justify-content: flex-end;
  }
  .file {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 6px 14px;
    margin: 0;
  }
  .file dt {
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .file dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .passages {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 4px;
    border-top: 1px solid var(--line);
  }
  .passages h3 {
    margin-top: 8px;
  }
  .passage {
    padding: 8px 10px;
    border-radius: var(--radius-s);
    background: var(--paper-sunken);
  }
  .now,
  .then {
    margin: 0;
    font-family: var(--font-text);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
  .changed {
    margin: 6px 0 2px;
    font-size: var(--text-xs);
    color: var(--warn);
  }
  .then {
    color: var(--ink-3);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 4px;
    margin-top: 4px;
  }
</style>
