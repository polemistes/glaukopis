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
