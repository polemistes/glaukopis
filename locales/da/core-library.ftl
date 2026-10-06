# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } og { $second }
core-library-three-names = { $first }, { $second } og { $third }
core-library-et-al = { $first } m.fl.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (red.)
   *[other] { $names } (red.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = linje { $line }: { $message }
core-library-line-sentence = Linje { $line }: { $message }.
core-library-key-changed = nøglen »{ $from }« blev ændret til »{ $to }«
core-library-no-entry = Der er ingen post her. En post begynder med @ og sin type, som i @book{"{"}nøgle, …{"}"}.
core-library-many-entries = { $count ->
    [one] Der er én post her; én var ventet.
   *[other] Der er { $count } poster her; én var ventet.
}

## Changing a reference.

core-library-bad-key = »{ $key }« kan ikke bruges som nøgle.
core-library-key-letters = En nøgle må kun indeholde bogstaver, cifre og - _ : . Prøv »{ $key }«.
core-library-key-taken = Nøglen »{ $key }« er allerede i brug.
core-library-no-type = Referencen har ingen publikationstype.
core-library-not-a-type = »{ $kind }« er ikke en publikationstype.
core-library-merge-itself = En post kan ikke slås sammen med sig selv.

## What was not found, shown after "not found: ".

core-library-the-reference = referencen
core-library-the-stored-file = den gemte fil { $path }
core-library-the-file = filen { $path }
core-library-the-collection = samlingen
core-library-the-collection-to-put-in = den samling, den skulle lægges i
core-library-the-collection-to-move-to = den samling, den skulle flyttes til

## Collections.

core-library-collection-needs-name = En samling skal have et navn.
core-library-collection-exists = Der findes allerede en samling her med navnet »{ $name }«.
core-library-collection-in-itself = En samling kan ikke lægges ind i sig selv.

## The files of references.

core-library-not-in-library = »{ $path }« er ikke en sti i biblioteket
core-library-not-a-file = { $path } er ikke en fil
