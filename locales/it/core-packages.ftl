# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Il manifesto del pacchetto non si può leggere: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = «{ $file }» non si può leggere come file zip: { $message }
core-packages-too-large = «{ $file }» è più grande di quanto possa essere un pacchetto linguistico.
core-packages-nothing = In ciò che è stato scelto non c'è un dizionario d'ortografia (un file .aff e un file .dic) né dati per Tesseract (un file .traineddata).
# $name is the name a package would give its files.
core-packages-bad-name = «{ $name }» non può essere il nome di una lingua: un nome è fatto di lettere, cifre, _ e -, e comincia con una lingua, come it_IT o ita.
core-packages-empty = «{ $file }» è vuoto.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } non si è potuto scaricare: { $message }
core-packages-fetch-status = { $url } non si è potuto scaricare: il server ha risposto { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Ciò che { $server } offre non si può leggere: { $message }
core-packages-checksum = «{ $file }» non è ciò che il server aveva detto. Non è stato importato nulla; riprova più tardi.
