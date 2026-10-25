/**
 * The file of XMind (`.xmind`), read and written: a zip archive with the
 * map in `content.json` since XMind 2020, and in `content.xml` in XMind 8.
 * It is read from `content.json` where there is one, else from
 * `content.xml`, and written with both, so that both read it.
 *
 * A file holds sheets, each with a topic in the middle and the topics
 * under it, attached and floating, and relationships between them with
 * their words. A topic has a title, notes as HTML and as plain words,
 * markers, labels, and may be folded. How far the writing has come is told
 * by the task markers (begun, half done, done); the kind, the time and
 * being left out of the document by labels.
 */

import type { ZipEntry } from '$lib/api/system';
import type { Status } from '$lib/project/model/types';
import { isTime } from '$lib/timeline/time';
import { newId } from '$lib/util/id';
import { children, escapeAttr, htmlToBlocks, plainToBlocks } from './html';
import {
  leave,
  plainName,
  timeOfWords,
  timeWords,
  topic,
  type Association,
  type LeftOut,
  type MindMap,
  type Topic,
} from './map';

/** The labels that say what else is said of an element. */
export const LABEL_TIME = 'Time: ';
export const LABEL_LEFT_OUT = 'Left out';

/** The markers that say how far the writing has come. */
const MARKERS: Record<Status, string> = {
  idea: 'task-start',
  draft: 'task-half',
  done: 'task-done',
};

/** How far the writing has come, by a marker: any other task marker is a draft. */
function statusOf(marker: string): Status | null {
  if (marker === 'task-done') return 'done';
  if (marker === 'task-start') return 'idea';
  if (marker.startsWith('task-')) return 'draft';
  return null;
}

const aTime = (text: string) => isTime(text, 'dates') || isTime(text, 'units');

/** What a topic says of itself in its markers and labels, laid on it. */
function said(t: Topic, markers: string[], labels: string[], left: LeftOut) {
  for (const m of markers) {
    const status = statusOf(m);
    if (status) t.status = status;
    else leave(left, 'icons');
  }
  for (const raw of labels) {
    const label = raw.trim();
    if (!label) continue;
    if (label.toLowerCase().startsWith(LABEL_TIME.trim().toLowerCase())) {
      const when = timeOfWords(label.slice(LABEL_TIME.trim().length), aTime);
      if (when) t.when = when;
      else leave(left, 'times');
    } else if (label.toLowerCase() === LABEL_LEFT_OUT.toLowerCase()) t.excluded = true;
    else if (!t.kind) t.kind = { name: label, colour: null };
    else leave(left, 'labels');
  }
}

// ---- content.json ----

interface JsonTopic {
  id?: string;
  title?: string;
  children?: {
    attached?: JsonTopic[];
    detached?: JsonTopic[];
    [other: string]: JsonTopic[] | undefined;
  };
  notes?: { plain?: { content?: string }; realHTML?: { content?: string }; html?: unknown };
  markers?: { markerId?: string }[];
  labels?: string[];
  branch?: string;
  href?: string;
  image?: unknown;
  boundaries?: unknown[];
  summaries?: unknown[];
}

interface JsonSheet {
  id?: string;
  title?: string;
  rootTopic?: JsonTopic;
  relationships?: { end1Id?: string; end2Id?: string; title?: string }[];
}

function readJsonTopic(j: JsonTopic, left: LeftOut, floating: Topic[] | null): Topic {
  const t = topic(j.id || newId(), plainName(j.title ?? ''));
  const html = j.notes?.realHTML?.content;
  const plain = j.notes?.plain?.content;
  if (html) t.text = htmlToBlocks(html, left);
  else if (plain) t.text = plainToBlocks(plain);
  said(t, (j.markers ?? []).map((m) => m.markerId ?? '').filter(Boolean), j.labels ?? [], left);
  t.folded = j.branch === 'folded';
  if (j.href) leave(left, 'hyperlinks');
  if (j.image) leave(left, 'images');
  leave(left, 'boundaries', j.boundaries?.length ?? 0);
  leave(left, 'summaries', j.summaries?.length ?? 0);
  t.children = (j.children?.attached ?? []).map((c) => readJsonTopic(c, left, floating));
  // Floating topics stand under the topic in the middle of their sheet.
  const detached = (j.children?.detached ?? []).map((c) => readJsonTopic(c, left, floating));
  if (floating) floating.push(...detached);
  else t.children.push(...detached);
  // The topics of a summary (`children.summary`) are counted with the summary, and not read.
  return t;
}

// ---- content.xml ----

const childrenNamed = (el: Element, name: string) =>
  [...el.children].filter((c) => c.localName === name);
const childNamed = (el: Element, name: string) => childrenNamed(el, name)[0];

function readXmlTopic(el: Element, left: LeftOut, floating: Topic[] | null): Topic {
  const t = topic(
    el.getAttribute('id') || newId(),
    plainName(childNamed(el, 'title')?.textContent ?? ''),
  );
  const notes = childNamed(el, 'notes');
  const html = notes && childNamed(notes, 'html');
  const plain = notes && childNamed(notes, 'plain');
  if (html && html.textContent?.trim()) t.text = htmlToBlocks(children(html), left);
  else if (plain?.textContent?.trim()) t.text = plainToBlocks(plain.textContent);
  const refs = childNamed(el, 'marker-refs');
  const labels = childNamed(el, 'labels');
  said(
    t,
    refs ? childrenNamed(refs, 'marker-ref').map((m) => m.getAttribute('marker-id') ?? '') : [],
    labels ? childrenNamed(labels, 'label').map((l) => l.textContent ?? '') : [],
    left,
  );
  t.folded = el.getAttribute('branch') === 'folded';
  if (el.getAttribute('xlink:href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href'))
    leave(left, 'hyperlinks');
  leave(left, 'images', childrenNamed(el, 'img').length);
  const boundaries = childNamed(el, 'boundaries');
  if (boundaries) leave(left, 'boundaries', childrenNamed(boundaries, 'boundary').length);
  const summaries = childNamed(el, 'summaries');
  if (summaries) leave(left, 'summaries', childrenNamed(summaries, 'summary').length);
  const under = childNamed(el, 'children');
  for (const topics of under ? childrenNamed(under, 'topics') : []) {
    const type = topics.getAttribute('type');
    const read = childrenNamed(topics, 'topic').map((c) => readXmlTopic(c, left, floating));
    if (type === 'detached' && floating) floating.push(...read);
    else if (type === 'attached' || type === 'detached') t.children.push(...read);
  }
  return t;
}

/** A sheet as a topic: its topic in the middle, named as the sheet where it is named, with its floating topics under it. */
interface Sheet {
  title: string;
  root: Topic;
  links: Association[];
}

function sheetsOfJson(text: string, left: LeftOut): Sheet[] {
  const sheets = JSON.parse(text) as JsonSheet[];
  if (!Array.isArray(sheets)) throw new Error('not a file of XMind');
  return sheets
    .filter((s) => s && s.rootTopic)
    .map((s) => {
      const floating: Topic[] = [];
      const root = readJsonTopic(s.rootTopic!, left, floating);
      root.children.push(...floating);
      const links = (s.relationships ?? []).flatMap((r) =>
        r.end1Id && r.end2Id
          ? [{ from: r.end1Id, to: r.end2Id, label: (r.title ?? '').trim() }]
          : [],
      );
      return { title: (s.title ?? '').trim(), root, links };
    });
}

function sheetsOfXml(text: string, left: LeftOut): Sheet[] {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  if (
    doc.getElementsByTagName('parsererror').length ||
    doc.documentElement.localName !== 'xmap-content'
  )
    throw new Error('not a file of XMind');
  return childrenNamed(doc.documentElement, 'sheet').flatMap((s) => {
    const top = childNamed(s, 'topic');
    if (!top) return [];
    const floating: Topic[] = [];
    const root = readXmlTopic(top, left, floating);
    root.children.push(...floating);
    const relationships = childNamed(s, 'relationships');
    const links = (relationships ? childrenNamed(relationships, 'relationship') : []).flatMap(
      (r) => {
        const from = r.getAttribute('end1');
        const to = r.getAttribute('end2');
        return from && to
          ? [{ from, to, label: (childNamed(r, 'title')?.textContent ?? '').trim() }]
          : [];
      },
    );
    return [{ title: (childNamed(s, 'title')?.textContent ?? '').trim(), root, links }];
  });
}

/** Whether the texts of an archive are those of a file of XMind. */
export function isXmind(entries: ZipEntry[]): boolean {
  return entries.some((e) => e.name === 'content.json' || e.name === 'content.xml');
}

/**
 * Reads a file of XMind from the texts of its archive. One sheet is the
 * map; of several, each is a topic under one named after the file (left
 * to the caller to name), named after its sheet. Relationships whose ends
 * are not there are counted with what has no place.
 */
export function readXmind(entries: ZipEntry[]): { map: MindMap; leftOut: LeftOut } {
  const left: LeftOut = {};
  const json = entries.find((e) => e.name === 'content.json');
  const xml = entries.find((e) => e.name === 'content.xml');
  let sheets: Sheet[] | null = null;
  if (json) {
    try {
      sheets = sheetsOfJson(json.text, left);
    } catch (error) {
      if (!xml) throw error;
    }
  }
  if (!sheets?.length && xml) sheets = sheetsOfXml(xml.text, left);
  if (!sheets?.length) throw new Error('not a file of XMind');

  const name = (t: Topic) =>
    t.name
      .map((i) => (i.kind === 'text' ? i.text : ''))
      .join('')
      .trim();
  let root: Topic;
  let mapName: string;
  if (sheets.length === 1) {
    root = sheets[0].root;
    mapName = name(root) || sheets[0].title;
    if (!name(root)) root.name = plainName(sheets[0].title);
  } else {
    for (const s of sheets) if (s.title) s.root.name = plainName(s.title);
    root = topic(
      newId(),
      [],
      sheets.map((s) => s.root),
    );
    mapName = '';
  }
  const ids = new Set<string>();
  const gather = (t: Topic) => {
    ids.add(t.id);
    t.children.forEach(gather);
  };
  gather(root);
  const links = sheets.flatMap((s) => s.links);
  const known = links.filter((l) => ids.has(l.from) && ids.has(l.to) && l.from !== l.to);
  leave(left, 'associations', links.length - known.length);
  return { map: { name: mapName, root, links: known }, leftOut: left };
}

// ---- writing ----

/** The labels a topic is written with: its kind, its time, being left out. */
function labelsOf(t: Topic): string[] {
  const out: string[] = [];
  if (t.kind) out.push(t.kind.name);
  if (t.when) out.push(`${LABEL_TIME}${timeWords(t.when)}`);
  if (t.excluded) out.push(LABEL_LEFT_OUT);
  return out;
}

/** What `writeXmind` needs of a topic's text: as HTML, and as plain words. */
export interface Notes {
  html: (t: Topic) => string;
  plain: (t: Topic) => string;
}

const escapeText = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** HTML as the XHTML of XMind 8's notes: each element with its prefix. */
function xhtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  return children(doc.body, 'xhtml:');
}

/**
 * Writes a mind map as a file of XMind, as the texts of its archive: one
 * sheet, in `content.json` for the XMind of today and in `content.xml`
 * for XMind 8, with the manifests both want.
 */
export function writeXmind(map: MindMap, notes: Notes, version: string): ZipEntry[] {
  const sheet = newId();
  const words = (t: Topic) =>
    t.name
      .map((i) => (i.kind === 'text' ? i.text : ''))
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
  const known = new Set<string>();
  const gather = (t: Topic) => {
    known.add(t.id);
    t.children.forEach(gather);
  };
  gather(map.root);
  const links = map.links.filter((l) => known.has(l.from) && known.has(l.to));

  const json = (t: Topic): Record<string, unknown> => {
    const out: Record<string, unknown> = { id: t.id, class: 'topic', title: words(t) };
    if (t.children.length) out.children = { attached: t.children.map(json) };
    const html = notes.html(t);
    if (html) out.notes = { plain: { content: notes.plain(t) }, realHTML: { content: html } };
    if (t.status) out.markers = [{ markerId: MARKERS[t.status] }];
    const labels = labelsOf(t);
    if (labels.length) out.labels = labels;
    if (t.folded && t.children.length) out.branch = 'folded';
    return out;
  };
  const content = [
    {
      id: sheet,
      class: 'sheet',
      title: map.name,
      rootTopic: { ...json(map.root), structureClass: 'org.xmind.ui.map.unbalanced' },
      ...(links.length
        ? {
            relationships: links.map((l) => ({
              id: newId(),
              class: 'relationship',
              end1Id: l.from,
              end2Id: l.to,
              ...(l.label ? { title: l.label } : {}),
            })),
          }
        : {}),
    },
  ];

  const xml = (t: Topic, pad: string, root = false): string => {
    const more = `${pad}  `;
    const lines: string[] = [];
    const attrs =
      `id="${escapeAttr(t.id)}"` +
      (root ? ' structure-class="org.xmind.ui.map.unbalanced"' : '') +
      (t.folded && t.children.length ? ' branch="folded"' : '');
    lines.push(`${pad}<topic ${attrs}>`, `${more}<title>${escapeText(words(t))}</title>`);
    const html = notes.html(t);
    if (html)
      lines.push(
        `${more}<notes><plain>${escapeText(notes.plain(t))}</plain><html>${xhtml(html)}</html></notes>`,
      );
    if (t.status)
      lines.push(
        `${more}<marker-refs><marker-ref marker-id="${MARKERS[t.status]}"/></marker-refs>`,
      );
    const labels = labelsOf(t);
    if (labels.length)
      lines.push(
        `${more}<labels>${labels.map((l) => `<label>${escapeText(l)}</label>`).join('')}</labels>`,
      );
    if (t.children.length) {
      lines.push(`${more}<children><topics type="attached">`);
      for (const c of t.children) lines.push(xml(c, `${more}  `));
      lines.push(`${more}</topics></children>`);
    }
    lines.push(`${pad}</topic>`);
    return lines.join('\n');
  };
  const contentXml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" version="2.0">',
    `  <sheet id="${escapeAttr(sheet)}">`,
    xml(map.root, '    ', true),
    ...(links.length
      ? [
          '    <relationships>',
          ...links.map(
            (l) =>
              `      <relationship id="${newId()}" end1="${escapeAttr(l.from)}" end2="${escapeAttr(l.to)}">${l.label ? `<title>${escapeText(l.label)}</title>` : ''}</relationship>`,
          ),
          '    </relationships>',
        ]
      : []),
    `    <title>${escapeText(map.name)}</title>`,
    '  </sheet>',
    '</xmap-content>',
    '',
  ].join('\n');

  return [
    { name: 'content.json', text: JSON.stringify(content) },
    { name: 'content.xml', text: contentXml },
    {
      name: 'metadata.json',
      text: JSON.stringify({ creator: { name: 'Glaukopis', version } }),
    },
    {
      name: 'manifest.json',
      text: JSON.stringify({ 'file-entries': { 'content.json': {}, 'metadata.json': {} } }),
    },
    {
      name: 'META-INF/manifest.xml',
      text:
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
        '<manifest xmlns="urn:xmind:xmap:xmlns:manifest:1.0">' +
        '<file-entry full-path="content.xml" media-type="text/xml"/>' +
        '<file-entry full-path="META-INF/" media-type=""/>' +
        '<file-entry full-path="META-INF/manifest.xml" media-type="text/xml"/>' +
        '<file-entry full-path="meta.xml" media-type="text/xml"/>' +
        '</manifest>\n',
    },
    {
      name: 'meta.xml',
      text: '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<meta xmlns="urn:xmind:xmap:xmlns:meta:2.0" version="2.0"/>\n',
    },
  ];
}
