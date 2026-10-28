/**
 * The settings of an image being edited (ADR 0071), and what they mean for
 * the side that shows it. The core applies the same settings to the full
 * image: turns first, then the flips in the turned frame, then the crop in
 * the frame that shows, then the colours by the browser's own formulas. What
 * the side shows is what is kept.
 */
import type { Crop, Edit } from '$lib/api/files';

/** The smallest a crop may be, as a fraction of the frame. */
const LEAST = 1 / 4096;

/** An edit that changes nothing. */
export function nothing(): Edit {
  return {
    turns: 0,
    flipX: false,
    flipY: false,
    crop: null,
    brightness: 100,
    contrast: 100,
    saturation: 100,
  };
}

/** Whether a crop is the whole frame, to within a pixel of an image this wide and high. */
function whole(crop: Crop | null, width = 4096, height = 4096): boolean {
  if (!crop) return true;
  const dx = 1 / Math.max(1, width);
  const dy = 1 / Math.max(1, height);
  return crop.x < dx && crop.y < dy && crop.width > 1 - dx && crop.height > 1 - dy;
}

/** Whether an edit changes nothing. */
export function isNothing(edit: Edit): boolean {
  return (
    edit.turns % 4 === 0 &&
    !edit.flipX &&
    !edit.flipY &&
    whole(edit.crop) &&
    edit.brightness === 100 &&
    edit.contrast === 100 &&
    edit.saturation === 100
  );
}

/**
 * Turned a quarter, to the right (1) or the left (-1). The crop, given in the
 * frame that shows, is turned with the image, so that it covers the same part.
 */
export function turned(edit: Edit, by: 1 | -1): Edit {
  const c = edit.crop;
  const crop = !c
    ? null
    : by === 1
      ? { x: 1 - c.y - c.height, y: c.x, width: c.height, height: c.width }
      : { x: c.y, y: 1 - c.x - c.width, width: c.height, height: c.width };
  // A flip in the turned frame, turned again, is the other flip.
  return {
    ...edit,
    turns: (((edit.turns + by) % 4) + 4) % 4,
    flipX: edit.flipY,
    flipY: edit.flipX,
    crop,
  };
}

/** Flipped sideways ('x') or upside down ('y'), in the frame that shows; the crop with it. */
export function flipped(edit: Edit, axis: 'x' | 'y'): Edit {
  const c = edit.crop;
  if (axis === 'x')
    return { ...edit, flipX: !edit.flipX, crop: c && { ...c, x: 1 - c.x - c.width } };
  return { ...edit, flipY: !edit.flipY, crop: c && { ...c, y: 1 - c.y - c.height } };
}

/** The size of the frame that shows: the image's, swapped for an odd number of turns. */
export function shownSize(edit: Edit, width: number, height: number): [number, number] {
  return edit.turns % 2 ? [height, width] : [width, height];
}

/**
 * The transform of the image, about its middle. The browser applies the
 * functions from the right: the turn first, then the flip in the turned
 * frame, as the core does it. This is the one place the two must agree.
 */
export function cssTransform(edit: Edit): string {
  const turns = edit.turns % 4;
  if (!turns && !edit.flipX && !edit.flipY) return '';
  return `scale(${edit.flipX ? -1 : 1}, ${edit.flipY ? -1 : 1}) rotate(${turns * 90}deg)`;
}

/** The filter of the image: brightness, then contrast, then saturation, as the core applies them. */
export function cssFilter(edit: Edit): string {
  if (edit.brightness === 100 && edit.contrast === 100 && edit.saturation === 100) return '';
  return `brightness(${edit.brightness / 100}) contrast(${edit.contrast / 100}) saturate(${edit.saturation / 100})`;
}

/** A crop kept within the frame, and no smaller than the least. */
export function clampedCrop(crop: Crop): Crop {
  const width = Math.min(1, Math.max(LEAST, crop.width));
  const height = Math.min(1, Math.max(LEAST, crop.height));
  const x = Math.min(1 - width, Math.max(0, crop.x));
  const y = Math.min(1 - height, Math.max(0, crop.y));
  return { x, y, width, height };
}

/** The pixels the crop cuts to, in the frame that shows, rounded as the core rounds them. */
export function cutSize(edit: Edit, width: number, height: number): [number, number] {
  const [w, h] = shownSize(edit, width, height);
  const c = edit.crop;
  if (!c || whole(c, w, h)) return [w, h];
  const x = Math.min(w - 1, Math.max(0, Math.round(c.x * w)));
  const y = Math.min(h - 1, Math.max(0, Math.round(c.y * h)));
  return [
    Math.min(w - x, Math.max(1, Math.round(c.width * w))),
    Math.min(h - y, Math.max(1, Math.round(c.height * h))),
  ];
}
