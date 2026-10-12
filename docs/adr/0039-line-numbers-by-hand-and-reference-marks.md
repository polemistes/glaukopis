# 0039 — Line numbers given by hand, and reference marks

Date: 2026-10-12. Status: accepted.

## Context

Verse could be numbered from a line, every so many lines, and nothing more.
The canonical numbers of an edition often do not follow the lines as they
are set: in Greek drama a line shared between speakers is set as two lines
and counted as one, editions insert lines (*567a*), and Aristotle is cited
by the numbers of Bekker's pages, columns and lines (*1094a1*). Writers also
want a note beside a line (its metre, another edition's number), and prose
that is cited by numbers of its own: the verses of the Bible, the pages of
Stephanus.

## Decision

**Numbers on lines.** A line of verse (`verse_line`) has three attributes
more, which old projects read as their defaults:

- `number`: a number or label given by hand, or nothing. It is always
  shown, and the count goes on from its last run of digits, keeping what
  stands before them: *1234* → 1235, *1094a1* → *1094a2*, *567a* → 568. A
  label without digits is shown and leaves the count as it was. A verse
  without a start is counted from its first line given a number.
- `counted`: false for a line the count passes over; it shows only its own
  label, if it has one.
- `margin`: words shown in the margin beside the line, not counted.

*Every so many* applies to the numbers of the count, not to the lines on the
page. Only lines of the kind *line* are counted, as before. There is one rule,
written twice: `src/lib/project/model/lines.ts` for the editor and the text
drawn without one, `crates/core/src/document/verse.rs` (`line_numbers`) for
every document. Each has the same cases in its tests.

In the editor a number given by hand is drawn as dark as the text, the
others faint, so that the writer sees which were given. The numbers stand in
the left margin and the margin words in the right, in the editor, in Typst
and in LaTeX; the right margin is free in every layout, and a note of the
metre reads at the end of its line. Typst no longer counts: the converter
gives each `gk-line` what it shows. In Word, Writer and the formats made
from a line block, where there is no margin, the number stands at the head
of its line (as before) and the margin words at its end, each in a span with
a character style (*Verse Number*, *Verse Margin*).

They are set from the **#** button of the verse, whose window now has a part
for the line the cursor is in.

**Reference marks.** A new inline atom, `refmark`, with a `label`. It is not
text: spelling, search (all three readers of passages, which pass over it
without leaving a sign, so that words are found across it) and the counts of
words leave it out; copying as plain text leaves it out, copying as HTML
keeps it. The layout says how every mark is set, by `text.refmarks`:
`raised` (the default) or `margin`. Typst defines `gk-refmark` by it: raised,
or placed in the right margin from where the mark stands on the page, taking
no room in the line. LaTeX has `\textsuperscript` or `\marginpar`. Word and
Writer have no margin to put it in, and raise it in a span of the character
style *Reference Mark*. It is put in from **Insert › Reference mark…** or
Ctrl+Alt+K, with a label that begins as the one that follows the mark before
it, and changed by pressing it.

## Consequences

- No direct formatting comes in: the look of the marks is the layout's.
- The names `number`, `counted`, `margin`, `refmark` and `label` are stored
  in projects and must not change.
- A version before this one does not know them: it may drop the marks and
  what was said of the lines where it writes the text again.
