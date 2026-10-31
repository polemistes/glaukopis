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

## The files of the library and their folders.

core-library-the-file-of-library = die Datei der Bibliothek
core-library-the-folder = der Ordner
core-library-needs-name = Ein Name ist nötig.
core-library-name-too-long = Dieser Name ist zu lang.
core-library-folder-in-itself = Ein Ordner kann nicht in sich selbst gelegt werden.
# Why a file was not given to the reference chosen for it, when files are gone through.
core-library-assign-file-gone = Eine Datei wurde ihrer Quelle nicht zugeordnet: sie ist nicht mehr unter den Dateien der Bibliothek.
core-library-assign-reference-gone = „{ $name }“ wurde seiner Quelle nicht zugeordnet: die Quelle ist nicht mehr in der Bibliothek.
core-library-assign-stored-gone = „{ $name }“ wurde seiner Quelle nicht zugeordnet: die Datei ist nicht mehr dort, wo die Bibliothek sie aufbewahrt, { $path }.
# The record of the files could not be read; it was put aside under another name.
core-library-files-unreadable = Die Liste der Dateien der Bibliothek konnte nicht gelesen werden und wurde als { $path } beiseitegelegt: { $message }
# The library file has bytes that are not UTF-8, as an editor that saves in Latin-1 writes them; $aside is the name of the copy kept in the same folder.
core-library-not-utf8 = { $path } hat Buchstaben, die nicht in UTF-8 sind, wie ein Editor sie schreibt, der in einer anderen Kodierung speichert. Sie werden als � gelesen und so geschrieben; die Datei, wie sie war, ist als { $aside } im selben Ordner aufbewahrt.

# One place for files (ADR 0070).
# A file of a kind that has no thumbnail, or one that could not be read for it; the interface shows the kind's icon instead.
core-library-no-small = von dieser Art von Datei gibt es kein Vorschaubild
# The folder the images of the old store of pictures are put in, at the top of the files of the library.
core-library-images-folder = Bilder
# An image of the old store of pictures whose file was not there when it was taken into the library.
core-library-picture-missing = „{ $name }“ wurde nicht in die Bibliothek aufgenommen: seine Datei fehlt.
# An image of the old store of pictures whose file does not hold what its name says.
core-library-picture-not-itself = „{ $name }“ wurde nicht in die Bibliothek aufgenommen: seine Datei ist nicht das Bild, das sie war.
# Bookmarks in a file (sources in tabs, 2026-10-29).
core-library-too-many-bookmarks = Eine Datei behält höchstens { $most } Lesezeichen.
core-library-bookmark-no-place = Ein Lesezeichen muss auf einer Seite der Datei liegen.
