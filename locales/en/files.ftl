# The files of the library, images among them: in folders of their own,
# each file belonging to no reference, to one or to several. The view stands
# in the library's place.

files-title = Files of the library
files-all = All files
files-file = File
files-unread = The files of the library could not be read
files-count = { $count ->
    [one] { $count } file
   *[other] { $count } files
}
files-shown-of = { $shown } of { $count ->
    [one] { $count } file
   *[other] { $count } files
}
files-selected-of = { $selected } selected of { $count }
files-selected = { $count ->
    [one] { $count } file selected
   *[other] { $count } files selected
}

## The kinds of files.

files-kind = Kind
files-kind-pdf = PDF
files-kind-picture = Image
files-kind-document = Document
files-kind-other = Other file

## Taking in.

files-add = Add files…
files-add-title = Add files to the library
files-add-folder = Add a folder…
files-add-folder-title = Add a folder to the library
files-more = More ways to add
files-taking-in = { $count ->
    [one] Taking in a file…
   *[other] Taking in { $count } files and folders…
}
files-taking-in-progress = Taking in { $done } of { $count }: { $name }
files-taken-in = { $count ->
    [one] One file taken in
   *[other] { $count } files taken in
}
files-same = { $count } already there
files-folders-made = { $count ->
    [one] one folder made
   *[other] { $count } folders made
}
files-problems = { $count ->
    [one] one could not be read
   *[other] { $count } could not be read
}
files-taken-none = Nothing was taken in
files-take-in-failed = The files could not be taken in

## Empty, searched and filtered.

files-empty = No files yet
files-empty-text = Add files or a folder, or drop them here. Every kind of file is kept, in the library’s own store, and a folder keeps the folders in it.
files-folder-empty = Nothing in this folder
files-folder-empty-text = Drop files here, or drag them here from another folder.
files-search = Search the files
files-search-in = Search in { $name }
files-search-clear = Clear search
files-nothing-found = Nothing found
files-nothing-found-text = No file has those words in its name, or in its reference.
files-nothing-passes = No file here passes the filters.
files-filters = Filter
files-filters-on = { $count ->
    [one] Filter: one is on
   *[other] Filter: { $count } are on
}
files-filter-kind = Kind
files-filter-all = All kinds
files-filter-pdf = PDFs
files-filter-picture = Images
files-filter-document = Documents
files-filter-other = Other files
files-filter-unassigned = Unassigned only
files-filter-search-all = Search in all folders
files-filter-clear = Clear the filters
files-sort = Sort
files-sort-name = By name
files-sort-reference = By reference
files-sort-added = By date added
files-sort-size = By size
files-sort-descending = Descending

## The list.

files-no-reference = No reference
files-missing = missing
files-reveal = Show in the file manager
files-move = Move…
files-move-to = Move to
files-move-failed = The file could not be moved
files-at-top = At the top, in no folder

## Folders.

files-folders = Folders
files-folders-hint = Folders keep the files in order: one place for each file. A folder that is added keeps the folders in it.
files-folder = Folder
files-folder-new = New folder
files-folder-new-in = New folder in { $name }
files-folder-new-inside = New folder inside
files-folder-name = Name of the folder
files-folder-name-failed = The folder could not be named
files-folder-move-to = Move to
files-folder-to-top = To the top
files-folder-move-failed = The folder could not be moved
files-folder-expand = Open
files-folder-collapse = Close
files-folder-delete = Delete folder
files-folder-delete-title = Delete the folder “{ $name }”?
files-folder-delete-empty = The folder is empty.
files-folder-delete-subfolders = { $count ->
    [one] The folder contains one subfolder. What should happen to it?
   *[other] The folder contains { $count } subfolders. What should happen to these?
}
files-folder-move-up = Move up one level
files-folder-delete-all-under = Delete all folders under this one
files-folder-delete-files = { $count ->
    [one] The folder contains one file. What should happen to it?
   *[other] The folder contains { $count } files. What should happen to these?
}
files-folder-delete-files-under = { $count ->
    [one] The folder and the folders under it contain one file. What should happen to it?
   *[other] The folder and the folders under it contain { $count } files. What should happen to these?
}
# Said after the question above, where files to be deleted belong to references.
files-folder-delete-files-assigned = { $count ->
    [one] One of them belongs to a reference, which would lose it.
   *[other] { $count } of them belong to references, which would lose them.
}
files-folder-files-to-parent = Place in parent folder
files-folder-files-delete = Delete
files-folder-delete-failed = The folder could not be deleted

## The pane of a file.

files-name = Name
files-references = References
files-unassigned = Unassigned: the file belongs to no reference.
files-assign = Assign to a reference…
files-assign-title = Assign “{ $name }” to a reference
files-assign-failed = The file could not be assigned
files-unassign = Take from “{ $name }”
files-unassign-failed = The file could not be taken from the reference
files-about = About the file
files-size = Size
files-pages = Pages
# $text is one of the three below.
files-pdf-pages = { $count ->
    [one] { $count } page · { $text }
   *[other] { $count } pages · { $text }
}
files-pdf-has-text = has text
files-pdf-no-text = no text
# Shown as the pages of a PDF that could not be looked at; the reason is what the reading said.
files-pdf-unread = could not be read: { $reason }
files-pdf-some-text = { $count ->
    [one] one page without text
   *[other] { $count } pages without text
}
files-added = Added
files-origin = Came from
files-searchable = Make searchable…
files-read-into = Import the text as a map…
files-read-text = Read the text…
files-bring-in = Bring in as elements…
files-rename-failed = The file could not be renamed

## Removing.

files-remove = Remove
files-remove-title = Remove “{ $name }” from the library?
files-remove-message = The file is deleted from the library’s store.
files-remove-message-assigned = { $count ->
    [one] The file belongs to { $names }, which loses it. It is deleted from the library’s store.
   *[other] The file belongs to { $count } references, { $names }, which lose it. It is deleted from the library’s store.
}
files-remove-many-title = Remove { $count } files from the library?
files-remove-many-message = The files are deleted from the library’s store.
files-remove-many-assigned = { $count ->
    [one] One of them belongs to a reference, which loses it. They are deleted from the library’s store.
   *[other] { $count } of them belong to references, which lose them. They are deleted from the library’s store.
}
files-remove-failed = The file could not be removed
# Said in the question where removing the files leaves folders empty; folders empty before are not counted.
files-remove-folders-left = { $count ->
    [one] One folder is left empty by it.
   *[other] { $count } folders are left empty by it.
}
files-remove-with-folders = Remove, with the empty folders
files-remove-keep-folders = Remove, keep the folders
files-removing = Removing { $count } files…
files-removed = { $count ->
    [0] No file removed
    [one] One file removed
   *[other] { $count } files removed
}
files-removed-folders = { $count ->
    [one] one empty folder with them
   *[other] { $count } empty folders with them
}
# When references are deleted: their files go too, unless another reference has them.
files-remove-with-files = Delete with the files

## Choosing a reference.

files-choose-reference = Choose a reference
files-choose-search = Search by author, title or year
files-choose-references = References
files-choose-none = No reference has those words.
files-choose-empty = The library has no references yet.
files-choose-more = … and { $count } more: search to find them
files-choose-files = Files of the library
files-choose-files-search = Search by name, or by the work a file belongs to
files-choose-files-none = No file answers to that.
files-choose-add = { $count ->
    [0] Add files
    [one] Add one file
   *[other] Add { $count } files
}
files-added-to = { $count ->
    [one] One file added to “{ $title }”
   *[other] { $count } files added to “{ $title }”
}
files-choose-new = New reference…
files-choose = Choose

## Nothing selected.

files-none-selected = No file selected
files-none-selected-text = Select a file to see what is known of it and what can be done with it.
# $name is the folder in view, or “All files”.
files-tally = { $name }: { $count ->
    [one] one file
   *[other] { $count } files
}, { $unassigned } without a reference

## The going-through: files given to their references.

files-go-through-head = Go through the files, to give them to their references…
files-go-through-chosen = { $count ->
    [one] Go through it…
   *[other] Go through these { $count }…
}
files-go-through-nothing = Every file here belongs to a reference
files-folder-go-through = Go through the unassigned files…
# The bar at the head of the files, while files of the folder in view belong to no reference.
files-unassigned-here = { $count ->
    [one] One file here belongs to no reference.
   *[other] { $count } files here belong to no reference.
}
files-unassigned-go = Go through them…
files-unassigned-hide = Hide this
files-going-title = Give the files to their references
files-going-subtitle = { $count ->
    [one] One file
   *[other] { $count } files
}
files-going-finding = { $count ->
    [one] Finding out what the file is…
   *[other] Finding out what the { $count } files are…
}
files-going-progress = { $done } of { $count }: { $name }
files-going-finding-hint = Each file is read for an identifier and a title, its name is read, and its first page is compared with the library. What is found out is kept while the application is open.
files-going-stop = Stop
files-going-failed = What the files are could not be found out
files-going-all-certain = { $count ->
    [one] The one found for certain:
   *[other] All { $count } found for certain:
}
files-going-all-probable = { $count ->
    [one] The one found as probable:
   *[other] All { $count } found as probable:
}
files-going-all-new = { $count ->
    [one] The one new, from the services:
   *[other] All { $count } new, from the services:
}
files-going-all-nothing = { $count ->
    [one] The one with nothing found:
   *[other] The { $count } with nothing found:
}
files-going-this-new = New reference
files-going-show-all = Show all { $count }
files-going-what = What { $name } becomes
files-going-this = This one
files-going-other = Another…
files-going-new = New reference…
files-going-later = Later
files-going-certain = certain
files-going-probable = probable
files-going-which = Which work
# $origin is where the description comes from: a service, or the file.
files-going-lookup = A new reference · from { $origin }
files-going-nothing = Nothing found
files-going-chosen = Chosen
files-going-made-here = Made here
files-going-none = None of the files could be gone through.
# The files the going-through did not reach, as when it was stopped: they keep no reference, and the bar offers them again.
files-going-not-reached = { $count ->
    [one] One file was not looked at. It stays as it is, for another time.
   *[other] { $count } files were not looked at. They stay as they are, for another time.
}
files-going-counts = { $assign } to assign, { $later } later
files-going-done = { $count ->
    [0] Nothing to give
    [one] Give one file to its reference
   *[other] Give { $count } files to their references
}
files-going-applying = Giving the files to their references…
files-going-source = The files of the library
files-going-assigned = { $count ->
    [0] No file assigned
    [one] One file assigned
   *[other] { $count } files assigned
}
files-going-made = { $count ->
    [one] one new reference
   *[other] { $count } new references
}
files-going-later-count = { $count } left for later
files-going-undo = Undo
files-going-undone = { $count ->
    [0] No file taken back
    [one] One file taken back
   *[other] { $count } files taken back
}
files-going-undone-made = { $count ->
    [one] one new reference removed
   *[other] { $count } new references removed
}
# In the menu of the head of the files, while the last going-through can be undone.
files-undo-last = { $count ->
    [one] Undo: one file given to its reference
   *[other] Undo: { $count } files given to their references
}

## Exporting.

files-export-folder-title = Choose the folder to export into
files-export-title = { $count ->
    [one] Export one file
   *[other] Export { $count } files
}
files-export-all-what = Every file is written into the folder you choose next, under the name of its reference, Author Year - Title, or its own where it has none; the folders of the library become folders in it.
files-export-folder-what = The files of the folder are written into the one you choose next, under the names of their references, or their own where they have none; the folders under it become folders in it.
files-export-files-what = { $count ->
    [one] The file is written into the folder you choose next, under the name of its reference, or its own where it has none.
   *[other] The files are written into the folder you choose next, under the names of their references, or their own where they have none.
}
files-export-bib = With a references.bib
files-export-bib-hint = The works the files belong to, each naming its files where they are written, so that Zotero or JabRef reads the folder whole.
files-export-go = Choose the folder…
files-exporting = { $count ->
    [one] Exporting a file…
   *[other] Exporting { $count } files…
}
files-exporting-progress = Exporting { $done } of { $count }: { $name }
files-exported = { $count ->
    [0] No file exported
    [one] One file exported
   *[other] { $count } files exported
}
files-exported-folders = { $count ->
    [one] one folder
   *[other] { $count } folders
}
files-exported-bib = with a references.bib
files-exported-stopped = stopped with { $count } left
files-exported-show = Show
files-export-failed = The files could not be exported
files-reveal-failed = The folder could not be shown
files-export = Export…
files-export-chosen = Export these { $count }…
files-export-all = Export all files…

## A file shown in a side of the window (2026-10-26).

files-show = Add to the project's tabs
files-open-elsewhere = Open in another program

# One place for files: images are files of the library (ADR 0070).
files-add-images = Add images…
# After images were taken in to be figures; $name is the first of them.
files-images-taken-in = { $count ->
    [one] “{ $name }” is in the library
   *[other] { $count } images are in the library
}

# One place for files, the view (ADR 0070).
files-view = View
files-as-list = List
files-as-grid = Thumbnails
files-size-small = Small
files-size-medium = Medium
files-size-large = Large
files-include-subfolders = Include subfolders
files-sort-kind = By kind
# Where a file is used, where it belongs to no reference: as a figure.
files-column-used = Used in
files-used-figure = A figure in { $project }
files-used-figures = A figure in { $count } projects
files-used-nowhere = Not used yet
files-pixels-label = Pixels
files-pixels = { $width } × { $height }
files-alt = What it shows, in words
files-preview-none = No preview for this kind of file
# Before the name of the file a copy was made from, to be a figure, by editing or to be smaller; the name is a link.
files-made-from = Made from
# Said when a file that is a figure in projects is to be removed.
files-remove-used = { $count ->
    [one] It is a figure in a project, which will show nothing in its place.
   *[other] It is a figure in { $count } projects, which will show nothing in its place.
}

# A simple image editor (docs/plans/a-simple-image-editor.md): the copies made from a file, as links.
files-copies = Copies made from it

# The tabs opened, files by their references, a file read in the library (docs/plans/the-tabs-opened-files-by-their-references-and-a-file-read-in-the-library.md).
files-read = Read
files-column-people = People
files-column-year = Year
files-column-title = Title
files-column-publisher = Publisher
files-sort-year = By year
files-sort-title = By title
files-sort-publisher = By publisher
# The translators after the authors or editors: "Lord; tr. Smith".
files-translated = tr. { $names }
