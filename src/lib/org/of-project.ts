/**
 * The Org form of a project as the program has it, and a project made of
 * one (ADR 0041, sections 6 and 7). `orgOf` gathers what the Org writer
 * needs from a project: its elements in the order of the tree, its kinds,
 * the templates it carries, its associations and its comments.
 * `intoProject` fills a new project from what the Org reader gives, in one
 * change: for *Open an Org file*.
 *
 * Unlike the rest of the module this reads and writes a project, and so
 * runs on the main thread only.
 */

import * as Y from 'yjs';
import { generateNKeysBetween } from 'fractional-indexing';
import type { Template } from '$lib/api/templates';
import { writeBody, writeName } from '$lib/project/model/blocks';
import { cleanLook, family } from '$lib/project/model/changing/passage-kinds';
import { cleanTemplate } from '$lib/project/model/changing/templates';
import { TIDY } from '$lib/project/model/origins';
import type { Project } from '$lib/project/model/project.svelte';
import { citedRecords } from '$lib/project/model/rewrite-refs';
import { inlineText, readTitle } from '$lib/project/model/text';
import { PROJECT, type Note, type RefRecord } from '$lib/project/model/types';
import { newId } from '$lib/util/id';
import type { OrgElement, OrgLink, OrgProject, OrgThread } from './types';
import { writeBlocks } from './write';

/** A record of settings with nothing empty in it; nothing at all where it says nothing. */
function said<T extends object>(given: T | null | undefined): T | null {
  if (!given) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(given)) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? (out as T) : null;
}

/** The day a note was written, as the Org form has it: `2026-10-12`. */
const dayOf = (created: string) => created.slice(0, 10);

/** The Org form of a project, as the Org writer takes it. */
export function orgOf(project: Project): OrgProject {
  const tree = project.tree();
  const elements: OrgElement[] = [];
  const place = new Map<string, number>();
  for (const id of tree.sequence) {
    const n = project.node(id);
    if (!n) continue;
    place.set(id, elements.length);
    elements.push({
      id,
      depth: tree.depth.get(id) ?? 0,
      name: readTitle(project.fragment(id, 'title') ?? undefined),
      blocks: project.blocksOf(id),
      kind: n.kind,
      status: n.status,
      when: n.when,
      heading: n.heading,
      excluded: n.excluded,
      include: n.include,
      origin: n.origin?.node ?? null,
      pos: n.pos,
      collapsed: n.collapsed,
      document: { ...n.document },
      timeline: said(n.timeline),
    });
  }

  // The associations in the order of the elements they go from, and those
  // of one element in the order of the elements they go to: as they read back.
  const at = (id: string) => place.get(id) ?? Infinity;
  const links: OrgLink[] = project.links
    .filter((l) => place.has(l.from) && place.has(l.to))
    .sort((a, b) => at(a.from) - at(b.from) || at(a.to) - at(b.to) || cmp(a.label, b.label))
    .map((l) => ({ from: l.from, to: l.to, label: l.label }));

  const comments: OrgThread[] = [];
  for (const e of elements)
    for (const thread of project.threadsOf(e.id))
      comments.push({
        element: e.id,
        words: thread.passage?.text || null,
        resolved: thread.resolved,
        notes: thread.notes.map((n) => ({
          author: n.author.name,
          date: dayOf(n.created ?? ''),
          text: n.text,
        })),
      });

  const templates: Record<string, Template> = {};
  for (const template of project.templates) templates[template.id] = template;

  return {
    title: project.name,
    language: project.language,
    elements,
    elementKinds: project.kinds.map((k) => ({ ...k })),
    paragraphKinds: project.passageKinds.map((k) => ({ ...k, look: { ...k.look } })),
    templates,
    links,
    comments,
    references: citedRecords(project),
  };
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Fills a new project from its Org form, in one change that is saved and
 * not undone: the elements with their ids, each under the one before it
 * that stands higher, in their order; their names and texts and all that
 * is said of them; the kinds, the templates, the works cited, the
 * associations and the comments. A comment on words finds them again in
 * its element's text; where they are not found, it is on the element.
 * The project's own element is the first; a project that has one already
 * has it written over.
 */
export function intoProject(org: OrgProject, project: Project) {
  project.doc.transact(() => {
    // Ids as they were, but where two elements have the same one, or the first is not the project.
    const ids = new Map<number, string>();
    const taken = new Set<string>();
    org.elements.forEach((e, i) => {
      let id = i === 0 ? PROJECT : e.id;
      if (!id || taken.has(id) || (i > 0 && id === PROJECT)) id = newId();
      taken.add(id);
      ids.set(i, id);
    });
    const idOf = new Map<string, string>();
    org.elements.forEach((e, i) => {
      if (!idOf.has(e.id)) idOf.set(e.id, ids.get(i)!);
    });
    const known = (id: string | null) => (id ? (idOf.get(id) ?? null) : null);

    // Under what each stands: the nearest before it that stands higher.
    const parents: (string | null)[] = [];
    const stack: { depth: number; id: string }[] = [];
    org.elements.forEach((e, i) => {
      if (i === 0) {
        parents.push(null);
        stack.push({ depth: -Infinity, id: ids.get(0)! });
        return;
      }
      while (stack.length > 1 && stack[stack.length - 1].depth >= e.depth) stack.pop();
      parents.push(stack[stack.length - 1].id);
      stack.push({ depth: e.depth, id: ids.get(i)! });
    });
    const children = new Map<string, number[]>();
    parents.forEach((parent, i) => {
      if (parent === null) return;
      const list = children.get(parent);
      if (list) list.push(i);
      else children.set(parent, [i]);
    });
    const orders = new Map<number, string>();
    for (const list of children.values()) {
      const keys = generateNKeysBetween(null, null, list.length);
      list.forEach((i, n) => orders.set(i, keys[n]));
    }

    org.elements.forEach((e, i) => {
      const id = ids.get(i)!;
      const n = new Y.Map<unknown>();
      n.set('parent', parents[i]);
      n.set('order', i === 0 ? 'a0' : orders.get(i)!);
      const title = new Y.XmlFragment();
      const body = new Y.XmlFragment();
      n.set('title', title);
      n.set('body', body);
      if (e.pos) n.set('pos', { x: e.pos.x, y: e.pos.y });
      if (e.collapsed) n.set('collapsed', true);
      if (e.excluded) n.set('excluded', true);
      const include = known(e.include);
      if (include && include !== id) n.set('include', include);
      const origin = known(e.origin) ?? e.origin;
      if (origin) n.set('origin', { node: origin });
      if (e.status) n.set('status', e.status);
      if (e.kind) n.set('kind', e.kind);
      if (e.when) n.set('when', structuredClone(e.when));
      const document = said(e.document);
      if (document) n.set('document', structuredClone(document));
      const timeline = said(e.timeline);
      if (timeline) n.set('timeline', structuredClone(timeline));
      project.yNodes.set(id, n);
      writeName(title, e.name);
      writeBody(body, e.blocks);
    });
    project.yMeta.set(
      'name',
      inlineText(org.elements[0]?.name ?? [])
        .replace(/\s+/g, ' ')
        .trim() || org.title,
    );

    for (const k of org.elementKinds) {
      const y = new Y.Map<unknown>();
      y.set('name', k.name);
      y.set('colour', k.colour);
      if (k.template) y.set('template', k.template);
      if (k.begins) y.set('begins', k.begins);
      if (k.basedOn) y.set('basedOn', k.basedOn);
      y.set('order', k.order);
      project.yKinds.set(k.id, y);
    }
    for (const k of org.paragraphKinds) {
      const y = new Y.Map<unknown>();
      y.set('name', k.name);
      y.set('family', family(k.family));
      if (k.basedOn) y.set('basedOn', k.basedOn);
      const look = cleanLook(k.look);
      if (Object.keys(look).length) y.set('look', look);
      y.set('order', k.order);
      project.yPassageKinds.set(k.id, y);
    }
    for (const [id, template] of Object.entries(org.templates)) {
      const clean = cleanTemplate(template, id);
      if (clean) project.yTemplates.set(clean.id, clean);
    }
    for (const r of org.references) project.yRefs.set(r.id, { ...r } satisfies RefRecord);

    for (const l of org.links) {
      const from = known(l.from);
      const to = known(l.to);
      if (!from || !to || from === to) continue;
      const y = new Y.Map<unknown>();
      y.set('from', from);
      y.set('to', to);
      if (l.label) y.set('label', l.label);
      project.yLinks.set(newId(), y);
    }

    org.comments.forEach((c, i) => {
      const element = known(c.element);
      if (!element || !c.notes.length) return;
      const thread = new Y.Map<unknown>();
      thread.set('element', element);
      const body = project.yNodes.get(element)?.get('body');
      const found = c.words && body instanceof Y.XmlFragment ? findWords(body, c.words) : null;
      if (found) thread.set('passage', { ...found, text: c.words });
      if (c.resolved) thread.set('resolved', true);
      const notes = new Y.Array<Note>();
      notes.push(
        c.notes.map((n) => ({
          id: newId(),
          author: { id: '', name: n.author },
          created: createdOf(n.date, i),
          text: n.text,
        })),
      );
      thread.set('notes', notes);
      project.yComments.set(newId(), thread);
    });
  }, TIDY);
}

/**
 * When a note was written, as the project keeps it, of the day the Org
 * form says: at noon, so that it is that day wherever it is read, and a
 * little later for each thread after, so that the threads of one day keep
 * their order. A day that is no day is kept as it is.
 */
function createdOf(day: string, index: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  const ms = String(index % 1000).padStart(3, '0');
  return `${day}T12:00:00.${ms}Z`;
}

/** One sign of a text, and where in the shared text it stands; nothing for what parts the pieces. */
interface Sign {
  c: string;
  at: { text: Y.XmlText; index: number } | null;
}

/** The signs of a text, in order: the words of its pieces with a space between each. */
function signsOf(fragment: Y.XmlFragment | Y.XmlElement, out: Sign[] = []): Sign[] {
  for (const child of fragment.toArray()) {
    if (child instanceof Y.XmlText) {
      let index = 0;
      for (const op of child.toDelta() as { insert: unknown }[]) {
        if (typeof op.insert === 'string') {
          for (let k = 0; k < op.insert.length; k++)
            out.push({ c: op.insert[k], at: { text: child, index: index + k } });
          index += op.insert.length;
        } else index += 1;
      }
    } else if (child instanceof Y.XmlElement) {
      out.push({ c: ' ', at: null });
      signsOf(child, out);
      out.push({ c: ' ', at: null });
    }
  }
  return out;
}

/**
 * Where some words stand in a text, as a comment keeps it: two positions
 * that follow the words through every change. Found with every run of
 * spaces as one, and then, where that fails, with no spaces at all. Words
 * that end in "…" were cut short when the comment was made: what stands
 * before it is looked for.
 */
export function findWords(
  fragment: Y.XmlFragment,
  words: string,
): { from: Uint8Array; to: Uint8Array } | null {
  const wanted = words.replace(/…$/, '').replace(/\s+/g, ' ').trim();
  if (!wanted) return null;
  const signs = signsOf(fragment);
  const search = (keep: (c: string, last: string) => boolean, want: string) => {
    let text = '';
    const where: Sign[] = [];
    for (const s of signs) {
      const c = /\s/.test(s.c) ? ' ' : s.c;
      if (!keep(c, text[text.length - 1] ?? ' ')) continue;
      text += c;
      where.push(s);
    }
    const at = text.indexOf(want);
    if (at < 0) return null;
    const first = where.slice(at, at + want.length).find((s) => s.at);
    const last = where
      .slice(at, at + want.length)
      .reverse()
      .find((s) => s.at);
    if (!first?.at || !last?.at) return null;
    return {
      from: Y.encodeRelativePosition(
        Y.createRelativePositionFromTypeIndex(first.at.text, first.at.index),
      ),
      to: Y.encodeRelativePosition(
        Y.createRelativePositionFromTypeIndex(last.at.text, last.at.index + 1),
      ),
    };
  };
  return (
    search((c, last) => c !== ' ' || last !== ' ', wanted) ??
    search((c) => c !== ' ', wanted.replace(/ /g, ''))
  );
}

/**
 * The Org form of an element's text, for a difference: its name as a
 * headline and its text under it; with `under`, and so of every element
 * under it, each at its depth below it. Nothing of what is said of them.
 */
export function branchText(project: Project, at: string, under = true): string {
  if (!project.node(at)) return '';
  const tree = project.tree(at);
  const top = tree.depth.get(at) ?? 0;
  const options = {
    paragraphKinds: project.passageKinds,
    references: [...project.refs.values()],
  };
  const out: string[] = [];
  for (const id of under ? tree.sequence : [at]) {
    const depth = (tree.depth.get(id) ?? top) - top;
    const name = (project.node(id)?.title ?? '').replace(/\s+/g, ' ').trim();
    out.push(`${'*'.repeat(depth + 1)} ${name}`.trimEnd());
    const body = writeBlocks(project.blocksOf(id), options);
    if (body) out.push('', body.replace(/\n$/, ''));
    out.push('');
  }
  return out.join('\n');
}
