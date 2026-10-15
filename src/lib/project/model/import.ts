/**
 * A document that was read from a file, made into a branch of the project:
 * its title the top, what stands before the first heading the text of the
 * top, every heading an element under the heading above it, in the order
 * of the document. See `crates/core/src/import/document.rs`, which reads
 * the file, and `document.ts`, which goes the other way.
 */

import type { Imported } from '$lib/api/imported';
import { t, term } from '$lib/i18n';
import { writeBody, writeName } from './blocks';
import type { Project } from './project.svelte';
import { inlineText, paragraph, type Block, type Inline } from './text';
import type { DocumentSettings } from './types';

export interface Made {
  /** The element at the top of the branch. */
  top: string;
  /** The elements, the top first, in the order of the document. */
  elements: string[];
  /** Ids of the references that are cited in it, each once. */
  cited: string[];
}

/** The title of a document as it is shown, and changed, before the branch is made. */
export function titleOf(imported: Imported): string {
  return inlineText(imported.title).replace(/\s+/g, ' ').trim();
}

function citedIn(blocks: Block[], out: Set<string>) {
  const line = (inlines: Inline[]) => {
    for (const i of inlines) {
      if (i.kind === 'citation') for (const item of i.items) out.add(item.id);
      else if (i.kind === 'footnote') line(i.content);
    }
  };
  for (const b of blocks) {
    if (b.kind === 'paragraph') line(b.content);
    else if (b.kind === 'parallel') {
      citedIn(b.left, out);
      citedIn(b.right, out);
    } else if (b.kind === 'figure') line(b.caption);
    else if (b.kind === 'row') citedIn(b.items, out);
    else if (b.kind === 'table') {
      line(b.caption);
      for (const row of b.rows) for (const cell of row) citedIn(cell.content, out);
    }
  }
}

/**
 * What the writer said a style found is (ADR 0045): a kind of the
 * catalogue or of the project, by its id (`text` for plain text), or a kind
 * of their own to be made, by its name.
 */
export type StyleChoice = { kind: string } | { own: string };

/** The prefix of the name of a paragraph of a style found, before the writer has said what it is. */
const STYLE = 'style:';

function renamedBlocks(blocks: Block[], rename: (name: string) => string): Block[] {
  return blocks.map((b): Block => {
    switch (b.kind) {
      case 'paragraph': {
        const name = rename(b.name);
        return name === b.name ? b : { ...b, name };
      }
      case 'parallel':
        return { ...b, left: renamedBlocks(b.left, rename), right: renamedBlocks(b.right, rename) };
      case 'row':
        return { ...b, items: renamedBlocks(b.items, rename) };
      case 'table':
        return {
          ...b,
          rows: b.rows.map((row) =>
            row.map((cell) => ({ ...cell, content: renamedBlocks(cell.content, rename) })),
          ),
        };
      default:
        return b;
    }
  });
}

/**
 * A document with the paragraphs of its styles found named by the kinds
 * they were given, by the number of the style: `style:<n>` becomes the id
 * of the kind given to style `n`, or `text` where none was. Wherever
 * paragraphs stand, in sections, side by side, in rows and in tables. The
 * styles are then said.
 */
export function nameStyles(imported: Imported, kinds: ReadonlyMap<number, string>): Imported {
  const rename = (name: string) => {
    if (!name.startsWith(STYLE)) return name;
    return kinds.get(Number(name.slice(STYLE.length))) || 'text';
  };
  return {
    ...imported,
    sections: imported.sections.map((s) => ({ ...s, blocks: renamedBlocks(s.blocks, rename) })),
    styles: [],
  };
}

/**
 * The kinds the styles found were given, by the number of the style; the
 * kinds of the writer's own among them are made first, based on text,
 * with no look, as every kind is made, last among the project's. A name
 * the project already has a kind of paragraph by is that kind, and a name
 * given to two styles makes one kind. A style given no kind, or a name of
 * nothing but spaces, is text.
 */
function styleKinds(
  project: Project,
  choices: ReadonlyMap<number, StyleChoice> | undefined,
): Map<number, string> {
  const out = new Map<number, string>();
  if (!choices) return out;
  const key = (name: string) => name.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
  const byName = new Map(
    project.passageKinds.filter((k) => k.family === 'paragraph').map((k) => [key(k.name), k.id]),
  );
  for (const [style, choice] of choices) {
    if ('kind' in choice) {
      if (choice.kind) out.set(style, choice.kind);
      continue;
    }
    const name = key(choice.own);
    if (!name) continue;
    let id = byName.get(name);
    if (!id) {
      id =
        project.createPassageKind({
          name: choice.own,
          family: 'paragraph',
          basedOn: 'text',
          look: {},
        }) ?? undefined;
      if (!id) continue;
      byName.set(name, id);
    }
    out.set(style, id);
  }
  return out;
}

/**
 * Makes the branch under an element, in one step that undo takes back as
 * one. `title` is the title as it was changed by the one who brings the
 * document in; when it is as the document has it, the marks it has there
 * are kept. `styles`: what the writer said each style found is, by its
 * number; the kinds of their own named there are made in the project, and
 * a style not said is text.
 */
export function makeImported(
  project: Project,
  under: string,
  read: Imported,
  title?: string,
  styles?: ReadonlyMap<number, StyleChoice>,
): Made | null {
  const imported = nameStyles(read, styleKinds(project, styles));
  const given = titleOf(imported);
  const wanted = title?.replace(/\s+/g, ' ').trim() || given || t('project-untitled');
  const name: Inline[] =
    wanted === given ? imported.title : [{ kind: 'text', text: wanted, marks: {} }];

  // The top, and then the parts that have a heading.
  const parts: { under: number; heading: Inline[]; blocks: Block[] }[] = [
    { under: 0, heading: name, blocks: [] },
  ];
  /** The part that was last met at each level; the top is at none. */
  const above: number[] = [0];
  for (const section of imported.sections) {
    if (section.level <= 0) {
      parts[0].blocks.push(...section.blocks);
      continue;
    }
    // No deeper than one under what stands before it.
    const level = Math.min(Math.round(section.level), above.length);
    above.length = level;
    parts.push({ under: above[level - 1], heading: section.heading, blocks: section.blocks });
    above.push(parts.length - 1);
  }

  const settings: DocumentSettings = {
    subtitle: imported.subtitle?.trim() || undefined,
    authors: imported.authors.filter((a) => a.name?.trim()),
    date: imported.date?.trim() || undefined,
    keywords: imported.keywords.map((k) => k.trim()).filter(Boolean),
    language: imported.language?.trim() || undefined,
  };

  // The abstract is an element, first under the top, of the kind `abstract` (ADR 0038).
  const abstract = imported.abstract?.trim() ?? '';
  if (abstract) {
    for (const part of parts) if (part.under > 0) part.under += 1;
    const language = settings.language ?? project.documentOf(under).settings.language;
    parts.splice(1, 0, {
      under: 0,
      heading: [
        { kind: 'text', text: term(language, 'document-abstract') ?? 'Abstract', marks: {} },
      ],
      blocks: abstract
        .split(/\n+/)
        .filter((line) => line.trim())
        .map((line) => paragraph([{ kind: 'text', text: line.trim(), marks: {} }])),
    });
  }

  project.checkpoint();
  const made = project.buildBranch(
    under,
    wanted,
    parts,
    (part, nameOf, body) => {
      writeName(nameOf, parts[part].heading);
      writeBody(body, parts[part].blocks);
    },
    settings,
  );
  if (made && abstract) project.setKind([made.nodes[1]], 'abstract');
  project.checkpoint();
  if (!made) return null;

  const cited = new Set<string>();
  for (const part of parts) citedIn(part.blocks, cited);
  return { top: made.top, elements: made.nodes, cited: [...cited] };
}
