<script lang="ts">
  /**
   * The crop of an image being edited (ADR 0071), drawn over the frame that
   * shows: a rectangle with eight handles, moved by its inside, the outside
   * shaded. Given and changed in fractions of the frame, so that it means
   * the same on the lighter copy and on the full image. Without handles, it
   * only shades what the crop leaves out.
   */
  import type { Crop } from '$lib/api/files';
  import { t } from '$lib/i18n';
  import { clampedCrop } from './editing';

  interface Props {
    crop: Crop;
    /** Whether it can be changed: the handles shown. */
    active: boolean;
    onchange: (crop: Crop) => void;
  }

  let { crop, active, onchange }: Props = $props();

  type Grip = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
  const GRIPS: Grip[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

  let frame = $state<HTMLDivElement>();

  /** A drag of the crop, by its inside or one of its handles, from where it began. */
  function begin(event: PointerEvent, grip: Grip) {
    if (!active || event.button !== 0 || !frame) return;
    event.preventDefault();
    event.stopPropagation();
    const box = frame.getBoundingClientRect();
    const from = { ...crop };
    const x0 = event.clientX;
    const y0 = event.clientY;
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    const move = (e: PointerEvent) => {
      const dx = (e.clientX - x0) / Math.max(1, box.width);
      const dy = (e.clientY - y0) / Math.max(1, box.height);
      onchange(dragged(from, grip, dx, dy));
    };
    const end = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', end);
      target.removeEventListener('pointercancel', end);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', end);
  }

  /** The crop a drag makes of the one it began with. */
  function dragged(from: Crop, grip: Grip, dx: number, dy: number): Crop {
    if (grip === 'move') {
      return clampedCrop({ ...from, x: from.x + dx, y: from.y + dy });
    }
    let left = from.x;
    let top = from.y;
    let right = from.x + from.width;
    let bottom = from.y + from.height;
    if (grip.includes('w')) left = Math.min(right - 0.01, Math.max(0, left + dx));
    if (grip.includes('e')) right = Math.max(left + 0.01, Math.min(1, right + dx));
    if (grip.includes('n')) top = Math.min(bottom - 0.01, Math.max(0, top + dy));
    if (grip.includes('s')) bottom = Math.max(top + 0.01, Math.min(1, bottom + dy));
    return clampedCrop({ x: left, y: top, width: right - left, height: bottom - top });
  }

  const pct = (v: number) => `${v * 100}%`;
</script>

<div
  class="frame"
  class:active
  bind:this={frame}
  data-crop-frame
  data-x={crop.x.toFixed(3)}
  data-y={crop.y.toFixed(3)}
  data-width={crop.width.toFixed(3)}
  data-height={crop.height.toFixed(3)}
>
  <!-- What the crop leaves out, shaded, in four pieces. -->
  <div class="shade" style:left="0" style:top="0" style:right="0" style:height={pct(crop.y)}></div>
  <div
    class="shade"
    style:left="0"
    style:right="0"
    style:top={pct(crop.y + crop.height)}
    style:bottom="0"
  ></div>
  <div
    class="shade"
    style:left="0"
    style:top={pct(crop.y)}
    style:width={pct(crop.x)}
    style:height={pct(crop.height)}
  ></div>
  <div
    class="shade"
    style:left={pct(crop.x + crop.width)}
    style:right="0"
    style:top={pct(crop.y)}
    style:height={pct(crop.height)}
  ></div>
  {#if active}
    <div
      class="crop"
      role="presentation"
      aria-label={t('viewer-edit-crop')}
      style:left={pct(crop.x)}
      style:top={pct(crop.y)}
      style:width={pct(crop.width)}
      style:height={pct(crop.height)}
      onpointerdown={(e) => begin(e, 'move')}
    >
      {#each GRIPS as grip (grip)}
        <span
          class="grip {grip}"
          role="presentation"
          data-grip={grip}
          onpointerdown={(e) => begin(e, grip)}
        ></span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .frame {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .shade {
    position: absolute;
    background: rgb(0 0 0 / 0.45);
  }
  .crop {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid #fff;
    outline: 1px solid rgb(0 0 0 / 0.6);
    cursor: move;
    pointer-events: auto;
    touch-action: none;
  }
  /* A handle is drawn 10 pixels wide and hit at 16. */
  .grip {
    position: absolute;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    pointer-events: auto;
  }
  .grip::after {
    content: '';
    position: absolute;
    inset: 3px;
    background: #fff;
    border: 1px solid rgb(0 0 0 / 0.7);
  }
  .nw {
    left: 0;
    top: 0;
    cursor: nwse-resize;
  }
  .n {
    left: 50%;
    top: 0;
    cursor: ns-resize;
  }
  .ne {
    left: 100%;
    top: 0;
    cursor: nesw-resize;
  }
  .e {
    left: 100%;
    top: 50%;
    cursor: ew-resize;
  }
  .se {
    left: 100%;
    top: 100%;
    cursor: nwse-resize;
  }
  .s {
    left: 50%;
    top: 100%;
    cursor: ns-resize;
  }
  .sw {
    left: 0;
    top: 100%;
    cursor: nesw-resize;
  }
  .w {
    left: 0;
    top: 50%;
    cursor: ew-resize;
  }
</style>
