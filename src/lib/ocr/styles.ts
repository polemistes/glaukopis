/**
 * The styles found beside the body of a PDF whose shape was kept, as the
 * one who brings it in is asked to name them (ADR 0045): what each can be
 * made, and the first guess of a name for a kind of their own, which is
 * its look in words. Nothing is guessed of what a style means: only how it
 * looks.
 */

import type { StyleFoundView } from '$lib/api/imported';
import { CATALOGUE, GROUPS } from '$lib/editor/kinds';
import { t, worded } from '$lib/i18n';

/** A size this much from the body's, the body's being 1, is smaller or larger. */
const SIZE_STEP = 0.05;

/** The look of a style in words, with a capital: "Smaller italic text", "Lines kept". */
export function lookInWords(style: StyleFoundView): string {
  const kept = style.kept ? 'yes' : 'no';
  const words: string[] = [];
  if (style.indent) words.push(t('ocr-style-indented', { kept }));
  if (style.size < 1 - SIZE_STEP) words.push(t('ocr-style-smaller', { kept }));
  else if (style.size > 1 + SIZE_STEP) words.push(t('ocr-style-larger', { kept }));
  if (style.bold) words.push(t('ocr-style-bold', { kept }));
  if (style.italic) words.push(t('ocr-style-italic', { kept }));
  let said: string;
  if (words.length || style.kept) said = t('ocr-style-guess', { kept, look: worded(words) });
  else if (style.family.trim()) said = t('ocr-style-family', { family: style.family.trim() });
  else said = t('ocr-style-other');
  said = said.replace(/\s+/g, ' ').trim();
  return said.charAt(0).toLocaleUpperCase() + said.slice(1);
}

/** What a style can be made, in the list it is chosen from: a kind of your own stands for a name to be given. */
export const OWN = '+own';

/**
 * The kinds of paragraph of the catalogue, as the kind menu groups them,
 * text first and a kind of your own last.
 */
export function styleOptions(): { value: string; label: string; group?: string }[] {
  const out: { value: string; label: string; group?: string }[] = [];
  for (const group of GROUPS) {
    if (group.id === 'words') continue;
    for (const id of group.kinds) {
      const spec = CATALOGUE.find((k) => k.id === id);
      if (!spec || spec.family !== 'paragraph') continue;
      out.push({
        value: id,
        label: spec.label(),
        group: id === 'text' ? undefined : group.label(),
      });
    }
  }
  out.push({ value: OWN, label: t('ocr-styles-own') });
  return out;
}
