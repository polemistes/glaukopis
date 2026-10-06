# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } und { $second }
core-library-three-names = { $first }, { $second } und { $third }
core-library-et-al = { $first } et al.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (Hrsg.)
   *[other] { $names } (Hrsg.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = Zeile { $line }: { $message }
core-library-line-sentence = Zeile { $line }: { $message }.
core-library-key-changed = der Schlüssel „{ $from }“ wurde zu „{ $to }“ geändert
core-library-no-entry = Hier ist kein Eintrag. Ein Eintrag beginnt mit @ und seinem Typ, wie @book{"{"}key, …{"}"}.
core-library-many-entries = Hier sind { $count } Einträge; einer wird erwartet.

## Changing a reference.

core-library-bad-key = „{ $key }“ kann nicht als Zitierschlüssel verwendet werden.
core-library-key-letters = Ein Zitierschlüssel darf nur Buchstaben, Ziffern und - _ : . enthalten. Versuchen Sie „{ $key }“.
core-library-key-taken = Der Zitierschlüssel „{ $key }“ wird schon verwendet.
core-library-no-type = Die Quelle hat keinen Publikationstyp.
core-library-not-a-type = „{ $kind }“ ist kein Publikationstyp.
core-library-merge-itself = Ein Eintrag kann nicht mit sich selbst zusammengeführt werden.

## What was not found, shown after "not found: ".

core-library-the-reference = die Quelle
core-library-the-stored-file = die abgelegte Datei { $path }
core-library-the-file = die Datei { $path }
core-library-the-collection = die Sammlung
core-library-the-collection-to-put-in = die Sammlung, in die es soll
core-library-the-collection-to-move-to = die Sammlung, in die es verschoben werden soll

## Collections.

core-library-collection-needs-name = Eine Sammlung braucht einen Namen.
core-library-collection-exists = Hier gibt es schon eine Sammlung namens „{ $name }“.
core-library-collection-in-itself = Eine Sammlung kann nicht in sich selbst gelegt werden.

## The files of references.

core-library-not-in-library = „{ $path }“ ist kein Pfad innerhalb der Bibliothek
core-library-not-a-file = { $path } ist keine Datei
