/**
 * The words of a language as a project of Glaukopis, to be read through and
 * mended in the application itself, with its spelling, its search and its
 * history, and written back as Fluent files (ADR 0034).
 *
 * The project has a tree for each Fluent file (`common`, `editor`, …),
 * under its own element, and under that an element for each part of a
 * message: its name is the name of the message (`common-cancel`, or
 * `field-title.hint` for an attribute), and its text is the English, as a
 * quotation in foreign words, with the note the English file has for
 * translators, and after it the words of the language, as plain
 * paragraphs, which are what is mended.
 * Each element keeps which part it is, and its words as they were when the
 * project was made (`was`), so that only what was changed is written back,
 * and nothing that was changed in the files meanwhile.
 */

import { writeBody } from '$lib/project/model/blocks';
import { TIDY, type Project } from '$lib/project/model/project.svelte';
import { fillTitle, paragraph, type Block, type Inline } from '$lib/project/model/text';
import { PROJECT } from '$lib/project/model/types';
import { readFile, tidy, type Change } from './fluent';

/** The name under which a project says it holds the words of a language, and an element which part it is. */
export const WORDS = 'words';

/** What a project of words says of itself. */
export interface ProjectWords {
  language: string;
}

/** What an element of such a project says of itself. */
export interface ElementWords {
  file: string;
  key: string;
  /** The words as they were when the project was made, or last written out. */
  was: string;
}

/** The language whose words a project holds, or nothing where it is no project of words. */
export function projectWords(project: Project): ProjectWords | null {
  const said = project.yMeta.get(WORDS) as ProjectWords | undefined;
  return said && typeof said.language === 'string' ? said : null;
}

function elementWords(value: unknown): ElementWords | null {
  const w = value as ElementWords | undefined;
  return w && typeof w.file === 'string' && typeof w.key === 'string' ? w : null;
}

/** Lines as inline content: a break within the paragraph where a line ends. */
function lines(text: string, marks: InlineMarks = {}): Inline[] {
  const out: Inline[] = [];
  text.split('\n').forEach((line, i) => {
    if (i > 0) out.push({ kind: 'break' });
    if (line) out.push({ kind: 'text', text: line, marks });
  });
  return out;
}
type InlineMarks = Record<string, Record<string, unknown> | true>;

/** The text of an element as it is shown, for its words. */
export function elementText(english: string, note: string, words: string, tag: string): Block[] {
  const foreign: InlineMarks = tag === 'en' ? {} : { kind: { name: 'foreign', lang: 'en' } };
  const quoted = [paragraph(lines(english, foreign), 'quote')];
  if (note) quoted.push(paragraph(lines(note, { ...foreign, em: true }), 'quote'));
  return [...quoted, paragraph(lines(words))];
}

/**
 * Fills a project with the words of a language: a tree under the project
 * for each file of the English, an element for each part of its messages.
 * `own` are the files of the language, which may lack parts or files, as a
 * translation that is not done does. The project is in the language, so
 * that its spelling is checked.
 */
export function fillWords(
  project: Project,
  tag: string,
  english: Map<string, string>,
  own: Map<string, string>,
): number {
  project.setLanguage(tag);
  project.transact(() => project.yMeta.set(WORDS, { language: tag } satisfies ProjectWords));
  let count = 0;
  for (const [file, text] of english) {
    const en = readFile(text);
    if (!en.messages.length) continue;
    const mine = own.has(file) ? readFile(own.get(file)!) : null;
    // A file is one branch, its top and a part for each part of each
    // message, made in one step: made one by one, each was placed among
    // the others by the tree of the whole project, made again for each, and
    // the words of a language took the square of their number.
    const parts = en.messages.flatMap((m) =>
      m.parts.map((part) => ({
        key: part.key,
        text: en.parts.get(part.key)!.text,
        note: part.key.includes('.') ? '' : m.comment,
        was: mine?.parts.get(part.key)?.text ?? '',
      })),
    );
    const made = project.buildBranch(
      PROJECT,
      file,
      [{ under: 0 }, ...parts.map(() => ({ under: 0 }))],
      (i, title, body) => {
        if (i === 0) return fillTitle(title, file.replace(/\.ftl$/, ''));
        const part = parts[i - 1];
        fillTitle(title, part.key);
        writeBody(body, elementText(part.text, part.note, part.was, tag));
      },
    );
    if (!made) continue;
    project.transact(() =>
      parts.forEach(({ key, was }, i) =>
        project.yNodes
          .get(made.nodes[i + 1])
          ?.set(WORDS, { file, key, was } satisfies ElementWords),
      ),
    );
    count += parts.length;
  }
  project.undoManager.clear();
  return count;
}

/** The words of an element as they are written in it: what follows the quotation, a line to a line. */
export function wordsIn(blocks: Block[]): string {
  const inline = (content: Inline[]) =>
    content.map((i) => (i.kind === 'text' ? i.text : i.kind === 'break' ? '\n' : '')).join('');
  // The English is quoted; the words are the paragraphs that are not.
  const out = blocks.flatMap((b) =>
    b.kind === 'paragraph' && b.name !== 'quote' ? [inline(b.content)] : [],
  );
  return tidy(out.join('\n'));
}

/** What was changed in a project of words since it was made or last written out. */
export function changesIn(project: Project): Change[] {
  const changes: Change[] = [];
  for (const [id, node] of project.yNodes.entries()) {
    const w = elementWords(node.get(WORDS));
    if (!w) continue;
    const text = wordsIn(project.blocksOf(id));
    if (text !== tidy(w.was)) changes.push({ file: w.file, key: w.key, text, was: tidy(w.was) });
  }
  return changes;
}

/** After the words were written out: what was written is what the elements now were. */
export function written(project: Project, done: Change[]) {
  const wanted = new Map(done.map((c) => [`${c.file}\u0000${c.key}`, c.text]));
  // Saved, but not undone: undoing it would make the words written out look unwritten.
  project.doc.transact(() => {
    for (const [, node] of project.yNodes.entries()) {
      const w = elementWords(node.get(WORDS));
      const text = w ? wanted.get(`${w.file}\u0000${w.key}`) : undefined;
      if (w && text !== undefined) node.set(WORDS, { ...w, was: text } satisfies ElementWords);
    }
  }, TIDY);
}
