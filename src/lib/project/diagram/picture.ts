/**
 * The diagram as a picture: what is drawn on the screen, read back from it
 * as shapes and written as SVG, the fonts in the file, or drawn as a PNG.
 *
 * Nothing is styled here a second time: the places, the colours, the lines
 * of the names as the browser broke them and the icons are taken from what
 * the page drew, so that the picture follows every theme and whatever is
 * changed in the diagram's look. What belongs to working on the map and not
 * to the map is left out: the selection, the buttons and handles, the
 * others who are there, the comments. One unit of the picture is one pixel
 * of the diagram at its actual size, whatever the zoom.
 */

import { toBase64 } from '$lib/util/base64';
import { facesFor, familiesOf, pageFaces, type Face, type Setting } from './fonts';

export interface Colour {
  hex: string;
  /** 0 to 1. */
  alpha: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextRun {
  /** Where it begins, on its baseline. */
  x: number;
  y: number;
  text: string;
  family: string;
  size: number;
  weight: string;
  italic: boolean;
  smallCaps: boolean;
  /** In pixels. */
  letterSpacing: number;
  fill: Colour;
}

export type Shape =
  | (Box & {
      kind: 'rect';
      rx: number;
      fill: Colour | null;
      stroke: Colour | null;
      strokeWidth: number;
      /** A rounded box it is drawn within. */
      clip?: Box & { rx: number };
    })
  | {
      kind: 'path';
      d: string;
      fill: Colour | null;
      stroke: Colour | null;
      strokeWidth: number;
      dash: number[];
      cap: string;
      opacity: number;
    }
  /** One line of words, in runs of one style each. */
  | { kind: 'text'; runs: TextRun[] }
  /** An icon as the page draws it, its colours made plain. */
  | (Box & { kind: 'icon'; markup: string })
  | { kind: 'group'; opacity: number; shapes: Shape[] };

export interface Picture {
  /** What the picture shows, by its viewBox: the world of the map and a margin. */
  view: Box;
  background: Colour | null;
  shapes: Shape[];
  title: string;
}

// ---- colours ----

let probe: CanvasRenderingContext2D | null = null;
const colours = new Map<string, Colour | null>();

/** A colour as CSS gives it, `color-mix()` and `color(srgb …)` among them, as hex and how opaque. */
export function colourOf(css: string): Colour | null {
  const said = css.trim();
  if (!said || said === 'none' || said === 'transparent') return null;
  const known = colours.get(said);
  if (known !== undefined) return known;
  if (!probe) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    probe = canvas.getContext('2d', { willReadFrequently: true });
  }
  let out: Colour | null = null;
  if (probe) {
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = '#000';
    probe.fillStyle = said;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
    if (a > 0) {
      const hex = (n: number) => n.toString(16).padStart(2, '0');
      out = { hex: `#${hex(r)}${hex(g)}${hex(b)}`, alpha: Math.round((a / 255) * 1000) / 1000 };
    }
  }
  colours.set(said, out);
  return out;
}

// ---- reading the screen ----

const px = (s: string) => parseFloat(s) || 0;

/** Where the font's line of letters stands below the top of its box, as the canvas measures it. */
const ascents = new Map<string, number>();
function ascentOf(font: string, size: number): number {
  const known = ascents.get(font);
  if (known !== undefined) return known;
  let ascent = size * 0.8;
  const ctx = probe ?? document.createElement('canvas').getContext('2d');
  if (ctx) {
    ctx.font = font;
    const m = ctx.measureText('Hg');
    if (m.fontBoundingBoxAscent) ascent = m.fontBoundingBoxAscent;
  }
  ascents.set(font, ascent);
  return ascent;
}

interface Reader {
  /** A rectangle of the screen, in the world of the map. */
  box: (r: DOMRect) => Box;
  k: number;
  /** Grows the bounds of the picture to take in a box. */
  take: (b: Box) => void;
}

/** A box as the page draws it: its background, its border and the rounding of its corners. */
function boxShape(el: Element, at: Reader): Extract<Shape, { kind: 'rect' }>[] {
  const cs = getComputedStyle(el);
  const b = at.box(el.getBoundingClientRect());
  at.take(b);
  const radius = (said: string) =>
    said.endsWith('%') ? (px(said) / 100) * Math.min(b.w, b.h) : px(said);
  const rx = Math.min(radius(cs.borderTopLeftRadius), b.w / 2, b.h / 2);
  const out: Extract<Shape, { kind: 'rect' }>[] = [];
  const fill = colourOf(cs.backgroundColor);
  if (fill) out.push({ kind: 'rect', ...b, rx, fill, stroke: null, strokeWidth: 0 });
  const bw = px(cs.borderTopWidth);
  const stroke = cs.borderTopStyle === 'none' ? null : colourOf(cs.borderTopColor);
  if (bw > 0 && stroke) {
    out.push({
      kind: 'rect',
      x: b.x + bw / 2,
      y: b.y + bw / 2,
      w: b.w - bw,
      h: b.h - bw,
      rx: Math.max(0, rx - bw / 2),
      fill: null,
      stroke,
      strokeWidth: bw,
    });
  }
  return out;
}

/**
 * The words in an element, a shape for each line as the browser broke
 * them, a run for each piece of one style: each run where the browser set
 * its first letter, so that nothing depends on how another program spaces
 * them.
 */
function textShapes(el: Element, at: Reader, settings: Setting[]): Shape[] {
  const out: Shape[] = [];
  let line: { top: number; runs: TextRun[] } | null = null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement?.closest('svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  const range = document.createRange();
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const parent = node.parentElement;
    if (!parent) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const size = px(cs.fontSize);
    const italic = /italic|oblique/.test(cs.fontStyle);
    const smallCaps = cs.fontVariantCaps === 'small-caps' || cs.fontVariant.includes('small-caps');
    const font = `${italic ? 'italic ' : ''}${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const fill = colourOf(cs.color);
    if (!fill) continue;
    const letterSpacing = cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing);
    let run: TextRun | null = null;
    let space = false;
    const text = node.data;
    for (let i = 0; i < text.length;) {
      const ch = String.fromCodePoint(text.codePointAt(i)!);
      const at0 = i;
      i += ch.length;
      if (/\s/.test(ch)) {
        space = true;
        continue;
      }
      range.setStart(node, at0);
      range.setEnd(node, i);
      const r = range.getClientRects()[0] ?? range.getBoundingClientRect();
      if (!r || (r.width === 0 && r.height === 0)) {
        if (run) run.text += ch;
        continue;
      }
      const b = at.box(r);
      if (!line || Math.abs(b.y - line.top) > size * 0.5) {
        line = { top: b.y, runs: [] };
        out.push({ kind: 'text', runs: line.runs });
        run = null;
      }
      if (!run) {
        run = {
          x: b.x,
          y: b.y + ascentOf(font, size),
          text: '',
          family: cs.fontFamily,
          size,
          weight: cs.fontWeight,
          italic,
          smallCaps,
          letterSpacing,
          fill,
        };
        line.runs.push(run);
        space = false;
      }
      if (space && run.text) run.text += ' ';
      space = false;
      run.text += ch;
      at.take(b);
    }
    // The next text begins a run of its own, where the browser put it.
  }
  const lines = out.filter((s) => s.kind === 'text' && s.runs.some((r) => r.text));
  for (const s of lines)
    if (s.kind === 'text')
      for (const r of s.runs)
        settings.push({ families: familiesOf(r.family), italic: r.italic, text: r.text });
  return lines;
}

/** An icon of the page, an inline SVG, as it is drawn: its colour made plain. */
function iconShape(svg: SVGSVGElement, at: Reader): Shape | null {
  const cs = getComputedStyle(svg);
  if (cs.display === 'none' || cs.visibility === 'hidden') return null;
  const b = at.box(svg.getBoundingClientRect());
  if (!b.w || !b.h) return null;
  const colour = colourOf(cs.color);
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.removeAttribute('class');
  for (const el of [copy, ...Array.from(copy.querySelectorAll('*'))]) {
    el.removeAttribute('class');
    for (const attr of Array.from(el.attributes))
      if (attr.value === 'currentColor') el.setAttribute(attr.name, colour?.hex ?? 'none');
  }
  copy.setAttribute('x', round(b.x));
  copy.setAttribute('y', round(b.y));
  copy.setAttribute('width', round(b.w));
  copy.setAttribute('height', round(b.h));
  if (colour && colour.alpha < 1) copy.setAttribute('opacity', String(colour.alpha));
  at.take(b);
  return { kind: 'icon', ...b, markup: new XMLSerializer().serializeToString(copy) };
}

/** The ring of how far the writing has come: empty for an idea, half full for a draft, full when done. */
function dotShapes(dot: Element, status: string, at: Reader): Shape[] {
  const cs = getComputedStyle(dot);
  const b = at.box(dot.getBoundingClientRect());
  const colour = colourOf(cs.borderTopColor);
  if (!colour) return [];
  const bw = px(cs.borderTopWidth);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const R = b.w / 2;
  const r = R - bw / 2;
  const circle = (rr: number) =>
    `M ${round(cx - rr)} ${round(cy)} a ${round(rr)} ${round(rr)} 0 1 0 ${round(2 * rr)} 0 a ${round(rr)} ${round(rr)} 0 1 0 ${round(-2 * rr)} 0 Z`;
  const out: Shape[] = [];
  const plain = { stroke: null, strokeWidth: 0, dash: [], cap: 'butt', opacity: 1 };
  if (status === 'done') out.push({ kind: 'path', d: circle(R), fill: colour, ...plain });
  else if (status === 'draft')
    out.push({
      kind: 'path',
      d: `M ${round(cx)} ${round(cy - R)} A ${round(R)} ${round(R)} 0 0 0 ${round(cx)} ${round(cy + R)} Z`,
      fill: colour,
      ...plain,
    });
  out.push({ kind: 'path', d: circle(r), fill: null, ...plain, stroke: colour, strokeWidth: bw });
  return out;
}

/** A line or a curve of `svg.lines`, with the stroke it is drawn with. */
function strokeShape(el: SVGGeometryElement, d: string, at: Reader): Shape | null {
  const cs = getComputedStyle(el);
  const stroke = colourOf(cs.stroke);
  if (!stroke) return null;
  const parent = el.parentElement;
  const opacity =
    (parseFloat(cs.opacity) || 1) *
    (parent && parent.tagName.toLowerCase() === 'g'
      ? parseFloat(getComputedStyle(parent).opacity) || 1
      : 1);
  const dash =
    cs.strokeDasharray && cs.strokeDasharray !== 'none'
      ? cs.strokeDasharray
          .split(/[\s,]+/)
          .map(px)
          .filter((n) => n > 0)
      : [];
  try {
    const bb = el.getBBox();
    at.take({ x: bb.x, y: bb.y, w: bb.width, h: bb.height });
  } catch {
    // Not drawn: nothing to take in.
  }
  return {
    kind: 'path',
    d,
    fill: null,
    stroke,
    strokeWidth: px(cs.strokeWidth) || 1,
    dash,
    cap: cs.strokeLinecap || 'butt',
    opacity,
  };
}

/**
 * The diagram, `.diagram`, as it is drawn now: the lines, the words of the
 * associations, then the elements, each box with its name and its marks.
 * `settings` gathers what is set in which font, for the fonts of the file.
 */
export function pictureOf(
  diagram: HTMLElement,
  title: string,
  margin = 48,
): { picture: Picture; settings: Setting[] } {
  const world = diagram.querySelector<HTMLElement>('.world');
  if (!world) throw new Error('No diagram to draw');
  const origin = world.getBoundingClientRect();
  const k = new DOMMatrixReadOnly(getComputedStyle(world).transform).a || 1;
  const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  const at: Reader = {
    k,
    box: (r) => ({
      x: (r.left - origin.left) / k,
      y: (r.top - origin.top) / k,
      w: r.width / k,
      h: r.height / k,
    }),
    take: (b) => {
      bounds.left = Math.min(bounds.left, b.x);
      bounds.top = Math.min(bounds.top, b.y);
      bounds.right = Math.max(bounds.right, b.x + b.w);
      bounds.bottom = Math.max(bounds.bottom, b.y + b.h);
    },
  };
  const settings: Setting[] = [];
  const shapes: Shape[] = [];

  // The lines of the hierarchy and the curves of the associations.
  for (const line of Array.from(world.querySelectorAll<SVGLineElement>('svg.lines line.branch'))) {
    const d = `M ${round(line.x1.baseVal.value)} ${round(line.y1.baseVal.value)} L ${round(line.x2.baseVal.value)} ${round(line.y2.baseVal.value)}`;
    const s = strokeShape(line, d, at);
    if (s) shapes.push(s);
  }
  for (const curve of Array.from(
    world.querySelectorAll<SVGPathElement>('svg.lines g.association path.curve'),
  )) {
    const s = strokeShape(curve, curve.getAttribute('d') ?? '', at);
    if (s) shapes.push(s);
  }

  // The words of the associations.
  for (const label of Array.from(world.querySelectorAll(':scope > .link-label:not(.editing)'))) {
    shapes.push(...boxShape(label, at), ...textShapes(label, at, settings));
  }

  // The elements.
  for (const node of Array.from(world.querySelectorAll<HTMLElement>('.node[data-node]'))) {
    const cs = getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const own: Shape[] = [];
    const [fill, ...border] = boxShape(node, at);
    const box = at.box(node.getBoundingClientRect());
    if (fill?.fill) own.push(fill);
    else if (fill) border.unshift(fill);
    if (node.classList.contains('kinded')) {
      const colour = colourOf(cs.getPropertyValue('--kind'));
      const bw = px(cs.borderTopWidth);
      if (colour) {
        const inner = {
          x: box.x + bw,
          y: box.y + bw,
          w: box.w - 2 * bw,
          h: box.h - 2 * bw,
          rx: Math.max(0, (fill?.rx ?? 0) - bw),
        };
        own.push({
          kind: 'rect',
          x: inner.x,
          y: inner.y,
          w: 4,
          h: inner.h,
          rx: 0,
          fill: colour,
          stroke: null,
          strokeWidth: 0,
          clip: inner,
        });
      }
    }
    own.push(...border);
    const caption = node.querySelector('.caption');
    if (caption) own.push(...textShapes(caption, at, settings));
    for (const mark of Array.from(node.querySelectorAll('.marks .mark:not(.comments)'))) {
      for (const svg of Array.from(mark.querySelectorAll<SVGSVGElement>(':scope > svg'))) {
        const s = iconShape(svg, at);
        if (s) own.push(s);
      }
      const dot = mark.querySelector(':scope > .dot');
      if (dot) {
        const status = ['done', 'draft'].find((c) => mark.classList.contains(c)) ?? 'idea';
        own.push(...dotShapes(dot, status, at));
      }
      own.push(...textShapes(mark, at, settings));
    }
    const fold = node.querySelector('.fold.folded');
    if (fold && parseFloat(getComputedStyle(fold).opacity) > 0)
      own.push(...boxShape(fold, at), ...textShapes(fold, at, settings));
    const opacity = parseFloat(cs.opacity);
    if (opacity < 1) shapes.push({ kind: 'group', opacity, shapes: own });
    else shapes.push(...own);
  }

  if (!Number.isFinite(bounds.left)) {
    bounds.left = bounds.top = 0;
    bounds.right = bounds.bottom = 0;
  }
  const view = {
    x: Math.floor(bounds.left - margin),
    y: Math.floor(bounds.top - margin),
    w: Math.ceil(bounds.right - bounds.left + 2 * margin),
    h: Math.ceil(bounds.bottom - bounds.top + 2 * margin),
  };
  return {
    picture: {
      view,
      background: colourOf(getComputedStyle(diagram).backgroundColor),
      shapes,
      title,
    },
    settings,
  };
}

// ---- the fonts ----

const fetched = new Map<string, Promise<string | null>>();

function dataOf(url: string): Promise<string | null> {
  let known = fetched.get(url);
  if (!known) {
    known = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((b) => toBase64(new Uint8Array(b)))
      .catch(() => null);
    fetched.set(url, known);
  }
  return known;
}

/**
 * The faces the words of the picture are set in, as CSS with their files
 * in it; `complete` where every face that was needed could be read.
 */
export async function fontsOf(
  settings: Setting[],
  faces: Face[] = pageFaces(),
): Promise<{ css: string; complete: boolean }> {
  const wanted = facesFor(faces, settings);
  let complete = wanted.length > 0 || settings.length === 0;
  let css = '';
  for (const face of wanted) {
    const data = await dataOf(face.url);
    if (!data) {
      complete = false;
      continue;
    }
    css +=
      `@font-face { font-family: '${face.family.replace(/'/g, "\\'")}'; ` +
      `font-style: ${face.italic ? 'italic' : 'normal'}; font-weight: ${face.weight}; ` +
      `src: url(data:font/woff2;base64,${data}) format('woff2');` +
      (face.range ? ` unicode-range: ${face.range};` : '') +
      ' }\n';
  }
  return { css, complete };
}

// ---- writing ----

function round(n: number): string {
  return String(Math.round(n * 10) / 10);
}

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const paint = (what: 'fill' | 'stroke', c: Colour | null) =>
  c
    ? ` ${what}="${c.hex}"${c.alpha < 1 ? ` ${what}-opacity="${c.alpha}"` : ''}`
    : ` ${what}="none"`;

/** The picture as an SVG file, with the fonts given (`fontsOf`). */
export function toSvg(picture: Picture, fonts = ''): string {
  const clips: string[] = [];
  const write = (shapes: Shape[]): string => {
    let out = '';
    for (const s of shapes) {
      switch (s.kind) {
        case 'rect': {
          let clip = '';
          if (s.clip) {
            const id = `clip${clips.length + 1}`;
            const c = s.clip;
            clips.push(
              `<clipPath id="${id}"><rect x="${round(c.x)}" y="${round(c.y)}" width="${round(c.w)}" height="${round(c.h)}" rx="${round(c.rx)}"/></clipPath>`,
            );
            clip = ` clip-path="url(#${id})"`;
          }
          out +=
            `<rect x="${round(s.x)}" y="${round(s.y)}" width="${round(s.w)}" height="${round(s.h)}"` +
            (s.rx ? ` rx="${round(s.rx)}"` : '') +
            paint('fill', s.fill) +
            (s.stroke
              ? paint('stroke', s.stroke) + ` stroke-width="${round(s.strokeWidth)}"`
              : '') +
            `${clip}/>\n`;
          break;
        }
        case 'path':
          out +=
            `<path d="${escape(s.d)}"` +
            paint('fill', s.fill) +
            (s.stroke
              ? paint('stroke', s.stroke) +
                ` stroke-width="${round(s.strokeWidth)}"` +
                (s.cap !== 'butt' ? ` stroke-linecap="${s.cap}"` : '') +
                (s.dash.length ? ` stroke-dasharray="${s.dash.map(round).join(' ')}"` : '')
              : '') +
            (s.opacity < 1 ? ` opacity="${Math.round(s.opacity * 1000) / 1000}"` : '') +
            '/>\n';
          break;
        case 'text':
          out += '<text xml:space="preserve">';
          for (const r of s.runs) {
            if (!r.text) continue;
            out +=
              `<tspan x="${round(r.x)}" y="${round(r.y)}" font-family="${escape(r.family)}" font-size="${round(r.size)}"` +
              (r.weight !== '400' && r.weight !== 'normal' ? ` font-weight="${r.weight}"` : '') +
              (r.italic ? ' font-style="italic"' : '') +
              (r.smallCaps ? ' font-variant="small-caps"' : '') +
              (r.letterSpacing ? ` letter-spacing="${round(r.letterSpacing)}"` : '') +
              paint('fill', r.fill) +
              `>${escape(r.text)}</tspan>`;
          }
          out += '</text>\n';
          break;
        case 'icon':
          out += `${s.markup}\n`;
          break;
        case 'group':
          out += `<g opacity="${Math.round(s.opacity * 1000) / 1000}">\n${write(s.shapes)}</g>\n`;
          break;
      }
    }
    return out;
  };
  const v = picture.view;
  const body = write(picture.shapes);
  const background = picture.background
    ? `<rect x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}"${paint('fill', picture.background)}/>\n`
    : '';
  const defs =
    fonts || clips.length
      ? `<defs>\n${fonts ? `<style>\n${fonts}</style>\n` : ''}${clips.join('\n')}${clips.length ? '\n' : ''}</defs>\n`
      : '';
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${v.w}" height="${v.h}" viewBox="${v.x} ${v.y} ${v.w} ${v.h}" role="img" aria-label="${escape(picture.title)}">\n` +
    `<title>${escape(picture.title)}</title>\n` +
    defs +
    background +
    body +
    '</svg>\n'
  );
}

// ---- the image ----

/** The largest side a canvas can have in the engines of today. */
const CANVAS_MOST = 16384;

/**
 * The scale an image of the picture is made at: twice its size, less where
 * that would be larger than a canvas can be; nothing where even half its
 * size would be.
 */
export function imageScale(view: Box, wanted = 2): number | null {
  const largest = Math.max(view.w, view.h);
  if (largest * wanted <= CANVAS_MOST) return wanted;
  const fits = Math.floor((CANVAS_MOST / largest) * 10) / 10;
  return fits >= 0.5 ? fits : null;
}

/** The picture as a PNG, from its SVG drawn on a canvas at `scale`. */
export async function toPng(
  picture: Picture,
  svg: string,
  scale: number,
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const width = Math.round(picture.view.w * scale);
  const height = Math.round(picture.view.h * scale);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'sync';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas to draw on');
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/png'));
    if (!blob) throw new Error('The image could not be made');
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
