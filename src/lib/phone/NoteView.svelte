<script module lang="ts">
  import type { TextHolder } from '$lib/editor/holder';
  import { holderOfNotebook } from '$lib/notebook/holder';
  import type { Notebook } from '$lib/notebook/model/notebook.svelte';

  const holders = new WeakMap<Notebook, TextHolder>();

  /** The notebook as what holds the text of a note on the phone, with citing off: one for each notebook. */
  function holderFor(notebook: Notebook): TextHolder {
    let holder = holders.get(notebook);
    if (!holder) {
      holder = { ...holderOfNotebook(notebook), cites: false };
      holders.set(notebook, holder);
    }
    return holder;
  }
</script>

<script lang="ts">
  /**
   * A note, on the phone (stage 2 of `docs/plans/an-app-for-android.md`,
   * part D). At the top the row with Back, and More at its right end, which
   * opens a sheet with Redo and Delete. Under it, scrolled: the name in one
   * line, the tags, the box (a button that opens the sheet of the boxes),
   * the text, and under the text the sources of what the note holds, each
   * opening the sheet of its source. At the foot, and so over the
   * keyboard, the row of tools. A note shown is looked at; where it is
   * there no more, deleted here or on another device, the view goes back.
   */
  import { onMount, tick, untrack } from 'svelte';
  import BookMarked from '@lucide/svelte/icons/book-marked';
  import BoxIcon from '@lucide/svelte/icons/box';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import FileIcon from '@lucide/svelte/icons/file';
  import Globe from '@lucide/svelte/icons/globe';
  import MessageSquareQuote from '@lucide/svelte/icons/message-square-quote';
  import Redo2 from '@lucide/svelte/icons/redo-2';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import type { EditorState } from 'prosemirror-state';
  import { insertFigure } from '$lib/editor/commands';
  import RichText from '$lib/editor/RichText.svelte';
  import { t } from '$lib/i18n';
  import type { Source } from '$lib/notebook/model/types';
  import { boxName, chipsOf, type SourceChip } from '$lib/notebook/page.svelte';
  import { sourceLabel } from '$lib/notebook/sources';
  import TagsField from '$lib/notebook/TagsField.svelte';
  import { testHook, testing } from '$lib/shell/testing';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { toasts } from '$lib/ui/toast.svelte';
  import { fromBase64 } from '$lib/util/base64';
  import BoxSheet from './BoxSheet.svelte';
  import { places } from './places.svelte';
  import Sheet from './Sheet.svelte';
  import SourceSheet from './SourceSheet.svelte';
  import ToolRow from './ToolRow.svelte';
  import TopBar from './TopBar.svelte';
  import { toolCommand, type TextTool } from './tools';

  let {
    notebook,
    id,
    fresh = false,
  }: { notebook: Notebook; id: string; fresh?: boolean } = $props();

  const holder = $derived(holderFor(notebook));
  const note = $derived(notebook.note(id));
  const fragment = $derived(notebook.fragment(id));
  const chips = $derived(note ? chipsOf(notebook, note) : []);
  const box = $derived(
    note ? (notebook.boxes.find((b) => b.id === note.box) ?? notebook.boxes[0]) : null,
  );

  let text = $state<ReturnType<typeof RichText>>();
  /** The state of the text, for the row of tools. */
  let current = $state.raw<EditorState | null>(null);
  /** Whether the text has the cursor: the tools of the text are there to be pressed only then. */
  let focused = $state(false);

  let moreOpen = $state(false);
  let boxesOpen = $state(false);
  /** The source whose sheet is open: a chip pressed. */
  let opened = $state<{ source: Source | null } | null>(null);

  // The name as it is typed: what is written in the notebook is trimmed, so
  // the field keeps its own words while they are written, and takes the
  // name anew where it is changed otherwise, as by undo or another device.
  let name = $state(untrack(() => notebook.note(id)?.name ?? ''));
  $effect(() => {
    const now = note?.name ?? '';
    untrack(() => {
      if (now !== name.trim()) name = now;
    });
  });

  // A note shown is looked at.
  $effect(() => {
    if (note && !note.seen) untrack(() => notebook.lookedAt(id));
  });

  // Where the note is there no more, the view goes back: once, and with
  // nothing of its own lying over it, so that Back leaves the place.
  let present = false;
  $effect(() => {
    if (note) {
      present = true;
      return;
    }
    if (!present) return;
    present = false;
    untrack(() => void leave());
  });

  async function leave() {
    moreOpen = false;
    boxesOpen = false;
    opened = null;
    await tick();
    const at = places.current;
    if (at.at === 'note' && at.note === id) places.back();
  }

  const ICONS = {
    web: Globe,
    reference: BookMarked,
    file: FileIcon,
    words: MessageSquareQuote,
  } as const;

  function iconOf(chip: SourceChip) {
    return chip.source ? ICONS[chip.source.sort] : TriangleAlert;
  }

  /** A tool of the text pressed: done where the cursor is, which stays there. */
  function run(tool: TextTool) {
    const view = text?.getView();
    if (!view) return;
    toolCommand(tool)(view.state, view.dispatch, view);
    view.focus();
  }

  /** Deletes the note, as a step of undo of its own, and says so with Undo; the view goes back as the note goes. */
  async function remove() {
    moreOpen = false;
    await tick();
    notebook.checkpoint();
    notebook.deleteNotes([id]);
    notebook.checkpoint();
    toasts.show(
      {
        kind: 'info',
        message: t('notebook-deleted', { count: 1 }),
        action: { label: t('common-undo'), run: () => notebook.undo() },
      },
      7000,
    );
  }

  function redo() {
    notebook.redo();
    moreOpen = false;
  }

  /**
   * A picture put into the note, as a paste puts one: taken in through the
   * holder, and put where the cursor is, or at the end where the text has
   * no cursor. For the scripts now; stage 3 puts Photograph and Picture or
   * file on it.
   */
  async function picture(pictureName: string, content64: string): Promise<void> {
    const bytes = fromBase64(content64);
    const figure = await holder.pictureFromBlob(new Blob([bytes.slice()]), pictureName);
    const view = text?.getView();
    if (!figure || !view || view.isDestroyed) return;
    const at = view.hasFocus() ? undefined : view.state.doc.content.size;
    insertFigure(figure, at)(view.state, view.dispatch);
  }

  // The scripts put a picture into the note in view through the hooks of the phone's page.
  onMount(() => {
    if (!testing) return;
    const hooks = (window as unknown as { __glaukopisPhone?: Record<string, unknown> })
      .__glaukopisPhone;
    if (hooks) Object.assign(hooks, { picture });
    else testHook('__glaukopisPhone', { picture });
    return () => {
      const now = (window as unknown as { __glaukopisPhone?: Record<string, unknown> })
        .__glaukopisPhone;
      if (now?.picture === picture) delete now.picture;
    };
  });
</script>

<section class="note" data-phone-note={id}>
  <TopBar back>
    <IconButton
      label={t('phone-more')}
      aria-haspopup="dialog"
      data-phone-more
      onclick={() => (moreOpen = true)}
    >
      <Ellipsis size={20} />
    </IconButton>
  </TopBar>

  <div class="scroller">
    <div class="column">
      <input
        bind:value={name}
        class="name"
        placeholder={t('notebook-name')}
        aria-label={t('notebook-name')}
        enterkeyhint="next"
        autocomplete="off"
        data-phone-name
        oninput={() => notebook.setName(id, name)}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
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

      {#if box}
        <button type="button" class="box" data-phone-box onclick={() => (boxesOpen = true)}>
          <BoxIcon size={18} />
          <span class="box-name">{boxName(box)}</span>
        </button>
      {/if}

      {#if fragment}
        <div
          class="text"
          data-phone-text
          onfocusin={() => (focused = true)}
          onfocusout={() => (focused = false)}
        >
          <RichText
            bind:this={text}
            {holder}
            {fragment}
            kind="body"
            placeholder={t('notebook-write')}
            autofocus={fresh ? 'end' : null}
            onstate={(view) => (current = view.state)}
            onfocus={(view) => (current = view.state)}
          />
        </div>
      {/if}

      {#if chips.length}
        <section class="sources" aria-label={t('notebook-sources')} data-phone-sources>
          <h3 class="overline">{t('notebook-sources')}</h3>
          <div class="chips">
            {#each chips as chip (chip.id ?? '')}
              {@const Icon = iconOf(chip)}
              <button
                type="button"
                class="chip"
                class:wanting={!chip.source}
                data-phone-source={chip.id ?? 'none'}
                onclick={() => (opened = { source: chip.source })}
              >
                <Icon size={16} />
                <span class="chip-words">{sourceLabel(chip.source)}</span>
              </button>
            {/each}
          </div>
        </section>
      {/if}
    </div>
  </div>

  <ToolRow
    state={current}
    {focused}
    canUndo={notebook.canUndo}
    onrun={run}
    onundo={() => notebook.undo()}
  />

  <!-- The sheets lie over the place, from the bottom of the screen. -->
  <Sheet open={moreOpen} title={t('phone-more')} onclose={() => (moreOpen = false)}>
    <div class="more">
      <button
        type="button"
        class="action"
        disabled={!notebook.canRedo}
        data-phone-redo
        onclick={redo}
      >
        <Redo2 size={20} />
        <span>{t('notebook-redo')}</span>
      </button>
      <button type="button" class="action danger" data-phone-delete onclick={() => void remove()}>
        <Trash2 size={20} />
        <span>{t('common-delete')}</span>
      </button>
    </div>
  </Sheet>

  <BoxSheet {notebook} note={id} open={boxesOpen} onclose={() => (boxesOpen = false)} />

  {#if opened}
    <SourceSheet {notebook} note={id} source={opened.source} onclose={() => (opened = null)} />
  {/if}
</section>

<style>
  .note {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: 0;
    background: var(--paper);
    color: var(--ink);
  }
  /* What is left under the row is scrolled, and the text fills what the
     rest leaves of it: the whole of it takes the finger, not the lines
     written alone. */
  .scroller {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }
  .column {
    display: flex;
    flex-direction: column;
    flex: 1 0 auto;
    min-width: 0;
    padding: 8px 16px 16px;
  }
  .name {
    width: 100%;
    min-width: 0;
    min-height: 44px;
    padding: 0;
    border: none;
    background: transparent;
    outline: none;
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 1.4em;
    font-weight: 600;
  }
  .name::placeholder {
    color: var(--ink-4);
    font-weight: 400;
  }
  .box {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 8px;
    max-width: 100%;
    min-height: 44px;
    margin-top: 4px;
    padding: 0 12px 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .box:active {
    background: var(--paper-hover);
  }
  .box-name {
    min-width: 0;
    overflow-wrap: anywhere;
    text-align: left;
  }
  .text {
    display: flex;
    flex-direction: column;
    flex: 1 0 auto;
    min-height: 8em;
    margin-top: 12px;
  }
  .text :global(.rich-text) {
    display: flex;
    flex-direction: column;
    flex: 1 0 auto;
  }
  .text :global(.ProseMirror) {
    flex: 1 0 auto;
    outline: none;
    font-family: var(--font-editor, var(--font-text));
    font-size: var(--text-size);
  }
  .sources {
    margin-top: 24px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
    min-height: 44px;
    padding: 4px 14px 4px 12px;
    border: 1px solid var(--line-strong);
    border-radius: 22px;
    background: var(--paper-raised);
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    text-align: left;
    cursor: pointer;
  }
  .chip:active {
    border-color: var(--accent);
  }
  .chip.wanting {
    border-color: color-mix(in srgb, var(--warn) 55%, transparent);
    color: var(--warn);
  }
  .chip-words {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .more {
    display: flex;
    flex-direction: column;
    padding-bottom: 8px;
  }
  .action {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 48px;
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .action:active:not(:disabled) {
    background: var(--paper-hover);
  }
  .action:disabled {
    color: var(--ink-4);
    cursor: default;
  }
  .action.danger {
    color: var(--danger, var(--ink));
  }
</style>
