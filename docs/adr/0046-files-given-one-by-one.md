# 0046 — Files given to their references one by one, never many to one in a step

Date: 2026-10-15. Status: accepted by the owner on 2026-10-15; to be built from `docs/plans/files-given-to-their-references.md`. Amends 0043 (the files of the library).

## Context

The owner added a folder of over a thousand PDFs, in many folders, to the files of the library, selected them all and chose *Assign to a reference…*, expecting a going-through that would find a reference for each. The dialog asked "Choose", with a search over the references, the same chooser as when citing, and the owner read it as "which work is this", chose a book, and gave all thousand files to that one reference; and did so twice. Taking them back is one file at a time, each with a confirmation.

The going-through the owner expected exists (0043): *Go through…* finds out what each file is and proposes a reference for each, with the writer deciding, as the loose citations are matched when a text is brought in. It was not what the owner found, because over a selection *Assign to a reference…* stood first in the menu and was the first button in the pane, while *Go through these…* stood third in the menu and nowhere in the pane; and because the one action that gives a reference to many files said nothing of what it was about to do.

The owner asked that this cannot happen again, saw no reason for giving one reference to many files at once, and asked for a streamlined way of giving each file to the right reference, or a new one, like the matching of citations on import.

## Decision

### No reference is given to many files in one step from a selection

*Assign to a reference…* remains only in the pane of one file. Over several files selected, the actions are *Go through these…*, *Move*, *Export…* and *Remove*; there is no way to give them all to one reference.

The one honest case of several files on one work, a book scanned chapter by chapter, a work and its supplement, is a handful of files, and it is done from the work's side: the pane of a reference gains *Add files of the library…*, which picks files of the library by name and says in its button how many it adds. Attaching several files from the disk to a reference, by the picker or by dropping them on its pane, the other road to the same mistake, asks first, with the count and the reference's title in the question and the button; one file is attached as today.

### The going-through is the one action over several files

It stands first in the menu over a selection and is the main button when several files are selected. Where files come in, it is offered by a bar at the head of the folder, *N files here belong to no reference. Go through them…*, which stands until they are gone through, in place of the passing message after taking in; the bar can be hidden for the session, and comes back when more files are taken in.

For a thousand files, the going-through gains two things:

- **The folder as one more clue.** A folder named as files are named, with a year in it, *Nagy 1979 - The Best of the Achaeans*, tells of the files in it what their own names leave out: the author, the year, the title. A work found so is proposed as probable, with the reason *in a folder named like it*. A folder named for a subject, *Greek*, *To read*, says nothing.
- **The rows grouped by case**: found for certain, found as probable, new from the services, nothing found; each group with its count and, where it has a head row, that row answering for all of it; a large group folded, its rows shown on asking. A thousand rows become four decisions and a look at the doubtful ones.

The going-through never assigns by itself: nothing is given until the writer says so, and the button that does it says how many files it gives.

### A rule for every action on many things

A button that does something to many things says how many and to what: *Give 998 files to their references*, *Attach 3 files to Nagy 1979*, *Remove all 1000 from this reference*, never *Choose* or *OK*. And what was done to many in one go can be undone in one go: the message after a going-through carries *Undo*, kept while the application is open, which takes the files back and removes the references made; and the pane of a reference gains *Remove all N from this reference*, with one confirmation that names the count.

### What is not done

- No threshold that asks only above some number of files: a guard that counts is the kind that fails on the thousandth file.
- No undo of what a single click did, taking one file from a reference being one click.
- No matching of files to references beyond what 0043 finds out: an identifier, the metadata, the name, the first page, and now the folder.

## Later

- The same bar for the pictures of the store that belong to no reference.
- Finding out again, by hand, for files whose proposal was *nothing found* after new references were added.

## Consequences

- `fileItems` and the pane of several files selected lose the assignment; `ReferenceChooser` serves one file, a picture, and the going-through's *Another…*; a new `FileChooser` serves the pane of a reference.
- `Known` carries the names of the file's folders; `Reason` gains `Folder`; the proposals' tests gain the folder cases.
- The library gains `detach_all`; the commands gain `attachment_remove_all`.
- The files e2e script changes where it took the offer from the message, and grows with the bar, the grouped going-through, the undo and the pane's new actions.
- The guide's part on files and references says the rule.

## Why not otherwise

- *Keeping the assignment of many with a confirmation that names the count*: a confirmation would have stopped the mistake, but the action has no use that the going-through and the reference's pane do not serve better, and the owner asked for it to go.
- *Assigning what is found for certain without asking*: the owner's rule for this program is that the writer decides what a thing is; the head row that answers for all found for certain is one click, and the writer's.
- *Matching by every folder name*: a folder named for a subject would propose one work for every file in it, which is the mistake again, by the machine this time.
