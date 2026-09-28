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
