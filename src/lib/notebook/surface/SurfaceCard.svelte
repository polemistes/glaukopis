<script lang="ts">
  /**
   * A note as a card on the surface of its box: its name where it has one,
   * and its pieces as the document pane's card draws them
   * (`NotePieces.svelte`), its pictures as wide as the card. It is as wide
   * as it was made, and as high as what it holds: up to some twenty-two
   * lines where it was given no height, else up to the height it was given;
   * under that it is cut with a fade. Its right edge makes it wider or
   * narrower, its lower edge shows more or less of the note, the corner
   * between them does both, and two presses on any of them give back the
   * usual; the handle at its foot draws a link. What a press means is the
   * surface's (`Surface.svelte`).
   */
  import { t } from '$lib/i18n';
  import type { Notebook } from '../model/notebook.svelte';
  import type { NoteRecord, Point } from '../model/types';
  import NotePieces from '../NotePieces.svelte';
  import type { CardEdge } from './geometry';

  interface Props {
    notebook: Notebook;
    note: NoteRecord;
    /** Where its top left corner is shown, and how wide: while it is moved or made wider, not yet as kept. */
    at: Point;
    width: number;
    /** The most it is high; none where it is as high as what it holds, up to the usual. */
    height: number | null;
    selected: boolean;
    /** A link being drawn would end here. */
    target: boolean;
    /** It is being moved. */
    moving: boolean;
    domId: string;
    /** Its height, measured as it is drawn. */
    onsize: (id: string, height: number) => void;
    onpress: (event: PointerEvent, id: string) => void;
    onopen: (id: string) => void;
    /** An edge or the corner pressed, to be dragged. */
    onresize: (event: PointerEvent, id: string, edge: CardEdge) => void;
    /** Two presses on an edge or the corner: the usual again. */
    onusual: (id: string, edge: CardEdge) => void;
    onlinkstart: (event: PointerEvent, id: string) => void;
  }

  let {
    notebook,
    note,
    at,
    width,
    height,
    selected,
    target,
    moving,
    domId,
    onsize,
    onpress,
    onopen,
    onresize,
    onusual,
    onlinkstart,
  }: Props = $props();

  let card = $state<HTMLDivElement>();
  let frame = $state<HTMLDivElement>();
  let inner = $state<HTMLDivElement>();
  /** Whether it holds more than it is shown to. */
  let cut = $state(false);

  const empty = $derived(!note.name && !note.pieces.length);

  // Its height told whenever it changes, pictures that arrive too; and
  // whether what it holds is cut.
  $effect(() => {
    if (!card || !frame || !inner) return;
    const [c, f, i] = [card, frame, inner];
    const id = note.id;
    const measure = () => {
      onsize(id, c.offsetHeight);
      cut = i.offsetHeight > f.clientHeight + 1;
    };
    const watch = new ResizeObserver(measure);
    watch.observe(c);
    watch.observe(i);
    measure();
    return () => watch.disconnect();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
<div
  bind:this={card}
  id={domId}
  class="card"
  class:selected
  class:target
  class:moving
  class:sized={height !== null}
  role="option"
  aria-selected={selected}
  aria-label={note.name || note.begins || t('notebook-surface-empty-note')}
  data-card={note.id}
  style:transform="translate({at.x}px, {at.y}px)"
  style:width="{width}px"
  style:max-height={height === null ? undefined : `${height}px`}
  onpointerdown={(e) => onpress(e, note.id)}
  ondblclick={(e) => {
    e.stopPropagation();
    onopen(note.id);
  }}
>
  {#if !note.seen}<span class="unseen" title={t('notebook-unseen')} data-unseen></span>{/if}
  {#if note.name}
    <div class="name">{note.name}</div>
  {/if}
  <div bind:this={frame} class="frame" class:cut>
    <div bind:this={inner}>
      {#if empty}
        <div class="empty">{t('notebook-surface-empty-note')}</div>
      {:else if note.pieces.length}
        <NotePieces {notebook} {note} wide />
      {/if}
    </div>
  </div>
  {#each [['right', 'edge'], ['bottom', 'edge-bottom'], ['corner', 'corner']] as const as [edge, name] (edge)}
    <span
      class={name}
      role="presentation"
      data-card-edge={edge === 'right' ? '' : undefined}
      data-card-edge-bottom={edge === 'bottom' ? '' : undefined}
      data-card-corner={edge === 'corner' ? '' : undefined}
      onpointerdown={(e) => {
        e.stopPropagation();
        onresize(e, note.id, edge);
      }}
      ondblclick={(e) => {
        e.stopPropagation();
        onusual(note.id, edge);
      }}
    ></span>
  {/each}
  <span
    class="link-handle"
    role="presentation"
    title={t('notebook-surface-link-handle')}
    data-link-handle
    onpointerdown={(e) => {
      e.stopPropagation();
      onlinkstart(e, note.id);
    }}
  ></span>
</div>

<style>
  .card {
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    flex-direction: column;
    padding-top: 4px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    box-shadow: var(--shadow-1);
    color: var(--ink);
    user-select: none;
    cursor: default;
  }
  .card:hover {
    border-color: var(--line-strong);
  }
  /* A note taken in and not yet looked at: a dot at the corner of its card. */
  .unseen {
    position: absolute;
    top: -5px;
    left: -5px;
    width: 11px;
    height: 11px;
    border: 2px solid var(--paper-raised);
    border-radius: 50%;
    background: var(--accent);
  }
  .card.selected {
    border-color: var(--accent);
    box-shadow:
      0 0 0 1px var(--accent),
      var(--shadow-1);
  }
  .card.target {
    border-color: var(--gold);
    box-shadow:
      0 0 0 2px var(--gold),
      var(--shadow-1);
  }
  .card.moving {
    z-index: 5;
    box-shadow: var(--shadow-2);
    cursor: grabbing;
  }
  .name {
    flex: none;
    padding: 4px 10px 2px;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .frame {
    position: relative;
    flex: 0 1 auto;
    min-height: 0;
    overflow: hidden;
    border-radius: 0 0 var(--radius-m) var(--radius-m);
  }
  /* Given no height: some twenty-two lines of the text of a note (14px, at 1.45). */
  .card:not(.sized) .frame {
    max-height: calc(22 * 1.45 * 14px);
  }
  .frame.cut::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 44px;
    background: linear-gradient(transparent, var(--paper-raised));
    pointer-events: none;
  }
  .empty {
    padding: 4px 10px 10px;
    font-style: italic;
    color: var(--ink-4);
  }
  /* The right edge, which makes the card wider or narrower. */
  .edge {
    position: absolute;
    top: 0;
    right: -5px;
    bottom: 8px;
    width: 10px;
    cursor: ew-resize;
  }
  /* The lower edge, which shows more or less of the note. */
  .edge-bottom {
    position: absolute;
    left: 0;
    right: 8px;
    bottom: -5px;
    height: 10px;
    cursor: ns-resize;
  }
  /* The corner between them, which does both. */
  .corner {
    position: absolute;
    right: -6px;
    bottom: -6px;
    width: 16px;
    height: 16px;
    cursor: nwse-resize;
  }
  .link-handle {
    position: absolute;
    bottom: -6px;
    left: 50%;
    width: 11px;
    height: 11px;
    margin-left: -5.5px;
    border-radius: 50%;
    border: 2px solid var(--paper-raised);
    background: var(--gold);
    cursor: crosshair;
    opacity: 0;
    transform: scale(0.6);
    transition:
      opacity var(--fast) var(--ease),
      transform var(--fast) var(--ease);
  }
  .card:hover .link-handle,
  .card.selected .link-handle {
    opacity: 1;
    transform: scale(1);
  }
  .link-handle:hover {
    transform: scale(1.35) !important;
  }
  .card.moving .link-handle {
    opacity: 0;
  }
</style>
