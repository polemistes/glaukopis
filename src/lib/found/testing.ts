/** What the tests of the citations that were found are made with. */

import type { Found } from '$lib/api/found';
import { writeBody } from '$lib/project/model/blocks';
import { Project } from '$lib/project/model/project.svelte';
import type { Block, Inline, TableCell } from '$lib/project/model/text';

export const HASH = 'a'.repeat(64);

export const t = (text: string, marks: Record<string, object> = {}): Inline => ({
  kind: 'text',
  text,
  marks: marks as Record<string, Record<string, unknown>>,
});
export const p = (...content: Inline[]): Block => ({ kind: 'paragraph', content });
export const note = (...content: Inline[]): Inline => ({ kind: 'footnote', content });
export const cell = (...content: Inline[]): TableCell => ({
  content: [p(...content)],
  colspan: 1,
  rowspan: 1,
  header: false,
});

/** What a mark holds, of a citation made by Zotero. */
export const zotero = (id: string, key = 'ABCD2345', more: Partial<Found> = {}): Found => ({
  id,
  by: 'zotero',
  items: [{ uris: [`http://zotero.org/users/1/items/${key}`], locator: '73' }],
  mode: 'normal',
  left: false,
  ...more,
});

/** A project with one map, and elements under its centre with these texts. */
export function project(...texts: Block[][]) {
  const pr = new Project(null);
  const map = pr.createMap('Wrath');
  const root = pr.map(map)!.root;
  const elements = texts.map((blocks, i) => {
    const id = pr.addChild(root, { title: `Part ${i + 1}` })!;
    pr.transact(() => writeBody(pr.fragment(id, 'body')!, blocks));
    return id;
  });
  return { pr, map, root, elements };
}
