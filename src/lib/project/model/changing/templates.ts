/**
 * The templates of the writer's own that the project keeps a copy of (ADR
 * 0038): one is copied in when chosen on an element, so that a shared
 * project and a `.glaukopis` file carry it to a computer that lacks it.
 * The copies are plain records in the `templates` map of the document, by
 * the template's id. These are methods of `Project`, which takes them in
 * (see there). The templates that come with the application are never
 * copied: every computer has them.
 */

import type { Template } from '$lib/api/templates';
import type { Project } from '../project.svelte';

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

/**
 * A template as the project can carry it: a plain record with what a
 * template has, each field as it should be; nothing where what is given
 * is not a template of the writer's own, or has no id.
 */
export function cleanTemplate(value: unknown, id?: string): Template | null {
  if (!value || typeof value !== 'object') return null;
  const given = value as Record<string, unknown>;
  const own = id ?? given.id;
  if (typeof own !== 'string' || !own.trim() || given.group !== 'own') return null;
  const requirements =
    given.requirements && typeof given.requirements === 'object'
      ? (given.requirements as Record<string, unknown>)
      : {};
  const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const plain = JSON.parse(
    JSON.stringify({
      id: own.trim(),
      name: typeof given.name === 'string' ? given.name : '',
      group: 'own',
      description: typeof given.description === 'string' ? given.description : '',
      ...(given.source && typeof given.source === 'object' ? { source: given.source } : {}),
      ...(typeof given.basedOn === 'string' && given.basedOn ? { basedOn: given.basedOn } : {}),
      ...(typeof given.layout === 'string' && given.layout ? { layout: given.layout } : {}),
      ...(typeof given.style === 'string' && given.style ? { style: given.style } : {}),
      contents: Array.isArray(given.contents)
        ? given.contents.filter((c) => c && typeof c === 'object')
        : [],
      kinds: strings(given.kinds),
      passageKinds: strings(given.passageKinds),
      requirements: {
        words: count(requirements.words),
        abstractWords: count(requirements.abstractWords),
        keywords: count(requirements.keywords),
        anonymous: requirements.anonymous === true,
        note: typeof requirements.note === 'string' ? requirements.note : '',
      },
      outputs: Array.isArray(given.outputs)
        ? given.outputs.filter((o) => o && typeof o === 'object')
        : [],
    }),
  );
  return plain as Template;
}

export const templateChanges = {
  /**
   * Keeps a copy of a template in the project, under its id, in place of
   * any copy there was. Only a template of the writer's own is kept: one
   * that came with the application is on every computer already. Returns
   * whether it was kept.
   */
  keepTemplate(this: Project, template: Template): boolean {
    const clean = cleanTemplate(template);
    if (!clean) return false;
    const before = this.yTemplates.get(clean.id);
    if (before && JSON.stringify(before) === JSON.stringify(clean)) return true;
    this.transact(() => this.yTemplates.set(clean.id, clean));
    return true;
  },

  /** Lets the project's copy of a template go. The elements that chose it keep its id. */
  dropTemplate(this: Project, id: string) {
    if (!this.yTemplates.has(id)) return;
    this.transact(() => this.yTemplates.delete(id));
  },
};
