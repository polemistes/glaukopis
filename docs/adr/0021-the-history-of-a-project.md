# 0021 — The full history of a project

Date: 2026-09-29. Status: accepted.

## Context

The one the application is made for asked for the full history of a project,
at a detailed level, and optional; and for ways to keep it from taking too
much room or too long to read: archiving or deleting older history, and
keeping it less finely. It is also what reviewing changes afterwards rests
on (ADR 0022).

A project is a Yjs document (ADR 0002). Every change to it is an update,
which the application writes to a log on disk (`updates.log`), in batches a
few tenths of a second apart; when the project is saved, the log is taken
into the stored state and emptied. Besides, a whole state is kept every ten
minutes or more, forty at the most: the earlier versions of a project, which
can be opened as projects of their own.

Yjs updates are its own history: what each one inserted, with the id of the
copy that made it, and what it deleted. Played again one after another from
the beginning, they give the document as it was after any of them; and a
Yjs snapshot, a state vector with the deletions, names such a moment in a
way every copy of a shared project understands. What Yjs does not keep is who
deleted something: a deletion carries no author. Yjs has a way to keep that
in the document, `PermanentUserData`.

## Decision

- **The history is kept by the project's own setting**, off at first, and
  written into the project, so that every copy of a shared project keeps it
  and knows who deletes what. It can be turned off again; what was kept is
  then deleted, after asking.
- **Every change is kept.** The log is no longer emptied when the project is
  saved: its batches go into the history, each with the time it was written
  on this computer and whether it was made here or came from another. What
  another made is known by the copy that made it; the time of a change made
  on another computer is when this one received it.
- **Who is who.** Each installation of the application is a person: an id
  made once and kept in the settings, and the name the settings give. A
  project with its history on keeps who its people are and which copies are
  theirs, and, with `PermanentUserData`, what each of them deleted.
- **The project as it is stays as lean as before.** Deleted text is not kept
  in the document that is worked in; the history holds it, on disk, and is
  read only when it is looked at, in a worker, so that the window does not
  stand still.
- **Looking at the history.** The changes are shown as sessions: what one
  person did before a pause. Any moment can be looked at: the text as it was
  then, with what changed since the moment before marked in the colour of
  who changed it. A moment can be given a name. A map or an element can be
  brought back as it was, by a new change that can itself be taken back; or
  the whole project as it was opened as a project of its own, as earlier
  versions are now.
- **Room and time.** Older history is kept less finely: after some weeks
  the batches of each hour are merged into one, and after some months those
  of each day, so that moments within them can no longer be told apart; what
  was typed is then kept as whole words and sentences rather than keystrokes,
  which takes much less room and is read much faster. History before a date
  can be archived, into a file that can be opened and looked at again, or
  deleted; what is left then begins with the project as it was at that date.
  How far back each is done is set for each project, and the settings show
  how much room the history takes.
- **What must not be thinned.** Named moments, and the moments reviews
  compare with (ADR 0022), are kept as moments when older history is merged,
  and archiving or deleting history before them asks first.
- The earlier versions, a whole state every ten minutes or more, stay as
  they are, for projects with and without the history.

## Why not otherwise

- *Yjs without garbage collection*, which keeps everything deleted inside the
  document, would make looking back simple. But the project in memory would
  hold all that was ever deleted in it, and every copy would read it all
  whenever the project is opened, however seldom the history is looked at.
- *States kept every few minutes*, as earlier versions are, cannot show a
  sentence changing step by step, nor who changed what, and a review needs
  any moment, not the nearest kept.
- *A history kept by the server*: most projects are not shared, and a shared
  project is worked on offline as well.
- *Always on*: it takes room, and in a shared project it shows the others
  when and what one wrote. It is for the one who wants it.

## Consequences

- A project with its history takes more room: while it is kept finely, some
  hundreds of kilobytes for a day of writing; much less once it is merged.
- A project's history is on the computers that kept it. One who joins a
  shared project has its history from the day they joined.
- Who deleted something is known only for what was deleted after the
  history was turned on.
