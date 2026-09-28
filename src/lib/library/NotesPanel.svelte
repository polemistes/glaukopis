<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { libraryGet, librarySetNote } from '$lib/api/library';
  import { currentProject, lookup, recordOf } from '$lib/editor/references.svelte';
  import { t } from '$lib/i18n';
  import { library } from '$lib/state/library.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { truncate } from './format';
  import { carriedNote, toLines, type NotesRequest } from './notes.svelte';

  let { request, onclose }: { request: NotesRequest; onclose: () => void } = $props();

  // The panel is made anew for every request.
  // svelte-ignore state_referenced_locally
  const id = request.id;
  const project = currentProject();
  const inLibrary = !!library.get(id);
  const about = lookup(id);

  let loading = $state(inLibrary);
  /** For all projects: kept with the reference. */
  let global = $state('');
  /** For this project: kept in it. */
  let local = $state(project ? (project.notes.get(id) ?? carriedNote(id)) : '');
  /** Whether the note for all projects is shown though nothing is in it yet. */
  let showGlobal = $state(!project);
  let root = $state<HTMLDivElement>();

  let saved = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let writing: Promise<void> = Promise.resolve();

  $effect(() => {
    if (!inLibrary) return;
    untrack(async () => {
      try {
        const reference = await libraryGet(id);
        global = saved = toLines(reference.fields.annotation);
      } catch (error) {
        notifyError(t('library-notes-unread'), error);
      } finally {
        loading = false;
      }
    });
  });

  // What another writes in the note of the project, while it is open here.
  $effect(() => {
    if (!project) return;
    const theirs = project.notes.get(id);
    untrack(() => {
      if (theirs !== undefined && theirs !== local) local = theirs;
    });
  });

  function writeLocal() {
    project?.setNote(id, local);
  }

  function writeGlobal() {
    clearTimeout(timer);
    timer = setTimeout(saveGlobal, 600);
  }

  function saveGlobal(): Promise<void> {
    clearTimeout(timer);
    timer = undefined;
    const text = global;
    if (!inLibrary || text.trim() === saved.trim()) return writing;
    writing = writing.then(async () => {
      try {
        const reference = await librarySetNote(id, text);
        saved = toLines(reference.fields.annotation);
        library.put(reference);
        // The copy that the project carries is to say the same.
        if (project?.refs.has(id)) project.putReference(recordOf(reference));
      } catch (error) {
        notifyError(t('library-notes-unsaved'), error);
      }
    });
    return writing;
  }

  /** What was written for this project is made a note for all projects. */
  function forAll() {
    const text = local.trim();
    if (!text || !inLibrary) return;
    global = global.trim() ? `${global.trim()}\n${text}` : text;
    local = '';
    showGlobal = true;
    writeLocal();
    void saveGlobal();
    void tick().then(() =>
      root?.querySelector<HTMLTextAreaElement>('textarea[data-scope="all"]')?.focus(),
    );
  }

  function close() {
    void saveGlobal();
    onclose();
  }

  function grow(node: HTMLTextAreaElement, _value: string) {
    const fit = () => {
      node.style.height = '0';
      node.style.height = `${Math.min(Math.max(node.scrollHeight + 2, 84), 320)}px`;
    };
    fit();
    return { update: fit };
  }
</script>

<Popover
  open
  anchor={request.anchor}
  side="bottom"
  align="end"
  gap={6}
  width={400}
  label={t('library-notes')}
  onclose={close}
>
  <div class="notes" bind:this={root}>
    <header>
      {#if about}
        <span class="who">{about.authors || '—'} {about.year}</span>
        <span class="title serif">{truncate(about.title, 80)}</span>
      {:else}
        <span class="who">{t('library-notes-not-in-library')}</span>
      {/if}
    </header>

    {#if loading}
      <div class="waiting"><Spinner size={16} /></div>
    {:else}
      {#if project}
        <label class="note">
          <span class="overline">{t('library-notes-this-project')}</span>
          <textarea
            bind:value={local}
            use:grow={local}
            placeholder={t('library-notes-project-placeholder')}
            spellcheck="true"
            data-scope="project"
            data-autofocus
            oninput={writeLocal}
            {@attach (el: HTMLTextAreaElement) => {
              if (!global.trim()) el.focus();
            }}></textarea>
        </label>
        {#if inLibrary}
          <div class="under">
            <button type="button" class="link" disabled={!local.trim()} onclick={forAll}>
              {t('library-notes-keep-for-all')}
            </button>
            {#if !showGlobal && !global.trim()}
              <button type="button" class="link quiet" onclick={() => (showGlobal = true)}>
                {t('library-notes-write-for-all')}
              </button>
            {/if}
          </div>
        {:else}
          <p class="hint">{t('library-notes-carried')}</p>
        {/if}
      {/if}

      {#if inLibrary && (showGlobal || global.trim())}
        <label class="note">
          <span class="overline"
            >{project ? t('library-notes-all-projects') : t('library-notes-yours')}</span
          >
          <textarea
            bind:value={global}
            use:grow={global}
            placeholder={t('library-notes-all-placeholder')}
            spellcheck="true"
            data-scope="all"
            oninput={writeGlobal}
            onblur={saveGlobal}
            {@attach (el: HTMLTextAreaElement) => {
              if (!project) el.focus();
            }}></textarea>
        </label>
        {#if project}
          <p class="hint">{t('library-notes-kept')}</p>
        {/if}
      {/if}
    {/if}
  </div>
</Popover>

<style>
  .notes {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px 16px;
  }
  header {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--line);
  }
  .who {
    font-weight: 600;
    font-size: var(--text-sm);
  }
  .title {
    color: var(--ink-2);
    line-height: 1.35;
  }
  .waiting {
    display: flex;
    justify-content: center;
    padding: 20px 0;
  }
  .note {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  textarea {
    display: block;
    width: 100%;
    min-height: 84px;
    padding: 9px 11px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-m);
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 14.5px;
    line-height: 1.55;
    resize: none;
    outline: none;
  }
  textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  textarea::placeholder {
    color: var(--ink-4);
  }
  .under {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: -4px;
  }
  .link {
    padding: 0;
    border: none;
    background: none;
    color: var(--accent-strong);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .link:hover:not(:disabled) {
    text-decoration: underline;
  }
  .link:disabled {
    color: var(--ink-4);
    cursor: default;
  }
  .link.quiet {
    color: var(--ink-3);
  }
  .hint {
    margin: -4px 0 0;
    color: var(--ink-3);
    font-size: var(--text-xs);
    line-height: 1.45;
  }
</style>
