<script lang="ts">
  /**
   * The picture of the page in view, in the workbench of a reading: large
   * enough to judge the texts beside it against. At *Fit* the whole page is
   * in the pane; at 100 % the picture is shown at its own size, at 200 % at
   * twice that, and the pane scrolls both ways. Over it, where the page was
   * tried, the blocks of text Tesseract found, numbered in the order it read
   * them, which can be hidden; and the words it was unsure of, as faint
   * marks that leave the letters to be seen.
   *
   * The blocks and the words are in the dots of the picture as it is given,
   * `width` by `height`.
   */
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import type { TextBlock, TriedWord } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import Pane from './Pane.svelte';

  interface Props {
    /** The picture of the page, as a data URL; nothing where it is not drawn yet, or could not be. */
    picture: string | null;
    /** The size of the picture, in its dots. */
    width: number;
    height: number;
    /** The number the page has in print, or counted from one. */
    label: string;
    /** The blocks of text Tesseract found, where the page was tried. */
    blocks: TextBlock[];
    /** The words of the trial shown that Tesseract was unsure of, to be marked faintly. */
    unsure: TriedWord[];
    loading: boolean;
    failure: string | null;
  }

  let { picture, width, height, label, blocks, unsure, loading, failure }: Props = $props();

  type Zoom = 'fit' | '1' | '2';
  let zoom = $state<Zoom>('fit');
  /** Whether the blocks Tesseract found are drawn over the picture. */
  let showBlocks = $state(true);

  /** The room the picture has in the pane, inside its scroll bars. */
  let roomWidth = $state(0);
  let roomHeight = $state(0);
  /** The space kept around the picture, on each side, in pixels. */
  const MARGIN = 10;

  /** How many pixels on the screen a dot of the picture is shown as; 0 before the room is measured. */
  const scale = $derived.by(() => {
    if (zoom !== 'fit') return Number(zoom);
    if (!width || !height || roomWidth <= 2 * MARGIN || roomHeight <= 2 * MARGIN) return 0;
    return Math.min((roomWidth - 2 * MARGIN) / width, (roomHeight - 2 * MARGIN) / height);
  });
  // Whole pixels, and at Fit one less, so that the picture never brings scroll bars of its own.
  const shownWidth = $derived(Math.max(0, Math.floor(width * scale) - (zoom === 'fit' ? 1 : 0)));
  const shownHeight = $derived(Math.max(0, Math.floor(height * scale) - (zoom === 'fit' ? 1 : 0)));

  /**
   * The size of the numbers of the blocks, in the dots of the picture: 13
   * pixels on the screen whatever the zoom, from the width it is shown at.
   */
  const figure = $derived(shownWidth > 0 ? (13 * width) / shownWidth : 0);

  /** The room the picture is moved in, by dragging it, as a hand moves a sheet. */
  let room = $state<HTMLDivElement>();
  /** Whether the picture is being dragged. */
  let dragging = $state(false);
  /** Whether there is anything to move: the picture is larger than its room. */
  const movable = $derived(zoom !== 'fit' && !!picture);

  function grab(event: PointerEvent) {
    if (!movable || !room || event.button !== 0) return;
    const at = room;
    const from = { x: event.clientX, y: event.clientY, left: at.scrollLeft, top: at.scrollTop };
    at.setPointerCapture(event.pointerId);
    dragging = true;
    const onmove = (e: PointerEvent) => {
      at.scrollLeft = from.left - (e.clientX - from.x);
      at.scrollTop = from.top - (e.clientY - from.y);
    };
    const onup = () => {
      dragging = false;
      at.removeEventListener('pointermove', onmove);
      at.removeEventListener('pointerup', onup);
      at.removeEventListener('pointercancel', onup);
    };
    at.addEventListener('pointermove', onmove);
    at.addEventListener('pointerup', onup);
    at.addEventListener('pointercancel', onup);
    event.preventDefault();
  }
</script>

<Pane title={t('ocr-text-page', { label })} data-pane-picture>
  {#snippet actions()}
    <div data-picture-zoom={zoom}>
      <Segmented
        value={zoom}
        label={t('ocr-picture-size')}
        size="sm"
        options={[
          { value: 'fit', label: t('ocr-picture-fit') },
          { value: '1', label: t('ocr-picture-actual') },
          { value: '2', label: t('ocr-picture-double') },
        ]}
        onchange={(next: Zoom) => (zoom = next)}
      />
    </div>
  {/snippet}
  {#snippet bar()}
    {#if blocks.length && picture}
      <label class="check" use:tooltip={t('ocr-tried-blocks-hint')}>
        <input type="checkbox" bind:checked={showBlocks} data-ocr-tried-show-blocks />
        <span>{t('ocr-tried-blocks', { count: blocks.length })}</span>
      </label>
    {/if}
  {/snippet}
  {#if failure}
    <p class="failure selectable" role="alert" data-picture-failed>
      <CircleAlert size={15} /> <span>{failure}</span>
    </p>
  {:else}
    <!-- svelte-ignore a11y_no_static_element_interactions: the picture is moved by the pointer; the wheel and the keys scroll it as well -->
    <div
      class="room"
      class:movable
      class:dragging
      bind:this={room}
      bind:clientWidth={roomWidth}
      bind:clientHeight={roomHeight}
      onpointerdown={grab}
      data-picture-room
    >
      <div class="canvas" style:padding="{MARGIN}px">
        {#if picture && shownWidth > 0}
          <div class="sheet" style:width="{shownWidth}px" style:height="{shownHeight}px">
            <img
              src={picture}
              {width}
              {height}
              alt={t('ocr-picture-alt', { label })}
              draggable="false"
              data-ocr-tried-picture
            />
            {#if unsure.length}
              <!-- The words Tesseract was unsure of, faint under the letters. -->
              <svg
                class="unsure"
                viewBox="0 0 {width} {height}"
                preserveAspectRatio="none"
                aria-hidden="true"
                data-unsure-marks={unsure.length}
              >
                {#each unsure as word, i (i)}
                  <rect
                    x={word.left}
                    y={word.top}
                    width={word.width}
                    height={word.height}
                    rx={Math.min(word.height, word.width) * 0.12}
                  />
                {/each}
              </svg>
            {/if}
            {#if showBlocks && blocks.length}
              <!-- The blocks Tesseract found, numbered in the order it read them. -->
              <svg
                class="blocks"
                viewBox="0 0 {width} {height}"
                preserveAspectRatio="none"
                aria-hidden="true"
                data-ocr-tried-blocks={blocks.length}
              >
                {#each blocks as block, i (i)}
                  <rect
                    class="halo"
                    x={block.left}
                    y={block.top}
                    width={block.width}
                    height={block.height}
                    vector-effect="non-scaling-stroke"
                  />
                  <rect
                    x={block.left}
                    y={block.top}
                    width={block.width}
                    height={block.height}
                    vector-effect="non-scaling-stroke"
                  />
                  <text
                    x={block.left + figure * 0.35}
                    y={block.top + figure * 1.1}
                    font-size={figure}
                    stroke-width={figure * 0.4}>{i + 1}</text
                  >
                {/each}
              </svg>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  {/if}
  {#if loading}
    <div class="loading" aria-live="polite"><Spinner size={18} /></div>
  {/if}
</Pane>

<style>
  /* The picture scrolls in a room of its own that fills the pane's body. */
  .room {
    position: absolute;
    inset: 0;
    overflow: auto;
    overscroll-behavior: contain;
    background: var(--picture-ground);
    /* The picture is moved by dragging it, and by the wheel: no bars at its edges. */
    scrollbar-width: none;
  }
  .room::-webkit-scrollbar {
    display: none;
  }
  .room.movable {
    cursor: grab;
    touch-action: none;
  }
  .room.dragging {
    cursor: grabbing;
  }
  .canvas {
    box-sizing: border-box;
    width: max-content;
    min-width: 100%;
    min-height: 100%;
  }
  .sheet {
    position: relative;
    margin: 0 auto;
    /* Behind a page, white, as paper is, whatever the theme. */
    background: #fff;
    box-shadow: var(--shadow-1);
  }
  .sheet img {
    display: block;
    width: 100%;
    height: 100%;
    user-select: none;
    -webkit-user-select: none;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  /* Multiplied with the page, the marks tint the paper under a word, never its letters. */
  .unsure {
    mix-blend-mode: multiply;
  }
  .unsure rect {
    fill: color-mix(in srgb, var(--gold) 35%, transparent);
  }
  .blocks rect {
    fill: color-mix(in srgb, var(--accent) 8%, transparent);
    stroke: var(--accent);
    stroke-width: 1.5;
  }
  /* Under the line, a wider one of the paper's colour, so that the light accent of a dark theme stands out on the white page. */
  .blocks rect.halo {
    fill: none;
    stroke: var(--paper);
    stroke-width: 4;
    stroke-opacity: 0.8;
  }
  /* A number in the accent on a halo of the paper's colour: dark on light, or light on dark, whatever the page. */
  .blocks text {
    fill: var(--accent-strong);
    font-family: var(--font-ui, sans-serif);
    font-weight: 650;
    paint-order: stroke;
    stroke: var(--paper);
    stroke-linejoin: round;
  }
  .loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .check {
    display: flex;
    align-items: flex-start;
    gap: 7px;
    color: var(--ink-2);
    font-size: var(--text-sm);
    line-height: 1.35;
    cursor: pointer;
  }
  .check input {
    accent-color: var(--accent);
    margin: 1px 0 0;
    flex: none;
  }
  .failure {
    display: flex;
    gap: 8px;
    margin: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    font-size: var(--text-sm);
    line-height: 1.45;
  }
  .failure :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .failure span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
</style>
