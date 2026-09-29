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
