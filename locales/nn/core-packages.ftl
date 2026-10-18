# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Manifestet i pakken kan ikkje lesast: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = «{ $file }» kan ikkje lesast som ei zip-fil: { $message }
core-packages-too-large = «{ $file }» er større enn ein språkpakke kan vere.
core-packages-nothing = Det er inga ordbok for staving (ei .aff- og ei .dic-fil) og ingen data for Tesseract (ei .traineddata-fil) i det som vart valt.
# $name is the name a package would give its files.
core-packages-bad-name = «{ $name }» kan ikkje vere namnet på eit språk: eit namn består av bokstavar, siffer, _ og -, og byrjar med eit språk, til dømes nb_NO eller nor.
core-packages-empty = «{ $file }» er tom.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } kunne ikkje hentast: { $message }
core-packages-fetch-status = { $url } kunne ikkje hentast: tenaren svarte { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Det { $server } tilbyr, kan ikkje lesast: { $message }
core-packages-checksum = «{ $file }» er ikkje det tenaren sa den skulle vere. Ingenting vart importert; prøv igjen seinare.
