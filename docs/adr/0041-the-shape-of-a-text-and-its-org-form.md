# 0041 — The shape of a text, and its Org form

Date: 2026-10-13. Status: accepted by the owner on 2026-10-13; built from `docs/plans/the-shape-of-a-text-and-its-org-form.md`. Amends 0040 (the kind of a paragraph and passages), 0039 (line numbers by hand), 0027 (verse) and 0002 (where the text is kept).

## Why

The rework of kinds this week left too many special rules: Enter and Tab that did one thing in verse and another in prose, a kind that followed another on Enter, an attribution that joined whatever stood before it, a speaker that lived only in verse, an empty line that was a stanza break, passages kept as stored containers with a step that kept them in shape, and a poem cut into lines and glued back when its kind changed. Each answered the example in front of us; together they were a thicket. The owner also wants every project readable without the program, in a form a person can read and other tools can open, and has chosen Org for it.

This record says, first, what a text *is* — a few general things with uniform keys — and, second, how every project is written as Org, line by line.

## 1. The shape of a text

A text is made of these, and nothing else:

- **Lines and paragraphs.** A paragraph is one or more lines. Line breaks and paragraph breaks are typed the same way in every kind of text and are never changed by anything but the writer.
- **Kinds.** A kind is a label on a paragraph (*quotation*, *line of verse*, *speaker*, *dialogue*, *headword*, a kind of the writer's own) or on a run of words (*foreign words*, *title of a work*, *term*, *speaker*). Any kind may stand on any paragraph. Changing a kind changes the label and nothing else.
- **Marks on a line**: what is said of one line by hand when lines are numbered — its number or label, that it is not counted, that it is counted but shows no number, words in the margin.
- **Settings on a stretch**: what is said of a run of paragraphs — how they are numbered (not at all, counted, only by the numbers given; every how many; which side), and the language they are in.
- **Blocks that are not text**: figures, formulas, tables, figures side by side, and page and column breaks.

What is gone: passages as stored containers and the step that kept them in shape; the rule that a kind follows another on Enter; the attribution that joins what is before it; the passage of text that exists only while numbered; speakers and directions bound to verse; the empty line as a stanza break; cutting and gluing when a kind changes.

**Passages are seen, not stored.** Paragraphs of one kind standing together are shown with a bracket named by the kind, and a numbered stretch with a bracket named *Numbered*. The document sets them as one block where its form has one — lines of verse as a line block, quoted paragraphs as a block quote, items as a list, lines of code as a code block — and that grouping is the document's own business, which the writer never steers.

## 2. The keys

The same in every kind of text:

| Key | What it does |
| --- | --- |
| Enter | A new paragraph of the same kind. On an empty paragraph of a kind: the paragraph becomes text, which is how one leaves a list, a verse or a dialogue. |
| Shift+Enter | A new line within the paragraph. |
| Backspace at the start of a line | Joins it to the line before; at the start of a paragraph, to the paragraph before. |
| Tab, Shift+Tab | Indents and outdents the paragraph, where an indent means anything: a line of verse, an item of a list. Elsewhere nothing. |
| Ctrl+Enter, Ctrl+Shift+Enter | A new element after, a new element under, as now. |

A kind's hint no longer promises what Enter makes next. A key for "the next kind of this family" is not built; the owner may ask for one.

## 3. Kinds

**Of paragraphs**, with the family that says how the document groups them, and whether their lines are counted by a numbering:

| Kind | Grouped as | Counted |
| --- | --- | --- |
| text | — | yes |
| quote | a block quote | yes |
| epigraph, attribution | a paragraph of its kind | yes, no |
| line (verse) | a line block | yes |
| speaker, direction | a paragraph of its kind | no |
| scene, action, character, dialogue, parenthetical, transition | a paragraph of its kind | yes |
| headword, gloss | a description list | yes |
| item, numbered | a list, nested by indent | yes |
| code | a code block | yes |
| break | the sign the layout gives | no |
| draft | nothing: it goes into no document | — |
| a kind of the writer's own | as the kind it is based on | as the kind it is based on |

**Of words**: foreign (with a language), title, term, mention, highlight, speaker, direction, and the writer's own; with the marks italic, bold, small capitals, underlined, raised, lowered, struck through, code, and a link. Speaker and direction are the same kind at two scales: a name or a direction on a line of its own, or within a line as an edition sets them.

Each kind has a cue where one writes (the bracket's name, an indent, small capitals for a speaker), which reaches no document; every look lives in a layout, as decided this week.

## 4. Numbering

A **numbered stretch** is any run of paragraphs the writer has numbered, whatever their kinds: lines, speakers, directions and prose may all stand in it, and the count runs through all of it. Each kind says whether its lines are counted by default (a speaker's name is not); a line can say otherwise by hand. Lines are what is counted: in a verse paragraph, its lines; in a prose paragraph, the paragraph is one line.

The settings of a stretch — *not numbered*, *counted from the first number given*, *only the numbers given*; every how many; left or right — are kept on each of its paragraphs and set on all of them at once; a run of paragraphs with the same settings is one stretch. The marks on a line: a number or label given by hand, from which the count goes on; *not counted*; *counted, its number not shown*; words in the margin. The numbers in the margin are edited in place, as now. The lines of the printed page are numbered by a switch in the Numbers menu, said of the document, over its layout.

## 5. Blocks that are not text

- **Figures, formulas, tables** as they are now: a picture by its hash with a caption and a name; a formula in TeX, numbered or not; a table with heading cells, cells that span, paragraphs in cells, a caption and a name; figures, formulas and tables side by side.
- **Page break** and **column break**: inserted from *Insert*, shown as a dashed line with its name, set in every document form. Columns become a setting of the layout: how many, and the gap between them.

## 6. The Org form

Every project has an Org form, written by the program and read by people, Org mode in Emacs, Pandoc and other tools. Everything that is text or meaning is in it. What is only for the program's own displays — the camera of a diagram, the view that was open, where a comment's card was dragged — is not, and is made afresh.

### The file

```org
#+TITLE: Medea
#+LANGUAGE: en-GB
#+BIBLIOGRAPHY: references.bib

* Medea
:PROPERTIES:
:ID:       project
:TEMPLATE: play
:LAYOUT:   play-script
:END:
:ELEMENT_KINDS:
- Character :: colour=blue begins=line
- Scene :: colour=green
:END:
:PARAGRAPH_KINDS:
- Letter :: based-on=quote italic=yes indent-left=1cm
- Ship's name :: words based-on=title
:END:

The preamble of the project, if it has one.

** The prologue
:PROPERTIES:
:ID:     4KP9IEtvBUMv
:KIND:   Scene
:STATUS: draft
:WHEN:   431 BC
:POS:    120,-40
:LINKS:  [[id:9bQ2x...][answers]] [[id:Vv7q...]]
:END:
```

An element is a headline at the depth it has in the tree; the project itself is the first headline. Its name is the headline's words, with their marks; its text is the body. The drawer holds what the program knows of it: `ID` (the project element is `project`); `KIND`, the name of its kind of element; `STATUS` (idea, draft, done); `WHEN`, its placement in time, in the words the program writes for one and reads back ("431 BC", "431 BC – 430 BC", "about 450 BC", "after [[id:…]]"); `HEADING: no` when its name is not printed; the tag `:noexport:` on the headline when it is left out of the document; `INCLUDE`, the id of an element it includes; `ORIGIN`, the id it was copied from; `POS` and `COLLAPSED: t`, where it stands in the diagram and whether it is folded; `LINKS`, its associations, each a link to the other element with its label, written once, on the element the association goes from. The settings of its document, where it has its own: `TITLE`, `SUBTITLE`, `AUTHORS` (names; an affiliation after a `/`), `DATE`, `KEYWORDS`, `TEMPLATE`, `LAYOUT`, `STYLE`, `LANGUAGE`, `IDENTIFIERS` (`isbn=… doi=…`), `LINE_NUMBERS`; and `TIMELINE` where it is shown as a timeline of its own (its axis and unit, and its lanes). The kinds of the project stand under its headline in two drawers, one line each, name and what is said of it; a template the project carries, being settings and not text, is a `#+BEGIN_SRC json` block named after it.

### Lines and paragraphs

A paragraph is lines separated by blank lines from the next, as Org has it. A line break within a paragraph of prose is `\\` at the end of the line, Org's own sign; inside a verse block or a code block, a newline is a line. Read back, a bare newline in prose joins with a space, as Org reads it.

### Kinds of paragraph

A run of paragraphs of one kind is one block:

| Kind | Written as |
| --- | --- |
| text | a paragraph |
| quote | `#+BEGIN_QUOTE … #+END_QUOTE` |
| epigraph, attribution, scene, action, character, dialogue, parenthetical, transition, and every kind of the writer's own | `#+BEGIN_epigraph … #+END_epigraph`, named by the kind: for the writer's own, its name in small letters with hyphens for spaces |
| line (verse), with speakers and directions among the lines | `#+BEGIN_VERSE … #+END_VERSE`: lines are lines, a blank line parts stanzas, leading spaces (two a step) are an indent |
| speaker, direction, on a line of their own anywhere | `@ Nurse`, `> She weeps.` — signs of our own at the start of a line |
| headword and its glosses | Org's description list: `- Argo :: The ship in which Jason sailed.`, a second paragraph of the gloss indented under it |
| item, numbered | `- ` and `1. `, nested by indenting; a numbered list that begins elsewhere than 1: `1. [@5] …` |
| code | `#+BEGIN_SRC … #+END_SRC` |
| break | `-----` |
| draft | `#+BEGIN_COMMENT … #+END_COMMENT`, which Org does not export either |

A block of a name the project does not know, read back, becomes a kind of the writer's own of that name, based on text.

### Verse, with what is said of its lines

```org
#+ATTR_GLAUKOPIS: :numbering counted :every 5 :side right
#+BEGIN_VERSE
@ Nurse
If only the Argo had never flown {1}
through the dark Clashing Rocks
  to the land of Colchis, {1234}
nor the pine been felled {-}
in the glens of Pelion. {~}
> She weeps.
had taken oars in hand {| ia. trim.}

A second stanza.
#+END_VERSE
```

The marks at a line's end are ours: `{1234}` a number or label given by hand; `{-}` not counted; `{~}` counted, its number not shown; `{| words}` words in the margin; together as `{1234 | words}`. A line with no mark has none.

### Numbered stretches and the language of a passage

What is said of a stretch stands on the line before it, Org's way of saying something about what follows: `#+ATTR_GLAUKOPIS: :numbering counted :every 2 :side left`, and `#+ATTR_GLAUKOPIS: :lang de` for its language. Where a stretch holds more than one block — numbered prose, or verse with a quotation in it — the blocks are wrapped in `#+BEGIN_numbered … #+END_numbered` with the settings on the line before, so that the stretch is one thing.

### Marks on words

Org's own: `*bold*`, `/italic/`, `_underlined_`, `+struck through+`, `~code~`, `^{raised}`, `_{lowered}`, and `[[https://…][words]]` for a link. What Org cannot say takes one bracket form, ours, `[words]{what}`:

| Kind of words | Written as |
| --- | --- |
| small capitals | `[words]{sc}` |
| foreign words | `[λόγος]{foreign lang=grc}` |
| title, term, mention, highlight | `[Iliad]{title}`, `[kleos]{term}`, `[word]{mention}`, `[words]{highlight}` |
| speaker, direction within a line | `[Me.]{speaker}`, `[aside]{direction}` |
| a kind of the writer's own | `[Argo]{ships-name}`, by its name as above |
| the language of some words | `[words]{lang=de}` |
| a loose citation, found and not yet settled | `[Nagy 1979, 73]{found key=nagy1979}`, with what was found of it |

### Citations and notes

Citations are Org's own, which carry everything ours do: `[cite:see @nagy1979 p. 73 for the phrase; @west2001]`; `[cite/t:@nagy1979]` for the author named in the sentence; `-@nagy1979` for a key whose author is left out. A locator that is not pages is written with its short word, `ch. 3`, `l. 45`, and read back by it.

Notes are Org's inline footnotes: `[fn::So Nagy, who is not alone.]`. One that must be a footnote or an endnote whatever the layout says begins with `@foot` or `@end`: `[fn::@end So Nagy.]`.

### Formulas, figures, tables, rows, breaks, cross-references, reference marks

```org
$e^{i\pi}$ in the line.

#+NAME: eq:euler
\begin{equation} e^{i\pi} + 1 = 0 \end{equation}

#+CAPTION: The hull of the Argo
#+NAME: fig:hull
#+ATTR_GLAUKOPIS: :width 60 :align right :wrap t :alt "A drawing of a hull" :file-name hull.png
[[file:pictures/3f9a…c2.png]]

#+CAPTION: The crew by rank
#+NAME: tab:crew
| Rank    | Name    |
|---------+---------|
| Helmsman| Tiphys  |

#+BEGIN_row
… two figures, each as above …
#+END_row

#+BREAK: page
#+BREAK: column

See [[fig:hull]], figure [[fig:hull][n]], and [[id:4KP9IEtvBUMv][name]].

In the beginning {#1:1} God created the heaven.
```

- A numbered formula is a `\begin{equation}` named for cross-references; one that is not numbered is `\[ … \]`. Its alignment, where it is not the layout's, is on an `#+ATTR_GLAUKOPIS:` line.
- A figure is Org's picture link with Org's caption and name lines; what the layout may not decide (width in hundredths of the text's width, alignment, whether the text flows round it, the words for those who do not see it, the file's own name, `:numbered nil`) on the settings line. The picture is in the project's `pictures/` folder by its hash.
- A table whose cells are each one line and nothing spans is an Org table, its heading rows above the rule; `:header-columns 1` on the settings line where the first column is headings. Any other table is a **grid table**, which Org's table package reads:

```org
+------------+-----------+
| Heading    | Heading   |
+============+===========+
| A cell of  | spans two |
| two lines  | rows      |
+------------+           |
| another    |           |
+------------+-----------+
```

- Figures, formulas and tables side by side are a `#+BEGIN_row` block.
- A page break is `#+BREAK: page`, a column break `#+BREAK: column`.
- A cross-reference is a link to the thing's name: `[[fig:hull]]` as the layout writes it, `[[fig:hull][n]]` the number alone, `[[fig:hull][name]]` the name; to a part of the document, `[[id:…]]`.
- A reference mark is `{#3:16}` in the line, ours.

### Comments

In a drawer under the element's headline, readable and not part of the text:

```org
:COMMENTS:
- [2026-10-12 Robert] on "gods before men": Is this Nagy's phrase?
  - [2026-10-13 Anna] Yes, Best of the Achaeans, p. 73. (settled)
:END:
```

Read back, a thread finds its place by the words it is on; where those are gone it stands on the element.

### Text that looks like a sign

Whatever text can be written in the editor is written so that it reads
back as the same text. A line of prose that begins with `@ ` or `> `, a
line of verse that ends with a literal `{45}`, an asterisk that would read
as bold, brackets that would read as a kind of words, `[cite:` or `[fn:`
typed as words: each is written with a backslash before the sign, and the
reader takes the backslash away. The round-trip test includes a text made
of nothing but such traps. In the editor, `@` begins a citation only where
a word could begin and only when one is chosen; "@Antigone" in prose is
typed with Escape after the `@`, and `a@b` is left alone, as now.

### Reading an Org file

The parser is tolerant: a sign it does not know stays as the text it is; an unknown keyword line is ignored; an unknown block makes a kind of the writer's own; Org's own things that have no place here (headline tags other than `noexport`, TODO states, scheduling, drawers it does not know) are kept as text in a draft paragraph so that nothing is lost. A bare newline in prose joins, as Org reads it.

### What holds the two forms equal

Every text the editor can hold is written to Org and read back equal, except that empty paragraphs are dropped (as Org has none) and the program's own display state is made afresh. A test writes a text that uses everything there is — every kind, every mark, every block, numbering with every mark on a line, comments — and holds the round trip equal; the e2e script of the Org copy opens a project's `project.org` in the application and compares it to the project. The serialiser and the parser are one module in TypeScript, free of the interface's words so that the search thread may read an Org file too; the core does not read Org.

## 7. The project folder

Beside the state the program works from, every project's folder holds, kept up at every save:

- `project.org` — the whole project, written anew by the serialiser;
- `references.bib` — the works the project cites, in BibLaTeX, which the library already speaks;
- `pictures/` — the pictures the project uses, named by their hash, hard-linked into the store where the file system allows and copied where it does not.

The copy is written and never read back, except by *Open an Org file*, so it cannot get a project wrong; missing or stale, nothing in the program notices. *Save as Org* writes the same three things wherever the writer asks. *Open an Org file* makes a new project of one, as a `.glaukopis` file does. The clipboard gives and takes Org, and takes Markdown through Pandoc. The history and the review show what changed as a difference between two Org texts. The guide says that every project is readable in its folder, and that Org mode in Emacs, among others, reads it with its outline, folding and tables.

There is no view of the Org form inside the application, and signs typed in the editor stay the signs they are.

## 8. What is built, in order

1. **The shape of a text.** Lines and paragraphs with the uniform keys; kinds as labels with no rule of following or joining; speaker and direction as kinds of words as well; numbering as stretches with the marks on lines as inline atoms; passages drawn, not stored, and the step that kept them in shape removed; page and column breaks and the layout's columns; the core's writers for all of it. The texts of the testing projects are not brought over; a reader that does not fall over an old shape costs nothing and stays. About the size of this week's rework: a day of agents working side by side, and a day of fixes after the owner has tried it.
2. **The Org form.** The serialiser and the parser with the round-trip test; the project folder's copy, written on save; *Save as Org* and *Open an Org file*; the clipboard; history and review as Org differences; the guide. About two days of agents.

## 9. Decided here without asking

Small things the owner may want otherwise: the signs `@ ` and `> ` for a speaker and a direction on a line; `{…}` at a line's end for its marks and `{#…}` for a reference mark; `[words]{what}` for what Org cannot say of words; `@foot` and `@end` inside a note; `#+BREAK:` for page and column breaks; `#+ATTR_GLAUKOPIS:` as the one settings line; the description list for a glossary; the names of the properties in an element's drawer.
