/**
 * What a document type brings, to be seen at a glance: its parts in their
 * order, how its pages are set and how it cites, and what it requires.
 * Worked out from the type itself and its layout, in the language of the
 * interface, so that it is true of every type, a writer's own too, and
 * nothing is described that has to be kept true by hand.
 */

import type { FormatSummary } from '$lib/api/documents';
import type { ContentsItem, Requirements } from '$lib/api/templates';
import { languages, t } from '$lib/i18n';
import { paperName } from '$lib/look/papers';
import { PARTS } from '$lib/project/parts';
import { generatedPartWords } from './templates';

/** Between two things a type brings, on one line. */
const BETWEEN = ' · ';

const number = (n: number) => n.toLocaleString(languages.current);

/** The parts of a type, in their order, each by its name. */
export function partsBrought(contents: readonly ContentsItem[]): string {
  return contents
    .map((item) =>
      'part' in item
        ? generatedPartWords(item.part)
        : (PARTS.find((k) => k.id === item.kind)?.label() ?? item.kind),
    )
    .join(BETWEEN);
}

/**
 * How the pages of a layout are set, as far as a glance takes in: the
 * paper, the font with its size, and the line spacing; and after them the
 * reference style, where one is named.
 */
export function pagesBrought(layout: FormatSummary | undefined, style = ''): string {
  const out: string[] = [];
  if (layout) {
    out.push(paperName(layout.paper) ?? `${layout.width} × ${layout.height}`);
    out.push(`${layout.font} ${t('format-level-size', { size: layout.size })}`);
    out.push(`${t('format-line-spacing')} ${number(layout.lineSpacing)}`);
  }
  if (style) out.push(style);
  return out.join(BETWEEN);
}

/** What a type requires: its limits, and that the contributors are not named; nothing where it requires nothing. */
export function limitsBrought(requirements: Requirements): string {
  const out: string[] = [];
  const limit = (words: string, most: number | null) => {
    if (most) out.push(`${words} ${number(most)}`);
  };
  limit(t('template-requirement-words'), requirements.words);
  limit(t('template-requirement-abstract-words'), requirements.abstractWords);
  limit(t('template-requirement-keywords'), requirements.keywords);
  if (requirements.anonymous) out.push(t('template-requirement-anonymity'));
  return out.join(BETWEEN);
}
