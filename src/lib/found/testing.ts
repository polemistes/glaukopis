/** What the tests of the citations that were found are made with. */

import * as Y from 'yjs';
import type { Found } from '$lib/api/found';
import { writeBody } from '$lib/project/model/blocks';
import { Project } from '$lib/project/model/project.svelte';
import {
  fillTitle,
  paragraph,
  type Block,
  type Inline,
  type TableCell,
} from '$lib/project/model/text';
import { PROJECT } from '$lib/project/model/types';

export const HASH = 'a'.repeat(64);

export const t = (text: string, marks: Record<string, object> = {}): Inline => ({
  kind: 'text',
  text,
  marks: marks as Record<string, Record<string, unknown>>,
});
export const p = (...content: Inline[]): Block => paragraph(content);
/** A quote paragraph. */
export const quote = (...content: Inline[]): Block => paragraph(content, 'quote');
/** Items of a list, one paragraph each. */
export const list = (...items: Inline[][]): Block[] =>
  items.map((content) => paragraph(content, 'item'));
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

/**
 * A project named Wrath, with elements under the project itself with these
 * texts. `at` is the element in view: the project.
 */
export function project(...texts: Block[][]) {
  const pr = new Project(null);
  pr.begin('Wrath');
  const elements = texts.map((blocks, i) => {
    const id = pr.addChild(PROJECT, { title: `Part ${i + 1}` })!;
    pr.transact(() => writeBody(pr.fragment(id, 'body')!, blocks));
    return id;
  });
  return { pr, at: PROJECT, elements };
}

/**
 * A document as it was written before ADR 0037: a map named Wrath, its
 * centre The poem with an element Part 1 under it, and a loose element
 * Beside, each with a text. The ids are those given.
 */
export function oldDocument(
  texts: { centre?: Block[]; part?: Block[]; loose?: Block[] } = {},
): Y.Doc {
  const doc = new Y.Doc();
  const maps = doc.getMap<Y.Map<unknown>>('maps');
  const nodes = doc.getMap<Y.Map<unknown>>('nodes');
  doc.transact(() => {
    doc.getMap<unknown>('meta').set('name', 'Wrath');
    const m = new Y.Map<unknown>();
    m.set('name', 'Wrath');
    m.set('root', 'centre');
    m.set('order', 'a0');
    maps.set('m1', m);
    const node = (
      id: string,
      parent: string | null,
      order: string,
      title: string,
      blocks: Block[],
    ) => {
      const n = new Y.Map<unknown>();
      n.set('map', 'm1');
      n.set('parent', parent);
      n.set('order', order);
      const t = new Y.XmlFragment();
      const body = new Y.XmlFragment();
      n.set('title', t);
      n.set('body', body);
      nodes.set(id, n);
      fillTitle(t, title);
      writeBody(body, blocks);
    };
    node('centre', null, 'a0', 'The poem', texts.centre ?? []);
    node('part', 'centre', 'a0', 'Part 1', texts.part ?? []);
    node('loose', null, 'a1', 'Beside', texts.loose ?? []);
  });
  return doc;
}
