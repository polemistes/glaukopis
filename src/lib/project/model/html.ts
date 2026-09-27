/** The text of an element as HTML, for showing it where it is not being written. */

import { citationLabel, isMissing } from '$lib/editor/references.svelte';
import type { Block, Inline } from './text';

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlines(list: Inline[], notes: { n: number }): string {
  let out = '';
  for (const i of list) {
    switch (i.kind) {
      case 'text': {
        let html = escape(i.text);
        if (i.marks.em) html = `<em>${html}</em>`;
        if (i.marks.strong) html = `<strong>${html}</strong>`;
        if (i.marks.smallcaps) html = `<span class="smallcaps">${html}</span>`;
        if (i.marks.sup) html = `<sup>${html}</sup>`;
        if (i.marks.sub) html = `<sub>${html}</sub>`;
        if (i.marks.strike) html = `<s>${html}</s>`;
        if (i.marks.link) html = `<a>${html}</a>`;
        out += html;
        break;
      }
      case 'break':
        out += '<br>';
        break;
      case 'citation':
        out += `<span class="citation${isMissing(i.items) ? ' missing' : ''}">${escape(citationLabel(i.items, i.mode))}</span>`;
        break;
      case 'footnote':
        notes.n++;
        // The number is counted by the page, from where the note stands.
        out += `<sup class="footnote"${i.place ? ` data-place="${i.place}"` : ''} title="${escape(plain(i.content))}"></sup>`;
        break;
    }
  }
  return out;
}

function plain(list: Inline[]): string {
  return list
    .map((i) =>
      i.kind === 'text' ? i.text : i.kind === 'citation' ? citationLabel(i.items, i.mode) : ' ',
    )
    .join('');
}

function blocks(list: Block[], notes: { n: number }): string {
  let out = '';
  for (const b of list) {
    switch (b.kind) {
      case 'paragraph':
        out += `<p>${inlines(b.content, notes)}</p>`;
        break;
      case 'blockquote':
        out += `<blockquote>${blocks(b.content, notes)}</blockquote>`;
        break;
      case 'bullet_list':
        out += `<ul>${b.items.map((i) => `<li>${blocks(i, notes)}</li>`).join('')}</ul>`;
        break;
      case 'ordered_list':
        out += `<ol${b.start !== 1 ? ` start="${b.start}"` : ''}>${b.items
          .map((i) => `<li>${blocks(i, notes)}</li>`)
          .join('')}</ol>`;
        break;
    }
  }
  return out;
}

export function blocksHtml(list: Block[]): string {
  return blocks(list, { n: 0 });
}

/** The beginning of a text, cut at a block boundary once it is long enough. */
export function excerpt(list: Block[], characters = 600): { blocks: Block[]; cut: boolean } {
  const out: Block[] = [];
  let count = 0;
  const size = (b: Block): number =>
    b.kind === 'paragraph'
      ? plain(b.content).length
      : b.kind === 'blockquote'
        ? b.content.reduce((n, c) => n + size(c), 0)
        : b.items.reduce((n, item) => n + item.reduce((m, c) => m + size(c), 0), 0);
  for (const b of list) {
    if (count >= characters) return { blocks: out, cut: true };
    const s = size(b);
    if (b.kind === 'paragraph' && count + s > characters * 1.5) {
      // A long paragraph is cut within, at the end of a word.
      const budget = Math.max(120, characters - count);
      const content: Inline[] = [];
      let used = 0;
      for (const i of b.content) {
        if (i.kind !== 'text') {
          content.push(i);
          continue;
        }
        if (used + i.text.length <= budget) {
          content.push(i);
          used += i.text.length;
        } else {
          const room = budget - used;
          const piece = i.text.slice(0, room);
          const space = piece.lastIndexOf(' ');
          content.push({ ...i, text: (space > room * 0.5 ? piece.slice(0, space) : piece) + '…' });
          break;
        }
      }
      out.push({ kind: 'paragraph', content });
      return { blocks: out, cut: true };
    }
    out.push(b);
    count += s;
  }
  return { blocks: out, cut: false };
}
