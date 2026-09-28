# 0009 — Figures and mathematics

Date: 2026-09-28. Status: accepted.

## Context

The brief asks that pictures, figures and equations can be part of the
elements and their text, and of the preview and the documents that are made,
"formated as the reference style or the format requires, or as the author
requests". A document is made in seven kinds (ADR 0005), by three programs,
and each kind has its own notion of what a figure is: how it is numbered,
what it is called, where its caption goes. Projects are shared (ADR 0006),
and are documents of changes (ADR 0002), in which a picture has no place.

## Decision

- **A figure is put together by the application**, and not left to what each
  kind of document has for figures. It is a picture and a line of text,
  which begins with the word and the number the application gives it. So the
  number, the words and the order are the same in every kind of document,
  and are what the format says. The cost is that the documents do not know
  their figures as figures: Word has no list of them to offer.
- **The format says how figures are set**: what a figure is called, what
  stands between the number and what is said of it, where that stands and
  how it is set, and whether the figures stand in the text or are gathered
  at the end, with a line in the text where each belongs. The author says,
  of each figure, how wide it is, whether it is numbered, and what it shows.
- **Mathematics is written in the notation of TeX.** It is what publishers
  take, what Pandoc reads and can turn into the mathematics of every kind of
  document, and what those who write mathematics know. For those who do not,
  the panel it is written in has the common signs.
- **What is shown while writing is what Pandoc made of the formula**, given
  back as MathML, which the window shows by itself. No second reader of TeX
  is part of the application, with a mind of its own about what can be
  written; a formula that Pandoc cannot read is known while it is written.
  The MathML is put into the page only after everything but mathematics has
  been taken out of it. The font of the formulas comes with the application.
- **An equation is numbered by the application**, for the same reason as
  figures are. In PDF the number stands at the margin; in Word and
  OpenDocument, which have no place for it there, it follows the equation.
- **A picture is a file of the project, named by the SHA-256 of what it
  holds**: `projects/<id>/files/<hash>.<extension>`. The text names the
  picture by that name. The same picture is kept once; a picture that was
  changed is another picture; and what comes from someone else can be told
  to be what it is said to be.
- **Three kinds of picture are kept: PNG, JPEG and SVG**, which every kind
  of document can hold. Others are made into PNG when they are taken in. A
  photograph that says it is to be turned before it is shown is turned then,
  since not every program heeds that.
- **Pictures travel apart from the project.** The server keeps the files of a
  room and gives them to those who are admitted to it; the application sends
  what the server lacks and fetches what it lacks itself. What arrives is
  kept only if it holds what its name says, and is a picture.
- **The paragraph after a figure or an equation begins as the first
  paragraph under a heading does**, in every kind of document.

## Consequences

- A picture that is no longer in any text stays with the project. It may
  come back by undo, or be in an earlier version. Nothing removes it yet.
- A figure copied from one project to another names a picture the other
  project does not have, and is shown without it.
- There are no tables yet, and the text cannot point to a figure or an
  equation by its number ("see figure 2"). Both belong here, and the second
  follows from the first decision: the application knows the numbers.
- A formula that LaTeX can read and Pandoc cannot is set by LaTeX all the
  same, and is shown as it was written everywhere else.
- A note cannot stand in what is said of a figure: not every kind of
  document can set one there.

## Alternatives considered

- *The figures of each kind of document* (Pandoc's `Figure`): numbered by
  Word, LaTeX and Typst each in their own way, with their own words, and not
  at all in some. The format could not say how figures are set.
- *A reader of TeX in the interface* (KaTeX, MathJax): quick, and at odds
  with what is made wherever the two read a formula differently.
- *An editor of formulas by pointing*: much to build and to learn, for what
  those who need it already write as TeX.
- *Pictures inside the project document*: every change of the project would
  carry them, and the history would keep each of them for ever.
