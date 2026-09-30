# A project: its view, the tabs of its maps, what is done to elements, and
# the panels at the side with the references and the pictures.

project-list-unreadable = The projects could not be read

## The view of a project

project-open-failed = The project could not be opened
# Shown under the words above when nothing more is known of why.
project-open-failed-detail = The project could not be opened.
project-back = Back to the projects
project-fetching = Fetching the project
project-fetching-offline = The server cannot be reached. The project is fetched when it can be.
project-fetching-on-the-way = It is on its way from the server.
project-all-projects = All projects
project-name = Name of the project
project-rename = Rename the project
project-not-saved = Not saved
project-redo = Redo
project-view = View of the map
project-view-this = View of this map
project-diagram = Diagram
project-text = Text
project-one-at-a-time = One at a time
project-side-by-side = Two side by side
project-close-side = Close this side
project-references = References
project-pictures = Pictures
project-preview = Preview and export
project-share = Share
project-shared = Shared
project-shared-offline = Shared · the server cannot be reached
project-between-maps = Between the two maps
project-between-preview = Between the map and the preview
project-between-pictures = Between the map and the pictures
project-between-references = Between the map and the references

## When the sharing ends from the other side

project-unshared = The project is no longer shared
project-unshared-this = This project is no longer shared
project-left-out = You are no longer among the collaborators
project-unshared-unfetched = It had not been fetched, so there is nothing of it on this computer.
project-unshared-kept = The one who shared it has taken it off the server. You keep the project as it is now, and can go on working on it on your own.
project-left-out-kept = You keep the project as it is now, and can go on working on it on your own. What the others write after this does not reach you.
project-understood = Understood

## Files dropped on the project

project-drop-picture = Drop a picture on the element it belongs to
project-cited-in = { $count ->
    [one] The reference is cited in “{ $name }”
   *[other] { $count } references are cited in “{ $name }”
}
# As above, where the element has no name.
project-cited-in-element = { $count ->
    [one] The reference is cited in “the element”
   *[other] { $count } references are cited in “the element”
}

## The tabs of the maps

# The name of a map, or of an element, that has none.
project-untitled = Untitled
# The name of a copy of a map.
project-map-copy = { $name }, copy
project-maps = Maps
project-map-name = Name of the map
project-new-map = New map
project-map-from-document = A map from a document…
project-drop-on-map = Drop on a map to move there · hold Ctrl to copy
project-duplicate = Duplicate
project-duplicate-hint = A copy to work on; this one stays as it is
project-open-beside = Open beside
project-open-beside-hint = Two maps side by side, to move elements between them
project-tab-hint = Ctrl+click or middle click: beside this one · double-click: rename
project-found = Citations that were found…
# The count is of those found in the map.
project-found-hint = { $count } to go through, and make citations of
project-found-none = And text that looks like citations
project-delete-map = Delete map
project-delete-map-title = Delete the map “{ $name }”?
project-delete-map-message = { $count ->
    [one] { $count } element and the text in it will go. This can be undone while the project is open.
   *[other] { $count } elements and the text in them will go. This can be undone while the project is open.
}
project-copied-to = Copied to “{ $name }”
project-moved-to = Moved to “{ $name }”

## What is done to elements, in the diagram and in the text

project-add-under = Add an element under it
project-add = Add an element
project-add-after = Add an element after it
project-write-text = Write its text
project-double-click = Double-click
project-associate = Associate with…
project-associate-hint = Then click the other element
project-heading = Print the name as a heading
project-heading-hint = Off: the name is a label for you; only the text is printed
project-leave-out = Leave out of the document
project-leave-out-hint = With everything under it
# An element that stands for another map: in the document, that map is in its place.
project-stands-for = Stands for “{ $name }”
project-stand-for = Stand for another map
project-stand-for-heading = In the document, this map takes its place
project-stand-for-none = None
project-copy-to-map = Copy to map
project-move-to-map = Move to map
project-map-from-branch = New map from this branch
project-map-from-branch-hint = A copy to work on; this one stays
project-detach = Detach from its parent
project-detach-hint = A loose element, to be placed later
project-tidy-branch = Tidy this branch
project-place-automatically = Place automatically
project-delete-keeping = Delete, keeping what is under it
project-centre-stays = The centre of a map stays
project-centre-stays-detail = Delete the map itself from its tab.
# One element was deleted, with the elements that were under it.
project-deleted = { $under ->
    [0] “{ $name }” was deleted
    [one] “{ $name }” was deleted, with { $under } element under it
   *[other] “{ $name }” was deleted, with { $under } elements under it
}
project-deleted-many = { $count ->
    [one] { $count } element deleted
   *[other] { $count } elements deleted
}

project-delete-busy-title = Someone is writing here
# $names: those who are at what would be deleted, as a list.
project-delete-busy-message = { $names } { $count ->
    [one] is
   *[other] are
} at work in what would be deleted. What is being written there now would be lost with it, and cannot be brought back.
project-delete-busy-confirm = Delete all the same

## An element, open for writing, and as it is shown when the pointer rests on it

project-element = Element
project-name-placeholder = Name
project-write-here = Write here. Type @ to cite.
project-words = { $count ->
    [one] { $count } word
   *[other] { $count } words
}
project-read-on = Double-click to read on
project-stands-for-map = Stands for the map “{ $name }”
project-name-not-printed = The name is not printed
project-left-out-of-document = Left out of the document

## The panels at the side: the references and the pictures

project-this-map = This map
project-project = Project
project-library = Library
project-nothing-found = Nothing found
project-edit-reference = Edit the reference…
project-new-reference = New reference
project-import-file = Import a file
project-which-references = Which references
project-search-references = Search references
project-library-empty = Your library is empty
project-library-empty-hint = Add a reference, or import those you have.
project-no-references = No references yet
project-no-references-hint = What you cite while writing is listed here. To cite, choose Cite over the text, or type @.
project-references-drag = Drag a reference into a text to cite it there, or onto an element to cite it at the end of its text.
# The count is of the references the project cites that the library lacks.
project-references-foreign = { $count ->
    [one] { $count } in this project is not in your library.
   *[other] { $count } in this project are not in your library.
}
# The store of pictures.
project-store = Store
project-open-picture = Open…
project-put-into-text = Put it into the text
project-add-pictures = Add pictures from files
project-which-pictures = Which pictures
project-search-pictures = Search pictures
project-a-picture = A picture
project-with-notes = With notes
project-not-on-computer = Not on this computer
project-nothing-said = Nothing is said of it yet
project-store-empty = The store is empty
project-store-empty-hint = Add pictures from files, or drop them on a text.
project-no-pictures = No pictures yet
project-no-pictures-map = The pictures of the figures of this map are listed here. Those of the store are under Store.
project-no-pictures-project = The pictures of the figures of the project are listed here. Those of the store are under Store.
project-pictures-drag = Drag a picture into a text to make a figure of it there, or onto an element to put it at the end of its text.
# The count is of the pictures that are used and are not in the store of this computer.
project-pictures-absent-map = { $count ->
    [one] { $count } in this map is not on this computer.
   *[other] { $count } in this map are not on this computer.
}
project-pictures-absent-project = { $count ->
    [one] { $count } in this project is not on this computer.
   *[other] { $count } in this project are not on this computer.
}

## Shared by the diagram and the text

# A count of elements that stands alone, as a label of what is dragged.
project-elements = { $count ->
    [one] { $count } element
   *[other] { $count } elements
}
# One of the others who work on a shared project is at an element.
project-other-here = { $name } is here
project-link-placeholder = How they are related
project-link-label = Label of the association
