# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } and { $second }
core-library-three-names = { $first }, { $second } and { $third }
core-library-et-al = { $first } et al.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ed.)
   *[other] { $names } (eds.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = line { $line }: { $message }
core-library-line-sentence = Line { $line }: { $message }.
core-library-key-changed = the key “{ $from }” was changed to “{ $to }”
core-library-no-entry = There is no entry here. An entry begins with @ and its type, as in @book{"{"}key, …{"}"}.
core-library-many-entries = There are { $count } entries here; one is expected.

## Changing a reference.

core-library-bad-key = “{ $key }” cannot be used as a citation key.
core-library-key-letters = A citation key may hold letters, digits and - _ : . only. Try “{ $key }”.
core-library-key-taken = The citation key “{ $key }” is already in use.
core-library-no-type = The reference has no publication type.
core-library-not-a-type = “{ $kind }” is not a publication type.
core-library-merge-itself = An entry cannot be merged with itself.

## What was not found, shown after "not found: ".

core-library-the-reference = the reference
core-library-the-stored-file = the stored file { $path }
core-library-the-file = the file { $path }
core-library-the-collection = the collection
core-library-the-collection-to-put-in = the collection to put it in
core-library-the-collection-to-move-to = the collection to move it to

## Collections.

core-library-collection-needs-name = A collection needs a name.
core-library-collection-exists = There is already a collection named “{ $name }” here.
core-library-collection-in-itself = A collection cannot be placed inside itself.

## The files of references.

core-library-not-in-library = “{ $path }” is not a path within the library
core-library-not-a-file = { $path } is not a file

## The files of the library and their folders.

core-library-the-file-of-library = the file of the library
core-library-the-folder = the folder
core-library-needs-name = A name is needed.
core-library-name-too-long = That name is too long.
core-library-folder-in-itself = A folder cannot be put in itself.
# Why a file was not given to the reference chosen for it, when files are gone through.
core-library-assign-file-gone = A file was not given to its reference: it is no longer among the files of the library.
core-library-assign-reference-gone = “{ $name }” was not given to its reference: the reference is no longer in the library.
core-library-assign-stored-gone = “{ $name }” was not given to its reference: the file is no longer where the library keeps it, { $path }.
# The record of the files could not be read; it was put aside under another name.
core-library-files-unreadable = The record of the files of the library could not be read, and was put aside as { $path }: { $message }
# The library file has bytes that are not UTF-8, as an editor that saves in Latin-1 writes them; $aside is the name of the copy kept in the same folder.
core-library-not-utf8 = { $path } has letters that are not in UTF-8, as an editor that saves in another encoding writes them. They are read as �, and will be written so; the file as it was is kept as { $aside } in the same folder.

# One place for files (ADR 0070).
# A file of a kind that has no thumbnail, or one that could not be read for it; the interface shows the kind's icon instead.
core-library-no-small = this kind of file is not shown small
# The folder the images of the old store of pictures are put in, at the top of the files of the library.
core-library-images-folder = Images
# An image of the old store of pictures whose file was not there when it was taken into the library.
core-library-picture-missing = “{ $name }” was not taken into the library: its file is missing.
# An image of the old store of pictures whose file does not hold what its name says.
core-library-picture-not-itself = “{ $name }” was not taken into the library: its file is not the image it was.
# Bookmarks in a file (sources in tabs, 2026-10-29).
core-library-too-many-bookmarks = A file keeps at most { $most } bookmarks.
core-library-bookmark-no-place = A bookmark must be at a page of the file.
