# What the core says of references brought in from elsewhere, in English.
# See locales/README.md.

## Where the references came from, as the list of them says: "3 references in pasted text".

core-import-pasted = pasted text
core-import-files = { $count } files

## Files of BibTeX and BibLaTeX.

core-import-file-not-found = The file “{ $name }” was not found.
core-import-empty-entry = Line { $line }: the entry “{ $key }” is empty and was left out.
# Where in a file a reference that has no key was found.
core-import-origin-line = line { $line }
core-import-origin-key-line = { $key }, line { $line }

## What went wrong as the references were taken in, each after the reference
## it concerns: Nagy 1979 “The Best of the Achaeans”.

core-import-title = “{ $title }”
core-import-merge-gone = { $reference }: the entry to merge with is no longer there

## PDF files.

core-import-not-a-pdf = { $name } is not a PDF.
# The service is a name: Crossref, DataCite.
core-import-details-from = The details are from { $service }.
core-import-number-unknown = A number was found in the file, but nothing is known of it in the databases; the details are from the file itself and should be checked.
core-import-databases-failed = The databases could not be asked ({ $error }); the details are from the file itself and should be checked.

## Zotero.

core-import-zotero-my-library = My Library
core-import-zotero-group = Group { $id }
core-import-zotero-the-library = the library { $id } in Zotero
core-import-zotero-own-library = the user’s own library in Zotero
core-import-zotero-the-collection = the collection { $key } in Zotero
core-import-zotero-unknown-base = The file “{ $name }” was not found. Zotero links to it from a directory of its own choosing, which is not known here.
core-import-zotero-empty-item = The item { $key } in Zotero is empty and was left out.
core-import-zotero-alone = { $count ->
    [one] { $count } file or note stands in Zotero under no reference, and was left out.
   *[other] { $count } files and notes stand in Zotero under no reference, and were left out.
}
# The role is Zotero's own name for it: "recipient", "reviewed author".
core-import-zotero-not-a-field = Zotero names { $name } as { $role }, which BibLaTeX has no field for. The name was left out.
core-import-zotero-left-out = Zotero’s field “{ $field }” has no counterpart in BibLaTeX and was left out: { $value }

## Zotero's database.

core-import-zotero-no-database = a Zotero database ({ $file }) in { $path }
core-import-zotero-copying = copying { $path } to a temporary directory
core-import-zotero-empty = the file is empty
core-import-zotero-disturbed = Zotero was writing to its database while it was read. If something is missing, close Zotero and import again.
core-import-zotero-backup-read = Zotero’s database could not be read ({ $error }). Its backup, { $backup }, was read instead: what was changed in Zotero since the backup was made is missing.
core-import-zotero-not-a-database = { $path } is not a database of Zotero.
core-import-zotero-unreadable = The Zotero database has a form that cannot be read here: { $what }. If it was written by an old version of Zotero, opening it once in a current one brings it up to date.
core-import-zotero-unreadable-version = The Zotero database has a form that cannot be read here (version { $version } of Zotero’s database): { $what }. If it was written by an old version of Zotero, opening it once in a current one brings it up to date.
core-import-zotero-no-table = the table “{ $table }” is missing
core-import-zotero-no-column = the table “{ $table }” has no column “{ $column }”
# What is lacking where a table is not there: one of the six below.
core-import-zotero-no-optional = The Zotero database has no table “{ $table }” of the form known here: { $consequence }.
core-import-zotero-no-bin = items in Zotero’s bin cannot be told from the others
core-import-zotero-no-collections = collections were not read
core-import-zotero-no-attachments = attached files were not read
core-import-zotero-no-notes = notes were not read
core-import-zotero-no-keywords = keywords were not read
core-import-zotero-no-group-names = the names of group libraries are not known

## PDF files, as they are read for a reference.

core-import-pdf-empty = The file “{ $name }” is empty.
core-import-pdf-not-a-pdf = The file “{ $name }” is not a PDF.
core-import-pdf-unreadable = The file could not be read: it is damaged, protected by a password, or too large.
core-import-pdf-scan = The file has no text layer: it is a scan.
core-import-pdf-from-file = The details are from the file itself, not from a catalogue, and should be checked.
core-import-pdf-from-metadata = No DOI or ISBN was found in the file; the details are from the file's own metadata and should be checked.
core-import-pdf-unknown = No DOI or ISBN was found in the file, and its metadata do not say what it is: the details must be filled in.

## Tables, from files of text and of sheets.

core-import-table-too-large = The file holds { $size } MB. A table is read from a file of { $most } MB at most.
core-import-table-kinds = Tables are read from CSV and other text with the values parted by commas, semicolons or tabs, and from the sheets of LibreOffice (.ods) and Excel (.xlsx, .xls).
core-import-table-empty = There is nothing in the file.
# The rows are a number, or where the counting was given up, the message below.
core-import-table-rows = The table has { $rows } rows. A table in a text can have { $most } at most: it is not a spreadsheet.
core-import-table-columns = The table has { $columns } columns. A table in a text can have { $most } at most: it is not a spreadsheet.
core-import-table-more-than = more than { $count }

## Documents brought in, to become maps.

core-import-document-stopped = The reading was stopped.
core-import-document-kind = “{ $file }” is not of a kind that can be brought in as a document. Those that can are Word (DOCX), OpenDocument (ODT), Markdown, HTML, LaTeX, RTF, EPUB, Org, reStructuredText, Typst and plain text.
core-import-document-too-large = “{ $file }” is larger than 50 MB, which is more than can be brought in as a document.
# The kind is the kind of file: Word (DOCX), plain text.
core-import-document-unreadable = “{ $file }” could not be read as { $kind }. It may be damaged, or of another kind than its name says. Pandoc, which reads it, said: { $message }
core-import-document-pandoc-unreadable = what Pandoc made of “{ $file }” could not be read: { $error }
# The title of a map made of a document that has none, nor a name of its file.
core-import-document-untitled = Untitled
core-import-document-plain-text = plain text
core-import-document-notebook = Jupyter notebook

## What the one who brings a document in should know of it.

core-import-document-found = { $count ->
    [one] { $made ->
        [all] { $count } citation was found that is not yet tied to a reference of your library, made by a program that keeps references. It stands as the text it was written as, and can be gone through when the map is made, and later.
       *[none] { $count } citation was found that is not yet tied to a reference of your library. It stands as the text it was written as, and can be gone through when the map is made, and later.
    }
   *[other] { $made ->
        [all] { $count } citations were found that are not yet tied to references of your library, all made by a program that keeps references. They stand as the text they were written as, and can be gone through when the map is made, and later.
        [some] { $count } citations were found that are not yet tied to references of your library, { $some } of them made by a program that keeps references. They stand as the text they were written as, and can be gone through when the map is made, and later.
       *[none] { $count } citations were found that are not yet tied to references of your library. They stand as the text they were written as, and can be gone through when the map is made, and later.
    }
}
core-import-document-endnote = { $count ->
    [one] { $count } citation made by EndNote is brought in as the text it shows, and is not among those that were found: what EndNote says of the works could not be read.
   *[other] { $count } citations made by EndNote are brought in as the text they show, and are not among those that were found: what EndNote says of the works could not be read.
}
core-import-document-bookmarks = { $count ->
    [one] The document keeps { $count } citation in a bookmark, and what it cites could not be read: it is text as it stands. Zotero keeps them otherwise where its document preferences say so.
   *[other] The document keeps { $count } citations in bookmarks, and what they cite could not be read: they are text as they stand. Zotero keeps them otherwise where its document preferences say so.
}
core-import-document-bibliography = The document has a list of what it cites, under “{ $heading }”. It is brought in as text, like the rest. The map makes a bibliography of its own from what is cited in it.
core-import-document-bibliography-made = The document has a list of what it cites, made by the program that keeps its references. It is brought in as text, like the rest. The map makes a bibliography of its own from what is cited in it.
core-import-document-tracked = The document has changes that are tracked. The text is brought in as it stands when all of them are accepted.
core-import-document-comments = The document has comments in the margin, which are left out.
core-import-document-heading-notes = { $count ->
    [one] A note on a heading stands at the beginning of the text under it: a heading cannot have a note.
   *[other] { $count } notes on headings stand at the beginning of the text under it: a heading cannot have a note.
}
# What a caption began with is shown as the document has it: “Figure 1:”.
core-import-document-labels = { $count ->
    [one] { $count } caption began with a word and a number, such as “{ $first }”. It is left out: the map numbers its figures and tables itself. Where the text names one of them by its number, that is text as it was written, and does not follow the numbers of the map.
   *[other] { $count } captions began with a word and a number, such as “{ $first }”. They are left out: the map numbers its figures and tables itself. Where the text names one of them by its number, that is text as it was written, and does not follow the numbers of the map.
}
core-import-document-label-example = Figure 1:
core-import-document-caption-notes = { $count ->
    [one] A note in what is said of a figure or a table stands there in brackets.
   *[other] { $count } notes in what is said of figures or tables stand there in brackets.
}
core-import-document-headings = { $count ->
    [one] { $count } heading in a quotation, a list or a table is brought in as a paragraph in bold.
   *[other] { $count } headings in a quotation, a list or a table are brought in as a paragraph in bold.
}
core-import-document-code = { $count ->
    [one] { $count } block of code is brought in as plain paragraphs, a line to each.
   *[other] { $count } blocks of code are brought in as plain paragraphs, a line to each.
}
core-import-document-definitions = { $count ->
    [one] { $count } list of terms with what they mean is brought in as paragraphs, the terms in bold.
   *[other] { $count } lists of terms with what they mean are brought in as paragraphs, the terms in bold.
}
core-import-document-rules = { $count ->
    [one] { $count } line across the page is left out.
   *[other] { $count } lines across the page are left out.
}
core-import-document-raw = { $count ->
    [one] { $count } piece written in HTML or TeX for the one kind of document only is left out.
   *[other] { $count } pieces written in HTML or TeX for the one kind of document only are left out.
}
core-import-document-pictures-wanting = { $count ->
    [one] { $count } picture that the file holds is not in the text that was read, and is left out. It may stand in the head or the foot of the pages, or in a drawing.
   *[other] { $count } pictures that the file holds are not in the text that was read, and are left out. They may stand in the head or the foot of the pages, or in a drawing.
}

## A picture of a document that is left out, and why.

core-import-document-picture-left-out = The picture “{ $name }” is left out: { $why }.
core-import-document-picture-kind = it is of a kind that is not read ({ $kind })
core-import-document-picture-not-read = it is not a picture of a kind that is read
core-import-document-picture-unreadable = it could not be read
core-import-document-picture-network = it is on the network, and nothing is fetched from there
core-import-document-picture-not-taken-out = it could not be taken out of the file
core-import-document-picture-not-found = the file was not found where the document says it is
core-import-document-picture-too-large = it is larger than 50 MB
core-import-document-picture-file-unreadable = the file could not be read
