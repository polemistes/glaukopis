# Languages of spelling and of OCR that are imported (ADR 0032), in the
# settings of spelling and of Tesseract. See locales/README.md.

packages-looking = Wird gesucht…
packages-import-spelling = Wörterbücher für die Rechtschreibung importieren
packages-import-ocr = Sprachdateien für die Texterkennung importieren
# $name is the name of the language.
packages-remove = { $name } entfernen
packages-import = Importieren
packages-importing = Wird importiert…
packages-update = Aktualisieren
packages-have = Importiert
# $size is a number of megabytes, written already.
packages-size = { $size } MB
packages-none-offered = Der Server bietet keine Sprachen dieser Art an.
# $server is the address of the server, or a folder.
packages-server = Von { $server }
packages-server-label = Der Server, von dem Sprachen importiert werden: eine Adresse oder ein Ordner
packages-server-change = Ändern
# $count is how many languages; $names their names, joined.
packages-imported = { $count ->
    [one] { $names } ist importiert.
   *[other] { $names } sind importiert.
}
packages-list-failed = Die importierten Sprachen konnten nicht aufgelistet werden
packages-look-failed = Was { $server } anbietet, konnte nicht geholt werden
packages-import-failed = { $name } konnte nicht importiert werden
packages-remove-failed = { $name } konnte nicht entfernt werden
