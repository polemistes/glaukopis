/**
 * Citations made at once of what was read from a file, before a map is made
 * of it: those that Zotero made, of works the library has for certain. All
 * else waits for the writer. See ADR 0015.
 */

import type { Imported } from '$lib/api/imported';
import { foundSuggest, type Found, type FoundItem, type Suggestion } from '$lib/api/found';
import type { CiteItem } from '$lib/editor/schema';
import { foundAttrs } from '$lib/editor/schema';
import type { Block, Inline, InlineText } from '$lib/project/model/text';
import { withWords } from './change';
import { certain, citeItem } from './works';

/**
 * What becomes of a note that holds a citation, as the writer may have said
 * for all that follow (see `Going.how`): nothing said, and a note that is
 * nothing but the citation becomes a citation in the line, as the style of
 * the references then sets it, while a note that says more keeps it within;
 * `citation`, and every note that can becomes one, what else it says going
 * before and after its works; `within`, and the citation stands in the note.
 */
export interface AtOnceOptions {
  inNotes?: '' | 'citation' | 'within';
}

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

/** Words and nothing else, or nothing. */
const nothing = (text: string) => /^[\s.]*$/.test(text);

/**
 * The one citation that a note holds, with the words before and after it,
 * where the note can become a citation: all else in it must be words, and
 * no other citation that was found may be in it. Nothing otherwise.
 */
function noteAsCitation(content: Inline[]): { run: Found; before: string; after: string } | null {
  let run: Found | null = null;
  let before = '';
  let after = '';
  for (const piece of pieces(content)) {
    if (piece.run) {
      if (run) return null;
      run = piece.run;
      continue;
    }
    const inline = piece.inline;
    // Another citation that was found would be lost in the words; so would anything that is not words.
    if (inline.kind !== 'text' || inline.marks.found) return null;
    if (run) after += inline.text;
    else before += inline.text;
  }
  if (!run) return null;
  // The note ends with a full stop, which the style of the references sets itself.
  return { run, before: before.trim(), after: after.trim().replace(/\.$/, '').trim() };
}

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
      case 'script':
      case 'passage':
        return { ...b, content: line(b.content) };
      case 'blockquote':
        return { ...b, content: lines(b.content, change) };
      case 'verse':
        return { ...b, lines: b.lines.map((l) => ({ ...l, content: line(l.content) })) };
      case 'parallel':
        return { ...b, left: lines(b.left, change), right: lines(b.right, change) };
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
  options: AtOnceOptions = {},
): Promise<MadeAtOnce> {
  // What there is, in the order of the text, each citation once.
  const runs = new Map<string, Found>();
  for (const blocks of texts) {
    lines(blocks, (line) => {
      for (const piece of pieces(line))
        if (piece.run && !runs.has(piece.run.id)) runs.set(piece.run.id, piece.run);
      return line;
    });
  }
  if (!runs.size) return { texts, made: 0, cited: [] };

  const all = [...runs.values()];
  const answers = await suggest(all.flatMap((run) => run.items));
  let at = 0;
  const references = new Map<string, string[] | null>();
  for (const run of all) {
    const own = run.items.map((_, i) => certain(answers[at + i]));
    at += run.items.length;
    references.set(run.id, own.every((r): r is string => !!r) ? own : null);
  }

  let made = 0;
  const cited = new Set<string>();
  const citation = (run: Found, known: string[], before = '', after = ''): Inline => {
    made++;
    for (const id of known) cited.add(id);
    const items: CiteItem[] = run.items.map((item, i) => citeItem(known[i], item));
    return {
      kind: 'citation',
      items: before || after ? withWords(items, before, after) : items,
      mode: run.mode === 'intext' ? 'intext' : 'normal',
    };
  };
  const inNotes = options.inNotes ?? '';
  const out = texts.map((blocks) =>
    lines(blocks, (line) =>
      pieces(line).flatMap((piece): Inline[] => {
        if (piece.run) {
          const known = references.get(piece.run.id);
          return known ? [citation(piece.run, known)] : piece.text;
        }
        const inline = piece.inline;
        if (inline.kind !== 'footnote' || inNotes === 'within') return [inline];
        // A note that is a citation and nothing else becomes a citation in
        // the line, which the style sets in a note or in the line; one that
        // says more as well, where the writer has said so for all.
        const note = noteAsCitation(inline.content);
        if (!note) return [inline];
        const whole = nothing(note.before) && nothing(note.after);
        if (!whole && inNotes !== 'citation') return [inline];
        const known = references.get(note.run.id);
        return known ? [citation(note.run, known, note.before, note.after)] : [inline];
      }),
    ),
  );
  return { texts: out, made, cited: [...cited] };
}

/** The same, of a document that was read: its counts say what is left to go through. */
export async function citeAtOnceIn(
  imported: Imported,
  suggest: Suggest = foundSuggest,
  options: AtOnceOptions = {},
): Promise<{ imported: Imported; made: number }> {
  const { texts, made } = await citeAtOnce(
    imported.sections.map((s) => s.blocks),
    suggest,
    options,
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
