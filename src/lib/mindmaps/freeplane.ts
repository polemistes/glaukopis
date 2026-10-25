/**
 * The file of Freeplane and FreeMind (`.mm`), read and written: the format
 * nearly every program of mind maps reads. A tree of `node`s, each with its
 * words (`TEXT`, or the HTML of a `richcontent` of the kind `NODE` where the
 * name has marks), its note (a `richcontent` of the kind `NOTE`, as HTML),
 * whether it is folded, the side of the middle it stands on, icons,
 * attributes, the colour of its edge, and arrows to other nodes with their
 * words. Written as Freeplane 1.x writes it, which FreeMind opens.
 *
 * How far the writing has come is told by three of the icons both programs
 * have (`idea`, `pencil`, `button_ok`); the kind, the time and being left
 * out of the document by attributes of those names, the kind also by the
 * colour of the edge.
 */

import { isTime } from '$lib/timeline/time';
import type { Status } from '$lib/project/model/types';
import { escapeAttr, hasMarks, htmlToBlocks, nameHtml, nameOfHtml, plainToBlocks } from './html';
import {
  leave,
  plainName,
  timeOfWords,
  timeWords,
  topic,
  type LeftOut,
  type MindMap,
  type Topic,
} from './map';

/** The icons that say how far the writing has come, by what they say. */
const ICONS: Record<Status, string> = { idea: 'idea', draft: 'pencil', done: 'button_ok' };
const STATUS_OF: Record<string, Status> = { idea: 'idea', pencil: 'draft', button_ok: 'done' };

/** The names of the attributes that say what else is said of an element. */
export const ATTRIBUTE_KIND = 'Kind';
export const ATTRIBUTE_TIME = 'Time';
export const ATTRIBUTE_LEFT_OUT = 'Left out';

/** What a node says, read as one of the timeline's times. */
const aTime = (text: string) => isTime(text, 'dates') || isTime(text, 'units');

/** The direct children of an element of the given name. */
const childrenNamed = (el: Element, name: string) =>
  [...el.children].filter((c) => c.localName.toLowerCase() === name);

/** The HTML a `richcontent` holds, as a string; or its words, where it holds no HTML. */
function richHtml(rich: Element): { html: string } | { plain: string } {
  const html = [...rich.children].find((c) => c.localName.toLowerCase() === 'html');
  if (!html) return { plain: rich.textContent ?? '' };
  const body = [...html.children].find((c) => c.localName.toLowerCase() === 'body') ?? html;
  const serializer = new XMLSerializer();
  return {
    html: [...body.childNodes]
      .map((n) => serializer.serializeToString(n))
      .join('')
      // What XML writes of the namespace of XHTML is nothing to HTML.
      .replace(/ xmlns="[^"]*"/g, ''),
  };
}

/** Whether what a file holds is a map of Freeplane or FreeMind. */
export function isFreeplane(xml: string): boolean {
  return /<map[\s>]/.test(xml.slice(0, 4096));
}

/**
 * Reads a map of Freeplane or FreeMind: the node in the middle and all
 * under it, and the arrows between them. What has no place in a project
 * is counted: clouds, pictures, summaries, links to elsewhere, icons and
 * attributes of other meaning, times that are not times, arrows to
 * nothing.
 */
export function readFreeplane(xml: string): { map: MindMap; leftOut: LeftOut } {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const map = doc.documentElement;
  if (!map || map.localName !== 'map' || doc.getElementsByTagName('parsererror').length)
    throw new Error('not a map of Freeplane or FreeMind');
  const first = childrenNamed(map, 'node')[0];
  if (!first) throw new Error('not a map of Freeplane or FreeMind');
  const left: LeftOut = {};
  const links: { from: string; to: string; label: string }[] = [];
  const seen = new Set<string>();

  const read = (el: Element, depth: number): Topic => {
    const id = el.getAttribute('ID') || `node-${seen.size + 1}`;
    seen.add(id);
    const words = el.getAttribute('TEXT') ?? '';
    const asHtml = (html: string) =>
      nameOfHtml(new DOMParser().parseFromString(html, 'text/html').body);
    // FreeMind of old kept a name with marks as HTML in its words.
    const t = topic(id, /^\s*<html/i.test(words) ? asHtml(words) : plainName(words));
    for (const rich of childrenNamed(el, 'richcontent')) {
      const type = (rich.getAttribute('TYPE') ?? '').toUpperCase();
      const said = richHtml(rich);
      if (type === 'NODE') t.name = 'html' in said ? asHtml(said.html) : plainName(said.plain);
      else if (type === 'NOTE' || type === 'DETAILS') {
        const blocks = 'html' in said ? htmlToBlocks(said.html, left) : plainToBlocks(said.plain);
        // The details stand before the note, as Freeplane shows them.
        t.text = type === 'DETAILS' ? [...blocks, ...t.text] : [...t.text, ...blocks];
      }
    }
    t.folded = el.getAttribute('FOLDED') === 'true';
    const position = el.getAttribute('POSITION');
    if (depth === 1 && (position === 'left' || position === 'right')) t.side = position;
    if (el.getAttribute('LINK')) leave(left, 'hyperlinks');
    const colour = childrenNamed(el, 'edge')[0]?.getAttribute('COLOR') ?? null;
    for (const icon of childrenNamed(el, 'icon')) {
      const status = STATUS_OF[icon.getAttribute('BUILTIN') ?? ''];
      // The furthest the icons say the writing has come.
      if (status) {
        if (
          !t.status ||
          ['idea', 'draft', 'done'].indexOf(status) > ['idea', 'draft', 'done'].indexOf(t.status)
        )
          t.status = status;
      } else leave(left, 'icons');
    }
    for (const a of childrenNamed(el, 'attribute')) {
      const key = (a.getAttribute('NAME') ?? '').trim().toLowerCase();
      const value = (a.getAttribute('VALUE') ?? '').trim();
      if (key === ATTRIBUTE_KIND.toLowerCase() && value && !t.kind)
        t.kind = { name: value, colour };
      else if (key === ATTRIBUTE_TIME.toLowerCase() && value) {
        const when = timeOfWords(value, aTime);
        if (when) t.when = when;
        else leave(left, 'times');
      } else if (key === ATTRIBUTE_LEFT_OUT.toLowerCase())
        t.excluded = !/^(false|no|0|)$/i.test(value);
      else leave(left, 'attributes');
    }
    leave(left, 'clouds', childrenNamed(el, 'cloud').length);
    for (const hook of childrenNamed(el, 'hook')) {
      const what = hook.getAttribute('NAME') ?? '';
      if (what === 'ExternalObject' || /image/i.test(what)) leave(left, 'images');
      else if (what === 'SummaryNode') leave(left, 'summaries');
    }
    for (const arrow of childrenNamed(el, 'arrowlink')) {
      const to = arrow.getAttribute('DESTINATION');
      const label =
        arrow.getAttribute('MIDDLE_LABEL') ||
        arrow.getAttribute('SOURCE_LABEL') ||
        arrow.getAttribute('TARGET_LABEL') ||
        '';
      if (to) links.push({ from: id, to, label: label.replace(/\s+/g, ' ').trim() });
      else leave(left, 'associations');
    }
    t.children = childrenNamed(el, 'node').map((c) => read(c, depth + 1));
    return t;
  };

  const root = read(first, 0);
  const known = links.filter((l) => seen.has(l.to) && l.to !== l.from);
  leave(left, 'associations', links.length - known.length);
  const name = root.name
    .map((i) => (i.kind === 'text' ? i.text : ''))
    .join('')
    .trim();
  return { map: { name, root, links: known }, leftOut: left };
}

/**
 * Writes a mind map as Freeplane writes its maps: one node within another,
 * two spaces deeper each, so that the file reads well and compares well.
 * `notes` gives the HTML of a topic's text, or nothing.
 */
export function writeFreeplane(map: MindMap, notes: (t: Topic) => string): string {
  const ids = new Map<string, string>();
  let n = 0;
  const idOf = (id: string) => {
    let said = ids.get(id);
    if (!said) {
      said = `ID_${++n}`;
      ids.set(id, said);
    }
    return said;
  };
  const known = new Set<string>();
  const gather = (t: Topic) => {
    known.add(t.id);
    idOf(t.id);
    t.children.forEach(gather);
  };
  gather(map.root);
  const from = new Map<string, { to: string; label: string }[]>();
  for (const l of map.links) {
    if (!known.has(l.from) || !known.has(l.to)) continue;
    const list = from.get(l.from) ?? [];
    list.push({ to: l.to, label: l.label });
    from.set(l.from, list);
  }

  const lines: string[] = [
    '<map version="freeplane 1.9.13">',
    '<!--To view this file, download free mind mapping software Freeplane from https://www.freeplane.org -->',
  ];
  const write = (t: Topic, depth: number, pad: string) => {
    const words = t.name.map((i) => (i.kind === 'text' ? i.text : '')).join('');
    let attrs = `TEXT="${escapeAttr(words)}" ID="${idOf(t.id)}"`;
    if (t.folded && t.children.length) attrs += ' FOLDED="true"';
    if (depth === 1 && t.side) attrs += ` POSITION="${t.side}"`;
    const inner: string[] = [];
    const more = `${pad}  `;
    if (t.kind?.colour) inner.push(`${more}<edge COLOR="${escapeAttr(t.kind.colour)}"/>`);
    if (t.status) inner.push(`${more}<icon BUILTIN="${ICONS[t.status]}"/>`);
    if (hasMarks(t.name))
      inner.push(
        `${more}<richcontent TYPE="NODE"><html><head></head><body><p>${nameHtml(t.name)}</p></body></html></richcontent>`,
      );
    const note = notes(t);
    if (note)
      inner.push(
        `${more}<richcontent TYPE="NOTE"><html><head></head><body>${note}</body></html></richcontent>`,
      );
    if (t.kind)
      inner.push(`${more}<attribute NAME="${ATTRIBUTE_KIND}" VALUE="${escapeAttr(t.kind.name)}"/>`);
    if (t.when)
      inner.push(
        `${more}<attribute NAME="${ATTRIBUTE_TIME}" VALUE="${escapeAttr(timeWords(t.when))}"/>`,
      );
    if (t.excluded) inner.push(`${more}<attribute NAME="${ATTRIBUTE_LEFT_OUT}" VALUE="true"/>`);
    for (const l of from.get(t.id) ?? [])
      inner.push(
        `${more}<arrowlink DESTINATION="${idOf(l.to)}" STARTARROW="None" ENDARROW="None"${l.label ? ` MIDDLE_LABEL="${escapeAttr(l.label)}"` : ''}/>`,
      );
    if (!inner.length && !t.children.length) {
      lines.push(`${pad}<node ${attrs}/>`);
      return;
    }
    lines.push(`${pad}<node ${attrs}>`, ...inner);
    for (const c of t.children) write(c, depth + 1, more);
    lines.push(`${pad}</node>`);
  };
  write(map.root, 0, '');
  lines.push('</map>', '');
  return lines.join('\n');
}
