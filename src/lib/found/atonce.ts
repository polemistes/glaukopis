/**
 * Citations made at once of what was read from a file, before a map is made
 * of it: those that Zotero made, of works the library has for certain. All
 * else waits for the writer. See ADR 0015.
 */

import type { Imported } from '$lib/api/imported';
import { foundSuggest, type Found, type FoundItem, type Suggestion } from '$lib/api/found';
import { foundAttrs } from '$lib/editor/schema';
import type { Block, Inline, InlineText } from '$lib/project/model/text';
import { certain, citeItem } from './works';

/** Asks the library for the references of works, as `found_suggest` does. */
export type Suggest = (items: FoundItem[]) => Promise<Suggestion[][]>;

export interface MadeAtOnce {
  /** The texts, with citations where they were made. */
  texts: Block[][];
  /** How many citations were made. */
  made: number;
  /** Ids of the references that are cited by them, each once. */
  cited: string[];
}

/** A piece of a line: something that is left as it is, or the pieces of text of one citation that was found. */
type Piece = { run: Found; text: InlineText[] } | { run: null; inline: Inline };

/** Whether it is to be made a citation at once, if the library has its works. */
const wanted = (found: Found | null): found is Found =>
  !!found && !found.left && found.by === 'zotero' && found.items.length > 0;

function pieces(line: Inline[]): Piece[] {
  const out: Piece[] = [];
  for (const inline of line) {
    const found = inline.kind === 'text' ? (foundAttrs(inline.marks.found) as Found | null) : null;
    const last = out[out.length - 1];
    if (inline.kind === 'text' && wanted(found)) {
      // Other marks cut the text of a citation in pieces: they are one.
      if (last?.run && last.run.id === found.id) last.text.push(inline);
      else out.push({ run: found, text: [inline] });
    } else out.push({ run: null, inline });
  }
  return out;
}

/** Goes through every line of a text, the lines of its notes after the line they stand in. */
function lines(blocks: Block[], change: (line: Inline[]) => Inline[]): Block[] {
  const line = (inlines: Inline[]): Inline[] =>
    change(inlines).map((i) => (i.kind === 'footnote' ? { ...i, content: change(i.content) } : i));
  return blocks.map((b): Block => {
    switch (b.kind) {
      case 'paragraph':
        return { ...b, content: line(b.content) };
      case 'blockquote':
        return { ...b, content: lines(b.content, change) };
      case 'bullet_list':
      case 'ordered_list':
        return { ...b, items: b.items.map((item) => lines(item, change)) };
      case 'figure':
        return { ...b, caption: line(b.caption) };
      case 'table':
        return {
          ...b,
          caption: line(b.caption),
          rows: b.rows.map((row) =>
            row.map((cell) => ({ ...cell, content: lines(cell.content, change) })),
          ),
        };
      case 'row':
        return { ...b, items: lines(b.items, change) };
      default:
        return b;
    }
  });
}

/**
 * Makes citations of the text that Zotero made as citations, where the
 * library has every work of one for certain: the pieces of its text become
 * one citation. What is not certain stays the text it was, with its mark.
 */
export async function citeAtOnce(
  texts: Block[][],
  suggest: Suggest = foundSuggest,
): Promise<MadeAtOnce> {
  // What there is, in the order of the text.
  const runs: Found[] = [];
  for (const blocks of texts) {
    lines(blocks, (line) => {
      for (const piece of pieces(line)) if (piece.run) runs.push(piece.run);
      return line;
    });
  }
  if (!runs.length) return { texts, made: 0, cited: [] };

  const answers = await suggest(runs.flatMap((run) => run.items));
  let at = 0;
  const references = runs.map((run) => {
    const own = run.items.map((_, i) => certain(answers[at + i]));
    at += run.items.length;
    return own.every((r): r is string => !!r) ? own : null;
  });

  let n = 0;
  let made = 0;
  const cited = new Set<string>();
  const out = texts.map((blocks) =>
    lines(blocks, (line) =>
      pieces(line).flatMap((piece): Inline[] => {
        if (!piece.run) return [piece.inline];
        const known = references[n++];
        if (!known) return piece.text;
        made++;
        for (const id of known) cited.add(id);
        return [
          {
            kind: 'citation',
            items: piece.run.items.map((item, i) => citeItem(known[i], item)),
            mode: piece.run.mode === 'intext' ? 'intext' : 'normal',
          },
        ];
      }),
    ),
  );
  return { texts: out, made, cited: [...cited] };
}

/** The same, of a document that was read: its counts say what is left to go through. */
export async function citeAtOnceIn(
  imported: Imported,
  suggest: Suggest = foundSuggest,
): Promise<{ imported: Imported; made: number }> {
  const { texts, made } = await citeAtOnce(
    imported.sections.map((s) => s.blocks),
    suggest,
  );
  if (!made) return { imported, made: 0 };
  let works = 0;
  for (const blocks of texts)
    lines(blocks, (line) => {
      for (const i of line) if (i.kind === 'citation') works += i.items.length;
      return line;
    });
  const before = imported.counts;
  return {
    made,
    imported: {
      ...imported,
      sections: imported.sections.map((s, i) => ({ ...s, blocks: texts[i] })),
      counts: {
        ...before,
        cited: works,
        found: Math.max(0, before.found - made),
        foundMade: Math.max(0, before.foundMade - made),
      },
    },
  };
}
