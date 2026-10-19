/**
 * Pasting on Linux, past WebKitGTK (record 0048). WebKitGTK 2.54 ends the
 * whole application when it pastes from a clipboard that is empty or whose
 * holder does not answer. So every paste is stopped before WebKit reads
 * anything, the clipboard is read by the Rust side through GTK, and the
 * paste is given again to where it was aimed, with what was read: the
 * editors, the tables and the fields take it as they took WebKit's.
 */
import { clipboardRead, type Pasted } from '$lib/api/clipboard';
import { fromBase64 } from './base64';

/** Whether the page runs in WebKitGTK, which pastes so. */
export const pastesThroughGtk =
  typeof navigator !== 'undefined' &&
  /Linux/.test(navigator.userAgent) &&
  !/Android/.test(navigator.userAgent);

/** Stops WebKit's own pastes in the window and gives them again with what the Rust side reads. */
export function guardPaste() {
  // The middle button pastes the text last selected anywhere: WebKit fires
  // the paste while it handles the button's release, before any timer.
  let middle = false;
  window.addEventListener(
    'mouseup',
    (event) => {
      if (event.button !== 1) return;
      middle = true;
      setTimeout(() => (middle = false));
    },
    true,
  );
  window.addEventListener(
    'paste',
    (event) => {
      // Only WebKit's own pastes read the clipboard: a paste the page makes,
      // as this one gives again, carries what it pastes.
      if (!event.isTrusted) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void pasteAgain(event.target, middle);
    },
    true,
  );
}

async function pasteAgain(target: EventTarget | null, primary: boolean) {
  let pasted: Pasted;
  try {
    pasted = await clipboardRead(primary);
  } catch {
    return;
  }
  const at = target instanceof Node ? target : null;
  if (!at?.isConnected) return;
  const data = dataOf(pasted);
  if (!data.types.length) return;
  const event = new ClipboardEvent('paste', {
    clipboardData: data,
    bubbles: true,
    cancelable: true,
    composed: true,
  });
  // A paste the page does not take, into a field or into editable text that
  // is no editor's, goes in as the text it is, as WebKit's own would.
  if (at.dispatchEvent(event) && pasted.text && editable(at))
    document.execCommand('insertText', false, pasted.text);
}

/** Where the pictures of a paste are, by the order of its files: see `pastedPaths`. */
const PATHS = 'application/x-glaukopis-picture-paths';

/**
 * Where each picture of a paste is on this computer, by the order of the
 * paste's files: the path of one copied as a file in a file manager, whose
 * file in the paste holds nothing, since it is taken in from there; null
 * for one copied as a picture, whose file holds it. Nothing for a paste
 * that WebKit made itself.
 */
export function pastedPaths(data: DataTransfer | null): (string | null)[] {
  try {
    const paths: unknown = JSON.parse(data?.getData(PATHS) || '[]');
    return Array.isArray(paths) ? paths.map((p) => (typeof p === 'string' ? p : null)) : [];
  } catch {
    return [];
  }
}

function dataOf(pasted: Pasted): DataTransfer {
  const data = new DataTransfer();
  if (pasted.html) data.setData('text/html', pasted.html);
  if (pasted.text) data.setData('text/plain', pasted.text);
  for (const picture of pasted.pictures) {
    const bytes = picture.path ? [] : [fromBase64(picture.data) as Uint8Array<ArrayBuffer>];
    data.items.add(new File(bytes, picture.name, { type: picture.mime }));
  }
  if (pasted.pictures.some((p) => p.path))
    data.setData(PATHS, JSON.stringify(pasted.pictures.map((p) => p.path)));
  return data;
}

function editable(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return !element.readOnly && !element.disabled;
  if (element instanceof HTMLInputElement) return !element.readOnly && !element.disabled;
  return element instanceof HTMLElement && element.isContentEditable;
}
