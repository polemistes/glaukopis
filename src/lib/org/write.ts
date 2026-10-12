/**
 * The Org form of a project, written (ADR 0041, section 6): the file's
 * title and language, then every element as a headline at the depth it
 * has in the tree, the project first; under each its drawer of
 * properties, its comments, and its text. The project's headline holds
 * the kinds of the project and the templates it carries as well.
 */

import type { Block, Inline } from '$lib/project/model/text';
import { headlineSign } from './escape';
import { bodyLines, takenName, targetsOf, textContext, type TextContext } from './blocks';
import { writeLine } from './inline';
import {
  ownSlugs,
  writeComments,
  writeElementKinds,
  writeParagraphKinds,
  writeProperties,
  writeTemplate,
} from './properties';
import type { OrgElement, OrgProject, OrgTextOptions } from './types';

/** An element's name as the words of its headline, kept from reading as Org's own things at its start or its end. */
function headlineWords(name: Inline[], ctx: TextContext): string {
  let words = writeLine(name, ctx.writing, ctx.reading);
  if (headlineSign(words)) words = `\\${words}`;
  // Words that end as tags do: a backslash before the last colon.
  const tags = /(^|\s)(:[\w@#%:]+:)\s*$/.exec(words);
  if (tags)
    words = `${words.slice(0, words.lastIndexOf(':'))}\\:${words.slice(words.lastIndexOf(':') + 1)}`;
  return words;
}

function elementLines(
  e: OrgElement,
  p: OrgProject,
  ctx: TextContext,
  first: boolean,
  slugs: Map<string, string>,
): string[] {
  const named = new Map<string, number>();
  for (const k of p.elementKinds) named.set(k.name, (named.get(k.name) ?? 0) + 1);
  const kindName = (id: string) => {
    const kind = p.elementKinds.find((k) => k.id === id);
    return kind && named.get(kind.name) === 1 && kind.name.trim() && !/\n/.test(kind.name)
      ? kind.name
      : id;
  };
  const words = headlineWords(e.name, ctx);
  const head = `${'*'.repeat(Math.max(0, e.depth) + 1)}${words ? ` ${words}` : ''}${e.excluded ? ' :noexport:' : ''}`;
  const out = [
    head,
    ...writeProperties(e, { kindName, links: p.links.filter((l) => l.from === e.id) }),
  ];
  if (first) {
    if (p.elementKinds.length) out.push(...writeElementKinds(p.elementKinds));
    if (p.paragraphKinds.length) out.push(...writeParagraphKinds(p.paragraphKinds, slugs));
  }
  out.push(...writeComments(p.comments.filter((c) => c.element === e.id)));
  if (first)
    for (const [id, template] of Object.entries(p.templates))
      out.push('', ...writeTemplate(id, template));
  const body = bodyLines(e.blocks, ctx);
  if (body.length) out.push('', ...body);
  return out;
}

/** The whole project as Org. */
export function writeProject(p: OrgProject): string {
  const slugs = ownSlugs(p.paragraphKinds, takenName);
  const targets = new Map<string, 'fig' | 'tab' | 'eq'>();
  for (const e of p.elements) targetsOf(e.blocks, targets);
  const ctx = textContext({
    paragraphKinds: p.paragraphKinds,
    slugs,
    references: p.references,
    targets,
  });
  const out = [`#+TITLE: ${p.title.replace(/\s*\n\s*/g, ' ')}`];
  if (p.language) out.push(`#+LANGUAGE: ${p.language}`);
  out.push('#+BIBLIOGRAPHY: references.bib');
  for (const [n, e] of p.elements.entries())
    out.push('', ...elementLines(e, p, ctx, n === 0, slugs));
  return `${out.join('\n')}\n`;
}

/** One element's text as Org, for the clipboard. */
export function writeBlocks(blocks: Block[], options: OrgTextOptions = {}): string {
  const ctx = textContext({
    paragraphKinds: options.paragraphKinds ?? [],
    references: options.references ?? [],
    targets: options.targets ?? targetsOf(blocks),
  });
  const lines = bodyLines(blocks, ctx);
  return lines.length ? `${lines.join('\n')}\n` : '';
}
