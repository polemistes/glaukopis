// The words of a language as a spreadsheet, to be read through and mended in
// LibreOffice Calc (or another program that reads OpenDocument), and put back
// into its Fluent files. Works for any language under locales/, English too.
//
//   node scripts/locale-sheet.mjs export nb [nb.ods]   the sheet of Bokmål
//   node scripts/locale-sheet.mjs import nb nb.ods     what was changed in it, back
//   node scripts/locale-sheet.mjs import nb nb.ods --dry-run
//
// The sheet has a row for each message, and one for each of its attributes
// (`name.hint`), in the order of the English files: the file, the name, the
// English, the language, the note the English file has for translators, a
// column of one's own (Done) to mark what has been read, and, hidden, the
// text as it was exported. For English, the English is the language, and
// stands once. A message the language lacks has its cell empty, and may be
// written there.
//
// Only what was changed in the sheet is put back: a row whose text is as it
// was exported is left alone, so the files may change meanwhile without being
// undone. The rows may be sorted and filtered as one likes; they are found by
// their file and name. A change is put back only if it is good Fluent and has
// the variables, references and plural forms it must have (as
// scripts/check-locales.mjs checks); what is not is named and left out. The
// text in a cell is Fluent as it stands in the file, without the indentation
// of its lines: see locales/TRANSLATING.md.

import { deflateRawSync, inflateRawSync, crc32 } from 'node:zlib';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@fluent/syntax';
import { check, plurals, uses } from './check-locales.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'locales');
const ENGLISH = 'en';
const COLUMNS = { file: 'File', name: 'Name', source: 'English', note: 'Note', done: 'Done', exported: 'As exported' };

// ---------------------------------------------------------------- Fluent --

/** The messages of a Fluent file, in order, each with its parts and where they stand. */
function entries(text) {
  const resource = parse(text, { withSpans: true });
  const out = [];
  for (const entry of resource.body) {
    if (entry.type !== 'Message') continue;
    const parts = [];
    if (entry.value) parts.push({ key: entry.id.name, span: entry.value.span });
    for (const a of entry.attributes) parts.push({ key: `${entry.id.name}.${a.id.name}`, span: a.value.span });
    out.push({
      id: entry.id.name,
      span: entry.span,
      comment: entry.comment?.content ?? '',
      parts,
    });
  }
  return { out, junk: resource.body.filter((e) => e.type === 'Junk') };
}

/** The indentation of the lines after the first of a pattern as it stands in a file. */
function indentOf(source) {
  const lines = source.split('\n').slice(1).filter((l) => l.trim());
  if (!lines.length) return 4;
  return Math.min(...lines.map((l) => l.length - l.trimStart().length));
}

/** A pattern as it is shown in a cell: without the indentation of its lines. */
function dedent(source) {
  const n = indentOf(source);
  return source
    .split('\n')
    .map((line, i) => (i === 0 ? line : line.slice(Math.min(n, line.length - line.trimStart().length))))
    .join('\n');
}

/** A cell's text as it is written in a file, its lines indented by `n`. */
function indent(text, n) {
  const pad = ' '.repeat(n);
  return text
    .split('\n')
    .map((line, i) => (i === 0 || !line.trim() ? line.trimEnd() : pad + line.trimEnd()))
    .join('\n');
}

/** The text of a cell, made tidy: no line endings of Windows, no empty lines at its ends. */
function tidy(text) {
  return (text ?? '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g, '');
}

/** The English, by file, with the parts of each message and their texts. */
function catalogue(tag) {
  const dir = join(root, tag);
  const files = new Map();
  if (!existsSync(dir)) return files;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.ftl')).sort()) {
    const text = readFileSync(join(dir, file), 'utf8');
    const { out } = entries(text);
    const parts = new Map();
    for (const m of out) {
      for (const p of m.parts) {
        const source = text.slice(p.span.start, p.span.end);
        parts.set(p.key, { text: dedent(source), indent: indentOf(source) });
      }
    }
    files.set(file, { text, messages: out, parts });
  }
  return files;
}

// ------------------------------------------------------------------ zip --

const u16 = (n) => Buffer.from([n & 0xff, (n >> 8) & 0xff]);
const u32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0);
  return b;
};

/** A zip of files, the first stored as it is (as OpenDocument wants its `mimetype`). */
function zip(files) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const [i, { name, data }] of files.entries()) {
    const raw = Buffer.from(data);
    const store = i === 0;
    const body = store ? raw : deflateRawSync(raw);
    const nameBytes = Buffer.from(name, 'utf8');
    const head = [u16(20), u16(0x0800), u16(store ? 0 : 8), u16(0), u16(0x21), u32(crc32(raw)), u32(body.length), u32(raw.length), u16(nameBytes.length), u16(0)];
    const local = Buffer.concat([u32(0x04034b50), ...head, nameBytes, body]);
    central.push(Buffer.concat([u32(0x02014b50), u16(20), ...head, u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes]));
    locals.push(local);
    offset += local.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(directory.length), u32(offset), u16(0)]);
  return Buffer.concat([...locals, directory, end]);
}

/** The files of a zip, by name. */
function unzip(buf) {
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error('not a zip file, nor an OpenDocument spreadsheet');
  const count = buf.readUInt16LE(end + 10);
  let at = buf.readUInt32LE(end + 16);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(at + 10);
    const size = buf.readUInt32LE(at + 20);
    const nameLength = buf.readUInt16LE(at + 28);
    const extra = buf.readUInt16LE(at + 30);
    const comment = buf.readUInt16LE(at + 32);
    const local = buf.readUInt32LE(at + 42);
    const name = buf.toString('utf8', at + 46, at + 46 + nameLength);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const body = buf.subarray(start, start + size);
    files.set(name, method === 8 ? inflateRawSync(body) : Buffer.from(body));
    at += 46 + nameLength + extra + comment;
  }
  return files;
}

// --------------------------------------------------------- OpenDocument --

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The paragraphs of a cell: a line each, its spaces as OpenDocument keeps them. */
function paragraphs(text) {
  return text
    .split('\n')
    .map((line) => {
      const body = escape(line)
        .replace(/\t/g, '<text:tab/>')
        .replace(/ {2,}/g, (spaces) => ` <text:s text:c="${spaces.length - 1}"/>`)
        .replace(/^ /, '<text:s/>');
      return `<text:p>${body}</text:p>`;
    })
    .join('');
}

function cell(text, style) {
  const s = style ? ` table:style-name="${style}"` : '';
  if (!text) return `<table:table-cell${s}/>`;
  return `<table:table-cell office:value-type="string"${s}>${paragraphs(text)}</table:table-cell>`;
}

const NS =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" ' +
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0" ' +
  'xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"';

/** A spreadsheet of one table: its columns (header, width, style, hidden) and rows. */
function spreadsheet(name, columns, rows) {
  const styles = columns
    .map((c, i) => `<style:style style:name="co${i}" style:family="table-column"><style:table-column-properties style:column-width="${c.width}"/></style:style>`)
    .join('');
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content ${NS} office:version="1.3"><office:automatic-styles>${styles}
<style:style style:name="text" style:family="table-cell"><style:table-cell-properties fo:wrap-option="wrap" style:vertical-align="top"/></style:style>
<style:style style:name="quiet" style:family="table-cell"><style:table-cell-properties fo:wrap-option="wrap" style:vertical-align="top" fo:background-color="#efeeec"/><style:text-properties fo:color="#55524d"/></style:style>
<style:style style:name="head" style:family="table-cell"><style:table-cell-properties style:vertical-align="top" fo:background-color="#dcd8d0"/><style:text-properties fo:font-weight="bold"/></style:style>
</office:automatic-styles><office:body><office:spreadsheet><table:table table:name="${escape(name)}">
${columns.map((c, i) => `<table:table-column table:style-name="co${i}" table:default-cell-style-name="${c.style}"${c.hidden ? ' table:visibility="collapse"' : ''}/>`).join('')}
<table:table-row>${columns.map((c) => cell(c.header, 'head')).join('')}</table:table-row>
${rows.map((r) => `<table:table-row>${r.map((v, i) => cell(v, columns[i].style)).join('')}</table:table-row>`).join('\n')}
</table:table><table:database-ranges><table:database-range table:name="__Anonymous_Sheet_DB__0" table:target-range-address="${escape(name)}.A1:${String.fromCharCode(64 + columns.length)}${rows.length + 1}" table:display-filter-buttons="true"/></table:database-ranges>
</office:spreadsheet></office:body></office:document-content>`;
  // The row of headers stays in sight as one scrolls.
  const settings = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings ${NS} office:version="1.3"><office:settings><config:config-item-set config:name="ooo:view-settings"><config:config-item-map-indexed config:name="Views"><config:config-item-map-entry>
<config:config-item config:name="ViewId" config:type="string">view1</config:config-item><config:config-item-map-named config:name="Tables"><config:config-item-map-entry config:name="${escape(name)}">
<config:config-item config:name="VerticalSplitMode" config:type="short">2</config:config-item><config:config-item config:name="VerticalSplitPosition" config:type="int">1</config:config-item>
<config:config-item config:name="ActiveSplitRange" config:type="short">2</config:config-item><config:config-item config:name="PositionTop" config:type="int">0</config:config-item>
<config:config-item config:name="PositionBottom" config:type="int">1</config:config-item></config:config-item-map-entry></config:config-item-map-named>
</config:config-item-map-entry></config:config-item-map-indexed></config:config-item-set></office:settings></office:document-settings>`;
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest ${NS} manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet" manifest:version="1.3"/>
<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/></manifest:manifest>`;
  return zip([
    { name: 'mimetype', data: 'application/vnd.oasis.opendocument.spreadsheet' },
    { name: 'META-INF/manifest.xml', data: manifest },
    { name: 'content.xml', data: content },
    { name: 'settings.xml', data: settings },
  ]);
}

const unescape = (s) =>
  s.replace(/&(lt|gt|quot|apos|amp|#(\d+)|#x([0-9a-fA-F]+));/g, (_, name, dec, hex) =>
    dec ? String.fromCodePoint(+dec) : hex ? String.fromCodePoint(parseInt(hex, 16)) : { lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' }[name],
  );

function attribute(tag, name) {
  const m = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return m ? unescape(m[1]) : null;
}

/** The rows of the first table of a spreadsheet, each a list of the texts of its cells. */
function readSpreadsheet(buf) {
  const content = unzip(buf).get('content.xml')?.toString('utf8');
  if (!content) throw new Error('the file has no content.xml: is it an OpenDocument spreadsheet (.ods)?');
  const table = content.slice(content.indexOf('<table:table '), content.indexOf('</table:table>'));
  const rows = [];
  let row = null;
  let text = null; // the text of the cell being read
  let paragraph = 0;
  let repeat = 1;
  let rowRepeat = 1;
  const endCell = () => {
    for (let i = 0; i < Math.min(repeat, 64); i++) row.push(text ?? '');
    text = null;
  };
  for (const [token] of table.matchAll(/<[^>]*>|[^<]+/g)) {
    if (!token.startsWith('<')) {
      if (text !== null) text += unescape(token);
      continue;
    }
    const name = /^<\/?([\w:-]+)/.exec(token)?.[1];
    const closing = token.startsWith('</');
    const empty = token.endsWith('/>');
    if (name === 'table:table-row' && !closing) {
      row = [];
      rowRepeat = +(attribute(token, 'table:number-rows-repeated') ?? 1);
      if (empty) rows.push(row);
    } else if (name === 'table:table-row' && closing) {
      // Rows repeated are empty rows at the end, or between: one is enough.
      if (rowRepeat < 100 || row.some((c) => c)) rows.push(row);
    } else if ((name === 'table:table-cell' || name === 'table:covered-table-cell') && !closing) {
      repeat = +(attribute(token, 'table:number-columns-repeated') ?? 1);
      text = '';
      paragraph = 0;
      if (empty) endCell();
    } else if ((name === 'table:table-cell' || name === 'table:covered-table-cell') && closing) {
      endCell();
    } else if (text !== null) {
      if (name === 'text:p' && !closing) {
        if (paragraph++ > 0) text += '\n';
      } else if (name === 'text:s') text += ' '.repeat(+(attribute(token, 'text:c') ?? 1));
      else if (name === 'text:tab') text += '\t';
      else if (name === 'text:line-break') text += '\n';
      else if (name === 'office:annotation' && !closing) {
        // A comment on a cell is not its text: what it holds is skipped.
        text = text + '\u0000';
      } else if (name === 'office:annotation' && closing) text = text.replace(/\u0000[\s\S]*$/, '');
    }
  }
  return rows;
}

// ---------------------------------------------------------------- export --

function languageName(tag) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(tag) ?? tag;
  } catch {
    return tag;
  }
}

function exportSheet(tag, out) {
  const english = catalogue(ENGLISH);
  const own = tag === ENGLISH ? english : catalogue(tag);
  const rows = [];
  for (const [file, { messages, parts }] of english) {
    for (const m of messages) {
      for (const p of m.parts) {
        const mine = own.get(file)?.parts.get(p.key)?.text ?? '';
        const note = p.key.includes('.') ? '' : m.comment;
        const row = [file.replace(/\.ftl$/, ''), p.key];
        if (tag !== ENGLISH) row.push(parts.get(p.key).text);
        row.push(mine, note, '', mine);
        rows.push(row);
      }
    }
  }
  const columns = [
    { header: COLUMNS.file, width: '2.6cm', style: 'quiet' },
    { header: COLUMNS.name, width: '5.5cm', style: 'quiet' },
    ...(tag === ENGLISH ? [] : [{ header: COLUMNS.source, width: '9cm', style: 'quiet' }]),
    { header: tag, width: '10cm', style: 'text' },
    { header: COLUMNS.note, width: '5cm', style: 'quiet' },
    { header: COLUMNS.done, width: '1.6cm', style: 'text' },
    { header: COLUMNS.exported, width: '3cm', style: 'quiet', hidden: true },
  ];
  writeFileSync(out, spreadsheet(`${tag} — ${languageName(tag)}`.slice(0, 31), columns, rows));
  const lacking = rows.filter((r) => !r[r.length - 1]).length;
  console.log(`${rows.length} rows of ${languageName(tag)} written to ${out}` + (lacking ? `, ${lacking} of them empty, where the language lacks the message` : ''));
}

// ---------------------------------------------------------------- import --

/** What is wrong with a text for a part, or nothing. */
function fault(tag, key, text, english, before) {
  const probe = `probe = ${indent(text, 4)}\n`;
  const resource = parse(probe, { withSpans: false });
  const junk = resource.body.find((e) => e.type === 'Junk');
  if (junk) return `it is not good Fluent: ${junk.annotations?.[0]?.message ?? junk.content.trim().split('\n')[0]}`;
  const messages = resource.body.filter((e) => e.type === 'Message');
  if (messages.length !== 1 || !messages[0].value) return 'it is not one text';
  if (messages[0].attributes.length) return 'a line of it begins with “.”, which Fluent reads as an attribute';
  const mine = uses(messages[0].value);
  // English is held to what it was: its variables are those the code gives.
  const theirs = tag === ENGLISH ? (before ? uses(parse(`probe = ${indent(before, 4)}\n`, {}).body[0].value) : mine) : english ? uses(parse(`probe = ${indent(english, 4)}\n`, {}).body[0].value) : null;
  if (!theirs) return 'English has no such message';
  const list = (set) => [...set].sort().join(', ') || 'none';
  const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
  if (!same(mine.variables, theirs.variables)) return `it has the variables ${list(mine.variables)}, and must have ${list(theirs.variables)}`;
  for (const ref of mine.references) if (!theirs.references.has(ref)) return `it refers to { ${ref} }, which the English does not`;
  const { all, whole } = plurals(tag);
  for (const keys of mine.selects) {
    const missing = [...whole].filter((c) => !keys.includes(c));
    const foreign = keys.filter((c) => !all.has(c));
    if (missing.length) return `a choice by number lacks the plural form(s) ${missing.join(', ')}`;
    if (foreign.length) return `a choice by number has the plural form(s) ${foreign.join(', ')}, which the language has not`;
  }
  return null;
}

function importSheet(tag, path, dry) {
  if (!existsSync(join(root, tag))) throw new Error(`there is no folder locales/${tag}`);
  const rows = readSpreadsheet(readFileSync(path));
  const header = rows.shift() ?? [];
  const col = (name) => header.findIndex((h) => h.trim() === name);
  const at = { file: col(COLUMNS.file), name: col(COLUMNS.name), text: col(tag), exported: col(COLUMNS.exported) };
  for (const [k, v] of Object.entries(at)) {
    if (v < 0) throw new Error(`the sheet has no column “${k === 'text' ? tag : COLUMNS[k]}” in its first row: is it the sheet of ${tag}?`);
  }
  const english = catalogue(ENGLISH);
  const own = catalogue(tag);
  const changes = new Map(); // file -> key -> text
  const refused = [];
  const conflicts = [];
  let unchanged = 0;
  for (const row of rows) {
    const file = tidy(row[at.file]);
    const key = tidy(row[at.name]);
    if (!file || !key) continue;
    const text = tidy(row[at.text]);
    const exported = tidy(row[at.exported]);
    if (text === exported) {
      unchanged++;
      continue;
    }
    const where = `${file}: ${key}`;
    const ftl = `${file}.ftl`;
    const source = english.get(ftl)?.parts.get(key);
    if (!source) {
      refused.push(`${where}: English has no such message`);
      continue;
    }
    if (!text) {
      refused.push(`${where}: the cell was emptied; a message is not taken away from here`);
      continue;
    }
    const now = own.get(ftl)?.parts.get(key)?.text ?? '';
    if (now !== exported) {
      conflicts.push(`${where}: it was changed in the file after the sheet was made, and is left as the file has it`);
      continue;
    }
    const why = fault(tag, key, text, source.text, exported);
    if (why) {
      refused.push(`${where}: ${why}`);
      continue;
    }
    if (!changes.has(ftl)) changes.set(ftl, new Map());
    changes.get(ftl).set(key, text);
  }

  let count = 0;
  for (const [ftl, wanted] of changes) {
    const path = join(root, tag, ftl);
    const englishFile = english.get(ftl);
    let text = existsSync(path) ? readFileSync(path, 'utf8') : '';
    if (!text) {
      // A file the language does not have yet begins as the English begins: its comments.
      const first = englishFile.messages[0];
      const head = englishFile.text.slice(0, first ? (first.comment ? englishFile.text.lastIndexOf('\n#', first.span.start) + 1 : first.span.start) : englishFile.text.length);
      text = head.trim() ? `${head.trimEnd()}\n` : '';
    }
    const { out: messages } = entries(text);
    const byId = new Map(messages.map((m) => [m.id, m]));
    const edits = []; // [start, end, text]
    const added = new Map(); // id of the English message after which to add -> text
    for (const m of englishFile.messages) {
      const keys = m.parts.map((p) => p.key).filter((k) => wanted.has(k));
      if (!keys.length) continue;
      const mine = byId.get(m.id);
      if (mine) {
        for (const key of keys) {
          const part = mine.parts.find((p) => p.key === key);
          const indentation = part ? indentOf(text.slice(part.span.start, part.span.end)) : 4;
          if (part) edits.push([part.span.start, part.span.end, indent(wanted.get(key), indentation)]);
          else {
            const attr = key.slice(key.indexOf('.') + 1);
            edits.push([mine.span.end, mine.span.end, `\n    .${attr} = ${indent(wanted.get(key), 8)}`]);
          }
          count++;
        }
        continue;
      }
      // A message the language lacks: written as the English is, after the
      // message before it in the English that the language has.
      const lines = [];
      if (m.comment) lines.push(...m.comment.split('\n').map((l) => (l ? `# ${l}` : '#')));
      const value = m.parts.find((p) => p.key === m.id);
      const valueText = value ? (wanted.get(m.id) ?? null) : null;
      if (value && valueText === null) {
        // Its value was not written, only an attribute: the English stands until it is.
        refused.push(`${ftl.replace(/\.ftl$/, '')}: ${m.id}: the language lacks the message, and its text was not written, only an attribute`);
        continue;
      }
      lines.push(`${m.id} =${valueText !== null ? ` ${indent(valueText, 4)}` : ''}`);
      for (const p of m.parts.filter((p) => p.key !== m.id && wanted.has(p.key))) {
        lines.push(`    .${p.key.slice(m.id.length + 1)} = ${indent(wanted.get(p.key), 8)}`);
      }
      const index = englishFile.messages.indexOf(m);
      const before = englishFile.messages.slice(0, index).reverse().find((e) => byId.has(e.id));
      const anchor = before ? byId.get(before.id).span.end : null;
      const block = lines.join('\n');
      added.set(anchor ?? 'end', [...(added.get(anchor ?? 'end') ?? []), block]);
      count += keys.length;
    }
    for (const [anchor, blocks] of added) {
      if (anchor === 'end') edits.push([text.length, text.length, `${text && !text.endsWith('\n') ? '\n' : ''}${text.trim() ? '\n' : ''}${blocks.join('\n')}\n`]);
      else edits.push([anchor, anchor, `\n${blocks.join('\n')}`]);
    }
    edits.sort((a, b) => b[0] - a[0]);
    for (const [start, end, replacement] of edits) text = text.slice(0, start) + replacement + text.slice(end);
    if (entries(text).junk.length) {
      refused.push(`${ftl}: the file would not read afterwards, and is left as it was`);
      continue;
    }
    if (!dry) writeFileSync(path, text);
  }

  console.log(`${count} change(s) ${dry ? 'would be' : 'were'} put into ${changes.size} file(s) of locales/${tag}; ${unchanged} row(s) unchanged.`);
  if (conflicts.length) console.log(`\nLeft as the files have them, since they were changed there after the sheet was made:\n  ${conflicts.join('\n  ')}`);
  if (refused.length) console.log(`\nNot put back:\n  ${refused.join('\n  ')}`);
  if (!dry) {
    const r = check(tag);
    console.log(`\nlocales/${tag}: ${r.present} of ${r.total} messages translated, ${r.problems.length} fault(s)`);
    for (const p of r.problems) console.log(`  FAULT  ${p}`);
  }
  return refused.length + conflicts.length;
}

// ------------------------------------------------------------------ main --

const [command, tag, file, ...rest] = process.argv.slice(2);
try {
  if (command === 'export' && tag) {
    if (!existsSync(join(root, tag)) && tag !== ENGLISH) throw new Error(`there is no folder locales/${tag}`);
    exportSheet(tag, file ?? `${tag}.ods`);
  } else if (command === 'import' && tag && file) {
    process.exit(importSheet(tag, file, rest.includes('--dry-run')) ? 1 : 0);
  } else {
    console.log(
      'node scripts/locale-sheet.mjs export <language> [file.ods]\nnode scripts/locale-sheet.mjs import <language> <file.ods> [--dry-run]',
    );
    process.exit(2);
  }
} catch (error) {
  console.error(`locale-sheet: ${error.message}`);
  process.exit(1);
}
