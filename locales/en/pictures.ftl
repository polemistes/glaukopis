# The store of pictures: all the pictures of the application, and one of them.

pictures-title = Pictures
pictures-all = All pictures
pictures-picture = Picture
pictures-search-placeholder = Search the pictures
pictures-clear-search = Clear the search
pictures-count = { $count ->
    [one] { $count } picture
   *[other] { $count } pictures
}
# How many pictures a search finds, of all there are.
pictures-shown = { $shown } of { $count ->
    [one] { $count } picture
   *[other] { $count } pictures
}
pictures-add = Add pictures…
pictures-empty = The store is empty
pictures-empty-text = Pictures you add here can be used in all your projects, and a picture put into a text is kept here. Add some, or drop them on this window.
pictures-nothing-found = Nothing found
pictures-nothing-found-text = No picture holds all of these words.
# What a picture that has no name is called.
pictures-unnamed = A picture
pictures-with-notes = With notes

## Taking pictures in, and removing them

# The title of the dialog that chooses files, and what it calls the files it offers.
pictures-add-title = Add pictures
pictures-files = Pictures
pictures-taken-in = { $count ->
    [one] “{ $name }” is in the store
   *[other] { $count } pictures are in the store
}
pictures-remove-title = Remove “{ $name }” from the store?
pictures-remove-unused = No project uses the picture. What is said of it here, and your notes on it, are removed with it.
pictures-remove-used = { $count ->
    [one] { $count } project uses the picture. Its figures will be left without the picture. What is said of it here, and your notes on it, are removed with it.
   *[other] { $count } projects use the picture. Their figures will be left without the picture. What is said of it here, and your notes on it, are removed with it.
}
pictures-no-backend = There is no backend.

## One picture

pictures-name = Name
pictures-name-placeholder = What the picture is called
pictures-caption = Caption
pictures-caption-placeholder = What is said of the picture
pictures-caption-hint = Figures made with the picture begin with these words. What is said of a figure can be changed there without changing this.
pictures-italic = Italic
pictures-small-caps = Small capitals
# What the picture shows, in words, for those who do not see it.
pictures-alt = Shows
pictures-alt-placeholder = In words, for those who cannot see it
pictures-absent = The picture is not on this computer. It is used in the project, and is shown when it has come from the one who put it there.
pictures-notes = Notes
pictures-note-project = In this project
pictures-note-project-placeholder = What you make of it, for this work
pictures-note-project-hint = What is written here is with everyone who has the project.
pictures-note-for-all = Keep it for all projects
pictures-note-write-for-all = Write for all projects
pictures-note-all = In all projects
pictures-note-all-placeholder = What you make of it, wherever you use it
pictures-note-all-hint = Kept with the picture in the store, on this computer.
pictures-note-placeholder = What you make of it. For yourself: it is part of no document.
pictures-note-label = Your notes on this picture
pictures-file = The file
pictures-kind = Kind
pictures-kind-svg = SVG, a drawing
pictures-dimensions-label = Wide and high
pictures-dimensions = { $width } × { $height } points
pictures-size = Size
# When the picture was taken into the store.
pictures-added = Added
pictures-used-in = Used in
pictures-this-project = This project
# A map that has no name.
pictures-untitled = Untitled
pictures-unused = No project uses the picture.
pictures-remove = Remove from the store
