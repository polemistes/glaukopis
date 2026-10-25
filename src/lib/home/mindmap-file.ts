/**
 * A project as a mind map of another program, and a project made of one
 * (the file of Freeplane and FreeMind, XMind, and OPML written only, which
 * is read as a document already). The files are read and written in the
 * page, by `$lib/mindmaps`; the core reads and writes their bytes, and the
 * archives of XMind. What is written is the project as it is on disk; what
 * a file or a project holds that the other has no place for is counted, to
 * be told.
 */

import type { FileChoice, FoundWork, ProjectInfo } from '$lib/api/projects';
import { fileRead, fileWrite, systemInfo, zipRead, zipWrite } from '$lib/api/system';
import { citationWordsData } from '$lib/editor/references.svelte';
import { citationText, citationWordsOf } from '$lib/editor/labels';
import type { CiteItem, CiteMode } from '$lib/editor/schema';
import { t } from '$lib/i18n';
import { intoPortable, mindMapOf } from '$lib/mindmaps/crossing';
import { isFreeplane, readFreeplane, writeFreeplane } from '$lib/mindmaps/freeplane';
import { hasMarks, notesHtml, notesPlain } from '$lib/mindmaps/html';
import {
  LEFT_OUT_KINDS,
  leaveAll,
  plainName,
  type LeftOut,
  type LeftOutKind,
  type MindMap,
  type Topic,
} from '$lib/mindmaps/map';
import { writeOpml } from '$lib/mindmaps/opml';
import { isXmind, readXmind, writeXmind } from '$lib/mindmaps/xmind';
import { writeBody, writeName } from '$lib/project/model/blocks';
import { makePortable, portable } from '$lib/project/model/portable';
import { Project } from '$lib/project/model/project.svelte';
import { inlineText, readTitle } from '$lib/project/model/text';
import { PROJECT } from '$lib/project/model/types';
import { projects } from '$lib/state/projects.svelte';
import { baseName, freeName, make, read, withLibraryRecords, type Made } from './project-file';

/** The kinds of mind map a project is saved as, each by the ending of its file. */
export type MindMapKind = 'freeplane' | 'xmind' | 'opml';

export const MINDMAP_ENDINGS: Record<MindMapKind, string> = {
  freeplane: 'mm',
  xmind: 'xmind',
  opml: 'opml',
};

/** The endings of the mind maps that are opened: Freeplane and FreeMind, and XMind. */
export const OPENED_ENDINGS = ['mm', 'xmind'];

const ending = (path: string) => /\.([^./\\]+)$/.exec(path)?.[1]?.toLowerCase() ?? '';

/** Whether a file is a mind map that is opened as a project, by its ending. */
export const isMindMapPath = (path: string) => OPENED_ENDINGS.includes(ending(path));

/** The kind a mind map is saved as, by the ending of its name; Freeplane's where it has none of theirs. */
export function kindOfPath(path: string): MindMapKind {
  const end = ending(path);
  return end === 'xmind' ? 'xmind' : end === 'opml' ? 'opml' : 'freeplane';
}

/** A file that is not a mind map of a kind that is read. */
export class NotAMindMap extends Error {
  constructor(readonly path: string) {
    super(t('home-mindmap-not-a-map', { name: fileNameOf(path) }));
  }
}

const fileNameOf = (path: string) => path.replace(/^.*[\\/]/, '');

/** Reads a mind map: by the ending of its name, and failing that, by what it begins with. */
export async function readMindMap(path: string): Promise<{ map: MindMap; leftOut: LeftOut }> {
  const asXmind = async () => {
    const entries = await zipRead(path);
    if (!isXmind(entries)) throw new NotAMindMap(path);
    return readXmind(entries);
  };
  const asFreeplane = (bytes: Uint8Array) => {
    const xml = new TextDecoder().decode(bytes);
    if (!isFreeplane(xml)) throw new NotAMindMap(path);
    return readFreeplane(xml);
  };
  try {
    if (ending(path) === 'xmind') return await asXmind();
    const bytes = await fileRead(path);
    // A zip archive begins with PK.
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) return await asXmind();
    return asFreeplane(bytes);
  } catch (error) {
    // What is wrong with the file is said as one thing: it is not a map that is read.
    if (
      error instanceof Error &&
      !(error instanceof NotAMindMap) &&
      error.message.startsWith('not ')
    )
      throw new NotAMindMap(path);
    if (error instanceof SyntaxError) throw new NotAMindMap(path);
    throw error;
  }
}

/** What was made of a mind map: the project, and what the map held that has no place in it. */
export interface MadeOfMap extends Made {
  leftOut: LeftOut;
}

/**
 * Makes a new project of a mind map, as a project file is made (`make`):
 * named as the map's middle, or the file where it has no name; the middle's
 * text the project's own, and what is under the middle the elements under
 * the project. The project is on disk, and among the projects, when this
 * returns.
 */
export async function makeFromMindMap(
  path: string,
  ask: (name: string, works: FoundWork[]) => Promise<Record<string, FileChoice> | null>,
): Promise<MadeOfMap | null> {
  const { map, leftOut } = await readMindMap(path);
  const project = new Project(null);
  try {
    const wanted = map.name.replace(/\s+/g, ' ').trim() || baseName(path);
    const name = freeName(
      wanted,
      projects.list.map((p) => p.name),
    );
    project.begin(name);
    project.transact(() => {
      if (map.root.text.length) writeBody(project.fragment(PROJECT, 'body')!, map.root.text);
      // The name with its marks, where the project is named as the map is.
      if (hasMarks(map.root.name) && inlineText(map.root.name).trim() === name)
        writeName(project.fragment(PROJECT, 'title')!, map.root.name);
    });
    makePortable(project, intoPortable(map), { under: PROJECT, keepFolded: true });
    const made = await make(project, name, '', 0, ask);
    return made ? { ...made, leftOut } : null;
  } finally {
    await project.close();
  }
}

/**
 * The texts of a project's elements as a mind map has them, each made
 * once, as HTML and as plain words: citations as their words in the
 * language of their element, from the works the project keeps.
 */
function sayings(project: Project, left: LeftOut) {
  const said = new Map<string, { html: string; plain: string }>();
  const cite = (language: string | null) => (items: CiteItem[], mode: CiteMode) =>
    citationText(
      items,
      mode,
      (id) => {
        const r = project.refs.get(id);
        return r ? { authors: r.authors, year: r.year, title: r.title, key: r.key } : null;
      },
      citationWordsOf(citationWordsData(language)),
    );
  const of = (topic: Topic) => {
    let s = said.get(topic.id);
    if (!s) {
      const language = project.node(topic.id)
        ? (project.documentOf(topic.id).settings.language ?? null)
        : null;
      const counted: LeftOut = {};
      s = {
        html: notesHtml(topic.text, language, cite(language), counted),
        plain: notesPlain(topic.text, cite(language), {}),
      };
      leaveAll(left, counted);
      said.set(topic.id, s);
    }
    return s;
  };
  return { html: (topic: Topic) => of(topic).html, plain: (topic: Topic) => of(topic).plain };
}

/**
 * Writes a project as a mind map at `path`, of the kind its ending says.
 * What is written is the project as it is on disk: one that is open is
 * written there first (`flush`). Gives what had no place in the map.
 */
export async function writeMindMap(
  info: ProjectInfo,
  path: string,
  flush?: () => Promise<void>,
): Promise<LeftOut> {
  await flush?.();
  const project = await read(info);
  try {
    await withLibraryRecords(project);
    const under = project.tree().children.get(PROJECT) ?? [];
    const own = readTitle(project.fragment(PROJECT, 'title') ?? undefined);
    const map = mindMapOf(
      info.name,
      {
        id: PROJECT,
        name: inlineText(own).trim() ? own : plainName(info.name),
        text: project.blocksOf(PROJECT),
      },
      portable(project, under),
    );
    const left: LeftOut = {};
    const notes = sayings(project, left);
    const kind = kindOfPath(path);
    if (kind === 'xmind') {
      const version = await systemInfo()
        .then((s) => s.version)
        .catch(() => '');
      await zipWrite(path, writeXmind(map, notes, version));
    } else {
      const text = kind === 'opml' ? writeOpml(map, notes.plain) : writeFreeplane(map, notes.html);
      await fileWrite(path, new TextEncoder().encode(text));
    }
    return left;
  } finally {
    await project.close();
  }
}

/** What had no place, in words, one line for each kind of thing. */
export function leftOutLines(left: LeftOut): string[] {
  const words: Record<LeftOutKind, (count: number) => string> = {
    images: (count) => t('home-mindmap-left-out-images', { count }),
    pictures: (count) => t('home-mindmap-left-out-pictures', { count }),
    clouds: (count) => t('home-mindmap-left-out-clouds', { count }),
    summaries: (count) => t('home-mindmap-left-out-summaries', { count }),
    boundaries: (count) => t('home-mindmap-left-out-boundaries', { count }),
    hyperlinks: (count) => t('home-mindmap-left-out-hyperlinks', { count }),
    icons: (count) => t('home-mindmap-left-out-icons', { count }),
    attributes: (count) => t('home-mindmap-left-out-attributes', { count }),
    labels: (count) => t('home-mindmap-left-out-labels', { count }),
    times: (count) => t('home-mindmap-left-out-times', { count }),
    associations: (count) => t('home-mindmap-left-out-associations', { count }),
    references: (count) => t('home-mindmap-left-out-references', { count }),
  };
  return LEFT_OUT_KINDS.flatMap((kind) => (left[kind] ? [words[kind](left[kind])] : []));
}
