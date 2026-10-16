import { call } from './backend';

/** What the clipboard holds, read by the Rust side (record 0048). */
export interface Pasted {
  text: string | null;
  html: string | null;
  /** A picture copied as one, and the files of pictures copied in a file manager. */
  pictures: { name: string; mime: string; data: string }[];
}

/** The clipboard, or with `primary` the text last selected anywhere, which the middle button pastes. */
export const clipboardRead = (primary: boolean) => call<Pasted>('clipboard_read', { primary });
