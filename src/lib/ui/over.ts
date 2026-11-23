/**
 * What lies over the window, and who is to be told when it opens: on a
 * phone, the page's steps (`src/lib/phone/places.svelte.ts`), so that the
 * system's Back closes a dialog. `opened` is given what closes the thing,
 * and gives back what the thing calls when it has closed. Where nobody
 * listens, as on a computer, nothing changes.
 */
export const over: { opened: ((close: () => void) => () => void) | null } = { opened: null };
