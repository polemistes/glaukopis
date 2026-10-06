# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } et { $second }
core-library-three-names = { $first }, { $second } et { $third }
core-library-et-al = { $first } et al.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (dir.)
    [many] { $names } (dir.)
   *[other] { $names } (dir.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = ligne { $line } : { $message }
core-library-line-sentence = Ligne { $line } : { $message }.
core-library-key-changed = la clé « { $from } » a été changée en « { $to } »
core-library-no-entry = Il n’y a pas d’entrée ici. Une entrée commence par @ et son type, comme @book{"{"}clé, …{"}"}.
core-library-many-entries = Il y a { $count } entrées ici ; une seule est attendue.

## Changing a reference.

core-library-bad-key = « { $key } » ne peut pas servir de clé de citation.
core-library-key-letters = Une clé de citation ne peut contenir que des lettres, des chiffres et - _ : . Essayez « { $key } ».
core-library-key-taken = La clé de citation « { $key } » est déjà utilisée.
core-library-no-type = La référence n’a pas de type de publication.
core-library-not-a-type = « { $kind } » n’est pas un type de publication.
core-library-merge-itself = Une entrée ne peut pas être fusionnée avec elle-même.

## What was not found, shown after "not found: ".

core-library-the-reference = la référence
core-library-the-stored-file = le fichier stocké { $path }
core-library-the-file = le fichier { $path }
core-library-the-collection = la collection
core-library-the-collection-to-put-in = la collection où la mettre
core-library-the-collection-to-move-to = la collection où la déplacer

## Collections.

core-library-collection-needs-name = Une collection doit avoir un nom.
core-library-collection-exists = Il y a déjà ici une collection nommée « { $name } ».
core-library-collection-in-itself = Une collection ne peut pas être placée en elle-même.

## The files of references.

core-library-not-in-library = « { $path } » n’est pas un chemin dans la bibliothèque
core-library-not-a-file = { $path } n’est pas un fichier
