# What the core says of languages of spelling and of OCR that are imported
# (ADR 0032). See locales/README.md.

# $message is what was wrong with it.
core-packages-manifest = Não é possível ler o manifesto do pacote: { $message }
# $file is the name of the file; $message what was wrong with it.
core-packages-not-zip = Não é possível ler «{ $file }» como ficheiro zip: { $message }
core-packages-too-large = «{ $file }» é maior do que um pacote de língua pode ser.
core-packages-nothing = No que se escolheu não há nenhum dicionário de ortografia (um ficheiro .aff e um .dic) nem dados para o Tesseract (um ficheiro .traineddata).
# $name is the name a package would give its files.
core-packages-bad-name = «{ $name }» não pode ser o nome de uma língua: um nome faz-se de letras, algarismos, _ e -, e começa por uma língua, como pt_PT ou por.
core-packages-empty = «{ $file }» está vazio.
# $url is the address; $message what went wrong.
core-packages-fetch-failed = Não foi possível transferir { $url }: { $message }
core-packages-fetch-status = Não foi possível transferir { $url }: o servidor respondeu { $status }.
# $server is the address of the server, or the folder.
core-packages-index = Não é possível ler o que { $server } oferece: { $message }
core-packages-checksum = «{ $file }» não é o que o servidor disse que seria. Nada foi importado; tente de novo mais tarde.
