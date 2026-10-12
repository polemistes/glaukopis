# A project: its view, the bar over the map, what is done to elements, and
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
project-side = References, pictures, history and changes
project-side-tabs = What the panel at the side shows
project-side-map = Map
project-preview = Preview and export
project-share = Share
project-shared = Shared
project-shared-offline = Shared · the server cannot be reached
project-shared-too-large = Shared · the server does not take the latest changes
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

## The bar over the map: where one is, and what is done with the element in view

# The name of an element that has none.
project-untitled = Untitled
project-where = Where you are
# The small button before the name of the element in view: its parent's name.
project-up = Up
project-up-hint = Up to “{ $name }” · Alt+Up
project-siblings-hint = The elements beside this one: choose one to show it
project-trees-hint = The elements under the project: choose one to show it
project-shown-beside = beside this one
# The owl before the name of the project itself, in the first pane: up to all the projects.
project-up-home-hint = Up to all the projects · Alt+Up
# The sign of a project, read aloud, where it is shared.
project-badge-shared = { $name }, shared by you
project-badge-joined = { $name }, joined
# Two projects side by side.
project-beside-failed = The project could not be opened beside this one
project-beside-no-comments = The comments are those of the project you opened: open the other on its own to comment in it
# Said over the other pane while elements of one project are dragged over it.
project-copy-to-project = Copy to “{ $name }”
project-move-to-project = Move to “{ $name }”
project-element-name = Name of the element
project-this-element-actions = This element
project-new-element-under = New element under it
project-document-into = A document into it…
project-drop-on-map = Drop on a map to move there · hold Ctrl to copy
project-open-beside = Open beside
project-open-beside-hint = Two maps side by side, to move elements between them
project-side-by-side-short = Side by side
project-preview-short = Preview
project-found = Loose citations…
# The count is of those found in the element in view, and under it.
project-found-hint = { $count } to go through, and make citations of
project-found-none = And text that looks like citations
project-copied-to = Copied to “{ $name }”
project-moved-to = Moved to “{ $name }”
project-other-projects = Other projects
project-send-failed = Could not write in “{ $project }”. Nothing was changed here.
project-send-no-element = The element is no longer in that project.

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
# An element that stands for another element: in the document, that element is in its place.
project-stands-for = Stands for “{ $name }”
project-stand-for = Stand for another element
project-stand-for-heading = In the document, this element takes its place
project-stand-for-none = None
# Copying or moving elements to the project itself, to one of its trees, or to another project.
project-copy-to = Copy to
project-cut = Cut
project-cut-not-removed = What was cut was pasted, but could not be taken away from the project it came from
project-copy = Copy
# Pasting what was copied under the element the menu is of.
project-paste-under = Paste under it
project-move-to = Move to
# Opening a dialog with the tree of the project, to choose where the elements go: first in Copy to and Move to.
project-choose-where = Choose where…
# Opening the same dialog, to choose the element this one stands for.
project-choose-element = Choose an element…
# The title of the dialog that chooses where elements are copied to: the name of the one copied, or how many.
project-pick-copy-title = { $count ->
    [one] Copy “{ $name }” to
   *[other] Copy { $count } elements to
}
project-pick-move-title = { $count ->
    [one] Move “{ $name }” to
   *[other] Move { $count } elements to
}
project-pick-stand-title = What “{ $name }” stands for
# The buttons of the dialog, saying what will be done with the element chosen.
project-pick-copy = Copy here
project-pick-move = Move here
project-pick-stand = Stand for this
project-pick-find = Find an element by name
project-pick-none = No element has that name
# Why an element cannot be chosen, when it is hovered.
project-pick-itself = An element cannot go into itself, or into what is under it
project-pick-self = An element cannot stand for itself
project-pick-loop = The document would hold itself
project-tidy-branch = Tidy this branch
project-place-automatically = Place automatically
project-delete-keeping = Delete, keeping what is under it
project-itself-stays = The project itself stays
project-itself-stays-detail = Delete the project from the home page.
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
project-stands-for-map = Stands for “{ $name }”
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
project-cited-in-heading = Cited in
project-not-cited = Not cited in this project.
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

## A copy and its original.
copy-title = The copy and its original
copy-from = Copied from “{ $name }”
copy-original-changed = The original has changed since it was copied, or since that was last seen.
copy-original-same = The original is as it was when it was copied.
copy-original-unknown = Whether the original has changed since it was copied is not known: the copy was made before that was kept.
copy-original-gone = The original is no longer there.
copy-how-shown = Below, struck through, is what only the original has, and marked, what only this copy has.
copy-alike = Their names and texts are alike. They may differ in what is not words: citations, pictures, marks.
copy-only-original = Only in the original
copy-only-copy = Only in this copy
copy-go = Go to the original
copy-seen = Keep this copy as it is
copy-take = Take the original’s name and text
copy-changed-mark = The original has changed since this was copied
copy-compare = Compare with the original…
copy-copied-from = Copied from “{ $name }”
copy-copied-from-changed = Copied from “{ $name }”, which has changed since

## How far the writing of an element has come, as its writer says.
status = Status
status-idea = Idea
status-draft = Draft
status-done = Done
status-none = No status
# Of an element, where its status is shown: "Draft · 340 words".
status-of = { $status } · { $count ->
    [one] { $count } word
   *[other] { $count } words
}
status-count-idea = { $count ->
    [one] { $count } idea
   *[other] { $count } ideas
}
status-count-draft = { $count ->
    [one] { $count } draft
   *[other] { $count } drafts
}
status-count-done = { $count } done
# The words of the drafts and of what is done, in a map.
status-words-written = { $count ->
    [one] { $count } word written
   *[other] { $count } words written
}
status-progress = How far the map has come
