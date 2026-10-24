// Makes the templates of the journals, the publishers and the style guides,
// resources/templates/<id>.json, from the format files of those kinds in
// resources/formats/ (ADR 0038). Each template keeps its former format as
// its layout and its style, is based on the generic template of its kind of
// writing, and carries the format's limits as its requirements. The script
// also takes `limits` and `suggests` out of every format file, since they
// now live in the templates; the `suggests` of the fiction, stage and poetry
// formats are the `passageKinds` of the generic templates, written by hand.
//
//   node scripts/templates-from-formats.mjs
//
// Run it again whenever a format of those kinds is added or its source or
// description changes. It can be run any number of times: once the limits
// have left a format, the requirements of its template are kept as the
// template has them, so that nothing is lost, and a template is written only
// where it would change.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'resources');
const formatsDir = join(root, 'formats');
const templatesDir = join(root, 'templates');

/** The kinds of format that become templates, and the group each goes in. */
const GROUPS = new Set(['journal', 'publisher', 'style-guide']);

/**
 * What each is based on. Journals and the professional style guide are
 * articles; publishers of books are books; the student style guides are
 * papers. MHRA's guide serves theses and articles alike and leaves the
 * abstract and the title page to the journal or series, so a paper, which
 * has neither, is the shape of both; the Turabian tip sheets, MLA's first
 * chapter and SBL's student supplement describe the term paper outright.
 * Taylor & Francis's layout is a publisher's, but for its journals, so it
 * is an article.
 */
const BASES = {
  'apa-7-professional': 'article',
  'taylor-francis-journals': 'article',
  'apa-7-student': 'paper',
  'chicago-turabian-paper': 'paper',
  'mla-9': 'paper',
  'sbl-2-student': 'paper',
  'mhra-4': 'paper',
};
const BY_KIND = { journal: 'article', publisher: 'book', 'style-guide': 'paper' };

/**
 * Where a journal says what parts it wants beyond what the base has, from
 * docs/research/formats-journals.md; nothing is listed that the notes do
 * not say. `without` takes a kind or a part out of the contents and the
 * kinds; `after` moves a part to stand after another.
 */
const ADJUSTMENTS = {
  // "Remove names, affiliations, personal references, acknowledgements" at submission.
  'past-and-present': { without: ['acknowledgements'] },
  // "acknowledgements withheld until acceptance".
  'classical-philology': { without: ['acknowledgements'] },
  // Triple-anonymous: "no acknowledgements or funding information".
  mind: { without: ['acknowledgements'] },
  // "by omitting any acknowledgments".
  'journal-of-biblical-literature': { without: ['acknowledgements'] },
  // The acknowledgements go on the separate title page, not in the manuscript.
  'american-sociological-review': { without: ['acknowledgements'] },
  // "Footnotes are not permitted."
  'plos-one': { without: ['notes'] },
  // "Use endnotes rather than footnotes", "placed after the references".
  'language-accepted': { after: [['notes', 'bibliography']] },
  'language-submission': { after: [['notes', 'bibliography']] },
};

const EMPTY_REQUIREMENTS = { words: null, abstractWords: null, keywords: null, anonymous: false, note: '' };

/** A template as its file has it, with what it leaves to its base filled in from the base's file. */
function whole(id, seen = new Set()) {
  const path = join(templatesDir, `${id}.json`);
  if (!existsSync(path)) return null;
  const own = JSON.parse(readFileSync(path, 'utf8'));
  if (!own.basedOn || seen.has(own.basedOn)) return own;
  seen.add(id);
  const base = whole(own.basedOn, seen);
  if (!base) return own;
  const made = { ...own };
  for (const field of ['layout', 'style', 'contents', 'kinds', 'passageKinds', 'kindKeys', 'requirements', 'outputs']) {
    if (made[field] === undefined && base[field] !== undefined) made[field] = base[field];
  }
  return made;
}

const nameOf = (item) => item.part ?? item.kind;

/** The contents and the kinds of a template, with a journal's adjustments. */
function adjusted(base, adjustment) {
  let contents = base.contents.map((item) => ({ ...item }));
  let kinds = [...base.kinds];
  if (!adjustment) return { contents, kinds };
  for (const name of adjustment.without ?? []) {
    contents = contents.filter((item) => nameOf(item) !== name);
    kinds = kinds.filter((kind) => kind !== name);
  }
  for (const [name, afterName] of adjustment.after ?? []) {
    const moved = contents.find((item) => nameOf(item) === name);
    if (!moved) continue;
    contents = contents.filter((item) => item !== moved);
    const at = contents.findIndex((item) => nameOf(item) === afterName);
    contents.splice(at < 0 ? contents.length : at + 1, 0, moved);
  }
  return { contents, kinds };
}

/** The requirements of a template: the format's limits, or what the template already has. */
function requirements(format, existing) {
  const from = format.limits ?? existing?.requirements ?? {};
  return {
    words: from.words ?? null,
    abstractWords: from.abstractWords ?? null,
    keywords: from.keywords ?? null,
    anonymous: format.title?.anonymous === true,
    note: from.note ?? '',
  };
}

/** JSON as the handwritten templates have it: short objects and lists of words on one line. */
function print(value, indent = '') {
  const inner = indent + '  ';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.every((v) => typeof v === 'string')) {
      const line = `[${value.map((v) => JSON.stringify(v)).join(', ')}]`;
      if (indent.length + line.length <= 100) return line;
    }
    return `[\n${value.map((v) => inner + print(v, inner)).join(',\n')}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return '{}';
    const scalar = entries.every(([, v]) => v === null || typeof v !== 'object');
    if (scalar) {
      const line = `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')} }`;
      if (indent.length + line.length <= 100) return line;
    }
    return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${print(v, inner)}`).join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}

/** Takes the top-level `limits` and `suggests` out of a format file's text, keeping the rest as written. */
function stripped(text) {
  let made = text;
  // One line, or a block that ends at a brace or bracket at the same indent.
  made = made.replace(/^ {2}"limits": \{(?:[^\n]*\}|[\s\S]*?\n {2}\}),?\n/m, '');
  made = made.replace(/^ {2}"suggests": \[(?:[^\n]*\]|[\s\S]*?\n {2}\]),?\n/m, '');
  // The key before a removed last key keeps its comma; take it.
  made = made.replace(/,\n\}\n?$/, '\n}\n');
  return made;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let written = 0;
let stripped_ = 0;
const files = readdirSync(formatsDir).filter((f) => f.endsWith('.json')).sort();
for (const file of files) {
  const path = join(formatsDir, file);
  const text = readFileSync(path, 'utf8');
  const format = JSON.parse(text);

  if (GROUPS.has(format.kind)) {
    const baseId = BASES[format.id] ?? BY_KIND[format.kind];
    const base = whole(baseId);
    if (!base) throw new Error(`${file}: the template ${baseId} it is based on is not in ${templatesDir}`);
    const out = join(templatesDir, `${format.id}.json`);
    const existing = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null;
    const { contents, kinds } = adjusted(base, ADJUSTMENTS[format.id]);
    const reqs = requirements(format, existing);
    // A publisher that asks for an abstract of every chapter puts the abstract in hand.
    if (reqs.abstractWords !== null && !kinds.includes('abstract')) kinds.unshift('abstract');
    const template = {
      id: format.id,
      name: format.name,
      group: format.kind,
      description: format.description,
      source: format.source,
      basedOn: baseId,
      layout: format.id,
      style: format.style,
      contents,
      kinds,
      passageKinds: base.passageKinds,
      kindKeys: base.kindKeys,
      requirements: reqs,
      outputs: base.outputs,
    };
    if (template.style === undefined) delete template.style;
    if (template.kindKeys === undefined) delete template.kindKeys;
    const made = print(template) + '\n';
    if (!existing || !same(existing, template) || readFileSync(out, 'utf8') !== made) {
      writeFileSync(out, made);
      written++;
    }
  }

  if ('limits' in format || 'suggests' in format) {
    const made = stripped(text);
    const { limits, suggests, ...rest } = format;
    const parsed = JSON.parse(made);
    if (!same(parsed, rest)) throw new Error(`${file}: stripping the limits and suggests changed something else`);
    writeFileSync(path, made);
    stripped_++;
  }
}
console.log(`${written} templates written, ${stripped_} formats stripped of their limits and suggests`);
