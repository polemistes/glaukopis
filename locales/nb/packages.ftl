# Languages of spelling and of OCR that are imported (ADR 0032), in the
# settings of spelling and of Tesseract. See locales/README.md.

packages-title = Importerte språk
packages-hint-spelling = Ordbøker importert fra tjeneren nedenfor, eller fra filer: en språkpakke (en .zip med en manifest.json), en ordbokutvidelse for LibreOffice eller Firefox (.oxt, .xpi), eller .aff- og .dic-filene til en ordbok. De går foran dem som er installert på datamaskinen. Hvordan en pakke lages, står i veiledningen, under Staving.
packages-hint-ocr = Språk for Tesseract importert fra tjeneren nedenfor, eller fra filer: en språkpakke (en .zip med en manifest.json), eller en .traineddata-fil. De går foran dem som er installert på datamaskinen. Hvordan en pakke lages, står i veiledningen, under Staving.
packages-look = Vis språkene på tjeneren
packages-looking = Ser etter …
packages-from-files = Importer fra filer …
packages-files-spelling = Språkpakker og ordbøker
packages-files-ocr = Språkpakker og data for Tesseract
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
packages-import-files-failed = Filene kunne ikke importeres
packages-remove-failed = { $name } kunne ikke fjernes
