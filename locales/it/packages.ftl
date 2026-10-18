# Languages of spelling and of OCR that are imported (ADR 0032), in the
# settings of spelling and of Tesseract. See locales/README.md.

packages-looking = Ricerca…
packages-import-spelling = Importa dizionari d'ortografia
packages-import-ocr = Importa file delle lingue per l'OCR
# $name is the name of the language.
packages-remove = Togli { $name }
packages-import = Importa
packages-importing = Importazione…
packages-update = Aggiorna
packages-have = Importato
# $size is a number of megabytes, written already.
packages-size = { $size } MB
packages-none-offered = Il server non offre lingue di questo tipo.
# $server is the address of the server, or a folder.
packages-server = Da { $server }
packages-server-label = Il server da cui si importano le lingue: un indirizzo, o una cartella
packages-server-change = Cambia
# $count is how many languages; $names their names, joined.
packages-imported = { $count ->
    [one] { $names } è stato importato.
    [many] { $names } sono stati importati.
   *[other] { $names } sono stati importati.
}
packages-list-failed = Le lingue importate non si sono potute elencare
packages-look-failed = Non si è potuto avere ciò che offre { $server }
packages-import-failed = { $name } non si è potuto importare
packages-remove-failed = { $name } non si è potuto togliere
