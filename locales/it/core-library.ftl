# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } e { $second }
core-library-three-names = { $first }, { $second } e { $third }
core-library-et-al = { $first } et al.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (a cura di)
    [many] { $names } (a cura di)
   *[other] { $names } (a cura di)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = riga { $line }: { $message }
core-library-line-sentence = Riga { $line }: { $message }.
core-library-key-changed = la chiave «{ $from }» è stata cambiata in «{ $to }»
core-library-no-entry = Qui non c'è una voce. Una voce comincia con @ e il suo tipo, come in @book{"{"}chiave, …{"}"}.
core-library-many-entries = Qui ci sono { $count } voci; se ne attende una.

## Changing a reference.

core-library-bad-key = «{ $key }» non si può usare come chiave di citazione.
core-library-key-letters = Una chiave di citazione può contenere solo lettere, cifre e - _ : . Prova «{ $key }».
core-library-key-taken = La chiave di citazione «{ $key }» è già in uso.
core-library-no-type = Il riferimento non ha un tipo di pubblicazione.
core-library-not-a-type = «{ $kind }» non è un tipo di pubblicazione.
core-library-merge-itself = Una voce non si può unire con se stessa.

## What was not found, shown after "not found: ".

core-library-the-reference = il riferimento
core-library-the-stored-file = il file conservato { $path }
core-library-the-file = il file { $path }
core-library-the-collection = la raccolta
core-library-the-collection-to-put-in = la raccolta in cui metterlo
core-library-the-collection-to-move-to = la raccolta in cui spostarlo

## Collections.

core-library-collection-needs-name = Una raccolta ha bisogno di un nome.
core-library-collection-exists = Qui c'è già una raccolta chiamata «{ $name }».
core-library-collection-in-itself = Una raccolta non si può mettere dentro se stessa.

## The files of references.

core-library-not-in-library = «{ $path }» non è un percorso dentro la biblioteca
core-library-not-a-file = { $path } non è un file
