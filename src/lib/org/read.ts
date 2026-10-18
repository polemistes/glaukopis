/**
 * The Org form of a project, read (ADR 0041, "Reading an Org file"). The
 * reader is tolerant and never fails on what a file holds: a sign it does
 * not know stays the text it is; an unknown keyword line is ignored; an
 * unknown block makes a kind of the writer's own, based on text; Org's own
 * things that have no place here — tags other than `noexport`, states of
 * tasks, priorities, scheduling, drawers it does not know, properties it
 * does not know — are kept as text in a draft paragraph at the start of
 * the element's text, so that nothing is lost. A file that does not begin
 * with the project's headline is taken whole as the project: what stands
 * before the first headline is its text, and every headline stands under
 * it.
 */

import type { Template } from '$lib/api/templates';
import type { Block } from '$lib/project/model/text';
import type { KindRecord, PassageKindRecord, RefRecord } from '$lib/project/model/types';
import { HEADLINE_WORDS, headlineSign, slug } from './escape';
import { keptAsDraft, readBody, textContext, type TextContext } from './blocks';
import { readLine } from './inline';
import {
  readComments,
  readElementKinds,
  readParagraphKinds,
  readProperties,
  readTemplate,
} from './properties';
import type { OrgElement, OrgLink, OrgProject, OrgTextOptions, OrgThread } from './types';

const HEADLINE = /^(\*+)(?:[ \t]+(.*?))?[ \t]*$/;

/** A section of the file: a headline and the lines under it, to the next. */
interface Section {
  stars: number;
  title: string;
  lines: string[];
}

/** The end of a drawer that begins at `from`: the line of its `:END:`, or -1. */
function drawerEnd(lines: string[], from: number): number {
  for (let i = from + 1; i < lines.length; i++) if (/^\s*:END:\s*$/i.test(lines[i])) return i;
  return -1;
}

/** The words of a headline: its state, priority and tags apart from its name; what has no place here, kept. */
function readHeadline(
  title: string,
  words: string[],
): { name: string; excluded: boolean; kept: string[] } {
  const kept: string[] = [];
  let rest = title;
  let excluded = false;
  let tagged = '';
  const tags = /(^|\s+)(:(?:[\w@#%]+:)+)\s*$/.exec(rest);
  if (tags) {
    rest = rest.slice(0, tags.index);
    const names = tags[2].split(':').filter(Boolean);
    if (names.includes('noexport')) excluded = true;
    const others = names.filter((n) => n !== 'noexport');
    if (others.length) tagged = `:${others.join(':')}:`;
  }
  if (rest.startsWith('\\') && headlineSign(rest.slice(1))) {
    // A backslash before what would read as Org's own: the words as they are.
    rest = rest.slice(1);
  } else {
    const state = new RegExp(`^(${words.join('|')})(\\s+|$)`).exec(rest);
    if (state) {
      kept.push(state[1]);
      rest = rest.slice(state[0].length);
    }
    const priority = /^\[#(.)\](\s+|$)/.exec(rest);
    if (priority) {
      kept.push(`[#${priority[1]}]`);
      rest = rest.slice(priority[0].length);
    }
    const comment = /^COMMENT(\s+|$)/.exec(rest);
    if (comment) {
      kept.push('COMMENT');
      rest = rest.slice(comment[0].length);
    }
  }
  if (tagged) kept.push(tagged);
  return { name: rest, excluded, kept };
}

/** The keywords that are states of tasks: Org's own, and those the file names. */
function taskWords(preamble: string[]): string[] {
  const words = new Set(HEADLINE_WORDS.filter((w) => w !== 'COMMENT'));
  for (const line of preamble) {
    const m = /^#\+(?:SEQ_|TYP_)?TODO:\s*(.*)$/i.exec(line.trim());
    if (m)
      for (const w of m[1].split(/\s+/)) if (w && w !== '|') words.add(w.replace(/\(.*\)$/, ''));
  }
  return [...words].filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

/**
 * Reads a whole project from its Org form. `references` give the ids of
 * the works cited by their keys. It never fails: what could not be read at
 * all is kept as it is, in a draft paragraph of the project.
 */
export function readProject(text: string, references: RefRecord[] = []): OrgProject {
  try {
    return readWhole(text, references);
  } catch (error) {
    // A fault of the reader, not of the file: the log keeps it, so that it is mended.
    console.error(
      'the Org file could not be read as a project; its text is kept as a draft',
      error,
    );
    return {
      title: '',
      language: null,
      elements: [{ ...blankElement('project', 0), blocks: [keptAsDraft(text.split(/\r?\n/))] }],
      elementKinds: [],
      paragraphKinds: [],
      templates: {},
      links: [],
      comments: [],
      references,
    };
  }
}

function readWhole(text: string, references: RefRecord[]): OrgProject {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const sections: Section[] = [];
  const preamble: string[] = [];
  for (const line of lines) {
    const head = HEADLINE.exec(line);
    if (head) sections.push({ stars: head[1].length, title: head[2] ?? '', lines: [] });
    else if (sections.length) sections[sections.length - 1].lines.push(line);
    else preamble.push(line);
  }
  let title = '';
  let language: string | null = null;
  const preambleBody: string[] = [];
  for (const line of preamble) {
    const kw = /^#\+([^:\s]+):\s?(.*)$/.exec(line.trim());
    if (kw && kw[1].toUpperCase() === 'TITLE') title = kw[2].trim();
    else if (kw && kw[1].toUpperCase() === 'LANGUAGE') language = kw[2].trim() || null;
    else if (!kw) preambleBody.push(line);
  }
  const words = taskWords(preamble);

  const project: OrgProject = {
    title,
    language,
    elements: [],
    elementKinds: [],
    paragraphKinds: [],
    templates: {},
    links: [],
    comments: [],
    references,
  };
  const ownSlugs = new Map<string, string>();
  let ctx: TextContext | null = null;
  const context = () =>
    (ctx ??= textContext({
      paragraphKinds: project.paragraphKinds,
      slugs: ownSlugs,
      references,
      targets: new Map(),
      make: (name, isWords) => {
        const id = `own-${slug(name)}`;
        if (!project.paragraphKinds.some((k) => k.id === id)) {
          const kind: PassageKindRecord = {
            id,
            name,
            family: isWords ? 'words' : 'paragraph',
            basedOn: isWords ? '' : 'text',
            look: {},
            order: String(project.paragraphKinds.length),
          };
          project.paragraphKinds.push(kind);
        }
        ownSlugs.set(id, name);
        return id;
      },
    }));

  const synthetic =
    !sections.length || !/^\s*:ID:\s+project\s*$/im.test(sectionDrawer(sections[0]));
  if (synthetic) {
    project.elements.push({
      ...blankElement('project', 0),
      name: title ? [{ kind: 'text', text: title, marks: {} }] : [],
      blocks: readBody(preambleBody, context()),
    });
  }

  let made = 0;
  for (const section of sections) {
    const head = readHeadline(section.title, words);
    const element = blankElement('', synthetic ? section.stars : section.stars - 1);
    element.excluded = head.excluded;
    const kept: string[][] = head.kept.length ? [head.kept] : [];
    const threads: OrgThread[] = [];
    const links: { to: string; label: string }[] = [];
    let kindName: string | null = null;
    const ls = section.lines;
    let i = 0;
    if (ls[i] !== undefined && /^\s*(SCHEDULED|DEADLINE|CLOSED):/.test(ls[i]))
      kept.push([ls[i++].trim()]);
    const commentLines: string[][] = [];
    for (;;) {
      while (i < ls.length && !ls[i].trim()) i++;
      if (i >= ls.length) break;
      const t = ls[i].trim();
      const drawer = /^:([\w-]+):$/.exec(t);
      if (drawer) {
        const end = drawerEnd(ls, i);
        if (end < 0) break;
        const inner = ls.slice(i + 1, end);
        const name = drawer[1].toUpperCase();
        if (name === 'PROPERTIES') {
          const got = readProperties(inner);
          element.id = got.id ?? element.id;
          kindName = got.kind;
          element.status = got.status;
          element.when = got.when;
          element.heading = got.heading;
          element.include = got.include;
          element.origin = got.origin;
          element.pos = got.pos;
          element.collapsed = got.collapsed;
          element.document = got.document;
          element.timeline = got.timeline;
          links.push(...got.links);
          if (got.unknown.length) kept.push([':PROPERTIES:', ...got.unknown, ':END:']);
        } else if (name === 'ELEMENT_KINDS') project.elementKinds.push(...readElementKinds(inner));
        else if (name === 'PARAGRAPH_KINDS') {
          const got = readParagraphKinds(inner);
          project.paragraphKinds.push(...got.kinds);
          for (const [id, s] of got.slugs) ownSlugs.set(id, s);
          ctx = null;
        } else if (name === 'COMMENTS') commentLines.push(inner);
        else kept.push(ls.slice(i, end + 1).map((l) => l.trim()));
        i = end + 1;
        continue;
      }
      const template = /^#\+begin_src\s+json\s+:template\s+(\S+)\s*$/i.exec(t);
      if (template) {
        let end = i + 1;
        while (end < ls.length && !/^\s*#\+end_src\s*$/i.test(ls[end])) end++;
        const got: Template | null = readTemplate(ls.slice(i + 1, end));
        if (got) project.templates[template[1]] = got;
        else kept.push(ls.slice(i, end + 1));
        i = end + 1;
        continue;
      }
      break;
    }
    if (!element.id) element.id = `org-${++made}`;
    const c = context();
    element.name = readLine(head.name, c.reading);
    const body: Block[] = readBody(ls.slice(i), c);
    element.blocks = [...kept.map(keptAsDraft), ...body];
    element.kind = kindName ? kindIdOf(kindName, project.elementKinds) : null;
    for (const l of links)
      project.links.push({ from: element.id, to: l.to, label: l.label } satisfies OrgLink);
    for (const inner of commentLines) threads.push(...readComments(inner, element.id));
    project.comments.push(...threads);
    project.elements.push(element);
  }
  return project;
}

/** The lines of a section's drawer of properties, as one text, to see what it says before it is read. */
function sectionDrawer(section: Section): string {
  const at = section.lines.findIndex((l) => /^\s*:PROPERTIES:\s*$/i.test(l));
  if (at < 0) return '';
  const end = drawerEnd(section.lines, at);
  return section.lines.slice(at, end < 0 ? undefined : end).join('\n');
}

/** The id of a kind of element by the name it was written by, or by its id; one is made where none has it. */
function kindIdOf(name: string, kinds: KindRecord[]): string {
  const found = kinds.find((k) => k.name === name) ?? kinds.find((k) => k.id === name);
  if (found) return found.id;
  const kind: KindRecord = {
    id: slug(name),
    name,
    colour: 'grey',
    template: '',
    order: String(kinds.length),
  };
  kinds.push(kind);
  return kind.id;
}

function blankElement(id: string, depth: number): OrgElement {
  return {
    id,
    depth,
    name: [],
    blocks: [],
    kind: null,
    status: null,
    when: null,
    heading: true,
    excluded: false,
    include: null,
    origin: null,
    pos: null,
    collapsed: false,
    document: {},
    timeline: null,
  };
}

/** One element's text from Org, as the clipboard gives it. */
export function readBlocks(text: string, options: OrgTextOptions = {}): Block[] {
  const ctx = textContext({
    paragraphKinds: options.paragraphKinds ?? [],
    references: options.references ?? [],
    targets: options.targets ?? new Map(),
  });
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  try {
    return readBody(lines, ctx);
  } catch {
    // What could not be read is kept as it is, so that nothing is lost.
    return [keptAsDraft(lines)];
  }
}
