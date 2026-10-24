#!/usr/bin/env node
// Writes the layouts that ship (resources/formats/*.json) in the shape of
// 2026-10-19: a header and a footer, each with three places of items, in
// place of `pageNumbers` and `runningHead`; the pages' numbering and restart;
// each level of heading with where it begins (`begins`) in place of
// `newPage`, and its numbering; and, of 2026-10-24, paragraphs with both
// lengths, the indent of the first line and the space between them, in place
// of the choice `paragraphs` between them, the length not chosen nought. The
// rules are those of
// `DocumentFormat::modernise` in crates/core/src/formats/mod.rs, which reads
// a layout of the user's own in the old shape the same way.
//
// The old shape, for the record:
//   "pageNumbers": { "show": true, "position": "bottom-center" | "top-left" | …, "firstPage": true }
//   "runningHead": { "content": "none" | "title" | "author" | "author-title" | "text",
//                    "text": "", "align": "left" | "center" | "right", "case": "none" | "upper" | "smallcaps" }
//   heading level: { …, "newPage": false }
//   "text": { "paragraphs": "indent" | "spaced", "indent": "1.27cm", "spaceBetween": "12pt", … }
//
// Run: node scripts/modernise-formats.mjs

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../resources/formats/', import.meta.url).pathname;

function margin() {
  return {
    shown: false,
    firstPage: true,
    openers: true,
    alternate: false,
    left: [],
    center: [],
    right: [],
    separator: ' · ',
    size: 0,
    italic: false,
    case: 'none',
  };
}

function place(m, align) {
  if (align === 'center') return m.center;
  if (align === 'right') return m.right;
  return m.left;
}

function convert(f) {
  const numbers = { show: true, position: 'bottom-center', firstPage: true, ...(f.pageNumbers ?? {}) };
  const head = { content: 'none', text: '', align: 'left', case: 'none', ...(f.runningHead ?? {}) };
  const header = margin();
  const footer = margin();
  const items = {
    none: [],
    title: [{ kind: 'title' }],
    author: [{ kind: 'author' }],
    'author-title': [{ kind: 'author' }, { kind: 'title' }],
    text: head.text.trim() ? [{ kind: 'text', text: head.text.trim() }] : [],
  }[head.content] ?? [];
  if (items.length === 2) header.separator = ' / ';
  place(header, head.align).push(...items);
  header.case = head.case ?? 'none';
  if (numbers.show) {
    const [where, align] = numbers.position.split('-');
    place(where === 'top' ? header : footer, align).push({ kind: 'page-number' });
  }
  for (const m of [header, footer]) {
    m.shown = m.left.length + m.center.length + m.right.length > 0;
    m.firstPage = numbers.firstPage;
  }

  // The keys in their order, the new ones where the old stood.
  const out = {};
  for (const [key, value] of Object.entries(f)) {
    if (key === 'pageNumbers') {
      out.header = header;
      out.footer = footer;
    } else if (key === 'runningHead') {
      if (!('pageNumbers' in f)) {
        out.header = header;
        out.footer = footer;
      }
    } else if (key === 'text') {
      out.text = paragraphs(value);
    } else if (key === 'page') {
      out.page = { ...value, numbering: value.numbering ?? 'arabic', restart: value.restart ?? false };
    } else if (key === 'headings') {
      out.headings = {
        ...value,
        levels: (value.levels ?? []).map((l) => {
          const level = {};
          for (const [k, v] of Object.entries(l)) {
            if (k === 'newPage') level.begins = v ? 'page' : 'text';
            else level[k] = v;
          }
          if (!('begins' in level)) level.begins = 'text';
          if (!('numbering' in level)) level.numbering = 'as-above';
          return level;
        }),
      };
    } else {
      out[key] = value;
    }
  }
  if (!('header' in out) && !('footer' in out)) {
    out.header = header;
    out.footer = footer;
  }
  return out;
}

/** Whether a length is nought: `0pt`, `0cm`. */
const nought = (length) => /^\s*-?0+([.,]0*)?\s*[a-z]*\s*$/i.test(String(length ?? '0'));

/**
 * The text's paragraphs with both lengths, as `DocumentFormat::modernise`
 * has them: indented, the space between is nought; spaced, the indent is,
 * and a spaced layout that said no space has the old default's.
 */
function paragraphs(text) {
  if (!('paragraphs' in text)) return text;
  const { paragraphs: told, ...rest } = text;
  if (told === 'spaced') {
    if (!nought(rest.indent ?? '1.27cm')) rest.indent = '0cm';
    if (nought(rest.spaceBetween)) rest.spaceBetween = '12pt';
  } else if (!nought(rest.spaceBetween ?? '12pt')) rest.spaceBetween = '0pt';
  return rest;
}

// The layouts are formatted by hand, so they are edited where they change
// rather than printed anew: what is unchanged keeps its lines.

/** The index of the bracket that closes the one at `open`, past strings. */
function closing(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      for (i++; text[i] !== '"'; i++) if (text[i] === '\\') i++;
    } else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`no closing bracket for ${open}`);
}

/** A value on one line, as the layouts write short objects: `{ "a": 1, "b": [] }`. */
function inline(value) {
  if (Array.isArray(value)) return value.length ? `[${value.map(inline).join(', ')}]` : '[]';
  if (value && typeof value === 'object') {
    const pairs = Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`);
    return pairs.length ? `{ ${pairs.join(', ')} }` : '{}';
  }
  return JSON.stringify(value);
}

/** Adds keys at the end of the object whose `{` is at `open`, on lines of their own where it has them. */
function append(text, open, pairs) {
  const close = closing(text, open);
  const body = text.slice(open + 1, close);
  const entries = Object.entries(pairs).map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`);
  if (!entries.length) return text;
  const last = body.trimEnd();
  const tail = open + 1 + last.length;
  if (body.includes('\n')) {
    const indent = body.match(/\n([ \t]*)"/)[1];
    return text.slice(0, tail) + entries.map((e) => `,\n${indent}${e}`).join('') + text.slice(tail);
  }
  return text.slice(0, tail) + entries.map((e) => `, ${e}`).join('') + text.slice(tail);
}

/** The text of a layout in the new shape. */
function modernise(text) {
  const f = JSON.parse(text);
  const next = convert(f);
  let out = text;
  // The header and the footer where the page numbers stood, the running head gone.
  const key = (name) => out.search(new RegExp(`\\n([ \\t]*)"${name}":`));
  for (const name of ['runningHead', 'pageNumbers']) {
    const at = key(name);
    if (at < 0) continue;
    const indent = out.slice(at + 1).match(/^[ \t]*/)[0];
    const open = out.indexOf('{', at);
    let end = closing(out, open) + 1;
    const comma = out.slice(end).match(/^\s*,/);
    const replacement =
      name === 'pageNumbers' || key('pageNumbers') < 0
        ? `\n${indent}"header": ${inline(next.header)},\n${indent}"footer": ${inline(next.footer)}`
        : '';
    if (comma) end += comma[0].length;
    else if (!replacement) {
      // The last key: the comma before it goes with it.
      const before = out.slice(0, at).trimEnd();
      if (before.endsWith(',')) {
        out = before.slice(0, -1) + out.slice(at, end) + out.slice(end);
      }
    }
    out = out.slice(0, at) + replacement + (comma && replacement ? ',' : '') + out.slice(end);
  }
  if (!('pageNumbers' in f) && !('runningHead' in f) && !('header' in f) && !('footer' in f)) {
    out = append(out, out.indexOf('{'), { header: next.header, footer: next.footer });
  }
  // The paragraphs with both lengths, the choice between them gone.
  const textAt = key('text');
  if (textAt >= 0 && 'paragraphs' in (f.text ?? {})) {
    const open = out.indexOf('{', textAt);
    const close = closing(out, open);
    let object = out.slice(open, close + 1);
    const was = f.text;
    const now = next.text;
    object = object.replace(/\n[ \t]*"paragraphs": "[a-z]+",/, '').replace(/,?\s*"paragraphs": "[a-z]+"/, '');
    for (const [k, v] of [
      ['indent', now.indent],
      ['spaceBetween', now.spaceBetween],
    ]) {
      if (v === was[k]) continue;
      if (k in was) object = object.replace(new RegExp(`"${k}": "[^"]*"`), `"${k}": ${JSON.stringify(v)}`);
      else object = append(object, 0, { [k]: v });
    }
    out = out.slice(0, open) + object + out.slice(close + 1);
  }
  // The pages' numbering.
  const page = key('page');
  if (page >= 0) {
    const missing = {};
    if (!('numbering' in f.page)) missing.numbering = 'arabic';
    if (!('restart' in f.page)) missing.restart = false;
    out = append(out, out.indexOf('{', page), missing);
  }
  // Where each level begins, and its numbering.
  const levels = out.indexOf('"levels": [');
  if (levels >= 0) {
    let at = out.indexOf('[', levels) + 1;
    for (const level of f.headings.levels) {
      const open = out.indexOf('{', at);
      const close = closing(out, open);
      let object = out.slice(open, close + 1);
      if ('newPage' in level) {
        object = object.replace(/"newPage": (true|false)/, (_, v) => `"begins": "${v === 'true' ? 'page' : 'text'}"`);
      }
      const missing = {};
      if (!('newPage' in level) && !('begins' in level)) missing.begins = 'text';
      if (!('numbering' in level)) missing.numbering = 'as-above';
      object = append(object, 0, missing);
      out = out.slice(0, open) + object + out.slice(close + 1);
      at = open + object.length;
    }
  }
  return { out, next };
}

/** The same value, keys in any order. */
function same(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => same(x, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    return same(ka, kb) && ka.every((k) => same(a[k], b[k]));
  }
  return a === b;
}

let changed = 0;
for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const path = join(dir, name);
  const before = readFileSync(path, 'utf8');
  const { out, next } = modernise(before);
  if (!same(JSON.parse(out), next)) {
    console.error(`${name}: the edited text does not say what the new shape says`);
    process.exitCode = 1;
    continue;
  }
  if (out !== before) {
    writeFileSync(path, out);
    changed++;
  }
}
console.log(`${changed} layouts written in the new shape`);
