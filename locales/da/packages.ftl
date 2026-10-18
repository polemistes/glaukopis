# Languages of spelling and of OCR that are imported (ADR 0032), in the
# settings of spelling and of Tesseract. See locales/README.md.

packages-looking = Leder…
packages-import-spelling = Importer ordbøger til stavekontrol
packages-import-ocr = Importer sprogfiler til OCR
# $name is the name of the language.
packages-remove = Fjern { $name }
packages-import = Importer
packages-importing = Importerer…
packages-update = Opdater
packages-have = Importeret
# $size is a number of megabytes, written already.
packages-size = { $size } MB
packages-none-offered = Serveren tilbyder ingen sprog af denne art.
# $server is the address of the server, or a folder.
packages-server = Fra { $server }
packages-server-label = Den server, sprog importeres fra: en adresse eller en mappe
packages-server-change = Skift
# $count is how many languages; $names their names, joined.
packages-imported = { $count ->
    [one] { $names } er importeret.
   *[other] { $names } er importeret.
}
packages-list-failed = De importerede sprog kunne ikke vises
packages-look-failed = Det, { $server } tilbyder, kunne ikke hentes
packages-import-failed = { $name } kunne ikke importeres
packages-remove-failed = { $name } kunne ikke fjernes
