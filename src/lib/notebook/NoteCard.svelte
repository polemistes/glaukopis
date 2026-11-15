<script lang="ts">
  /**
   * A note in the list of the document pane (record 0101): its head, with
   * its name or how it begins and its day, and its pieces, each drawn as the
   * text draws it. The head drags the whole note; a piece drags itself. A
   * long note is shown to a height, and whole when asked.
   */
  import Check from '@lucide/svelte/icons/check';
  import { editorUi } from '$lib/editor/ui.svelte';
  import { showFormula } from '$lib/figures/math.svelte';
  import { pictures, showPicture } from '$lib/figures/pictures.svelte';
  import Thumb from '$lib/files/Thumb.svelte';
  import { languages, newTextLanguage, t } from '$lib/i18n';
  import { blocksHtml } from '$lib/project/model/html';
  import { inlineText } from '$lib/project/model/text';
  import { startDrag } from '$lib/ui/drag.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import HeldFile from './HeldFile.svelte';
  import type { Notebook } from './model/notebook.svelte';
  import { beginsOf } from './model/pieces';
  import type { NoteRecord, Piece } from './model/types';
  import { NOTE_PIECES } from './out';
  import { sourceLabel } from './sources';

  interface Props {
    notebook: Notebook;
    note: NoteRecord;
    /** Whether something of it has gone into the project. */
    used: boolean;
    /** Goes to the note in the notebook. */
    onopen: (note: string) => void;
    /** The menu of the note. */
    onmenu: (event: MouseEvent, note: string) => void;
  }

  let { notebook, note, used, onopen, onmenu }: Props = $props();

  /** The height a note is shown to, in the size of its words: some twelve lines of its text. */
  const LINES = 18.5;

  let whole = $state(false);
  let tall = $state(false);
  let inner = $state<HTMLDivElement>();
  let frame = $state<HTMLDivElement>();

  /** How a piece begins, in a line: its words, or the name of its picture or file. */
  function pieceLabel(piece: Piece): string {
    if (piece.kind === 'file') return piece.name;
    return beginsOf([piece]) || (piece.kind === 'figure' ? piece.name : '');
  }

  const title = $derived(
    note.name ||
      note.begins ||
      note.pieces.map(pieceLabel).find(Boolean) ||
      t('notebook-pane-a-picture'),
  );

  const day = $derived.by(() => {
    const d = new Date(note.made);
    return Number.isNaN(d.getTime())
      ? ''
      : new Intl.DateTimeFormat(languages.current, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(d);
  });

  /** The text of a piece of words, as the text draws it. */
  function htmlOf(piece: Piece): string {
    return piece.kind === 'file' ? '' : blocksHtml(piece.blocks, newTextLanguage());
  }

  /** What is said of a picture. */
  function saidOf(piece: Piece): string {
    if (piece.kind !== 'figure') return '';
    const figure = piece.blocks[0];
    return figure?.kind === 'figure' ? inlineText(figure.caption).trim() || figure.alt : '';
  }

  /** The source of a passage, in a line. */
  function sourceOf(piece: Piece): string {
    if (piece.kind !== 'passage') return '';
    const id = notebook.passages.get(piece.passage)?.source;
    return sourceLabel(id ? (notebook.sources.get(id) ?? null) : null);
  }

  /** Formulas and pictures in what was drawn as HTML are given what they are shown as. */
  function shown(node: HTMLElement, html: string) {
    const fill = () => {
      for (const el of node.querySelectorAll<HTMLElement>('[data-math]'))
        showFormula(el, el.dataset.math ?? '', el.hasAttribute('data-display'));
      for (const img of node.querySelectorAll<HTMLImageElement>('img[data-picture]')) {
        const [hash, extension] = (img.dataset.picture ?? '').split('.');
        showPicture(img.parentElement, img, pictures.of(hash, extension ?? ''));
      }
    };
    fill();
    return {
      update(next: string) {
        if (next !== html) {
          html = next;
          fill();
        }
      },
    };
  }

  // Whether the note is longer than the height it is shown to: measured
  // whenever what it holds changes its height, pictures that arrive too.
  $effect(() => {
    if (!inner || !frame) return;
    const [i, f] = [inner, frame];
    const measure = () => {
      tall = i.offsetHeight > LINES * parseFloat(getComputedStyle(f).fontSize) + 2;
    };
    const watch = new ResizeObserver(measure);
    watch.observe(i);
    measure();
    return () => watch.disconnect();
  });

  function dragNote(event: PointerEvent) {
    startDrag(event, () => ({
      kind: NOTE_PIECES,
      data: { note: note.id, pieces: null },
      label: title,
    }));
  }

  function dragPiece(event: PointerEvent, index: number) {
    // The piece, not the whole note.
    event.stopPropagation();
    const piece = note.pieces[index];
    if (!piece) return;
    startDrag(event, () => ({
      kind: NOTE_PIECES,
      data: { note: note.id, pieces: [index] },
      label: pieceLabel(piece) || title,
    }));
  }

  /** The text being written keeps the cursor. */
  function keepCursor(event: MouseEvent) {
    if (editorUi.selection) event.preventDefault();
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<article
  class="card"
  data-note={note.id}
  aria-label={title}
  onmousedown={keepCursor}
  ondblclick={() => onopen(note.id)}
  oncontextmenu={(e) => onmenu(e, note.id)}
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="head" onpointerdown={dragNote}>
    <span class="name truncate" class:unnamed={!note.name}>{title}</span>
    {#if used}
      <span
        class="used"
        role="img"
        aria-label={t('notebook-pane-used')}
        use:tooltip={t('notebook-pane-used')}
      >
        <Check size={13} strokeWidth={2.2} />
      </span>
    {/if}
    <span class="day">{day}</span>
  </div>

  <div bind:this={frame} class="frame" class:whole>
    <div bind:this={inner} class="pieces">
      {#each note.pieces as piece, index (`${piece.kind}-${piece.from}`)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="piece {piece.kind}"
          data-piece={index}
          onpointerdown={(e) => dragPiece(e, index)}
        >
          {#if piece.kind === 'figure'}
            {@const said = saidOf(piece)}
            <div class="picture">
              <Thumb hash={piece.hash} extension={piece.extension} small alt={said} />
            </div>
            {#if said}<div class="said">{said}</div>{/if}
          {:else if piece.kind === 'file'}
            <!-- Two presses on the file open it, and not the notebook. -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span ondblclick={(e) => e.stopPropagation()}>
              <HeldFile hash={piece.hash} name={piece.name} />
            </span>
          {:else}
            {@const html = htmlOf(piece)}
            <div class="prose static" use:shown={html}>{@html html}</div>
            {#if piece.kind === 'passage'}
              {@const source = sourceOf(piece)}
              <div class="source truncate" title={source}>{source}</div>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  </div>

  {#if tall}
    <button type="button" class="more" onclick={() => (whole = !whole)}>
      {whole ? t('notebook-pane-show-less') : t('notebook-pane-show-all')}
    </button>
  {/if}
</article>

<style>
  .card {
    margin: 0 10px 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m, 8px);
    background: var(--paper);
    overflow: hidden;
  }
  .card:has(.head:hover) {
    background: var(--paper-hover);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px 5px;
    cursor: grab;
    user-select: none;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: 550;
    color: var(--ink);
  }
  .name.unnamed {
    font-weight: 450;
    color: var(--ink-2);
  }
  .used {
    display: inline-flex;
    flex: none;
    color: var(--accent);
  }
  .day {
    flex: none;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .frame {
    /* LINES in the script. */
    max-height: 18.5em;
    overflow: hidden;
  }
  .frame.whole {
    max-height: none;
  }
  .pieces {
    padding: 0 4px 6px;
  }
  .piece {
    padding: 3px 6px;
    border-radius: var(--radius-s);
    cursor: grab;
  }
  .piece:hover {
    background: var(--paper-hover);
  }
  .piece .prose {
    font-size: 14px;
    line-height: 1.45;
  }
  .piece .prose :global(p) {
    margin: 0 0 0.4em;
  }
  .piece .prose :global(> :last-child) {
    margin-bottom: 0;
  }
  .passage .prose {
    padding-left: 9px;
    border-left: 2px solid var(--line-strong);
  }
  .source {
    padding-left: 11px;
    margin-top: 2px;
    font-size: var(--text-xs);
    color: var(--ink-4);
  }
  .picture {
    height: 96px;
    max-width: 100%;
  }
  .said {
    margin-top: 3px;
    font-family: var(--font-text);
    font-size: 13px;
    color: var(--ink-2);
  }
  .more {
    display: block;
    width: 100%;
    padding: 4px 10px 6px;
    border: none;
    border-top: 1px solid var(--line);
    background: transparent;
    color: var(--accent);
    font: inherit;
    font-size: var(--text-sm);
    text-align: left;
    cursor: pointer;
  }
  .more:hover {
    background: var(--paper-hover);
  }
</style>
