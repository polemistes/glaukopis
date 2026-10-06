# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } și { $second }
core-library-three-names = { $first }, { $second } și { $third }
core-library-et-al = { $first } et al.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (ed.)
    [few] { $names } (eds.)
   *[other] { $names } (eds.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = rândul { $line }: { $message }
core-library-line-sentence = Rândul { $line }: { $message }.
core-library-key-changed = cheia „{ $from }” a fost schimbată în „{ $to }”
core-library-no-entry = Nu este nicio intrare aici. O intrare începe cu @ și tipul ei, ca în @book{"{"}cheie, …{"}"}.
core-library-many-entries = { $count ->
    [one] Este o intrare aici; se aștepta una.
    [few] Sunt { $count } intrări aici; se aștepta una.
   *[other] Sunt { $count } de intrări aici; se aștepta una.
}

## Changing a reference.

core-library-bad-key = „{ $key }” nu poate fi folosit drept cheie de citare.
core-library-key-letters = O cheie de citare poate avea numai litere, cifre și - _ : . Încercați „{ $key }”.
core-library-key-taken = Cheia de citare „{ $key }” este deja folosită.
core-library-no-type = Referința nu are tip de publicație.
core-library-not-a-type = „{ $kind }” nu este un tip de publicație.
core-library-merge-itself = O intrare nu poate fi unită cu ea însăși.

## What was not found, shown after "not found: ".

core-library-the-reference = referința
core-library-the-stored-file = fișierul păstrat { $path }
core-library-the-file = fișierul { $path }
core-library-the-collection = colecția
core-library-the-collection-to-put-in = colecția în care să fie pusă
core-library-the-collection-to-move-to = colecția în care să fie mutată

## Collections.

core-library-collection-needs-name = O colecție are nevoie de un nume.
core-library-collection-exists = Există deja aici o colecție numită „{ $name }”.
core-library-collection-in-itself = O colecție nu poate fi pusă înăuntrul ei însăși.

## The files of references.

core-library-not-in-library = „{ $path }” nu este o cale din bibliotecă
core-library-not-a-file = { $path } nu este un fișier
