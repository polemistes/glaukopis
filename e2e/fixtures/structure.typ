// A file made from a written document, for the tests of the structure of a
// document (ADR 0047): a title with its author and year, headings numbered
// at two levels, which Typst also writes into the file's outline, a
// paragraph that runs over the edge of a page, and page numbers at the foot.
// Made with: typst compile structure.typ structure.pdf
#set page(paper: "a5", margin: (x: 18mm, top: 20mm, bottom: 22mm), numbering: "1")
#set text(font: "Libertinus Serif", size: 11pt)
#set par(justify: true, first-line-indent: 0pt, spacing: 1.1em)
#set heading(numbering: "1.1")
#show heading.where(level: 1): set text(size: 15pt)
#show heading.where(level: 2): set text(size: 12.5pt)

#text(size: 20pt, weight: "bold")[A Short Treatise]

Anna Lind

2026

#v(1em)

= Beginnings

#lorem(60)

#lorem(220)

== The First Part

#lorem(50)

== The Second Part

#lorem(50)

= Endings

#lorem(40)
