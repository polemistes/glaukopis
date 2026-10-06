# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Manifestet i pakken kan ikke leses: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = «{ $file }» kan ikke leses som en zip-fil: { $message }
core-packages-too-large = «{ $file }» er større enn en språkpakke kan være.
core-packages-nothing = Det er ingen ordbok for stavekontroll (en .aff- og en .dic-fil) eller data for Tesseract (en .traineddata-fil) i det som ble valgt.
# $name is the name a package would give its files.
core-packages-bad-name = «{ $name }» kan ikke være navnet på et språk: et navn består av bokstaver, sifre, _ og -, og begynner med et språk, som nb_NO eller nor.
core-packages-empty = «{ $file }» er tom.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } kunne ikke hentes: { $message }
core-packages-fetch-status = { $url } kunne ikke hentes: tjeneren svarte { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Det { $server } tilbyr, kan ikke leses: { $message }
core-packages-checksum = «{ $file }» er ikke det tjeneren sa den skulle være. Ingenting ble importert; prøv igjen senere.
