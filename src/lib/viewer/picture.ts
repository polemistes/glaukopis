/**
 * The picture of a page or of an image, drawn into a canvas (ADR 0069,
 * addendum of 2026-10-31): decoded once, off the main thread, and copied in.
 * From then on the canvas holds the pixels, which WebKit neither decodes
 * again when the canvas is painted at another size nor lets go of under
 * memory pressure, as it does with the pictures of `<img>` elements, which
 * made pages blank while they were zoomed. A new picture replaces the old in
 * one step, so that the canvas never shows nothing in between.
 */

/** An action for a canvas: shows the picture at the URL, and the next one given. */
export function picture(canvas: HTMLCanvasElement, url: string | null) {
  // Each picture asked for has its turn; one asked for after takes over.
  let turn = 0;

  async function show(next: string | null) {
    const mine = ++turn;
    if (!next) return;
    const image = new Image();
    image.src = next;
    try {
      await image.decode();
    } catch {
      return;
    }
    if (mine !== turn || !canvas.isConnected) return;
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    if (!w || !h) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    // Setting the size clears the canvas; the same size is cleared by hand, in the same step as the drawing.
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    } else context.clearRect(0, 0, w, h);
    context.drawImage(image, 0, 0);
    canvas.dataset.drawn = next;
  }

  void show(url);
  return {
    update(next: string | null) {
      void show(next);
    },
    destroy() {
      turn++;
    },
  };
}
