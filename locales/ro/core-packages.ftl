# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Manifestul pachetului nu se poate citi: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = „{ $file }” nu se poate citi ca fișier zip: { $message }
core-packages-too-large = „{ $file }” este mai mare decât poate fi un pachet de limbă.
core-packages-nothing = În ce s-a ales nu există niciun dicționar de ortografie (un fișier .aff și unul .dic) și nici date pentru Tesseract (un fișier .traineddata).
# $name is the name a package would give its files.
core-packages-bad-name = „{ $name }” nu poate fi numele unei limbi: un nume are litere, cifre, _ și - și începe cu o limbă, precum nb_NO sau nor.
core-packages-empty = „{ $file }” este gol.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } nu s-a putut descărca: { $message }
core-packages-fetch-status = { $url } nu s-a putut descărca: serverul a răspuns { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Ce oferă { $server } nu se poate citi: { $message }
core-packages-checksum = „{ $file }” nu este ce a spus serverul că va fi. Nu s-a importat nimic; încercați din nou mai târziu.
