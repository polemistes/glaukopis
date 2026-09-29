# The full history of a project, in English.
# See locales/README.md.

history-title = History
history-between = Between the maps and the history
history-settings = Settings of the history
history-failed = The history could not be read.
history-reading = Reading the history…

## When it is not kept

history-off = The history of this project is not kept.
history-off-about = While it is kept, every change is kept, with who made it and when: the project can be looked at as it was at any moment, and brought back. It takes room, and in a shared project it shows the others what each wrote, and when.
history-turn-on = Keep the history

## The moments

# Someone whose name the history does not know.
history-someone = Someone
history-began = The history begins
# The time a session began and ended.
history-span = { $from } – { $to }
# Older history that was merged, so that moments within it are gone.
history-merged = kept less finely
history-added = { $count ->
    [one] +1 sign
   *[other] +{ $count } signs
}
history-removed = { $count ->
    [one] −1 sign
   *[other] −{ $count } signs
}

## The map as it was

history-back = Back to the present
history-as-it-was = As it was { $when }
history-marked = What changed since the moment before is marked in the colour of who changed it.
history-map-not-there = This map was not there then.
history-added-by = Added by { $name }
history-removed-by = Removed by { $name }
history-changed-by = Changed by { $name }
# Words that point to a figure, a table or a part, where it is not known what they said.
history-pointer = pointer
history-name-moment = Name this moment
history-name-placeholder = What to call it
history-named = The moment is called “{ $name }”.
history-bring-back-element = Bring this element back as it was
history-bring-back-map = Bring the map back as it was
history-brought-back = Brought back as it was. Undo takes it back.
history-bring-back-failed = It could not be brought back.
history-open-copy = Open as a project of its own
history-copy-name = { $name }, as it was { $day }
history-copy-failed = The project could not be made.

## Archives

history-open-archive = Open an archive…
history-archive-kind = History of Glaukopis
history-archive-unread = The archive could not be read.
history-archive-of = Archive: { $name }
history-archive-close = Close

## Settings

history-keep = Keep the history
history-room = The history takes { $size }.
history-turn-off-title = Stop keeping the history?
history-turn-off-message = What was kept is deleted. The project itself stays as it is.
history-turn-off-shared = What was kept is deleted, here and on the computers of those the project is shared with. The project itself stays as it is.
history-turn-off = Delete the history
history-finely = Older history
history-finely-about = Older changes are merged, so that they take less room and are read sooner; moments within them can then no longer be told apart. Named moments, and those reviews compare with, are kept.
history-hourly = Merge each hour into one after
history-weeks = { $count ->
    [one] week
   *[other] weeks
}
history-daily = Merge each day into one after
history-months = { $count ->
    [one] month
   *[other] months
}
history-before = What came before
history-before-choose = Choose a moment in the history to archive or delete what came before it.
history-before-about = The history before { $when } can be archived in a file, to be looked at later, or deleted.
history-archive = Archive…
history-delete = Delete
history-archive-title = Archive the history before { $when }?
history-delete-title = Delete the history before { $when }?
history-cut-message = What is left begins with the project as it was then.
history-cut-kept = { $count ->
    [one] A named or reviewed moment is before it, and can no longer be looked at here.
   *[other] { $count } named or reviewed moments are before it, and can no longer be looked at here.
}
history-cut-not-here = The history cannot be taken out before this moment.
history-cut-failed = The history could not be taken out.
history-archive-until = until { $when }
history-archived = The history before { $when } is archived.
history-deleted = The history before { $when } is deleted.
