// Checks the templates that come with the application, resources/templates/:
// that every file reads as JSON and is named by its id, that it uses only
// the fields of src/lib/api/templates.ts, that its contents name only the
// generated parts and the kinds of elements of the catalogue (ADR 0038), its
// kinds of passage only those of ADR 0029, the keys of its kinds digits that
// give kinds of paragraph of the catalogue or of its own (0 only text,
// ADR 0066), its group one of the groups, its
// outputs only the targets there are, and that what it is based on, its
// layout and its style exist. The root, plain, is valid as a base whether
// or not its file is present.
//
//   node scripts/check-templates.mjs
//
// Exits with 1 where there is a fault.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'resources');
const templatesDir = join(root, 'templates');
const formatsDir = join(root, 'formats');
const cslDir = join(root, 'csl');

const ROOT = 'plain';
const FIELDS = new Set([
  'id', 'name', 'group', 'description', 'source', 'basedOn', 'layout', 'style',
  'contents', 'kinds', 'passageKinds', 'kindKeys', 'requirements', 'outputs',
]);
const REQUIRED = ['id', 'name', 'group', 'description', 'contents', 'kinds', 'passageKinds', 'requirements', 'outputs'];
const SOURCE_FIELDS = ['name', 'url', 'checked', 'confidence', 'notes'];
const GROUPS = new Set(['plain', 'article', 'book', 'fiction', 'stage', 'poetry', 'other', 'journal', 'publisher', 'style-guide', 'own']);
const PARTS = new Set(['half-title', 'title-page', 'keywords', 'contents', 'list-of-figures', 'list-of-tables', 'body', 'notes', 'bibliography']);
const KINDS = new Set([
  'front-section', 'back-section', 'own-page', 'cover',
  'abstract', 'dedication', 'epigraph', 'copyright', 'foreword', 'preface', 'cast', 'setting', 'standfirst',
  'acknowledgements', 'appendix', 'afterword', 'glossary', 'about-the-author', 'signature', 'blurb',
]);
const PASSAGE_KINDS = new Set([
  'text', 'quote', 'list', 'numbered', 'attribution', 'epigraph', 'verse', 'speaker', 'direction',
  'scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition',
  'headword', 'gloss', 'code', 'break', 'draft',
]);
/** The kinds of paragraph of the catalogue, by their ids as they are now: what a key may give. */
const PARAGRAPH_KINDS = new Set([
  'text', 'quote', 'item', 'numbered', 'attribution', 'epigraph', 'line', 'speaker', 'direction',
  'scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition',
  'headword', 'gloss', 'code', 'break', 'draft',
]);
const REQUIREMENT_FIELDS = ['words', 'abstractWords', 'keywords', 'anonymous', 'note'];
const TARGETS = new Set(['pdf', 'pdf-latex', 'docx', 'odt', 'latex', 'typst', 'markdown', 'html', 'epub']);
const OUTPUT_FIELDS = new Set(['id', 'name', 'targets', 'layout', 'places']);
const PLACES = new Set(['front', 'back', 'here', 'cover', 'none']);

/** The ids of the reference styles there are: those bundled, and those the index can fetch. */
function styles() {
  const ids = new Set();
  const bundled = join(cslDir, 'styles');
  if (existsSync(bundled)) {
    for (const f of readdirSync(bundled)) if (f.endsWith('.csl')) ids.add(f.slice(0, -4));
  }
  const index = join(cslDir, 'index.json');
  if (existsSync(index)) {
    for (const entry of JSON.parse(readFileSync(index, 'utf8'))) ids.add(entry.i);
  }
  return ids;
}

const STYLES = styles();
const files = readdirSync(templatesDir).filter((f) => f.endsWith('.json')).sort();
const ids = new Set(files.map((f) => f.slice(0, -5)));
const faults = [];
const fault = (file, what) => faults.push(`${file}: ${what}`);

const isWord = (v) => typeof v === 'string' && v.length > 0;
const isCount = (v) => v === null || (Number.isInteger(v) && v >= 0);

for (const file of files) {
  let template;
  try {
    template = JSON.parse(readFileSync(join(templatesDir, file), 'utf8'));
  } catch (e) {
    fault(file, `does not read as JSON: ${e.message}`);
    continue;
  }
  if (!template || typeof template !== 'object' || Array.isArray(template)) {
    fault(file, 'is not an object');
    continue;
  }
  for (const field of Object.keys(template)) {
    if (!FIELDS.has(field)) fault(file, `has a field the template has not: ${field}`);
  }
  for (const field of REQUIRED) {
    if (template[field] === undefined) fault(file, `lacks ${field}`);
  }
  if (template.id !== file.slice(0, -5)) fault(file, `the id must be the name of the file, not ${JSON.stringify(template.id)}`);
  if (!isWord(template.name)) fault(file, 'no name');
  if (!isWord(template.description)) fault(file, 'no description');
  if (!GROUPS.has(template.group)) fault(file, `not a group: ${JSON.stringify(template.group)}`);
  if (template.group === 'own') fault(file, 'a template that comes with the application is not of the group own');

  if (template.source !== undefined) {
    const s = template.source;
    if (!s || typeof s !== 'object') fault(file, 'the source is not an object');
    else {
      for (const field of SOURCE_FIELDS) if (typeof s[field] !== 'string') fault(file, `the source lacks ${field}`);
      for (const field of Object.keys(s)) if (!SOURCE_FIELDS.includes(field)) fault(file, `the source has a field it has not: ${field}`);
    }
  }

  if (template.basedOn !== undefined) {
    if (!isWord(template.basedOn)) fault(file, 'basedOn is not an id');
    else if (template.basedOn === template.id) fault(file, 'is based on itself');
    else if (template.basedOn !== ROOT && !ids.has(template.basedOn)) fault(file, `is based on a template that is not here: ${template.basedOn}`);
  } else if (template.id !== ROOT) {
    fault(file, `is based on nothing, and only ${ROOT} is`);
  }
  if (template.layout !== undefined && !existsSync(join(formatsDir, `${template.layout}.json`))) {
    fault(file, `names a layout that is not in resources/formats: ${template.layout}`);
  }
  if (template.style !== undefined && !STYLES.has(template.style)) {
    fault(file, `names a reference style that is neither bundled nor in the index: ${template.style}`);
  }

  const inContents = new Set();
  if (!Array.isArray(template.contents)) fault(file, 'contents is not a list');
  else {
    for (const item of template.contents) {
      const keys = item && typeof item === 'object' ? Object.keys(item) : [];
      if (keys.length !== 1 || !['part', 'kind'].includes(keys[0])) {
        fault(file, `an item of contents is neither { part } nor { kind }: ${JSON.stringify(item)}`);
      } else if (item.part !== undefined && !PARTS.has(item.part)) {
        fault(file, `not a generated part: ${item.part}`);
      } else if (item.kind !== undefined && !KINDS.has(item.kind)) {
        fault(file, `not a kind of the catalogue: ${item.kind}`);
      } else if (item.kind !== undefined) inContents.add(item.kind);
    }
    const parts = template.contents.filter((i) => i && i.part).map((i) => i.part);
    for (const part of parts) {
      if (parts.indexOf(part) !== parts.lastIndexOf(part)) fault(file, `lists the part ${part} twice`);
    }
  }

  if (!Array.isArray(template.kinds)) fault(file, 'kinds is not a list');
  else {
    for (const kind of template.kinds) if (!KINDS.has(kind)) fault(file, `not a kind of the catalogue: ${kind}`);
    for (const kind of inContents) if (!template.kinds.includes(kind)) fault(file, `the contents place ${kind}, which kinds does not list`);
  }
  if (!Array.isArray(template.passageKinds)) fault(file, 'passageKinds is not a list');
  else for (const kind of template.passageKinds) if (!PASSAGE_KINDS.has(kind)) fault(file, `not a kind of passage: ${kind}`);
  if (template.kindKeys !== undefined) {
    const keys = template.kindKeys;
    if (!keys || typeof keys !== 'object' || Array.isArray(keys)) fault(file, 'kindKeys is not an object');
    else {
      const given = new Set();
      for (const [digit, kind] of Object.entries(keys)) {
        if (!/^[0-9]$/.test(digit)) fault(file, `kindKeys has a key that is not a digit: ${digit}`);
        else if (digit === '0' && kind !== 'text') fault(file, `Ctrl+Alt+0 is text, not ${kind}`);
        else if (!PARAGRAPH_KINDS.has(kind) && !(template.passageKinds ?? []).includes(kind)) {
          fault(file, `Ctrl+Alt+${digit} gives what is no kind of paragraph: ${kind}`);
        } else if (given.has(kind)) fault(file, `${kind} has two keys`);
        given.add(kind);
      }
    }
  }

  const r = template.requirements;
  if (!r || typeof r !== 'object') fault(file, 'requirements is not an object');
  else {
    for (const field of Object.keys(r)) if (!REQUIREMENT_FIELDS.includes(field)) fault(file, `a requirement there is not: ${field}`);
    for (const field of ['words', 'abstractWords', 'keywords']) {
      if (!isCount(r[field])) fault(file, `requirements.${field} is neither null nor a count`);
    }
    if (typeof r.anonymous !== 'boolean') fault(file, 'requirements.anonymous is not true or false');
    if (typeof r.note !== 'string') fault(file, 'requirements.note is not text');
  }

  if (!Array.isArray(template.outputs) || template.outputs.length === 0) fault(file, 'outputs is not a list of at least one');
  else {
    for (const output of template.outputs) {
      if (!output || typeof output !== 'object') {
        fault(file, 'an output is not an object');
        continue;
      }
      for (const field of Object.keys(output)) if (!OUTPUT_FIELDS.has(field)) fault(file, `an output has a field it has not: ${field}`);
      if (!isWord(output.id)) fault(file, 'an output has no id');
      if (!Array.isArray(output.targets) || output.targets.length === 0) fault(file, `the output ${output.id} has no targets`);
      else for (const t of output.targets) if (!TARGETS.has(t)) fault(file, `not a target: ${t}`);
      if (output.layout !== undefined && !existsSync(join(formatsDir, `${output.layout}.json`))) {
        fault(file, `the output ${output.id} names a layout that is not in resources/formats: ${output.layout}`);
      }
      if (output.places !== undefined) {
        if (!Array.isArray(output.places)) fault(file, `the places of the output ${output.id} are not a list`);
        else for (const p of output.places) if (!PLACES.has(p)) fault(file, `not a place: ${p}`);
      }
    }
    if (!template.outputs.some((o) => o && o.id === 'document')) fault(file, 'has no document output');
  }
}

if (faults.length > 0) {
  for (const f of faults) console.error(f);
  console.error(`${faults.length} faults in ${files.length} templates`);
  process.exit(1);
}
console.log(`${files.length} templates checked, no faults`);
