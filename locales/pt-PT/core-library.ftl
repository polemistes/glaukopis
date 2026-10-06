# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } e { $second }
core-library-three-names = { $first }, { $second } e { $third }
core-library-et-al = { $first } et al.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ed.)
    [many] { $names } (eds.)
   *[other] { $names } (eds.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = linha { $line }: { $message }
core-library-line-sentence = Linha { $line }: { $message }.
core-library-key-changed = a chave «{ $from }» foi mudada para «{ $to }»
core-library-no-entry = Não há aqui nenhuma entrada. Uma entrada começa por @ e o seu tipo, como em @book{"{"}chave, …{"}"}.
core-library-many-entries = Há aqui { $count } entradas; espera-se uma.

## Changing a reference.

core-library-bad-key = «{ $key }» não pode servir de chave de citação.
core-library-key-letters = Uma chave de citação só pode ter letras, algarismos e - _ : . Experimente «{ $key }».
core-library-key-taken = A chave de citação «{ $key }» já está em uso.
core-library-no-type = A referência não tem tipo de publicação.
core-library-not-a-type = «{ $kind }» não é um tipo de publicação.
core-library-merge-itself = Uma entrada não pode ser fundida consigo mesma.

## What was not found, shown after "not found: ".

core-library-the-reference = a referência
core-library-the-stored-file = o ficheiro guardado { $path }
core-library-the-file = o ficheiro { $path }
core-library-the-collection = a coleção
core-library-the-collection-to-put-in = a coleção onde a pôr
core-library-the-collection-to-move-to = a coleção para onde a mover

## Collections.

core-library-collection-needs-name = Uma coleção precisa de um nome.
core-library-collection-exists = Já há aqui uma coleção chamada «{ $name }».
core-library-collection-in-itself = Uma coleção não pode ser posta dentro de si mesma.

## The files of references.

core-library-not-in-library = «{ $path }» não é um caminho dentro da biblioteca
core-library-not-a-file = { $path } não é um ficheiro
