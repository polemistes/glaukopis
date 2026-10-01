# 0029 — Kinds of passage and of words, and their looks

Date: 2026-10-01. Status: accepted.

## Context

The tools for writing offered a list of thirteen kinds of paragraph, chosen
one by one as a need arose, and six marks; nothing let a writer add a kind
or choose which were in hand, and a historian saw the parts of a screenplay
in every menu. The format (ADR 0028) knew the look of some kinds and not
of others: the parts of a script reached Word and Writer as the names of
styles that were not defined. The owner asked for the wheel to be invented
again, with these conditions: no kinds of project or map; the choices of
every kind of writing readily at hand but easily configured; nothing
presumed on the writer's behalf; passages, elements and whole maps working
together; and documents that come out well in the main formats.

## Decision

The wheel is the named style of Word and Writer, with four changes.

- **A kind is a meaning, not a look.** Every paragraph has a kind of
  paragraph, and a run of words may have a kind of words. The word is the
  one ADR 0025 uses for elements: *kind*. *Format* stays the look of a
  document, *style* stays the reference style.
- **The look of a kind lives in the format, never in the text.** The
  format has a table of looks, one row for each kind it says anything of
  (`DocumentFormat::kinds`, by the id of the kind), with the same few
  measures for every kind: size, line spacing, alignment, indents, the
  first line, space before and after, bold, italic, letters, underline,
  letters of equal width, keeping with the next, a new page.
- **A kind is a delta on the kind it is based on.** A look says only how
  the kind differs from its base; the base of a kind of paragraph is text
  unless it says otherwise, and the base of a kind of words is plain
  words. So a kind of the writer's own works in every format with no
  configuration, and a format need say nothing of a kind for it to be
  set. The looks are resolved in `formats/kinds.rs`: the base, then what
  the kind says of itself, then what the format says of it.
- **No bucket of direct formatting.** No font, size or colour in the
  tools. What a style guide asks of a single paragraph is an *adjustment*
  of it: centred, a new page before, kept together, the language of the
  passage. Adjustments are a later piece; they will export as derived
  styles.

### The catalogue

The kinds that come with the application, by id, in groups:

| Group | Kinds of paragraph | Kinds of words |
| --- | --- | --- |
| text | `text`, `quote`, `list`, `numbered` | |
| quotation | `attribution`, `epigraph` (based on `quote`) | |
| verse | `verse` | `speaker`, `direction` |
| script | `scene`, `action`, `character`, `dialogue`, `parenthetical`, `transition` | |
| more | `headword`, `gloss`, `code`, `break`, `draft` | |
| words | | `foreign`, `title`, `term`, `mention`, `highlight` |

Besides these, the marks `em`, `strong`, `smallcaps`, `sup`, `sub`,
`strike`, `underline` and `code` stay marks, as they were, and `link`.

- An **attribution** is the line under a quotation that names its source,
  set to the right. An **epigraph** is a quotation at the head of a part.
- A **headword** and its **gloss** are the two paragraphs of a glossary.
  **Code** is kept letter for letter, in letters of equal width. A
  **break** holds no text: the format says what stands in it (`* * *` by
  default; `#` for a manuscript; nothing for a blank line). A **draft**
  note goes into no document.
- **Foreign** words carry a language, which spelling and hyphenation
  follow; the **title** of a work; a **term** at its first use; a
  **mention** of a word, which stands in the quotation marks of the
  document's language; and a **highlight**, which is for the eye on the
  screen and goes into no document.
- The **speaker** and the **stage direction** of verse are kinds of words
  for the purposes of their looks and their styles, though the editor has
  them as kinds of line.
- The interface's names for the kinds are its own words, in each
  language; a social scientist's transcript uses the speaker as a play
  does, and nothing is called "drama" in the tools.

### The writer's own kinds

A writer makes a kind by naming it, choosing what it is based on, and
saying how it differs, by the same measures the format uses. The kinds are
kept in the project document, in the map `passageKinds`, as the kinds of
elements are kept in `kinds` (ADR 0025), so that a shared project shares
them and exports alike for everyone; their names are offered across
projects when a kind is named. The document that is handed to the core for
preview and export carries them (`Document::kinds`), each with its base
and its look, so that every target can set them.

### The tools

- **The kind menu shows the kinds in hand, then "More…".** In hand are
  the four plain kinds, every kind the map's texts use, the kinds the
  writer has pinned, and the kinds the format suggests (`suggests` in the
  format: a screenplay suggests the parts of a script), less what the
  writer has unpinned. "More…" has the whole catalogue in its groups and,
  at its foot, "Make a kind…". What is pinned and unpinned is kept with
  the map (`hand` on the map).
- **Each kind says what Enter makes next**, and Tab cycles within its
  group: a character makes dialogue, dialogue makes action, a headword a
  gloss, an attribution text. The parts of a script keep what they had.
- **Tools appear with the kind**, as the line numbers do in verse.
- **The kinds of words are in a menu of their own**, "Words", beside
  italic, bold and small capitals, which stay buttons: underlining,
  superscript, subscript, strike-through and code, then foreign words with
  their language, the title of a work, a term, a mention, a highlight, and
  the writer's own kinds of words.
- **A line says where the look comes from**: the kind menu's foot names
  the format and opens its editor at the kind's row.
- **Three scopes.** A map carries the format, the reference style, the
  language, the kinds in hand, and what its top elements are, so that a
  map of one chapter sets its headings a level down. An element's kind
  (ADR 0025) may say in which kind of paragraph its text begins. A passage
  carries its kind. Passage beats element beats map.
- **The editor stays neutral paper.** Each kind has a screen look of its
  own, derived from the kind it is based on, so that a kind of the
  writer's own is seen at once; the format's measures are not shown while
  writing, only in the preview.
- **Italic stays one mark.** A format may say that italics are set as
  underline (`text.italics`), as the manuscript format of the typewriter
  had it; the mark is the same.

### Export

- **Every kind is a defined style in Word and Writer**, paragraph styles
  for kinds of paragraph and character styles for kinds of words, made
  into the reference document from the resolved looks, the writer's own
  kinds among them (`export/reference.rs`). Pandoc's `custom-style` spans
  and divs carry the names. The names are the catalogue's ("Scene
  Heading", "Epigraph", "Foreign") and, for the writer's own, the kind's
  name, made of letters, digits and spaces.
- **The same table drives every target.** In Typst each kind is a show
  rule on a label (`<gk-kind-ID>`), in LaTeX a group written around the
  paragraph, on the web and in the e-book a class (`gk-kind-ID`) with a
  stylesheet, in Markdown a fenced div. Where no style can carry a look,
  the look is shown as plainly as it can be: italics, bold, small
  capitals, underlining, capitals.
- A foreign word reaches every target with its language, which Pandoc
  carries as `lang`. A mention takes the quotation marks of the language.
  Code is Pandoc's code block and code span. A break is a paragraph of
  the sign the format says. A draft note and a highlight go nowhere.
- **Styles come back in.** When a document of Word or Writer is brought
  in, the names of its styles are mapped to kinds, exactly for what
  Glaukopis made and by convention for the rest; a later piece.

## Consequences

- The schema of the editor keeps every node and mark it had; it gains
  the node `passage` (`name`: the id of the kind), and the marks
  `underline`, `code` and `kind` (`name`, and `lang` for foreign words).
  The parts of a script and the lines of verse stay what they were in the
  document, and are kinds in the catalogue all the same.
- The shapes in the document handed to the core: a block
  `{ "kind": "passage", "name": "epigraph", "content": [...] }`; marks
  `underline: true`, `code: true`, `kind: { "name": "foreign", "lang": "el" }`;
  `kinds: [{ id, name, family, basedOn, look }]` on the document; and on
  the format `kinds: { "<id>": look }`, `suggests: ["scene", ...]` and
  `text.italics: "italic" | "underline"`. A look is a JSON object of the
  measures named above, in camel case, lengths as `"1.27cm"`, nothing
  for what is not said.
- The catalogue is written twice, in `formats/kinds.rs` with the looks
  and in `src/lib/editor/kinds.ts` with what each kind does while writing;
  the contract test (`src-tauri/src/contract.rs`) writes the Rust side
  into `contract.generated.ts`, and a test of the interface holds the ids
  alike.
- What does not carry: verse numbers in the margin of Word, since Word
  numbers lines only by the section; a size or a spacing given to a kind
  of words, which only Word and Writer set; and ornaments that need a
  glyph the font lacks.
- Adjustments, the mapping of styles when a document is brought in, and
  tools that appear with each kind beyond the line numbers are later
  pieces of the same plan.
