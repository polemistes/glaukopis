# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Manifest paketa ne može se pročitati: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = „{ $file }” ne može se pročitati kao ZIP arhiva: { $message }
core-packages-too-large = „{ $file }” veća je nego što jezični paket smije biti.
core-packages-nothing = U onome što je odabrano nema ni rječnika za pravopis (datoteka .aff i .dic) ni podataka za Tesseract (datoteke .traineddata).
# $name is the name a package would give its files.
core-packages-bad-name = „{ $name }” ne može biti naziv jezika: naziv se sastoji od slova, znamenki, _ i -, a počinje jezikom, kao nb_NO ili nor.
core-packages-empty = „{ $file }” je prazna.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } nije bilo moguće dohvatiti: { $message }
core-packages-fetch-status = { $url } nije bilo moguće dohvatiti: poslužitelj je odgovorio { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Ne može se pročitati što { $server } nudi: { $message }
core-packages-checksum = „{ $file }” nije ono što je poslužitelj rekao da će biti. Ništa nije uvezeno; pokušajte ponovno kasnije.
