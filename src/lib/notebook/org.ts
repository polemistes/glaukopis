/**
 * The notebook written as Org (`docs/plans/the-notebook.md`, stage 4): one
 * text, `notebook.org` in the notebook's folder, with the pictures its notes
 * show and the files they hold beside it. A copy to be read, never read
 * back, as a project's readable copy is (`org/folder.ts`).
 *
 * A heading for each box, in its order; under it one for each of its
 * notes, the newest first, with its tags as Org's tags and a drawer of
 * properties (its id, when it was made, what became of it); then its
 * pieces: the writer's own as the text of an element is written, a passage
 * as a quotation with its source under it, a picture as a figure, a file as
 * a link to it; and at its foot its links to other notes, as Org's links to
 * an id.
 */

import { library } from '$lib/state/library.svelte';
import { t } from '$lib/i18n';
import { headlineSign } from '$lib/org/escape';
import { writeBlocks } from '$lib/org/write';
import { FIRST_BOX } from './model/boxes';
import type { Notebook } from './model/notebook.svelte';
import { eachBlock, firstFileName } from './model/pieces';
import type { NoteRecord, Piece, Source, Went } from './model/types';
import { sourceLabel } from './sources';

/** The notebook as Org, and what goes beside it. */
export interface NotebookOrg {
  org: string;
  /** The pictures its notes show, by their hashes: written into `pictures/`. */
  pictures: string[];
  /** The files its notes hold, by their hashes, with the name each is written by into `files/`. */
  files: { hash: string; name: string }[];
}

/** What is said in the words of the interface: given in the tests, the interface's own otherwise. */
export interface OrgWords {
  title: string;
  firstBox: string;
  emptyNote: string;
  went: (what: Went['what']) => string;
  source: (source: Source | null) => string;
  /** The key of a reference of the library, where it is known. */
  key: (reference: string) => string | null;
}

function interfaceWords(): OrgWords {
  return {
    title: t('notebook-title'),
    firstBox: t('notebook-org-first-box'),
    emptyNote: t('notebook-empty-note'),
    went: (what) => t(`notebook-went-${what}`),
    source: sourceLabel,
    key: (reference) => library.get(reference)?.key || null,
  };
}

/** Words in one line. */
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Words as a heading's: in one line, kept from reading as Org's own signs at its start or as tags at its end. */
function headingWords(words: string): string {
  let out = oneLine(words);
  if (headlineSign(out)) out = `\\${out}`;
  if (/(^|\s):[^\s]+:$/.test(out)) out = `${out.slice(0, out.lastIndexOf(':'))}\\:`;
  return out;
}

/** A tag as Org's tags can hold it: letters, numbers, `_`, `@`, `#` and `%`; any other sign made `_`. */
export function orgTag(tag: string): string {
  return tag.replace(/[^\p{L}\p{N}_@#%]/gu, '_');
}

/** Words inside the brackets of a link. */
const inLink = (s: string) => s.replace(/[\\[\]]/g, (c) => `\\${c}`);

/** A text written by `writeBlocks`, as its lines. */
const linesOf = (text: string): string[] => (text ? text.replace(/\n$/, '').split('\n') : []);

/** A name a file can be written by into a folder: without the signs that part folders, and not one taken already. */
function fileName(name: string, hash: string, taken: Set<string>): string {
  let base = name.replace(/[/\\]/g, '_').trim();
  if (!base || /^\.+$/.test(base)) base = hash.slice(0, 16);
  let out = base;
  const dot = base.lastIndexOf('.');
  const [stem, ending] = dot > 0 ? [base.slice(0, dot), base.slice(dot)] : [base, ''];
  for (let n = 2; taken.has(out.toLowerCase()); n++) out = `${stem} (${n})${ending}`;
  taken.add(out.toLowerCase());
  return out;
}

/** The whole notebook as one Org text, with the pictures and the files to be written beside it. */
export function orgOfNotebook(notebook: Notebook, words: OrgWords = interfaceWords()): NotebookOrg {
  const pictures = new Set<string>();
  const files = new Map<string, string>();
  const takenNames = new Set<string>();
  const fileNamed = (hash: string, name: string) => {
    let written = files.get(hash);
    if (written === undefined) {
      written = fileName(name, hash, takenNames);
      files.set(hash, written);
    }
    return written;
  };
  /** How a note is called, as its row in the list calls it: its name, how it begins, or the name of the first file or picture it holds. */
  const called = (note: NoteRecord | undefined) =>
    oneLine(note?.name || note?.begins || (note ? firstFileName(note.pieces) : '')) ||
    words.emptyNote;

  /** The line under a quotation: its source, with the address or the key of the reference where it has one. */
  const sourceLine = (passage: string): string => {
    const p = notebook.passages.get(passage);
    const source = p?.source ? (notebook.sources.get(p.source) ?? null) : null;
    const parts = [oneLine(words.source(source))];
    if (source?.sort === 'web' && source.url.trim()) parts.push(source.url.trim());
    const reference = source?.sort === 'reference' ? source.reference : source?.reference;
    const key = reference ? words.key(reference) : null;
    if (key) parts.push(`[cite:@${key}]`);
    return `— ${parts.filter(Boolean).join(', ')}`;
  };

  const pieceLines = (piece: Piece): string[] => {
    switch (piece.kind) {
      case 'own':
        return linesOf(writeBlocks(piece.blocks));
      case 'passage':
        return [
          '#+BEGIN_QUOTE',
          ...linesOf(writeBlocks(piece.blocks)),
          '#+END_QUOTE',
          sourceLine(piece.passage),
        ];
      case 'figure':
        return linesOf(writeBlocks(piece.blocks));
      case 'file': {
        const name = fileNamed(piece.hash, piece.name);
        return [`[[file:${inLink(`files/${name}`)}][${inLink(name)}]]`];
      }
    }
  };

  const wentText = (w: Went) =>
    [words.went(w.what), oneLine(w.name ?? ''), w.when].filter(Boolean).join(' · ');

  const noteLines = (note: NoteRecord): string[] => {
    const tags = [...new Set(note.tags.map(orgTag).filter(Boolean))];
    const head = `** ${headingWords(called(note))}${tags.length ? ` :${tags.join(':')}:` : ''}`;
    const said: [string, string][] = [
      ['ID', note.id],
      ['MADE', note.made],
      ...note.went.map((w, i): [string, string] => [i ? 'WENT+' : 'WENT', wentText(w)]),
    ];
    const width = Math.max(...said.map(([k]) => k.length)) + 3;
    const out = [
      head,
      ':PROPERTIES:',
      ...said.map(([k, v]) => `${`:${k}:`.padEnd(width)}${v}`.trimEnd()),
      ':END:',
    ];
    for (const piece of note.pieces) {
      const lines = pieceLines(piece);
      if (lines.length) out.push('', ...lines);
      if (piece.kind !== 'file')
        eachBlock(piece.blocks, (b) => {
          if (b.kind === 'figure' && b.file) pictures.add(b.file);
        });
    }
    const links = notebook.linksAt(note.id);
    if (links.length) {
      out.push('');
      for (const link of links) {
        const other = link.from === note.id ? link.to : link.from;
        const label = oneLine(link.label);
        out.push(
          `[[id:${inLink(other)}][${inLink(called(notebook.note(other)))}]]${label ? ` ${label}` : ''}`,
        );
      }
    }
    return out;
  };

  const out = [`#+TITLE: ${oneLine(words.title)}`];
  for (const box of notebook.boxes) {
    const name = box.name || (box.id === FIRST_BOX ? words.firstBox : '');
    out.push('', `* ${headingWords(name)}`.trimEnd());
    for (const note of notebook.notesIn(box.id)) out.push('', ...noteLines(note));
  }
  return {
    org: `${out.join('\n')}\n`,
    pictures: [...pictures].sort(),
    files: [...files].map(([hash, name]) => ({ hash, name })),
  };
}
