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
project-maps = Maps
project-map-name = Name of the map
project-new-map = New map
project-map-from-document = A map from a document…
project-drop-on-map = Drop on a map to move there · hold Ctrl to copy
project-duplicate = Duplicate
project-duplicate-hint = A copy to work on; this one stays as it is
project-open-beside = Open beside
project-open-beside-hint = Two maps side by side, to move elements between them
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
