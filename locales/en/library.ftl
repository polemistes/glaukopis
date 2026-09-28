# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Often used
library-form-add-field = Add field
library-form-citation-key = Citation key
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = made from author and year
library-form-date-problem = Write a date as 1979, 1979-05 or 1979-05-12; a range as 1979/1985.
library-form-remove-field = Remove { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Institution or other name kept whole
library-names-prefix-suffix = Prefix and suffix
    .hint = “van”, “de la” · “Jr.”, “III”
library-names-move-up = Move up
library-names-move-down = Move down
library-names-more = More for this name
library-names-name = Name
library-names-name-of = { $role }: name
library-names-family = Family name
library-names-family-of = { $role }: family name
library-names-given = Given names
library-names-given-of = { $role }: given names
library-names-prefix = Prefix: van, de la
library-names-prefix-of = { $role }: prefix
library-names-suffix = Suffix: Jr., III
library-names-suffix-of = { $role }: suffix

## Words for references, wherever they are shown.

library-untitled = Untitled
library-no-author = No author
library-no-title = No title

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = the same DOI
library-reason-isbn = the same ISBN
library-reason-identical = alike in all that tells one work from another
library-reason-title-author-year = the same title, author and year
library-reason-file = the same file
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } and { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = This is already in your library.
library-duplicate-probable = This may already be in your library.
library-duplicate-use = Use this one

## Duplicates in the library.

library-duplicates-title = Duplicates
library-duplicates-count = { $count ->
    [one] { $count } reference seems to be in the library more than once
   *[other] { $count } references seem to be in the library more than once
}
library-duplicates-none = No duplicates
    .text = No reference seems to be in the library more than once.
library-duplicates-no-more = No more duplicates
    .text = Citations of the references that were taken in now point to the ones that were kept.
library-duplicates-how = When references are made one, the one you keep is given what it lacks from the others, and keeps its own where they differ. Their files and collections are brought together, and what cites them cites the one kept.
library-duplicates-same = The same
library-duplicates-probably-same = Probably the same
library-duplicates-keep-which = The one to keep
library-duplicates-kept = Kept
library-duplicates-different = They are different
library-duplicates-merge = Make them one
library-duplicates-merging = Making them one…
library-duplicates-failed = The library could not be searched for duplicates
library-duplicates-merge-failed = They could not be made one

## Importing references: what a file holds, against what the library has.

library-import = Import
library-import-title = Import references
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } reference in { $source }
   *[other] { $count } references in { $source }
}
library-import-review = { $count ->
    [one] { $count } reference may already be in your library
   *[other] { $count } references may already be in your library
}
library-import-new = { $count ->
    [one] { $count } new reference
   *[other] { $count } new references
}
library-import-complete = { $count ->
    [one] { $count } reference already in your library gains details
   *[other] { $count } references already in your library gain details
}
library-import-known = { $count ->
    [one] { $count } reference already in your library
   *[other] { $count } references already in your library
}
library-import-repeated = { $count ->
    [one] { $count } reference repeated within the import
   *[other] { $count } references repeated within the import
}
library-import-in-library = In your library
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Would gain: { $fields }
library-import-gains-file = File
library-import-gains-zotero = Its key in Zotero
library-import-what-to-do = What to do
library-import-merge = Same work: complete the one I have
library-import-skip = Same work: leave mine as it is
library-import-add = A different work: add it
library-import-more = …and { $count } more.
library-import-unread = { $count ->
    [one] { $count } part of the file could not be read
   *[other] { $count } parts of the file could not be read
}
library-import-importing = Importing…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } to add{ $merge ->
        [0] {""}
       *[other] , { $merge } to complete
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } left out
    }
library-import-failed = The import failed.

## The library: the list of references, and what can be done with them.

library-references = References
library-all-references = All references
library-count = { $count ->
    [one] { $count } reference
   *[other] { $count } references
}
library-selected = { $count ->
    [one] { $count } reference selected
   *[other] { $count } references selected
}
library-selected-of = { $count ->
    [one] { $selected } of { $count } reference selected
   *[other] { $selected } of { $count } references selected
}
library-new-reference = New reference
library-search = Search the library
library-search-in = Search in { $name }
library-search-clear = Clear the search
library-sort = Sort
library-sort-author = Author
library-sort-year = Year
library-sort-title = Title
library-sort-added = Date added
library-sort-modified = Date changed
library-sort-descending = Descending
library-import-export = Import and export
library-import-file = Import a file…
    .hint = BibLaTeX or BibTeX
library-paste = Paste references…
library-add-pdfs = Add PDF files…
    .hint = Each is looked up, and kept
library-import-zotero = Import from Zotero…
library-find-duplicates = Find duplicates…
library-export-library = Export the library…
library-export-collection = Export “{ $name }”…
library-export-one = Export…
library-export-many = { $count ->
    [one] Export { $count } reference…
   *[other] Export { $count } references…
}
library-export-title = Export references
# What a file of exported references is called, before it is given a name.
library-export-file-references = references
library-export-file-library = library
library-exported = { $count ->
    [one] { $count } reference exported
   *[other] { $count } references exported
}
library-export-failed = The export failed
library-empty = Your library is empty
    .text = References you add here are available in all your projects. Begin with one, or bring in those you already have.
library-collection-empty = Nothing in this collection yet
    .text = Drag references here from the library, or add a new one.
library-nothing-found = Nothing found
    .text = No reference holds all of these words.
library-open-file = Open the file
library-file-open-failed = The file could not be opened
library-add-to-collection = Add to collection
library-remove-from = Remove from “{ $name }”
library-copy-key = Copy citation key
library-copied-key = Copied “{ $key }”
library-copy-biblatex = Copy as BibLaTeX
library-copied = Copied
library-delete-one-title = Delete “{ $name }”?
library-delete-many-title = { $count ->
    [one] Delete { $count } reference?
   *[other] Delete { $count } references?
}
library-delete-one = This removes the reference from your library, from every collection{ $files ->
        [0] {""}
        [one] , together with { $files } attached file
       *[other] , together with { $files } attached files
    }. Citations of it in your projects will no longer resolve.
library-delete-many = This removes them from your library, from every collection{ $files ->
        [0] {""}
        [one] , together with { $files } attached file
       *[other] , together with { $files } attached files
    }. Citations of them in your projects will no longer resolve.
library-delete-failed = The references could not be deleted
library-not-done = That could not be done

## Collections.

library-collections = Collections
library-collections-hint = Collections gather references for a subject or a piece of work. A reference can be in any number of them.
library-collection-new = New collection
library-collection-new-inside = New collection inside
library-collection-name = Name of the collection
library-collection-name-failed = The collection could not be named
library-collection-expand = Expand
library-collection-collapse = Collapse
library-collection-to-top = Move to the top level
library-collection-move-failed = The collection could not be moved
library-collection-added = { $count ->
    [one] { $count } reference added to “{ $name }”
   *[other] { $count } references added to “{ $name }”
}
library-collection-already = Already in “{ $name }”
library-collection-delete = Delete collection
library-collection-delete-title = Delete the collection “{ $name }”?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] The references stay in your library.
   *[other] The collections inside it are deleted as well. The references stay in your library.
}
library-collection-delete-failed = The collection could not be deleted
library-collection-count = { $count ->
    [one] { $count } collection
   *[other] { $count } collections
}

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } file
   *[other] { $count } files
}
library-open-failed = The reference could not be opened
library-known = { $count ->
    [one] It is in your library already
   *[other] They are in your library already
}
library-nothing-to-import = Nothing to import
library-none-found = No references were found.
library-import-kinds = References are read from .bib files, and made of PDF files.
library-filter-bib = BibLaTeX and BibTeX
library-filter-all = All files
library-files-read-failed = { $count ->
    [one] The file could not be read
   *[other] The files could not be read
}
library-text-read-failed = The text could not be read
library-add-pdfs-title = Add PDF files
library-pdfs-working = { $count ->
    [one] Finding out what the file is…
   *[other] Finding out what { $count } files are…
}
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] { $count } reference added
   *[other] { $count } references added
}
library-imported-completed = { $count } completed
library-imported-skipped = { $count } already in the library
library-imported-files = { $count ->
    [one] { $count } file stored
   *[other] { $count } files stored
}
library-imported-nothing = Nothing was changed
library-paste-title = Paste references
library-paste-subtitle = BibLaTeX or BibTeX, as many entries as you like
library-paste-continue = Continue
library-source-label = BibLaTeX source

## Importing from Zotero.

library-zotero-title = Import from Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = No Zotero was found on this computer in the places where it usually keeps its data. If it keeps it elsewhere, show where: the folder that holds { $file }.
library-zotero-lead = What is imported is copied into your library, with its files. Zotero is only read, and nothing of it is changed; it may be running meanwhile.
library-zotero-choose = The data directory of Zotero
library-zotero-none-there = There is no Zotero there.
library-zotero-unread = Zotero could not be read.
library-zotero-library = Library
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = My library
library-zotero-what = What to import
library-zotero-everything = Everything
library-zotero-with-files = With the files that are attached
library-zotero-with-notes = With the notes, as annotations
library-zotero-elsewhere = Another place…
library-zotero-show-where = Show where…
library-zotero-reading = Reading…
library-zotero-read = { $count ->
    [0] Read
    [one] Read { $count } reference
   *[other] Read { $count } references
}
