# The projects: the list of them, and what is done with them.

home-title = Projects
home-join = Join a shared project
home-from-document = A project from a document…
home-new = New project

## The two forms of the page: the last used projects as cards, all of them as a list

home-shown = What is shown
home-recent = Last used
home-all = All projects
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

## A map of the projects

home-map-menu = A map of the projects…
home-map-title = A map of the projects
home-map-about = A new project, with one map: the folders as elements, and under each folder the projects in it.
home-map-name-default = Projects
home-map-what = What the map holds
home-map-names = Only the names
home-map-names-hint = An element for each project, with its description as its text.
home-map-everything = With everything in them
home-map-everything-hint = Under each project its maps, and under each map all its elements, with their names and texts.
home-map-note = The citations keep their references. A cross-reference to a figure or a part points at nothing in the new project, and comments stay behind.
home-map-reading = Reading “{ $name }”…
home-map-working = Making the map…
home-map-make = Make the map
home-map-failed = The map of the projects could not be made

## When there are none yet

home-welcome = Welcome to Glaukopis
home-welcome-text = A project holds the work on one book or article: the maps of your ideas, the texts you write into them, and the references they rest on.
home-begin = Begin a project

## A project in the list

# Under the names of the first four maps.
home-more-maps = and { $count } more
home-maps = { $count ->
    [one] { $count } map
   *[other] { $count } maps
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
