<script lang="ts">
  /**
   * The pieces of a note, each drawn as the text draws it: words of its own,
   * a passage taken with its source under it, a picture with what is said
   * of it, a file. One drawing for the card of the document pane
   * (`NoteCard.svelte`) and the card of the surface (`surface/`). Where a
   * piece can be dragged, the card says so (`onpiecedown`).
   */
  import { showFormula } from '$lib/figures/math.svelte';
  import { pictures, showPicture } from '$lib/figures/pictures.svelte';
  import Thumb from '$lib/files/Thumb.svelte';
  import { newTextLanguage } from '$lib/i18n';
  import { blocksHtml } from '$lib/project/model/html';
  import { inlineText } from '$lib/project/model/text';
  import HeldFile from './HeldFile.svelte';
  import type { Notebook } from './model/notebook.svelte';
  import type { NoteRecord, Piece } from './model/types';
  import { sourceLabel } from './sources';

  interface Props {
    notebook: Notebook;
    note: NoteRecord;
    /** A press on a piece, where a piece can be dragged by itself. */
    onpiecedown?: (event: PointerEvent, index: number) => void;
  }

  let { notebook, note, onpiecedown }: Props = $props();

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
</script>

<div class="pieces">
  {#each note.pieces as piece, index (`${piece.kind}-${piece.from}`)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="piece {piece.kind}"
      class:draggable={!!onpiecedown}
      data-piece={index}
      onpointerdown={onpiecedown ? (e) => onpiecedown(e, index) : undefined}
    >
      {#if piece.kind === 'figure'}
        {@const said = saidOf(piece)}
        <div class="picture">
          <Thumb hash={piece.hash} extension={piece.extension} small alt={said} />
        </div>
        {#if said}<div class="said">{said}</div>{/if}
      {:else if piece.kind === 'file'}
        <!-- Two presses on the file open it, and not the note. -->
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

<style>
  .pieces {
    padding: 0 4px 6px;
  }
  .piece {
    padding: 3px 6px;
    border-radius: var(--radius-s);
  }
  .piece.draggable {
    cursor: grab;
  }
  .piece.draggable:hover {
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
</style>
