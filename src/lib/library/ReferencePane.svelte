<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { untrack } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import Code from '@lucide/svelte/icons/code';
  import Copy from '@lucide/svelte/icons/copy';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import FileText from '@lucide/svelte/icons/file-text';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import {
    attachmentAdd,
    attachmentOpen,
    attachmentRemove,
    attachmentReveal,
    collectionList,
    collectionRemove,
    draftOf,
    libraryGet,
    librarySource,
    libraryUpdate,
    libraryUpdateSource,
    type Draft,
    type Reference,
    type StoredFile,
  } from '$lib/api/library';
  import { isBackendError } from '$lib/api/backend';
  import { library } from '$lib/state/library.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { dateWords, fileSize } from './format';
  import { toLines, withNoteAsItIs } from './notes.svelte';
  import ReferenceForm from './ReferenceForm.svelte';

  interface Props {
    id: string;
    ondelete: (id: string) => void;
    onduplicate?: (draft: Draft) => void;
    onclose?: () => void;
  }

  let { id, ondelete, onduplicate, onclose }: Props = $props();

  let reference = $state<Reference | null>(null);
  let draft = $state<Draft | null>(null);
  let status = $state<'loading' | 'saved' | 'changed' | 'saving' | 'error'>('loading');
  let error = $state<string | null>(null);
  let keyError = $state<string | null>(null);

  let timer: ReturnType<typeof setTimeout> | undefined;
  /** The id the draft belongs to; a save that returns late must not touch another entry's form. */
  let loadedId = '';

  $effect(() => {
    const wanted = id;
    untrack(() => {
      flush();
      load(wanted);
    });
  });

  // What is changed elsewhere, such as a note written from the list, is
  // taken up when nothing here is waiting to be saved.
  $effect(() => {
    const now = library.get(id)?.modified;
    untrack(() => {
      if (!now || !reference || reference.id !== id || status !== 'saved') return;
      if (now !== reference.modified) load(id);
    });
  });

  // ---- what the user writes about the work ----

  const note = $derived(toLines(draft?.fields.annotation));

  function writeNote(text: string) {
    if (!draft) return;
    // Lines here are paragraphs in the file.
    const lines = text.split('\n');
    const field = lines
      .map((line, i) => (i === lines.length - 1 ? line : line.trimEnd()))
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n');
    if (field.trim()) draft.fields.annotation = field;
    else delete draft.fields.annotation;
    onchange();
  }

  function growNote(node: HTMLTextAreaElement, _value: string) {
    const fit = () => {
      node.style.height = '0';
      node.style.height = `${Math.min(Math.max(node.scrollHeight + 2, 72), 360)}px`;
    };
    fit();
    return { update: fit };
  }

  // Save what is pending when the pane goes away.
  $effect(() => () => flush());

  async function load(wanted: string) {
    status = 'loading';
    error = null;
    keyError = null;
    try {
      const loaded = await libraryGet(wanted);
      if (wanted !== id) return;
      reference = loaded;
      draft = draftOf(loaded);
      loadedId = loaded.id;
      status = 'saved';
    } catch (e) {
      if (wanted !== id) return;
      reference = null;
      draft = null;
      error = describeError(e) ?? 'The reference could not be read.';
      status = 'error';
    }
  }

  function onchange() {
    status = 'changed';
    clearTimeout(timer);
    timer = setTimeout(save, 700);
  }

  /** Saves at once what is waiting to be saved. */
  function flush() {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
      if (status === 'changed') save();
    }
  }

  async function save() {
    timer = undefined;
    if (!draft || !loadedId) return;
    const forId = loadedId;
    const snapshot = $state.snapshot(draft);
    // An emptied key means: make one.
    status = 'saving';
    try {
      const saved = await libraryUpdate(forId, await withNoteAsItIs(forId, snapshot, reference));
      library.put(saved);
      if (forId !== loadedId) return;
      reference = saved;
      // The form keeps what the user typed, except the key when one was made.
      if (draft && !draft.key.trim()) draft.key = saved.key;
      error = null;
      keyError = null;
      if (status === 'saving') status = 'saved';
    } catch (e) {
      if (forId !== loadedId) return;
      const message = describeError(e) ?? 'The changes could not be saved.';
      if (isBackendError(e) && /citation key/i.test(e.message)) keyError = message;
      else error = message;
      status = 'error';
    }
  }

  async function attach(paths?: string[]) {
    if (!reference) return;
    let chosen = paths;
    if (!chosen) {
      const picked = await open({ title: 'Attach files', multiple: true });
      if (!picked) return;
      chosen = Array.isArray(picked) ? picked : [picked];
    }
    try {
      reference = await attachmentAdd(reference.id, chosen);
      library.put(reference);
    } catch (e) {
      notifyError('The file could not be attached', e);
    }
  }

  async function detach(file: StoredFile) {
    if (!reference) return;
    const ok = await confirm({
      title: `Remove “${file.name}”?`,
      message: 'The file is deleted from the library’s store, unless another reference uses it.',
      confirm: 'Remove file',
      danger: true,
    });
    if (!ok) return;
    try {
      reference = await attachmentRemove(reference.id, file.path);
      library.put(reference);
    } catch (e) {
      notifyError('The file could not be removed', e);
    }
  }

  async function leaveCollection(collectionId: string) {
    if (!reference) return;
    try {
      await collectionRemove(collectionId, [reference.id]);
      library.setCollections(await collectionList());
      reference.collections = reference.collections.filter((c) => c !== collectionId);
    } catch (e) {
      notifyError('That could not be done', e);
    }
  }

  // ---- source ----

  let source = $state<string | null>(null);
  let sourceError = $state<string | null>(null);

  async function editSource() {
    if (!reference) return;
    flush();
    try {
      source = await librarySource(reference.id);
      sourceError = null;
    } catch (e) {
      notifyError('The source could not be shown', e);
    }
  }

  async function applySource() {
    if (!reference || source === null) return;
    try {
      const saved = await libraryUpdateSource(reference.id, source);
      library.put(saved);
      reference = saved;
      draft = draftOf(saved);
      source = null;
      status = 'saved';
    } catch (e) {
      sourceError = describeError(e) ?? 'The source could not be read.';
    }
  }

  function menu(event: MouseEvent) {
    if (!reference) return;
    const r = reference;
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: 'Copy citation key',
          icon: Copy,
          action: () => {
            navigator.clipboard.writeText(r.key);
            notifyOk(`Copied “${r.key}”`);
          },
        },
        {
          label: 'Copy as BibLaTeX',
          action: async () => {
            navigator.clipboard.writeText(await librarySource(r.id));
            notifyOk('Copied');
          },
        },
        { kind: 'separator' },
        {
          label: 'Duplicate',
          hint: 'A new reference beginning with these details',
          action: () => {
            const copy = draftOf(r);
            copy.key = '';
            onduplicate?.(copy);
          },
        },
        { label: 'Edit the source…', icon: Code, action: editSource },
        { kind: 'separator' },
        { label: 'Delete', icon: Trash2, danger: true, action: () => ondelete(r.id) },
      ],
      { align: 'end' },
    );
  }
</script>

<aside
  class="pane"
  aria-label="Reference"
  use:dropTarget={{
    accepts: ['files'],
    ondrop: (e) => attach(e.payload.data as string[]),
  }}
>
  <header>
    <div class="status" aria-live="polite">
      {#if status === 'saving' || status === 'loading'}
        <Spinner size={12} />
      {:else if status === 'saved'}
        <span class="saved"><Check size={13} /> Saved</span>
      {:else if status === 'changed'}
        <span class="muted">Editing…</span>
      {:else if status === 'error'}
        <span class="failed">Not saved</span>
      {/if}
    </div>
    <IconButton label="More" onclick={menu} disabled={!reference}><Ellipsis size={16} /></IconButton
    >
    {#if onclose}
      <IconButton label="Close" onclick={onclose}><X size={16} /></IconButton>
    {/if}
  </header>

  <div class="scroll">
    {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

    {#if draft && reference}
      <ReferenceForm bind:draft {onchange} {keyError} />

      <section>
        <div class="section-head">
          <h3 class="overline">Your notes</h3>
        </div>
        <textarea
          class="note"
          value={note}
          use:growNote={note}
          placeholder="What you make of it. For yourself: it is not part of what is cited."
          aria-label="Your notes on this work"
          spellcheck="true"
          oninput={(e) => writeNote(e.currentTarget.value)}></textarea>
      </section>

      <section>
        <div class="section-head">
          <h3 class="overline">Files</h3>
          <Button variant="ghost" size="sm" onclick={() => attach()}>
            {#snippet icon()}<Paperclip size={13} />{/snippet}
            Attach
          </Button>
        </div>
        {#each reference.files as file (file.path)}
          <div class="file" class:missing={!file.exists}>
            <button
              type="button"
              class="open"
              disabled={!file.exists}
              onclick={() =>
                attachmentOpen(file.path).catch((e) =>
                  notifyError('The file could not be opened', e),
                )}
            >
              <FileText size={15} strokeWidth={1.6} />
              <span class="name truncate">{file.name}</span>
              <span class="size">{file.exists ? fileSize(file.size) : 'missing'}</span>
            </button>
            <IconButton
              label="Show in the file manager"
              size="sm"
              disabled={!file.exists}
              onclick={() =>
                attachmentReveal(file.path).catch((e) =>
                  notifyError('The folder could not be opened', e),
                )}
            >
              <FolderOpen size={13} />
            </IconButton>
            <IconButton label="Remove" size="sm" onclick={() => detach(file)}
              ><X size={13} /></IconButton
            >
          </div>
        {:else}
          <p class="none">No files. Attach a PDF, or drop one here.</p>
        {/each}
      </section>

      {#if reference.collections.length}
        <section>
          <div class="section-head"><h3 class="overline">Collections</h3></div>
          <div class="chips">
            {#each reference.collections as c (c)}
              {@const collection = library.collection(c)}
              {#if collection}
                <span class="chip">
                  {collection.name}
                  <button
                    type="button"
                    aria-label="Remove from {collection.name}"
                    onclick={() => leaveCollection(c)}
                  >
                    <X size={11} />
                  </button>
                </span>
              {/if}
            {/each}
          </div>
        </section>
      {/if}

      <p class="dates">
        Added {dateWords(
          reference.added,
        )}{#if reference.modified.slice(0, 10) !== reference.added.slice(0, 10)}
          · changed {dateWords(reference.modified)}{/if}
      </p>
    {/if}
  </div>
</aside>

{#if source !== null}
  <Dialog
    open
    title="Source"
    subtitle="The entry as BibLaTeX. Most things are easier in the form."
    width={680}
    onclose={() => (source = null)}
  >
    <textarea
      class="source"
      bind:value={source}
      spellcheck="false"
      aria-label="BibLaTeX source"
      oninput={() => (sourceError = null)}></textarea>
    {#if sourceError}<p class="error selectable" role="alert">{sourceError}</p>{/if}
    {#snippet footer()}
      <Button variant="ghost" onclick={() => (source = null)}>Cancel</Button>
      <Button variant="primary" onclick={applySource}>Apply</Button>
    {/snippet}
  </Dialog>
{/if}

<style>
  textarea.note {
    display: block;
    width: 100%;
    min-height: 72px;
    padding: 9px 11px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 14.5px;
    line-height: 1.55;
    resize: none;
    outline: none;
  }
  textarea.note:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  textarea.note::placeholder {
    color: var(--ink-4);
  }
  .pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--paper-raised);
    border-left: 1px solid var(--line);
  }
  .pane:global([data-drop-over]) {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  header {
    display: flex;
    align-items: center;
    gap: 2px;
    height: var(--bar-h);
    flex: none;
    padding: 0 10px 0 18px;
    border-bottom: 1px solid var(--line);
  }
  .status {
    flex: 1;
    display: flex;
    align-items: center;
    font-size: var(--text-sm);
  }
  .saved {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--ink-4);
  }
  .failed {
    color: var(--danger);
    font-weight: 500;
  }
  .scroll {
    flex: 1;
    overflow-y: auto;
    padding: 16px 14px 28px 12px;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }
  .error {
    padding: 8px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
  }
  section {
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
    margin-left: 6px;
  }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 26px;
    margin-bottom: 4px;
  }
  .file {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .open {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 30px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  .open:hover:not(:disabled) {
    background: var(--paper-hover);
  }
  .missing .open {
    color: var(--ink-4);
    cursor: default;
  }
  .name {
    flex: 1;
    min-width: 0;
  }
  .size {
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .missing .size {
    color: var(--danger);
  }
  .none {
    padding: 2px 8px;
    font-size: var(--text-sm);
    color: var(--ink-4);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    padding: 0 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 22px;
    padding: 0 4px 0 9px;
    border-radius: 11px;
    background: var(--paper-sunken);
    border: 1px solid var(--line);
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .chip button {
    display: inline-flex;
    padding: 2px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-4);
    cursor: pointer;
  }
  .chip button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .dates {
    margin-left: 14px;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .source {
    display: block;
    width: 100%;
    height: 380px;
    padding: 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--paper);
    font-family: var(--font-mono);
    font-size: 12.5px;
    line-height: 1.6;
    resize: vertical;
    outline: none;
    white-space: pre;
  }
  .source:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .source + .error {
    margin-top: var(--space-3);
  }
</style>
