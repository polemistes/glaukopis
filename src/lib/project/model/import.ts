/**
 * A document that was read from a file, made into a map of the project: its
 * title the centre, what stands before the first heading the text of the
 * centre, every heading an element under the heading above it, in the order
 * of the document. See `crates/core/src/import/document.rs`, which reads
 * the file, and `document.ts`, which goes the other way.
 */

import type { Imported } from '$lib/api/imported';
import { t } from '$lib/i18n';
import { writeBody, writeName } from './blocks';
import type { Project } from './project.svelte';
import { inlineText, type Block, type Inline } from './text';
import type { DocumentSettings } from './types';

export interface Made {
  map: string;
  /** The elements, the centre first, in the order of the document. */
  elements: string[];
  /** Ids of the references that are cited in it, each once. */
  cited: string[];
}

/** The title of a document as it is shown, and changed, before the map is made. */
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
    else if (b.kind === 'blockquote') citedIn(b.content, out);
    else if (b.kind === 'bullet_list' || b.kind === 'ordered_list')
      for (const item of b.items) citedIn(item, out);
    else if (b.kind === 'figure') line(b.caption);
    else if (b.kind === 'row') citedIn(b.items, out);
    else if (b.kind === 'table') {
      line(b.caption);
      for (const row of b.rows) for (const cell of row) citedIn(cell.content, out);
    }
  }
}

/**
 * Makes the map, in one step that undo takes back as one. `title` is the
 * title as it was changed by the one who brings the document in; when it is
 * as the document has it, the marks it has there are kept.
 */
export function makeMap(project: Project, imported: Imported, title?: string): Made {
  const given = titleOf(imported);
  const wanted = title?.replace(/\s+/g, ' ').trim() || given || t('project-untitled');
  const name: Inline[] =
    wanted === given ? imported.title : [{ kind: 'text', text: wanted, marks: {} }];

  // The centre, and then the parts that have a heading.
  const parts: { under: number; heading: Inline[]; blocks: Block[] }[] = [
    { under: 0, heading: name, blocks: [] },
  ];
  /** The part that was last met at each level; the centre is at none. */
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
    abstract: imported.abstract?.trim() || undefined,
    keywords: imported.keywords.map((k) => k.trim()).filter(Boolean),
    language: imported.language?.trim() || undefined,
  };

  project.checkpoint();
  const made = project.buildMap(
    wanted,
    parts,
    (part, nameOf, body) => {
      writeName(nameOf, parts[part].heading);
      writeBody(body, parts[part].blocks);
    },
    settings,
  );
  project.checkpoint();

  const cited = new Set<string>();
  for (const part of parts) citedIn(part.blocks, cited);
  return { map: made.map, elements: made.nodes, cited: [...cited] };
}
