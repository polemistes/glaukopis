# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = No se puede leer el manifiesto del paquete: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = «{ $file }» no se puede leer como archivo zip: { $message }
core-packages-too-large = «{ $file }» es más grande de lo que puede ser un paquete de idioma.
core-packages-nothing = En lo que se eligió no hay ningún diccionario de ortografía (un archivo .aff y uno .dic) ni datos para Tesseract (un archivo .traineddata).
# $name is the name a package would give its files.
core-packages-bad-name = «{ $name }» no puede ser el nombre de un idioma: un nombre se compone de letras, cifras, _ y -, y empieza por un idioma, como nb_NO o nor.
core-packages-empty = «{ $file }» está vacío.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = No se pudo obtener { $url }: { $message }
core-packages-fetch-status = No se pudo obtener { $url }: el servidor respondió { $status }.
# $server is the address of the server, or the folder.
core-packages-index = No se puede leer lo que ofrece { $server }: { $message }
core-packages-checksum = «{ $file }» no es lo que el servidor dijo que sería. No se importó nada; inténtelo de nuevo más tarde.
