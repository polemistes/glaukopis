# Languages of spelling and of OCR that are imported (ADR 0032), in the
# settings of spelling and of Tesseract. See locales/README.md.

packages-looking = Leitar …
packages-import-spelling = Importer ordbøker
packages-import-ocr = Importer språkfiler for OCR
# $name is the name of the language.
packages-remove = Fjern { $name }
packages-import = Importer
packages-importing = Importerer …
packages-update = Oppdater
packages-have = Importert
# $size is a number of megabytes, written already.
packages-size = { $size } MB
packages-none-offered = Tenaren tilbyr ingen språk av dette slaget.
# $server is the address of the server, or a folder.
packages-server = Frå { $server }
packages-server-label = Tenaren språka blir importerte frå: ei adresse eller ei mappe
packages-server-change = Endre
# $count is how many languages; $names their names, joined.
packages-imported = { $count ->
    [one] { $names } er importert.
   *[other] { $names } er importerte.
}
packages-list-failed = Dei importerte språka kunne ikkje listast opp
packages-look-failed = Det { $server } tilbyr, kunne ikkje hentast
packages-import-failed = { $name } kunne ikkje importerast
packages-remove-failed = { $name } kunne ikkje fjernast
