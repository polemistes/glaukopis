/**
 * Names of files on the page: a title made into a name a file may have on
 * every system the application runs on, for the names a save dialog
 * proposes, and the ending of a file's name, by which a file is taken for
 * a document, a table, a picture or a PDF. The rule of the first is the
 * core's `safe_file_name` (crates/core/src/fsutil.rs), kept here once for
 * the page, with what Windows refuses beyond its signs: the names of its
 * devices.
 */

/**
 * The ending of a file's name, in small letters: what follows its last
 * dot, as the core's `Path::extension` has it. A name without a dot, or
 * with one only at its start (`.bashrc`), has none; a dot in the name of a
 * folder on the way to it is not the file's.
 */
export function fileEnding(path: string): string {
  const name = path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** The longest name proposed, in characters, as the core cuts it. */
const LONGEST = 120;

/**
 * The names Windows keeps for its devices, in any case and whatever follows
 * them after a dot: "con.docx" and "Aux. notes.docx" are no files there.
 * The superscript digits are reserved as well.
 */
const DEVICE = /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])$/i;

/**
 * A name with what no system takes in a file name (`/ \ : * ? " < > |`,
 * the null sign and the other control signs) made spaces, the spaces made
 * single, dots and spaces taken off its ends, cut to 120 characters, and a
 * device name of Windows given an underscore after it. The fallback where
 * nothing is left.
 */
export function safeFileName(name: string, fallback: string): string {
  const clean = (s: string) =>
    s
      .replace(/[\\/:*?"<>|\p{Cc}]/gu, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^[.\s]+|[.\s]+$/g, '');
  const cut = clean(Array.from(clean(name)).slice(0, LONGEST).join(''));
  if (!cut) return fallback;
  const dot = cut.indexOf('.');
  const stem = (dot < 0 ? cut : cut.slice(0, dot)).trimEnd();
  return DEVICE.test(stem) ? `${stem}_${cut.slice(stem.length)}` : cut;
}
