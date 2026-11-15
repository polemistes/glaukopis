<script lang="ts">
  /**
   * The note chosen on the page of the notebook (record 0101): the tools of
   * writing with undo and redo, its name in one line, its text in the editor
   * of the texts, and under the text the sources of what it holds, each
   * once, and what became of it. From stage 2: its tags under its name,
   * Divide in its bar, and beside the surface an × that closes it.
   */
  import { untrack } from 'svelte';
  import BookMarked from '@lucide/svelte/icons/book-marked';
  import FileIcon from '@lucide/svelte/icons/file';
  import Globe from '@lucide/svelte/icons/globe';
  import MessageSquareQuote from '@lucide/svelte/icons/message-square-quote';
  import Redo2 from '@lucide/svelte/icons/redo-2';
  import Scissors from '@lucide/svelte/icons/scissors';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import X from '@lucide/svelte/icons/x';
  import type { TextHolder } from '$lib/editor/holder';
  import RichText from '$lib/editor/RichText.svelte';
  import WritingTools from '$lib/editor/WritingTools.svelte';
  import { t } from '$lib/i18n';
  import { keysFor } from '$lib/shell/keys.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { divideAt, liftOut } from './dividing';
  import type { Notebook } from './model/notebook.svelte';
  import type { Source } from './model/types';
  import { chipsOf, wentLines, type SourceChip } from './page.svelte';
  import SourceDialog from './SourceDialog.svelte';
  import { sourceDetail, sourceLabel } from './sources';
  import TagsField from './TagsField.svelte';

  interface Props {
    notebook: Notebook;
    holder: TextHolder;
    id: string;
    /** Whether the note was just made: the cursor goes into its text. */
    fresh?: boolean;
    /** Where the note stands beside the surface: an × at its head closes it, as Escape does. */
    onclose?: () => void;
    /** The note was divided: the new note. */
    ondivided?: (id: string) => void;
  }

  let { notebook, holder, id, fresh = false, onclose, ondivided }: Props = $props();

  let scope = $state<HTMLElement>();
  let nameField = $state<HTMLInputElement>();
  let text = $state<ReturnType<typeof RichText>>();

  const note = $derived(notebook.note(id));
  const fragment = $derived(notebook.fragment(id));
  const chips = $derived(note ? chipsOf(notebook, note) : []);
  const went = $derived(note ? wentLines(note.went, projects.list) : []);

  // The name as it is typed: what is written in the notebook is trimmed, so
  // the field keeps its own words while they are written, and takes the
  // name anew where it is changed otherwise, as by undo or another window.
  let name = $state(untrack(() => notebook.note(id)?.name ?? ''));
  $effect(() => {
    const now = note?.name ?? '';
    untrack(() => {
      if (now !== name.trim()) name = now;
    });
  });

  /** Whether the text has the cursor: Divide is offered only then. */
  let textFocused = $state(false);

  /** The source whose window is open: a chip pressed. */
  let opened = $state<{ source: Source | null } | null>(null);

  const ICONS = {
    web: Globe,
    reference: BookMarked,
    file: FileIcon,
    words: MessageSquareQuote,
  } as const;

  function iconOf(chip: SourceChip) {
    return chip.source ? ICONS[chip.source.sort] : TriangleAlert;
  }

  const WENT_WORDS = {
    text: 'notebook-went-text',
    quotation: 'notebook-went-quotation',
    figure: 'notebook-went-figure',
    reference: 'notebook-went-reference',
    file: 'notebook-went-file',
  } as const;

  /** Gives the name field the focus. */
  export function focusName() {
    nameField?.focus();
    nameField?.select();
  }

  /** Gives the text the cursor, at its end. */
  export function focusText() {
    text?.focus('end');
  }

  /** Whether the note can be divided now: its text has the cursor. */
  export function canDivide(): boolean {
    return textFocused && !!text?.getView();
  }

  /**
   * Divides the note: what is selected in its text lifted out into a note
   * of its own, or with nothing selected, the note cut at the cursor. Gives
   * the new note; none where nothing could be done.
   */
  export function divide(): string | null {
    const view = text?.getView();
    if (!view || !note) return null;
    const made = view.state.selection.empty
      ? divideAt(notebook, id, view)
      : liftOut(notebook, id, view);
    if (made) ondivided?.(made);
    return made;
  }

  /** Escape closes the note beside the surface, where the cursor is not in its text. */
  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !onclose || event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('.prose, [contenteditable="true"]')) return;
    event.preventDefault();
    onclose();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="note" bind:this={scope} data-note-editor={id} {onkeydown}>
  <div class="bar">
    <WritingTools project={null} {scope}>
      {#snippet middle()}
        <IconButton
          label={t('common-undo')}
          shortcut={keysFor('notebook-undo')}
          size="sm"
          disabled={!notebook.canUndo}
          data-undo
          onclick={() => notebook.undo()}
        >
          <Undo2 size={15} />
        </IconButton>
        <IconButton
          label={t('notebook-redo')}
          shortcut={keysFor('notebook-redo')}
          size="sm"
          disabled={!notebook.canRedo}
          data-redo
          onclick={() => notebook.redo()}
        >
          <Redo2 size={15} />
        </IconButton>
        <!-- The text keeps the cursor: Divide acts where it is. -->
        <IconButton
          label={t('notebook-divide')}
          shortcut={keysFor('notebook-divide')}
          size="sm"
          disabled={!textFocused}
          data-divide
          onmousedown={(e) => e.preventDefault()}
          onclick={() => divide()}
        >
          <Scissors size={15} />
        </IconButton>
      {/snippet}
    </WritingTools>
    {#if onclose}
      <span class="end">
        <IconButton label={t('notebook-close-note')} size="sm" data-close-note onclick={onclose}>
          <X size={15} />
        </IconButton>
      </span>
    {/if}
  </div>

  <div class="scroller">
    <div class="column">
      <input
        bind:this={nameField}
        bind:value={name}
        class="name"
        placeholder={t('notebook-name')}
        aria-label={t('notebook-name')}
        spellcheck="false"
        data-note-name
        oninput={() => notebook.setName(id, name)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            text?.focus('start');
          }
        }}
      />

      {#if note}
        <TagsField
          tags={note.tags}
          all={notebook.tags}
          onadd={(tag) => {
            notebook.checkpoint();
            notebook.addTag([id], tag);
            notebook.checkpoint();
          }}
          onremove={(tag) => {
            notebook.checkpoint();
            notebook.removeTag([id], tag);
            notebook.checkpoint();
          }}
        />
      {/if}

      {#if fragment}
        <div
          class="text"
          data-note-text
          onfocusin={() => (textFocused = true)}
          onfocusout={() => (textFocused = false)}
        >
          <RichText
            bind:this={text}
            {holder}
            {fragment}
            kind="body"
            placeholder={t('notebook-write')}
            autofocus={fresh ? 'end' : null}
            onaction={(action) => {
              if (action !== 'up-out') return false;
              nameField?.focus();
              return true;
            }}
          />
        </div>
      {/if}

      {#if chips.length}
        <section class="sources" aria-label={t('notebook-sources')} data-note-sources>
          <h3 class="overline">{t('notebook-sources')}</h3>
          <div class="chips">
            {#each chips as chip (chip.id ?? '')}
              {@const Icon = iconOf(chip)}
              <button
                type="button"
                class="chip"
                class:wanting={!chip.source}
                title={sourceDetail(chip.source) || undefined}
                data-source={chip.id ?? 'none'}
                onclick={() => (opened = { source: chip.source })}
              >
                <Icon size={13} />
                <span class="truncate">{sourceLabel(chip.source)}</span>
              </button>
            {/each}
          </div>
        </section>
      {/if}

      {#if went.length}
        <section class="went" aria-label={t('notebook-went')} data-note-went>
          {#each went as line, i (i)}
            <p>
              {t('notebook-used-in')}
              {#if line.here && line.project}
                {@const project = line.project}
                <button
                  type="button"
                  class="link"
                  onclick={() => router.go({ view: 'project', project, at: line.element })}
                  >{line.name}</button
                >
              {:else}
                <span class="gone">{line.name}</span>
              {/if}
              <span class="what">· {t(WENT_WORDS[line.what])}</span>
            </p>
          {/each}
        </section>
      {/if}
    </div>
  </div>
</div>

{#if opened}
  <SourceDialog {notebook} note={id} source={opened.source} onclose={() => (opened = null)} />
{/if}

<style>
  .note {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: none;
    min-height: var(--bar-h);
    padding: 4px 12px;
    border-bottom: 1px solid var(--line);
  }
  .end {
    display: inline-flex;
    margin-left: auto;
    flex: none;
  }
  .scroller {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scroll-padding: 80px 0;
  }
  /* A readable measure, as the text of a project has, centred in the space. */
  .column {
    max-width: 780px;
    margin: 0 auto;
    padding: 36px 40px 30vh;
  }
  .name {
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    outline: none;
    font-family: var(--font-text);
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--ink);
  }
  .name::placeholder {
    color: var(--ink-4);
    font-weight: 400;
  }
  .text {
    margin-top: 16px;
    min-height: 6em;
  }
  .text :global(.prose) {
    min-height: 6em;
  }
  .sources {
    margin-top: 32px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 100%;
    height: 26px;
    padding: 0 10px 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: 13px;
    background: var(--paper-raised);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .chip:hover {
    border-color: var(--accent);
    color: var(--ink);
  }
  .chip.wanting {
    border-color: color-mix(in srgb, var(--warn) 55%, transparent);
    color: var(--warn);
  }
  .went {
    margin-top: 16px;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
  .went p {
    margin: 0 0 2px;
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
  .gone {
    color: var(--ink-2);
  }
  @media (max-width: 760px) {
    .column {
      padding-inline: 20px;
    }
  }
</style>
