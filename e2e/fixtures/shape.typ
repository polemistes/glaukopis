// A file with a shape, for the tests of the shape of a page (ADR 0045): a
// running head and page numbers, a title, headings, paragraphs (one
// indented, one with italics), a block of ragged lines numbered in the right
// margin, and a smaller text recurring at the foot of every page. It is no
// kind of text in particular. Made with: typst compile shape.typ shape.pdf
#set page(
  width: 148mm, height: 210mm, margin: (x: 20mm, top: 24mm, bottom: 24mm),
  header: align(center, text(size: 9pt)[A Book of Tests]),
  numbering: "1",
)
#set text(font: "Libertinus Serif", size: 11pt)
#set par(justify: true, first-line-indent: 0pt, spacing: 1.1em)

#let foot(body) = place(bottom, float: true, clearance: 8pt, text(size: 8.5pt, body))

// Lines kept as lines, every fourth numbered out in the right margin: a
// grid that reaches into the margin, its first column the text's measure.
#let lines(numbered) = pad(right: -16mm, grid(
  columns: (1fr, 6mm),
  column-gutter: 10mm,
  row-gutter: 0.62em,
  ..numbered.enumerate().map(((i, l)) => (
    l,
    if calc.rem(i + 1, 4) == 0 { align(right, str(i + 1)) } else { [] },
  )).flatten()
))

#text(size: 18pt, weight: "bold")[The Measure of Things]

#v(0.6em)
Every page has a shape, whatever is written on it. This first paragraph is set in the body of the book, in the size most of its lines are in, and it runs on from one line to the next as prose does, filling the measure from the left edge to the right.

#par(first-line-indent: 1.5em)[A second paragraph begins further in, as many books begin their paragraphs, and goes on as the first one did, to the end of its last line, which may stop short of the right edge.]

Some words stand out in it: _these are set in italics_, and the rest are not.

#foot[1. A note at the foot of the first page, in a smaller size.]

#pagebreak()
#text(size: 14pt, weight: "bold")[Lines That Keep Their Place]

#v(0.4em)
#lines((
  [The first line is short,],
  [and the second a little longer than it,],
  [the third shorter again,],
  [and the fourth stands beside a number.],
  [A fifth line follows],
  [with a sixth that is longer than the fifth was,],
  [a seventh,],
  [and an eighth with a number beside it once more.],
))

#v(0.6em)
After the lines the prose goes on again, as it did before them, in the body of the book, from the left edge to the right, for a few lines more.

#foot[2. A note at the foot of the second page, in a smaller size.]

#pagebreak()
Another page of prose stands here, so that the body is the size most lines are in, and so that what recurs at the head and at the foot of the pages is seen to recur. It runs on for some lines, as prose does.

It has a second paragraph as well, which says nothing new, but says it at the length a paragraph has.

#foot[3. A note at the foot of the third page, in a smaller size.]

#pagebreak()
#text(size: 14pt, weight: "bold")[The Last Part]

#v(0.4em)
The last page has a heading of the same size as the second page had, and prose under it, and nothing more than that, for a book of tests needs no more.

#foot[4. A note at the foot of the fourth page, in a smaller size.]
