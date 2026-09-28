<script lang="ts">
  /**
   * What is known and said of one picture of the store: what it is called,
   * what is said of it where it becomes a figure, what it shows, and what the
   * user makes of it, which is part of no document.
   *
   * The pane is made anew for every picture.
   */
  import { onMount, tick, untrack } from 'svelte';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { pictures, type Picture, type PictureChange } from '$lib/figures/pictures.svelte';
  import { dateWords, fileSize } from '$lib/library/format';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { Inline } from '$lib/project/model/text';
  import { projects } from '$lib/state/projects.svelte';
  import { formatRoute } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import TextField from '$lib/ui/TextField.svelte';
  import CaptionField from './CaptionField.svelte';
  import { kindWords, noteKey, removePicture, usersOf } from './store.svelte';
  import Thumb from './Thumb.svelte';
  import ScanText from '@lucide/svelte/icons/scan-text';
  import { t } from '$lib/i18n';
  import PictureTextDialog from '$lib/ocr/PictureTextDialog.svelte';

  interface Props {
    /** The name the store keeps the picture by. */
    hash: string;
    /** The project that is open, when the pane is shown in one. */
    project?: Project | null;
    /** Called when the picture has been removed from the store. */
    onremoved?: () => void;
    /** Asks for a map of the project that is open to be shown. */
    onopenmap?: (map: string) => void;
  }

  let { hash, project = null, onremoved, onopenmap }: Props = $props();

  // svelte-ignore state_referenced_locally
  const own = hash;
  // svelte-ignore state_referenced_locally
  const inProject = project;
  const key = noteKey(own);

  const picture = $derived(pictures.get(own));
  /** The picture as the project names it: all that is known of one that has not arrived. */
  const named = $derived(inProject?.usedPictures().find((p) => p.hash === own));

  type Field = 'name' | 'caption' | 'alt' | 'note';

  let name = $state('');
  let caption = $state.raw<Inline[]>([]);
  let alt = $state('');
  /** For all projects: kept with the picture. */
  let note = $state('');
  /** For this project: kept in it. */
  let local = $state(untrack(() => inProject?.notes.get(key) ?? ''));
  /** Whether the note for all projects is shown though nothing is in it yet. */
  let showAll = $state(!inProject);
  let root = $state<HTMLDivElement>();
  /** Whether the text in the picture is being read (`ocr/PictureTextDialog.svelte`). */
  let reading = $state(false);

  /** What has been written here and is not kept yet. */
  const waiting = new Set<Field>();
  const timers = new Map<Field, ReturnType<typeof setTimeout>>();
  let writing: Promise<void> = Promise.resolve();

  onMount(() => {
    void pictures.load();
    if (!projects.loaded) void projects.load();
  });

  /** Whether something is being written in a field, or waiting to be kept. */
  function busy(field: Field): boolean {
    if (waiting.has(field)) return true;
    const at = document.activeElement;
    return !!at && !!root?.querySelector(`[data-field="${field}"]`)?.contains(at);
  }

  // What is said of the picture elsewhere meanwhile is shown here, except
  // where something is being written.
  $effect(() => {
    const p = picture;
    if (!p) return;
    untrack(() => {
      if (!busy('name')) name = p.name;
      if (!busy('caption')) caption = p.caption ?? [];
      if (!busy('alt')) alt = p.alt;
      if (!busy('note')) note = p.note;
    });
  });

  // What another writes in the note of the project, while it is open here.
  $effect(() => {
    if (!inProject) return;
    const theirs = inProject.notes.get(key);
    untrack(() => {
      if (theirs !== undefined && theirs !== local) local = theirs;
    });
  });

  function written(field: Field): PictureChange {
    if (field === 'name') return { name: name.trim() };
    if (field === 'caption') return { caption: $state.snapshot(caption) as Inline[] };
    if (field === 'alt') return { alt: alt.trim() };
    return { note: note.trim() };
  }

  /** Something was written: it is kept a moment after the writing stops. */
  function wrote(field: Field, wait = 700) {
    waiting.add(field);
    clearTimeout(timers.get(field));
    timers.set(
      field,
      setTimeout(() => void keep(field), wait),
    );
  }

  /** Keeps at once what is waiting to be kept. */
  function keep(field: Field): Promise<void> {
    clearTimeout(timers.get(field));
    timers.delete(field);
    if (!waiting.has(field)) return writing;
    const was: Picture | undefined = pictures.get(own);
    const change = written(field);
    // A picture is called something.
    if (!was || (field === 'name' && !change.name)) {
      waiting.delete(field);
      if (was) name = was.name;
      return writing;
    }
    const said = JSON.stringify(change);
    writing = writing.then(async () => {
      if (pictures.get(own)) await pictures.update(own, change);
      // Unless more was written meanwhile, which is kept in its turn.
      if (JSON.stringify(written(field)) === said && !timers.has(field)) waiting.delete(field);
    });
    return writing;
  }

  // What is waiting is kept when the pane goes away.
  $effect(() => () => {
    for (const field of [...waiting]) void keep(field);
  });

  function writeLocal() {
    inProject?.setNote(key, local);
  }

  /** What was written for this project is made a note for all projects. */
  function forAll() {
    const text = local.trim();
    if (!text || !picture) return;
    note = note.trim() ? `${note.trim()}\n${text}` : text;
    local = '';
    showAll = true;
    writeLocal();
    waiting.add('note');
    void keep('note');
    void tick().then(() =>
      root?.querySelector<HTMLTextAreaElement>('textarea[data-scope="all"]')?.focus(),
    );
  }

  function grow(node: HTMLTextAreaElement, _value: string) {
    const fit = () => {
      node.style.height = '0';
      node.style.height = `${Math.min(Math.max(node.scrollHeight + 2, 72), 320)}px`;
    };
    fit();
    return { update: fit };
  }

  const users = $derived(usersOf(own, inProject));
  const others = $derived(users.filter((p) => !inProject || p.id !== pictures.project));
  const maps = $derived(
    inProject
      ? inProject.maps.filter((m) => inProject.usedPictures(m.id).some((p) => p.hash === own))
      : [],
  );

  async function remove() {
    if (!picture) return;
    // What is waiting would be kept for nothing.
    if (await removePicture(picture, inProject)) {
      waiting.clear();
      onremoved?.();
    }
  }
</script>

<div class="picture-pane" bind:this={root} data-picture={own}>
  <div class="shown">
    <Thumb
      hash={own}
      extension={picture?.extension ?? named?.extension ?? ''}
      alt={picture?.alt ?? ''}
    />
  </div>

  {#if picture}
    <div class="field" data-field="name">
      <TextField
        label="Name"
        bind:value={name}
        placeholder="What the picture is called"
        oninput={() => waiting.add('name')}
        onblur={() => void keep('name')}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void keep('name');
          }
        }}
      />
    </div>

    <div class="field" data-field="caption">
      <span class="label" id="caption-{own}">Caption</span>
      <CaptionField
        value={caption}
        placeholder="What is said of the picture"
        onchange={(value) => {
          caption = value;
          wrote('caption');
        }}
        onkeep={() => void keep('caption')}
      />
      <p class="hint">
        Figures made with the picture begin with these words. What is said of a figure can be
        changed there without changing this.
      </p>
    </div>

    <label class="field" data-field="alt">
      <span class="label">Shows</span>
      <textarea
        class="plain"
        rows="2"
        bind:value={alt}
        placeholder="In words, for those who cannot see it"
        spellcheck="true"
        oninput={() => wrote('alt')}
        onblur={() => void keep('alt')}></textarea>
    </label>

    {#if picture.extension !== 'svg'}
      <div class="read">
        <Button size="sm" variant="ghost" onclick={() => (reading = true)} data-ocr-picture>
          {#snippet icon()}<ScanText size={13} />{/snippet}
          {t('ocr-picture-read')}
        </Button>
      </div>
    {/if}
  {:else}
    <div class="absent">
      <p class="called serif">{named?.name || 'A picture'}</p>
      <p class="hint">
        The picture is not on this computer. It is used in the project, and is shown when it has
        come from the one who put it there.
      </p>
    </div>
  {/if}

  <section class="notes">
    <h3 class="overline">Notes</h3>
    {#if inProject}
      <label class="field">
        <span class="label">In this project</span>
        <textarea
          class="note"
          bind:value={local}
          use:grow={local}
          placeholder="What you make of it, for this work"
          spellcheck="true"
          data-scope="project"
          oninput={writeLocal}></textarea>
      </label>
      {#if picture}
        <div class="under">
          <button type="button" class="link" disabled={!local.trim()} onclick={forAll}>
            Keep it for all projects
          </button>
          {#if !showAll && !note.trim()}
            <button type="button" class="link quiet" onclick={() => (showAll = true)}>
              Write for all projects
            </button>
          {/if}
        </div>
      {:else}
        <p class="hint">What is written here is with everyone who has the project.</p>
      {/if}
    {/if}

    {#if picture && (showAll || note.trim())}
      <label class="field" data-field="note">
        {#if inProject}<span class="label">In all projects</span>{/if}
        <textarea
          class="note"
          bind:value={note}
          use:grow={note}
          placeholder={inProject
            ? 'What you make of it, wherever you use it'
            : 'What you make of it. For yourself: it is part of no document.'}
          aria-label={inProject ? undefined : 'Your notes on this picture'}
          spellcheck="true"
          data-scope="all"
          oninput={() => wrote('note', 600)}
          onblur={() => void keep('note')}></textarea>
      </label>
      {#if inProject}
        <p class="hint">Kept with the picture in the store, on this computer.</p>
      {/if}
    {/if}
  </section>

  {#if picture}
    <section>
      <h3 class="overline">The file</h3>
      <dl class="facts">
        <dt>Kind</dt>
        <dd>{kindWords(picture.extension)}</dd>
        {#if picture.width && picture.height}
          <dt>Wide and high</dt>
          <dd>{picture.width.toLocaleString()} × {picture.height.toLocaleString()} points</dd>
        {/if}
        <dt>Size</dt>
        <dd>{fileSize(picture.size)}</dd>
        <dt>Taken in</dt>
        <dd>{dateWords(picture.added)}</dd>
      </dl>
    </section>
  {/if}

  <section class="used">
    <h3 class="overline">Used in</h3>
    {#if inProject && maps.length}
      <div class="user">
        <span class="project">This project</span>
        <span class="maps">
          {#each maps as map, i (map.id)}
            {#if i},
            {/if}
            <button type="button" class="link" onclick={() => onopenmap?.(map.id)}>
              {map.name || 'Untitled'}
            </button>
          {/each}
        </span>
      </div>
    {/if}
    {#each others as p (p.id)}
      <div class="user">
        <a class="project" href={formatRoute({ view: 'project', project: p.id })}>{p.name}</a>
      </div>
    {/each}
    {#if !others.length && !maps.length}
      <p class="none">No project uses the picture.</p>
    {/if}
  </section>

  {#if picture}
    <div class="last">
      <Button variant="danger" onclick={remove}>
        {#snippet icon()}<Trash2 size={14} />{/snippet}
        Remove from the store
      </Button>
    </div>
  {/if}
</div>

{#if reading && picture}
  <PictureTextDialog
    hash={own}
    name={picture.name}
    project={inProject}
    {onopenmap}
    onclose={() => (reading = false)}
  />
{/if}

<style>
  .read {
    display: flex;
    margin-top: calc(-1 * var(--space-2));
  }
  .picture-pane {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: 18px 20px 24px;
    min-width: 0;
  }
  .shown {
    height: 260px;
    flex: none;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    overflow: hidden;
  }
  .shown :global(.thumb) {
    border-radius: 0;
    padding: 10px;
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
  textarea {
    display: block;
    width: 100%;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink);
    resize: none;
    outline: none;
  }
  textarea.plain {
    padding: 6px 9px;
    line-height: 1.45;
  }
  textarea.note {
    min-height: 72px;
    padding: 9px 11px;
    border-radius: var(--radius-m);
    font-family: var(--font-text);
    font-size: 14.5px;
    line-height: 1.55;
  }
  textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--focus-ring);
  }
  textarea::placeholder {
    color: var(--ink-4);
  }
  .hint {
    color: var(--ink-3);
    font-size: var(--text-xs);
    line-height: 1.45;
  }
  .absent {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .called {
    font-size: var(--text-lg);
    font-weight: 600;
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
  }
  .under {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: -2px;
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
  .facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 3px 16px;
    margin: 0;
    font-size: var(--text-sm);
  }
  dt {
    color: var(--ink-3);
  }
  dd {
    margin: 0;
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }
  .user {
    display: flex;
    align-items: baseline;
    gap: 10px;
    min-width: 0;
    font-size: var(--text-md);
  }
  .project {
    flex: none;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-text);
    font-weight: 500;
  }
  a.project {
    color: var(--accent-strong);
  }
  .maps {
    min-width: 0;
    color: var(--ink-3);
  }
  .none {
    font-size: var(--text-sm);
    color: var(--ink-4);
  }
  .last {
    display: flex;
    padding-top: var(--space-3);
    border-top: 1px solid var(--line);
  }
</style>
