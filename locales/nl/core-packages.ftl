# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Het manifest van het pakket kan niet worden gelezen: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = ‘{ $file }’ kan niet als zipbestand worden gelezen: { $message }
core-packages-too-large = ‘{ $file }’ is groter dan een taalpakket mag zijn.
core-packages-nothing = In wat is gekozen, zit geen spellingwoordenboek (een .aff- en een .dic-bestand) en geen gegevens voor Tesseract (een .traineddata-bestand).
# $name is the name a package would give its files.
core-packages-bad-name = ‘{ $name }’ kan niet de naam van een taal zijn: een naam bestaat uit letters, cijfers, _ en -, en begint met een taal, zoals nl_NL of nld.
core-packages-empty = ‘{ $file }’ is leeg.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } kon niet worden opgehaald: { $message }
core-packages-fetch-status = { $url } kon niet worden opgehaald: de server antwoordde { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Wat { $server } aanbiedt, kan niet worden gelezen: { $message }
core-packages-checksum = ‘{ $file }’ is niet wat de server zei dat het zou zijn. Er is niets geïmporteerd; probeer het later opnieuw.
