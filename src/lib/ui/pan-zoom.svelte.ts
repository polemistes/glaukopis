/**
 * A view that pans and zooms: a viewport, and a world drawn in it, moved
 * with the wheel and by dragging the ground, zoomed with Ctrl and the
 * wheel or by the buttons of zoom (`ZoomControls.svelte`). It keeps what
 * was in the middle in the middle when the viewport changes its size, is
 * first placed where it was left (a kept `Camera`), and tells the camera to
 * be kept a moment after it comes to rest. What a press on the ground
 * means (dragging the ground, drawing a band, clearing a selection) is the
 * view's own to say: it starts `pan` from its own `pointerdown`. The
 * diagram of a project is one such view, the surface of the notebook
 * another. The geometry is in `camera.ts`.
 */

import { untrack } from 'svelte';
import type { RectLike } from './floating';
import {
  bringing,
  centred,
  fitting,
  kept,
  wheeled,
  zoomedAt,
  type Bounds,
  type Box,
  type Camera,
  type View,
} from './camera';

export interface PanZoomOptions {
  /** The viewport: the element the world is drawn in, which takes the wheel. */
  viewport: () => HTMLElement | undefined;
  /** Where the view was left, to be placed there the first time its size is known; none: the origin in the middle. */
  camera?: () => Camera | null | undefined;
  /** Told the camera to be kept, a moment after the view comes to rest. */
  oncamera?: (camera: Camera) => void;
  /**
   * Asked first at each turn of the wheel: false lets the event be, for
   * what under the pointer takes the wheel itself.
   */
  wheel?: (event: WheelEvent) => boolean;
}

/** How long the view rests before its camera is told to be kept, in milliseconds. */
const RESTS = 400;

/**
 * Follows a press of the pointer until it is let go: `move` at each move
 * once the pointer has gone a few pixels from where it was pressed, with
 * how far; `end` when it is let go, with whether it moved so far.
 */
export function followPointer(
  event: PointerEvent,
  move: (e: PointerEvent, dx: number, dy: number) => void,
  end?: (moved: boolean) => void,
): void {
  const startX = event.clientX;
  const startY = event.clientY;
  let moved = false;
  const onmove = (e: PointerEvent) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.hypot(dx, dy) < 4) return;
    moved = true;
    move(e, dx, dy);
  };
  const up = () => {
    window.removeEventListener('pointermove', onmove);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    end?.(moved);
  };
  window.addEventListener('pointermove', onmove);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

export class PanZoom {
  /** Where the origin of the world is in the viewport, and the scale. */
  view = $state<View>({ x: 0, y: 0, k: 1 });
  /** The size of the viewport, once it is known. */
  width = $state(0);
  height = $state(0);
  /** Whether the ground is being dragged. */
  panning = $state(false);

  readonly #options: PanZoomOptions;
  /** Whether the view has been placed the first time; not followed, as the diagram had it. */
  #placed = false;
  #cameraTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(options: PanZoomOptions) {
    this.#options = options;
  }

  /** How the world is moved and scaled in the viewport, as a CSS transform. */
  get transform(): string {
    return `translate(${this.view.x}px, ${this.view.y}px) scale(${this.view.k})`;
  }

  /**
   * Follows the viewport: its size, the wheel, the first placing and the
   * camera to be kept. Called once, where effects can be made: as the
   * component that shows the view is made.
   */
  follow(): void {
    $effect(() => {
      const el = this.#options.viewport();
      if (!el) return;
      const resized = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w === this.width && h === this.height) return;
        untrack(() => {
          if (this.#placed && this.width && this.height) {
            // What was in the middle stays in the middle.
            this.view = {
              ...this.view,
              x: this.view.x + (w - this.width) / 2,
              y: this.view.y + (h - this.height) / 2,
            };
          }
          this.width = w;
          this.height = h;
        });
      };
      const observer = new ResizeObserver(() => requestAnimationFrame(resized));
      observer.observe(el);
      resized();
      return () => observer.disconnect();
    });

    // The first time the size is known, the view is put where it was left;
    // or else the origin goes to the middle.
    $effect(() => {
      if (this.#placed || !this.width || !this.height) return;
      this.#placed = true;
      untrack(() => {
        const camera = this.#options.camera?.();
        this.view = centred(
          { cx: camera?.cx ?? 0, cy: camera?.cy ?? 0, k: camera?.k ?? 1 },
          this.width,
          this.height,
        );
      });
    });

    $effect(() => {
      if (!this.#placed || !this.width) return;
      const snapshot: Camera = kept(this.view, this.width, this.height);
      clearTimeout(this.#cameraTimer);
      this.#cameraTimer = setTimeout(() => this.#options.oncamera?.(snapshot), RESTS);
    });

    // A view that goes leaves nothing to come after it: a camera told late
    // would be kept for whatever the place has turned to since.
    $effect(() => () => clearTimeout(this.#cameraTimer));

    $effect(() => {
      const el = this.#options.viewport();
      if (!el) return;
      const onwheel = (event: WheelEvent) => {
        if (this.#options.wheel && !this.#options.wheel(event)) return;
        event.preventDefault();
        const rect = el.getBoundingClientRect();
        this.view = wheeled(this.view, event, event.clientX - rect.left, event.clientY - rect.top);
      };
      el.addEventListener('wheel', onwheel, { passive: false });
      return () => el.removeEventListener('wheel', onwheel);
    });
  }

  /** The point of the world under a point of the window. */
  toWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.#options.viewport()?.getBoundingClientRect();
    const left = rect?.left ?? 0;
    const top = rect?.top ?? 0;
    return {
      x: (clientX - left - this.view.x) / this.view.k,
      y: (clientY - top - this.view.y) / this.view.k,
    };
  }

  /** Whether a point of the window is within the viewport. */
  pointerInside(clientX: number, clientY: number): boolean {
    const rect = this.#options.viewport()?.getBoundingClientRect();
    return (
      !!rect &&
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  /** Where a box of the world is in the window. */
  screenRect(box: Box): RectLike {
    const rect = this.#options.viewport()?.getBoundingClientRect();
    const { x, y, k } = this.view;
    const left = (rect?.left ?? 0) + x + (box.x - box.w / 2) * k;
    const top = (rect?.top ?? 0) + y + (box.y - box.h / 2) * k;
    return {
      left,
      top,
      right: left + box.w * k,
      bottom: top + box.h * k,
      width: box.w * k,
      height: box.h * k,
    };
  }

  /** Zooms about a point of the window, which stays over the same point of the world. */
  zoomAt(clientX: number, clientY: number, k: number): void {
    const rect = this.#options.viewport()?.getBoundingClientRect();
    if (rect) this.view = zoomedAt(this.view, clientX - rect.left, clientY - rect.top, k);
  }

  /** Zooms by a factor about the middle of the viewport. */
  zoomBy(factor: number): void {
    const rect = this.#options.viewport()?.getBoundingClientRect();
    if (rect)
      this.zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, this.view.k * factor);
  }

  /** Zooms to a scale about the middle of the viewport. */
  zoomTo(k: number): void {
    this.zoomBy(k / this.view.k);
  }

  /** Shows all of a world within these bounds, and nothing larger than it is. */
  fit(bounds: Bounds): void {
    if (this.width && this.height) this.view = fitting(bounds, this.width, this.height);
  }

  /** Moves the view, if need be, so that a box of the world is in it. */
  bring(box: Box): void {
    if (!this.width) return;
    const moved = bringing(this.view, box, this.width, this.height);
    if (moved) this.view = moved;
  }

  /**
   * Drags the ground from a press on it, once the pointer has moved a few
   * pixels; `end` when it is let go, with whether it moved.
   */
  pan(event: PointerEvent, end?: (moved: boolean) => void): void {
    const origin = { x: this.view.x, y: this.view.y };
    followPointer(
      event,
      (_e, dx, dy) => {
        this.panning = true;
        this.view = { ...this.view, x: origin.x + dx, y: origin.y + dy };
      },
      (moved) => {
        this.panning = false;
        end?.(moved);
      },
    );
  }
}
