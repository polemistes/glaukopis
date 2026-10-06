# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = The manifest of the package cannot be read: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = “{ $file }” cannot be read as a zip file: { $message }
core-packages-too-large = “{ $file }” is larger than a language package may be.
core-packages-nothing = There is no dictionary of spelling (an .aff and a .dic file) or data for Tesseract (a .traineddata file) in what was chosen.
# $name is the name a package would give its files.
core-packages-bad-name = “{ $name }” cannot be the name of a language: a name is of letters, digits, _ and -, and begins with a language, such as nb_NO or nor.
core-packages-empty = “{ $file }” is empty.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } could not be fetched: { $message }
core-packages-fetch-status = { $url } could not be fetched: the server answered { $status }.
# $server is the address of the server, or the folder.
core-packages-index = What { $server } offers cannot be read: { $message }
core-packages-checksum = “{ $file }” is not what the server said it would be. Nothing was imported; try again later.
