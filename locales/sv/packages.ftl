# Languages of spelling and of OCR that are imported (ADR 0032), in the
# settings of spelling and of Tesseract. See locales/README.md.

packages-looking = Letar…
packages-import-spelling = Importera ordlistor för stavning
packages-import-ocr = Importera språkfiler för textigenkänning
# $name is the name of the language.
packages-remove = Ta bort { $name }
packages-import = Importera
packages-importing = Importerar…
packages-update = Uppdatera
packages-have = Importerad
# $size is a number of megabytes, written already.
packages-size = { $size } MB
packages-none-offered = Servern erbjuder inga språk av det här slaget.
# $server is the address of the server, or a folder.
packages-server = Från { $server }
packages-server-label = Servern som språken importeras från: en adress eller en mapp
packages-server-change = Ändra
# $count is how many languages; $names their names, joined.
packages-imported = { $count ->
    [one] { $names } är importerad.
   *[other] { $names } är importerade.
}
packages-list-failed = De importerade språken kunde inte listas
packages-look-failed = Det som { $server } erbjuder kunde inte hämtas
packages-import-failed = { $name } kunde inte importeras
packages-remove-failed = { $name } kunde inte tas bort
