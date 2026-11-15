<script lang="ts">
  /**
   * The notes of the notebook in a column, newest first (record 0101): each
   * a row of one height, its name or how it begins, the day it was made and
   * what it holds, and a small picture of the first picture it holds. Only
   * the rows in view are drawn, as in the library's list, so that thousands
   * stay quick. A press chooses, Shift and Ctrl select more; the arrows,
   * Home and End move; Delete deletes what is selected.
   */
  import ImageIcon from '@lucide/svelte/icons/image';
  import Paperclip from '@lucide/svelte/icons/paperclip';
  import Quote from '@lucide/svelte/icons/quote';
  import Thumb from '$lib/files/Thumb.svelte';
  import { t } from '$lib/i18n';
  import { keyOf } from '$lib/shell/keys.svelte';
  import type { NoteRecord } from './model/types';
  import { rowOf, type NoteSelection } from './page.svelte';

  interface Props {
    notes: NoteRecord[];
    selection: NoteSelection;
    /** Enter on the note chosen: to its text. */
    onopen?: (id: string) => void;
    ondelete?: (ids: string[]) => void;
    oncontext?: (event: MouseEvent, ids: string[]) => void;
  }

  let { notes, selection, onopen, ondelete, oncontext }: Props = $props();

  const ROW = 60;
  const OVERSCAN = 6;

  let viewport = $state<HTMLDivElement>();
  let scrollTop = $state(0);
  let height = $state(600);

  const order = $derived(notes.map((n) => n.id));
  const first = $derived(Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN));
  const last = $derived(Math.min(notes.length, Math.ceil((scrollTop + height) / ROW) + OVERSCAN));
  const visible = $derived(notes.slice(first, last));
  const selected = $derived(new Set(selection.ids));

  $effect(() => {
    if (!viewport) return;
    const observer = new ResizeObserver(() => (height = viewport!.clientHeight || 600));
    observer.observe(viewport);
    return () => observer.disconnect();
  });

  function reveal(index: number) {
    if (!viewport || index < 0) return;
    const top = index * ROW;
    if (top < viewport.scrollTop) viewport.scrollTop = top;
    else if (top + ROW > viewport.scrollTop + viewport.clientHeight)
      viewport.scrollTop = top + ROW - viewport.clientHeight;
  }

  /** Brings a note into view. */
  export function scrollTo(id: string) {
    reveal(order.indexOf(id));
  }

  /** Gives the list the focus, for its keys. */
  export function focus() {
    viewport?.focus({ preventScroll: true });
  }

  function onpointerdown(event: PointerEvent, id: string) {
    if (event.button !== 0) return;
    viewport?.focus({ preventScroll: true });
    selection.press(id, event, order);
  }

  function oncontextmenu(event: MouseEvent, id: string) {
    if (!oncontext) return;
    event.preventDefault();
    if (!selection.has(id)) selection.only(id);
    oncontext(
      event,
      order.filter((x) => selection.has(x)),
    );
  }

  function onkeydown(event: KeyboardEvent) {
    if (!notes.length) return;
    // Ctrl+A by its letter, which is found on a Greek or a Russian keyboard too.
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && keyOf(event) === 'a') {
      selection.set(order);
      event.preventDefault();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    switch (event.key) {
      case 'Enter':
        if (selection.single) onopen?.(selection.single);
        event.preventDefault();
        return;
      case 'Delete':
        if (selection.ids.length) ondelete?.(order.filter((x) => selection.has(x)));
        event.preventDefault();
        return;
      case 'Escape':
        if (selection.ids.length > 1 && selection.focused) {
          selection.only(selection.focused);
          event.preventDefault();
        }
        return;
    }
    const page = Math.max(1, Math.floor(height / ROW) - 1);
    const moved = selection.key(event.key, event.shiftKey, order, page);
    if (moved === null) return;
    event.preventDefault();
    reveal(order.indexOf(moved));
  }
</script>

<div
  bind:this={viewport}
  class="list"
  role="listbox"
  aria-label={t('notebook-notes')}
  aria-multiselectable="true"
  tabindex="0"
  data-notes
  onscroll={() => (scrollTop = viewport!.scrollTop)}
  {onkeydown}
>
  <div class="sizer" style:height="{notes.length * ROW}px">
    <div class="window" style:transform="translateY({first * ROW}px)">
      {#each visible as note (note.id)}
        {@const row = rowOf(note)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="row"
          class:selected={selected.has(note.id)}
          role="option"
          tabindex="-1"
          aria-selected={selected.has(note.id)}
          data-note={note.id}
          style:height="{ROW}px"
          onpointerdown={(e) => onpointerdown(e, note.id)}
          oncontextmenu={(e) => oncontextmenu(e, note.id)}
        >
          <div class="text">
            <span class="title truncate" class:empty={row.empty}
              >{row.empty ? t('notebook-empty-note') : row.title}</span
            >
            <span class="under">
              <span class="day">{row.day}</span>
              {#if row.pictures}
                <span class="mark" title={t('notebook-holds-picture')}><ImageIcon size={12} /></span
                >
              {/if}
              {#if row.files}
                <span class="mark" title={t('notebook-holds-file')}><Paperclip size={12} /></span>
              {/if}
              {#if row.passages}
                <span class="mark" title={t('notebook-holds-passage')}><Quote size={12} /></span>
              {/if}
            </span>
          </div>
          {#if row.picture}
            <div class="thumb">
              <Thumb hash={row.picture.hash} extension={row.picture.extension} small />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .list {
    height: 100%;
    overflow-y: auto;
    outline: none;
  }
  .sizer {
    position: relative;
  }
  .window {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px 0 14px;
    border-bottom: 1px solid var(--line);
    cursor: default;
  }
  .row:hover:not(.selected) {
    background: var(--paper-hover);
  }
  .row.selected {
    background: var(--accent-soft);
    border-bottom-color: transparent;
  }
  .list:focus-visible .row.selected {
    box-shadow: inset 2px 0 0 var(--accent);
  }
  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .title {
    font-weight: 550;
    color: var(--ink);
  }
  .title.empty {
    font-weight: 400;
    font-style: italic;
    color: var(--ink-4);
  }
  .under {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .day {
    font-variant-numeric: tabular-nums;
  }
  .mark {
    display: inline-flex;
    color: var(--ink-4);
  }
  .thumb {
    flex: none;
    width: 40px;
    height: 40px;
  }
</style>
