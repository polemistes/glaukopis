# Languages of spelling and of OCR that are imported (ADR 0032), in the
# settings of spelling and of Tesseract. See locales/README.md.

packages-looking = Ser etter …
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
packages-none-offered = Tjeneren tilbyr ingen språk av dette slaget.
# $server is the address of the server, or a folder.
packages-server = Fra { $server }
packages-server-label = Tjeneren språk importeres fra: en adresse eller en mappe
packages-server-change = Endre
# $count is how many languages; $names their names, joined.
packages-imported = { $count ->
    [one] { $names } er importert.
   *[other] { $names } er importert.
}
packages-list-failed = De importerte språkene kunne ikke listes opp
packages-look-failed = Det { $server } tilbyr, kunne ikke hentes
packages-import-failed = { $name } kunne ikke importeres
packages-remove-failed = { $name } kunne ikke fjernes
