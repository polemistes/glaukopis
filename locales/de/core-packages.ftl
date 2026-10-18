# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Die Beschreibung des Pakets kann nicht gelesen werden: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = „{ $file }“ kann nicht als ZIP-Datei gelesen werden: { $message }
core-packages-too-large = „{ $file }“ ist größer, als ein Sprachpaket sein darf.
core-packages-nothing = In dem, was gewählt wurde, ist weder ein Wörterbuch für die Rechtschreibung (eine .aff- und eine .dic-Datei) noch Daten für Tesseract (eine .traineddata-Datei).
# $name is the name a package would give its files.
core-packages-bad-name = „{ $name }“ kann nicht der Name einer Sprache sein: ein Name besteht aus Buchstaben, Ziffern, _ und - und beginnt mit einer Sprache, etwa de_DE oder deu.
core-packages-empty = „{ $file }“ ist leer.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } konnte nicht geholt werden: { $message }
core-packages-fetch-status = { $url } konnte nicht geholt werden: der Server antwortete { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Was { $server } anbietet, kann nicht gelesen werden: { $message }
core-packages-checksum = „{ $file }“ ist nicht das, was der Server angekündigt hat. Es wurde nichts importiert; versuchen Sie es später noch einmal.
