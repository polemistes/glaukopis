<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import { onMount, untrack } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import Code from '@lucide/svelte/icons/code';
  import Copy from '@lucide/svelte/icons/copy';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Network from '@lucide/svelte/icons/network';
  import Map from '@lucide/svelte/icons/map';
  import FileStack from '@lucide/svelte/icons/file-stack';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import {
    attachmentAdd,
    attachmentOpen,
    attachmentRemove,
    attachmentRemoveAll,
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
  import { t } from '$lib/i18n';
  import { library } from '$lib/state/library.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import { copyOut } from './copying';
  import { citing, showCitations } from './citing.svelte';
  import { dateWords, fileSize } from './format';
  import { toLines, withNoteAsItIs } from './notes.svelte';
  import ReferenceForm from './ReferenceForm.svelte';
  import ScanText from '@lucide/svelte/icons/scan-text';
  import PdfMapDialog from '$lib/ocr/PdfMapDialog.svelte';
  import PictureTextDialog from '$lib/ocr/PictureTextDialog.svelte';
  import FileChooser from '$lib/files/FileChooser.svelte';
  import { addToTabsMenu } from '$lib/viewer/show';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import { filesAssign } from '$lib/api/files';
  import { KIND_ICONS, bringInFile, files as filesState } from '$lib/files/store.svelte';
  import { PROJECT } from '$lib/project/model/types';
  import SearchableDialog from '$lib/ocr/SearchableDialog.svelte';
  import type { Project } from '$lib/project/model/project.svelte';

  interface Props {
    id: string;
    ondelete: (id: string) => void;
    onduplicate?: (draft: Draft) => void;
    onclose?: () => void;
    /** The project the pane stands in, where it does, with its id: a PDF can be read into it as a branch. */
    project?: Project | null;
    projectId?: string | null;
    /** The element in view of that project, under which the branch is made. */
    at?: string | null;
    /** Asks for an element made in that project to be entered. */
    onenter?: (id: string) => void;
  }

  let {
    id,
    ondelete,
    onduplicate,
    onclose,
    project = null,
    projectId = null,
    at = null,
    onenter,
  }: Props = $props();

  /** The projects that cite the work; those that did not say are read once. */
  const citers = $derived(citing.of(id));
  onMount(() => void citing.fill());

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
      error = describeError(e) ?? t('library-pane-unread');
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
      const message = describeError(e) ?? t('library-pane-save-failed');
      if (isBackendError(e) && e.kind === 'key') keyError = message;
      else error = message;
      status = 'error';
    }
  }

  /** The reference as a question names it: its title, or its key where it has none. */
  const named = $derived(reference ? reference.summary.title || reference.key : '');

  /** Files of the library are being chosen for this reference (`FileChooser.svelte`). */
  let addingFiles = $state(false);

  async function attach(paths?: string[]) {
    if (!reference) return;
    let chosen = paths;
    if (!chosen) {
      const picked = await open({ title: t('library-pane-attach-title'), multiple: true });
      if (!picked) return;
      chosen = Array.isArray(picked) ? picked : [picked];
    }
    // Several files given to one reference is asked first, with how many:
    // files that are each another work are gone through among the files.
    if (chosen.length > 1) {
      const ok = await confirm({
        title: t('library-pane-attach-many-title', { count: chosen.length, title: named }),
        message: t('library-pane-attach-many-message'),
        confirm: t('library-pane-attach-many', { count: chosen.length }),
      });
      if (!ok || !reference) return;
    }
    try {
      reference = await attachmentAdd(reference.id, chosen);
      library.put(reference);
      if (filesState.loaded) void filesState.reload();
    } catch (e) {
      notifyError(t('library-pane-attach-failed'), e);
    }
  }

  /** Files of the library made this reference's. */
  async function addFiles(hashes: string[]) {
    if (!reference) return;
    const id = reference.id;
    let added = 0;
    try {
      const failed = await filesAssign(hashes.map((hash) => ({ hash, id })));
      added = hashes.length - failed.length;
      if (failed.length) notifyError(t('files-assign-failed'), failed.slice(0, 4).join('\n'));
    } catch (e) {
      notifyError(t('files-assign-failed'), e);
    }
    const fresh = await libraryGet(id).catch(() => null);
    if (fresh) {
      library.put(fresh);
      if (reference?.id === id) reference = fresh;
    }
    if (filesState.loaded) void filesState.reload();
    if (added) notifyOk(t('files-added-to', { count: added, title: named }));
  }

  /** Every file taken from this reference at once; they stay among the files of the library. */
  async function detachAll() {
    if (!reference) return;
    const count = reference.files.length;
    const ok = await confirm({
      title: t('library-pane-unassign-all-title', { count, title: named }),
      message: t('library-pane-unassign-all-message'),
      confirm: t('library-pane-unassign-all-confirm', { count }),
      danger: true,
    });
    if (!ok || !reference) return;
    try {
      reference = await attachmentRemoveAll(reference.id);
      library.put(reference);
      if (filesState.loaded) void filesState.reload();
    } catch (e) {
      notifyError(t('library-pane-detach-failed'), e);
    }
  }

  async function detach(file: StoredFile) {
    if (!reference) return;
    // The file stays among the files of the library: it is only taken from this reference.
    const ok = await confirm({
      title: t('library-pane-unassign-title', { name: file.name }),
      message: t('library-pane-unassign-message'),
      confirm: t('library-pane-unassign'),
    });
    if (!ok) return;
    try {
      reference = await attachmentRemove(reference.id, file.path);
      library.put(reference);
      if (filesState.loaded) void filesState.reload();
    } catch (e) {
      notifyError(t('library-pane-detach-failed'), e);
    }
  }

  /** The PDF that is being made searchable (`ocr/SearchableDialog.svelte`). */
  let searchable = $state<StoredFile | null>(null);
  /** The PDF whose text is becoming a map (`ocr/PdfMapDialog.svelte`). */
  let mapping = $state<StoredFile | null>(null);
  /** The picture whose text is being read (`ocr/PictureTextDialog.svelte`). */
  let reading = $state<StoredFile | null>(null);

  async function leaveCollection(collectionId: string) {
    if (!reference) return;
    try {
      await collectionRemove(collectionId, [reference.id]);
      library.setCollections(await collectionList());
      reference.collections = reference.collections.filter((c) => c !== collectionId);
    } catch (e) {
      notifyError(t('library-not-done'), e);
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
      notifyError(t('library-pane-source-failed'), e);
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
      sourceError = describeError(e) ?? t('library-source-unread');
    }
  }

  function menu(event: MouseEvent) {
    if (!reference) return;
    const r = reference;
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: t('library-copy-key'),
          icon: Copy,
          action: () => copyOut(() => r.key, t('library-copied-key', { key: r.key })),
        },
        {
          label: t('library-copy-biblatex'),
          action: () => copyOut(() => librarySource(r.id), t('library-copied')),
        },
        { kind: 'separator' },
        {
          label: t('library-pane-duplicate'),
          action: () => {
            const copy = draftOf(r);
            copy.key = '';
            onduplicate?.(copy);
          },
        },
        { label: t('library-pane-edit-source'), icon: Code, action: editSource },
        { kind: 'separator' },
        { label: t('common-delete'), icon: Trash2, danger: true, action: () => ondelete(r.id) },
      ],
      { align: 'end' },
    );
  }
</script>

<aside
  class="pane"
  aria-label={t('library-pane-label')}
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
        <span class="saved"><Check size={13} /> {t('library-pane-saved')}</span>
      {:else if status === 'changed'}
        <span class="muted">{t('library-pane-editing')}</span>
      {:else if status === 'error'}
        <span class="failed">{t('library-pane-not-saved')}</span>
      {/if}
    </div>
    <IconButton label={t('library-pane-more')} onclick={menu} disabled={!reference}
      ><Ellipsis size={16} /></IconButton
    >
    {#if onclose}
      <IconButton label={t('common-close')} onclick={onclose}><X size={16} /></IconButton>
    {/if}
  </header>

  <div class="scroll">
    {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

    {#if draft && reference}
      <ReferenceForm bind:draft {onchange} {keyError} />

      <section>
        <div class="section-head">
          <h3 class="overline">{t('library-notes-yours')}</h3>
        </div>
        <textarea
          class="note"
          value={note}
          use:growNote={note}
          placeholder={t('library-pane-note-placeholder')}
          aria-label={t('library-notes-on-work')}
          spellcheck="true"
          oninput={(e) => writeNote(e.currentTarget.value)}></textarea>
      </section>

      <section>
        <div class="section-head">
          <h3 class="overline">{t('library-pane-files')}</h3>
          <div class="file-actions">
            {#if reference.files.length > 1}
              <Button variant="ghost" size="sm" onclick={() => void detachAll()} data-unassign-all>
                {t('library-pane-unassign-all', { count: reference.files.length })}
              </Button>
            {/if}
            <Button variant="ghost" size="sm" onclick={() => (addingFiles = true)} data-add-files>
              {#snippet icon()}<FileStack size={13} />{/snippet}
              {t('library-pane-add-files')}
            </Button>
            <Button variant="ghost" size="sm" onclick={() => attach()}>
              {#snippet icon()}<Paperclip size={13} />{/snippet}
              {t('library-pane-attach')}
            </Button>
          </div>
        </div>
        {#each reference.files as file (file.path)}
          {@const KindIcon = KIND_ICONS[file.kind] ?? KIND_ICONS.other}
          <div class="file" class:missing={!file.exists}>
            <button
              type="button"
              class="open"
              disabled={!file.exists}
              title={file.kind === 'pdf' || file.kind === 'picture'
                ? t('library-pane-add-to-tabs')
                : undefined}
              onclick={(e) => {
                // A PDF or an image goes to the tabs of a project chosen from a menu (ADR 0074);
                // another kind opens in its own program.
                if (file.kind === 'pdf' || file.kind === 'picture')
                  void addToTabsMenu(e.currentTarget as HTMLElement, [file.hash]);
                else
                  attachmentOpen(file.path).catch((e) =>
                    notifyError(t('library-file-open-failed'), e),
                  );
              }}
            >
              <KindIcon size={15} strokeWidth={1.6} />
              <span class="name truncate">{file.name}</span>
              <span class="size"
                >{file.exists ? fileSize(file.size) : t('library-pane-missing')}</span
              >
            </button>
            <IconButton
              label={t('library-pane-reveal')}
              size="sm"
              disabled={!file.exists}
              onclick={() =>
                attachmentReveal(file.path).catch((e) =>
                  notifyError(t('library-pane-reveal-failed'), e),
                )}
            >
              <FolderOpen size={13} />
            </IconButton>
            {#if file.exists && (file.kind === 'pdf' || file.kind === 'picture')}
              <IconButton
                label={t('files-open-elsewhere')}
                size="sm"
                onclick={() =>
                  attachmentOpen(file.path).catch((e) =>
                    notifyError(t('library-file-open-failed'), e),
                  )}
              >
                <ExternalLink size={13} />
              </IconButton>
            {/if}
            {#if file.exists && file.kind === 'pdf'}
              <IconButton
                label={t('ocr-searchable-button')}
                size="sm"
                data-searchable={file.name}
                onclick={() => (searchable = file)}
              >
                <ScanText size={13} />
              </IconButton>
              <IconButton
                label={t('ocr-map-button')}
                size="sm"
                data-pdf-map={file.name}
                onclick={() => (mapping = file)}
              >
                <Map size={13} />
              </IconButton>
            {:else if file.exists && file.kind === 'picture'}
              <IconButton
                label={t('files-read-text')}
                size="sm"
                data-picture-text={file.name}
                onclick={() => (reading = file)}
              >
                <ScanText size={13} />
              </IconButton>
            {:else if file.exists && file.kind === 'document'}
              <IconButton
                label={t('files-bring-in')}
                size="sm"
                data-bring-in={file.name}
                onclick={() => void bringInFile(file, project, at ?? PROJECT)}
              >
                <Network size={13} />
              </IconButton>
            {/if}
            <IconButton
              label={t('library-pane-unassign')}
              size="sm"
              data-unassign={file.name}
              onclick={() => detach(file)}><X size={13} /></IconButton
            >
          </div>
        {:else}
          <p class="none">{t('library-pane-no-files')}</p>
        {/each}
      </section>

      {#if reference.collections.length}
        <section>
          <div class="section-head"><h3 class="overline">{t('library-collections')}</h3></div>
          <div class="chips">
            {#each reference.collections as c (c)}
              {@const collection = library.collection(c)}
              {#if collection}
                <span class="chip">
                  {collection.name}
                  <button
                    type="button"
                    aria-label={t('library-pane-leave-collection', { name: collection.name })}
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

      <section class="cited">
        <div class="section-head"><h3 class="overline">{t('library-cited-in')}</h3></div>
        {#each citers as project (project.id)}
          <button
            type="button"
            class="citer"
            data-project={project.id}
            onclick={() => showCitations(project.id, id)}
          >
            <FolderOpen size={14} strokeWidth={1.6} />
            <span class="name truncate">{project.name}</span>
          </button>
        {:else}
          <p class="none">
            {citing.reading ? t('library-cited-reading') : t('library-not-cited')}
          </p>
        {/each}
      </section>

      <p class="dates">
        {#if reference.modified.slice(0, 10) !== reference.added.slice(0, 10)}
          {t('library-pane-added-changed', {
            added: dateWords(reference.added),
            changed: dateWords(reference.modified),
          })}
        {:else}
          {t('library-pane-added', { date: dateWords(reference.added) })}
        {/if}
      </p>
    {/if}
  </div>
</aside>

{#if source !== null}
  <Dialog
    open
    title={t('library-source')}
    subtitle={t('library-pane-source-subtitle')}
    width={680}
    onclose={() => (source = null)}
  >
    <textarea
      class="source"
      bind:value={source}
      spellcheck="false"
      aria-label={t('library-source-label')}
      oninput={() => (sourceError = null)}></textarea>
    {#if sourceError}<p class="error selectable" role="alert">{sourceError}</p>{/if}
    {#snippet footer()}
      <Button variant="ghost" onclick={() => (source = null)}>{t('common-cancel')}</Button>
      <Button variant="primary" onclick={applySource}>{t('common-apply')}</Button>
    {/snippet}
  </Dialog>
{/if}

{#if searchable && reference}
  <SearchableDialog
    {reference}
    file={searchable}
    ondone={(_, made) => {
      if (!made) return;
      if (made.id === reference?.id) reference = made;
      library.put(made);
      if (filesState.loaded) void filesState.reload();
    }}
    onclose={() => (searchable = null)}
  />
{/if}

{#if addingFiles && reference}
  <FileChooser
    title={t('library-pane-add-files-title', { title: named })}
    except={reference.files.map((f) => f.hash)}
    onpick={(hashes) => void addFiles(hashes)}
    onclose={() => (addingFiles = false)}
  />
{/if}

{#if reading}
  <PictureTextDialog file={reading} {project} {at} {onenter} onclose={() => (reading = null)} />
{/if}

{#if mapping}
  <PdfMapDialog
    file={mapping}
    {project}
    {projectId}
    {at}
    {onenter}
    onclose={() => (mapping = null)}
  />
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    min-height: 26px;
    margin-bottom: 4px;
  }
  .file-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 2px;
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
  .citer {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 30px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--accent-strong);
    text-align: left;
    cursor: pointer;
  }
  .citer:hover {
    background: var(--paper-hover);
  }
  .citer:hover .name {
    text-decoration: underline;
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
