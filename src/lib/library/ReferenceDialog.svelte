<script lang="ts">
  import Code from '@lucide/svelte/icons/code';
  import {
    collectionAdd,
    collectionList,
    libraryAdd,
    libraryDraftSource,
    libraryFindMatches,
    libraryGet,
    libraryParseSource,
    librarySuggestKey,
    libraryUpdate,
    type Match,
  } from '$lib/api/library';
  import { isBackendError } from '$lib/api/backend';
  import { library } from '$lib/state/library.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import DuplicateNotice from './DuplicateNotice.svelte';
  import Lookup from './Lookup.svelte';
  import ReferenceForm from './ReferenceForm.svelte';
  import { rememberType, type FormRequest } from './references.svelte';

  let { request, onclose }: { request: FormRequest; onclose: () => void } = $props();

  // The dialog is made anew for every request, so the first value is the only one.
  // svelte-ignore state_referenced_locally
  let draft = $state($state.snapshot(request.draft));
  let matches = $state<Match[]>([]);
  let suggestedKey = $state('');
  let error = $state<string | null>(null);
  let keyError = $state<string | null>(null);
  let saving = $state(false);
  let changed = $state(false);

  /** The source view: null when the form is shown. */
  let source = $state<string | null>(null);
  let sourceError = $state<string | null>(null);

  // svelte-ignore state_referenced_locally
  const isNew = request.mode === 'new';
  const hasContent = $derived(
    Object.values(draft.fields).some((v) => v.trim()) ||
      Object.values(draft.names).some((list) =>
        list.some((p) => p.family?.trim() || p.given?.trim()),
      ),
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  let round = 0;

  function onchange() {
    changed = true;
    error = null;
    keyError = null;
    clearTimeout(timer);
    timer = setTimeout(look, 350);
  }

  async function look() {
    const mine = ++round;
    const snapshot = $state.snapshot(draft);
    try {
      const [found, key] = await Promise.all([
        hasContent ? libraryFindMatches(snapshot, request.reference?.id) : Promise.resolve([]),
        librarySuggestKey(snapshot, request.reference?.id),
      ]);
      if (mine !== round) return;
      matches = found;
      suggestedKey = key;
    } catch {
      // Looking for duplicates is a help, not a condition.
    }
  }

  $effect(() => {
    look();
    return () => clearTimeout(timer);
  });

  function finish(result: Parameters<FormRequest['resolve']>[0]) {
    request.resolve(result);
    onclose();
  }

  async function useExisting(match: Match) {
    try {
      const existing = await libraryGet(match.id);
      if (request.collection) {
        await collectionAdd(request.collection, [existing.id]);
        library.setCollections(await collectionList());
      }
      finish(existing);
    } catch (e) {
      error = describeError(e) ?? 'The reference could not be opened.';
    }
  }

  async function save() {
    if (saving) return;
    if (source !== null && !(await leaveSource())) return;
    saving = true;
    error = null;
    keyError = null;
    try {
      const snapshot = $state.snapshot(draft);
      const saved = isNew
        ? await libraryAdd(snapshot)
        : await libraryUpdate(request.reference!.id, snapshot);
      library.put(saved);
      rememberType(saved.type);
      if (isNew && request.collection) {
        await collectionAdd(request.collection, [saved.id]);
        library.setCollections(await collectionList());
      }
      finish(saved);
    } catch (e) {
      const message = describeError(e) ?? 'The reference could not be saved.';
      if (isBackendError(e) && /citation key/i.test(e.message)) keyError = message;
      else error = message;
    } finally {
      saving = false;
    }
  }

  async function showSource() {
    try {
      source = await libraryDraftSource($state.snapshot(draft));
      sourceError = null;
    } catch (e) {
      error = describeError(e) ?? null;
    }
  }

  /** Reads the source back into the form. False when it cannot be read. */
  async function leaveSource(): Promise<boolean> {
    if (source === null) return true;
    try {
      draft = await libraryParseSource(source);
      source = null;
      sourceError = null;
      onchange();
      return true;
    } catch (e) {
      sourceError = describeError(e) ?? 'The source could not be read.';
      return false;
    }
  }

  function close() {
    finish(null);
  }

  function onkeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      save();
    }
  }
</script>

<Dialog
  open
  title={isNew ? 'New reference' : 'Edit reference'}
  width={620}
  dismissable={!changed}
  onclose={close}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="content" {onkeydown}>
    {#if isNew && source === null}
      <Lookup
        onpick={(found) => {
          draft = found;
          onchange();
        }}
      />
    {/if}
    {#if isNew}
      <DuplicateNotice {matches} onuse={useExisting} />
    {/if}
    {#if error}<p class="error selectable" role="alert">{error}</p>{/if}

    {#if source !== null}
      <textarea
        class="source"
        bind:value={source}
        spellcheck="false"
        aria-label="BibLaTeX source"
        oninput={() => {
          changed = true;
          sourceError = null;
        }}></textarea>
      {#if sourceError}<p class="error selectable" role="alert">{sourceError}</p>{/if}
    {:else}
      <ReferenceForm bind:draft {onchange} {suggestedKey} {keyError} autofocus={!isNew} />
    {/if}
  </div>

  {#snippet footer()}
    <div class="left">
      <Button
        variant="ghost"
        size="sm"
        onclick={() => (source === null ? showSource() : leaveSource())}
      >
        {#snippet icon()}<Code size={14} />{/snippet}
        {source === null ? 'Source' : 'Back to the form'}
      </Button>
    </div>
    <Button variant="ghost" onclick={close}>Cancel</Button>
    <Button variant="primary" disabled={saving || (!hasContent && source === null)} onclick={save}>
      {isNew ? 'Add reference' : 'Save'}
    </Button>
  {/snippet}
</Dialog>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 380px;
  }
  .error {
    padding: 8px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
  }
  .source {
    flex: 1;
    min-height: 360px;
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
    overflow: auto;
    tab-size: 2;
  }
  .source:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  .left {
    margin-right: auto;
  }
</style>
