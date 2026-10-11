/**
 * Templates as the interface speaks of them (ADR 0038): the words for
 * their groups, for the parts the core makes itself, for the kinds of file
 * they make, and for the places of the kinds of elements; and how a
 * template that came with the application becomes one of the writer's own.
 */

import type {
  GeneratedPart,
  OutputTarget,
  PartGroup,
  Template,
  TemplateGroup,
} from '$lib/api/templates';
import { t } from '$lib/i18n';

/** The groups in the order the chooser lists them: the writer's own first, then by kind of text, then by who asks. */
export const TEMPLATE_GROUPS: readonly TemplateGroup[] = [
  'own',
  'plain',
  'article',
  'book',
  'fiction',
  'stage',
  'poetry',
  'other',
  'journal',
  'publisher',
  'style-guide',
];

/** The parts the core makes itself, in the order a document usually has them. */
export const GENERATED_PARTS: readonly GeneratedPart[] = [
  'half-title',
  'title-page',
  'keywords',
  'contents',
  'list-of-figures',
  'list-of-tables',
  'body',
  'notes',
  'bibliography',
];

/** The kinds of file a document can be made as, in the order the export offers them. */
export const TARGETS: readonly OutputTarget[] = [
  'pdf',
  'pdf-latex',
  'docx',
  'odt',
  'latex',
  'typst',
  'markdown',
  'html',
  'epub',
];

export const PART_GROUPS: readonly PartGroup[] = ['front', 'back', 'cover'];

export const templateGroupWords = (group: TemplateGroup): string => t(`template-group-${group}`);
export const generatedPartWords = (part: GeneratedPart): string => t(`template-generated-${part}`);
export const targetWords = (target: OutputTarget): string => t(`template-target-${target}`);
export const partGroupWords = (group: PartGroup): string => t(`template-part-group-${group}`);

/** What a source's confidence says, in words; nothing where no source is named. */
export function confidenceWords(confidence: string | undefined): string {
  if (!confidence) return '';
  return confidence === 'high'
    ? t('format-source-high')
    : confidence === 'medium'
      ? t('format-source-medium')
      : t('format-source-low');
}

/**
 * An id for a template of the writer's own, from its name: the letters and
 * digits of the name, in lower case, joined by hyphens; and not one that
 * is taken, so that nothing is written over.
 */
export function idFromName(name: string, taken: Iterable<string> = []): string {
  const base =
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/æ/g, 'ae')
      .replace(/ø/g, 'o')
      .replace(/å/g, 'a')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/, '') || 'template';
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) if (!used.has(`${base}-${n}`)) return `${base}-${n}`;
}

/**
 * A template as one of the writer's own: in the group of their own, with an
 * id made from its name and `basedOn` what it was made from. One that is
 * their own already keeps its id, and only takes the name, unless a fresh
 * one is wanted from it.
 */
export function asOwn(
  template: Template,
  name: string,
  taken: Iterable<string> = [],
  fresh = false,
): Template {
  const clean = name.replace(/\s+/g, ' ').trim() || template.name;
  if (template.group === 'own' && !fresh) return { ...template, name: clean };
  // The source stays: it describes what the template was made from.
  return {
    ...template,
    id: idFromName(clean, taken),
    name: clean,
    group: 'own',
    basedOn: template.id,
  };
}
