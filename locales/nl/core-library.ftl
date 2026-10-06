# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } en { $second }
core-library-three-names = { $first }, { $second } en { $third }
core-library-et-al = { $first } e.a.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (red.)
   *[other] { $names } (red.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = regel { $line }: { $message }
core-library-line-sentence = Regel { $line }: { $message }.
core-library-key-changed = de sleutel ‘{ $from }’ is veranderd in ‘{ $to }’
core-library-no-entry = Hier staat geen item. Een item begint met @ en zijn type, zoals @book{"{"}sleutel, …{"}"}.
core-library-many-entries = Hier staan { $count } items; er wordt er één verwacht.

## Changing a reference.

core-library-bad-key = ‘{ $key }’ kan niet als citeersleutel worden gebruikt.
core-library-key-letters = Een citeersleutel mag alleen letters, cijfers en - _ : . bevatten. Probeer ‘{ $key }’.
core-library-key-taken = De citeersleutel ‘{ $key }’ is al in gebruik.
core-library-no-type = De referentie heeft geen publicatietype.
core-library-not-a-type = ‘{ $kind }’ is geen publicatietype.
core-library-merge-itself = Een item kan niet met zichzelf worden samengevoegd.

## What was not found, shown after "not found: ".

core-library-the-reference = de referentie
core-library-the-stored-file = het opgeborgen bestand { $path }
core-library-the-file = het bestand { $path }
core-library-the-collection = de verzameling
core-library-the-collection-to-put-in = de verzameling om het in te zetten
core-library-the-collection-to-move-to = de verzameling om het naartoe te verplaatsen

## Collections.

core-library-collection-needs-name = Een verzameling heeft een naam nodig.
core-library-collection-exists = Hier is al een verzameling met de naam ‘{ $name }’.
core-library-collection-in-itself = Een verzameling kan niet in zichzelf worden geplaatst.

## The files of references.

core-library-not-in-library = ‘{ $path }’ is geen pad binnen de bibliotheek
core-library-not-a-file = { $path } is geen bestand
