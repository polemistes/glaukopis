# The library: the references, the form they are written in, and what
# brings them in, in English. The fields and types of the form are in
# fields.ftl. See locales/README.md.

## The form of a reference.

library-form-often-used = Często używane
library-form-add-field = Dodaj pole
library-form-citation-key = Klucz cytowania
# In the empty field of the citation key: what it is given if nothing is written.
library-form-key-made = tworzony z autora i roku
library-form-date-problem = Datę zapisz jako 1979, 1979-05 lub 1979-05-12; zakres jako 1979/1985.
library-form-remove-field = Usuń pole { $field }

## The people of a reference, with the name of their field: “Author: family name”.

library-names-kept-whole = Instytucja lub inna nazwa w całości
library-names-prefix-suffix = Przedrostek i przyrostek
    .hint = „van”, „de la” · „Jr.”, „III”
library-names-move-up = Przesuń w górę
library-names-move-down = Przesuń w dół
library-names-more = Więcej dla tej osoby
library-names-name = Nazwa
library-names-name-of = { $role }: nazwa
library-names-family = Nazwisko
library-names-family-of = { $role }: nazwisko
library-names-given = Imiona
library-names-given-of = { $role }: imiona
library-names-prefix = Przedrostek: van, de la
library-names-prefix-of = { $role }: przedrostek
library-names-suffix = Przyrostek: Jr., III
library-names-suffix-of = { $role }: przyrostek

## Words for references, wherever they are shown.

library-untitled = Bez tytułu
library-no-author = Bez autora
library-no-title = Bez tytułu
library-in-library = W twojej bibliotece

## Why a reference is taken for another: “the same DOI and the same file”.

library-reason-doi = ten sam DOI
library-reason-isbn = ten sam ISBN
library-reason-identical = zgodne we wszystkim, co odróżnia jedno dzieło od drugiego
# How far the title, the author and the year agree: the same, like (titles
# that differ in a few letters or a subtitle, an author in common, years a
# year apart), or none (one of them says nothing of it).
library-reason-alike = { $title ->
    [same] { $author ->
        [same] { $year ->
            [same] ten sam tytuł, autor i rok
            [like] ten sam tytuł i autor, rok różny o jeden
           *[none] ten sam tytuł i autor, rok tylko przy jednym
        }
        [like] { $year ->
            [same] ten sam tytuł i rok oraz wspólny autor
            [like] ten sam tytuł, wspólny autor, rok różny o jeden
           *[none] ten sam tytuł, wspólny autor, rok tylko przy jednym
        }
       *[none] { $year ->
            [same] ten sam tytuł i rok, autor tylko przy jednym
            [like] ten sam tytuł, rok różny o jeden, autor tylko przy jednym
           *[none] ten sam tytuł, autor i rok tylko przy jednym
        }
    }
   *[like] { $author ->
        [same] { $year ->
            [same] ten sam autor i rok oraz podobny tytuł
            [like] ten sam autor, podobny tytuł, rok różny o jeden
           *[none] ten sam autor, podobny tytuł, rok tylko przy jednym
        }
        [like] { $year ->
            [same] ten sam rok, podobny tytuł, wspólny autor
            [like] podobny tytuł, wspólny autor, rok różny o jeden
           *[none] podobny tytuł, wspólny autor, rok tylko przy jednym
        }
       *[none] { $year ->
            [same] ten sam rok, podobny tytuł, autor tylko przy jednym
            [like] podobny tytuł, rok różny o jeden, autor tylko przy jednym
           *[none] podobny tytuł, autor i rok tylko przy jednym
        }
    }
}
library-reason-file = ten sam plik
# Several reasons: those before the last, set apart by commas, and the last.
library-reasons = { $others } i { $last }

## The size of a file.

library-size-bytes = { $size } B
library-size-kilobytes = { $size } kB
library-size-megabytes = { $size } MB

## What may be in the library already, while a reference is written.

library-duplicate-certain = To już jest w twojej bibliotece.
library-duplicate-probable = To może już być w twojej bibliotece.
library-duplicate-use = Użyj tej

## Duplicates in the library.

library-duplicates-title = Duplikaty
library-duplicates-count = { $count ->
    [one] { $count } pozycja zdaje się być w bibliotece więcej niż raz
    [few] { $count } pozycje zdają się być w bibliotece więcej niż raz
    [many] { $count } pozycji zdaje się być w bibliotece więcej niż raz
   *[other] { $count } pozycji zdaje się być w bibliotece więcej niż raz
}
library-duplicates-none = Brak duplikatów
    .text = Żadna pozycja nie zdaje się być w bibliotece więcej niż raz.
library-duplicates-no-more = Nie ma więcej duplikatów
    .text = Cytowania scalonych pozycji cytują teraz te, które zachowano.
library-duplicates-how = Gdy pozycje są scalane w jedną, ta, którą zachowujesz, dostaje od pozostałych to, czego jej brakuje, a tam, gdzie się różnią, zachowuje swoje. Ich pliki i kolekcje są łączone, a to, co je cytowało, cytuje zachowaną.
library-duplicates-same = Te same
library-duplicates-probably-same = Prawdopodobnie te same
library-duplicates-keep-which = Którą zachować
library-duplicates-kept = Zachowana
library-duplicates-different = Są różne
library-duplicates-merge = Scal w jedną
library-duplicates-merging = Scalanie…
library-duplicates-failed = Nie udało się przeszukać biblioteki pod kątem duplikatów
library-duplicates-merge-failed = Nie udało się ich scalić

## Importing references: what a file holds, against what the library has.

library-import = Importuj
library-import-title = Importuj pozycje
# What is imported, and from where: a file, Zotero.
library-import-subtitle = { $count ->
    [one] { $count } pozycja ({ $source })
    [few] { $count } pozycje ({ $source })
    [many] { $count } pozycji ({ $source })
   *[other] { $count } pozycji ({ $source })
}
library-import-review = { $count ->
    [one] { $count } pozycja może już być w twojej bibliotece
    [few] { $count } pozycje mogą już być w twojej bibliotece
    [many] { $count } pozycji może już być w twojej bibliotece
   *[other] { $count } pozycji może już być w twojej bibliotece
}
library-import-new = { $count ->
    [one] { $count } nowa pozycja
    [few] { $count } nowe pozycje
    [many] { $count } nowych pozycji
   *[other] { $count } nowych pozycji
}
library-import-complete = { $count ->
    [one] { $count } pozycja już w twojej bibliotece zyskuje dane
    [few] { $count } pozycje już w twojej bibliotece zyskują dane
    [many] { $count } pozycji już w twojej bibliotece zyskuje dane
   *[other] { $count } pozycji już w twojej bibliotece zyskuje dane
}
library-import-known = { $count ->
    [one] { $count } pozycja już w twojej bibliotece
    [few] { $count } pozycje już w twojej bibliotece
    [many] { $count } pozycji już w twojej bibliotece
   *[other] { $count } pozycji już w twojej bibliotece
}
library-import-repeated = { $count ->
    [one] { $count } pozycja powtórzona w imporcie
    [few] { $count } pozycje powtórzone w imporcie
    [many] { $count } pozycji powtórzonych w imporcie
   *[other] { $count } pozycji powtórzonych w imporcie
}
# The fields a reference of the library would be given: “Would gain: Publisher, Place”.
library-import-would-gain = Zyskałaby: { $fields }
library-import-gains-file = Plik
library-import-gains-zotero = Jej klucz w Zotero
library-import-what-to-do = Co zrobić
library-import-merge = To samo dzieło: uzupełnij moją
library-import-skip = To samo dzieło: zostaw moją, jak jest
library-import-add = Inne dzieło: dodaj
# One answer for every candidate in the same case: “For all 16 that are the same: …”.
library-import-all-certain = { $count ->
    [one] Dla tej { $count }, która jest ta sama:
    [few] Dla wszystkich { $count }, które są te same:
    [many] Dla wszystkich { $count }, które są te same:
   *[other] Dla wszystkich { $count }, które są te same:
}
library-import-all-probable = { $count ->
    [one] Dla tej { $count }, która prawdopodobnie jest ta sama:
    [few] Dla wszystkich { $count }, które prawdopodobnie są te same:
    [many] Dla wszystkich { $count }, które prawdopodobnie są te same:
   *[other] Dla wszystkich { $count }, które prawdopodobnie są te same:
}
library-import-all-merge = Uzupełnij moje
library-import-all-skip = Zostaw moje, jak są
library-import-all-add = Mimo to dodaj wszystkie
library-import-more = { $count ->
    [one] …i jeszcze jedna.
    [few] …i jeszcze { $count }.
    [many] …i jeszcze { $count }.
   *[other] …i jeszcze { $count }.
}
library-import-unread = { $count ->
    [one] { $count } części pliku nie udało się odczytać
    [few] { $count } części pliku nie udało się odczytać
    [many] { $count } części pliku nie udało się odczytać
   *[other] { $count } części pliku nie udało się odczytać
}
library-import-importing = Importowanie…
# How many are to be added, completed and left out: “3 to add, 1 to complete, 2 left out”.
library-import-counts = { $add } do dodania{ $merge ->
        [0] {""}
       *[other] , { $merge } do uzupełnienia
    }{ $skip ->
        [0] {""}
       *[other] , { $skip } do pominięcia
    }
library-import-failed = Import się nie powiódł.

## The library: the list of references, and what can be done with them.

library-references = Pozycje
library-unread = Nie udało się odczytać biblioteki
library-all-references = Wszystkie pozycje
library-count = { $count ->
    [one] { $count } pozycja
    [few] { $count } pozycje
    [many] { $count } pozycji
   *[other] { $count } pozycji
}
library-selected = { $count ->
    [one] { $count } pozycja zaznaczona
    [few] { $count } pozycje zaznaczone
    [many] { $count } pozycji zaznaczonych
   *[other] { $count } pozycji zaznaczonych
}
library-selected-of = { $count ->
    [one] Zaznaczono { $selected } z { $count } pozycji
    [few] Zaznaczono { $selected } z { $count } pozycji
    [many] Zaznaczono { $selected } z { $count } pozycji
   *[other] Zaznaczono { $selected } z { $count } pozycji
}
library-new-reference = Nowa pozycja
library-search = Szukaj w bibliotece
library-search-in = Szukaj w „{ $name }”
library-search-clear = Wyczyść wyszukiwanie
library-sort = Sortuj
library-sort-author = Autor
library-sort-year = Rok
library-sort-title = Tytuł
library-sort-added = Data dodania
library-sort-modified = Data zmiany
library-sort-descending = Malejąco

## The filters, beside the search: what kind of publication, who published it, and when.

library-filters = Filtruj
library-filters-on = { $count ->
    [one] Filtr: { $count } włączony
    [few] Filtr: { $count } włączone
    [many] Filtr: { $count } włączonych
   *[other] Filtr: { $count } włączonych
}
library-filter-kind = Rodzaj
library-filter-publisher = Wydawca
library-filter-publisher-hint = Część nazwy
library-filter-any-publisher = Dowolny wydawca
library-filter-year = Rok
library-filter-from = Od
library-filter-to = Do
library-filter-clear = Wyczyść filtry
library-filter-nothing-here = Nie ma tu czego filtrować.
# When the filters let nothing through.
library-nothing-passes = Żadna widoczna pozycja nie przechodzi przez filtry.
library-import-export = Import i eksport
library-import-file = Importuj plik…
    .hint = BibLaTeX lub BibTeX
library-paste = Wklej pozycje…
library-add-pdfs = Dodaj pliki PDF…
    .hint = Dla każdego pobierane są dane; plik zostaje
library-import-zotero = Importuj z Zotero…
library-find-duplicates = Znajdź duplikaty…
library-map-library = Mapa biblioteki…
library-map-collection = Mapa kolekcji „{ $name }”…
library-export-library = Eksportuj bibliotekę…
library-export-collection = Eksportuj „{ $name }”…
library-export-one = Eksportuj…
library-export-many = { $count ->
    [one] Eksportuj { $count } pozycję…
    [few] Eksportuj { $count } pozycje…
    [many] Eksportuj { $count } pozycji…
   *[other] Eksportuj { $count } pozycji…
}
library-export-title = Eksportuj pozycje
# What a file of exported references is called, before it is given a name.
library-export-file-references = pozycje
library-export-file-library = biblioteka
library-exported = { $count ->
    [one] Wyeksportowano { $count } pozycję
    [few] Wyeksportowano { $count } pozycje
    [many] Wyeksportowano { $count } pozycji
   *[other] Wyeksportowano { $count } pozycji
}
library-export-failed = Eksport się nie powiódł
library-empty = Twoja biblioteka jest pusta
    .text = Pozycje, które tu dodasz, są dostępne we wszystkich twoich projektach. Zacznij od jednej albo wczytaj te, które już masz.
library-collection-empty = W tej kolekcji nie ma jeszcze nic
    .text = Przeciągnij tu pozycje z biblioteki albo dodaj nową.
library-nothing-found = Nic nie znaleziono
    .text = Żadna pozycja nie zawiera wszystkich tych słów.
library-open-file = Otwórz plik
library-file-open-failed = Nie udało się otworzyć pliku
library-add-to-collection = Dodaj do kolekcji
library-remove-from = Usuń z „{ $name }”
library-copy-key = Kopiuj klucz cytowania
library-copied-key = Skopiowano „{ $key }”
library-copy-biblatex = Kopiuj jako BibLaTeX
library-copied = Skopiowano
library-delete-one-title = Usunąć „{ $name }”?
library-delete-many-title = { $count ->
    [one] Usunąć { $count } pozycję?
    [few] Usunąć { $count } pozycje?
    [many] Usunąć { $count } pozycji?
   *[other] Usunąć { $count } pozycji?
}
# $projects is the number of projects that cite what is deleted, which keep copies of their own.
library-delete-one = To usuwa pozycję z twojej biblioteki i z każdej kolekcji{ $files ->
        [0] {""}
        [one] , razem z { $files } załączonym plikiem
        [few] , razem z { $files } załączonymi plikami
        [many] , razem z { $files } załączonymi plikami
       *[other] , razem z { $files } załączonymi plikami
    }.{ $projects ->
        [0] {""}
        [one] {" "}Jest cytowana w jednym projekcie, który zachowuje jej kopię.
        [few] {" "}Jest cytowana w { $projects } projektach, które zachowują jej kopię.
        [many] {" "}Jest cytowana w { $projects } projektach, które zachowują jej kopię.
       *[other] {" "}Jest cytowana w { $projects } projektach, które zachowują jej kopię.
    }
library-delete-many = To usuwa je z twojej biblioteki i z każdej kolekcji{ $files ->
        [0] {""}
        [one] , razem z { $files } załączonym plikiem
        [few] , razem z { $files } załączonymi plikami
        [many] , razem z { $files } załączonymi plikami
       *[other] , razem z { $files } załączonymi plikami
    }.{ $projects ->
        [0] {""}
        [one] {" "}Projekt, który cytuje niektóre z nich, zachowuje ich kopię.
        [few] {" "}{ $projects } projekty, które cytują niektóre z nich, zachowują ich kopię.
        [many] {" "}{ $projects } projektów, które cytują niektóre z nich, zachowuje ich kopię.
       *[other] {" "}{ $projects } projektów, które cytują niektóre z nich, zachowuje ich kopię.
    }
library-delete-failed = Nie udało się usunąć pozycji
library-not-done = Nie udało się tego zrobić

## Collections.

library-collections = Kolekcje
# The projects that cite a work, in its pane.
library-cited-in = Cytowana w
library-not-cited = Niecytowana w żadnym projekcie.
library-cited-reading = Czytanie projektów…
library-collections-hint = Kolekcje zbierają pozycje do jakiegoś tematu lub pracy. Pozycja może być w dowolnie wielu.
library-collection-new = Nowa kolekcja
library-collection-new-inside = Nowa kolekcja w środku
library-collection-new-under = Nowa kolekcja w „{ $name }”
library-collection-move-to = Przenieś do
library-collection-name = Nazwa kolekcji
library-collection-name-failed = Nie udało się nazwać kolekcji
library-collection-expand = Rozwiń
library-collection-collapse = Zwiń
library-collection-to-top = Przenieś na najwyższy poziom
library-collection-move-failed = Nie udało się przenieść kolekcji
library-collection-added = { $count ->
    [one] { $count } pozycję dodano do „{ $name }”
    [few] { $count } pozycje dodano do „{ $name }”
    [many] { $count } pozycji dodano do „{ $name }”
   *[other] { $count } pozycji dodano do „{ $name }”
}
library-collection-already = Już w „{ $name }”
library-collection-delete = Usuń kolekcję
library-collection-delete-title = Usunąć kolekcję „{ $name }”?
# The number is that of the collections inside the one that is deleted.
library-collection-delete-message = { $inside ->
    [0] Pozycje zostają w twojej bibliotece.
   *[other] Kolekcje w jej środku też zostaną usunięte. Pozycje zostają w twojej bibliotece.
}
library-collection-delete-failed = Nie udało się usunąć kolekcji
library-collection-count = { $count ->
    [one] { $count } kolekcja
    [few] { $count } kolekcje
    [many] { $count } kolekcji
   *[other] { $count } kolekcji
}

## A map of the library, or of a collection: a new project.

library-map-title-library = Mapa biblioteki
library-map-title-collection = Mapa kolekcji
# The name a project made of the whole library is given.
library-map-library-name = Biblioteka
library-map-name = Nazwa
library-map-name-hint = Nazwa projektu, jego mapy i elementu w środku mapy.
library-map-what-library = Kolekcje stają się elementami, zagnieżdżonymi tak, jak są, a każda pozycja elementem pod swoją kolekcją, z cytowaniem jej jako tekstem. Pozycje spoza kolekcji stoją przy środku.
library-map-what-collection = Kolekcje w jej obrębie stają się elementami, zagnieżdżonymi tak, jak są, a każda pozycja elementem pod swoją kolekcją, z cytowaniem jej jako tekstem.
library-map-nothing = Nie ma pozycji, które można by umieścić na mapie.
library-map-make = Utwórz projekt
library-map-making = Tworzenie projektu…
library-map-failed = Nie udało się utworzyć projektu.

## Bringing references in, from anywhere in the application.

library-files = { $count ->
    [one] { $count } plik
    [few] { $count } pliki
    [many] { $count } plików
   *[other] { $count } plików
}
library-open-failed = Nie udało się otworzyć pozycji
library-known = { $count ->
    [one] Jest już w twojej bibliotece
    [few] Są już w twojej bibliotece
    [many] Są już w twojej bibliotece
   *[other] Są już w twojej bibliotece
}
library-nothing-to-import = Nie ma czego importować
library-none-found = Nie znaleziono żadnych pozycji.
library-import-kinds = Pozycje czyta się z plików .bib i tworzy z plików PDF.
library-filter-bib = BibLaTeX i BibTeX
library-filter-all = Wszystkie pliki
library-files-read-failed = { $count ->
    [one] Nie udało się odczytać pliku
    [few] Nie udało się odczytać plików
    [many] Nie udało się odczytać plików
   *[other] Nie udało się odczytać plików
}
library-text-read-failed = Nie udało się odczytać tekstu
library-add-pdfs-title = Dodaj pliki PDF
library-pdfs-working = { $count ->
    [one] Ustalanie, czym jest plik…
    [few] Ustalanie, czym są { $count } pliki…
    [many] Ustalanie, czym jest { $count } plików…
   *[other] Ustalanie, czym jest { $count } plików…
}
# While PDF files are found out about, one after another.
library-pdfs-progress = { $done } z { $count }: { $name }
library-stop = Zatrzymaj
# What came of an import, as a list: “3 references added, 1 completed, 2 files stored”.
library-imported-added = { $count ->
    [one] dodano { $count } pozycję
    [few] dodano { $count } pozycje
    [many] dodano { $count } pozycji
   *[other] dodano { $count } pozycji
}
library-imported-completed = uzupełniono { $count }
library-imported-skipped = { $count } już w bibliotece
library-imported-files = { $count ->
    [one] zachowano { $count } plik
    [few] zachowano { $count } pliki
    [many] zachowano { $count } plików
   *[other] zachowano { $count } plików
}
library-imported-nothing = Niczego nie zmieniono
library-paste-title = Wklej pozycje
library-paste-subtitle = BibLaTeX lub BibTeX, dowolnie wiele wpisów
library-paste-continue = Dalej
library-source-label = Źródło BibLaTeX

## Importing from Zotero.

library-zotero-title = Importuj z Zotero
# The file is the database of Zotero, zotero.sqlite, shown as code.
library-zotero-not-found = Na tym komputerze nie znaleziono Zotero w miejscach, gdzie zwykle trzyma swoje dane. Jeśli trzyma je gdzie indziej, wskaż gdzie: folder, w którym jest { $file }.
library-zotero-lead = To, co importowane, jest kopiowane do twojej biblioteki razem z plikami. Zotero jest tylko czytane i nic w nim nie jest zmieniane; może być w tym czasie uruchomione.
library-zotero-choose = Folder danych Zotero
library-zotero-none-there = Tam nie ma Zotero.
library-zotero-unread = Nie udało się odczytać Zotero.
library-zotero-library = Biblioteka
# A library of Zotero, with the number of its references.
library-zotero-library-option = { $name } ({ $count })
library-zotero-my-library = Moja biblioteka
library-zotero-what = Co importować
library-zotero-everything = Wszystko
library-zotero-with-files = Z załączonymi plikami
library-zotero-with-notes = Z notatkami, jako adnotacjami
library-zotero-elsewhere = Inne miejsce…
library-zotero-show-where = Wskaż gdzie…
library-zotero-reading = Czytanie…
library-zotero-read = { $count ->
    [0] Odczytano
    [one] Odczytano { $count } pozycję
    [few] Odczytano { $count } pozycje
    [many] Odczytano { $count } pozycji
   *[other] Odczytano { $count } pozycji
}

## Writing a reference.

library-dialog-edit = Edytuj pozycję
library-dialog-add = Dodaj pozycję
library-dialog-back = Wróć do formularza
library-dialog-open-failed = Nie udało się otworzyć pozycji.
library-dialog-save-failed = Nie udało się zapisać pozycji.
# The entry as BibLaTeX, as against the form.
library-source = Źródło
library-source-unread = Nie udało się odczytać źródła.

## A reference, beside the list.

library-pane-label = Pozycja
library-pane-more = Więcej
library-pane-saved = Zapisano
library-pane-editing = Edycja…
library-pane-not-saved = Niezapisane
library-pane-unread = Nie udało się odczytać pozycji.
library-pane-save-failed = Nie udało się zapisać zmian.
library-pane-note-placeholder = Co o tym sądzisz. Dla siebie: to nie jest część tego, co cytowane.
library-pane-files = Pliki
library-pane-attach = Załącz
library-pane-attach-title = Załącz pliki
library-pane-attach-failed = Nie udało się załączyć pliku
# Of a file that is attached, and not where it should be.
library-pane-missing = brak
library-pane-reveal = Pokaż w menedżerze plików
library-pane-reveal-failed = Nie udało się otworzyć folderu
library-pane-no-files = Brak plików. Załącz PDF albo upuść go tutaj.
library-pane-detach = Usuń plik
library-pane-detach-title = Usunąć „{ $name }”?
library-pane-detach-message = Plik jest usuwany ze zbioru biblioteki, chyba że używa go inna pozycja.
library-pane-detach-failed = Nie udało się usunąć pliku
library-pane-leave-collection = Usuń z { $name }
library-pane-duplicate = Powiel
    .hint = Nowa pozycja zaczynająca się od tych danych
library-pane-edit-source = Edytuj źródło…
library-pane-source-subtitle = Wpis jako BibLaTeX. Większość rzeczy łatwiej zrobić w formularzu.
library-pane-source-failed = Nie udało się pokazać źródła
library-pane-added = Dodano { $date }
library-pane-added-changed = Dodano { $added } · zmieniono { $changed }

## Looking up a reference.

library-lookup-placeholder = Pobierz dane: DOI, ISBN albo słowa z tytułu i nazwisko autora
library-lookup-label = Pobierz dane pozycji
library-lookup-failed = Niczego nie udało się pobrać.
# Where the reference came from: a service such as Crossref.
library-lookup-filled = Wypełniono z { $source }.
library-lookup-others = { $count ->
    [one] { $count } inny rekord
    [few] { $count } inne rekordy
    [many] { $count } innych rekordów
   *[other] { $count } innych rekordów
}
library-lookup-scope = Czego szukać
library-lookup-any = Czegokolwiek
library-lookup-books = Książek
library-lookup-articles = Artykułów
library-lookup-none = Nic nie znaleziono. Mniej słów może znaleźć więcej: nazwisko autora i słowo lub dwa z tytułu.
# What was asked for: a DOI, an ISBN, a number of arXiv or of PubMed.
library-lookup-unknown = Tam, gdzie pytano, nic nie wiadomo o tym { $kind ->
        [doi] DOI
        [isbn] ISBN
        [arxiv] numerze arXiv
       *[pmid] numerze PubMed
    }. Pozycję można wpisać ręcznie poniżej.

## What the writer writes about a work.

library-notes = Notatki
library-notes-yours = Twoje notatki
library-notes-on-work = Twoje notatki o tym dziele
library-notes-read = Przeczytaj swoje notatki
library-notes-write = Napisz notatkę
library-notes-write-on-work = Napisz notatkę o tym dziele
library-notes-not-in-library = Pozycja, której nie ma w twojej bibliotece
library-notes-this-project = W tym projekcie
library-notes-all-projects = We wszystkich projektach
library-notes-project-placeholder = Co o tym sądzisz, na potrzeby tej pracy
library-notes-all-placeholder = Co o tym sądzisz, gdziekolwiek to cytujesz
library-notes-keep-for-all = Zachowaj dla wszystkich projektów
library-notes-write-for-all = Napisz dla wszystkich projektów
library-notes-carried = Pozycja przyszła z projektem i nie ma jej w twojej bibliotece. To, co tu napisano, ma każdy, kto ma projekt.
library-notes-kept = Zachowane z pozycją w twojej bibliotece. Idzie z projektem, który cytuje dzieło.
library-notes-unread = Nie udało się odczytać twoich notatek
library-notes-unsaved = Nie udało się zachować twojej notatki
