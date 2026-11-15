<script lang="ts">
  /**
   * The window of a source (record 0101): for one source of what a note
   * holds, or for what it took in and has no source. What it is, given or
   * changed: a page of the web, a reference of the library with a place in
   * it, or words of the writer's; a file says what it says of itself. It is
   * made a reference of the library here; and the passages taken from it in
   * the note are shown as they read now, brought back where they have been
   * changed, or made the writer's own words. All of it is undone by the
   * notebook's undo.
   */
  import { untrack } from 'svelte';
  import BookMarked from '@lucide/svelte/icons/book-marked';
  import { t } from '$lib/i18n';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { LOCATOR_LABELS } from '$lib/editor/schema';
  import { newReference } from '$lib/library/references.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import type { Notebook } from './model/notebook.svelte';
  import type { Source } from './model/types';
  import { dayOf, givesAnything, saveSource, takenFrom, type GivenSource } from './page.svelte';
  import { draftOf, placeWords, sourceLabel } from './sources';

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

  /** The source the window is for: none until what had none is given one. */
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

  let chooser = $state<HTMLButtonElement>();

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

  // Where all that came from it has become the writer's own, the window has nothing left to say.
  let held = false;
  $effect(() => {
    const some = taken.passages.length + taken.files.length > 0;
    if (some) held = true;
    else if (held) onclose();
  });

  /** The reference the source has been made, said in short; none where it has not. */
  const made = $derived(
    current?.reference && current.sort !== 'reference'
      ? sourceLabel({ id: '', sort: 'reference', reference: current.reference })
      : null,
  );
  /** Whether it can be made a reference: a page, words, a file, not made one already. */
  const canMake = $derived(!made && (isFile || (sort !== 'reference' && ready)));

  /** Saves what is given, and gives the source. */
  function save(): string | null {
    if (!record || isFile) return currentId;
    if (!ready) return null;
    currentId = saveSource(notebook, record, current, given);
    return currentId;
  }

  function apply() {
    if (!isFile && !ready) return;
    save();
    onclose();
  }

  async function makeReference() {
    const id = save();
    const saved = id ? notebook.sources.get(id) : null;
    const draft = saved ? draftOf(saved) : null;
    if (!id || !draft) return;
    const added = await newReference({ draft });
    if (added) notebook.madeReference(id, added.id);
  }

  function chooseReference() {
    if (!chooser) return;
    editorUi.pick({
      anchor: chooser.getBoundingClientRect(),
      onpick: (id) => {
        editorUi.closePicker(false);
        reference = id;
        chooser?.focus();
      },
      oncancel: () => chooser?.focus(),
    });
  }

  /** Does something to the note as a step of undo of its own. */
  function step(change: () => void) {
    notebook.undoManager.stopCapturing();
    change();
    notebook.undoManager.stopCapturing();
  }
</script>

<Dialog open title={t('notebook-source')} width={500} {onclose}>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="form"
    data-source-dialog
    onkeydown={(e) => {
      if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
        e.preventDefault();
        apply();
      }
    }}
  >
    {#if current && isFile && current.sort === 'file'}
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
      <Segmented
        bind:value={sort}
        label={t('notebook-source-sort')}
        options={[
          { value: 'web', label: t('notebook-source-web') },
          { value: 'reference', label: t('notebook-source-reference') },
          { value: 'words', label: t('notebook-source-other') },
        ]}
      />
      {#if sort === 'web'}
        <TextField bind:value={url} label={t('notebook-source-url')} type="url" data-source-url />
        <TextField bind:value={title} label={t('notebook-source-page-title')} data-source-title />
      {:else if sort === 'reference'}
        <div class="field">
          <span class="label">{t('notebook-source-reference')}</span>
          <button
            bind:this={chooser}
            type="button"
            class="chosen"
            class:none={!reference}
            data-source-reference
            onclick={chooseReference}
          >
            <BookMarked size={14} />
            <span class="truncate"
              >{reference
                ? sourceLabel({ id: '', sort: 'reference', reference })
                : t('notebook-source-choose-reference')}</span
            >
          </button>
        </div>
        <label class="field">
          <span class="label">{t('notebook-source-place')}</span>
          <span class="place">
            <select aria-label={t('editor-citation-locator-kind')} bind:value={label}>
              {#each LOCATOR_LABELS as [value] (value)}
                <option {value}>{t(`editor-locator-${value}`)}</option>
              {/each}
            </select>
            <input bind:value={locator} placeholder="45–67" data-source-locator />
          </span>
        </label>
      {:else}
        <TextField bind:value={words} label={t('notebook-source-words')} data-source-words />
      {/if}
    {/if}

    {#if made && current?.reference}
      <p class="made">
        {t('notebook-source-in-library')}
        <button
          type="button"
          class="link"
          onclick={() => {
            const entry = current?.reference;
            onclose();
            if (entry) router.go({ view: 'library', entry });
          }}>{made}</button
        >
      </p>
    {/if}

    {#if taken.passages.length}
      <section class="passages" aria-label={t('notebook-source-passages')}>
        <h3 class="overline">{t('notebook-source-passages')}</h3>
        {#each taken.passages as p (p.id)}
          <div class="passage" data-passage={p.id}>
            <p class="now">{p.now}</p>
            {#if p.changed}
              <p class="changed">{t('notebook-source-changed')}</p>
              <p class="then">{p.then}</p>
            {/if}
            <div class="actions">
              {#if p.changed}
                <Button
                  size="sm"
                  variant="ghost"
                  data-bring-back
                  onclick={() => step(() => notebook.bringBack(note, p.id))}
                >
                  {t('notebook-source-bring-back')}
                </Button>
              {/if}
              <Button
                size="sm"
                variant="ghost"
                data-own-words
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

  {#snippet footer()}
    {#if canMake}
      <Button variant="ghost" data-make-reference onclick={() => void makeReference()}>
        {t('notebook-source-make-reference')}
      </Button>
    {/if}
    <span class="gap"></span>
    {#if isFile}
      <Button variant="primary" onclick={onclose}>{t('common-close')}</Button>
    {:else}
      <Button variant="ghost" onclick={onclose}>{t('common-cancel')}</Button>
      <Button variant="primary" disabled={!ready} data-source-apply onclick={apply}>
        {t('common-apply')}
      </Button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
  .chosen {
    display: flex;
    align-items: center;
    gap: 7px;
    height: var(--control-h);
    padding: 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .chosen.none {
    color: var(--ink-3);
  }
  .chosen:hover {
    border-color: var(--accent);
  }
  .place {
    display: flex;
    gap: 6px;
  }
  .place select,
  .place input {
    height: var(--control-h);
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink);
    font: inherit;
    outline: none;
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
  .made {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-2);
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
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: pre-line;
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
    justify-content: flex-end;
    gap: 4px;
    margin-top: 4px;
  }
  .gap {
    flex: 1;
  }
</style>
