# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Le manifeste du paquet ne peut pas être lu : { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = « { $file } » ne peut pas être lu comme un fichier zip : { $message }
core-packages-too-large = « { $file } » est plus gros que ne peut l’être un paquet de langue.
core-packages-nothing = Ce qui a été choisi ne contient ni dictionnaire d’orthographe (un fichier .aff et un fichier .dic) ni données pour Tesseract (un fichier .traineddata).
# $name is the name a package would give its files.
core-packages-bad-name = « { $name } » ne peut pas être le nom d’une langue : un nom est fait de lettres, de chiffres, de _ et de -, et commence par une langue, comme nb_NO ou nor.
core-packages-empty = « { $file } » est vide.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = { $url } n’a pas pu être récupéré : { $message }
core-packages-fetch-status = { $url } n’a pas pu être récupéré : le serveur a répondu { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Ce que propose { $server } ne peut pas être lu : { $message }
core-packages-checksum = « { $file } » n’est pas ce que le serveur avait annoncé. Rien n’a été importé ; réessayez plus tard.
