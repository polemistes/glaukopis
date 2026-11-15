<script lang="ts">
  /**
   * The strip at the left edge of a surface: the notes of the box that are
   * not yet put anywhere, the newest on top, each a small card with its name
   * or how it begins and its first picture. A note is dragged from here
   * onto the ground with the application's own dragging
   * (`ui/drag.svelte.ts`); a card let go over the strip is taken off the
   * ground, which the surface sees for itself.
   */
  import Thumb from '$lib/files/Thumb.svelte';
  import { t } from '$lib/i18n';
  import { startDrag } from '$lib/ui/drag.svelte';
  import type { Notebook } from '../model/notebook.svelte';
  import type { NoteRecord } from '../model/types';
  import { NOTE_UNPLACED, type UnplacedPayload } from './strip';

  interface Props {
    notebook: Notebook;
    notes: NoteRecord[];
    selection: string[];
    /** A card of the ground is being moved over the strip, and would be taken off. */
    taking: boolean;
    domPrefix: string;
    /** The strip itself, for the surface to know where it is. */
    element?: HTMLElement;
    onpress: (event: PointerEvent, id: string) => void;
    onopen: (id: string) => void;
  }

  let {
    notebook,
    notes,
    selection,
    taking,
    domPrefix,
    element = $bindable(),
    onpress,
    onopen,
  }: Props = $props();

  const selected = $derived(new Set(selection));

  function titleOf(note: NoteRecord): string {
    return (
      note.name ||
      note.begins ||
      (note.picture ? t('notebook-pane-a-picture') : t('notebook-surface-empty-note'))
    );
  }

  function press(event: PointerEvent, note: NoteRecord) {
    if (event.button !== 0) return;
    event.stopPropagation();
    onpress(event, note.id);
    startDrag(event, () => ({
      kind: NOTE_UNPLACED,
      data: { notebook, note: note.id } satisfies UnplacedPayload,
      label: titleOf(note),
    }));
  }
</script>

<div bind:this={element} class="strip" class:taking data-strip>
  <div class="heading">{t('notebook-surface-not-placed')}</div>
  <div class="column">
    {#each notes as note (note.id)}
      {@const title = titleOf(note)}
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
      <div
        id={domPrefix + note.id}
        class="item"
        class:selected={selected.has(note.id)}
        role="option"
        aria-selected={selected.has(note.id)}
        aria-label={title}
        data-unplaced={note.id}
        onpointerdown={(e) => press(e, note)}
        ondblclick={(e) => {
          e.stopPropagation();
          onopen(note.id);
        }}
      >
        {#if note.picture}
          <div class="picture">
            <Thumb hash={note.picture.hash} extension={note.picture.extension} small />
          </div>
        {/if}
        <span class="title" class:faint={!note.name && !note.begins}>{title}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .strip {
    position: absolute;
    left: 10px;
    top: 10px;
    bottom: 10px;
    z-index: 8;
    display: flex;
    flex-direction: column;
    width: 196px;
    max-width: calc(100% - 20px);
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: color-mix(in srgb, var(--paper-raised) 92%, transparent);
    box-shadow: var(--shadow-1);
    cursor: default;
  }
  .strip.taking {
    border-color: var(--accent);
    box-shadow:
      0 0 0 1px var(--accent),
      var(--shadow-1);
  }
  .heading {
    flex: none;
    padding: 8px 10px 4px;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .column {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 2px 6px 6px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 4px;
    padding: 5px 7px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    font-size: var(--text-sm);
    cursor: grab;
    user-select: none;
  }
  .item:hover {
    background: var(--paper-hover);
  }
  .item.selected {
    border-color: var(--accent);
    background: var(--accent-softer);
  }
  .picture {
    flex: none;
    width: 34px;
    height: 34px;
  }
  .title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    min-width: 0;
    overflow: hidden;
    overflow-wrap: anywhere;
    color: var(--ink);
  }
  .title.faint {
    font-style: italic;
    color: var(--ink-4);
  }
</style>
