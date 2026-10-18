/**
 * What a change of the text touched, for the plugins that draw over the
 * text (the brackets of runs, the numbers of lines) and keep it in shape
 * (the line marks): so that a keystroke is answered by mapping what was
 * drawn, or by looking at the paragraph written in, and not by going
 * through the whole text again.
 */

import type { Node } from 'prosemirror-model';
import type { Transaction } from 'prosemirror-state';
import { AddMarkStep, Mapping, RemoveMarkStep, ReplaceStep } from 'prosemirror-transform';

/** What a change did within the lines of a text, where it did nothing else. */
export interface WithinLines {
  /**
   * The paragraphs (and other textblocks) whose content was written in, as
   * they were before each step, and where they stand now.
   */
  written: { before: Node; after: Node | null }[];
  /** Whether only text was written or taken out: no line break, line mark, citation or other thing of the line. */
  onlyText: boolean;
}

/** Whether only text stands in a slice of a document, or between two places of one. */
function onlyTextIn(doc: Node, from: number, to: number): boolean {
  let only = true;
  doc.nodesBetween(from, to, (node) => {
    if (node.isInline && !node.isText) only = false;
    return only;
  });
  return only;
}

/**
 * What a transaction changed, where it changed only what stands within
 * paragraphs and in the same paragraphs: text written or taken out, things
 * of the line put in or taken out, marks given or taken away. Nothing,
 * where it did more: a paragraph put in, taken out, joined or split, or
 * anything said of one, such as its kind or its numbering; or where the
 * whole text was replaced, as y-prosemirror does with what others wrote.
 */
export function withinLines(tr: Transaction): WithinLines | null {
  const written: WithinLines['written'] = [];
  let onlyText = true;
  for (let i = 0; i < tr.steps.length; i++) {
    const step = tr.steps[i];
    // Marks are nothing of the shape of a text.
    if (step instanceof AddMarkStep || step instanceof RemoveMarkStep) continue;
    if (!(step instanceof ReplaceStep)) return null;
    const doc = tr.docs[i];
    const $from = doc.resolve(step.from);
    const $to = doc.resolve(step.to);
    if ($from.parent !== $to.parent || !$from.parent.isTextblock) return null;
    const { slice } = step;
    if (slice.openStart || slice.openEnd) return null;
    let inline = true;
    slice.content.forEach((node) => {
      if (!node.isInline) inline = false;
      else if (!node.isText) onlyText = false;
    });
    if (!inline) return null;
    if (onlyText && !onlyTextIn(doc, step.from, step.to)) onlyText = false;
    const now = tr.mapping.slice(i).map($from.before());
    written.push({ before: $from.parent, after: tr.doc.nodeAt(now) });
  }
  return { written, onlyText };
}

/**
 * Where the changes of transactions, one after the other, stand in the
 * text they made: a range for each part of each step that was changed,
 * mapped through all that came after it.
 */
export function changedRanges(transactions: readonly Transaction[]): [number, number][] {
  const all = new Mapping();
  for (const tr of transactions) for (const map of tr.mapping.maps) all.appendMap(map);
  const out: [number, number][] = [];
  all.maps.forEach((map, i) => {
    const after = all.slice(i + 1);
    map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
      out.push([after.map(newStart, -1), after.map(newEnd, 1)]);
    });
  });
  return out;
}
