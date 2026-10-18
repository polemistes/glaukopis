import { call } from './backend';

/** A picture that is pasted: the file's name (empty for a picture copied as one), its type, and its bytes in base64. */
export interface PastedPicture {
  name: string;
  mime: string;
  data: string;
}

/** What the clipboard holds, read by the Rust side (record 0048). */
export interface Pasted {
  text: string | null;
  html: string | null;
  /** A picture copied as one, and the files of pictures copied in a file manager. */
  pictures: PastedPicture[];
}

/** The clipboard, or with `primary` the text last selected anywhere, which the middle button pastes. */
export const clipboardRead = (primary: boolean) => call<Pasted>('clipboard_read', { primary });
