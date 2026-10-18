# Languages of spelling and of OCR that are imported (ADR 0032), in the
# settings of spelling and of Tesseract. See locales/README.md.

packages-looking = Recherche…
packages-import-spelling = Importer des dictionnaires d’orthographe
packages-import-ocr = Importer des fichiers de langue pour l’OCR
# $name is the name of the language.
packages-remove = Retirer { $name }
packages-import = Importer
packages-importing = Importation…
packages-update = Mettre à jour
packages-have = Importé
# $size is a number of megabytes, written already.
packages-size = { $size } Mo
packages-none-offered = Le serveur ne propose aucune langue de ce genre.
# $server is the address of the server, or a folder.
packages-server = Depuis { $server }
packages-server-label = Le serveur d’où les langues sont importées : une adresse, ou un dossier
packages-server-change = Changer
# $count is how many languages; $names their names, joined.
packages-imported = { $count ->
    [one] { $names } est importé.
    [many] { $names } sont importés.
   *[other] { $names } sont importés.
}
packages-list-failed = Les langues importées n’ont pas pu être listées
packages-look-failed = Ce que propose { $server } n’a pas pu être récupéré
packages-import-failed = { $name } n’a pas pu être importé
packages-remove-failed = { $name } n’a pas pu être retiré
