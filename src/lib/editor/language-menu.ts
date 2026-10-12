/**
 * The items of the menu by which a language is given to words or to a
 * passage (ADR 0020): the text's own language first, then the languages
 * texts are written in, and any other by its tag. The words menu has it
 * for what is selected, and the bracket of a passage for the whole
 * passage (ADR 0040).
 */

import { languageName, t, TEXT_LANGUAGES } from '$lib/i18n';
import type { MenuItem } from '$lib/ui/menu.svelte';

export interface LanguageChoice {
  /** The language of the document, as a tag; nothing where it is not known. */
  language: string | null | undefined;
  /** The language the words have of their own now; nothing where it is the text's. */
  current: string | null;
  /** Gives the words the language, or, with nothing, the text's own. */
  set: (tag: string | null) => void;
  /** Asks for any other language, by its tag. */
  other: () => void;
}

export function languageItems({ language, current, set, other }: LanguageChoice): MenuItem[] {
  // The languages of texts but the text's own, and the one the words have where it is no language of texts.
  const offered = [
    ...(current && (current === language || !TEXT_LANGUAGES.includes(current)) ? [current] : []),
    ...TEXT_LANGUAGES.filter((l) => l !== language),
  ];
  return [
    {
      label: t('editor-language-of-text'),
      hint: language ? languageName(language) : undefined,
      checked: !current,
      action: () => set(null),
    },
    { kind: 'separator' },
    ...offered.map((tag): MenuItem => ({
      label: languageName(tag),
      hint: TEXT_LANGUAGES.includes(tag) ? undefined : tag,
      checked: current === tag,
      action: () => set(tag),
    })),
    { kind: 'separator' },
    { label: t('editor-language-other'), action: other },
  ];
}
