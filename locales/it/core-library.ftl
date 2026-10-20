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

## The files of the library and their folders.

core-library-the-file-of-library = il file della biblioteca
core-library-the-folder = la cartella
core-library-needs-name = Serve un nome.
core-library-name-too-long = Quel nome è troppo lungo.
core-library-folder-in-itself = Una cartella non si può mettere dentro se stessa.
# Why a file was not given to the reference chosen for it, when files are gone through.
core-library-assign-file-gone = Un file non è stato assegnato al suo riferimento: non è più fra i file della biblioteca.
core-library-assign-reference-gone = «{ $name }» non è stato assegnato al suo riferimento: il riferimento non è più nella biblioteca.
core-library-assign-stored-gone = «{ $name }» non è stato assegnato al suo riferimento: il file non è più dove la biblioteca lo tiene, { $path }.
# The record of the files could not be read; it was put aside under another name.
core-library-files-unreadable = Il registro dei file della biblioteca non si è potuto leggere, ed è stato messo da parte come { $path }: { $message }
# The library file has bytes that are not UTF-8, as an editor that saves in Latin-1 writes them; $aside is the name of the copy kept in the same folder.
core-library-not-utf8 = { $path } ha lettere che non sono in UTF-8, come le scrive un editor che salva in un'altra codifica. Sono lette come �, e così saranno scritte; il file com'era è tenuto come { $aside } nella stessa cartella.
