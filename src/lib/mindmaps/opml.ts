/**
 * A mind map written as OPML, the outline that outliners share: each topic
 * an `outline` with its name as plain words and its text as plain words in
 * `_note`, as the outliners have it; one in another. OPML has no more: no
 * marks, no associations, nothing else said of a topic. It is read as a
 * document already (*A project from a document…*).
 */

import { escapeAttr } from './html';
import type { MindMap, Topic } from './map';

const escapeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Writes a mind map as OPML 2.0; `plain` gives a topic's text as plain words, or nothing. */
export function writeOpml(map: MindMap, plain: (t: Topic) => string): string {
  const words = (t: Topic) =>
    t.name
      .map((i) => (i.kind === 'text' ? i.text : ''))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '  <head>',
    `    <title>${escapeText(map.name)}</title>`,
    '  </head>',
    '  <body>',
  ];
  const write = (t: Topic, pad: string) => {
    const note = plain(t);
    const attrs = `text="${escapeAttr(words(t))}"${note ? ` _note="${escapeAttr(note)}"` : ''}`;
    if (!t.children.length) {
      lines.push(`${pad}<outline ${attrs}/>`);
      return;
    }
    lines.push(`${pad}<outline ${attrs}>`);
    for (const c of t.children) write(c, `${pad}  `);
    lines.push(`${pad}</outline>`);
  };
  write(map.root, '    ');
  lines.push('  </body>', '</opml>', '');
  return lines.join('\n');
}
