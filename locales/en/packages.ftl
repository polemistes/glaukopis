# Languages of spelling and of OCR that are imported (ADR 0032), in the
# settings of spelling and of Tesseract. See locales/README.md.

packages-looking = Looking…
packages-import-spelling = Import spelling dictionaries
packages-import-ocr = Import OCR language files
# $name is the name of the language.
packages-remove = Remove { $name }
packages-import = Import
packages-importing = Importing…
packages-update = Update
packages-have = Imported
# $size is a number of megabytes, written already.
packages-size = { $size } MB
packages-none-offered = The server offers no languages of this kind.
# $server is the address of the server, or a folder.
packages-server = From { $server }
packages-server-label = The server languages are imported from: an address, or a folder
packages-server-change = Change
# $count is how many languages; $names their names, joined.
packages-imported = { $count ->
    [one] { $names } is imported.
   *[other] { $names } are imported.
}
packages-list-failed = The imported languages could not be listed
packages-look-failed = What { $server } offers could not be fetched
packages-import-failed = { $name } could not be imported
packages-remove-failed = { $name } could not be removed
