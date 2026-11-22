/**
 * What a document is made of, as it stands under its element (ADR 0118):
 * each kind of part once, where its first element stands, and the text
 * where it begins. The checklist reads it for the order of the parts, and
 * Look for what a document type made from the document suggests.
 */

import type { Project } from '$lib/project/model/project.svelte';
import { partOf } from '$lib/project/parts';

/**
 * The kinds of the catalogue the elements directly under `at` are, in the
 * order they stand, each once, with `body` where the text begins: in the
 * element's own words, or at the first element that is of no part kind.
 * Elements left out of the document are passed over. A kind of the
 * project is given as the catalogue's kind it is based on.
 */
export function partsStanding(project: Project, at: string): string[] {
  const stands: string[] = [];
  if ((project.node(at)?.words ?? 0) > 0) stands.push('body');
  for (const child of project.tree(at).children.get(at) ?? []) {
    const node = project.node(child);
    if (!node || node.excluded) continue;
    const what = partOf(project, node.kind)?.id ?? 'body';
    if (!stands.includes(what)) stands.push(what);
  }
  return stands;
}
