# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Pakkens manifest kan ikke læses: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = »{ $file }« kan ikke læses som en zip-fil: { $message }
core-packages-too-large = »{ $file }« er større, end en sprogpakke må være.
core-packages-nothing = Der er hverken en ordbog til stavning (en .aff- og en .dic-fil) eller data til Tesseract (en .traineddata-fil) i det valgte.
# $name is the name a package would give its files.
core-packages-bad-name = »{ $name }« kan ikke være navnet på et sprog: et navn består af bogstaver, cifre, _ og - og begynder med et sprog, såsom da_DK eller dan.
core-packages-empty = »{ $file }« er tom.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } kunne ikke hentes: { $message }
core-packages-fetch-status = { $url } kunne ikke hentes: serveren svarede { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Det, { $server } tilbyder, kan ikke læses: { $message }
core-packages-checksum = »{ $file }« er ikke det, serveren sagde, den ville være. Intet blev importeret; prøv igen senere.
