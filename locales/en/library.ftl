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
