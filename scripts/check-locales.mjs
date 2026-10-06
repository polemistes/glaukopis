// Checks the Fluent files of a language against the English ones: that every
// file reads, that nothing is named that English has not, that each message
// has the attributes, the variables and the references the English one has,
// and that a choice by number has the plural forms of the language. Says how
// much of the language is translated. See locales/TRANSLATING.md.
//
//   node scripts/check-locales.mjs de            one language
//   node scripts/check-locales.mjs de --missing  and the names of what it lacks
//   node scripts/check-locales.mjs               every language, a line each
//
// Exits with 1 where there is a fault; what is lacking is not a fault, since
// English is shown for it.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@fluent/syntax';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'locales');
const ENGLISH = 'en';
const CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const tags = args.filter((a) => !a.startsWith('--'));

/** The plural forms of a language: all of them, and those whole numbers take. */
function plurals(tag) {
  let rules;
  try {
    rules = new Intl.PluralRules(tag);
  } catch {
    rules = new Intl.PluralRules(ENGLISH);
  }
  const all = new Set(rules.resolvedOptions().pluralCategories);
  const whole = new Set();
  for (let n = 0; n <= 200; n++) whole.add(rules.select(n));
  for (const n of [1000, 1001, 1002, 1005, 1021, 1000000]) whole.add(rules.select(n));
  return { all, whole };
}

/** Walks an AST, calling `visit` on every node. */
function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const n of node) walk(n, visit);
    return;
  }
  if (node.type) visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'span' || key === 'type') continue;
    walk(value, visit);
  }
}

/** What a pattern uses: variables, references, and choices by number. */
function uses(pattern) {
  const variables = new Set();
  const references = new Set();
  const selects = [];
  walk(pattern, (node) => {
    if (node.type === 'VariableReference') variables.add(node.id.name);
    if (node.type === 'MessageReference' || node.type === 'TermReference') references.add(node.id.name);
    if (node.type === 'SelectExpression') {
      const keys = node.variants.map((v) => (v.key.type === 'Identifier' ? v.key.name : String(v.key.value)));
      // A choice among plural forms, as against one among exact numbers or
      // among words, is one that names a form besides `other`.
      if (keys.some((k) => CATEGORIES.has(k) && k !== 'other')) selects.push(keys.filter((k) => CATEGORIES.has(k)));
    }
  });
  return { variables, references, selects };
}

/** The messages of a file, by name, with what each uses; and the faults in reading it. */
function catalogue(text) {
  const resource = parse(text, { withSpans: false });
  const messages = new Map();
  const faults = [];
  for (const entry of resource.body) {
    if (entry.type === 'Junk') {
      faults.push(`cannot be read: ${entry.content.trim().split('\n')[0]}`);
      continue;
    }
    if (entry.type !== 'Message' && entry.type !== 'Term') continue;
    const id = entry.type === 'Term' ? `-${entry.id.name}` : entry.id.name;
    if (messages.has(id)) faults.push(`${id} is given twice`);
    const value = entry.value ? uses(entry.value) : null;
    const attributes = new Map(entry.attributes.map((a) => [a.id.name, uses(a.value)]));
    messages.set(id, { value, attributes });
  }
  return { messages, faults };
}

/** The text of a message's value in a file, for seeing whether it is the English still. */
function values(text) {
  const out = new Map();
  const resource = parse(text, { withSpans: true });
  for (const entry of resource.body) {
    if (entry.type !== 'Message' || !entry.value) continue;
    out.set(entry.id.name, text.slice(entry.value.span.start, entry.value.span.end).trim());
  }
  return out;
}

function same(a, b) {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

function list(set) {
  return [...set].sort().join(', ') || 'nothing';
}

function check(tag) {
  const english = readdirSync(join(root, ENGLISH)).filter((f) => f.endsWith('.ftl')).sort();
  const dir = join(root, tag);
  const { all, whole } = plurals(tag);
  const problems = [];
  const lacking = [];
  let total = 0;
  let present = 0;
  let unchanged = 0;
  for (const file of english) {
    const en = catalogue(readFileSync(join(root, ENGLISH, file), 'utf8'));
    total += en.messages.size;
    const path = join(dir, file);
    if (!existsSync(path)) {
      for (const id of en.messages.keys()) lacking.push(`${file}: ${id}`);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    const own = catalogue(text);
    for (const fault of own.faults) problems.push(`${file}: ${fault}`);
    const enValues = tag === ENGLISH ? null : values(readFileSync(join(root, ENGLISH, file), 'utf8'));
    const ownValues = tag === ENGLISH ? null : values(text);
    for (const [id, message] of own.messages) {
      const theirs = en.messages.get(id);
      if (!theirs) {
        problems.push(`${file}: ${id} is not among the English messages`);
        continue;
      }
      present++;
      if (ownValues && enValues && ownValues.get(id) && ownValues.get(id) === enValues.get(id)) unchanged++;
      if (!!theirs.value !== !!message.value) problems.push(`${file}: ${id} ${message.value ? 'has a value where English has none' : 'lacks its value'}`);
      for (const name of theirs.attributes.keys()) {
        if (!message.attributes.has(name)) problems.push(`${file}: ${id} lacks .${name}`);
      }
      for (const name of message.attributes.keys()) {
        if (!theirs.attributes.has(name)) problems.push(`${file}: ${id} has .${name}, which English has not`);
      }
      const pairs = [[id, theirs.value, message.value]];
      for (const [name, pattern] of message.attributes) {
        if (theirs.attributes.has(name)) pairs.push([`${id}.${name}`, theirs.attributes.get(name), pattern]);
      }
      for (const [name, en, ours] of pairs) {
        if (!en || !ours) continue;
        if (!same(en.variables, ours.variables)) {
          problems.push(`${file}: ${name} uses the variables ${list(ours.variables)}; English uses ${list(en.variables)}`);
        }
        for (const ref of ours.references) {
          if (!en.references.has(ref)) problems.push(`${file}: ${name} refers to { ${ref} }, which the English does not`);
        }
        for (const keys of ours.selects) {
          const have = new Set(keys);
          const missing = [...whole].filter((c) => !have.has(c));
          const foreign = keys.filter((c) => !all.has(c));
          if (missing.length) problems.push(`${file}: ${name} lacks the plural form(s) ${missing.join(', ')} of ${tag}`);
          if (foreign.length) problems.push(`${file}: ${name} has the plural form(s) ${foreign.join(', ')}, which ${tag} has not`);
        }
      }
    }
    for (const id of en.messages.keys()) {
      if (!own.messages.has(id)) lacking.push(`${file}: ${id}`);
    }
  }
  return { problems, lacking, total, present, unchanged, plurals: { all, whole } };
}

function report(tag, verbose) {
  const r = check(tag);
  if (verbose) {
    console.log(`${tag}: plural forms ${list(r.plurals.all)}; whole numbers take ${list(r.plurals.whole)}`);
    for (const p of r.problems) console.log(`  FAULT  ${p}`);
    if (flags.has('--missing')) for (const l of r.lacking) console.log(`  lacks  ${l}`);
  }
  const files = new Set(r.lacking.map((l) => l.split(':')[0]));
  console.log(
    `${tag}: ${r.present} of ${r.total} messages translated` +
      (r.lacking.length ? `, ${r.lacking.length} lacking in ${files.size} file(s)` : '') +
      (r.unchanged ? `, ${r.unchanged} the same as English` : '') +
      `, ${r.problems.length} fault(s)`,
  );
  return r.problems.length === 0;
}

const languages = tags.length
  ? tags
  : readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
let ok = true;
for (const tag of languages) ok = report(tag, tags.length > 0) && ok;
process.exit(ok ? 0 : 1);
