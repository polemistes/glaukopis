/**
 * An element of the page within a sentence of the interface: the name of a
 * file in the letters of code, the name of a button in italics. The message
 * is given `PLACE` for the element, and its words are shown before and after
 * it, wherever the language puts it:
 *
 *     const [before, after] = $derived(apart(t('settings-data-hint', { file: PLACE })));
 *
 *     {before}<code>library/library.bib</code>{after}
 */

/** What stands in the words of a message where the element is to be. */
export const PLACE = '\u{E000}';

/** The words of a message before and after the place of the element in it. */
export function apart(said: string): [string, string] {
  const at = said.indexOf(PLACE);
  return at < 0 ? [said, ''] : [said.slice(0, at), said.slice(at + PLACE.length)];
}
