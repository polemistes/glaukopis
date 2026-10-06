# What the core says of the library of references, in English.
# See locales/README.md.

## The authors of a reference, as the lists show them.

core-library-two-names = { $first } i { $second }
core-library-three-names = { $first }, { $second } i { $third }
core-library-et-al = { $first } i in.
# The names of the editors, where a work has editors and no authors.
core-library-edited = { $count ->
    [one] { $names } (red.)
    [few] { $names } (red.)
    [many] { $names } (red.)
   *[other] { $names } (red.)
}

## Reading the library, and a reference as it is typed.

# A fault in the file of the library, and the line it is on.
core-library-line = wiersz { $line }: { $message }
core-library-line-sentence = Wiersz { $line }: { $message }.
core-library-key-changed = klucz „{ $from }” zmieniono na „{ $to }”
core-library-no-entry = Nie ma tu wpisu. Wpis zaczyna się od @ i typu, jak @book{"{"}klucz, …{"}"}.
core-library-many-entries = { $count ->
    [one] Jest tu { $count } wpis; oczekiwano jednego.
    [few] Są tu { $count } wpisy; oczekiwano jednego.
    [many] Jest tu { $count } wpisów; oczekiwano jednego.
   *[other] Jest tu { $count } wpisów; oczekiwano jednego.
}

## Changing a reference.

core-library-bad-key = „{ $key }” nie może być kluczem cytowania.
core-library-key-letters = Klucz cytowania może zawierać tylko litery, cyfry oraz - _ : . Spróbuj „{ $key }”.
core-library-key-taken = Klucz cytowania „{ $key }” jest już używany.
core-library-no-type = Pozycja nie ma typu publikacji.
core-library-not-a-type = „{ $kind }” nie jest typem publikacji.
core-library-merge-itself = Wpisu nie można scalić z nim samym.

## What was not found, shown after "not found: ".

core-library-the-reference = pozycja
core-library-the-stored-file = przechowywany plik { $path }
core-library-the-file = plik { $path }
core-library-the-collection = kolekcja
core-library-the-collection-to-put-in = kolekcja, do której ją włożyć
core-library-the-collection-to-move-to = kolekcja, do której ją przenieść

## Collections.

core-library-collection-needs-name = Kolekcja musi mieć nazwę.
core-library-collection-exists = Jest tu już kolekcja o nazwie „{ $name }”.
core-library-collection-in-itself = Kolekcji nie można włożyć do niej samej.

## The files of references.

core-library-not-in-library = „{ $path }” nie jest ścieżką w obrębie biblioteki
core-library-not-a-file = { $path } nie jest plikiem
