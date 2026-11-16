/**
 * What is said where a paragraph or a selection is not made an element
 * because it holds what a name cannot (`Heading.holds`, record 0108): a
 * citation, a note, a formula, an inline number, a cross-reference, or a
 * number or words set by hand in the margin of a line. The message names
 * what it holds, so that the writer knows what to take out first.
 */

import { languages, t } from '$lib/i18n';

/** The words for each thing a name cannot hold, by the name of its node. */
const NAMED: Record<string, () => string> = {
  citation: () => t('text-holds-citation'),
  footnote: () => t('text-holds-footnote'),
  math: () => t('text-holds-math'),
  refmark: () => t('text-holds-refmark'),
  crossref: () => t('text-holds-crossref'),
  linemark: () => t('text-holds-linemark'),
};

/** The things held, named and joined as the language of the interface joins a list; each wording once. */
export function thingsHeld(kinds: readonly string[]): string {
  const named = [...new Set(kinds.map((kind) => (NAMED[kind] ?? (() => t('text-holds-other')))()))];
  return new Intl.ListFormat(languages.current, { type: 'conjunction' }).format(named);
}

/** What is said: of the paragraph, or of what is selected. */
export function heldMessage(kinds: readonly string[], selected: boolean): string {
  const things = thingsHeld(kinds);
  return selected ? t('text-selection-holds', { things }) : t('text-paragraph-holds', { things });
}
