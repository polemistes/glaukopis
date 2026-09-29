# 0022 — Reviewing changes afterwards

Date: 2026-09-29. Status: accepted.

## Context

The one the application is made for asked for a way to go through what
others have changed, and accept or reject it, almost as Word's and
LibreOffice's tracking of changes does. Two ways were set out:

- **Proposals held back**, as in Word: while it is on, what one writes is not
  put in but proposed, and stands as a proposal until someone accepts or
  rejects it.
- **Changes reviewed afterwards**: everyone writes as they do now; later,
  each goes through what the others changed since a moment, and accepts or
  rejects it.

The second was chosen. It rests on the history (ADR 0021), and asks nothing
of the writer while writing.

## Decision

- **What is reviewed** is what changed in a project since a moment: since
  the reviewer last reviewed, which is kept for each person, or since a
  moment they choose. Changes by others are shown; one's own can be shown
  as well. It needs the history of the project, and turning it on is offered
  where it is off.
- **A change is a sentence**, with the words that changed marked in it,
  however many places in it changed. It is more where more changed
  together: new text of a sentence or more, however long, is one change,
  and so is text deleted; a paragraph moved is one change, not a deletion
  and an insertion; each element of the map added, deleted, moved, renamed,
  or set in or out of the document is one. A citation, a formula, a figure,
  a table as a whole, is a change of its own; the text of a note, of what is
  said of a figure, of a cell, is gone through sentence by sentence as all
  text is. Formatting is part of its sentence's change. A sentence two
  people changed is one change, with each one's words in their own colour.
  The review can also go by paragraph, for a quick look at text much
  rewritten.
- **The two ends.** A change is shown as it was at the moment compared with
  and as it is. Its history can be opened: every version in between, with
  who made it and when. From there, **Accept up to here** accepts the
  versions up to one, and leaves those after it to be reviewed; **Use this
  version** makes the text that version again, and accepts it.
- **Decisions.** **Accept**: the change is reviewed, and is not shown again
  unless it changes again. **Reject**: the text goes back to what it was,
  by a new change of the reviewer's, which is in the history like any other
  and can itself be taken back. **Later**: go on to the next, and leave this
  one in the list.
- **The reviewer may write.** The text is edited where it stands while it is
  being reviewed; Accept then accepts it as it stands, and what the reviewer
  wrote is theirs, for the others to review.
- **Where.** A panel of changes beside the text, in the order of the text,
  gone through one after the other; the change that is looked at is shown
  in the text, which is scrolled to it and opened where it is folded. While
  the panel is open, the text shows the changes where they are: what was
  added marked in the colour of who added it, what was deleted struck
  through.
- **What a person has reviewed** is kept in the project, so that it holds on
  every computer they work on, and the others can see how far they have
  come: the moment they review from, and for what they have accepted since,
  the part of the text and the version they accepted.

## Why not otherwise

- *Proposals held back*: every kind of edit would have to become a proposal,
  in text with citations, notes with editors of their own, figures, tables
  and the map's elements, and undo, search, spelling, counting and the
  preview would all have to understand them. It may come later, and would
  be needed to exchange tracked changes with Word; Pandoc reads and writes
  them in DOCX, and ODT would need the application's own reading and
  writing.
- *Each inserted or deleted piece a decision of its own*: a sentence
  rewritten in four places would be four decisions about fragments.
- *Paragraphs only*: unrelated changes in a long paragraph would be one
  decision.

## Consequences

- What others write is in the text before it is reviewed: it is seen at
  once, printed in the preview, and exported.
- A sentence ending is found by the language of the text, knowing the
  common abbreviations; where it is found wrongly, a change is shown as two,
  or two as one.
- A change within the part of a shared project's history that one's
  computer does not have cannot be reviewed there.
