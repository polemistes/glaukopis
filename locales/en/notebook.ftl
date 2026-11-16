# The notebook: what is collected outside all projects, as notes (record 0101).

## The place in the row, and the page

notebook-title = Notebook
notebook-notes = Notes
notebook-note = Note
notebook-search = Search the notes
notebook-search-clear = Clear the search
notebook-new-note = New note
notebook-add-files = Add files…
notebook-add-files-title = Add files to the notebook
notebook-empty = The notebook is empty
    .text = Collect here whatever turns up, outside all projects: words, images and files, each a note that keeps where it came from.
notebook-unreadable = The notebook could not be read
notebook-nothing-found = No notes found
notebook-empty-note = Empty note
notebook-holds-picture = An image
notebook-holds-file = A file
notebook-holds-passage = Words taken in
notebook-resize-list = Width of the list of notes
notebook-choose = Choose a note, or make a new one
notebook-selected = { $count } notes selected
notebook-deleted = { $count ->
    [one] Note deleted
   *[other] { $count } notes deleted
}
notebook-redo = Redo
notebook-name = Name
notebook-write = Write, or paste what you have found
# What became of a note: "Used in ‹project› · quotation".
notebook-went = What became of it
notebook-used-in = Used in
notebook-went-text = text
notebook-went-quotation = quotation
notebook-went-figure = image
notebook-went-reference = reference
notebook-went-file = file
# How a box is shown: as its surface, or as a list.
notebook-shown-as = Shown as
notebook-surface = Surface
notebook-list = List
notebook-close-note = Close the note
notebook-resize-column = Width of the boxes
notebook-resize-note = Width of the note
notebook-box-empty = No notes in this box
# What the plugin for Firefox handed over has arrived.
notebook-arrived = Added to the notebook
notebook-arrived-from = Added to the notebook: { $title }
notebook-arrived-many = { $count ->
    [one] One thing added to the notebook
   *[other] { $count } things added to the notebook
}

## A note and its text

# The first box of the notebook, named so in the copy of the notebook written as Org until it is given a name.
notebook-org-first-box = Unsorted

# A file a note holds, as it stands in the note: opened by two presses.
notebook-file-open-named = Open { $name }
notebook-file-not-here = The file is not on this computer

# Files that could not be taken in as notes, said in one message.
notebook-files-not-taken = Some files could not be taken in

# Words selected in a file read in Glaukopis, or a part of a page marked, sent to the notebook as a new note.
notebook-from-file-added = Added to the notebook
notebook-from-file-not-added = Could not be added to the notebook

## Sources

notebook-source-none = No source
# Where a photograph was taken, in degrees.
notebook-source-north = { $degrees }° N
notebook-source-south = { $degrees }° S
notebook-source-east = { $degrees }° E
notebook-source-west = { $degrees }° W

notebook-sources = Sources
notebook-source = Source
notebook-source-sort = What it is
notebook-source-web = Web page
notebook-source-reference = Reference
notebook-source-other = Other
notebook-source-url = Address
notebook-source-page-title = Title
notebook-source-choose-reference = Choose a reference…
notebook-source-place = Place
notebook-source-words = Where it came from
notebook-source-file-name = Name
notebook-source-file-changed = Last changed
notebook-source-file-taken = Taken
notebook-source-file-where = Where
notebook-source-make-reference = Make a reference
notebook-source-in-library = In the library:
notebook-source-passages = Taken from it
notebook-source-changed = Changed since it was taken. It read:
notebook-source-bring-back = Bring back
notebook-source-own-words = My own words

## Boxes and tags

notebook-all-notes = All notes
notebook-boxes = Boxes
# The first box, where everything lands, until it is given a name.
notebook-box-unsorted = Unsorted
notebook-box-new = New box
notebook-box-name = Name of the box
notebook-box-delete-title = Delete { $name }?
notebook-box-delete-message = { $count ->
    [one] The note in it goes to { $first }.
   *[other] The { $count } notes in it go to { $first }.
}
notebook-move-to = Move to
notebook-tags = Tags
notebook-tag-name = Name of the tag
notebook-tag-remove = Remove from all notes
notebook-tag-remove-title = Remove { $tag } from all notes?
notebook-tag-remove-message = { $count ->
    [one] One note has it.
   *[other] { $count } notes have it.
}
notebook-tag-merge-title = Rename { $from } to { $to }?
notebook-tag-merge-message = { $from } and { $to } will be one tag.
notebook-tags-off = Show all, whatever their tags
# The field under the name of a note, where a tag is added.
notebook-tag-add = Add a tag
notebook-tag-take-away = Remove { $tag }
notebook-tags-offered = Tags
notebook-join = Join
notebook-joined = { $count } notes joined
notebook-divide = Divide

## The surface

notebook-surface-of-box = Surface of the box
notebook-surface-not-placed = Not yet placed
notebook-surface-empty-note = Empty note
notebook-surface-new-note-here = New note here
notebook-surface-show-all = Show all
notebook-surface-link-handle = Drag to another note to link them

## Finding, and starting texts

# The filters of the list, in a window at a button beside the field that finds.
notebook-filters = Filter
notebook-filters-on = { $count ->
    [one] Filter: { $count } on
   *[other] Filter: { $count } on
}
notebook-filter-holds = Holds
notebook-filter-picture = An image
notebook-filter-file = A file
notebook-filter-passage = Words taken in
notebook-filter-link = A link to another note
notebook-filter-collected = Collected
notebook-filter-from = From
notebook-filter-to = To
notebook-filter-came = From
notebook-filter-web = A web page
notebook-filter-reference = A reference
notebook-filter-file-source = A file
notebook-filter-other = Other
notebook-filter-no-source = No source
notebook-filter-unseen = Not looked at
notebook-filter-use = Used
notebook-filter-use-all = All
notebook-filter-used = Used in a project
notebook-filter-unused = Not used
notebook-filter-clear = Clear the filters
notebook-nothing-passes = No note in view passes the filters.
# A note taken in that has not been looked at: the dot before its name.
notebook-unseen = Not looked at
# Words read in the images of notes, kept for finding.
notebook-read-text = Read the text
notebook-read-again = Read again
notebook-text-read = Text read
notebook-reading = { $count ->
    [one] Reading { $name }…
   *[other] Reading { $name } ({ $done } of { $count })…
}
notebook-reading-stop = Stop
notebook-read-done = { $count ->
    [one] The text of the image is read
   *[other] The text of { $count } images is read
}
notebook-read-failed = The text of { $name } could not be read
# Starting texts: a new note that begins with lines given.
notebook-new-note-from = New note from a starting text
notebook-starts = Starting texts…
notebook-starts-title = Starting texts
notebook-start-new = New
notebook-start-unnamed = Unnamed
notebook-start-name = Name
notebook-start-lines = Lines
notebook-start-kind = Its lines are
notebook-start-up = Move up
notebook-start-down = Move down
notebook-start-none = No starting texts yet.
notebook-start-delete-title = Delete { $name }?
notebook-start-delete-message = The notes begun from it stay as they are.

## Notes from other programs

notebook-import = Import notes…
notebook-import-title = Import notes
notebook-import-folder = A folder…
notebook-import-file = A file…
notebook-import-programs = A folder from Obsidian, Joplin, Notion, Bear, Google Keep or OneNote, or of Markdown and text; a file from Evernote (.enex) or OneNote (.one), or one Markdown file.
notebook-import-choose-folder = Choose a folder of notes
notebook-import-choose-file = Choose a file of notes
notebook-import-filter = Notes
notebook-import-kind = { $kind ->
    [obsidian] Notes from Obsidian
    [joplin] Notes from Joplin
    [notion] Notes from Notion
    [bear] Notes from Bear
    [evernote] Notes from Evernote
    [keep] Notes from Google Keep
    [onenote] Notes from OneNote
   *[markdown] Markdown and text files
}
notebook-import-count = { $count ->
    [one] One note
   *[other] { $count } notes
}
notebook-import-files = { $count ->
    [0] no pictures or files
    [one] one picture or file
   *[other] { $count } pictures and files
}
notebook-import-none = No notes were found here.
notebook-import-to-know = To know
notebook-import-unread = This could not be read as notes.
notebook-import-do = Import
notebook-import-reading = Reading { $done } of { $count }: { $name }
notebook-import-stop = Stop
notebook-import-done = { $count ->
    [one] One note imported into { $box }
   *[other] { $count } notes imported into { $box }
}
notebook-import-nothing = Nothing was found to import
notebook-import-problems = { $count ->
    [one] One thing could not be read: { $first }
   *[other] { $count } things could not be read: { $first }
}

## The list in the document pane, and what goes into a text

notebook-between = Between the sides and the notes
notebook-pane-find = Find a note
notebook-pane-open = Open the notebook
notebook-pane-unread = The notebook could not be read
notebook-pane-empty = The notebook is empty
notebook-pane-nothing-found = No note holds these words
notebook-pane-drag = Drag a note, or a part of one, into the text.
notebook-pane-show-all = Show all
notebook-pane-show-less = Show less
notebook-pane-used = Used in this project
notebook-pane-put-into-text = Put into the text
notebook-pane-open-note = Open in the notebook
notebook-pane-a-picture = An image
# A source made a reference of the library, as what was taken from it went into a text.
notebook-pane-reference-made = Added to the library: { $title }
notebook-pane-reference-not-made = { $source } could not be added to the library
notebook-pane-picture-not-moved = { $name } could not be put among the library's files
notebook-pane-file-not-into-text = A file does not go into a text
notebook-pane-not-into-text = The note could not be put into the text
