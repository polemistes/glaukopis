# 0045 — The shape of a page: structure read from a PDF's layout, without a meaning given to it

Date: 2026-10-15. Status: accepted by the owner on 2026-10-15; to be built from `docs/plans/the-shape-of-a-page.md`. Amends 0018 (text read from PDFs) and 0044 (the text a PDF has).

## Context

A PDF read into elements today becomes one element per page, holding paragraphs of plain text: the lines of the page joined into paragraphs by where they stand, every line a run of text of the kind *text*. Everything the page's layout said is lost: that a line was a heading, that a block of lines was set line by line on purpose, that numbers stood in the margin beside the lines, that some text recurred in a smaller size at the foot, that a line at the head of every page was the running head. The owner asked what it would take to keep this.

The owner also set the rule for how it is to be kept. Glaukopis is for anyone who works with texts. The program may find the *structure* a page has, since every page has one, but it must not give a *meaning* to what it finds unless the meaning is plain: it does not know whether it has a drama, a novel, a law, a newspaper or a thesis in hand, and it should not pretend to. A detector built for one kind of text does the wrong thing on every other. The owner's own texts are a case to test against, not to design around.

What the design rests on is already in place: an element holds its text as paragraphs of kinds with their numbering, the look of which is the layout's business (0040, 0041, 0042); every line read from a PDF comes with its place on the page, its height and the font of its glyphs, and every line Tesseract reads comes with its place and height; and the import can carry paragraph kinds, line marks with given numbers, and marks of emphasis.

## Decision

### What is found, and what it becomes

Structure is read from the geometry of the lines, the same for the text a PDF has and for what Tesseract reads, and becomes the element's own structure. Each finding is named by its look, not by what it might mean.

- **Headings.** A line, or two or three together, set larger or heavier than the body of the page and standing apart from it becomes a heading, since that meaning is plain. A heading becomes an element under the page's element, holding what follows it to the next heading or the end of the page; what stands before the first heading stays the page's own. The sizes of headings across the whole file give their levels, largest first, three levels at most.
- **Lines kept as lines.** Where the page keeps its lines, ragged at the right, beginning at one left edge, the element keeps them: one paragraph of the kind *text* for the block, its lines parted by line breaks. Nothing calls them verse. Poetry, lists, addresses, tables of contents and transcripts all look so, and the writer gives them their kind if they want one, by one choice over the selection.
- **Numbers in the margin.** Numbers standing apart from the lines, outside the text's edges and beside a line, become the given numbers of those lines, the paragraph numbered *by the numbers given*, on the side they stood. Laws, poems, transcripts and editions all number lines; the program need not know which it has.
- **Paragraphs of the body** are joined from their lines as today, a word broken at the end of a line made whole again; a paragraph that begins further in than the lines around it is marked as indented by one step.
- **Marks within a line.** A run of glyphs in a font whose name says italic becomes emphasis; in one that says bold, strong; glyphs named as small capitals, small capitals. Only from what a font says of itself; Tesseract's text gets no marks.
- **Recurring styles become kinds without a meaning.** Text that recurs on several pages in the same size, face and indent, other than the body and the headings, such as the smaller text at the foot of a page or the slanted text that opens a chapter, is gathered as a *style found*. Each is shown, with a sample and how often it occurs, before the map is made, and the writer says what it is: a kind of the catalogue, a kind of their own, named now, or plain text. "Plain text" is the answer where nothing is said. A kind of the writer's own made so carries no look until the writer gives it one, as no kind does (0040).
- **Running heads and page numbers are dropped.** A line at the top or bottom edge whose text, or whose text but for digits, recurs on three pages or more, or alternates between two forms, is a running head; a number alone at an edge that steps page by page is a page number. Both are plainly what they are, and the page's element is named by its number already.
- **Columns.** Where lines stand in two columns, the left is read before the right. Tables are not read from positions: their lines are kept as lines.

### Where it is decided

The dialog that brings a PDF in gains one choice beside the text's, *Keep the shape of the pages*, on at first, which does all of the above; off, the pages become plain paragraphs as before. Where styles were found, the dialog lists them after the reading, with a sample of each, for the writer to name before *Bring it in*. The same shaping serves a PDF read into a new project, into the element in view, and into a branch of another project.

### What is not done

- No kind of text is deduced: not drama, not verse, not an apparatus, not a letter. What recurs is a style found, named by its look, until the writer names it.
- Indents beyond one step, spacing, margins and the placement of anything on the page are the layout's business and are not copied.
- Tables, footnote marks, and figures on a page are not read from positions.
- The apparatus of an edition is a style found, as any smaller recurring text is; tying it to the lines it speaks of is not attempted.

### A rule made general at the same time

The warning when Greek is read together with a language of the Latin script (0044) is really about any two scripts whose letters look alike, Cyrillic and Latin as much as Greek and Latin: it is made so, and says which letters are alike in the two.

## Later

- The same going-through of styles for documents brought in by Pandoc, where Word's and OpenDocument's named styles are the styles found.
- A line of a style found tied to what it speaks of, where a style is numbered as the lines are.

## Consequences

- `Line` learns its font and size; the page's lines are shaped before they are made into blocks; `Imported` carries the styles found; the paragraphs of a style are made of the kind the writer chose when the map is made.
- A page whose shape is kept may become several elements. The count of parts says so before the map is made.
- The guide's section on text in scans and pictures describes the shape kept and the styles named.
- The words of the other languages lag, as usual.

## Why not otherwise

- *Recognising drama, verse, letters, newspapers*: the owner's rule; every such recogniser is wrong on every other text, and the writer knows what the text is in one glance.
- *Keeping positions*: an element has none; the layout gives the look.
- *Kinds of the catalogue given to what is found, such as* line *for kept lines*: that is a meaning, and the catalogue's family of that kind is named for one; plain text with line breaks keeps the lines and gives nothing.
