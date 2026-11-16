/**
 * The words found, marked in the chapter Help shows. The chapter is drawn
 * from HTML, and WebKitGTK gives identical HTML back with the nodes of its
 * last drawing, marks and all: so every mark is taken out before the words
 * are marked again, whatever was drawn.
 */

import { hitsIn } from './guide';

const MARK = 'data-help-mark';

/** Takes every mark of found words out of what is drawn, leaving their words where they were. */
export function unmark(root: HTMLElement) {
  const marks = root.querySelectorAll(`mark[${MARK}]`);
  if (!marks.length) return;
  for (const mark of marks) mark.replaceWith(...mark.childNodes);
  root.normalize();
}

/** Marks the words, each at the beginning of a word, in the text of what is drawn; gives the marks in their order. */
export function markWords(root: HTMLElement, words: readonly string[]): HTMLElement[] {
  if (!words.length) return [];
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  const marks: HTMLElement[] = [];
  for (const text of texts) {
    const hits = hitsIn(text.data, words);
    const made: HTMLElement[] = [];
    // From the last, so that the places of those before stay as they were.
    for (let k = hits.length - 1; k >= 0; k--) {
      const [start, end] = hits[k];
      const found = text.splitText(start);
      found.splitText(end - start);
      const mark = root.ownerDocument.createElement('mark');
      mark.setAttribute(MARK, '');
      found.replaceWith(mark);
      mark.append(found);
      made.unshift(mark);
    }
    marks.push(...made);
  }
  return marks;
}
