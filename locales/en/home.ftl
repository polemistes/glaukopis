# The projects: the list of them, and what is done with them.

home-title = Projects
home-join = Join a shared project
home-from-document = A project from a document…
home-new = New project

## The three forms of the page: the last used projects as cards, all of them as a list, all of them as a map around the owl

home-shown = What is shown
home-recent = Last used
home-all = All projects
home-owl = Map
# Under the cards, when there are more projects than they show.
home-show-all = Show all { $count } projects
# The button that opens the menu of the page.
home-page-menu = More
home-search = Find a project
home-search-none = No project has that name.
home-list-none = There are no projects.

## Folders of projects

home-new-folder = New folder
home-folder-new-inside = New folder inside…
home-folder-rename-title = Rename folder
home-folder-name-placeholder = What the folder holds
home-folder-name-missing = Give the folder a name.
home-folder-projects = { $count ->
    [one] { $count } project
   *[other] { $count } projects
}
home-menu-move = Move to folder
home-menu-out = Out of folders
home-folder-delete-title = Delete the folder “{ $name }”?
home-folder-delete-message = The folders and projects in it are kept: they move up to where the folder was.
home-folder-delete-confirm = Delete folder
home-folder-failed = That could not be done with the folder
home-moved-to = “{ $name }” was moved to { $folder }
home-moved-out = “{ $name }” is in no folder now
home-move-failed = The project could not be moved

## The pane of projects, at the left of a project

home-pane = The list of projects
home-pane-toggle = The list of projects
home-pane-close = Close the list of projects
home-pane-between = Between the list of projects and the project
# On the chevron before an element of the open project, in the pane: what is under it is shown, or hidden.
home-tree-unfold = Show what is under it
home-tree-fold = Hide what is under it
# Why the project that is open cannot be renamed or deleted from its menu.
home-open-now = It is open now
# On the menu of a project, or of an element of one, in the pane: shows it in a second pane, beside the project that is open.
home-open-beside = Open beside
# Under a project that is not open, in the pane, when what it holds could not be read.
home-tree-unreadable = It could not be read
# Under a project that is not open, in the pane, when it holds no elements yet.
home-tree-empty = Nothing in it yet

## The owl map: the projects drawn around the owl, the folders as plain labels

# The button that shows all of the map at once.
home-owl-fit = Show all of it
# On a folder of the map: its projects are hidden, or shown.
home-owl-fold = Hide the projects in it
home-owl-unfold = Show the projects in it

## A map of the projects

home-map-menu = A map of the projects…
home-map-title = A map of the projects
home-map-about = A new project: the folders as elements, and under each folder the projects in it.
home-map-name-default = Projects
home-map-what = What the map holds
home-map-names = Only the names
home-map-names-hint = An element for each project, with its description as its text.
home-map-everything = With everything in them
home-map-everything-hint = Under each project all its elements, with their names and texts.
home-map-note = The citations keep their references. A cross-reference to a figure or a part points at nothing in the new project, and comments stay behind.
home-map-reading = Reading “{ $name }”…
home-map-working = Making the map…
home-map-make = Make the map
home-map-failed = The map of the projects could not be made

## When there are none yet

home-welcome = Welcome to Glaukopis
home-welcome-text = A project holds the work on one book or article: the map of your ideas, the texts you write into it, and the references they rest on.
home-begin = Begin a project

## A project in the list

# Under the names of the first four maps.
home-more-maps = and { $count } more
home-maps = { $count ->
    [one] { $count } tree
   *[other] { $count } trees
}
home-elements = { $count ->
    [one] { $count } element
   *[other] { $count } elements
}
home-words = { $count ->
    [one] { $count } word
   *[other] { $count } words
}
home-references = { $count ->
    [one] { $count } reference
   *[other] { $count } references
}
home-not-begun = Not begun
home-shared = Shared
# "ago" is how long ago it was: "3 hours ago", "yesterday", "12 March".
home-changed = Changed { $ago }
# The button that opens the menu of a project.
home-more-for = More for { $name }
home-deleted-projects = { $count ->
    [one] { $count } deleted project
   *[other] { $count } deleted projects
}

## The menu of a project

home-menu-rename = Rename…
home-menu-duplicate = Duplicate…
home-menu-history = Earlier versions…
home-menu-save-file = Save as a file…
home-menu-save-org = Save as Org…

## Naming a project

home-rename-title = Rename project
home-duplicate-title = Duplicate project
home-name = Name
home-name-placeholder = The working title of the book or article
home-name-missing = Give the project a name.
home-create = Create
home-duplicate = Duplicate
# The name a copy of a project is given, until it is given another.
home-copy-name = { $name }, copy
home-failed = That did not work.

## Deleting a project

home-delete-title = Delete “{ $name }”?
home-delete-message = The project is moved to the trash of Glaukopis, from which it can be brought back. Your references are not touched.
home-delete-owner = The project is moved to the trash of Glaukopis, from which it can be brought back. It stays on the server and with those you share it with; to take it off the server, open it and stop sharing it first.
home-delete-member = The project is moved to the trash of Glaukopis, from which it can be brought back. The others keep theirs.
home-delete-confirm = Delete project
home-deleted = “{ $name }” was moved to the trash
home-delete-failed = The project could not be deleted

## The trash

home-trash-title = Deleted projects
home-trash-none = There are none.
home-deleted-ago = Deleted { $ago }
home-restore = Bring back
home-restored = “{ $name }” is back among the projects
home-restore-failed = The project could not be brought back
home-purge = Remove for good
home-purge-title = Remove “{ $name }” for good?
home-purge-message = What the project holds cannot be brought back after this. Your references are not touched.
home-purge-failed = The project could not be removed

## Earlier versions of a project

home-history-title = Earlier versions
home-history-about = Of “{ $name }”. A version is opened as a project of its own; this one stays as it is.
home-history-none = None has been kept yet. A version is kept every now and then while you work: closely for what is recent, more sparsely for what is old.
home-history-open = Open a copy
# The name of the project an earlier version is opened as; "day" is the day it was kept.
home-history-copy-name = { $name }, as of { $day }
home-history-unread = The earlier versions could not be read
home-history-open-failed = That version could not be opened

## A project as one file

home-file-open = Open a project file…
home-file-open-title = Open a project file
# The kind of file, in the dialog that asks for one.
home-file-filter = Glaukopis project
home-file-save-title = Save the project as a file
home-file-saved = “{ $name }” was saved as a file
home-file-save-failed = The project could not be saved as a file
home-file-open-failed = The project file could not be opened
home-file-opened = “{ $name }” was made of the file
home-file-opened-added = “{ $name }” was made of the file. { $count ->
    [one] One work was
   *[other] { $count } works were
} added to your library.
home-file-problems = { $count ->
    [one] One work could not be brought into your library. It is cited as it was in the file.
   *[other] { $count } works could not be brought into your library. They are cited as they were in the file.
}
# The dialog that asks what is to be done with the works a project file cites.
home-file-references-title = The works the project cites
home-file-references-about = Before “{ $name }” is made: these works are in your library, but not as they are in the file.
home-file-in-file = In the file
home-file-same-id = In your library as the same entry, written otherwise
home-file-merged = In your library, merged into this one
home-file-what-to-do = What is to be done with it
home-file-keep-library = Keep your library’s
home-file-take-file = Take the file’s into your library
home-file-keep-both = Keep both
home-file-cite-library = Cite your library’s
home-file-add-another = Add the file’s as another work
home-file-same = { $count ->
    [one] One work is in your library as it is in the file.
   *[other] { $count } works are in your library as they are in the file.
}
home-file-added = { $count ->
    [one] One work is not in your library, and is added to it.
   *[other] { $count } works are not in your library, and are added to it.
}
home-file-make = Make the project

## A project as Org: its readable copy in a folder, and a new project made of an Org file

home-org-open = Open an Org file…
home-org-open-title = Open an Org file
# The kind of file, in the dialog that asks for one.
home-org-filter = Org file
home-org-open-failed = The Org file could not be opened
home-org-save-title = Choose the folder to save the project as Org in
home-org-saved = “{ $name }” was saved as Org
home-org-save-failed = The project could not be saved as Org
