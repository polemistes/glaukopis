/**
 * What the plugin reckons without a browser: where a part of a picture of
 * the tab is cut out, what an image is called by its address, what a
 * message to the helper holds, what an answer of the helper means, and the
 * bytes of a picture as base64. Nothing here touches the browser, so that
 * the tests of Glaukopis can call it (`src/lib/notebook/plugin.test.ts`).
 */

/** The name of the program Firefox starts, as Glaukopis tells Firefox of it. */
export const HELPER = 'org.glaukopis.notebook';

/** The four things the plugin hands over. */
export const KINDS = ['page', 'selection', 'image', 'region'];

/**
 * Where a rectangle of the page, in the page's pixels as the window shows
 * them, is in a picture of the tab: the picture is as wide as the window's
 * view times the zoom and the density of the screen, so the factor is
 * reckoned from the picture's own width against the width of the view.
 * Cut to what the picture holds; nothing where nothing of it is left.
 *
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @param {{ width: number, height: number }} view
 * @param {{ width: number, height: number }} picture
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
export function cropOf(rect, view, picture) {
  if (!(view.width > 0) || !(picture.width > 0) || !(picture.height > 0)) return null;
  const factor = picture.width / view.width;
  const left = Math.max(0, Math.round(rect.x * factor));
  const top = Math.max(0, Math.round(rect.y * factor));
  const right = Math.min(picture.width, Math.round((rect.x + rect.width) * factor));
  const bottom = Math.min(picture.height, Math.round((rect.y + rect.height) * factor));
  if (right - left < 1 || bottom - top < 1) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * The rectangle marked between where the pointer went down and where it is
 * now, whichever way it was drawn.
 *
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function rectBetween(ax, ay, bx, by) {
  return {
    x: Math.min(ax, bx),
    y: Math.min(ay, by),
    width: Math.abs(bx - ax),
    height: Math.abs(by - ay),
  };
}

/**
 * The name of an image by the file in its address, where it has one, as a
 * PNG: the plugin hands every image over as PNG. Nothing for a picture
 * that has no address of its own (`data:`, `blob:`) or none that ends in a
 * name.
 *
 * @param {string} src
 * @returns {string}
 */
export function nameOfImage(src) {
  let url;
  try {
    url = new URL(src);
  } catch {
    return '';
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'file:') return '';
  const last = url.pathname.split('/').pop() ?? '';
  let name;
  try {
    name = decodeURIComponent(last);
  } catch {
    name = last;
  }
  // What a file name cannot hold on any system goes.
  name = name
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .trim()
    .slice(0, 200);
  const stem = name.replace(/\.[^.]*$/, '').trim();
  return stem ? `${stem}.png` : '';
}

/**
 * The message a thing is handed to the helper as: its kind, the page's
 * address and title, when, and what it is. Every field of words is there,
 * empty where it says nothing; the picture only where there is one.
 *
 * @param {string} kind
 * @param {{ url?: string, title?: string }} page
 * @param {{ text?: string, html?: string, alt?: string, name?: string, image?: string }} parts
 * @param {Date} [now]
 */
export function messageOf(kind, page, parts, now = new Date()) {
  if (!KINDS.includes(kind)) throw new Error(`no such kind: ${kind}`);
  const message = {
    kind,
    url: page.url ?? '',
    title: page.title ?? '',
    when: now.toISOString(),
    text: parts.text ?? '',
    html: parts.html ?? '',
    alt: parts.alt ?? '',
    name: parts.name ?? '',
  };
  if (parts.image) message.image = parts.image;
  return message;
}

/** The words of the plugin's languages for what went wrong, by what the helper answered. */
const REASONS = {
  'not-set-up': 'reasonNotSetUp',
  'not-understood': 'reasonNotUnderstood',
  'too-large': 'reasonTooLarge',
  'not-a-picture': 'reasonNotAPicture',
  'no-data-folder': 'reasonNoDataFolder',
  'not-written': 'reasonNotWritten',
};

/**
 * What an answer of the helper means: handed over, or the name of the
 * plugin's words for why not. No answer at all is Glaukopis not set up
 * for Firefox, as when Firefox says there is no such program.
 *
 * @param {unknown} answer what the helper answered; nothing where it ended without answering
 * @param {string} [failure] what Firefox said, where the port could not be opened or closed
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function outcomeOf(answer, failure) {
  if (answer && typeof answer === 'object' && /** @type {any} */ (answer).ok === true)
    return { ok: true };
  if (answer && typeof answer === 'object') {
    const word = /** @type {any} */ (answer).error;
    return { ok: false, reason: REASONS[word] ?? 'reasonNotWritten' };
  }
  if (failure && /too (large|big)|exceeds|maximum/i.test(failure))
    return { ok: false, reason: 'reasonTooLarge' };
  return { ok: false, reason: REASONS['not-set-up'] };
}

/**
 * Bytes as base64, a piece at a time, so that a large picture does not
 * overflow the arguments of one call.
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function base64OfBytes(bytes) {
  let binary = '';
  const piece = 0x8000;
  for (let i = 0; i < bytes.length; i += piece)
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + piece)));
  return btoa(binary);
}

/**
 * What a `data:` address in base64 holds: its type and its base64. Nothing
 * where it is no such address.
 *
 * @param {string} address
 * @returns {{ type: string, base64: string } | null}
 */
export function partsOfDataUrl(address) {
  const m = /^data:([^;,]*)(?:;[^;,]*)*;base64,(.*)$/s.exec(address ?? '');
  return m ? { type: m[1] || 'application/octet-stream', base64: m[2] } : null;
}

/**
 * The bytes of a `data:` address in base64.
 *
 * @param {string} address
 * @returns {Uint8Array | null}
 */
export function bytesOfDataUrl(address) {
  const parts = partsOfDataUrl(address);
  if (!parts) return null;
  const binary = atob(parts.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
